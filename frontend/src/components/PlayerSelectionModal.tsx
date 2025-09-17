import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Rocket, Crown } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import type { AvailablePlayersResponse, SelectPlayerRequest, PlayerSelectionResponse } from 'types';

export interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPlayerSelected: (playerName: string) => void;
}

export default function PlayerSelectionModal({ isOpen, onClose, onPlayerSelected }: Props) {
  const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);
  const [takenPlayers, setTakenPlayers] = useState<string[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvailablePlayers();
    }
  }, [isOpen]);

  const loadAvailablePlayers = async () => {
    setLoading(true);
    try {
      const response = await brain.get_available_players();
      const data: AvailablePlayersResponse = await response.json();
      setAvailablePlayers(data.available_players);
      setTakenPlayers(data.taken_players);
    } catch (error) {
      console.error('Failed to load available players:', error);
      toast.error('Failed to load available players');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlayer = async () => {
    if (!selectedPlayer) {
      toast.error('Please select a player');
      return;
    }

    setSubmitting(true);
    try {
      const request: SelectPlayerRequest = {
        player_name: selectedPlayer
      };
      
      const response = await brain.select_player(request);
      const data: PlayerSelectionResponse = await response.json();
      
      toast.success(`Welcome, ${data.player_name}! You are now playing as this cosmic warrior.`);
      onPlayerSelected(data.player_name);
      onClose();
    } catch (error) {
      console.error('Failed to select player:', error);
      toast.error('Failed to select player');
    } finally {
      setSubmitting(false);
    }
  };

  const getPlayerEmoji = (playerName: string) => {
    const emojiMap: Record<string, string> = {
      'RIKKE': '👸',
      'SIGGEN': '🚀',
      'GARD': '🛡️',
      'THEA': '⭐',
      'ITHY': '🔮',
      'EMILIE': '💎',
      'SCHOLZ': '🎯',
      'HEFF': '⚡',
      'KAREN': '👑',
      'TOBIAS': '🌟',
      'ANDREAS': '🔥',
      'SONDRE': '💫'
    };
    return emojiMap[playerName] || '🚀';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-purple-500/30 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl">
            <Rocket className="h-6 w-6 text-purple-400" />
            <span>Choose Your Cosmic Avatar</span>
          </DialogTitle>
          <DialogDescription className="text-purple-200">
            Select which of the 12 galactic warriors you want to represent in the QuestBoard race.
            Each player has their own spaceship and can be upgraded based on performance!
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
            <span className="ml-2 text-purple-200">Loading cosmic warriors...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Available Players */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-400" />
                <span>Available Warriors ({availablePlayers.length})</span>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {availablePlayers.map((player) => (
                  <button
                    key={player}
                    onClick={() => setSelectedPlayer(player)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      selectedPlayer === player
                        ? 'border-purple-400 bg-purple-600/30'
                        : 'border-slate-600 bg-slate-700/50 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{getPlayerEmoji(player)}</div>
                    <div className="text-sm font-medium">{player}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Taken Players */}
            {takenPlayers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  <span>Already Claimed ({takenPlayers.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {takenPlayers.map((player) => (
                    <Badge key={player} variant="secondary" className="bg-slate-600 text-slate-300">
                      {getPlayerEmoji(player)} {player}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Selection Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-600">
              <p className="text-sm text-purple-200">
                {selectedPlayer && (
                  <span>Selected: <strong>{getPlayerEmoji(selectedPlayer)} {selectedPlayer}</strong></span>
                )}
              </p>
              <div className="space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                  className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSelectPlayer}
                  disabled={!selectedPlayer || submitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Claiming...
                    </>
                  ) : (
                    'Claim This Warrior'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
