// Utility functions for Competitions 2.0
// Helper functions for competition management and data processing

import { CompetitionResponseV2, ScoreboardResponse, PlayerScore, Competition } from 'types';

export interface CompetitionMetrics {
  participation_rate: number;
  average_points_per_player: number;
  most_active_time: string;
  competition_momentum: 'rising' | 'stable' | 'declining';
  engagement_score: number;
}

export interface CompetitionInsights {
  top_performing_activities: Array<{ activity: string; frequency: number; avg_points: number }>;
  player_segments: {
    high_performers: string[];
    regular_players: string[];
    new_players: string[];
  };
  optimal_scheduling: {
    best_start_time: string;
    recommended_duration: number;
  };
}

// Competition type detection and conversion
export const isCompetitionV2 = (competition: any): competition is CompetitionResponseV2 => {
  return competition && (
    competition.state !== undefined ||
    competition.rules !== undefined ||
    competition.theme !== undefined ||
    competition.prizes !== undefined ||
    competition._isV2 === true
  );
};

export const convertV2ToV1 = (v2Competition: CompetitionResponseV2): Competition & { _isV2: boolean } => {
  return {
    id: v2Competition.id,
    name: v2Competition.name,
    description: v2Competition.description || '',
    start_time: v2Competition.start_time,
    end_time: v2Competition.end_time,
    is_active: v2Competition.state === 'ACTIVE',
    is_hidden: v2Competition.is_hidden,
    tiebreaker: 'highest_total', // Default for v2
    created_by: v2Competition.created_by,
    created_at: v2Competition.created_at,
    _isV2: true
  };
};

// Scoring and ranking utilities
export const calculatePlayerRank = (player: PlayerScore, scoreboard: ScoreboardResponse): number => {
  const sorted = [...scoreboard.individual_leaderboard].sort((a, b) => b.total_points - a.total_points);
  return sorted.findIndex(p => p.player_name === player.player_name) + 1;
};

export const getPlayerProgressPercent = (player: PlayerScore, maxPoints: number): number => {
  return Math.min((player.total_points / maxPoints) * 100, 100);
};

export const formatStreakText = (streak: number): string => {
  if (streak === 0) return 'No streak';
  if (streak === 1) return '1 day streak';
  if (streak < 7) return `${streak} day streak`;
  if (streak < 30) return `${streak} days - On fire! 🔥`;
  return `${streak} days - Legendary! 👑`;
};

// Competition timing utilities
export const getCompetitionTimeRemaining = (endTime: string): string => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return 'Competition Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
};

export const getCompetitionProgress = (startTime: string, endTime: string): number => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const now = Date.now();
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  return ((now - start) / (end - start)) * 100;
};

// Activity and scoring utilities
export const getActivityIcon = (activityType: string): string => {
  const icons: Record<string, string> = {
    lift: '🚀',
    call: '📡',
    book: '⭐'
  };
  return icons[activityType] || '📊';
};

export const getActivityColor = (activityType: string): string => {
  const colors: Record<string, string> = {
    lift: 'text-blue-400',
    call: 'text-green-400',
    book: 'text-purple-400'
  };
  return colors[activityType] || 'text-gray-400';
};

export const getActivityBgColor = (activityType: string): string => {
  const colors: Record<string, string> = {
    lift: 'bg-blue-500/10 border-blue-500/30',
    call: 'bg-green-500/10 border-green-500/30',
    book: 'bg-purple-500/10 border-purple-500/30'
  };
  return colors[activityType] || 'bg-gray-500/10 border-gray-500/30';
};

// Ranking and badge utilities
export const getRankBadge = (rank: number): { icon: string; color: string; text: string } => {
  if (rank === 1) return { icon: '👑', color: 'text-yellow-400', text: 'Champion' };
  if (rank === 2) return { icon: '🥈', color: 'text-gray-300', text: 'Runner-up' };
  if (rank === 3) return { icon: '🥉', color: 'text-amber-600', text: 'Third Place' };
  if (rank <= 10) return { icon: '⭐', color: 'text-purple-400', text: `Top ${rank}` };
  return { icon: '📊', color: 'text-gray-400', text: `Rank ${rank}` };
};

export const getPerformanceBadge = (points: number, totalPlayers: number): { text: string; color: string } => {
  const percentile = ((totalPlayers - (points / 10)) / totalPlayers) * 100; // Rough percentile
  
  if (percentile >= 90) return { text: 'Elite', color: 'text-yellow-400' };
  if (percentile >= 75) return { text: 'Excellent', color: 'text-purple-400' };
  if (percentile >= 50) return { text: 'Good', color: 'text-blue-400' };
  if (percentile >= 25) return { text: 'Decent', color: 'text-green-400' };
  return { text: 'Getting Started', color: 'text-gray-400' };
};

// Competition metrics calculation
export const calculateCompetitionMetrics = (scoreboard: ScoreboardResponse): CompetitionMetrics => {
  const players = scoreboard.individual_leaderboard;
  const totalPoints = players.reduce((sum, p) => sum + p.total_points, 0);
  const avgPoints = players.length > 0 ? totalPoints / players.length : 0;
  
  // Calculate participation rate (players with > 0 points / total players)
  const activePlayerCount = players.filter(p => p.total_points > 0).length;
  const participationRate = players.length > 0 ? (activePlayerCount / players.length) * 100 : 0;
  
  // Calculate engagement score based on activity spread
  const pointsVariance = calculateVariance(players.map(p => p.total_points));
  const engagementScore = Math.min(100, (avgPoints + (100 - pointsVariance)) / 2);
  
  return {
    participation_rate: participationRate,
    average_points_per_player: avgPoints,
    most_active_time: '10:00-12:00', // Mock data - would come from analytics
    competition_momentum: avgPoints > 50 ? 'rising' : avgPoints > 20 ? 'stable' : 'declining',
    engagement_score: engagementScore
  };
};

const calculateVariance = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
  return Math.sqrt(variance);
};

// Data formatting utilities
export const formatCompetitionDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatPointsDisplay = (points: number): string => {
  if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`;
  if (points >= 1000) return `${(points / 1000).toFixed(1)}K`;
  return points.toString();
};

export const formatActivityBreakdown = (breakdown: Record<string, number>): string => {
  const parts = [];
  if (breakdown.lift > 0) parts.push(`${breakdown.lift} lifts`);
  if (breakdown.call > 0) parts.push(`${breakdown.call} calls`);
  if (breakdown.book > 0) parts.push(`${breakdown.book} books`);
  return parts.join(', ') || 'No activity';
};

// Competition state utilities
export const getCompetitionStatusColor = (state: string): string => {
  const colors: Record<string, string> = {
    'DRAFT': 'text-gray-400',
    'ACTIVE': 'text-green-400',
    'PAUSED': 'text-yellow-400',
    'COMPLETED': 'text-blue-400',
    'CANCELLED': 'text-red-400'
  };
  return colors[state] || 'text-gray-400';
};

export const getCompetitionStatusIcon = (state: string): string => {
  const icons: Record<string, string> = {
    'DRAFT': '📝',
    'ACTIVE': '🚀',
    'PAUSED': '⏸️',
    'COMPLETED': '🏆',
    'CANCELLED': '❌'
  };
  return icons[state] || '📊';
};

// Export all utilities as default for easy importing
export default {
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
};
