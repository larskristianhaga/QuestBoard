
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, timedelta
import asyncpg
from app.auth import AuthorizedUser
import databutton as db
from app.apis.activities import get_current_quarter

router = APIRouter()

# ===== PLAYER INSIGHTS MODELS =====

class ProgressDonut(BaseModel):
    """Progress data for donut charts"""
    current: int
    target: int
    percentage: float
    remaining: int

class PaceIndicator(BaseModel):
    """Pace analysis vs target"""
    current_per_day: float
    target_per_day: float
    delta_per_day: float  # positive = ahead, negative = behind
    days_left: int
    status: str  # "ahead", "on_track", "behind"

class Milestone(BaseModel):
    """Next milestone to reach"""
    metric: str  # "books", "opps", "deals", "points"
    threshold_percentage: int  # 70, 80, 90, 100
    remaining: int
    description: str  # "3 books to reach 70%"

class PlayerInsightsSummaryResponse(BaseModel):
    """Summary data for player insights dashboard"""
    player_name: str
    quarter_name: str
    last_updated: datetime
    
    # Progress donuts
    books: ProgressDonut
    opps: ProgressDonut
    deals: ProgressDonut
    points: ProgressDonut
    
    # Pace analysis
    pace: PaceIndicator
    
    # Next milestones
    next_milestones: List[Milestone]
    
    # Context info
    quarter_progress_percentage: float
    days_elapsed: int
    days_remaining: int

class TimeseriesDataPoint(BaseModel):
    """Single data point for timeseries"""
    date: date
    value: int

class PlayerInsightsTimeseriesResponse(BaseModel):
    """Timeseries data for charts"""
    player_name: str
    metric: str
    granularity: str
    start_date: date
    end_date: date
    data: List[TimeseriesDataPoint]
    seven_day_average: Optional[float]
    previous_period_average: Optional[float]

class FunnelData(BaseModel):
    """Funnel conversion data"""
    lifts: int
    calls: int
    books: int
    opps: int
    deals: int
    
    # Conversion rates
    lifts_to_calls_rate: float
    calls_to_books_rate: float
    books_to_opps_rate: float
    opps_to_deals_rate: float
    
    # Bottleneck analysis
    weakest_stage: str
    weakest_stage_rate: float

class PlayerInsightsFunnelResponse(BaseModel):
    """Funnel analysis data"""
    player_name: str
    start_date: date
    end_date: date
    funnel: FunnelData

class HeatmapDataPoint(BaseModel):
    """Single heatmap data point"""
    period: int  # hour (0-23) or weekday (0-6)
    value: int
    label: str  # "09:00" or "Tuesday"

class PlayerInsightsHeatmapResponse(BaseModel):
    """Heatmap data for time/weekday analysis"""
    player_name: str
    start_date: date
    end_date: date
    by_hour: List[HeatmapDataPoint]
    by_weekday: List[HeatmapDataPoint]
    best_hour: Optional[str]
    best_weekday: Optional[str]
    coaching_hint: Optional[str]

class StreakData(BaseModel):
    """Streak and achievement data"""
    current_activity_streak_days: int
    longest_activity_streak_days: int
    best_week_books: int
    best_week_period: str
    recent_achievements: List[str]

class PlayerInsightsStreaksResponse(BaseModel):
    """Streaks and achievements data"""
    player_name: str
    quarter_name: str
    streaks: StreakData

# ===== HELPER FUNCTIONS =====

async def get_db_connection():
    """Get database connection"""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)

async def get_player_by_name(conn, player_name: str):
    """Get player profile by name"""
    player = await conn.fetchrow(
        "SELECT * FROM profiles WHERE name = $1",
        player_name
    )
    if not player:
        raise HTTPException(status_code=404, detail=f"Player {player_name} not found")
    return player

def calculate_pace_status(current_per_day: float, target_per_day: float) -> str:
    """Calculate pace status based on current vs target"""
    ratio = current_per_day / target_per_day if target_per_day > 0 else 0
    if ratio >= 1.1:
        return "ahead"
    elif ratio >= 0.9:
        return "on_track"
    else:
        return "behind"

def get_next_milestones(current: int, target: int, metric: str) -> List[Milestone]:
    """Calculate next milestones for a metric"""
    if target == 0:
        return []
    
    current_percentage = (current / target) * 100
    milestones = []
    
    # Define milestone thresholds
    thresholds = [25, 50, 70, 80, 90, 100]
    
    for threshold in thresholds:
        if current_percentage < threshold:
            needed = int((threshold / 100) * target) - current
            if needed > 0:
                milestones.append(Milestone(
                    metric=metric,
                    threshold_percentage=threshold,
                    remaining=needed,
                    description=f"{needed} {metric} to reach {threshold}%"
                ))
            # Only return the next 2-3 milestones
            if len(milestones) >= 3:
                break
    
    return milestones

