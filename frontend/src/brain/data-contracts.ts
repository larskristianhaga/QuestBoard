/** AIInsight */
export interface AIInsight {
  /** Type */
  type: string;
  /** Title */
  title: string;
  /** Message */
  message: string;
  /** Priority */
  priority: string;
  /** Action Items */
  action_items?: string[] | null;
  /** Confidence */
  confidence: number;
}

/** AIInsightsResponse */
export interface AIInsightsResponse {
  /** Insights */
  insights: AIInsight[];
  /**
   * Generated At
   * @format date-time
   */
  generated_at: string;
  /** Data Period */
  data_period: string;
  /** Ai Model */
  ai_model: string;
  /** Cache Expires At */
  cache_expires_at?: string | null;
}

/**
 * ActiveChallenge
 * Active challenge with player progress
 */
export interface ActiveChallenge {
  /** Id */
  id: number;
  /** Title */
  title: string;
  /** Description */
  description: string | null;
  /** Type */
  type: string;
  /** Icon */
  icon: string;
  /** Target Value */
  target_value: number;
  /** Current Progress */
  current_progress: number;
  /** Progress Percentage */
  progress_percentage: number;
  /** Time Remaining Hours */
  time_remaining_hours: number;
  /** Reward Points */
  reward_points: number;
  /** Is Completed */
  is_completed: boolean;
}

/** ActivityHistoryItem */
export interface ActivityHistoryItem {
  /** Id */
  id: number;
  type: ActivityType;
  /** Points */
  points: number;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
}

/** ActivityHistoryResponse */
export interface ActivityHistoryResponse {
  /** Activities */
  activities: ActivityHistoryItem[];
  /** Total Points */
  total_points: number;
  /** Total Count */
  total_count: number;
}

/** ActivityLogResponse */
export interface ActivityLogResponse {
  /** Id */
  id: number;
  /** Player Name */
  player_name: string;
  /** Quarter Name */
  quarter_name: string;
  /** Activity Type */
  activity_type: string;
  /** Points */
  points: number;
  /** Created At */
  created_at: string;
  /** Challenge Id */
  challenge_id?: number | null;
  /** Challenge Title */
  challenge_title?: string | null;
}

/** ActivityType */
export enum ActivityType {
  Book = "book",
  Opp = "opp",
  Deal = "deal",
}

/**
 * AntiCheatReportResponse
 * Anti-cheat analysis report
 */
export interface AntiCheatReportResponse {
  /** Competition Id */
  competition_id: number;
  /** Suspicious Events */
  suspicious_events: SuspiciousEvent[];
  /** Undo Statistics */
  undo_statistics: UndoStats[];
  /**
   * Generated At
   * @format date-time
   */
  generated_at: string;
}

/** AssetConfig */
export interface AssetConfig {
  /**
   * Label
   * Team name/label
   */
  label: string;
  /**
   * Motif
   * Design motif (comet, nebula, raptor, phoenix)
   */
  motif: string;
  /**
   * Preset
   * Style preset (retro-cockpit, neon-vapor, pixel-quest, hard-sci)
   */
  preset: string;
  /**
   * Palette
   * Color palette as hex codes
   */
  palette: string[];
}

/** AssetUrls */
export interface AssetUrls {
  /** Emblem Url */
  emblem_url?: string | null;
  /** Avatar Url */
  avatar_url?: string | null;
  /** Banner Url */
  banner_url?: string | null;
}

/** AvailablePlayersResponse */
export interface AvailablePlayersResponse {
  /** Available Players */
  available_players: string[];
  /** Taken Players */
  taken_players: string[];
}

/** BackfillApplyRequest */
export interface BackfillApplyRequest {
  /** Challenge Ids */
  challenge_ids: number[];
  /** Restrict Players */
  restrict_players?: Record<string, string[]> | null;
  /**
   * Recalc
   * @default true
   */
  recalc?: boolean;
}

/** BackfillApplyResponse */
export interface BackfillApplyResponse {
  /** Success */
  success: boolean;
  /** Applied */
  applied: BackfillApplyResultItem[];
  /** Audit Id */
  audit_id?: number | null;
}

/** BackfillApplyResultItem */
export interface BackfillApplyResultItem {
  /** Challenge Id */
  challenge_id: number;
  /** Title */
  title: string;
  /** Added Players */
  added_players: string[];
  /** Before Progress */
  before_progress: number;
  /** After Progress */
  after_progress: number;
  /** Player Diffs */
  player_diffs: Record<string, Record<string, any>>;
  /**
   * Warnings
   * @default []
   */
  warnings?: string[];
}

/** BackfillPreviewItem */
export interface BackfillPreviewItem {
  /** Challenge Id */
  challenge_id: number;
  /** Quarter Id */
  quarter_id: number;
  /** Title */
  title: string;
  /** Type */
  type: string;
  /** Progress Mode */
  progress_mode: string | null;
  /** Existing Participants */
  existing_participants: number;
  /** Expected Participants */
  expected_participants: number;
  /** Missing Players */
  missing_players: string[];
  /** Progress Mode Mismatch */
  progress_mode_mismatch: boolean;
}

/** BackfillPreviewResponse */
export interface BackfillPreviewResponse {
  /** Items */
  items: BackfillPreviewItem[];
  /** Total Candidates */
  total_candidates: number;
}

/** BatchGenerateRequest */
export interface BatchGenerateRequest {
  team_a_config: AssetConfig;
  team_b_config: AssetConfig;
  /**
   * Preview Only
   * @default true
   */
  preview_only?: boolean;
}

/** BookingActivityType */
export enum BookingActivityType {
  Lift = "lift",
  Call = "call",
  Book = "book",
}

/** BulkEnrollRequest */
export interface BulkEnrollRequest {
  /** Competition Id */
  competition_id: number;
  /** Player Names */
  player_names: string[];
}

/** BulkEnrollResponse */
export interface BulkEnrollResponse {
  /** Success Count */
  success_count: number;
  /** Failed Count */
  failed_count: number;
  /** Enrolled Players */
  enrolled_players: string[];
  /** Failed Players */
  failed_players: string[];
}

/** BulkEntryRequest */
export interface BulkEntryRequest {
  /** Competition Id */
  competition_id: number;
  /** Player Name */
  player_name: string;
  activity_type: BookingActivityType;
  /**
   * Count
   * @min 1
   * @max 50
   */
  count: number;
}

/** Caps */
export interface Caps {
  /**
   * Per Player Per Day
   * Daily cap per player
   */
  per_player_per_day?: number | null;
  /**
   * Per Player Total
   * Total cap per player
   */
  per_player_total?: number | null;
  /**
   * Global Total
   * Global competition cap
   */
  global_total?: number | null;
}

/** ChallengeParticipantCreate */
export interface ChallengeParticipantCreate {
  /** Challenge Id */
  challenge_id: number;
  /** Player Name */
  player_name: string;
  /** Contribution */
  contribution: number;
}

/** ChallengeResponse */
export interface ChallengeResponse {
  /** Id */
  id: number;
  /** Template Id */
  template_id: number | null;
  /** Quarter Id */
  quarter_id: number;
  /** Title */
  title: string;
  /** Description */
  description: string | null;
  /** Type */
  type: string;
  /** Icon */
  icon: string;
  /** Target Value */
  target_value: number;
  /** Target Type */
  target_type: string;
  /** Current Progress */
  current_progress: number;
  /** Start Time */
  start_time: string;
  /** End Time */
  end_time: string;
  /** Reward Points */
  reward_points: number;
  /** Reward Description */
  reward_description: string | null;
  /** Status */
  status: string;
  /** Completed By */
  completed_by: string | null;
  /** Completed At */
  completed_at: string | null;
  /** Auto Generated */
  auto_generated: boolean;
  /** Generation Trigger */
  generation_trigger: string | null;
  /** Created At */
  created_at: string;
  /** Participants */
  participants?: Record<string, any>[] | null;
  /** Time Remaining Hours */
  time_remaining_hours?: number | null;
  /** Progress Percentage */
  progress_percentage?: number | null;
  /** Progress Mode */
  progress_mode?: string | null;
}

/** ChallengeRuleCreate */
export interface ChallengeRuleCreate {
  /** Name */
  name: string;
  /** Rule Type */
  rule_type: string;
  /** Conditions */
  conditions: Record<string, any>;
  /** Actions */
  actions: Record<string, any>;
  /**
   * Priority
   * @default 1
   */
  priority?: number;
  /**
   * Is Active
   * @default true
   */
  is_active?: boolean;
}

/** ChallengeTemplateCreate */
export interface ChallengeTemplateCreate {
  /** Name */
  name: string;
  /** Description */
  description: string;
  /** Type */
  type: string;
  /** Icon */
  icon: string;
  /** Target Type */
  target_type: string;
  /** Target Value Min */
  target_value_min: number;
  /** Target Value Max */
  target_value_max: number;
  /** Duration Hours */
  duration_hours: number;
  /** Reward Points Min */
  reward_points_min: number;
  /** Reward Points Max */
  reward_points_max: number;
  /** Trigger Conditions */
  trigger_conditions: Record<string, any>;
  /** Generation Rules */
  generation_rules: Record<string, any>;
  /**
   * Is Active
   * @default true
   */
  is_active?: boolean;
}

/** ChallengeTemplateUpdate */
export interface ChallengeTemplateUpdate {
  /** Name */
  name?: string | null;
  /** Description */
  description?: string | null;
  /** Type */
  type?: string | null;
  /** Icon */
  icon?: string | null;
  /** Target Type */
  target_type?: string | null;
  /** Target Value Min */
  target_value_min?: number | null;
  /** Target Value Max */
  target_value_max?: number | null;
  /** Duration Hours */
  duration_hours?: number | null;
  /** Reward Points Min */
  reward_points_min?: number | null;
  /** Reward Points Max */
  reward_points_max?: number | null;
  /** Trigger Conditions */
  trigger_conditions?: Record<string, any> | null;
  /** Generation Rules */
  generation_rules?: Record<string, any> | null;
  /** Is Active */
  is_active?: boolean | null;
}

