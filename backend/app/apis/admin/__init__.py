import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import asyncpg
import databutton as db
from datetime import datetime, timedelta, date
from app.auth import AuthorizedUser
import uuid
from app.libs.challenges import ensure_participants_for_challenge
from app.libs.challenges import recalc_challenge_progress

# Force reload to clear cached statement plans after schema change
router = APIRouter(prefix="/admin")

# Admin user list - expand this later
ADMIN_EMAILS = [
    "gard@embeddedsolutions.no",
    "admin@questboard.com",
    # Add more admin emails as needed
]

# Admin user IDs (using user.sub) - expand this later
ADMIN_USER_IDS = [
    "test-user-id",  # Test user for development
    "fixed-user-sub",  # Current test user
    "admin-user-id",  # Admin test user
    "google-authenticated-user",  # Google authenticated user
    "4cfb18f7-fc28-45bf-946d-c80ffc30007f",  # Actual user ID
    "8c9ed232-914b-5c18-bd94-9af752e48a75",  # Current actual user ID from player selection
    # Add more admin user IDs as needed
]

# The 12 fixed players
FIXED_PLAYERS = [
    "RIKKE", "SIGGEN", "GARD", "THEA", "ITHY", "EMILIE", 
    "SCHOLZ", "HEFF", "KAREN", "TOBIAS", "ANDREAS", "SONDRE"
]

# Models
class IsAdminResponse(BaseModel):
    is_admin: bool
    user_id: str

class QuarterResponse(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date
    created_at: str
    is_active: bool

class CreateQuarterRequest(BaseModel):
    name: str
    start_date: date
    end_date: date

class PlayerGoalResponse(BaseModel):
    player_name: str
    quarter_id: int
    quarter_name: str
    goal_books: int
    goal_opps: int
    goal_deals: int
    goal_points: int
    current_books: int
    current_opps: int
    current_deals: int
    current_points: int

class UpdatePlayerGoalsRequest(BaseModel):
    quarter_id: int
    player_name: str
    goal_books: int
    goal_opps: int
    goal_deals: int

class TeamGoalsResponse(BaseModel):
    quarter_id: int
    quarter_name: str
    total_goal_books: int
    total_goal_opps: int
    total_goal_deals: int
    total_goal_points: int

class ActivityLogResponse(BaseModel):
    id: int
    player_name: str
    quarter_name: str
    activity_type: str
    points: int
    created_at: str
    challenge_id: Optional[int] = None  # For bonus challenges
    challenge_title: Optional[str] = None  # For bonus challenges

class UpdateQuarterStatusRequest(BaseModel):
    quarter_id: int
    is_active: bool

# Helper function to check admin status
def check_admin_access(user: AuthorizedUser):
    # Use user.sub for admin check - simpler and more reliable
    user_id = user.sub
    if not user_id or user_id not in ADMIN_USER_IDS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user_id

@router.get("/is-admin")
async def is_admin(user: AuthorizedUser) -> IsAdminResponse:
    """Check if current user has admin access"""
    user_id = user.sub
    is_admin_user = user_id in ADMIN_USER_IDS
    
    return IsAdminResponse(
        is_admin=is_admin_user,
        user_id=user_id
    )

@router.get("/quarters")
async def get_quarters(user: AuthorizedUser) -> List[QuarterResponse]:
    """Get all quarters for admin management"""
    check_admin_access(user)
    
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        rows = await conn.fetch("""
            SELECT id, name, start_date, end_date, created_at, is_active
            FROM quarters
            ORDER BY start_date DESC
        """)
        
        quarters = []
        for row in rows:
            quarters.append(QuarterResponse(
                id=row['id'],
                name=row['name'],
                start_date=row['start_date'],
                end_date=row['end_date'],
                created_at=row['created_at'].isoformat(),
                is_active=row['is_active']
            ))
        
        return quarters
    finally:
        await conn.close()

@router.post("/quarters")
async def create_quarter(request: CreateQuarterRequest, user: AuthorizedUser) -> QuarterResponse:
    """Create a new quarter"""
    check_admin_access(user)
    
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        # Check if quarter name already exists
        existing = await conn.fetchval(
            "SELECT id FROM quarters WHERE name = $1",
            request.name
        )
        if existing:
            raise HTTPException(status_code=400, detail=f"Quarter '{request.name}' already exists")
        
        # Create new quarter
        row = await conn.fetchrow("""
            INSERT INTO quarters (name, start_date, end_date)
            VALUES ($1, $2, $3)
            RETURNING id, name, start_date, end_date, created_at
        """, request.name, request.start_date, request.end_date)
        
        return QuarterResponse(
            id=row['id'],
            name=row['name'],
            start_date=row['start_date'],
            end_date=row['end_date'],
            created_at=row['created_at'].isoformat()
        )
    finally:
        await conn.close()

@router.delete("/quarters/{quarter_id}")
async def delete_quarter(quarter_id: int, user: AuthorizedUser):
    """Delete a quarter and all associated data"""
    check_admin_access(user)
    
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        # Check if quarter exists
        quarter = await conn.fetchval(
            "SELECT name FROM quarters WHERE id = $1",
            quarter_id
        )
        if not quarter:
            raise HTTPException(status_code=404, detail="Quarter not found")
        
        # Delete quarter (cascades to profiles and activities)
        await conn.execute(
            "DELETE FROM quarters WHERE id = $1",
            quarter_id
        )
        
        return {"message": f"Quarter '{quarter}' deleted successfully"}
    finally:
        await conn.close()

@router.get("/activities")
async def get_activity_logs(
    user: AuthorizedUser,
    quarter_id: Optional[int] = None,
    activity_type: Optional[str] = None,
    player_name: Optional[str] = None,
    limit: int = 100
) -> List[ActivityLogResponse]:
    """Get activity logs with filtering for admin - includes both regular activities and bonus challenge completions"""
    check_admin_access(user)
    
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        # Build dynamic query with UNION to include both activities and bonus challenges
        
        # Regular activities query
        activities_query_parts = ["""
            SELECT 
                a.id, 
                p.name as player_name, 
                q.name as quarter_name, 
                a.type::text as activity_type, 
                a.points, 
                a.created_at,
                NULL::int as challenge_id,
                NULL::text as challenge_title,
                'activity' as source_type
            FROM activities a
            JOIN profiles p ON a.profile_id = p.id
            JOIN quarters q ON a.quarter_id = q.id
            WHERE 1=1
        """]
        
        # Bonus challenges query
        challenges_query_parts = ["""
            SELECT 
                c.id, 
                c.completed_by as player_name, 
                q.name as quarter_name, 
                'bonus_challenge'::text as activity_type, 
                c.reward_points as points, 
                c.completed_at as created_at,
                c.id as challenge_id,
                c.title as challenge_title,
                'challenge' as source_type
            FROM challenges c
            JOIN quarters q ON c.quarter_id = q.id
            WHERE c.status = 'completed' AND c.completed_by IS NOT NULL
        """]
        
        params = []
        param_count = 0
        
        # Apply filters to both queries
        if quarter_id:
            param_count += 1
            activities_query_parts.append(f" AND a.quarter_id = ${param_count}")
            challenges_query_parts.append(f" AND c.quarter_id = ${param_count}")
            params.append(quarter_id)
        
        if activity_type:
            param_count += 1
            if activity_type == 'bonus_challenge':
                # Only show bonus challenges
                activities_query_parts = ["SELECT NULL::int as id, NULL::text as player_name, NULL::text as quarter_name, NULL::text as activity_type, NULL::int as points, NULL::timestamp as created_at, NULL::int as challenge_id, NULL::text as challenge_title, NULL::text as source_type WHERE false"]
            else:
                # Show only regular activities of this type
                activities_query_parts.append(f" AND a.type = ${param_count}")
                challenges_query_parts = ["SELECT NULL::int as id, NULL::text as player_name, NULL::text as quarter_name, NULL::text as activity_type, NULL::int as points, NULL::timestamp as created_at, NULL::int as challenge_id, NULL::text as challenge_title, NULL::text as source_type WHERE false"]
            params.append(activity_type)
        
        if player_name:
            param_count += 1
            activities_query_parts.append(f" AND p.name ILIKE ${param_count}")
            challenges_query_parts.append(f" AND c.completed_by ILIKE ${param_count}")
            params.append(f"%{player_name}%")
        
        # Combine queries with UNION and order by created_at
        activities_query = "".join(activities_query_parts)
        challenges_query = "".join(challenges_query_parts)
        
        combined_query = f"""
            ({activities_query})
            UNION ALL
            ({challenges_query})
            ORDER BY created_at DESC
            LIMIT ${param_count + 1}
        """
        
        params.append(limit)
        
        rows = await conn.fetch(combined_query, *params)
        
        activities = []
        for row in rows:
            if row['id'] is not None:  # Filter out NULL placeholders
                activities.append(ActivityLogResponse(
                    id=row['id'],
                    player_name=row['player_name'],
                    quarter_name=row['quarter_name'],
                    activity_type=row['activity_type'],
                    points=row['points'],
                    created_at=row['created_at'].isoformat(),
                    challenge_id=row['challenge_id'],
                    challenge_title=row['challenge_title']
                ))
        
        return activities
    finally:
        await conn.close()

# Helper function to calculate goal points
def calculate_goal_points(books: int, opps: int, deals: int) -> int:
    """Calculate goal points: books=1pt, opps=2pts, deals=5pts"""
    return books * 1 + opps * 2 + deals * 5

# Helper function to ensure all player profiles exist for a quarter
async def ensure_player_profiles(quarter_id: int, conn):
    """Ensure all 12 fixed players have profiles for the given quarter"""
    for player_name in FIXED_PLAYERS:
        # Generate a consistent UUID for the player 
        player_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"player.{player_name.lower()}"))
        
        # Check if profile already exists
        existing = await conn.fetchval(
            "SELECT id FROM profiles WHERE name = $1 AND quarter_id = $2",
            player_name, quarter_id
        )
        
        if not existing:
            await conn.execute("""
                INSERT INTO profiles (user_id, quarter_id, name, points, goal_books, goal_opps, goal_deals)
                VALUES ($1, $2, $3, 0, 0, 0, 0)
            """, player_uuid, quarter_id, player_name)