# ===== API ENDPOINTS =====

@router.get("/insights/summary")
async def get_player_insights_summary(
    player_name: str,
    range: str = Query("Q", description="Time range: Q for quarter, M for month"),
    user: AuthorizedUser = None
) -> PlayerInsightsSummaryResponse:
    """
    Get comprehensive summary for player insights dashboard
    
    Args:
        player_name: Name of the player
        range: Time range (Q=quarter, M=month)
        user: Authenticated user (for access control)
    
    Returns:
        Summary data with progress donuts, pace analysis, and milestones
    """
    conn = await get_db_connection()
    try:
        # Get player profile
        player_profile = await get_player_by_name(conn, player_name)
        
        # Get current quarter
        quarter = await get_current_quarter()
        if not quarter:
            raise HTTPException(status_code=404, detail="No active quarter found")
        
        # Calculate quarter timeline
        start_date = quarter['start_date']
        end_date = quarter['end_date']
        current_date = datetime.now().date()
        
        days_total = (end_date - start_date).days
        days_elapsed = (current_date - start_date).days
        days_remaining = max(0, (end_date - current_date).days)
        quarter_progress = (days_elapsed / days_total) * 100 if days_total > 0 else 0
        
        # Get player goals for current quarter
        player_goals = await conn.fetchrow(
            "SELECT goal_books, goal_opps, goal_deals, (goal_books + goal_opps * 2 + goal_deals * 5) as goal_points FROM profiles WHERE id = $1",
            player_profile['id']
        )
        
        if not player_goals:
            # Set default goals if none exist
            goal_books = goal_opps = goal_deals = goal_points = 0
        else:
            goal_books = player_goals['goal_books']
            goal_opps = player_goals['goal_opps']
            goal_deals = player_goals['goal_deals']
            goal_points = player_goals['goal_points']
        
        # Get current progress from activities
        activity_stats = await conn.fetchrow("""
            SELECT 
                COUNT(*) FILTER (WHERE type = 'book') as current_books,
                COUNT(*) FILTER (WHERE type = 'opp') as current_opps,
                COUNT(*) FILTER (WHERE type = 'deal') as current_deals,
                COALESCE(SUM(points), 0) as current_points
            FROM activities 
            WHERE profile_id = $1 AND quarter_id = $2
        """, player_profile['id'], quarter['id'])
        
        current_books = activity_stats['current_books'] or 0
        current_opps = activity_stats['current_opps'] or 0
        current_deals = activity_stats['current_deals'] or 0
        current_points = activity_stats['current_points'] or 0
        
        # Calculate progress donuts
        books_donut = ProgressDonut(
            current=current_books,
            target=goal_books,
            percentage=(current_books / goal_books * 100) if goal_books > 0 else 0,
            remaining=max(0, goal_books - current_books)
        )
        
        opps_donut = ProgressDonut(
            current=current_opps,
            target=goal_opps,
            percentage=(current_opps / goal_opps * 100) if goal_opps > 0 else 0,
            remaining=max(0, goal_opps - current_opps)
        )
        
        deals_donut = ProgressDonut(
            current=current_deals,
            target=goal_deals,
            percentage=(current_deals / goal_deals * 100) if goal_deals > 0 else 0,
            remaining=max(0, goal_deals - current_deals)
        )
        
        points_donut = ProgressDonut(
            current=current_points,
            target=goal_points,
            percentage=(current_points / goal_points * 100) if goal_points > 0 else 0,
            remaining=max(0, goal_points - current_points)
        )
        
        # Calculate pace analysis (based on most critical metric - points)
        target_points_per_day = goal_points / days_total if days_total > 0 else 0
        current_points_per_day = current_points / days_elapsed if days_elapsed > 0 else 0
        delta_per_day = current_points_per_day - target_points_per_day
        
        pace = PaceIndicator(
            current_per_day=current_points_per_day,
            target_per_day=target_points_per_day,
            delta_per_day=delta_per_day,
            days_left=days_remaining,
            status=calculate_pace_status(current_points_per_day, target_points_per_day)
        )
        
        # Get next milestones
        milestones = []
        milestones.extend(get_next_milestones(current_books, goal_books, "books"))
        milestones.extend(get_next_milestones(current_opps, goal_opps, "opps"))
        milestones.extend(get_next_milestones(current_deals, goal_deals, "deals"))
        
        # Sort milestones by remaining count and take top 5
        milestones.sort(key=lambda x: x.remaining)
        milestones = milestones[:5]
        
        return PlayerInsightsSummaryResponse(
            player_name=player_name,
            quarter_name=quarter['name'],
            last_updated=datetime.now(),
            books=books_donut,
            opps=opps_donut,
            deals=deals_donut,
            points=points_donut,
            pace=pace,
            next_milestones=milestones,
            quarter_progress_percentage=quarter_progress,
            days_elapsed=days_elapsed,
            days_remaining=days_remaining
        )
        
    except Exception as e:
        print(f"Error getting player insights summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get player insights summary")
    finally:
        await conn.close()

