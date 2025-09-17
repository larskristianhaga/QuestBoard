// Test utilities for Competitions 2.0
// Helper functions for testing the new competition system

import { CompetitionResponseV2, ScoreboardResponse, PlayerScore } from 'types';

// Mock data generators for testing
export const generateMockCompetitionV2 = (id: number = 1): CompetitionResponseV2 => ({
  id,
  name: `Cosmic Sales Quest ${id}`,
  description: 'Test competition with advanced scoring',
  start_time: new Date(Date.now() - 86400000).toISOString(), // Started yesterday
  end_time: new Date(Date.now() + 86400000 * 6).toISOString(), // Ends in 6 days
  state: 'ACTIVE',
  is_hidden: false,
  created_by: 'test-admin',
  created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  rules: {
    point_values: { lift: 1, call: 4, book: 10 },
    multipliers: [
      { name: 'Morning Boost', condition: 'time_range', config: { start: '08:00', end: '12:00' }, multiplier: 1.5 },
      { name: 'Streak Master', condition: 'streak', config: { min_streak: 5 }, multiplier: 2.0 }
    ],
    combos: [
      { name: 'Power Trio', activities: ['lift', 'call', 'book'], bonus_points: 5, time_window_minutes: 60 },
      { name: 'Call Storm', activities: ['call', 'call', 'call'], bonus_points: 8, time_window_minutes: 30 }
    ],
    caps: {
      daily_points: 100,
      activity_limits: { book: 10 }
    }
  },
  theme: {
    name: 'Cosmic Adventure',
    primary_color: '#8b5cf6',
    secondary_color: '#ec4899',
    background_style: 'starfield',
    activity_themes: {
      lift: { name: 'Cosmic Lift', icon: '🚀', description: 'Launch into the cosmos' },
      call: { name: 'Quantum Call', icon: '📡', description: 'Transmit across space' },
      book: { name: 'Stellar Booking', icon: '⭐', description: 'Secure a new star system' }
    }
  },
  prizes: {
    winner_prizes: [
      { rank: 1, type: 'bonus', amount: 5000, description: 'Cosmic Champion Bonus' },
      { rank: 2, type: 'bonus', amount: 3000, description: 'Stellar Runner-up' },
      { rank: 3, type: 'bonus', amount: 1000, description: 'Galactic Bronze' }
    ],
    milestone_prizes: [
      { threshold: 50, type: 'bonus', amount: 500, description: 'First Orbit Complete' },
      { threshold: 100, type: 'bonus', amount: 1000, description: 'Deep Space Explorer' }
    ]
  }
});

export const generateMockPlayerScore = (name: string, rank: number): PlayerScore => {
  const basePoints = Math.max(100 - rank * 10, 10);
  const breakdown = {
    lift: Math.floor(basePoints * 0.3),
    call: Math.floor(basePoints * 0.4),
    book: Math.floor(basePoints * 0.3)
  };
  
  return {
    player_name: name,
    total_points: basePoints + rank * 5,
    breakdown,
    current_streak: rank <= 3 ? 10 - rank : Math.floor(Math.random() * 5),
    multipliers_applied: rank <= 2 ? ['Morning Boost', 'Streak Master'] : rank <= 5 ? ['Morning Boost'] : [],
    combos_achieved: rank === 1 ? ['Power Trio', 'Call Storm'] : rank <= 3 ? ['Power Trio'] : [],
    last_activity: new Date(Date.now() - Math.random() * 3600000)
  };
};

export const generateMockScoreboard = (): ScoreboardResponse => {
  const players = [
    'Alex Rodriguez', 'Maria Santos', 'John Smith', 'Emma Wilson', 
    'David Chen', 'Sarah Johnson', 'Mike Brown', 'Lisa Wang'
  ].map(generateMockPlayerScore);
  
  return {
    competition_id: 1,
    individual_leaderboard: players.sort((a, b) => b.total_points - a.total_points),
    last_updated: new Date().toISOString()
  };
};

// Test scenarios
export const testScenarios = {
  newCompetition: 'Admin creates a new competition with custom rules',
  activeScoreboard: 'Players view live scoreboard with real-time updates',
  comboAchievement: 'Player achieves combo and sees VFX effects',
  multiplierBonus: 'Player gets multiplier bonus during special time',
  finalizeCompetition: 'Admin finalizes competition and awards bonuses'
};

// Validation helpers
export const validateCompetitionConfig = (config: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!config.name || config.name.length < 3) {
    errors.push('Competition name must be at least 3 characters');
  }
  
  if (!config.start_time || !config.end_time) {
    errors.push('Start and end times are required');
  }
  
  if (new Date(config.start_time) >= new Date(config.end_time)) {
    errors.push('End time must be after start time');
  }
  
  if (!config.rules?.point_values) {
    errors.push('Point values must be specified');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const mockCompetitionData = {
  v2Competition: generateMockCompetitionV2(),
  scoreboard: generateMockScoreboard(),
  scenarios: testScenarios
};
