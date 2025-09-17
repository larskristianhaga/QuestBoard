
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncpg
import databutton as db
from app.env import mode, Mode
from openai import OpenAI
import json

router = APIRouter()

# Database connection helper
async def get_db_connection():
    if mode == Mode.PROD:
        return await asyncpg.connect(db.secrets.get("DATABASE_URL_PROD"))
    else:
        return await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))

# Response Models
class KPIData(BaseModel):
    books: int
    opps: int
    deals: int
    forecast: int
    books_delta: Optional[float] = None
    opps_delta: Optional[float] = None
    deals_delta: Optional[float] = None
    forecast_delta: Optional[float] = None

class TeamInsightsSummaryResponse(BaseModel):
    kpis: KPIData
    period_start: datetime
    period_end: datetime
    days_in_period: int
    days_passed: int
    comparison_period: Optional[str] = None

class TimeseriesPoint(BaseModel):
    date: str
    value: int
    cumulative: int

class TimeseriesResponse(BaseModel):
    data: List[TimeseriesPoint]
    metric: str
    interval: str
    period_start: datetime
    period_end: datetime

class Milestone(BaseModel):
    threshold: int  # 70, 80, 90, 100
    target_books: int
    current_books: int
    progress_pct: float
    achieved: bool
    what_it_takes: Optional[str] = None

class MilestonesResponse(BaseModel):
    milestones: List[Milestone]
    team_goal_books: int
    current_books: int
    overall_progress_pct: float

class HeatmapCell(BaseModel):
    day: str  # Monday, Tuesday, etc.
    hour: int  # 0-23
    value: int
    label: str  # e.g. "Mon 14-15"

class HeatmapResponse(BaseModel):
    data: List[HeatmapCell]
    max_value: int
    hint: Optional[str] = None

class StreakData(BaseModel):
    player_name: str
    current_streak: int
    longest_streak: int
    streak_type: str  # "books", "opps", "deals"

class StreaksResponse(BaseModel):
    streaks: List[StreakData]
    team_best_streak: int
    team_best_player: str

class Highlight(BaseModel):
    type: str  # "new_high", "milestone", "gap_analysis"
    message: str
    player_name: Optional[str] = None
    timestamp: datetime

class HighlightsResponse(BaseModel):
    highlights: List[Highlight]

class AIInsight(BaseModel):
    type: str  # "trend", "recommendation", "pattern", "coaching"
    title: str
    message: str
    priority: str  # "high", "medium", "low"
    action_items: Optional[List[str]] = None
    confidence: float  # 0.0 - 1.0

class AIInsightsResponse(BaseModel):
    insights: List[AIInsight]
    generated_at: datetime
    data_period: str
    ai_model: str
    cache_expires_at: Optional[datetime] = None

class TimeToGoalPrediction(BaseModel):
    """Predictions for achieving goals"""
    books_days_to_goal: Optional[int]  # None if already achieved or impossible
    opps_days_to_goal: Optional[int]
    deals_days_to_goal: Optional[int]
    points_days_to_goal: Optional[int]
    likelihood_to_achieve_all: str  # "high", "medium", "low", "unlikely"

class ForecastBreakdown(BaseModel):
    """Detailed forecast breakdown for each activity type"""
    activity_type: str
    current_count: int
    daily_rate: float
    projected_total: int
    days_elapsed: int
    total_quarter_days: int
    quarter_name: str
    quarter_progress_percent: float

class DetailedForecastResponse(BaseModel):
    """Detailed forecast calculations for popup display"""
    total_current: int
    total_forecast: int
    total_daily_rate: float
    quarter_info: Dict[str, Any]
    breakdown: List[ForecastBreakdown]
    calculation_method: str

# Simple in-memory cache for AI insights
_insights_cache = {}
_cache_duration = timedelta(minutes=10)  # 10 minute cache

