import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Target, Calendar, Zap } from 'lucide-react';

export interface MissionCountdownProps {
  predictions: {
    books_days_to_goal: number | null;
    opps_days_to_goal: number | null;
    deals_days_to_goal: number | null;
    points_days_to_goal: number | null;
    likelihood_to_achieve_all: string;
  };
  quarterDaysRemaining: number;
  currentProgress: {
    books: { current: number; target: number };
    opps: { current: number; target: number };
    deals: { current: number; target: number };
    points: { current: number; target: number };
  };
}

const MissionCountdown: React.FC<MissionCountdownProps> = ({ 
  predictions, 
  quarterDaysRemaining, 
  currentProgress 
}) => {
  // Helper to format days with context
  const formatDaysToGoal = (days: number | null, goalType: string) => {
    if (days === null || days === undefined) {
      return { text: 'Calculating trajectory...', status: 'unknown', color: 'text-slate-400' };
    }
    if (days === 0) {
      return { text: '🎆 Mission Complete!', status: 'achieved', color: 'text-green-400' };
    }
    if (days < 0) {
      return { text: '🎆 Already achieved!', status: 'achieved', color: 'text-green-400' };
    }
    if (days > quarterDaysRemaining) {
      return { 
        text: `⚠️ Needs ${days} days (${days - quarterDaysRemaining} over quarter)`, 
        status: 'at-risk', 
        color: 'text-red-400' 
      };
    }
    if (days > quarterDaysRemaining * 0.9) {
      return { 
        text: `🔥 ${days} days (cutting it close!)`, 
        status: 'tight', 
        color: 'text-orange-400' 
      };
    }
    return { 
      text: `🎯 ${days} days (on track)`, 
      status: 'on-track', 
      color: 'text-blue-400' 
    };
  };

  // Calculate urgency level
  const getUrgencyLevel = () => {
    const goals = [
      { days: predictions.books_days_to_goal, name: 'Books' },
      { days: predictions.opps_days_to_goal, name: 'Opportunities' },
      { days: predictions.deals_days_to_goal, name: 'Deals' },
      { days: predictions.points_days_to_goal, name: 'Points' }
    ];
    
    const validGoals = goals.filter(g => g.days !== null && g.days > 0);
    const atRiskGoals = validGoals.filter(g => g.days! > quarterDaysRemaining);
    const tightGoals = validGoals.filter(g => g.days! > quarterDaysRemaining * 0.9 && g.days! <= quarterDaysRemaining);
    
    if (atRiskGoals.length > 0) {
      return { level: 'critical', color: 'text-red-400', bg: 'bg-red-500/20', icon: '🚨' };
    }
    if (tightGoals.length > 0) {
      return { level: 'urgent', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: '🔥' };
    }
    return { level: 'normal', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: '🎯' };
  };

  const urgency = getUrgencyLevel();
  
  const missions = [
    {
      name: 'Books',
      days: predictions.books_days_to_goal,
      current: currentProgress.books.current,
      target: currentProgress.books.target,
      icon: <Target className="w-4 h-4" />
    },
    {
      name: 'Opportunities',
      days: predictions.opps_days_to_goal,
      current: currentProgress.opps.current,
      target: currentProgress.opps.target,
      icon: <Zap className="w-4 h-4" />
    },
    {
      name: 'Deals',
      days: predictions.deals_days_to_goal,
      current: currentProgress.deals.current,
      target: currentProgress.deals.target,
      icon: <Calendar className="w-4 h-4" />
    },
    {
      name: 'Points',
      days: predictions.points_days_to_goal,
      current: currentProgress.points.current,
      target: currentProgress.points.target,
      icon: <Clock className="w-4 h-4" />
    }
  ];

  // Get mission command message
  const getMissionCommand = () => {
    if (predictions.likelihood_to_achieve_all === 'high') {
      return '🚀 Excellent trajectory! All systems green for mission success. Maintain current velocity.';
    }
    if (predictions.likelihood_to_achieve_all === 'medium') {
      return '⚡ Moderate challenge ahead. Focus on critical objectives to ensure mission completion.';
    }
    if (predictions.likelihood_to_achieve_all === 'low') {
      return '🔥 Mission critical! Immediate action required. Prioritize highest-impact activities.';
    }
    return '🚨 Mission at extreme risk! Emergency protocols needed. Contact command for support.';
  };

  return (
    <Card className={`bg-gradient-to-br from-slate-800/70 to-amber-900/70 border border-amber-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600`}>
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">Mission Countdown</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${urgency.bg} ${urgency.color} border-0 text-sm`}>
                {urgency.icon} {urgency.level.charAt(0).toUpperCase() + urgency.level.slice(1)}
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-300 border-0 text-sm">
                {quarterDaysRemaining} days left in quarter
              </Badge>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mission Status Overview */}
        <div className={`p-4 rounded-lg ${urgency.bg} border border-amber-500/30`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Mission Likelihood:</span>
            <Badge className={`${
              predictions.likelihood_to_achieve_all === 'high' ? 'bg-green-500/20 text-green-300' :
              predictions.likelihood_to_achieve_all === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
              predictions.likelihood_to_achieve_all === 'low' ? 'bg-orange-500/20 text-orange-300' :
              'bg-red-500/20 text-red-300'
            } border-0 font-bold`}>
              {predictions.likelihood_to_achieve_all.toUpperCase()}
            </Badge>
          </div>
          <p className="text-amber-100 text-sm">
            {getMissionCommand()}
          </p>
        </div>

        {/* Individual Mission Countdown */}
        <div className="space-y-4">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            Objective Countdown
          </h4>
          
          {missions.map((mission, index) => {
            const formatted = formatDaysToGoal(mission.days, mission.name);
            const progressPercent = mission.target > 0 ? (mission.current / mission.target) * 100 : 0;
            
            return (
              <div key={index} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">{mission.icon}</span>
                    <span className="text-white font-medium">{mission.name}</span>
                    <span className="text-slate-400 text-sm">({mission.current}/{mission.target})</span>
                  </div>
                  <span className={`${formatted.color} text-sm font-medium`}>
                    {formatted.text}
                  </span>
                </div>
                
                {/* Progress visualization */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-slate-300">{progressPercent.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2 bg-slate-700" />
                </div>
                
                {/* Time pressure indicator */}
                {mission.days !== null && mission.days > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Time pressure</span>
                      <span className={formatted.color}>
                        {((mission.days / quarterDaysRemaining) * 100).toFixed(0)}% of quarter
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, (mission.days / quarterDaysRemaining) * 100)} 
                      className="h-1 bg-slate-800 mt-1" 
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Emergency Actions (if needed) */}
        {urgency.level === 'critical' && (
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="text-white font-medium mb-1">Emergency Protocol:</p>
                <ul className="text-red-200 text-sm space-y-1">
                  <li>• Focus only on objectives that can realistically be achieved</li>
                  <li>• Contact team lead for goal adjustment discussions</li>
                  <li>• Implement daily checkpoint reviews</li>
                  <li>• Consider team collaboration opportunities</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { MissionCountdown };
