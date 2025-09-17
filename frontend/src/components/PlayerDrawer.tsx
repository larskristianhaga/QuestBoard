


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { X, Target, TrendingUp, Activity, Trophy, Clock, Zap, BarChart3, ExternalLink } from 'lucide-react';
import brain from 'brain';
import { PlayerDetailedStatsResponse } from 'types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { MissionCountdown } from './MissionCountdown';

interface Props {
  playerId: number | null;
  playerName: string | null;
  onClose: () => void;
  isOpen: boolean;
}

const PlayerDrawer: React.FC<Props> = ({ playerId, playerName, onClose, isOpen }) => {
  const navigate = useNavigate();
  const [playerStats, setPlayerStats] = useState<PlayerDetailedStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const ACTIVITIES_PER_PAGE = 5;

  // Handle opening insights dashboard
  const handleOpenInsights = () => {
    if (playerName) {
      // Close the drawer first
      onClose();
      // Navigate to insights page with player name as query parameter
      navigate(`/player-insights?player=${encodeURIComponent(playerName)}`);
    }
  };

  // Fetch player detailed stats
  const fetchPlayerStats = async () => {
    if (!playerName) return;
    
    setLoading(true);
    try {
      const response = await brain.get_player_detailed_stats({ player_name: playerName });
      const data = await response.json();
      setPlayerStats(data);
    } catch (error) {
      console.error('Failed to fetch player stats:', error);
      toast.error('Failed to load player details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && playerName) {
      fetchPlayerStats();
    }
  }, [isOpen, playerName]);

  // Close drawer on route change
  useEffect(() => {
    const handleRouteChange = () => {
      onClose();
    };
    
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [onClose]);

  if (!isOpen) return null;

  const LoadingSkeleton = () => (
    <div className="space-y-6 p-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-slate-700/50 rounded-full animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 bg-slate-700/50 rounded animate-pulse w-32" />
          <div className="h-4 bg-slate-700/50 rounded animate-pulse w-24" />
        </div>
      </div>
      
      {/* Sections Skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-5 bg-slate-700/50 rounded animate-pulse w-40" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-700/50 rounded animate-pulse w-full" />
            <div className="h-4 bg-slate-700/50 rounded animate-pulse w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressColor = (percentage: number | undefined | null) => {
    const safePercentage = percentage || 0;
    if (safePercentage >= 90) return 'text-yellow-400';
    if (safePercentage >= 70) return 'text-green-400';
    if (safePercentage >= 50) return 'text-blue-400';
    if (safePercentage >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProgressBackground = (percentage: number | undefined | null) => {
    const safePercentage = percentage || 0;
    if (safePercentage >= 90) return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20';
    if (safePercentage >= 70) return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20';
    if (safePercentage >= 50) return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20';
    if (safePercentage >= 25) return 'bg-gradient-to-r from-orange-500/20 to-red-500/20';
    return 'bg-gradient-to-r from-red-500/20 to-pink-500/20';
  };

  const getPaceIndicator = (currentPace: number | undefined | null, targetPace: number | undefined | null) => {
    const safeCurrent = currentPace || 0;
    const safeTarget = targetPace || 1; // Avoid division by zero
    const ratio = safeCurrent / safeTarget;
    if (ratio >= 1.2) return { icon: '🚀', text: 'Ahead', color: 'text-green-400' };
    if (ratio >= 0.8) return { icon: '🎯', text: 'On Track', color: 'text-blue-400' };
    return { icon: '⚠️', text: 'Behind', color: 'text-orange-400' };
  };

  const visibleActivities = playerStats?.recent_activities.slice(0, activitiesPage * ACTIVITIES_PER_PAGE) || [];
  const hasMoreActivities = (playerStats?.recent_activities.length || 0) > activitiesPage * ACTIVITIES_PER_PAGE;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[500px] bg-gradient-to-br from-slate-900/95 to-purple-900/80 border-purple-500/40 backdrop-blur-sm overflow-y-auto">
        <SheetHeader className="border-b border-purple-500/20 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {playerName}
            </SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
          {playerStats && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Badge variant="outline" className="border-purple-500/40 text-purple-300">
                  #{playerStats.current_position} of {playerStats.total_players}
                </Badge>
                <span>•</span>
                <span>{playerStats.quarter_name}</span>
              </div>
              
              {/* Open Insights Dashboard Button */}
              <Button
                onClick={handleOpenInsights}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 transition-all duration-200 hover:scale-105"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Open Dashboard
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </div>
          )}
        </SheetHeader>

        {loading ? (
          <LoadingSkeleton />
        ) : playerStats ? (
          <div className="space-y-6 p-6">
            {/* Personal Goals Progress */}
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-cyan-400">
                  <Target className="h-5 w-5" />
                  Personal Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Books', current: playerStats.personal_goals.current_books, goal: playerStats.personal_goals.goal_books, percentage: playerStats.personal_goals.books_progress_percentage || 0 },
                  { label: 'Opportunities', current: playerStats.personal_goals.current_opps, goal: playerStats.personal_goals.goal_opps, percentage: playerStats.personal_goals.opps_progress_percentage || 0 },
                  { label: 'Deals', current: playerStats.personal_goals.current_deals, goal: playerStats.personal_goals.goal_deals, percentage: playerStats.personal_goals.deals_progress_percentage || 0 },
                  { label: 'Points', current: playerStats.personal_goals.current_points, goal: playerStats.personal_goals.goal_points, percentage: playerStats.personal_goals.points_progress_percentage || 0 }
                ].map((item) => (
                  <div key={item.label} className={`p-3 rounded-lg ${getProgressBackground(item.percentage)}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">{item.label}</span>
                      <span className={`font-bold ${getProgressColor(item.percentage)}`}>
                        {(item.percentage || 0).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-300">
                      <span>{item.current} / {item.goal}</span>
                      <span>{Math.max(0, item.goal - item.current)} to go</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pace Analysis */}
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-green-400">
                  <TrendingUp className="h-5 w-5" />
                  Pace Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Books', current: playerStats.pace_analysis.current_books_pace || 0, target: playerStats.pace_analysis.target_books_pace || 0 },
                  { label: 'Opportunities', current: playerStats.pace_analysis.current_opps_pace || 0, target: playerStats.pace_analysis.target_opps_pace || 0 },
                  { label: 'Deals', current: playerStats.pace_analysis.current_deals_pace || 0, target: playerStats.pace_analysis.target_deals_pace || 0 },
                  { label: 'Points', current: playerStats.pace_analysis.current_points_pace || 0, target: playerStats.pace_analysis.target_points_pace || 0 }
                ].map((item) => {
                  const paceIndicator = getPaceIndicator(item.current, item.target);
                  return (
                    <div key={item.label} className="flex justify-between items-center p-2 rounded border border-slate-700/50">
                      <span className="text-white">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 text-sm">
                          {(item.current || 0).toFixed(1)} / {(item.target || 0).toFixed(1)}
                        </span>
                        <div className={`flex items-center gap-1 ${paceIndicator.color}`}>
                          <span>{paceIndicator.icon}</span>
                          <span className="text-xs font-medium">{paceIndicator.text}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Replace Time to Goal Predictions with Mission Countdown */}
            <MissionCountdown 
              predictions={playerStats.predictions}
              quarterDaysRemaining={playerStats.pace_analysis.days_remaining_in_quarter || 0}
              currentProgress={{
                books: {
                  current: playerStats.personal_goals.current_books || 0,
                  target: playerStats.personal_goals.goal_books || 0
                },
                opps: {
                  current: playerStats.personal_goals.current_opps || 0,
                  target: playerStats.personal_goals.goal_opps || 0
                },
                deals: {
                  current: playerStats.personal_goals.current_deals || 0,
                  target: playerStats.personal_goals.goal_deals || 0
                },
                points: {
                  current: playerStats.personal_goals.current_points || 0,
                  target: playerStats.personal_goals.goal_points || 0
                }
              }}
            />

            {/* Active Challenges */}
            {playerStats.active_challenges.length > 0 && (
              <Card className="bg-black/20 border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-purple-400">
                    <Trophy className="h-5 w-5" />
                    Active Challenges ({playerStats.active_challenges.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {playerStats.active_challenges.map((challenge, index) => (
                    <div key={index} className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-white">{challenge.name}</h4>
                        <Badge variant="outline" className="border-purple-500/40 text-purple-300">
                          {challenge.challenge_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{challenge.description}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Progress:</span>
                        <span className="text-purple-300 font-medium">
                          {challenge.player_progress} / {challenge.target_value}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Activities */}
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-orange-400">
                  <Activity className="h-5 w-5" />
                  Recent Activities ({playerStats.total_activities_count} total)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {visibleActivities.length > 0 ? (
                  <>
                    {visibleActivities.map((activity, index) => (
                      <div key={index} className="p-3 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-white capitalize">
                            {(activity.type || 'unknown').replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(activity.created_at)}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-slate-300">{activity.description}</p>
                        )}
                        <div className="flex justify-between items-center mt-2 text-sm">
                          <span className="text-slate-400">Points:</span>
                          <span className="text-cyan-300 font-medium flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {activity.points}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {hasMoreActivities && (
                      <Button
                        variant="outline"
                        onClick={() => setActivitiesPage(prev => prev + 1)}
                        className="w-full mt-3 border-purple-500/40 text-purple-300 hover:bg-purple-500/20"
                      >
                        Load More Activities
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activities</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Progress Delta */}
            <Card className="bg-black/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-indigo-400">
                  <TrendingUp className="h-5 w-5" />
                  vs Team Average
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Books', delta: playerStats.team_progress.books_delta || 0, percentage: playerStats.team_progress.books_delta_percentage || 0 },
                  { label: 'Opportunities', delta: playerStats.team_progress.opps_delta || 0, percentage: playerStats.team_progress.opps_delta_percentage || 0 },
                  { label: 'Deals', delta: playerStats.team_progress.deals_delta || 0, percentage: playerStats.team_progress.deals_delta_percentage || 0 },
                  { label: 'Points', delta: playerStats.team_progress.points_delta || 0, percentage: playerStats.team_progress.points_delta_percentage || 0 }
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center p-2 rounded border border-slate-700/50">
                    <span className="text-white">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        item.delta > 0 ? 'text-green-400' :
                        item.delta < 0 ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {item.delta > 0 ? '+' : ''}{item.delta}
                      </span>
                      <span className={`text-xs ${
                        item.percentage > 0 ? 'text-green-400' :
                        item.percentage < 0 ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        ({item.percentage > 0 ? '+' : ''}{(item.percentage || 0).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-slate-300 text-lg">Failed to load player details</p>
              <Button 
                variant="outline" 
                onClick={fetchPlayerStats}
                className="mt-4 border-purple-500/40 text-purple-300 hover:bg-purple-500/20"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default PlayerDrawer;
