
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Trophy, Medal, Award, Calendar, Target } from 'lucide-react';
import { useUser } from '@stackframe/react';
import brain from 'brain';
import { LeaderboardResponse, PlayerChallengeResponse } from 'types';
import { injectCosmicAnimations } from 'utils/cosmicAnimations';
import { callBrain } from 'utils/api';

export interface Props {
  refreshTrigger?: number;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

// Period type for toggle
type Period = 'daily' | 'quarter' | 'bonus';

// Ranking icons for top positions
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-5 h-5 text-yellow-400" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-300" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-slate-400">#{rank}</span>;
  }
};

// Get rank styling based on position
const getRankStyling = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/40 text-yellow-100';
    case 2:
      return 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/40 text-gray-100';
    case 3:
      return 'bg-gradient-to-r from-amber-600/20 to-yellow-600/20 border-amber-500/40 text-amber-100';
    default:
      return 'bg-black/20 border-purple-500/20 text-white';
  }
};

export default function Leaderboard({ refreshTrigger, isVisible = true, onToggleVisibility }: Props) {
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [period, setPeriod] = useState<Period>('daily');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const user = useUser();

  // Initialize cosmic animations
  useEffect(() => {
    injectCosmicAnimations();
  }, []);

  const fetchLeaderboard = async (selectedPeriod: Period = period) => {
    try {
      setLoading(true);
      
      if (selectedPeriod === 'bonus') {
        // Fetch bonus challenges data
        const response = await callBrain<{data: PlayerChallengeResponse[]}>(() => brain.get_player_active_challenges(), { retries: 1 });
        setLeaderboardData({ challenges: response.data || [], period: 'bonus' });
      } else {
        // Fetch regular leaderboard data
        const response = await callBrain<{data: LeaderboardResponse}>(() => brain.get_leaderboard({ period: selectedPeriod }), { retries: 1 });
        setLeaderboardData(response.data || {});
      }
    } catch (error: any) {
      console.error('Failed to fetch leaderboard:', error);
      setLeaderboardData(null); // Clear stale data on error
      
      // For bonus period, try fallback to regular leaderboard
      if (selectedPeriod === 'bonus') {
        console.log('Bonus challenges failed, falling back to daily leaderboard');
        try {
          const response = await callBrain<{data: LeaderboardResponse}>(() => brain.get_leaderboard({ period: 'daily' }), { retries: 1 });
          setLeaderboardData(response.data || {});
          // Automatically switch back to daily period
          setPeriod('daily');
        } catch (fallbackError) {
          console.error('Fallback to daily leaderboard also failed:', fallbackError);
          setLeaderboardData(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodToggle = async (newPeriod: Period) => {
    if (newPeriod === period) return;
    
    setIsTransitioning(true);
    setPeriod(newPeriod);
    
    // Add slight delay for smooth animation
    setTimeout(async () => {
      await fetchLeaderboard(newPeriod);
      setIsTransitioning(false);
    }, 200);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [refreshTrigger]);

  if (!isVisible) {
    return null;
  }

  if (loading && !leaderboardData) {
    return (
      <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            🏆 Leaderboard
          </h3>
          <div className="animate-spin text-purple-400">⭐</div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-700/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Find current user's rank
  const currentUserRank = leaderboardData?.leaderboard?.find(
    player => player.name.toLowerCase() === user?.displayName?.toLowerCase()
  )?.rank;

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-lg overflow-hidden">
      {/* Header with toggle */}
      <div className="p-4 border-b border-purple-500/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
            🏆 Leaderboard
          </h3>
          <div className="flex items-center gap-2">
            {currentUserRank && (
              <Badge className="bg-purple-600/50 text-purple-100 border-purple-400/50">
                You're #{currentUserRank}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-400 hover:text-white"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
            {onToggleVisibility && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleVisibility}
                className="text-slate-400 hover:text-white w-10 h-10 p-2 md:w-8 md:h-8 md:p-1 min-w-[40px] md:min-w-[32px]"
              >
                <span className="text-xl md:text-lg font-bold">✕</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Period Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-black/40 rounded-lg p-1 border border-purple-500/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePeriodToggle('daily')}
              disabled={isTransitioning}
              className={`relative px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                period === 'daily'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3 mr-1" />
              📅 Daily Points
              {period === 'daily' && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded animate-pulse" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePeriodToggle('quarter')}
              disabled={isTransitioning}
              className={`relative px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                period === 'quarter'
                  ? 'bg-gradient-to-r from-orange-600 to-pink-600 text-white shadow-lg shadow-orange-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3 h-3 mr-1" />
              🏆 Quarter Total
              {period === 'quarter' && (
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-pink-400/20 rounded animate-pulse" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePeriodToggle('bonus')}
              disabled={isTransitioning}
              className={`relative px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                period === 'bonus'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3 h-3 mr-1" />
              🎯 Bonus Status
              {period === 'bonus' && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded animate-pulse" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-slate-400">
            {period === 'bonus' ? 'Active Bonus Challenges' : leaderboardData?.quarter} • {period === 'bonus' ? 'Real-time status' : leaderboardData?.period_label || 'Loading...'}
            {isTransitioning && (
              <span className="ml-2 animate-spin">⭐</span>
            )}
          </p>
        </div>
      </div>

      {/* Leaderboard content */}
      {!isCollapsed && (
        <div className="p-4">
          {period === 'bonus' ? (
            // Bonus Challenges View
            !leaderboardData || !leaderboardData.challenges || leaderboardData.challenges.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">🎯</div>
                <p>No active bonus challenges!</p>
              </div>
            ) : (
              <div className={`space-y-3 max-h-80 overflow-y-auto transition-all duration-300 ${
                isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              }`}>
                {leaderboardData.challenges.map((challenge, index) => {
                  const progressPercent = Math.min((challenge.current_progress / challenge.target_value) * 100, 100);
                  const isCompleted = progressPercent >= 100;
                  
                  return (
                    <div
                      key={`${challenge.id}-bonus`}
                      className={`
                         relative p-4 rounded-lg border backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:shadow-lg
                         ${
                           isCompleted
                             ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-400/50'
                             : 'bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-400/50'
                         }
                       `}
                     >
                       {/* Challenge header */}
                       <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                           <span className="text-xl">{challenge.icon}</span>
                           <div>
                             <h4 className="font-semibold text-white">{challenge.title}</h4>
                             {challenge.description && (
                               <p className="text-sm text-slate-300 mt-1">{challenge.description}</p>
                             )}
                           </div>
                         </div>
                         <div className="text-right">
                           <div className="text-lg font-bold text-purple-300">
                             +{challenge.reward_points} pts
                           </div>
                           {challenge.time_remaining_hours !== undefined && challenge.time_remaining_hours > 0 && (
                             <div className="text-xs text-slate-400">
                               {Math.ceil(challenge.time_remaining_hours)}h left
                             </div>
                           )}
                         </div>
                       </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>
                            {challenge.current_progress} / {challenge.target_value} {challenge.target_type}
                          </span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              isCompleted
                                ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                                : 'bg-gradient-to-r from-purple-400 to-pink-400'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Challenge Type & End Time */}
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span className="capitalize">
                          🏷️ {challenge.type.replace('_', ' ')}
                        </span>
                        <span>
                          ⏰ Ends: {new Date(challenge.end_time).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            // Regular Leaderboard View
            !leaderboardData || leaderboardData.leaderboard?.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">🚀</div>
                <p>No rankings yet!</p>
              </div>
            ) : (
              <div className={`space-y-2 max-h-80 overflow-y-auto transition-all duration-300 ${
                isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              }`}>
                {leaderboardData.leaderboard.map((player, index) => {
                  const isCurrentUser = player.name.toLowerCase() === user?.displayName?.toLowerCase();
                  const rankStyling = getRankStyling(player.rank);
                  
                  return (
                    <div
                      key={`${player.name}-${period}`}
                      className={`
                        relative p-3 rounded-lg border backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:shadow-lg
                        ${rankStyling}
                        ${isCurrentUser ? 'ring-2 ring-blue-400/50 shadow-lg shadow-blue-400/20 animate-pulse-slow' : ''}
                      `}
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank Icon with glow effect */}
                        <div className="flex-shrink-0 relative">
                          {getRankIcon(player.rank)}
                          {player.rank <= 3 && (
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-sm opacity-30 animate-pulse" />
                          )}
                        </div>
                        
                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`font-bold truncate transition-colors duration-300 ${
                              isCurrentUser ? 'text-blue-200' : 'text-white'
                            }`}>
                              {player.name}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-blue-300 animate-pulse">(You)</span>
                              )}
                            </span>
                            <Badge className={`text-xs transition-all duration-300 ${
                              player.rank <= 3 
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none shadow-lg'
                                : 'bg-slate-600/50 text-slate-200 border-slate-500/50'
                            }`}>
                              {player.points} pts
                            </Badge>
                          </div>
                          
                          {/* Position indicator for current user */}
                          {isCurrentUser && (
                            <div className="text-xs text-blue-300 mt-1 animate-pulse">
                              ⭐ Your current position
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Top 3 special effects with cosmic particles */}
                      {player.rank <= 3 && (
                        <>
                          <div className="absolute -top-1 -right-1">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                              player.rank === 1 ? 'bg-yellow-400 shadow-yellow-400/50' :
                              player.rank === 2 ? 'bg-gray-300 shadow-gray-300/50' : 'bg-amber-500 shadow-amber-500/50'
                            } shadow-lg`} />
                          </div>
                          <div className="absolute -top-2 -left-2 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '1s' }} />
                          <div className="absolute -bottom-1 -right-2 w-1 h-1 bg-purple-300 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
          
          {/* Footer stats with cosmic styling */}
          <div className="mt-4 pt-3 border-t border-purple-500/20">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {period === 'bonus' 
                  ? `Active Challenges: ${leaderboardData?.challenges?.length || 0}`
                  : `Total Players: ${leaderboardData?.leaderboard?.length || 0}`
                }
              </span>
              <span className="flex items-center gap-1">
                {period === 'bonus' 
                  ? 'Live Progress Updates'
                  : period === 'daily' ? 'Updated: Just now' : `${leaderboardData?.quarter || ''} Total`
                }
                <span className="text-green-400">⚡</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