@router.get("/players/{quarter_id}")
async def get_player_goals(quarter_id: int, user: AuthorizedUser) -> List[PlayerGoalResponse]:
    """Get all player goals for a specific quarter"""
    check_admin_access(user)
    
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        # Ensure all player profiles exist
        await ensure_player_profiles(quarter_id, conn)
        
        # Get quarter name
        quarter_name = await conn.fetchval(
            "SELECT name FROM quarters WHERE id = $1", quarter_id
        )
        if not quarter_name:
            raise HTTPException(status_code=404, detail="Quarter not found")
        
        # Get player goals and current activity counts
        rows = await conn.fetch("""
            SELECT 
                p.name as player_name,
                p.goal_books, p.goal_opps, p.goal_deals,
                COALESCE(books.count, 0) as current_books,
                COALESCE(opps.count, 0) as current_opps,
                COALESCE(deals.count, 0) as current_deals,
                p.points as current_points
            FROM profiles p
            LEFT JOIN (
                SELECT profile_id, COUNT(*) as count
                FROM activities 
                WHERE type = 'book' AND quarter_id = $1
                GROUP BY profile_id
            ) books ON p.id = books.profile_id
            LEFT JOIN (
                SELECT profile_id, COUNT(*) as count
                FROM activities 
                WHERE type = 'opp' AND quarter_id = $1
                GROUP BY profile_id
            ) opps ON p.id = opps.profile_id
            LEFT JOIN (
                SELECT profile_id, COUNT(*) as count
                FROM activities 
                WHERE type = 'deal' AND quarter_id = $1
                GROUP BY profile_id
            ) deals ON p.id = deals.profile_id
            WHERE p.quarter_id = $1
            ORDER BY p.name
        """, quarter_id)
        
        players = []
        for row in rows:
            goal_points = calculate_goal_points(
                row['goal_books'], row['goal_opps'], row['goal_deals']
            )
            players.append(PlayerGoalResponse(
                player_name=row['player_name'],
                quarter_id=quarter_id,
                quarter_name=quarter_name,
                goal_books=row['goal_books'],
                goal_opps=row['goal_opps'],
                goal_deals=row['goal_deals'],
                goal_points=goal_points,
                current_books=row['current_books'],
                current_opps=row['current_opps'],
                current_deals=row['current_deals'],
                current_points=row['current_points']
            ))
        
        return players
    finally:
        await conn.close()

@router.put("/players/goals")
async def update_player_goals(request: UpdatePlayerGoalsRequest, user: AuthorizedUser) -> PlayerGoalResponse:
    """Update goals for a specific player"""
    check_admin_access(user)
    
    if request.player_name not in FIXED_PLAYERS:
        raise HTTPException(status_code=400, detail=f"Invalid player name. Must be one of: {', '.join(FIXED_PLAYERS)}")
    
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        # Ensure player profile exists
        await ensure_player_profiles(request.quarter_id, conn)
        
        # Get quarter name
        quarter_name = await conn.fetchval(
            "SELECT name FROM quarters WHERE id = $1", request.quarter_id
        )
        if not quarter_name:
            raise HTTPException(status_code=404, detail="Quarter not found")
        
        # Update player goals
        goal_points = calculate_goal_points(
            request.goal_books, request.goal_opps, request.goal_deals
        )
        
        await conn.execute("""
            UPDATE profiles 
            SET goal_books = $1, goal_opps = $2, goal_deals = $3
            WHERE name = $4 AND quarter_id = $5
        """, request.goal_books, request.goal_opps, request.goal_deals, 
             request.player_name, request.quarter_id)
        
        # Get current activity counts
        current_stats = await conn.fetchrow("""
            SELECT 
                COALESCE(books.count, 0) as current_books,
                COALESCE(opps.count, 0) as current_opps,
                COALESCE(deals.count, 0) as current_deals,
                p.points as current_points
            FROM profiles p
            LEFT JOIN (
                SELECT profile_id, COUNT(*) as count
                FROM activities 
                WHERE type = 'book' AND quarter_id = $1
                GROUP BY profile_id
            ) books ON p.id = books.profile_id
            LEFT JOIN (
                SELECT profile_id, COUNT(*) as count
                FROM activities 
                WHERE type = 'opp' AND quarter_id = $1
                GROUP BY profile_id
            ) opps ON p.id = opps.profile_id
            LEFT JOIN (
                SELECT profile_id, COUNT(*) as count
                FROM activities 
                WHERE type = 'deal' AND quarter_id = $1
                GROUP BY profile_id
            ) deals ON p.id = deals.profile_id
            WHERE p.name = $2 AND p.quarter_id = $1
        """, request.quarter_id, request.player_name)
        
        return PlayerGoalResponse(
            player_name=request.player_name,
            quarter_id=request.quarter_id,
            quarter_name=quarter_name,
            goal_books=request.goal_books,
            goal_opps=request.goal_opps,
            goal_deals=request.goal_deals,
            goal_points=goal_points,
            current_books=current_stats['current_books'],
            current_opps=current_stats['current_opps'],
            current_deals=current_stats['current_deals'],
            current_points=current_stats['current_points']
        )
    finally:
        await conn.close()

@router.get("/team-goals/{quarter_id}")
async def get_team_goals(quarter_id: int, user: AuthorizedUser) -> TeamGoalsResponse:
    """Get auto-calculated team goals for a quarter"""
    check_admin_access(user)
    
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        # Get quarter name
        quarter_name = await conn.fetchval(
            "SELECT name FROM quarters WHERE id = $1", quarter_id
        )
        if not quarter_name:
            raise HTTPException(status_code=404, detail="Quarter not found")
        
        # Calculate team goals by summing all player goals
        team_totals = await conn.fetchrow("""
            SELECT 
                COALESCE(SUM(goal_books), 0) as total_goal_books,
                COALESCE(SUM(goal_opps), 0) as total_goal_opps,
                COALESCE(SUM(goal_deals), 0) as total_goal_deals
            FROM profiles
            WHERE quarter_id = $1
        """, quarter_id)
        
        total_goal_points = calculate_goal_points(
            team_totals['total_goal_books'],
            team_totals['total_goal_opps'], 
            team_totals['total_goal_deals']
        )
        
        return TeamGoalsResponse(
            quarter_id=quarter_id,
            quarter_name=quarter_name,
            total_goal_books=team_totals['total_goal_books'],
            total_goal_opps=team_totals['total_goal_opps'],
            total_goal_deals=team_totals['total_goal_deals'],
            total_goal_points=total_goal_points
        )
    finally:
        await conn.close()

