
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Trash2, Edit, Loader2, Users } from 'lucide-react';
import brain from 'brain';
import { ActivityHistoryResponse, UpdateActivityRequest, ActivityType } from 'types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PlayerSelectionModal from 'components/PlayerSelectionModal';

export interface Props {
  refreshTrigger?: number;
  onActivityChanged?: () => void;
}

const ACTIVITY_STYLES = {
  book: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  opp: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  deal: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
};

const ACTIVITY_ICONS = {
  book: '📅',
  opp: '🎯', 
  deal: '💎'
};

const ACTIVITY_COLORS = {
  book: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  opp: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  deal: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
};

const ACTIVITY_OPTIONS = [
  { value: 'book', label: '📅 Book Meeting', points: 1 },
  { value: 'opp', label: '🎯 Opportunity', points: 2 },
  { value: 'deal', label: '💎 Deal Closed', points: 5 }
];

export default function ActivityHistory({ refreshTrigger, onActivityChanged }: Props) {
  const [history, setHistory] = useState<ActivityHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPlayerSelection, setNeedsPlayerSelection] = useState(false);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newActivityType, setNewActivityType] = useState<string>('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      setNeedsPlayerSelection(false);
      const response = await brain.get_activity_history({});
      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes('must select a player')) {
          setNeedsPlayerSelection(true);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      // Ensure we always have a valid ActivityHistoryResponse structure
      const safeData = {
        activities: Array.isArray(data?.activities) ? data.activities : [],
        total_points: typeof data?.total_points === 'number' ? data.total_points : 0
      };
      setHistory(safeData);
    } catch (error: any) {
      console.error('Failed to fetch activity history:', error);
      setError(error?.message ?? 'Failed to fetch activity history');
      setHistory({ activities: [], total_points: 0 }); // Safe fallback structure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  const handlePlayerSelected = (playerName: string) => {
    setShowPlayerSelection(false);
    setNeedsPlayerSelection(false);
    // Refresh history after player selection
    fetchHistory();
    toast.success(`Welcome, ${playerName}! Your cosmic journey begins now.`);
  };

  const handleDeleteClick = (activity: any) => {
    setSelectedActivity(activity);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (activity: any) => {
    setSelectedActivity(activity);
    setNewActivityType(activity.type);
    setEditDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedActivity) return;
    
    setIsDeleting(true);
    try {
      const response = await brain.delete_activity({ activityId: selectedActivity.id });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`🗑️ Activity Deleted!`, {
          description: `${data.message} • -${data.points_removed} points`,
          className: 'bg-gradient-to-r from-red-900/90 to-orange-900/90 border-red-500/50 text-white',
        });
        
        // Refresh the activity history
        await fetchHistory();
        
        // Notify parent to refresh other components
        onActivityChanged?.();
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
      toast.error('Failed to delete activity. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedActivity(null);
    }
  };

  const confirmEdit = async () => {
    if (!selectedActivity || !newActivityType) return;
    
    setIsUpdating(true);
    try {
      const request: UpdateActivityRequest = {
        type: newActivityType as ActivityType
      };
      
      const response = await brain.update_activity(
        { activityId: selectedActivity.id }, 
        request
      );
      const data = await response.json();
      
      if (data.success) {
        const changeText = data.points_changed > 0 ? `+${data.points_changed}` : `${data.points_changed}`;
        toast.success(`✏️ Activity Updated!`, {
          description: `${data.message} • ${changeText} points`,
          className: 'bg-gradient-to-r from-green-900/90 to-blue-900/90 border-green-500/50 text-white',
        });
        
        // Refresh the activity history
        await fetchHistory();
        
        // Notify parent to refresh other components
        onActivityChanged?.();
      }
    } catch (error) {
      console.error('Failed to update activity:', error);
      toast.error('Failed to update activity. Please try again.');
    } finally {
      setIsUpdating(false);
      setEditDialogOpen(false);
      setSelectedActivity(null);
      setNewActivityType('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-indigo-900/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          <span className="ml-2 text-slate-300">Loading activity history...</span>
        </div>
      </div>
    );
  }

  if (needsPlayerSelection) {
    return (
      <>
        <div className="bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-indigo-900/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Users className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Choose Your Cosmic Avatar</h3>
            <p className="text-slate-300 text-sm">
              Select your player avatar to start tracking your galactic journey and view your activity history.
            </p>
            <Button 
              onClick={() => setShowPlayerSelection(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200"
            >
              🚀 Select Avatar
            </Button>
          </div>
        </div>
        
        <PlayerSelectionModal
          isOpen={showPlayerSelection}
          onClose={() => setShowPlayerSelection(false)}
          onPlayerSelected={handlePlayerSelected}
        />
      </>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-900/40 via-purple-900/40 to-indigo-900/40 backdrop-blur-sm border border-red-500/30 rounded-lg p-4">
        <div className="flex items-center text-red-400">
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  // Safely access history data with null checks
  const activities = history?.activities ?? [];
  const totalPoints = history?.total_points ?? 0;
  const totalCount = history?.total_count ?? activities.length;

  return (
    <Card className="bg-slate-900/50 border-purple-500/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          📊 Activity History
        </CardTitle>
        <div className="flex gap-4 text-sm text-slate-300">
          <span>Total: <span className="font-bold text-purple-300">{totalPoints}</span> points</span>
          <span>Activities: <span className="font-bold text-blue-300">{totalCount}</span></span>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">🚀</div>
            <p>No activities logged yet!</p>
            <p className="text-sm">Start your cosmic journey by logging your first activity.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-slate-800/30">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-purple-500/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {ACTIVITY_ICONS[activity.type]}
                  </span>
                  <div>
                    <div className="font-medium text-white capitalize">
                      {activity.type === 'opp' ? 'Opportunity' : activity.type}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatDate(activity.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${ACTIVITY_COLORS[activity.type]} border`}>
                    +{activity.points} pts
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                      onClick={() => handleEditClick(activity)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      onClick={() => handleDeleteClick(activity)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">🗑️ Delete Activity</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Are you sure you want to delete this {selectedActivity?.type === 'opp' ? 'opportunity' : selectedActivity?.type} activity?
              <br />
              <span className="text-red-400 font-medium">This will remove {selectedActivity?.points} points from your total.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Activity'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Activity Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-purple-400">✏️ Edit Activity</DialogTitle>
            <DialogDescription className="text-slate-300">
              Change the type of this activity. Points will be recalculated automatically.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Activity Type
              </label>
              <Select value={newActivityType} onValueChange={setNewActivityType}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {ACTIVITY_OPTIONS.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        <span className="text-xs text-slate-400 ml-2">{option.points} pts</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {newActivityType && newActivityType !== selectedActivity?.type && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="text-sm text-blue-300">
                  Points change: {ACTIVITY_OPTIONS.find(opt => opt.value === newActivityType)?.points || 0} - {selectedActivity?.points} = 
                  <span className="font-bold ml-1">
                    {((ACTIVITY_OPTIONS.find(opt => opt.value === newActivityType)?.points || 0) - (selectedActivity?.points || 0)) > 0 ? '+' : ''}
                    {(ACTIVITY_OPTIONS.find(opt => opt.value === newActivityType)?.points || 0) - (selectedActivity?.points || 0)} points
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmEdit}
              disabled={isUpdating || !newActivityType || newActivityType === selectedActivity?.type}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Activity'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
