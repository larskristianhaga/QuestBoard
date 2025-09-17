// Re-export all utility functions for easy importing
// Central hub for all Competition 2.0 utilities

// Core utilities
export * from './cosmicAnimations';
export * from './cosmicVFX';
export * from './competitionUtils';
export * from './competitionEventTracker';
export * from './competitionTestUtils';

// Store utilities (if any existing ones)
export * from './store';

// Competition 2.0 specific exports
export {
  // VFX Functions
  initializeCosmicVFX,
  cleanupCosmicVFX,
  triggerStreakVFX,
  triggerComboVFX,
  triggerMultiplierVFX,
  triggerAchievementVFX,
  triggerRankUpVFX,
  triggerCosmicEventVFX
} from './cosmicVFX';

export {
  // Event Tracking
  CompetitionEventTracker,
  trackActivityEvent,
  trackComboEvent,
  getCompetitionAnalytics,
  startEventTracking,
  stopEventTracking
} from './competitionEventTracker';

export {
  // Competition Utilities
  isCompetitionV2,
  convertV2ToV1,
  calculatePlayerRank,
  getPlayerProgressPercent,
  formatStreakText,
  getCompetitionTimeRemaining,
  getCompetitionProgress,
  getActivityIcon,
  getActivityColor,
  getActivityBgColor,
  getRankBadge,
  getPerformanceBadge,
  calculateCompetitionMetrics,
  formatCompetitionDate,
  formatPointsDisplay,
  formatActivityBreakdown,
  getCompetitionStatusColor,
  getCompetitionStatusIcon
} from './competitionUtils';

export {
  // Test Utilities
  generateMockCompetitionV2,
  generateMockPlayerScore,
  generateMockScoreboard,
  testScenarios,
  validateCompetitionConfig,
  mockCompetitionData
} from './competitionTestUtils';

// Types for external use
export type {
  CosmicEffect,
  CompetitionEvent,
  EventAnalytics,
  CompetitionMetrics,
  CompetitionInsights
} from './cosmicVFX';

export type {
  CompetitionEvent as EventTrackerEvent,
  EventAnalytics as TrackerAnalytics
} from './competitionEventTracker';

export type {
  CompetitionMetrics as UtilMetrics,
  CompetitionInsights as UtilInsights
} from './competitionUtils';