/** ChallengeUpdate */
export interface ChallengeUpdate {
  /** Title */
  title?: string | null;
  /** Description */
  description?: string | null;
  /** Target Value */
  target_value?: number | null;
  /** Target Type */
  target_type?: string | null;
  /** Reward Points */
  reward_points?: number | null;
  /** Reward Description */
  reward_description?: string | null;
  /** End Time */
  end_time?: string | null;
  /** Is Visible */
  is_visible?: boolean | null;
}

/**
 * ChallengesSummaryResponse
 * Lightweight summary response for challenges
 */
export interface ChallengesSummaryResponse {
  /** Updated At */
  updated_at: string;
  /** Active Count */
  active_count: number;
  /** Completed Count */
  completed_count: number;
  /** Expiring Soon Count */
  expiring_soon_count: number;
  /** Challenges */
  challenges: Record<string, any>[];
}

/** Combo */
export interface Combo {
  /**
   * Name
   * Combo name
   */
  name: string;
  /**
   * Within Minutes
   * Time window in minutes
   * @min 1
   * @max 120
   */
  within_minutes: number;
  /**
   * Bonus
   * Bonus points
   * @min 1
   */
  bonus: number;
  /** Required Types */
  required_types?: BookingActivityType[] | null;
}

/** CompetitionCreate */
export interface CompetitionCreate {
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /**
   * Start Time
   * @format date-time
   */
  start_time: string;
  /**
   * End Time
   * @format date-time
   */
  end_time: string;
  /**
   * Is Hidden
   * @default true
   */
  is_hidden?: boolean;
  /**
   * Tiebreaker
   * @default "most_total"
   * @pattern ^(most_total|first_to|fastest_pace)$
   */
  tiebreaker?: string;
  /**
   * Team A Name
   * @default "Team Alpha"
   */
  team_a_name?: string;
  /**
   * Team B Name
   * @default "Team Beta"
   */
  team_b_name?: string;
  /**
   * Auto Assign Teams
   * @default true
   */
  auto_assign_teams?: boolean;
}

/** CompetitionCreateV2 */
export interface CompetitionCreateV2 {
  /**
   * Name
   * @minLength 1
   * @maxLength 255
   */
  name: string;
  /** Description */
  description?: string | null;
  /**
   * Start Time
   * @format date-time
   */
  start_time: string;
  /**
   * End Time
   * @format date-time
   */
  end_time: string;
  rules?: CompetitionRulesInput;
  theme?: CompetitionTheme;
  prizes?: CompetitionPrizes;
  /** Team Id */
  team_id?: number | null;
  /**
   * Is Hidden
   * @default true
   */
  is_hidden?: boolean;
}

/** CompetitionEventCreate */
export interface CompetitionEventCreate {
  /** Competition Id */
  competition_id: number;
  /**
   * Player Name
   * @minLength 1
   * @maxLength 255
   */
  player_name: string;
  type: BookingActivityType;
  /**
   * Source
   * @maxLength 50
   * @default "manual"
   */
  source?: string;
  /**
   * Custom Points
   * Override default points
   */
  custom_points?: number | null;
}

/** CompetitionEventResponse */
export interface CompetitionEventResponse {
  /**
   * Id
   * @format uuid
   */
  id: string;
  /** Competition Id */
  competition_id: number;
  /** Player Name */
  player_name: string;
  type: BookingActivityType;
  /** Points */
  points: number;
  /** Rule Triggered */
  rule_triggered: Record<string, any>;
  /**
   * Ts
   * @format date-time
   */
  ts: string;
  /** Source */
  source: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
}

/** CompetitionPrizes */
export interface CompetitionPrizes {
  /**
   * Winner
   * Points for winner
   * @min 0
   * @default 50
   */
  winner?: number;
  /**
   * Runner Up
   * Points for runner-up
   * @min 0
   * @default 20
   */
  runner_up?: number;
  /**
   * Participation
   * Points for participation
   * @min 0
   * @default 5
   */
  participation?: number;
  /**
   * Team Win Bonus
   * Bonus for team victory
   */
  team_win_bonus?: number | null;
  /** Custom Rewards */
  custom_rewards?: Record<string, any>;
}

/** CompetitionResponse */
export interface CompetitionResponse {
  /** Id */
  id: number;
  /** Name */
  name: string;
  /** Description */
  description: string | null;
  /**
   * Start Time
   * @format date-time
   */
  start_time: string;
  /**
   * End Time
   * @format date-time
   */
  end_time: string;
  /** Is Active */
  is_active: boolean;
  /** Is Hidden */
  is_hidden: boolean;
  /** Tiebreaker */
  tiebreaker: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
  /** Team A Name */
  team_a_name?: string | null;
  /** Team B Name */
  team_b_name?: string | null;
  /** Auto Assign Teams */
  auto_assign_teams?: boolean | null;
}

/** CompetitionResponseV2 */
export interface CompetitionResponseV2 {
  /** Id */
  id: number;
  /** Name */
  name: string;
  /** Description */
  description: string | null;
  /**
   * Start Time
   * @format date-time
   */
  start_time: string;
  /**
   * End Time
   * @format date-time
   */
  end_time: string;
  state: CompetitionState;
  /** Is Active */
  is_active: boolean;
  /** Is Hidden */
  is_hidden: boolean;
  rules: CompetitionRulesOutput;
  theme: CompetitionTheme;
  prizes: CompetitionPrizes;
  /** Team Id */
  team_id: number | null;
  /** Created By */
  created_by: string | null;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
}

/** CompetitionRules */
export interface CompetitionRulesInput {
  points?: PointsConfig;
  /** Multipliers */
  multipliers?: Multiplier[];
  /** Combos */
  combos?: Combo[];
  caps?: Caps;
  /**
   * Tie Breakers
   * Ordered list of tie breaker strategies
   * @default ["highest_books","earliest_to_target"]
   */
  tie_breakers?: string[];
}

/** CompetitionRules */
export interface CompetitionRulesOutput {
  points?: PointsConfig;
  /** Multipliers */
  multipliers?: Multiplier[];
  /** Combos */
  combos?: Combo[];
  caps?: Caps;
  /**
   * Tie Breakers
   * Ordered list of tie breaker strategies
   * @default ["highest_books","earliest_to_target"]
   */
  tie_breakers?: string[];
}

/** CompetitionState */
export enum CompetitionState {
  Draft = "draft",
  Active = "active",
  Paused = "paused",
  Finalized = "finalized",
}

/** CompetitionStatsResponse */
export interface CompetitionStatsResponse {
  /** Competition Id */
  competition_id: number;
  /** Total Participants */
  total_participants: number;
  /** Total Entries */
  total_entries: number;
  /** Most Active Player */
  most_active_player?: string | null;
  /** Leading Team */
  leading_team?: string | null;
  team_leaderboard: TeamLeaderboardResponse;
  /** Recent Activity */
  recent_activity: TeamActivityFeed[];
}

/** CompetitionTheme */
export interface CompetitionTheme {
  /**
   * Teams
   * @default []
   */
  teams?: TeamConfig[];
  vfx?: VFXConfig;
  /**
   * Badges
   * @default ["streaker","clutch","early_bird"]
   */
  badges?: string[];
  /**
   * Custom Sounds
   * @default {}
   */
  custom_sounds?: Record<string, string>;
}

/** CompetitionUpdate */
export interface CompetitionUpdate {
  /** Competition Id */
  competition_id: number;
  /** Name */
  name?: string | null;
  /** Description */
  description?: string | null;
  /** Start Time */
  start_time?: string | null;
  /** End Time */
  end_time?: string | null;
  /** Is Active */
  is_active?: boolean | null;
  /** Is Hidden */
  is_hidden?: boolean | null;
  /** Tiebreaker */
  tiebreaker?: string | null;
  /** Team A Name */
  team_a_name?: string | null;
  /** Team B Name */
  team_b_name?: string | null;
  /** Auto Assign Teams */
  auto_assign_teams?: boolean | null;
}

/** CompetitionWinner */
export interface CompetitionWinner {
  /** Player Name */
  player_name: string;
  /** Total Points */
  total_points: number;
  /** Rank */
  rank: number;
  /** Bonus Awarded */
  bonus_awarded: number;
  /** Team Name */
  team_name?: string | null;
}

/** CreateChallengeRequest */
export interface CreateChallengeRequest {
  /** Template Id */
  template_id?: number | null;
  /** Quarter Id */
  quarter_id: number;
  /** Title */
  title: string;
  /** Description */
  description?: string | null;
  /** Type */
  type: string;
  /**
   * Icon
   * @default "🎯"
   */
  icon?: string;
  /** Target Value */
  target_value: number;
  /** Target Type */
  target_type: string;
  /**
   * Duration Hours
   * @default 24
   */
  duration_hours?: number;
  /**
   * Reward Points
   * @default 10
   */
  reward_points?: number;
  /** Reward Description */
  reward_description?: string | null;
  /**
   * Auto Generated
   * @default false
   */
  auto_generated?: boolean;
  /** Generation Trigger */
  generation_trigger?: string | null;
}

/** CreateCompetitionRequest */
export interface CreateCompetitionRequest {
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /**
   * Activity Types
   * @default ["book","call","lift"]
   */
  activity_types?: string[];
  /**
   * Duration Hours
   * @default 24
   */
  duration_hours?: number;
  /**
   * Auto Start
   * @default true
   */
  auto_start?: boolean;
  /** Rules */
  rules?: Record<string, any> | null;
}

