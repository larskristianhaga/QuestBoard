import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import brain from 'brain';
import type { CreateCompetitionV2Request, Player } from 'types';
import { Clock, Users, Trophy, Zap, Target, AlertTriangle, CheckCircle, Sparkles, Loader2, Plus, Settings, Eye } from 'lucide-react';

interface CompetitionBuilderProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'suggestion';
}

interface RuleConfig {
  points: {
    lift: number;
    call: number;
    book: number;
  };
  multipliers: Array<{
    type: string;
    mult: number;
    min?: number;
    window?: {
      start: string;
      end: string;
    };
  }>;
  combos: Array<{
    name: string;
    bonus: number;
    within_minutes: number;
    required_types?: string[];
  }>;
  caps: {
    per_player_per_day?: number;
    per_player_total?: number;
    global_total?: number;
  };
  tiebreaker: 'most_total' | 'first_to' | 'fastest_pace';
  secondary_tiebreaker: 'random' | 'alphabetical' | 'reverse_alphabetical';
}

interface ThemeConfig {
  teams: Array<{
    team_id?: number;
    label: string;
    color: string;
  }>;
  vfx: {
    intensity: string;
    sparkles: string; // "off"|"low"|"medium"|"high"
    warp_trail: string; // "off"|"low"|"medium"|"high"
    screen_shake_on_win: boolean;
    particle_effects: boolean;
  };
  badges: string[];
  custom_sounds: Record<string, string>;
}

interface PrizesConfig {
  winner: number;
  runner_up: number;
  participation: number;
  team_win_bonus?: number;
  custom_rewards: Record<string, string>;
}

