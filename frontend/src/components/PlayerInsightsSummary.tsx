


import React from 'react';
import { useQuery } from '@tanstack/react-query';
import brain from 'brain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Calendar, Clock } from 'lucide-react';
import { PlayerInsightsSummaryResponse } from 'types';
import { PlayerCoachingRecommendations } from './PlayerCoachingRecommendations';
import { MissionSpeedGauge } from './MissionSpeedGauge';
import { ObjectiveStatusBoard } from './ObjectiveStatusBoard';

export interface Props {
  playerName: string;
}

const PlayerInsightsSummary: React.FC<Props> = ({ playerName }) => {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['playerInsightsSummary', playerName],
    queryFn: async (): Promise<PlayerInsightsSummaryResponse> => {
      const response = await brain.get_player_insights_summary({ player_name: playerName, range: 'Q' });
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-800/50 border-purple-800/30">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-700 rounded mb-4"></div>
                <div className="h-20 bg-slate-700 rounded mb-4"></div>
                <div className="h-3 bg-slate-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-4">
        {/* Cosmic Loading State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-500/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-cyan-300 mb-2">Mission Objectives</h3>
              <p className="text-cyan-100/70 text-sm">Syncing with command center...</p>
              <div className="mt-4 h-2 bg-cyan-900/50 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/50 to-fuchsia-900/50 border border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-fuchsia-500 rounded-full flex items-center justify-center animate-pulse">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-purple-300 mb-2">Velocity Status</h3>
              <p className="text-purple-100/70 text-sm">Calculating warp speed...</p>
              <div className="mt-4 h-2 bg-purple-900/50 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-purple-400 to-fuchsia-500 rounded-full animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-slate-800/60 to-indigo-900/60 border border-indigo-500/30 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-indigo-300 mb-3">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Mission Control Status</span>
            </div>
            <p className="text-indigo-100/70 text-sm">Establishing secure connection to command center...</p>
            <div className="mt-4 flex justify-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping delay-100"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping delay-200"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ProgressDonut: React.FC<{ 
    title: string;
    current: number;
    target: number;
    percentage: number;
    remaining: number;
    color: string;
    icon: React.ReactNode;
  }> = ({ title, current, target, percentage, remaining, color, icon }) => {
    return (
      <Card className="bg-slate-800/50 border-purple-800/30 hover:bg-slate-800/70 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="font-semibold text-white">{title}</h3>
            </div>
            <Badge 
              variant="outline" 
              className={`${color} border-0 text-white`}
            >
              {percentage.toFixed(0)}%
            </Badge>
          </div>
          
          <div className="space-y-4">
            {/* Progress circle simulation with Progress bar */}
            <div className="relative">
              <Progress 
                value={percentage} 
                className={`h-3 ${color.includes('blue') ? 'bg-blue-900/30' : 
                           color.includes('green') ? 'bg-green-900/30' : 
                           color.includes('purple') ? 'bg-purple-900/30' : 'bg-orange-900/30'}`}
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-purple-300">
                {current} / {target}
              </span>
              <span className="text-slate-400">
                {remaining} to go
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getPaceStatusColor = (status: string) => {
    switch (status) {
      case 'ahead': return 'bg-green-600';
      case 'on_track': return 'bg-blue-600';
      case 'behind': return 'bg-red-600';
      default: return 'bg-slate-600';
    }
  };

  const getPaceStatusText = (status: string) => {
    switch (status) {
      case 'ahead': return '🚀 Ahead of pace';
      case 'on_track': return '✅ On track';
      case 'behind': return '⚠️ Behind pace';
      default: return '📊 Calculating...';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quarter Context */}
      <Card className="bg-gradient-to-r from-purple-800/30 to-blue-800/30 border-purple-600/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="h-6 w-6 text-purple-300" />
              <div>
                <h2 className="text-xl font-bold text-white">{summary.quarter_name}</h2>
                <p className="text-purple-300">
                  Day {summary.days_elapsed} of {summary.days_elapsed + summary.days_remaining} 
                  • {summary.quarter_progress_percentage.toFixed(0)}% complete
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-300">Last updated</p>
              <p className="text-white font-medium">
                {new Date(summary.last_updated).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Europe/Oslo'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replace Progress Donuts with Objective Status Board */}
      <ObjectiveStatusBoard 
        objectives={{
          books: summary.books,
          opps: summary.opps, 
          deals: summary.deals,
          points: summary.points
        }}
        quarterProgress={summary.quarter_progress_percentage}
        daysRemaining={summary.days_remaining}
      />

      {/* Replace Pace Analysis with Mission Speed Gauge */}
      <MissionSpeedGauge 
        deltaPerDay={summary.pace.delta_per_day}
        currentPerDay={summary.pace.current_per_day}
        targetPerDay={summary.pace.target_per_day}
        status={summary.pace.status}
        daysRemaining={summary.days_remaining}
      />

      {/* Smart Coaching Recommendations */}
      <PlayerCoachingRecommendations summary={summary} />

      {/* Next Milestones */}
      {summary.next_milestones.length > 0 && (
        <Card className="bg-slate-800/50 border-purple-800/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-purple-400" />
              Next Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.next_milestones.map((milestone, index) => (
                <div 
                  key={index}
                  className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-700/30"
                >
                  <p className="text-white font-medium">{milestone.description}</p>
                  <p className="text-purple-300 text-sm mt-1">
                    {milestone.threshold_percentage}% milestone
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { PlayerInsightsSummary };