@router.get("/insights/timeseries")
async def get_player_insights_timeseries(
    player_name: str,
    metric: str = Query(..., description="Metric: lifts, calls, books, opps, deals"),
    granularity: str = Query("daily", description="Granularity: daily, weekly"),
    start: date = Query(..., description="Start date"),
    end: date = Query(..., description="End date"),
    user: AuthorizedUser = None
) -> PlayerInsightsTimeseriesResponse:
    """
    Get timeseries data for player insights charts
    
    Args:
        player_name: Name of the player
        metric: Activity metric to track
        granularity: Time granularity 
        start: Start date
        end: End date
        user: Authenticated user
    
    Returns:
        Timeseries data for charting
    """
    conn = await get_db_connection()
    try:
        # Get player profile
        player_profile = await get_player_by_name(conn, player_name)
        
        # Map metric to activity type
        activity_type_map = {
            "books": "book",
            "opps": "opp",
            "deals": "deal"
        }
        
        if metric not in activity_type_map:
            raise HTTPException(status_code=400, detail=f"Invalid metric: {metric}")
        
        activity_type = activity_type_map[metric]
        
        # Get timeseries data (daily granularity, Europe/Oslo timezone)
        timeseries_data = await conn.fetch("""
            SELECT 
                date_trunc('day', (created_at AT TIME ZONE 'Europe/Oslo'))::date AS d,
                COUNT(*) AS value
            FROM activities 
            WHERE profile_id = $1 
              AND type = $2
              AND (created_at AT TIME ZONE 'Europe/Oslo')::date >= $3
              AND (created_at AT TIME ZONE 'Europe/Oslo')::date <= $4
            GROUP BY d 
            ORDER BY d
        """, player_profile['id'], activity_type, start, end)
        
        # Convert to data points
        data_points = [
            TimeseriesDataPoint(date=row['d'], value=row['value'])
            for row in timeseries_data
        ]
        
        # Calculate 7-day moving average for last 7 points
        seven_day_avg = None
        if len(data_points) >= 7:
            last_seven = data_points[-7:]
            seven_day_avg = sum(point.value for point in last_seven) / 7
        
        return PlayerInsightsTimeseriesResponse(
            player_name=player_name,
            metric=metric,
            granularity=granularity,
            start_date=start,
            end_date=end,
            data=data_points,
            seven_day_average=seven_day_avg,
            previous_period_average=None  # TODO: Calculate previous period comparison
        )
        
    except Exception as e:
        print(f"Error getting player timeseries: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get player timeseries data")
    finally:
        await conn.close()

@router.get("/insights/funnel")
async def get_player_insights_funnel(
    player_name: str,
    start: date = Query(..., description="Start date"),
    end: date = Query(..., description="End date"),
    user: AuthorizedUser = None
) -> PlayerInsightsFunnelResponse:
    """
    Get funnel conversion analysis for player
    
    Args:
        player_name: Name of the player
        start: Start date for analysis
        end: End date for analysis
        user: Authenticated user
    
    Returns:
        Funnel conversion data with rates and bottleneck analysis
    """
    conn = await get_db_connection()
    try:
        # Get player profile
        player_profile = await get_player_by_name(conn, player_name)
        
        # Get funnel counts (Europe/Oslo timezone)
        funnel_stats = await conn.fetchrow("""
            SELECT 
                COUNT(*) FILTER (WHERE type = 'book') as books,
                COUNT(*) FILTER (WHERE type = 'opp') as opps,
                COUNT(*) FILTER (WHERE type = 'deal') as deals
            FROM activities 
            WHERE profile_id = $1
              AND (created_at AT TIME ZONE 'Europe/Oslo')::date >= $2
              AND (created_at AT TIME ZONE 'Europe/Oslo')::date <= $3
        """, player_profile['id'], start, end)
        
        books = funnel_stats['books'] or 0
        opps = funnel_stats['opps'] or 0
        deals = funnel_stats['deals'] or 0
        
        # Calculate conversion rates (simplified funnel: books -> opps -> deals)
        books_to_opps_rate = (opps / books * 100) if books > 0 else 0
        opps_to_deals_rate = (deals / opps * 100) if opps > 0 else 0
        
        # Find weakest conversion stage
        conversion_rates = [
            ("books_to_opps", books_to_opps_rate),
            ("opps_to_deals", opps_to_deals_rate)
        ]
        
        # Filter out stages with no data and find minimum
        valid_rates = [(stage, rate) for stage, rate in conversion_rates if rate > 0]
        weakest_stage, weakest_rate = min(valid_rates, key=lambda x: x[1]) if valid_rates else ("none", 0)
        
        funnel_data = FunnelData(
            lifts=0,  # Not tracked in current system
            calls=0,  # Not tracked in current system
            books=books,
            opps=opps,
            deals=deals,
            lifts_to_calls_rate=0,  # Not applicable
            calls_to_books_rate=0,  # Not applicable
            books_to_opps_rate=books_to_opps_rate,
            opps_to_deals_rate=opps_to_deals_rate,
            weakest_stage=weakest_stage,
            weakest_stage_rate=weakest_rate
        )
        
        return PlayerInsightsFunnelResponse(
            player_name=player_name,
            start_date=start,
            end_date=end,
            funnel=funnel_data
        )
        
    except Exception as e:
        print(f"Error getting player funnel: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get player funnel data")
    finally:
        await conn.close()

