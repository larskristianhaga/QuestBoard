import { useState } from 'react';
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import type { CreateQuarterRequest, QuarterResponse } from 'types';

export interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (quarter: QuarterResponse) => void;
}

export default function CreateQuarterModal({ isOpen, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<CreateQuarterRequest>({
    name: '',
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all fields');
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      const response = await brain.create_quarter(formData);
      const newQuarter: QuarterResponse = await response.json();
      
      toast.success(`Quarter "${newQuarter.name}" created successfully!`);
      onSuccess(newQuarter);
      handleClose();
    } catch (error) {
      console.error('Failed to create quarter:', error);
      toast.error('Failed to create quarter');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', start_date: '', end_date: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-purple-400" />
            <span>Create New Quarter</span>
          </DialogTitle>
          <DialogDescription className="text-purple-200">
            Set up a new game quarter with start and end dates.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quarter-name" className="text-white">
              Quarter Name
            </Label>
            <Input
              id="quarter-name"
              placeholder="e.g., Q1 2025, Spring Quarter"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-slate-700 border-purple-500/30 text-white placeholder:text-slate-400"
              disabled={loading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-white">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="bg-slate-700 border-purple-500/30 text-white"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-white">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="bg-slate-700 border-purple-500/30 text-white"
                disabled={loading}
              />
            </div>
          </div>
        </form>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
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
            Create Quarter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
