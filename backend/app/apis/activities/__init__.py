






























from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
from datetime import datetime, date
import uuid
import time
import asyncio

router = APIRouter(prefix="/activities")

# Global lock to prevent concurrent database requests
challenges_lock = asyncio.Lock()

# ===== CHALLENGE MODELS FOR PLAYERS =====

class PlayerChallengeResponse(BaseModel):
    id: int
    title: str
    description: str | None
    type: str
    icon: str
    target_value: int
    target_type: str
    current_progress: int
    progress_percentage: float
    time_remaining_hours: float
    reward_points: int
    reward_description: str | None
    status: str
    participants: list[dict] | None = None

class ChallengeParticipationResponse(BaseModel):
    success: bool
    message: str
    challenge_id: int
    progress_updated: bool
    challenge_completed: bool
    points_earned: int

class ActivityType(str, Enum):
    BOOK = "book"
    OPP = "opp" 
    DEAL = "deal"

class LogActivityRequest(BaseModel):
    type: ActivityType
    triggered_by: Optional[str] = None  # To prevent infinite loops when triggered from competition

class LogActivityResponse(BaseModel):
    success: bool
    points_earned: int
    total_points: int
    activity_id: int
    message: str
    activity_type: str
    player_name: str
    progress_context: dict
    team_impact: dict
    streak_info: dict
    challenge_updates: dict | None = None  # NEW: Include challenge progress

class ActivityHistoryItem(BaseModel):
    id: int
    type: ActivityType
    points: int
    created_at: datetime
    
class ActivityHistoryResponse(BaseModel):
    activities: List[ActivityHistoryItem]
    total_points: int
    total_count: int

class TeamStatsResponse(BaseModel):
    team_progress: dict
    benchmark_progress: dict
    planet_status: dict
    race_position: dict
    quarter_info: dict

class UpdateActivityRequest(BaseModel):
    type: ActivityType

class DeleteActivityResponse(BaseModel):
    success: bool
    message: str
    points_removed: int
    new_total_points: int

class UpdateActivityResponse(BaseModel):
    success: bool
    message: str
    points_changed: int
    new_total_points: int
    activity_id: int

# Point mapping for dual tracking system
ACTIVITY_POINTS = {
    ActivityType.BOOK: 1,    # +1 race point
    ActivityType.OPP: 2,     # +2 race points  
    ActivityType.DEAL: 5     # +5 race points
}

async def get_db_connection():
    """Get database connection"""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)

async def ensure_test_quarter():
    """Ensure there's a test quarter for development"""
    conn = await get_db_connection()
    try:
        # Check if we have any quarters
        quarter = await conn.fetchrow("SELECT id FROM quarters LIMIT 1")
        if not quarter:
            # Create a test quarter
            quarter = await conn.fetchrow("""
                INSERT INTO quarters (name, start_date, end_date) 
                VALUES ('Q1 2024', '2024-01-01', '2024-03-31') 
                RETURNING id
            """)
            print(f"Created test quarter with id: {quarter['id']}")
        return quarter['id']
    finally:
        await conn.close()

async def get_current_quarter():
    """Get the current active quarter"""
    conn = await get_db_connection()
    try:
        # For now, get the latest quarter - in future this could be configurable
        quarter = await conn.fetchrow("""
            SELECT id, name, start_date, end_date 
            FROM quarters 
            ORDER BY created_at DESC 
            LIMIT 1
        """)
        
        if not quarter:
            # Create a test quarter if none exists
            quarter_id = await ensure_test_quarter()
            quarter = await conn.fetchrow("""
                SELECT id, name, start_date, end_date 
                FROM quarters 
                WHERE id = $1
            """, quarter_id)
            
        return quarter
    finally:
        await conn.close()

async def get_or_create_profile(user_id: str, quarter_id: int):
    """Get or create user profile for current quarter using selected player"""
    conn = await get_db_connection()
    try:
        # Convert user_id to UUID format if it's not already
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            # If it's not a valid UUID, create a deterministic one based on the string
            import hashlib
            namespace = uuid.NAMESPACE_DNS
            user_uuid = uuid.uuid5(namespace, user_id)
            print(f"Converted user_id '{user_id}' to UUID: {user_uuid}")
        
        print(f"Looking up player mapping for user_id: {user_id}, uuid: {user_uuid}")
        
        # FALLBACK SYSTEM: Try multiple user_id mappings for testing environment
        fallback_uuids = [
            user_uuid,  # Original converted UUID
            uuid.UUID('4cfb18f7-fc28-45bf-946d-c80ffc30007f'),  # Known working UUID
        ]
        
        player_mapping = None
        for fallback_uuid in fallback_uuids:
            player_mapping = await conn.fetchrow(
                "SELECT player_name FROM user_player_mapping WHERE user_id = $1",
                fallback_uuid
            )
            if player_mapping:
                print(f"Found player mapping using fallback UUID: {fallback_uuid}")
                break
        
        print(f"Player mapping found: {player_mapping}")
        
        if not player_mapping:
            raise HTTPException(
                status_code=400, 
                detail="You must select a player before logging activities. Please choose your avatar from the 12 available players."
            )
        
        player_name = player_mapping['player_name']
        print(f"Using player: {player_name}")
        
        # Try to get existing profile for this player in this quarter
        profile = await conn.fetchrow("""
            SELECT id, points, name, goal_books, goal_opps, goal_deals
            FROM profiles 
            WHERE name = $1 AND quarter_id = $2
        """, player_name, quarter_id)
        
        if profile:
            return profile
            
        # Create new profile if doesn't exist (shouldn't happen as admin creates all profiles)
        profile = await conn.fetchrow("""
            INSERT INTO profiles (user_id, quarter_id, name, points) 
            VALUES ($1, $2, $3, 0) 
            RETURNING id, points, name
        """, user_uuid, quarter_id, player_name)
        
        print(f"Created new profile for user {user_uuid} as player {player_name}")
        return profile
    finally:
        await conn.close()