/** CreateCompetitionResponse */
export interface CreateCompetitionResponse {
  /** Success */
  success: boolean;
  /** Competition Id */
  competition_id?: number | null;
  /** Message */
  message: string;
  /** Start Time */
  start_time?: string | null;
  /** End Time */
  end_time?: string | null;
}

/** CreateQuarterRequest */
export interface CreateQuarterRequest {
  /** Name */
  name: string;
  /**
   * Start Date
   * @format date
   */
  start_date: string;
  /**
   * End Date
   * @format date
   */
  end_date: string;
}

/** DailyPlayerProgress */
export interface DailyPlayerProgress {
  /** Id */
  id: number;
  /** Name */
  name: string;
  /** Daily Points */
  daily_points: number;
  /** Daily Goal Points */
  daily_goal_points: number;
  /** Progress Percentage */
  progress_percentage: number;
  /** Avatar State */
  avatar_state: string;
  /** Position */
  position: number;
  /** Activities Count */
  activities_count: number;
}

/** DailyPlayersResponse */
export interface DailyPlayersResponse {
  /** Players */
  players: DailyPlayerProgress[];
  /** Quarter Name */
  quarter_name: string;
  /** Total Players */
  total_players: number;
  /** Workdays In Quarter */
  workdays_in_quarter: number;
  /** Workdays Passed */
  workdays_passed: number;
  /** Current Date */
  current_date: string;
}

/** DeleteActivityResponse */
export interface DeleteActivityResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Points Removed */
  points_removed: number;
  /** New Total Points */
  new_total_points: number;
}

/** DeleteEntryRequest */
export interface DeleteEntryRequest {
  /** Entry Id */
  entry_id: number;
  /** Reason */
  reason?: string | null;
}

/**
 * DetailedForecastResponse
 * Detailed forecast calculations for popup display
 */
export interface DetailedForecastResponse {
  /** Total Current */
  total_current: number;
  /** Total Forecast */
  total_forecast: number;
  /** Total Daily Rate */
  total_daily_rate: number;
  /** Quarter Info */
  quarter_info: Record<string, any>;
  /** Breakdown */
  breakdown: ForecastBreakdown[];
  /** Calculation Method */
  calculation_method: string;
}

/** EnrollParticipantRequest */
export interface EnrollParticipantRequest {
  /** Competition Id */
  competition_id: number;
  /** Player Name */
  player_name: string;
}

/** EntryResponse */
export interface EntryResponse {
  /** Id */
  id: number;
  /** Competition Id */
  competition_id: number;
  /** Player Name */
  player_name: string;
  /** Activity Id */
  activity_id: number | null;
  activity_type: BookingActivityType;
  /** Points */
  points: number;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /** Submitted By */
  submitted_by?: string | null;
}

/** FinalizeCompetitionRequestV2 */
export interface FinalizeCompetitionRequestV2 {
  /** Competition Id */
  competition_id: number;
  /**
   * Award Bonuses
   * @default true
   */
  award_bonuses?: boolean;
  /** Custom Message */
  custom_message?: string | null;
  /**
   * Notify Winners
   * @default true
   */
  notify_winners?: boolean;
}

/**
 * ForecastBreakdown
 * Detailed forecast breakdown for each activity type
 */
export interface ForecastBreakdown {
  /** Activity Type */
  activity_type: string;
  /** Current Count */
  current_count: number;
  /** Daily Rate */
  daily_rate: number;
  /** Projected Total */
  projected_total: number;
  /** Days Elapsed */
  days_elapsed: number;
  /** Total Quarter Days */
  total_quarter_days: number;
  /** Quarter Name */
  quarter_name: string;
  /** Quarter Progress Percent */
  quarter_progress_percent: number;
}

/**
 * FunnelData
 * Funnel conversion data
 */
export interface FunnelData {
  /** Lifts */
  lifts: number;
  /** Calls */
  calls: number;
  /** Books */
  books: number;
  /** Opps */
  opps: number;
  /** Deals */
  deals: number;
  /** Lifts To Calls Rate */
  lifts_to_calls_rate: number;
  /** Calls To Books Rate */
  calls_to_books_rate: number;
  /** Books To Opps Rate */
  books_to_opps_rate: number;
  /** Opps To Deals Rate */
  opps_to_deals_rate: number;
  /** Weakest Stage */
  weakest_stage: string;
  /** Weakest Stage Rate */
  weakest_stage_rate: number;
}

/** GenerateAssetsRequest */
export interface GenerateAssetsRequest {
  config: AssetConfig;
  /**
   * Preview Only
   * Generate low-res preview first
   * @default true
   */
  preview_only?: boolean;
}

/** GenerateAssetsResponse */
export interface GenerateAssetsResponse {
  /** Success */
  success: boolean;
  assets: AssetUrls;
  /** Version */
  version: number;
  /** Credits Used */
  credits_used: number;
  /** Message */
  message: string;
}

/** GenerateVisualsRequest */
export interface GenerateVisualsRequest {
  /** Team Name */
  team_name: string;
  /**
   * Style Prompt
   * @default "cosmic gaming theme with vibrant colors"
   */
  style_prompt?: string;
  /**
   * Asset Types
   * @default ["emblem","banner"]
   */
  asset_types?: string[];
  /**
   * Regenerate
   * @default false
   */
  regenerate?: boolean;
}

/** GenerateVisualsResponse */
export interface GenerateVisualsResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Assets
   * @default {}
   */
  assets?: Record<string, string>;
  /** Generation Id */
  generation_id?: string | null;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** HeatmapCell */
export interface HeatmapCell {
  /** Day */
  day: string;
  /** Hour */
  hour: number;
  /** Value */
  value: number;
  /** Label */
  label: string;
}

/**
 * HeatmapDataPoint
 * Single heatmap data point
 */
export interface HeatmapDataPoint {
  /** Period */
  period: number;
  /** Value */
  value: number;
  /** Label */
  label: string;
}

/** HeatmapResponse */
export interface HeatmapResponse {
  /** Data */
  data: HeatmapCell[];
  /** Max Value */
  max_value: number;
  /** Hint */
  hint?: string | null;
}

/** Highlight */
export interface Highlight {
  /** Type */
  type: string;
  /** Message */
  message: string;
  /** Player Name */
  player_name?: string | null;
  /**
   * Timestamp
   * @format date-time
   */
  timestamp: string;
}

/** HighlightsResponse */
export interface HighlightsResponse {
  /** Highlights */
  highlights: Highlight[];
}

/** IsAdminResponse */
export interface IsAdminResponse {
  /** Is Admin */
  is_admin: boolean;
  /** User Id */
  user_id: string;
}

/** KPIData */
export interface KPIData {
  /** Books */
  books: number;
  /** Opps */
  opps: number;
  /** Deals */
  deals: number;
  /** Forecast */
  forecast: number;
  /** Books Delta */
  books_delta?: number | null;
  /** Opps Delta */
  opps_delta?: number | null;
  /** Deals Delta */
  deals_delta?: number | null;
  /** Forecast Delta */
  forecast_delta?: number | null;
}

/** LeaderboardRequest */
export interface LeaderboardRequest {
  /**
   * Competition Id
   * @default 0
   */
  competition_id?: number;
  /**
   * Limit
   * @default 10
   */
  limit?: number;
}

/** LeaderboardResponse */
export interface LeaderboardResponse {
  /** Competition Id */
  competition_id: number;
  /** Standings */
  standings: Record<string, any>[];
  /** Last Updated */
  last_updated: string;
}

/** LeaderboardRow */
export interface LeaderboardRow {
  /** Player Name */
  player_name: string;
  /** Total Points */
  total_points: number;
  /** Entries */
  entries: number;
  /** Last Entry At */
  last_entry_at?: string | null;
  /** Team Name */
  team_name?: string | null;
}

/** LogActivityRequest */
export interface LogActivityRequest {
  type: ActivityType;
  /** Triggered By */
  triggered_by?: string | null;
}

/** LogActivityResponse */
export interface LogActivityResponse {
  /** Success */
  success: boolean;
  /** Points Earned */
  points_earned: number;
  /** Total Points */
  total_points: number;
  /** Activity Id */
  activity_id: number;
  /** Message */
  message: string;
  /** Activity Type */
  activity_type: string;
  /** Player Name */
  player_name: string;
  /** Progress Context */
  progress_context: Record<string, any>;
  /** Team Impact */
  team_impact: Record<string, any>;
  /** Streak Info */
  streak_info: Record<string, any>;
  /** Challenge Updates */
  challenge_updates?: Record<string, any> | null;
}

/** LogEventRequest */
export interface LogEventRequest {
  /**
   * Competition Id
   * @default 0
   */
  competition_id?: number;
  /** Activity Type */
  activity_type: string;
  /**
   * Count
   * @default 1
   */
  count?: number;
  /** Player Name */
  player_name?: string | null;
  /** Description */
  description?: string | null;
}

/** LogEventResponse */
export interface LogEventResponse {
  /** Success */
  success: boolean;
  /** Event Id */
  event_id?: string | null;
  /** Message */
  message: string;
  /**
   * Points Earned
   * @default 0
   */
  points_earned?: number;
}

/** MCPServerInfo */
export interface MCPServerInfo {
  /** Capabilities */
  capabilities: Record<string, boolean>;
  /** Tools */
  tools: Record<string, any>[];
}

/** ManageVisualsRequest */
export interface ManageVisualsRequest {
  /** Team Name */
  team_name: string;
  /** Action */
  action: string;
  /** Version */
  version?: string | null;
  /** Asset Type */
  asset_type?: string | null;
}

/** ManageVisualsResponse */
export interface ManageVisualsResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Current Version */
  current_version?: string | null;
}

