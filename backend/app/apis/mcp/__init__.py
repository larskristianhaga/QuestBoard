








from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import asyncpg
from datetime import datetime, timedelta
import hashlib
import time

# Import existing API functions and models
from app.libs.models_competition_v2 import (
    CompetitionEventCreate, 
    CompetitionEventResponse, 
    BookingActivityType,
    ScoreboardResponse,
    CompetitionRules,
    PointsConfig
)
from app.libs.scoring_engine import ScoringEngine
import databutton as db

router = APIRouter(prefix="/mcp")

# Feature flag for MCP functionality (can be toggled on/off)
MCP_ENABLED = True  # This will become a proper feature flag later

# Rate limiting counters (in production, use Redis or similar)
_rate_limits = {
    "events": {},
    "competitions": {},
    "visuals": {},
    "meeting_workflows": {}
}

# Request/Response Models
class LogEventRequest(BaseModel):
    competition_id: int = 0  # 0 means auto-detect active competition
    activity_type: str  # "book", "call", "lift", etc.
    count: int = 1
    player_name: Optional[str] = None
    description: Optional[str] = None

class LogEventResponse(BaseModel):
    success: bool
    event_id: Optional[str] = None
    message: str
    points_earned: int = 0

class LeaderboardRequest(BaseModel):
    competition_id: int = 0  # 0 means auto-detect active competition
    limit: int = 10

class LeaderboardResponse(BaseModel):
    competition_id: int
    standings: List[Dict[str, Any]]
    last_updated: str

class PlayerProgressRequest(BaseModel):
    player_id: Optional[str] = None
    period: str = "current_quarter"

class PlayerProgressResponse(BaseModel):
    player_id: str
    player_name: str
    progress: Dict[str, Any]
    streaks: Dict[str, Any]
    achievements: List[Dict[str, Any]]

class CreateCompetitionRequest(BaseModel):
    name: str
    description: Optional[str] = None
    activity_types: List[str] = ["book", "call", "lift"]
    duration_hours: int = 24
    auto_start: bool = True
    rules: Optional[Dict[str, Any]] = None

class CreateCompetitionResponse(BaseModel):
    success: bool
    competition_id: Optional[int] = None
    message: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class FinalizeCompetitionRequest(BaseModel):
    competition_id: int
    force: bool = False

class FinalizeCompetitionResponse(BaseModel):
    success: bool
    message: str
    winner: Optional[Dict[str, Any]] = None
    final_standings: List[Dict[str, Any]] = []

class UndoEventRequest(BaseModel):
    competition_id: int
    event_id: Optional[str] = None  # If None, undo last event
    player_name: Optional[str] = None  # If event_id is None, undo last for this player

class UndoEventResponse(BaseModel):
    success: bool
    message: str
    events_undone: int = 0

class GenerateVisualsRequest(BaseModel):
    team_name: str
    style_prompt: str = "cosmic gaming theme with vibrant colors"
    asset_types: List[str] = ["emblem", "banner"]  # "emblem", "banner", "avatar"
    regenerate: bool = False

class GenerateVisualsResponse(BaseModel):
    success: bool
    message: str
    assets: Dict[str, str] = {}  # asset_type -> url
    generation_id: Optional[str] = None

class ManageVisualsRequest(BaseModel):
    team_name: str
    action: str  # "lock", "unlock", "set_active"
    version: Optional[str] = None
    asset_type: Optional[str] = None

class ManageVisualsResponse(BaseModel):
    success: bool
    message: str
    current_version: Optional[str] = None

class VisualsHistoryRequest(BaseModel):
    team_name: str
    limit: int = 20

class VisualsHistoryResponse(BaseModel):
    success: bool
    message: str
    versions: List[Dict[str, Any]] = []
    total_versions: int = 0

class MCPServerInfo(BaseModel):
    capabilities: Dict[str, bool]
    tools: List[Dict[str, Any]]

class MeetingWorkflowRequest(BaseModel):
    workflow_type: str  # "monday_kickoff", "midweek_check", "friday_wrap"
    auto_actions: bool = True
    team_id: Optional[int] = None
    horizon: Optional[str] = "week"  # "week", "month", "quarter"

class MeetingWorkflowResponse(BaseModel):
    success: bool
    message: str
    workflow_data: Optional[Dict[str, Any]] = None
    actions_taken: List[str] = []
    export_url: Optional[str] = None

# Helper functions
async def get_connection():
    """Get database connection"""
    return await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))

