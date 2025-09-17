


import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import brain from 'brain';
import type { ChallengeTemplateResponse } from 'types';
import { callBrain, ApiError } from 'utils/api';
import JSONHelper from './JSONHelper';

export interface Props {
  template?: ChallengeTemplateResponse | null;
  onSuccess: () => void;
  onCancel?: () => void;
  // Optional compatibility props (ignored internally)
  isOpen?: boolean;
  onClose?: () => void;
}

const CHALLENGE_TYPES = {
  speed_run: { icon: '⚡', label: 'Speed Run', description: 'Fast-paced time-limited challenges' },
  streak: { icon: '🔥', label: 'Streak', description: 'Consistency-based challenges' },
  team_push: { icon: '🤝', label: 'Team Push', description: 'Collaborative team challenges' },
  boss_fight: { icon: '👾', label: 'Boss Fight', description: 'Large milestone challenges' },
  hidden_gem: { icon: '🔍', label: 'Hidden Gem', description: 'Special achievement challenges' }
};

const TARGET_TYPES = {
  meetings: { label: 'Meetings', description: 'Booked meetings/calls' },
  opportunities: { label: 'Opportunities', description: 'Created opportunities' },
  deals: { label: 'Deals', description: 'Closed deals' },
  activities: { label: 'Activities', description: 'General activities' }
};

// Safely stringify any object for a textarea field
const toTextareaValue = (val: unknown): string => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return '';
  }
};

