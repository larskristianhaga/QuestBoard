

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import brain from 'brain';
import { CreateChallengeRequest } from 'types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  quarterId: number;
}

interface FormData {
  title: string;
  description: string;
  type: string;
  icon: string;
  target_value: number;
  target_type: string;
  duration_hours: number;
  reward_points: number;
  reward_description: string;
}

const challengeTypes = [
  { value: 'speed_run', label: '⚡ Speed Run' },
  { value: 'streak', label: '🔥 Streak' },
  { value: 'team_push', label: '👥 Team Push' },
  { value: 'boss_fight', label: '💪 Boss Fight' },
  { value: 'hidden_gem', label: '💎 Hidden Gem' }
];

const targetTypes = [
  { value: 'activities', label: 'Activities' },
  { value: 'books', label: 'Booked Meetings' },
  { value: 'opps', label: 'Opportunities' },
  { value: 'deals', label: 'Closed Deals' },
  { value: 'points', label: 'Points' },
  { value: 'count', label: 'Count' }
];

const durationOptions = [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 4, label: '4 hours' },
  { value: 6, label: '6 hours' },
  { value: 8, label: '8 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '1 day (24 hours)' },
  { value: 48, label: '2 days (48 hours)' },
  { value: 72, label: '3 days (72 hours)' },
  { value: 168, label: '1 week (168 hours)' }
];

const iconOptions = [
  '🎯', '🚀', '⭐', '🏆', '💎', '🔥', '⚡', '🌟', '🎪', '🎨', '🎮', '🏅'
];

export const DirectChallengeForm: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  quarterId 
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: 'bonus',
    icon: '🎯',
    target_value: 1,
    target_type: 'activities',
    duration_hours: 24,
    reward_points: 10,
    reward_description: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (formData.target_value <= 0) {
      toast.error('Target value must be greater than 0');
      return;
    }
    
    if (formData.reward_points <= 0) {
      toast.error('Reward points must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const challengeData: CreateChallengeRequest = {
        quarter_id: quarterId,
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        icon: formData.icon,
        target_value: formData.target_value,
        target_type: formData.target_type,
        duration_hours: formData.duration_hours,
        reward_points: formData.reward_points,
        reward_description: formData.reward_description || null,
        auto_generated: false
      };
      
      await brain.create_challenge(challengeData);
      toast.success('Challenge created successfully!');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'speed_run',
        icon: '🎯',
        target_value: 1,
        target_type: 'activities',
        duration_hours: 24,
        reward_points: 10,
        reward_description: ''
      });
    } catch (error: any) {
      console.error('Failed to create challenge:', error);
      toast.error('Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            🚀 Create New Challenge
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title" className="text-purple-300 font-medium">
                Challenge Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="e.g., Weekend Warrior Bonus"
                className="bg-slate-700 border-purple-400/30 text-white mt-1"
                required
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="description" className="text-purple-300 font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Describe what players need to do to complete this challenge..."
                rows={3}
                className="bg-slate-700 border-purple-400/30 text-white mt-1"
              />
            </div>
          </div>

          {/* Challenge Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type" className="text-purple-300 font-medium">
                Challenge Type *
              </Label>
              <Select value={formData.type} onValueChange={(value) => updateFormData('type', value)}>
                <SelectTrigger className="bg-slate-700 border-purple-400/30 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-purple-400/30">
                  {challengeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="icon" className="text-purple-300 font-medium">
                Icon
              </Label>
              <Select value={formData.icon} onValueChange={(value) => updateFormData('icon', value)}>
                <SelectTrigger className="bg-slate-700 border-purple-400/30 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-purple-400/30">
                  {iconOptions.map((icon) => (
                    <SelectItem key={icon} value={icon} className="text-white text-lg">
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target_type" className="text-purple-300 font-medium">
                Target Type *
              </Label>
              <Select value={formData.target_type} onValueChange={(value) => updateFormData('target_type', value)}>
                <SelectTrigger className="bg-slate-700 border-purple-400/30 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-purple-400/30">
                  {targetTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="target_value" className="text-purple-300 font-medium">
                Target Value *
              </Label>
              <Input
                id="target_value"
                type="number"
                min="1"
                value={formData.target_value}
                onChange={(e) => updateFormData('target_value', parseInt(e.target.value) || 1)}
                className="bg-slate-700 border-purple-400/30 text-white mt-1"
                required
              />
            </div>
          </div>

          {/* Rewards & Timing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reward_points" className="text-purple-300 font-medium">
                Reward Points *
              </Label>
              <Input
                id="reward_points"
                type="number"
                min="1"
                value={formData.reward_points}
                onChange={(e) => updateFormData('reward_points', parseInt(e.target.value) || 1)}
                className="bg-slate-700 border-purple-400/30 text-white mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="duration_hours" className="text-purple-300 font-medium">
                Duration
              </Label>
              <Select 
                value={formData.duration_hours.toString()} 
                onValueChange={(value) => updateFormData('duration_hours', parseInt(value))}
              >
                <SelectTrigger className="bg-slate-700 border-purple-400/30 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-purple-400/30">
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()} className="text-white">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="reward_description" className="text-purple-300 font-medium">
              Reward Description
            </Label>
            <Input
              id="reward_description"
              value={formData.reward_description}
              onChange={(e) => updateFormData('reward_description', e.target.value)}
              placeholder="e.g., Bonus points for weekend activity"
              className="bg-slate-700 border-purple-400/30 text-white mt-1"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-purple-500/30">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-purple-400/30 text-purple-300 hover:bg-purple-900/30"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {loading ? 'Creating...' : 'Create Challenge'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