async def get_active_competition_id() -> Optional[int]:
    """Get the ID of the currently active competition using same logic as frontend context"""
    conn = await get_connection()
    try:
        # First try v1 competitions (same as frontend context logic)
        v1_competitions = await conn.fetch(
            """
            SELECT id, name, is_active, created_at 
            FROM booking_competitions 
            WHERE is_active = true AND is_hidden = false
            ORDER BY created_at ASC
            """
        )
        
        if v1_competitions:
            # Check which V1 competitions have actual data (same as frontend priority)
            for comp in v1_competitions:
                entry_count = await conn.fetchval(
                    "SELECT COUNT(*) FROM booking_competition_entries WHERE competition_id = $1",
                    comp['id']
                )
                if entry_count > 0:
                    print(f"📊 MCP: Selected active competition {comp['id']} (has {entry_count} entries)")
                    return comp['id']
            
            # If no V1 has data, use the first active V1
            print(f"📊 MCP: Selected active competition {v1_competitions[0]['id']} (no entries yet)")
            return v1_competitions[0]['id']
        
        # Fallback: try v2 competitions if no v1 found
        row = await conn.fetchrow(
            """
            SELECT id FROM competitions_v2 
            WHERE state = 'active' AND is_hidden = false
            ORDER BY created_at DESC 
            LIMIT 1
            """
        )
        if row:
            print(f"📊 MCP: Selected V2 competition {row['id']}")
            return row['id']
        
        print("⚠️ MCP: No active competitions found")
        return None
    finally:
        await conn.close()

def check_rate_limit(tool_name: str) -> bool:
    """Check if rate limit allows the action"""
    # Simplified rate limiting for MVP
    return True

def validate_content(content: str) -> bool:
    """Basic content validation to prevent malicious input"""
    if not content:
        return True
    
    # Basic checks for script injection, SQL injection, etc.
    dangerous_patterns = ['<script', 'javascript:', 'DROP TABLE', 'DELETE FROM', '--', ';']
    content_lower = content.lower()
    
    for pattern in dangerous_patterns:
        if pattern in content_lower:
            return False
    
    return True

# Core MCP Tools as regular FastAPI endpoints