@router.get("/generate-ai-insights", response_model=AIInsightsResponse)
async def generate_ai_insights(
    team_id: Optional[int] = Query(None, description="Team ID filter"),
    range_days: int = Query(30, alias="range", description="Number of days to analyze"),
    force_refresh: bool = Query(False, description="Force refresh cached insights")
):
    """Generate AI-powered team insights using OpenAI GPT-4o-mini."""
    
    # Check cache first
    cache_key = f"insights_{team_id}_{range_days}"
    now = datetime.now()
    
    if not force_refresh and cache_key in _insights_cache:
        cached_data = _insights_cache[cache_key]
        if cached_data['expires_at'] > now:
            return cached_data['response']
    
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=db.secrets.get("OPENAI_API_KEY"))
        
        if not client.api_key:
            return await _generate_fallback_insights(team_id, range_days)
        
        # Collect comprehensive team data
        team_data = await _collect_team_data(team_id, range_days)
        
        # Create AI prompt with structured data
        prompt = _build_insights_prompt(team_data, range_days)
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an elite sales coach and data analyst for QuestBoard, a cosmic-themed gamified sales tracker. Generate strategic insights that are actionable, specific, and engaging. Always return valid JSON."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1200,
            response_format={"type": "json_object"}
        )
        
        # Parse AI response
        ai_content = json.loads(response.choices[0].message.content)
        insights = []
        
        for insight_data in ai_content.get('insights', []):
            insights.append(AIInsight(
                type=insight_data.get('type', 'recommendation'),
                title=insight_data.get('title', 'AI Insight'),
                message=insight_data.get('message', ''),
                priority=insight_data.get('priority', 'medium'),
                action_items=insight_data.get('action_items', []),
                confidence=float(insight_data.get('confidence', 0.8))
            ))
        
        # Create response
        expires_at = now + _cache_duration
        ai_response = AIInsightsResponse(
            insights=insights,
            generated_at=now,
            data_period=f"{range_days} days",
            ai_model="gpt-4o-mini",
            cache_expires_at=expires_at
        )
        
        # Cache the response
        _insights_cache[cache_key] = {
            'response': ai_response,
            'expires_at': expires_at
        }
        
        return ai_response
        
    except Exception as e:
        print(f"AI insights generation failed: {e}")
        # Fallback to rule-based insights
        return await _generate_fallback_insights(team_id, range_days)

async def _collect_team_data(team_id: Optional[int], range_days: int) -> Dict[str, Any]:
    """Collect comprehensive team data for AI analysis."""
    conn = await get_db_connection()
    
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=range_days)
        
        # Get active quarter information first
        quarter_query = """
            SELECT id, name, start_date, end_date, is_active
            FROM quarters 
            WHERE is_active = true
            LIMIT 1
        """
        quarter_data = await conn.fetchrow(quarter_query)
        
        if not quarter_data:
            # Fallback to latest quarter if no active one
            quarter_data = await conn.fetchrow("""
                SELECT id, name, start_date, end_date, is_active
                FROM quarters 
                ORDER BY created_at DESC
                LIMIT 1
            """)
        
        quarter_id = quarter_data['id'] if quarter_data else None
        quarter_name = quarter_data['name'] if quarter_data else 'Unknown Quarter'
        quarter_start = quarter_data['start_date'] if quarter_data else start_date.date()
        quarter_end = quarter_data['end_date'] if quarter_data else end_date.date()
        
        # Calculate days into quarter and total quarter duration
        days_into_quarter = (end_date.date() - quarter_start).days + 1
        total_quarter_days = (quarter_end - quarter_start).days + 1
        quarter_progress = (days_into_quarter / total_quarter_days) * 100 if total_quarter_days > 0 else 0
        
        # Get KPI summary for active quarter
        kpi_query = """
            SELECT 
                a.type,
                COUNT(*) as count,
                AVG(a.points) as avg_points
            FROM activities a
            JOIN profiles p ON a.profile_id = p.id
            JOIN quarters q ON a.quarter_id = q.id
            WHERE q.is_active = true
            AND a.created_at >= $1
            AND a.created_at <= $2
            GROUP BY a.type
        """
        kpi_data = await conn.fetch(kpi_query, start_date, end_date)
        
        # Get player performance with quarter context
        player_query = """
            SELECT 
                p.name,
                p.goal_books, p.goal_opps, p.goal_deals,
                COUNT(CASE WHEN a.type = 'book' THEN 1 END) as books,
                COUNT(CASE WHEN a.type = 'opp' THEN 1 END) as opps,
                COUNT(CASE WHEN a.type = 'deal' THEN 1 END) as deals,
                COUNT(*) as total_activities
            FROM profiles p
            JOIN quarters q ON p.quarter_id = q.id
            LEFT JOIN activities a ON a.profile_id = p.id AND a.created_at >= $1
            WHERE q.is_active = true
            GROUP BY p.name, p.goal_books, p.goal_opps, p.goal_deals
            ORDER BY total_activities DESC
        """
        player_data = await conn.fetch(player_query, start_date)
        
        # Get trend data for quarter period
        trend_query = """
            SELECT 
                DATE(a.created_at) as date,
                COUNT(*) as daily_activities
            FROM activities a
            JOIN profiles p ON a.profile_id = p.id
            JOIN quarters q ON a.quarter_id = q.id
            WHERE q.is_active = true
            AND a.created_at >= $1
            GROUP BY DATE(a.created_at)
            ORDER BY date
        """
        trend_data = await conn.fetch(trend_query, start_date - timedelta(days=7))
        
        # Process and structure data with quarter context
        return {
            'quarter': {
                'id': quarter_id,
                'name': quarter_name,
                'start_date': quarter_start.isoformat(),
                'end_date': quarter_end.isoformat(),
                'days_into_quarter': days_into_quarter,
                'total_quarter_days': total_quarter_days,
                'progress_percentage': round(quarter_progress, 1),
                'is_active': quarter_data['is_active'] if quarter_data else False
            },
            'period': {'start': start_date.isoformat(), 'end': end_date.isoformat(), 'days': range_days},
            'kpis': {row['type']: {'count': row['count'], 'avg_points': float(row['avg_points'])} for row in kpi_data},
            'players': [{
                'name': row['name'],
                'goal_books': row['goal_books'],
                'goal_opps': row['goal_opps'], 
                'goal_deals': row['goal_deals'],
                'books': row['books'],
                'opps': row['opps'],
                'deals': row['deals'],
                'total_activities': row['total_activities'],
                'books_progress': (row['books'] / row['goal_books'] * 100) if row['goal_books'] else 0,
                'opps_progress': (row['opps'] / row['goal_opps'] * 100) if row['goal_opps'] else 0,
                'deals_progress': (row['deals'] / row['goal_deals'] * 100) if row['goal_deals'] else 0
            } for row in player_data],
            'trends': [{'date': row['date'].isoformat(), 'activities': row['daily_activities']} for row in trend_data]
        }
        
    finally:
        await conn.close()