@router.get("/insights/heatmap")
async def get_player_insights_heatmap(
    player_name: str,
    start: date = Query(..., description="Start date"),
    end: date = Query(..., description="End date"),
    user: AuthorizedUser = None
) -> PlayerInsightsHeatmapResponse:
    """
    Get activity heatmap data for time-of-day and day-of-week analysis
    
    Args:
        player_name: Name of the player
        start: Start date for analysis
        end: End date for analysis  
        user: Authenticated user
    
    Returns:
        Heatmap data with coaching hints about best performance times
    """
    conn = await get_db_connection()
    try:
        # Get player profile
        player_profile = await get_player_by_name(conn, player_name)
        
        # Get activity by hour (Europe/Oslo timezone)
        hourly_data = await conn.fetch("""
            SELECT 
                EXTRACT(HOUR FROM created_at AT TIME ZONE 'Europe/Oslo') as hour,
                COUNT(*) as activity_count
            FROM activities 
            WHERE profile_id = $1
              AND (created_at AT TIME ZONE 'Europe/Oslo')::date >= $2
              AND (created_at AT TIME ZONE 'Europe/Oslo')::date <= $3
              AND type IN ('book', 'opp', 'deal')
            GROUP BY hour
            ORDER BY hour
        """, player_profile['id'], start, end)
        
        # Get activity by weekday (Europe/Oslo timezone)
        weekday_data = await conn.fetch("""
            SELECT 
                EXTRACT(DOW FROM created_at AT TIME ZONE 'Europe/Oslo') as weekday,
                COUNT(*) as activity_count
            FROM activities 
            WHERE profile_id = $1
              AND (created_at AT TIME ZONE 'Europe/Oslo')::date >= $2
              AND (created_at AT TIME ZONE 'Europe/Oslo')::date <= $3
              AND type IN ('book', 'opp', 'deal')
            GROUP BY weekday
            ORDER BY weekday
        """, player_profile['id'], start, end)
        
        # Convert hourly data to heatmap points
        hour_labels = [f"{h:02d}:00" for h in range(24)]
        by_hour = []
        hourly_dict = {int(row['hour']): row['activity_count'] for row in hourly_data}
        
        for hour in range(24):
            by_hour.append(HeatmapDataPoint(
                period=hour,
                value=hourly_dict.get(hour, 0),
                label=hour_labels[hour]
            ))
        
        # Convert weekday data to heatmap points
        weekday_labels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        by_weekday = []
        weekday_dict = {int(row['weekday']): row['activity_count'] for row in weekday_data}
        
        for weekday in range(7):
            by_weekday.append(HeatmapDataPoint(
                period=weekday,
                value=weekday_dict.get(weekday, 0),
                label=weekday_labels[weekday]
            ))
        
        # Find best performing hour and weekday
        best_hour_data = max(by_hour, key=lambda x: x.value) if by_hour else None
        best_weekday_data = max(by_weekday, key=lambda x: x.value) if by_weekday else None
        
        best_hour = best_hour_data.label if best_hour_data and best_hour_data.value > 0 else None
        best_weekday = best_weekday_data.label if best_weekday_data and best_weekday_data.value > 0 else None
        
        # Generate coaching hint
        coaching_hint = None
        if best_hour and best_weekday:
            coaching_hint = f"You perform best on {best_weekday} around {best_hour}. Try scheduling important calls during these peak times."
        elif best_hour:
            coaching_hint = f"Your peak performance time is around {best_hour}. Schedule important activities then."
        elif best_weekday:
            coaching_hint = f"You're most active on {best_weekday}. Plan your biggest push for this day."
        
        return PlayerInsightsHeatmapResponse(
            player_name=player_name,
            start_date=start,
            end_date=end,
            by_hour=by_hour,
            by_weekday=by_weekday,
            best_hour=best_hour,
            best_weekday=best_weekday,
            coaching_hint=coaching_hint
        )
        
    except Exception as e:
        print(f"Error getting player heatmap: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get player heatmap data")
    finally:
        await conn.close()

