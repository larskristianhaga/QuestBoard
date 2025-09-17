import React from 'react';
import { useQuery } from '@tanstack/react-query';
import brain from 'brain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Flame, TrendingUp, Calendar } from 'lucide-react';
import { PlayerInsightsStreaksResponse } from 'types';

export interface Props {
  playerName: string;
}

const PlayerInsightsStreaks: React.FC<Props> = ({ playerName }) => {
  const { data: streaks, isLoading, error } = useQuery({
    queryKey: ['playerInsightsStreaks', playerName],
    queryFn: async (): Promise<PlayerInsightsStreaksResponse> => {
      const response = await brain.get_player_insights_streaks({ player_name: playerName });
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-slate-800/50 border-purple-800/30">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-slate-700 rounded mb-4 w-1/3"></div>
                <div className="h-20 bg-slate-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !streaks) {
    return (
      <Card className="bg-slate-800/50 border-red-800/30">
        <CardContent className="p-6 text-center">
          <p className="text-red-400">Failed to load streaks data</p>
        </CardContent>
      </Card>
    );
  }

  const getStreakColor = (days: number) => {
    if (days >= 14) return 'from-yellow-500 to-orange-500';
    if (days >= 7) return 'from-green-500 to-emerald-500';
    if (days >= 3) return 'from-blue-500 to-cyan-500';
    return 'from-purple-500 to-pink-500';
  };

  const getStreakLevel = (days: number) => {
    if (days >= 21) return { level: 'Legendary', icon: '🏆', description: 'Unstoppable!' };
    if (days >= 14) return { level: 'Epic', icon: '⚡', description: 'On fire!' };
    if (days >= 7) return { level: 'Strong', icon: '🔥', description: 'Great momentum!' };
    if (days >= 3) return { level: 'Building', icon: '💪', description: 'Good start!' };
    return { level: 'Starting', icon: '🌱', description: 'Keep it up!' };
  };

  const currentStreakInfo = getStreakLevel(streaks.streaks.current_activity_streak_days);
  const longestStreakInfo = getStreakLevel(streaks.streaks.longest_activity_streak_days);

  return (
    <div className="space-y-6">
      {/* Quarter Context */}
      <Card className="bg-gradient-to-r from-purple-800/30 to-blue-800/30 border-purple-600/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Achievements & Streaks</h2>
              <p className="text-purple-300">{streaks.quarter_name}</p>
            </div>
            <Award className="h-8 w-8 text-yellow-400" />
          </div>
        </CardContent>
      </Card>

      {/* Current vs Longest Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Streak */}
        <Card className="bg-slate-800/50 border-purple-800/30 overflow-hidden">
          <CardContent className="p-0">
            <div className={`bg-gradient-to-r ${getStreakColor(streaks.streaks.current_activity_streak_days)} p-6`}>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Flame className="h-8 w-8" />
                  <div>
                    <p className="text-sm opacity-90">Current Streak</p>
                    <p className="text-3xl font-bold">
                      {streaks.streaks.current_activity_streak_days} days
                    </p>
                  </div>
                </div>
                <div className="text-4xl">{currentStreakInfo.icon}</div>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 mb-2">
                  {currentStreakInfo.level} Level
                </Badge>
                <p className="text-purple-300 text-sm">{currentStreakInfo.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Longest Streak */}
        <Card className="bg-slate-800/50 border-purple-800/30 overflow-hidden">
          <CardContent className="p-0">
            <div className={`bg-gradient-to-r ${getStreakColor(streaks.streaks.longest_activity_streak_days)} p-6`}>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8" />
                  <div>
                    <p className="text-sm opacity-90">Personal Best</p>
                    <p className="text-3xl font-bold">
                      {streaks.streaks.longest_activity_streak_days} days
                    </p>
                  </div>
                </div>
                <div className="text-4xl">{longestStreakInfo.icon}</div>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center">
                <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-0 mb-2">
                  {longestStreakInfo.level} Record
                </Badge>
                <p className="text-purple-300 text-sm">
                  {streaks.streaks.current_activity_streak_days === streaks.streaks.longest_activity_streak_days 
                    ? "You're at your personal best!" 
                    : `${streaks.streaks.longest_activity_streak_days - streaks.streaks.current_activity_streak_days} days to beat your record`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best Week Performance */}
      <Card className="bg-slate-800/50 border-purple-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-purple-400" />
            Best Week Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg border border-green-700/30">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📚</div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {streaks.streaks.best_week_books} books
                </p>
                <p className="text-green-300">
                  Week of {streaks.streaks.best_week_period}
                </p>
              </div>
            </div>
            <Badge className="bg-green-600 text-white border-0">
              Personal Best
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {streaks.streaks.recent_achievements.length > 0 && (
        <Card className="bg-slate-800/50 border-purple-800/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Award className="h-5 w-5 text-purple-400" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {streaks.streaks.recent_achievements.map((achievement, index) => (
                <div 
                  key={index}
                  className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-4 border border-yellow-700/30"
                >
                  <p className="text-white font-medium text-center">{achievement}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Streak Progress Visualization */}
      <Card className="bg-slate-800/50 border-purple-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Flame className="h-5 w-5 text-purple-400" />
            Streak Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Streak Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-purple-300">Current Streak</span>
              <span className="text-white">
                {streaks.streaks.current_activity_streak_days} / {streaks.streaks.longest_activity_streak_days} days
              </span>
            </div>
            <Progress 
              value={(streaks.streaks.current_activity_streak_days / Math.max(streaks.streaks.longest_activity_streak_days, 1)) * 100} 
              className="h-3"
            />
          </div>

          {/* Next Milestones */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[7, 14, 21, 30].map(milestone => {
              const achieved = streaks.streaks.current_activity_streak_days >= milestone;
              const isNext = !achieved && milestone > streaks.streaks.current_activity_streak_days;
              
              return (
                <div 
                  key={milestone}
                  className={`
                    text-center p-3 rounded-lg border transition-all
                    ${achieved 
                      ? 'bg-green-900/30 border-green-700/50 text-green-300' 
                      : isNext 
                        ? 'bg-blue-900/30 border-blue-700/50 text-blue-300' 
                        : 'bg-slate-700/30 border-slate-600/30 text-slate-400'
                    }
                  `}
                >
                  <p className="text-xl font-bold">{milestone}</p>
                  <p className="text-xs">
                    {achieved ? '✅ Achieved' : isNext ? '🎯 Next goal' : '⏳ Future'}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { PlayerInsightsStreaks };
