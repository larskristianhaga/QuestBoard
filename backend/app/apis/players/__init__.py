


from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List
import asyncpg
import databutton as db
from datetime import datetime, date, timedelta

router = APIRouter(prefix="/players")

# The 12 fixed named players for ES Oslo team
NAMED_PLAYERS = [
    "RIKKE", "SIGGEN", "GARD", "THEA", "ITHY", "EMILIE", 
    "SCHOLZ", "HEFF", "KAREN", "TOBIAS", "ANDREAS", "SONDRE"
]

class PlayerProgress(BaseModel):
    id: int
    name: str
    points: int
    goal_points: int
    goal_books: int
    goal_opps: int
    goal_deals: int
    progress_percentage: float
    avatar_state: str  # "damaged", "normal", "boosted", "supercharged"
    position: int  # ranking position based on points
    activities_count: int

class DailyPlayerProgress(BaseModel):
    id: int
    name: str
    daily_points: int
    daily_goal_points: float  # Changed to float to handle fractional daily goals
    progress_percentage: float
    avatar_state: str
    position: int
    activities_count: int
    
class PlayersResponse(BaseModel):
    players: List[PlayerProgress]
    quarter_name: str
    total_players: int

class DailyPlayersResponse(BaseModel):
    players: List[DailyPlayerProgress]
    quarter_name: str
    total_players: int
    workdays_in_quarter: int
    workdays_passed: int
    current_date: str

async def get_db_connection():
    """Get database connection"""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)

async def get_current_quarter():
    """Get the current active quarter"""
    conn = await get_db_connection()
    try:
        quarter = await conn.fetchrow("""
            SELECT id, name FROM quarters 
            WHERE is_active = true
            LIMIT 1
        """)
        return quarter
    finally:
        await conn.close()

async def ensure_named_players(quarter_id: int):
    """Ensure all 12 named players exist in the current quarter"""
    conn = await get_db_connection()
    try:
        for i, player_name in enumerate(NAMED_PLAYERS):
            # Check if player exists by name for this quarter (avoid UUID issues)
            existing = await conn.fetchval("""
                SELECT id FROM profiles 
                WHERE name = $1 AND quarter_id = $2
            """, player_name, quarter_id)
            
            if not existing:
                # Use deterministic UUID based on player name
                import uuid
                namespace = uuid.NAMESPACE_DNS
                player_uuid = uuid.uuid5(namespace, f"es-oslo-{player_name.lower()}")
                
                # Create player with default goals
                await conn.execute("""
                    INSERT INTO profiles (user_id, quarter_id, name, points, goal_books, goal_opps, goal_deals)
                    VALUES ($1, $2, $3, 0, 10, 5, 2)
                """, player_uuid, quarter_id, player_name)
                print(f"Created player {player_name} for quarter {quarter_id}")
                
    finally:
        await conn.close()

def calculate_avatar_state(progress_percentage: float) -> str:
    """Calculate avatar state based on goal completion percentage"""
    if progress_percentage >= 100:
        return "supercharged"
    elif progress_percentage >= 70:
        return "boosted"
    elif progress_percentage >= 30:
        return "normal"
    else:
        return "damaged"

def calculate_workdays_in_quarter(start_date: date, end_date: date) -> int:
    """Calculate number of workdays (Monday-Friday) in a quarter"""
    workdays = 0
    current = start_date
    while current <= end_date:
        # Monday = 0, Sunday = 6
        if current.weekday() < 5:  # Monday to Friday
            workdays += 1
        current = current + timedelta(days=1)
    return workdays

def calculate_workdays_passed(start_date: date, current_date: date) -> int:
    """Calculate number of workdays passed from start of quarter to current date"""
    if current_date < start_date:
        return 0
    
    workdays = 0
    current = start_date
    while current < current_date:  # Not including today
        if current.weekday() < 5:  # Monday to Friday
            workdays += 1
        current = current + timedelta(days=1)
    return workdays