def _build_insights_prompt(team_data: Dict[str, Any], range_days: int) -> str:
    """Build structured prompt for AI insights generation."""
    quarter = team_data.get('quarter', {})
    quarter_name = quarter.get('name', 'Current Quarter')
    quarter_progress = quarter.get('progress_percentage', 0)
    days_into_quarter = quarter.get('days_into_quarter', 0)
    total_quarter_days = quarter.get('total_quarter_days', 90)
    
    return f"""
Analyze this QuestBoard team performance for {quarter_name} and generate 3-5 strategic insights.

QUARTER CONTEXT:
- Quarter: {quarter_name} ({quarter.get('start_date', 'N/A')} to {quarter.get('end_date', 'N/A')})
- Progress: {quarter_progress}% through the quarter ({days_into_quarter}/{total_quarter_days} days)
- Analysis Period: Last {range_days} days ({team_data['period']['start']} to {team_data['period']['end']})
- Quarter Status: {'🟢 Active' if quarter.get('is_active') else '🔴 Inactive'}

TEAM KPIS FOR {quarter_name.upper()}:
{json.dumps(team_data['kpis'], indent=2)}

PLAYER GOALS & PROGRESS IN {quarter_name.upper()}:
{json.dumps(team_data['players'], indent=2)}

RECENT ACTIVITY TRENDS:
{json.dumps(team_data['trends'][-14:], indent=2)}

Generate insights that are:
1. QUARTER-FOCUSED - Reference {quarter_name} specifically and progress toward quarter goals
2. COSMIC-THEMED - Use space/galaxy metaphors naturally (we're on a cosmic sales journey)
3. ACTIONABLE - Specific steps the team can take before {quarter_name} ends
4. DATA-DRIVEN - Reference specific numbers, percentages, and quarter progress
5. STRATEGIC - Focus on achieving {quarter_name} objectives and quarter-end goals

Return JSON in this format:
{{
  "insights": [
    {{
      "type": "trend|recommendation|pattern|coaching",
      "title": "Short compelling title referencing {quarter_name} context",
      "message": "2-3 sentence insight with cosmic flair and quarter focus",
      "priority": "high|medium|low",
      "action_items": ["Specific action before {quarter_name} ends", "Quarter-focused strategy"],
      "confidence": 0.85
    }}
  ]
}}

Key Analysis Areas:
- Progress toward {quarter_name} goals vs timeline ({quarter_progress}% through quarter)
- Individual player performance against their {quarter_name} targets
- Activity momentum and what's needed to finish {quarter_name} strong
- Team dynamics and collaboration during {quarter_name}
- Strategic pivots needed for {quarter_name} success
- Pacing analysis: Are we on track for {quarter_name} objectives?

Remember: This team is on a cosmic sales adventure through {quarter_name}! 🚀
"""

async def _generate_fallback_insights(team_id: Optional[int], range_days: int) -> AIInsightsResponse:
    """Generate rule-based fallback insights when AI is unavailable."""
    team_data = await _collect_team_data(team_id, range_days)
    
    insights = []
    
    # Rule-based insight generation
    total_books = sum(player['books'] for player in team_data['players'])
    total_players = len(team_data['players'])
    
    if total_players > 0:
        avg_books = total_books / total_players
        
        if avg_books < 2:
            insights.append(AIInsight(
                type="coaching",
                title="🚀 Ignition Sequence Needed",
                message="Your cosmic crew needs more momentum! The galaxy awaits more booked meetings to fuel your journey to the stars.",
                priority="high",
                action_items=["Focus on booking 1 meeting per day", "Review outreach strategies"],
                confidence=0.9
            ))
        elif avg_books > 8:
            insights.append(AIInsight(
                type="trend",
                title="⭐ Stellar Performance Detected",
                message="Your team is navigating the sales cosmos like seasoned space explorers! Keep this stellar momentum going.",
                priority="low",
                action_items=["Maintain current strategies", "Share best practices within team"],
                confidence=0.8
            ))
    
    # Add more rule-based insights...
    insights.append(AIInsight(
        type="recommendation",
        title="📊 Navigation Data Analysis",
        message="Continue logging your cosmic activities to unlock deeper insights about your team's journey through the sales universe.",
        priority="medium",
        action_items=["Review activity logging consistency"],
        confidence=0.7
    ))
    
    return AIInsightsResponse(
        insights=insights,
        generated_at=datetime.now(),
        data_period=f"{range_days} days",
        ai_model="fallback-rules",
        cache_expires_at=None
    )

