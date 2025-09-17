import React from 'react';
import { useQuery } from '@tanstack/react-query';
import brain from 'brain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Lightbulb } from 'lucide-react';
import { PlayerInsightsHeatmapResponse } from 'types';

export interface Props {
  playerName: string;
}

const PlayerInsightsHeatmap: React.FC<Props> = ({ playerName }) => {
  // Calculate date range for current quarter (last 90 days as approximation)
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: heatmap, isLoading, error } = useQuery({
    queryKey: ['playerInsightsHeatmap', playerName, startDate, endDate],
    queryFn: async (): Promise<PlayerInsightsHeatmapResponse> => {
      const response = await brain.get_player_insights_heatmap({
        player_name: playerName,
        start: startDate,
        end: endDate
      });
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="bg-slate-800/50 border-purple-800/30">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-slate-700 rounded mb-4 w-1/3"></div>
                <div className="grid grid-cols-8 gap-2">
                  {[...Array(24)].map((_, j) => (
                    <div key={j} className="h-12 bg-slate-700 rounded"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !heatmap) {
    return (
      <Card className="bg-slate-800/50 border-red-800/30">
        <CardContent className="p-6 text-center">
          <p className="text-red-400">Failed to load heatmap data</p>
        </CardContent>
      </Card>
    );
  }

  const getHeatmapColor = (value: number, maxValue: number) => {
    if (maxValue === 0) return 'bg-slate-700/50';
    const intensity = value / maxValue;
    if (intensity === 0) return 'bg-slate-700/50';
    if (intensity <= 0.2) return 'bg-blue-900/60';
    if (intensity <= 0.4) return 'bg-blue-800/70';
    if (intensity <= 0.6) return 'bg-blue-700/80';
    if (intensity <= 0.8) return 'bg-blue-600/90';
    return 'bg-gradient-to-br from-blue-500 to-purple-500';
  };

  const maxHourlyValue = Math.max(...heatmap.by_hour.map(h => h.value));
  const maxWeeklyValue = Math.max(...heatmap.by_weekday.map(w => w.value));

  return (
    <div className="space-y-6">
      {/* Period Info & Coaching Hint */}
      <Card className="bg-gradient-to-r from-purple-800/30 to-blue-800/30 border-purple-600/30">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Activity Heatmap</h2>
              <p className="text-purple-300">
                {new Date(heatmap.start_date).toLocaleDateString('en-GB')} - {new Date(heatmap.end_date).toLocaleDateString('en-GB')}
              </p>
            </div>
            
            {heatmap.coaching_hint && (
              <div className="flex items-start gap-3 bg-yellow-900/30 px-4 py-3 rounded-lg border border-yellow-700/30 max-w-md">
                <Lightbulb className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-300 text-sm font-medium mb-1">💡 Coaching Hint</p>
                  <p className="text-yellow-100 text-sm">{heatmap.coaching_hint}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Peak Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {heatmap.best_hour && (
          <Card className="bg-slate-800/50 border-purple-800/30">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Peak Hour</h3>
              <p className="text-3xl font-bold text-blue-400 mb-1">{heatmap.best_hour}</p>
              <p className="text-slate-400 text-sm">Most active time of day</p>
            </CardContent>
          </Card>
        )}
        
        {heatmap.best_weekday && (
          <Card className="bg-slate-800/50 border-purple-800/30">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Peak Day</h3>
              <p className="text-3xl font-bold text-green-400 mb-1">{heatmap.best_weekday}</p>
              <p className="text-slate-400 text-sm">Most active day of week</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hourly Heatmap */}
      <Card className="bg-slate-800/50 border-purple-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="h-5 w-5 text-purple-400" />
            Activity by Hour
          </CardTitle>
          <p className="text-slate-400 text-sm">When during the day are you most active?</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 md:grid-cols-12 gap-2">
            {heatmap.by_hour.map((hour) => {
              const isActive = hour.value > 0;
              const isPeak = heatmap.best_hour === hour.label;
              
              return (
                <div
                  key={hour.period}
                  className={`
                    relative aspect-square rounded-lg border transition-all duration-200 hover:scale-105
                    ${getHeatmapColor(hour.value, maxHourlyValue)}
                    ${isPeak ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900' : ''}
                    ${isActive ? 'border-purple-600/50' : 'border-slate-600/30'}
                  `}
                  title={`${hour.label}: ${hour.value} activities`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                    <span className="text-white text-xs font-medium">
                      {hour.label.substring(0, 2)}
                    </span>
                    {hour.value > 0 && (
                      <span className="text-white text-xs opacity-90">
                        {hour.value}
                      </span>
                    )}
                  </div>
                  {isPeak && (
                    <div className="absolute -top-1 -right-1">
                      <Badge className="bg-yellow-500 text-yellow-900 text-xs px-1 py-0 h-4">
                        ⭐
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center gap-4 mt-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-700/50 rounded"></div>
              <span>No activity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-900/60 rounded"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600/90 rounded"></div>
              <span>High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded"></div>
              <span>Peak</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Heatmap */}
      <Card className="bg-slate-800/50 border-purple-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-purple-400" />
            Activity by Day of Week
          </CardTitle>
          <p className="text-slate-400 text-sm">Which days of the week are you most productive?</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3">
            {heatmap.by_weekday.map((day) => {
              const isActive = day.value > 0;
              const isPeak = heatmap.best_weekday === day.label;
              
              return (
                <div
                  key={day.period}
                  className={`
                    relative rounded-lg border transition-all duration-200 hover:scale-105 p-4
                    ${getHeatmapColor(day.value, maxWeeklyValue)}
                    ${isPeak ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900' : ''}
                    ${isActive ? 'border-purple-600/50' : 'border-slate-600/30'}
                  `}
                  title={`${day.label}: ${day.value} activities`}
                >
                  <div className="text-center">
                    <p className="text-white font-medium text-sm mb-1">
                      {day.label.substring(0, 3)}
                    </p>
                    <p className="text-white text-lg font-bold">
                      {day.value}
                    </p>
                  </div>
                  {isPeak && (
                    <div className="absolute -top-1 -right-1">
                      <Badge className="bg-yellow-500 text-yellow-900 text-xs px-1 py-0 h-5">
                        ⭐
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { PlayerInsightsHeatmap };
