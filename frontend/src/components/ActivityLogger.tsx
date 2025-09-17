



import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import brain from 'brain';
import { LogActivityRequest, ActivityType, PlayerSelectionResponse } from 'types';
import PlayerSelectionModal from './PlayerSelectionModal';
import { injectCosmicAnimations } from 'utils/cosmicAnimations';

export interface Props {
  onActivityLogged?: () => void;
}

const ACTIVITY_OPTIONS = [
  { value: 'book', label: '📅 Book Meeting', points: 1, description: 'Booked a new meeting' },
  { value: 'opp', label: '🎯 Opportunity', points: 2, description: 'Created new opportunity' },
  { value: 'deal', label: '💎 Deal Closed', points: 5, description: 'Closed a deal!' }
];

export default function ActivityLogger({ onActivityLogged }: Props) {
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [isLogging, setIsLogging] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [checkingPlayer, setCheckingPlayer] = useState(true);

  // Initialize cosmic animations
  useEffect(() => {
    injectCosmicAnimations();
  }, []);

  useEffect(() => {
    checkSelectedPlayer();
  }, []);

  const checkSelectedPlayer = async () => {
    setCheckingPlayer(true);
    try {
      const response = await brain.get_my_player();
      const data: PlayerSelectionResponse | null = await response.json();
      
      if (data) {
        setSelectedPlayer(data.player_name);
      }
    } catch (error) {
      console.error('Failed to check selected player:', error);
      // If error, we'll assume no player is selected
    } finally {
      setCheckingPlayer(false);
    }
  };

  const handleLogActivity = async () => {
    if (!selectedActivity) {
      toast.error('Please select an activity type');
      return;
    }

    // Check if user has selected a player
    if (!selectedPlayer) {
      setShowPlayerSelection(true);
      return;
    }

    setIsLogging(true);
    
    try {
      const request: LogActivityRequest = {
        type: selectedActivity as ActivityType
      };
      
      const response = await brain.log_activity(request);
      const data = await response.json();
      
      if (data.success) {
        const activity = ACTIVITY_OPTIONS.find(opt => opt.value === selectedActivity);
        
        // Enhanced contextual feedback with rich information
        const { message, progress_context, streak_info, team_impact } = data;
        
        // Generate context-aware description
        let description = `${message} • +${data.points_earned} race points!`;
        
        // Add progress context
        if (progress_context?.next_milestone) {
          const milestone = progress_context.next_milestone;
          if (milestone.is_goal) {
            description += ` • ${milestone.remaining} points to Strategy Moon! 🌙`;
          } else {
            description += ` • ${milestone.remaining} points to ${milestone.points}pt milestone! ⭐`;
          }
        }
        
        // Add streak information
        if (streak_info?.momentum_level === 'blazing') {
          description += ` • 🔥🔥🔥 BLAZING STREAK!`;
        } else if (streak_info?.momentum_level === 'hot') {
          description += ` • 🔥🔥 Hot streak!`;
        } else if (streak_info?.momentum_level === 'warm') {
          description += ` • 🔥 Building momentum!`;
        }
        
        // Show enhanced success toast with cosmic animations
        toast.success(
          `${activity?.label} • ${selectedPlayer}`,
          {
            description,
            duration: 6000,
            className: 'bg-gradient-to-r from-blue-900/90 to-purple-900/90 border-purple-500/50 text-white',
            action: {
              label: 'View Progress',
              onClick: () => {
                // Could trigger planet glow effect here
                console.log('Viewing progress details:', { progress_context, streak_info });
              },
            },
          }
        );
        
        // Show additional streak notification if significant
        if (streak_info?.current_streak_days >= 3) {
          setTimeout(() => {
            toast.info(
              streak_info.streak_message,
              {
                duration: 4000,
                className: 'bg-gradient-to-r from-orange-900/90 to-red-900/90 border-orange-500/50 text-white'
              }
            );
          }, 1000);
        }
        
        // Trigger planet glow effect based on activity type
        triggerPlanetEffect(selectedActivity);
        
        // Reset form with smooth animation
        setSelectedActivity('');
        
        // Notify parent component
        onActivityLogged?.();
      }
    } catch (error: any) {
      console.error('Failed to log activity:', error);
      
      // Check if error is about player selection
      if (error.message?.includes('must select a player')) {
        setShowPlayerSelection(true);
        toast.error('Please select your player avatar first');
      } else {
        toast.error('Failed to log activity. Please try again.');
      }
    } finally {
      setIsLogging(false);
    }
  };

  const triggerPlanetEffect = (activityType: string) => {
    // Trigger planet glow effects based on activity type
    const effects = {
      'book': 'contact-established',
      'opp': 'opportunity-mapped', 
      'deal': 'partnership-secured'
    };
    
    const effectClass = effects[activityType as keyof typeof effects];
    if (effectClass) {
      // Add temporary effect class to body for global planet animations
      document.body.classList.add(`planet-effect-${effectClass}`);
      setTimeout(() => {
        document.body.classList.remove(`planet-effect-${effectClass}`);
      }, 3000);
    }
  };

  const handlePlayerSelected = (playerName: string) => {
    setSelectedPlayer(playerName);
    // After selecting player, try logging the activity again if one was selected
    if (selectedActivity) {
      setTimeout(() => handleLogActivity(), 500);
    }
  };

  const selectedOption = ACTIVITY_OPTIONS.find(opt => opt.value === selectedActivity);

  if (checkingPlayer) {
    return (
      <Card className="bg-slate-900/50 border-purple-500/30 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400 mr-2" />
          <span className="text-purple-200">Checking player status...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-purple-500/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          🎮 Log Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">
            Activity Type
          </label>
          <Select value={selectedActivity} onValueChange={setSelectedActivity}>
            <SelectTrigger className="bg-slate-800/50 border-purple-500/30 text-white">
              <SelectValue placeholder="Select activity type..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-purple-500/30">
              {ACTIVITY_OPTIONS.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="text-white hover:bg-purple-600/20 focus:bg-purple-600/20"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <span className="ml-2 text-xs bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold">
                      +{option.points}pts
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Show selected player if available */}
        {selectedPlayer && (
          <div className="p-3 bg-purple-600/20 rounded-lg border border-purple-500/30">
            <div className="text-sm text-purple-200 mb-1">Playing as:</div>
            <div className="font-semibold text-white flex items-center space-x-2">
              <span className="text-lg">🚀</span>
              <span>{selectedPlayer}</span>
            </div>
          </div>
        )}

        {/* Activity description */}
        {selectedOption && (
          <div className="p-3 bg-blue-600/20 rounded-lg border border-blue-500/30">
            <div className="text-sm text-blue-200">
              <strong>+{selectedOption.points} Race Points:</strong> {selectedOption.description}
            </div>
          </div>
        )}

        <Button 
          onClick={handleLogActivity}
          disabled={!selectedActivity || isLogging}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
        >
          {isLogging ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Logging Activity...
            </>
          ) : (
            '🚀 Log Activity'
          )}
        </Button>
      </CardContent>
      
      {/* Player Selection Modal */}
      <PlayerSelectionModal
        isOpen={showPlayerSelection}
        onClose={() => setShowPlayerSelection(false)}
        onPlayerSelected={handlePlayerSelected}
      />
    </Card>
  );
}
