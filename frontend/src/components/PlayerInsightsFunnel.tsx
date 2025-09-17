import React from 'react';
import { useQuery } from '@tanstack/react-query';
import brain from 'brain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { PlayerInsightsFunnelResponse } from 'types';

export interface Props {
  playerName: string;
}

const PlayerInsightsFunnel: React.FC<Props> = ({ playerName }) => {
  // Calculate date range for current quarter (last 90 days as approximation)
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: funnel, isLoading, error } = useQuery({
    queryKey: ['playerInsightsFunnel', playerName, startDate, endDate],
    queryFn: async (): Promise<PlayerInsightsFunnelResponse> => {
      const response = await brain.get_player_insights_funnel({
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
      <Card className="bg-slate-800/50 border-purple-800/30">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-700 rounded mb-4 w-1/3"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !funnel) {
    return (
      <Card className="bg-slate-800/50 border-red-800/30">
        <CardContent className="p-6 text-center">
          <p className="text-red-400">Failed to load funnel data</p>
        </CardContent>
      </Card>
    );
  }

  const stages = [
    { 
      name: 'Lifts', 
      value: funnel.funnel.lifts, 
      icon: '🏋️', 
      color: 'bg-red-600',
      nextStage: 'Calls',
      conversionRate: funnel.funnel.lifts_to_calls_rate
    },
    { 
      name: 'Calls', 
      value: funnel.funnel.calls, 
      icon: '📞', 
      color: 'bg-orange-600',
      nextStage: 'Books',
      conversionRate: funnel.funnel.calls_to_books_rate
    },
    { 
      name: 'Books', 
      value: funnel.funnel.books, 
      icon: '📚', 
      color: 'bg-blue-600',
      nextStage: 'Opportunities',
      conversionRate: funnel.funnel.books_to_opps_rate
    },
    { 
      name: 'Opportunities', 
      value: funnel.funnel.opps, 
      icon: '🎯', 
      color: 'bg-green-600',
      nextStage: 'Deals',
      conversionRate: funnel.funnel.opps_to_deals_rate
    },
    { 
      name: 'Deals', 
      value: funnel.funnel.deals, 
      icon: '💰', 
      color: 'bg-purple-600',
      nextStage: null,
      conversionRate: 0
    }
  ];

  const getConversionRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-400';
    if (rate >= 50) return 'text-yellow-400';
    if (rate >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const getConversionRateStatus = (rate: number) => {
    if (rate >= 70) return 'Excellent';
    if (rate >= 50) return 'Good';
    if (rate >= 30) return 'Fair';
    return 'Needs Improvement';
  };

  const maxValue = Math.max(...stages.map(s => s.value));

  return (
    <div className="space-y-6">
      {/* Period Info */}
      <Card className="bg-gradient-to-r from-purple-800/30 to-blue-800/30 border-purple-600/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Sales Funnel Analysis</h2>
              <p className="text-purple-300">
                {new Date(funnel.start_date).toLocaleDateString('en-GB')} - {new Date(funnel.end_date).toLocaleDateString('en-GB')}
              </p>
            </div>
            {funnel.funnel.weakest_stage !== 'none' && (
              <div className="flex items-center gap-2 bg-red-900/30 px-3 py-2 rounded-lg border border-red-700/30">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <div className="text-right">
                  <p className="text-red-400 text-sm font-medium">Weakest Stage</p>
                  <p className="text-white text-sm">
                    {funnel.funnel.weakest_stage.replace('_', ' → ')} ({funnel.funnel.weakest_stage_rate.toFixed(1)}%)
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Funnel Visualization */}
      <Card className="bg-slate-800/50 border-purple-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingDown className="h-5 w-5 text-purple-400" />
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {stages.map((stage, index) => {
            const widthPercentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
            const nextStage = stages[index + 1];
            
            return (
              <div key={stage.name} className="space-y-3">
                {/* Stage Bar */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{stage.icon}</span>
                      <span className="text-white font-medium">{stage.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold text-lg">{stage.value}</span>
                      {index < stages.length - 1 && (
                        <Badge 
                          className={`${getConversionRateColor(stage.conversionRate)} bg-slate-700/50 border-0`}
                        >
                          {stage.conversionRate.toFixed(1)}% → {stage.nextStage}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative h-8 bg-slate-700/30 rounded-lg overflow-hidden">
                    <div 
                      className={`h-full ${stage.color} transition-all duration-500 flex items-center justify-start px-3`}
                      style={{ width: `${widthPercentage}%` }}
                    >
                      {widthPercentage > 15 && (
                        <span className="text-white text-sm font-medium">
                          {stage.value} {stage.name.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Conversion Rate Details */}
                {index < stages.length - 1 && (
                  <div className="ml-6 pb-4 border-l-2 border-dashed border-slate-600">
                    <div className="ml-4 bg-slate-700/30 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-slate-300 text-sm">
                          Conversion: {stage.name} → {stage.nextStage}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${getConversionRateColor(stage.conversionRate)}`}>
                            {stage.conversionRate.toFixed(1)}%
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getConversionRateColor(stage.conversionRate)} border-current`}
                          >
                            {getConversionRateStatus(stage.conversionRate)}
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={stage.conversionRate} 
                        className="mt-2 h-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Conversion Rates Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.slice(0, -1).map((stage, index) => (
          <Card key={stage.name} className="bg-slate-800/50 border-purple-800/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-slate-300 text-sm mb-1">
                  {stage.name} → {stage.nextStage}
                </p>
                <p className={`text-2xl font-bold ${getConversionRateColor(stage.conversionRate)}`}>
                  {stage.conversionRate.toFixed(1)}%
                </p>
                <p className="text-slate-400 text-xs">
                  {stages[index + 1].value} / {stage.value} converted
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export { PlayerInsightsFunnel };
