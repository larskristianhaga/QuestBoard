



import React, { useState, useEffect } from 'react';
import brain from 'brain';
import { Card } from '@/components/ui/card';
import { 
  getTeamShipAnimationClass, 
  getZephyrMessage,
  injectCosmicAnimations 
} from 'utils/cosmicAnimations';

interface TeamStatsData {
  team_progress: {
    current_count: number;
    total_goal: number;
    progress_percentage: number;
    breakdown: {
      books: number;
      opps: number;
      deals: number;
    };
  };
  benchmark_progress: {
    current_position: number;
    progress_percentage: number;
    time_elapsed_pct: number;
    days_elapsed: number;
    total_days: number;
  };
  race_position: {
    team_ahead: boolean;
    team_position: number;
    benchmark_position: number;
    gap: number;
    team_wins: boolean;
    race_complete: boolean;
  };
  quarter_info: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
  };
}

// Battle intensity helper functions
const getBattleIntensity = (racePosition: any, teamProgress: any, benchmarkProgress: any) => {
  const { team_ahead, gap, race_complete } = racePosition;
  const teamPct = teamProgress.progress_percentage;
  const alienPct = benchmarkProgress.progress_percentage;
  
  if (race_complete) return "complete";
  if (teamPct >= 90 || alienPct >= 90) return "critical";
  if (teamPct >= 75 || alienPct >= 75) return "intense";
  if (gap <= 5) return "close";
  return "normal";
};

const getIntensityClasses = (intensity: string) => {
  switch (intensity) {
    case "critical":
      return {
        container: "animate-pulse border-red-500/60 shadow-red-500/20 shadow-lg",
        progressTeam: "bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse",
        progressAlien: "bg-gradient-to-r from-red-500 to-orange-400 animate-pulse",
        background: "from-slate-900/90 to-red-900/60"
      };
    case "intense":
      return {
        container: "border-orange-500/50 shadow-orange-500/10 shadow-md",
        progressTeam: "bg-gradient-to-r from-blue-400 to-purple-500",
        progressAlien: "bg-gradient-to-r from-red-400 to-pink-500",
        background: "from-slate-900/80 to-orange-900/40"
      };
    case "close":
      return {
        container: "border-yellow-500/40 shadow-yellow-500/10 shadow-sm",
        progressTeam: "bg-gradient-to-r from-blue-400 to-indigo-500",
        progressAlien: "bg-gradient-to-r from-red-400 to-yellow-500",
        background: "from-slate-900/70 to-yellow-900/30"
      };
    case "complete":
      return {
        container: "border-green-500/60 shadow-green-500/20 shadow-xl animate-pulse",
        progressTeam: "bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse",
        progressAlien: "bg-gradient-to-r from-slate-500 to-slate-600",
        background: "from-slate-900/90 to-green-900/50"
      };
    default:
      return {
        container: "border-blue-500/30 shadow-blue-500/10",
        progressTeam: "bg-gradient-to-r from-blue-400 to-cyan-500",
        progressAlien: "bg-gradient-to-r from-red-400 to-red-500",
        background: "from-slate-900/80 to-blue-900/40"
      };
  }
};

