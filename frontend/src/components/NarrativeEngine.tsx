// Event listener system for activity logging to trigger narrative responses

interface ActivityEvent {
  type: 'book' | 'call' | 'lift' | 'opportunity' | 'deal';
  player: string;
  points: number;
  timestamp: Date;
}

interface NarrativeEngine {
  onActivityLogged: (event: ActivityEvent) => string;
  onMilestoneReached: (player: string, milestone: string, percentage: number) => string;
  getMotivationalMessage: () => string;
  getZephyrResponse: (veyraMessage: string) => string;
}

class VeyraContextEngine implements NarrativeEngine {
  private lastActivityTime = 0;
  private recentActivities: ActivityEvent[] = [];
  private readonly ACTIVITY_WINDOW_MS = 60000; // 1 minute window for related activities

  onActivityLogged(event: ActivityEvent): string {
    this.recentActivities.push(event);
    
    // Clean old activities
    const now = Date.now();
    this.recentActivities = this.recentActivities.filter(
      activity => now - activity.timestamp.getTime() < this.ACTIVITY_WINDOW_MS
    );

    // Generate contextual message based on activity type and recent patterns
    switch (event.type) {
      case 'book':
        return this.generateBookMessage(event);
      case 'call':
        return this.generateCallMessage(event);
      case 'lift':
        return this.generateLiftMessage(event);
      case 'opportunity':
        return this.generateOpportunityMessage(event);
      case 'deal':
        return this.generateDealMessage(event);
      default:
        return 'Energy detected in the void. The cosmos acknowledges.';
    }
  }

  onMilestoneReached(player: string, milestone: string, percentage: number): string {
    if (percentage >= 90) {
      return `${player} approaches the cosmic threshold! ${milestone} nearly claimed. The stars align.`;
    } else if (percentage >= 75) {
      return `${player}'s power surges to ${percentage}% on ${milestone}. Victory draws near.`;
    } else if (percentage >= 50) {
      return `${player} commands the halfway point on ${milestone}. Momentum builds.`;
    } else {
      return `${player} begins the ascent toward ${milestone}. Every spark matters.`;
    }
  }

  getMotivationalMessage(): string {
    const messages = [
      'The void listens. Channel your cosmic energy, warriors.',
      'Stars align when focus sharpens. Push beyond the horizon.',
      'Each spark ignites another. The constellation grows.',
      'Battle rhythm detected. Maintain formation, advance together.',
      'Energy cascades through the network. Amplify the signal.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  getZephyrResponse(veyraMessage: string): string {
    if (veyraMessage.includes('victory') || veyraMessage.includes('triumph')) {
      return 'Your light flickers briefly. The storm watches, patient.';
    } else if (veyraMessage.includes('energy') || veyraMessage.includes('power')) {
      return 'Sparks in the darkness. Barely worth my notice.';
    } else if (veyraMessage.includes('star') || veyraMessage.includes('constellation')) {
      return 'Your patterns mean nothing. Chaos reigns eternal.';
    } else {
      return 'Empty words for empty victories. The void endures.';
    }
  }

  private generateBookMessage(event: ActivityEvent): string {
    const recentBooks = this.recentActivities.filter(a => a.type === 'book').length;
    
    if (recentBooks > 2) {
      return `${event.player} ignites a booking cascade! ${recentBooks} stars claimed. The nexus pulses with power.`;
    } else if (event.points >= 10) {
      return `${event.player} secures a stellar meeting! +${event.points} cosmic points. The constellation expands.`;
    } else {
      return `${event.player} captures a star in the void. Meeting locked, energy flows.`;
    }
  }

  private generateCallMessage(event: ActivityEvent): string {
    const teamCalls = this.recentActivities.filter(a => a.type === 'call');
    
    if (teamCalls.length > 3) {
      return `Communication array active! ${teamCalls.length} echoes detected. The network strengthens.`;
    } else {
      return `${event.player} sends an echo through the void. +${event.points} resonance points.`;
    }
  }

  private generateLiftMessage(event: ActivityEvent): string {
    const teamLifts = this.recentActivities.filter(a => a.type === 'lift');
    
    if (teamLifts.length > 5) {
      return `Lift sequence accelerating! ${teamLifts.length} sparks detected. Momentum builds.`;
    } else {
      return `${event.player} channels a spark of energy. Small light, infinite potential.`;
    }
  }

  private generateOpportunityMessage(event: ActivityEvent): string {
    return `${event.player} discovers a gateway in the dimensional matrix. Pathway secured.`;
  }

  private generateDealMessage(event: ActivityEvent): string {
    return `${event.player} forges a new constellation! Deal sealed in cosmic fire. Victory echoes.`;
  }
}

export const narrativeEngine = new VeyraContextEngine();

// Activity event parser - converts API responses to events
export const parseActivityEvent = (activityType: string, playerName: string, points: number): ActivityEvent => {
  // Map API activity types to narrative types
  const typeMap: Record<string, ActivityEvent['type']> = {
    'BOOK': 'book',
    'book': 'book',
    'CALL': 'call', 
    'call': 'call',
    'LIFT': 'lift',
    'lift': 'lift',
    'opportunity': 'opportunity',
    'opp': 'opportunity',
    'deal': 'deal',
    'won': 'deal'
  };

  return {
    type: typeMap[activityType] || 'lift',
    player: playerName,
    points,
    timestamp: new Date()
  };
};

// Global event bus for activity monitoring
class ActivityEventBus {
  private listeners: Array<(event: ActivityEvent) => void> = [];
  
  subscribe(callback: (event: ActivityEvent) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  emit(event: ActivityEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in activity event listener:', error);
      }
    });
  }
}

export const activityEventBus = new ActivityEventBus();
