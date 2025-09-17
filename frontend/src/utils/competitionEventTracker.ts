// Event tracking for Competitions 2.0
// Handles real-time event tracking and analytics

export interface CompetitionEvent {
  id: string;
  competition_id: number;
  player_name: string;
  event_type: 'activity_logged' | 'combo_achieved' | 'multiplier_applied' | 'streak_updated' | 'rank_changed';
  event_data: any;
  points_awarded: number;
  timestamp: Date;
}

export interface EventAnalytics {
  total_events: number;
  events_by_type: Record<string, number>;
  top_players: Array<{ player_name: string; event_count: number }>;
  recent_trends: Array<{ time_period: string; activity_level: number }>;
}

export class CompetitionEventTracker {
  private static instance: CompetitionEventTracker;
  private events: CompetitionEvent[] = [];
  private listeners: Map<string, (event: CompetitionEvent) => void> = new Map();
  private isTracking = false;

  static getInstance(): CompetitionEventTracker {
    if (!CompetitionEventTracker.instance) {
      CompetitionEventTracker.instance = new CompetitionEventTracker();
    }
    return CompetitionEventTracker.instance;
  }

  startTracking(competitionId: number) {
    this.isTracking = true;
    console.log(`Started event tracking for competition ${competitionId}`);
  }

  stopTracking() {
    this.isTracking = false;
    this.events = [];
    console.log('Stopped event tracking');
  }

  trackEvent(event: Omit<CompetitionEvent, 'id' | 'timestamp'>) {
    if (!this.isTracking) return;

    const fullEvent: CompetitionEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.events.push(fullEvent);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(fullEvent));
    
    // Keep only last 1000 events to prevent memory issues
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  addEventListener(id: string, callback: (event: CompetitionEvent) => void) {
    this.listeners.set(id, callback);
  }

  removeEventListener(id: string) {
    this.listeners.delete(id);
  }

  getEvents(competitionId?: number): CompetitionEvent[] {
    if (competitionId) {
      return this.events.filter(e => e.competition_id === competitionId);
    }
    return [...this.events];
  }

  getEventAnalytics(competitionId: number): EventAnalytics {
    const competitionEvents = this.getEvents(competitionId);
    
    const eventsByType = competitionEvents.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const playerEventCounts = competitionEvents.reduce((acc, event) => {
      acc[event.player_name] = (acc[event.player_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPlayers = Object.entries(playerEventCounts)
      .map(([player_name, event_count]) => ({ player_name, event_count }))
      .sort((a, b) => b.event_count - a.event_count)
      .slice(0, 5);

    // Calculate activity trends for last 24 hours
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentEvents = competitionEvents.filter(e => e.timestamp > last24Hours);
    
    const trends = [];
    for (let i = 0; i < 24; i++) {
      const hourStart = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000);
      const hourEnd = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEvents = recentEvents.filter(e => e.timestamp >= hourStart && e.timestamp < hourEnd);
      
      trends.unshift({
        time_period: `${hourStart.getHours()}:00`,
        activity_level: hourEvents.length
      });
    }

    return {
      total_events: competitionEvents.length,
      events_by_type: eventsByType,
      top_players: topPlayers,
      recent_trends: trends
    };
  }

  // Track specific competition events
  trackActivityLogged(competitionId: number, playerName: string, activityType: string, points: number) {
    this.trackEvent({
      competition_id: competitionId,
      player_name: playerName,
      event_type: 'activity_logged',
      event_data: { activity_type: activityType },
      points_awarded: points
    });
  }

  trackComboAchieved(competitionId: number, playerName: string, comboName: string, bonusPoints: number) {
    this.trackEvent({
      competition_id: competitionId,
      player_name: playerName,
      event_type: 'combo_achieved',
      event_data: { combo_name: comboName },
      points_awarded: bonusPoints
    });
  }

  trackMultiplierApplied(competitionId: number, playerName: string, multiplierName: string, multiplier: number) {
    this.trackEvent({
      competition_id: competitionId,
      player_name: playerName,
      event_type: 'multiplier_applied',
      event_data: { multiplier_name: multiplierName, multiplier },
      points_awarded: 0
    });
  }

  trackStreakUpdated(competitionId: number, playerName: string, newStreak: number) {
    this.trackEvent({
      competition_id: competitionId,
      player_name: playerName,
      event_type: 'streak_updated',
      event_data: { new_streak: newStreak },
      points_awarded: 0
    });
  }

  trackRankChanged(competitionId: number, playerName: string, oldRank: number, newRank: number) {
    this.trackEvent({
      competition_id: competitionId,
      player_name: playerName,
      event_type: 'rank_changed',
      event_data: { old_rank: oldRank, new_rank: newRank },
      points_awarded: 0
    });
  }
}

// Helper functions
export const trackActivityEvent = (competitionId: number, playerName: string, activityType: string, points: number) => {
  CompetitionEventTracker.getInstance().trackActivityLogged(competitionId, playerName, activityType, points);
};

export const trackComboEvent = (competitionId: number, playerName: string, comboName: string, bonusPoints: number) => {
  CompetitionEventTracker.getInstance().trackComboAchieved(competitionId, playerName, comboName, bonusPoints);
};

export const getCompetitionAnalytics = (competitionId: number): EventAnalytics => {
  return CompetitionEventTracker.getInstance().getEventAnalytics(competitionId);
};

export const startEventTracking = (competitionId: number) => {
  CompetitionEventTracker.getInstance().startTracking(competitionId);
};

export const stopEventTracking = () => {
  CompetitionEventTracker.getInstance().stopTracking();
};