const MoonRace: React.FC = () => {
  const [teamStats, setTeamStats] = useState<TeamStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zephyrMessage, setZephyrMessage] = useState<string>('');
  const [showZephyrMessage, setShowZephyrMessage] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Initialize cosmic animations
  useEffect(() => {
    injectCosmicAnimations();
  }, []);

  // Auto-hide Zephyr message after 8 seconds
  useEffect(() => {
    if (showZephyrMessage) {
      const timer = setTimeout(() => {
        setShowZephyrMessage(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showZephyrMessage]);

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

  // Update Zephyr message when team stats change
  useEffect(() => {
    if (teamStats) {
      const newMessage = getZephyrMessage(
        teamStats.team_progress.progress_percentage,
        teamStats.benchmark_progress.progress_percentage,
        teamStats.race_position.team_ahead
      );
      if (newMessage !== zephyrMessage) {
        setZephyrMessage(newMessage);
        setShowZephyrMessage(true);
      }
    }
  }, [teamStats, zephyrMessage]);

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

  if (loading) {
    return (
      <Card className="h-full bg-gradient-to-b from-slate-900 to-black border-blue-500/30 p-4">
        <div className="text-center text-blue-300">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
          <div className="text-sm">Loading Moon Race...</div>
        </div>
      </Card>
    );
  }

  if (error || !teamStats) {
    return (
      <Card className="h-full bg-gradient-to-b from-slate-900 to-black border-red-500/30 p-4">
        <div className="text-center text-red-300">
          <div className="text-lg font-semibold mb-2">⚠️ Race Error</div>
          <div className="text-sm">{error || 'Failed to load data'}</div>
        </div>
      </Card>
    );
  }

  const {
    team_progress,
    benchmark_progress,
    race_position,
    quarter_info
  } = teamStats;

  const intensity = getBattleIntensity(race_position, team_progress, benchmark_progress);
  const classes = getIntensityClasses(intensity);

  return (
    <Card className={`h-full bg-gradient-to-br ${classes.background} ${classes.container} transition-all duration-1000 cosmic-bg flex flex-col overflow-hidden`}>
      <div className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="text-center mb-3 flex-shrink-0">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 cosmic-glow">
            🌙 Moon Race
          </h3>
          <div className="text-xs text-blue-300/70">
            Team vs Time Challenge
          </div>
        </div>

        {/* Zephyr Message */}
        {showZephyrMessage && (
          <div className="mb-3 p-2 bg-black/40 rounded-lg border border-purple-500/30 backdrop-blur-sm transition-all duration-300 flex-shrink-0">
            <div className="flex items-start space-x-2">
              <div className="text-lg">
                <img 
                  src="https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/zephyr.png" 
                  alt="Zephyr" 
                  className="w-5 h-5 object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-purple-300 mb-1">Zephyr</div>
                <div className="text-xs text-slate-300">{zephyrMessage}</div>
              </div>
            </div>
          </div>
        )}

        {/* Vertical Race Track */}
        <div className="flex-1 relative mx-1 min-h-0">
          {/* Starfield Background */}
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            {/* Dynamic star generation - reduced count for performance */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`small-star-${i}`}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${(i * 37 + 23) % 90 + 5}%`,
                  top: `${(i * 47 + 17) % 85 + 5}%`,
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0.6
                }}
              />
            ))}
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`large-star-${i}`}
                className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse"
                style={{
                  left: `${(i * 53 + 31) % 85 + 7}%`,
                  top: `${(i * 67 + 29) % 80 + 10}%`,
                  animationDelay: `${i * 0.5 + 0.2}s`,
                  opacity: 0.8
                }}
              />
            ))}
          </div>

          {/* Race track lanes */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-t from-blue-500/5 to-blue-300/3 rounded transform -translate-x-6"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-t from-red-500/5 to-red-300/3 rounded transform translate-x-6"></div>

          {/* Progress percentage markers */}
          <div className="absolute right-1 top-0 h-full flex flex-col justify-between text-[10px] text-slate-400 py-4">
            <div>100%</div>
            <div>75%</div>
            <div>50%</div>
            <div>25%</div>
            <div>0%</div>
          </div>

          {/* Moon at the top */}
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 -translate-y-1 z-10">
            <div className={`transition-all duration-1000 ${
              race_position.race_complete 
                ? "animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" 
                : "drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
            }`}>
              <img 
                src="https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/moon.png" 
                alt="Moon Target" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="text-xs text-center text-slate-300 font-bold">FINISH</div>
          </div>

          {/* Team ship */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 -translate-x-8 transition-all duration-1000 ease-out z-10"
            style={{
              bottom: `${Math.max(8, Math.min(75, team_progress.progress_percentage * 0.75 + 8))}%`,
            }}
          >
            <div className={`transition-all duration-500 ${
              race_position.team_ahead 
                ? "drop-shadow-[0_0_15px_rgba(59,130,246,0.9)] scale-105" 
                : "drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
            } ${getTeamShipAnimationClass(team_progress.progress_percentage, race_position.team_ahead)}`}>
              <img 
                src="https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/teamship.png" 
                alt="Team Ship" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="text-[10px] text-center text-blue-300 font-bold mt-1">TEAM</div>
          </div>

          {/* Benchmark (Zephyr/Time) */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 translate-x-8 transition-all duration-1000 ease-out z-10"
            style={{
              bottom: `${Math.max(8, Math.min(75, benchmark_progress.progress_percentage * 0.75 + 8))}%`,
            }}
          >
            <div className={`transition-all duration-500 ${
              !race_position.team_ahead 
                ? "drop-shadow-[0_0_15px_rgba(239,68,68,0.9)] scale-105" 
                : "drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
            }`}>
              <div className="zephyr-float">
                <img 
                  src="https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/zephyr.png" 
                  alt="Zephyr" 
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>
            <div className="text-[10px] text-center text-red-300 font-bold mt-1">ZEPHYR</div>
          </div>
        </div>

        {/* Race Stats - Clean Format */}
        <div className="mt-3 pt-2 border-t border-blue-500/20 flex-shrink-0">
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Team Column */}
            <div>
              <div className="text-blue-300 font-bold text-xs">Team</div>
              <div className="text-blue-300 font-bold text-sm">{team_progress.progress_percentage.toFixed(1)}%</div>
            </div>
            
            {/* Status Column */}
            <div>
              <div className={`font-bold text-xs ${
                race_position.team_ahead ? 'text-green-400' : 'text-orange-400'
              }`}>
                {race_position.team_ahead ? 'Ahead' : 'Behind'}
              </div>
              <div className="text-slate-400 font-mono text-xs">Gap: {Math.round(race_position.gap)}</div>
            </div>
            
            {/* Zephyr Column */}
            <div>
              <div className="text-red-300 font-bold text-xs">Zephyr</div>
              <div className="text-red-300 font-bold text-sm">{benchmark_progress.progress_percentage.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MoonRace;
