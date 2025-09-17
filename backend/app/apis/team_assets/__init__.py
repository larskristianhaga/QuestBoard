
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from openai import OpenAI
import databutton as db
import asyncpg
from datetime import datetime, timedelta
import base64
import io
import uuid
import re
from app.auth import AuthorizedUser

router = APIRouter()

# Initialize OpenAI client
openai_client = OpenAI(api_key=db.secrets.get("OPENAI_API_KEY"))

# Pydantic models
class AssetConfig(BaseModel):
    label: str = Field(..., description="Team name/label")
    motif: str = Field(..., description="Design motif (comet, nebula, raptor, phoenix)")
    preset: str = Field(..., description="Style preset (retro-cockpit, neon-vapor, pixel-quest, hard-sci)")
    palette: List[str] = Field(..., description="Color palette as hex codes")

class GenerateAssetsRequest(BaseModel):
    config: AssetConfig
    preview_only: bool = Field(default=True, description="Generate low-res preview first")

class BatchGenerateRequest(BaseModel):
    team_a_config: AssetConfig
    team_b_config: AssetConfig
    preview_only: bool = Field(default=True)

class AssetUrls(BaseModel):
    emblem_url: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None

class TeamAssetResponse(BaseModel):
    id: int
    competition_id: int
    team_name: str
    assets: AssetUrls
    config: Dict[str, Any]
    version: int
    is_locked: bool
    created_at: datetime

class GenerateAssetsResponse(BaseModel):
    success: bool
    assets: AssetUrls
    version: int
    credits_used: int
    message: str

# Rate limiting configuration
RATE_LIMITS = {
    "per_team_per_10s": 1,
    "per_admin_per_hour": 20,
    "daily_credit_max": 100
}

async def get_db_connection():
    """Get database connection"""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)

def moderate_input(text: str) -> bool:
    """Content moderation for input text"""
    forbidden = ["nsfw", "inappropriate", "offensive", "explicit", "adult", "sexual"]
    text_lower = text.lower()
    return not any(word in text_lower for word in forbidden)

def sanitize_team_name(name: str) -> str:
    """Sanitize team name for safe usage"""
    # Remove special characters, keep alphanumeric, spaces, hyphens, underscores
    return re.sub(r'[^a-zA-Z0-9\s\-_]', '', name).strip()

async def check_rate_limit(identifier: str, limit_type: str) -> bool:
    """Check if rate limit is exceeded"""
    conn = await get_db_connection()
    try:
        now = datetime.utcnow()
        
        if limit_type == "per_team_per_10s":
            window_start = now - timedelta(seconds=10)
            max_requests = RATE_LIMITS["per_team_per_10s"]
        elif limit_type == "per_admin_per_hour":
            window_start = now - timedelta(hours=1)
            max_requests = RATE_LIMITS["per_admin_per_hour"]
        else:
            return False
        
        # Count requests in the time window
        count = await conn.fetchval("""
            SELECT COUNT(*) FROM team_asset_rate_limits 
            WHERE identifier = $1 AND limit_type = $2 AND window_start > $3
        """, identifier, limit_type, window_start)
        
        if count >= max_requests:
            return False
        
        # Record this request
        await conn.execute("""
            INSERT INTO team_asset_rate_limits (identifier, limit_type, window_start)
            VALUES ($1, $2, $3)
        """, identifier, limit_type, now)
        
        return True
    finally:
        await conn.close()

def build_prompts(config: AssetConfig) -> tuple[str, str]:
    """Build AI prompts for asset generation"""
    palette_str = ", ".join(config.palette)
    
    prompt = f"""{config.label} team emblem, {config.motif} motif, {config.preset} style,
    clean vector-like shapes, bold outlines, metallic retro cockpit UI accents,
    colorway {palette_str}, high-contrast, centered composition, 3/4 tilt,
    transparent background, game-ready icon, no text, no watermark, professional esports logo"""
    
    negative = "text, letters, watermark, frame, blurry, low-res, nsfw, inappropriate"
    return prompt, negative

def generate_fallback_emblem(team_name: str, color: str) -> str:
    """Generate fallback SVG emblem if OpenAI fails"""
    initial = team_name[0].upper() if team_name else "T"
    return f"""<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <circle cx="256" cy="256" r="200" fill="{color}" stroke="#ffffff" stroke-width="8"/>
        <text x="256" y="280" font-family="Arial, sans-serif" font-size="180" font-weight="bold" 
              text-anchor="middle" fill="#ffffff">{initial}</text>
    </svg>"""

async def generate_ai_assets(config: AssetConfig, preview_only: bool = True) -> AssetUrls:
    """Generate AI assets using OpenAI DALL-E"""
    try:
        prompt, negative = build_prompts(config)
        
        # Generate emblem (512x512)
        emblem_response = openai_client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",  # DALL-E 3 requirement, we'll resize
            quality="standard" if preview_only else "hd",
            n=1
        )
        
        emblem_url = emblem_response.data[0].url
        
        # For now, we'll use the emblem for all assets and resize appropriately
        # In a full implementation, you'd generate specific assets for each type
        avatar_url = emblem_url  # Would be resized to 256x256
        banner_url = emblem_url  # Would be processed into banner format
        
        return AssetUrls(
            emblem_url=emblem_url,
            avatar_url=avatar_url,
            banner_url=banner_url
        )
        
    except Exception as e:
        print(f"OpenAI generation failed: {e}")
        # Fallback to SVG
        fallback_color = config.palette[0] if config.palette else "#3B82F6"
        fallback_svg = generate_fallback_emblem(config.label, fallback_color)
        # In production, you'd save this SVG and return a proper URL
        return AssetUrls(
            emblem_url="data:image/svg+xml;base64," + base64.b64encode(fallback_svg.encode()).decode(),
            avatar_url="data:image/svg+xml;base64," + base64.b64encode(fallback_svg.encode()).decode(),
            banner_url="data:image/svg+xml;base64," + base64.b64encode(fallback_svg.encode()).decode()
        )