@router.get("/insights/streaks")
async def get_player_insights_streaks(
    player_name: str,
    user: AuthorizedUser = None
) -> PlayerInsightsStreaksResponse:
    """
    Get player streaks and achievements data
    
    Args:
        player_name: Name of the player
        user: Authenticated user
    
    Returns:
        Streaks and achievements data
    """
    conn = await get_db_connection()
    try:
        # Get player profile
        player_profile = await get_player_by_name(conn, player_name)
        
        # Get current quarter
        quarter = await get_current_quarter()
        if not quarter:
            raise HTTPException(status_code=404, detail="No active quarter found")
        
        # Calculate current activity streak
        # Get last 30 days of activity (Europe/Oslo timezone)
        recent_activity = await conn.fetch("""
            SELECT DISTINCT (created_at AT TIME ZONE 'Europe/Oslo')::date as activity_date
            FROM activities 
            WHERE profile_id = $1
              AND (created_at AT TIME ZONE 'Europe/Oslo')::date >= CURRENT_DATE - INTERVAL '30 days'
              AND type IN ('book', 'opp', 'deal')
            ORDER BY activity_date DESC
        """, player_profile['id'])
        
        # Calculate streak
        current_streak = 0
        current_date = datetime.now().date()
        
        activity_dates = [row['activity_date'] for row in recent_activity]
        
        # Check consecutive days from today backwards
        check_date = current_date
        while check_date in activity_dates:
            current_streak += 1
            check_date = check_date - timedelta(days=1)
        
        # Find longest streak in current quarter
        quarter_activities = await conn.fetch("""
            SELECT (created_at AT TIME ZONE 'Europe/Oslo')::date as activity_date
            FROM activities 
            WHERE profile_id = $1 AND quarter_id = $2
              AND type IN ('book', 'opp', 'deal')
            ORDER BY activity_date
        """, player_profile['id'], quarter['id'])
        
        # Calculate longest streak in quarter
        longest_streak = 0
        if quarter_activities:
            all_dates = [row['activity_date'] for row in quarter_activities]
            unique_dates = sorted(list(set(all_dates)))
            
            current_longest = 1
            for i in range(1, len(unique_dates)):
                if (unique_dates[i] - unique_dates[i-1]).days == 1:
                    current_longest += 1
                    longest_streak = max(longest_streak, current_longest)
                else:
                    current_longest = 1
            longest_streak = max(longest_streak, current_longest)
        
        # Find best week (most books)
        best_week_data = await conn.fetchrow("""
            SELECT 
                date_trunc('week', created_at AT TIME ZONE 'Europe/Oslo') as week_start,
                COUNT(*) FILTER (WHERE type = 'book') as books_count
            FROM activities 
            WHERE profile_id = $1 AND quarter_id = $2
            GROUP BY week_start
            ORDER BY books_count DESC
            LIMIT 1
        """, player_profile['id'], quarter['id'])
        
        best_week_books = best_week_data['books_count'] if best_week_data else 0
        best_week_period = best_week_data['week_start'].strftime("%b %d") if best_week_data else "N/A"
        
        # Recent achievements (simplified for now)
        recent_achievements = []
        if current_streak >= 7:
            recent_achievements.append(f"🔥 {current_streak}-day streak!")
        if best_week_books >= 5:
            recent_achievements.append(f"⭐ {best_week_books} books in one week!")
        
        streaks_data = StreakData(
            current_activity_streak_days=current_streak,
            longest_activity_streak_days=longest_streak,
            best_week_books=best_week_books,
            best_week_period=best_week_period,
            recent_achievements=recent_achievements
        )
        
        return PlayerInsightsStreaksResponse(
            player_name=player_name,
            quarter_name=quarter['name'],
            streaks=streaks_data
        )
        
    except Exception as e:
        print(f"Error getting player streaks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get player streaks data")
    finally:
        await conn.close()