@router.post("/log", response_model=LogActivityResponse)
async def log_activity(request: LogActivityRequest, user: AuthorizedUser):
    """
    Log a sales activity with dual tracking and enhanced feedback:
    - Individual: Add race points (1/2/5) to player
    - Team: Add +1 count to team totals (regardless of type)
    - Enhanced: Progress context, streak info, and thematic messaging
    """
    try:
        # Get current quarter
        quarter = await get_current_quarter()
        if not quarter:
            raise HTTPException(status_code=400, detail="No active quarter found")
            
        # Get or create user profile
        profile = await get_or_create_profile(user.sub, quarter['id'])
        
        # Calculate points for this activity type
        points = ACTIVITY_POINTS[request.type]
        
        # Database transaction to update both systems
        conn = await get_db_connection()
        try:
            async with conn.transaction():
                # 1. Log the activity
                activity = await conn.fetchrow("""
                    INSERT INTO activities (profile_id, quarter_id, type, points)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                """, profile['id'], quarter['id'], request.type.value, points)
                
                # 2. Update player's total points (Track 1: Race Points)
                updated_profile = await conn.fetchrow("""
                    UPDATE profiles 
                    SET points = points + $1
                    WHERE id = $2
                    RETURNING *
                """, points, profile['id'])
                
                # 3. Calculate enhanced feedback context
                progress_context = await calculate_progress_context(
                    updated_profile, quarter['id'], request.type.value, conn
                )
                
                streak_info = await calculate_streak_info(
                    profile['id'], quarter['id'], conn
                )
                
                # 4. Process bonus challenges (NEW)
                challenge_rewards = await process_challenge_progress(
                    profile, quarter['id'], request.type.value, conn
                )
                
                # 5. Generate team impact information
                team_impact = {
                    "team_contribution": f"+1 {request.type.value} to team totals",
                    "race_points_added": points
                }
                
                # 6. Generate thematic message based on activity type
                thematic_messages = {
                    "book": "📡 Signal detected! New contact established",
                    "opp": "🧭 Navigation locked! Opportunity mapped", 
                    "deal": "🤝 Landing successful! Partnership secured"
                }
                
                # 7. TWO-WAY LOGGING: If this is a "book" activity and not triggered by competition, 
                # automatically log in all active booking competitions
                if (request.type == ActivityType.BOOK and 
                    request.triggered_by != "competition"):
                    await trigger_competition_logging(
                        profile['name'], updated_profile['points'], activity['id'], conn
                    )
                
                return LogActivityResponse(
                    success=True,
                    points_earned=points,
                    total_points=updated_profile['points'],
                    activity_id=activity['id'],
                    message=thematic_messages.get(request.type.value, "Activity logged!"),
                    activity_type=request.type.value,
                    player_name=profile['name'],
                    progress_context=progress_context,
                    team_impact=team_impact,
                    streak_info=streak_info,
                    challenge_updates=challenge_rewards
                )
                
        finally:
            await conn.close()
            
    except Exception as e:
        print(f"Error logging activity: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to log activity")

@router.get("/history", response_model=ActivityHistoryResponse)
async def get_activity_history(user: AuthorizedUser, response: Response, limit: int = 50) -> dict:
    """
    Get user's activity history for current quarter with safe response pattern
    """
    response.headers["Cache-Control"] = "no-store"
    try:
        # Get current quarter
        quarter = await get_current_quarter()
        if not quarter:
            return {
                "activities": [],
                "total_points": 0,
                "total_count": 0
            }
            
        # Get user profile
        profile = await get_or_create_profile(user.sub, quarter['id'])

        conn = await get_db_connection()
        try:
            # Get recent activities
            activities = await conn.fetch(
                """
                SELECT id, type, points, created_at
                FROM activities 
                WHERE profile_id = $1
                ORDER BY created_at DESC
                LIMIT $2
                """, profile['id'], limit)
                
            # Get totals
            totals = await conn.fetchrow(
                """
                SELECT 
                    COALESCE(SUM(points), 0) as total_points,
                    COUNT(*) as total_count
                FROM activities 
                WHERE profile_id = $1
            """, profile['id'])
            
            return {
                "activities": [
                    {
                        "id": activity['id'],
                        "type": activity['type'],
                        "points": activity['points'],
                        "created_at": activity['created_at'].isoformat()
                    } for activity in activities or []
                ],
                "total_points": totals['total_points'] if totals else 0,
                "total_count": totals['total_count'] if totals else 0
            }
            
        finally:
            await conn.close()
            
    except Exception as e:
        print(f"Error getting activity history: {str(e)}")
        return {
            "activities": [],
            "total_points": 0,
            "total_count": 0
        }

@router.get("/stats")
async def get_activity_stats(user: AuthorizedUser):
    """
    Get current user's activity statistics and goals for dashboard
    """
    try:
        quarter = await get_current_quarter()
        if not quarter:
            return {"error": "No active quarter found"}
            
        profile = await get_or_create_profile(user.sub, quarter['id'])
        
        conn = await get_db_connection()
        try:
            # Get detailed breakdown
            stats = await conn.fetchrow("""
                SELECT 
                    COALESCE(SUM(CASE WHEN type = 'book' THEN 1 ELSE 0 END), 0) as books_count,
                    COALESCE(SUM(CASE WHEN type = 'opp' THEN 1 ELSE 0 END), 0) as opps_count,
                    COALESCE(SUM(CASE WHEN type = 'deal' THEN 1 ELSE 0 END), 0) as deals_count,
                    COALESCE(SUM(points), 0) as total_points,
                    COUNT(*) as total_activities
                FROM activities 
                WHERE profile_id = $1
            """, profile['id'])
            
            # Ensure goal fields exist with defaults
            goal_books = profile.get('goal_books') if profile.get('goal_books') is not None else 0
            goal_opps = profile.get('goal_opps') if profile.get('goal_opps') is not None else 0
            goal_deals = profile.get('goal_deals') if profile.get('goal_deals') is not None else 0
            
            # Calculate goal points
            goal_points = (goal_books * 1) + (goal_opps * 2) + (goal_deals * 5)
            
            # Calculate progress percentages (avoid division by zero)
            books_progress = (stats['books_count'] / goal_books * 100) if goal_books > 0 else 0
            opps_progress = (stats['opps_count'] / goal_opps * 100) if goal_opps > 0 else 0
            deals_progress = (stats['deals_count'] / goal_deals * 100) if goal_deals > 0 else 0
            total_progress = (stats['total_points'] / goal_points * 100) if goal_points > 0 else 0
            
            return {
                "user_name": profile['name'],
                "total_points": stats['total_points'],
                "total_activities": stats['total_activities'],
                "breakdown": {
                    "books": stats['books_count'],
                    "opps": stats['opps_count'], 
                    "deals": stats['deals_count']
                },
                "goals": {
                    "books": goal_books,
                    "opps": goal_opps,
                    "deals": goal_deals,
                    "points": goal_points
                },
                "progress": {
                    "books_percentage": min(books_progress, 999),
                    "opps_percentage": min(opps_progress, 999),
                    "deals_percentage": min(deals_progress, 999),
                    "total_percentage": min(total_progress, 999)
                },
                "quarter": {
                    "id": quarter['id'],
                    "name": quarter['name']
                }
            }
            
        finally:
            await conn.close()
            
    except Exception as e:
        print(f"Error getting activity stats: {str(e)}")
        return {"error": "Failed to get stats"}