@router.put("/quarters/status")
async def update_quarter_status(request: UpdateQuarterStatusRequest, user: AuthorizedUser) -> QuarterResponse:
    """Activate or deactivate a quarter (only one can be active at a time)"""
    check_admin_access(user)
    
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        # If activating a quarter, deactivate all others first
        if request.is_active:
            await conn.execute("UPDATE quarters SET is_active = false")
        
        # Update the target quarter
        row = await conn.fetchrow("""
            UPDATE quarters 
            SET is_active = $1 
            WHERE id = $2
            RETURNING id, name, start_date, end_date, created_at, is_active
        """, request.is_active, request.quarter_id)
        
        if not row:
            raise HTTPException(status_code=404, detail="Quarter not found")
        
        return QuarterResponse(
            id=row['id'],
            name=row['name'],
            start_date=row['start_date'],
            end_date=row['end_date'],
            created_at=row['created_at'].isoformat(),
            is_active=row['is_active']
        )
    finally:
        await conn.close()

# ===== CHALLENGE MANAGEMENT MODELS =====

class ChallengeTemplateResponse(BaseModel):
    id: int
    name: str
    description: str | None
    type: str
    icon: str
    target_value: int
    target_type: str
    duration_hours: int
    auto_generate: bool
    reward_points: int
    reward_description: str | None
    trigger_condition: str | None
    trigger_threshold: float | None
    created_at: str
    is_active: bool

class CreateChallengeTemplateRequest(BaseModel):
    name: str
    description: str | None = None
    type: str  # speed_run, streak, team_push, boss_fight, hidden_gem
    icon: str = "🎯"
    target_value: int
    target_type: str  # meetings, opportunities, deals, points, activities
    duration_hours: int = 24
    auto_generate: bool = True
    reward_points: int = 10
    reward_description: str | None = None
    trigger_condition: str | None = None
    trigger_threshold: float | None = None

class UpdateChallengeTemplateRequest(BaseModel):
    template_id: int
    name: str | None = None
    description: str | None = None
    type: str | None = None
    icon: str | None = None
    target_value: int | None = None
    target_type: str | None = None
    duration_hours: int | None = None
    auto_generate: bool | None = None
    reward_points: int | None = None
    reward_description: str | None = None
    trigger_condition: str | None = None
    trigger_threshold: float | None = None
    is_active: bool | None = None

class ChallengeResponse(BaseModel):
    id: int
    template_id: int | None
    quarter_id: int
    title: str
    description: str | None
    type: str
    icon: str
    target_value: int
    target_type: str
    current_progress: int
    start_time: str
    end_time: str
    reward_points: int
    reward_description: str | None
    status: str
    completed_by: str | None
    completed_at: str | None
    auto_generated: bool
    generation_trigger: str | None
    created_at: str
    participants: list[dict] | None = None
    time_remaining_hours: float | None = None
    progress_percentage: float | None = None
    # New: include progress_mode for frontend logic
    progress_mode: str | None = None

class CreateChallengeRequest(BaseModel):
    template_id: int | None = None
    quarter_id: int
    title: str
    description: str | None = None
    type: str
    icon: str = "🎯"
    target_value: int
    target_type: str
    duration_hours: int = 24
    reward_points: int = 10
    reward_description: str | None = None
    auto_generated: bool = False
    generation_trigger: str | None = None

class GenerateChallengesRequest(BaseModel):
    quarter_id: int
    template_ids: list[int] | None = None  # If None, use all active templates
    force_generate: bool = False  # Generate even if conditions not met

class ChallengeRuleResponse(BaseModel):
    id: int
    name: str
    description: str | None
    trigger_type: str
    trigger_schedule: str | None
    trigger_condition: str | None
    max_active_challenges: int
    priority: int
    preferred_templates: list[int] | None
    created_at: str
    is_active: bool

class CreateChallengeRuleRequest(BaseModel):
    name: str
    description: str | None = None
    trigger_type: str  # time_based, performance_based, event_based
    trigger_schedule: str | None = None
    trigger_condition: str | None = None
    max_active_challenges: int = 3
    priority: int = 0
    preferred_templates: list[int] | None = None

# ===== CHALLENGE TEMPLATE ENDPOINTS =====

@router.get("/challenge-templates")
async def get_challenge_templates(user: AuthorizedUser):
    """Get all challenge templates"""
    check_admin_access(user)
    
    conn = await get_db_connection()
    try:
        rows = await conn.fetch("""
            SELECT id, name, description, type, icon, target_type, 
                   target_value_min, target_value_max, duration_hours,
                   reward_points_min, reward_points_max, trigger_conditions,
                   generation_rules, is_active, created_at
            FROM challenge_templates
            ORDER BY created_at DESC
        """)
        
        return [
            {
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "type": row["type"],
                "icon": row["icon"],
                "target_type": row["target_type"],
                "target_value_min": row["target_value_min"],
                "target_value_max": row["target_value_max"],
                "duration_hours": row["duration_hours"],
                "reward_points_min": row["reward_points_min"],
                "reward_points_max": row["reward_points_max"],
                "trigger_conditions": row["trigger_conditions"],
                "generation_rules": row["generation_rules"],
                "is_active": row["is_active"],
                "created_at": row["created_at"].isoformat()
            }
            for row in rows
        ]
    finally:
        await conn.close()

class ChallengeTemplateCreate(BaseModel):
    name: str
    description: str
    type: str  # speed_run, streak, team_push, boss_fight, hidden_gem
    icon: str
    target_type: str  # meetings, opportunities, deals, etc.
    target_value_min: int
    target_value_max: int
    duration_hours: int
    reward_points_min: int
    reward_points_max: int
    trigger_conditions: dict  # JSON object with conditions
    generation_rules: dict  # JSON object with generation rules
    is_active: bool = True

    # --- Validation helpers to reduce 422 surprises and improve messages ---
    # Allow the frontend to send strings for JSON and coerce here
    from pydantic import field_validator, model_validator
    import json as _json

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        allowed = {"speed_run", "streak", "team_push", "boss_fight", "hidden_gem"}
        if v not in allowed:
            raise ValueError(f"type must be one of: {', '.join(sorted(allowed))}")
        return v

    @field_validator("target_type")
    @classmethod
    def validate_target_type(cls, v: str) -> str:
        allowed = {"meetings", "opportunities", "deals", "activities"}
        if v not in allowed:
            raise ValueError(f"target_type must be one of: {', '.join(sorted(allowed))}")
        return v

    @field_validator("trigger_conditions", mode="before")
    @classmethod
    def coerce_trigger(cls, v):
        if isinstance(v, str):
            try:
                data = cls._json.loads(v)
            except Exception:
                raise ValueError("trigger_conditions must be valid JSON")
            if not isinstance(data, dict):
                raise ValueError("trigger_conditions must be a JSON object")
            return data
        if v is None:
            return {}
        if not isinstance(v, dict):
            raise ValueError("trigger_conditions must be a JSON object")
        return v

    @field_validator("generation_rules", mode="before")
    @classmethod
    def coerce_rules(cls, v):
        if isinstance(v, str):
            try:
                data = cls._json.loads(v)
            except Exception:
                raise ValueError("generation_rules must be valid JSON")
            if not isinstance(data, dict):
                raise ValueError("generation_rules must be a JSON object")
            return data
        if v is None:
            return {}
        if not isinstance(v, dict):
            raise ValueError("generation_rules must be a JSON object")
        return v

    @model_validator(mode="after")
    def check_ranges(self):
        if self.target_value_min < 1 or self.target_value_max < 1:
            raise ValueError("target values must be at least 1")
        if self.target_value_min >= self.target_value_max:
            raise ValueError("target_value_min must be less than target_value_max")
        if self.reward_points_min < 1 or self.reward_points_max < 1:
            raise ValueError("reward points must be at least 1")
        if self.reward_points_min >= self.reward_points_max:
            raise ValueError("reward_points_min must be less than reward_points_max")
        if self.duration_hours < 1:
            raise ValueError("duration_hours must be at least 1")
        return self

@router.post("/challenge-templates")
async def create_challenge_template(template: ChallengeTemplateCreate, user: AuthorizedUser):
    """Create a new challenge template"""
    check_admin_access(user)
    
    async with get_db_connection() as conn:
        template_id = await conn.fetchval("""
            INSERT INTO challenge_templates (
                name, description, type, icon, target_type,
                target_value_min, target_value_max, duration_hours,
                reward_points_min, reward_points_max, trigger_conditions,
                generation_rules, is_active
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            ) RETURNING id
        """, 
            template.name, template.description, template.type, template.icon,
            template.target_type, template.target_value_min, template.target_value_max,
            template.duration_hours, template.reward_points_min, template.reward_points_max,
            json.dumps(template.trigger_conditions), json.dumps(template.generation_rules),
            template.is_active
        )
        
        return {"success": True, "template_id": template_id}

class ChallengeTemplateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    type: str | None = None
    icon: str | None = None
    target_type: str | None = None
    target_value_min: int | None = None
    target_value_max: int | None = None
    duration_hours: int | None = None
    reward_points_min: int | None = None
    reward_points_max: int | None = None
    trigger_conditions: dict | None = None
    generation_rules: dict | None = None
    is_active: bool | None = None

    from pydantic import field_validator, model_validator
    import json as _json

    @field_validator("type")
    @classmethod
    def validate_type_opt(cls, v: str | None):
        if v is None:
            return v
        allowed = {"speed_run", "streak", "team_push", "boss_fight", "hidden_gem"}
        if v not in allowed:
            raise ValueError(f"type must be one of: {', '.join(sorted(allowed))}")
        return v

    @field_validator("target_type")
    @classmethod
    def validate_target_type_opt(cls, v: str | None):
        if v is None:
            return v
        allowed = {"meetings", "opportunities", "deals", "activities"}
        if v not in allowed:
            raise ValueError(f"target_type must be one of: {', '.join(sorted(allowed))}")
        return v

    @field_validator("trigger_conditions", mode="before")
    @classmethod
    def coerce_trigger_opt(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            try:
                data = cls._json.loads(v)
            except Exception:
                raise ValueError("trigger_conditions must be valid JSON")
            if not isinstance(data, dict):
                raise ValueError("trigger_conditions must be a JSON object")
            return data
        if not isinstance(v, dict):
            raise ValueError("trigger_conditions must be a JSON object")
        return v

    @field_validator("generation_rules", mode="before")
    @classmethod
    def coerce_rules_opt(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            try:
                data = cls._json.loads(v)
            except Exception:
                raise ValueError("generation_rules must be valid JSON")
            if not isinstance(data, dict):
                raise ValueError("generation_rules must be a JSON object")
            return data
        if not isinstance(v, dict):
            raise ValueError("generation_rules must be a JSON object")
        return v

    @model_validator(mode="after")
    def check_ranges_opt(self):
        # Only validate if values provided together make sense
        if self.target_value_min is not None and self.target_value_max is not None:
            if self.target_value_min < 1 or self.target_value_max < 1:
                raise ValueError("target values must be at least 1")
            if self.target_value_min >= self.target_value_max:
                raise ValueError("target_value_min must be less than target_value_max")
        if self.reward_points_min is not None and self.reward_points_max is not None:
            if self.reward_points_min < 1 or self.reward_points_max < 1:
                raise ValueError("reward points must be at least 1")
            if self.reward_points_min >= self.reward_points_max:
                raise ValueError("reward_points_min must be less than reward_points_max")
        if self.duration_hours is not None and self.duration_hours < 1:
            raise ValueError("duration_hours must be at least 1")
        return self

@router.put("/challenge-templates/{template_id}")
async def update_challenge_template(template_id: int, template: ChallengeTemplateUpdate, user: AuthorizedUser):
    """Update a challenge template"""
    check_admin_access(user)
    
    # Build dynamic update query
    update_fields = []
    values = []
    param_count = 1
    
    for field, value in template.model_dump(exclude_none=True).items():
        if field in ['trigger_conditions', 'generation_rules'] and isinstance(value, dict):
            value = json.dumps(value)
        update_fields.append(f"{field} = ${param_count}")
        values.append(value)
        param_count += 1
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    values.append(template_id)
    
    async with get_db_connection() as conn:
        await conn.execute(f"""
            UPDATE challenge_templates 
            SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${param_count}
        """, *values)
        
        return {"success": True}

@router.delete("/challenge-templates/{template_id}")
async def delete_challenge_template(template_id: int, user: AuthorizedUser):
    """Delete a challenge template"""
    # Use the proper admin access check
    check_admin_access(user)
    
    async with get_db_connection() as conn:
        await conn.execute(
            "DELETE FROM challenge_templates WHERE id = $1",
            template_id
        )
        
        return {"success": True}

# ===== ACTIVE CHALLENGES ENDPOINTS =====

@router.get("/challenges/active")
async def get_active_challenges(quarter_id: int | None = None, user: AuthorizedUser = None) -> list[ChallengeResponse]:
    """Get all active challenges, optionally filtered by quarter"""
    check_admin_access(user)
    
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        where_clause = "WHERE c.status = 'active'"
        params = []
        
        if quarter_id:
            where_clause += " AND c.quarter_id = $1"
            params.append(quarter_id)
        
        query = f"""
            SELECT c.id, c.template_id, c.quarter_id, c.title, c.description, c.type, c.icon,
                   c.target_value, c.target_type, c.current_progress, c.start_time, c.end_time,
                   c.reward_points, c.reward_description, c.status, c.completed_by, c.completed_at,
                   c.auto_generated, c.generation_trigger, c.created_at, c.progress_mode,
                   EXTRACT(EPOCH FROM (c.end_time - CURRENT_TIMESTAMP))/3600 as time_remaining_hours,
                   CASE WHEN c.target_value > 0 THEN (c.current_progress::FLOAT / c.target_value * 100) ELSE 0 END as progress_percentage
            FROM challenges c
            {where_clause}
            ORDER BY c.end_time ASC
        """
        
        rows = await conn.fetch(query, *params)
        
        challenges = []
        for row in rows:
            # For per_person challenges ensure participants exist and include them
            participants = None
            if row['progress_mode'] == 'per_person':
                await ensure_participants_for_challenge(conn, row['id'], row['quarter_id'])
                participant_rows = await conn.fetch(
                    "SELECT player_name, contribution FROM challenge_participants WHERE challenge_id = $1 ORDER BY player_name",
                    row['id']
                )
                participants = [{'player_name': p['player_name'], 'contribution': p['contribution']} for p in participant_rows]
            elif row['type'] in ['team_push', 'boss_fight']:
                participant_rows = await conn.fetch(
                    "SELECT player_name, contribution FROM challenge_participants WHERE challenge_id = $1",
                    row['id']
                )
                participants = [{'player_name': p['player_name'], 'contribution': p['contribution']} for p in participant_rows]
            
            challenges.append(ChallengeResponse(
                id=row['id'],
                template_id=row['template_id'],
                quarter_id=row['quarter_id'],
                title=row['title'],
                description=row['description'],
                type=row['type'],
                icon=row['icon'],
                target_value=row['target_value'],
                target_type=row['target_type'],
                current_progress=row['current_progress'],
                start_time=row['start_time'].isoformat(),
                end_time=row['end_time'].isoformat(),
                reward_points=row['reward_points'],
                reward_description=row['reward_description'],
                status=row['status'],
                completed_by=row['completed_by'],
                completed_at=row['completed_at'].isoformat() if row['completed_at'] else None,
                auto_generated=row['auto_generated'],
                generation_trigger=row['generation_trigger'],
                created_at=row['created_at'].isoformat(),
                participants=participants,
                time_remaining_hours=max(0, row['time_remaining_hours']) if row['time_remaining_hours'] else 0,
                progress_percentage=min(100, max(0, row['progress_percentage'])) if row['progress_percentage'] else 0,
                progress_mode=row['progress_mode']
            ))
        
        return challenges
    finally:
        await conn.close()

@router.post("/challenges")
async def create_challenge(challenge: CreateChallengeRequest, user: AuthorizedUser):
    # Use the proper admin access check
    check_admin_access(user)
    
    conn = await get_db_connection()
    try:
        # Calculate end_time based on duration_hours
        end_time = datetime.now() + timedelta(hours=challenge.duration_hours)
        
        # Insert challenge with a valid type
        row = await conn.fetchrow("""
            INSERT INTO challenges (
                title, description, type, icon, target_value, target_type,
                reward_points, quarter_id, end_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, template_id, quarter_id, title, description, type, icon,
                      target_value, target_type, current_progress, start_time, end_time,
                      reward_points, reward_description, status, completed_by, completed_at,
                      auto_generated, generation_trigger, created_at, updated_at, is_visible
        """, 
        challenge.title, 
        challenge.description, 
        challenge.type,  # Use the type from the request
        challenge.icon or "🎯", 
        challenge.target_value, 
        challenge.target_type,
        challenge.reward_points, 
        challenge.quarter_id,
        end_time
        )
        
        # Create response manually
        return ChallengeResponse(
            id=row['id'],
            template_id=row['template_id'],
            quarter_id=row['quarter_id'],
            title=row['title'],
            description=row['description'],
            type=row['type'],
            icon=row['icon'],
            target_value=row['target_value'],
            target_type=row['target_type'],
            current_progress=row['current_progress'],
            start_time=row['start_time'].isoformat(),
            end_time=row['end_time'].isoformat(),
            reward_points=row['reward_points'],
            reward_description=row['reward_description'],
            status=row['status'],
            completed_by=row['completed_by'],
            completed_at=row['completed_at'].isoformat() if row['completed_at'] else None,
            auto_generated=row['auto_generated'],
            generation_trigger=row['generation_trigger'],
            created_at=row['created_at'].isoformat(),
            participants=None,
            time_remaining_hours=challenge.duration_hours,
            progress_percentage=0
        )
    except Exception as e:
        print(f"Error creating challenge: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await conn.close()

@router.post("/challenges/{challenge_id}/recalculate")
async def recalculate_challenge_progress(challenge_id: int, user: AuthorizedUser):
    """Admin tool: Recalculate a single challenge's progress and participants from activities"""
    check_admin_access(user)
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        from app.libs.challenges import recalc_challenge_progress
        await recalc_challenge_progress(conn, challenge_id)
        # Return updated challenge
        row = await conn.fetchrow("SELECT * FROM challenges WHERE id = $1", challenge_id)
        if not row:
            raise HTTPException(status_code=404, detail="Challenge not found")
        return {"success": True, "challenge_id": challenge_id, "progress_mode": row["progress_mode"], "current_progress": row["current_progress"]}
    finally:
        await conn.close()

# ===== CHALLENGE GENERATION EndPOINT =====

# Challenge Generation Algorithm
@router.post("/challenges/generate")
async def generate_challenges(user: AuthorizedUser):
    """Generate challenges based on active templates and team performance"""
    # Use the existing admin check from other endpoints
    check_admin_access(user)
    
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        # Get current quarter
        current_quarter = await conn.fetchrow("""
            SELECT id, name FROM quarters 
            WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
            LIMIT 1
        """)

        if not current_quarter:
            raise HTTPException(status_code=400, detail="No active quarter found")
        
        quarter_id = current_quarter["id"]
        
        # Get active templates and rules
        templates = await conn.fetch("""
            SELECT * FROM challenge_templates WHERE is_active = true
        """)
        
        rules = await conn.fetch("""
            SELECT * FROM challenge_rules 
            WHERE is_active = true 
            ORDER BY priority DESC
        """)
        
        # Analyze team performance
        team_performance = await analyze_team_performance(conn, quarter_id)
        
        generated_challenges = []
        
        # Apply generation rules
        for rule in rules:
            rule_conditions = json.loads(rule["conditions"]) if rule["conditions"] else {}
            rule_actions = json.loads(rule["actions"]) if rule["actions"] else {}
            
            # Check if rule conditions are met
            if should_trigger_rule(rule_conditions, team_performance):
                # Generate challenges based on rule actions
                for template in templates:
                    if should_use_template(template, rule_actions, team_performance):
                        challenge = await create_challenge_from_template(
                            conn, template, quarter_id, team_performance
                        )
                        if challenge:
                            generated_challenges.append(challenge)
        
        return {
            "success": True,
            "generated_count": len(generated_challenges),
            "challenges": generated_challenges
        }
    finally:
        await conn.close()

async def analyze_team_performance(conn, quarter_id: int):
    """Analyze team performance to determine what challenges to generate"""
    
    # Get team goals and current progress from profiles
    team_data = await conn.fetchrow("""
        SELECT 
            SUM(goal_books) as total_goal_books,
            SUM(goal_opps) as total_goal_opps, 
            SUM(goal_deals) as total_goal_deals,
            COUNT(*) as active_players
        FROM profiles 
        WHERE quarter_id = $1
    """, quarter_id)
    
    # Get current team activity counts
    activity_data = await conn.fetchrow("""
        SELECT 
            SUM(CASE WHEN a.type = 'book' THEN 1 ELSE 0 END) as total_books,
            SUM(CASE WHEN a.type = 'opp' THEN 1 ELSE 0 END) as total_opps,
            SUM(CASE WHEN a.type = 'deal' THEN 1 ELSE 0 END) as total_deals,
            SUM(a.points) as total_points
        FROM activities a
        JOIN profiles p ON a.profile_id = p.id
        WHERE p.quarter_id = $1
    """, quarter_id)
    
    if not team_data or not activity_data:
        return {
            'behind_books': False,
            'behind_opps': False, 
            'behind_deals': False,
            'team_size': 0,
            'total_points': 0,
            'books_ratio': 0.0,
            'opps_ratio': 0.0,
            'deals_ratio': 0.0
        }
    
    # Calculate performance ratios
    books_ratio = (activity_data['total_books'] or 0) / max(team_data['total_goal_books'] or 1, 1)
    opps_ratio = (activity_data['total_opps'] or 0) / max(team_data['total_goal_opps'] or 1, 1) 
    deals_ratio = (activity_data['total_deals'] or 0) / max(team_data['total_goal_deals'] or 1, 1)
    
    return {
        'behind_books': books_ratio < 0.8,  # Behind if less than 80% of goal
        'behind_opps': opps_ratio < 0.8,
        'behind_DEals': deals_ratio < 0.8,
        'team_size': team_data['active_players'] or 0,
        'total_points': activity_data['total_points'] or 0,
        'books_ratio': books_ratio,
        'opps_ratio': oppp_ratio,
        'deals_ratio': deals_ratio
    }

def should_trigger_rule(conditions, team_performance):
    """Check if rule conditions are met based on team performance"""
    
    if not conditions:
        return True  # No conditions = always trigger
    
    analysis = team_performance.get("analysis", {})
    
    # Team behind schedule trigger
    if conditions.get("trigger_on_behind_schedule") and analysis.get("behind_schedule"):
        return True
    
    # Low activity trigger
    if conditions.get("trigger_on_low_activity"):
        min_weekly_activities = conditions.get("min_weekly_activities", 10)
        total_recent = sum(team_performance.get("recent_activity", {}).values())
        if total_recent < min_weekly_activities:
            return True
    
    # High performer trigger
    if conditions.get("trigger_on_high_performers"):
        min_streak_players = conditions.get("min_streak_players", 2)
        if len(analysis.get("streak_players", [])) >= min_streak_players:
            return True
    
    # Time-based triggers
    if conditions.get("trigger_on_day_of_week"):
        import datetime
        current_day = datetime.datetime.now().strftime("%A").lower()
        if current_day in conditions["trigger_on_day_of_week"]:
            return True
    
    return False

def should_use_template(template, rule_actions, team_performance):
    """Determine if a template should be used based on rule actions and performance"""
    
    template_type = template["type"]
    analysis = team_performance.get("analysis", {})
    
    # Default action - use any template
    if not rule_actions:
        return True
    
    # Specific template types for specific conditions
    preferred_types = rule_actions.get("preferred_template_types", [])
    if preferred_types and template_type not in preferred_types:
        return False
    
    # Team push challenges when behind schedule
    if analysis.get("behind_schedule") and template_type == "team_push":
        return True
    
    # Streak challenges for high performers
    if len(analysis.get("streak_players", [])) >= 2 and template_type == "streak":
        return True
    
    # Speed run challenges for daily motivation
    if template_type == "speed_run":
        return True
    
    # Boss fight challenges for major milestones
    if template_type == "boss_fight":
        # Only generate boss fights if team is doing well
        avg_progress = (
            analysis.get("meetings_progress", 0) +
            analysis.get("opportunities_progress", 0) +
            analysis.get("deals_progress", 0)
        ) / 3
        return avg_progress > 80
    
    return True

async def create_challenge_from_template(conn, template, quarter_id, team_performance):
    """Create a challenge instance from a template"""
    
    import random
    from datetime import datetime, timedelta
    
    # Check if similar challenge already exists
    existing = await conn.fetchval("""
        SELECT id FROM challenges 
        WHERE type = $1 AND status = 'active' AND quarter_id = $2
        LIMIT 1
    """, template["type"], quarter_id)
    
    if existing:
        return None  # Don't create duplicate challenges
    
    # Calculate dynamic values based on template ranges and performance
    analysis = team_performance.get("analysis", {})
    
    # Adjust target value based on team performance
    target_min = template["target_value_min"]
    target_max = template["target_value_max"]
    
    if analysis.get("behind_schedule"):
        # Lower targets when team is behind
        target_value = target_min + int((target_max - target_min) * 0.3)
    else:
        # Higher targets when team is doing well
        target_value = target_min + int((target_max - target_min) * 0.7)
    
    # Calculate reward points
    reward_min = template["reward_points_min"]
    reward_max = template["reward_points_max"]
    reward_points = random.randint(reward_min, reward_max)
    
    # Set duration
    duration_hours = template["duration_hours"]
    start_time = datetime.now()
    end_time = start_time + timedelta(hours=duration_hours)
    
    # Generate dynamic title and description
    title, description = generate_challenge_content(template, target_value, team_performance)
    
    # Create the challenge
    challenge_id = await conn.fetchval("""
        INSERT INTO challenges (
            quarter_id, title, description, type, icon, target_value, target_type,
            current_progress, start_time, end_time, reward_points, reward_description, status
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active'
        ) RETURNING id
    """, 
        quarter_id, title, description, template["type"], template["icon"],
        target_value, template["target_type"], 0, start_time, end_time,
        reward_points, f"Auto-generated challenge reward: {reward_points} points"
    )
    
    return {
        "id": challenge_id,
        "title": title,
        "type": template["type"],
        "target_value": target_value,
        "reward_points": reward_points
    }

def generate_challenge_content(template, target_value, team_performance):
    """Generate dynamic title and description for challenges"""
    
    challenge_type = template["type"]
    target_type = template["target_type"]
    analysis = team_performance.get("analysis", {})
    
    titles = {
        "speed_run": [
            f"Lightning {target_type.title()} Blitz ⚡",
            f"Fast Track {target_value} {target_type.title()} 🚀",
            f"Speed Demon Challenge ⚡"
        ],
        "streak": [
            f"Fire Streak: {target_value} Day Challenge 🔥",
            f"Consistency King 🔥",
            f"Daily Grind Master 🔥"
        ],
        "team_push": [
            f"Team Rally: {target_value} {target_type.title()} 🤝",
            f"United We Stand Challenge 🤝",
            f"Comeback Kids 🤝"
        ],
        "boss_fight": [
            f"Quarter Boss: {target_value} {target_type.title()} Battle 👾",
            f"Epic Milestone Challenge 👾",
            f"The Final Push 👾"
        ],
        "hidden_gem": [
            f"Secret Mission: {target_value} {target_type.title()} 🔍",
            f"Hidden Achievement Unlocked 🔍",
            f"Easter Egg Challenge 🔍"
        ]
    }
    
    descriptions = {
        "speed_run": f"Race against time! First to reach {target_value} {target_type} gets bonus points!",
        "streak": f"Build your momentum! Complete {target_value} {target_type} in a row without breaking the chain.",
        "team_push": f"Team effort required! Work together to achieve {target_value} {target_type} as a group.",
        "boss_fight": f"Epic challenge ahead! This quarter's big goal requires {target_value} {target_type} to defeat.",
        "hidden_gem": f"Secret achievement discovered! Complete {target_value} {target_type} to unlock hidden rewards."
    }
    
    # Add performance-based context
    if analysis.get("behind_schedule") and challenge_type == "team_push":
        descriptions[challenge_type] += " Time to rally together and catch up!"
    elif len(analysis.get("streak_players", [])) >= 2 and challenge_type == "streak":
        descriptions[challenge_type] += " Your hot streak continues!"
    
    import random
    title = random.choice(titles.get(challenge_type, [template["name"]]))
    description = descriptions.get(challenge_type, template["description"])
    
    return title, description

# ===== CHALLENGE RULES ENDPOINTS =====

@router.get("/challenge-rules")
async def get_challenge_rules(user: AuthorizedUser):
    """Get challenge generation rules"""
    check_admin_access(user)
    
    async with get_db_connection() as conn:
        rows = await conn.fetch("""
            SELECT id, name, rule_type, conditions, actions, 
                   priority, is_active, created_at
            FROM challenge_rules
            ORDER BY priority DESC, created_at DESC
        """)
        
        return {
            "rules": [
                {
                    "id": row["id"],
                    "name": row["name"],
                    "rule_type": row["rule_type"],
                    "conditions": row["conditions"],
                    "actions": row["actions"],
                    "priority": row["priority"],
                    "is_active": row["is_active"],
                    "created_at": row["created_at"].isoformat()
                }
                for row in rows
            ]
        }

class ChallengeRuleCreate(BaseModel):
    name: str
    rule_type: str  # team_performance, individual_streak, time_based, etc.
    conditions: dict  # JSON conditions for when to trigger
    actions: dict  # JSON actions to take (which templates to use)
    priority: int = 1
    is_active: bool = True

@router.post("/challenge-rules")
async def create_challenge_rule(rule: ChallengeRuleCreate, user: AuthorizedUser):
    """Create a new challenge generation rule"""
    # Use the proper admin access check
    check_admin_access(user)
    
    async with get_db_connection() as conn:
        rule_id = await conn.fetchval("""
            INSERT INTO challenge_rules (
                name, rule_type, conditions, actions, priority, is_active
            ) VALUES (
                $1, $2, $3, $4, $5, $6
            ) RETURNING id
        """, 
            rule.name, rule.rule_type, json.dumps(rule.conditions), 
            json.dumps(rule.actions), rule.priority, rule.is_active
        )
        
        return {"success": True, "rule_id": rule_id}

# ===== CHALLENGE REVOCATION MODELS =====

class RevokeChallengeRequest(BaseModel):
    admin_reason: str | None = None

class RevokeChallengeResponse(BaseModel):
    success: bool
    message: str
    challenge_id: int
    player_name: str | None
    points_removed: int
    audit_log: dict

# ===== CHALLENGE REVOCATION ENDPOINT =====

@router.delete("/challenges/{challenge_id}/completion")
async def revoke_challenge_completion(challenge_id: int, user: AuthorizedUser):
    """Admin endpoint to revoke a challenge completion and remove points"""
    check_admin_access(user)
    
    async with get_db_connection() as conn:
        # Start transaction
        async with conn.transaction():
            # Get challenge details to validate it's completed
            challenge = await conn.fetchrow("""
                SELECT id, title, status, completed_by, reward_points, quarter_id
                FROM challenges 
                WHERE id = $1
            """, challenge_id)
            
            if not challenge:
                raise HTTPException(status_code=404, detail="Challenge not found")
            
            if challenge['status'] != 'completed':
                raise HTTPException(status_code=400, detail="Challenge is not completed")
            
            if not challenge['completed_by']:
                raise HTTPException(status_code=400, detail="No completion record found")
            
            # Get player profile to remove points
            player_profile = await conn.fetchrow("""
                SELECT id, points, name
                FROM profiles 
                WHERE name = $1 AND quarter_id = $2
            """, challenge['completed_by'], challenge['quarter_id'])
            
            if not player_profile:
                raise HTTPException(status_code=404, detail="Player profile not found")
            
            # Check if player has enough points to deduct
            new_points = max(0, player_profile['points'] - challenge['reward_points'])
            
            # Reset challenge to active status
            await conn.execute("""
                UPDATE challenges 
                SET status = 'active', 
                    completed_by = NULL, 
                    completed_at = NULL,
                    current_progress = 0,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            """, challenge_id)
            
            # Remove points from player
            await conn.execute("""
                UPDATE profiles 
                SET points = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            """, new_points, player_profile['id'])
            
            # Log the admin action for audit trail
            await conn.execute("""
                INSERT INTO activities (profile_id, quarter_id, type, points, created_at)
                VALUES ($1, $2, 'book', $3, CURRENT_TIMESTAMP)
            """, player_profile['id'], challenge['quarter_id'], -challenge['reward_points'])
            
            print(f"Admin {user.sub} revoked challenge {challenge['title']} completion from {challenge['completed_by']}, removed {challenge['reward_points']} points")
            
            return {
                "success": True,
                "message": f"Revoked challenge completion for {challenge['completed_by']}",
                "points_removed": challenge['reward_points'],
                "new_points_total": new_points
            }

class ToggleChallengeVisibilityRequest(BaseModel):
    is_visible: bool

@router.patch("/challenges/{challenge_id}/visibility")
async def toggle_challenge_visibility(challenge_id: int, request: ToggleChallengeVisibilityRequest, user: AuthorizedUser):
    """Admin endpoint to toggle challenge visibility to users"""
    check_admin_access(user)
    
    conn = await get_db_connection()
    try:
        # Check if challenge exists
        challenge = await conn.fetchrow("""
            SELECT id, title, is_visible
            FROM challenges 
            WHERE id = $1
        """, challenge_id)
        
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        # Update visibility
        await conn.execute("""
            UPDATE challenges 
            SET is_visible = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        """, request.is_visible, challenge_id)
        
        # CRITICAL: Invalidate cache so players see changes immediately
        # Import and call cache invalidation function from activities module
        from app.apis.activities import invalidate_challenges_cache
        invalidate_challenges_cache()
        
        action = "published" if request.is_visible else "unpublished"
        print(f"Admin {user.sub} {action} challenge '{challenge['title']}' (ID: {challenge_id})")
        
        return {
            "success": True,
            "message": f"Challenge {action} successfully",
            "challenge_id": challenge_id,
            "is_visible": request.is_visible
        }
    finally:
        await conn.close()

@router.delete("/challenges/{challenge_id}")
async def delete_challenge(challenge_id: int, user: AuthorizedUser):
    """Permanently delete a published challenge"""
    check_admin_access(user)
    
    conn = await get_db_connection()
    try:
        async with conn.transaction():
            # Get challenge details for logging
            challenge = await conn.fetchrow(
                "SELECT title, status, quarter_id FROM challenges WHERE id = $1",
                challenge_id
            )
            
            if not challenge:
                raise HTTPException(status_code=404, detail="Challenge not found")
            
            # Delete challenge participants first (foreign key constraint)
            await conn.execute(
                "DELETE FROM challenge_participants WHERE challenge_id = $1",
                challenge_id
            )
            
            # Delete the challenge
            await conn.execute(
                "DELETE FROM challenges WHERE id = $1",
                challenge_id
            )
            
            # Invalidate cache
            from app.apis.activities import invalidate_challenges_cache
            invalidate_challenges_cache()
            
            print(f"Admin {user.sub} deleted challenge '{challenge['title']}' (ID: {challenge_id})")
            
            return {
                "success": True,
                "message": f"Challenge '{challenge['title']}' deleted permanently",
                "challenge_id": challenge_id
            }
    finally:
        await conn.close()

class ChallengeUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    target_value: int | None = None
    target_type: str | None = None
    reward_points: int | None = None
    reward_description: str | None = None
    end_time: str | None = None  # ISO format datetime
    is_visible: bool | None = None

@router.put("/challenges/{challenge_id}")
async def update_challenge(challenge_id: int, request: ChallengeUpdate, user: AuthorizedUser):
    """Update a published challenge"""
    check_admin_access(user)
    
    conn = await get_db_connection()
    try:
        async with conn.transaction():
            # Check if challenge exists
            challenge = await conn.fetchrow(
                "SELECT title, status FROM challenges WHERE id = $1",
                challenge_id
            )
            
            if not challenge:
                raise HTTPException(status_code=404, detail="Challenge not found")
            
            # Build dynamic update query
            update_fields = []
            values = []
            param_count = 1
            
            update_data = request.model_dump(exclude_none=True)
            for field, value in update_data.items():
                if field == "end_time" and value:
                    # Parse ISO datetime string
                    from datetime import datetime
                    try:
                        value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    except ValueError:
                        raise HTTPException(status_code=400, detail="Invalid end_time format. Use ISO format.")
                
                update_fields.append(f"{field} = ${param_count}")
                values.append(value)
                param_count += 1
            
            if not update_fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            # Add updated_at timestamp
            update_fields.append(f"updated_at = CURRENT_TIMESTAMP")
            values.append(challenge_id)
            
            query = f"""
                UPDATE challenges 
                SET {', '.join(update_fields)}
                WHERE id = ${param_count}
                RETURNING title
            """
            
            updated_challenge = await conn.fetchrow(query, *values)
            
            # Invalidate cache
            from app.apis.activities import invalidate_challenges_cache
            invalidate_challenges_cache()
            
            print(f"Admin {user.sub} updated challenge '{updated_challenge['title']}' (ID: {challenge_id})")
            
            return {
                "success": True,
                "message": f"Challenge '{updated_challenge['title']}' updated successfully",
                "challenge_id": challenge_id
            }
    finally:
        await conn.close()

# ===== CHALLENGE VISIBILITY ENDPOINT =====

@router.delete("/activities/{activity_id}")
async def delete_activity_admin(
    activity_id: int,
    user: AuthorizedUser,
    activity_type: str
) -> dict:
    """Delete an activity (regular activity or bonus challenge completion) and adjust player points"""
    check_admin_access(user)
    
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        if activity_type == "bonus_challenge":
            # Handle bonus challenge completion removal
            challenge = await conn.fetchrow(
                "SELECT * FROM challenges WHERE id = $1 AND status = 'completed'",
                activity_id
            )
            
            if not challenge:
                raise HTTPException(status_code=404, detail="Completed challenge not found")
            
            # Get player profile
            player_profile = await conn.fetchrow(
                "SELECT * FROM profiles WHERE name = $1 AND quarter_id = $2",
                challenge['completed_by'], challenge['quarter_id']
            )
            
            if not player_profile:
                raise HTTPException(status_code=404, detail="Player profile not found")
            
            # Check if player has enough points to deduct
            points_to_deduct = challenge['reward_points']
            if player_profile['points'] < points_to_deduct:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot revoke: Player {challenge['completed_by']} only has {player_profile['points']} points, but challenge reward was {points_to_deduct} points"
                )
            
            # Revert challenge completion
            await conn.execute(
                "UPDATE challenges SET status = 'active', completed_by = NULL, completed_at = NULL WHERE id = $1",
                activity_id
            )
            
            # Deduct points from player
            await conn.execute(
                "UPDATE profiles SET points = points - $1 WHERE id = $2",
                points_to_deduct, player_profile['id']
            )
            
            return {
                "message": f"Revoked bonus challenge completion. Removed {points_to_deduct} points from {challenge['completed_by']}",
                "challenge_title": challenge['title'],
                "player_name": challenge['completed_by'],
                "points_removed": points_to_deduct
            }
            
        else:
            # Handle regular activity deletion
            activity = await conn.fetchrow(
                "SELECT a.*, p.name as player_name FROM activities a JOIN profiles p ON a.profile_id = p.id WHERE a.id = $1",
                activity_id
            )
            
            if not activity:
                raise HTTPException(status_code=404, detail="Activity not found")
            
            # Delete the activity
            await conn.execute("DELETE FROM activities WHERE id = $1", activity_id)
            
            # Deduct points from player profile
            await conn.execute(
                "UPDATE profiles SET points = points - $1 WHERE id = $2",
                activity['points'], activity['profile_id']
            )
            
            return {
                "message": f"Deleted {activity['type']} activity. Removed {activity['points']} points from {activity['player_name']}",
                "activity_type": activity['type'],
                "player_name": activity['player_name'],
                "points_removed": activity['points']
            }
            
    finally:
        await conn.close()

# Helper function to get database connection
async def get_db_connection():
    return await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))

