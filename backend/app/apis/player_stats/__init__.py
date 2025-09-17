
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
from app.apis.player_selection import convert_user_id_to_uuid
from app.apis.activities import ActivityType, get_current_quarter

router = APIRouter()

# ===== PLAYER STATS MODELS =====

class PlayerGoalsProgress(BaseModel):
    """Personal goals and current progress"""
    goal_books: int
    goal_opps: int  
    goal_deals: int
    goal_points: int
    current_books: int
    current_opps: int
    current_deals: int
    current_points: int
    books_progress_percentage: float
    opps_progress_percentage: float
    deals_progress_percentage: float
    points_progress_percentage: float

class TeamProgressDelta(BaseModel):
    """Team progress compared to personal"""
    team_goal_books: int
    team_goal_opps: int
    team_goal_deals: int
    team_goal_points: int
    team_current_books: int
    team_current_opps: int
    team_current_deals: int
    team_current_points: int
    team_progress_percentage: float

class PaceAnalysis(BaseModel):
    """Pace vs target analysis"""
    days_elapsed: int
    days_remaining: int
    quarter_progress_percentage: float
    books_pace_vs_target: float  # Negative means behind pace
    opps_pace_vs_target: float
    deals_pace_vs_target: float
    points_pace_vs_target: float
    is_on_track: bool

class RecentActivity(BaseModel):
    """Recent activity item"""
    id: int
    type: ActivityType
    points: int
    created_at: datetime
    days_ago: int

class ActiveChallenge(BaseModel):
    """Active challenge with player progress"""
    id: int
    title: str
    description: Optional[str]
    type: str
    icon: str
    target_value: int
    current_progress: int
    progress_percentage: float
    time_remaining_hours: float
    reward_points: int
    is_completed: bool

class TimeToGoalPrediction(BaseModel):
    """Predictions for achieving goals"""
    books_days_to_goal: Optional[int]  # None if already achieved or impossible
    opps_days_to_goal: Optional[int]
    deals_days_to_goal: Optional[int]
    points_days_to_goal: Optional[int]
    likelihood_to_achieve_all: str  # "high", "medium", "low", "unlikely"

class PlayerDetailedStatsResponse(BaseModel):
    """Comprehensive player statistics for drawer UI"""
    player_name: str
    quarter_name: str
    last_updated: datetime
    
    # Core stats
    personal_goals: PlayerGoalsProgress
    team_progress: TeamProgressDelta
    pace_analysis: PaceAnalysis
    
    # Activities and challenges
    recent_activities: List[RecentActivity]
    active_challenges: List[ActiveChallenge]
    
    # Predictions
    predictions: TimeToGoalPrediction
    
    # Summary metrics
    total_activities_count: int
    current_position: int
    total_players: int

# ===== HELPER FUNCTIONS =====

def calculate_goal_points(books: int, opps: int, deals: int) -> int:
    """Calculate total goal points based on activity targets"""
    return books * 1 + opps * 2 + deals * 5

def calculate_progress_percentage(current: int, goal: int) -> float:
    """Calculate progress percentage, capped at 100%"""
    if goal == 0:
        return 100.0
    return min(100.0, (current / goal) * 100)

def calculate_pace_vs_target(current: int, goal: int, quarter_progress: float) -> float:
    """Calculate how much ahead/behind pace (positive = ahead, negative = behind)"""
    if goal == 0:
        return 0.0
    expected_at_this_point = goal * (quarter_progress / 100)
    return current - expected_at_this_point

def predict_days_to_goal(current: int, goal: int, days_elapsed: int) -> Optional[int]:
    """Predict days to reach goal based on current pace"""
    if current >= goal:
        return 0  # Already achieved
    
    if days_elapsed == 0 or current == 0:
        return None  # Not enough data
    
    daily_rate = current / days_elapsed
    if daily_rate <= 0:
        return None  # No progress
    
    remaining = goal - current
    days_needed = remaining / daily_rate
    return int(days_needed) if days_needed > 0 else None

def assess_likelihood(books_days: Optional[int], opps_days: Optional[int], 
                    deals_days: Optional[int], points_days: Optional[int], 
                    days_remaining: int) -> str:
    """Assess likelihood of achieving all goals"""
    predictions = [d for d in [books_days, opps_days, deals_days, points_days] if d is not None]
    
    if not predictions:
        return "unlikely"
    
    max_days_needed = max(predictions)
    
    if max_days_needed <= days_remaining * 0.7:
        return "high"
    elif max_days_needed <= days_remaining:
        return "medium"
    elif max_days_needed <= days_remaining * 1.3:
        return "low"
    else:
        return "unlikely"

# ===== API ENDPOINT =====