/** MeetingWorkflowRequest */
export interface MeetingWorkflowRequest {
  /** Workflow Type */
  workflow_type: string;
  /**
   * Auto Actions
   * @default true
   */
  auto_actions?: boolean;
  /** Team Id */
  team_id?: number | null;
  /**
   * Horizon
   * @default "week"
   */
  horizon?: string | null;
}

/** MeetingWorkflowResponse */
export interface MeetingWorkflowResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Workflow Data */
  workflow_data?: Record<string, any> | null;
  /**
   * Actions Taken
   * @default []
   */
  actions_taken?: string[];
  /** Export Url */
  export_url?: string | null;
}

/** MilestonesResponse */
export interface MilestonesResponse {
  /** Milestones */
  milestones: AppApisTeamInsightsMilestone[];
  /** Team Goal Books */
  team_goal_books: number;
  /** Current Books */
  current_books: number;
  /** Overall Progress Pct */
  overall_progress_pct: number;
}

/** Multiplier */
export interface Multiplier {
  /**
   * Type
   * Type: time_window, streak, etc.
   */
  type: string;
  /**
   * Mult
   * Multiplier value
   * @min 1
   * @max 5
   */
  mult: number;
  window?: TimeWindow | null;
  /** Min */
  min?: number | null;
}

/**
 * PaceAnalysis
 * Pace vs target analysis
 */
export interface PaceAnalysis {
  /** Days Elapsed */
  days_elapsed: number;
  /** Days Remaining */
  days_remaining: number;
  /** Quarter Progress Percentage */
  quarter_progress_percentage: number;
  /** Books Pace Vs Target */
  books_pace_vs_target: number;
  /** Opps Pace Vs Target */
  opps_pace_vs_target: number;
  /** Deals Pace Vs Target */
  deals_pace_vs_target: number;
  /** Points Pace Vs Target */
  points_pace_vs_target: number;
  /** Is On Track */
  is_on_track: boolean;
}

/**
 * PaceIndicator
 * Pace analysis vs target
 */
export interface PaceIndicator {
  /** Current Per Day */
  current_per_day: number;
  /** Target Per Day */
  target_per_day: number;
  /** Delta Per Day */
  delta_per_day: number;
  /** Days Left */
  days_left: number;
  /** Status */
  status: string;
}

/** ParticipantResponse */
export interface ParticipantResponse {
  /** Id */
  id: number;
  /** Competition Id */
  competition_id: number;
  /** Player Name */
  player_name: string;
  /**
   * Enrolled At
   * @format date-time
   */
  enrolled_at: string;
  /** Team Name */
  team_name?: string | null;
}

/** PlayerChallengeResponse */
export interface PlayerChallengeResponse {
  /** Id */
  id: number;
  /** Title */
  title: string;
  /** Description */
  description: string | null;
  /** Type */
  type: string;
  /** Icon */
  icon: string;
  /** Target Value */
  target_value: number;
  /** Target Type */
  target_type: string;
  /** Current Progress */
  current_progress: number;
  /** Progress Percentage */
  progress_percentage: number;
  /** Time Remaining Hours */
  time_remaining_hours: number;
  /** Reward Points */
  reward_points: number;
  /** Reward Description */
  reward_description: string | null;
  /** Status */
  status: string;
  /** Participants */
  participants?: Record<string, any>[] | null;
}

/**
 * PlayerDetailedStatsResponse
 * Comprehensive player statistics for drawer UI
 */
export interface PlayerDetailedStatsResponse {
  /** Player Name */
  player_name: string;
  /** Quarter Name */
  quarter_name: string;
  /**
   * Last Updated
   * @format date-time
   */
  last_updated: string;
  /** Personal goals and current progress */
  personal_goals: PlayerGoalsProgress;
  /** Team progress compared to personal */
  team_progress: TeamProgressDelta;
  /** Pace vs target analysis */
  pace_analysis: PaceAnalysis;
  /** Recent Activities */
  recent_activities: RecentActivity[];
  /** Active Challenges */
  active_challenges: ActiveChallenge[];
  /** Predictions for achieving goals */
  predictions: TimeToGoalPrediction;
  /** Total Activities Count */
  total_activities_count: number;
  /** Current Position */
  current_position: number;
  /** Total Players */
  total_players: number;
}

/** PlayerGoalResponse */
export interface PlayerGoalResponse {
  /** Player Name */
  player_name: string;
  /** Quarter Id */
  quarter_id: number;
  /** Quarter Name */
  quarter_name: string;
  /** Goal Books */
  goal_books: number;
  /** Goal Opps */
  goal_opps: number;
  /** Goal Deals */
  goal_deals: number;
  /** Goal Points */
  goal_points: number;
  /** Current Books */
  current_books: number;
  /** Current Opps */
  current_opps: number;
  /** Current Deals */
  current_deals: number;
  /** Current Points */
  current_points: number;
}

/**
 * PlayerGoalsProgress
 * Personal goals and current progress
 */
export interface PlayerGoalsProgress {
  /** Goal Books */
  goal_books: number;
  /** Goal Opps */
  goal_opps: number;
  /** Goal Deals */
  goal_deals: number;
  /** Goal Points */
  goal_points: number;
  /** Current Books */
  current_books: number;
  /** Current Opps */
  current_opps: number;
  /** Current Deals */
  current_deals: number;
  /** Current Points */
  current_points: number;
  /** Books Progress Percentage */
  books_progress_percentage: number;
  /** Opps Progress Percentage */
  opps_progress_percentage: number;
  /** Deals Progress Percentage */
  deals_progress_percentage: number;
  /** Points Progress Percentage */
  points_progress_percentage: number;
}

/**
 * PlayerInsightsFunnelResponse
 * Funnel analysis data
 */
export interface PlayerInsightsFunnelResponse {
  /** Player Name */
  player_name: string;
  /**
   * Start Date
   * @format date
   */
  start_date: string;
  /**
   * End Date
   * @format date
   */
  end_date: string;
  /** Funnel conversion data */
  funnel: FunnelData;
}

/**
 * PlayerInsightsHeatmapResponse
 * Heatmap data for time/weekday analysis
 */
export interface PlayerInsightsHeatmapResponse {
  /** Player Name */
  player_name: string;
  /**
   * Start Date
   * @format date
   */
  start_date: string;
  /**
   * End Date
   * @format date
   */
  end_date: string;
  /** By Hour */
  by_hour: HeatmapDataPoint[];
  /** By Weekday */
  by_weekday: HeatmapDataPoint[];
  /** Best Hour */
  best_hour: string | null;
  /** Best Weekday */
  best_weekday: string | null;
  /** Coaching Hint */
  coaching_hint: string | null;
}

/**
 * PlayerInsightsStreaksResponse
 * Streaks and achievements data
 */
export interface PlayerInsightsStreaksResponse {
  /** Player Name */
  player_name: string;
  /** Quarter Name */
  quarter_name: string;
  /** Streak and achievement data */
  streaks: AppApisPlayerInsightsStreakData;
}

/**
 * PlayerInsightsSummaryResponse
 * Summary data for player insights dashboard
 */
export interface PlayerInsightsSummaryResponse {
  /** Player Name */
  player_name: string;
  /** Quarter Name */
  quarter_name: string;
  /**
   * Last Updated
   * @format date-time
   */
  last_updated: string;
  /** Progress data for donut charts */
  books: ProgressDonut;
  /** Progress data for donut charts */
  opps: ProgressDonut;
  /** Progress data for donut charts */
  deals: ProgressDonut;
  /** Progress data for donut charts */
  points: ProgressDonut;
  /** Pace analysis vs target */
  pace: PaceIndicator;
  /** Next Milestones */
  next_milestones: AppApisPlayerInsightsMilestone[];
  /** Quarter Progress Percentage */
  quarter_progress_percentage: number;
  /** Days Elapsed */
  days_elapsed: number;
  /** Days Remaining */
  days_remaining: number;
}

/**
 * PlayerInsightsTimeseriesResponse
 * Timeseries data for charts
 */
export interface PlayerInsightsTimeseriesResponse {
  /** Player Name */
  player_name: string;
  /** Metric */
  metric: string;
  /** Granularity */
  granularity: string;
  /**
   * Start Date
   * @format date
   */
  start_date: string;
  /**
   * End Date
   * @format date
   */
  end_date: string;
  /** Data */
  data: TimeseriesDataPoint[];
  /** Seven Day Average */
  seven_day_average: number | null;
  /** Previous Period Average */
  previous_period_average: number | null;
}

/** PlayerProgress */
export interface PlayerProgress {
  /** Id */
  id: number;
  /** Name */
  name: string;
  /** Points */
  points: number;
  /** Goal Points */
  goal_points: number;
  /** Goal Books */
  goal_books: number;
  /** Goal Opps */
  goal_opps: number;
  /** Goal Deals */
  goal_deals: number;
  /** Progress Percentage */
  progress_percentage: number;
  /** Avatar State */
  avatar_state: string;
  /** Position */
  position: number;
  /** Activities Count */
  activities_count: number;
}

/** PlayerProgressRequest */
export interface PlayerProgressRequest {
  /** Player Id */
  player_id?: string | null;
  /**
   * Period
   * @default "current_quarter"
   */
  period?: string;
}

/** PlayerProgressResponse */
export interface PlayerProgressResponse {
  /** Player Id */
  player_id: string;
  /** Player Name */
  player_name: string;
  /** Progress */
  progress: Record<string, any>;
  /** Streaks */
  streaks: Record<string, any>;
  /** Achievements */
  achievements: Record<string, any>[];
}

/** PlayerScore */
export interface PlayerScore {
  /** Player Name */
  player_name: string;
  /** Total Points */
  total_points: number;
  /** Event Count */
  event_count: number;
  /** Breakdown */
  breakdown?: Record<string, number>;
  /** Multipliers Applied */
  multipliers_applied?: string[];
  /** Combos Achieved */
  combos_achieved?: string[];
  /** Last Activity */
  last_activity?: string | null;
  /**
   * Current Streak
   * @default 0
   */
  current_streak?: number;
}