# ===== CHALLENGE PARTICIPANTS ENDPOINTS =====

class ChallengeParticipantCreate(BaseModel):
    challenge_id: int
    player_name: str
    contribution: int

@router.post("/challenges/{challenge_id}/participants")
async def create_challenge_participant(challenge_id: int, participant: ChallengeParticipantCreate, user: AuthorizedUser):
    """Create a new challenge participant"""
    check_admin_access(user)
    
    async with get_db_connection() as conn:
        await conn.execute("""
            INSERT INTO challenge_participants (challenge_id, player_name, contribution)
            VALUES ($1, $2, $3)
        """, challenge_id, participant.player_name, participant.contribution)
        
        return {"success": True}

@router.get("/challenges/{challenge_id}/participants")
async def get_challenge_participants(challenge_id: int, user: AuthorizedUser):
    """Get all challenge participants"""
    check_admin_access(user)
    
    async with get_db_connection() as conn:
        rows = await conn.fetch("""
            SELECT player_name, contribution FROM challenge_participants WHERE challenge_id = $1
        """, challenge_id)
        
        return [
            {
                "player_name": row["player_name"],
                "contribution": row["contribution"]
            }
            for row in rows
        ]

@router.put("/challenges/{challenge_id}/participants/{participant_id}")
async def update_challenge_participant(challenge_id: int, participant_id: int, participant: ChallengeParticipantCreate, user: AuthorizedUser):
    """Update a challenge participant"""
    check_admin_access(user)
    
    async with get_db_connection() as conn:
        await conn.execute("""
            UPDATE challenge_participants 
            SET player_name = $1, contribution = $2
            WHERE challenge_id = $3 AND id = $4
        """, participant.player_name, participant.contribution, challenge_id, participant_id)
        
        return {"success": True}

