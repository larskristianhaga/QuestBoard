



import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sword, Users, Trophy, Timer, Zap, Target, Calendar, Crown, Sparkles, TrendingUp, Award, Activity, Medal, Shield, Star } from 'lucide-react';
import { useUser } from '@stackframe/react';
import brain from 'brain';
import { toast } from 'sonner';
import PlayerSelectionModal from './PlayerSelectionModal';
import CelebrationAnimation from './CelebrationAnimation';
import {
  CompetitionResponse,
  LeaderboardRow,
  ParticipantResponse,
  LogActivityRequest,
  BookingActivityType,
  TeamLeaderboard,
  EntryResponse,
  TeamActivityFeed,
  CompetitionResponseV2,
  ScoreboardResponse,
  PlayerScore,
  CompetitionStats,
  TeamAssignment,
  SubmitEntryRequest
} from 'types';

// Import VFX system
import {
  initializeCosmicVFX,
  cleanupCosmicVFX,
  triggerStreakVFX,
  triggerComboVFX,
  triggerMultiplierVFX,
  triggerAchievementVFX,
  triggerRankUpVFX,
  triggerCosmicEventVFX
} from 'utils/cosmicVFX';

// Import competition utilities
import {
  isCompetitionV2,
  convertV2ToV1,
  calculatePlayerRank,
  getCompetitionTimeRemaining,
  getActivityIcon,
  getActivityColor,
  getRankBadge,
  formatStreakText
} from 'utils/competitionUtils';

// Import event tracking
import {
  trackActivityEvent,
  trackComboEvent,
  startEventTracking,
  stopEventTracking
} from 'utils/competitionEventTracker';

// Competition interface for v1 compatibility
interface Competition {
  id: number;
  name: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_hidden: boolean;
  tiebreaker: string;
  created_by: string;
  created_at: string;
  _isV2?: boolean;
}

// Achievement interface
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
}

// Activity type info interface
interface ActivityTypeInfo {
  type: BookingActivityType;
  label: string;
  icon: string;
  points: number;
  color: string;
  glowColor: string;
  celebration: string;
}

// Missing component definitions
const AchievementBadge: React.FC<{ achievement: Achievement }> = ({ achievement }) => (
  <Badge className={`${achievement.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : achievement.rarity === 'epic' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-600'} text-white`}>
    {achievement.icon} {achievement.title}
  </Badge>
);

const CompetitionV2Badge: React.FC = () => (
  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 animate-pulse">
    <Sparkles className="w-3 h-3 mr-1" />
    V2.0
  </Badge>
);

const TeamMilestone: React.FC<{ milestone: any }> = ({ milestone }) => (
  <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded border border-pink-500/30">
    <Trophy className="w-4 h-4 text-yellow-400" />
    <span className="text-sm text-white">{milestone.title}</span>
  </div>
);

const BarChart: React.FC<{ data: any[]; width?: number; height?: number }> = ({ data = [], width = 400, height = 200 }) => (
  <div className="bg-slate-800/50 p-4 rounded border border-purple-500/30">
    <div className="text-center text-purple-400">Chart visualization would go here</div>
    <div className="text-xs text-gray-500">Data points: {data?.length || 0}</div>
  </div>
);

const PlayerScoreV2: React.FC<{ player: PlayerScore; rank: number }> = ({ player, rank }) => {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Award className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Star className="w-5 h-5 text-amber-600" />;
    return <span className="text-purple-400 font-bold">#{rank}</span>;
  };

  return (
    <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/60 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getRankIcon(rank)}
          <div>
            <div className="font-bold text-white">{player.player_name}</div>
            <div className="text-sm text-purple-300">Streak: {player.current_streak || 0}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-400">{player.total_points}</div>
          <div className="text-xs text-gray-400">points</div>
        </div>
      </div>
    </div>
  );
};

// Simple wrapper components for types that are used as JSX but are actually interfaces
const Competition: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
const CompetitionResponseV2: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
const CompetitionStats: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
const ScoreboardResponse: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
const TeamAssignment: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
const TeamLeaderboard: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;