/** PlayerSelectionResponse */
export interface PlayerSelectionResponse {
  /** User Id */
  user_id: string;
  /** Player Name */
  player_name: string;
  /** Selected At */
  selected_at: string;
}

/** PlayersResponse */
export interface PlayersResponse {
  /** Players */
  players: PlayerProgress[];
  /** Quarter Name */
  quarter_name: string;
  /** Total Players */
  total_players: number;
}

/** PointsConfig */
export interface PointsConfig {
  /**
   * Lift
   * @min 0
   * @max 100
   * @default 1
   */
  lift?: number;
  /**
   * Call
   * @min 0
   * @max 100
   * @default 4
   */
  call?: number;
  /**
   * Book
   * @min 0
   * @max 100
   * @default 10
   */
  book?: number;
}

/**
 * ProgressDonut
 * Progress data for donut charts
 */
export interface ProgressDonut {
  /** Current */
  current: number;
  /** Target */
  target: number;
  /** Percentage */
  percentage: number;
  /** Remaining */
  remaining: number;
}

/** QuarterResponse */
export interface QuarterResponse {
  /** Id */
  id: number;
  /** Name */
  name: string;
  /**
   * Start Date
   * @format date
   */
  start_date: string;
  /**
   * End Date
   * @format date
   */
  end_date: string;
  /** Created At */
  created_at: string;
  /** Is Active */
  is_active: boolean;
}

/** QuickLogRequest */
export interface QuickLogRequest {
  /** Competition Id */
  competition_id: number;
  /** Player Name */
  player_name: string;
  activity_type: BookingActivityType;
}

/**
 * RecentActivity
 * Recent activity item
 */
export interface RecentActivity {
  /** Id */
  id: number;
  type: ActivityType;
  /** Points */
  points: number;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /** Days Ago */
  days_ago: number;
}

/**
 * ScoreboardResponse
 * Advanced scoreboard response for Competitions 2.0
 */
export interface ScoreboardResponse {
  /** Competition Id */
  competition_id: number;
  /** Individual Leaderboard */
  individual_leaderboard: PlayerScore[];
  /**
   * Last Updated
   * @format date-time
   */
  last_updated: string;
}

/** ScoringPreviewRequest */
export interface ScoringPreviewRequest {
  rules: CompetitionRulesInput;
  /**
   * Sample Events
   * Sample events to test scoring against
   */
  sample_events: Record<string, any>[];
}

/** ScoringPreviewResponse */
export interface ScoringPreviewResponse {
  /** Calculated Scores */
  calculated_scores: PlayerScore[];
  /** Rules Validation */
  rules_validation: Record<string, any>;
  /** Warnings */
  warnings?: string[];
  /** Errors */
  errors?: string[];
}

/** SelectPlayerRequest */
export interface SelectPlayerRequest {
  /** Player Name */
  player_name: string;
}

/** StreaksResponse */
export interface StreaksResponse {
  /** Streaks */
  streaks: AppApisTeamInsightsStreakData[];
  /** Team Best Streak */
  team_best_streak: number;
  /** Team Best Player */
  team_best_player: string;
}

/** SubmitEntryRequest */
export interface SubmitEntryRequest {
  /** Competition Id */
  competition_id: number;
  /** Player Name */
  player_name: string;
  /** Activity Id */
  activity_id?: number | null;
  /** @default "book" */
  activity_type?: BookingActivityType;
  /**
   * Points
   * @default 1
   */
  points?: number;
  /** Triggered By */
  triggered_by?: string | null;
}

/**
 * SuspiciousEvent
 * Details about a suspicious activity event
 */
export interface SuspiciousEvent {
  /** Player Name */
  player_name: string;
  /** Activity Type */
  activity_type: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /** Points */
  points: number;
  /** Suspicion Type */
  suspicion_type: string;
}

/** TeamActivityFeed */
export interface TeamActivityFeed {
  /** Player Name */
  player_name: string;
  /** Team Name */
  team_name: string;
  activity_type: BookingActivityType;
  /** Points */
  points: number;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
}

/** TeamAssetResponse */
export interface TeamAssetResponse {
  /** Id */
  id: number;
  /** Competition Id */
  competition_id: number;
  /** Team Name */
  team_name: string;
  assets: AssetUrls;
  /** Config */
  config: Record<string, any>;
  /** Version */
  version: number;
  /** Is Locked */
  is_locked: boolean;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
}

/** TeamAssignment */
export interface TeamAssignment {
  /** Team Name */
  team_name: string;
  /** Members */
  members: string[];
  /**
   * Color
   * @pattern ^#[0-9A-Fa-f]{6}$
   */
  color: string;
  /** Description */
  description: string;
}

/** TeamConfig */
export interface TeamConfig {
  /** Team Id */
  team_id?: number | null;
  /**
   * Label
   * Display name for team
   */
  label: string;
  /**
   * Color
   * Hex color code
   * @pattern ^#[0-9A-Fa-f]{6}$
   */
  color: string;
}

/** TeamGoalsResponse */
export interface TeamGoalsResponse {
  /** Quarter Id */
  quarter_id: number;
  /** Quarter Name */
  quarter_name: string;
  /** Total Goal Books */
  total_goal_books: number;
  /** Total Goal Opps */
  total_goal_opps: number;
  /** Total Goal Deals */
  total_goal_deals: number;
  /** Total Goal Points */
  total_goal_points: number;
}

/** TeamInsightsSummaryResponse */
export interface TeamInsightsSummaryResponse {
  kpis: KPIData;
  /**
   * Period Start
   * @format date-time
   */
  period_start: string;
  /**
   * Period End
   * @format date-time
   */
  period_end: string;
  /** Days In Period */
  days_in_period: number;
  /** Days Passed */
  days_passed: number;
  /** Comparison Period */
  comparison_period?: string | null;
}

/** TeamLeaderboardResponse */
export interface TeamLeaderboardResponse {
  /** Competition Id */
  competition_id: number;
  team_a: TeamStats;
  team_b: TeamStats;
  /** Individual Leaderboard */
  individual_leaderboard: LeaderboardRow[];
}

/** TeamNamingRequest */
export interface TeamNamingRequest {
  /**
   * Participants
   * List of participant names
   */
  participants: string[];
  /**
   * Competition Name
   * Name of the competition
   */
  competition_name: string;
  /**
   * Theme
   * Competition theme (cosmic, space, etc.)
   */
  theme?: string | null;
  /**
   * Style
   * Naming style preference
   * @default "cosmic"
   */
  style?: string | null;
  /**
   * Team Count
   * Number of teams to create
   * @min 2
   * @max 4
   * @default 2
   */
  team_count?: number;
}

/** TeamNamingResponse */
export interface TeamNamingResponse {
  /**
   * Teams
   * Generated teams with names and assignments
   */
  teams: Record<string, any>[];
  /**
   * Reasoning
   * AI explanation of naming choices
   */
  reasoning: string;
}

/**
 * TeamProgressDelta
 * Team progress compared to personal
 */
export interface TeamProgressDelta {
  /** Team Goal Books */
  team_goal_books: number;
  /** Team Goal Opps */
  team_goal_opps: number;
  /** Team Goal Deals */
  team_goal_deals: number;
  /** Team Goal Points */
  team_goal_points: number;
  /** Team Current Books */
  team_current_books: number;
  /** Team Current Opps */
  team_current_opps: number;
  /** Team Current Deals */
  team_current_deals: number;
  /** Team Current Points */
  team_current_points: number;
  /** Team Progress Percentage */
  team_progress_percentage: number;
}

/** TeamStats */
export interface TeamStats {
  /** Team Name */
  team_name: string;
  /** Total Points */
  total_points: number;
  /** Member Count */
  member_count: number;
  /** Entries */
  entries: number;
  /** Last Activity At */
  last_activity_at?: string | null;
}

/** TeamStatsResponse */
export interface TeamStatsResponse {
  /** Team Progress */
  team_progress: Record<string, any>;
  /** Benchmark Progress */
  benchmark_progress: Record<string, any>;
  /** Planet Status */
  planet_status: Record<string, any>;
  /** Race Position */
  race_position: Record<string, any>;
  /** Quarter Info */
  quarter_info: Record<string, any>;
}

/** TeammateListResponse */
export interface TeammateListResponse {
  /** Your Team */
  your_team: string;
  /** Teammates */
  teammates: string[];
  /** Opposing Team */
  opposing_team: string;
  /** Opponents */
  opponents: string[];
}

/**
 * TimeToGoalPrediction
 * Predictions for achieving goals
 */
export interface TimeToGoalPrediction {
  /** Books Days To Goal */
  books_days_to_goal: number | null;
  /** Opps Days To Goal */
  opps_days_to_goal: number | null;
  /** Deals Days To Goal */
  deals_days_to_goal: number | null;
  /** Points Days To Goal */
  points_days_to_goal: number | null;
  /** Likelihood To Achieve All */
  likelihood_to_achieve_all: string;
}

/** TimeWindow */
export interface TimeWindow {
  /**
   * Start
   * Start time in HH:MM format
   */
  start: string;
  /**
   * End
   * End time in HH:MM format
   */
  end: string;
  /**
   * Tz
   * Timezone
   * @default "Europe/Oslo"
   */
  tz?: string;
}

/**
 * TimeseriesDataPoint
 * Single data point for timeseries
 */
export interface TimeseriesDataPoint {
  /**
   * Date
   * @format date
   */
  date: string;
  /** Value */
  value: number;
}