@router.delete("/challenges/{challenge_id}/participants/{participant_id}")
async def delete_challenge_participant(challenge_id: int, participant_id: int, user: AuthorizedUser):
    """Delete a challenge participant"""
    check_admin_access(user)
    
    async with get_db_connection() as conn:
        await conn.execute("""
            DELETE FROM challenge_participants WHERE challenge_id = $1 AND id = $2
        """, challenge_id, participant_id)
        
        return {"success": True}

# ===== BACKFILL PER-PERSON PARTICIPANTS (PREVIEW/APPLY) =====

class BackfillPreviewItem(BaseModel):
    challenge_id: int
    quarter_id: int
    title: str
    type: str
    progress_mode: str | None
    existing_participants: int
    expected_participants: int
    missing_players: list[str]
    progress_mode_mismatch: bool

class BackfillPreviewResponse(BaseModel):
    items: list[BackfillPreviewItem]
    total_candidates: int

PER_PERSON_TYPES = {"speed_run", "streak", "hidden_gem"}

async def _get_challenge_missing_players(conn, challenge_row) -> tuple[list[str], list[str], list[str]]:
    """Return (all_players, existing_players, missing_players) for a challenge"""
    quarter_id = challenge_row["quarter_id"]
    challenge_id = challenge_row["id"];
    all_players = [r["name"] for r in await conn.fetch("SELECT name FROM profiles WHERE quarter_id = $1 ORDER BY name", quarter_id)]
    existing = [r["player_name"] for r in await conn.fetch("SELECT player_name FROM challenge_participants WHERE challenge_id = $1", challenge_id)]
    missing = [p for p in all_players if p not in set(existing)]
    return all_players, existing, missing