# Helper function to get team members
async def get_team_members(conn, team_id: Optional[int] = None):
    """Get all team members for insights. If no team_id, get all active players."""
    if team_id:
        # For now, we'll get all active players since team structure isn't fully defined
        # TODO: Implement proper team filtering when team structure is added
        pass
    
    query = """
        SELECT DISTINCT p.id, p.name, p.user_id
        FROM profiles p
        JOIN quarters q ON p.quarter_id = q.id
        WHERE q.is_active = true
    """
    return await conn.fetch(query)

@router.get("/summary", response_model=TeamInsightsSummaryResponse)
async def get_team_insights_summary(
    team_id: Optional[int] = Query(None, description="Team ID filter"),
    range_days: int = Query(30, alias="range", description="Number of days to analyze"),
    compare: bool = Query(False, description="Include comparison with previous period"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get team KPI summary with optional comparison to previous period."""
    conn = await get_db_connection()
    
    try:
        # If no start/end dates provided, use active quarter
        if not start_date or not end_date:
            quarter_query = """
                SELECT start_date, end_date 
                FROM quarters 
                WHERE is_active = true
                LIMIT 1
            """
            quarter_data = await conn.fetchrow(quarter_query)
            
            if quarter_data:
                # Use active quarter dates
                start_date_obj = quarter_data['start_date']
                end_date_obj = quarter_data['end_date']
            else:
                # Fallback to range_days if no active quarter
                end_date_obj = datetime.now().date()
                start_date_obj = end_date_obj - timedelta(days=range_days)
        else:
            # Use provided dates
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Calculate date ranges for datetime queries
        start_datetime = datetime.combine(start_date_obj, datetime.min.time())
        end_datetime = datetime.combine(end_date_obj, datetime.max.time())
        
        # Get current period data
        current_query = """
            SELECT 
                a.type,
                COUNT(*) as count,
                SUM(a.points) as total_points
            FROM activities a
            JOIN profiles p ON a.profile_id = p.id
            JOIN quarters q ON a.quarter_id = q.id
            WHERE q.is_active = true
            AND a.created_at >= $1
            AND a.created_at <= $2
            GROUP BY a.type
        """
        
        current_data = await conn.fetch(current_query, start_datetime, end_datetime)
        
        # Process current data
        kpis = {"books": 0, "opps": 0, "deals": 0, "forecast": 0}
        total_activities = 0
        for row in current_data:
            if row['type'] == 'book':
                kpis['books'] = row['count']
                total_activities += row['count']
            elif row['type'] == 'opp':
                kpis['opps'] = row['count']
                total_activities += row['count']
            elif row['type'] == 'deal':
                kpis['deals'] = row['count']
                total_activities += row['count']
        
        # Calculate basic forecast (simplified logic)
        kpis['forecast'] = kpis['books'] * 0.3 + kpis['opps'] * 0.6 + kpis['deals']
        
        # Calculate period info
        days_passed = (datetime.now().date() - start_date_obj).days + 1
        days_in_period = (end_date_obj - start_date_obj).days + 1
        
        comparison = None
        if compare:
            # Calculate previous period for comparison
            prev_period_days = days_in_period
            prev_start = start_date_obj - timedelta(days=prev_period_days)
            prev_end = start_date_obj - timedelta(days=1)
            
            prev_start_datetime = datetime.combine(prev_start, datetime.min.time())
            prev_end_datetime = datetime.combine(prev_end, datetime.max.time())
            
            prev_data = await conn.fetch(current_query, prev_start_datetime, prev_end_datetime)
            
            prev_kpis = {"books": 0, "opps": 0, "deals": 0}
            for row in prev_data:
                if row['type'] == 'book':
                    prev_kpis['books'] = row['count']
                elif row['type'] == 'opp':
                    prev_kpis['opps'] = row['count']
                elif row['type'] == 'deal':
                    prev_kpis['deals'] = row['count']
            
            comparison = {
                "books_change": ((kpis['books'] - prev_kpis['books']) / max(prev_kpis['books'], 1)) * 100,
                "opps_change": ((kpis['opps'] - prev_kpis['opps']) / max(prev_kpis['opps'], 1)) * 100,
                "deals_change": ((kpis['deals'] - prev_kpis['deals']) / max(prev_kpis['deals'], 1)) * 100
            }
        
        # Calculate deltas for comparison if enabled
        deltas = {}
        if comparison:
            deltas = {
                "books_delta": comparison["books_change"],
                "opps_delta": comparison["opps_change"],
                "deals_delta": comparison["deals_change"],
                "forecast_delta": 0.0  # Could calculate forecast delta if needed
            }
        
        return TeamInsightsSummaryResponse(
            kpis=KPIData(
                books=kpis['books'],
                opps=kpis['opps'], 
                deals=kpis['deals'],
                forecast=int(kpis['forecast']),
                **deltas
            ),
            period_start=datetime.combine(start_date_obj, datetime.min.time()),
            period_end=datetime.combine(end_date_obj, datetime.max.time()),
            days_passed=days_passed,
            days_in_period=days_in_period,
            comparison_period=f"{start_date_obj} to {end_date_obj}" if comparison else None
        )
        
    finally:
        await conn.close()

@router.get("/timeseries", response_model=TimeseriesResponse)
async def get_team_insights_timeseries(
    team_id: Optional[int] = Query(None, description="Team ID filter"),
    metric: str = Query("books", description="Metric to track (books, opps, deals)"),
    interval: str = Query("daily", description="Interval (daily, weekly)"),
    range_days: int = Query(30, alias="range", description="Number of days to analyze"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get timeseries data for a specific metric."""
    if metric not in ['books', 'opps', 'deals']:
        raise HTTPException(status_code=400, detail="Invalid metric. Must be books, opps, or deals")
    
    # Map API metric names to database enum values
    metric_map = {
        'books': 'book',
        'opps': 'opp', 
        'deals': 'deal'
    }
    db_metric = metric_map[metric]
    
    conn = await get_db_connection()
    
    try:
        # If no start/end dates provided, use active quarter
        if not start_date or not end_date:
            quarter_query = """
                SELECT start_date, end_date 
                FROM quarters 
                WHERE is_active = true
                LIMIT 1
            """
            quarter_data = await conn.fetchrow(quarter_query)
            
            if quarter_data:
                # Use active quarter dates
                start_date_obj = quarter_data['start_date']
                end_date_obj = quarter_data['end_date']
            else:
                # Fallback to range_days if no active quarter
                end_date_obj = datetime.now().date()
                start_date_obj = end_date_obj - timedelta(days=range_days)
        else:
            # Use provided dates
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Calculate date ranges for datetime queries
        start_datetime = datetime.combine(start_date_obj, datetime.min.time())
        end_datetime = datetime.combine(end_date_obj, datetime.max.time())
        
        if interval == "daily":
            query = """
                SELECT 
                    DATE(a.created_at) as activity_date,
                    COUNT(*) as count
                FROM activities a
                JOIN profiles p ON a.profile_id = p.id
                JOIN quarters q ON a.quarter_id = q.id
                WHERE q.is_active = true
                AND a.type = $1
                AND a.created_at >= $2
                AND a.created_at <= $3
                GROUP BY DATE(a.created_at)
                ORDER BY activity_date
            """
        else:
            # Weekly aggregation
            query = """
                SELECT 
                    DATE_TRUNC('week', a.created_at)::date as activity_date,
                    COUNT(*) as count
                FROM activities a
                JOIN profiles p ON a.profile_id = p.id
                JOIN quarters q ON a.quarter_id = q.id
                WHERE q.is_active = true
                AND a.type = $1
                AND a.created_at >= $2
                AND a.created_at <= $3
                GROUP BY DATE_TRUNC('week', a.created_at)
                ORDER BY activity_date
            """
        
        data = await conn.fetch(query, db_metric, start_datetime, end_datetime)
        
        # Process data and calculate cumulative
        timeseries = []
        cumulative = 0
        
        # Fill in missing dates with zero values if interval is daily
        if interval == "daily":
            current_date = start_date_obj
            while current_date <= end_date_obj:
                day_count = 0
                for row in data:
                    if row['activity_date'] == current_date:
                        day_count = row['count']
                        break
                
                cumulative += day_count
                timeseries.append({
                    "date": current_date.strftime('%Y-%m-%d'),
                    "value": day_count,
                    "cumulative": cumulative
                })
                current_date += timedelta(days=1)
        else:
            # Weekly aggregation
            for row in data:
                cumulative += row['count']
                timeseries.append({
                    "date": row['activity_date'].strftime('%Y-%m-%d'),
                    "value": row['count'],
                    "cumulative": cumulative
                })
        
        return TimeseriesResponse(
            metric=metric,
            interval=interval,
            data=timeseries,
            period_start=start_date_obj.strftime('%Y-%m-%d'),
            period_end=end_date_obj.strftime('%Y-%m-%d')
        )
        
    finally:
        await conn.close()

@router.get("/milestones", response_model=MilestonesResponse)
async def get_team_insights_milestones(
    team_id: Optional[int] = Query(None, description="Team ID filter"),
    range_days: int = Query(30, alias="range", description="Number of days to analyze"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get milestone progress with what-it-takes calculations."""
    conn = await get_db_connection()
    
    try:
        # If no start/end dates provided, use active quarter
        if not start_date or not end_date:
            quarter_query = """
                SELECT start_date, end_date 
                FROM quarters 
                WHERE is_active = true
                LIMIT 1
            """
            quarter_data = await conn.fetchrow(quarter_query)
            
            if quarter_data:
                # Use active quarter dates
                start_date_obj = quarter_data['start_date']
                end_date_obj = quarter_data['end_date']
            else:
                # Fallback to range_days if no active quarter
                end_date_obj = datetime.now().date()
                start_date_obj = end_date_obj - timedelta(days=range_days)
        else:
            # Use provided dates
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Calculate date ranges for datetime queries
        start_datetime = datetime.combine(start_date_obj, datetime.min.time())
        end_datetime = datetime.combine(end_date_obj, datetime.max.time())
        
        # Get team goal (sum of individual goals)
        goal_query = """
            SELECT SUM(goal_books) as team_goal
            FROM profiles p
            JOIN quarters q ON p.quarter_id = q.id
            WHERE q.is_active = true
        """
        goal_result = await conn.fetchrow(goal_query)
        team_goal_books = goal_result['team_goal'] or 120  # Default if no goals set
        
        # Get current books count
        current_query = """
            SELECT COUNT(*) as current_books
            FROM activities a
            JOIN profiles p ON a.profile_id = p.id
            JOIN quarters q ON a.quarter_id = q.id
            WHERE q.is_active = true
            AND a.type = 'book'
        """
        current_result = await conn.fetchrow(current_query)
        current_books = current_result['current_books']
        
        # Calculate milestones
        milestones = []
        thresholds = [70, 80, 90, 100]
        
        for threshold in thresholds:
            target_books = int((threshold / 100) * team_goal_books)
            progress_pct = (current_books / target_books * 100) if target_books > 0 else 0
            achieved = current_books >= target_books
            
            what_it_takes = None
            if not achieved and threshold < 100:
                needed = target_books - current_books
                what_it_takes = f"Need {needed} more books to reach {threshold}%"
            
            milestones.append(Milestone(
                threshold=threshold,
                target_books=target_books,
                current_books=current_books,
                progress_pct=min(progress_pct, 100.0),
                achieved=achieved,
                what_it_takes=what_it_takes
            ))
        
        overall_progress = (current_books / team_goal_books * 100) if team_goal_books > 0 else 0
        
        return MilestonesResponse(
            milestones=milestones,
            team_goal_books=team_goal_books,
            current_books=current_books,
            overall_progress_pct=min(overall_progress, 100.0)
        )
        
    finally:
        await conn.close()

@router.get("/heatmap", response_model=HeatmapResponse)
async def get_team_insights_heatmap(
    team_id: Optional[int] = Query(None, description="Team ID filter"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get activity heatmap by day of week and hour."""
    conn = await get_db_connection()
    
    try:
        # Default to last 30 days if no dates provided
        if not start_date or not end_date:
            end_dt = datetime.now()
            start_dt = end_dt - timedelta(days=30)
        else:
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(end_date)
        
        query = """
            SELECT 
                EXTRACT(DOW FROM a.created_at) as dow,
                EXTRACT(HOUR FROM a.created_at) as hour,
                COUNT(*) as activity_count
            FROM activities a
            JOIN profiles p ON a.profile_id = p.id
            JOIN quarters q ON a.quarter_id = q.id
            WHERE q.is_active = true
            AND a.created_at >= $1
            AND a.created_at <= $2
            GROUP BY EXTRACT(DOW FROM a.created_at), EXTRACT(HOUR FROM a.created_at)
            ORDER BY dow, hour
        """
        
        data = await conn.fetch(query, start_dt, end_dt)
        
        # Convert to heatmap format
        days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        heatmap_data = []
        max_value = 0
        best_slot = None
        best_count = 0
        
        for row in data:
            dow = int(row['dow'])
            hour = int(row['hour'])
            count = row['activity_count']
            
            if count > best_count:
                best_count = count
                best_slot = (days[dow], hour)
            
            max_value = max(max_value, count)
            
            heatmap_data.append(HeatmapCell(
                day=days[dow],
                hour=hour,
                value=count,
                label=f"{days[dow][:3]} {hour:02d}-{(hour+1):02d}"
            ))
        
        # Generate hint
        hint = None
        if best_slot:
            day, hour = best_slot
            hint = f"Block 30 min {day} {hour:02d}-{(hour+1):02d}"
        
        return HeatmapResponse(
            data=heatmap_data,
            max_value=max_value,
            hint=hint
        )
        
    finally:
        await conn.close()

@router.get("/streaks", response_model=StreaksResponse)
async def get_team_insights_streaks(
    team_id: Optional[int] = Query(None, description="Team ID filter"),
    range_days: int = Query(30, alias="range", description="Number of days to analyze"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get player streak data."""
    conn = await get_db_connection()
    
    try:
        # If no start/end dates provided, use active quarter
        if not start_date or not end_date:
            quarter_query = """
                SELECT start_date, end_date 
                FROM quarters 
                WHERE is_active = true
                LIMIT 1
            """
            quarter_data = await conn.fetchrow(quarter_query)
            
            if quarter_data:
                # Use active quarter dates
                start_date_obj = quarter_data['start_date']
                end_date_obj = quarter_data['end_date']
            else:
                # Fallback to range_days if no active quarter
                end_date_obj = datetime.now().date()
                start_date_obj = end_date_obj - timedelta(days=range_days)
        else:
            # Use provided dates
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Calculate date ranges for datetime queries
        start_datetime = datetime.combine(start_date_obj, datetime.min.time())
        end_datetime = datetime.combine(end_date_obj, datetime.max.time())
        
        # For simplicity, we'll calculate streaks based on consecutive days with activities
        # This is a simplified version - a full implementation would track different streak types
        
        query = """
            SELECT 
                p.name as player_name,
                DATE(a.created_at) as activity_date,
                COUNT(*) as daily_activities
            FROM activities a
            JOIN profiles p ON a.profile_id = p.id
            JOIN quarters q ON a.quarter_id = q.id
            WHERE q.is_active = true
            AND a.created_at >= $1
            AND a.created_at <= $2
            GROUP BY p.name, DATE(a.created_at)
            ORDER BY p.name, activity_date
        """
        
        data = await conn.fetch(query, start_datetime, end_datetime)
        
        # Calculate streaks (simplified)
        player_streaks = {}
        current_streaks = {}
        
        for row in data:
            player = row['player_name']
            if player not in player_streaks:
                player_streaks[player] = {'current': 1, 'longest': 1}
                current_streaks[player] = 1
            else:
                current_streaks[player] += 1
                player_streaks[player]['current'] = current_streaks[player]
                player_streaks[player]['longest'] = max(player_streaks[player]['longest'], current_streaks[player])
        
        # Convert to response format
        streaks = []
        team_best_streak = 0
        team_best_player = ""
        
        for player, streak_data in player_streaks.items():
            if streak_data['longest'] > team_best_streak:
                team_best_streak = streak_data['longest']
                team_best_player = player
            
            streaks.append(StreakData(
                player_name=player,
                current_streak=streak_data['current'],
                longest_streak=streak_data['longest'],
                streak_type="activities"
            ))
        
        return StreaksResponse(
            streaks=streaks,
            team_best_streak=team_best_streak,
            team_best_player=team_best_player
        )
        
    finally:
        await conn.close()

@router.get("/highlights", response_model=HighlightsResponse)
async def get_team_insights_highlights(
    team_id: Optional[int] = Query(None, description="Team ID filter"),
    range_days: int = Query(7, alias="range", description="Number of days to analyze"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get recent highlights and achievements."""
    conn = await get_db_connection()
    
    try:
        # If no start/end dates provided, use active quarter (but for highlights, use last 7 days of quarter)
        if not start_date or not end_date:
            quarter_query = """
                SELECT start_date, end_date 
                FROM quarters 
                WHERE is_active = true
                LIMIT 1
            """
            quarter_data = await conn.fetchrow(quarter_query)
            
            if quarter_data:
                # For highlights, use last range_days of the quarter or current date, whichever is earlier
                quarter_end = quarter_data['end_date']
                today = datetime.now().date()
                
                # Use the earlier of today or quarter end
                end_date_obj = min(today, quarter_end)
                start_date_obj = end_date_obj - timedelta(days=range_days)
                
                # Don't go before quarter start
                quarter_start = quarter_data['start_date']
                start_date_obj = max(start_date_obj, quarter_start)
            else:
                # Fallback to range_days if no active quarter
                end_date_obj = datetime.now().date()
                start_date_obj = end_date_obj - timedelta(days=range_days)
        else:
            # Use provided dates
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Calculate date ranges for datetime queries
        start_datetime = datetime.combine(start_date_obj, datetime.min.time())
        end_datetime = datetime.combine(end_date_obj, datetime.max.time())
        
        highlights = []
        
        # Find recent high performers
        high_performer_query = """
            SELECT 
                p.name as player_name,
                COUNT(*) as recent_activities,
                MAX(a.created_at) as last_activity
            FROM activities a
            JOIN profiles p ON a.profile_id = p.id
            JOIN quarters q ON a.quarter_id = q.id
            WHERE q.is_active = true
            AND a.created_at >= $1
            AND a.created_at <= $2
            GROUP BY p.name
            HAVING COUNT(*) >= 5
            ORDER BY recent_activities DESC
            LIMIT 3
        """
        
        high_performers = await conn.fetch(high_performer_query, start_date, end_date)
        
        for performer in high_performers:
            highlights.append(Highlight(
                type="new_high",
                message=f"{performer['player_name']} logged {performer['recent_activities']} activities this week!",
                player_name=performer['player_name'],
                timestamp=performer['last_activity']
            ))
        
        # Check milestone achievements (simplified)
        milestone_query = """
            SELECT 
                p.name as player_name,
                COUNT(*) as total_books
            FROM activities a
            JOIN profiles p ON a.profile_id = p.id
            JOIN quarters q ON a.quarter_id = q.id
            WHERE q.is_active = true
            AND a.type = 'book'
            GROUP BY p.name
            HAVING COUNT(*) % 10 = 0 AND COUNT(*) > 0
        """
        
        milestones = await conn.fetch(milestone_query)
        
        for milestone in milestones:
            highlights.append(Highlight(
                type="milestone",
                message=f"{milestone['player_name']} reached {milestone['total_books']} books!",
                player_name=milestone['player_name'],
                timestamp=datetime.now()
            ))
        
        return HighlightsResponse(
            highlights=highlights[-10:]  # Last 10 highlights
        )
        
    finally:
        await conn.close()

@router.get("/forecast-breakdown", response_model=DetailedForecastResponse)
async def get_forecast_breakdown(
    team_id: Optional[int] = Query(None, description="Team ID filter"),
    range_days: int = Query(30, alias="range", description="Number of days for comparison")
):
    """
    Get detailed forecast breakdown showing calculations for each activity type.
    Used for the forecast popup modal.
    """
    conn = await get_db_connection()
    
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=range_days)
        
        # Get quarter information
        quarter_info = await conn.fetchrow("""
            SELECT id, name, start_date, end_date, is_active 
            FROM quarters 
            WHERE is_active = true 
            LIMIT 1
        """)
        
        if not quarter_info:
            raise HTTPException(status_code=404, detail="No active quarter found")
            
        quarter_start = quarter_info['start_date']
        quarter_end = quarter_info['end_date']
        today = datetime.now().date()
        
        # Calculate quarter metrics
        days_elapsed = max(1, (today - quarter_start).days + 1)
        total_quarter_days = (quarter_end - quarter_start).days + 1
        quarter_progress = (days_elapsed / total_quarter_days) * 100
        
        # Get current activity data
        activity_query = """
            SELECT 
                type,
                COUNT(*) as count
            FROM activities a
            JOIN profiles p ON a.profile_id = p.id
            WHERE a.quarter_id = $1
            GROUP BY type
            ORDER BY type
        """
        
        activity_data = await conn.fetch(activity_query, quarter_info['id'])
        
        # Process data and calculate forecasts
        breakdown = []
        total_current = 0
        total_forecast = 0
        
        activity_types = ['book', 'opp', 'deal']
        activity_labels = {'book': 'Books', 'opp': 'Opportunities', 'deal': 'Deals'}
        
        # Create lookup for current data
        current_counts = {row['type']: row['count'] for row in activity_data}
        
        for activity_type in activity_types:
            current_count = current_counts.get(activity_type, 0)
            daily_rate = current_count / days_elapsed if days_elapsed > 0 else 0
            projected_total = int(daily_rate * total_quarter_days) if daily_rate > 0 else current_count
            
            breakdown.append(ForecastBreakdown(
                activity_type=activity_labels[activity_type],
                current_count=current_count,
                daily_rate=round(daily_rate, 2),
                projected_total=projected_total,
                days_elapsed=days_elapsed,
                total_quarter_days=total_quarter_days,
                quarter_name=quarter_info['name'],
                quarter_progress_percent=round(quarter_progress, 1)
            ))
            
            total_current += current_count
            total_forecast += projected_total
        
        total_daily_rate = total_current / days_elapsed if days_elapsed > 0 else 0
        
        return DetailedForecastResponse(
            total_current=total_current,
            total_forecast=total_forecast,
            total_daily_rate=round(total_daily_rate, 2),
            quarter_info={
                'name': quarter_info['name'],
                'start_date': quarter_start.isoformat(),
                'end_date': quarter_end.isoformat(),
                'days_elapsed': days_elapsed,
                'total_days': total_quarter_days,
                'progress_percent': round(quarter_progress, 1)
            },
            breakdown=breakdown,
            calculation_method="quarter_based"
        )
        
    finally:
        await conn.close()
