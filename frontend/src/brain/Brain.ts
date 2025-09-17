import {
  AppApisMcpFinalizeCompetitionRequest,
  AppApisMcpUndoEventRequest,
  AppLibsModelsCompetitionFinalizeCompetitionRequest,
  AppLibsModelsCompetitionV2UndoEventRequest,
  ApplyBackfillPerPersonData,
  ApplyBackfillPerPersonError,
  BackfillApplyRequest,
  BatchGenerateAssetsData,
  BatchGenerateAssetsError,
  BatchGenerateAssetsParams,
  BatchGenerateRequest,
  BulkEnrollPlayersData,
  BulkEnrollPlayersError,
  BulkEnrollRequest,
  BulkEntryRequest,
  BulkLogActivitiesData,
  BulkLogActivitiesError,
  ChallengeParticipantCreate,
  ChallengeRuleCreate,
  ChallengeTemplateCreate,
  ChallengeTemplateUpdate,
  ChallengeUpdate,
  CheckHealthData,
  CompetitionCreate,
  CompetitionCreateV2,
  CompetitionEventCreate,
  CompetitionUpdate,
  CosmicChatData,
  CosmicChatError,
  CreateChallengeData,
  CreateChallengeError,
  CreateChallengeParticipantData,
  CreateChallengeParticipantError,
  CreateChallengeParticipantParams,
  CreateChallengeRequest,
  CreateChallengeRuleData,
  CreateChallengeRuleError,
  CreateChallengeTemplateData,
  CreateChallengeTemplateError,
  CreateCompetitionData,
  CreateCompetitionError,
  CreateCompetitionRequest,
  CreateCompetitionV2Data,
  CreateCompetitionV2Error,
  CreateQuarterData,
  CreateQuarterError,
  CreateQuarterRequest,
  DeleteActivityAdminData,
  DeleteActivityAdminError,
  DeleteActivityAdminParams,
  DeleteActivityData,
  DeleteActivityError,
  DeleteActivityParams,
  DeleteChallengeData,
  DeleteChallengeError,
  DeleteChallengeParams,
  DeleteChallengeParticipantData,
  DeleteChallengeParticipantError,
  DeleteChallengeParticipantParams,
  DeleteChallengeTemplateData,
  DeleteChallengeTemplateError,
  DeleteChallengeTemplateParams,
  DeleteEntryData,
  DeleteEntryError,
  DeleteEntryRequest,
  DeleteQuarterData,
  DeleteQuarterError,
  DeleteQuarterParams,
  EnrollParticipantData,
  EnrollParticipantError,
  EnrollParticipantRequest,
  ExecuteMeetingWorkflowData,
  ExecuteMeetingWorkflowError,
  ExportMeetingDataData,
  ExportMeetingDataError,
  ExportMeetingDataParams,
  FinalizeCompetitionData,
  FinalizeCompetitionError,
  FinalizeCompetitionRequestV2,
  FinalizeCompetitionV2Data,
  FinalizeCompetitionV2Error,
  GenerateAiInsightsData,
  GenerateAiInsightsError,
  GenerateAiInsightsParams,
  GenerateAssetsData,
  GenerateAssetsError,
  GenerateAssetsParams,
  GenerateAssetsRequest,
  GenerateChallengesData,
  GenerateTeamNamesData,
  GenerateTeamNamesError,
  GenerateVisualsRequest,
  GetActiveChallengesData,
  GetActiveChallengesError,
  GetActiveChallengesParams,
  GetActivityHistoryData,
  GetActivityHistoryError,
  GetActivityHistoryParams,
  GetActivityLogsData,
  GetActivityLogsError,
  GetActivityLogsParams,
  GetActivityStatsData,
  GetAntiCheatReportData,
  GetAntiCheatReportError,
  GetAntiCheatReportParams,
  GetAvailablePlayersData,
  GetChallengeParticipantsData,
  GetChallengeParticipantsError,
  GetChallengeParticipantsParams,
  GetChallengeRulesData,
  GetChallengeTemplatesData,
  GetChallengesSummaryData,
  GetCompetitionData,
  GetCompetitionEntriesData,
  GetCompetitionEntriesError,
  GetCompetitionEntriesParams,
  GetCompetitionError,
  GetCompetitionParams,
  GetCompetitionScoreboardV2Data,
  GetCompetitionScoreboardV2Error,
  GetCompetitionScoreboardV2Params,
  GetCompetitionStatsData,
  GetCompetitionStatsError,
  GetCompetitionStatsParams,
  GetForecastBreakdownData,
  GetForecastBreakdownError,
  GetForecastBreakdownParams,
  GetLeaderboardData,
  GetLeaderboardError,
  GetLeaderboardParams,
  GetMcpServerInfoData,
  GetMyPlayerData,
  GetPlayerActiveChallengesData,
  GetPlayerDetailedStatsData,
  GetPlayerDetailedStatsError,
  GetPlayerDetailedStatsParams,
  GetPlayerGoalsData,
  GetPlayerGoalsError,
  GetPlayerGoalsParams,
  GetPlayerInsightsFunnelData,
  GetPlayerInsightsFunnelError,
  GetPlayerInsightsFunnelParams,
  GetPlayerInsightsHeatmapData,
  GetPlayerInsightsHeatmapError,
  GetPlayerInsightsHeatmapParams,
  GetPlayerInsightsStreaksData,
  GetPlayerInsightsStreaksError,
  GetPlayerInsightsStreaksParams,
  GetPlayerInsightsSummaryData,
  GetPlayerInsightsSummaryError,
  GetPlayerInsightsSummaryParams,
  GetPlayerInsightsTimeseriesData,
  GetPlayerInsightsTimeseriesError,
  GetPlayerInsightsTimeseriesParams,
  GetPlayersDailyProgressData,
  GetPlayersProgressData,
  GetQuartersData,
  GetSampleConfigData,
  GetTeamActivityFeedData,
  GetTeamActivityFeedError,
  GetTeamActivityFeedParams,
  GetTeamAssetsData,
  GetTeamAssetsError,
  GetTeamAssetsParams,
  GetTeamAssignmentsData,
  GetTeamAssignmentsError,
  GetTeamAssignmentsParams,
  GetTeamGoalsData,
  GetTeamGoalsError,
  GetTeamGoalsParams,
  GetTeamInsightsHeatmapData,
  GetTeamInsightsHeatmapError,
  GetTeamInsightsHeatmapParams,
  GetTeamInsightsHighlightsData,
  GetTeamInsightsHighlightsError,
  GetTeamInsightsHighlightsParams,
  GetTeamInsightsMilestonesData,
  GetTeamInsightsMilestonesError,
  GetTeamInsightsMilestonesParams,
  GetTeamInsightsStreaksData,
  GetTeamInsightsStreaksError,
  GetTeamInsightsStreaksParams,
  GetTeamInsightsSummaryData,
  GetTeamInsightsSummaryError,
  GetTeamInsightsSummaryParams,
  GetTeamInsightsTimeseriesData,
  GetTeamInsightsTimeseriesError,
  GetTeamInsightsTimeseriesParams,
  GetTeamLeaderboardData,
  GetTeamLeaderboardError,
  GetTeamLeaderboardParams,
  GetTeamStatsData,
  HealthCheckData,
  IsAdminData,
  LeaderboardData,
  LeaderboardDetailedData,
  LeaderboardDetailedError,
  LeaderboardDetailedParams,
  LeaderboardError,
  LeaderboardParams,
  LeaderboardRequest,
  ListCompetitionsData,
  ListCompetitionsV2Data,
  LogActivityData,
  LogActivityError,
  LogActivityRequest,
  LogCompetitionEventData,
  LogCompetitionEventError,
  LogEventRequest,
  ManageAssetsData,
  ManageAssetsError,
  ManageAssetsParams,
  ManageVisualsRequest,
  McpCreateCompetitionData,
  McpCreateCompetitionError,
  McpFinalizeCompetitionData,
  McpFinalizeCompetitionError,
  McpGenerateVisualsData,
  McpGenerateVisualsError,
  McpGetLeaderboardData,
  McpGetLeaderboardError,
  McpGetPlayerProgressData,
  McpGetPlayerProgressError,
  McpLogCompetitionEventData,
  McpLogCompetitionEventError,
  McpManageVisualsData,
  McpManageVisualsError,
  McpStatusData,
  McpUndoLastEventData,
  McpUndoLastEventError,
  McpVisualsHistoryData,
  McpVisualsHistoryError,
  MeetingWorkflowRequest,
  PlayerProgressRequest,
  PreviewBackfillPerPersonData,
  PreviewBackfillPerPersonError,
  PreviewBackfillPerPersonParams,
  PreviewScoringData,
  PreviewScoringError,
  QuickLogActivityData,
  QuickLogActivityError,
  QuickLogRequest,
  RecalculateChallengeProgressData,
  RecalculateChallengeProgressError,
  RecalculateChallengeProgressParams,
  RevokeChallengeCompletionData,
  RevokeChallengeCompletionError,
  RevokeChallengeCompletionParams,
  ScoringPreviewRequest,
  SelectPlayerData,
  SelectPlayerError,
  SelectPlayerRequest,
  SimpleUndoEventData,
  SimpleUndoEventError,
  SimpleUndoEventParams,
  SubmitEntryData,
  SubmitEntryError,
  SubmitEntryRequest,
  TeamNamingRequest,
  ToggleChallengeVisibilityData,
  ToggleChallengeVisibilityError,
  ToggleChallengeVisibilityParams,
  ToggleChallengeVisibilityRequest,
  ToggleMcpFeatureData,
  ToggleMcpFeatureError,
  ToggleMcpFeatureParams,
  ToggleVisibilityData,
  ToggleVisibilityError,
  ToggleVisibilityRequest,
  UndoCompetitionEventData,
  UndoCompetitionEventError,
  UpdateActivityData,
  UpdateActivityError,
  UpdateActivityParams,
  UpdateActivityRequest,
  UpdateChallengeData,
  UpdateChallengeError,
  UpdateChallengeParams,
  UpdateChallengeParticipantData,
  UpdateChallengeParticipantError,
  UpdateChallengeParticipantParams,
  UpdateChallengeTemplateData,
  UpdateChallengeTemplateError,
  UpdateChallengeTemplateParams,
  UpdateCompetitionData,
  UpdateCompetitionError,
  UpdateEntryData,
  UpdateEntryError,
  UpdateEntryRequest,
  UpdatePlayerGoalsData,
  UpdatePlayerGoalsError,
  UpdatePlayerGoalsRequest,
  UpdateQuarterStatusData,
  UpdateQuarterStatusError,
  UpdateQuarterStatusRequest,
  ValidateCompetitionConfigData,
  ValidateCompetitionConfigError,
  ValidateTeamAssignmentsData,
  ValidateTeamAssignmentsError,
  ValidateTeamAssignmentsPayload,
  ValidationRequest,
  VeyraChatRequest,
  VisualsHistoryRequest,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get comprehensive player statistics for drawer UI Args: player_name: Name of the player to get stats for user: Authenticated user (for security) Returns: Detailed player statistics including goals, pace, activities, challenges, and predictions
   *
   * @tags dbtn/module:player_stats, dbtn/hasAuth
   * @name get_player_detailed_stats
   * @summary Get Player Detailed Stats
   * @request GET:/routes/detailed-stats
   */
  get_player_detailed_stats = (query: GetPlayerDetailedStatsParams, params: RequestParams = {}) =>
    this.request<GetPlayerDetailedStatsData, GetPlayerDetailedStatsError>({
      path: `/routes/detailed-stats`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get comprehensive summary for player insights dashboard Args: player_name: Name of the player range: Time range (Q=quarter, M=month) user: Authenticated user (for access control) Returns: Summary data with progress donuts, pace analysis, and milestones
   *
   * @tags dbtn/module:player_insights, dbtn/hasAuth
   * @name get_player_insights_summary
   * @summary Get Player Insights Summary
   * @request GET:/routes/insights/summary
   */
  get_player_insights_summary = (query: GetPlayerInsightsSummaryParams, params: RequestParams = {}) =>
    this.request<GetPlayerInsightsSummaryData, GetPlayerInsightsSummaryError>({
      path: `/routes/insights/summary`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get timeseries data for player insights charts Args: player_name: Name of the player metric: Activity metric to track granularity: Time granularity start: Start date end: End date user: Authenticated user Returns: Timeseries data for charting
   *
   * @tags dbtn/module:player_insights, dbtn/hasAuth
   * @name get_player_insights_timeseries
   * @summary Get Player Insights Timeseries
   * @request GET:/routes/insights/timeseries
   */
  get_player_insights_timeseries = (query: GetPlayerInsightsTimeseriesParams, params: RequestParams = {}) =>
    this.request<GetPlayerInsightsTimeseriesData, GetPlayerInsightsTimeseriesError>({
      path: `/routes/insights/timeseries`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get funnel conversion analysis for player Args: player_name: Name of the player start: Start date for analysis end: End date for analysis user: Authenticated user Returns: Funnel conversion data with rates and bottleneck analysis
   *
   * @tags dbtn/module:player_insights, dbtn/hasAuth
   * @name get_player_insights_funnel
   * @summary Get Player Insights Funnel
   * @request GET:/routes/insights/funnel
   */
  get_player_insights_funnel = (query: GetPlayerInsightsFunnelParams, params: RequestParams = {}) =>
    this.request<GetPlayerInsightsFunnelData, GetPlayerInsightsFunnelError>({
      path: `/routes/insights/funnel`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get activity heatmap data for time-of-day and day-of-week analysis Args: player_name: Name of the player start: Start date for analysis end: End date for analysis user: Authenticated user Returns: Heatmap data with coaching hints about best performance times
   *
   * @tags dbtn/module:player_insights, dbtn/hasAuth
   * @name get_player_insights_heatmap
   * @summary Get Player Insights Heatmap
   * @request GET:/routes/insights/heatmap
   */
  get_player_insights_heatmap = (query: GetPlayerInsightsHeatmapParams, params: RequestParams = {}) =>
    this.request<GetPlayerInsightsHeatmapData, GetPlayerInsightsHeatmapError>({
      path: `/routes/insights/heatmap`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get player streaks and achievements data Args: player_name: Name of the player user: Authenticated user Returns: Streaks and achievements data
   *
   * @tags dbtn/module:player_insights, dbtn/hasAuth
   * @name get_player_insights_streaks
   * @summary Get Player Insights Streaks
   * @request GET:/routes/insights/streaks
   */
  get_player_insights_streaks = (query: GetPlayerInsightsStreaksParams, params: RequestParams = {}) =>
    this.request<GetPlayerInsightsStreaksData, GetPlayerInsightsStreaksError>({
      path: `/routes/insights/streaks`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Generate AI-powered team names and balanced assignments
   *
   * @tags dbtn/module:team_naming, dbtn/hasAuth
   * @name generate_team_names
   * @summary Generate Team Names
   * @request POST:/routes/team-naming/generate
   */
  generate_team_names = (data: TeamNamingRequest, params: RequestParams = {}) =>
    this.request<GenerateTeamNamesData, GenerateTeamNamesError>({
      path: `/routes/team-naming/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Validate team assignments for balance and completeness
   *
   * @tags dbtn/module:team_naming, dbtn/hasAuth
   * @name validate_team_assignments
   * @summary Validate Team Assignments
   * @request POST:/routes/team-naming/validate
   */
  validate_team_assignments = (data: ValidateTeamAssignmentsPayload, params: RequestParams = {}) =>
    this.request<ValidateTeamAssignmentsData, ValidateTeamAssignmentsError>({
      path: `/routes/team-naming/validate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get list of available and taken players
   *
   * @tags dbtn/module:player_selection, dbtn/hasAuth
   * @name get_available_players
   * @summary Get Available Players
   * @request GET:/routes/available-players
   */
  get_available_players = (params: RequestParams = {}) =>
    this.request<GetAvailablePlayersData, any>({
      path: `/routes/available-players`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the player selected by the current user
   *
   * @tags dbtn/module:player_selection, dbtn/hasAuth
   * @name get_my_player
   * @summary Get My Player
   * @request GET:/routes/my-player
   */
  get_my_player = (params: RequestParams = {}) =>
    this.request<GetMyPlayerData, any>({
      path: `/routes/my-player`,
      method: "GET",
      ...params,
    });

  /**
   * @description Select a player for the current user
   *
   * @tags dbtn/module:player_selection, dbtn/hasAuth
   * @name select_player
   * @summary Select Player
   * @request POST:/routes/select-player
   */
  select_player = (data: SelectPlayerRequest, params: RequestParams = {}) =>
    this.request<SelectPlayerData, SelectPlayerError>({
      path: `/routes/select-player`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get daily progress for all 12 named players with workday-based daily goals
   *
   * @tags dbtn/module:players
   * @name get_players_daily_progress
   * @summary Get Players Daily Progress
   * @request GET:/routes/players/daily-progress
   */
  get_players_daily_progress = (params: RequestParams = {}) =>
    this.request<GetPlayersDailyProgressData, any>({
      path: `/routes/players/daily-progress`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get progress for all 12 named players with avatar states and rankings
   *
   * @tags dbtn/module:players
   * @name get_players_progress
   * @summary Get Players Progress
   * @request GET:/routes/players/progress
   */
  get_players_progress = (params: RequestParams = {}) =>
    this.request<GetPlayersProgressData, any>({
      path: `/routes/players/progress`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get simplified leaderboard data for quick display Args: period: 'daily' for today's points, 'quarter' for total quarter points
   *
   * @tags dbtn/module:players
   * @name get_leaderboard
   * @summary Get Leaderboard
   * @request GET:/routes/players/leaderboard
   */
  get_leaderboard = (query: GetLeaderboardParams, params: RequestParams = {}) =>
    this.request<GetLeaderboardData, GetLeaderboardError>({
      path: `/routes/players/leaderboard`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Bulk enroll multiple players in a competition (admin only)
   *
   * @tags dbtn/module:admin_bulk, dbtn/hasAuth
   * @name bulk_enroll_players
   * @summary Bulk Enroll Players
   * @request POST:/routes/bulk-enroll
   */
  bulk_enroll_players = (data: BulkEnrollRequest, params: RequestParams = {}) =>
    this.request<BulkEnrollPlayersData, BulkEnrollPlayersError>({
      path: `/routes/bulk-enroll`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate AI assets for a specific team
   *
   * @tags dbtn/module:team_assets, dbtn/hasAuth
   * @name generate_assets
   * @summary Generate Assets
   * @request POST:/routes/{competition_id}/teams/{team_name}/assets/generate
   */
  generate_assets = (
    { competitionId, teamName, ...query }: GenerateAssetsParams,
    data: GenerateAssetsRequest,
    params: RequestParams = {},
  ) =>
    this.request<GenerateAssetsData, GenerateAssetsError>({
      path: `/routes/${competitionId}/teams/${teamName}/assets/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate assets for both teams simultaneously
   *
   * @tags dbtn/module:team_assets, dbtn/hasAuth
   * @name batch_generate_assets
   * @summary Batch Generate Assets
   * @request POST:/routes/{competition_id}/teams/batch-generate
   */
  batch_generate_assets = (
    { competitionId, ...query }: BatchGenerateAssetsParams,
    data: BatchGenerateRequest,
    params: RequestParams = {},
  ) =>
    this.request<BatchGenerateAssetsData, BatchGenerateAssetsError>({
      path: `/routes/${competitionId}/teams/batch-generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all asset versions for a team
   *
   * @tags dbtn/module:team_assets, dbtn/hasAuth
   * @name get_team_assets
   * @summary Get Team Assets
   * @request GET:/routes/{competition_id}/teams/{team_name}/assets
   */
  get_team_assets = ({ competitionId, teamName, ...query }: GetTeamAssetsParams, params: RequestParams = {}) =>
    this.request<GetTeamAssetsData, GetTeamAssetsError>({
      path: `/routes/${competitionId}/teams/${teamName}/assets`,
      method: "GET",
      ...params,
    });

  /**
   * @description Manage team assets (lock, unlock, set_active)
   *
   * @tags dbtn/module:team_assets, dbtn/hasAuth
   * @name manage_assets
   * @summary Manage Assets
   * @request POST:/routes/{competition_id}/teams/{team_name}/assets/{action}
   */
  manage_assets = ({ competitionId, teamName, action, ...query }: ManageAssetsParams, params: RequestParams = {}) =>
    this.request<ManageAssetsData, ManageAssetsError>({
      path: `/routes/${competitionId}/teams/${teamName}/assets/${action}`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Log an activity event to a competition via MCP. Perfect for AI assistants to capture activities from voice commands, meeting transcripts, or automated workflow integrations.
   *
   * @tags dbtn/module:mcp
   * @name mcp_log_competition_event
   * @summary Mcp Log Competition Event
   * @request POST:/routes/mcp/tools/competitions/log-event
   */
  mcp_log_competition_event = (data: LogEventRequest, params: RequestParams = {}) =>
    this.request<McpLogCompetitionEventData, McpLogCompetitionEventError>({
      path: `/routes/mcp/tools/competitions/log-event`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get current leaderboard standings for a competition. Shows live rankings and scores. Perfect for AI assistants to provide real-time competition updates during meetings, Slack notifications, or dashboard displays.
   *
   * @tags dbtn/module:mcp
   * @name mcp_get_leaderboard
   * @summary Mcp Get Leaderboard
   * @request POST:/routes/mcp/tools/competitions/leaderboard
   */
  mcp_get_leaderboard = (data: LeaderboardRequest, params: RequestParams = {}) =>
    this.request<McpGetLeaderboardData, McpGetLeaderboardError>({
      path: `/routes/mcp/tools/competitions/leaderboard`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get detailed progress for a player including activities, streaks, and achievements. Ideal for AI assistants to provide personalized progress reports, streak celebrations, and goal tracking updates.
   *
   * @tags dbtn/module:mcp
   * @name mcp_get_player_progress
   * @summary Mcp Get Player Progress
   * @request POST:/routes/mcp/tools/player/progress
   */
  mcp_get_player_progress = (data: PlayerProgressRequest, params: RequestParams = {}) =>
    this.request<McpGetPlayerProgressData, McpGetPlayerProgressError>({
      path: `/routes/mcp/tools/player/progress`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Execute automated meeting workflows with export capabilities. Perfect for AI assistants to run Monday kickoffs, Friday wraps, or midweek checks. Generates insights, prepares data, and optionally exports for Slack/presentations.
   *
   * @tags dbtn/module:mcp
   * @name execute_meeting_workflow
   * @summary Execute Meeting Workflow
   * @request POST:/routes/mcp/meeting/workflow
   */
  execute_meeting_workflow = (data: MeetingWorkflowRequest, params: RequestParams = {}) =>
    this.request<ExecuteMeetingWorkflowData, ExecuteMeetingWorkflowError>({
      path: `/routes/mcp/meeting/workflow`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Export meeting workflow data for Slack/presentations. Returns formatted data that can be shared in meetings or posted to Slack.
   *
   * @tags dbtn/module:mcp
   * @name export_meeting_data
   * @summary Export Meeting Data
   * @request GET:/routes/mcp/export/{workflow_type}/{timestamp}
   */
  export_meeting_data = ({ workflowType, timestamp, ...query }: ExportMeetingDataParams, params: RequestParams = {}) =>
    this.request<ExportMeetingDataData, ExportMeetingDataError>({
      path: `/routes/mcp/export/${workflowType}/${timestamp}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get MCP server information and available tools
   *
   * @tags dbtn/module:mcp
   * @name get_mcp_server_info
   * @summary Get Mcp Server Info
   * @request GET:/routes/mcp/server-info
   */
  get_mcp_server_info = (params: RequestParams = {}) =>
    this.request<GetMcpServerInfoData, any>({
      path: `/routes/mcp/server-info`,
      method: "GET",
      ...params,
    });

  /**
   * @description Toggle MCP functionality on/off (admin only for now)
   *
   * @tags dbtn/module:mcp
   * @name toggle_mcp_feature
   * @summary Toggle Mcp Feature
   * @request POST:/routes/mcp/toggle
   */
  toggle_mcp_feature = (query: ToggleMcpFeatureParams, params: RequestParams = {}) =>
    this.request<ToggleMcpFeatureData, ToggleMcpFeatureError>({
      path: `/routes/mcp/toggle`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get current MCP server status
   *
   * @tags dbtn/module:mcp
   * @name mcp_status
   * @summary Mcp Status
   * @request GET:/routes/mcp/status
   */
  mcp_status = (params: RequestParams = {}) =>
    this.request<McpStatusData, any>({
      path: `/routes/mcp/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new competition with AI-driven configuration. Perfect for AI assistants to start competitions from meeting notes, schedule weekly challenges, or respond to voice commands like 'Start a 3-day booking challenge for Team Alpha'.
   *
   * @tags dbtn/module:mcp
   * @name mcp_create_competition
   * @summary Mcp Create Competition
   * @request POST:/routes/mcp/tools/competitions/create
   */
  mcp_create_competition = (data: CreateCompetitionRequest, params: RequestParams = {}) =>
    this.request<McpCreateCompetitionData, McpCreateCompetitionError>({
      path: `/routes/mcp/tools/competitions/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Finalize a competition and announce winners. Perfect for AI assistants to wrap up competitions during meetings, generate winner announcements, or automatically close expired competitions.
   *
   * @tags dbtn/module:mcp
   * @name mcp_finalize_competition
   * @summary Mcp Finalize Competition
   * @request POST:/routes/mcp/tools/competitions/finalize
   */
  mcp_finalize_competition = (data: AppApisMcpFinalizeCompetitionRequest, params: RequestParams = {}) =>
    this.request<McpFinalizeCompetitionData, McpFinalizeCompetitionError>({
      path: `/routes/mcp/tools/competitions/finalize`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Undo the last event or a specific event in a competition. Perfect for AI assistants to correct mistakes from voice commands, fix mislogged activities, or handle 'oops, that wasn't me' situations.
   *
   * @tags dbtn/module:mcp
   * @name mcp_undo_last_event
   * @summary Mcp Undo Last Event
   * @request POST:/routes/mcp/tools/competitions/undo-last
   */
  mcp_undo_last_event = (data: AppApisMcpUndoEventRequest, params: RequestParams = {}) =>
    this.request<McpUndoLastEventData, McpUndoLastEventError>({
      path: `/routes/mcp/tools/competitions/undo-last`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate team assets (emblems, banners, avatars) with AI. Perfect for AI assistants to create visual identity during competition setup, respond to requests like 'Create cosmic-themed assets for Team Alpha', or auto-generate visuals based on team names and themes.
   *
   * @tags dbtn/module:mcp
   * @name mcp_generate_visuals
   * @summary Mcp Generate Visuals
   * @request POST:/routes/mcp/tools/visuals/generate
   */
  mcp_generate_visuals = (data: GenerateVisualsRequest, params: RequestParams = {}) =>
    this.request<McpGenerateVisualsData, McpGenerateVisualsError>({
      path: `/routes/mcp/tools/visuals/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Manage team assets - lock, unlock, or set as active. Perfect for AI assistants to lock final versions, protect good designs, or activate specific asset versions for competitions.
   *
   * @tags dbtn/module:mcp
   * @name mcp_manage_visuals
   * @summary Mcp Manage Visuals
   * @request POST:/routes/mcp/tools/visuals/manage
   */
  mcp_manage_visuals = (data: ManageVisualsRequest, params: RequestParams = {}) =>
    this.request<McpManageVisualsData, McpManageVisualsError>({
      path: `/routes/mcp/tools/visuals/manage`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get version history for team assets. Perfect for AI assistants to review previous designs, track changes, or help users understand what versions are available for rollback.
   *
   * @tags dbtn/module:mcp
   * @name mcp_visuals_history
   * @summary Mcp Visuals History
   * @request POST:/routes/mcp/tools/visuals/history
   */
  mcp_visuals_history = (data: VisualsHistoryRequest, params: RequestParams = {}) =>
    this.request<McpVisualsHistoryData, McpVisualsHistoryError>({
      path: `/routes/mcp/tools/visuals/history`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all entries for a competition with activity type breakdown for admin
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name get_competition_entries
   * @summary Get Competition Entries
   * @request GET:/routes/booking-competition/entries/{competition_id}
   */
  get_competition_entries = ({ competitionId, ...query }: GetCompetitionEntriesParams, params: RequestParams = {}) =>
    this.request<GetCompetitionEntriesData, GetCompetitionEntriesError>({
      path: `/routes/booking-competition/entries/${competitionId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Quick log a single activity for a player in competition
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name quick_log_activity
   * @summary Quick Log Activity
   * @request POST:/routes/booking-competition/quick-log
   */
  quick_log_activity = (data: QuickLogRequest, params: RequestParams = {}) =>
    this.request<QuickLogActivityData, QuickLogActivityError>({
      path: `/routes/booking-competition/quick-log`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Bulk log multiple activities for a player (for offline catch-up)
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name bulk_log_activities
   * @summary Bulk Log Activities
   * @request POST:/routes/booking-competition/bulk-log
   */
  bulk_log_activities = (data: BulkEntryRequest, params: RequestParams = {}) =>
    this.request<BulkLogActivitiesData, BulkLogActivitiesError>({
      path: `/routes/booking-competition/bulk-log`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update an existing entry
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name update_entry
   * @summary Update Entry
   * @request PUT:/routes/booking-competition/update-entry
   */
  update_entry = (data: UpdateEntryRequest, params: RequestParams = {}) =>
    this.request<UpdateEntryData, UpdateEntryError>({
      path: `/routes/booking-competition/update-entry`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete an entry with audit trail
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name delete_entry
   * @summary Delete Entry
   * @request DELETE:/routes/booking-competition/delete-entry
   */
  delete_entry = (data: DeleteEntryRequest, params: RequestParams = {}) =>
    this.request<DeleteEntryData, DeleteEntryError>({
      path: `/routes/booking-competition/delete-entry`,
      method: "DELETE",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name create_competition
   * @summary Create Competition
   * @request POST:/routes/booking-competition/create
   */
  create_competition = (data: CompetitionCreate, params: RequestParams = {}) =>
    this.request<CreateCompetitionData, CreateCompetitionError>({
      path: `/routes/booking-competition/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name update_competition
   * @summary Update Competition
   * @request PUT:/routes/booking-competition/update
   */
  update_competition = (data: CompetitionUpdate, params: RequestParams = {}) =>
    this.request<UpdateCompetitionData, UpdateCompetitionError>({
      path: `/routes/booking-competition/update`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name enroll_participant
   * @summary Enroll Participant
   * @request POST:/routes/booking-competition/enroll
   */
  enroll_participant = (data: EnrollParticipantRequest, params: RequestParams = {}) =>
    this.request<EnrollParticipantData, EnrollParticipantError>({
      path: `/routes/booking-competition/enroll`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name submit_entry
   * @summary Submit Entry
   * @request POST:/routes/booking-competition/submit-entry
   */
  submit_entry = (data: SubmitEntryRequest, params: RequestParams = {}) =>
    this.request<SubmitEntryData, SubmitEntryError>({
      path: `/routes/booking-competition/submit-entry`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name leaderboard
   * @summary Leaderboard
   * @request GET:/routes/booking-competition/leaderboard/{competition_id}
   */
  leaderboard = ({ competitionId, ...query }: LeaderboardParams, params: RequestParams = {}) =>
    this.request<LeaderboardData, LeaderboardError>({
      path: `/routes/booking-competition/leaderboard/${competitionId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Enhanced leaderboard with activity type breakdown for admin
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name leaderboard_detailed
   * @summary Leaderboard Detailed
   * @request GET:/routes/booking-competition/leaderboard-detailed/{competition_id}
   */
  leaderboard_detailed = ({ competitionId, ...query }: LeaderboardDetailedParams, params: RequestParams = {}) =>
    this.request<LeaderboardDetailedData, LeaderboardDetailedError>({
      path: `/routes/booking-competition/leaderboard-detailed/${competitionId}`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name finalize_competition
   * @summary Finalize Competition
   * @request POST:/routes/booking-competition/finalize
   */
  finalize_competition = (data: AppLibsModelsCompetitionFinalizeCompetitionRequest, params: RequestParams = {}) =>
    this.request<FinalizeCompetitionData, FinalizeCompetitionError>({
      path: `/routes/booking-competition/finalize`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name toggle_visibility
   * @summary Toggle Visibility
   * @request POST:/routes/booking-competition/visibility
   */
  toggle_visibility = (data: ToggleVisibilityRequest, params: RequestParams = {}) =>
    this.request<ToggleVisibilityData, ToggleVisibilityError>({
      path: `/routes/booking-competition/visibility`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name get_competition
   * @summary Get Competition
   * @request GET:/routes/booking-competition/{competition_id}
   */
  get_competition = ({ competitionId, ...query }: GetCompetitionParams, params: RequestParams = {}) =>
    this.request<GetCompetitionData, GetCompetitionError>({
      path: `/routes/booking-competition/${competitionId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description List all competitions with safe response pattern
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name list_competitions
   * @summary List Competitions
   * @request GET:/routes/booking-competition
   */
  list_competitions = (params: RequestParams = {}) =>
    this.request<ListCompetitionsData, any>({
      path: `/routes/booking-competition`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get team assignments for a competition including your teammates and opponents
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name get_team_assignments
   * @summary Get Team Assignments
   * @request GET:/routes/booking-competition/team-assignments/{competition_id}
   */
  get_team_assignments = ({ competitionId, ...query }: GetTeamAssignmentsParams, params: RequestParams = {}) =>
    this.request<GetTeamAssignmentsData, GetTeamAssignmentsError>({
      path: `/routes/booking-competition/team-assignments/${competitionId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get team vs team leaderboard with individual breakdown
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name get_team_leaderboard
   * @summary Get Team Leaderboard
   * @request GET:/routes/booking-competition/team-leaderboard/{competition_id}
   */
  get_team_leaderboard = ({ competitionId, ...query }: GetTeamLeaderboardParams, params: RequestParams = {}) =>
    this.request<GetTeamLeaderboardData, GetTeamLeaderboardError>({
      path: `/routes/booking-competition/team-leaderboard/${competitionId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get recent team activity feed for live updates
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name get_team_activity_feed
   * @summary Get Team Activity Feed
   * @request GET:/routes/booking-competition/team-activity-feed/{competition_id}
   */
  get_team_activity_feed = ({ competitionId, ...query }: GetTeamActivityFeedParams, params: RequestParams = {}) =>
    this.request<GetTeamActivityFeedData, GetTeamActivityFeedError>({
      path: `/routes/booking-competition/team-activity-feed/${competitionId}`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get comprehensive competition statistics for enhanced display
   *
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name get_competition_stats
   * @summary Get Competition Stats
   * @request GET:/routes/booking-competition/competition-stats/{competition_id}
   */
  get_competition_stats = ({ competitionId, ...query }: GetCompetitionStatsParams, params: RequestParams = {}) =>
    this.request<GetCompetitionStatsData, GetCompetitionStatsError>({
      path: `/routes/booking-competition/competition-stats/${competitionId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Commander Veyra's AI-powered cosmic chat responses for QuestBoard sommerfest demo
   *
   * @tags dbtn/module:veyra_chat, dbtn/hasAuth
   * @name cosmic_chat
   * @summary Cosmic Chat
   * @request POST:/routes/veyra-chat/cosmic-chat
   */
  cosmic_chat = (data: VeyraChatRequest, params: RequestParams = {}) =>
    this.request<CosmicChatData, CosmicChatError>({
      path: `/routes/veyra-chat/cosmic-chat`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if current user has admin access
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name is_admin
   * @summary Is Admin
   * @request GET:/routes/admin/is-admin
   */
  is_admin = (params: RequestParams = {}) =>
    this.request<IsAdminData, any>({
      path: `/routes/admin/is-admin`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all quarters for admin management
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_quarters
   * @summary Get Quarters
   * @request GET:/routes/admin/quarters
   */
  get_quarters = (params: RequestParams = {}) =>
    this.request<GetQuartersData, any>({
      path: `/routes/admin/quarters`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new quarter
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name create_quarter
   * @summary Create Quarter
   * @request POST:/routes/admin/quarters
   */
  create_quarter = (data: CreateQuarterRequest, params: RequestParams = {}) =>
    this.request<CreateQuarterData, CreateQuarterError>({
      path: `/routes/admin/quarters`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a quarter and all associated data
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name delete_quarter
   * @summary Delete Quarter
   * @request DELETE:/routes/admin/quarters/{quarter_id}
   */
  delete_quarter = ({ quarterId, ...query }: DeleteQuarterParams, params: RequestParams = {}) =>
    this.request<DeleteQuarterData, DeleteQuarterError>({
      path: `/routes/admin/quarters/${quarterId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Get activity logs with filtering for admin - includes both regular activities and bonus challenge completions
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_activity_logs
   * @summary Get Activity Logs
   * @request GET:/routes/admin/activities
   */
  get_activity_logs = (query: GetActivityLogsParams, params: RequestParams = {}) =>
    this.request<GetActivityLogsData, GetActivityLogsError>({
      path: `/routes/admin/activities`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get all player goals for a specific quarter
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_player_goals
   * @summary Get Player Goals
   * @request GET:/routes/admin/players/{quarter_id}
   */
  get_player_goals = ({ quarterId, ...query }: GetPlayerGoalsParams, params: RequestParams = {}) =>
    this.request<GetPlayerGoalsData, GetPlayerGoalsError>({
      path: `/routes/admin/players/${quarterId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update goals for a specific player
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name update_player_goals
   * @summary Update Player Goals
   * @request PUT:/routes/admin/players/goals
   */
  update_player_goals = (data: UpdatePlayerGoalsRequest, params: RequestParams = {}) =>
    this.request<UpdatePlayerGoalsData, UpdatePlayerGoalsError>({
      path: `/routes/admin/players/goals`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get auto-calculated team goals for a quarter
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_team_goals
   * @summary Get Team Goals
   * @request GET:/routes/admin/team-goals/{quarter_id}
   */
  get_team_goals = ({ quarterId, ...query }: GetTeamGoalsParams, params: RequestParams = {}) =>
    this.request<GetTeamGoalsData, GetTeamGoalsError>({
      path: `/routes/admin/team-goals/${quarterId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Activate or deactivate a quarter (only one can be active at a time)
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name update_quarter_status
   * @summary Update Quarter Status
   * @request PUT:/routes/admin/quarters/status
   */
  update_quarter_status = (data: UpdateQuarterStatusRequest, params: RequestParams = {}) =>
    this.request<UpdateQuarterStatusData, UpdateQuarterStatusError>({
      path: `/routes/admin/quarters/status`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all challenge templates
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_challenge_templates
   * @summary Get Challenge Templates
   * @request GET:/routes/admin/challenge-templates
   */
  get_challenge_templates = (params: RequestParams = {}) =>
    this.request<GetChallengeTemplatesData, any>({
      path: `/routes/admin/challenge-templates`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new challenge template
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name create_challenge_template
   * @summary Create Challenge Template
   * @request POST:/routes/admin/challenge-templates
   */
  create_challenge_template = (data: ChallengeTemplateCreate, params: RequestParams = {}) =>
    this.request<CreateChallengeTemplateData, CreateChallengeTemplateError>({
      path: `/routes/admin/challenge-templates`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update a challenge template
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name update_challenge_template
   * @summary Update Challenge Template
   * @request PUT:/routes/admin/challenge-templates/{template_id}
   */
  update_challenge_template = (
    { templateId, ...query }: UpdateChallengeTemplateParams,
    data: ChallengeTemplateUpdate,
    params: RequestParams = {},
  ) =>
    this.request<UpdateChallengeTemplateData, UpdateChallengeTemplateError>({
      path: `/routes/admin/challenge-templates/${templateId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a challenge template
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name delete_challenge_template
   * @summary Delete Challenge Template
   * @request DELETE:/routes/admin/challenge-templates/{template_id}
   */
  delete_challenge_template = ({ templateId, ...query }: DeleteChallengeTemplateParams, params: RequestParams = {}) =>
    this.request<DeleteChallengeTemplateData, DeleteChallengeTemplateError>({
      path: `/routes/admin/challenge-templates/${templateId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Get all active challenges, optionally filtered by quarter
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_active_challenges
   * @summary Get Active Challenges
   * @request GET:/routes/admin/challenges/active
   */
  get_active_challenges = (query: GetActiveChallengesParams, params: RequestParams = {}) =>
    this.request<GetActiveChallengesData, GetActiveChallengesError>({
      path: `/routes/admin/challenges/active`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name create_challenge
   * @summary Create Challenge
   * @request POST:/routes/admin/challenges
   */
  create_challenge = (data: CreateChallengeRequest, params: RequestParams = {}) =>
    this.request<CreateChallengeData, CreateChallengeError>({
      path: `/routes/admin/challenges`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Admin tool: Recalculate a single challenge's progress and participants from activities
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name recalculate_challenge_progress
   * @summary Recalculate Challenge Progress
   * @request POST:/routes/admin/challenges/{challenge_id}/recalculate
   */
  recalculate_challenge_progress = (
    { challengeId, ...query }: RecalculateChallengeProgressParams,
    params: RequestParams = {},
  ) =>
    this.request<RecalculateChallengeProgressData, RecalculateChallengeProgressError>({
      path: `/routes/admin/challenges/${challengeId}/recalculate`,
      method: "POST",
      ...params,
    });

  /**
   * @description Generate challenges based on active templates and team performance
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name generate_challenges
   * @summary Generate Challenges
   * @request POST:/routes/admin/challenges/generate
   */
  generate_challenges = (params: RequestParams = {}) =>
    this.request<GenerateChallengesData, any>({
      path: `/routes/admin/challenges/generate`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get challenge generation rules
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_challenge_rules
   * @summary Get Challenge Rules
   * @request GET:/routes/admin/challenge-rules
   */
  get_challenge_rules = (params: RequestParams = {}) =>
    this.request<GetChallengeRulesData, any>({
      path: `/routes/admin/challenge-rules`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new challenge generation rule
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name create_challenge_rule
   * @summary Create Challenge Rule
   * @request POST:/routes/admin/challenge-rules
   */
  create_challenge_rule = (data: ChallengeRuleCreate, params: RequestParams = {}) =>
    this.request<CreateChallengeRuleData, CreateChallengeRuleError>({
      path: `/routes/admin/challenge-rules`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Admin endpoint to revoke a challenge completion and remove points
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name revoke_challenge_completion
   * @summary Revoke Challenge Completion
   * @request DELETE:/routes/admin/challenges/{challenge_id}/completion
   */
  revoke_challenge_completion = (
    { challengeId, ...query }: RevokeChallengeCompletionParams,
    params: RequestParams = {},
  ) =>
    this.request<RevokeChallengeCompletionData, RevokeChallengeCompletionError>({
      path: `/routes/admin/challenges/${challengeId}/completion`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Admin endpoint to toggle challenge visibility to users
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name toggle_challenge_visibility
   * @summary Toggle Challenge Visibility
   * @request PATCH:/routes/admin/challenges/{challenge_id}/visibility
   */
  toggle_challenge_visibility = (
    { challengeId, ...query }: ToggleChallengeVisibilityParams,
    data: ToggleChallengeVisibilityRequest,
    params: RequestParams = {},
  ) =>
    this.request<ToggleChallengeVisibilityData, ToggleChallengeVisibilityError>({
      path: `/routes/admin/challenges/${challengeId}/visibility`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Permanently delete a published challenge
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name delete_challenge
   * @summary Delete Challenge
   * @request DELETE:/routes/admin/challenges/{challenge_id}
   */
  delete_challenge = ({ challengeId, ...query }: DeleteChallengeParams, params: RequestParams = {}) =>
    this.request<DeleteChallengeData, DeleteChallengeError>({
      path: `/routes/admin/challenges/${challengeId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Update a published challenge
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name update_challenge
   * @summary Update Challenge
   * @request PUT:/routes/admin/challenges/{challenge_id}
   */
  update_challenge = (
    { challengeId, ...query }: UpdateChallengeParams,
    data: ChallengeUpdate,
    params: RequestParams = {},
  ) =>
    this.request<UpdateChallengeData, UpdateChallengeError>({
      path: `/routes/admin/challenges/${challengeId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete an activity (regular activity or bonus challenge completion) and adjust player points
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name delete_activity_admin
   * @summary Delete Activity Admin
   * @request DELETE:/routes/admin/activities/{activity_id}
   */
  delete_activity_admin = ({ activityId, ...query }: DeleteActivityAdminParams, params: RequestParams = {}) =>
    this.request<DeleteActivityAdminData, DeleteActivityAdminError>({
      path: `/routes/admin/activities/${activityId}`,
      method: "DELETE",
      query: query,
      ...params,
    });

  /**
   * @description Create a new challenge participant
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name create_challenge_participant
   * @summary Create Challenge Participant
   * @request POST:/routes/admin/challenges/{challenge_id}/participants
   */
  create_challenge_participant = (
    { challengeId, ...query }: CreateChallengeParticipantParams,
    data: ChallengeParticipantCreate,
    params: RequestParams = {},
  ) =>
    this.request<CreateChallengeParticipantData, CreateChallengeParticipantError>({
      path: `/routes/admin/challenges/${challengeId}/participants`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all challenge participants
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_challenge_participants
   * @summary Get Challenge Participants
   * @request GET:/routes/admin/challenges/{challenge_id}/participants
   */
  get_challenge_participants = (
    { challengeId, ...query }: GetChallengeParticipantsParams,
    params: RequestParams = {},
  ) =>
    this.request<GetChallengeParticipantsData, GetChallengeParticipantsError>({
      path: `/routes/admin/challenges/${challengeId}/participants`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update a challenge participant
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name update_challenge_participant
   * @summary Update Challenge Participant
   * @request PUT:/routes/admin/challenges/{challenge_id}/participants/{participant_id}
   */
  update_challenge_participant = (
    { challengeId, participantId, ...query }: UpdateChallengeParticipantParams,
    data: ChallengeParticipantCreate,
    params: RequestParams = {},
  ) =>
    this.request<UpdateChallengeParticipantData, UpdateChallengeParticipantError>({
      path: `/routes/admin/challenges/${challengeId}/participants/${participantId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a challenge participant
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name delete_challenge_participant
   * @summary Delete Challenge Participant
   * @request DELETE:/routes/admin/challenges/{challenge_id}/participants/{participant_id}
   */
  delete_challenge_participant = (
    { challengeId, participantId, ...query }: DeleteChallengeParticipantParams,
    params: RequestParams = {},
  ) =>
    this.request<DeleteChallengeParticipantData, DeleteChallengeParticipantError>({
      path: `/routes/admin/challenges/${challengeId}/participants/${participantId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Admin: Preview active challenges that should have per-person participants and list missing players.
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name preview_backfill_per_person
   * @summary Preview Backfill Per Person
   * @request GET:/routes/admin/backfill/per-person/preview
   */
  preview_backfill_per_person = (query: PreviewBackfillPerPersonParams, params: RequestParams = {}) =>
    this.request<PreviewBackfillPerPersonData, PreviewBackfillPerPersonError>({
      path: `/routes/admin/backfill/per-person/preview`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Admin: Insert missing per-person participants for selected challenges and optionally recalc from activities.
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name apply_backfill_per_person
   * @summary Apply Backfill Per Person
   * @request POST:/routes/admin/backfill/per-person/apply
   */
  apply_backfill_per_person = (data: BackfillApplyRequest, params: RequestParams = {}) =>
    this.request<ApplyBackfillPerPersonData, ApplyBackfillPerPersonError>({
      path: `/routes/admin/backfill/per-person/apply`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Log a sales activity with dual tracking and enhanced feedback: - Individual: Add race points (1/2/5) to player - Team: Add +1 count to team totals (regardless of type) - Enhanced: Progress context, streak info, and thematic messaging
   *
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name log_activity
   * @summary Log Activity
   * @request POST:/routes/activities/log
   */
  log_activity = (data: LogActivityRequest, params: RequestParams = {}) =>
    this.request<LogActivityData, LogActivityError>({
      path: `/routes/activities/log`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get user's activity history for current quarter with safe response pattern
   *
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name get_activity_history
   * @summary Get Activity History
   * @request GET:/routes/activities/history
   */
  get_activity_history = (query: GetActivityHistoryParams, params: RequestParams = {}) =>
    this.request<GetActivityHistoryData, GetActivityHistoryError>({
      path: `/routes/activities/history`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get current user's activity statistics and goals for dashboard
   *
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name get_activity_stats
   * @summary Get Activity Stats
   * @request GET:/routes/activities/stats
   */
  get_activity_stats = (params: RequestParams = {}) =>
    this.request<GetActivityStatsData, any>({
      path: `/routes/activities/stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get team-level progress stats for the race visualization. Uses COUNT-based logic (not points) for team progress.
   *
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name get_team_stats
   * @summary Get Team Stats
   * @request GET:/routes/activities/team-stats
   */
  get_team_stats = (params: RequestParams = {}) =>
    this.request<GetTeamStatsData, any>({
      path: `/routes/activities/team-stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete an activity and recalculate points. Only the activity owner can delete it.
   *
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name delete_activity
   * @summary Delete Activity
   * @request DELETE:/routes/activities/activities/{activity_id}
   */
  delete_activity = ({ activityId, ...query }: DeleteActivityParams, params: RequestParams = {}) =>
    this.request<DeleteActivityData, DeleteActivityError>({
      path: `/routes/activities/activities/${activityId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Update an activity type and recalculate points. Only the activity owner can update it.
   *
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name update_activity
   * @summary Update Activity
   * @request PUT:/routes/activities/activities/{activity_id}
   */
  update_activity = (
    { activityId, ...query }: UpdateActivityParams,
    data: UpdateActivityRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateActivityData, UpdateActivityError>({
      path: `/routes/activities/activities/${activityId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Lightweight challenges summary endpoint - fast response <200ms
   *
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name get_challenges_summary
   * @summary Get Challenges Summary
   * @request GET:/routes/activities/challenges-summary
   */
  get_challenges_summary = (params: RequestParams = {}) =>
    this.request<GetChallengesSummaryData, any>({
      path: `/routes/activities/challenges-summary`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get active challenges for the current player's quarter - cached version
   *
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name get_player_active_challenges
   * @summary Get Player Active Challenges
   * @request GET:/routes/activities/challenges
   */
  get_player_active_challenges = (params: RequestParams = {}) =>
    this.request<GetPlayerActiveChallengesData, any>({
      path: `/routes/activities/challenges`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate AI-powered team insights using OpenAI GPT-4o-mini.
   *
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name generate_ai_insights
   * @summary Generate Ai Insights
   * @request GET:/routes/generate-ai-insights
   */
  generate_ai_insights = (query: GenerateAiInsightsParams, params: RequestParams = {}) =>
    this.request<GenerateAiInsightsData, GenerateAiInsightsError>({
      path: `/routes/generate-ai-insights`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get team KPI summary with optional comparison to previous period.
   *
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_team_insights_summary
   * @summary Get Team Insights Summary
   * @request GET:/routes/summary
   */
  get_team_insights_summary = (query: GetTeamInsightsSummaryParams, params: RequestParams = {}) =>
    this.request<GetTeamInsightsSummaryData, GetTeamInsightsSummaryError>({
      path: `/routes/summary`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get timeseries data for a specific metric.
   *
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_team_insights_timeseries
   * @summary Get Team Insights Timeseries
   * @request GET:/routes/timeseries
   */
  get_team_insights_timeseries = (query: GetTeamInsightsTimeseriesParams, params: RequestParams = {}) =>
    this.request<GetTeamInsightsTimeseriesData, GetTeamInsightsTimeseriesError>({
      path: `/routes/timeseries`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get milestone progress with what-it-takes calculations.
   *
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_team_insights_milestones
   * @summary Get Team Insights Milestones
   * @request GET:/routes/milestones
   */
  get_team_insights_milestones = (query: GetTeamInsightsMilestonesParams, params: RequestParams = {}) =>
    this.request<GetTeamInsightsMilestonesData, GetTeamInsightsMilestonesError>({
      path: `/routes/milestones`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get activity heatmap by day of week and hour.
   *
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_team_insights_heatmap
   * @summary Get Team Insights Heatmap
   * @request GET:/routes/heatmap
   */
  get_team_insights_heatmap = (query: GetTeamInsightsHeatmapParams, params: RequestParams = {}) =>
    this.request<GetTeamInsightsHeatmapData, GetTeamInsightsHeatmapError>({
      path: `/routes/heatmap`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get player streak data.
   *
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_team_insights_streaks
   * @summary Get Team Insights Streaks
   * @request GET:/routes/streaks
   */
  get_team_insights_streaks = (query: GetTeamInsightsStreaksParams, params: RequestParams = {}) =>
    this.request<GetTeamInsightsStreaksData, GetTeamInsightsStreaksError>({
      path: `/routes/streaks`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get recent highlights and achievements.
   *
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_team_insights_highlights
   * @summary Get Team Insights Highlights
   * @request GET:/routes/highlights
   */
  get_team_insights_highlights = (query: GetTeamInsightsHighlightsParams, params: RequestParams = {}) =>
    this.request<GetTeamInsightsHighlightsData, GetTeamInsightsHighlightsError>({
      path: `/routes/highlights`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get detailed forecast breakdown showing calculations for each activity type. Used for the forecast popup modal.
   *
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_forecast_breakdown
   * @summary Get Forecast Breakdown
   * @request GET:/routes/forecast-breakdown
   */
  get_forecast_breakdown = (query: GetForecastBreakdownParams, params: RequestParams = {}) =>
    this.request<GetForecastBreakdownData, GetForecastBreakdownError>({
      path: `/routes/forecast-breakdown`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create a new competition with advanced Competitions 2.0 features.
   *
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name create_competition_v2
   * @summary Create Competition V2
   * @request POST:/routes/competitions-v2/create
   */
  create_competition_v2 = (data: CompetitionCreateV2, params: RequestParams = {}) =>
    this.request<CreateCompetitionV2Data, CreateCompetitionV2Error>({
      path: `/routes/competitions-v2/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Validate competition rules, theme, and prizes configuration.
   *
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name validate_competition_config
   * @summary Validate Competition Config
   * @request POST:/routes/competitions-v2/validate
   */
  validate_competition_config = (data: ValidationRequest, params: RequestParams = {}) =>
    this.request<ValidateCompetitionConfigData, ValidateCompetitionConfigError>({
      path: `/routes/competitions-v2/validate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Preview how scoring rules would work with sample events.
   *
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name preview_scoring
   * @summary Preview Scoring
   * @request POST:/routes/competitions-v2/preview
   */
  preview_scoring = (data: ScoringPreviewRequest, params: RequestParams = {}) =>
    this.request<PreviewScoringData, PreviewScoringError>({
      path: `/routes/competitions-v2/preview`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Log an event using the advanced scoring engine (idempotent + enrollment checks).
   *
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name log_competition_event
   * @summary Log Competition Event
   * @request POST:/routes/competitions-v2/event
   */
  log_competition_event = (data: CompetitionEventCreate, params: RequestParams = {}) =>
    this.request<LogCompetitionEventData, LogCompetitionEventError>({
      path: `/routes/competitions-v2/event`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get advanced scoreboard with full scoring breakdown.
   *
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name get_competition_scoreboard_v2
   * @summary Get Competition Scoreboard V2
   * @request GET:/routes/competitions-v2/{competition_id}/scoreboard
   */
  get_competition_scoreboard_v2 = (
    { competitionId, ...query }: GetCompetitionScoreboardV2Params,
    params: RequestParams = {},
  ) =>
    this.request<GetCompetitionScoreboardV2Data, GetCompetitionScoreboardV2Error>({
      path: `/routes/competitions-v2/${competitionId}/scoreboard`,
      method: "GET",
      ...params,
    });

  /**
   * @description List all Competitions 2.0 with advanced features.
   *
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name list_competitions_v2
   * @summary List Competitions V2
   * @request GET:/routes/competitions-v2/list
   */
  list_competitions_v2 = (params: RequestParams = {}) =>
    this.request<ListCompetitionsV2Data, any>({
      path: `/routes/competitions-v2/list`,
      method: "GET",
      ...params,
    });

  /**
   * @description Simple health check for Competitions 2.0 API.
   *
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name health_check
   * @summary Health Check
   * @request GET:/routes/competitions-v2/health
   */
  health_check = (params: RequestParams = {}) =>
    this.request<HealthCheckData, any>({
      path: `/routes/competitions-v2/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a sample competition configuration for testing.
   *
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name get_sample_config
   * @summary Get Sample Config
   * @request GET:/routes/competitions-v2/sample-config
   */
  get_sample_config = (params: RequestParams = {}) =>
    this.request<GetSampleConfigData, any>({
      path: `/routes/competitions-v2/sample-config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Undo a specific competition event with anti-cheat validation (within 30 minutes).
   *
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name undo_competition_event
   * @summary Undo Competition Event
   * @request POST:/routes/competitions-v2/undo-event
   */
  undo_competition_event = (data: AppLibsModelsCompetitionV2UndoEventRequest, params: RequestParams = {}) =>
    this.request<UndoCompetitionEventData, UndoCompetitionEventError>({
      path: `/routes/competitions-v2/undo-event`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate anti-cheat report for competition.
   *
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name get_anti_cheat_report
   * @summary Get Anti Cheat Report
   * @request GET:/routes/competitions-v2/anti-cheat-report/{competition_id}
   */
  get_anti_cheat_report = ({ competitionId, ...query }: GetAntiCheatReportParams, params: RequestParams = {}) =>
    this.request<GetAntiCheatReportData, GetAntiCheatReportError>({
      path: `/routes/competitions-v2/anti-cheat-report/${competitionId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Simplified undo (testing): deletes an event by id.
   *
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name simple_undo_event
   * @summary Simple Undo Event
   * @request POST:/routes/competitions-v2/simple-undo/{event_id}
   */
  simple_undo_event = ({ eventId, ...query }: SimpleUndoEventParams, params: RequestParams = {}) =>
    this.request<SimpleUndoEventData, SimpleUndoEventError>({
      path: `/routes/competitions-v2/simple-undo/${eventId}`,
      method: "POST",
      ...params,
    });

  /**
   * @description Finalize competition and award bonuses (one-time, outside normal scoring).
   *
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name finalize_competition_v2
   * @summary Finalize Competition V2
   * @request POST:/routes/competitions-v2/finalize
   */
  finalize_competition_v2 = (data: FinalizeCompetitionRequestV2, params: RequestParams = {}) =>
    this.request<FinalizeCompetitionV2Data, FinalizeCompetitionV2Error>({
      path: `/routes/competitions-v2/finalize`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
