import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, Trophy, Target } from 'lucide-react';

export interface SquadPerformanceMatrixProps {
  personalProgress: {
    books: { current: number; target: number; percentage: number };
    opps: { current: number; target: number; percentage: number };
    deals: { current: number; target: number; percentage: number };
    points: { current: number; target: number; percentage: number };
  };
  teamAverages: {
    books: number;
    opps: number;
    deals: number;
    points: number;
  };
  playerName: string;
}

const SquadPerformanceMatrix: React.FC<SquadPerformanceMatrixProps> = ({ 
  personalProgress, 
  teamAverages, 
  playerName 
}) => {
  // Calculate performance vs team for each metric
  const getPerformanceComparison = (personalPercent: number, teamPercent: number) => {
    const diff = personalPercent - teamPercent;
    if (diff >= 15) return { status: 'leading', icon: '🚀', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (diff >= 5) return { status: 'ahead', icon: '📈', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (diff >= -5) return { status: 'matched', icon: '🎯', color: 'text-purple-400', bg: 'bg-purple-500/20' };
    if (diff >= -15) return { status: 'trailing', icon: '⚡', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    return { status: 'behind', icon: '🔥', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const metrics = [
    {
      name: 'Books',
      personal: personalProgress.books.percentage,
      team: teamAverages.books,
      current: personalProgress.books.current,
      target: personalProgress.books.target,
      icon: <Target className="w-4 h-4" />
    },
    {
      name: 'Opportunities', 
      personal: personalProgress.opps.percentage,
      team: teamAverages.opps,
      current: personalProgress.opps.current,
      target: personalProgress.opps.target,
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      name: 'Deals',
      personal: personalProgress.deals.percentage,
      team: teamAverages.deals,
      current: personalProgress.deals.current,
      target: personalProgress.deals.target,
      icon: <Trophy className="w-4 h-4" />
    },
    {
      name: 'Points',
      personal: personalProgress.points.percentage,
      team: teamAverages.points,
      current: personalProgress.points.current,
      target: personalProgress.points.target,
      icon: <Users className="w-4 h-4" />
    }
  ];

  // Calculate overall squad standing
  const overallPersonal = metrics.reduce((sum, m) => sum + m.personal, 0) / metrics.length;
  const overallTeam = metrics.reduce((sum, m) => sum + m.team, 0) / metrics.length;
  const overallComparison = getPerformanceComparison(overallPersonal, overallTeam);

  return (
    <Card className="bg-gradient-to-br from-slate-800/70 to-indigo-900/70 border border-indigo-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">Squad Performance Matrix</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${overallComparison.bg} ${overallComparison.color} border-0 text-sm`}>
                {overallComparison.icon} {overallComparison.status.charAt(0).toUpperCase() + overallComparison.status.slice(1)}
              </Badge>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Performance Header */}
        <div className={`p-4 rounded-lg ${overallComparison.bg} border border-indigo-500/30`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Overall Squad Position:</span>
            <span className={`${overallComparison.color} font-bold text-lg`}>
              {overallComparison.icon} {(overallPersonal - overallTeam).toFixed(0)}% vs team
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-300">{overallPersonal.toFixed(0)}%</div>
              <div className="text-sm text-slate-300">{playerName}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">{overallTeam.toFixed(0)}%</div>
              <div className="text-sm text-slate-400">Team Average</div>
            </div>
          </div>
        </div>

        {/* Detailed Metric Comparison */}
        <div className="space-y-4">
          {metrics.map((metric, index) => {
            const comparison = getPerformanceComparison(metric.personal, metric.team);
            const diff = metric.personal - metric.team;
            
            return (
              <div key={index} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                {/* Metric Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400">{metric.icon}</span>
                    <span className="text-white font-medium">{metric.name}</span>
                    <span className="text-slate-400 text-sm">({metric.current}/{metric.target})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`${comparison.color} text-sm`}>{comparison.icon}</span>
                    <span className={`${comparison.color} font-medium text-sm`}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                {/* Progress Bars */}
                <div className="space-y-2">
                  {/* Personal Progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-indigo-300">You</span>
                      <span className="text-indigo-300">{metric.personal.toFixed(0)}%</span>
                    </div>
                    <Progress value={metric.personal} className="h-2 bg-slate-700" />
                  </div>
                  
                  {/* Team Average */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Team</span>
                      <span className="text-slate-400">{metric.team.toFixed(0)}%</span>
                    </div>
                    <Progress value={metric.team} className="h-2 bg-slate-800" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coaching Insight */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
          <div className="flex items-start gap-3">
            <Trophy className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-white font-medium mb-1">Squad Intel:</p>
              <p className="text-slate-300 text-sm">
                {overallComparison.status === 'leading' ? 
                  `🌟 Outstanding performance! You're leading the squad in overall progress. Keep setting the pace for your team!` :
                 overallComparison.status === 'ahead' ? 
                  `💪 Strong performance! You're ahead of team average. Consider mentoring others to boost squad performance.` :
                 overallComparison.status === 'matched' ? 
                  `🎯 Solid teamwork! You're matching squad pace perfectly. Great team player contribution.` :
                 overallComparison.status === 'trailing' ? 
                  `⚡ Opportunity alert! Focus on your strongest metrics to catch up with squad performance.` :
                  `🔥 Rally time! Connect with high-performing squad members for strategy sharing and support.`
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { SquadPerformanceMatrix };