/** TimeseriesPoint */
export interface TimeseriesPoint {
  /** Date */
  date: string;
  /** Value */
  value: number;
  /** Cumulative */
  cumulative: number;
}

/** TimeseriesResponse */
export interface TimeseriesResponse {
  /** Data */
  data: TimeseriesPoint[];
  /** Metric */
  metric: string;
  /** Interval */
  interval: string;
  /**
   * Period Start
   * @format date-time
   */
  period_start: string;
  /**
   * Period End
   * @format date-time
   */
  period_end: string;
}

/** ToggleChallengeVisibilityRequest */
export interface ToggleChallengeVisibilityRequest {
  /** Is Visible */
  is_visible: boolean;
}

/** ToggleVisibilityRequest */
export interface ToggleVisibilityRequest {
  /** Competition Id */
  competition_id: number;
  /** Is Hidden */
  is_hidden: boolean;
}

/**
 * UndoStats
 * Statistics about undo usage by player
 */
export interface UndoStats {
  /** Player Name */
  player_name: string;
  /** Undo Count */
  undo_count: number;
  /**
   * Last Undo
   * @format date-time
   */
  last_undo: string;
}

/** UpdateActivityRequest */
export interface UpdateActivityRequest {
  type: ActivityType;
}

/** UpdateActivityResponse */
export interface UpdateActivityResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Points Changed */
  points_changed: number;
  /** New Total Points */
  new_total_points: number;
  /** Activity Id */
  activity_id: number;
}

/** UpdateEntryRequest */
export interface UpdateEntryRequest {
  /** Entry Id */
  entry_id: number;
  activity_type?: BookingActivityType | null;
  /** Points */
  points?: number | null;
}

/** UpdatePlayerGoalsRequest */
export interface UpdatePlayerGoalsRequest {
  /** Quarter Id */
  quarter_id: number;
  /** Player Name */
  player_name: string;
  /** Goal Books */
  goal_books: number;
  /** Goal Opps */
  goal_opps: number;
  /** Goal Deals */
  goal_deals: number;
}

/** UpdateQuarterStatusRequest */
export interface UpdateQuarterStatusRequest {
  /** Quarter Id */
  quarter_id: number;
  /** Is Active */
  is_active: boolean;
}

/** VFXConfig */
export interface VFXConfig {
  /**
   * Warp Trail
   * @default "medium"
   * @pattern ^(off|low|medium|high)$
   */
  warp_trail?: string;
  /**
   * Sparkles
   * @default "low"
   * @pattern ^(off|low|medium|high)$
   */
  sparkles?: string;
  /**
   * Screen Shake On Win
   * @default true
   */
  screen_shake_on_win?: boolean;
  /**
   * Particle Effects
   * @default true
   */
  particle_effects?: boolean;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

/**
 * ValidationRequest
 * Request to validate competition rules
 */
export interface ValidationRequest {
  rules: CompetitionRulesInput;
  theme: CompetitionTheme;
  prizes: CompetitionPrizes;
}

/**
 * ValidationResponse
 * Response for competition rules validation
 */
export interface ValidationResponse {
  /** Is Valid */
  is_valid: boolean;
  /** Errors */
  errors?: ValidationError[];
  /** Warnings */
  warnings?: string[];
  /** Suggestions */
  suggestions?: string[];
}

/** VeyraChatRequest */
export interface VeyraChatRequest {
  /** Message */
  message: string;
  /** Context */
  context?: string | null;
}

/** VeyraChatResponse */
export interface VeyraChatResponse {
  /** Response */
  response: string;
  /**
   * Speaker
   * @default "veyra"
   */
  speaker?: string;
}

/** VisualsHistoryRequest */
export interface VisualsHistoryRequest {
  /** Team Name */
  team_name: string;
  /**
   * Limit
   * @default 20
   */
  limit?: number;
}

/** VisualsHistoryResponse */
export interface VisualsHistoryResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Versions
   * @default []
   */
  versions?: Record<string, any>[];
  /**
   * Total Versions
   * @default 0
   */
  total_versions?: number;
}

/** FinalizeCompetitionRequest */
export interface AppApisMcpFinalizeCompetitionRequest {
  /** Competition Id */
  competition_id: number;
  /**
   * Force
   * @default false
   */
  force?: boolean;
}

/** FinalizeCompetitionResponse */
export interface AppApisMcpFinalizeCompetitionResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Winner */
  winner?: Record<string, any> | null;
  /**
   * Final Standings
   * @default []
   */
  final_standings?: Record<string, any>[];
}

/** UndoEventRequest */
export interface AppApisMcpUndoEventRequest {
  /** Competition Id */
  competition_id: number;
  /** Event Id */
  event_id?: string | null;
  /** Player Name */
  player_name?: string | null;
}

/** UndoEventResponse */
export interface AppApisMcpUndoEventResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Events Undone
   * @default 0
   */
  events_undone?: number;
}

/**
 * Milestone
 * Next milestone to reach
 */
export interface AppApisPlayerInsightsMilestone {
  /** Metric */
  metric: string;
  /** Threshold Percentage */
  threshold_percentage: number;
  /** Remaining */
  remaining: number;
  /** Description */
  description: string;
}

/**
 * StreakData
 * Streak and achievement data
 */
export interface AppApisPlayerInsightsStreakData {
  /** Current Activity Streak Days */
  current_activity_streak_days: number;
  /** Longest Activity Streak Days */
  longest_activity_streak_days: number;
  /** Best Week Books */
  best_week_books: number;
  /** Best Week Period */
  best_week_period: string;
  /** Recent Achievements */
  recent_achievements: string[];
}

/** Milestone */
export interface AppApisTeamInsightsMilestone {
  /** Threshold */
  threshold: number;
  /** Target Books */
  target_books: number;
  /** Current Books */
  current_books: number;
  /** Progress Pct */
  progress_pct: number;
  /** Achieved */
  achieved: boolean;
  /** What It Takes */
  what_it_takes?: string | null;
}

/** StreakData */
export interface AppApisTeamInsightsStreakData {
  /** Player Name */
  player_name: string;
  /** Current Streak */
  current_streak: number;
  /** Longest Streak */
  longest_streak: number;
  /** Streak Type */
  streak_type: string;
}

/** FinalizeCompetitionRequest */
export interface AppLibsModelsCompetitionFinalizeCompetitionRequest {
  /** Competition Id */
  competition_id: number;
  /**
   * Set Inactive
   * @default true
   */
  set_inactive?: boolean;
}

/** FinalizeCompetitionResponse */
export interface AppLibsModelsCompetitionV2FinalizeCompetitionResponse {
  /** Competition Id */
  competition_id: number;
  /** Winners */
  winners: CompetitionWinner[];
  /**
   * Snapshot Id
   * @format uuid
   */
  snapshot_id: string;
  /** Total Bonuses Awarded */
  total_bonuses_awarded: number;
  /**
   * Finalized At
   * @format date-time
   */
  finalized_at: string;
}

/**
 * UndoEventRequest
 * Request to undo a competition event
 */
export interface AppLibsModelsCompetitionV2UndoEventRequest {
  /** Event Id */
  event_id: number;
  /**
   * Reason
   * @default "User requested undo"
   */
  reason?: string;
}

/**
 * UndoEventResponse
 * Response after undoing an event
 */
export interface AppLibsModelsCompetitionV2UndoEventResponse {
  /** Success */
  success: boolean;
  /** Undo Event Id */
  undo_event_id: number;
  /** Message */
  message: string;
}

export type CheckHealthData = HealthResponse;

export interface GetPlayerDetailedStatsParams {
  /** Player Name */
  player_name: string;
}

export type GetPlayerDetailedStatsData = PlayerDetailedStatsResponse;

export type GetPlayerDetailedStatsError = HTTPValidationError;

export interface GetPlayerInsightsSummaryParams {
  /** Player Name */
  player_name: string;
  /**
   * Range
   * Time range: Q for quarter, M for month
   * @default "Q"
   */
  range?: string;
}

export type GetPlayerInsightsSummaryData = PlayerInsightsSummaryResponse;

export type GetPlayerInsightsSummaryError = HTTPValidationError;

export interface GetPlayerInsightsTimeseriesParams {
  /** Player Name */
  player_name: string;
  /**
   * Metric
   * Metric: lifts, calls, books, opps, deals
   */
  metric: string;
  /**
   * Granularity
   * Granularity: daily, weekly
   * @default "daily"
   */
  granularity?: string;
  /**
   * Start
   * Start date
   * @format date
   */
  start: string;
  /**
   * End
   * End date
   * @format date
   */
  end: string;
}

export type GetPlayerInsightsTimeseriesData = PlayerInsightsTimeseriesResponse;

export type GetPlayerInsightsTimeseriesError = HTTPValidationError;

export interface GetPlayerInsightsFunnelParams {
  /** Player Name */
  player_name: string;
  /**
   * Start
   * Start date
   * @format date
   */
  start: string;
  /**
   * End
   * End date
   * @format date
   */
  end: string;
}

export type GetPlayerInsightsFunnelData = PlayerInsightsFunnelResponse;

export type GetPlayerInsightsFunnelError = HTTPValidationError;

export interface GetPlayerInsightsHeatmapParams {
  /** Player Name */
  player_name: string;
  /**
   * Start
   * Start date
   * @format date
   */
  start: string;
  /**
   * End
   * End date
   * @format date
   */
  end: string;
}

export type GetPlayerInsightsHeatmapData = PlayerInsightsHeatmapResponse;

export type GetPlayerInsightsHeatmapError = HTTPValidationError;

export interface GetPlayerInsightsStreaksParams {
  /** Player Name */
  player_name: string;
}

export type GetPlayerInsightsStreaksData = PlayerInsightsStreaksResponse;

export type GetPlayerInsightsStreaksError = HTTPValidationError;

