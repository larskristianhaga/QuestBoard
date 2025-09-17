


from app.auth import AuthorizedUser
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import asyncpg
import databutton as db
import uuid
from typing import Optional, List

router = APIRouter()

# Fixed list of 12 players
FIXED_PLAYERS = [
    "RIKKE", "SIGGEN", "GARD", "THEA", "ITHY", "EMILIE", 
    "SCHOLZ", "HEFF", "KAREN", "TOBIAS", "ANDREAS", "SONDRE"
]

# Response models
class PlayerSelectionResponse(BaseModel):
    user_id: str
    player_name: str
    selected_at: str

class AvailablePlayersResponse(BaseModel):
    available_players: List[str]
    taken_players: List[str]

class SelectPlayerRequest(BaseModel):
    player_name: str

def convert_user_id_to_uuid(user_id: str) -> uuid.UUID:
    """Convert user_id to UUID format if it's not already"""
    try:
        # Stack Auth provides UUIDs directly, use them as-is
        return uuid.UUID(user_id)
    except ValueError:
        # If it's not a valid UUID, create a deterministic one based on the string
        # This is for legacy compatibility only
        namespace = uuid.NAMESPACE_DNS
        return uuid.uuid5(namespace, user_id)

@router.get("/available-players")
async def get_available_players(user: AuthorizedUser) -> AvailablePlayersResponse:
    """Get list of available and taken players"""
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        # Get all taken players
        taken_players = await conn.fetch(
            "SELECT player_name FROM user_player_mapping ORDER BY player_name"
        )
        taken_list = [row['player_name'] for row in taken_players]
        
        # Calculate available players
        available_list = [p for p in FIXED_PLAYERS if p not in taken_list]
        
        return AvailablePlayersResponse(
            available_players=available_list,
            taken_players=taken_list
        )
    finally:
        await conn.close()

@router.get("/my-player")
async def get_my_player(user: AuthorizedUser) -> Optional[PlayerSelectionResponse]:
    """Get the player selected by the current user"""
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        user_uuid = convert_user_id_to_uuid(user.sub)
        
        mapping = await conn.fetchrow(
            "SELECT user_id, player_name, created_at FROM user_player_mapping WHERE user_id = $1",
            user_uuid
        )
        
        if not mapping:
            return None
            
        return PlayerSelectionResponse(
            user_id=str(mapping['user_id']),
            player_name=mapping['player_name'],
            selected_at=mapping['created_at'].isoformat()
        )
    finally:
        await conn.close()

@router.post("/select-player")
async def select_player(request: SelectPlayerRequest, user: AuthorizedUser) -> PlayerSelectionResponse:
    """Select a player for the current user"""
    if request.player_name not in FIXED_PLAYERS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid player name. Must be one of: {', '.join(FIXED_PLAYERS)}"
        )
    
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        user_uuid = convert_user_id_to_uuid(user.sub)
        
        # Check if player is already taken
        existing = await conn.fetchrow(
            "SELECT user_id FROM user_player_mapping WHERE player_name = $1",
            request.player_name
        )
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Player {request.player_name} is already taken by another user"
            )
        
        # Check if user already has a player selected
        user_existing = await conn.fetchrow(
            "SELECT player_name FROM user_player_mapping WHERE user_id = $1",
            user_uuid
        )
        
        if user_existing:
            # Update existing selection
            mapping = await conn.fetchrow("""
                UPDATE user_player_mapping 
                SET player_name = $1, updated_at = NOW()
                WHERE user_id = $2
                RETURNING user_id, player_name, created_at
            """, request.player_name, user_uuid)
        else:
            # Create new mapping
            mapping = await conn.fetchrow("""
                INSERT INTO user_player_mapping (user_id, player_name)
                VALUES ($1, $2)
                RETURNING user_id, player_name, created_at
            """, user_uuid, request.player_name)
        
        return PlayerSelectionResponse(
            user_id=str(mapping['user_id']),
            player_name=mapping['player_name'],
            selected_at=mapping['created_at'].isoformat()
        )
        
    finally:
        await conn.close()
