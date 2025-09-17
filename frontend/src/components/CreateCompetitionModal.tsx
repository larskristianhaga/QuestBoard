

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, X } from 'lucide-react';
import brain from 'brain';
import { toast } from 'sonner';
import type { CompetitionCreate, AvailablePlayersResponse, EnrollParticipantRequest } from 'types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCompetitionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [enrollingPlayers, setEnrollingPlayers] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);
  const [teamAssignmentMode, setTeamAssignmentMode] = useState<'manual' | 'random'>('manual');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    is_hidden: false,
    tiebreaker: 'most_total' as const
  });

  // Load available players when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAvailablePlayers();
    }
  }, [isOpen]);

  const loadAvailablePlayers = async () => {
    setLoadingPlayers(true);
    try {
      const response = await brain.get_available_players();
      const data: AvailablePlayersResponse = await response.json();
      // Include both available and taken players for competition enrollment
      const allPlayers = [...data.available_players, ...data.taken_players].sort();
      setAvailablePlayers(allPlayers);
    } catch (error) {
      console.error('Failed to load players:', error);
      toast.error('Failed to load available players');
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleClose = () => {
    if (!loading && !enrollingPlayers) {
      setFormData({
        name: '',
        description: '',
        start_time: '',
        end_time: '',
        is_hidden: false,
        tiebreaker: 'highest_points' as const
      });
      setSelectedPlayers([]);
      setTeamA([]);
      setTeamB([]);
      onClose();
    }
  };

  const assignToTeam = (playerName: string, team: 'A' | 'B') => {
    // Remove from other team first
    setTeamA(prev => prev.filter(p => p !== playerName));
    setTeamB(prev => prev.filter(p => p !== playerName));
    
    // Add to selected team
    if (team === 'A') {
      setTeamA(prev => [...prev, playerName]);
    } else {
      setTeamB(prev => [...prev, playerName]);
    }
  };

  const removeFromTeam = (playerName: string) => {
    setTeamA(prev => prev.filter(p => p !== playerName));
    setTeamB(prev => prev.filter(p => p !== playerName));
  };

  const randomAssignTeams = () => {
    if (selectedPlayers.length < 2) return;
    
    const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    
    setTeamA(shuffled.slice(0, mid));
    setTeamB(shuffled.slice(mid));
  };

  const balanceTeams = () => {
    const totalPlayers = selectedPlayers.length;
    const targetPerTeam = Math.floor(totalPlayers / 2);
    
    if (teamA.length > targetPerTeam) {
      const excess = teamA.slice(targetPerTeam);
      setTeamA(prev => prev.slice(0, targetPerTeam));
      setTeamB(prev => [...prev, ...excess]);
    } else if (teamB.length > targetPerTeam) {
      const excess = teamB.slice(targetPerTeam);
      setTeamB(prev => prev.slice(0, targetPerTeam));
      setTeamA(prev => [...prev, ...excess]);
    }
  };

  const togglePlayerSelection = (playerName: string) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerName)) {
        // Remove from selected and teams
        removeFromTeam(playerName);
        return prev.filter(p => p !== playerName);
      } else {
        // Add to selected
        return [...prev, playerName];
      }
    });
  };

  const auto6v6Assignment = () => {
    if (selectedPlayers.length !== 12) {
      toast.error('Please select exactly 12 players for 6v6 teams');
      return;
    }
    
    const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
    setTeamA(shuffled.slice(0, 6));
    setTeamB(shuffled.slice(6, 12));
    setTeamAssignmentMode('random');
  };

  const resetTeams = () => {
    setTeamA([]);
    setTeamB([]);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      toast.error('End time must be after start time');
      return;
    }

    if (selectedPlayers.length === 0) {
      toast.error('Please select at least one player for the competition');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create the competition
      const competitionData: CompetitionCreate = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_hidden: formData.is_hidden,
        tiebreaker: formData.tiebreaker
      };

      const response = await brain.create_competition(competitionData);
      const result = await response.json();
      
      // Step 2: Enroll selected players
      setEnrollingPlayers(true);
      const enrollmentPromises = selectedPlayers.map(playerName => {
        const enrollRequest: EnrollParticipantRequest = {
          competition_id: result.id,
          player_name: playerName
        };
        return brain.enroll_participant(enrollRequest);
      });
      
      await Promise.all(enrollmentPromises);
      
      toast.success(`Competition "${result.name}" created with ${selectedPlayers.length} players enrolled!`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to create competition:', error);
      toast.error('Failed to create competition');
    } finally {
      setLoading(false);
      setEnrollingPlayers(false);
    }
  };

  const generateDefaultTimes = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(9, 0, 0, 0); // 9 AM today
    
    const end = new Date(start);
    end.setDate(end.getDate() + 7); // One week later
    end.setHours(17, 0, 0, 0); // 5 PM
    
    setFormData(prev => ({
      ...prev,
      start_time: start.toISOString().slice(0, 16),
      end_time: end.toISOString().slice(0, 16)
    }));
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-purple-500/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Create Booking Competition</span>
          </DialogTitle>
          <DialogDescription className="text-purple-200">
            Set up a new booking competition with teams, rules, and goals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Competition Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white"
                placeholder="e.g., Q4 Booking Blitz"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white"
                placeholder="Competition description and rules..."
                rows={3}
              />
            </div>
          </div>

          {/* Time Settings */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Competition Schedule</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateDefaultTimes}
                className="border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
              >
                Use Default Times
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time" className="text-white">Start Time *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>

              <div>
                <Label htmlFor="end_time" className="text-white">End Time *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
            </div>
          </div>

          {/* Player Selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Team Selection</h3>
              {selectedPlayers.length > 0 && (
                <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
                  {selectedPlayers.length} players selected
                </Badge>
              )}
            </div>
            
            {loadingPlayers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                <span className="ml-2 text-purple-200">Loading available players...</span>
              </div>
            ) : (
              <>
                {selectedPlayers.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Selected Players:</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlayers.map(playerName => (
                        <Badge 
                          key={playerName}
                          variant="default"
                          className="bg-purple-600 hover:bg-purple-700 cursor-pointer flex items-center space-x-1"
                          onClick={() => togglePlayerSelection(playerName)}
                        >
                          <span>{playerName}</span>
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="border border-purple-500/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <Label className="text-white text-sm mb-3 block">Available Players:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availablePlayers.map(playerName => (
                      <div key={playerName} className="flex items-center space-x-2">
                        <Checkbox
                          id={`player-${playerName}`}
                          checked={selectedPlayers.includes(playerName)}
                          onCheckedChange={() => togglePlayerSelection(playerName)}
                          className="border-purple-500/30"
                        />
                        <Label 
                          htmlFor={`player-${playerName}`}
                          className="text-purple-200 cursor-pointer text-sm"
                        >
                          {playerName}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  {availablePlayers.length === 0 && (
                    <p className="text-purple-400 text-sm text-center py-4">No players available</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Team Assignment */}
          {selectedPlayers.length > 1 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Team Assignment</h3>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={auto6v6Assignment}
                    disabled={selectedPlayers.length !== 12}
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
                  >
                    Auto 6v6
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={randomAssignTeams}
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
                  >
                    Random Split
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetTeams}
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
                  >
                    Reset Teams
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Team A */}
                <div className="border border-blue-500/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-blue-300">Team A ({teamA.length})</h4>
                    {selectedPlayers.length === 12 && teamA.length !== 6 && (
                      <Badge variant="destructive" className="text-xs">
                        Need {6 - teamA.length} more
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 min-h-[120px]">
                    {teamA.map(playerName => (
                      <div
                        key={playerName}
                        className="flex items-center justify-between bg-blue-600/20 rounded px-3 py-2"
                      >
                        <span className="text-blue-200 text-sm">{playerName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromTeam(playerName)}
                          className="h-6 w-6 p-0 text-blue-400 hover:text-blue-200"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {teamA.length === 0 && (
                      <div className="text-center text-blue-400/60 text-sm py-8">
                        No players assigned
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Team B */}
                <div className="border border-red-500/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-red-300">Team B ({teamB.length})</h4>
                    {selectedPlayers.length === 12 && teamB.length !== 6 && (
                      <Badge variant="destructive" className="text-xs">
                        Need {6 - teamB.length} more
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 min-h-[120px]">
                    {teamB.map(playerName => (
                      <div
                        key={playerName}
                        className="flex items-center justify-between bg-red-600/20 rounded px-3 py-2"
                      >
                        <span className="text-red-200 text-sm">{playerName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromTeam(playerName)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-200"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {teamB.length === 0 && (
                      <div className="text-center text-red-400/60 text-sm py-8">
                        No players assigned
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Unassigned Players */}
              {selectedPlayers.filter(p => !teamA.includes(p) && !teamB.includes(p)).length > 0 && (
                <div className="border border-purple-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-purple-300 mb-3">Unassigned Players</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlayers
                      .filter(p => !teamA.includes(p) && !teamB.includes(p))
                      .map(playerName => (
                        <div key={playerName} className="flex space-x-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => assignToTeam(playerName, 'A')}
                            className="text-xs bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
                          >
                            → Team A
                          </Button>
                          <span className="flex items-center px-2 text-purple-200 text-sm">
                            {playerName}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => assignToTeam(playerName, 'B')}
                            className="text-xs bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30"
                          >
                            → Team B
                          </Button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
              
              {/* Team Balance Info */}
              {selectedPlayers.length === 12 && (
                <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-200">
                      6v6 Setup: {teamA.length === 6 && teamB.length === 6 ? '✅ Perfect!' : '⚠️ Unbalanced'}
                    </span>
                    {teamA.length !== 6 || teamB.length !== 6 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={balanceTeams}
                        className="text-xs border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
                      >
                        Balance Teams
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Competition Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Competition Settings</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_hidden"
                checked={formData.is_hidden}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_hidden: !!checked }))}
                className="border-purple-500/30"
              />
              <Label htmlFor="is_hidden" className="text-purple-200">
                Start as hidden competition
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading || enrollingPlayers}
              className="border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || enrollingPlayers || !formData.name.trim() || !formData.start_time || !formData.end_time || selectedPlayers.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading || enrollingPlayers ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {enrollingPlayers ? 'Enrolling Players...' : 'Creating...'}
                </>
              ) : (
                'Create Competition'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCompetitionModal;