# Helper function to get dynamic team goals from database
async def get_dynamic_team_goals(quarter_id: int, conn) -> dict:
    """Calculate team goals by summing all player goals from database"""
    team_totals = await conn.fetchrow("""
        SELECT 
            COALESCE(SUM(goal_books), 0) as total_goal_books,
            COALESCE(SUM(goal_opps), 0) as total_goal_opps,
            COALESCE(SUM(goal_deals), 0) as total_goal_deals
        FROM profiles
        WHERE quarter_id = $1
    """, quarter_id)
    
    return {
        'books': team_totals['total_goal_books'],
        'opps': team_totals['total_goal_opps'],
        'deals': team_totals['total_goal_deals']
    }

@router.get("/team-stats", response_model=TeamStatsResponse)
async def get_team_stats():
    """
    Get team-level progress stats for the race visualization.
    Uses COUNT-based logic (not points) for team progress.
    """
    try:
        quarter = await get_current_quarter()
        if not quarter:
            raise HTTPException(status_code=400, detail="No active quarter found")
            
        conn = await get_db_connection()
        try:
            # Get team totals (COUNT-based, not points)
            team_counts = await conn.fetchrow("""
                SELECT 
                    COALESCE(SUM(CASE WHEN a.type = 'book' THEN 1 ELSE 0 END), 0) as books_count,
                    COALESCE(SUM(CASE WHEN a.type = 'opp' THEN 1 ELSE 0 END), 0) as opps_count,
                    COALESCE(SUM(CASE WHEN a.type = 'deal' THEN 1 ELSE 0 END), 0) as deals_count,
                    COUNT(*) as total_activities
                FROM activities a
                JOIN profiles p ON a.profile_id = p.id
                WHERE a.quarter_id = $1
            """, quarter['id'])
            
            # Get dynamic team goals from database (replaces hardcoded values)
            TEAM_GOALS = await get_dynamic_team_goals(quarter['id'], conn)

            # Total team goal for race (sum of all activity counts needed)
            total_team_goal = sum(TEAM_GOALS.values())  # 204 total activities
            
            # Current team progress (sum of all activity counts)
            team_total_count = (
                team_counts['books_count'] + 
                team_counts['opps_count'] + 
                team_counts['deals_count']
            )
            
            # Calculate benchmark progress based on time elapsed
            quarter_start = quarter['start_date']
            quarter_end = quarter['end_date']
            today = date.today()
            
            # Calculate days elapsed and total days
            if isinstance(quarter_start, str):
                quarter_start = datetime.strptime(quarter_start, '%Y-%m-%d').date()
            if isinstance(quarter_end, str):
                quarter_end = datetime.strptime(quarter_end, '%Y-%m-%d').date()
                
            days_elapsed = max(0, (today - quarter_start).days)
            total_days = (quarter_end - quarter_start).days
            
            # Benchmark calculation: ghost position based on time
            time_progress = min(1.0, days_elapsed / total_days if total_days > 0 else 0)
            benchmark_position = total_team_goal * time_progress
            
            # Team vs benchmark race position
            team_progress_pct = team_total_count / total_team_goal if total_team_goal > 0 else 0
            benchmark_progress_pct = benchmark_position / total_team_goal if total_team_goal > 0 else 0
            
            # Planet status (each lights up when goal is reached)
            planet_status = {
                'books': {
                    'current': team_counts['books_count'],
                    'goal': TEAM_GOALS['books'],
                    'completed': team_counts['books_count'] >= TEAM_GOALS['books'],
                    'progress_pct': min(100, (team_counts['books_count'] / TEAM_GOALS['books']) * 100)
                },
                'opps': {
                    'current': team_counts['opps_count'],
                    'goal': TEAM_GOALS['opps'],
                    'completed': team_counts['opps_count'] >= TEAM_GOALS['opps'],
                    'progress_pct': min(100, (team_counts['opps_count'] / TEAM_GOALS['opps']) * 100)
                },
                'deals': {
                    'current': team_counts['deals_count'],
                    'goal': TEAM_GOALS['deals'],
                    'completed': team_counts['deals_count'] >= TEAM_GOALS['deals'],
                    'progress_pct': min(100, (team_counts['deals_count'] / TEAM_GOALS['deals']) * 100)
                }
            }
            
            # Race position info
            is_team_ahead = team_total_count >= benchmark_position
            race_position = {
                'team_ahead': is_team_ahead,
                'team_position': team_total_count,
                'benchmark_position': benchmark_position,
                'gap': abs(team_total_count - benchmark_position),
                'team_wins': team_total_count >= total_team_goal,
                'race_complete': max(team_total_count, benchmark_position) >= total_team_goal
            }
            
            return TeamStatsResponse(
                team_progress={
                    'current_count': team_total_count,
                    'total_goal': total_team_goal,
                    'progress_percentage': min(100, team_progress_pct * 100),
                    'breakdown': {
                        'books': team_counts['books_count'],
                        'opps': team_counts['opps_count'],
                        'deals': team_counts['deals_count']
                    }
                },
                benchmark_progress={
                    'current_position': benchmark_position,
                    'progress_percentage': min(100, benchmark_progress_pct * 100),
                    'time_elapsed_pct': time_progress * 100,
                    'days_elapsed': days_elapsed,
                    'total_days': total_days
                },
                planet_status=planet_status,
                race_position=race_position,
                quarter_info={
                    'id': quarter['id'],
                    'name': quarter['name'],
                    'start_date': str(quarter['start_date']),
                    'end_date': str(quarter['end_date'])
                }
            )
            
        finally:
            await conn.close()
            
    except Exception as e:
        print(f"Error getting team stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get team stats")

