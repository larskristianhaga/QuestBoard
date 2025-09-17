
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import brain from 'brain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { PlayerInsightsTimeseriesResponse } from 'types';

export interface Props {
  playerName: string;
}

const PlayerInsightsTimeseries: React.FC<Props> = ({ playerName }) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('books');
  const [timeRange, setTimeRange] = useState<number>(30); // days

  // Calculate date range
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: timeseries, isLoading, error } = useQuery({
    queryKey: ['playerInsightsTimeseries', playerName, selectedMetric, startDate, endDate],
    queryFn: async (): Promise<PlayerInsightsTimeseriesResponse> => {
      const response = await brain.get_player_insights_timeseries({
        player_name: playerName,
        metric: selectedMetric,
        granularity: 'daily',
        start: startDate,
        end: endDate
      });
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const metrics = [
    { key: 'books', label: 'Books', color: '#3B82F6', icon: '📚' },
    { key: 'opps', label: 'Opportunities', color: '#10B981', icon: '🎯' },
    { key: 'deals', label: 'Deals', color: '#8B5CF6', icon: '💰' },
    { key: 'calls', label: 'Calls', color: '#F59E0B', icon: '📞' },
    { key: 'lifts', label: 'Lifts', color: '#EF4444', icon: '🏋️' }
  ];

  const timeRanges = [
    { days: 7, label: '7 days' },
    { days: 30, label: '30 days' },
    { days: 60, label: '60 days' },
    { days: 90, label: '90 days' }
  ];

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border border-purple-500/30 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-400/50 rounded-full animate-pulse"></div>
              <div className="h-6 bg-purple-400/30 rounded w-32"></div>
            </div>
            <div className="h-64 bg-purple-400/20 rounded-lg flex items-center justify-center">
              <div className="text-purple-300 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 animate-bounce" />
                <p className="text-sm">Analyzing velocity patterns...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !timeseries) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border border-purple-500/30 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center animate-pulse">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-purple-300 mb-3">Velocity Trends Portal</h3>
          <p className="text-purple-100/70 mb-6">Calibrating hyperdrive sensors and temporal analyzers...</p>
          
          {/* Mock velocity visualization */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-purple-200 text-sm">Warp Speed</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-3 h-8 rounded-sm ${i < 3 ? 'bg-gradient-to-t from-purple-600 to-purple-400' : 'bg-purple-800/50'} animate-pulse`} style={{animationDelay: `${i * 100}ms`}}></div>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-200 text-sm">Momentum</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-3 h-6 rounded-sm ${i < 4 ? 'bg-gradient-to-t from-indigo-600 to-indigo-400' : 'bg-indigo-800/50'} animate-pulse`} style={{animationDelay: `${i * 150}ms`}}></div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedMetricInfo = metrics.find(m => m.key === selectedMetric);
  const chartData = timeseries.data.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    value: point.value,
    fullDate: point.date
  }));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-slate-800/50 border-purple-800/30">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            {/* Metric Selection */}
            <div className="space-y-2">
              <p className="text-sm text-purple-300">Select Metric:</p>
              <div className="flex flex-wrap gap-2">
                {metrics.map(metric => (
                  <Button
                    key={metric.key}
                    variant={selectedMetric === metric.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMetric(metric.key)}
                    className={selectedMetric === metric.key 
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0" 
                      : "border-purple-700 text-purple-300 hover:bg-purple-800/30"
                    }
                  >
                    {metric.icon} {metric.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Range Selection */}
            <div className="space-y-2">
              <p className="text-sm text-purple-300">Time Range:</p>
              <div className="flex gap-2">
                {timeRanges.map(range => (
                  <Button
                    key={range.days}
                    variant={timeRange === range.days ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range.days)}
                    className={timeRange === range.days 
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0" 
                      : "border-purple-700 text-purple-300 hover:bg-purple-800/30"
                    }
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="bg-slate-800/50 border-purple-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            {selectedMetricInfo?.icon} {selectedMetricInfo?.label} Trend
          </CardTitle>
          <div className="flex gap-4 text-sm">
            {timeseries.seven_day_average && (
              <Badge variant="outline" className="border-blue-600 text-blue-400">
                7-day avg: {timeseries.seven_day_average.toFixed(1)}
              </Badge>
            )}
            <Badge variant="outline" className="border-purple-600 text-purple-400">
              Total: {chartData.reduce((sum, point) => sum + point.value, 0)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  labelStyle={{ color: '#D1D5DB' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={selectedMetricInfo?.color || '#8B5CF6'} 
                  strokeWidth={3}
                  dot={{ fill: selectedMetricInfo?.color || '#8B5CF6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: selectedMetricInfo?.color || '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart Alternative */}
      <Card className="bg-slate-800/50 border-purple-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            Daily Activity Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill={selectedMetricInfo?.color || '#8B5CF6'}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { PlayerInsightsTimeseries };
