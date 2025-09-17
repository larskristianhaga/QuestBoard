


from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

# Pydantic models for Booking Competition domain

# Activity type enum for booking competitions
class BookingActivityType(str, Enum):
    LIFT = "lift"
    CALL = "call" 
    BOOK = "book"

class CompetitionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    is_hidden: bool = True
    tiebreaker: str = Field(default="most_total", pattern="^(most_total|first_to|fastest_pace)$")
    team_a_name: str = "Team Alpha"
    team_b_name: str = "Team Beta"
    auto_assign_teams: bool = True

class CompetitionUpdate(BaseModel):
    competition_id: int
    name: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_active: Optional[bool] = None
    is_hidden: Optional[bool] = None
    tiebreaker: Optional[str] = Field(default=None, pattern="^(most_total|first_to|fastest_pace)$")
    team_a_name: Optional[str] = None
    team_b_name: Optional[str] = None
    auto_assign_teams: Optional[bool] = None

class CompetitionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    start_time: datetime
    end_time: datetime
    is_active: bool
    is_hidden: bool
    tiebreaker: str
    created_at: datetime
    updated_at: datetime
    team_a_name: Optional[str] = None
    team_b_name: Optional[str] = None
    auto_assign_teams: Optional[bool] = None

class EnrollParticipantRequest(BaseModel):
    competition_id: int
    player_name: str

class ParticipantResponse(BaseModel):
    id: int
    competition_id: int
    player_name: str
    enrolled_at: datetime
    team_name: Optional[str] = None

class SubmitEntryRequest(BaseModel):
    competition_id: int
    player_name: str
    activity_id: Optional[int] = None  # optional link to regular activity for auditing
    activity_type: BookingActivityType = BookingActivityType.BOOK
    points: int = 1  # default to 1 for bookings
    triggered_by: Optional[str] = None  # To prevent infinite loops when triggered from activity center

class EntryResponse(BaseModel):
    id: int
    competition_id: int
    player_name: str
    activity_id: Optional[int]
    activity_type: BookingActivityType
    points: int
    created_at: datetime
    submitted_by: Optional[str] = None

class LeaderboardRow(BaseModel):
    player_name: str
    total_points: int
    entries: int
    last_entry_at: Optional[datetime] = None
    team_name: Optional[str] = None

class LeaderboardResponse(BaseModel):
    competition_id: int
    rows: List[LeaderboardRow]

class FinalizeCompetitionRequest(BaseModel):
    competition_id: int
    set_inactive: bool = True

class ToggleVisibilityRequest(BaseModel):
    competition_id: int
    is_hidden: bool

# New models for admin bulk functionality
class BulkEntryRequest(BaseModel):
    competition_id: int
    player_name: str
    activity_type: BookingActivityType
    count: int = Field(ge=1, le=50)  # limit bulk entries to reasonable amount
    
class QuickLogRequest(BaseModel):
    competition_id: int
    player_name: str
    activity_type: BookingActivityType
    
class UpdateEntryRequest(BaseModel):
    entry_id: int
    activity_type: Optional[BookingActivityType] = None
    points: Optional[int] = None
    
class DeleteEntryRequest(BaseModel):
    entry_id: int
    reason: Optional[str] = None
    
class ActivityTypeBreakdown(BaseModel):
    activity_type: BookingActivityType
    count: int
    total_points: int
    
class LeaderboardRowWithBreakdown(BaseModel):
    player_name: str
    total_points: int
    entries: int
    last_entry_at: Optional[datetime] = None
    breakdown: List[ActivityTypeBreakdown]
    team_name: Optional[str] = None

class EnhancedLeaderboardResponse(BaseModel):
    competition_id: int
    rows: List[LeaderboardRowWithBreakdown]
    
class EntryListResponse(BaseModel):
    id: int
    competition_id: int
    player_name: str
    activity_id: Optional[int]
    activity_type: BookingActivityType
    points: int
    created_at: datetime
    submitted_by: Optional[str] = None

# Team-specific models
class TeamStats(BaseModel):
    team_name: str
    total_points: int
    member_count: int
    entries: int
    last_activity_at: Optional[datetime] = None
    
class TeamLeaderboardResponse(BaseModel):
    competition_id: int
    team_a: TeamStats
    team_b: TeamStats
    individual_leaderboard: List[LeaderboardRow]
    
class TeamActivityFeed(BaseModel):
    player_name: str
    team_name: str
    activity_type: BookingActivityType
    points: int
    created_at: datetime
    
class CompetitionStatsResponse(BaseModel):
    competition_id: int
    total_participants: int
    total_entries: int
    most_active_player: Optional[str] = None
    leading_team: Optional[str] = None
    team_leaderboard: TeamLeaderboardResponse
    recent_activity: List[TeamActivityFeed]
    
class TeammateListResponse(BaseModel):
    your_team: str
    teammates: List[str]
    opposing_team: str
    opponents: List[str]