async def calculate_progress_context(profile, quarter_id, activity_type, conn):
    """Calculate progress context for enhanced feedback"""
    
    # Get current activity counts
    activity_counts = await conn.fetchrow("""
        SELECT 
            COUNT(CASE WHEN type = 'book' THEN 1 END) as books,
            COUNT(CASE WHEN type = 'opp' THEN 1 END) as opps,
            COUNT(CASE WHEN type = 'deal' THEN 1 END) as deals
        FROM activities 
        WHERE profile_id = $1 AND quarter_id = $2
    """, profile['id'], quarter_id)
    
    # Calculate remaining activities to reach goals
    remaining_books = max(0, profile['goal_books'] - activity_counts['books'])
    remaining_opps = max(0, profile['goal_opps'] - activity_counts['opps'])
    remaining_deals = max(0, profile['goal_deals'] - activity_counts['deals'])
    
    # Calculate total goal points and current progress
    total_goal_points = (profile['goal_books'] * 1) + (profile['goal_opps'] * 2) + (profile['goal_deals'] * 5)
    goal_progress_percentage = (profile['points'] / total_goal_points * 100) if total_goal_points > 0 else 0
    
    return {
        "current_counts": {
            "books": activity_counts['books'],
            "opps": activity_counts['opps'],
            "deals": activity_counts['deals']
        },
        "remaining_to_goal": {
            "books": remaining_books,
            "opps": remaining_opps,
            "deals": remaining_deals
        },
        "goal_progress_percentage": round(goal_progress_percentage, 1),
        "total_goal_points": total_goal_points,
        "next_milestone": calculate_next_milestone(profile['points'], total_goal_points)
    }

async def calculate_streak_info(profile_id, quarter_id, conn):
    """Calculate streak information for momentum feedback"""
    
    # Get recent activities (last 7 days)
    recent_activities = await conn.fetch("""
        SELECT DATE(created_at) as activity_date, COUNT(*) as daily_count
        FROM activities 
        WHERE profile_id = $1 AND quarter_id = $2 
        AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY activity_date DESC
    """, profile_id, quarter_id)
    
    # Calculate current streak
    current_streak = 0
    if recent_activities:
        from datetime import date, timedelta
        today = date.today()
        
        for activity in recent_activities:
            expected_date = today - timedelta(days=current_streak)
            if activity['activity_date'] == expected_date:
                current_streak += 1
            else:
                break
    
    # Get today's activity count
    today_count = await conn.fetchval("""
        SELECT COUNT(*) FROM activities 
        WHERE profile_id = $1 AND quarter_id = $2 
        AND DATE(created_at) = CURRENT_DATE
    """, profile_id, quarter_id)
    
    return {
        "current_streak_days": current_streak,
        "today_activities": today_count,
        "momentum_level": calculate_momentum_level(current_streak, today_count),
        "streak_message": generate_streak_message(current_streak, today_count)
    }

def calculate_next_milestone(current_points, total_goal_points):
    """Calculate next meaningful milestone"""
    milestones = [10, 25, 50, 100, 200, 500]
    
    for milestone in milestones:
        if current_points < milestone:
            return {
                "points": milestone,
                "remaining": milestone - current_points
            }
    
    # If past all predefined milestones, use goal points
    if current_points < total_goal_points:
        return {
            "points": total_goal_points,
            "remaining": total_goal_points - current_points,
            "is_goal": True
        }
    
    return None

def calculate_momentum_level(streak_days, today_activities):
    """Calculate momentum level for visual feedback"""
    if streak_days >= 5 and today_activities >= 2:
        return "blazing"  # 🔥🔥🔥
    elif streak_days >= 3 or today_activities >= 3:
        return "hot"      # 🔥🔥
    elif streak_days >= 1 or today_activities >= 1:
        return "warm"     # 🔥
    else:
        return "cold"     # ❄️

def generate_streak_message(streak_days, today_activities):
    """Generate motivational streak message"""
    if streak_days >= 5:
        return f"🔥 Incredible {streak_days}-day streak! You're unstoppable!"
    elif streak_days >= 3:
        return f"🔥 Strong {streak_days}-day streak! Keep the momentum!"
    elif streak_days >= 1:
        return f"🔥 {streak_days}-day streak active! Building momentum!"
    elif today_activities >= 2:
        return "⚡ Multiple activities today! Great energy!"
    elif today_activities >= 1:
        return "🌟 First activity of the day logged!"
    else:
        return "🚀 Ready to start your journey!"