export function CompetitionBuilder({ onClose, onSuccess }: CompetitionBuilderProps) {
  const [currentTab, setCurrentTab] = useState('basic');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [previewScores, setPreviewScores] = useState<any[]>([]);
  const [isGeneratingTeams, setIsGeneratingTeams] = useState(false);
  const [loading, setLoading] = useState(false);

  // Player selection state
  const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [playerAssignments, setPlayerAssignments] = useState<Record<number, string[]>>({});
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [teamAssignmentMode, setTeamAssignmentMode] = useState<'manual' | 'random'>('manual');

  // Basic Competition Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [teamId, setTeamId] = useState<number | null>(null);

  // Rules Configuration
  const [rules, setRules] = useState<RuleConfig>({
    points: { lift: 1, call: 4, book: 10 },
    multipliers: [],
    combos: [],
    caps: {},
    tiebreaker: 'most_total',
    secondary_tiebreaker: 'random'
  });

  // Theme Configuration
  const [theme, setTheme] = useState<ThemeConfig>({
    teams: [],
    vfx: {
      intensity: 'medium',
      sparkles: 'medium',
      warp_trail: 'medium',
      screen_shake_on_win: true,
      particle_effects: true
    },
    badges: ['streaker', 'clutch', 'early_bird'],
    custom_sounds: {}
  });

  // Prizes Configuration
  const [prizes, setPrizes] = useState<PrizesConfig>({
    winner: 50,
    runner_up: 20,
    participation: 5,
    custom_rewards: {}
  });

  // Load sample config on mount
  useEffect(() => {
    loadSampleConfig();
    loadAvailablePlayers();
  }, []);

  const loadSampleConfig = async () => {
    try {
      const response = await brain.get_sample_config();
      const config = await response.json();
      
      if (config.rules) {
        setRules(config.rules);
      }
      if (config.theme) {
        setTheme(config.theme);
      }
      if (config.prizes) {
        setPrizes(config.prizes);
      }
    } catch (error) {
      console.error('Failed to load sample config:', error);
    }
  };

  const loadAvailablePlayers = async () => {
    setLoadingPlayers(true);
    try {
      const response = await brain.get_available_players();
      const data = await response.json();
      // Include both available and taken players for competition enrollment
      const allPlayers = [...(data.available_players || []), ...(data.taken_players || [])].sort();
      setAvailablePlayers(allPlayers);
    } catch (error) {
      console.error('Failed to load players:', error);
      toast.error('Failed to load available players');
    } finally {
      setLoadingPlayers(false);
    }
  };

  const assignPlayerToTeam = (playerName: string, teamIndex: number) => {
    // Remove player from all teams first
    const newAssignments = { ...playerAssignments };
    Object.keys(newAssignments).forEach(key => {
      newAssignments[parseInt(key)] = newAssignments[parseInt(key)].filter(p => p !== playerName);
    });
    
    // Add to selected team
    if (!newAssignments[teamIndex]) {
      newAssignments[teamIndex] = [];
    }
    newAssignments[teamIndex].push(playerName);
    setPlayerAssignments(newAssignments);
  };

  const removePlayerFromTeam = (playerName: string) => {
    const newAssignments = { ...playerAssignments };
    Object.keys(newAssignments).forEach(key => {
      newAssignments[parseInt(key)] = newAssignments[parseInt(key)].filter(p => p !== playerName);
    });
    setPlayerAssignments(newAssignments);
  };

  const randomAssignPlayers = () => {
    if (selectedPlayers.length < 2 || theme.teams.length === 0) return;
    
    const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
    const newAssignments: Record<number, string[]> = {};
    
    // Initialize empty arrays for each team
    theme.teams.forEach((_, index) => {
      newAssignments[index] = [];
    });
    
    // Distribute players evenly across teams
    shuffled.forEach((player, index) => {
      const teamIndex = index % theme.teams.length;
      newAssignments[teamIndex].push(player);
    });
    
    setPlayerAssignments(newAssignments);
  };

  const validateConfiguration = async () => {
    setIsValidating(true);
    try {
      const response = await brain.validate_competition_config({
        rules,
        theme,
        prizes
      });
      
      const validation = await response.json();
      
      const errors: ValidationError[] = [];
      
      validation.errors?.forEach((msg: string) => {
        errors.push({ field: 'general', message: msg, type: 'error' });
      });
      
      validation.warnings?.forEach((msg: string) => {
        errors.push({ field: 'general', message: msg, type: 'warning' });
      });
      
      validation.suggestions?.forEach((msg: string) => {
        errors.push({ field: 'general', message: msg, type: 'suggestion' });
      });
      
      setValidationErrors(errors);
      return validation.is_valid;
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationErrors([{
        field: 'general',
        message: 'Validation failed - please check your configuration',
        type: 'error'
      }]);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const previewScoring = async () => {
    try {
      const sampleEvents = [
        { player_name: 'Alice', type: 'book' },
        { player_name: 'Bob', type: 'call' },
        { player_name: 'Alice', type: 'lift' },
        { player_name: 'Charlie', type: 'book' },
        { player_name: 'Bob', type: 'book' }
      ];
      
      const response = await brain.preview_scoring({
        rules,
        sample_events: sampleEvents
      });
      
      const preview = await response.json();
      setPreviewScores(preview.calculated_scores || []);
    } catch (error) {
      console.error('Preview failed:', error);
      toast.error('Failed to generate scoring preview');
    }
  };

  const addMultiplier = () => {
    setRules(prev => ({
      ...prev,
      multipliers: [...prev.multipliers, {
        type: 'time_window',
        mult: 2.0,
        window: { start: '09:00', end: '11:00' }
      }]
    }));
  };

  const addCombo = () => {
    setRules(prev => ({
      ...prev,
      combos: [...prev.combos, {
        name: 'Power Combo',
        bonus: 5,
        within_minutes: 15,
        required_types: ['lift', 'call', 'book']
      }]
    }));
  };

  const addTeam = () => {
    const defaultEmojis = ['🚀', '⚡', '🌟', '🔥', '💎', '🎯', '👑', '🛡️', '⚔️', '🌊'];
    const defaultColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];
    
    setTheme(prev => ({
      ...prev,
      teams: [...prev.teams, {
        label: `Team ${prev.teams.length + 1}`,
        color: defaultColors[prev.teams.length % defaultColors.length],
        emoji: defaultEmojis[prev.teams.length % defaultEmojis.length]
      }]
    }));
  };

  const updateTeam = (teamIndex: number, updates: Partial<{ label: string; color: string; emoji: string }>) => {
    setTheme(prev => ({
      ...prev,
      teams: prev.teams.map((team, i) => 
        i === teamIndex ? { ...team, ...updates } : team
      )
    }));
  };

  const generateAITeams = async () => {
    if (selectedPlayers.length === 0) {
      toast.error('Please select players first');
      return;
    }

    if (theme.teams.length === 0) {
      toast.error('Please add teams first');
      return;
    }

    setIsGeneratingTeams(true);
    try {
      const response = await brain.generate_team_names({
        participants: selectedPlayers,
        competition_name: name || 'Epic Space Competition',
        theme: 'cosmic space adventure',
        style: 'cosmic',
        team_count: theme.teams.length
      });

      const result = await response.json();
      console.log('AI Generation Result:', result);

      if (result.teams && result.teams.length > 0) {
        // Build new player assignments from AI results
        const newAssignments: Record<number, string[]> = {};
        
        let updatedTeams = theme.teams.map((team, index) => {
          const aiTeam = result.teams[index];
          if (aiTeam) {
            // Assign AI suggested members to this team index
            newAssignments[index] = aiTeam.members || [];
            
            return {
              ...team,
              label: aiTeam.team_name,
              color: aiTeam.color || team.color
            };
          }
          return team;
        });

        // Update all assignments at once
        setPlayerAssignments(newAssignments);
        console.log('🎯 Updated player assignments:', newAssignments);
        
        setTheme(prev => ({
          ...prev,
          teams: updatedTeams
        }));

        // Generate competition name and description if not already set
        if (!name || name.trim() === '') {
          const aiCompetitionName = `${result.teams[0]?.team_name.split(' ')[0]} vs ${result.teams[1]?.team_name.split(' ')[0]} Championship`;
          setName(aiCompetitionName);
        }

        if (!description || description.trim() === '') {
          const aiDescription = `An epic cosmic battle between ${result.teams.length} legendary teams vying for supremacy in the galaxy. Each team must prove their worth through strategic activity logging and collaborative teamwork to claim victory in this stellar competition.`;
          setDescription(aiDescription);
        }

        toast.success('🚀 AI competition details, team names and assignments generated successfully!');
      } else {
        throw new Error('No teams generated');
      }
    } catch (error) {
      console.error('Error generating AI teams:', error);
      toast.error('Failed to generate AI team names. Please try again.');
    } finally {
      setIsGeneratingTeams(false);
    }
  };

  const createCompetition = async () => {
    console.log('🚀 Create Competition button clicked!');
    console.log('Form state:', { name, startTime, endTime, selectedPlayers, validationErrors });
    
    // Enhanced validation with better error messages
    const missingFields = [];
    if (!name || name.trim() === '') missingFields.push('Competition Name');
    if (!startTime) missingFields.push('Start Time');
    if (!endTime) missingFields.push('End Time');
    
    if (missingFields.length > 0) {
      console.log('❌ Missing fields:', missingFields);
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    if (selectedPlayers.length === 0) {
      console.log('❌ No players selected');
      toast.error('Please select at least one player');
      return;
    }

    // Validate that all selected players are assigned to teams (if teams exist)
    if (theme.teams.length > 0) {
      const assignedPlayers = Object.values(playerAssignments).flat();
      const unassignedPlayers = selectedPlayers.filter(player => !assignedPlayers.includes(player));
      
      console.log('📊 Player assignment validation:');
      console.log('- Selected players:', selectedPlayers);
      console.log('- Player assignments:', playerAssignments);
      console.log('- Assigned players (flattened):', assignedPlayers);
      console.log('- Unassigned players:', unassignedPlayers);
      
      if (unassignedPlayers.length > 0) {
        console.log('❌ Unassigned players:', unassignedPlayers);
        toast.error(`Please assign all players to teams. Unassigned: ${unassignedPlayers.join(', ')}`);
        return;
      }
    }

    // Check for validation errors
    const errors = validationErrors.filter(e => e.type === 'error');
    if (errors.length > 0) {
      console.log('❌ Validation errors:', errors);
      toast.error(`Please fix validation errors: ${errors[0].message}`);
      return;
    }

    console.log('✅ All validations passed, creating competition...');
    setLoading(true);
    try {
      // Create the competition configuration matching CompetitionCreateV2 model
      const competitionConfig = {
        name: name.trim(),
        description: description?.trim() || null,
        start_time: startTime,
        end_time: endTime,
        is_hidden: isHidden,
        rules,
        theme,
        prizes: {
          winner: 500,
          runner_up: 200,
          participation: 50,
          team_win_bonus: null,
          custom_rewards: {}
        }
      };

      console.log('🎯 Creating competition with config:', competitionConfig);

      const response = await brain.create_competition_v2(competitionConfig);
      const result = await response.json();

      console.log('📝 Competition creation result:', result);

      if (result.id) {
        // Auto-enroll all selected players
        console.log('👥 Auto-enrolling players:', selectedPlayers);
        try {
          for (const playerName of selectedPlayers) {
            const enrollResponse = await brain.enroll_participant({
              competition_id: result.id,
              player_name: playerName
            });
            console.log(`✅ Enrolled ${playerName} in competition ${result.id}`);
          }
          console.log('🎉 All players enrolled successfully!');
        } catch (enrollError) {
          console.error('❌ Failed to enroll some players:', enrollError);
          toast.error('Competition created but some players failed to enroll. Please enroll them manually.');
        }
        
        toast.success(`🎉 Competition "${name}" created successfully with ${selectedPlayers.length} players!`);
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to create competition');
      }
    } catch (error) {
      console.error('❌ Failed to create competition:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to create competition: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const renderValidationAlerts = () => {
    const errors = validationErrors.filter(e => e.type === 'error');
    const warnings = validationErrors.filter(e => e.type === 'warning');
    const suggestions = validationErrors.filter(e => e.type === 'suggestion');

    return (
      <div className="space-y-2">
        {errors.map((error, i) => (
          <Alert key={`error-${i}`} className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error.message}</AlertDescription>
          </Alert>
        ))}
        {warnings.map((warning, i) => (
          <Alert key={`warning-${i}`} className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">{warning.message}</AlertDescription>
          </Alert>
        ))}
        {suggestions.map((suggestion, i) => (
          <Alert key={`suggestion-${i}`} className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">{suggestion.message}</AlertDescription>
          </Alert>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      <div className="w-full h-full overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Target className="h-6 w-6 text-purple-400" />
              Competition Builder 2.0
            </h2>
            <p className="text-gray-400 mt-1">Create advanced gamified competitions with custom rules</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Cancel
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isPreviewMode ? (
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Scoring Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={previewScoring} className="mb-4 bg-purple-600 hover:bg-purple-700">
                    Generate Preview
                  </Button>
                  {previewScores.length > 0 && (
                    <div className="space-y-2">
                      {previewScores.map((score, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                          <span className="text-white font-medium">{score.player_name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-300">{score.event_count} events</span>
                            <Badge variant="secondary" className="bg-purple-600 text-white">
                              {score.total_points} pts
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {renderValidationAlerts()}
            </div>
          ) : (
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger value="basic" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="rules" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  Rules & Scoring
                </TabsTrigger>
                <TabsTrigger value="theme" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  Theme & VFX
                </TabsTrigger>
                <TabsTrigger value="prizes" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  Prizes & Rewards
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-400" />
                      Competition Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-gray-300">Competition Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter competition name"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-gray-300">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the competition"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime" className="text-gray-300">Start Time</Label>
                        <Input
                          id="startTime"
                          type="datetime-local"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime" className="text-gray-300">End Time</Label>
                        <Input
                          id="endTime"
                          type="datetime-local"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hidden" className="text-gray-300">Hidden Competition</Label>
                      <Switch
                        id="hidden"
                        checked={isHidden}
                        onCheckedChange={setIsHidden}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rules" className="space-y-4 mt-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-400" />
                      Point Values
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-300">Lift Points</Label>
                        <Input
                          type="number"
                          value={rules.points.lift}
                          onChange={(e) => setRules(prev => ({
                            ...prev,
                            points: { ...prev.points, lift: parseInt(e.target.value) || 0 }
                          }))}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Call Points</Label>
                        <Input
                          type="number"
                          value={rules.points.call}
                          onChange={(e) => setRules(prev => ({
                            ...prev,
                            points: { ...prev.points, call: parseInt(e.target.value) || 0 }
                          }))}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Book Points</Label>
                        <Input
                          type="number"
                          value={rules.points.book}
                          onChange={(e) => setRules(prev => ({
                            ...prev,
                            points: { ...prev.points, book: parseInt(e.target.value) || 0 }
                          }))}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        Multipliers ({rules.multipliers.length})
                      </span>
                      <Button onClick={addMultiplier} size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Add Multiplier
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rules.multipliers.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">No multipliers configured</p>
                    ) : (
                      <div className="space-y-3">
                        {rules.multipliers.map((mult, i) => (
                          <div key={i} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Multiplier Type */}
                              <div>
                                <Label className="text-gray-300 text-sm">Type</Label>
                                <select
                                  value={mult.type}
                                  onChange={(e) => {
                                    const newMultipliers = [...rules.multipliers];
                                    newMultipliers[i] = { ...mult, type: e.target.value };
                                    setRules(prev => ({ ...prev, multipliers: newMultipliers }));
                                  }}
                                  className="w-full mt-1 p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                                >
                                  <option value="time_window">Time Window</option>
                                  <option value="streak_3">3-Activity Streak</option>
                                  <option value="streak_5">5-Activity Streak</option>
                                  <option value="firstof_day">First of Day</option>
                                  <option value="combo_lift_call">Lift+Call Combo</option>
                                  <option value="weekend_bonus">Weekend Bonus</option>
                                </select>
                              </div>
                              
                              {/* Multiplier Value */}
                              <div>
                                <Label className="text-gray-300 text-sm">Multiplier</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="1"
                                  max="10"
                                  value={mult.mult}
                                  onChange={(e) => {
                                    const newMultipliers = [...rules.multipliers];
                                    newMultipliers[i] = { ...mult, mult: parseFloat(e.target.value) || 1 };
                                    setRules(prev => ({ ...prev, multipliers: newMultipliers }));
                                  }}
                                  className="mt-1 bg-gray-600 border-gray-500 text-white text-sm"
                                />
                              </div>
                              
                              {/* Time Window (if applicable) */}
                              {mult.type === 'time_window' && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-gray-300 text-sm">Start</Label>
                                    <Input
                                      type="time"
                                      value={mult.window?.start || '09:00'}
                                      onChange={(e) => {
                                        const newMultipliers = [...rules.multipliers];
                                        newMultipliers[i] = { 
                                          ...mult, 
                                          window: { ...mult.window, start: e.target.value }
                                        };
                                        setRules(prev => ({ ...prev, multipliers: newMultipliers }));
                                      }}
                                      className="mt-1 bg-gray-600 border-gray-500 text-white text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-gray-300 text-sm">End</Label>
                                    <Input
                                      type="time"
                                      value={mult.window?.end || '11:00'}
                                      onChange={(e) => {
                                        const newMultipliers = [...rules.multipliers];
                                        newMultipliers[i] = { 
                                          ...mult, 
                                          window: { ...mult.window, end: e.target.value }
                                        };
                                        setRules(prev => ({ ...prev, multipliers: newMultipliers }));
                                      }}
                                      className="mt-1 bg-gray-600 border-gray-500 text-white text-sm"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {/* Remove Button */}
                              {mult.type !== 'time_window' && (
                                <div className="flex items-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setRules(prev => ({
                                      ...prev,
                                      multipliers: prev.multipliers.filter((_, idx) => idx !== i)
                                    }))}
                                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {/* Preview */}
                            <div className="mt-3 p-2 bg-gray-600 rounded text-xs text-gray-300">
                              <span className="font-medium">Effect:</span> {(mult.type || 'unknown').replace('_', ' ')} → {mult.mult}x multiplier
                              {mult.window && ` (${mult.window.start} - ${mult.window.end})`}
                            </div>
                            
                            {/* Remove Button for time_window */}
                            {mult.type === 'time_window' && (
                              <div className="mt-2 flex justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setRules(prev => ({
                                    ...prev,
                                    multipliers: prev.multipliers.filter((_, idx) => idx !== i)
                                  }))}
                                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                >
                                  Remove
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-400" />
                      Scoring Caps & Limits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-300">Daily Max (per player)</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="No limit"
                          value={rules.caps.per_player_per_day || ''}
                          onChange={(e) => setRules(prev => ({
                            ...prev,
                            caps: { 
                              ...prev.caps, 
                              per_player_per_day: e.target.value ? parseInt(e.target.value) : undefined 
                            }
                          }))}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <div className="text-xs text-gray-400 mt-1">Max points per player per day</div>
                      </div>
                      
                      <div>
                        <Label className="text-gray-300">Total Max (per player)</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="No limit"
                          value={rules.caps.per_player_total || ''}
                          onChange={(e) => setRules(prev => ({
                            ...prev,
                            caps: { 
                              ...prev.caps, 
                              per_player_total: e.target.value ? parseInt(e.target.value) : undefined 
                            }
                          }))}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <div className="text-xs text-gray-400 mt-1">Max total points per player</div>
                      </div>
                      
                      <div>
                        <Label className="text-gray-300">Global Total</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="No limit"
                          value={rules.caps.global_total || ''}
                          onChange={(e) => setRules(prev => ({
                            ...prev,
                            caps: { 
                              ...prev.caps, 
                              global_total: e.target.value ? parseInt(e.target.value) : undefined 
                            }
                          }))}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <div className="text-xs text-gray-400 mt-1">Max total points across all players</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-orange-400" />
                      Combos ({rules.combos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rules.combos.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">No combos configured</p>
                    ) : (
                      <div className="space-y-2">
                        {rules.combos.map((combo, i) => (
                          <div key={i} className="p-3 bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-white">{combo.name} - +{combo.bonus} pts</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRules(prev => ({
                                  ...prev,
                                  combos: prev.combos.filter((_, idx) => idx !== i)
                                }))}
                                className="border-gray-600 text-gray-300 hover:bg-gray-600"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="theme" className="space-y-4 mt-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-400" />
                      Player Selection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingPlayers ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                        <span className="ml-2 text-gray-300">Loading players...</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-sm text-gray-300">
                          Select players to participate in this competition:
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {availablePlayers.map((player) => (
                            <label key={player} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPlayers.includes(player)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPlayers(prev => [...prev, player]);
                                  } else {
                                    setSelectedPlayers(prev => prev.filter(p => p !== player));
                                    removePlayerFromTeam(player);
                                  }
                                }}
                                className="rounded border-gray-600 bg-gray-700 text-purple-600"
                              />
                              <span className="text-white text-sm">{player}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            onClick={() => setSelectedPlayers(availablePlayers)}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-600"
                          >
                            Select All
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedPlayers([]);
                              setPlayerAssignments({});
                            }}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-600"
                          >
                            Clear All
                          </Button>
                          <Badge variant="secondary" className="bg-purple-600 text-white">
                            {selectedPlayers.length} selected
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-400" />
                        Teams ({theme.teams.length})
                      </span>
                      <div className="flex items-center gap-2">
                        <Button onClick={addTeam} size="sm" className="bg-purple-600 hover:bg-purple-700">
                          Add Team
                        </Button>
                        <Button
                          onClick={generateAITeams}
                          size="sm"
                          variant="outline"
                          disabled={isGeneratingTeams || theme.teams.length === 0 || selectedPlayers.length === 0}
                          className="border-gray-600 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          {isGeneratingTeams ? 'Generating...' : 'AI Team Names'}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedPlayers.length === 0 ? (
                      <div className="text-gray-400 text-center py-4">
                        Select players first to create teams
                      </div>
                    ) : theme.teams.length === 0 ? (
                      <div className="text-gray-400 text-center py-4">
                        Add teams to assign players
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Button
                            onClick={randomAssignPlayers}
                            size="sm"
                            variant="outline"
                            disabled={selectedPlayers.length < 2}
                            className="border-gray-600 text-gray-300 hover:bg-gray-600"
                          >
                            Random Assignment
                          </Button>
                        </div>
                        
                        <div className="grid gap-4">
                          {theme.teams.map((team, teamIndex) => {
                            const assignedPlayers = playerAssignments[teamIndex] || [];
                            return (
                              <div key={teamIndex} className="p-4 bg-gray-700 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-6 h-6 rounded-full"
                                      style={{ backgroundColor: team.color }}
                                    />
                                    <span className="text-white font-medium">{team.label}</span>
                                    <Badge variant="secondary" className="bg-gray-600 text-gray-200">
                                      {assignedPlayers.length} players
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setTheme(prev => ({
                                      ...prev,
                                      teams: prev.teams.filter((_, idx) => idx !== teamIndex)
                                    }))}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-600"
                                  >
                                    Remove Team
                                  </Button>
                                </div>
                                
                                <div className="space-y-3 mb-4">
                                  {/* Team Name */}
                                  <div>
                                    <Label className="text-gray-300 text-sm">Team Name</Label>
                                    <Input
                                      value={team.label}
                                      onChange={(e) => updateTeam(teamIndex, { label: e.target.value })}
                                      className="bg-gray-600 border-gray-500 text-white"
                                      placeholder="Enter team name"
                                    />
                                  </div>
                                  
                                  {/* Emoji Picker */}
                                  <div>
                                    <Label className="text-gray-300 text-sm">Team Emoji</Label>
                                    <div className="flex items-center gap-2">
                                      <div className="text-2xl p-2 bg-gray-600 rounded border border-gray-500">
                                        {team.emoji || '🚀'}
                                      </div>
                                      <div className="grid grid-cols-8 gap-1 p-2 bg-gray-600 rounded border border-gray-500">
                                        {['🚀', '⚡', '🌟', '🔥', '💎', '🎯', '👑', '🛡️', '⚔️', '🌊', '🎮', '🏆', '💫', '🌌', '🦅', '🐉'].map((emoji) => (
                                          <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => updateTeam(teamIndex, { emoji })}
                                            className={`text-lg p-1 rounded hover:bg-gray-500 transition-colors ${
                                              team.emoji === emoji ? 'bg-purple-600' : ''
                                            }`}
                                          >
                                            {emoji}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Color Picker */}
                                  <div>
                                    <Label className="text-gray-300 text-sm">Team Color</Label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={team.color}
                                        onChange={(e) => updateTeam(teamIndex, { color: e.target.value })}
                                        className="w-12 h-10 rounded border border-gray-500 cursor-pointer"
                                      />
                                      <div className="grid grid-cols-8 gap-1 p-2 bg-gray-600 rounded border border-gray-500">
                                        {['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16', '#0ea5e9', '#f97316', '#a855f7', '#14b8a6', '#eab308', '#dc2626', '#db2777', '#65a30d'].map((color) => (
                                          <button
                                            key={color}
                                            type="button"
                                            onClick={() => updateTeam(teamIndex, { color })}
                                            className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                                              team.color === color ? 'border-white' : 'border-gray-400'
                                            }`}
                                            style={{ backgroundColor: color }}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Player Assignment */}
                                <div className="space-y-2">
                                  <div className="text-sm text-gray-300">Assigned Players:</div>
                                  <div className="flex flex-wrap gap-2">
                                    {assignedPlayers.map((player) => (
                                      <Badge 
                                        key={player} 
                                        variant="secondary" 
                                        className="bg-purple-600 text-white cursor-pointer hover:bg-purple-700"
                                        onClick={() => removePlayerFromTeam(player)}
                                      >
                                        {player} ×
                                      </Badge>
                                    ))}
                                  </div>

                                  <div className="text-sm text-gray-300 mt-3">Available Players:</div>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedPlayers
                                      .filter(player => !Object.values(playerAssignments).flat().includes(player))
                                      .map((player) => (
                                        <Badge 
                                          key={player} 
                                          variant="outline" 
                                          className="border-gray-500 text-gray-300 cursor-pointer hover:bg-gray-600"
                                          onClick={() => assignPlayerToTeam(player, teamIndex)}
                                        >
                                          + {player}
                                        </Badge>
                                      ))
                                    }
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-400" />
                      Visual Effects
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* VFX Intensity */}
                    <div>
                      <Label className="text-gray-300">VFX Intensity</Label>
                      <div className="mt-2 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {['low', 'medium', 'high'].map((intensity) => (
                            <button
                              key={intensity}
                              type="button"
                              onClick={() => setTheme(prev => ({
                                ...prev,
                                vfx: { ...prev.vfx, intensity }
                              }))}
                              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                theme.vfx.intensity === intensity
                                  ? 'border-purple-500 bg-purple-600 text-white'
                                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              <div className="text-center">
                                <div className="text-lg mb-1">
                                  {intensity === 'low' && '✨'}
                                  {intensity === 'medium' && '🌟'}
                                  {intensity === 'high' && '💫'}
                                </div>
                                <div className="capitalize">{intensity}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {/* Intensity Description */}
                        <div className="p-3 bg-gray-700 rounded border border-gray-600">
                          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Preview</div>
                          <div className="text-sm text-gray-300">
                            {theme.vfx.intensity === 'low' && 'Subtle effects: Light sparkles, minimal animations'}
                            {theme.vfx.intensity === 'medium' && 'Balanced effects: Moderate sparkles, smooth animations, cosmic trails'}
                            {theme.vfx.intensity === 'high' && 'Full cosmic experience: Heavy particle effects, screen shake, warp trails, cosmic glow'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Individual VFX Controls */}
                    <div className="space-y-3">
                      <Label className="text-gray-300">Individual Effects</Label>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {/* Sparkles - String dropdown */}
                        <div className="p-3 bg-gray-700 rounded">
                          <div className="mb-2">
                            <div className="text-white text-sm">✨ Sparkles</div>
                            <div className="text-xs text-gray-400">Activity celebrations</div>
                          </div>
                          <select
                            value={theme.vfx.sparkles}
                            onChange={(e) => setTheme(prev => ({
                              ...prev,
                              vfx: { ...prev.vfx, sparkles: e.target.value }
                            }))}
                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                          >
                            <option value="off">Off</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        
                        {/* Warp Trail - String dropdown */}
                        <div className="p-3 bg-gray-700 rounded">
                          <div className="mb-2">
                            <div className="text-white text-sm">🌊 Warp Trail</div>
                            <div className="text-xs text-gray-400">Motion effects</div>
                          </div>
                          <select
                            value={theme.vfx.warp_trail}
                            onChange={(e) => setTheme(prev => ({
                              ...prev,
                              vfx: { ...prev.vfx, warp_trail: e.target.value }
                            }))}
                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                          >
                            <option value="off">Off</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        
                        {/* Screen Shake - Boolean switch */}
                        <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                          <div>
                            <div className="text-white text-sm">📳 Screen Shake</div>
                            <div className="text-xs text-gray-400">Victory impact</div>
                          </div>
                          <Switch
                            checked={theme.vfx.screen_shake_on_win}
                            onCheckedChange={(checked) => setTheme(prev => ({
                              ...prev,
                              vfx: { ...prev.vfx, screen_shake_on_win: checked }
                            }))}
                          />
                        </div>
                        
                        {/* Particle Effects - Boolean switch */}
                        <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                          <div>
                            <div className="text-white text-sm">💫 Particle Effects</div>
                            <div className="text-xs text-gray-400">Cosmic particles</div>
                          </div>
                          <Switch
                            checked={theme.vfx.particle_effects}
                            onCheckedChange={(checked) => setTheme(prev => ({
                              ...prev,
                              vfx: { ...prev.vfx, particle_effects: checked }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prizes" className="space-y-4 mt-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-400" />
                      Bonus Points Rewards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-300">Winner Prize</Label>
                        <Input
                          type="number"
                          value={prizes.winner}
                          onChange={(e) => setPrizes(prev => ({ ...prev, winner: parseInt(e.target.value) || 0 }))}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="Amount in NOK"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Runner-up Prize</Label>
                        <Input
                          type="number"
                          value={prizes.runner_up}
                          onChange={(e) => setPrizes(prev => ({ ...prev, runner_up: parseInt(e.target.value) || 0 }))}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="Amount in NOK"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-600">
                      <Label className="text-gray-300 mb-3 block">Tiebreaker Rules</Label>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-gray-300 text-sm">Primary Tiebreaker</Label>
                          <select
                            value={rules.tiebreaker}
                            onChange={(e) => setRules(prev => ({ ...prev, tiebreaker: e.target.value as 'most_total' | 'first_to' | 'fastest_pace' }))}
                            className="w-full mt-1 p-2 bg-gray-600 border border-gray-500 rounded text-white"
                          >
                            <option value="most_total">Most Total Activities</option>
                            <option value="first_to">First to Reach Goal</option>
                            <option value="fastest_pace">Fastest Average Pace</option>
                          </select>
                          <div className="text-xs text-gray-400 mt-1">
                            {rules.tiebreaker === 'most_total' && 'Player with highest total activity count wins'}
                            {rules.tiebreaker === 'first_to' && 'Player who reached the goal first wins'}
                            {rules.tiebreaker === 'fastest_pace' && 'Player with highest activities per day average wins'}
                          </div>
                        </div>
                        
                        {/* Secondary Tiebreaker */}
                        <div>
                          <Label className="text-gray-300 text-sm">Secondary Tiebreaker</Label>
                          <select
                            value={rules.secondary_tiebreaker || 'random'}
                            onChange={(e) => setRules(prev => ({ ...prev, secondary_tiebreaker: e.target.value as 'random' | 'alphabetical' | 'reverse_alphabetical' }))}
                            className="w-full mt-1 p-2 bg-gray-600 border border-gray-500 rounded text-white"
                          >
                            <option value="random">Random Selection</option>
                            <option value="alphabetical">Alphabetical Order</option>
                            <option value="reverse_alphabetical">Reverse Alphabetical</option>
                          </select>
                          <div className="text-xs text-gray-400 mt-1">
                            Used when primary tiebreaker results in a tie
                          </div>
                        </div>
                        
                        {/* Tiebreaker Preview */}
                        <div className="p-3 bg-gray-700 rounded border border-gray-600">
                          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tiebreaker Logic</div>
                          <div className="text-sm text-gray-300">
                            <div className="font-medium mb-1">If players have equal points:</div>
                            <div className="text-xs space-y-1">
                              <div>1️⃣ Compare by: {(rules.tiebreaker || 'most_total').replace('_', ' ')}</div>
                              <div>2️⃣ If still tied: {(rules.secondary_tiebreaker || 'random').replace('_', ' ')}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-gray-300">Participation Prize</Label>
                      <Input
                        type="number"
                        value={prizes.participation}
                        onChange={(e) => setPrizes(prev => ({ ...prev, participation: parseInt(e.target.value) || 0 }))}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Amount in NOK (optional)"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={validateConfiguration}
              disabled={isValidating}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </Button>
            
            {/* Enhanced Validation Results */}
            {validationErrors.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge 
                  variant={validationErrors.some(e => e.type === 'error') ? 'destructive' : 'secondary'}
                  className={validationErrors.some(e => e.type === 'error') 
                    ? 'bg-red-600 text-white' 
                    : 'bg-yellow-600 text-white'
                  }
                >
                  {validationErrors.filter(e => e.type === 'error').length} errors, 
                  {validationErrors.filter(e => e.type === 'warning').length} warnings
                </Badge>
                
                {/* Validation Details Dropdown */}
                <div className="relative group">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </Button>
                  
                  {/* Tooltip with validation details */}
                  <div className="absolute bottom-full left-0 mb-2 w-80 p-3 bg-gray-900 border border-gray-600 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <div className="text-sm font-medium text-white mb-2">Validation Issues</div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {validationErrors.map((error, i) => (
                        <div key={i} className={`p-2 rounded text-xs ${
                          error.type === 'error' 
                            ? 'bg-red-600/20 border border-red-600/50 text-red-300'
                            : 'bg-yellow-600/20 border border-yellow-600/50 text-yellow-300'
                        }`}>
                          <div className="font-medium capitalize">{error.type}</div>
                          <div className="mt-1">{error.message}</div>
                          {error.field && error.field !== 'general' && (
                            <div className="text-xs text-gray-400 mt-1">Field: {error.field}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Validation Success */}
            {!isValidating && validationErrors.length === 0 && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Configuration valid</span>
              </div>
            )}
            
            {/* Real-time validation warnings */}
            <div className="flex items-center gap-2">
              {!name && (
                <Badge variant="outline" className="border-red-500 text-red-400 text-xs">
                  Missing name
                </Badge>
              )}
              {(!startTime || !endTime) && (
                <Badge variant="outline" className="border-red-500 text-red-400 text-xs">
                  Missing dates
                </Badge>
              )}
              {selectedPlayers.length === 0 && (
                <Badge variant="outline" className="border-orange-500 text-orange-400 text-xs">
                  No players
                </Badge>
              )}
              {theme.teams.length > 0 && Object.values(playerAssignments).flat().length < selectedPlayers.length && (
                <Badge variant="outline" className="border-orange-500 text-orange-400 text-xs">
                  Unassigned players
                </Badge>
              )}
              {rules.multipliers.some(m => m.mult < 1 || m.mult > 10) && (
                <Badge variant="outline" className="border-orange-500 text-orange-400 text-xs">
                  Invalid multipliers
                </Badge>
              )}
            </div>
          </div>
          
          <Button 
            onClick={createCompetition}
            disabled={!name || !startTime || !endTime || validationErrors.some(e => e.type === 'error')}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
          >
            Create Competition
          </Button>
        </div>

        {/* Live Preview Panel */}
        {currentTab !== 'basic' && (
          <div className="w-80 flex-shrink-0">
            <Card className="bg-gray-800 border-gray-700 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-400" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Competition Header Preview */}
                <div className="p-3 bg-gray-900 rounded border border-gray-600">
                  <div className="text-center">
                    <h3 className="text-white font-bold text-lg">{name || 'Competition Name'}</h3>
                    <div className="text-xs text-gray-400 mt-1">
                      {startTime && endTime && (
                        `${new Date(startTime).toLocaleDateString()} - ${new Date(endTime).toLocaleDateString()}`
                      )}
                    </div>
                  </div>
                </div>

                {/* Teams Preview */}
                {theme.teams.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-300 mb-2">Teams</div>
                    <div className="space-y-2">
                      {theme.teams.map((team, index) => {
                        const assignedCount = playerAssignments[index]?.length || 0;
                        return (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                            <div className="text-lg">{team.emoji || '🚀'}</div>
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: team.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate">
                                {team.label || `Team ${index + 1}`}
                              </div>
                              <div className="text-xs text-gray-400">
                                {assignedCount} player{assignedCount !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* VFX Preview */}
                <div>
                  <div className="text-sm font-medium text-gray-300 mb-2">Visual Effects</div>
                  <div className="p-2 bg-gray-700 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Intensity</span>
                      <span className="text-sm text-white capitalize">
                        {theme.vfx.intensity === 'low' && '✨ Low'}
                        {theme.vfx.intensity === 'medium' && '🌟 Medium'}
                        {theme.vfx.intensity === 'high' && '💫 High'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className={`p-1 rounded text-center ${
                        theme.vfx.sparkles !== 'off' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-400'
                      }`}>
                        ✨ Sparkles ({theme.vfx.sparkles})
                      </div>
                      <div className={`p-1 rounded text-center ${
                        theme.vfx.warp_trail !== 'off' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-400'
                      }`}>
                        🌊 Warp ({theme.vfx.warp_trail})
                      </div>
                      <div className={`p-1 rounded text-center ${
                        theme.vfx.screen_shake_on_win ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-400'
                      }`}>
                        📳 Shake
                      </div>
                      <div className={`p-1 rounded text-center ${
                        theme.vfx.particle_effects ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-400'
                      }`}>
                        💫 Particles
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scoring Preview */}
                <div>
                  <div className="text-sm font-medium text-gray-300 mb-2">Scoring</div>
                  <div className="p-2 bg-gray-700 rounded space-y-2">
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div className="text-center p-1 bg-blue-600 rounded text-white">
                        📞 {rules.points.call}pts
                      </div>
                      <div className="text-center p-1 bg-green-600 rounded text-white">
                        📅 {rules.points.book}pts
                      </div>
                      <div className="text-center p-1 bg-purple-600 rounded text-white">
                        📈 {rules.points.lift}pts
                      </div>
                    </div>
                    
                    {rules.multipliers.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Multipliers</div>
                        <div className="space-y-1">
                          {rules.multipliers.slice(0, 3).map((mult, i) => (
                            <div key={i} className="text-xs text-yellow-300 flex justify-between">
                              <span>{(mult.type || 'unknown').replace('_', ' ')}</span>
                              <span>{mult.mult}x</span>
                            </div>
                          ))}
                          {rules.multipliers.length > 3 && (
                            <div className="text-xs text-gray-400">+{rules.multipliers.length - 3} more...</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {(rules.caps.per_player_per_day || rules.caps.per_player_total) && (
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Caps</div>
                        <div className="text-xs text-orange-300">
                          {rules.caps.per_player_per_day && `Daily: ${rules.caps.per_player_per_day}pts`}
                          {rules.caps.per_player_total && ` Total: ${rules.caps.per_player_total}pts`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prizes Preview */}
                <div>
                  <div className="text-sm font-medium text-gray-300 mb-2">Prizes</div>
                  <div className="p-2 bg-gray-700 rounded">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-yellow-400">🏆 Winner</div>
                        <div className="text-white font-medium">{prizes.winner}kr</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-300">🥈 Runner-up</div>
                        <div className="text-white font-medium">{prizes.runner_up}kr</div>
                      </div>
                    </div>
                    {prizes.participation > 0 && (
                      <div className="text-center mt-2 pt-2 border-t border-gray-600">
                        <div className="text-xs text-blue-400">🎫 Participation</div>
                        <div className="text-white text-xs font-medium">{prizes.participation}kr</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuration Status */}
                <div className="pt-2 border-t border-gray-600">
                  <div className="text-xs text-gray-400 mb-2">Configuration Status</div>
                  <div className="space-y-1">
                    <div className={`text-xs flex items-center gap-2 ${
                      name && startTime && endTime ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {name && startTime && endTime ? '✅' : '❌'} Basic Info
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${
                      selectedPlayers.length > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedPlayers.length > 0 ? '✅' : '❌'} Players ({selectedPlayers.length})
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${
                      theme.teams.length === 0 || Object.values(playerAssignments).flat().length === selectedPlayers.length 
                        ? 'text-green-400' : 'text-orange-400'
                    }`}>
                      {theme.teams.length === 0 || Object.values(playerAssignments).flat().length === selectedPlayers.length 
                        ? '✅' : '⚠️'} Team Assignment
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
