
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import type { PlayerGoalResponse, UpdatePlayerGoalsRequest } from 'types';

export interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerGoalResponse | null;
  onSuccess: () => void;
}

export default function EditPlayerGoalsModal({ isOpen, onClose, player, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    goal_books: player?.goal_books || 0,
    goal_opps: player?.goal_opps || 0,
    goal_deals: player?.goal_deals || 0
  });
  const [loading, setLoading] = useState(false);

  // Update form data when player changes
  React.useEffect(() => {
    if (player) {
      setFormData({
        goal_books: player.goal_books,
        goal_opps: player.goal_opps,
        goal_deals: player.goal_deals
      });
    }
  }, [player]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!player) return;

    if (formData.goal_books < 0 || formData.goal_opps < 0 || formData.goal_deals < 0) {
      toast.error('Goals cannot be negative');
      return;
    }

    setLoading(true);
    try {
      const updateRequest: UpdatePlayerGoalsRequest = {
        quarter_id: player.quarter_id,
        player_name: player.player_name,
        goal_books: formData.goal_books,
        goal_opps: formData.goal_opps,
        goal_deals: formData.goal_deals
      };

      await brain.update_player_goals(updateRequest);
      
      toast.success(`Goals updated for ${player.player_name}!`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update player goals:', error);
      toast.error('Failed to update player goals');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPoints = () => {
    // Points calculation: books=10, opps=20, deals=50
    return (formData.goal_books * 10) + (formData.goal_opps * 20) + (formData.goal_deals * 50);
  };

  if (!player) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-400" />
            <span>Edit Goals - {player.player_name}</span>
          </DialogTitle>
          <DialogDescription className="text-purple-200">
            Set individual goals for this player. Team goals will auto-calculate.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="books-goal" className="text-white">
                Books Goal
                <span className="text-xs text-purple-300 block">10 pts each</span>
              </Label>
              <Input
                id="books-goal"
                type="number"
                min="0"
                value={formData.goal_books}
                onChange={(e) => setFormData(prev => ({ ...prev, goal_books: parseInt(e.target.value) || 0 }))}
                className="bg-slate-700 border-purple-500/30 text-white"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="opps-goal" className="text-white">
                Opportunities Goal
                <span className="text-xs text-purple-300 block">20 pts each</span>
              </Label>
              <Input
                id="opps-goal"
                type="number"
                min="0"
                value={formData.goal_opps}
                onChange={(e) => setFormData(prev => ({ ...prev, goal_opps: parseInt(e.target.value) || 0 }))}
                className="bg-slate-700 border-purple-500/30 text-white"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deals-goal" className="text-white">
                Deals Goal
                <span className="text-xs text-purple-300 block">50 pts each</span>
              </Label>
              <Input
                id="deals-goal"
                type="number"
                min="0"
                value={formData.goal_deals}
                onChange={(e) => setFormData(prev => ({ ...prev, goal_deals: parseInt(e.target.value) || 0 }))}
                className="bg-slate-700 border-purple-500/30 text-white"
                disabled={loading}
              />
            </div>
          </div>
          
          {/* Goal Summary */}
          <div className="bg-slate-700/50 p-4 rounded-lg border border-purple-500/20">
            <h4 className="text-white font-semibold mb-2">Goal Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-purple-200">Current Progress:</p>
                <p className="text-white">
                  {player.current_books} / {player.goal_books} books
                </p>
                <p className="text-white">
                  {player.current_opps} / {player.goal_opps} opps
                </p>
                <p className="text-white">
                  {player.current_deals} / {player.goal_deals} deals
                </p>
              </div>
              <div>
                <p className="text-purple-200">New Target Points:</p>
                <p className="text-2xl font-bold text-purple-400">
                  {calculateTotalPoints()}
                </p>
                <p className="text-xs text-purple-300">
                  Current: {player.current_points} points
                </p>
              </div>
            </div>
          </div>
        </form>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Goals
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
