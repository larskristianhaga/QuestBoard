import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import brain from 'brain';
import { toast } from 'sonner';
import {
  Activity, Target, Plus, Edit, Trash2, BarChart3, Users, 
  AlertTriangle, Loader2, Clock, Calendar, TrendingUp, UserCheck,
  Search, Settings, Award, Home, Trophy, Eye, Shield, Zap, Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type {
  QuarterResponse, ActivityLogResponse, PlayerGoalResponse, TeamGoalResponse,
  ChallengeTemplateResponse, CreateChallengeTemplateRequest, UpdateChallengeTemplateRequest,
  CreateChallengeRuleRequest, ChallengeRuleResponse,
  GetActiveChallengesRequest, UpdateQuarterStatusRequest,
  ActiveChallengeResponse
} from 'types';
import EditPlayerGoalsModal from 'components/EditPlayerGoalsModal';
import ChallengeTemplateForm from 'components/ChallengeTemplateForm';
import { DirectChallengeForm } from 'components/DirectChallengeForm';
import ChallengePreviewPanel from 'components/ChallengePreviewPanel';
import { CompetitionBuilder } from 'components/CompetitionBuilder';
import { EditChallengeModal } from 'components/EditChallengeModal';
import TeamAssetGenerator from 'components/TeamAssetGenerator';
import { callBrain, ApiError } from 'utils/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // Authentication and loading state
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data state
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null);
  const [competitionLeaderboard, setCompetitionLeaderboard] = useState<any[]>([]);
  const [competitionEntries, setCompetitionEntries] = useState<any[]>([]);
  
  // Player and goals data
  const [playerGoals, setPlayerGoals] = useState<PlayerGoalResponse[]>([]);
  const [teamGoals, setTeamGoals] = useState<TeamGoalResponse | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLogResponse[]>([]);
  
  // Challenge management
  const [challengeTemplates, setChallengeTemplates] = useState<ChallengeTemplateResponse[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallengeResponse[]>([]);
  const [challengeRules, setChallengeRules] = useState<ChallengeRuleResponse[]>([]);
  
  // Loading states
  const [loadingPlayerData, setLoadingPlayerData] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [loadingCompetitions, setLoadingCompetitions] = useState(false);
  const [loadingQuickLog, setLoadingQuickLog] = useState(false);
  const [generatingChallenges, setGeneratingChallenges] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  
  // UI state
  const [showCreateQuarter, setShowCreateQuarter] = useState(false);
  const [newQuarterData, setNewQuarterData] = useState({ quarter_year: 2024, quarter_number: 1 });
  const [showCreateCompetition, setShowCreateCompetition] = useState(false);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedPlayerForQuickLog, setSelectedPlayerForQuickLog] = useState<string>('');
  const [bulkActivityType, setBulkActivityType] = useState<string>('LIFT');
  const [bulkCount, setBulkCount] = useState<number>(1);
  
  // Player goals modal
  const [showEditPlayer, setShowEditPlayer] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerGoalResponse | null>(null);
  
  // Challenge management modals
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editingChallenge, setEditingChallenge] = useState<any>(null);
  const [editingCompetition, setEditingCompetition] = useState<any>(null);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deletingChallenge, setDeletingChallenge] = useState<number | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<number | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<any>(null);
  const [toggleVisibilityConfirm, setToggleVisibilityConfirm] = useState<any>(null);
  
  // Challenge revocation
  const [revokeConfirm, setRevokeConfirm] = useState<{
    challengeId: number;
    challengeTitle: string;
    playerName: string;
    pointsToRemove: number;
  } | null>(null);
  const [revokingChallenge, setRevokingChallenge] = useState<number | null>(null);
  
  // Check admin access on mount
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await brain.is_admin();
        const data: IsAdminResponse = await response.json();
        setIsAdmin(data.is_admin);
        
        if (!data.is_admin) {
          toast.error('Access denied: Admin privileges required');
          navigate('/');
          return;
        }
        
        // Load initial data
        await loadQuarters();
      } catch (error) {
        console.error('Admin check failed:', error);
        toast.error('Failed to verify admin access');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const loadQuarters = async () => {
    try {
      const response = await brain.get_quarters();
      const data: QuarterResponse[] = await response.json();
      setQuarters(data);
      
      // Auto-select most recent quarter
      if (data.length > 0 && !selectedQuarter) {
        const mostRecentQuarter = data.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];
        setSelectedQuarter(mostRecentQuarter.id);
      }
    } catch (error) {
      console.error('Failed to load quarters:', error);
      toast.error('Failed to load quarters');
    }
  };

  const loadPlayerData = async (quarterId: number) => {
    setLoadingPlayerData(true);
    try {
      const [playersResponse, teamGoalsResponse] = await Promise.all([
        brain.get_player_goals({ quarterId }),
        brain.get_team_goals({ quarterId })
      ]);
      
      const playersData: PlayerGoalResponse[] = await playersResponse.json();
      const teamGoalsData: TeamGoalResponse = await teamGoalsResponse.json();
      
      setPlayerGoals(playersData);
      setTeamGoals(teamGoalsData);
    } catch (error) {
      console.error('Failed to load player data:', error);
      toast.error('Failed to load player data');
    } finally {
      setLoadingPlayerData(false);
    }
  };

  const loadActivities = async (quarterId?: number) => {
    try {
      const params = quarterId ? { quarter_id: quarterId, limit: 50 } : { limit: 50 };
      const response = await brain.get_activity_logs(params);
      const data: ActivityLogResponse[] = await response.json();
      setActivityLogs(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
      toast.error('Failed to load activity logs');
    }
  };

  const loadChallengeData = async (quarterId?: number) => {
    setLoadingChallenges(true);
    try {
      const [templatesResult, challengesResult] = await Promise.allSettled([
        callBrain<ChallengeTemplateResponse[]>(() => brain.get_challenge_templates(), { retries: 1 }),
        callBrain<ActiveChallengeResponse[]>(
          () => (quarterId ? brain.get_active_challenges({ quarter_id: quarterId }) : brain.get_active_challenges({})),
          { retries: 1 }
        ),
      ]);

      if (templatesResult.status === 'fulfilled') {
        setChallengeTemplates(templatesResult.value);
      } else {
        setChallengeTemplates([]);
        const err: any = templatesResult.reason;
        if (err instanceof ApiError) {
          if (err.causeType === 'network') toast.error('Failed to load templates: network issue.');
          else toast.error(`Failed to load templates${err.status ? ` (HTTP ${err.status})` : ''}.`);
        } else {
          toast.error('Failed to load templates.');
        }
      }

      if (challengesResult.status === 'fulfilled') {
        setActiveChallenges(challengesResult.value);
      } else {
        setActiveChallenges([]);
        const err: any = challengesResult.reason;
        if (err instanceof ApiError) {
          if (err.causeType === 'network') toast.error('Failed to load challenges: network issue.');
          else toast.error(`Failed to load challenges${err.status ? ` (HTTP ${err.status})` : ''}.`);
        } else {
          toast.error('Failed to load challenges.');
        }
      }
    } finally {
      setLoadingChallenges(false);
    }
  };

  const loadActivityHistory = async (quarterId: number) => {
    try {
      const [templatesResult, challengesResult] = await Promise.allSettled([
        callBrain<ChallengeTemplateResponse[]>(() => brain.get_challenge_templates(), { retries: 1 }),
        callBrain<ActiveChallengeResponse[]>(
          () => (quarterId ? brain.get_active_challenges({ quarter_id: quarterId }) : brain.get_active_challenges({})),
          { retries: 1 }
        ),
      ]);

      if (templatesResult.status === 'fulfilled') {
        setChallengeTemplates(templatesResult.value);
      } else {
        setChallengeTemplates([]);
        const err: any = templatesResult.reason;
        if (err instanceof ApiError) {
          if (err.causeType === 'network') toast.error('Failed to load templates: network issue.');
          else toast.error(`Failed to load templates${err.status ? ` (HTTP ${err.status})` : ''}.`);
        } else {
          toast.error('Failed to load templates.');
        }
      }

      if (challengesResult.status === 'fulfilled') {
        setActiveChallenges(challengesResult.value);
      } else {
        setActiveChallenges([]);
        const err: any = challengesResult.reason;
        if (err instanceof ApiError) {
          if (err.causeType === 'network') toast.error('Failed to load challenges: network issue.');
          else toast.error(`Failed to load challenges${err.status ? ` (HTTP ${err.status})` : ''}.`);
        } else {
          toast.error('Failed to load challenges.');
        }
      }
    } finally {
      setLoadingChallenges(false);
    }
  };

  const loadCompetitionsData = async () => {
    setLoadingCompetitions(true);
    try {
      const response = await brain.list_competitions();
      const responseData = await response.json();
      const data: CompetitionResponse[] = Array.isArray(responseData) ? responseData : responseData.data || [];
      setCompetitions(data);
      
      // Auto-select most recent active competition
      if (data.length > 0 && !selectedCompetition) {
        const activeCompetition = data.find(c => c.is_active) || data[0];
        setSelectedCompetition(activeCompetition.id);
      }
    } catch (error) {
      console.error('Failed to load competitions:', error);
      toast.error('Failed to load competitions');
      setCompetitions([]);
    } finally {
      setLoadingCompetitions(false);
    }
  };

  const loadCompetitionDetails = async (competitionId: number) => {
    try {
      const [leaderboardResponse, entriesResponse] = await Promise.all([
        brain.leaderboard({ competitionId }),
        brain.get_activity_logs({ competitionId })
      ]);
      
      const leaderboardData = await leaderboardResponse.json();
      const entriesData = await entriesResponse.json();
      
      // Fix: leaderboard API returns LeaderboardResponse with 'rows' property
      setCompetitionLeaderboard(leaderboardData.rows || []);
      // Fix: entries API returns object with 'entries' property  
      setCompetitionEntries(entriesData.entries || []);
    } catch (error) {
      console.error('Failed to load competition details:', error);
      toast.error('Failed to load competition details');
      // Reset state on error
      setCompetitionLeaderboard([]);
      setCompetitionEntries([]);
    }
  };

  const generateChallenges = async () => {
    if (!selectedQuarter) {
      toast.error('Please select a quarter first');
      return;
    }
    
    setGeneratingChallenges(true);
    try {
      const response = await brain.generate_challenges({ quarter_id: selectedQuarter });
      const data: GenerateChallengesResponse = await response.json();
      
      if (data.success) {
        toast.success(`Generated ${data.generated_count} new challenges!`);
        // Reload active challenges
        await loadChallengeData(selectedQuarter);
      } else {
        toast.error('Failed to generate challenges');
      }
    } catch (error) {
      console.error('Failed to generate challenges:', error);
      toast.error('Failed to generate challenges');
    } finally {
      setGeneratingChallenges(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadQuarters();
  }, []);

  // Load quarter-specific data when selectedQuarter changes
  useEffect(() => {
    if (selectedQuarter) {
      loadPlayerData(selectedQuarter);
      loadChallengeData(selectedQuarter);
      loadActivityHistory(selectedQuarter);
    }
  }, [selectedQuarter]);

  // Load competition data when selectedCompetition changes
  useEffect(() => {
    if (selectedCompetition) {
      loadCompetitionData(selectedCompetition);
    } else {
      // Clear data when no competition is selected
      setCompetitionLeaderboard([]);
      setCompetitionEntries([]);
    }
  }, [selectedCompetition]);

  // Handler functions for modals and actions
  const handleCreateQuarter = async (quarter: QuarterResponse) => {
    // Reload quarters list after creation
    await loadQuarters();
    toast.success(`Quarter "${quarter.name}" created successfully!`);
  };

  const handleDeleteQuarter = async (quarterId: number, quarterName: string) => {
    if (!confirm(`Are you sure you want to delete quarter "${quarterName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await brain.delete_quarter({ quarterId });
      await loadQuarters();
      
      // Reset selected quarter if it was deleted
      if (selectedQuarter === quarterId) {
        setSelectedQuarter(null);
      }
      
      toast.success(`Quarter "${quarterName}" deleted successfully!`);
    } catch (error) {
      console.error('Failed to delete quarter:', error);
      toast.error('Failed to delete quarter');
    }
  };

  const handleEditPlayer = (player: PlayerGoalResponse) => {
    setSelectedPlayer(player);
    setShowEditPlayer(true);
  };

  const handlePlayerGoalsUpdated = async () => {
    // Reload player data and team goals after update
    if (selectedQuarter) {
      await loadPlayerData(selectedQuarter);
    }
    toast.success('Player goals updated successfully!');
  }

  // Challenge management handlers
  const handleRevokeChallenge = async (challenge: ActiveChallengeResponse) => {
    if (challenge.status !== 'completed' || !challenge.completed_by) {
      toast.error('Can only revoke completed challenges');
      return;
    }

    setRevokeConfirm({
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      playerName: challenge.completed_by,
      pointsToRemove: challenge.reward_points
    });
  };

  const confirmRevokeChallenge = async () => {
    if (!revokeConfirm) return;

    setRevokingChallenge(revokeConfirm.challengeId);
    try {
      const response = await brain.revoke_challenge_completion({ challengeId: revokeConfirm.challengeId });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Revoked challenge completion. Removed ${revokeConfirm.pointsToRemove} points from ${revokeConfirm.playerName}`);
        // Reload active challenges and player data
        if (selectedQuarter) {
          await loadChallengeData(selectedQuarter);
          await loadPlayerData(selectedQuarter);
        }
      } else {
        toast.error('Failed to revoke challenge completion');
      }
    } catch (error) {
      console.error('Failed to revoke challenge:', error);
      toast.error('Failed to revoke challenge completion');
    } finally {
      setRevokingChallenge(null);
      setRevokeConfirm(null);
    }
  };

  const handleToggleVisibility = async (challenge: ActiveChallengeResponse) => {
    // Need to get current visibility - let's assume it's visible by default since we're showing it
    setToggleVisibilityConfirm({
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      currentVisibility: true // We'll improve this later by adding is_visible to the response
    });
  };

  const confirmToggleVisibility = async () => {
    if (!toggleVisibilityConfirm) return;

    setTogglingVisibility(toggleVisibilityConfirm.challengeId);
    try {
      const response = await brain.toggle_challenge_visibility(
        { challengeId: toggleVisibilityConfirm.challengeId },
        { is_visible: !toggleVisibilityConfirm.currentVisibility }
      );
      const data = await response.json();
      
      if (data.success) {
        const action = !toggleVisibilityConfirm.currentVisibility ? 'published' : 'unpublished';
        toast.success(`Challenge ${action} successfully`);
        // Reload active challenges
        if (selectedQuarter) {
          await loadChallengeData(selectedQuarter);
        }
      } else {
        toast.error('Failed to toggle challenge visibility');
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      toast.error('Failed to toggle challenge visibility');
    } finally {
      setTogglingVisibility(null);
      setToggleVisibilityConfirm(null);
    }
  };

  const handleTemplateSuccess = async () => {
    await loadChallengeData(selectedQuarter || undefined);
    setShowCreateTemplate(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = async (template: ChallengeTemplateResponse) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }
    
    try {
      await callBrain(() => brain.delete_challenge_template({ templateId: template.id }), { retries: 1 });
      await loadChallengeData(selectedQuarter || undefined);
      toast.success('Template deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      if (error instanceof ApiError) {
        const msg = error.message || 'Failed to delete template';
        toast.error(`${msg}${error.status ? ` (HTTP ${error.status})` : ''}`);
      } else {
        toast.error('Failed to delete template');
      }
    }
  };

  const handleDeleteActivity = async (activity: ActivityLogResponse) => {
    const isBonus = activity.activity_type === 'bonus_challenge';
    const actionText = isBonus ? 'revoke bonus challenge completion' : 'delete activity';
    const itemText = isBonus ? activity.challenge_title : `${activity.activity_type} activity`;
    
    if (!confirm(`Are you sure you want to ${actionText}?\n\n${itemText} by ${activity.player_name} (+${activity.points} points)`)) {
      return;
    }
    
    try {
      await brain.delete_activity({ 
        activityId: activity.id, 
        activity_type: activity.activity_type 
      });
      await loadActivities(selectedQuarter || undefined);
      
      if (isBonus) {
        toast.success(`Bonus challenge revoked! Removed ${activity.points} points from ${activity.player_name}`);
      } else {
        toast.success(`Activity deleted! Removed ${activity.points} points from ${activity.player_name}`);
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
      toast.error(`Failed to ${actionText}`);
    }
  };

  const handleDeleteChallenge = async (challenge: ActiveChallengeResponse) => {
    if (!confirm(`Are you sure you want to delete the challenge "${challenge.title}"?`)) {
      return;
    }
    
    setDeletingChallenge(challenge.id);
    try {
      await brain.delete_challenge({ challengeId: challenge.id });
      await loadChallengeData(selectedQuarter || undefined);
      toast.success(`Challenge "${challenge.title}" deleted successfully!`);
    } catch (error) {
      console.error(`Failed to delete challenge "${challenge.title}":`, error);
      toast.error(`Failed to delete challenge "${challenge.title}"`);
    } finally {
      setDeletingChallenge(null);
    }
  };

  const handleChallengeEdited = async () => {
    // Reload challenge data after successful edit
    if (selectedQuarter) {
      await loadChallengeData(selectedQuarter);
    }
    toast.success('Challenge updated successfully!');
  };

  const handleChallengeCreated = async () => {
    // Reload challenge data after successful creation
    if (selectedQuarter) {
      await loadChallengeData(selectedQuarter);
    }
    toast.success('Challenge created successfully!');
  };

  const handleCreateCompetition = async () => {
    // Reload competitions list after creation
    await loadCompetitionsData();
  };

  const handleDeleteCompetition = async (competitionId: number, competitionName: string) => {
    if (!confirm(`Are you sure you want to delete quarter "${competitionName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await brain.delete_quarter({ quarterId });
      await loadQuarters();
      
      // Reset selected quarter if it was deleted
      if (selectedQuarter === quarterId) {
        setSelectedQuarter(null);
      }
      
      toast.success(`Quarter "${competitionName}" deleted successfully!`);
    } catch (error) {
      console.error('Failed to delete quarter:', error);
      toast.error('Failed to delete quarter');
    }
  };

  const handleEditCompetition = (competition: CompetitionResponse) => {
    setSelectedCompetition(competition);
    setShowCreateCompetition(true);
  };

  const handleCompetitionEntriesUpdated = async () => {
    // Reload player data and team goals after update
    if (selectedQuarter) {
      await loadPlayerData(selectedQuarter);
    }
    toast.success('Player goals updated successfully!');
  }

  const handleQuickLog = async (activityType: string, points: number) => {
    if (!selectedPlayerForQuickLog || !selectedCompetition) {
      toast.error('Please select a player and competition first');
      return;
    }
    
    setLoadingQuickLog(true);
    try {
      const response = await brain.quick_log_activity({ 
        competition_id: selectedCompetition,
        player_name: selectedPlayerForQuickLog,
        activity_type: activityType
      });
      const data = await response.json();
      
      toast.success(`Logged ${activityType} (${points}pts) for ${selectedPlayerForQuickLog}`);
      // Reload competition data
      await loadCompetitionData(selectedCompetition);
    } catch (error) {
      console.error(`Failed to log ${activityType} for ${selectedPlayerForQuickLog}:`, error);
      toast.error(`Failed to log ${activityType}`);
    } finally {
      setLoadingQuickLog(false);
    }
  };

  const handleBulkLog = async () => {
    if (!selectedPlayerForQuickLog || !selectedCompetition) {
      toast.error('Please select a player and competition first');
      return;
    }
    
    setLoadingQuickLog(true);
    try {
      const response = await brain.bulk_log_activities({ 
        competition_id: selectedCompetition,
        player_name: selectedPlayerForQuickLog,
        activity_type: bulkActivityType,
        count: bulkCount
      });
      const data = await response.json();
      
      toast.success(`Logged ${bulkCount} ${bulkActivityType} activities for ${selectedPlayerForQuickLog}`);
      // Reload competition data
      await loadCompetitionData(selectedCompetition);
    } catch (error) {
      console.error(`Failed to bulk log for ${selectedPlayerForQuickLog}:`, error);
      toast.error('Failed to bulk log activities');
    } finally {
      setLoadingQuickLog(false);
    }
  };

  const loadCompetitionData = async (competitionId: number) => {
    try {
      // Load leaderboard
      const leaderboardResponse = await brain.leaderboard_detailed({ competitionId });
      const leaderboardData = await leaderboardResponse.json();
      setCompetitionLeaderboard(leaderboardData.rows || []);
      
      // Load entries
      const entriesResponse = await brain.get_competition_entries({ competitionId });
      const entriesData = await entriesResponse.json();
      setCompetitionEntries(entriesData.entries || []);
    } catch (error) {
      console.error('Failed to load competition data:', error);
      toast.error('Failed to load competition data');
    }
  };

  const handleEditEntry = async (entryId: number, newPoints: number) => {
    try {
      const response = await brain.update_entry({ 
        entry_id: entryId,
        points: newPoints
      });
      const data = await response.json();
      
      toast.success('Entry updated successfully');
      if (selectedCompetition) {
        await loadCompetitionData(selectedCompetition);
      }
    } catch (error) {
      console.error('Failed to update entry:', error);
      toast.error('Failed to update entry');
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    
    setDeletingEntry(entryId);
    try {
      const response = await brain.delete_entry({ entry_id: entryId });
      const data = await response.json();
      
      toast.success('Entry deleted successfully');
      if (selectedCompetition) {
        await loadCompetitionData(selectedCompetition);
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast.error('Failed to delete entry');
    } finally {
      setDeletingEntry(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-purple-200">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return null; // Will be redirected
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                size="sm"
                className="border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">🔧 Admin Dashboard</h1>
                <p className="text-purple-200">Manage quarters, players, challenges, and system settings</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => navigate('/admin-competitions')}
                variant="outline"
                className="border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
              >
                <Trophy className="h-4 w-4 mr-1" />
                Booking Competitions
              </Button>
              <Button 
                onClick={() => setShowCreateQuarter(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Quarter
              </Button>
            </div>
          </div>
        </div>

        {/* Quarter Selector */}
        <Card className="mb-6 bg-slate-800/50 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Select Quarter</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quarters.map((quarter) => (
                <Button
                  key={quarter.id}
                  variant={selectedQuarter === quarter.id ? "default" : "outline"}
                  onClick={() => setSelectedQuarter(quarter.id)}
                  className="mb-2"
                >
                  {quarter.name}
                  <Badge variant="secondary" className="ml-2">
                    {new Date(quarter.start_date).toLocaleDateString()} - {new Date(quarter.end_date).toLocaleDateString()}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="quarters" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-slate-800/50">
            <TabsTrigger value="quarters" className="text-white data-[state=active]:bg-purple-600">
              <Calendar className="h-4 w-4 mr-2" />
              Quarters
            </TabsTrigger>
            <TabsTrigger value="players" className="text-white data-[state=active]:bg-purple-600">
              <Users className="h-4 w-4 mr-2" />
              Players
            </TabsTrigger>
            <TabsTrigger value="team-goals" className="text-white data-[state=active]:bg-purple-600">
              <Shield className="h-4 w-4 mr-2" />
              Team Goals
            </TabsTrigger>
            <TabsTrigger value="activities" className="text-white data-[state=active]:bg-purple-600">
              <Activity className="h-4 w-4 mr-2" />
              Activity Logs
            </TabsTrigger>
            <TabsTrigger value="challenges" className="text-white data-[state=active]:bg-purple-600">
              <Target className="h-4 w-4 mr-2" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="competitions" className="text-white data-[state=active]:bg-purple-600">
              <Trophy className="h-4 w-4 mr-2" />
              Competitions
            </TabsTrigger>
            <TabsTrigger value="assets" className="text-white data-[state=active]:bg-purple-600">
              <Sparkles className="h-4 w-4 mr-2" />
              Team Assets
            </TabsTrigger>
          </TabsList>

          {/* Quarters Tab */}
          <TabsContent value="quarters">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Quarter Management</CardTitle>
                <CardDescription className="text-purple-200">
                  Manage game quarters and time periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quarters.map((quarter) => (
                    <div
                      key={quarter.id}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-purple-500/20"
                    >
                      <div>
                        <h2 className="text-white font-semibold">
                          {quarter.name}
                        </h2>
                        <p className="text-purple-200 text-sm">
                          {new Date(quarter.start_date).toLocaleDateString()} - {new Date(quarter.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteQuarter(quarter.id, quarter.name)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => setShowCreateQuarter(true)}
                  >
                    Create New Quarter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Player Goal Management</CardTitle>
                <CardDescription className="text-purple-200">
                  Set individual goals for all 12 team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedQuarter ? (
                  loadingPlayerData ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                      <span className="ml-2 text-purple-200">Loading player data...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {playerGoals.map((player, index) => (
                        <div
                          key={`${selectedQuarter}-${player.player_name}-${index}`}
                          className="p-4 bg-slate-700/50 rounded-lg border border-purple-500/20"
                        >
                          <h3 className="text-white font-semibold mb-2">{player.player_name}</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-purple-200">
                              <span>Books Goal:</span>
                              <span>{player.goal_books} ({player.current_books})</span>
                            </div>
                            <div className="flex justify-between text-purple-200">
                              <span>Opps Goal:</span>
                              <span>{player.goal_opps} ({player.current_opps})</span>
                            </div>
                            <div className="flex justify-between text-purple-200">
                              <span>Deals Goal:</span>
                              <span>{player.goal_deals} ({player.current_deals})</span>
                            </div>
                            <div className="flex justify-between font-semibold text-white border-t border-purple-500/30 pt-2">
                              <span>Points:</span>
                              <span>{player.current_points}/{player.goal_points}</span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full mt-2 bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleEditPlayer(player)}
                          >
                            Edit Goals
                          </Button>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <p className="text-purple-200 text-center py-8">Select a quarter to manage player goals</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Goals Tab */}
          <TabsContent value="team-goals">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Team Goals Overview</CardTitle>
                <CardDescription className="text-purple-200">
                  Auto-calculated team totals from individual player goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamGoals && selectedQuarter ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-700/50 rounded-lg border border-purple-500/20">
                      <h3 className="text-white font-semibold">Books</h3>
                      <p className="text-2xl font-bold text-purple-400">{teamGoals.total_goal_books}</p>
                    </div>
                    <div className="text-center p-4 bg-slate-700/50 rounded-lg border border-purple-500/20">
                      <h3 className="text-white font-semibold">Opportunities</h3>
                      <p className="text-2xl font-bold text-purple-400">{teamGoals.total_goal_opps}</p>
                    </div>
                    <div className="text-center p-4 bg-slate-700/50 rounded-lg border border-purple-500/20">
                      <h3 className="text-white font-semibold">Deals</h3>
                      <p className="text-2xl font-bold text-purple-400">{teamGoals.total_goal_deals}</p>
                    </div>
                    <div className="text-center p-4 bg-slate-700/50 rounded-lg border border-purple-500/20">
                      <h3 className="text-white font-semibold">Total Points</h3>
                      <p className="text-2xl font-bold text-purple-400">{teamGoals.total_goal_points}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-purple-200 text-center py-8">Select a quarter to view team goals</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Activity Logs</CardTitle>
                <CardDescription className="text-purple-200">
                  Recent activity across all players - includes regular activities and bonus challenges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {activityLogs.map((activity) => (
                    <div
                      key={`${activity.activity_type}-${activity.id}`}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-purple-500/20"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={activity.activity_type === 'deal' ? 'default' : 'secondary'}
                          className={
                            activity.activity_type === 'deal' ? 'bg-green-600' : 
                            activity.activity_type === 'opp' ? 'bg-blue-600' : 
                            activity.activity_type === 'bonus_challenge' ? 'bg-purple-600' :
                            'bg-orange-600'
                          }
                        >
                          {activity.activity_type === 'bonus_challenge' ? 'BONUS' : activity.activity_type.toUpperCase()}
                        </Badge>
                        <div>
                          <span className="text-white font-medium">{activity.player_name}</span>
                          {activity.challenge_title && (
                            <p className="text-purple-300 text-sm">{activity.challenge_title}</p>
                          )}
                        </div>
                        <span className="text-purple-200 text-sm">{activity.quarter_name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-white font-semibold">+{activity.points} pts</p>
                          <p className="text-purple-200 text-xs">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteActivity(activity)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            {showCreateTemplate || editingTemplate ? (
              <ChallengeTemplateForm
                template={editingTemplate}
                onSuccess={handleTemplateSuccess}
                onCancel={() => {
                  setShowCreateTemplate(false);
                  setEditingTemplate(null);
                }}
              />
            ) : previewingTemplate ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-white text-lg font-semibold">
                    Template Preview
                  </h1>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewingTemplate(null)}
                    className="border-purple-500/30 text-purple-300"
                  >
                    Back to Templates
                  </Button>
                </div>
                <ChallengePreviewPanel
                  template={previewpreviewTemplate}
                  onGenerate={generateChallenges}
                  generatingChallenges={generatingChallenges}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Challenge Generation */}
                <Card className="bg-slate-800/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Challenge Generation</span>
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      Auto-generate challenges based on team performance and templates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button 
                          onClick={generateChallenges}
                          disabled={generatingChallenges || !selectedQuarter}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {generatingChallenges ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-1" />
                              Generate Challenges
                            </>
                          )}
                        </Button>
                        <div className="text-purple-200 text-sm">
                          {selectedQuarter ? 
                            `Generate challenges for selected quarter` : 
                            'Select a quarter to generate challenges'
                          }
                        </div>
                      </div>
                      <div className="text-right text-purple-100 text-sm">
                        <div>Active Templates: {challengeTemplates.filter(t => t.is_active).length}</div>
                        <div>Active Challenges: {activeChallenges.length}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Challenge Templates Management */}
                <Card className="bg-slate-800/50 border-purple-500/30">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-white flex items-center space-x-2">
                          <Target className="h-5 w-5" />
                          <span>Challenge Templates</span>
                        </CardTitle>
                        <CardDescription className="text-purple-200">
                          Manage templates for automatic challenge generation
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => setShowCreateTemplate(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create Template
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {challengeTemplates.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {challengeTemplates.map((template) => (
                          <div
                            key={template.id}
                            className="p-4 bg-slate-700/50 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-xl">{template.icon}</span>
                                <div className="flex flex-col space-y-1">
                                  <Badge variant="secondary" className="text-xs w-fit">
                                    {template.type.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                  <Badge 
                                    variant={template.is_active ? 'default' : 'secondary'}
                                    className={`text-xs w-fit ${
                                      template.is_active ? 'bg-green-600' : 'bg-gray-600'
                                    }`}
                                  >
                                    {template.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setPreviewingTemplate(template)}
                                  className="h-8 w-8 p-0 text-purple-300 hover:text-white hover:bg-purple-600/20"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingTemplate(template)}
                                  className="h-8 w-8 p-0 text-purple-300 hover:text-white hover:bg-purple-600/20"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteTemplate(template)}
                                  className="h-8 w-8 p-0 text-red-300 hover:text-white hover:bg-red-600/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <h3 className="text-white font-semibold mb-1 text-sm">{template.name}</h3>
                            <p className="text-purple-200 text-xs mb-3 line-clamp-2">{template.description}</p>
                            <div className="space-y-1 text-xs text-purple-200">
                              <div className="flex justify-between">
                                <span>Target:</span>
                                <span>{template.target_value_min}-{template.target_value_max}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Reward:</span>
                                <span>{template.reward_points_min}-{template.reward_points_max} pts</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Duration:</span>
                                <span>{template.duration_hours}h</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Type:</span>
                                <span className="capitalize">{template.target_type}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <p className="text-purple-200 mb-4">No challenge templates found</p>
                        <Button
                          onClick={() => setShowCreateTemplate(true)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Create Your First Template
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Active Challenges Monitor */}
                <Card className="bg-slate-800/50 border-purple-500/30">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-white flex items-center space-x-2">
                          <Trophy className="h-5 w-5" />
                          <span>Active Challenges Monitor</span>
                        </CardTitle>
                        <CardDescription className="text-purple-200">
                          Live monitoring of currently running challenges
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => setShowCreateChallenge(true)}
                        disabled={!selectedQuarter}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Challenge
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingChallenges ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                        <span className="ml-1 text-purple-200">Loading challenges...</span>
                      </div>
                    ) : activeChallenges.length > 0 ? (
                      <div className="space-y-4">
                        {activeChallenges.map((challenge) => {
                          const progressPercentage = challenge.target_value > 0 
                            ? (challenge.current_progress / challenge.target_value) * 100 
                            : 0;
                          const isNearCompletion = progressPercentage > 80;
                          const isBehindSchedule = progressPercentage < 30;
                          
                          return (
                            <div
                              key={challenge.id}
                              className="p-4 bg-slate-700/50 rounded-lg border border-purple-500/20"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <span className="text-xl">{challenge.icon}</span>
                                  <div>
                                    <h3 className="text-white font-semibold">{challenge.title}</h3>
                                    <p className="text-purple-200 text-sm">{challenge.description}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge 
                                    variant="secondary" 
                                    className="mb-1 bg-purple-600/20 text-purple-300"
                                  >
                                    {challenge.type.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                  <br />
                                  <Badge 
                                    variant={challenge.status === 'active' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {challenge.status}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="space-y-2 mb-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-purple-200">Progress</span>
                                  <span className="text-white font-semibold">
                                    {challenge.current_progress}/{challenge.target_value}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-600 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      isNearCompletion ? 'bg-green-500' : 
                                      isBehindSchedule ? 'bg-red-500' : 'bg-purple-500'
                                    }`}
                                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className={`${
                                    isBehindSchedule ? 'text-red-400' : 
                                    isNearCompletion ? 'text-green-400' : 'text-purple-300'
                                  }`}>
                                    {progressPercentage.toFixed(0)}% Complete
                                  </span>
                                  <span className="text-purple-300">
                                    Reward: {challenge.reward_points} pts
                                  </span>
                                </div>
                              </div>
                              
                              {/* Challenge Stats */}
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div className="text-center">
                                  <div className="text-purple-200">Type</div>
                                  <div className="text-white font-medium capitalize">{challenge.target_type}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-purple-200">Progress</div>
                                  <div className="text-white font-medium">
                                    {challenge.current_progress}/{challenge.target_value}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-purple-200">Reward</div>
                                  <div className="text-white font-medium">{challenge.reward_points} pts</div>
                                </div>
                              </div>
                              
                              {/* Admin Actions */}
                              <div className="flex justify-between items-center mt-4 pt-3 border-t border-purple-500/20">
                                <div className="flex space-x-2">
                                  {/* Edit Challenge */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingChallenge(challenge)}
                                    className="text-xs bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/30 hover:text-white"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  
                                  {/* Delete Challenge */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteChallenge(challenge)}
                                    disabled={deletingChallenge === challenge.id}
                                    className="text-xs bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30 hover:text-white"
                                  >
                                    {deletingChallenge === challenge.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      <Trash2 className="h-3 w-3 mr-1" />
                                    )}
                                    Delete
                                  </Button>
                                  
                                  {/* Visibility Toggle */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleVisibility(challenge)}
                                    disabled={togglingVisibility === challenge.id}
                                    className="text-xs bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30 hover:text-white"
                                  >
                                    {togglingVisibility === challenge.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      <Eye className="h-3 w-3 mr-1" />
                                    )}
                                    Unpublish
                                  </Button>
                                </div>
                                
                                {/* Challenge ID for reference */}
                                <span className="text-xs text-purple-400">ID: {challenge.id}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Trophy className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <p className="text-purple-200 mb-4">
                          {selectedQuarter ? 
                            'No active challenges. Generate some challenges to get started!' : 
                            'Select a quarter to view active challenges'
                          }
                        </p>
                        {selectedQuarter && (
                          <Button
                            onClick={generateChallenges}
                            disabled={generatingChallenges}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Generate Challenges
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Competitions Tab */}
          <TabsContent value="competitions">
            <div className="space-y-6">
              {/* Competition Management Header */}
              <Card className="bg-gradient-to-br from-slate-900/90 to-pink-900/60 border-pink-500/40 shadow-2xl hover:shadow-pink-500/20 transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center space-x-2">
                        <Trophy className="h-6 w-6 text-pink-400" />
                        <span>🔥 Booking Competition Management</span>
                      </CardTitle>
                      <CardDescription className="text-pink-200">
                        Create and manage cosmic booking competitions with stellar winner bonuses
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setShowCreateCompetition(true)}
                      className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white border-pink-500/50 shadow-lg hover:shadow-pink-500/30 transition-all duration-200 hover:scale-105"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      ⚡ Create Competition
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {competitions.map((competition) => (
                      <Button
                        key={competition.id}
                        variant={selectedCompetition === competition.id ? "default" : "outline"}
                        onClick={() => setSelectedCompetition(competition.id)}
                        className={`
                          mb-2 transition-all duration-200 hover:scale-105
                          ${selectedCompetition === competition.id 
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-500/50 shadow-lg shadow-pink-500/30' 
                            : 'border-pink-500/50 text-pink-200 hover:bg-pink-600/20 hover:border-pink-400/70'
                          }
                        `}
                      >
                        {competition.name}
                        <Badge 
                          variant={competition.is_active ? "default" : "secondary"} 
                          className={`ml-2 ${
                            competition.is_active 
                              ? 'bg-green-500/80 text-white shadow-green-500/30' 
                              : 'bg-slate-600 text-slate-200'
                          }`}
                        >
                          {competition.is_active ? '🚀 Active' : '⏸️ Finished'}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedCompetition ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Log Panel */}
                  <Card className="bg-gradient-to-br from-slate-900/90 to-pink-900/60 border-pink-500/40 shadow-2xl hover:shadow-pink-500/20 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-pink-400" />
                        <span>⚡ Quick Log Activities</span>
                      </CardTitle>
                      <CardDescription className="text-pink-200">
                        Log cosmic booking activities on behalf of players
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Player Selection */}
                        <div>
                          <label className="text-white text-sm font-medium mb-2 block">🚀 Select Player</label>
                          <select 
                            className="w-full bg-slate-800/70 border border-pink-500/50 text-white rounded-lg px-3 py-2 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all duration-200"
                            value={selectedPlayerForQuickLog || ''}
                            onChange={(e) => setSelectedPlayerForQuickLog(e.target.value)}
                          >
                            <option value="">Choose cosmic explorer...</option>
                            {competitionLeaderboard.map(player => (
                              <option key={player.player_name} value={player.player_name}>
                                🌟 {player.player_name} ({player.total_points} pts)
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Quick Action Buttons */}
                        {selectedPlayerForQuickLog && (
                          <div className="grid grid-cols-3 gap-3">
                            <Button
                              onClick={() => handleQuickLog('LIFT', 1)}
                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-red-500/30 transition-all duration-200 hover:scale-105"
                              disabled={loadingQuickLog}
                            >
                              🏋️ Lift (1pt)
                            </Button>
                            <Button
                              onClick={() => handleQuickLog('CALL', 4)}
                              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-orange-500/30 transition-all duration-200 hover:scale-105"
                              disabled={loadingQuickLog}
                            >
                              📞 Call (4pts)
                            </Button>
                            <Button
                              onClick={() => handleQuickLog('BOOK', 10)}
                              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-green-500/30 transition-all duration-200 hover:scale-105"
                            >
                              📚 Book (10pts)
                            </Button>
                          </div>
                        )}
                        
                        {/* Bulk Log */}
                        {selectedPlayerForQuickLog && (
                          <div className="border-t border-pink-500/30 pt-4">
                            <label className="text-white text-sm font-medium mb-2 block">🌟 Bulk Log (for offline activities)</label>
                            <div className="flex space-x-2">
                              <select 
                                className="bg-slate-800/70 border border-pink-500/50 text-white rounded-lg px-3 py-2 focus:border-pink-400 transition-all duration-200"
                                value={bulkActivityType}
                                onChange={(e) => setBulkActivityType(e.target.value)}
                              >
                                <option value="LIFT">🏋️ Lifts (1pt each)</option>
                                <option value="CALL">📞 Calls (4pts each)</option>
                                <option value="BOOK">📚 Books (10pts each)</option>
                              </select>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={bulkCount}
                                onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                                className="w-20 bg-slate-800/70 border border-pink-500/50 text-white rounded-lg px-3 py-2 focus:border-pink-400 transition-all duration-200"
                                placeholder="#"
                              />
                              <Button
                                onClick={handleBulkLog}
                                disabled={loadingQuickLog}
                                className="border-pink-500/50 text-pink-200 hover:bg-pink-600/20 hover:border-pink-400/70 transition-all duration-200"
                                variant="outline"
                              >
                                {loadingQuickLog ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  '⚡ Bulk Log'
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Live Leaderboard */}
                  <Card className="bg-gradient-to-br from-slate-900/90 to-pink-900/60 border-pink-500/40 shadow-2xl hover:shadow-pink-500/20 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center space-x-2">
                        <Trophy className="h-5 w-5 text-pink-400" />
                        <span>🏆 Live Leaderboard</span>
                      </CardTitle>
                      <CardDescription className="text-pink-200">
                        Real-time cosmic competition standings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {competitionLeaderboard.map((entry, index) => (
                          <div
                            key={entry.player_name}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/50 shadow-lg shadow-yellow-500/20' :
                              index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50 shadow-lg shadow-gray-400/20' :
                              index === 2 ? 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600/50 shadow-lg shadow-orange-600/20' :
                              'bg-slate-700/50 border-pink-500/30 hover:border-pink-400/50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-200 ${
                                index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-500/30' :
                                index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-black shadow-lg shadow-gray-400/30' :
                                index === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' :
                                'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                              }`}>
                                {index === 0 ? '👑' : index + 1}
                              </div>
                              <span className="text-white font-medium">🌟 {entry.player_name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-bold">{entry.total_points} pts</p>
                              <p className="text-pink-200 text-sm">{entry.entries} entries</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Competition Analytics */}
                  <Card className="bg-gradient-to-br from-slate-900/90 to-pink-900/60 border-pink-500/40 shadow-2xl hover:shadow-pink-500/20 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-pink-400" />
                        <span>📊 Competition Analytics</span>
                      </CardTitle>
                      <CardDescription className="text-pink-200">
                        Cosmic submission patterns and anti-cheat monitoring
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-gradient-to-r from-slate-800/70 to-pink-900/30 rounded-lg border border-pink-500/30 hover:border-pink-400/50 transition-all duration-200">
                            <h3 className="text-white font-semibold">🌟 Total Entries</h3>
                            <p className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">{competitionEntries.length}</p>
                          </div>
                          <div className="text-center p-3 bg-gradient-to-r from-slate-800/70 to-pink-900/30 rounded-lg border border-pink-500/30 hover:border-pink-400/50 transition-all duration-200">
                            <h3 className="text-white font-semibold">🚀 Participants</h3>
                            <p className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">{competitionLeaderboard.length}</p>
                          </div>
                        </div>

                        {/* Recent Entries with Anti-cheat highlights */}
                        <div>
                          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <span>⚡ Recent Entries</span>
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {(competitionEntries || []).slice(0, 10).map((entry, index) => {
                              const isSuspicious = entry.suspicious_burst || entry.duplicate_risk;
                              return (
                                <div
                                  key={index}
                                  className={`flex items-center justify-between p-2 rounded border transition-all duration-200 hover:scale-[1.01] ${
                                    isSuspicious ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/50 shadow-lg shadow-red-500/20' : 'bg-slate-700/50 border-pink-500/30 hover:border-pink-400/50'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="text-white text-sm">🌟 {entry.player_name}</span>
                                    {isSuspicious && (
                                      <Badge variant="destructive" className="text-xs bg-red-500/80 text-white shadow-red-500/30">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        ⚠️ Suspicious
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right text-xs">
                                    <p className="text-pink-200">{new Date(entry.created_at).toLocaleTimeString()}</p>
                                    <p className="text-white font-semibold">⚡ +{entry.points} pts</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-slate-900/90 to-pink-900/60 border-pink-500/40 shadow-2xl">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <Trophy className="h-16 w-16 text-pink-400 mx-auto mb-4 animate-pulse" />
                        <div className="absolute inset-0 bg-pink-400/20 rounded-full blur-xl animate-pulse" />
                      </div>
                      <h3 className="text-white text-lg font-semibold mb-2">🌟 No Competition Selected</h3>
                      <p className="text-pink-200 mb-4">
                        {competitions.length === 0 
                          ? '🚀 Create your first cosmic booking competition to get started' 
                          : '⚡ Select a competition from above to view stellar details'
                        }
                      </p>
                      {competitions.length === 0 && (
                        <Button
                          onClick={() => setShowCreateCompetition(true)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Competition
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Competition Entries Table */}
              {selectedCompetition && (
                <Card className="bg-slate-800/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Competition Entries</span>
                      <Badge variant="secondary" className="ml-2">
                        {competitionEntries.length} total
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      Manage individual competition entries with edit/delete actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Entries Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-purple-500/20">
                              <th className="text-left text-white font-medium py-2">Player</th>
                              <th className="text-left text-white font-medium py-2">Activity Type</th>
                              <th className="text-center text-white font-medium py-2">Points</th>
                              <th className="text-center text-white font-medium py-2">Time</th>
                              <th className="text-center text-white font-medium py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {competitionEntries.slice(0, 50).map((entry, index) => {
                              const isEditing = editingEntry?.id === entry.id;
                              const isDeleting = deletingEntry === entry.id;
                              
                              return (
                                <tr 
                                  key={entry.id} 
                                  className={`border-b border-purple-500/10 ${
                                    entry.suspicious_burst || entry.duplicate_risk 
                                      ? 'bg-red-500/10' 
                                      : 'hover:bg-slate-700/30'
                                  }`}
                                >
                                  <td className="py-3 text-white">
                                    {entry.player_name}
                                    {(entry.suspicious_burst || entry.duplicate_risk) && (
                                      <Badge variant="destructive" className="ml-2 text-xs">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Suspicious
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="py-3">
                                    <Badge 
                                      variant="secondary"
                                      className={`${
                                        entry.activity_type === 'BOOK' ? 'bg-purple-600/20 text-purple-300' :
                                        entry.activity_type === 'CALL' ? 'bg-blue-600/20 text-blue-300' :
                                        'bg-green-600/20 text-green-300'
                                      }`}
                                    >
                                      {entry.activity-type === 'BOOK' ? '📅 Book' :
                                       entry.activity_type === 'CALL' ? '💬 Call' :
                                       '📞 Lift'}
                                    </Badge>
                                  </td>
                                  <td className="py-3 text-center">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        defaultValue={entry.points}
                                        className="w-16 bg-slate-700 border border-purple-500/30 text-white rounded px-2 py-1 text-center"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const newPoints = parseInt(e.currentTarget.value);
                                            if (newPoints && newPoints !== entry.points) {
                                              handleEditEntry(entry.id, newPoints);
                                            }
                                            setEditingEntry(null);
                                          }
                                          if (e.key === 'Escape') {
                                            setEditingEntry(null);
                                          }
                                        }}
                                        autoFocus
                                      />
                                    ) : (
                                      <span className="text-white font-medium">{entry.points} pts</span>
                                    )}
                                  </td>
                                  <td className="py-3 text-center text-purple-200 text-xs">
                                    {new Date(entry.created_at).toLocaleString('en-GB', { 
                                      day: '2-digit', 
                                      month: '2-digit', 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </td>
                                  <td className="py-3 text-center">
                                    <div className="flex justify-center space-x-2">
                                      {!isEditing ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingEntry(entry)}
                                            className="text-xs bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDeleteEntry(entry.id)}
                                            disabled={isDeleting}
                                            className="text-xs bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30"
                                          >
                                            {isDeleting ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-3 w-3" />
                                            )}
                                          </Button>
                                        </>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setEditingEntry(null)}
                                          className="text-xs bg-gray-600/20 border-gray-500/30 text-gray-300 hover:bg-gray-600/30"
                                        >
                                          Cancel
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        
                        {competitionEntries.length === 0 && (
                          <div className="text-center py-8">
                            <Activity className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                            <p className="text-purple-200">No entries yet in this competition</p>
                          </div>
                        )}
                        
                        {competitionEntries.length > 50 && (
                          <div className="text-center py-4">
                            <p className="text-purple-300 text-sm">
                              Showing first 50 of {competitionEntries.length} entries
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Competition Actions */}
              {selectedCompetition && (
                <Card className="bg-slate-800/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Competition Actions</span>
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      Manage competition lifecycle and award bonuses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => setEditingCompetition(competitions.find(c => c.id === selectedCompetition) || null)}
                        className="border-blue-500/30 text-blue-300 hover:bg-blue-600/20"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Competition
                      </Button>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          const competition = competitions.find(c => c.id === selectedCompetition);
                          if (!competition) return;
                          
                          try {
                            await brain.toggle_visibility({
                              competition_id: selectedCompetition,
                              is_hidden: !competition.is_hidden
                            });
                            toast.success(competition.is_hidden ? 'Competition is now visible to players!' : 'Competition is now hidden from players');
                            await loadCompetitionsData();
                          } catch (error) {
                            console.error('Failed to toggle visibility:', error);
                            toast.error('Failed to toggle competition visibility');
                          }
                        }}
                        className="border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {competitions.find(c => c.id === selectedCompetition)?.is_hidden ? 'Make Visible' : 'Hide'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          const competition = competitions.find(c => c.id === selectedCompetition);
                          if (!competition) return;
                          
                          try {
                            await brain.update_competition({
                              competition_id: selectedCompetition,
                              is_active: !competition.is_active
                            });
                            toast.success(competition.is_active ? 'Competition stopped' : 'Competition started!');
                            await loadCompetitionsData();
                          } catch (error) {
                            console.error('Failed to toggle active status:', error);
                            toast.error('Failed to start/stop competition');
                          }
                        }}
                        className={`border-green-500/30 text-green-300 hover:bg-green-600/20 ${
                          competitions.find(c => c.id === selectedCompetition)?.is_active ? 'bg-green-600/20' : ''
                        }`}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        {competitions.find(c => c.id === selectedCompetition)?.is_active ? 'Stop Competition' : 'Start Competition'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modals */}
      {/* Competition Builder 2.0 Modal */}
      <Dialog open={showCreateCompetition} onOpenChange={setShowCreateCompetition}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full overflow-hidden bg-slate-900 border-purple-500/30 p-0">
          <div className="h-full flex flex-col">
            <DialogHeader className="px-6 py-4 border-b border-purple-500/30">
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-400" />
                Create Competition 2.0
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              <CompetitionBuilder 
                onSuccess={() => {
                  setShowCreateCompetition(false);
                  handleCreateCompetition();
                }}
                onClose={() => setShowCreateCompetition(false)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <EditPlayerGoalsModal
        isOpen={showEditPlayer}
        onClose={() => setShowEditPlayer(false)}
        player={selectedPlayer}
        onSuccess={handlePlayerGoalsUpdated}
      />
      
      {/* Revoke Challenge Confirmation Dialog */}
      <Dialog open={!!revokeConfirm} onOpenChange={(open) => !open && setRevokeConfirm(null)}>
        <DialogContent className="bg-slate-900 border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span>Revoke Challenge Completion</span>
            </DialogTitle>
            <DialogDescription className="text-red-200">
              This action will reset the challenge and remove points from the player.
            </DialogDescription>
          </DialogHeader>
          
          {revokeConfirm && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-red-500/20">
                <h3 className="text-white font-semibold mb-2">{revokeConfirm.challengeTitle}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-purple-200">
                    <span>Player:</span>
                    <span className="text-white font-medium">{revokeConfirm.playerName}</span>
                  </div>
                  <div className="flex justify-between text-purple-200">
                    <span>Points to remove:</span>
                    <span className="text-red-400 font-medium">-{revokeConfirm.pointsToRemove} pts</span>
                  </div>
                  <div className="flex justify-between text-purple-200">
                    <span>Challenge ID:</span>
                    <span className="text-purple-400">#{revokeConfirm.challengeId}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setRevokeConfirm(null)}
                  className="flex-1"
                  disabled={!!revokingChallenge}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmRevokeChallenge}
                  className="flex-1"
                  disabled={!!revokingChallenge}
                >
                  {revokingChallenge ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Revoking...
                    </>
                  ) : (
                    'Revoke Challenge'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Toggle Visibility Confirmation Dialog */}
      <Dialog open={!!toggleVisibilityConfirm} onOpenChange={(open) => !open && setToggleVisibilityConfirm(null)}>
        <DialogContent className="bg-slate-900 border-blue-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-400" />
              <span>Toggle Challenge Visibility</span>
            </DialogTitle>
            <DialogDescription className="text-blue-200">
              Control whether this challenge is visible to players.
            </DialogDescription>
          </DialogHeader>
          
          {toggleVisibilityConfirm && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-blue-500/20">
                <h3 className="text-white font-semibold mb-2">{toggleVisibilityConfirm.challengeTitle}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-purple-200">
                    <span>Current status:</span>
                    <span className={`font-medium ${
                      toggleVisibilityConfirm.currentVisibility ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {toggleVisibilityConfirm.currentVisibility ? 'Published' : 'Unpublished'}
                    </span>
                  </div>
                  <div className="flex justify-between text-purple-200">
                    <span>New status:</span>
                    <span className={`font-medium ${
                      !toggleVisibilityConfirm.currentVisibility ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {!toggleVisibilityConfirm.currentVisibility ? 'Published' : 'Unpublished'}
                    </span>
                  </div>
                  <div className="flex justify-between text-purple-200">
                    <span>Challenge ID:</span>
                    <span className="text-purple-400">#{toggleVisibilityConfirm.challengeId}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setToggleVisibilityConfirm(null)}
                  className="flex-1"
                  disabled={!!togglingVisibility}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={confirmToggleVisibility}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!!togglingVisibility}
                >
                  {togglingVisibility ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    `${!toggleVisibilityConfirm.currentVisibility ? 'Publish' : 'Unpublish'} Challenge`
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Direct Challenge Creation Form */}
      <DirectChallengeForm
        isOpen={showCreateChallenge}
        onClose={() => setShowCreateChallenge(false)}
        onSuccess={handleChallengeCreated}
        quarterId={selectedQuarter || 0}
      />
      
      {/* Edit Challenge Modal */}
      <EditChallengeModal
        isOpen={!!editingChallenge}
        onClose={() => setEditingChallenge(null)}
        onSuccess={handleChallengeEdited}
        challenge={editingChallenge}
      />
      
      {/* Edit Competition Modal */}
      <EditPlayerGoalsModal
        isOpen={!!editingCompetition}
        onClose={() => setEditingCompetition(null)}
        player={selectedPlayer}
        onSuccess={handleCompetitionEntriesUpdated}
      />
    </div>
  );
}