export type GenerateTeamNamesData = TeamNamingResponse;

export type GenerateTeamNamesError = HTTPValidationError;

/** Teams */
export type ValidateTeamAssignmentsPayload = TeamAssignment[];

/** Response Validate Team Assignments */
export type ValidateTeamAssignmentsData = Record<string, any>;

export type ValidateTeamAssignmentsError = HTTPValidationError;

export type GetAvailablePlayersData = AvailablePlayersResponse;

/** Response Get My Player */
export type GetMyPlayerData = PlayerSelectionResponse | null;

export type SelectPlayerData = PlayerSelectionResponse;

export type SelectPlayerError = HTTPValidationError;

export type GetPlayersDailyProgressData = DailyPlayersResponse;

export type GetPlayersProgressData = PlayersResponse;

export interface GetLeaderboardParams {
  /**
   * Period
   * @default "daily"
   */
  period?: string;
}

/** Response Get Leaderboard */
export type GetLeaderboardData = Record<string, any>;

export type GetLeaderboardError = HTTPValidationError;

export type BulkEnrollPlayersData = BulkEnrollResponse;

export type BulkEnrollPlayersError = HTTPValidationError;

export interface GenerateAssetsParams {
  /** Competition Id */
  competitionId: number;
  /** Team Name */
  teamName: string;
}

export type GenerateAssetsData = GenerateAssetsResponse;

export type GenerateAssetsError = HTTPValidationError;

export interface BatchGenerateAssetsParams {
  /** Competition Id */
  competitionId: number;
}

/** Response Batch Generate Assets */
export type BatchGenerateAssetsData = Record<string, GenerateAssetsResponse>;

export type BatchGenerateAssetsError = HTTPValidationError;

export interface GetTeamAssetsParams {
  /** Competition Id */
  competitionId: number;
  /** Team Name */
  teamName: string;
}

/** Response Get Team Assets */
export type GetTeamAssetsData = TeamAssetResponse[];

export type GetTeamAssetsError = HTTPValidationError;

export interface ManageAssetsParams {
  /** Version */
  version?: number | null;
  /** Competition Id */
  competitionId: number;
  /** Team Name */
  teamName: string;
  /** Action */
  action: string;
}

/** Response Manage Assets */
export type ManageAssetsData = Record<string, any>;

export type ManageAssetsError = HTTPValidationError;

export type McpLogCompetitionEventData = LogEventResponse;

export type McpLogCompetitionEventError = HTTPValidationError;

export type McpGetLeaderboardData = LeaderboardResponse;

export type McpGetLeaderboardError = HTTPValidationError;

export type McpGetPlayerProgressData = PlayerProgressResponse;

export type McpGetPlayerProgressError = HTTPValidationError;

export type ExecuteMeetingWorkflowData = MeetingWorkflowResponse;

export type ExecuteMeetingWorkflowError = HTTPValidationError;

export interface ExportMeetingDataParams {
  /** Workflow Type */
  workflowType: string;
  /** Timestamp */
  timestamp: string;
}

export type ExportMeetingDataData = any;

export type ExportMeetingDataError = HTTPValidationError;

export type GetMcpServerInfoData = MCPServerInfo;

export interface ToggleMcpFeatureParams {
  /** Enabled */
  enabled: boolean;
}

export type ToggleMcpFeatureData = any;

export type ToggleMcpFeatureError = HTTPValidationError;

export type McpStatusData = any;

export type McpCreateCompetitionData = CreateCompetitionResponse;

export type McpCreateCompetitionError = HTTPValidationError;

export type McpFinalizeCompetitionData = AppApisMcpFinalizeCompetitionResponse;

export type McpFinalizeCompetitionError = HTTPValidationError;

export type McpUndoLastEventData = AppApisMcpUndoEventResponse;

export type McpUndoLastEventError = HTTPValidationError;

export type McpGenerateVisualsData = GenerateVisualsResponse;

export type McpGenerateVisualsError = HTTPValidationError;

export type McpManageVisualsData = ManageVisualsResponse;

export type McpManageVisualsError = HTTPValidationError;

export type McpVisualsHistoryData = VisualsHistoryResponse;

export type McpVisualsHistoryError = HTTPValidationError;

export interface GetCompetitionEntriesParams {
  /** Competition Id */
  competitionId: number;
}

export type GetCompetitionEntriesData = any;

export type GetCompetitionEntriesError = HTTPValidationError;

export type QuickLogActivityData = any;

export type QuickLogActivityError = HTTPValidationError;

export type BulkLogActivitiesData = any;

export type BulkLogActivitiesError = HTTPValidationError;

export type UpdateEntryData = any;

export type UpdateEntryError = HTTPValidationError;

export type DeleteEntryData = any;

export type DeleteEntryError = HTTPValidationError;

export type CreateCompetitionData = CompetitionResponse;

export type CreateCompetitionError = HTTPValidationError;

export type UpdateCompetitionData = CompetitionResponse;

export type UpdateCompetitionError = HTTPValidationError;

export type EnrollParticipantData = ParticipantResponse;

export type EnrollParticipantError = HTTPValidationError;

export type SubmitEntryData = EntryResponse;

export type SubmitEntryError = HTTPValidationError;

export interface LeaderboardParams {
  /** Competition Id */
  competitionId: number;
}

export type LeaderboardData = any;

export type LeaderboardError = HTTPValidationError;

export interface LeaderboardDetailedParams {
  /** Competition Id */
  competitionId: number;
}

export type LeaderboardDetailedData = any;

export type LeaderboardDetailedError = HTTPValidationError;

export type FinalizeCompetitionData = CompetitionResponse;

export type FinalizeCompetitionError = HTTPValidationError;

export type ToggleVisibilityData = CompetitionResponse;

export type ToggleVisibilityError = HTTPValidationError;

export interface GetCompetitionParams {
  /** Competition Id */
  competitionId: number;
}

export type GetCompetitionData = CompetitionResponse;

export type GetCompetitionError = HTTPValidationError;

/** Response List Competitions */
export type ListCompetitionsData = Record<string, any>;

export interface GetTeamAssignmentsParams {
  /** Competition Id */
  competitionId: number;
}

export type GetTeamAssignmentsData = TeammateListResponse;

export type GetTeamAssignmentsError = HTTPValidationError;

export interface GetTeamLeaderboardParams {
  /** Competition Id */
  competitionId: number;
}

export type GetTeamLeaderboardData = TeamLeaderboardResponse;

export type GetTeamLeaderboardError = HTTPValidationError;

export interface GetTeamActivityFeedParams {
  /**
   * Limit
   * @default 20
   */
  limit?: number;
  /** Competition Id */
  competitionId: number;
}

/** Response Get Team Activity Feed */
export type GetTeamActivityFeedData = TeamActivityFeed[];

export type GetTeamActivityFeedError = HTTPValidationError;

export interface GetCompetitionStatsParams {
  /** Competition Id */
  competitionId: number;
}

export type GetCompetitionStatsData = CompetitionStatsResponse;

export type GetCompetitionStatsError = HTTPValidationError;

export type CosmicChatData = VeyraChatResponse;

export type CosmicChatError = HTTPValidationError;

export type IsAdminData = IsAdminResponse;

/** Response Get Quarters */
export type GetQuartersData = QuarterResponse[];

export type CreateQuarterData = QuarterResponse;

export type CreateQuarterError = HTTPValidationError;

export interface DeleteQuarterParams {
  /** Quarter Id */
  quarterId: number;
}

export type DeleteQuarterData = any;

export type DeleteQuarterError = HTTPValidationError;

export interface GetActivityLogsParams {
  /** Quarter Id */
  quarter_id?: number | null;
  /** Activity Type */
  activity_type?: string | null;
  /** Player Name */
  player_name?: string | null;
  /**
   * Limit
   * @default 100
   */
  limit?: number;
}

/** Response Get Activity Logs */
export type GetActivityLogsData = ActivityLogResponse[];

export type GetActivityLogsError = HTTPValidationError;

export interface GetPlayerGoalsParams {
  /** Quarter Id */
  quarterId: number;
}

/** Response Get Player Goals */
export type GetPlayerGoalsData = PlayerGoalResponse[];

export type GetPlayerGoalsError = HTTPValidationError;

export type UpdatePlayerGoalsData = PlayerGoalResponse;

export type UpdatePlayerGoalsError = HTTPValidationError;

export interface GetTeamGoalsParams {
  /** Quarter Id */
  quarterId: number;
}

export type GetTeamGoalsData = TeamGoalsResponse;

export type GetTeamGoalsError = HTTPValidationError;

export type UpdateQuarterStatusData = QuarterResponse;

export type UpdateQuarterStatusError = HTTPValidationError;

export type GetChallengeTemplatesData = any;

export type CreateChallengeTemplateData = any;

export type CreateChallengeTemplateError = HTTPValidationError;

export interface UpdateChallengeTemplateParams {
  /** Template Id */
  templateId: number;
}

export type UpdateChallengeTemplateData = any;

export type UpdateChallengeTemplateError = HTTPValidationError;

export interface DeleteChallengeTemplateParams {
  /** Template Id */
  templateId: number;
}

export type DeleteChallengeTemplateData = any;

export type DeleteChallengeTemplateError = HTTPValidationError;

export interface GetActiveChallengesParams {
  /** Quarter Id */
  quarter_id?: number | null;
}

/** Response Get Active Challenges */
export type GetActiveChallengesData = ChallengeResponse[];

export type GetActiveChallengesError = HTTPValidationError;

export type CreateChallengeData = any;

export type CreateChallengeError = HTTPValidationError;

export interface RecalculateChallengeProgressParams {
  /** Challenge Id */
  challengeId: number;
}

export type RecalculateChallengeProgressData = any;

export type RecalculateChallengeProgressError = HTTPValidationError;