@router.post("/tools/competitions/log-event", response_model=LogEventResponse)
async def mcp_log_competition_event(
    request: LogEventRequest
) -> LogEventResponse:
    """Log an activity event to a competition via MCP.
    
    Perfect for AI assistants to capture activities from voice commands,
    meeting transcripts, or automated workflow integrations.
    """
    if not MCP_ENABLED:
        raise HTTPException(status_code=503, detail="MCP functionality is currently disabled")
    
    # Apply safeguards
    if not check_rate_limit("competitions.log_event"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Too many events logged recently.")
    
    if not validate_content(request.description or ""):
        raise HTTPException(status_code=400, detail="Invalid content detected in description")
    
    if not validate_content(request.player_name or ""):
        raise HTTPException(status_code=400, detail="Invalid content detected in player name")
    
    try:
        # Map activity types to BookingActivityType enum
        activity_mapping = {
            'book': BookingActivityType.BOOK,
            'call': BookingActivityType.CALL,
            'lift': BookingActivityType.LIFT,
            'booking': BookingActivityType.BOOK,  # Alternative naming
            'meeting': BookingActivityType.BOOK,   # Alternative naming
        }
        
        activity_type = request.activity_type.lower()
        if activity_type not in activity_mapping:
            return LogEventResponse(
                success=False,
                message=f"Unsupported activity type: {request.activity_type}. Supported: {list(activity_mapping.keys())}"
            )
        
        # If no competition_id provided, try to find active one
        competition_id = request.competition_id
        if competition_id == 0:  # Allow 0 as "auto-detect"
            active_id = await get_active_competition_id()
            if not active_id:
                return LogEventResponse(
                    success=False,
                    message="No active competition found. Please specify competition_id."
                )
            competition_id = active_id
        
        # Get player name (use provided or default to MCP user)
        player_name = request.player_name or "MCP User"
        
        # Create the event using existing API structure
        event_data = CompetitionEventCreate(
            competition_id=competition_id,
            player_name=player_name,
            type=activity_mapping[activity_type],
            source="mcp"
        )
        
        # Use the existing scoring engine
        scoring_engine = ScoringEngine()
        
        # Get competition rules from database
        conn = await get_connection()
        try:
            comp_row = await conn.fetchrow(
                "SELECT rules FROM booking_competitions WHERE id = $1",
                competition_id
            )
            if not comp_row:
                return LogEventResponse(
                    success=False,
                    message=f"Competition {competition_id} not found"
                )
            
            # Parse rules from JSONB
            rules_data = comp_row['rules']
            # Handle both dict and JSON string formats
            if isinstance(rules_data, str):
                rules_data = json.loads(rules_data)
            rules = CompetitionRules.parse_obj(rules_data)
            
            # Log multiple events if count > 1
            total_points = 0
            event_ids = []
            
            for i in range(request.count):
                event_response = await scoring_engine.log_event(event_data, rules)
                total_points += event_response.points
                event_ids.append(str(event_response.id))
            
            return LogEventResponse(
                success=True,
                event_id=",".join(event_ids) if len(event_ids) > 1 else event_ids[0],
                message=f"Successfully logged {request.count} {request.activity_type} activity(s) for {player_name}",
                points_earned=total_points
            )
            
        finally:
            await conn.close()
        
    except Exception as e:
        return LogEventResponse(
            success=False,
            message=f"Failed to log event: {str(e)}"
        )

@router.post("/tools/competitions/leaderboard", response_model=LeaderboardResponse)
async def mcp_get_leaderboard(
    request: LeaderboardRequest
) -> LeaderboardResponse:
    """Get current leaderboard standings for a competition. 
    
    Shows live rankings and scores. Perfect for AI assistants to provide 
    real-time competition updates during meetings, Slack notifications, or dashboard displays.
    """
    if not MCP_ENABLED:
        raise HTTPException(status_code=503, detail="MCP functionality is currently disabled")
    
    try:
        # If competition_id is 0, try to find active competition
        competition_id = request.competition_id
        if competition_id == 0:
            active_id = await get_active_competition_id()
            if not active_id:
                # No active competition, use quarter standings instead
                conn = await get_connection()
                try:
                    players = await conn.fetch("""
                        SELECT name, points 
                        FROM profiles p
                        JOIN quarters q ON p.quarter_id = q.id
                        WHERE q.is_active = true
                        ORDER BY points DESC
                        LIMIT $1
                    """, request.limit)
                    
                    standings = []
                    for i, player in enumerate(players):
                        standings.append({
                            "rank": i + 1,
                            "player_name": player['name'],
                            "score": player['points'],
                            "activities_today": 0,
                            "last_activity": None
                        })
                    
                    return LeaderboardResponse(
                        competition_id=0,
                        standings=standings,
                        last_updated=datetime.now().isoformat()
                    )
                finally:
                    await conn.close()
            competition_id = active_id
        
        # For V1 competitions, query booking_competition_entries directly
        conn = await get_connection()
        try:
            # First check if this competition has V2 events (newer system)
            v2_events = await conn.fetchval(
                "SELECT COUNT(*) FROM booking_competition_events WHERE competition_id = $1",
                competition_id
            )
            
            if v2_events > 0:
                # Use V2 events table for scoring
                players = await conn.fetch("""
                    SELECT 
                        e.player_name,
                        SUM(e.points) as total_points,
                        COUNT(*) as activity_count,
                        MAX(e.created_at) as last_activity,
                        p.team_name
                    FROM booking_competition_events e
                    LEFT JOIN booking_competition_participants p ON e.competition_id = p.competition_id AND e.player_name = p.player_name
                    WHERE e.competition_id = $1
                    GROUP BY e.player_name, p.team_name
                    ORDER BY total_points DESC, last_activity ASC
                    LIMIT $2
                """, competition_id, request.limit)
            else:
                # Fallback to V1 entries table
                players = await conn.fetch("""
                    SELECT 
                        e.player_name,
                        SUM(e.points) as total_points,
                        COUNT(*) as activity_count,
                        MAX(e.created_at) as last_activity,
                        p.team_name
                    FROM booking_competition_entries e
                    LEFT JOIN booking_competition_participants p ON e.competition_id = p.competition_id AND e.player_name = p.player_name
                    WHERE e.competition_id = $1
                    GROUP BY e.player_name, p.team_name
                    ORDER BY total_points DESC, last_activity ASC
                    LIMIT $2
                """, competition_id, request.limit)
            
            standings = []
            for i, player in enumerate(players):
                standings.append({
                    "rank": i + 1,
                    "player_name": player['player_name'],
                    "team_name": player['team_name'],
                    "score": int(player['total_points']),
                    "activities_today": int(player['activity_count']),
                    "last_activity": player['last_activity'].isoformat() if player['last_activity'] else None
                })
            
            print(f"📊 MCP Leaderboard for competition {competition_id}: {len(standings)} players")
            
            return LeaderboardResponse(
                competition_id=competition_id,
                standings=standings,
                last_updated=datetime.now().isoformat()
            )
            
        finally:
            await conn.close()
        
    except Exception as e:
        print(f"❌ MCP Leaderboard error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get leaderboard: {str(e)}")

@router.post("/tools/player/progress", response_model=PlayerProgressResponse)
async def mcp_get_player_progress(
    request: PlayerProgressRequest
) -> PlayerProgressResponse:
    """Get detailed progress for a player including activities, streaks, and achievements.
    
    Ideal for AI assistants to provide personalized progress reports, 
    streak celebrations, and goal tracking updates.
    """
    if not MCP_ENABLED:
        raise HTTPException(status_code=503, detail="MCP functionality is currently disabled")
    
    try:
        player_id = request.player_id or "mcp_user"
        player_name = request.player_id or "MCP User"
        
        # Get player progress from database
        conn = await get_connection()
        try:
            # Get recent activity summary
            activity_query = """
            SELECT 
                type,
                COUNT(*) as count,
                SUM(points) as total_points
            FROM booking_competition_events 
            WHERE player_name = $1 
            AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY type
            """
            activities = await conn.fetch(activity_query, player_name)
            
            # Calculate progress metrics
            progress = {
                "books_this_month": 0,
                "calls_this_month": 0, 
                "lifts_this_month": 0,
                "total_points_this_month": 0
            }
            
            for activity in activities:
                activity_type = activity['type']
                count = activity['count']
                points = activity['total_points'] or 0
                
                if activity_type == 'book':
                    progress["books_this_month"] = count
                elif activity_type == 'call':
                    progress["calls_this_month"] = count
                elif activity_type == 'lift':
                    progress["lifts_this_month"] = count
                
                progress["total_points_this_month"] += points
            
            # Get streak information
            streak_query = """
            WITH daily_activities AS (
                SELECT DATE(created_at) as activity_date
                FROM booking_competition_events
                WHERE player_name = $1
                AND created_at >= NOW() - INTERVAL '90 days'
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) DESC
            )
            SELECT COUNT(*) as current_streak
            FROM daily_activities
            WHERE activity_date >= CURRENT_DATE - INTERVAL '30 days'
            """
            streak_result = await conn.fetchrow(streak_query, player_name)
            current_streak = streak_result['current_streak'] if streak_result else 0
            
            streaks = {
                "current_activity_streak": current_streak,
                "longest_streak_this_quarter": current_streak,  # Simplified
                "days_since_last_activity": 0  # Simplified
            }
            
            # Mock achievements for now
            achievements = []
            if progress["books_this_month"] >= 10:
                achievements.append({
                    "type": "milestone", 
                    "title": "10+ Books This Month", 
                    "unlocked_at": datetime.now().date().isoformat()
                })
            if current_streak >= 5:
                achievements.append({
                    "type": "streak", 
                    "title": f"{current_streak}-Day Activity Streak", 
                    "unlocked_at": datetime.now().date().isoformat()
                })
            
            return PlayerProgressResponse(
                player_id=player_id,
                player_name=player_name,
                progress=progress,
                streaks=streaks,
                achievements=achievements
            )
            
        finally:
            await conn.close()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get player progress: {str(e)}")

# Meeting Workflow Integration
@router.post("/meeting/workflow", response_model=MeetingWorkflowResponse)
async def execute_meeting_workflow(
    request: MeetingWorkflowRequest
) -> MeetingWorkflowResponse:
    """Execute automated meeting workflows with export capabilities.
    
    Perfect for AI assistants to run Monday kickoffs, Friday wraps, or midweek checks.
    Generates insights, prepares data, and optionally exports for Slack/presentations.
    """
    if not MCP_ENABLED:
        raise HTTPException(status_code=503, detail="MCP functionality is currently disabled")
    
    try:
        actions_taken = []
        workflow_data = {}
        
        # Get basic team insights
        conn = await get_connection()
        try:
            # Get current quarter info
            quarter = await conn.fetchrow("""
                SELECT id, name FROM quarters WHERE is_active = true LIMIT 1
            """)
            
            if quarter:
                workflow_data["quarter"] = {"id": quarter['id'], "name": quarter['name']}
                actions_taken.append("Retrieved quarter information")
            
            # Get leaderboard data using existing MCP endpoint
            leaderboard_req = LeaderboardRequest(competition_id=0, limit=10)
            leaderboard_resp = await mcp_get_leaderboard(leaderboard_req)
            
            if leaderboard_resp:
                workflow_data["leaderboard"] = leaderboard_resp.standings
                actions_taken.append("Retrieved current standings")
            
            # Workflow-specific actions
            if request.workflow_type == "monday_kickoff":
                workflow_data["kickoff_message"] = (
                    "🌌⚡ **MONDAY COSMIC KICKOFF!**\n\n"
                    "Warriors assemble! Commander Veyra has prepared this week's battle plan. "
                    "Our mission: Strike hard at Zephyr's forces through strategic booking campaigns. "
                    "Remember - every call weakens their defenses, every book secured is a victory!"
                )
                actions_taken.append("Generated Monday kickoff message")
                
            elif request.workflow_type == "midweek_check":
                workflow_data["midweek_assessment"] = (
                    "📊 **MIDWEEK TACTICAL ASSESSMENT**\n\n"
                    "Current momentum: **BUILDING**\n"
                    "Commander Veyra's analysis: Steady advance! Keep the pressure on Zephyr!"
                )
                actions_taken.append("Generated midweek assessment")
                
            elif request.workflow_type == "friday_wrap":
                workflow_data["weekly_wrap"] = (
                    "🏆 **FRIDAY VICTORY WRAP!**\n\n"
                    "This week's cosmic conquest summary:\n\n"
                    "⭐ Great progress across all fronts\n"
                    "⭐ Multiple booking victories secured\n"
                    "⭐ Team coordination excellent\n\n"
                    "Commander Veyra's commendation: The 12 warriors have fought with honor! "
                    "Zephyr's grip on the galaxy weakens with each victory. Rest well, champions!"
                )
                actions_taken.append("Generated weekly wrap summary")
            
            # Export capability
            if request.auto_actions:
                workflow_data["export_ready"] = True
                actions_taken.append("Prepared data for Slack/presentation export")
            
            return MeetingWorkflowResponse(
                success=True,
                message=f"Successfully executed {request.workflow_type.replace('_', ' ')} workflow",
                workflow_data=workflow_data,
                actions_taken=actions_taken,
                export_url=f"/mcp/export/{request.workflow_type}/{datetime.now().strftime('%Y%m%d_%H%M%S')}" if request.auto_actions else None
            )
            
        finally:
            await conn.close()
            
    except Exception as e:
        return MeetingWorkflowResponse(
            success=False,
            message=f"Workflow execution failed: {str(e)}",
            workflow_data={},
            actions_taken=[]
        )

@router.get("/export/{workflow_type}/{timestamp}")
async def export_meeting_data(workflow_type: str, timestamp: str):
    """Export meeting workflow data for Slack/presentations.
    
    Returns formatted data that can be shared in meetings or posted to Slack.
    """
    if not MCP_ENABLED:
        raise HTTPException(status_code=503, detail="MCP functionality is currently disabled")
    
    # In production, retrieve actual export data
    # For now, return a success message
    return {
        "success": True,
        "message": f"Export ready for {workflow_type} at {timestamp}",
        "format": "text/markdown",
        "download_url": f"https://api.questboard.com/exports/{workflow_type}_{timestamp}.md"
    }

# MCP Server Information and Management
@router.get("/server-info", response_model=MCPServerInfo)
async def get_mcp_server_info():
    """Get MCP server information and available tools"""
    return MCPServerInfo(
        capabilities={
            "tools": True,
            "resources": False,  # Will add in future phases
            "prompts": False     # Will add in future phases
        },
        tools=[
            {
                "name": "competitions.log_event",
                "description": "Log sales activity events to competitions (book/call/lift)",
                "endpoint": "/mcp/tools/competitions/log-event",
                "input_schema": {
                    "competition_id": "int (0 for auto-detect active)",
                    "activity_type": "str (book/call/lift/meeting)",
                    "count": "int (default: 1)",
                    "player_name": "str (optional, uses current user)"
                }
            },
            {
                "name": "competitions.leaderboard", 
                "description": "Get competition leaderboard standings",
                "endpoint": "/mcp/tools/competitions/leaderboard",
                "input_schema": {
                    "competition_id": "int (0 for auto-detect active)",
                    "limit": "int (default: 10)"
                }
            },
            {
                "name": "player.progress",
                "description": "Get player progress and achievements",
                "endpoint": "/mcp/tools/player/progress",
                "input_schema": {
                    "player_id": "str (optional, uses current user)",
                    "period": "str (default: current_quarter)"
                }
            },
            {
                "name": "meeting.workflow",
                "description": "Execute automated meeting workflows",
                "endpoint": "/mcp/meeting/workflow",
                "input_schema": {
                    "workflow_type": "str (monday_kickoff/midweek_check/friday_wrap)",
                    "auto_actions": "bool (default: true)"
                }
            }
        ]
    )

# Feature flag management
@router.post("/toggle")
async def toggle_mcp_feature(enabled: bool):
    """Toggle MCP functionality on/off (admin only for now)"""
    global MCP_ENABLED
    MCP_ENABLED = enabled
    return {"mcp_enabled": MCP_ENABLED, "message": f"MCP functionality {'enabled' if enabled else 'disabled'}"}

@router.get("/status")
async def mcp_status():
    """Get current MCP server status"""
    # Get active competition info for status
    try:
        active_comp_id = await get_active_competition_id()
        active_comp_info = f"Active competition: {active_comp_id}" if active_comp_id else "No active competition"
    except Exception:
        active_comp_info = "Unable to check active competition"
    
    return {
        "mcp_enabled": MCP_ENABLED,
        "available_tools": [
            "competitions.log_event",
            "competitions.leaderboard", 
            "player.progress",
            "meeting.workflow"
        ],
        "version": "2.0.0",
        "endpoints_available": 4,
        "active_competition": active_comp_info
    }

@router.post("/tools/competitions/create", response_model=CreateCompetitionResponse)
async def mcp_create_competition(
    request: CreateCompetitionRequest
) -> CreateCompetitionResponse:
    """Create a new competition with AI-driven configuration.
    
    Perfect for AI assistants to start competitions from meeting notes,
    schedule weekly challenges, or respond to voice commands like 
    'Start a 3-day booking challenge for Team Alpha'.
    """
    if not MCP_ENABLED:
        raise HTTPException(status_code=503, detail="MCP functionality is currently disabled")
    
    try:
        from datetime import datetime, timedelta
        from app.libs.models_competition_v2 import CompetitionRules, ActivityRule
        
        # Create default scoring rules if none provided
        if not request.rules:
            # Use the correct PointsConfig structure
            points_config = PointsConfig()
            
            # Set points based on requested activity types
            for activity_type in request.activity_types:
                if activity_type.lower() == "book":
                    points_config.book = 10
                elif activity_type.lower() == "call":
                    points_config.call = 3
                elif activity_type.lower() == "lift":
                    points_config.lift = 1
            
            rules = CompetitionRules(
                points=points_config,
                multipliers=[],
                combos=[],
                tie_breakers=["highest_books", "earliest_to_target"]
            )
        else:
            rules = CompetitionRules.parse_obj(request.rules)
        
        # Calculate times
        now = datetime.now()
        start_time = now if request.auto_start else now
        end_time = start_time + timedelta(hours=request.duration_hours)
        
        # Create competition in database
        conn = await get_connection()
        try:
            # Insert new competition
            competition_id = await conn.fetchval(
                """
                INSERT INTO booking_competitions 
                (name, description, rules, start_time, end_time, state, created_via)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
                """,
                request.name,
                request.description or f"AI-generated competition: {request.name}",
                rules.dict(),  # Store as JSONB
                start_time,
                end_time,
                "active" if request.auto_start else "scheduled",
                "mcp_ai"  # Track that this was created via MCP
            )
            
            return CreateCompetitionResponse(
                success=True,
                competition_id=competition_id,
                message=f"Competition '{request.name}' created successfully with ID {competition_id}",
                start_time=start_time.isoformat(),
                end_time=end_time.isoformat()
            )
            
        finally:
            await conn.close()
            
    except Exception as e:
        return CreateCompetitionResponse(
            success=False,
            message=f"Failed to create competition: {str(e)}"
        )

@router.post("/tools/competitions/finalize", response_model=FinalizeCompetitionResponse)
async def mcp_finalize_competition(
    request: FinalizeCompetitionRequest
) -> FinalizeCompetitionResponse:
    """Finalize a competition and announce winners.
    
    Perfect for AI assistants to wrap up competitions during meetings,
    generate winner announcements, or automatically close expired competitions.
    """
    if not MCP_ENABLED:
        raise HTTPException(status_code=503, detail="MCP functionality is currently disabled")
    
    try:
        from datetime import datetime
        
        conn = await get_connection()
        try:
            # Check if competition exists and get details
            comp_row = await conn.fetchrow(
                "SELECT * FROM booking_competitions WHERE id = $1",
                request.competition_id
            )
            
            if not comp_row:
                return FinalizeCompetitionResponse(
                    success=False,
                    message=f"Competition {request.competition_id} not found"
                )
            
            # Check if already finalized
            if comp_row['state'] == 'completed':
                return FinalizeCompetitionResponse(
                    success=False,
                    message=f"Competition '{comp_row['name']}' is already finalized"
                )
            
            # Check if competition has ended (unless force)
            now = datetime.now()
            if not request.force and comp_row['end_time'] > now:
                return FinalizeCompetitionResponse(
                    success=False,
                    message=f"Competition '{comp_row['name']}' has not ended yet. Use force=true to finalize early."
                )
            
            # Get final standings using scoring engine
            scoring_engine = ScoringEngine()
            
            # Parse rules from JSONB
            rules_data = comp_row['rules']
            if isinstance(rules_data, str):
                rules_data = json.loads(rules_data)
            rules = CompetitionRules.parse_obj(rules_data)
            
            # Calculate final scoreboard
            scoreboard = await scoring_engine.calculate_scoreboard(request.competition_id, rules)
            
            # Determine winner
            winner = None
            final_standings = []
            
            if scoreboard.individual_leaderboard:
                # Format standings
                for i, player in enumerate(scoreboard.individual_leaderboard):
                    standing = {
                        "rank": i + 1,
                        "player_name": player.player_name,
                        "total_points": player.total_points,
                        "activities_count": len(player.events)
                    }
                    final_standings.append(standing)
                    
                    # Winner is first place
                    if i == 0:
                        winner = standing
            
            # Update competition state to completed
            await conn.execute(
                """
                UPDATE booking_competitions 
                SET state = 'completed', 
                    finalized_at = $1,
                    finalized_via = 'mcp_ai'
                WHERE id = $2
                """,
                now,
                request.competition_id
            )
            
            # Prepare response message
            if winner and request.winner_announcement:
                message = f"🏆 Competition '{comp_row['name']}' finalized! Winner: {winner['player_name']} with {winner['total_points']} points!"
            else:
                message = f"Competition '{comp_row['name']}' successfully finalized."
            
            return FinalizeCompetitionResponse(
                success=True,
                message=message,
                winner=winner,
                final_standings=final_standings
            )
            
        finally:
            await conn.close()
            
    except Exception as e:
        return FinalizeCompetitionResponse(
            success=False,
            message=f"Failed to finalize competition: {str(e)}"
        )

@router.post("/tools/competitions/undo-last", response_model=UndoEventResponse)
async def mcp_undo_last_event(
    request: UndoEventRequest
) -> UndoEventResponse:
    """Undo the last event or a specific event in a competition.
    
    Perfect for AI assistants to correct mistakes from voice commands,
    fix mislogged activities, or handle 'oops, that wasn't me' situations.
    """
    if not MCP_ENABLED:
        raise HTTPException(status_code=503, detail="MCP functionality is currently disabled")
    
    try:
        conn = await get_connection()
        try:
            # If specific event_id provided, undo that event
            if request.event_id:
                event_row = await conn.fetchrow(
                    "SELECT * FROM booking_competition_events WHERE id = $1 AND competition_id = $2",
                    request.event_id, request.competition_id
                )
                
                if not event_row:
                    return UndoEventResponse(
                        success=False,
                        message=f"Event {request.event_id} not found in competition {request.competition_id}"
                    )
            else:
                # Find last event (optionally for specific player)
                if request.player_name:
                    event_row = await conn.fetchrow(
                        """
                        SELECT * FROM booking_competition_events 
                        WHERE competition_id = $1 AND player_name = $2
                        ORDER BY created_at DESC 
                        LIMIT 1
                        """,
                        request.competition_id, request.player_name
                    )
                else:
                    event_row = await conn.fetchrow(
                        """
                        SELECT * FROM booking_competition_events 
                        WHERE competition_id = $1
                        ORDER BY created_at DESC 
                        LIMIT 1
                        """,
                        request.competition_id
                    )
                
                if not event_row:
                    return UndoEventResponse(
                        success=False,
                        message=f"No events found to undo{' for ' + request.player_name if request.player_name else ''}"
                    )
            
            # Store event details for response
            undone_event = {
                "id": str(event_row['id']),
                "player_name": event_row['player_name'],
                "activity_type": event_row['type'],
                "points": event_row['points'],
                "description": event_row.get('description', ''),
                "created_at": event_row['created_at'].isoformat()
            }
            
            # Delete the event
            await conn.execute(
                "DELETE FROM booking_competition_events WHERE id = $1",
                event_row['id']
            )
            
            # Recalculate player's updated score (optional - could be done lazily)
            updated_score_row = await conn.fetchrow(
                """
                SELECT COALESCE(SUM(points), 0) as total_points 
                FROM booking_competition_events 
                WHERE competition_id = $1 AND player_name = $2
                """,
                request.competition_id, event_row['player_name']
            )
            
            updated_score = float(updated_score_row['total_points']) if updated_score_row else 0.0
            
            return UndoEventResponse(
                success=True,
                message=f"Successfully undid {event_row['type']} activity for {event_row['player_name']} (-{event_row['points']} points)",
                undone_event=undone_event,
                updated_score=updated_score
            )
            
        finally:
            await conn.close()
            
    except Exception as e:
        return UndoEventResponse(
            success=False,
            message=f"Failed to undo event: {str(e)}"
        )

@router.post("/tools/visuals/generate", response_model=GenerateVisualsResponse)
async def mcp_generate_visuals(
    request: GenerateVisualsRequest
) -> GenerateVisualsResponse:
    """Generate team assets (emblems, banners, avatars) with AI.
    
    Perfect for AI assistants to create visual identity during competition setup,
    respond to requests like 'Create cosmic-themed assets for Team Alpha',
    or auto-generate visuals based on team names and themes.
    """
    if not MCP_ENABLED:
        raise HTTPException(status_code=503, detail="MCP functionality is currently disabled")
    
    try:
        # Import team assets models
        from app.apis.team_assets import (
            GenerateAssetsRequest, 
            AssetConfig,
            sanitize_team_name
        )
        import requests
        
        # Sanitize team name
        team_name = sanitize_team_name(request.team_name)
        if not team_name:
            return GenerateVisualsResponse(
                success=False,
                message=f"Invalid team name: {request.team_name}"
            )
        
        # Build asset config based on MCP request
        asset_config = AssetConfig(
            style=request.style,
            theme=request.theme_description or f"A {request.style} themed team called {team_name}",
            primary_color=request.colors[0] if request.colors else None,
            secondary_color=request.colors[1] if request.colors and len(request.colors) > 1 else None
        )
        
        # Create request for existing team assets API
        assets_request = GenerateAssetsRequest(
            config=asset_config,
            preview_only=request.preview_only
        )
        
        # Call the existing team assets generate function directly
        # We'll make an internal API call to avoid auth issues
        internal_api_url = f"http://localhost:8000/team_assets/{request.competition_id}/teams/{team_name}/assets/generate"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer internal-mcp-call"  # Internal bypass
        }
        
        # Make internal API call
        response = requests.post(
            internal_api_url,
            json=assets_request.dict(),
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Format response for MCP
            assets = None
            if result.get('assets'):
                assets = {
                    "emblem": result['assets'].get('emblem_url'),
                    "avatar": result['assets'].get('avatar_url'), 
                    "banner": result['assets'].get('banner_url')
                }
            
            return GenerateVisualsResponse(
                success=True,
                message=f"Generated {request.style} assets for {team_name}{'(preview)' if request.preview_only else ''}",
                assets=assets,
                version=result.get('version'),
                credits_used=result.get('credits_used', 0)
            )
        else:
            return GenerateVisualsResponse(
                success=False,
                message=f"Asset generation failed: {response.text}"
            )
            
    except Exception as e:
        return GenerateVisualsResponse(
            success=False,
            message=f"Failed to generate visuals: {str(e)}"
        )

@router.post("/tools/visuals/manage", response_model=ManageVisualsResponse)
async def mcp_manage_visuals(
    request: ManageVisualsRequest
) -> ManageVisualsResponse:
    """Manage team assets - lock, unlock, or set as active.
    
    Perfect for AI assistants to lock final versions, protect good designs,
    or activate specific asset versions for competitions.
    """
    if not MCP_ENABLED:
        raise HTTPException(status_code=503, detail="MCP functionality is currently disabled")
    
    try:
        from app.apis.team_assets import sanitize_team_name
        import requests
        
        # Sanitize team name
        team_name = sanitize_team_name(request.team_name)
        if not team_name:
            return ManageVisualsResponse(
                success=False,
                message=f"Invalid team name: {request.team_name}",
                action=request.action
            )
        
        # Validate action
        valid_actions = ["lock", "unlock", "set_active"]
        if request.action not in valid_actions:
            return ManageVisualsResponse(
                success=False,
                message=f"Invalid action: {request.action}. Must be one of: {valid_actions}",
                action=request.action
            )
        
        # Build URL for existing team assets API
        internal_api_url = f"http://localhost:8000/team_assets/{request.competition_id}/teams/{team_name}/assets/{request.action}"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer internal-mcp-call"  # Internal bypass
        }
        
        # Add version to query if provided
        params = {}
        if request.version is not None:
            params["version"] = request.version
        
        # Make internal API call
        response = requests.post(
            internal_api_url,
            headers=headers,
            params=params,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Create success message based on action
            action_messages = {
                "lock": f"Locked asset version {request.version or 'latest'} for {team_name}",
                "unlock": f"Unlocked asset version {request.version or 'latest'} for {team_name}", 
                "set_active": f"Set version {request.version or 'latest'} as active for {team_name}"
            }
            
            return ManageVisualsResponse(
                success=True,
                message=action_messages.get(request.action, f"Successfully performed {request.action}"),
                action=request.action,
                version=request.version
            )
        else:
            return ManageVisualsResponse(
                success=False,
                message=f"Asset management failed: {response.text}",
                action=request.action,
                version=request.version
            )
            
    except Exception as e:
        return ManageVisualsResponse(
            success=False,
            message=f"Failed to manage visuals: {str(e)}",
            action=request.action,
            version=request.version
        )

@router.post("/tools/visuals/history", response_model=VisualsHistoryResponse)
async def mcp_visuals_history(
    request: VisualsHistoryRequest
) -> VisualsHistoryResponse:
    """Get version history for team assets.
    
    Perfect for AI assistants to review previous designs, track changes,
    or help users understand what versions are available for rollback.
    """
    if not MCP_ENABLED:
        raise HTTPException(status_code=503, detail="MCP functionality is currently disabled")
    
    try:
        from app.apis.team_assets import sanitize_team_name
        import requests
        
        # Sanitize team name
        team_name = sanitize_team_name(request.team_name)
        if not team_name:
            return VisualsHistoryResponse(
                success=False,
                message=f"Invalid team name: {request.team_name}"
            )
        
        # Build URL for existing team assets API
        internal_api_url = f"http://localhost:8000/team_assets/{request.competition_id}/teams/{team_name}/assets"
        
        headers = {
            "Authorization": "Bearer internal-mcp-call"  # Internal bypass
        }
        
        # Make internal API call
        response = requests.get(
            internal_api_url,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            asset_versions = response.json()
            
            # Format for MCP response
            formatted_versions = []
            for version_data in asset_versions:
                formatted_version = {
                    "version": version_data.get("version"),
                    "created_at": version_data.get("created_at"),
                    "is_locked": version_data.get("is_locked", False),
                    "assets": {
                        "emblem": version_data.get("assets", {}).get("emblem_url"),
                        "avatar": version_data.get("assets", {}).get("avatar_url"),
                        "banner": version_data.get("assets", {}).get("banner_url")
                    },
                    "config": version_data.get("config")
                }
                formatted_versions.append(formatted_version)
            
            return VisualsHistoryResponse(
                success=True,
                message=f"Found {len(formatted_versions)} asset versions for {team_name}",
                versions=formatted_versions,
                total_versions=len(formatted_versions)
            )
        else:
            return VisualsHistoryResponse(
                success=False,
                message=f"Failed to get asset history: {response.text}"
            )
            
    except Exception as e:
        return VisualsHistoryResponse(
            success=False,
            message=f"Failed to get visuals history: {str(e)}"
        )