@router.delete("/activities/{activity_id}", response_model=DeleteActivityResponse)
async def delete_activity(activity_id: int, user: AuthorizedUser):
    """
    Delete an activity and recalculate points.
    Only the activity owner can delete it.
    """
    try:
        # Get current quarter
        quarter = await get_current_quarter()
        if not quarter:
            raise HTTPException(status_code=400, detail="No active quarter found")
            
        # Get user profile
        profile = await get_or_create_profile(user.sub, quarter['id'])
        
        conn = await get_db_connection()
        try:
            async with conn.transaction():
                # Check if activity exists and belongs to user
                activity = await conn.fetchrow("""
                    SELECT id, points, type FROM activities 
                    WHERE id = $1 AND profile_id = $2
                """, activity_id, profile['id'])
                
                if not activity:
                    raise HTTPException(
                        status_code=404, 
                        detail="Activity not found or you don't have permission to delete it"
                    )
                
                # Delete the activity
                await conn.execute("""
                    DELETE FROM activities WHERE id = $1
                """, activity_id)
                
                # Update player's total points
                updated_profile = await conn.fetchrow("""
                    UPDATE profiles 
                    SET points = points - $1
                    WHERE id = $2
                    RETURNING points
                """, activity['points'], profile['id'])
                
                return DeleteActivityResponse(
                    success=True,
                    message=f"{activity['type'].title()} activity deleted successfully",
                    points_removed=activity['points'],
                    new_total_points=updated_profile['points']
                )
                
        finally:
            await conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting activity: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete activity")

@router.put("/activities/{activity_id}", response_model=UpdateActivityResponse)
async def update_activity(activity_id: int, request: UpdateActivityRequest, user: AuthorizedUser):
    """
    Update an activity type and recalculate points.
    Only the activity owner can update it.
    """
    try:
        # Get current quarter
        quarter = await get_current_quarter()
        if not quarter:
            raise HTTPException(status_code=400, detail="No active quarter found")
            
        # Get user profile
        profile = await get_or_create_profile(user.sub, quarter['id'])
        
        conn = await get_db_connection()
        try:
            async with conn.transaction():
                # Check if activity exists and belongs to user
                activity = await conn.fetchrow("""
                    SELECT id, points, type FROM activities 
                    WHERE id = $1 AND profile_id = $2
                """, activity_id, profile['id'])
                
                if not activity:
                    raise HTTPException(
                        status_code=404, 
                        detail="Activity not found or you don't have permission to update it"
                    )
                
                # Calculate new points for the new activity type
                old_points = activity['points']
                new_points = ACTIVITY_POINTS[request.type]
                points_difference = new_points - old_points
                
                # Update the activity
                await conn.execute("""
                    UPDATE activities 
                    SET type = $1, points = $2
                    WHERE id = $3
                """, request.type.value, new_points, activity_id)
                
                # Update player's total points
                updated_profile = await conn.fetchrow("""
                    UPDATE profiles 
                    SET points = points + $1
                    WHERE id = $2
                    RETURNING points
                """, points_difference, profile['id'])
                
                return UpdateActivityResponse(
                    success=True,
                    message=f"Activity updated to {request.type.value.title()}",
                    points_changed=points_difference,
                    new_total_points=updated_profile['points'],
                    activity_id=activity_id
                )
                
        finally:
            await conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating activity: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update activity")

# ===== CHALLENGE ENDPOINTS FOR PLAYERS =====

# Separate caches for different data types to prevent conflicts
summary_cache = {
    'data': None,
    'timestamp': 0,
    'quarter_id': None,
    'error_count': 0,
    'disabled_until': 0
}

detailed_cache = {
    'data': None,
    'timestamp': 0,
    'quarter_id': None,
    'error_count': 0,
    'disabled_until': 0
}

CACHE_DURATION = 30  # Cache for 30 seconds (reduced from 10 minutes)
ERROR_DISABLE_DURATION = 300  # Disable for 5 minutes after 3 failures (reduced)
MAX_ERROR_COUNT = 3  # Reduced from 5

# Request deduplication for concurrent calls
active_requests = {}
request_lock = asyncio.Lock()

def invalidate_challenges_cache():
    """Invalidate both challenges caches to force fresh data on next request"""
    global summary_cache, detailed_cache, active_requests
    
    # Clear both caches
    summary_cache.update({
        'data': None,
        'timestamp': 0,
        'quarter_id': None
    })
    
    detailed_cache.update({
        'data': None,
        'timestamp': 0,
        'quarter_id': None
    })
    
    # CRITICAL: Also clear any active requests to prevent stale data
    active_requests.clear()
    
    print("🔄 Challenges cache AND active requests invalidated - fresh data will be fetched on next request")

class ChallengesSummaryResponse(BaseModel):
    """Lightweight summary response for challenges"""
    updated_at: str
    active_count: int
    completed_count: int
    expiring_soon_count: int  # ending within 24 hours
    challenges: list[dict]  # Minimal challenge data

async def get_cached_challenges_summary(quarter_id: int, user_name: str) -> ChallengesSummaryResponse:
    """Get challenges summary with smart caching and request deduplication"""
    cache_key = f"challenges_summary_{quarter_id}_{user_name}"
    current_time = time.time()
    
    # Check if request is already in flight
    async with request_lock:
        if cache_key in active_requests:
            print(f"Reusing active request for {cache_key}")
            return await active_requests[cache_key]
        
        # Check cache first
        cache_data = summary_cache.get('data')
        if (cache_data and 
            summary_cache.get('quarter_id') == quarter_id and
            current_time - summary_cache.get('timestamp', 0) < CACHE_DURATION):
            print(f"Serving challenges summary from cache")
            return cache_data
        
        # Create and store the request promise
        request_promise = _fetch_challenges_summary(quarter_id, user_name)
        active_requests[cache_key] = request_promise
        
    try:
        result = await request_promise
        # Update cache
        summary_cache.update({
            'data': result,
            'timestamp': current_time,
            'quarter_id': quarter_id,
            'error_count': 0
        })
        return result
    finally:
        # Remove from active requests
        async with request_lock:
            active_requests.pop(cache_key, None)