@router.get("/daily-progress", response_model=DailyPlayersResponse)
async def get_players_daily_progress():
    """
    Get daily progress for all 12 named players with workday-based daily goals
    """
    try:
        # Get current quarter
        quarter = await get_current_quarter()
        if not quarter:
            raise HTTPException(status_code=400, detail="No active quarter found")
            
        # Ensure all named players exist
        await ensure_named_players(quarter['id'])
        
        conn = await get_db_connection()
        try:
            # Get quarter details for workday calculations
            quarter_details = await conn.fetchrow("""
                SELECT start_date, end_date 
                FROM quarters 
                WHERE id = $1
            """, quarter['id'])
            
            if not quarter_details:
                raise HTTPException(status_code=400, detail="Quarter details not found")
            
            # Calculate workdays
            start_date = quarter_details['start_date']
            end_date = quarter_details['end_date']
            today = date.today()
            
            workdays_in_quarter = calculate_workdays_in_quarter(start_date, end_date)
            workdays_passed = calculate_workdays_passed(start_date, today)
            
            # Get today's activities and quarter goals for all players
            players_data = await conn.fetch("""
                SELECT 
                    p.id,
                    p.name,
                    p.goal_books,
                    p.goal_opps,
                    p.goal_deals,
                    COALESCE(SUM(CASE WHEN DATE(a.created_at) = $2 THEN a.points ELSE 0 END), 0) as daily_points,
                    COALESCE(COUNT(CASE WHEN DATE(a.created_at) = $2 THEN a.id ELSE NULL END), 0) as daily_activities_count
                FROM profiles p
                LEFT JOIN activities a ON p.id = a.profile_id
                WHERE p.quarter_id = $1
                GROUP BY p.id, p.name, p.goal_books, p.goal_opps, p.goal_deals
                ORDER BY daily_points DESC, p.name
            """, quarter['id'], today)
            
            players = []
            for i, player_data in enumerate(players_data):
                # Calculate quarter goal points (Books=1, Opps=2, Deals=5)
                quarter_goal_points = (
                    player_data['goal_books'] * 1 + 
                    player_data['goal_opps'] * 2 + 
                    player_data['goal_deals'] * 5
                )
                
                # Calculate daily goal points (quarter goal / workdays)
                daily_goal_points = (
                    round(quarter_goal_points / workdays_in_quarter, 1) 
                    if workdays_in_quarter > 0 else 0
                )
                
                # Calculate daily progress percentage
                daily_points = player_data['daily_points']
                progress_percentage = (
                    (daily_points / daily_goal_points * 100) 
                    if daily_goal_points > 0 else 0
                )
                
                # Determine avatar state based on daily progress
                avatar_state = calculate_avatar_state(progress_percentage)
                
                player = DailyPlayerProgress(
                    id=player_data['id'],
                    name=player_data['name'],
                    daily_points=daily_points,
                    daily_goal_points=daily_goal_points,
                    progress_percentage=min(progress_percentage, 999),  # Cap at 999% for display
                    avatar_state=avatar_state,
                    position=i + 1,  # Position based on daily points (already ordered DESC)
                    activities_count=player_data['daily_activities_count']
                )
                players.append(player)
            
            return DailyPlayersResponse(
                players=players,
                quarter_name=quarter['name'],
                total_players=len(players),
                workdays_in_quarter=workdays_in_quarter,
                workdays_passed=workdays_passed,
                current_date=today.isoformat()
            )
            
        finally:
            await conn.close()
            
    except Exception as e:
        print(f"Error getting daily players progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get daily players progress")

