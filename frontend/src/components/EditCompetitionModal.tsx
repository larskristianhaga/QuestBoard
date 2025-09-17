import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Edit3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import type { CompetitionResponse, CompetitionUpdate } from 'types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  competition: CompetitionResponse | null;
}

export const EditCompetitionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  competition,
}) => {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    is_active: false,
    is_hidden: false,
    tiebreaker: 'most_total' as const
  });

  // Update form data when competition changes
  useEffect(() => {
    if (competition) {
      setFormData({
        name: competition.name,
        description: competition.description || '',
        start_time: new Date(competition.start_time).toISOString().slice(0, 16),
        end_time: new Date(competition.end_time).toISOString().slice(0, 16),
        is_active: competition.is_active,
        is_hidden: competition.is_hidden,
        tiebreaker: competition.tiebreaker
      });
    }
  }, [competition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competition) return;

    if (!formData.name.trim()) {
      toast.error('Competition name is required');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      toast.error('Start and end times are required');
      return;
    }

    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      toast.error('End time must be after start time');
      return;
    }

    setLoading(true);
    try {
      const updateData: CompetitionUpdate = {
        competition_id: competition.id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_active: formData.is_active,
        is_hidden: formData.is_hidden,
        tiebreaker: formData.tiebreaker
      };

      await brain.update_competition(updateData);
      
      toast.success(`Competition "${formData.name}" updated successfully!`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to update competition:', error);
      toast.error('Failed to update competition');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!competition) return;
    
    setDeleting(true);
    try {
      // Note: We need to implement delete endpoint in backend
      // For now, we'll set as inactive and hidden
      await brain.update_competition({
        competition_id: competition.id,
        is_active: false,
        is_hidden: true
      });
      
      toast.success(`Competition "${competition.name}" has been deactivated and hidden`);
      onSuccess();
      handleClose();
      setShowDeleteConfirm(false);
    } catch (error: any) {
      console.error('Failed to delete competition:', error);
      toast.error('Failed to delete competition');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!loading && !deleting) {
      setFormData({
        name: '',
        description: '',
        start_time: '',
        end_time: '',
        is_active: false,
        is_hidden: false,
        tiebreaker: 'most_total' as const
      });
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  if (!competition) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-slate-900 border-purple-500/30 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Edit3 className="h-5 w-5" />
              <span>Edit Competition</span>
            </DialogTitle>
            <DialogDescription className="text-purple-200">
              Modify competition settings and lifecycle status
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              
              <div>
                <Label htmlFor="name" className="text-purple-200">Competition Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter competition name"
                  className="bg-slate-800 border-purple-500/30 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-purple-200">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Competition description (optional)"
                  className="bg-slate-800 border-purple-500/30 text-white min-h-[80px]"
                />
              </div>
            </div>

            {/* Time Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Time Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time" className="text-purple-200">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="bg-slate-800 border-purple-500/30 text-white"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="end_time" className="text-purple-200">End Time *</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="bg-slate-800 border-purple-500/30 text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Competition Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Competition Settings</h3>
              
              <div>
                <Label htmlFor="tiebreaker" className="text-purple-200">Tiebreaker Method</Label>
                <Select 
                  value={formData.tiebreaker} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tiebreaker: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-purple-500/30">
                    <SelectItem value="most_total" className="text-white">Most Total Points</SelectItem>
                    <SelectItem value="first_to" className="text-white">First to Reach Target</SelectItem>
                    <SelectItem value="fastest_pace" className="text-white">Fastest Pace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
                    className="border-purple-500/30"
                  />
                  <Label htmlFor="is_active" className="text-purple-200">
                    Competition is active
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_hidden"
                    checked={formData.is_hidden}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_hidden: !!checked }))}
                    className="border-purple-500/30"
                  />
                  <Label htmlFor="is_hidden" className="text-purple-200">
                    Hide from players
                  </Label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-red-500/30 text-red-300 hover:bg-red-600/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Competition
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading || deleting}
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || deleting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Competition'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-slate-900 border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              <span>Delete Competition</span>
            </DialogTitle>
            <DialogDescription className="text-red-200">
              Are you sure you want to delete "{competition?.name}"? This will deactivate and hide the competition.
              This action can be reversed by editing the competition later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Competition'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditCompetitionModal;
