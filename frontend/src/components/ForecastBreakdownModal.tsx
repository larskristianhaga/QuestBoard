import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import brain from 'brain';
import { DetailedForecastResponse } from 'types';
import { 
  TrendingUp, 
  Calendar, 
  Target,
  Users,
  Award,
  Calculator,
  Clock,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ForecastBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId?: number;
}

const ForecastBreakdownModal: React.FC<ForecastBreakdownModalProps> = ({
  isOpen,
  onClose,
  teamId
}) => {
  const [data, setData] = useState<DetailedForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchForecastData();
    }
  }, [isOpen, teamId]);

  const fetchForecastData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await brain.get_forecast_breakdown({ team_id: teamId });
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching forecast breakdown:', err);
      setError('Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case 'books':
        return <Users className="h-5 w-5 text-blue-400" />;
      case 'opportunities':
        return <Target className="h-5 w-5 text-green-400" />;
      case 'deals':
        return <Award className="h-5 w-5 text-yellow-400" />;
      default:
        return <BarChart3 className="h-5 w-5 text-gray-400" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case 'books':
        return 'from-blue-600 to-blue-800';
      case 'opportunities':
        return 'from-green-600 to-green-800';
      case 'deals':
        return 'from-yellow-600 to-yellow-800';
      default:
        return 'from-gray-600 to-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Calculator className="h-6 w-6 text-purple-400" />
            Forecast Breakdown
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-2 text-gray-300">Loading forecast data...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Quarter Overview */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  {data.quarter_info.name} Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{data.total_current}</p>
                    <p className="text-sm text-gray-400">Current Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{data.total_forecast}</p>
                    <p className="text-sm text-gray-400">Projected Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{data.total_daily_rate}</p>
                    <p className="text-sm text-gray-400">Daily Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{data.quarter_info.progress_percent}%</p>
                    <p className="text-sm text-gray-400">Quarter Progress</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>Quarter Progress</span>
                    <span>{data.quarter_info.days_elapsed} / {data.quarter_info.total_days} days</span>
                  </div>
                  <Progress 
                    value={data.quarter_info.progress_percent} 
                    className="h-2 bg-gray-700"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Activity Breakdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                Activity Breakdown
              </h3>
              
              <div className="grid gap-4">
                {data.breakdown.map((activity, index) => (
                  <motion.div
                    key={activity.activity_type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`bg-gradient-to-r ${getActivityColor(activity.activity_type)} border-0`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getActivityIcon(activity.activity_type)}
                            <h4 className="text-xl font-bold text-white">{activity.activity_type}</h4>
                          </div>
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            {activity.daily_rate}/day
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-white">{activity.current_count}</p>
                            <p className="text-sm text-white/80">Current</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{activity.projected_total}</p>
                            <p className="text-sm text-white/80">Projected</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{activity.daily_rate}</p>
                            <p className="text-sm text-white/80">Rate/Day</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">+{activity.projected_total - activity.current_count}</p>
                            <p className="text-sm text-white/80">Remaining</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-white/80 mb-2">
                            <span>Progress towards projection</span>
                            <span>{activity.current_count} / {activity.projected_total}</span>
                          </div>
                          <Progress 
                            value={activity.projected_total > 0 ? (activity.current_count / activity.projected_total) * 100 : 0}
                            className="h-2 bg-white/20"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Calculation Method */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>Calculation Method: {data.calculation_method.replace('_', ' ').toUpperCase()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Projections based on current activity rate extrapolated to quarter end
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForecastBreakdownModal;
