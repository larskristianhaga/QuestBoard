import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import brain from 'brain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Users, Activity, Trophy, Calendar, Eye, EyeOff, Play, Pause, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type {
  CompetitionResponse,
  LeaderboardRow,
  EntryResponse
} from 'types';
import CreateCompetitionModal from 'components/CreateCompetitionModal';
import EditCompetitionModal from 'components/EditCompetitionModal';
import { CompetitionBuilder } from 'components/CompetitionBuilder';

interface LeaderboardRowWithBreakdown extends LeaderboardRow {
  breakdown?: Array<{
    activity_type: string;
    count: number;
    total_points: number;
  }>;
}

interface CompetitionEntry {
  id: number;
  competition_id: number;
  player_name: string;
  activity_id: number | null;
  activity_type: string;
  points: number;
  created_at: string;
  suspicious_burst?: boolean;
  duplicate_risk?: boolean;
}

export default function AdminCompetitionsTab() {
  const navigate = useNavigate();
  
  // Core state
  const [loading, setLoading] = useState(true);
  
  // Competition data
  const [competitions, setCompetitions] = useState<CompetitionResponse[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRowWithBreakdown[]>([]);
  const [entries, setEntries] = useState<CompetitionEntry[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<CompetitionResponse | null>(null);
  const [showCompetitionBuilder, setShowCompetitionBuilder] = useState(false);
  
  // Quick log state
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [quickLogging, setQuickLogging] = useState(false);
  
  // Entry management
  const [editingEntry, setEditingEntry] = useState<CompetitionEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<number | null>(null);
  
  // Bulk log state
  const [bulkActivityType, setBulkActivityType] = useState('LIFT');
  const [bulkCount, setBulkCount] = useState(1);

  // Load initial data
  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      // Load both v1 and v2 competitions in parallel
      const [v1Response, v2Response] = await Promise.all([
        brain.list_competitions().catch(() => ({ ok: false })),
        brain.list_competitions_v2().catch(() => ({ ok: false }))
      ]);
      
      const allCompetitions: CompetitionResponse[] = [];
      
      // Process v1 competitions
      if (v1Response.ok) {
        const v1Data = await v1Response.json();
        const v1Competitions: CompetitionResponse[] = Array.isArray(v1Data) ? v1Data : v1Data.data || [];
        // Mark as v1 for later identification
        const v1WithVersion = v1Competitions.map(c => ({ ...c, version: 'v1' as const }));
        allCompetitions.push(...v1WithVersion);
      }
      
      // Process v2 competitions
      if (v2Response.ok) {
        const v2Data = await v2Response.json();
        const v2Competitions = Array.isArray(v2Data) ? v2Data : v2Data.data || [];
        // Convert v2 format to v1-compatible format and mark as v2
        const v2Compatible = v2Competitions.map(c => ({
          ...c,
          is_active: c.state === 'active',
          version: 'v2' as const
        }));
        allCompetitions.push(...v2Compatible);
      }
      
      // Filter out hidden (deleted) competitions from admin view
      const visibleCompetitions = allCompetitions.filter(c => !c.is_hidden);
      setCompetitions(visibleCompetitions.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()));
      
      // Auto-select first active competition
      const activeComp = visibleCompetitions.find(c => c.is_active);
      if (activeComp && !selectedCompetition) {
        setSelectedCompetition(activeComp.id);
      } else if (selectedCompetition && !visibleCompetitions.find(c => c.id === selectedCompetition)) {
        // If selected competition was deleted/hidden, clear selection
        setSelectedCompetition(null);
      }
    } catch (error) {
      console.error('Failed to load competitions:', error);
      toast.error('Failed to load competitions');
    } finally {
      setLoading(false);
    }
  };

  const loadCompetitionData = async (competitionId: number) => {
    if (!competitionId) return;
    
    setLoadingData(true);
    try {
      // Load leaderboard with breakdown
      const leaderboardResponse = await brain.leaderboard_detailed({ competitionId });
      const leaderboardData = await leaderboardResponse.json();
      setLeaderboard(leaderboardData.rows || []);
      
      // Load entries
      const entriesResponse = await brain.get_competition_entries({ competitionId });
      const entriesData = await entriesResponse.json();
      setEntries(entriesData.entries || []);
    } catch (error) {
      console.error('Failed to load competition data:', error);
      toast.error('Failed to load competition data');
    } finally {
      setLoadingData(false);
    }
  };

  // Load data when competition changes
  useEffect(() => {
    if (selectedCompetition) {
      loadCompetitionData(selectedCompetition);
    }
  }, [selectedCompetition]);

  const handleCreateSuccess = async () => {
    setShowCreateModal(false);
    await loadCompetitions();
    toast.success('Competition created successfully!');
  };

  const handleEditSuccess = async () => {
    setEditingCompetition(null);
    await loadCompetitions();
    if (selectedCompetition) {
      await loadCompetitionData(selectedCompetition);
    }
    toast.success('Competition updated successfully!');
  };

  const handleToggleActive = async (competition: CompetitionResponse) => {
    try {
      if (competition.version === 'v2') {
        toast.error('Toggling Competition 2.0 status is not yet supported. Please use the admin interface.');
        return;
      }
      
      await brain.update_competition({
        competition_id: competition.id,
        name: competition.name,
        description: competition.description,
        start_time: competition.start_time,
        end_time: competition.end_time,
        is_active: !competition.is_active,
        is_hidden: competition.is_hidden,
        tiebreaker: competition.tiebreaker
      });
      await loadCompetitions();
      toast.success(`Competition ${competition.is_active ? 'paused' : 'activated'}`);
    } catch (error) {
      console.error('Failed to toggle competition:', error);
      toast.error('Failed to update competition');
    }
  };

  const handleToggleVisibility = async (competition: CompetitionResponse) => {
    try {
      if (competition.version === 'v2') {
        toast.error('Toggling Competition 2.0 visibility is not yet supported. Please use the admin interface.');
        return;
      }
      
      await brain.update_competition({
        competition_id: competition.id,
        name: competition.name,
        description: competition.description,
        start_time: competition.start_time,
        end_time: competition.end_time,
        is_active: competition.is_active,
        is_hidden: !competition.is_hidden,
        tiebreaker: competition.tiebreaker
      });
      await loadCompetitions();
      toast.success(`Competition ${competition.is_hidden ? 'shown' : 'hidden'}`);
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      toast.error('Failed to update competition');
    }
  };

  const handleQuickLog = async (activityType: string, points: number) => {
    if (!selectedPlayer || !selectedCompetition) {
      toast.error('Please select a player and competition');
      return;
    }
    
    setQuickLogging(true);
    try {
      await brain.quick_log_activity({
        competition_id: selectedCompetition,
        player_name: selectedPlayer,
        activity_type: activityType
      });
      
      toast.success(`Logged ${activityType} (${points}pts) for ${selectedPlayer}`);
      await loadCompetitionData(selectedCompetition);
    } catch (error) {
      console.error('Quick log failed:', error);
      toast.error('Failed to log activity');
    } finally {
      setQuickLogging(false);
    }
  };

  const handleBulkLog = async () => {
    if (!selectedPlayer || !selectedCompetition) {
      toast.error('Please select a player and competition');
      return;
    }
    
    setQuickLogging(true);
    try {
      await brain.bulk_log_activities({
        competition_id: selectedCompetition,
        player_name: selectedPlayer,
        activity_type: bulkActivityType,
        count: bulkCount
      });
      
      toast.success(`Logged ${bulkCount} ${bulkActivityType} activities for ${selectedPlayer}`);
      await loadCompetitionData(selectedCompetition);
    } catch (error) {
      console.error('Bulk log failed:', error);
      toast.error('Failed to bulk log activities');
    } finally {
      setQuickLogging(false);
    }
  };

  const handleEditEntry = async (entryId: number, newPoints: number) => {
    try {
      await brain.update_entry({
        entry_id: entryId,
        points: newPoints
      });
      
      toast.success('Entry updated successfully');
      if (selectedCompetition) {
        await loadCompetitionData(selectedCompetition);
      }
      setEditingEntry(null);
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
      await brain.delete_entry({ entry_id: entryId });
      
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
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-400" />
        <p className="text-purple-200">Loading competitions...</p>
      </div>
    );
  }

  const selectedCompData = competitions.find(c => c.id === selectedCompetition);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">🏆 Competitions</h2>
          <p className="text-purple-200">Manage booking competitions and view detailed analytics</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Competition
          </Button>
          <Button 
            onClick={() => setShowCompetitionBuilder(true)}
            variant="outline"
            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/20"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Competition 2.0 Builder
          </Button>
        </div>
      </div>

      {/* Competition Selection */}
      <Card className="bg-slate-800/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
            Select Competition
          </CardTitle>
        </CardHeader>
        <CardContent>
          {competitions.length === 0 ? (
            <p className="text-purple-200 text-center py-4">No competitions found. Create your first competition!</p>
          ) : (
            <div className="grid gap-3">
              {competitions.map((comp) => (
                <div
                  key={comp.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedCompetition === comp.id
                      ? 'border-purple-400 bg-purple-500/20'
                      : 'border-purple-500/30 bg-slate-700/30 hover:bg-slate-700/50'
                  }`}
                  onClick={() => setSelectedCompetition(comp.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{comp.name}</h3>
                      <p className="text-purple-200 text-sm">
                        {new Date(comp.start_time).toLocaleDateString()} - {new Date(comp.end_time).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={comp.is_active ? 'default' : 'secondary'}>
                        {comp.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant={comp.is_hidden ? 'destructive' : 'outline'}>
                        {comp.is_hidden ? 'Hidden' : 'Visible'}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(comp);
                          }}
                          className="text-xs border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
                        >
                          {comp.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVisibility(comp);
                          }}
                          className="text-xs border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
                        >
                          {comp.is_hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCompetition(comp);
                          }}
                          className="text-xs border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competition Management */}
      {selectedCompData && (
        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="bg-slate-800/50 border-purple-500/20">
            <TabsTrigger value="leaderboard" className="text-purple-200 data-[state=active]:text-white">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="quicklog" className="text-purple-200 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              Quick Log
            </TabsTrigger>
            <TabsTrigger value="entries" className="text-purple-200 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Manage Entries
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">{selectedCompData.name} - Leaderboard</CardTitle>
                <CardDescription className="text-purple-200">
                  Current standings with activity breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-400" />
                    <p className="text-purple-200">Loading leaderboard...</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-purple-200 text-center py-8">No entries yet in this competition</p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((player, index) => (
                      <div key={player.player_name} className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-500 text-black' :
                              index === 1 ? 'bg-gray-400 text-black' :
                              index === 2 ? 'bg-amber-600 text-white' :
                              'bg-purple-600 text-white'
                            }`}>
                              {index + 1}
                            </div>
                            <h3 className="text-white font-medium">{player.player_name}</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">{player.total_points} pts</p>
                            <p className="text-purple-200 text-sm">{player.entries || 0} entries</p>
                          </div>
                        </div>
                        
                        {/* Activity breakdown */}
                        {player.breakdown && player.breakdown.length > 0 && (
                          <div className="flex space-x-4 pt-2 border-t border-purple-500/20">
                            {player.breakdown.map((activity) => (
                              <div key={activity.activity_type} className="text-center">
                                <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  activity.activity_type === 'LIFT' ? 'bg-green-600/20 text-green-300' :
                                  activity.activity_type === 'CALL' ? 'bg-blue-600/20 text-blue-300' :
                                  'bg-purple-600/20 text-purple-300'
                                }`}>
                                  {activity.activity_type === 'LIFT' ? '📞' :
                                   activity.activity_type === 'CALL' ? '💬' : '📅'}
                                  {activity.activity_type}: {activity.count}
                                </div>
                                <p className="text-xs text-purple-300 mt-1">{activity.total_points}pts</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Log Tab */}
          <TabsContent value="quicklog">
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Quick Log Activities</CardTitle>
                <CardDescription className="text-purple-200">
                  Log activities on behalf of players in {selectedCompData.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Player Selection */}
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Select Player</label>
                  <select
                    className="w-full bg-slate-700 border border-purple-500/30 text-white rounded-lg px-3 py-2"
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                  >
                    <option value="">Choose player...</option>
                    {leaderboard.map((player) => (
                      <option key={player.player_name} value={player.player_name}>
                        {player.player_name} ({player.total_points} pts)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Action Buttons */}
                {selectedPlayer && (
                  <div>
                    <label className="text-white text-sm font-medium mb-3 block">Quick Actions</label>
                    <div className="grid grid-cols-3 gap-4">
                      <Button
                        onClick={() => handleQuickLog('LIFT', 1)}
                        disabled={quickLogging}
                        className="bg-green-600 hover:bg-green-700 text-white py-4"
                      >
                        📞 Lift<br /><span className="text-sm">(1 point)</span>
                      </Button>
                      <Button
                        onClick={() => handleQuickLog('CALL', 4)}
                        disabled={quickLogging}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-4"
                      >
                        💬 Call<br /><span className="text-sm">(4 points)</span>
                      </Button>
                      <Button
                        onClick={() => handleQuickLog('BOOK', 10)}
                        disabled={quickLogging}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-4"
                      >
                        📅 Book<br /><span className="text-sm">(10 points)</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Bulk Log */}
                {selectedPlayer && (
                  <div className="border-t border-purple-500/20 pt-6">
                    <label className="text-white text-sm font-medium mb-3 block">Bulk Log (for offline activities)</label>
                    <div className="flex space-x-3">
                      <select
                        className="bg-slate-700 border border-purple-500/30 text-white rounded-lg px-3 py-2"
                        value={bulkActivityType}
                        onChange={(e) => setBulkActivityType(e.target.value)}
                      >
                        <option value="LIFT">Lifts (1pt each)</option>
                        <option value="CALL">Calls (4pts each)</option>
                        <option value="BOOK">Books (10pts each)</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={bulkCount}
                        onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                        className="w-20 bg-slate-700 border border-purple-500/30 text-white rounded-lg px-3 py-2"
                      />
                      <Button
                        onClick={handleBulkLog}
                        disabled={quickLogging}
                        variant="outline"
                        className="border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
                      >
                        {quickLogging ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Bulk Log'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Entries Management Tab */}
          <TabsContent value="entries">
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Manage Entries</CardTitle>
                <CardDescription className="text-purple-200">
                  View, edit, and delete competition entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-400" />
                    <p className="text-purple-200">Loading entries...</p>
                  </div>
                ) : entries.length === 0 ? (
                  <p className="text-purple-200 text-center py-8">No entries found in this competition</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-purple-500/20">
                          <th className="text-left text-white font-medium py-3">Player</th>
                          <th className="text-center text-white font-medium py-3">Activity</th>
                          <th className="text-center text-white font-medium py-3">Points</th>
                          <th className="text-center text-white font-medium py-3">Time</th>
                          <th className="text-center text-white font-medium py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.slice(0, 50).map((entry) => {
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
                              <td className="py-3">
                                <div className="flex items-center space-x-2">
                                  <span className="text-white">{entry.player_name}</span>
                                  {(entry.suspicious_burst || entry.duplicate_risk) && (
                                    <AlertTriangle className="h-4 w-4 text-red-400" title="Flagged as suspicious" />
                                  )}
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                <Badge
                                  variant="outline"
                                  className={`${
                                    entry.activity_type === 'LIFT'
                                      ? 'border-green-500/30 text-green-300'
                                      : entry.activity_type === 'CALL'
                                      ? 'border-blue-500/30 text-blue-300'
                                      : 'border-purple-500/30 text-purple-300'
                                  }`}
                                >
                                  {entry.activity_type === 'LIFT' ? '📞' :
                                   entry.activity_type === 'CALL' ? '💬' : '📅'}
                                  {entry.activity_type}
                                </Badge>
                              </td>
                              <td className="py-3 text-center">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    defaultValue={entry.points}
                                    className="w-16 bg-slate-700 border border-purple-500/30 text-white rounded px-2 py-1 text-center"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const newPoints = parseInt(e.currentTarget.value);
                                        if (newPoints && newPoints !== entry.points) {
                                          handleEditEntry(entry.id, newPoints);
                                        } else {
                                          setEditingEntry(null);
                                        }
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
                                <div className="flex justify-center space-x-1">
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
                    
                    {entries.length > 50 && (
                      <p className="text-purple-300 text-center mt-4 text-sm">
                        Showing first 50 entries of {entries.length} total
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateCompetitionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      
      {editingCompetition && (
        <EditCompetitionModal
          competition={editingCompetition}
          onClose={() => setEditingCompetition(null)}
          onSuccess={handleEditSuccess}
        />
      )}
      
      {showCompetitionBuilder && (
        <CompetitionBuilder onClose={() => setShowCompetitionBuilder(false)} />
      )}
    </div>
  );
}
