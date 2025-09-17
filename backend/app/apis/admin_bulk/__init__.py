

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.auth import AuthorizedUser
from app.apis.booking_competition import get_conn, check_admin

router = APIRouter()

class BulkEnrollRequest(BaseModel):
    competition_id: int
    player_names: List[str]

class BulkEnrollResponse(BaseModel):
    success_count: int
    failed_count: int
    enrolled_players: List[str]
    failed_players: List[str]

@router.post("/bulk-enroll", response_model=BulkEnrollResponse)
async def bulk_enroll_players(body: BulkEnrollRequest, user: AuthorizedUser):
    """Bulk enroll multiple players in a competition (admin only)"""
    check_admin(user)
    
    conn = await get_conn()
    success_players = []
    failed_players = []
    
    try:
        # Verify competition exists
        comp = await conn.fetchrow(
            "SELECT id, name FROM booking_competitions WHERE id = $1",
            body.competition_id
        )
        if not comp:
            raise HTTPException(status_code=404, detail="Competition not found")
        
        print(f"🎯 Bulk enrolling {len(body.player_names)} players in competition '{comp['name']}'")
        
        # Enroll each player
        for player_name in body.player_names:
            try:
                await conn.execute(
                    """
                    INSERT INTO booking_competition_participants (competition_id, player_name)
                    VALUES ($1, $2)
                    ON CONFLICT (competition_id, player_name) DO NOTHING
                    """,
                    body.competition_id, player_name
                )
                success_players.append(player_name)
                print(f"✅ Enrolled {player_name}")
            except Exception as e:
                print(f"❌ Failed to enroll {player_name}: {e}")
                failed_players.append(player_name)
        
        print(f"🎉 Bulk enrollment complete: {len(success_players)} success, {len(failed_players)} failed")
        
        return BulkEnrollResponse(
            success_count=len(success_players),
            failed_count=len(failed_players),
            enrolled_players=success_players,
            failed_players=failed_players
        )
        
    finally:
        await conn.close()