@router.get("/backfill/per-person/preview")
async def preview_backfill_per_person(user: AuthorizedUser, quarter_id: int | None = None) -> BackfillPreviewResponse:
    """Admin: Preview active challenges that should have per-person participants and list missing players."""
    check_admin_access(user)
    # get_db_connection() returns a connection, not an async context manager
    conn = await get_db_connection()
    try:
        params = []
        where = ["c.status = 'active'", "c.end_time > CURRENT_TIMESTAMP"]
        if quarter_id:
            where.append("c.quarter_id = $1")
            params.append(quarter_id)
        query = f"""
            SELECT c.id, c.quarter_id, c.title, c.type, c.progress_mode
            FROM challenges c
            WHERE {' AND '.join(where)}
            ORDER BY c.end_time ASC
        """
        rows = await conn.fetch(query, *params)

        items: list[BackfillPreviewItem] = []
        for row in rows:
            should_be_per_person = (row["progress_mode"] == "per_person") or (row["progress_mode"] in (None, "") and row["type"] in PER_PERSON_TYPES)
            if not should_be_per_person:
                continue
            all_players, existing, missing = await _get_challenge_missing_players(conn, row)
            if not missing and row["progress_mode"] == "per_person":
                continue

            items.append(BackfillPreviewItem(
                challenge_id=row["id"],
                quarter_id=row["quarter_id"],
                title=row["title"],
                type=row["type"],
                progress_mode=row["progress_mode"],
                existing_participants=len(existing),
                expected_participants=len(all_players),
                missing_players=missing,
                progress_mode_mismatch=(row["type"] in PER_PERSON_TYPES and row["progress_mode"] != "per_person")
            ))

        # Audit preview for traceability
        await conn.execute(
            "INSERT INTO admin_audit_log (action, details, user_id) VALUES ($1, $2, $3)",
            "backfill_per_person_preview",
            json.dumps({
                "quarter_id": quarter_id,
                "count": len(items),
                "challenge_ids": [it.challenge_id for it in items]
            }),
            user.sub,
        )

        return BackfillPreviewResponse(items=items, total_candidates=len(items))
    finally:
        await conn.close()

