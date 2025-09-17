



import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Target, Trophy, Zap, Flame, Users, Crown, Search } from 'lucide-react';
import { injectCosmicAnimations } from 'utils/cosmicAnimations';
import brain from 'brain';
import { useUser } from '@stackframe/react';
import { queryKeys, singleFlight, getPollingInterval } from 'utils/queryClient';
import { ActiveChallengesResponse } from 'types';

interface Challenge {
  id: number;
  title: string;
  description: string | null;
  type: string; // speed_run, streak, team_push, boss_fight, hidden_gem
  icon: string;
  target_value: number;
  target_type: string;
  current_progress: number;
  end_time: string;
  reward_points: number;
  reward_description: string | null;
  status: string;
  time_remaining_hours: number;
  progress_percentage: number;
  is_team_challenge: boolean;
  can_participate: boolean;
  my_contribution?: number | null;
  top_contributors?: Array<{name: string; contribution: number}> | null;
}

// Updated challenge types with new icons
const CHALLENGE_TYPES = {
  speed_run: {
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    emoji: '⚡'
  },
  streak: {
    icon: Flame,
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    emoji: '🔥'
  },
  team_push: {
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    emoji: '🤝'
  },
  boss_fight: {
    icon: Crown,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10', 
    borderColor: 'border-purple-500/30',
    emoji: '👾'
  },
  hidden_gem: {
    icon: Search,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    emoji: '🔍'
  },
  // Fallback for daily/weekly from old system
  daily: {
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    emoji: '⚡'
  },
  weekly: {
    icon: Calendar,
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    emoji: '📅'
  },
  special: {
    icon: Trophy,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10', 
    borderColor: 'border-purple-500/30',
    emoji: '🏆'
  }
};

export default function ChallengesWidget() {
  const user = useUser();
  const [localChallenges, setLocalChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSuccessfulLoad, setLastSuccessfulLoad] = useState<number | null>(null);
  const [pollingDisabled, setPollingDisabled] = useState(false);

  // Use React Query for smart caching and automatic refetching
  const {
    data: challengesData,
    isLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: queryKeys.challenges,
    queryFn: () => singleFlight('challenges-summary', async () => {
      console.log('Fetching challenges summary...');
      const response = await brain.get_challenges_summary();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    }),
    enabled: !!user, // Only fetch when user is logged in
    staleTime: 30_000, // Consider data stale after 30 seconds
    gcTime: 5 * 60_000, // Keep in cache for 5 minutes
    refetchInterval: getPollingInterval(10 * 60_000), // Poll every 10 minutes when visible (reduced from 2 min)
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.message?.includes('4')) return false;
      // Retry up to 2 times for 5xx errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Extract challenges array from the summary response
  const apiChallenges = challengesData?.challenges || [];

  // Initialize cosmic animations
  useEffect(() => {
    injectCosmicAnimations();
  }, []);

  // Format time remaining
  const formatTimeRemaining = (hours: number): string => {
    if (hours <= 0) return 'Expired';
    if (hours < 1) return `${Math.floor(hours * 60)}m left`;
    if (hours < 24) return `${Math.floor(hours)}h left`;
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  };

  const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
    const typeConfig = CHALLENGE_TYPES[challenge.type as keyof typeof CHALLENGE_TYPES] || CHALLENGE_TYPES.daily;
    const IconComponent = typeConfig.icon;
    const progressPercentage = challenge.progress_percentage || 0;
    const isCompleted = progressPercentage >= 100;
    const isNearComplete = progressPercentage >= 80;

    return (
      <div className={`p-4 rounded-xl bg-black/30 backdrop-blur-sm border transition-all duration-300 hover:bg-black/40 hover:scale-102 smooth-scale ${
        isCompleted ? 'cosmic-particles border-emerald-500/50' : typeConfig.borderColor
      }`}>
        <div className="flex items-start gap-3">
          {/* Challenge Type Icon with animation */}
          <div className={`p-2 rounded-lg ${typeConfig.bgColor} ${
            isCompleted ? 'trophy-shine' : isNearComplete ? 'gentle-bob' : ''
          }`}>
            <div className="flex items-center justify-center">
              <span className="text-sm mr-1">{typeConfig.emoji}</span>
              <IconComponent className={`w-3 h-3 ${typeConfig.color}`} />
            </div>
          </div>
          
          {/* Challenge Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-white text-sm truncate">
                {challenge.title}
              </h4>
              <Badge className={`${typeConfig.color} bg-transparent border-current text-xs`}>
                +{challenge.reward_points} pts
              </Badge>
            </div>
            
            <p className="text-xs text-slate-400 mb-2">
              {challenge.description || 'Complete this challenge for bonus points!'}
            </p>
            
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>
                  {challenge.current_progress}/{challenge.target_value} {challenge.target_type}
                  {challenge.is_team_challenge && challenge.my_contribution !== null && (
                    <span className="ml-1 text-emerald-400">(You: {challenge.my_contribution})</span>
                  )}
                </span>
                <span>{formatTimeRemaining(challenge.time_remaining_hours)}</span>
              </div>
              <div className="relative h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full bg-gradient-to-r transition-all duration-1000 ease-out ${
                    challenge.type === 'speed_run' ? 'from-yellow-500 to-orange-500' :
                    challenge.type === 'streak' ? 'from-orange-500 to-red-500' :
                    challenge.type === 'team_push' ? 'from-blue-500 to-cyan-500' :
                    challenge.type === 'boss_fight' ? 'from-purple-500 to-pink-500' :
                    challenge.type === 'hidden_gem' ? 'from-emerald-500 to-teal-500' :
                    'from-blue-500 to-cyan-500'
                  }`}
                  style={{ width: `${Math.min(100, progressPercentage)}%` }}
                />
                {isCompleted && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 animate-pulse" />
                )}
              </div>
            </div>
            
            {/* Team Challenge Top Contributors */}
            {challenge.is_team_challenge && challenge.top_contributors && challenge.top_contributors.length > 0 && (
              <div className="text-xs text-slate-500">
                <span className="text-emerald-400">🏆 Top:</span> {challenge.top_contributors.slice(0, 2).map(c => c.name).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <Card className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            Cosmic Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-4">
            Please log in to view challenges
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            Cosmic Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-purple-500/10 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (queryError) {
    return (
      <Card className="bg-black/30 backdrop-blur-sm border border-red-500/30 rounded-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            Cosmic Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-400 mb-3">Failed to load challenges</p>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="sm"
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-emerald-900/20 border-emerald-500/30 backdrop-blur-sm shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-center bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          🎯 Bonus Challenges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {queryError ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">⚠️</div>
            <p className="text-red-400 text-sm">{queryError}</p>
            <Button 
              onClick={() => refetch()}
              variant="outline" 
              size="sm" 
              className="mt-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              Retry
            </Button>
          </div>
        ) : apiChallenges.length > 0 ? (
          apiChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))
        ) : (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🌟</div>
            <p className="text-slate-400 text-sm">No active challenges</p>
            <p className="text-slate-500 text-xs">New challenges coming soon!</p>
          </div>
        )}
        
        {/* Quick action hint */}
        <div className="pt-2 border-t border-emerald-500/20">
          <p className="text-xs text-center text-slate-500">
            💡 Complete activities to progress in challenges and earn bonus points
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
