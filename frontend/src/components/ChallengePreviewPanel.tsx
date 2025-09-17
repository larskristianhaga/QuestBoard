import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Eye, Zap, Users, Target, Trophy, Calendar, Timer } from 'lucide-react';
import type { ChallengeTemplateResponse, ActiveChallengeResponse } from 'types';

export interface Props {
  template: ChallengeTemplateResponse;
  onGenerate?: () => void;
  generatingChallenges?: boolean;
}

const CHALLENGE_TYPE_INFO = {
  speed_run: { 
    color: 'bg-yellow-600', 
    description: 'Fast-paced challenge with tight deadlines',
    strategy: 'Focus on quick wins and immediate actions'
  },
  streak: { 
    color: 'bg-orange-600', 
    description: 'Consistency-based challenge over multiple days',
    strategy: 'Build momentum with daily activities'
  },
  team_push: { 
    color: 'bg-blue-600', 
    description: 'Collaborative team effort challenge',
    strategy: 'Coordinate team activities for maximum impact'
  },
  boss_fight: { 
    color: 'bg-purple-600', 
    description: 'Major milestone or quarterly goal challenge',
    strategy: 'Long-term planning and sustained effort required'
  },
  hidden_gem: { 
    color: 'bg-green-600', 
    description: 'Special achievement or unique activity challenge',
    strategy: 'Look for unexpected opportunities and creative solutions'
  }
};

export default function ChallengePreviewPanel({ template, onGenerate, generatingChallenges }: Props) {
  const [previewChallenge, setPreviewChallenge] = useState<any>(null);
  
  const typeInfo = CHALLENGE_TYPE_INFO[template.type as keyof typeof CHALLENGE_TYPE_INFO];
  
  // Generate a preview challenge based on template
  useEffect(() => {
    const generatePreview = () => {
      const targetValue = Math.floor(
        Math.random() * (template.target_value_max - template.target_value_min + 1) + template.target_value_min
      );
      const rewardPoints = Math.floor(
        Math.random() * (template.reward_points_max - template.reward_points_min + 1) + template.reward_points_min
      );
      
      // Simulate some progress
      const currentProgress = Math.floor(Math.random() * targetValue * 0.7);
      
      setPreviewChallenge({
        title: template.name,
        description: template.description,
        type: template.type,
        icon: template.icon,
        target_value: targetValue,
        reward_points: rewardPoints,
        current_progress: currentProgress,
        duration_hours: template.duration_hours,
        target_type: template.target_type,
        status: 'active',
        progress_percentage: (currentProgress / targetValue) * 100
      });
    };
    
    generatePreview();
  }, [template]);
  
  if (!previewChallenge) return null;
  
  const timeRemaining = `${template.duration_hours}h remaining`;
  const isNearCompletion = previewChallenge.progress_percentage > 80;
  const isBehindSchedule = previewChallenge.progress_percentage < 30;
  
  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Eye className="h-5 w-5" />
          <span>Challenge Preview</span>
        </CardTitle>
        <CardDescription className="text-purple-200">
          How challenges generated from this template will look
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Challenge Card Preview */}
        <div className="bg-slate-700/50 p-6 rounded-lg border border-purple-500/20 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{previewChallenge.icon}</span>
              <div>
                <h3 className="text-white font-bold text-lg">{previewChallenge.title}</h3>
                <p className="text-purple-200 text-sm">{previewChallenge.description}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={`${typeInfo.color} text-white`}>
                {template.type.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-purple-200">Progress</span>
              <span className="text-white font-semibold">
                {previewChallenge.current_progress}/{previewChallenge.target_value} {previewChallenge.target_type}
              </span>
            </div>
            <Progress 
              value={previewChallenge.progress_percentage} 
              className="h-2"
            />
            <div className="flex justify-between text-xs">
              <span className={`${
                isBehindSchedule ? 'text-red-400' : isNearCompletion ? 'text-green-400' : 'text-purple-300'
              }`}>
                {previewChallenge.progress_percentage.toFixed(0)}% Complete
              </span>
              <span className="text-purple-300 flex items-center space-x-1">
                <Timer className="h-3 w-3" />
                <span>{timeRemaining}</span>
              </span>
            </div>
          </div>
          
          {/* Reward */}
          <div className="flex items-center justify-between bg-slate-600/30 p-3 rounded">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="text-white font-semibold">Reward</span>
            </div>
            <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400 border-yellow-400/30">
              +{previewChallenge.reward_points} Points
            </Badge>
          </div>
        </div>
        
        <Separator className="border-purple-500/20" />
        
        {/* Template Analysis */}
        <div className="space-y-4">
          <h4 className="text-white font-semibold flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Template Analysis</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Strategy */}
            <div className="bg-slate-600/20 p-4 rounded border border-purple-500/10">
              <h5 className="text-purple-300 font-medium mb-2">Challenge Strategy</h5>
              <p className="text-purple-200 text-sm mb-2">{typeInfo.description}</p>
              <p className="text-white text-sm italic">{typeInfo.strategy}</p>
            </div>
            
            {/* Template Stats */}
            <div className="bg-slate-600/20 p-4 rounded border border-purple-500/10">
              <h5 className="text-purple-300 font-medium mb-2">Template Ranges</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-200">Target Range:</span>
                  <span className="text-white">{template.target_value_min}-{template.target_value_max}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">Reward Range:</span>
                  <span className="text-white">{template.reward_points_min}-{template.reward_points_max} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">Duration:</span>
                  <span className="text-white">{template.duration_hours} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">Target Type:</span>
                  <span className="text-white capitalize">{template.target_type}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Generation Conditions */}
          {(template.trigger_conditions || template.generation_rules) && (
            <div className="bg-slate-600/20 p-4 rounded border border-purple-500/10">
              <h5 className="text-purple-300 font-medium mb-2">Generation Settings</h5>
              <div className="space-y-2">
                {template.trigger_conditions && (
                  <div>
                    <span className="text-purple-200 text-sm">Trigger Conditions:</span>
                    <pre className="text-xs text-white bg-slate-700/50 p-2 rounded mt-1 overflow-x-auto">
                      {typeof template.trigger_conditions === 'string' 
                        ? template.trigger_conditions 
                        : JSON.stringify(template.trigger_conditions, null, 2)
                      }
                    </pre>
                  </div>
                )}
                {template.generation_rules && (
                  <div>
                    <span className="text-purple-200 text-sm">Generation Rules:</span>
                    <pre className="text-xs text-white bg-slate-700/50 p-2 rounded mt-1 overflow-x-auto">
                      {typeof template.generation_rules === 'string' 
                        ? template.generation_rules 
                        : JSON.stringify(template.generation_rules, null, 2)
                      }
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Button */}
        {onGenerate && (
          <div className="pt-4">
            <Button 
              onClick={onGenerate}
              disabled={generatingChallenges}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate Challenge from Template
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