export type GenerateChallengesData = any;

export type GetChallengeRulesData = any;

export type CreateChallengeRuleData = any;

export type CreateChallengeRuleError = HTTPValidationError;

export interface RevokeChallengeCompletionParams {
  /** Challenge Id */
  challengeId: number;
}

export type RevokeChallengeCompletionData = any;

export type RevokeChallengeCompletionError = HTTPValidationError;

export interface ToggleChallengeVisibilityParams {
  /** Challenge Id */
  challengeId: number;
}

export type ToggleChallengeVisibilityData = any;

export type ToggleChallengeVisibilityError = HTTPValidationError;

export interface DeleteChallengeParams {
  /** Challenge Id */
  challengeId: number;
}

export type DeleteChallengeData = any;

export type DeleteChallengeError = HTTPValidationError;

export interface UpdateChallengeParams {
  /** Challenge Id */
  challengeId: number;
}

export type UpdateChallengeData = any;

export type UpdateChallengeError = HTTPValidationError;

export interface DeleteActivityAdminParams {
  /** Activity Type */
  activity_type: string;
  /** Activity Id */
  activityId: number;
}

/** Response Delete Activity Admin */
export type DeleteActivityAdminData = Record<string, any>;

export type DeleteActivityAdminError = HTTPValidationError;

export interface CreateChallengeParticipantParams {
  /** Challenge Id */
  challengeId: number;
}

export type CreateChallengeParticipantData = any;

export type CreateChallengeParticipantError = HTTPValidationError;

export interface GetChallengeParticipantsParams {
  /** Challenge Id */
  challengeId: number;
}

export type GetChallengeParticipantsData = any;

export type GetChallengeParticipantsError = HTTPValidationError;

export interface UpdateChallengeParticipantParams {
  /** Challenge Id */
  challengeId: number;
  /** Participant Id */
  participantId: number;
}

export type UpdateChallengeParticipantData = any;

export type UpdateChallengeParticipantError = HTTPValidationError;

export interface DeleteChallengeParticipantParams {
  /** Challenge Id */
  challengeId: number;
  /** Participant Id */
  participantId: number;
}

export type DeleteChallengeParticipantData = any;

export type DeleteChallengeParticipantError = HTTPValidationError;

export interface PreviewBackfillPerPersonParams {
  /** Quarter Id */
  quarter_id?: number | null;
}

export type PreviewBackfillPerPersonData = BackfillPreviewResponse;

export type PreviewBackfillPerPersonError = HTTPValidationError;

export type ApplyBackfillPerPersonData = BackfillApplyResponse;

export type ApplyBackfillPerPersonError = HTTPValidationError;

export type LogActivityData = LogActivityResponse;

export type LogActivityError = HTTPValidationError;

export interface GetActivityHistoryParams {
  /**
   * Limit
   * @default 50
   */
  limit?: number;
}

export type GetActivityHistoryData = ActivityHistoryResponse;

export type GetActivityHistoryError = HTTPValidationError;

export type GetActivityStatsData = any;

export type GetTeamStatsData = TeamStatsResponse;

export interface DeleteActivityParams {
  /** Activity Id */
  activityId: number;
}

export type DeleteActivityData = DeleteActivityResponse;

export type DeleteActivityError = HTTPValidationError;

export interface UpdateActivityParams {
  /** Activity Id */
  activityId: number;
}

export type UpdateActivityData = UpdateActivityResponse;

export type UpdateActivityError = HTTPValidationError;

export type GetChallengesSummaryData = ChallengesSummaryResponse;

/** Response Get Player Active Challenges */
export type GetPlayerActiveChallengesData = PlayerChallengeResponse[];

export interface GenerateAiInsightsParams {
  /**
   * Team Id
   * Team ID filter
   */
  team_id?: number | null;
  /**
   * Range
   * Number of days to analyze
   * @default 30
   */
  range?: number;
  /**
   * Force Refresh
   * Force refresh cached insights
   * @default false
   */
  force_refresh?: boolean;
}

export type GenerateAiInsightsData = AIInsightsResponse;

export type GenerateAiInsightsError = HTTPValidationError;

export interface GetTeamInsightsSummaryParams {
  /**
   * Team Id
   * Team ID filter
   */
  team_id?: number | null;
  /**
   * Range
   * Number of days to analyze
   * @default 30
   */
  range?: number;
  /**
   * Compare
   * Include comparison with previous period
   * @default false
   */
  compare?: boolean;
  /**
   * Start Date
   * Start date (YYYY-MM-DD)
   */
  start_date?: string | null;
  /**
   * End Date
   * End date (YYYY-MM-DD)
   */
  end_date?: string | null;
}

export type GetTeamInsightsSummaryData = TeamInsightsSummaryResponse;

export type GetTeamInsightsSummaryError = HTTPValidationError;

export interface GetTeamInsightsTimeseriesParams {
  /**
   * Team Id
   * Team ID filter
   */
  team_id?: number | null;
  /**
   * Metric
   * Metric to track (books, opps, deals)
   * @default "books"
   */
  metric?: string;
  /**
   * Interval
   * Interval (daily, weekly)
   * @default "daily"
   */
  interval?: string;
  /**
   * Range
   * Number of days to analyze
   * @default 30
   */
  range?: number;
  /**
   * Start Date
   * Start date (YYYY-MM-DD)
   */
  start_date?: string | null;
  /**
   * End Date
   * End date (YYYY-MM-DD)
   */
  end_date?: string | null;
}

export type GetTeamInsightsTimeseriesData = TimeseriesResponse;

export type GetTeamInsightsTimeseriesError = HTTPValidationError;

export interface GetTeamInsightsMilestonesParams {
  /**
   * Team Id
   * Team ID filter
   */
  team_id?: number | null;
  /**
   * Range
   * Number of days to analyze
   * @default 30
   */
  range?: number;
  /**
   * Start Date
   * Start date (YYYY-MM-DD)
   */
  start_date?: string | null;
  /**
   * End Date
   * End date (YYYY-MM-DD)
   */
  end_date?: string | null;
}

export type GetTeamInsightsMilestonesData = MilestonesResponse;

export type GetTeamInsightsMilestonesError = HTTPValidationError;

export interface GetTeamInsightsHeatmapParams {
  /**
   * Team Id
   * Team ID filter
   */
  team_id?: number | null;
  /**
   * Start Date
   * Start date (YYYY-MM-DD)
   */
  start_date?: string | null;
  /**
   * End Date
   * End date (YYYY-MM-DD)
   */
  end_date?: string | null;
}

export type GetTeamInsightsHeatmapData = HeatmapResponse;

export type GetTeamInsightsHeatmapError = HTTPValidationError;

export interface GetTeamInsightsStreaksParams {
  /**
   * Team Id
   * Team ID filter
   */
  team_id?: number | null;
  /**
   * Range
   * Number of days to analyze
   * @default 30
   */
  range?: number;
  /**
   * Start Date
   * Start date (YYYY-MM-DD)
   */
  start_date?: string | null;
  /**
   * End Date
   * End date (YYYY-MM-DD)
   */
  end_date?: string | null;
}

export type GetTeamInsightsStreaksData = StreaksResponse;

export type GetTeamInsightsStreaksError = HTTPValidationError;

export interface GetTeamInsightsHighlightsParams {
  /**
   * Team Id
   * Team ID filter
   */
  team_id?: number | null;
  /**
   * Range
   * Number of days to analyze
   * @default 7
   */
  range?: number;
  /**
   * Start Date
   * Start date (YYYY-MM-DD)
   */
  start_date?: string | null;
  /**
   * End Date
   * End date (YYYY-MM-DD)
   */
  end_date?: string | null;
}

export type GetTeamInsightsHighlightsData = HighlightsResponse;

export type GetTeamInsightsHighlightsError = HTTPValidationError;

export interface GetForecastBreakdownParams {
  /**
   * Team Id
   * Team ID filter
   */
  team_id?: number | null;
  /**
   * Range
   * Number of days for comparison
   * @default 30
   */
  range?: number;
}

export type GetForecastBreakdownData = DetailedForecastResponse;

export type GetForecastBreakdownError = HTTPValidationError;

export type CreateCompetitionV2Data = CompetitionResponseV2;

export type CreateCompetitionV2Error = HTTPValidationError;

export type ValidateCompetitionConfigData = ValidationResponse;

export type ValidateCompetitionConfigError = HTTPValidationError;

export type PreviewScoringData = ScoringPreviewResponse;

export type PreviewScoringError = HTTPValidationError;

export type LogCompetitionEventData = CompetitionEventResponse;

export type LogCompetitionEventError = HTTPValidationError;

export interface GetCompetitionScoreboardV2Params {
  /** Competition Id */
  competitionId: number;
}

export type GetCompetitionScoreboardV2Data = ScoreboardResponse;

export type GetCompetitionScoreboardV2Error = HTTPValidationError;

/** Response List Competitions V2 */
export type ListCompetitionsV2Data = CompetitionResponseV2[];

export type HealthCheckData = any;

export type GetSampleConfigData = any;

export type UndoCompetitionEventData = AppLibsModelsCompetitionV2UndoEventResponse;

export type UndoCompetitionEventError = HTTPValidationError;

export interface GetAntiCheatReportParams {
  /** Competition Id */
  competitionId: number;
}

export type GetAntiCheatReportData = AntiCheatReportResponse;

export type GetAntiCheatReportError = HTTPValidationError;

export interface SimpleUndoEventParams {
  /** Event Id */
  eventId: string;
}

export type SimpleUndoEventData = any;

export type SimpleUndoEventError = HTTPValidationError;

export type FinalizeCompetitionV2Data = AppLibsModelsCompetitionV2FinalizeCompetitionResponse;

export type FinalizeCompetitionV2Error = HTTPValidationError;
