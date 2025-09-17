import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Target, AlertTriangle, Clock, Zap, TrendingUp } from 'lucide-react';

export interface ObjectiveStatusBoardProps {
  objectives: {
    books: { current: number; target: number; percentage: number; remaining: number };
    opps: { current: number; target: number; percentage: number; remaining: number };
    deals: { current: number; target: number; percentage: number; remaining: number };
    points: { current: number; target: number; percentage: number; remaining: number };
  };
  quarterProgress: number; // percentage of quarter elapsed
  daysRemaining: number;
}

const ObjectiveStatusBoard: React.FC<ObjectiveStatusBoardProps> = ({ 
  objectives, 
  quarterProgress, 
  daysRemaining 
}) => {
  // Determine objective status based on progress vs time
  const getObjectiveStatus = (percentage: number, quarterProgress: number) => {
    if (percentage >= 100) {
      return { 
        status: 'complete', 
        icon: CheckCircle, 
        color: 'text-green-400', 
        bg: 'bg-green-500/20', 
        border: 'border-green-500/30',
        label: '✅ Complete',
        message: 'Mission accomplished!' 
      };
    }
    
    const expectedProgress = quarterProgress;
    const progressDiff = percentage - expectedProgress;
    
    if (progressDiff >= 10) {
      return { 
        status: 'ahead', 
        icon: TrendingUp, 
        color: 'text-cyan-400', 
        bg: 'bg-cyan-500/20', 
        border: 'border-cyan-500/30',
        label: '🚀 Ahead',
        message: 'Excellent pace!' 
      };
    }
    
    if (progressDiff >= -5) {
      return { 
        status: 'on_track', 
        icon: Target, 
        color: 'text-blue-400', 
        bg: 'bg-blue-500/20', 
        border: 'border-blue-500/30',
        label: '🎯 On Track',
        message: 'Right on schedule' 
      };
    }
    
    if (progressDiff >= -20) {
      return { 
        status: 'behind', 
        icon: Clock, 
        color: 'text-orange-400', 
        bg: 'bg-orange-500/20', 
        border: 'border-orange-500/30',
        label: '⚠️ Behind',
        message: 'Needs acceleration' 
      };
    }
    
    return { 
      status: 'at_risk', 
      icon: AlertTriangle, 
      color: 'text-red-400', 
      bg: 'bg-red-500/20', 
      border: 'border-red-500/30',
      label: '🚨 At Risk',
      message: 'Critical focus needed' 
    };
  };

  const objectivesList = [
    {
      name: 'Books',
      data: objectives.books,
      icon: <Target className="w-5 h-5" />,
      description: 'New meetings booked'
    },
    {
      name: 'Opportunities',
      data: objectives.opps,
      icon: <Zap className="w-5 h-5" />,
      description: 'Qualified prospects'
    },
    {
      name: 'Deals',
      data: objectives.deals,
      icon: <CheckCircle className="w-5 h-5" />,
      description: 'Closed deals'
    },
    {
      name: 'Points',
      data: objectives.points,
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Total mission points'
    }
  ];

  // Calculate overall mission status
  const overallProgress = objectivesList.reduce((sum, obj) => sum + obj.data.percentage, 0) / objectivesList.length;
  const overallStatus = getObjectiveStatus(overallProgress, quarterProgress);
  
  // Count objectives by status
  const statusCounts = objectivesList.reduce((counts, obj) => {
    const status = getObjectiveStatus(obj.data.percentage, quarterProgress).status;
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  return (
    <Card className="bg-gradient-to-br from-slate-800/70 to-purple-900/70 border border-purple-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600`}>
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">Objective Status Board</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${overallStatus.bg} ${overallStatus.color} border-0 text-sm`}>
                {overallStatus.label}
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300 border-0 text-sm">
                {daysRemaining} days remaining
              </Badge>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mission Overview */}
        <div className={`p-4 rounded-lg ${overallStatus.bg} border ${overallStatus.border}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Overall Mission Status:</span>
            <div className="flex items-center gap-2">
              <overallStatus.icon className={`w-5 h-5 ${overallStatus.color}`} />
              <span className={`${overallStatus.color} font-bold`}>
                {overallProgress.toFixed(0)}% Complete
              </span>
            </div>
          </div>
          <p className={`${overallStatus.color} text-sm`}>
            {overallStatus.message} • Quarter is {quarterProgress.toFixed(0)}% complete
          </p>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { status: 'complete', label: 'Complete', icon: '✅', color: 'text-green-400' },
            { status: 'ahead', label: 'Ahead', icon: '🚀', color: 'text-cyan-400' },
            { status: 'on_track', label: 'On Track', icon: '🎯', color: 'text-blue-400' },
            { status: 'behind', label: 'Behind', icon: '⚠️', color: 'text-orange-400' },
            { status: 'at_risk', label: 'At Risk', icon: '🚨', color: 'text-red-400' }
          ].filter(item => statusCounts[item.status] > 0).map((item) => (
            <div key={item.status} className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className={`text-2xl font-bold ${item.color}`}>
                {statusCounts[item.status] || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {item.icon} {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Individual Objectives */}
        <div className="space-y-4">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            Mission Objectives
          </h4>
          
          {objectivesList.map((objective, index) => {
            const status = getObjectiveStatus(objective.data.percentage, quarterProgress);
            const StatusIcon = status.icon;
            
            return (
              <div key={index} className={`p-4 rounded-lg ${status.bg} border ${status.border}`}>
                {/* Objective Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${status.bg} border ${status.border}`}>
                      <span className={status.color}>{objective.icon}</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-white">{objective.name}</h5>
                      <p className="text-sm text-slate-400">{objective.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${status.bg} ${status.color} border-0`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </div>
                
                {/* Progress Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">
                      {objective.data.current} / {objective.data.target}
                    </span>
                    <span className={`${status.color} font-bold`}>
                      {objective.data.percentage.toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress 
                      value={objective.data.percentage} 
                      className="h-3 bg-slate-700/50" 
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">
                        {objective.data.remaining} remaining
                      </span>
                      <span className={status.color}>
                        {status.message}
                      </span>
                    </div>
                  </div>
                  
                  {/* Time vs Progress Indicator */}
                  <div className="pt-2 border-t border-slate-700/50">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Expected progress</span>
                      <span className="text-slate-300">{quarterProgress.toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={quarterProgress} 
                      className="h-1 bg-slate-800" 
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Items (if needed) */}
        {(statusCounts.behind > 0 || statusCounts.at_risk > 0) && (
          <div className="p-4 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-white font-medium mb-2">Mission Command Recommendations:</p>
                <ul className="text-amber-100 text-sm space-y-1">
                  {statusCounts.at_risk > 0 && <li>• Focus immediately on at-risk objectives</li>}
                  {statusCounts.behind > 0 && <li>• Accelerate progress on behind-schedule items</li>}
                  <li>• Consider reallocating time from ahead objectives</li>
                  <li>• Schedule daily progress check-ins</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { ObjectiveStatusBoard };
