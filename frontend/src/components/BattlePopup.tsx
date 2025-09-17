

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trophy, Users, Clock, Zap, Target, Phone, Calendar, FileText, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@stackframe/react';
import brain from 'brain';
import { LeaderboardResponse, BookingActivityType, SubmitEntryRequest, ScoreboardResponse, PlayerScore } from 'types';
import { useCompetition } from 'utils/competitionContext';

interface BattlePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ActivityNotification {
  id: string;
  player: string;
  activity: BookingActivityType;
  team: string;
  timestamp: number;
}

// Activity types configuration matching BookingCompetitionWidget
const ACTIVITY_TYPES = [
  {
    type: BookingActivityType.Lift,
    label: 'LIFT',
    icon: '🎯',
    points: 1,
    color: 'from-red-600 to-red-500',
    description: 'Identify opportunity'
  },
  {
    type: BookingActivityType.Call,
    label: 'CALL', 
    points: 4,
    color: 'from-orange-600 to-orange-500',
    description: 'Make contact'
  },
  {
    type: BookingActivityType.Book,
    label: 'BOOK',
    icon: '📅',
    points: 10,
    color: 'from-green-600 to-green-500',
    description: 'Schedule meeting'
  }
];

const TEAM_COLORS = {
  'Cosmic Explorers': 'from-blue-600 to-purple-600',
  'Galactic Rangers': 'from-orange-500 to-red-600',
  'Team Alpha': 'from-cyan-500 to-blue-600',
  'Team Beta': 'from-pink-500 to-purple-600'
};

export default function BattlePopup({ isOpen, onClose }: BattlePopupProps) {
  console.log('🎮 BattlePopup: Component rendering, isOpen:', isOpen);
  const user = useUser();
  const { activeCompetition } = useCompetition();
  
  console.log('🔍 BattlePopup: Active competition from context:', activeCompetition);
  
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [scoreboardV2Data, setScoreboardV2Data] = useState<ScoreboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: number; name: string } | null>(null);
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Load selected player on mount
  useEffect(() => {
    loadSelectedPlayer();
  }, []);

  // Real-time data refresh - changed from 5 seconds to 1 minute
  useEffect(() => {
    if (!isOpen || !activeCompetition) {
      console.log('🚫 BattlePopup: Not loading data - isOpen:', isOpen, 'activeCompetition:', activeCompetition);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeCompetition.isV2) {
          // Handle V2 competition data
          console.log('🎯 BattlePopup: Loading V2 competition data for competition', activeCompetition.id);
          const response = await brain.get_competition_scoreboard_v2({ competitionId: activeCompetition.id });
          const data = await response.json();
          console.log('📊 BattlePopup: V2 Scoreboard data:', data);
          setScoreboardV2Data(data);
        } else {
          // Handle V1 competition data
          const response = await brain.leaderboard({ competitionId: activeCompetition.id });
          const data = await response.json();
          console.log('📊 BattlePopup: Leaderboard data:', data);
          setLeaderboardData(data);
        }
        setLastRefresh(Date.now());
      } catch (error) {
        console.error('❌ BattlePopup: Error fetching data:', error);
        toast.error('Failed to load competition data');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Auto-refresh every 1 minute for real-time updates (changed from 5000)
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [isOpen, activeCompetition]);

  const loadSelectedPlayer = async () => {
    try {
      const response = await brain.get_my_player();
      if (!response.ok) return;
      
      const data = await response.json();
      setSelectedPlayer(data ? { id: 0, name: data.player_name } : null);
    } catch (error) {
      console.error('Failed to load selected player:', error);
    }
  };

  // Use the proven submitActivity logic from BookingCompetitionWidget
  const submitActivity = async (activityType: BookingActivityType, points: number) => {
    if (!activeCompetition || !selectedPlayer || !user) {
      toast.error('Please select a player first');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Auto-enroll player if not already enrolled
      try {
        await brain.enroll_participant({
          competition_id: activeCompetition.id,
          player_name: selectedPlayer.name
        });
      } catch (enrollError) {
        console.log('Player already enrolled or enrollment failed:', enrollError);
      }
      
      const entryData: SubmitEntryRequest = {
        competition_id: activeCompetition.id,
        player_name: selectedPlayer.name,
        activity_type: activityType,
        points: points,
        triggered_by: "competition"  // Ensure dual logging works
      };
      
      const response = await brain.submit_entry(entryData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit activity');
      }
      
      const result = await response.json();
      
      // Success - trigger celebrations and notifications
      const activityInfo = ACTIVITY_TYPES.find(a => a.type === activityType);
      
      // Add explosion notification
      const newNotification: ActivityNotification = {
        id: Date.now().toString(),
        player: selectedPlayer.name,
        activity: activityType,
        team: getPlayerTeam(),
        timestamp: Date.now()
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep only 5 latest
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 3000);
      
      // Show success toast with cosmic theme
      toast.success(`⚡ ${activityInfo?.icon} ${activityInfo?.label} logged! +${points} points! 🚀`);
      
      // Refresh data immediately
      setTimeout(() => {
        setLastRefresh(Date.now());
        // Reload leaderboard data
        if (activeCompetition) {
          brain.leaderboard({ competitionId: activeCompetition.id })
            .then(response => response.json())
            .then(data => setLeaderboardData(data))
            .catch(error => console.error('Failed to refresh leaderboard:', error));
        }
      }, 500);
      
    } catch (error: any) {
      console.error('Failed to submit activity:', error);
      toast.error(error.message || 'Failed to submit activity');
    } finally {
      setSubmitting(false);
    }
  };

  const getPlayerTeam = () => {
    // Try to determine player's team from leaderboard data
    if (leaderboardData?.rows) {
      const player = leaderboardData.rows.find(row => row.player_name === 'GARD');
      return player?.team_name || 'Cosmic Explorers';
    }
    return 'Cosmic Explorers';
  };

  const formatTimeRemaining = () => {
    if (!activeCompetition?.data?.end_time) return 'N/A';
    const endTime = new Date(activeCompetition.data.end_time);
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Competition ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  if (!activeCompetition) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-2 border-purple-500/50 overflow-hidden">
        {/* Activity Notifications Overlay */}
        <div className="absolute top-4 right-16 z-50 space-y-2">
          {notifications.map((notification) => {
            const activityInfo = ACTIVITY_TYPES.find(a => a.type === notification.activity);
            const teamColor = TEAM_COLORS[notification.team] || 'from-gray-500 to-gray-600';
            
            return (
              <div
                key={notification.id}
                className={`bg-gradient-to-r ${teamColor} text-white px-4 py-2 rounded-lg shadow-lg animate-bounce border border-white/30 backdrop-blur-sm`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{activityInfo?.icon}</span>
                  <span className="font-medium">{notification.player}</span>
                  <span className="text-sm opacity-90">{activityInfo?.label}</span>
                  <div className="flex space-x-1">
                    <Star className="h-3 w-3 animate-spin" />
                    <Star className="h-3 w-3 animate-pulse" />
                    <Star className="h-3 w-3 animate-bounce" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 border-b border-purple-400/50">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 text-white hover:bg-white/20 rounded-full p-2"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Trophy className="h-8 w-8 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{activeCompetition.name}</h1>
              <div className="flex items-center space-x-4 mt-2 text-purple-100">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{formatTimeRemaining()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {activeCompetition.isV2 
                      ? `${scoreboardV2Data?.individual_leaderboard?.length || 0} players`
                      : `${leaderboardData?.rows?.length || 0} players`
                    }
                  </span>
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-400/50">
                  🔥 LIVE
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="leaderboard" className="h-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-purple-500/30">
              <TabsTrigger value="leaderboard" className="data-[state=active]:bg-purple-600">Leaderboard</TabsTrigger>
              <TabsTrigger value="teams" className="data-[state=active]:bg-purple-600">Team Standings</TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-purple-600">Competition Stats</TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-purple-600">Quick Log</TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard" className="mt-6">
              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <span>Live Leaderboard</span>
                    <Badge variant="outline" className="text-xs border-purple-400 text-purple-300">
                      Updates every 1m
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                    </div>
                  ) : activeCompetition.isV2 ? (
                    // V2 Competition Leaderboard
                    scoreboardV2Data?.individual_leaderboard && scoreboardV2Data.individual_leaderboard.length > 0 ? (
                      <div className="space-y-3">
                        {scoreboardV2Data.individual_leaderboard.slice(0, 10).map((player, index) => (
                          <div
                            key={`${player.player_name}-${index}`}
                            className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-purple-500/20 hover:border-purple-400/40 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 ? 'bg-yellow-500 text-black' :
                                index === 1 ? 'bg-gray-400 text-black' :
                                index === 2 ? 'bg-amber-600 text-white' :
                                'bg-slate-600 text-white'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-white">{player.player_name}</div>
                                <div className="text-sm text-purple-300">
                                  {player.event_count} events
                                  {player.multipliers_applied && player.multipliers_applied.length > 0 && (
                                    <span className="ml-2 text-yellow-400">⚡ {player.multipliers_applied.length} bonuses</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-yellow-400">{player.total_points}</div>
                              <div className="text-xs text-slate-400">
                                {player.breakdown && (
                                  <div className="flex space-x-2">
                                    {player.breakdown.lift && <span>🎯{player.breakdown.lift}</span>}
                                    {player.breakdown.call && <span>📞{player.breakdown.call}</span>}
                                    {player.breakdown.book && <span>📅{player.breakdown.book}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No players yet. Be the first to compete!</p>
                      </div>
                    )
                  ) : (
                    // V1 Competition Leaderboard
                    leaderboardData?.rows && leaderboardData.rows.length > 0 ? (
                      <div className="space-y-3">
                        {leaderboardData.rows.slice(0, 10).map((row, index) => (
                          <div
                            key={`${row.player_name}-${index}`}
                            className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-purple-500/20 hover:border-purple-400/40 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 ? 'bg-yellow-500 text-black' :
                                index === 1 ? 'bg-gray-400 text-black' :
                                index === 2 ? 'bg-amber-600 text-white' :
                                'bg-slate-600 text-white'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-white">{row.player_name}</div>
                                {row.team_name && (
                                  <div className="text-sm text-purple-300">{row.team_name}</div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-yellow-400">{row.total_points}</div>
                              <div className="text-xs text-slate-400">{row.entries} entries</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No players yet. Be the first to compete!</p>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teams" className="mt-6">
              {activeCompetition.isV2 ? (
                // V2 Competition Teams - Individual players grouped conceptually
                <div className="space-y-6">
                  <Card className="bg-slate-800/50 border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <Users className="h-5 w-5 text-purple-400" />
                        <span>Competition Players</span>
                        <Badge variant="outline" className="text-xs border-purple-400 text-purple-300">
                          Individual Competition
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {scoreboardV2Data?.individual_leaderboard && scoreboardV2Data.individual_leaderboard.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {scoreboardV2Data.individual_leaderboard.map((player, index) => (
                            <div
                              key={player.player_name}
                              className="p-4 bg-slate-700/50 rounded-lg border border-purple-500/20 hover:border-purple-400/40 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index < 3 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black' : 'bg-slate-600 text-white'
                                }`}>
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-white">{player.player_name}</div>
                                  <div className="text-sm text-purple-300">{player.total_points} points</div>
                                  {player.breakdown && (
                                    <div className="flex space-x-2 mt-1">
                                      {player.breakdown.lift && <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">🎯{player.breakdown.lift}</span>}
                                      {player.breakdown.call && <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">📞{player.breakdown.call}</span>}
                                      {player.breakdown.book && <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">📅{player.breakdown.book}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No players enrolled yet. Be the first to join!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                // V1 Competition Teams - Traditional team structure
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[activeCompetition.data.team_a_name, activeCompetition.data.team_b_name].filter(Boolean).map((teamName, teamIndex) => {
                    const teamPlayers = leaderboardData?.rows?.filter(r => r.team_name === teamName) || [];
                    const teamPoints = teamPlayers.reduce((sum, r) => sum + r.total_points, 0);
                    const teamGradients = [
                      'from-blue-600 to-purple-600',
                      'from-orange-500 to-red-600',
                      'from-cyan-500 to-teal-600', 
                      'from-pink-500 to-purple-600'
                    ];
                    
                    return (
                      <Card key={teamName} className={`bg-gradient-to-br ${teamGradients[teamIndex % 4]}/20 border-${teamIndex === 0 ? 'blue' : teamIndex === 1 ? 'orange' : teamIndex === 2 ? 'cyan' : 'pink'}-500/30`}>
                        <CardHeader>
                          <CardTitle className={`text-${teamIndex === 0 ? 'blue' : teamIndex === 1 ? 'orange' : teamIndex === 2 ? 'cyan' : 'pink'}-300 flex items-center space-x-2`}>
                            <Users className="h-5 w-5" />
                            <span>{teamName}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center mb-4">
                            <div className={`text-3xl font-bold text-${teamIndex === 0 ? 'blue' : teamIndex === 1 ? 'orange' : teamIndex === 2 ? 'cyan' : 'pink'}-400 mb-2`}>
                              {teamPoints}
                            </div>
                            <div className={`text-sm text-${teamIndex === 0 ? 'blue' : teamIndex === 1 ? 'orange' : teamIndex === 2 ? 'cyan' : 'pink'}-300`}>Total Points</div>
                            <div className="text-xs text-slate-400 mt-1">{teamPlayers.length} players</div>
                          </div>
                          
                          {teamPlayers.length > 0 ? (
                            <div className="space-y-2">
                              {teamPlayers.slice(0, 5).map((player) => (
                                <div key={player.player_name} className="flex justify-between items-center p-2 bg-slate-700/30 rounded">
                                  <span className="text-white text-sm">{player.player_name}</span>
                                  <span className="text-yellow-400 text-sm font-medium">{player.total_points}</span>
                                </div>
                              ))}
                              {teamPlayers.length > 5 && (
                                <div className="text-center text-xs text-slate-400 mt-2">
                                  +{teamPlayers.length - 5} more players
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center text-slate-400 text-sm py-4">
                              No players yet
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {/* Show empty slots for potential additional teams */}
                  {Array.from({ length: Math.max(0, 4 - [activeCompetition.data.team_a_name, activeCompetition.data.team_b_name].filter(Boolean).length) }, (_, i) => (
                    <Card key={`empty-${i}`} className="bg-slate-800/30 border-slate-600/30 border-dashed">
                      <CardContent className="flex items-center justify-center h-32">
                        <div className="text-center text-slate-500">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <div className="text-sm">Available Team Slot</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Competition Overview */}
                <Card className="bg-slate-800/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Trophy className="h-5 w-5 text-yellow-400" />
                      <span>Competition Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {activeCompetition.isV2 
                            ? scoreboardV2Data?.individual_leaderboard?.length || 0
                            : leaderboardData?.rows?.length || 0
                          }
                        </div>
                        <div className="text-sm text-slate-300">Total Players</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {activeCompetition.isV2 
                            ? scoreboardV2Data?.individual_leaderboard?.reduce((sum, p) => sum + p.total_points, 0) || 0
                            : leaderboardData?.rows?.reduce((sum, r) => sum + r.total_points, 0) || 0
                          }
                        </div>
                        <div className="text-sm text-slate-300">Total Points</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {activeCompetition.isV2 
                            ? scoreboardV2Data?.individual_leaderboard?.reduce((sum, p) => sum + p.event_count, 0) || 0
                            : leaderboardData?.rows?.reduce((sum, r) => sum + r.entries, 0) || 0
                          }
                        </div>
                        <div className="text-sm text-slate-300">Total Activities</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {(() => {
                            const playerCount = activeCompetition.isV2 
                              ? scoreboardV2Data?.individual_leaderboard?.length || 0
                              : leaderboardData?.rows?.length || 0;
                            const totalPoints = activeCompetition.isV2 
                              ? scoreboardV2Data?.individual_leaderboard?.reduce((sum, p) => sum + p.total_points, 0) || 0
                              : leaderboardData?.rows?.reduce((sum, r) => sum + r.total_points, 0) || 0;
                            return playerCount > 0 ? Math.round(totalPoints / playerCount) : 0;
                          })()} 
                        </div>
                        <div className="text-sm text-slate-300">Avg Points/Player</div>
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-600 pt-4">
                      <div className="text-sm text-slate-300 mb-2">Competition Details:</div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Type:</span>
                          <span className="text-white">{activeCompetition.isV2 ? 'Individual Competition (V2)' : 'Team Competition (V1)'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Duration:</span>
                          <span className="text-white">{formatTimeRemaining()}</span>
                        </div>
                        {activeCompetition.isV2 && activeCompetition.data.rules && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Scoring:</span>
                            <span className="text-white">
                              🎯{activeCompetition.data.rules.points?.lift || 1} | 
                              📞{activeCompetition.data.rules.points?.call || 4} | 
                              📅{activeCompetition.data.rules.points?.book || 10}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Breakdown */}
                <Card className="bg-slate-800/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      <span>Activity Breakdown</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeCompetition.isV2 ? (
                      // V2 Activity Breakdown
                      <div className="space-y-4">
                        {scoreboardV2Data?.individual_leaderboard && scoreboardV2Data.individual_leaderboard.length > 0 ? (
                          (() => {
                            const totals = scoreboardV2Data.individual_leaderboard.reduce((acc, player) => {
                              if (player.breakdown) {
                                acc.lift += player.breakdown.lift || 0;
                                acc.call += player.breakdown.call || 0;
                                acc.book += player.breakdown.book || 0;
                              }
                              return acc;
                            }, { lift: 0, call: 0, book: 0 });
                            
                            return (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">🎯</span>
                                    <span className="text-red-300 font-medium">Lifts</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xl font-bold text-red-400">{totals.lift}</div>
                                    <div className="text-xs text-red-300">{totals.lift * (activeCompetition.data.rules?.points?.lift || 1)} pts</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">📞</span>
                                    <span className="text-orange-300 font-medium">Calls</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xl font-bold text-orange-400">{totals.call}</div>
                                    <div className="text-xs text-orange-300">{totals.call * (activeCompetition.data.rules?.points?.call || 4)} pts</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">📅</span>
                                    <span className="text-green-300 font-medium">Books</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xl font-bold text-green-400">{totals.book}</div>
                                    <div className="text-xs text-green-300">{totals.book * (activeCompetition.data.rules?.points?.book || 10)} pts</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="text-center py-8 text-slate-400">
                            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No activities logged yet</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      // V1 Activity Breakdown - Basic count
                      <div className="space-y-4">
                        {leaderboardData?.rows && leaderboardData.rows.length > 0 ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">📊</span>
                                <span className="text-blue-300 font-medium">Total Entries</span>
                              </div>
                              <div className="text-xl font-bold text-blue-400">
                                {leaderboardData.rows.reduce((sum, r) => sum + r.entries, 0)}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">⭐</span>
                                <span className="text-purple-300 font-medium">Active Players</span>
                              </div>
                              <div className="text-xl font-bold text-purple-400">
                                {leaderboardData.rows.filter(r => r.total_points > 0).length}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-400">
                            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No activities logged yet</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Performance Insights */}
                <Card className="bg-slate-800/50 border-purple-500/30 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-400" />
                      <span>Performance Insights</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Top Performer */}
                      <div className="text-center">
                        <h4 className="text-sm font-medium text-slate-300 mb-3">🏆 Top Performer</h4>
                        {(() => {
                          const topPlayer = activeCompetition.isV2 
                            ? scoreboardV2Data?.individual_leaderboard?.[0]
                            : leaderboardData?.rows?.[0];
                          return topPlayer ? (
                            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
                              <div className="text-lg font-bold text-yellow-400">{'player_name' in topPlayer ? topPlayer.player_name : 'Unknown'}</div>
                              <div className="text-2xl font-bold text-white mt-1">{topPlayer.total_points}</div>
                              <div className="text-xs text-yellow-300">points</div>
                            </div>
                          ) : (
                            <div className="bg-slate-700/50 rounded-lg p-4 text-slate-400">No players yet</div>
                          );
                        })()}
                      </div>
                      
                      {/* Most Active */}
                      <div className="text-center">
                        <h4 className="text-sm font-medium text-slate-300 mb-3">⚡ Most Active</h4>
                        {(() => {
                          let mostActivePlayer;
                          if (activeCompetition.isV2) {
                            mostActivePlayer = scoreboardV2Data?.individual_leaderboard?.length > 0 ? 
                              scoreboardV2Data.individual_leaderboard.reduce((prev, current) => 
                                (current.event_count > (prev?.event_count || 0)) ? current : prev
                              ) : null;
                          } else {
                            mostActivePlayer = leaderboardData?.rows?.length > 0 ? 
                              leaderboardData.rows.reduce((prev, current) => 
                                (current.entries > (prev?.entries || 0)) ? current : prev
                              ) : null;
                          }
                          
                          return mostActivePlayer ? (
                            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-500/30">
                              <div className="text-lg font-bold text-green-400">{'player_name' in mostActivePlayer ? mostActivePlayer.player_name : 'Unknown'}</div>
                              <div className="text-2xl font-bold text-white mt-1">
                                {'event_count' in mostActivePlayer ? mostActivePlayer.event_count : mostActivePlayer.entries}
                              </div>
                              <div className="text-xs text-green-300">activities</div>
                            </div>
                          ) : (
                            <div className="bg-slate-700/50 rounded-lg p-4 text-slate-400">No activities yet</div>
                          );
                        })()}
                      </div>
                      
                      {/* Competition Health */}
                      <div className="text-center">
                        <h4 className="text-sm font-medium text-slate-300 mb-3">📈 Competition Health</h4>
                        {(() => {
                          const playerCount = activeCompetition.isV2 
                            ? scoreboardV2Data?.individual_leaderboard?.length || 0
                            : leaderboardData?.rows?.length || 0;
                          const activePlayerCount = activeCompetition.isV2 
                            ? scoreboardV2Data?.individual_leaderboard?.filter(p => p.total_points > 0).length || 0
                            : leaderboardData?.rows?.filter(r => r.total_points > 0).length || 0;
                          const participationRate = playerCount > 0 ? Math.round((activePlayerCount / playerCount) * 100) : 0;
                          
                          return (
                            <div className={`bg-gradient-to-br ${
                              participationRate >= 75 ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' :
                              participationRate >= 50 ? 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30' :
                              'from-red-500/20 to-pink-500/20 border-red-500/30'
                            } rounded-lg p-4 border`}>
                              <div className={`text-lg font-bold ${
                                participationRate >= 75 ? 'text-green-400' :
                                participationRate >= 50 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {participationRate >= 75 ? 'Excellent' :
                                 participationRate >= 50 ? 'Good' :
                                 participationRate >= 25 ? 'Fair' : 'Low'}
                              </div>
                              <div className="text-2xl font-bold text-white mt-1">{participationRate}%</div>
                              <div className={`text-xs ${
                                participationRate >= 75 ? 'text-green-300' :
                                participationRate >= 50 ? 'text-yellow-300' :
                                'text-red-300'
                              }`}>participation</div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <span>Quick Activity Logger</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedPlayer ? (
                    <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3">
                      <p className="text-yellow-200 text-sm">
                        ⚠️ Please select a player in the main dashboard to log activities.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-4">
                        <p className="text-white text-sm mb-1">Logging as:</p>
                        <Badge className="bg-purple-600 text-white">{selectedPlayer.name}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {ACTIVITY_TYPES.map((activity) => (
                          <Button
                            key={activity.type}
                            onClick={() => submitActivity(activity.type, activity.points)}
                            disabled={submitting}
                            className={`
                              bg-gradient-to-r ${activity.color} hover:opacity-80 text-white
                              transition-all duration-200 hover:scale-105 flex flex-col items-center p-4 h-auto
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            <span className="text-2xl mb-2">{activity.icon}</span>
                            <div className="text-center">
                              <div className="font-bold">{activity.label}</div>
                              <div className="text-xs opacity-90">+{activity.points} pts</div>
                              <div className="text-xs opacity-75">{activity.description}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                      
                      {submitting && (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400 mr-2"></div>
                          <span className="text-purple-300">Logging activity...</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="text-xs text-slate-400 text-center">
                    Activities are logged immediately and update the leaderboard
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