@router.post("/{competition_id}/teams/{team_name}/assets/generate")
async def generate_assets(
    competition_id: int, 
    team_name: str, 
    body: GenerateAssetsRequest,
    user: AuthorizedUser
) -> GenerateAssetsResponse:
    """Generate AI assets for a specific team"""
    
    # Sanitize and validate inputs
    team_name = sanitize_team_name(team_name)
    if not team_name:
        raise HTTPException(status_code=400, detail="Invalid team name")
    
    if not moderate_input(body.config.label) or not moderate_input(body.config.motif):
        raise HTTPException(status_code=400, detail="Content moderation failed")
    
    # Check rate limits
    team_identifier = f"team_{competition_id}_{team_name}"
    admin_identifier = f"admin_{user.sub}"
    
    if not await check_rate_limit(team_identifier, "per_team_per_10s"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded for team")
    
    if not await check_rate_limit(admin_identifier, "per_admin_per_hour"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded for admin")
    
    try:
        # Generate AI assets
        assets = await generate_ai_assets(body.config, body.preview_only)
        
        # Store in database if not preview
        new_version = 0
        if not body.preview_only:
            conn = await get_db_connection()
            try:
                # Get current version and increment
                current_version = await conn.fetchval("""
                    SELECT COALESCE(MAX(version), 0) FROM team_assets 
                    WHERE competition_id = $1 AND team_name = $2
                """, competition_id, team_name)
                
                new_version = current_version + 1
                
                # Insert new asset record
                await conn.execute("""
                    INSERT INTO team_assets (
                        competition_id, team_name, emblem_url, avatar_url, banner_url, 
                        config, version, is_locked
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, competition_id, team_name, assets.emblem_url, assets.avatar_url, 
                    assets.banner_url, body.config.dict(), new_version, False)
                
            finally:
                await conn.close()
        
        credits_used = 1 if not body.preview_only else 0
        message = "Assets generated successfully" if not body.preview_only else "Preview generated"
        
        return GenerateAssetsResponse(
            success=True,
            assets=assets,
            version=new_version,
            credits_used=credits_used,
            message=message
        )
        
    except Exception as e:
        print(f"Asset generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate assets")

@router.post("/{competition_id}/teams/batch-generate")
async def batch_generate_assets(
    competition_id: int,
    body: BatchGenerateRequest,
    user: AuthorizedUser
) -> Dict[str, GenerateAssetsResponse]:
    """Generate assets for both teams simultaneously"""
    
    # Generate for Team A
    team_a_request = GenerateAssetsRequest(config=body.team_a_config, preview_only=body.preview_only)
    team_a_result = await generate_assets(competition_id, "Team Alpha", team_a_request, user)
    
    # Generate for Team B  
    team_b_request = GenerateAssetsRequest(config=body.team_b_config, preview_only=body.preview_only)
    team_b_result = await generate_assets(competition_id, "Team Beta", team_b_request, user)
    
    return {
        "team_a": team_a_result,
        "team_b": team_b_result
    }

@router.get("/{competition_id}/teams/{team_name}/assets")
async def get_team_assets(competition_id: int, team_name: str) -> List[TeamAssetResponse]:
    """Get all asset versions for a team"""
    team_name = sanitize_team_name(team_name)
    
    conn = await get_db_connection()
    try:
        rows = await conn.fetch("""
            SELECT id, competition_id, team_name, emblem_url, avatar_url, banner_url,
                   config, version, is_locked, created_at
            FROM team_assets 
            WHERE competition_id = $1 AND team_name = $2
            ORDER BY version DESC
        """, competition_id, team_name)
        
        results = []
        for row in rows:
            assets = AssetUrls(
                emblem_url=row['emblem_url'],
                avatar_url=row['avatar_url'], 
                banner_url=row['banner_url']
            )
            
            results.append(TeamAssetResponse(
                id=row['id'],
                competition_id=row['competition_id'],
                team_name=row['team_name'],
                assets=assets,
                config=row['config'],
                version=row['version'],
                is_locked=row['is_locked'],
                created_at=row['created_at']
            ))
        
        return results
    finally:
        await conn.close()

@router.post("/{competition_id}/teams/{team_name}/assets/{action}")
async def manage_assets(
    competition_id: int, 
    team_name: str, 
    action: str,
    user: AuthorizedUser,
    version: Optional[int] = None
) -> Dict[str, Any]:
    """Manage team assets (lock, unlock, set_active)"""
    
    team_name = sanitize_team_name(team_name)
    
    if action not in ["lock", "unlock", "set_active"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    conn = await get_db_connection()
    try:
        if action == "lock":
            await conn.execute("""
                UPDATE team_assets SET is_locked = true 
                WHERE competition_id = $1 AND team_name = $2 AND version = $3
            """, competition_id, team_name, version)
            
        elif action == "unlock":
            await conn.execute("""
                UPDATE team_assets SET is_locked = false 
                WHERE competition_id = $1 AND team_name = $2 AND version = $3
            """, competition_id, team_name, version)
            
        elif action == "set_active":
            # This would update the competition's theme to use these assets
            # Implementation depends on how theme assets are referenced
            pass
        
        return {"success": True, "action": action, "version": version}
        
    except Exception as e:
        print(f"Asset management error: {e}")
        raise HTTPException(status_code=500, detail="Failed to manage assets")
    finally:
        await conn.close()
