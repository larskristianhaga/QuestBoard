import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gauge, TrendingUp, Zap } from 'lucide-react';

export interface MissionSpeedGaugeProps {
  deltaPerDay: number; // positive = ahead, negative = behind
  currentPerDay: number;
  targetPerDay: number;
  status: string; // "ahead", "on_track", "behind"
  daysRemaining: number;
}

const MissionSpeedGauge: React.FC<MissionSpeedGaugeProps> = ({ 
  deltaPerDay, 
  currentPerDay, 
  targetPerDay, 
  status,
  daysRemaining 
}) => {
  // Calculate gauge value (0-100, with 50 being "on track")
  const gaugeValue = Math.max(0, Math.min(100, 50 + (deltaPerDay / targetPerDay) * 100));
  
  // Generate coaching message based on status
  const getCoachingMessage = () => {
    if (status === 'ahead') {
      return `🚀 Excellent pace! You're generating ${Math.abs(deltaPerDay).toFixed(1)} extra points per day. Keep this momentum!`;
    } else if (status === 'behind') {
      const needed = Math.abs(deltaPerDay);
      const newTarget = currentPerDay + needed;
      return `⚡ Speed up mission! You need ${needed.toFixed(1)} more points per day. Target: ${newTarget.toFixed(1)} points daily.`;
    } else {
      return `🎯 Perfect trajectory! You're maintaining optimal speed to reach your mission goals.`;
    }
  };

  const getGaugeColors = () => {
    if (status === 'ahead') return {
      from: 'from-green-500',
      to: 'to-emerald-400',
      accent: 'text-green-400',
      bg: 'bg-green-500/20',
      border: 'border-green-500/30'
    };
    if (status === 'behind') return {
      from: 'from-red-500', 
      to: 'to-orange-400',
      accent: 'text-red-400',
      bg: 'bg-red-500/20',
      border: 'border-red-500/30'
    };
    return {
      from: 'from-blue-500',
      to: 'to-cyan-400', 
      accent: 'text-blue-400',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30'
    };
  };

  const colors = getGaugeColors();
  const statusText = status === 'ahead' ? 'Warp Speed' : 
                    status === 'behind' ? 'Behind Schedule' : 
                    'On Target';

  return (
    <Card className={`bg-gradient-to-br from-slate-800/70 to-slate-900/70 border ${colors.border} backdrop-blur-sm hover:scale-105 transition-all duration-300`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colors.from} ${colors.to}`}>
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">Mission Speed Gauge</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${colors.bg} ${colors.accent} border-0 text-sm`}>
                {statusText}
              </Badge>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Speedometer Visual */}
        <div className="relative">
          <div className="text-center mb-4">
            <div className={`text-3xl font-bold ${colors.accent} mb-1`}>
              {currentPerDay.toFixed(1)}
            </div>
            <div className="text-sm text-slate-400">points per day</div>
          </div>
          
          {/* Progress gauge */}
          <div className="relative mb-4">
            <Progress 
              value={gaugeValue} 
              className="h-4 bg-slate-700/50"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>🐌 Slow</span>
              <span>🎯 Target: {targetPerDay.toFixed(1)}</span>
              <span>🚀 Fast</span>
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className={`p-4 rounded-lg ${colors.bg} ${colors.border} border`}>
          <div className="flex items-start gap-3">
            <TrendingUp className={`w-5 h-5 ${colors.accent} mt-0.5`} />
            <div className="flex-1">
              <p className="text-white text-sm font-medium mb-1">Mission Command:</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                {getCoachingMessage()}
              </p>
            </div>
          </div>
        </div>

        {/* Time Remaining */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-slate-300">Mission window:</span>
          </div>
          <span className="text-white font-medium">{daysRemaining} days remaining</span>
        </div>
      </CardContent>
    </Card>
  );
};

export { MissionSpeedGauge };
