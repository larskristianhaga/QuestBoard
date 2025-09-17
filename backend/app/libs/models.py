

"""
Pydantic models that represent the database schema for the QuestBoard app.
These models are used for data validation and serialization in API endpoints.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from enum import Enum
from uuid import UUID

class ActivityType(str, Enum):
    """Enum for activity types in the QuestBoard game"""
    BOOK = "book"  # Booked meeting
    OPP = "opp"    # Opportunity
    DEAL = "deal"  # Closed deal

class Quarter(BaseModel):
    """Model for quarter periods in QuestBoard"""
    id: int
    name: str
    start_date: date
    end_date: date
    created_at: datetime

class Profile(BaseModel):
    """Model for player profiles - one per user per quarter"""
    id: int
    user_id: UUID  # Reference to auth system user ID
    quarter_id: int
    name: str
    points: int = 0
    goal_books: int = 0
    goal_opps: int = 0
    goal_deals: int = 0
    created_at: datetime
    updated_at: datetime

class Activity(BaseModel):
    """Model for sales activities that generate points"""
    id: int
    profile_id: int
    quarter_id: int
    type: ActivityType
    points: int
    created_at: datetime

# Request/Response models for API endpoints

class CreateQuarterRequest(BaseModel):
    """Request model for creating a new quarter"""
    name: str
    start_date: date
    end_date: date

class CreateProfileRequest(BaseModel):
    """Request model for creating a new player profile"""
    quarter_id: int
    name: str
    goal_books: int = 0
    goal_opps: int = 0
    goal_deals: int = 0

class UpdateProfileGoalsRequest(BaseModel):
    """Request model for updating player goals"""
    goal_books: Optional[int] = None
    goal_opps: Optional[int] = None
    goal_deals: Optional[int] = None

class LogActivityRequest(BaseModel):
    """Request model for logging a new activity"""
    type: ActivityType
    points: int = 1  # Default 1 point per activity

class ProfileWithProgress(BaseModel):
    """Profile model with calculated progress percentages"""
    id: int
    user_id: UUID
    quarter_id: int
    name: str
    points: int
    goal_books: int
    goal_opps: int
    goal_deals: int
    # Progress calculations
    books_completed: int = 0
    opps_completed: int = 0
    deals_completed: int = 0
    books_progress: float = 0.0  # Percentage
    opps_progress: float = 0.0   # Percentage
    deals_progress: float = 0.0  # Percentage
    total_progress: float = 0.0  # Overall percentage
    created_at: datetime
    updated_at: datetime

class TeamSummary(BaseModel):
    """Summary model for team goals and progress"""
    quarter_id: int
    quarter_name: str
    total_team_books_goal: int
    total_team_opps_goal: int
    total_team_deals_goal: int
    total_team_books_completed: int
    total_team_opps_completed: int
    total_team_deals_completed: int
    team_books_progress: float = 0.0
    team_opps_progress: float = 0.0
    team_deals_progress: float = 0.0
    overall_team_progress: float = 0.0
    total_players: int = 0

class LeaderboardEntry(BaseModel):
    """Model for leaderboard entries"""
    rank: int
    profile_id: int
    name: str
    points: int
    total_activities: int
    books_completed: int
    opps_completed: int
    deals_completed: int
    progress_percentage: float
