
import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, Zap, Users, Loader2 } from 'lucide-react';
import brain from 'brain';
import { injectCosmicAnimations } from 'utils/cosmicAnimations';
import { Button } from '@/components/ui/button';
import PlayerSelectionModal from 'components/PlayerSelectionModal';
import { toast } from 'sonner';

export interface Props {
  refreshTrigger?: number;
}

interface UserStats {
  user_name: string;
  total_points: number;
  total_activities: number;
  breakdown: {
    books: number;
    opps: number;
    deals: number;
  };
  goals: {
    books: number;
    opps: number;
    deals: number;
    points: number;
  };
  progress: {
    books_percentage: number;
    opps_percentage: number;
    deals_percentage: number;
    total_percentage: number;
  };
  quarter: {
    id: number;
    name: string;
  };
}

export default function PersonalGoalsStatus({ refreshTrigger }: Props) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPlayerSelection, setNeedsPlayerSelection] = useState(false);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);

  // Initialize cosmic animations
  useEffect(() => {
    injectCosmicAnimations();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      setNeedsPlayerSelection(false);
      const response = await brain.get_activity_stats();
      
      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes('must select a player')) {
          setNeedsPlayerSelection(true);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('PersonalGoalsStatus received data:', JSON.stringify(data, null, 2));
      
      if (data.error) {
        setError(data.error);
        return;
      }
      
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch personal goals:', err);
      setError('Failed to load personal goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const handlePlayerSelected = (playerName: string) => {
    setShowPlayerSelection(false);
    setNeedsPlayerSelection(false);
    // Refresh stats after player selection
    fetchStats();
    toast.success(`Welcome, ${playerName}! Your cosmic adventure awaits.`);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-indigo-900/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          <span className="ml-2 text-slate-300">Loading personal goals...</span>
        </div>
      </div>
    );
  }

  if (needsPlayerSelection) {
    return (
      <>
        <div className="bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-indigo-900/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Target className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Choose Your Cosmic Avatar</h3>
            <p className="text-slate-300 text-sm">
              Select your player avatar to track your personal goals and see your progress in the galactic quest.
            </p>
            <Button 
              onClick={() => setShowPlayerSelection(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200"
            >
              🎯 Select Avatar
            </Button>
          </div>
        </div>
        
        <PlayerSelectionModal
          isOpen={showPlayerSelection}
          onClose={() => setShowPlayerSelection(false)}
          onPlayerSelected={handlePlayerSelected}
        />
      </>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-900/40 via-purple-900/40 to-indigo-900/40 backdrop-blur-sm border border-red-500/30 rounded-lg p-4">
        <div className="flex items-center text-red-400">
          <Target className="w-5 h-5 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'from-emerald-400 via-teal-500 to-cyan-600';
    if (percentage >= 75) return 'from-blue-400 via-indigo-500 to-purple-600';
    if (percentage >= 50) return 'from-violet-400 via-purple-500 to-fuchsia-600';
    return 'from-pink-400 via-rose-500 to-red-500';
  };

  const getProgressBadgeColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-emerald-400/20';
    if (percentage >= 75) return 'bg-blue-500/20 text-blue-300 border-blue-400/50 shadow-blue-400/20';
    if (percentage >= 50) return 'bg-violet-500/20 text-violet-300 border-violet-400/50 shadow-violet-400/20';
    return 'bg-pink-500/20 text-pink-300 border-pink-400/50 shadow-pink-400/20';
  };

  const getGlowEffect = (percentage: number) => {
    if (percentage >= 100) return 'shadow-lg shadow-emerald-500/30';
    if (percentage >= 75) return 'shadow-lg shadow-blue-500/30';
    if (percentage >= 50) return 'shadow-lg shadow-violet-500/30';
    return 'shadow-lg shadow-pink-500/30';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/60 via-purple-900/50 to-indigo-900/60 backdrop-blur-md border border-purple-400/40 rounded-xl p-6 space-y-5 shadow-2xl shadow-purple-500/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Trophy className="w-6 h-6 text-yellow-400 animate-pulse" />
            <div className="absolute inset-0 w-6 h-6 bg-yellow-400/20 rounded-full blur-md animate-ping" />
          </div>
          <h4 className="text-xl font-bold bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
            {stats.user_name}'s Goals
          </h4>
        </div>
        <Badge className="bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200 border-purple-400/50 px-3 py-1 text-sm font-semibold shadow-lg">
          {stats.quarter.name}
        </Badge>
      </div>

      {/* Check if user has any goals set */}
      {(!stats.goals || (stats.goals.books === 0 && stats.goals.opps === 0 && stats.goals.deals === 0)) ? (
        <div className="text-center py-6">
          <Target className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            No goals set for this quarter yet.
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Contact your admin to set up your personal goals.
          </p>
        </div>
      ) : (
        /* Goals Grid */
        <div className="space-y-4">
          {/* Books Goal */}
          {stats.goals.books > 0 && (
            <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 rounded-lg p-4 space-y-3 border border-slate-600/30">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-blue-400/30">
                    <span className="text-lg">📚</span>
                  </div>
                  <span className="text-slate-200 font-medium">Books Goal</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-lg">
                    {stats.breakdown.books}<span className="text-slate-400 font-normal">/{stats.goals.books}</span>
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-semibold shadow-md ${getProgressBadgeColor(stats.progress.books_percentage)}`}
                  >
                    {Math.round(stats.progress.books_percentage)}%
                  </Badge>
                </div>
              </div>
              <div className="relative">
                <Progress 
                  value={Math.min(stats.progress.books_percentage, 100)} 
                  className="h-3 bg-slate-800/60"
                />
                <div 
                  className={`absolute inset-0 h-3 bg-gradient-to-r ${getProgressColor(stats.progress.books_percentage)} rounded-full transition-all duration-700 ease-out ${getGlowEffect(stats.progress.books_percentage)}`}
                  style={{ width: `${Math.min(stats.progress.books_percentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Opps Goal */}
          {stats.goals.opps > 0 && (
            <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 rounded-lg p-4 space-y-3 border border-slate-600/30">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-violet-400/30">
                    <span className="text-lg">🎯</span>
                  </div>
                  <span className="text-slate-200 font-medium">Opps Goal</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-lg">
                    {stats.breakdown.opps}<span className="text-slate-400 font-normal">/{stats.goals.opps}</span>
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-semibold shadow-md ${getProgressBadgeColor(stats.progress.opps_percentage)}`}
                  >
                    {Math.round(stats.progress.opps_percentage)}%
                  </Badge>
                </div>
              </div>
              <div className="relative">
                <Progress 
                  value={Math.min(stats.progress.opps_percentage, 100)} 
                  className="h-3 bg-slate-800/60"
                />
                <div 
                  className={`absolute inset-0 h-3 bg-gradient-to-r ${getProgressColor(stats.progress.opps_percentage)} rounded-full transition-all duration-700 ease-out ${getGlowEffect(stats.progress.opps_percentage)}`}
                  style={{ width: `${Math.min(stats.progress.opps_percentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Deals Goal */}
          {stats.goals.deals > 0 && (
            <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 rounded-lg p-4 space-y-3 border border-slate-600/30">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg flex items-center justify-center border border-emerald-400/30">
                    <span className="text-lg">💰</span>
                  </div>
                  <span className="text-slate-200 font-medium">Deals Goal</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-lg">
                    {stats.breakdown.deals}<span className="text-slate-400 font-normal">/{stats.goals.deals}</span>
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-semibold shadow-md ${getProgressBadgeColor(stats.progress.deals_percentage)}`}
                  >
                    {Math.round(stats.progress.deals_percentage)}%
                  </Badge>
                </div>
              </div>
              <div className="relative">
                <Progress 
                  value={Math.min(stats.progress.deals_percentage, 100)} 
                  className="h-3 bg-slate-800/60"
                />
                <div 
                  className={`absolute inset-0 h-3 bg-gradient-to-r ${getProgressColor(stats.progress.deals_percentage)} rounded-full transition-all duration-700 ease-out ${getGlowEffect(stats.progress.deals_percentage)}`}
                  style={{ width: `${Math.min(stats.progress.deals_percentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Total Points Progress */}
          {stats.goals.points > 0 && (
            <div className="bg-gradient-to-r from-amber-900/20 via-yellow-900/20 to-orange-900/20 rounded-xl p-5 space-y-4 border border-amber-500/40 shadow-lg shadow-amber-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500/30 to-yellow-500/30 rounded-xl flex items-center justify-center border border-amber-400/50">
                      <span className="text-xl">⚡</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">
                      Total Points
                    </h5>
                    <p className="text-xs text-amber-200/80">Race progress</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {stats.total_points}<span className="text-amber-300/60 text-lg font-normal">/{stats.goals.points}</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-sm font-bold shadow-lg ${getProgressBadgeColor(stats.progress.total_percentage)} mt-1`}
                  >
                    {Math.round(stats.progress.total_percentage)}% Complete
                  </Badge>
                </div>
              </div>
              <div className="relative">
                <Progress 
                  value={Math.min(stats.progress.total_percentage, 100)} 
                  className="h-4 bg-slate-800/60"
                />
                <div 
                  className={`absolute inset-0 h-4 bg-gradient-to-r ${getProgressColor(stats.progress.total_percentage)} rounded-full transition-all duration-1000 ease-out ${getGlowEffect(stats.progress.total_percentage)} shadow-lg`}
                  style={{ width: `${Math.min(stats.progress.total_percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
