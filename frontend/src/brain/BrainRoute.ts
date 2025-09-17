import {
  AppApisMcpFinalizeCompetitionRequest,
  AppApisMcpUndoEventRequest,
  AppLibsModelsCompetitionFinalizeCompetitionRequest,
  AppLibsModelsCompetitionV2UndoEventRequest,
  ApplyBackfillPerPersonData,
  BackfillApplyRequest,
  BatchGenerateAssetsData,
  BatchGenerateRequest,
  BulkEnrollPlayersData,
  BulkEnrollRequest,
  BulkEntryRequest,
  BulkLogActivitiesData,
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
  CreateChallengeData,
  CreateChallengeParticipantData,
  CreateChallengeRequest,
  CreateChallengeRuleData,
  CreateChallengeTemplateData,
  CreateCompetitionData,
  CreateCompetitionRequest,
  CreateCompetitionV2Data,
  CreateQuarterData,
  CreateQuarterRequest,
  DeleteActivityAdminData,
  DeleteActivityData,
  DeleteChallengeData,
  DeleteChallengeParticipantData,
  DeleteChallengeTemplateData,
  DeleteEntryData,
  DeleteEntryRequest,
  DeleteQuarterData,
  EnrollParticipantData,
  EnrollParticipantRequest,
  ExecuteMeetingWorkflowData,
  ExportMeetingDataData,
  FinalizeCompetitionData,
  FinalizeCompetitionRequestV2,
  FinalizeCompetitionV2Data,
  GenerateAiInsightsData,
  GenerateAssetsData,
  GenerateAssetsRequest,
  GenerateChallengesData,
  GenerateTeamNamesData,
  GenerateVisualsRequest,
  GetActiveChallengesData,
  GetActivityHistoryData,
  GetActivityLogsData,
  GetActivityStatsData,
  GetAntiCheatReportData,
  GetAvailablePlayersData,
  GetChallengeParticipantsData,
  GetChallengeRulesData,
  GetChallengeTemplatesData,
  GetChallengesSummaryData,
  GetCompetitionData,
  GetCompetitionEntriesData,
  GetCompetitionScoreboardV2Data,
  GetCompetitionStatsData,
  GetForecastBreakdownData,
  GetLeaderboardData,
  GetMcpServerInfoData,
  GetMyPlayerData,
  GetPlayerActiveChallengesData,
  GetPlayerDetailedStatsData,
  GetPlayerGoalsData,
  GetPlayerInsightsFunnelData,
  GetPlayerInsightsHeatmapData,
  GetPlayerInsightsStreaksData,
  GetPlayerInsightsSummaryData,
  GetPlayerInsightsTimeseriesData,
  GetPlayersDailyProgressData,
  GetPlayersProgressData,
  GetQuartersData,
  GetSampleConfigData,
  GetTeamActivityFeedData,
  GetTeamAssetsData,
  GetTeamAssignmentsData,
  GetTeamGoalsData,
  GetTeamInsightsHeatmapData,
  GetTeamInsightsHighlightsData,
  GetTeamInsightsMilestonesData,
  GetTeamInsightsStreaksData,
  GetTeamInsightsSummaryData,
  GetTeamInsightsTimeseriesData,
  GetTeamLeaderboardData,
  GetTeamStatsData,
  HealthCheckData,
  IsAdminData,
  LeaderboardData,
  LeaderboardDetailedData,
  LeaderboardRequest,
  ListCompetitionsData,
  ListCompetitionsV2Data,
  LogActivityData,
  LogActivityRequest,
  LogCompetitionEventData,
  LogEventRequest,
  ManageAssetsData,
  ManageVisualsRequest,
  McpCreateCompetitionData,
  McpFinalizeCompetitionData,
  McpGenerateVisualsData,
  McpGetLeaderboardData,
  McpGetPlayerProgressData,
  McpLogCompetitionEventData,
  McpManageVisualsData,
  McpStatusData,
  McpUndoLastEventData,
  McpVisualsHistoryData,
  MeetingWorkflowRequest,
  PlayerProgressRequest,
  PreviewBackfillPerPersonData,
  PreviewScoringData,
  QuickLogActivityData,
  QuickLogRequest,
  RecalculateChallengeProgressData,
  RevokeChallengeCompletionData,
  ScoringPreviewRequest,
  SelectPlayerData,
  SelectPlayerRequest,
  SimpleUndoEventData,
  SubmitEntryData,
  SubmitEntryRequest,
  TeamNamingRequest,
  ToggleChallengeVisibilityData,
  ToggleChallengeVisibilityRequest,
  ToggleMcpFeatureData,
  ToggleVisibilityData,
  ToggleVisibilityRequest,
  UndoCompetitionEventData,
  UpdateActivityData,
  UpdateActivityRequest,
  UpdateChallengeData,
  UpdateChallengeParticipantData,
  UpdateChallengeTemplateData,
  UpdateCompetitionData,
  UpdateEntryData,
  UpdateEntryRequest,
  UpdatePlayerGoalsData,
  UpdatePlayerGoalsRequest,
  UpdateQuarterStatusData,
  UpdateQuarterStatusRequest,
  ValidateCompetitionConfigData,
  ValidateTeamAssignmentsData,
  ValidateTeamAssignmentsPayload,
  ValidationRequest,
  VeyraChatRequest,
  VisualsHistoryRequest,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Get comprehensive player statistics for drawer UI Args: player_name: Name of the player to get stats for user: Authenticated user (for security) Returns: Detailed player statistics including goals, pace, activities, challenges, and predictions
   * @tags dbtn/module:player_stats, dbtn/hasAuth
   * @name get_player_detailed_stats
   * @summary Get Player Detailed Stats
   * @request GET:/routes/detailed-stats
   */
  export namespace get_player_detailed_stats {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Player Name */
      player_name: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPlayerDetailedStatsData;
  }

  /**
   * @description Get comprehensive summary for player insights dashboard Args: player_name: Name of the player range: Time range (Q=quarter, M=month) user: Authenticated user (for access control) Returns: Summary data with progress donuts, pace analysis, and milestones
   * @tags dbtn/module:player_insights, dbtn/hasAuth
   * @name get_player_insights_summary
   * @summary Get Player Insights Summary
   * @request GET:/routes/insights/summary
   */
  export namespace get_player_insights_summary {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Player Name */
      player_name: string;
      /**
       * Range
       * Time range: Q for quarter, M for month
       * @default "Q"
       */
      range?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPlayerInsightsSummaryData;
  }

  /**
   * @description Get timeseries data for player insights charts Args: player_name: Name of the player metric: Activity metric to track granularity: Time granularity start: Start date end: End date user: Authenticated user Returns: Timeseries data for charting
   * @tags dbtn/module:player_insights, dbtn/hasAuth
   * @name get_player_insights_timeseries
   * @summary Get Player Insights Timeseries
   * @request GET:/routes/insights/timeseries
   */
  export namespace get_player_insights_timeseries {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPlayerInsightsTimeseriesData;
  }

  /**
   * @description Get funnel conversion analysis for player Args: player_name: Name of the player start: Start date for analysis end: End date for analysis user: Authenticated user Returns: Funnel conversion data with rates and bottleneck analysis
   * @tags dbtn/module:player_insights, dbtn/hasAuth
   * @name get_player_insights_funnel
   * @summary Get Player Insights Funnel
   * @request GET:/routes/insights/funnel
   */
  export namespace get_player_insights_funnel {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPlayerInsightsFunnelData;
  }

  /**
   * @description Get activity heatmap data for time-of-day and day-of-week analysis Args: player_name: Name of the player start: Start date for analysis end: End date for analysis user: Authenticated user Returns: Heatmap data with coaching hints about best performance times
   * @tags dbtn/module:player_insights, dbtn/hasAuth
   * @name get_player_insights_heatmap
   * @summary Get Player Insights Heatmap
   * @request GET:/routes/insights/heatmap
   */
  export namespace get_player_insights_heatmap {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPlayerInsightsHeatmapData;
  }

  /**
   * @description Get player streaks and achievements data Args: player_name: Name of the player user: Authenticated user Returns: Streaks and achievements data
   * @tags dbtn/module:player_insights, dbtn/hasAuth
   * @name get_player_insights_streaks
   * @summary Get Player Insights Streaks
   * @request GET:/routes/insights/streaks
   */
  export namespace get_player_insights_streaks {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Player Name */
      player_name: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPlayerInsightsStreaksData;
  }

  /**
   * @description Generate AI-powered team names and balanced assignments
   * @tags dbtn/module:team_naming, dbtn/hasAuth
   * @name generate_team_names
   * @summary Generate Team Names
   * @request POST:/routes/team-naming/generate
   */
  export namespace generate_team_names {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TeamNamingRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateTeamNamesData;
  }

  /**
   * @description Validate team assignments for balance and completeness
   * @tags dbtn/module:team_naming, dbtn/hasAuth
   * @name validate_team_assignments
   * @summary Validate Team Assignments
   * @request POST:/routes/team-naming/validate
   */
  export namespace validate_team_assignments {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ValidateTeamAssignmentsPayload;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateTeamAssignmentsData;
  }

  /**
   * @description Get list of available and taken players
   * @tags dbtn/module:player_selection, dbtn/hasAuth
   * @name get_available_players
   * @summary Get Available Players
   * @request GET:/routes/available-players
   */
  export namespace get_available_players {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAvailablePlayersData;
  }

  /**
   * @description Get the player selected by the current user
   * @tags dbtn/module:player_selection, dbtn/hasAuth
   * @name get_my_player
   * @summary Get My Player
   * @request GET:/routes/my-player
   */
  export namespace get_my_player {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMyPlayerData;
  }

  /**
   * @description Select a player for the current user
   * @tags dbtn/module:player_selection, dbtn/hasAuth
   * @name select_player
   * @summary Select Player
   * @request POST:/routes/select-player
   */
  export namespace select_player {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SelectPlayerRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SelectPlayerData;
  }

  /**
   * @description Get daily progress for all 12 named players with workday-based daily goals
   * @tags dbtn/module:players
   * @name get_players_daily_progress
   * @summary Get Players Daily Progress
   * @request GET:/routes/players/daily-progress
   */
  export namespace get_players_daily_progress {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPlayersDailyProgressData;
  }

  /**
   * @description Get progress for all 12 named players with avatar states and rankings
   * @tags dbtn/module:players
   * @name get_players_progress
   * @summary Get Players Progress
   * @request GET:/routes/players/progress
   */
  export namespace get_players_progress {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPlayersProgressData;
  }

  /**
   * @description Get simplified leaderboard data for quick display Args: period: 'daily' for today's points, 'quarter' for total quarter points
   * @tags dbtn/module:players
   * @name get_leaderboard
   * @summary Get Leaderboard
   * @request GET:/routes/players/leaderboard
   */
  export namespace get_leaderboard {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Period
       * @default "daily"
       */
      period?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetLeaderboardData;
  }

  /**
   * @description Bulk enroll multiple players in a competition (admin only)
   * @tags dbtn/module:admin_bulk, dbtn/hasAuth
   * @name bulk_enroll_players
   * @summary Bulk Enroll Players
   * @request POST:/routes/bulk-enroll
   */
  export namespace bulk_enroll_players {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BulkEnrollRequest;
    export type RequestHeaders = {};
    export type ResponseBody = BulkEnrollPlayersData;
  }

  /**
   * @description Generate AI assets for a specific team
   * @tags dbtn/module:team_assets, dbtn/hasAuth
   * @name generate_assets
   * @summary Generate Assets
   * @request POST:/routes/{competition_id}/teams/{team_name}/assets/generate
   */
  export namespace generate_assets {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
      /** Team Name */
      teamName: string;
    };
    export type RequestQuery = {};
    export type RequestBody = GenerateAssetsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateAssetsData;
  }

  /**
   * @description Generate assets for both teams simultaneously
   * @tags dbtn/module:team_assets, dbtn/hasAuth
   * @name batch_generate_assets
   * @summary Batch Generate Assets
   * @request POST:/routes/{competition_id}/teams/batch-generate
   */
  export namespace batch_generate_assets {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = BatchGenerateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = BatchGenerateAssetsData;
  }

  /**
   * @description Get all asset versions for a team
   * @tags dbtn/module:team_assets, dbtn/hasAuth
   * @name get_team_assets
   * @summary Get Team Assets
   * @request GET:/routes/{competition_id}/teams/{team_name}/assets
   */
  export namespace get_team_assets {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
      /** Team Name */
      teamName: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamAssetsData;
  }

  /**
   * @description Manage team assets (lock, unlock, set_active)
   * @tags dbtn/module:team_assets, dbtn/hasAuth
   * @name manage_assets
   * @summary Manage Assets
   * @request POST:/routes/{competition_id}/teams/{team_name}/assets/{action}
   */
  export namespace manage_assets {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
      /** Team Name */
      teamName: string;
      /** Action */
      action: string;
    };
    export type RequestQuery = {
      /** Version */
      version?: number | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ManageAssetsData;
  }

  /**
   * @description Log an activity event to a competition via MCP. Perfect for AI assistants to capture activities from voice commands, meeting transcripts, or automated workflow integrations.
   * @tags dbtn/module:mcp
   * @name mcp_log_competition_event
   * @summary Mcp Log Competition Event
   * @request POST:/routes/mcp/tools/competitions/log-event
   */
  export namespace mcp_log_competition_event {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = LogEventRequest;
    export type RequestHeaders = {};
    export type ResponseBody = McpLogCompetitionEventData;
  }

  /**
   * @description Get current leaderboard standings for a competition. Shows live rankings and scores. Perfect for AI assistants to provide real-time competition updates during meetings, Slack notifications, or dashboard displays.
   * @tags dbtn/module:mcp
   * @name mcp_get_leaderboard
   * @summary Mcp Get Leaderboard
   * @request POST:/routes/mcp/tools/competitions/leaderboard
   */
  export namespace mcp_get_leaderboard {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = LeaderboardRequest;
    export type RequestHeaders = {};
    export type ResponseBody = McpGetLeaderboardData;
  }

  /**
   * @description Get detailed progress for a player including activities, streaks, and achievements. Ideal for AI assistants to provide personalized progress reports, streak celebrations, and goal tracking updates.
   * @tags dbtn/module:mcp
   * @name mcp_get_player_progress
   * @summary Mcp Get Player Progress
   * @request POST:/routes/mcp/tools/player/progress
   */
  export namespace mcp_get_player_progress {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PlayerProgressRequest;
    export type RequestHeaders = {};
    export type ResponseBody = McpGetPlayerProgressData;
  }

  /**
   * @description Execute automated meeting workflows with export capabilities. Perfect for AI assistants to run Monday kickoffs, Friday wraps, or midweek checks. Generates insights, prepares data, and optionally exports for Slack/presentations.
   * @tags dbtn/module:mcp
   * @name execute_meeting_workflow
   * @summary Execute Meeting Workflow
   * @request POST:/routes/mcp/meeting/workflow
   */
  export namespace execute_meeting_workflow {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MeetingWorkflowRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ExecuteMeetingWorkflowData;
  }

  /**
   * @description Export meeting workflow data for Slack/presentations. Returns formatted data that can be shared in meetings or posted to Slack.
   * @tags dbtn/module:mcp
   * @name export_meeting_data
   * @summary Export Meeting Data
   * @request GET:/routes/mcp/export/{workflow_type}/{timestamp}
   */
  export namespace export_meeting_data {
    export type RequestParams = {
      /** Workflow Type */
      workflowType: string;
      /** Timestamp */
      timestamp: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ExportMeetingDataData;
  }

  /**
   * @description Get MCP server information and available tools
   * @tags dbtn/module:mcp
   * @name get_mcp_server_info
   * @summary Get Mcp Server Info
   * @request GET:/routes/mcp/server-info
   */
  export namespace get_mcp_server_info {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMcpServerInfoData;
  }

  /**
   * @description Toggle MCP functionality on/off (admin only for now)
   * @tags dbtn/module:mcp
   * @name toggle_mcp_feature
   * @summary Toggle Mcp Feature
   * @request POST:/routes/mcp/toggle
   */
  export namespace toggle_mcp_feature {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Enabled */
      enabled: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ToggleMcpFeatureData;
  }

  /**
   * @description Get current MCP server status
   * @tags dbtn/module:mcp
   * @name mcp_status
   * @summary Mcp Status
   * @request GET:/routes/mcp/status
   */
  export namespace mcp_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = McpStatusData;
  }

  /**
   * @description Create a new competition with AI-driven configuration. Perfect for AI assistants to start competitions from meeting notes, schedule weekly challenges, or respond to voice commands like 'Start a 3-day booking challenge for Team Alpha'.
   * @tags dbtn/module:mcp
   * @name mcp_create_competition
   * @summary Mcp Create Competition
   * @request POST:/routes/mcp/tools/competitions/create
   */
  export namespace mcp_create_competition {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateCompetitionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = McpCreateCompetitionData;
  }

  /**
   * @description Finalize a competition and announce winners. Perfect for AI assistants to wrap up competitions during meetings, generate winner announcements, or automatically close expired competitions.
   * @tags dbtn/module:mcp
   * @name mcp_finalize_competition
   * @summary Mcp Finalize Competition
   * @request POST:/routes/mcp/tools/competitions/finalize
   */
  export namespace mcp_finalize_competition {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisMcpFinalizeCompetitionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = McpFinalizeCompetitionData;
  }

  /**
   * @description Undo the last event or a specific event in a competition. Perfect for AI assistants to correct mistakes from voice commands, fix mislogged activities, or handle 'oops, that wasn't me' situations.
   * @tags dbtn/module:mcp
   * @name mcp_undo_last_event
   * @summary Mcp Undo Last Event
   * @request POST:/routes/mcp/tools/competitions/undo-last
   */
  export namespace mcp_undo_last_event {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisMcpUndoEventRequest;
    export type RequestHeaders = {};
    export type ResponseBody = McpUndoLastEventData;
  }

  /**
   * @description Generate team assets (emblems, banners, avatars) with AI. Perfect for AI assistants to create visual identity during competition setup, respond to requests like 'Create cosmic-themed assets for Team Alpha', or auto-generate visuals based on team names and themes.
   * @tags dbtn/module:mcp
   * @name mcp_generate_visuals
   * @summary Mcp Generate Visuals
   * @request POST:/routes/mcp/tools/visuals/generate
   */
  export namespace mcp_generate_visuals {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = GenerateVisualsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = McpGenerateVisualsData;
  }

  /**
   * @description Manage team assets - lock, unlock, or set as active. Perfect for AI assistants to lock final versions, protect good designs, or activate specific asset versions for competitions.
   * @tags dbtn/module:mcp
   * @name mcp_manage_visuals
   * @summary Mcp Manage Visuals
   * @request POST:/routes/mcp/tools/visuals/manage
   */
  export namespace mcp_manage_visuals {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ManageVisualsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = McpManageVisualsData;
  }

  /**
   * @description Get version history for team assets. Perfect for AI assistants to review previous designs, track changes, or help users understand what versions are available for rollback.
   * @tags dbtn/module:mcp
   * @name mcp_visuals_history
   * @summary Mcp Visuals History
   * @request POST:/routes/mcp/tools/visuals/history
   */
  export namespace mcp_visuals_history {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = VisualsHistoryRequest;
    export type RequestHeaders = {};
    export type ResponseBody = McpVisualsHistoryData;
  }

  /**
   * @description Get all entries for a competition with activity type breakdown for admin
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name get_competition_entries
   * @summary Get Competition Entries
   * @request GET:/routes/booking-competition/entries/{competition_id}
   */
  export namespace get_competition_entries {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCompetitionEntriesData;
  }

  /**
   * @description Quick log a single activity for a player in competition
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name quick_log_activity
   * @summary Quick Log Activity
   * @request POST:/routes/booking-competition/quick-log
   */
  export namespace quick_log_activity {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = QuickLogRequest;
    export type RequestHeaders = {};
    export type ResponseBody = QuickLogActivityData;
  }

  /**
   * @description Bulk log multiple activities for a player (for offline catch-up)
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name bulk_log_activities
   * @summary Bulk Log Activities
   * @request POST:/routes/booking-competition/bulk-log
   */
  export namespace bulk_log_activities {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BulkEntryRequest;
    export type RequestHeaders = {};
    export type ResponseBody = BulkLogActivitiesData;
  }

  /**
   * @description Update an existing entry
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name update_entry
   * @summary Update Entry
   * @request PUT:/routes/booking-competition/update-entry
   */
  export namespace update_entry {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdateEntryRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateEntryData;
  }

  /**
   * @description Delete an entry with audit trail
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name delete_entry
   * @summary Delete Entry
   * @request DELETE:/routes/booking-competition/delete-entry
   */
  export namespace delete_entry {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DeleteEntryRequest;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteEntryData;
  }

  /**
   * No description
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name create_competition
   * @summary Create Competition
   * @request POST:/routes/booking-competition/create
   */
  export namespace create_competition {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CompetitionCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateCompetitionData;
  }

  /**
   * No description
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name update_competition
   * @summary Update Competition
   * @request PUT:/routes/booking-competition/update
   */
  export namespace update_competition {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CompetitionUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateCompetitionData;
  }

  /**
   * No description
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name enroll_participant
   * @summary Enroll Participant
   * @request POST:/routes/booking-competition/enroll
   */
  export namespace enroll_participant {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = EnrollParticipantRequest;
    export type RequestHeaders = {};
    export type ResponseBody = EnrollParticipantData;
  }

  /**
   * No description
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name submit_entry
   * @summary Submit Entry
   * @request POST:/routes/booking-competition/submit-entry
   */
  export namespace submit_entry {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SubmitEntryRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SubmitEntryData;
  }

  /**
   * No description
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name leaderboard
   * @summary Leaderboard
   * @request GET:/routes/booking-competition/leaderboard/{competition_id}
   */
  export namespace leaderboard {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = LeaderboardData;
  }

  /**
   * @description Enhanced leaderboard with activity type breakdown for admin
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name leaderboard_detailed
   * @summary Leaderboard Detailed
   * @request GET:/routes/booking-competition/leaderboard-detailed/{competition_id}
   */
  export namespace leaderboard_detailed {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = LeaderboardDetailedData;
  }

  /**
   * No description
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name finalize_competition
   * @summary Finalize Competition
   * @request POST:/routes/booking-competition/finalize
   */
  export namespace finalize_competition {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppLibsModelsCompetitionFinalizeCompetitionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = FinalizeCompetitionData;
  }

  /**
   * No description
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name toggle_visibility
   * @summary Toggle Visibility
   * @request POST:/routes/booking-competition/visibility
   */
  export namespace toggle_visibility {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ToggleVisibilityRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ToggleVisibilityData;
  }

  /**
   * No description
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name get_competition
   * @summary Get Competition
   * @request GET:/routes/booking-competition/{competition_id}
   */
  export namespace get_competition {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCompetitionData;
  }

  /**
   * @description List all competitions with safe response pattern
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name list_competitions
   * @summary List Competitions
   * @request GET:/routes/booking-competition
   */
  export namespace list_competitions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListCompetitionsData;
  }

  /**
   * @description Get team assignments for a competition including your teammates and opponents
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name get_team_assignments
   * @summary Get Team Assignments
   * @request GET:/routes/booking-competition/team-assignments/{competition_id}
   */
  export namespace get_team_assignments {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamAssignmentsData;
  }

  /**
   * @description Get team vs team leaderboard with individual breakdown
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name get_team_leaderboard
   * @summary Get Team Leaderboard
   * @request GET:/routes/booking-competition/team-leaderboard/{competition_id}
   */
  export namespace get_team_leaderboard {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamLeaderboardData;
  }

  /**
   * @description Get recent team activity feed for live updates
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name get_team_activity_feed
   * @summary Get Team Activity Feed
   * @request GET:/routes/booking-competition/team-activity-feed/{competition_id}
   */
  export namespace get_team_activity_feed {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
    };
    export type RequestQuery = {
      /**
       * Limit
       * @default 20
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamActivityFeedData;
  }

  /**
   * @description Get comprehensive competition statistics for enhanced display
   * @tags dbtn/module:booking_competition, dbtn/hasAuth
   * @name get_competition_stats
   * @summary Get Competition Stats
   * @request GET:/routes/booking-competition/competition-stats/{competition_id}
   */
  export namespace get_competition_stats {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCompetitionStatsData;
  }

  /**
   * @description Commander Veyra's AI-powered cosmic chat responses for QuestBoard sommerfest demo
   * @tags dbtn/module:veyra_chat, dbtn/hasAuth
   * @name cosmic_chat
   * @summary Cosmic Chat
   * @request POST:/routes/veyra-chat/cosmic-chat
   */
  export namespace cosmic_chat {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = VeyraChatRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CosmicChatData;
  }

  /**
   * @description Check if current user has admin access
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name is_admin
   * @summary Is Admin
   * @request GET:/routes/admin/is-admin
   */
  export namespace is_admin {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = IsAdminData;
  }

  /**
   * @description Get all quarters for admin management
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_quarters
   * @summary Get Quarters
   * @request GET:/routes/admin/quarters
   */
  export namespace get_quarters {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetQuartersData;
  }

  /**
   * @description Create a new quarter
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name create_quarter
   * @summary Create Quarter
   * @request POST:/routes/admin/quarters
   */
  export namespace create_quarter {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateQuarterRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateQuarterData;
  }

  /**
   * @description Delete a quarter and all associated data
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name delete_quarter
   * @summary Delete Quarter
   * @request DELETE:/routes/admin/quarters/{quarter_id}
   */
  export namespace delete_quarter {
    export type RequestParams = {
      /** Quarter Id */
      quarterId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteQuarterData;
  }

  /**
   * @description Get activity logs with filtering for admin - includes both regular activities and bonus challenge completions
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_activity_logs
   * @summary Get Activity Logs
   * @request GET:/routes/admin/activities
   */
  export namespace get_activity_logs {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetActivityLogsData;
  }

  /**
   * @description Get all player goals for a specific quarter
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_player_goals
   * @summary Get Player Goals
   * @request GET:/routes/admin/players/{quarter_id}
   */
  export namespace get_player_goals {
    export type RequestParams = {
      /** Quarter Id */
      quarterId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPlayerGoalsData;
  }

  /**
   * @description Update goals for a specific player
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name update_player_goals
   * @summary Update Player Goals
   * @request PUT:/routes/admin/players/goals
   */
  export namespace update_player_goals {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdatePlayerGoalsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdatePlayerGoalsData;
  }

  /**
   * @description Get auto-calculated team goals for a quarter
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_team_goals
   * @summary Get Team Goals
   * @request GET:/routes/admin/team-goals/{quarter_id}
   */
  export namespace get_team_goals {
    export type RequestParams = {
      /** Quarter Id */
      quarterId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamGoalsData;
  }

  /**
   * @description Activate or deactivate a quarter (only one can be active at a time)
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name update_quarter_status
   * @summary Update Quarter Status
   * @request PUT:/routes/admin/quarters/status
   */
  export namespace update_quarter_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdateQuarterStatusRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateQuarterStatusData;
  }

  /**
   * @description Get all challenge templates
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_challenge_templates
   * @summary Get Challenge Templates
   * @request GET:/routes/admin/challenge-templates
   */
  export namespace get_challenge_templates {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetChallengeTemplatesData;
  }

  /**
   * @description Create a new challenge template
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name create_challenge_template
   * @summary Create Challenge Template
   * @request POST:/routes/admin/challenge-templates
   */
  export namespace create_challenge_template {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChallengeTemplateCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateChallengeTemplateData;
  }

  /**
   * @description Update a challenge template
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name update_challenge_template
   * @summary Update Challenge Template
   * @request PUT:/routes/admin/challenge-templates/{template_id}
   */
  export namespace update_challenge_template {
    export type RequestParams = {
      /** Template Id */
      templateId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = ChallengeTemplateUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateChallengeTemplateData;
  }

  /**
   * @description Delete a challenge template
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name delete_challenge_template
   * @summary Delete Challenge Template
   * @request DELETE:/routes/admin/challenge-templates/{template_id}
   */
  export namespace delete_challenge_template {
    export type RequestParams = {
      /** Template Id */
      templateId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteChallengeTemplateData;
  }

  /**
   * @description Get all active challenges, optionally filtered by quarter
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_active_challenges
   * @summary Get Active Challenges
   * @request GET:/routes/admin/challenges/active
   */
  export namespace get_active_challenges {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Quarter Id */
      quarter_id?: number | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetActiveChallengesData;
  }

  /**
   * No description
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name create_challenge
   * @summary Create Challenge
   * @request POST:/routes/admin/challenges
   */
  export namespace create_challenge {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateChallengeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateChallengeData;
  }

  /**
   * @description Admin tool: Recalculate a single challenge's progress and participants from activities
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name recalculate_challenge_progress
   * @summary Recalculate Challenge Progress
   * @request POST:/routes/admin/challenges/{challenge_id}/recalculate
   */
  export namespace recalculate_challenge_progress {
    export type RequestParams = {
      /** Challenge Id */
      challengeId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RecalculateChallengeProgressData;
  }

  /**
   * @description Generate challenges based on active templates and team performance
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name generate_challenges
   * @summary Generate Challenges
   * @request POST:/routes/admin/challenges/generate
   */
  export namespace generate_challenges {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateChallengesData;
  }

  /**
   * @description Get challenge generation rules
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_challenge_rules
   * @summary Get Challenge Rules
   * @request GET:/routes/admin/challenge-rules
   */
  export namespace get_challenge_rules {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetChallengeRulesData;
  }

  /**
   * @description Create a new challenge generation rule
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name create_challenge_rule
   * @summary Create Challenge Rule
   * @request POST:/routes/admin/challenge-rules
   */
  export namespace create_challenge_rule {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChallengeRuleCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateChallengeRuleData;
  }

  /**
   * @description Admin endpoint to revoke a challenge completion and remove points
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name revoke_challenge_completion
   * @summary Revoke Challenge Completion
   * @request DELETE:/routes/admin/challenges/{challenge_id}/completion
   */
  export namespace revoke_challenge_completion {
    export type RequestParams = {
      /** Challenge Id */
      challengeId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RevokeChallengeCompletionData;
  }

  /**
   * @description Admin endpoint to toggle challenge visibility to users
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name toggle_challenge_visibility
   * @summary Toggle Challenge Visibility
   * @request PATCH:/routes/admin/challenges/{challenge_id}/visibility
   */
  export namespace toggle_challenge_visibility {
    export type RequestParams = {
      /** Challenge Id */
      challengeId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = ToggleChallengeVisibilityRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ToggleChallengeVisibilityData;
  }

  /**
   * @description Permanently delete a published challenge
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name delete_challenge
   * @summary Delete Challenge
   * @request DELETE:/routes/admin/challenges/{challenge_id}
   */
  export namespace delete_challenge {
    export type RequestParams = {
      /** Challenge Id */
      challengeId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteChallengeData;
  }

  /**
   * @description Update a published challenge
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name update_challenge
   * @summary Update Challenge
   * @request PUT:/routes/admin/challenges/{challenge_id}
   */
  export namespace update_challenge {
    export type RequestParams = {
      /** Challenge Id */
      challengeId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = ChallengeUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateChallengeData;
  }

  /**
   * @description Delete an activity (regular activity or bonus challenge completion) and adjust player points
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name delete_activity_admin
   * @summary Delete Activity Admin
   * @request DELETE:/routes/admin/activities/{activity_id}
   */
  export namespace delete_activity_admin {
    export type RequestParams = {
      /** Activity Id */
      activityId: number;
    };
    export type RequestQuery = {
      /** Activity Type */
      activity_type: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteActivityAdminData;
  }

  /**
   * @description Create a new challenge participant
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name create_challenge_participant
   * @summary Create Challenge Participant
   * @request POST:/routes/admin/challenges/{challenge_id}/participants
   */
  export namespace create_challenge_participant {
    export type RequestParams = {
      /** Challenge Id */
      challengeId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = ChallengeParticipantCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateChallengeParticipantData;
  }

  /**
   * @description Get all challenge participants
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_challenge_participants
   * @summary Get Challenge Participants
   * @request GET:/routes/admin/challenges/{challenge_id}/participants
   */
  export namespace get_challenge_participants {
    export type RequestParams = {
      /** Challenge Id */
      challengeId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetChallengeParticipantsData;
  }

  /**
   * @description Update a challenge participant
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name update_challenge_participant
   * @summary Update Challenge Participant
   * @request PUT:/routes/admin/challenges/{challenge_id}/participants/{participant_id}
   */
  export namespace update_challenge_participant {
    export type RequestParams = {
      /** Challenge Id */
      challengeId: number;
      /** Participant Id */
      participantId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = ChallengeParticipantCreate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateChallengeParticipantData;
  }

  /**
   * @description Delete a challenge participant
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name delete_challenge_participant
   * @summary Delete Challenge Participant
   * @request DELETE:/routes/admin/challenges/{challenge_id}/participants/{participant_id}
   */
  export namespace delete_challenge_participant {
    export type RequestParams = {
      /** Challenge Id */
      challengeId: number;
      /** Participant Id */
      participantId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteChallengeParticipantData;
  }

  /**
   * @description Admin: Preview active challenges that should have per-person participants and list missing players.
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name preview_backfill_per_person
   * @summary Preview Backfill Per Person
   * @request GET:/routes/admin/backfill/per-person/preview
   */
  export namespace preview_backfill_per_person {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Quarter Id */
      quarter_id?: number | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PreviewBackfillPerPersonData;
  }

  /**
   * @description Admin: Insert missing per-person participants for selected challenges and optionally recalc from activities.
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name apply_backfill_per_person
   * @summary Apply Backfill Per Person
   * @request POST:/routes/admin/backfill/per-person/apply
   */
  export namespace apply_backfill_per_person {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BackfillApplyRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ApplyBackfillPerPersonData;
  }

  /**
   * @description Log a sales activity with dual tracking and enhanced feedback: - Individual: Add race points (1/2/5) to player - Team: Add +1 count to team totals (regardless of type) - Enhanced: Progress context, streak info, and thematic messaging
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name log_activity
   * @summary Log Activity
   * @request POST:/routes/activities/log
   */
  export namespace log_activity {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = LogActivityRequest;
    export type RequestHeaders = {};
    export type ResponseBody = LogActivityData;
  }

  /**
   * @description Get user's activity history for current quarter with safe response pattern
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name get_activity_history
   * @summary Get Activity History
   * @request GET:/routes/activities/history
   */
  export namespace get_activity_history {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 50
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetActivityHistoryData;
  }

  /**
   * @description Get current user's activity statistics and goals for dashboard
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name get_activity_stats
   * @summary Get Activity Stats
   * @request GET:/routes/activities/stats
   */
  export namespace get_activity_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetActivityStatsData;
  }

  /**
   * @description Get team-level progress stats for the race visualization. Uses COUNT-based logic (not points) for team progress.
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name get_team_stats
   * @summary Get Team Stats
   * @request GET:/routes/activities/team-stats
   */
  export namespace get_team_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamStatsData;
  }

  /**
   * @description Delete an activity and recalculate points. Only the activity owner can delete it.
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name delete_activity
   * @summary Delete Activity
   * @request DELETE:/routes/activities/activities/{activity_id}
   */
  export namespace delete_activity {
    export type RequestParams = {
      /** Activity Id */
      activityId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteActivityData;
  }

  /**
   * @description Update an activity type and recalculate points. Only the activity owner can update it.
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name update_activity
   * @summary Update Activity
   * @request PUT:/routes/activities/activities/{activity_id}
   */
  export namespace update_activity {
    export type RequestParams = {
      /** Activity Id */
      activityId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateActivityRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateActivityData;
  }

  /**
   * @description Lightweight challenges summary endpoint - fast response <200ms
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name get_challenges_summary
   * @summary Get Challenges Summary
   * @request GET:/routes/activities/challenges-summary
   */
  export namespace get_challenges_summary {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetChallengesSummaryData;
  }

  /**
   * @description Get active challenges for the current player's quarter - cached version
   * @tags dbtn/module:activities, dbtn/hasAuth
   * @name get_player_active_challenges
   * @summary Get Player Active Challenges
   * @request GET:/routes/activities/challenges
   */
  export namespace get_player_active_challenges {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPlayerActiveChallengesData;
  }

  /**
   * @description Generate AI-powered team insights using OpenAI GPT-4o-mini.
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name generate_ai_insights
   * @summary Generate Ai Insights
   * @request GET:/routes/generate-ai-insights
   */
  export namespace generate_ai_insights {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateAiInsightsData;
  }

  /**
   * @description Get team KPI summary with optional comparison to previous period.
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_team_insights_summary
   * @summary Get Team Insights Summary
   * @request GET:/routes/summary
   */
  export namespace get_team_insights_summary {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamInsightsSummaryData;
  }

  /**
   * @description Get timeseries data for a specific metric.
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_team_insights_timeseries
   * @summary Get Team Insights Timeseries
   * @request GET:/routes/timeseries
   */
  export namespace get_team_insights_timeseries {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamInsightsTimeseriesData;
  }

  /**
   * @description Get milestone progress with what-it-takes calculations.
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_team_insights_milestones
   * @summary Get Team Insights Milestones
   * @request GET:/routes/milestones
   */
  export namespace get_team_insights_milestones {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamInsightsMilestonesData;
  }

  /**
   * @description Get activity heatmap by day of week and hour.
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_team_insights_heatmap
   * @summary Get Team Insights Heatmap
   * @request GET:/routes/heatmap
   */
  export namespace get_team_insights_heatmap {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamInsightsHeatmapData;
  }

  /**
   * @description Get player streak data.
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_team_insights_streaks
   * @summary Get Team Insights Streaks
   * @request GET:/routes/streaks
   */
  export namespace get_team_insights_streaks {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamInsightsStreaksData;
  }

  /**
   * @description Get recent highlights and achievements.
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_team_insights_highlights
   * @summary Get Team Insights Highlights
   * @request GET:/routes/highlights
   */
  export namespace get_team_insights_highlights {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamInsightsHighlightsData;
  }

  /**
   * @description Get detailed forecast breakdown showing calculations for each activity type. Used for the forecast popup modal.
   * @tags dbtn/module:team_insights, dbtn/hasAuth
   * @name get_forecast_breakdown
   * @summary Get Forecast Breakdown
   * @request GET:/routes/forecast-breakdown
   */
  export namespace get_forecast_breakdown {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetForecastBreakdownData;
  }

  /**
   * @description Create a new competition with advanced Competitions 2.0 features.
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name create_competition_v2
   * @summary Create Competition V2
   * @request POST:/routes/competitions-v2/create
   */
  export namespace create_competition_v2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CompetitionCreateV2;
    export type RequestHeaders = {
      /** X-Idempotency-Key */
      "X-Idempotency-Key"?: string | null;
    };
    export type ResponseBody = CreateCompetitionV2Data;
  }

  /**
   * @description Validate competition rules, theme, and prizes configuration.
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name validate_competition_config
   * @summary Validate Competition Config
   * @request POST:/routes/competitions-v2/validate
   */
  export namespace validate_competition_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ValidationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateCompetitionConfigData;
  }

  /**
   * @description Preview how scoring rules would work with sample events.
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name preview_scoring
   * @summary Preview Scoring
   * @request POST:/routes/competitions-v2/preview
   */
  export namespace preview_scoring {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ScoringPreviewRequest;
    export type RequestHeaders = {};
    export type ResponseBody = PreviewScoringData;
  }

  /**
   * @description Log an event using the advanced scoring engine (idempotent + enrollment checks).
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name log_competition_event
   * @summary Log Competition Event
   * @request POST:/routes/competitions-v2/event
   */
  export namespace log_competition_event {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CompetitionEventCreate;
    export type RequestHeaders = {
      /** X-Idempotency-Key */
      "X-Idempotency-Key"?: string | null;
    };
    export type ResponseBody = LogCompetitionEventData;
  }

  /**
   * @description Get advanced scoreboard with full scoring breakdown.
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name get_competition_scoreboard_v2
   * @summary Get Competition Scoreboard V2
   * @request GET:/routes/competitions-v2/{competition_id}/scoreboard
   */
  export namespace get_competition_scoreboard_v2 {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCompetitionScoreboardV2Data;
  }

  /**
   * @description List all Competitions 2.0 with advanced features.
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name list_competitions_v2
   * @summary List Competitions V2
   * @request GET:/routes/competitions-v2/list
   */
  export namespace list_competitions_v2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListCompetitionsV2Data;
  }

  /**
   * @description Simple health check for Competitions 2.0 API.
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name health_check
   * @summary Health Check
   * @request GET:/routes/competitions-v2/health
   */
  export namespace health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = HealthCheckData;
  }

  /**
   * @description Get a sample competition configuration for testing.
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name get_sample_config
   * @summary Get Sample Config
   * @request GET:/routes/competitions-v2/sample-config
   */
  export namespace get_sample_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSampleConfigData;
  }

  /**
   * @description Undo a specific competition event with anti-cheat validation (within 30 minutes).
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name undo_competition_event
   * @summary Undo Competition Event
   * @request POST:/routes/competitions-v2/undo-event
   */
  export namespace undo_competition_event {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppLibsModelsCompetitionV2UndoEventRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UndoCompetitionEventData;
  }

  /**
   * @description Generate anti-cheat report for competition.
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name get_anti_cheat_report
   * @summary Get Anti Cheat Report
   * @request GET:/routes/competitions-v2/anti-cheat-report/{competition_id}
   */
  export namespace get_anti_cheat_report {
    export type RequestParams = {
      /** Competition Id */
      competitionId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAntiCheatReportData;
  }

  /**
   * @description Simplified undo (testing): deletes an event by id.
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name simple_undo_event
   * @summary Simple Undo Event
   * @request POST:/routes/competitions-v2/simple-undo/{event_id}
   */
  export namespace simple_undo_event {
    export type RequestParams = {
      /** Event Id */
      eventId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SimpleUndoEventData;
  }

  /**
   * @description Finalize competition and award bonuses (one-time, outside normal scoring).
   * @tags dbtn/module:competitions_v2, dbtn/hasAuth
   * @name finalize_competition_v2
   * @summary Finalize Competition V2
   * @request POST:/routes/competitions-v2/finalize
   */
  export namespace finalize_competition_v2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = FinalizeCompetitionRequestV2;
    export type RequestHeaders = {};
    export type ResponseBody = FinalizeCompetitionV2Data;
  }
}
