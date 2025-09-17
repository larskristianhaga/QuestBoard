
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum
from uuid import UUID

# Enhanced Pydantic models for Competitions 2.0

# Enums
class BookingActivityType(str, Enum):
    LIFT = "lift"
    CALL = "call" 
    BOOK = "book"

class CompetitionState(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    FINALIZED = "finalized"

class SnapshotType(str, Enum):
    PERIODIC = "periodic"
    FINALIZED = "finalized"
    MANUAL = "manual"

class BonusSource(str, Enum):
    BOOKING_COMPETITION = "booking_competition"
    CHALLENGE_COMPLETION = "challenge_completion"

# Rules Configuration Models
class TimeWindow(BaseModel):
    start: str = Field(..., description="Start time in HH:MM format")
    end: str = Field(..., description="End time in HH:MM format")
    tz: str = Field(default="Europe/Oslo", description="Timezone")

class Multiplier(BaseModel):
    type: str = Field(..., description="Type: time_window, streak, etc.")
    mult: float = Field(..., ge=1.0, le=5.0, description="Multiplier value")
    window: Optional[TimeWindow] = None
    min: Optional[int] = None  # for streak multipliers

class Combo(BaseModel):
    name: str = Field(..., description="Combo name")
    within_minutes: int = Field(..., ge=1, le=120, description="Time window in minutes")
    bonus: int = Field(..., ge=1, description="Bonus points")
    required_types: Optional[List[BookingActivityType]] = None

class Caps(BaseModel):
    per_player_per_day: Optional[int] = Field(None, ge=1, description="Daily cap per player")
    per_player_total: Optional[int] = Field(None, ge=1, description="Total cap per player")
    global_total: Optional[int] = Field(None, ge=1, description="Global competition cap")

class PointsConfig(BaseModel):
    lift: int = Field(default=1, ge=0, le=100)
    call: int = Field(default=4, ge=0, le=100)
    book: int = Field(default=10, ge=0, le=100)

class CompetitionRules(BaseModel):
    points: PointsConfig = Field(default_factory=PointsConfig)
    multipliers: List[Multiplier] = Field(default_factory=list)
    combos: List[Combo] = Field(default_factory=list)
    caps: Caps = Field(default_factory=Caps)
    tie_breakers: List[str] = Field(default=["highest_books", "earliest_to_target"], description="Ordered list of tie breaker strategies")

# Theme Configuration Models
class TeamConfig(BaseModel):
    team_id: Optional[int] = None
    label: str = Field(..., description="Display name for team")
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$', description="Hex color code")

class VFXConfig(BaseModel):
    warp_trail: str = Field(default="medium", pattern=r'^(off|low|medium|high)$')
    sparkles: str = Field(default="low", pattern=r'^(off|low|medium|high)$')
    screen_shake_on_win: bool = Field(default=True)
    particle_effects: bool = Field(default=True)

class CompetitionTheme(BaseModel):
    teams: List[TeamConfig] = Field(default=[])
    vfx: VFXConfig = Field(default_factory=VFXConfig)
    badges: List[str] = Field(default=["streaker", "clutch", "early_bird"])
    custom_sounds: Dict[str, str] = Field(default={})

# Prizes Configuration Model
class CompetitionPrizes(BaseModel):
    winner: int = Field(default=50, ge=0, description="Points for winner")
    runner_up: int = Field(default=20, ge=0, description="Points for runner-up")
    participation: int = Field(default=5, ge=0, description="Points for participation")
    team_win_bonus: Optional[int] = Field(None, ge=0, description="Bonus for team victory")
    custom_rewards: Dict[str, Any] = Field(default_factory=dict)

# Enhanced Competition Models
class CompetitionCreateV2(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    start_time: datetime
    end_time: datetime
    rules: CompetitionRules = Field(default_factory=CompetitionRules)
    theme: CompetitionTheme = Field(default_factory=CompetitionTheme)
    prizes: CompetitionPrizes = Field(default_factory=CompetitionPrizes)
    team_id: Optional[int] = None
    is_hidden: bool = Field(default=True)
    
    @validator('end_time')
    def end_after_start(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

class CompetitionUpdateV2(BaseModel):
    competition_id: int
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    state: Optional[CompetitionState] = None
    rules: Optional[CompetitionRules] = None
    theme: Optional[CompetitionTheme] = None
    prizes: Optional[CompetitionPrizes] = None
    is_hidden: Optional[bool] = None

class CompetitionResponseV2(BaseModel):
    id: int
    name: str
    description: Optional[str]
    start_time: datetime
    end_time: datetime
    state: CompetitionState
    is_active: bool  # keep for backward compatibility
    is_hidden: bool
    rules: CompetitionRules
    theme: CompetitionTheme
    prizes: CompetitionPrizes
    team_id: Optional[int]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

# Competition Events Models
class CompetitionEventCreate(BaseModel):
    competition_id: int
    player_name: str = Field(..., min_length=1, max_length=255)
    type: BookingActivityType
    source: str = Field(default="manual", max_length=50)
    custom_points: Optional[int] = Field(None, ge=0, description="Override default points")

class CompetitionEventResponse(BaseModel):
    id: UUID
    competition_id: int
    player_name: str
    type: BookingActivityType
    points: int
    rule_triggered: Dict[str, Any]
    ts: datetime
    source: str
    created_at: datetime

# Scoring and Leaderboard Models
class PlayerScore(BaseModel):
    player_name: str
    total_points: int
    event_count: int
    breakdown: Dict[BookingActivityType, int] = Field(default_factory=dict)
    multipliers_applied: List[str] = Field(default_factory=list)
    combos_achieved: List[str] = Field(default_factory=list)
    last_activity: Optional[datetime] = None
    current_streak: int = Field(default=0)

class CompetitionScoreboardResponse(BaseModel):
    """Response for live scoreboard"""
    competition_id: int
    participants: List[PlayerScore]
    last_updated: datetime
    next_update_in: int  # seconds

class ScoreboardResponse(BaseModel):
    """Advanced scoreboard response for Competitions 2.0"""
    competition_id: int
    individual_leaderboard: List[PlayerScore]
    last_updated: datetime

# ===== VALIDATION MODELS =====

class ValidationError(BaseModel):
    """Standard validation error"""
    loc: List[Union[str, int]]
    msg: str
    type: str

class ValidationRequest(BaseModel):
    """Request to validate competition rules"""
    rules: CompetitionRules
    theme: CompetitionTheme
    prizes: CompetitionPrizes

class ValidationResponse(BaseModel):
    """Response for competition rules validation"""
    is_valid: bool
    errors: List[ValidationError] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)

# ===== UNDO & ANTI-CHEAT MODELS =====

class UndoEventRequest(BaseModel):
    """Request to undo a competition event"""
    event_id: int
    reason: str = "User requested undo"

class UndoEventResponse(BaseModel):
    """Response after undoing an event"""
    success: bool
    undo_event_id: int
    message: str

class SuspiciousEvent(BaseModel):
    """Details about a suspicious activity event"""
    player_name: str
    activity_type: str
    created_at: datetime
    points: int
    suspicion_type: str  # 'burst_activity', 'rapid_succession', etc.

class UndoStats(BaseModel):
    """Statistics about undo usage by player"""
    player_name: str
    undo_count: int
    last_undo: datetime

class AntiCheatReportResponse(BaseModel):
    """Anti-cheat analysis report"""
    competition_id: int
    suspicious_events: List[SuspiciousEvent]
    undo_statistics: List[UndoStats]
    generated_at: datetime

# Admin Preview Models
class ScoringPreviewRequest(BaseModel):
    rules: CompetitionRules
    sample_events: List[Dict[str, Any]] = Field(..., description="Sample events to test scoring against")

class ScoringPreviewResponse(BaseModel):
    calculated_scores: List[PlayerScore]
    rules_validation: Dict[str, Any]
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)

# Results Snapshot Models
class CompetitionResultCreate(BaseModel):
    competition_id: int
    snapshot_type: SnapshotType = Field(default=SnapshotType.MANUAL)
    description: Optional[str] = None

class CompetitionResultResponse(BaseModel):
    id: UUID
    competition_id: int
    snapshot: ScoreboardResponse
    snapshot_type: SnapshotType
    created_at: datetime

# Bonus Awards Models
class BonusAwardCreate(BaseModel):
    player_name: str
    source: BonusSource
    points: int = Field(..., ge=1)
    description: Optional[str] = None
    competition_id: Optional[int] = None
    challenge_id: Optional[int] = None

class BonusAwardResponse(BaseModel):
    id: UUID
    player_name: str
    source: BonusSource
    points: int
    description: Optional[str]
    competition_id: Optional[int]
    challenge_id: Optional[int]
    awarded_at: datetime

# Finalization Models
class FinalizeCompetitionRequestV2(BaseModel):
    competition_id: int
    award_bonuses: bool = Field(default=True)
    custom_message: Optional[str] = Field(None, max_length=500)
    notify_winners: bool = Field(default=True)

class CompetitionWinner(BaseModel):
    player_name: str
    total_points: int
    rank: int
    bonus_awarded: int
    team_name: Optional[str] = None

class FinalizeCompetitionResponse(BaseModel):
    competition_id: int
    winners: List[CompetitionWinner]
    snapshot_id: UUID
    total_bonuses_awarded: int
    finalized_at: datetime