class BackfillApplyRequest(BaseModel):
    challenge_ids: list[int]
    restrict_players: dict[int, list[str]] | None = None
    recalc: bool = True

class BackfillApplyResultItem(BaseModel):
    challenge_id: int
    title: str
    added_players: list[str]
    before_progress: int
    after_progress: int
    player_diffs: dict[str, dict]
    warnings: list[str] = []

class BackfillApplyResponse(BaseModel):
    success: bool
    applied: list[BackfillApplyResultItem]
    audit_id: int | None = None

@router.post("/backfill/per-person/apply")
async def apply_backfill_per_person(request: BackfillApplyRequest, user: AuthorizedUser) -> BackfillApplyResponse:
    """Admin: Insert missing per-person participants for selected challenges and optionally recalc from activities."""
    check_admin_access(user)
    # get_db_connection() returns a connection, not an async context manager
    conn = await get_db_connection()
    try:
        applied: list[BackfillApplyResultItem] = []
        audit_payload = {"changes": []}
        for challenge_id in request.challenge_ids:
            ch = await conn.fetchrow("SELECT id, title, quarter_id, type, progress_mode, current_progress FROM challenges WHERE id = $1", challenge_id)
            if not ch:
                continue
            warnings: list[str] = []
            if ch["progress_mode"] not in ("per_person", None, "") and ch["progress_mode"] != "per_person":
                warnings.append("Challenge progress_mode is team_total; skipping participant backfill")
                applied.append(BackfillApplyResultItem(
                    challenge_id=ch["id"],
                    title=ch["title"],
                    added_players=[],
                    before_progress=ch["current_progress"] or 0,
                    after_progress=ch["current_progress"] or 0,
                    player_diffs={},
                    warnings=warnings,
                ))
                continue

            before_participants = await conn.fetch("SELECT player_name, contribution FROM challenge_participants WHERE challenge_id = $1", ch["id"])
            before_progress = ch["current_progress"] or 0
            before_map = {r["player_name"]: r["contribution"] for r in before_participants}

            all_players, existing, missing = await _get_challenge_missing_players(conn, ch)
            if request.restrict_players and ch["id"] in request.restrict_players:
                allowed = set(request.restrict_players[ch["id"]])
                missing = [p for p in missing if p in allowed]

            added = []
            for name in missing:
                await conn.execute(
                    "INSERT INTO challenge_participants (challenge_id, player_name, contribution) VALUES ($1, $2, 0) ON CONFLICT (challenge_id, player_name) DO NOTHING",
                    ch["id"], name,
                )
                added.append(name)

            after_progress = before_progress
            player_diffs: dict[str, dict] = {}
            if request.recalc:
                await recalc_challenge_progress(conn, ch["id"])
                after_participants = await conn.fetch("SELECT player_name, contribution FROM challenge_participants WHERE challenge_id = $1", ch["id"])
                after_map = {r["player_name"]: r["contribution"] for r in after_participants}
                for player in sorted(set(list(before_map.keys()) + list(after_map.keys()))):
                    before_val = before_map.get(player, 0)
                    after_val = after_map.get(player, 0)
                    if before_val != after_val:
                        player_diffs[player] = {"before": before_val, "after": after_val}
                refreshed = await conn.fetchrow("SELECT current_progress FROM challenges WHERE id = $1", ch["id"])
                after_progress = refreshed["current_progress"] if refreshed else after_progress

            applied.append(BackfillApplyResultItem(
                challenge_id=ch["id"],
                title=ch["title"],
                added_players=added,
                before_progress=before_progress,
                after_progress=after_progress,
                player_diffs=player_diffs,
                warnings=warnings,
            ))

            audit_payload["changes"].append({
                "challenge_id": ch["id"],
                "added_players": added,
                "recalc": request.recalc,
                "before_progress": before_progress,
                "after_progress": after_progress,
            })

        from app.apis.activities import invalidate_challenges_cache
        invalidate_challenges_cache()

        audit_id = await conn.fetchval(
            "INSERT INTO admin_audit_log (action, details, user_id) VALUES ($1, $2, $3) RETURNING id",
            "backfill_per_person_apply",
            json.dumps(audit_payload),
            user.sub,
        )

        return BackfillApplyResponse(success=True, applied=applied, audit_id=audit_id)
    finally:
        await conn.close()