// Activity types configuration
const ACTIVITY_TYPES: ActivityTypeInfo[] = [
  {
    type: BookingActivityType.Lift,
    label: 'Lifts',
    icon: '🏋️',
    points: 1,
    color: 'bg-red-600',
    glowColor: 'shadow-red-500/50',
    celebration: '💪'
  },
  {
    type: BookingActivityType.Call,
    label: 'Calls', 
    icon: '📞',
    points: 4,
    color: 'bg-orange-600',
    glowColor: 'shadow-orange-500/50',
    celebration: '🔥'
  },
  {
    type: BookingActivityType.Book,
    label: 'Books',
    icon: '📅',
    points: 10,
    color: 'bg-green-600',
    glowColor: 'shadow-green-500/50',
    celebration: '🚀'
  }
];

export function BookingCompetitionWidget() {
  const user = useUser();
  const [activeCompetitions, setActiveCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamLeaderboard | null>(null);
  const [teamAssignments, setTeamAssignments] = useState<TeamAssignment | null>(null);
  const [activityFeed, setActivityFeed] = useState<TeamActivityFeed[]>([]);
  const [competitionStats, setCompetitionStats] = useState<CompetitionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: number; name: string } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showTeamView, setShowTeamView] = useState(true);
  
  // Competitions 2.0 state
  const [competitionV2, setCompetitionV2] = useState<CompetitionResponseV2 | null>(null);
  const [scoreboardV2, setScoreboardV2] = useState<ScoreboardResponse | null>(null);
  const [isCompetitionV2, setIsCompetitionV2] = useState(false);
  
  // Social engagement state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState('');
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);
  const [teamMilestones, setTeamMilestones] = useState<Array<{milestone: string; teamName: string; points: number}>>([]);
  const [recentActivities, setRecentActivities] = useState<TeamActivityFeed[]>([]);

  // Initialize cosmic animations
  useEffect(() => {
    initializeCosmicVFX();
  }, []);

  // Load competitions and selected player on mount
  useEffect(() => {
    loadActiveCompetitions();
    loadSelectedPlayer();
  }, []);

  // Update timer every minute for active competition
  useEffect(() => {
    if (selectedCompetition) {
      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000);
      return () => clearInterval(interval);
    }
  }, [selectedCompetition]);

  // Poll data every 30 seconds for real-time updates
  useEffect(() => {
    if (selectedCompetition) {
      loadAllCompetitionData();
      const interval = setInterval(loadAllCompetitionData, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedCompetition]);

  const loadActiveCompetitions = async () => {
    try {
      setLoading(true);
      
      // Load both v1.0 and v2.0 competitions in parallel
      const [v1Response, v2Response] = await Promise.all([
        brain.list_competitions(),
        brain.list_competitions_v2().catch(() => ({ ok: false })) // Graceful fallback
      ]);
      
      const competitions: Competition[] = [];
      
      // Process v1.0 competitions
      if (v1Response.ok) {
        const v1Competitions: Competition[] = await v1Response.json();
        const activeV1 = v1Competitions.filter(c => c.is_active && !c.is_hidden);
        competitions.push(...activeV1);
      }
      
      // Process v2.0 competitions (mark them for detection)
      if (v2Response.ok) {
        const v2Competitions: CompetitionResponseV2[] = await v2Response.json();
        const activeV2 = v2Competitions.filter(c => c.state === 'active' && !c.is_hidden);
        
        // Convert v2.0 to v1.0 format for compatibility, add marker
        const convertedV2 = activeV2.map(v2 => ({
          id: v2.id,
          name: v2.name,
          description: v2.description || '',
          start_time: v2.start_time,
          end_time: v2.end_time,
          is_active: true,
          is_hidden: v2.is_hidden,
          tiebreaker: 'highest_total',
          created_by: v2.created_by,
          created_at: v2.created_at,
          _isV2: true // Internal marker
        } as Competition & { _isV2: boolean }));
        
        competitions.push(...convertedV2);
      }
      
      setActiveCompetitions(competitions);
      
      // Auto-select first active competition
      if (competitions.length > 0 && !selectedCompetition) {
        await selectCompetition(competitions[0]);
      }
    } catch (error) {
      console.error('Failed to load competitions:', error);
      toast.error('Failed to load competitions');
    } finally {
      setLoading(false);
    }
  };
  
  const selectCompetition = async (competition: Competition & { _isV2?: boolean }) => {
    setSelectedCompetition(competition);
    const isV2 = competition._isV2 || false;
    setIsCompetitionV2(isV2);
    
    if (isV2) {
      // Load v2.0 competition details
      try {
        const v2Details = await brain.list_competitions_v2();
        if (v2Details.ok) {
          const v2List: CompetitionResponseV2[] = await v2Details.json();
          const matchingV2 = v2List.find(c => c.id === competition.id);
          if (matchingV2) {
            setCompetitionV2(matchingV2);
          }
        }
      } catch (error) {
        console.error('Failed to load v2.0 competition details:', error);
      }
    } else {
      setCompetitionV2(null);
      setScoreboardV2(null);
    }
    
    // Load appropriate competition data
    await loadAllCompetitionData();
  };

  const loadAllCompetitionData = async () => {
    if (!selectedCompetition) return;
    
    try {
      if (isCompetitionV2) {
        // Load Competitions 2.0 data
        const [scoreboardRes] = await Promise.all([
          brain.get_competition_scoreboard_v2({ competitionId: selectedCompetition.id }),
        ]);
        
        if (scoreboardRes.ok) {
          const scoreboard: ScoreboardResponse = await scoreboardRes.json();
          setScoreboardV2(scoreboard);
          
          // Convert v2.0 scoreboard to v1.0 format for compatibility
          const convertedLeaderboard: LeaderboardRow[] = scoreboard.individual_leaderboard.map(player => ({
            player_name: player.player_name,
            total_points: player.total_points,
            entries: Object.values(player.breakdown).reduce((sum, val) => sum + val, 0),
            last_entry_at: player.last_activity?.toISOString() || null,
            team_name: null // v2.0 doesn't have teams yet
          }));
          setLeaderboard(convertedLeaderboard);
        }
        
        // Clear v1.0 specific data
        setTeamLeaderboard(null);
        setTeamAssignments(null);
        setActivityFeed([]);
        setCompetitionStats(null);
        
      } else {
        // Load v1.0 team data in parallel
        const [leaderboardRes, teamLeaderboardRes, teamAssignmentsRes, activityFeedRes, statsRes] = await Promise.all([
          brain.leaderboard({ competitionId: selectedCompetition.id }),
          brain.get_team_leaderboard({ competitionId: selectedCompetition.id }),
          brain.get_team_assignments({ competitionId: selectedCompetition.id }),
          brain.get_team_activity_feed({ competitionId: selectedCompetition.id, limit: 10 }),
          brain.get_competition_stats({ competitionId: selectedCompetition.id })
        ]);

        if (leaderboardRes.ok) {
          const data: { players: LeaderboardRow[] } = await leaderboardRes.json();
          setLeaderboard(data.players || []);
        }

        if (teamLeaderboardRes.ok) {
          const data: TeamLeaderboard = await teamLeaderboardRes.json();
          setTeamLeaderboard(data);
        }

        if (teamAssignmentsRes.ok) {
          const data: TeamAssignment = await teamAssignmentsRes.json();
          setTeamAssignments(data);
        }

        if (activityFeedRes.ok) {
          const data: TeamActivityFeed[] = await activityFeedRes.json();
          setActivityFeed(data.slice(0, 10));
          setRecentActivities(data.slice(0, 5));
        }

        if (statsRes.ok) {
          const data: CompetitionStats = await statsRes.json();
          setCompetitionStats(data);
        }
        
        // Clear v2.0 specific data
        setScoreboardV2(null);
      }

    } catch (error) {
      console.error('Failed to load competition data:', error);
      toast.error('Failed to load competition data');
    }
  };
  
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

  const updateTimeRemaining = () => {
    if (!selectedCompetition) return;
    
    const now = new Date();
    const endTime = new Date(selectedCompetition.end_time);
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      setTimeRemaining('Competition Ended');
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      setTimeRemaining(`${days}d ${hours % 24}h remaining`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m remaining`);
    } else {
      setTimeRemaining(`${minutes}m remaining`);
    }
  };

  const submitActivity = async (activityType: BookingActivityType, points: number) => {
    if (!selectedCompetition || !selectedPlayer || !user) {
      toast.error('Please select a player first');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Auto-enroll player if not already enrolled
      try {
        await brain.enroll_participant({
          competition_id: selectedCompetition.id,
          player_name: selectedPlayer.name
        });
      } catch (enrollError) {
        console.log('Player already enrolled or enrollment failed:', enrollError);
      }
      
      const entryData: SubmitEntryRequest = {
        competition_id: selectedCompetition.id,
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
      if (activityInfo?.celebration) {
        setCelebrationType(activityInfo.celebration);
        setShowCelebration(true);
      }
      
      // Show success toast with cosmic theme
      toast.success(`⚡ ${activityInfo?.icon} ${activityInfo?.label} logged! +${points} points for your team! 🚀`);
      
      // Trigger VFX effects for Competition 2.0
      if (isCompetitionV2 && activityInfo) {
        const buttonElement = document.querySelector(`[data-activity="${activityType}"]`);
        
        // Track activity event
        trackActivityEvent(selectedCompetition.id, selectedPlayer.name, activityType, points);
        
        // Trigger streak VFX if player has a streak
        if (result.current_streak && result.current_streak > 1 && buttonElement) {
          triggerStreakVFX(buttonElement as HTMLElement, result.current_streak);
        }
        
        // Trigger combo VFX if combo was achieved
        if (result.combo_achieved) {
          if (buttonElement) {
            triggerComboVFX(buttonElement as HTMLElement, result.combo_name || 'Combo');
          }
          trackComboEvent(selectedCompetition.id, selectedPlayer.name, result.combo_name || 'Combo', result.combo_bonus || 0);
        }
        
        // Trigger multiplier VFX if multiplier was applied
        if (result.multiplier_applied && result.multiplier > 1 && buttonElement) {
          triggerMultiplierVFX(buttonElement as HTMLElement, result.multiplier);
        }
        
        // Trigger rank up VFX if rank improved
        if (result.rank_change && result.rank_change < 0 && buttonElement) {
          triggerRankUpVFX(buttonElement as HTMLElement);
        }
        
        // Trigger achievement VFX for milestones
        if (result.achievement_unlocked && buttonElement) {
          triggerAchievementVFX(buttonElement as HTMLElement, result.achievement_rarity || 'common');
        }
        
        // Trigger cosmic event for major milestones
        if (result.major_milestone) {
          triggerCosmicEventVFX();
        }
      }
      
      // Close activity dialog
      setShowActivityDialog(false);
      
      // Reload all competition data to get fresh stats
      await loadAllCompetitionData();
      
      // Check for achievements and milestones
      await checkAchievements();
      
    } catch (error: any) {
      console.error('Failed to submit activity:', error);
      toast.error(error.message || 'Failed to submit activity');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Check for achievements after activity submission
  const checkAchievements = async () => {
    if (!competitionStats || !selectedPlayer) return;
    
    // Simple achievement checking based on current stats
    const playerStats = leaderboard.find(p => p.player_name === selectedPlayer.name);
    if (!playerStats) return;
    
    const checkStats = {
      total_entries: playerStats.entries,
      booking_count: playerStats.entries, // Simplified for demo
      consecutive_activities: 1, // Would need tracking
      is_winning_team: competitionStats.leading_team === teamAssignments?.your_team
    };
    
    // Check each achievement
    ACHIEVEMENTS.forEach(achievement => {
      if (achievement.condition(checkStats) && !earnedAchievements.includes(achievement.id)) {
        setEarnedAchievements(prev => [...prev, achievement.id]);
        toast.success(`🏆 Achievement Unlocked: ${achievement.name}! ${achievement.icon}`);
      }
    });
  };
  
  // Handle celebration completion
  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    setCelebrationType('');
  };

  // Helper to get team color
  const getTeamColor = (teamName: string) => {
    if (!teamLeaderboard) return 'text-gray-400';
    if (teamName === teamLeaderboard.team_a.team_name) {
      return 'text-blue-400'; // Team A = Blue
    } else if (teamName === teamLeaderboard.team_b.team_name) {
      return 'text-purple-400'; // Team B = Purple  
    }
    return 'text-gray-400';
  };

  const getTeamBgColor = (teamName: string) => {
    if (!teamLeaderboard) return 'bg-gray-800/50';
    if (teamName === teamLeaderboard.team_a.team_name) {
      return 'bg-blue-900/30 border-blue-500/30';
    } else if (teamName === teamLeaderboard.team_b.team_name) {
      return 'bg-purple-900/30 border-purple-500/30';
    }
    return 'bg-gray-800/50';
  };

  // Don't render if no active competitions
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/90 to-pink-900/60 border-pink-500/40 backdrop-blur-sm shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-400" />
            <span className="ml-2 text-pink-200">Loading competitions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeCompetitions.length === 0) {
    return null; // Hide widget when no active competitions
  }

  const currentPlayerPosition = selectedPlayer 
    ? leaderboard.findIndex(p => p.player_name === selectedPlayer.name) + 1
    : null;
  const currentPlayerScore = selectedPlayer 
    ? leaderboard.find(p => p.player_name === selectedPlayer.name)?.total_points || 0
    : 0;

  return (
    <>
      {/* Celebration Animation Overlay */}
      <CelebrationAnimation 
        show={showCelebration} 
        type={celebrationType} 
        onComplete={handleCelebrationComplete} 
      />
      
      <Card className="bg-gradient-to-br from-slate-900/90 to-pink-900/90 border-pink-500/50 text-white shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                <Sword className="w-6 h-6 text-pink-400" />
                Team Battle Arena
              </CardTitle>
              <CardDescription className="text-pink-200">
                Join the cosmic competition and lead your team to victory!
              </CardDescription>
            </div>
            {selectedCompetition && (
              <div className="text-right">
                <div className="text-sm text-pink-300">Competition</div>
                <div className="font-bold text-white">{selectedCompetition.name}</div>
                {selectedCompetition.description && (
                  <div className="text-xs text-pink-200 max-w-xs text-right">{selectedCompetition.description}</div>
                )}
                <div className="text-xs text-pink-400">{timeRemaining}</div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Competition Selection */}
          {activeCompetitions.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pink-300">Active Competitions</label>
              <Select 
                value={selectedCompetition?.id.toString() || ''} 
                onValueChange={(value) => {
                  const competition = activeCompetitions.find(c => c.id.toString() === value);
                  setSelectedCompetition(competition || null);
                }}
              >
                <SelectTrigger className="bg-slate-800/50 border-pink-500/50 text-white">
                  <SelectValue placeholder="Select a competition" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-pink-500/50">
                  {activeCompetitions.map((competition) => (
                    <SelectItem key={competition.id} value={competition.id.toString()} className="text-white hover:bg-pink-600/30">
                      🏆 {competition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin text-4xl mb-2">🌌</div>
              <p className="text-pink-300">Loading competition data...</p>
            </div>
          )}
          
          {!loading && activeCompetitions.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🚀</div>
              <p className="text-pink-300">No active competitions found.</p>
              <p className="text-sm text-pink-400">Check back later for new team battles!</p>
            </div>
          )}
          
          {!loading && selectedCompetition && (
            <>
              {/* Achievement Badges Display */}
              {earnedAchievements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-white flex items-center gap-1">
                    <Medal className="w-4 h-4 text-yellow-400" />
                    Your Battle Honors
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {ACHIEVEMENTS.map((achievement) => (
                      <AchievementBadge 
                        key={achievement.id} 
                        achievement={achievement} 
                        earned={earnedAchievements.includes(achievement.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Team Milestones */}
              {teamMilestones.length > 0 && (
                <div className="space-y-2">
                  {teamMilestones.slice(0, 3).map((milestone, index) => (
                    <TeamMilestone 
                      key={index}
                      milestone={milestone.milestone}
                      teamName={milestone.teamName}
                      points={milestone.points}
                    />
                  ))}
                </div>
              )}
              
              {/* Team vs Team Battle Display */}
              {showTeamView && teamLeaderboard && (
                <div className="space-y-4">
                  {/* Team Battle Status */}
                  <div className="bg-gradient-to-r from-blue-900/30 via-slate-800/50 to-purple-900/30 rounded-lg border border-pink-500/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-pink-400" />
                        Team Battle Arena
                      </h3>
                      <div className="text-right">
                        <div className="text-xs text-pink-300">Time Remaining</div>
                        <div className="font-bold text-pink-400">{timeRemaining}</div>
                      </div>
                    </div>
                    
                    {/* Team vs Team Scores */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/30 text-center">
                        <div className="text-blue-400 font-bold text-2xl">{teamLeaderboard.team_a.total_points}</div>
                        <div className="text-white font-semibold">{teamLeaderboard.team_a.team_name}</div>
                        <div className="text-blue-300 text-xs">{teamLeaderboard.team_a.member_count} warriors</div>
                      </div>
                      <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/30 text-center">
                        <div className="text-purple-400 font-bold text-2xl">{teamLeaderboard.team_b.total_points}</div>
                        <div className="text-white font-semibold">{teamLeaderboard.team_b.team_name}</div>
                        <div className="text-purple-300 text-xs">{teamLeaderboard.team_b.member_count} warriors</div>
                      </div>
                    </div>
                    
                    {/* Battle Progress Bar */}
                    <div className="relative">
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
                          style={{
                            width: teamLeaderboard.team_a.total_points + teamLeaderboard.team_b.total_points > 0 
                              ? `${(teamLeaderboard.team_a.total_points / (teamLeaderboard.team_a.total_points + teamLeaderboard.team_b.total_points)) * 100}%`
                              : '50%'
                          }}
                        />
                      </div>
                      <div className="absolute top-3 left-0 right-0 flex justify-between text-xs">
                        <span className="text-blue-400 font-semibold">{teamLeaderboard.team_a.team_name} Leading</span>
                        <span className="text-purple-400 font-semibold">{teamLeaderboard.team_b.team_name} Leading</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Team Assignments */}
                  {teamAssignments && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
                        <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          Your Squad ({teamAssignments.your_team})
                        </h4>
                        <div className="space-y-1">
                          {teamAssignments.teammates.map((teammate, index) => (
                            <div key={index} className="text-sm text-blue-200 flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                              {teammate}
                              {teammate === selectedPlayer?.name && (
                                <span className="text-xs bg-blue-600/50 px-1.5 py-0.5 rounded">YOU</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/30">
                        <h4 className="font-semibold text-purple-400 mb-2 flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          Enemy Forces ({teamAssignments.opposing_team})
                        </h4>
                        <div className="space-y-1">
                          {teamAssignments.opponents.map((opponent, index) => (
                            <div key={index} className="text-sm text-purple-200 flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                              {opponent}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Enhanced Competition Statistics & Analytics */}
              {competitionStats && (
                <div className="space-y-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-pink-400" />
                    Battle Intelligence
                  </h3>
                  
                  {/* Competition Overview Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-pink-500/30 text-center">
                      <div className="text-pink-400 text-xl font-bold">{competitionStats.total_participants}</div>
                      <div className="text-pink-200 text-xs">Total Warriors</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-pink-500/30 text-center">
                      <div className="text-pink-400 text-xl font-bold">{competitionStats.total_entries}</div>
                      <div className="text-pink-200 text-xs">Battle Actions</div>
                    </div>
                  </div>
                  
                  {/* Most Active Player & Leading Team */}
                  <div className="space-y-2">
                    {competitionStats.most_active_player && (
                      <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-3 border border-yellow-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400 text-lg">⚡</span>
                            <span className="text-white text-sm">Most Active Warrior</span>
                          </div>
                          <div className="text-yellow-400 font-bold">{competitionStats.most_active_player}</div>
                        </div>
                      </div>
                    )}
                    
                    {competitionStats.leading_team && (
                      <div className={`bg-gradient-to-r ${competitionStats.leading_team === teamLeaderboard?.team_a.team_name ? 'from-blue-900/30 to-blue-800/30 border-blue-500/30' : 'from-purple-900/30 to-purple-800/30 border-purple-500/30'} rounded-lg p-3 border`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400 text-lg">👑</span>
                            <span className="text-white text-sm">Commandment Team</span>
                          </div>
                          <div className={`${competitionStats.leading_team === teamLeaderboard?.team_a.team_name ? 'text-blue-400' : 'text-purple-400'} font-bold`}>
                            {competitionStats.leading_team}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Team Momentum Indicators */}
                  {showTeamView && competitionStats.recent_activity.length > 0 && (
                    <div className="bg-slate-800/50 rounded-lg border border-pink-500/30 p-3">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-pink-400" />
                        Team Momentum
                      </h4>
                      
                      {/* Calculate momentum for last 5 activities */}
                      {(() => {
                        const recentActivities = competitionStats.recent_activity.slice(0, 5);
                        const teamAMomentum = recentActivities.filter(a => 
                          teamLeaderboard?.team_a.team_name && a.team_name === teamLeaderboard.team_a.team_name
                        ).length;
                        const teamBMomentum = recentActivities.filter(a => 
                          teamLeaderboard?.team_b.team_name && a.team_name === teamLeaderboard.team_b.team_name
                        ).length;
                        
                        return (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${teamAMomentum > teamBMomentum ? 'bg-green-400 animate-pulse' : teamAMomentum < teamBMomentum ? 'bg-red-400' : 'bg-yellow-400'}`}></div>
                              <span className="text-blue-400 text-sm">{teamLeaderboard?.team_a.team_name}</span>
                              <span className="text-white text-xs">({teamAMomentum}/5 recent)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-white text-xs">({teamBMomentum}/5 recent)</span>
                              <span className="text-purple-400 text-sm">{teamLeaderboard?.team_b.team_name}</span>
                              <div className={`w-3 h-3 rounded-full ${teamBMomentum > teamAMomentum ? 'bg-green-400 animate-pulse' : teamBMomentum < teamAMomentum ? 'bg-red-400' : 'bg-yellow-400'}`}></div>
                            </div>
                          </div>
                        );
                      })()}
                      
                      <div className="text-xs text-pink-300 mt-2 text-center">
                        {competitionStats.recent_activity.length > 0 
                          ? `Last activity: ${new Date(competitionStats.recent_activity[0].created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo' })}`
                          : 'No recent activity'
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* View Toggle Buttons */}
              <div className="flex bg-slate-800/50 rounded-lg p-1 border border-pink-500/30">
                <Button
                  size="sm"
                  variant={showTeamView ? "default" : "outline"}
                  onClick={() => setShowTeamView(true)}
                  className="flex-1"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Team Battle
                </Button>
                <Button
                  size="sm"
                  variant={!showTeamView ? "default" : "outline"}
                  onClick={() => setShowTeamView(false)}
                  className="flex-1"
                >
                  <Trophy className="w-4 h-4 mr-1" />
                  Individual
                </Button>
              </div>
              
              {/* Quick Activity Logging */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">Log Activity</h4>
                  <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm"
                        disabled={!selectedPlayer}
                        className="bg-pink-600 hover:bg-pink-700 text-white border-pink-500/50"
                      >
                        <Activity className="w-4 h-4 mr-1" />
                        Quick Log
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="bg-gradient-to-br from-slate-900/95 to-pink-900/95 border-pink-500/50 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                          ⚡ Log Battle Activity
                        </DialogTitle>
                        <DialogDescription className="text-pink-200">
                          Strike a blow for {teamAssignments?.your_team}! Every activity counts in the team battle!
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid gap-3 py-4">
                        {ACTIVITY_TYPES.map((activity) => (
                          <Button
                            key={activity.type}
                            onClick={() => submitActivity(activity.type, activity.points)}
                            disabled={submitting}
                            className={`
                              ${activity.color} hover:${activity.color}/80 text-white
                              h-16 text-lg font-semibold transition-all duration-200
                              ${activity.glowColor} hover:scale-105
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{activity.icon}</span>
                              <div className="text-left">
                                <div>{activity.label}</div>
                                <div className="text-sm opacity-80">+{activity.points} points</div>
                              </div>
                              <div className="ml-auto">
                                <Zap className="w-5 h-5" />
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Quick action buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITY_TYPES.map((activity) => (
                    <Button
                      key={activity.type}
                      onClick={() => submitActivity(activity.type, activity.points)}
                      disabled={submitting || !selectedPlayer}
                      size="sm"
                      className={`
                        ${activity.color} hover:${activity.color}/80 text-white
                        transition-all duration-200 hover:scale-105
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <span className="text-lg mr-1">{activity.icon}</span>
                      <div className="text-xs">
                        <div>{activity.label}</div>
                        <div>+{activity.points}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Live Activity Feed or Leaderboard based on view */}
              {showTeamView ? (
                activityFeed.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white flex items-center gap-1">
                      <Activity className="w-4 h-4 text-pink-400" />
                      Live Team Activity
                    </h4>
                    <div className="bg-slate-800/50 rounded-lg border border-pink-500/30 max-h-32 overflow-y-auto">
                      {activityFeed.slice(0, 8).map((activity, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 text-sm border-b border-pink-500/10 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${getTeamColor(activity.team_name)}`}>
                              {activity.player_name}
                            </span>
                            <span className="text-gray-400">logged</span>
                            <span className="text-white">
                              {ACTIVITY_TYPES.find(a => a.type === activity.activity_type)?.icon} 
                              {ACTIVITY_TYPES.find(a => a.type === activity.activity_type)?.label}
                            </span>
                          </div>
                          <div className="font-semibold text-pink-400">+{activity.points}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                leaderboard.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-pink-400" />
                      Individual Leaderboard
                      {isCompetitionV2 && <CompetitionV2Badge />}
                    </h4>
                    
                    {/* Competition 2.0 Enhanced Scoreboard */}
                    {isCompetitionV2 && scoreboardV2 ? (
                      <div className="space-y-3">
                        {scoreboardV2.individual_leaderboard.slice(0, 5).map((player, index) => (
                          <PlayerScoreV2 key={player.player_name} player={player} rank={index + 1} />
                        ))}
                        {scoreboardV2.individual_leaderboard.length > 5 && (
                          <div className="p-3 text-center text-xs text-purple-300 border border-purple-500/30 rounded-lg bg-slate-800/30">
                            <Sparkles className="w-4 h-4 inline mr-1" />
                            ... and {scoreboardV2.individual_leaderboard.length - 5} more cosmic warriors
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Competition 1.0 Classic Leaderboard */
                      <div className="bg-slate-800/50 rounded-lg border border-pink-500/30 max-h-40 overflow-y-auto">
                        {leaderboard.slice(0, 5).map((player, index) => (
                          <div 
                            key={player.player_name}
                            className={`
                              flex items-center justify-between p-2 text-sm
                              ${player.player_name === selectedPlayer?.name 
                                ? 'bg-pink-600/30 border-l-2 border-pink-400' 
                                : ''}
                              ${index === 0 ? 'text-yellow-400 font-bold' : 'text-white'}
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono w-6">#{index + 1}</span>
                              <span className={`${player.team_name ? getTeamColor(player.team_name) : 'text-white'}`}>
                                {player.player_name}
                              </span>
                              {index === 0 && <span>👑</span>}
                              {player.team_name && (
                                <Badge className={`${getTeamBgColor(player.team_name)} text-xs`}>
                                  {player.team_name}
                                </Badge>
                              )}
                            </div>
                            <div className="font-semibold">{player.total_points} pts</div>
                          </div>
                        ))}
                        {leaderboard.length > 5 && (
                          <div className="p-2 text-center text-xs text-pink-300 border-t border-pink-500/20">
                            ... and {leaderboard.length - 5} more players
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}
              
              {!selectedPlayer && (
                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3">
                  <p className="text-yellow-200 text-sm">
                    ⚠️ Please select a player in the main dashboard to join the team battle.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default BookingCompetitionWidget;
