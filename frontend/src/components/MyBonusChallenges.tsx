



import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Target, Trophy, Zap } from 'lucide-react';
import brain from 'brain';
import { callBrain, ApiError } from 'utils/api';
import { PlayerChallengeResponse } from 'types';
import { injectCosmicAnimations } from 'utils/cosmicAnimations';

export interface Props {
  refreshTrigger?: number;
}

const CHALLENGE_TYPE_COLORS = {
  daily_streak: 'from-blue-500 to-cyan-500',
  weekly_push: 'from-purple-500 to-pink-500',
  team_push: 'from-green-500 to-emerald-500',
  boss_fight: 'from-red-500 to-orange-500',
  default: 'from-slate-500 to-gray-500'
};

const CHALLENGE_TYPE_ICONS = {
  daily_streak: '🔥',
  weekly_push: '⚡',
  team_push: '🤝',
  boss_fight: '👑',
  default: '🎯'
};

export default function MyBonusChallenges({ refreshTrigger }: Props) {
  const [challenges, setChallenges] = useState<PlayerChallengeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize cosmic animations
  useEffect(() => {
    injectCosmicAnimations();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await callBrain<Challenge[]>(() => brain.get_player_active_challenges(), { retries: 1 });
      setChallenges(data);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Failed to fetch bonus challenges:', err);
      setChallenges([]); // Clear stale data on error
      if (err instanceof ApiError) {
        if (err.causeType === 'network') setError('Network connection failed. Please check your connection.');
        else if (err.causeType === 'timeout') setError('Request timed out. Please try again.');
        else if (err.status) setError(`Request failed (HTTP ${err.status}). Please try again later.`);
        else setError('An unexpected error occurred.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [refreshTrigger]);

  const formatTimeRemaining = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `${minutes}m left`;
    } else if (hours < 24) {
      return `${Math.floor(hours)}h left`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d left`;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getChallengeTypeColor = (type: string) => {
    return CHALLENGE_TYPE_COLORS[type as keyof typeof CHALLENGE_TYPE_COLORS] || CHALLENGE_TYPE_COLORS.default;
  };

  const getChallengeIcon = (type: string) => {
    return CHALLENGE_TYPE_ICONS[type as keyof typeof CHALLENGE_TYPE_ICONS] || CHALLENGE_TYPE_ICONS.default;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-slate-700/50 rounded-lg border border-slate-600/30"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 text-slate-400">
        <div className="text-3xl mb-2">⚠️</div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400">
        <div className="text-3xl mb-2">🌟</div>
        <p className="text-sm">No active bonus challenges</p>
        <p className="text-xs opacity-75">Check back later for new challenges!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/50 scrollbar-track-slate-800/30">
      {challenges.map((challenge) => {
        const progressPercentage = Math.min(challenge.progress_percentage, 100);
        const isCompleted = progressPercentage >= 100;
        
        return (
          <div
            key={challenge.id}
            className={`relative p-3 rounded-lg border transition-all duration-300 hover:border-emerald-400/50 ${
              isCompleted 
                ? 'bg-gradient-to-r from-emerald-900/40 to-green-900/40 border-emerald-500/40'
                : 'bg-slate-800/30 border-slate-700/50'
            }`}
          >
            {/* Challenge Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {challenge.icon || getChallengeIcon(challenge.type)}
                </span>
                <div>
                  <h4 className={`font-medium text-sm ${
                    isCompleted ? 'text-emerald-300' : 'text-white'
                  }`}>
                    {challenge.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0 bg-gradient-to-r ${getChallengeTypeColor(challenge.type)} text-white border-0`}
                    >
                      {challenge.type.replace('_', ' ')}
                    </Badge>
                    {challenge.time_remaining_hours && challenge.time_remaining_hours > 0 && (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatTimeRemaining(challenge.time_remaining_hours)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {isCompleted && (
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">+{challenge.reward_points}</span>
                </div>
              )}
            </div>

            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">
                  {challenge.current_progress} / {challenge.target_value} {challenge.target_type}
                </span>
                <span className={`font-medium ${
                  isCompleted ? 'text-emerald-400' : 'text-blue-400'
                }`}>
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              
              <div className="relative">
                <Progress 
                  value={progressPercentage} 
                  className="h-2 bg-slate-700/50"
                />
                <div 
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-emerald-400 to-green-400'
                      : getProgressColor(progressPercentage)
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Completed overlay */}
            {isCompleted && (
              <div className="absolute inset-0 rounded-lg bg-emerald-500/10 border border-emerald-400/30 pointer-events-none" />
            )}
          </div>
        );
      })}
    </div>
  );
}