@router.get("/detailed-stats")
async def get_player_detailed_stats(
    player_name: str,
    user: AuthorizedUser
) -> PlayerDetailedStatsResponse:
    """
    Get comprehensive player statistics for drawer UI
    
    Args:
        player_name: Name of the player to get stats for
        user: Authenticated user (for security)
    
    Returns:
        Detailed player statistics including goals, pace, activities, challenges, and predictions
    """
    # Validate player name
    from app.apis.player_selection import FIXED_PLAYERS
    if player_name not in FIXED_PLAYERS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid player name. Must be one of: {', '.join(FIXED_PLAYERS)}"
        )
    
    # Get current quarter
    quarter = await get_current_quarter()
    if not quarter:
        raise HTTPException(status_code=400, detail="No active quarter found")
    
    conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
    try:
        # Calculate quarter progress
        quarter_start = quarter['start_date']
        quarter_end = quarter['end_date']
        today = datetime.now().date()
        
        total_days = (quarter_end - quarter_start).days
        days_elapsed = max(0, (today - quarter_start).days)
        days_remaining = max(0, (quarter_end - today).days)
        quarter_progress = min(100.0, (days_elapsed / total_days) * 100) if total_days > 0 else 0.0
        
        # Get player profile and goals
        player_profile = await conn.fetchrow(
            """
            SELECT p.*, 
                   COALESCE(books.count, 0) as current_books,
                   COALESCE(opps.count, 0) as current_opps, 
                   COALESCE(deals.count, 0) as current_deals,
                   COALESCE(total.points, 0) as current_points
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
            LEFT JOIN (
                SELECT profile_id, SUM(points) as points
                FROM activities 
                WHERE quarter_id = $1
                GROUP BY profile_id
            ) total ON p.id = total.profile_id
            WHERE p.name = $2 AND p.quarter_id = $1
            """,
            quarter['id'], player_name
        )
        
        if not player_profile:
            raise HTTPException(status_code=404, detail=f"Player {player_name} not found")
        
        # Get team totals
        team_totals = await conn.fetchrow(
            """
            SELECT 
                SUM(goal_books) as team_goal_books,
                SUM(goal_opps) as team_goal_opps,
                SUM(goal_deals) as team_goal_deals,
                SUM(books.count) as team_current_books,
                SUM(opps.count) as team_current_opps,
                SUM(deals.count) as team_current_deals,
                SUM(total.points) as team_current_points
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
            LEFT JOIN (
                SELECT profile_id, SUM(points) as points
                FROM activities 
                WHERE quarter_id = $1
                GROUP BY profile_id
            ) total ON p.id = total.profile_id
            WHERE p.quarter_id = $1
            """,
            quarter['id']
        )
        
        # Get recent activities (last 20)
        activities = await conn.fetch(
            """
            SELECT id, type, points, created_at
            FROM activities 
            WHERE profile_id = $1 AND quarter_id = $2
            ORDER BY created_at DESC
            LIMIT 20
            """,
            player_profile['id'], quarter['id']
        )
        
        # Get active challenges for this player
        challenges = await conn.fetch(
            """
            SELECT c.id, c.title, c.description, c.type, c.icon, 
                   c.target_value, c.current_progress, c.end_time, c.reward_points,
                   CASE WHEN c.current_progress >= c.target_value THEN true ELSE false END as is_completed
            FROM challenges c
            WHERE c.quarter_id = $1 AND c.status = 'active'
            AND (c.type NOT IN ('team_push', 'boss_fight') OR 
                 EXISTS (SELECT 1 FROM challenge_participants cp WHERE cp.challenge_id = c.id AND cp.player_name = $2))
            ORDER BY c.end_time ASC
            """,
            quarter['id'], player_name
        )
        
        # Get player position
        position_result = await conn.fetchrow(
            """
            WITH player_rankings AS (
                SELECT p.name, 
                       COALESCE(SUM(a.points), 0) as total_points,
                       ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.points), 0) DESC) as position
                FROM profiles p
                LEFT JOIN activities a ON p.id = a.profile_id AND a.quarter_id = $1
                WHERE p.quarter_id = $1
                GROUP BY p.id, p.name
            )
            SELECT position, COUNT(*) OVER() as total_players
            FROM player_rankings
            WHERE name = $2
            """,
            quarter['id'], player_name
        )
        
        # Build response objects
        goal_points = calculate_goal_points(
            player_profile['goal_books'], 
            player_profile['goal_opps'], 
            player_profile['goal_deals']
        )
        
        team_goal_points = calculate_goal_points(
            team_totals['team_goal_books'] or 0,
            team_totals['team_goal_opps'] or 0, 
            team_totals['team_goal_deals'] or 0
        )
        
        personal_goals = PlayerGoalsProgress(
            goal_books=player_profile['goal_books'],
            goal_opps=player_profile['goal_opps'],
            goal_deals=player_profile['goal_deals'],
            goal_points=goal_points,
            current_books=player_profile['current_books'],
            current_opps=player_profile['current_opps'],
            current_deals=player_profile['current_deals'],
            current_points=player_profile['current_points'],
            books_progress_percentage=calculate_progress_percentage(
                player_profile['current_books'], player_profile['goal_books']
            ),
            opps_progress_percentage=calculate_progress_percentage(
                player_profile['current_opps'], player_profile['goal_opps']
            ),
            deals_progress_percentage=calculate_progress_percentage(
                player_profile['current_deals'], player_profile['goal_deals']
            ),
            points_progress_percentage=calculate_progress_percentage(
                player_profile['current_points'], goal_points
            )
        )
        
        team_progress = TeamProgressDelta(
            team_goal_books=team_totals['team_goal_books'] or 0,
            team_goal_opps=team_totals['team_goal_opps'] or 0,
            team_goal_deals=team_totals['team_goal_deals'] or 0,
            team_goal_points=team_goal_points,
            team_current_books=team_totals['team_current_books'] or 0,
            team_current_opps=team_totals['team_current_opps'] or 0,
            team_current_deals=team_totals['team_current_deals'] or 0,
            team_current_points=team_totals['team_current_points'] or 0,
            team_progress_percentage=calculate_progress_percentage(
                team_totals['team_current_points'] or 0, team_goal_points
            )
        )
        
        pace_analysis = PaceAnalysis(
            days_elapsed=days_elapsed,
            days_remaining=days_remaining,
            quarter_progress_percentage=quarter_progress,
            books_pace_vs_target=calculate_pace_vs_target(
                player_profile['current_books'], player_profile['goal_books'], quarter_progress
            ),
            opps_pace_vs_target=calculate_pace_vs_target(
                player_profile['current_opps'], player_profile['goal_opps'], quarter_progress
            ),
            deals_pace_vs_target=calculate_pace_vs_target(
                player_profile['current_deals'], player_profile['goal_deals'], quarter_progress
            ),
            points_pace_vs_target=calculate_pace_vs_target(
                player_profile['current_points'], goal_points, quarter_progress
            ),
            is_on_track=all([
                calculate_pace_vs_target(player_profile['current_books'], player_profile['goal_books'], quarter_progress) >= -1,
                calculate_pace_vs_target(player_profile['current_opps'], player_profile['goal_opps'], quarter_progress) >= -1,
                calculate_pace_vs_target(player_profile['current_deals'], player_profile['goal_deals'], quarter_progress) >= -1
            ])
        )
        
        recent_activities = [
            RecentActivity(
                id=activity['id'],
                type=ActivityType(activity['type']),
                points=activity['points'],
                created_at=activity['created_at'],
                days_ago=(datetime.now().date() - activity['created_at'].date()).days
            )
            for activity in activities
        ]
        
        active_challenges = []
        for challenge in challenges:
            time_remaining = (challenge['end_time'] - datetime.now()).total_seconds() / 3600
            active_challenges.append(ActiveChallenge(
                id=challenge['id'],
                title=challenge['title'],
                description=challenge['description'],
                type=challenge['type'],
                icon=challenge['icon'],
                target_value=challenge['target_value'],
                current_progress=challenge['current_progress'],
                progress_percentage=calculate_progress_percentage(
                    challenge['current_progress'], challenge['target_value']
                ),
                time_remaining_hours=max(0, time_remaining),
                reward_points=challenge['reward_points'],
                is_completed=challenge['is_completed']
            ))
        
        # Predictions
        books_prediction = predict_days_to_goal(
            player_profile['current_books'], player_profile['goal_books'], days_elapsed
        )
        opps_prediction = predict_days_to_goal(
            player_profile['current_opps'], player_profile['goal_opps'], days_elapsed
        )
        deals_prediction = predict_days_to_goal(
            player_profile['current_deals'], player_profile['goal_deals'], days_elapsed
        )
        points_prediction = predict_days_to_goal(
            player_profile['current_points'], goal_points, days_elapsed
        )
        
        predictions = TimeToGoalPrediction(
            books_days_to_goal=books_prediction,
            opps_days_to_goal=opps_prediction,
            deals_days_to_goal=deals_prediction,
            points_days_to_goal=points_prediction,
            likelihood_to_achieve_all=assess_likelihood(
                books_prediction, opps_prediction, deals_prediction, points_prediction, days_remaining
            )
        )
        
        # Get total activities count
        total_activities = await conn.fetchval(
            "SELECT COUNT(*) FROM activities WHERE profile_id = $1 AND quarter_id = $2",
            player_profile['id'], quarter['id']
        )
        
        return PlayerDetailedStatsResponse(
            player_name=player_name,
            quarter_name=quarter['name'],
            last_updated=datetime.now(),
            personal_goals=personal_goals,
            team_progress=team_progress,
            pace_analysis=pace_analysis,
            recent_activities=recent_activities,
            active_challenges=active_challenges,
            predictions=predictions,
            total_activities_count=total_activities or 0,
            current_position=position_result['position'] if position_result else 1,
            total_players=position_result['total_players'] if position_result else 1
        )
        
    except Exception as e:
        print(f"Error getting detailed player stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get player detailed stats")
    finally:
        await conn.close()
