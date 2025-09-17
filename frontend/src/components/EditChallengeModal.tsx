
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import brain from 'brain';
import { ActiveChallengeResponse, ChallengeUpdate } from 'types';
import { Loader2, Edit } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  challenge: ActiveChallengeResponse | null;
}

interface FormData {
  title: string;
  description: string;
  target_value: number;
  target_type: string;
  reward_points: number;
  reward_description: string;
  is_visible: boolean;
}

const targetTypes = [
  { value: 'activities', label: 'Activities' },
  { value: 'books', label: 'Booked Meetings' },
  { value: 'opps', label: 'Opportunities' },
  { value: 'deals', label: 'Closed Deals' },
  { value: 'points', label: 'Points' },
  { value: 'count', label: 'Count' }
];

export const EditChallengeModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  challenge 
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    target_value: 1,
    target_type: 'activities',
    reward_points: 10,
    reward_description: '',
    is_visible: true
  });
  
  const [loading, setLoading] = useState(false);

  // Update form data when challenge changes
  useEffect(() => {
    if (challenge) {
      setFormData({
        title: challenge.title || '',
        description: challenge.description || '',
        target_value: challenge.target_value || 1,
        target_type: challenge.target_type || 'activities',
        reward_points: challenge.reward_points || 10,
        reward_description: challenge.reward_description || '',
        is_visible: true // Assume visible since we're showing it in admin
      });
    }
  }, [challenge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!challenge) {
      toast.error('No challenge selected for editing');
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error('Challenge title is required');
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
      const updateData: ChallengeUpdate = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        target_value: formData.target_value,
        target_type: formData.target_type,
        reward_points: formData.reward_points,
        reward_description: formData.reward_description.trim() || null,
        is_visible: formData.is_visible
      };
      
      await brain.update_challenge({ challengeId: challenge.id }, updateData);
      
      toast.success('Challenge updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update challenge:', error);
      toast.error('Failed to update challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-purple-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Edit className="h-5 w-5 text-purple-400" />
            <span>Edit Challenge</span>
          </DialogTitle>
          <DialogDescription className="text-purple-200">
            Modify challenge parameters and settings
          </DialogDescription>
        </DialogHeader>
        
        {challenge && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Challenge Info Banner */}
            <div className="bg-slate-800/50 p-3 rounded-lg border border-purple-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">{challenge.icon}</span>
                <div>
                  <p className="text-white font-medium text-sm">Editing: {challenge.title}</p>
                  <p className="text-purple-300 text-xs">ID: {challenge.id} • Status: {challenge.status}</p>
                </div>
              </div>
              <div className="text-xs text-purple-200">
                Progress: {challenge.current_progress}/{challenge.target_value} ({Math.round((challenge.current_progress / challenge.target_value) * 100)}%)
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-purple-200">Challenge Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white"
                placeholder="Enter challenge title"
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-purple-200">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white min-h-[80px]"
                placeholder="Enter challenge description"
                disabled={loading}
              />
            </div>

            {/* Target Value and Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="target_value" className="text-purple-200">Target Value *</Label>
                <Input
                  id="target_value"
                  type="number"
                  min="1"
                  value={formData.target_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_value: Number(e.target.value) }))}
                  className="bg-slate-800 border-purple-500/30 text-white"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target_type" className="text-purple-200">Target Type *</Label>
                <Select 
                  value={formData.target_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, target_type: value }))}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-purple-500/30">
                    {targetTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-white hover:bg-slate-700">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reward Points */}
            <div className="space-y-2">
              <Label htmlFor="reward_points" className="text-purple-200">Reward Points *</Label>
              <Input
                id="reward_points"
                type="number"
                min="1"
                value={formData.reward_points}
                onChange={(e) => setFormData(prev => ({ ...prev, reward_points: Number(e.target.value) }))}
                className="bg-slate-800 border-purple-500/30 text-white"
                required
                disabled={loading}
              />
            </div>

            {/* Reward Description */}
            <div className="space-y-2">
              <Label htmlFor="reward_description" className="text-purple-200">Reward Description</Label>
              <Input
                id="reward_description"
                value={formData.reward_description}
                onChange={(e) => setFormData(prev => ({ ...prev, reward_description: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white"
                placeholder="e.g., Bonus points for speed completion"
                disabled={loading}
              />
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center space-x-2 p-3 bg-slate-800/50 rounded-lg border border-purple-500/20">
              <input
                type="checkbox"
                id="is_visible"
                checked={formData.is_visible}
                onChange={(e) => setFormData(prev => ({ ...prev, is_visible: e.target.checked }))}
                className="rounded border-purple-500/30"
                disabled={loading}
              />
              <Label htmlFor="is_visible" className="text-purple-200 cursor-pointer">
                Challenge is visible to players
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Challenge'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditChallengeModal;
