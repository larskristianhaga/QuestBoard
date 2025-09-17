



import { useEffect, useState } from 'react';
import brain from 'brain';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { 
  getTeamShipAnimationClass, 
  getZephyrMessage,
  injectCosmicAnimations 
} from 'utils/cosmicAnimations';

// Planet animation helper functions
const getPlanetAnimationClass = (progress_pct: number, completed: boolean) => {
  // Base classes with reduced motion support
  const baseClasses = 'transition-all duration-1000';
  const motionClasses = 'motion-safe:animate-pulse motion-safe:animate-spin-slow motion-safe:animate-rotate motion-safe:scale-110 motion-safe:scale-105 motion-safe:scale-102';
  
  if (completed) {
    return `${baseClasses} motion-safe:animate-pulse motion-safe:scale-110 motion-safe:animate-spin-slow motion-reduce:scale-105`;
  } else if (progress_pct >= 67) {
    return `${baseClasses} motion-safe:animate-pulse-slow motion-safe:animate-rotate motion-safe:scale-105 motion-reduce:scale-102`;
  } else if (progress_pct >= 34) {
    return `${baseClasses} motion-safe:animate-pulse-gentle motion-safe:scale-102 motion-reduce:scale-101`;
  } else {
    return `${baseClasses} scale-100`;
  }
};

const getPlanetGlowClass = (progress_pct: number, completed: boolean, color: string) => {
  const baseClass = 'text-4xl transition-all duration-1000';
  
  if (completed) {
    return `${baseClass} drop-shadow-[0_0_30px_rgba(${color},1)] filter brightness-125 motion-safe:animate-glow-pulse`;
  } else if (progress_pct >= 67) {
    return `${baseClass} drop-shadow-[0_0_25px_rgba(${color},0.9)] filter brightness-110`;
  } else if (progress_pct >= 34) {
    return `${baseClass} drop-shadow-[0_0_15px_rgba(${color},0.6)] filter brightness-105`;
  } else if (progress_pct >= 1) {
    return `${baseClass} drop-shadow-[0_0_8px_rgba(${color},0.3)] opacity-80`;
  } else {
    return `${baseClass} opacity-50`;
  }
};

const getPlanetParticleEffect = (progress_pct: number, completed: boolean) => {
  if (completed) {
    return (
      <>
        <div className="absolute -top-2 -right-2 text-xl animate-bounce">
          ✨
        </div>
        <div className="absolute -top-1 -left-2 text-sm animate-pulse delay-300">
          💫
        </div>
        <div className="absolute -bottom-1 -right-1 text-sm animate-bounce delay-500">
          ⭐
        </div>
      </>
    );
  } else if (progress_pct >= 90) {
    return (
      <>
        <div className="absolute -top-2 -right-2 text-lg animate-pulse">
          ✨
        </div>
        <div className="absolute -bottom-1 -left-1 text-sm animate-bounce delay-200">
          💫
        </div>
      </>
    );
  } else if (progress_pct >= 67) {
    return (
      <div className="absolute -top-1 -right-1 text-sm animate-pulse delay-100">
        ✨
      </div>
    );
  }
  return null;
};

const getPlanetTooltipContent = (name: string, current: number, goal: number, progress_pct: number) => {
  const status = progress_pct >= 100 ? '🎉 COMPLETE!' : 
                 progress_pct >= 67 ? '🔥 Almost there!' :
                 progress_pct >= 34 ? '⚡ Making progress!' :
                 progress_pct >= 1 ? '🌱 Getting started' :
                 '💤 Awaiting activation';
  
  return (
    <div className="space-y-2">
      <div className="font-semibold">{name}</div>
      <div>Progress: {current} / {goal}</div>
      <div>Completion: {progress_pct.toFixed(1)}%</div>
      <div className="text-sm text-slate-300">{status}</div>
    </div>
  );
};