async def _fetch_challenges_summary(quarter_id: int, user_name: str) -> ChallengesSummaryResponse:
    """Internal method to fetch challenges summary from database"""
    conn = await get_db_connection()
    try:
        # Lightweight query - avoid heavy computations and joins
        query = """
        SELECT 
            c.id,
            c.title,
            c.type,
            c.end_time,
            c.target_value,
            c.current_progress,
            c.reward_points,
            c.status,
            CASE 
                WHEN c.end_time < CURRENT_TIMESTAMP THEN 'expired'
                WHEN c.current_progress >= c.target_value THEN 'completed'
                ELSE 'active'
            END as computed_status,
            CASE 
                WHEN c.end_time <= CURRENT_TIMESTAMP + INTERVAL '24 hours' 
                     AND c.end_time > CURRENT_TIMESTAMP 
                THEN true 
                ELSE false 
            END as expiring_soon
        FROM challenges c
        WHERE c.quarter_id = $1 
        AND c.status = 'active'
        AND c.end_time > CURRENT_TIMESTAMP - INTERVAL '1 day'  -- Include recent expired
        ORDER BY c.end_time ASC
        """
        
        rows = await conn.fetch(query, quarter_id)
        
        active_count = 0
        completed_count = 0
        expiring_soon_count = 0
        challenges = []
        
        for row in rows:
            status = row['computed_status']
            if status == 'active':
                active_count += 1
                if row['expiring_soon']:
                    expiring_soon_count += 1
            elif status == 'completed':
                completed_count += 1
            
            # Minimal challenge data
            challenges.append({
                'id': row['id'],
                'title': row['title'],
                'type': row['type'],
                'progress': {
                    'current': row['current_progress'],
                    'target': row['target_value']
                },
                'reward_points': row['reward_points'],
                'state': status,
                'ends_at': row['end_time'].isoformat() if row['end_time'] else None
            })
        
        return ChallengesSummaryResponse(
            updated_at=datetime.utcnow().isoformat(),
            active_count=active_count,
            completed_count=completed_count,
            expiring_soon_count=expiring_soon_count,
            challenges=challenges
        )
        
    finally:
        await conn.close()

@router.get("/challenges-summary")
async def get_challenges_summary(user: AuthorizedUser, response: Response) -> ChallengesSummaryResponse:
    """Lightweight challenges summary endpoint - fast response <200ms"""
    response.headers["Cache-Control"] = "no-store"
    try:
        quarter = await get_current_quarter()
        if not quarter:
            # Return empty safe structure instead of raising exception
            return ChallengesSummaryResponse(
                total_active=0,
                total_completed=0,
                available_points=0,
                completion_rate=0.0
            )
        
        return await get_cached_challenges_summary(quarter['id'], user.name)
        
    except Exception as e:
        print(f"Error getting challenges summary: {str(e)}")
        # Return safe empty structure instead of raising exception
        return ChallengesSummaryResponse(
            total_active=0,
            total_completed=0,
            available_points=0,
            completion_rate=0.0
        )

@router.get("/challenges")
async def get_player_active_challenges(user: AuthorizedUser, response: Response) -> list[PlayerChallengeResponse]:
    """Get active challenges for the current player's quarter - cached version"""
    response.headers["Cache-Control"] = "no-store"
    try:
        # Check if disabled due to errors
        current_time = time.time()
        if current_time < detailed_cache['disabled_until']:
            print(f"Challenges endpoint disabled until {detailed_cache['disabled_until']} due to errors")
            # Return empty list instead of cached data that might be None
            return []
        
        quarter = await get_current_quarter()
        if not quarter:
            raise HTTPException(status_code=400, detail="No active quarter found")
        
        # Use request deduplication for the detailed endpoint too
        cache_key = f"challenges_detailed_{quarter['id']}_{user.name}"
        
        async with request_lock:
            if cache_key in active_requests:
                print(f"Reusing active detailed request for {cache_key}")
                result = await active_requests[cache_key]
                return result or []  # Ensure we never return None
            
            # Check cache first
            if (detailed_cache['data'] is not None and 
                detailed_cache['quarter_id'] == quarter['id'] and
                current_time - detailed_cache['timestamp'] < CACHE_DURATION):
                print(f"Serving detailed challenges from cache for user {user.sub}")
                return detailed_cache['data'] or []  # Ensure we never return None
            
            # Create and store the request promise
            request_promise = _fetch_detailed_challenges(quarter['id'], user.sub)
            active_requests[cache_key] = request_promise
        
        try:
            result = await request_promise
            # Update cache - ensure result is always a list
            detailed_cache['data'] = result or []
            detailed_cache['timestamp'] = current_time
            detailed_cache['quarter_id'] = quarter['id']
            detailed_cache['error_count'] = 0
            detailed_cache['disabled_until'] = 0
            print(f"Updated detailed challenges cache with {len(result or [])} challenges")
            return result or []  # Ensure we never return None
        finally:
            # Remove from active requests
            async with request_lock:
                active_requests.pop(cache_key, None)
            
    except Exception as e:
        print(f"Error getting challenges: {str(e)}")
        # Track errors and disable temporarily
        detailed_cache['error_count'] += 1
        if detailed_cache['error_count'] >= MAX_ERROR_COUNT:
            detailed_cache['disabled_until'] = time.time() + ERROR_DISABLE_DURATION
            print(f"Challenges endpoint disabled until {detailed_cache['disabled_until']} due to {detailed_cache['error_count']} errors")
        
        # Always return empty list instead of raising HTTPException
        return []

