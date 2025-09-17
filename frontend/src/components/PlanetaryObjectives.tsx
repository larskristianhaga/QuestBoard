
import React, { useState, useEffect } from 'react';
import brain from 'brain';
import { Card } from '@/components/ui/card';
import { injectCosmicAnimations } from 'utils/cosmicAnimations';

interface PlanetData {
  current: number;
  goal: number;
  completed: boolean;
  progress_pct: number;
}

interface TeamStatsData {
  planet_status: {
    books: PlanetData;
    opps: PlanetData;
    deals: PlanetData;
  };
}

type PlanetState = 'dormant' | 'awakening' | 'active' | 'thriving' | 'mastered';

interface Planet {
  id: string;
  name: string;
  icon: string;
  color: string;
  data: PlanetData;
}

const PlanetaryObjectives: React.FC = () => {
  const [teamStats, setTeamStats] = useState<TeamStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Initialize cosmic animations
  useEffect(() => {
    injectCosmicAnimations();
  }, []);

  useEffect(() => {
    fetchTeamStats();
    // Refresh every 10 minutes
    const interval = setInterval(() => {
      if (!isFetching) {
        fetchTeamStats();
      }
    }, 600000);
    return () => clearInterval(interval);
  }, []);

  const fetchTeamStats = async () => {
    if (isFetching) {
      console.log('Request already in progress, skipping...');
      return;
    }
    
    try {
      setIsFetching(true);
      setLoading(true);
      const response = await brain.get_team_stats();
      const data = await response.json();
      setTeamStats(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching team stats:', error);
      setError('Failed to load team statistics');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // Calculate planet state based on progress percentage
  const getPlanetState = (progressPct: number): PlanetState => {
    if (progressPct >= 90) return 'mastered';
    if (progressPct >= 70) return 'thriving';
    if (progressPct >= 40) return 'active';
    if (progressPct >= 20) return 'awakening';
    return 'dormant';
  };

  // Get planet image path (placeholder logic for now)
  const getPlanetImage = (planetId: string, state: PlanetState): string => {
    // Map planet IDs and states to actual PNG URLs
    const planetImages: Record<string, Record<PlanetState, string>> = {
      books: {
        dormant: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 01_22_55 PM.png',
        awakening: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 01_23_12 PM.png',
        active: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 01_23_15 PM.png',
        thriving: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 01_23_17 PM.png',
        mastered: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 01_23_21 PM.png'
      },
      opps: {
        dormant: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 01_32_40 PM.png',
        awakening: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 01_23_23 PM.png',
        active: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 01_23_26 PM.png',
        thriving: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 01_23_29 PM.png',
        mastered: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 01_34_30 PM.png'
      },
      deals: {
        dormant: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 02_57_05 PM.png',
        awakening: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 02_57_07 PM.png',
        active: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 02_57_10 PM.png',
        thriving: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 02_57_17 PM.png',
        mastered: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Aug 9, 2025, 03_02_28 PM.png'
      }
    };
    
    return planetImages[planetId]?.[state] || planetImages[planetId]?.['dormant'] || '';
  };

  // Get state color for visual feedback
  const getStateColor = (state: PlanetState): string => {
    switch (state) {
      case 'mastered': return 'from-violet-500 to-fuchsia-500';
      case 'thriving': return 'from-blue-500 to-purple-500';
      case 'active': return 'from-cyan-500 to-blue-500';
      case 'awakening': return 'from-indigo-600 to-cyan-600';
      case 'dormant': return 'from-gray-600 to-gray-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  // Get planet glow effect
  const getPlanetGlow = (state: PlanetState): string => {
    switch (state) {
      case 'mastered': return 'shadow-2xl shadow-fuchsia-500/50 cosmic-particles';
      case 'thriving': return 'shadow-xl shadow-purple-500/40';
      case 'active': return 'shadow-lg shadow-cyan-500/30';
      case 'awakening': return 'shadow-md shadow-indigo-500/20';
      case 'dormant': return 'shadow-sm shadow-gray-700/10';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Card className="h-full bg-gradient-to-b from-slate-900 to-black border-purple-500/30 p-4">
        <div className="text-center text-purple-300">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-2"></div>
          <div className="text-sm">Loading Planetary Objectives...</div>
        </div>
      </Card>
    );
  }

  if (error || !teamStats) {
    return (
      <Card className="h-full bg-gradient-to-b from-slate-900 to-black border-red-500/30 p-4">
        <div className="text-center text-red-300">
          <div className="text-lg font-semibold mb-2">⚠️ System Error</div>
          <div className="text-sm">{error || 'Failed to load data'}</div>
        </div>
      </Card>
    );
  }

  const planets: Planet[] = [
    {
      id: 'books',
      name: 'Books Planet',
      icon: '📚',
      color: 'from-emerald-500 to-cyan-500',
      data: teamStats.planet_status.books
    },
    {
      id: 'opps',
      name: 'Opportunities Planet',
      icon: '🎯',
      color: 'from-blue-500 to-indigo-500',
      data: teamStats.planet_status.opps
    },
    {
      id: 'deals',
      name: 'Deals Planet',
      icon: '💰',
      color: 'from-yellow-500 to-orange-500',
      data: teamStats.planet_status.deals
    }
  ];

  return (
    <Card className="h-full bg-gradient-to-br from-slate-900/90 to-purple-900/40 border-purple-500/30 backdrop-blur-sm shadow-xl cosmic-bg flex flex-col overflow-hidden">
      <div className="h-full flex flex-col p-3">
        {/* Header */}
        <div className="text-center mb-3 flex-shrink-0">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 cosmic-glow">
            🌌 Planetary Objectives
          </h3>
          <div className="text-xs text-purple-300/70">
            Team Goals Progress
          </div>
        </div>

        {/* Scrollable planet container */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-500/30 min-h-0">
          <div className="space-y-4">
            {planets.map((planet, index) => {
              const state = getPlanetState(planet.data.progress_pct);
              const progressPercentage = planet.data.progress_pct;
              const isCompleted = planet.data.completed;
              
              return (
                <div 
                  key={planet.id} 
                  className={`relative group transition-all duration-500 hover:scale-[1.02] ${
                    isCompleted ? 'animate-pulse' : ''
                  }`}
                >
                  {/* Planet Container - Vertical Layout */}
                  <div className="relative flex flex-col items-center p-3 rounded-lg bg-black/20 backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
                    
                    {/* Planet Image with Effects - Now Larger and Centered */}
                    <div className="relative flex-shrink-0 mb-2">
                      {/* Enhanced Glow effect */}
                      <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-green-400/50 to-emerald-400/50 animate-pulse scale-150 blur-md' 
                          : 'bg-gradient-to-r from-purple-400/30 to-pink-400/30 blur-md scale-125'
                      }`} />
                      
                      {/* Orbital rings - Larger */}
                      <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
                        isCompleted 
                          ? 'border-green-400/70 animate-spin-slow scale-125' 
                          : 'border-purple-400/40 animate-spin-slow scale-110'
                      }`} style={{ animationDuration: '20s' }} />
                      
                      {/* Secondary orbital ring for enhanced effect */}
                      <div className={`absolute inset-0 rounded-full border transition-all duration-500 ${
                        isCompleted 
                          ? 'border-green-300/50 animate-spin-slow scale-140' 
                          : 'border-purple-300/25 animate-spin-slow scale-130'
                      }`} style={{ animationDuration: '35s', animationDirection: 'reverse' }} />
                      
                      {/* Planet image - Optimized Size */}
                      <div className="relative z-10">
                        <img 
                          src={getPlanetImage(planet.id, state)}
                          alt={planet.name}
                          className={`w-16 h-16 object-contain transition-all duration-500 ${
                            isCompleted 
                              ? 'drop-shadow-[0_0_16px_rgba(34,197,94,0.9)] brightness-110' 
                              : 'drop-shadow-[0_0_10px_rgba(147,51,234,0.7)]'
                          }`}
                        />
                      </div>
                      
                      {/* Enhanced Completion indicator */}
                      {isCompleted && (
                        <div className="absolute -top-2 -right-2 z-20">
                          <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center border-2 border-green-300 animate-bounce shadow-lg shadow-green-500/50">
                            <span className="text-xs text-white font-bold">✓</span>
                          </div>
                        </div>
                      )}
                      
                      {/* State particles for enhanced visual feedback */}
                      {['thriving', 'mastered'].includes(state) && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0ms' }}></div>
                          <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-purple-300 rounded-full animate-ping" style={{ animationDelay: '500ms' }}></div>
                          <div className="absolute bottom-3 left-4 w-0.5 h-0.5 bg-cyan-300 rounded-full animate-ping" style={{ animationDelay: '1000ms' }}></div>
                        </div>
                      )}
                    </div>

                    {/* Goal Info - Now Below Planet */}
                    <div className="w-full text-center">
                      {/* Planet name and progress */}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`text-sm font-bold ${
                          isCompleted ? 'text-green-400' : 'text-purple-300'
                        }`}>
                          {planet.name}
                        </h4>
                        <span className={`text-sm font-mono font-bold ${
                          isCompleted ? 'text-green-400' : 'text-purple-300'
                        }`}>
                          {progressPercentage.toFixed(0)}%
                        </span>
                      </div>
                      
                      {/* Progress bar - Wider */}
                      <div className="w-full bg-gray-700/50 rounded-full h-2 mb-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 ease-out ${
                            isCompleted 
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse' 
                              : 'bg-gradient-to-r from-purple-500 to-pink-500'
                          }`}
                          style={{ width: `${Math.min(100, progressPercentage)}%` }}
                        />
                      </div>
                      
                      {/* Current/Target and State display */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs capitalize font-semibold ${
                          state === 'mastered' ? 'text-fuchsia-300' :
                          state === 'thriving' ? 'text-purple-300' :
                          state === 'active' ? 'text-cyan-300' :
                          state === 'awakening' ? 'text-indigo-300' :
                          'text-gray-400'
                        }`}>
                          {planet.icon} {state}
                        </span>
                        <span className={`text-sm font-mono font-bold ${
                          isCompleted ? 'text-green-400' : 'text-slate-300'
                        }`}>
                          {planet.data.current}/{planet.data.goal}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Team Stats Summary */}
        <div className="mt-3 pt-2 border-t border-purple-500/20 flex-shrink-0">
          <div className="text-center">
            <div className="text-xs text-purple-300 font-bold">
              Goals: {planets.filter(p => p.data.completed).length}/{planets.length} Complete
            </div>
            <div className="text-[10px] text-slate-400">
              Overall: {Math.round(planets.reduce((sum, p) => sum + p.data.progress_pct, 0) / planets.length)}%
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PlanetaryObjectives;