interface TeamStats {
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
  planet_status: {
    books: {
      current: number;
      goal: number;
      completed: boolean;
      progress_pct: number;
    };
    opps: {
      current: number;
      goal: number;
      completed: boolean;
      progress_pct: number;
    };
    deals: {
      current: number;
      goal: number;
      completed: boolean;
      progress_pct: number;
    };
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

// Add helper functions for battle narrative
const getBattleNarrative = (racePosition: any, teamProgress: any, benchmarkProgress: any) => {
  const { team_ahead, gap, team_wins, race_complete } = racePosition;
  const teamPct = teamProgress.progress_percentage;
  const alienPct = benchmarkProgress.progress_percentage;
  
  // Victory scenarios
  if (team_wins) {
    return {
      emoji: "🏆🎉🎆",
      title: "MISSION ACCOMPLISHED!",
      message: "The ES Oslo crew has reached the moon! The galaxy celebrates your triumph!",
      badgeVariant: "default" as const,
      badgeClass: "bg-green-500 text-white",
      alienStatus: "The alien benchmark retreats in defeat... 👽💔"
    };
  }
  
  if (race_complete && !team_wins) {
    return {
      emoji: "😤⚡💪",
      title: "ALIEN VICTORY", 
      message: "The Zephyrian benchmark reached the moon first, but ES Oslo fights on!",
      badgeVariant: "destructive" as const,
      badgeClass: "",
      alienStatus: "Zephyr taunts: 'Your species is... adequate.' 👽😏"
    };
  }
  
  // Dynamic battle states
  if (team_ahead) {
    if (teamPct >= 90) {
      return {
        emoji: "🚀💨⚡",
        title: "FINAL SPRINT!",
        message: "ES Oslo rockets toward the moon! Victory is within reach!",
        badgeVariant: "default" as const,
        badgeClass: "bg-green-600 text-white animate-pulse",
        alienStatus: "Zephyr panics: 'Impossible! These humans are... formidable!' 👽😰"
      };
    } else if (teamPct >= 75) {
      return {
        emoji: "🚀🔥💫",
        title: "COMMANDING LEAD!",
        message: "The team's momentum is unstoppable! The moon awaits!",
        badgeVariant: "default" as const,
        badgeClass: "bg-blue-600 text-white",
        alienStatus: "Zephyr growls: 'Your progress is... concerning.' 👽😠"
      };
    } else if (gap >= 20) {
      return {
        emoji: "🚀⚡🌟",
        title: "STRONG ADVANTAGE!",
        message: "ES Oslo surges ahead with stellar teamwork!",
        badgeVariant: "default" as const, 
        badgeClass: "bg-blue-500 text-white",
        alienStatus: "Zephyr mutters: 'Hmm... these beings show promise.' 👽🤔"
      };
    } else {
      return {
        emoji: "🚀✨",
        title: "TEAM LEADING!",
        message: "ES Oslo takes the lead in this cosmic race!",
        badgeVariant: "default" as const,
        badgeClass: "bg-purple-600 text-white",
        alienStatus: "Zephyr observes: 'Interesting... they adapt quickly.' 👽🧐"
      };
    }
  } else {
    if (alienPct >= 90) {
      return {
        emoji: "😤🔥💨",
        title: "CODE RED!",
        message: "Zephyr approaches the moon! All hands on deck!",
        badgeVariant: "destructive" as const,
        badgeClass: "animate-pulse",
        alienStatus: "Zephyr boasts: 'Victory is mine, primitive beings!' 👽😈"
      };
    } else if (alienPct >= 75) {
      return {
        emoji: "⚠️🚨💪",
        title: "CRITICAL PHASE!",
        message: "The alien builds momentum! ES Oslo must respond!",
        badgeVariant: "destructive" as const,
        badgeClass: "",
        alienStatus: "Zephyr taunts: 'Your efforts amuse me, humans.' 👽😏"
      }; 
    } else if (gap >= 20) {
      return {
        emoji: "👽💪😓",
        title: "ALIEN ADVANTAGE!",
        message: "Zephyr pulls ahead! Time to accelerate activities!",
        badgeVariant: "secondary" as const,
        badgeClass: "",
        alienStatus: "Zephyr chuckles: 'As expected from my calculations.' 👽😌"
      };
    } else {
      return {
        emoji: "👽⚡🤖",
        title: "NECK AND NECK!",
        message: "A fierce battle unfolds! Every activity counts!",
        badgeVariant: "secondary" as const,
        badgeClass: "",
        alienStatus: "Zephyr analyzes: 'These humans show... potential.' 👽🔍"
      };
    }
  }
};

const getAlienMotivation = (benchmarkProgress: any) => {
  const timeElapsed = benchmarkProgress.time_elapsed_pct;
  
  if (timeElapsed >= 90) {
    return "Zephyr's desperation grows as time runs out! 👽⏰";
  } else if (timeElapsed >= 75) {
    return "The alien's calculations become more aggressive! 👽📊";
  } else if (timeElapsed >= 50) {
    return "Zephyr maintains steady pressure on the team. 👽⚖️";
  } else if (timeElapsed >= 25) {
    return "The benchmark alien studies your early moves. 👽🔬";
  } else {
    return "Zephyr, the benchmark alien, begins the cosmic chase. 👽🚀";
  }
};

// Add visual intensity helper function
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
        progressAlien: "bg-gradient-to-r from-red-400 to-rose-500",
        background: "from-slate-900/80 to-yellow-900/30"
      };
    case "complete":
      return {
        container: "border-green-500/60 shadow-green-500/20 shadow-lg",
        progressTeam: "bg-gradient-to-r from-green-400 to-emerald-500",
        progressAlien: "bg-gradient-to-r from-gray-400 to-slate-500",
        background: "from-slate-900/80 to-green-900/40"
      };
    default:
      return {
        container: "border-purple-500/30",
        progressTeam: "bg-gradient-to-r from-blue-400 to-blue-600",
        progressAlien: "bg-gradient-to-r from-red-400 to-red-600",
        background: "from-slate-900/80 to-purple-900/40"
      };
  }
};