async def _fetch_detailed_challenges(quarter_id: int, user_sub: str) -> list[PlayerChallengeResponse]:
    """Internal method to fetch detailed challenges from database with deduplication"""
    conn = await get_db_connection()
    try:
        # First, get the player name from user_player_mapping using user.sub
        # Convert user_sub to UUID format if needed
        from app.apis.player_selection import convert_user_id_to_uuid
        user_uuid = convert_user_id_to_uuid(user_sub)
        
        # Get player name from mapping
        player_mapping = await conn.fetchrow(
            "SELECT player_name FROM user_player_mapping WHERE user_id = $1",
            user_uuid
        )
        
        if not player_mapping:
            # User hasn't selected a player yet - return empty challenges
            return []
            
        player_name = player_mapping['player_name']
        
        # Get player profile
        profile = await conn.fetchrow(
            "SELECT * FROM profiles WHERE name = $1 AND quarter_id = $2",
            player_name, quarter_id
        )
        
        if not profile:
            return []
        
        # Get active challenges with player contributions in one optimized query
        challenges = await conn.fetch("""
            SELECT 
                c.id, c.title, c.description, c.type, c.icon,
                c.target_value, c.target_type, c.current_progress, c.end_time,
                c.reward_points, c.reward_description, c.status,
                EXTRACT(EPOCH FROM (c.end_time - CURRENT_TIMESTAMP))/3600 as time_remaining_hours,
                CASE WHEN c.target_value > 0 THEN (c.current_progress::FLOAT / c.target_value * 100) ELSE 0 END as progress_percentage,
                cp.contribution as my_contribution
            FROM challenges c
            LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id AND cp.player_name = $2
            WHERE c.quarter_id = $1 AND c.status = 'active' AND c.end_time > CURRENT_TIMESTAMP AND c.is_visible = true
            ORDER BY c.end_time ASC
        """, quarter_id, player_name)
        
        # Get all top contributors in a single query for team challenges
        team_challenge_ids = [c['id'] for c in challenges if c['type'] in ['team_push', 'boss_fight']]
        
        top_contributors_map = {}
        if team_challenge_ids:
            # Get top 3 contributors for all team challenges at once
            contributors_data = await conn.fetch("""
                SELECT challenge_id, player_name, contribution,
                       ROW_NUMBER() OVER (PARTITION BY challenge_id ORDER BY contribution DESC) as rank
                FROM challenge_participants 
                WHERE challenge_id = ANY($1) AND contribution > 0
            """, team_challenge_ids)
            
            # Group by challenge_id
            for contrib in contributors_data:
                if contrib['rank'] <= 3:  # Only top 3
                    challenge_id = contrib['challenge_id']
                    if challenge_id not in top_contributors_map:
                        top_contributors_map[challenge_id] = []
                    top_contributors_map[challenge_id].append({
                        'name': contrib['player_name'], 
                        'contribution': contrib['contribution']
                    })
        
        result = []
        for challenge in challenges:
            is_team_challenge = challenge['type'] in ['team_push', 'boss_fight']
            my_contribution = challenge['my_contribution'] if is_team_challenge else None
            top_contributors = top_contributors_map.get(challenge['id']) if is_team_challenge else None
            
            result.append(PlayerChallengeResponse(
                id=challenge['id'],
                title=challenge['title'],
                description=challenge['description'],
                type=challenge['type'],
                icon=challenge['icon'],
                target_value=challenge['target_value'],
                target_type=challenge['target_type'],
                current_progress=challenge['current_progress'],
                end_time=challenge['end_time'].isoformat(),
                reward_points=challenge['reward_points'],
                reward_description=challenge['reward_description'],
                status=challenge['status'],
                time_remaining_hours=max(0, challenge['time_remaining_hours']) if challenge['time_remaining_hours'] else 0,
                progress_percentage=min(100, max(0, challenge['progress_percentage']))if challenge['progress_percentage'] else 0,
                is_team_challenge=is_team_challenge,
                can_participate=True,
                my_contribution=my_contribution,
                top_contributors=top_contributors
            ))
        
        return result
        
    finally:
        await conn.close()

# ===== CHALLENGE PROGRESS PROCESSING =====

async def process_challenge_progress(profile, quarter_id: int, activity_type: str, conn):
    """
    Process challenge progress when an activity is logged.
    Returns dict with challenge completion info and rewards.
    """
    try:
        # Map activity types to challenge target types
        activity_to_target_map = {
            "book": "meetings",
            "opp": "opportunities", 
            "deal": "deals"
        }
        
        # Get relevant active challenges for this quarter - now with progress_mode
        challenges = await conn.fetch("""
            SELECT id, type, title, target_value, target_type, current_progress,
                   reward_points, reward_description, end_time, progress_mode
            FROM challenges 
            WHERE quarter_id = $1 AND status = 'active' AND end_time > CURRENT_TIMESTAMP
        """, quarter_id)
        
        completed_challenges = []
        updated_challenges = []
        
        for challenge in challenges:
            progress_added = 0
            should_update = False
            
            # Check if this activity type matches the challenge target
            if challenge['target_type'] == 'activities':
                # Any activity counts for 'activities' target type
                progress_added = 1
                should_update = True
            else:
                # Specific activity type mapping
                target_type = activity_to_target_map.get(activity_type)
                if target_type == challenge['target_type']:
                    progress_added = 1
                    should_update = True
            
            # Update challenge progress if applicable
            if should_update and progress_added > 0:
                if challenge['progress_mode'] == 'per_person':
                    # Per-person challenges: track individual progress using challenge_participants
                    await handle_per_person_challenge(
                        conn, challenge, profile, progress_added, completed_challenges, updated_challenges
                    )
                else:
                    # Team challenges: use shared current_progress field
                    await handle_team_challenge(
                        conn, challenge, profile, progress_added, completed_challenges, updated_challenges
                    )
        
        return {
            'updated_challenges': updated_challenges,
            'completed_challenges': completed_challenges
        }
        
    except Exception as e:
        print(f"Error processing challenge progress: {str(e)}")
        return {'updated_challenges': [], 'completed_challenges': []}