@router.get("/progress", response_model=PlayersResponse)
async def get_players_progress():
    """
    Get progress for all 12 named players with avatar states and rankings
    """
    try:
        # Get current quarter
        quarter = await get_current_quarter()
        if not quarter:
            raise HTTPException(status_code=400, detail="No active quarter found")
            
        # Ensure all named players exist
        await ensure_named_players(quarter['id'])
        
        conn = await get_db_connection()
        try:
            # Get all players with their stats
            players_data = await conn.fetch("""
                SELECT 
                    p.id,
                    p.name,
                    p.points,
                    p.goal_books,
                    p.goal_opps,
                    p.goal_deals,
                    COALESCE(COUNT(a.id), 0) as activities_count
                FROM profiles p
                LEFT JOIN activities a ON p.id = a.profile_id
                WHERE p.quarter_id = $1
                GROUP BY p.id, p.name, p.points, p.goal_books, p.goal_opps, p.goal_deals
                ORDER BY p.points DESC, p.name
            """, quarter['id'])
            
            players = []
            for i, player_data in enumerate(players_data):
                # Calculate goal points (Books=1, Opps=2, Deals=5)
                goal_points = (
                    player_data['goal_books'] * 1 + 
                    player_data['goal_opps'] * 2 + 
                    player_data['goal_deals'] * 5
                )
                
                # Calculate progress percentage
                progress_percentage = (player_data['points'] / goal_points * 100) if goal_points > 0 else 0
                
                # Determine avatar state
                avatar_state = calculate_avatar_state(progress_percentage)
                
                player = PlayerProgress(
                    id=player_data['id'],
                    name=player_data['name'],
                    points=player_data['points'],
                    goal_points=goal_points,
                    goal_books=player_data['goal_books'],
                    goal_opps=player_data['goal_opps'],
                    goal_deals=player_data['goal_deals'],
                    progress_percentage=min(progress_percentage, 999),  # Cap at 999% for display
                    avatar_state=avatar_state,
                    position=i + 1,  # Position based on points (already ordered DESC)
                    activities_count=player_data['activities_count']
                )
                players.append(player)
            
            return PlayersResponse(
                players=players,
                quarter_name=quarter['name'],
                total_players=len(players)
            )
            
        finally:
            await conn.close()
            
    except Exception as e:
        print(f"Error getting players progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get players progress")

@router.get("/leaderboard")
async def get_leaderboard(period: str = "daily", response: Response = None) -> dict:
    """
    Get simplified leaderboard data for quick display
    Args:
        period: 'daily' for today's points, 'quarter' for total quarter points
    """
    # Set cache control headers
    if response:
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-API-Version"] = "1.0"
    
    try:
        # Get current quarter
        quarter = await get_current_quarter()
        if not quarter:
            return {
                "data": {
                    "leaderboard": [],
                    "quarter": "No Quarter",
                    "period": period,
                    "period_label": "Today's Points" if period == "daily" else "Quarter Total"
                },
                "error": "No active quarter found"
            }
            
        # Ensure all named players exist
        await ensure_named_players(quarter['id'])
        
        conn = await get_db_connection()
        try:
            if period == "daily":
                # Get today's points only
                from datetime import date
                today = date.today()
                
                top_players = await conn.fetch("""
                    SELECT p.name, COALESCE(SUM(a.points), 0) as points
                    FROM profiles p
                    LEFT JOIN activities a ON p.id = a.profile_id 
                        AND DATE(a.created_at) = $2
                    WHERE p.quarter_id = $1 
                    GROUP BY p.name
                    ORDER BY COALESCE(SUM(a.points), 0) DESC, p.name
                    LIMIT 12
                """, quarter['id'], today)
                
                period_label = "Today's Points"
            else:
                # Get quarter total points (existing logic)
                top_players = await conn.fetch("""
                    SELECT name, SUM(points) as points
                    FROM profiles 
                    WHERE quarter_id = $1 
                    GROUP BY name
                    ORDER BY SUM(points) DESC, name
                    LIMIT 12
                """, quarter['id'])
                
                period_label = "Quarter Total"
            
            return {
                "data": {
                    "leaderboard": [
                        {"name": player['name'], "points": player['points'], "rank": i + 1}
                        for i, player in enumerate(top_players or [])
                    ],
                    "quarter": quarter['name'],
                    "period": period,
                    "period_label": period_label
                }
            }
        finally:
            await conn.close()
            
    except Exception as e:
        print(f"Error getting leaderboard: {str(e)}")
        # Always return safe response instead of raising
        return {
            "data": {
                "leaderboard": [],
                "quarter": "Error",
                "period": period,
                "period_label": "Today's Points" if period == "daily" else "Quarter Total"
            },
            "error": "Service temporarily unavailable"
        }