export default function ChallengeTemplateForm({ template, onSuccess, onCancel, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    type: template?.type || 'speed_run',
    target_type: template?.target_type || 'meetings',
    target_value_min: template?.target_value_min || 1,
    target_value_max: template?.target_value_max || 5,
    duration_hours: template?.duration_hours || 24,
    reward_points_min: template?.reward_points_min || 10,
    reward_points_max: template?.reward_points_max || 50,
    is_active: template?.is_active ?? true,
    // Pre-fill JSON editors with pretty-printed JSON if objects were provided
    trigger_conditions: toTextareaValue(template?.trigger_conditions),
    generation_rules: toTextareaValue(template?.generation_rules)
  });

  const selectedType = CHALLENGE_TYPES[formData.type as keyof typeof CHALLENGE_TYPES];

  const setField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const clone = { ...prev };
      delete clone[key];
      return clone;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Required fields
    if (!formData.name.trim()) {
      setErrors((p) => ({ ...p, name: 'Name is required' }));
    }
    if (!formData.description.trim()) {
      setErrors((p) => ({ ...p, description: 'Description is required' }));
    }
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    // Numeric validations
    const localErrors: Record<string, string> = {};
    if (formData.target_value_min < 1) localErrors.target_value_min = 'Must be at least 1';
    if (formData.target_value_max < 1) localErrors.target_value_max = 'Must be at least 1';
    if (formData.target_value_min >= formData.target_value_max) {
      localErrors.target_value_min = 'Min must be less than max';
      localErrors.target_value_max = 'Max must be greater than min';
    }

    if (formData.reward_points_min < 1) localErrors.reward_points_min = 'Must be at least 1';
    if (formData.reward_points_max < 1) localErrors.reward_points_max = 'Must be at least 1';
    if (formData.reward_points_min >= formData.reward_points_max) {
      localErrors.reward_points_min = 'Min must be less than max';
      localErrors.reward_points_max = 'Max must be greater than min';
    }

    if (formData.duration_hours < 1) localErrors.duration_hours = 'Must be at least 1 hour';

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      toast.error('Please fix the highlighted fields');
      return;
    }

    // Safely parse JSON fields with clear feedback
    let parsedTrigger: Record<string, any> = {};
    let parsedRules: Record<string, any> = {};
    try {
      if (formData.trigger_conditions && formData.trigger_conditions.trim().length > 0) {
        const t = JSON.parse(formData.trigger_conditions);
        if (t && typeof t === 'object') parsedTrigger = t; else throw new Error('Trigger conditions must be a JSON object');
      }
    } catch (err) {
      console.error('Invalid trigger_conditions JSON:', err);
      setErrors((p) => ({ ...p, trigger_conditions: 'Invalid JSON. Provide a JSON object like {"key": "value"}' }));
      toast.error('Invalid JSON in Trigger Conditions');
      return;
    }

    try {
      if (formData.generation_rules && formData.generation_rules.trim().length > 0) {
        const g = JSON.parse(formData.generation_rules);
        if (g && typeof g === 'object') parsedRules = g; else throw new Error('Generation rules must be a JSON object');
      }
    } catch (err) {
      console.error('Invalid generation_rules JSON:', err);
      setErrors((p) => ({ ...p, generation_rules: 'Invalid JSON. Provide a JSON object like {"key": "value"}' }));
      toast.error('Invalid JSON in Generation Rules');
      return;
    }

    setLoading(true);
    try {
      const processedData = {
        ...formData,
        icon: selectedType.icon,
        trigger_conditions: parsedTrigger,
        generation_rules: parsedRules
      };

      if (template) {
        await callBrain(() => brain.update_challenge_template({ templateId: template.id }, processedData));
        toast.success('Challenge template updated successfully!');
      } else {
        await callBrain(() => brain.create_challenge_template(processedData));
        toast.success('Challenge template created successfully!');
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save template:', error);
      if (error instanceof ApiError) {
        // Try to map field-specific server errors inline
        if (error.status === 422 && error.details?.detail && Array.isArray(error.details.detail)) {
          const fieldMap: Record<string, string> = {};
          for (const d of error.details.detail) {
            const loc = Array.isArray(d.loc) ? d.loc : [];
            const field = (loc[loc.length - 1] as string) || 'form';
            fieldMap[field] = d.msg || 'Invalid value';
          }
          setErrors(fieldMap);
          const msg = Object.entries(fieldMap).map(([k, v]) => `${k}: ${v}`).join('; ');
          toast.error(`Validation failed: ${msg}`);
        } else {
          const msg = error.message || 'Failed to save template';
          toast.error(`Save failed: ${msg}`);
        }
      } else {
        toast.error('Failed to save challenge template');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  const inputClass = "bg-slate-700 border-purple-500/30 text-white";
  const errorText = (key: string) => errors[key] ? <p className="text-red-400 text-xs mt-1">{errors[key]}</p> : null;

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <span>{template ? 'Edit Challenge Template' : 'Create Challenge Template'}</span>
        </CardTitle>
        <CardDescription className="text-purple-200">
          {template ? 'Modify the challenge template settings' : 'Define a new template for automatic challenge generation'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-white">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., Daily Speed Blitz"
                  required
                />
                {errorText('name')}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="active" className="text-white">Active Template</Label>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description" className="text-white">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setField('description', e.target.value)}
                className={inputClass}
                placeholder="Describe what this challenge is about..."
                rows={3}
                required
              />
              {errorText('description')}
            </div>
          </div>

          {/* Challenge Type & Target */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Challenge Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="bg-slate-700 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-purple-500/30">
                    {Object.entries(CHALLENGE_TYPES).map(([key, type]) => (
                      <SelectItem key={key} value={key} className="text-white">
                        <div className="flex items-center space-x-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-purple-300 text-xs mt-1">{selectedType.description}</p>
              </div>
              
              <div>
                <Label className="text-white">Target Type *</Label>
                <Select value={formData.target_type} onValueChange={(value) => setFormData({ ...formData, target_type: value })}>
                  <SelectTrigger className="bg-slate-700 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-purple-500/30">
                    {Object.entries(TARGET_TYPES).map(([key, t]) => (
                      <SelectItem key={key} value={key} className="text-white">
                        <div className="flex items-center space-x-2">
                          <span>{t.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Numeric Inputs for targets, rewards, duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="target_value_min">Target Min</Label>
              <Input
                type="number"
                id="target_value_min"
                min={1}
                value={formData.target_value_min}
                onChange={(e) => setFormData({ ...formData, target_value_min: parseInt(e.target.value, 10) })}
              />
            </div>
            <div>
              <Label htmlFor="target_value_max">Target Max</Label>
              <Input
                type="number"
                id="target_value_max"
                min={1}
                value={formData.target_value_max}
                onChange={(e) => setFormData({ ...formData, target_value_max: parseInt(e.target.value, 10) })}
              />
            </div>
            <div>
              <Label htmlFor="duration_hours">Duration (hours)</Label>
              <Input
                type="number"
                id="duration_hours"
                min={1}
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value, 10) })}
              />
            </div>
          </div>

          {/* JSON Textareas for trigger_conditions and generation_rules */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="trigger_conditions">Trigger Conditions (JSON)</Label>
              <Textarea
                id="trigger_conditions"
                value={formData.trigger_conditions}
                onChange={(e) => setFormData({ ...formData, trigger_conditions: e.target.value })}
                className="bg-slate-700 border-purple-500/30 text-white"
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="generation_rules">Generation Rules (JSON)</Label>
              <Textarea
                id="generation_rules"
                value={formData.generation_rules}
                onChange={(e) => setFormData({ ...formData, generation_rules: e.target.value })}
                className="bg-slate-700 border-purple-500/30 text-white"
                rows={6}
              />
            </div>
            <JSONHelper title="Trigger Conditions" hint="Must be valid JSON object" />
            <JSONHelper title="Generation Rules" hint="Must be valid JSON object" />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 justify-end">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>Save</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