export default function TeamProgressTrack({ refreshTrigger }: Props) {
  const [teamStats, setTeamStats] = useState<TeamStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Ensure cosmic animations are injected
  useEffect(() => {
    injectCosmicAnimations();
  }, []);

  const fetchTeamStats = async () => {
    try {
      const response = await brain.get_team_stats();
      const data = await response.json();
      setTeamStats(data);
    } catch (error) {
      console.error('Error fetching team stats:', error);
    }
  };

  useEffect(() => {
    fetchTeamStats();
    // Refresh every 10 minutes
    const interval = setInterval(fetchTeamStats, 600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="p-6 bg-slate-900/50 border-purple-500/30">
        <div className="animate-pulse">
          <div className="h-6 bg-purple-500/20 rounded mb-4"></div>
          <div className="h-32 bg-purple-500/20 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error || !teamStats) {
    return (
      <Card className="p-6 bg-slate-900/50 border-red-500/30">
        <div className="text-red-400">
          {error || 'Failed to load team progress'}
        </div>
      </Card>
    );
  }

  const {
    team_progress,
    benchmark_progress,
    planet_status,
    race_position,
    quarter_info
  } = teamStats;

  return (
    <div className="space-y-6">
      {/* Team Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[600px]">
        {/* Team Planet Goals (Left) */}
        <Card className="p-6 bg-gradient-to-br from-slate-900/90 to-blue-900/50 border-blue-500/30 overflow-y-auto">
          <div className="space-y-6">
            {/* Planet Goals */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-purple-300 mb-4 text-center">
                🪐 Planetary Objectives
              </h3>
              {/* Books Planet - Discovery */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-orange-300 font-semibold text-sm">📡 Discovery</span>
                  <span className="text-slate-300 text-sm font-bold">
                    {planet_status.books.current}/{planet_status.books.goal}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`relative transition-all duration-1000 ${getPlanetAnimationClass(planet_status.books.progress_pct, planet_status.books.completed)}`}>
                          <div className={getPlanetGlowClass(planet_status.books.progress_pct, planet_status.books.completed, '255,165,0')}>
                            📡
                          </div>
                          {getPlanetParticleEffect(planet_status.books.progress_pct, planet_status.books.completed)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {getPlanetTooltipContent('Discovery Planet', planet_status.books.current, planet_status.books.goal, planet_status.books.progress_pct)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="flex-1">
                    <Progress 
                      value={planet_status.books.progress_pct} 
                      className="h-3 bg-slate-800/50"
                    />
                    <div className="text-xs text-slate-400 mt-1 text-center">
                      {planet_status.books.progress_pct.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Opportunities Planet - Strategy */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-300 font-semibold text-sm">🧭 Strategy</span>
                  <span className="text-slate-300 text-sm font-bold">
                    {planet_status.opps.current}/{planet_status.opps.goal}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`relative transition-all duration-1000 ${getPlanetAnimationClass(planet_status.opps.progress_pct, planet_status.opps.completed)}`}>
                          <div className={getPlanetGlowClass(planet_status.opps.progress_pct, planet_status.opps.completed, '147,51,234')}>
                            🧭
                          </div>
                          {getPlanetParticleEffect(planet_status.opps.progress_pct, planet_status.opps.completed)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {getPlanetTooltipContent('Strategy Moon', planet_status.opps.current, planet_status.opps.goal, planet_status.opps.progress_pct)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="flex-1">
                    <Progress 
                      value={planet_status.opps.progress_pct} 
                      className="h-3 bg-slate-800/50"
                    />
                    <div className="text-xs text-slate-400 mt-1 text-center">
                      {planet_status.opps.progress_pct.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Deals Planet - Partnership */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-300 font-semibold text-sm">🤝 Partnership</span>
                  <span className="text-slate-300 text-sm font-bold">
                    {planet_status.deals.current}/{planet_status.deals.goal}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`relative transition-all duration-1000 ${getPlanetAnimationClass(planet_status.deals.progress_pct, planet_status.deals.completed)}`}>
                          <div className={getPlanetGlowClass(planet_status.deals.progress_pct, planet_status.deals.completed, '6,182,212')}>
                            🤝
                          </div>
                          {getPlanetParticleEffect(planet_status.deals.progress_pct, planet_status.deals.completed)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {getPlanetTooltipContent('Partnership World', planet_status.deals.current, planet_status.deals.goal, planet_status.deals.progress_pct)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="flex-1">
                    <Progress 
                      value={planet_status.deals.progress_pct} 
                      className="h-3 bg-slate-800/50"
                    />
                    <div className="text-xs text-slate-400 mt-1 text-center">
                      {planet_status.deals.progress_pct.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Moon Battle (Right) */}
        <Card className={`p-6 bg-gradient-to-br ${(() => {
          const intensity = getBattleIntensity(race_position, team_progress, benchmark_progress);
          const classes = getIntensityClasses(intensity);
          return `${classes.background} ${classes.container}`;
        })()} overflow-y-auto transition-all duration-1000 h-full`}>
          <h3 className="text-lg font-semibold text-purple-300 mb-4 text-center">
            🌙 Moon Race
          </h3>
          <div className="space-y-4">
            {/* Vertical Race Track - Enhanced height for better visual spacing */}
            <div className="relative h-96 mx-2">
              {/* Starfield Background */}
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                {/* Dynamic star generation */}
                {Array.from({ length: 15 }).map((_, i) => (
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
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`large-star-${i}`}
                    className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-pulse"
                    style={{
                      left: `${(i * 53 + 31) % 85 + 7}%`,
                      top: `${(i * 67 + 29) % 80 + 10}%`,
                      animationDelay: `${i * 0.5 + 0.2}s`,
                      opacity: 0.8
                    }}
                  />
                ))}
              </div>

              {/* Race track lanes - made very transparent */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-t from-blue-500/5 to-blue-300/3 rounded transform -translate-x-8"></div>
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-t from-red-500/5 to-red-300/3 rounded transform translate-x-8"></div>

              {/* Progress percentage markers */}
              <div className="absolute right-2 top-0 h-full flex flex-col justify-between text-xs text-slate-400 py-6">
                <div>100%</div>
                <div>75%</div>
                <div>50%</div>
                <div>25%</div>
                <div>0%</div>
              </div>

              {/* Moon at the top - increased distance from bottom */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 -translate-y-1 z-10">
                <div className={`transition-all duration-1000 ${
                  race_position.race_complete 
                    ? "animate-pulse drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]" 
                    : "drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                }`}>
                  <img 
                    src="https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/moon.png" 
                    alt="Moon Target" 
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div className="text-sm text-center text-slate-300 font-bold">FINISH</div>
              </div>

              {/* Team ship - enhanced with thruster animations */}
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 -translate-x-10 transition-all duration-1000 ease-out z-10"
                style={{
                  bottom: `${Math.max(8, Math.min(80, team_progress.progress_percentage * 0.8 + 8))}%`,
                }}
              >
                <div className={`transition-all duration-500 cursor-pointer hover:scale-125 ${
                  race_position.team_ahead 
                    ? "drop-shadow-[0_0_20px_rgba(59,130,246,0.9)] scale-110" 
                    : "drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                } ${getTeamShipAnimationClass(team_progress.progress_percentage, race_position.team_ahead)}`}
                onClick={() => navigate('/team-insights')}
                title="Click to view Team Insights Dashboard"
                >
                  <img 
                    src="https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/team ship.png" 
                    alt="ES Oslo Team Ship - Click for Team Insights" 
                    className="w-16 h-16 object-contain hover:animate-pulse"
                  />
                </div>

                {/* Team label */}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-sm text-blue-300 font-bold">OSLO</div>
                  <div className="text-xs text-slate-300">{team_progress.progress_percentage.toFixed(1)}%</div>
                </div>
              </div>

              {/* Alien spaceship - enhanced with animations */}
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 translate-x-8 transition-all duration-1000 ease-out z-10"
                style={{
                  bottom: `${Math.max(8, Math.min(80, benchmark_progress.progress_percentage * 0.8 + 8))}%`,
                }}
              >
                <div className={`transition-all duration-500 ${
                  !race_position.team_ahead 
                    ? "drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] scale-110" 
                    : "drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                } zephyr-float`}>
                  <img 
                    src="https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/zephyr.png" 
                    alt="Zephyr Alien Antagonist" 
                    className="w-16 h-16 object-contain"
                  />
                </div>

                {/* Alien label */}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-sm text-red-300 font-bold">ZEPHYR</div>
                  <div className="text-xs text-slate-300">{benchmark_progress.progress_percentage.toFixed(1)}%</div>
                </div>
              </div>

              {/* Floating Zephyr Trash-Talk Message - reduced frequency */}
              {showZephyrMessage && (Math.random() > 0.7) && (
                <div className="absolute top-4 right-4 z-20">
                  <div className="relative">
                    <div className="bg-red-900/95 border border-red-500/50 rounded-lg p-3 shadow-xl max-w-48 animate-pulse">
                      <div className="flex items-start space-x-2">
                        <div className="text-red-300 text-lg zephyr-float">👽</div>
                        <p className="text-red-100 text-xs font-medium leading-tight">
                          {zephyrMessage}
                        </p>
                      </div>
                    </div>
                    {/* Speech bubble arrow */}
                    <div className="absolute left-4 -bottom-2">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-red-900/95"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Simplified Battle Stats */}
            <div className="pt-2 border-t border-purple-500/20">
              <div className="flex items-center justify-center space-x-6 text-sm">
                {/* Progress indicators */}
                <div className="text-center">
                  <div className="text-blue-300 font-semibold">Team</div>
                  <div className="text-slate-300">{team_progress.progress_percentage.toFixed(1)}%</div>
                </div>
                
                {/* Gap indicator */}
                <div className="text-center">
                  <div className={`font-semibold ${
                    race_position.team_ahead ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {race_position.team_ahead ? 'Leading' : 'Behind'}
                  </div>
                  <div className="text-slate-300 text-xs">
                    Gap: {Math.round(Math.abs(race_position.gap))}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-red-300 font-semibold">Zephyr</div>
                  <div className="text-slate-300">{benchmark_progress.progress_percentage.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
