import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Target, TrendingUp, Clock, Zap } from 'lucide-react';
import { PlayerInsightsSummaryResponse } from 'types';

export interface Props {
  summary: PlayerInsightsSummaryResponse;
}

interface CoachingHint {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'pace' | 'focus' | 'timing' | 'conversion';
  title: string;
  message: string;
  actionable: string;
  icon: string;
}

const PlayerCoachingRecommendations: React.FC<Props> = ({ summary }) => {
  // Smart coaching rule engine
  const generateCoachingHints = (): CoachingHint[] => {
    const hints: CoachingHint[] = [];
    const currentHour = new Date().getHours();
    const daysRemaining = summary.days_remaining;
    
    // Pace Analysis Rules
    if (summary.pace.status === 'behind') {
      if (summary.pace.delta_per_day < -1) {
        hints.push({
          id: 'pace-critical',
          priority: 'high',
          category: 'pace',
          title: 'Critical Pace Alert',
          message: `You're ${Math.abs(summary.pace.delta_per_day).toFixed(1)} points/day behind target.`,
          actionable: `Focus on high-value activities. Aim for ${Math.ceil(summary.pace.target_per_day + Math.abs(summary.pace.delta_per_day))} points today.`,
          icon: '🚨'
        });
      } else {
        hints.push({
          id: 'pace-behind',
          priority: 'medium',
          category: 'pace',
          title: 'Pace Recovery Needed',
          message: `You're ${Math.abs(summary.pace.delta_per_day).toFixed(1)} points/day behind.`,
          actionable: 'Book 1-2 extra meetings this week to get back on track.',
          icon: '⚠️'
        });
      }
    } else if (summary.pace.status === 'ahead') {
      hints.push({
        id: 'pace-ahead',
        priority: 'low',
        category: 'pace',
        title: 'Excellent Pace!',
        message: `You're ${summary.pace.delta_per_day.toFixed(1)} points/day ahead of target.`,
        actionable: 'Maintain momentum or help teammates who might be struggling.',
        icon: '🚀'
      });
    }

    // Goal-specific focus recommendations
    const lowestProgress = Math.min(
      summary.books.percentage,
      summary.opps.percentage,
      summary.deals.percentage
    );
    
    if (summary.books.percentage === lowestProgress && summary.books.percentage < 70) {
      hints.push({
        id: 'focus-books',
        priority: summary.books.percentage < 50 ? 'high' : 'medium',
        category: 'focus',
        title: 'Focus on Booking Meetings',
        message: `Books are your lowest progress at ${summary.books.percentage.toFixed(0)}%.`,
        actionable: `You need ${summary.books.remaining} more books. Aim for 3-4 calls today.`,
        icon: '📚'
      });
    } else if (summary.opps.percentage === lowestProgress && summary.opps.percentage < 70) {
      hints.push({
        id: 'focus-opps',
        priority: summary.opps.percentage < 50 ? 'high' : 'medium',
        category: 'focus',
        title: 'Focus on Opportunities',
        message: `Opportunities are lagging at ${summary.opps.percentage.toFixed(0)}%.`,
        actionable: `Convert your recent meetings to qualified opportunities. You need ${summary.opps.remaining} more.`,
        icon: '🎯'
      });
    } else if (summary.deals.percentage === lowestProgress && summary.deals.percentage < 70) {
      hints.push({
        id: 'focus-deals',
        priority: summary.deals.percentage < 50 ? 'high' : 'medium',
        category: 'focus',
        title: 'Focus on Closing Deals',
        message: `Deal closure is behind at ${summary.deals.percentage.toFixed(0)}%.`,
        actionable: `Follow up on your pipeline. You need ${summary.deals.remaining} more deals.`,
        icon: '💰'
      });
    }

    // Time-based recommendations
    if (currentHour >= 9 && currentHour <= 11) {
      hints.push({
        id: 'timing-morning',
        priority: 'medium',
        category: 'timing',
        title: 'Peak Morning Hours',
        message: 'Morning is typically the best time for cold outreach.',
        actionable: 'Make 3-5 calls in the next hour while prospects are fresh.',
        icon: '🌅'
      });
    } else if (currentHour >= 14 && currentHour <= 16) {
      hints.push({
        id: 'timing-afternoon',
        priority: 'low',
        category: 'timing',
        title: 'Afternoon Opportunity',
        message: 'Good time for follow-ups and warm leads.',
        actionable: 'Focus on nurturing existing conversations and booking meetings.',
        icon: '☀️'
      });
    }

    // Quarter urgency
    if (daysRemaining <= 10) {
      hints.push({
        id: 'quarter-urgency',
        priority: 'high',
        category: 'pace',
        title: 'Quarter Crunch Time',
        message: `Only ${daysRemaining} days left in the quarter!`,
        actionable: 'Focus on quick wins and existing pipeline. Prioritize hot prospects.',
        icon: '⏰'
      });
    } else if (daysRemaining <= 20) {
      hints.push({
        id: 'quarter-warning',
        priority: 'medium',
        category: 'pace',
        title: 'Quarter Home Stretch',
        message: `${daysRemaining} days remaining in quarter.`,
        actionable: 'Start prioritizing activities that will close within the quarter.',
        icon: '📅'
      });
    }

    // Milestone celebrations
    const highProgressItems = [
      { name: 'books', percentage: summary.books.percentage },
      { name: 'opps', percentage: summary.opps.percentage },
      { name: 'deals', percentage: summary.deals.percentage }
    ].filter(item => item.percentage >= 90);

    if (highProgressItems.length > 0) {
      hints.push({
        id: 'milestone-celebration',
        priority: 'low',
        category: 'pace',
        title: 'Almost There!',
        message: `${highProgressItems.map(item => item.name).join(', ')} almost complete!`,
        actionable: 'You\'re crushing it! Keep this momentum going.',
        icon: '🎉'
      });
    }

    return hints.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }).slice(0, 4); // Limit to top 4 recommendations
  };

  const hints = generateCoachingHints();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/50 bg-red-900/20';
      case 'medium': return 'border-yellow-500/50 bg-yellow-900/20';
      case 'low': return 'border-green-500/50 bg-green-900/20';
      default: return 'border-purple-500/50 bg-purple-900/20';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-purple-600 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pace': return <TrendingUp className="h-4 w-4" />;
      case 'focus': return <Target className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      case 'conversion': return <Zap className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (hints.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-purple-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            🏆 You're Crushing It!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-green-400 font-medium">All metrics are on track!</p>
            <p className="text-slate-400 text-sm mt-2">
              Keep up the excellent work. You're performing at an optimal level.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-purple-800/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          💡 Smart Coaching Recommendations
        </CardTitle>
        <p className="text-slate-400 text-sm mt-1">
          Data-driven insights to optimize your performance
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {hints.map((hint) => (
          <div
            key={hint.id}
            className={`
              p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02]
              ${getPriorityColor(hint.priority)}
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{hint.icon}</div>
                <div>
                  <h4 className="font-medium text-white flex items-center gap-2">
                    {getCategoryIcon(hint.category)}
                    {hint.title}
                  </h4>
                  <p className="text-slate-300 text-sm mt-1">{hint.message}</p>
                </div>
              </div>
              <Badge className={`${getPriorityBadge(hint.priority)} border-0 text-xs`}>
                {hint.priority.toUpperCase()}
              </Badge>
            </div>
            
            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
              <p className="text-purple-300 text-sm font-medium mb-1">💪 Action Plan:</p>
              <p className="text-white text-sm">{hint.actionable}</p>
            </div>
          </div>
        ))}
        
        <div className="mt-6 p-3 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-700/30">
          <p className="text-purple-300 text-xs text-center">
            💡 Recommendations update every 30 seconds based on your latest activity and goals
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export { PlayerCoachingRecommendations };