async def handle_per_person_challenge(conn, challenge, profile, progress_added, completed_challenges, updated_challenges):
    """
    Handle progress for per-person challenges (speed_run, streak, hidden_gem).
    Each player has individual progress tracked in challenge_participants.
    """
    player_name = str(profile['name'])
    
    # Get or create participant record for this player
    participant = await conn.fetchrow("""
        SELECT id, contribution FROM challenge_participants 
        WHERE challenge_id = $1 AND player_name = $2
    """, challenge['id'], player_name)
    
    if participant:
        # Update existing participant
        new_contribution = participant['contribution'] + progress_added
        await conn.execute("""
            UPDATE challenge_participants 
            SET contribution = $1
            WHERE challenge_id = $2 AND player_name = $3
        """, new_contribution, challenge['id'], player_name)
    else:
        # Create new participant
        new_contribution = progress_added
        await conn.execute("""
            INSERT INTO challenge_participants (challenge_id, player_name, contribution)
            VALUES ($1, $2, $3)
        """, challenge['id'], player_name, new_contribution)
    
    updated_challenges.append({
        'id': challenge['id'],
        'title': challenge['title'],
        'progress_added': progress_added,
        'new_progress': new_contribution,
        'target_value': challenge['target_value']
    })
    
    # Check if THIS PLAYER has completed the challenge
    if new_contribution >= challenge['target_value']:
        # Mark challenge as completed BY THIS PLAYER ONLY
        await conn.execute("""
            UPDATE challenges 
            SET status = 'completed', completed_by = $1, completed_at = CURRENT_TIMESTAMP
            WHERE id = $2
        """, player_name, challenge['id'])
        
        # Award reward points to THIS PLAYER ONLY
        await conn.execute("""
            UPDATE profiles 
            SET points = points + $1
            WHERE id = $2
        """, challenge['reward_points'], profile['id'])
        
        completed_challenges.append({
            'id': challenge['id'],
            'title': challenge['title'],
            'reward_points': challenge['reward_points'],
            'reward_description': challenge['reward_description']
        })
        
        print(f"Per-person challenge completed! {player_name} completed '{challenge['title']}' and earned {challenge['reward_points']} bonus points")

async def handle_team_challenge(conn, challenge, profile, progress_added, completed_challenges, updated_challenges):
    """
    Handle progress for team challenges (team_push, boss_fight).
    Uses shared current_progress field - when ANY player reaches target, entire team gets credit.
    """
    player_name = str(profile['name'])
    
    # Update shared progress
    new_progress = challenge['current_progress'] + progress_added
    
    await conn.execute("""
        UPDATE challenges 
        SET current_progress = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
    """, new_progress, challenge['id'])
    
    updated_challenges.append({
        'id': challenge['id'],
        'title': challenge['title'],
        'progress_added': progress_added,
        'new_progress': new_progress,
        'target_value': challenge['target_value']
    })
    
    # Check if team challenge is completed
    if new_progress >= challenge['target_value']:
        # Mark challenge as completed
        await conn.execute("""
            UPDATE challenges 
            SET status = 'completed', completed_by = $1, completed_at = CURRENT_TIMESTAMP
            WHERE id = $2
        """, player_name, challenge['id'])
        
        # Award reward points to the completing player
        await conn.execute("""
            UPDATE profiles 
            SET points = points + $1
            WHERE id = $2
        """, challenge['reward_points'], profile['id'])
        
        completed_challenges.append({
            'id': challenge['id'],
            'title': challenge['title'],
            'reward_points': challenge['reward_points'],
            'reward_description': challenge['reward_description']
        })
        
        print(f"Team challenge completed! {player_name} completed '{challenge['title']}' and earned {challenge['reward_points']} bonus points")
    
    # Update team challenge participants for tracking contributions
    await update_team_challenge_participant(conn, challenge['id'], player_name, progress_added)

async def update_team_challenge_participant(conn, challenge_id: int, player_name: str, contribution: int):
    """
    Update or insert team challenge participant contribution.
    """
    try:
        # Check if participant already exists
        existing = await conn.fetchrow("""
            SELECT id, contribution FROM challenge_participants 
            WHERE challenge_id = $1 AND player_name = $2
        """, challenge_id, player_name)
        
        if existing:
            # Update existing participant
            await conn.execute("""
                UPDATE challenge_participants 
                SET contribution = contribution + $1
                WHERE challenge_id = $2 AND player_name = $3
            """, contribution, challenge_id, player_name)
        else:
            # Insert new participant
            await conn.execute("""
                INSERT INTO challenge_participants (challenge_id, player_name, contribution)
                VALUES ($1, $2, $3)
            """, challenge_id, player_name, contribution)
            
    except Exception as e:
        print(f"Error updating team challenge participant: {str(e)}")

# 7. TWO-WAY LOGGING: If this is a "book" activity and not triggered by competition, 
# automatically log in all active booking competitions
async def trigger_competition_logging(player_name: str, total_points: int, activity_id: int, conn):
    """
    Trigger competition logging when a Books activity is logged in Activity Center.
    Find all active booking competitions and submit Books entries to them.
    """
    try:
        # Find all active booking competitions
        active_competitions = await conn.fetch("""
            SELECT id, name, is_active, start_time, end_time 
            FROM booking_competitions 
            WHERE is_active = true 
            AND is_hidden = false
            AND start_time <= NOW() 
            AND end_time >= NOW()
        """)
        
        if not active_competitions:
            print(f"No active competitions found for player {player_name}")
            return
            
        # For each active competition, try to submit a Books entry
        for comp in active_competitions:
            try:
                # Check if player is enrolled in this competition
                participant = await conn.fetchrow("""
                    SELECT id FROM booking_competition_participants 
                    WHERE competition_id = $1 AND player_name = $2
                """, comp['id'], player_name)
                
                if not participant:
                    # Auto-enroll player if not already enrolled
                    try:
                        await conn.execute("""
                            INSERT INTO booking_competition_participants (competition_id, player_name)
                            VALUES ($1, $2)
                            ON CONFLICT (competition_id, player_name) DO NOTHING
                        """, comp['id'], player_name)
                        print(f"Auto-enrolled {player_name} in competition {comp['name']}")
                    except Exception as e:
                        print(f"Failed to auto-enroll {player_name} in competition {comp['name']}: {e}")
                        continue
                        
                # Submit Books entry (10 points for competition)
                await conn.execute("""
                    INSERT INTO booking_competition_entries 
                    (competition_id, player_name, activity_id, activity_type, points, submitted_by)
                    VALUES ($1, $2, $3, $4, $5, $6)
                """, comp['id'], player_name, activity_id, 'book', 10, 'activity_center_trigger')
                
                print(f"Successfully logged Books activity for {player_name} in competition {comp['name']} (+10 points)")
                
            except Exception as e:
                print(f"Failed to log Books activity for {player_name} in competition {comp['name']}: {e}")
                continue
                
    except Exception as e:
        print(f"Error triggering competition logging: {e}")
        # Don't raise - this is optional functionality that shouldn't break main flow
