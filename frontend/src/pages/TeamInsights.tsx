


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Award,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Presentation,
  X,
  PlayCircle,
  PauseCircle,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  Lightbulb,
  Rocket,
  Star,
  Share2,
  RefreshCw,
  Download,
  Camera,
  Filter,
  LineChart,
  Brain,
  AlertCircle,
  Loader2
} from 'lucide-react';
import brain from 'brain';
import {
  TeamInsightsSummaryResponse,
  TimeseriesResponse,
  MilestonesResponse,
  HeatmapResponse,
  StreaksResponse,
  HighlightsResponse
} from 'types';
import ForecastBreakdownModal from 'components/ForecastBreakdownModal';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart, Bar } from 'recharts';
import { AIInsightsResponse, AIInsight } from 'types';

// Export utility functions
const exportPanelAsPNG = (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Simple implementation - in a real app you'd use html2canvas or similar
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Create a simple notification instead of actual export for now
  const toast = document.createElement('div');
  toast.textContent = `Exporting ${filename}...`;
  toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50';
  document.body.appendChild(toast);
  
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 2000);
};

const generateSnapshotLink = () => {
  const currentUrl = window.location.href;
  const timestamp = new Date().toISOString();
  const snapshotUrl = `${currentUrl}?snapshot=${encodeURIComponent(timestamp)}`;
  
  navigator.clipboard.writeText(snapshotUrl).then(() => {
    const toast = document.createElement('div');
    toast.textContent = 'Snapshot link copied to clipboard!';
    toast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 2000);
  });
};

interface KPIChipProps {
  title: string;
  value: number;
  delta?: number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  clickable?: boolean;
}

const KPIChip = ({ title, value, delta, icon, color, onClick, clickable = false }: KPIChipProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card 
      className={`bg-gradient-to-br ${color} border-0 text-white transition-transform duration-200 ${
        clickable ? 'hover:scale-105 cursor-pointer hover:shadow-lg' : 'hover:scale-105'
      }`}
      onClick={clickable && onClick ? onClick : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-white/90 mb-1">{icon}</div>
            {delta !== undefined && (
              <div className="flex items-center gap-1">
                {delta > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                ) : delta < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                ) : null}
                <span className={`text-xs font-medium ${
                  delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {delta > 0 ? '+' : ''}{delta?.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
        {clickable && (
          <div className="mt-2 text-xs text-white/60">
            Click for details
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

interface ProgressPanelProps {
  data: TeamInsightsSummaryResponse | null;
}

const ProgressPanel = ({ data }: ProgressPanelProps) => {
  if (!data) return <div className="animate-pulse bg-gray-800 rounded-lg h-48" />;
  
  const paceRate = data.days_passed > 0 ? data.kpis.books / data.days_passed : 0;
  const forecastDiff = data.kpis.forecast - data.kpis.books;
  
  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-400" />
          Progress & Pace
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Days Progress</span>
              <span>{data.days_passed}/{data.days_in_period} days</span>
            </div>
            <Progress 
              value={(data.days_passed / data.days_in_period) * 100} 
              className="h-2"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-lg font-bold text-white">{paceRate.toFixed(1)}</p>
              <p className="text-xs text-gray-400">Books/Day</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-lg font-bold text-white">+{forecastDiff}</p>
              <p className="text-xs text-gray-400">Forecast</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface MilestonePanelProps {
  data: MilestonesResponse | null;
}

const MilestonePanel = ({ data }: MilestonePanelProps) => {
  if (!data) return <div className="animate-pulse bg-gray-800 rounded-lg h-48" />;
  
  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-400" />
          Milestones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.milestones.map((milestone) => (
            <div key={milestone.threshold} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={milestone.achieved ? "default" : "secondary"}
                  className={milestone.achieved ? "bg-green-600" : "bg-gray-600"}
                >
                  {milestone.threshold}%
                </Badge>
                <span className="text-sm text-gray-300">
                  {milestone.target_books} books
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {milestone.progress_pct.toFixed(0)}%
                </p>
                {milestone.what_it_takes && (
                  <p className="text-xs text-gray-400">
                    {milestone.what_it_takes.split(' ').slice(1, 3).join(' ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface HeatmapPanelProps {
  data: HeatmapResponse | null;
}

const HeatmapPanel = ({ data }: HeatmapPanelProps) => {
  if (!data) return <div className="animate-pulse bg-gray-800 rounded-lg h-48" />;
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const getIntensity = (value: number) => {
    if (data.max_value === 0) return 'bg-gray-800';
    const intensity = (value / data.max_value) * 100;
    if (intensity === 0) return 'bg-gray-800';
    if (intensity < 25) return 'bg-blue-900/50';
    if (intensity < 50) return 'bg-blue-700/70';
    if (intensity < 75) return 'bg-blue-500/80';
    return 'bg-blue-400';
  };
  
  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-400" />
          Activity Heatmap
        </CardTitle>
        {data.hint && (
          <p className="text-sm text-purple-300">💡 {data.hint}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-1 text-xs">
          <div></div>
          {days.map(day => (
            <div key={day} className="text-center text-gray-400 py-1">{day}</div>
          ))}
          
          {hours.slice(8, 18).map(hour => (
            <div key={hour} className="text-gray-400 text-right pr-1">
              {hour}h
            </div>
          ))}
          
          {hours.slice(8, 18).map(hour => (
            days.map(day => {
              const cell = data.data.find(d => 
                d.day.startsWith(day) && d.hour === hour
              );
              return (
                <div
                  key={`${day}-${hour}`}
                  className={`aspect-square rounded ${getIntensity(cell?.value || 0)} border border-gray-700`}
                  title={cell ? `${cell.label}: ${cell.value} activities` : `${day} ${hour}h: 0 activities`}
                />
              );
            })
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface StreaksPanelProps {
  data: StreaksResponse | null;
}

const StreaksPanel = ({ data }: StreaksPanelProps) => {
  if (!data) return <div className="animate-pulse bg-gray-800 rounded-lg h-48" />;
  
  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-400" />
          Team Streaks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-orange-600 to-yellow-600 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-white">{data.team_best_streak}</p>
            <p className="text-xs text-white/80">Best: {data.team_best_player}</p>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.streaks.slice(0, 5).map((streak) => (
              <div key={streak.player_name} className="flex justify-between text-sm">
                <span className="text-gray-300">{streak.player_name}</span>
                <div className="text-right">
                  <span className="text-white font-medium">{streak.current_streak}</span>
                  <span className="text-gray-500 ml-1">({streak.longest_streak})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface HighlightsPanelProps {
  data: HighlightsResponse | null;
}

const HighlightsPanel = ({ data }: HighlightsPanelProps) => {
  if (!data) return <div className="animate-pulse bg-gray-800 rounded-lg h-48" />;
  
  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-400" />
          Recent Highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-40 overflow-y-auto">
          {data.highlights.map((highlight, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                highlight.type === 'new_high' ? 'bg-green-400' :
                highlight.type === 'milestone' ? 'bg-yellow-400' :
                'bg-blue-400'
              }`} />
              <p className="text-sm text-gray-300">{highlight.message}</p>
            </div>
          ))}
          
          {data.highlights.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              No recent highlights. Keep pushing! 🚀
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface TimeseriesChartPanelProps {
  data: TimeseriesResponse | null;
  metric: string;
  onMetricChange: (metric: string) => void;
}

const TimeseriesChartPanel = ({ data, metric, onMetricChange }: TimeseriesChartPanelProps) => {
  if (!data) return <div className="animate-pulse bg-gray-800 rounded-lg h-80" />;
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('no-NO', { month: 'short', day: 'numeric' });
  };
  
  const getMetricColor = (metric: string) => {
    switch(metric) {
      case 'books': return '#3B82F6'; // blue
      case 'opps': return '#10B981'; // green  
      case 'deals': return '#F59E0B'; // yellow
      default: return '#8B5CF6'; // purple
    }
  };
  
  return (
    <Card className="bg-gray-900 border-gray-700 col-span-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-400" />
            Activity Trends
          </CardTitle>
          <Select value={metric} onValueChange={onMetricChange}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="books">Books</SelectItem>
              <SelectItem value="opps">Opportunities</SelectItem>
              <SelectItem value="deals">Deals</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#F3F4F6'
                }}
                labelFormatter={(value) => `Date: ${formatDate(value)}`}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke={getMetricColor(metric)}
                fill={`${getMetricColor(metric)}20`}
                strokeWidth={2}
              />
              <Bar
                dataKey="value"
                fill={getMetricColor(metric)}
                opacity={0.8}
                radius={[2, 2, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

interface AIInsightsPanelProps {
  summaryData: TeamInsightsSummaryResponse | null;
  milestonesData: MilestonesResponse | null;
  streaksData: StreaksResponse | null;
}

const AIInsightsPanel = ({ summaryData, milestonesData, streaksData }: AIInsightsPanelProps) => {
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiModel, setAiModel] = useState<string>('');
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const generateAIInsights = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      if (forceRefresh) {
        toast.loading('🤖 AI analyzing team performance...', { 
          id: 'ai-insights',
          description: 'This may take 10-15 seconds for fresh analysis'
        });
      }
      
      const response = await brain.generate_ai_insights({
        range: 30,
        force_refresh: forceRefresh
      });
      
      const data: AIInsightsResponse = await response.json();
      
      setAiInsights(data.insights || []);
      setAiModel(data.ai_model);
      setLastGenerated(new Date(data.generated_at));
      
      toast.success(
        data.ai_model === 'gpt-4o-mini' 
          ? '🤖 AI insights generated successfully!' 
          : '⚙️ Insights updated!',
        { 
          id: 'ai-insights',
          description: `${data.insights.length} insights discovered`
        }
      );
      
    } catch (err) {
      console.error('Failed to generate AI insights:', err);
      setError('Failed to generate insights. Using fallback analysis.');
      
      toast.error('AI insights unavailable', {
        id: 'ai-insights',
        description: 'Using rule-based analysis as fallback'
      });
      
      const fallbackInsights: AIInsight[] = [
        {
          type: 'recommendation',
          title: '📊 Navigation Systems Online',
          message: 'Your QuestBoard systems are tracking activity data. Keep logging to unlock more advanced AI insights.',
          priority: 'medium',
          action_items: ['Log more sales activities', 'Review team goals and progress'],
          confidence: 0.7
        }
      ];
      setAiInsights(fallbackInsights);
      setAiModel('fallback-systems');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (summaryData && milestonesData && streaksData) {
      generateAIInsights();
    }
  }, [summaryData, milestonesData, streaksData]);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-300';
      case 'medium': return 'text-yellow-300';
      case 'low': return 'text-green-300';
      default: return 'text-purple-300';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trend': return '📈';
      case 'recommendation': return '💡';
      case 'pattern': return '🔍';
      case 'coaching': return '🎯';
      default: return '🤖';
    }
  };
  
  return (
    <Card className="bg-gradient-to-br from-purple-900 to-blue-900 border-purple-500">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-300" />
          AI Insights
          {aiModel && (
            <span className="text-xs text-purple-300 ml-auto">
              {aiModel === 'gpt-4o-mini' ? '🤖 AI' : aiModel === 'fallback-rules' ? '⚙️ Rules' : '🤖'}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
            ⚠️ {error}
          </div>
        )}
        
        {loading ? (
          <div className="space-y-3">
            <div className="animate-pulse h-4 bg-purple-800 rounded" />
            <div className="animate-pulse h-4 bg-purple-800 rounded w-3/4" />
            <div className="animate-pulse h-4 bg-purple-800 rounded w-1/2" />
            <div className="text-xs text-purple-300 text-center mt-2">
              🤖 AI analyzing team performance...
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {aiInsights.map((insight, index) => (
              <div key={index} className="border-l-2 border-purple-400 pl-3 space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-sm">{getTypeIcon(insight.type)}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-purple-100 leading-relaxed">
                      {insight.message}
                    </p>
                    
                    {insight.action_items && insight.action_items.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {insight.action_items.map((action, actionIndex) => (
                          <div key={actionIndex} className="flex items-center gap-1 text-xs text-purple-200">
                            <span className="w-1 h-1 bg-purple-400 rounded-full" />
                            {action}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                        {insight.priority.toUpperCase()}
                      </span>
                      <span className="text-xs text-purple-400">
                        {Math.round(insight.confidence * 100)}% confident
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {aiInsights.length === 0 && (
              <div className="text-center text-purple-300 text-sm py-4">
                <Brain className="h-6 w-6 mx-auto mb-2 opacity-50" />
                No insights available. Try refreshing or logging more activities.
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4 space-y-2">
          <Button 
            onClick={() => generateAIInsights(true)}
            className="w-full bg-purple-700 hover:bg-purple-600 text-white"
            size="sm"
            disabled={loading}
          >
            <Brain className="h-3 w-3 mr-1" />
            {loading ? 'Generating...' : 'Refresh AI Insights'}
          </Button>
          
          {lastGenerated && (
            <div className="text-xs text-purple-400 text-center">
              Last updated: {lastGenerated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function TeamInsights() {
  const [summaryData, setSummaryData] = useState<TeamInsightsSummaryResponse | null>(null);
  const [timeseriesData, setTimeseriesData] = useState<TimeseriesResponse | null>(null);
  const [milestonesData, setMilestonesData] = useState<MilestonesResponse | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapResponse | null>(null);
  const [streaksData, setStreaksData] = useState<StreaksResponse | null>(null);
  const [highlightsData, setHighlightsData] = useState<HighlightsResponse | null>(null);
  const [selectedMetric, setSelectedMetric] = useState('books');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Presentation mode state
  const [presentMode, setPresentMode] = useState(false);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Modal states
  const [forecastModalOpen, setForecastModalOpen] = useState(false);
  
  // AI insights state
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  
  // Missing state variables
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Period filter state
  const [selectedPeriod, setSelectedPeriod] = useState<string>('quarter');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  const teamId = 1; // Hardcoded for now
  
  // Panels for present mode
  const panels = [
    'overview',
    'performance', 
    'trends',
    'insights',
    'forecast'
  ];
  
  const loadData = async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      console.log('Loading team insights data...');
      
      // Build query parameters based on selected period
      const queryParams: any = {};
      
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        queryParams.start_date = customStartDate;
        queryParams.end_date = customEndDate;
      } else if (selectedPeriod !== 'quarter') {
        // For preset periods like '30', '60', '90' days
        const days = parseInt(selectedPeriod);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        queryParams.start_date = startDate.toISOString().split('T')[0];
        queryParams.end_date = endDate.toISOString().split('T')[0];
      }
      
      // Load all data in parallel
      const [summaryRes, timeseriesRes, milestonesRes, heatmapRes, streaksRes, highlightsRes] = await Promise.all([
        brain.get_team_insights_summary(queryParams),
        brain.get_team_insights_timeseries({ metric: selectedMetric, ...queryParams }),
        brain.get_team_insights_milestones(queryParams),
        brain.get_team_insights_heatmap(queryParams),
        brain.get_team_insights_streaks(queryParams),
        brain.get_team_insights_highlights(queryParams)
      ]);
      
      setSummaryData(await summaryRes.json());
      setTimeseriesData(await timeseriesRes.json());
      setMilestonesData(await milestonesRes.json());
      setHeatmapData(await heatmapRes.json());
      setStreaksData(await streaksRes.json());
      setHighlightsData(await highlightsRes.json());
      
      setLastUpdated(new Date());
      console.log('Team insights data loaded successfully');
    } catch (error) {
      console.error('Critical error loading team insights:', error);
      toast.error('Failed to load team insights', {
        description: 'Please try refreshing the page or contact support if the issue persists.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const loadTimeseriesData = async (metric: string) => {
    try {
      const response = await brain.get_team_insights_timeseries({ 
        metric, 
        interval: 'daily', 
        range: 30 
      });
      setTimeseriesData(await response.json());
      toast.success(`📊 Updated ${metric} trend data`);
    } catch (error) {
      console.error('Failed to load timeseries data:', error);
      toast.error(`Failed to load ${metric} trend data`);
    }
  };
  
  const handleMetricChange = (metric: string) => {
    setSelectedMetric(metric);
    loadTimeseriesData(metric);
  };
  
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => {
      const newValue = !prev;
      if (newValue) {
        toast.success('🔄 Auto-refresh enabled (5 min intervals)');
      } else {
        toast.info('⏸️ Auto-refresh disabled');
      }
      return newValue;
    });
  };
  
  useEffect(() => {
    loadData();
  }, [selectedMetric, selectedPeriod, customStartDate, customEndDate]);

  // Auto-load when custom dates are both set
  useEffect(() => {
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      // Add a small delay to avoid too many API calls
      const timer = setTimeout(() => {
        loadData();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [customStartDate, customEndDate, selectedPeriod]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (presentMode) {
          setPresentMode(false);
        } else {
          setPresentMode(true);
        }
      }
      if (presentMode && e.key === 'Escape') {
        setPresentMode(false);
      }
      if (presentMode && e.key === 'ArrowLeft') {
        setCurrentPanel(prev => Math.max(0, prev - 1));
      }
      if (presentMode && e.key === 'ArrowRight') {
        setCurrentPanel(prev => Math.min(panels.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [presentMode, panels.length]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (presentMode) {
    const panels = [
      <div key="overview" className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <KPIChip
            title="Books"
            value={summaryData?.kpis.books || 0}
            delta={summaryData?.kpis.books_delta}
            icon={<Users className="h-6 w-6" />}
            color="from-blue-600 to-blue-800"
          />
          <KPIChip
            title="Opportunities"
            value={summaryData?.kpis.opps || 0}
            delta={summaryData?.kpis.opps_delta}
            icon={<Target className="h-6 w-6" />}
            color="from-green-600 to-green-800"
          />
          <KPIChip
            title="Deals"
            value={summaryData?.kpis.deals || 0}
            delta={summaryData?.kpis.deals_delta}
            icon={<Award className="h-6 w-6" />}
            color="from-yellow-600 to-yellow-800"
          />
          <KPIChip
            title="Forecast"
            value={summaryData?.kpis.forecast || 0}
            delta={summaryData?.kpis.forecast_delta}
            icon={<TrendingUp className="h-6 w-6" />}
            color="from-purple-600 to-purple-800"
            clickable={true}
            onClick={() => setForecastModalOpen(true)}
          />
        </div>
        <ProgressPanel data={summaryData} />
      </div>,
      <TimeseriesChartPanel key="trends" data={timeseriesData} metric={selectedMetric} onMetricChange={handleMetricChange} />,
      <div key="insights" className="grid grid-cols-2 gap-6">
        <AIInsightsPanel summaryData={summaryData} milestonesData={milestonesData} streaksData={streaksData} />
        <MilestonePanel data={milestonesData} />
      </div>,
      <HeatmapPanel key="heatmap" data={heatmapData} />,
      <div key="team" className="grid grid-cols-2 gap-6">
        <StreaksPanel data={streaksData} />
        <HighlightsPanel data={highlightsData} />
      </div>
    ];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 p-6 flex items-center justify-center">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white">Team Bridge</h1>
            <p className="text-purple-300">Panel {currentPanel + 1} of {panels.length} • Press F to exit present mode</p>
          </div>
          
          <div className="transform scale-105">
            {panels[currentPanel]}
          </div>
          
          {/* Progress dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {panels.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentPanel ? 'bg-purple-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 p-6">
      <div id="team-insights-dashboard" className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Team Insights</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              
              {/* Period Display */}
              <div className="flex items-center gap-2">
                <span>Period:</span>
                <span className="text-cyan-400 font-medium">
                  {(() => {
                    if (selectedPeriod === 'quarter' && summaryData) {
                      return `${summaryData.days_passed}/${summaryData.days_in_period} days`;
                    } else if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
                      const start = new Date(customStartDate);
                      const end = new Date(customEndDate);
                      const diffTime = Math.abs(end.getTime() - start.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return `${diffDays}/${diffDays} days`;
                    } else if (selectedPeriod !== 'quarter') {
                      return `${selectedPeriod}/${selectedPeriod} days`;
                    }
                    return 'Loading...';
                  })()} 
                </span>
              </div>
              
              {/* Range Display */}
              <div className="flex items-center gap-2">
                <span>Range:</span>
                <span className="text-purple-400 font-medium">
                  {(() => {
                    if (selectedPeriod === 'quarter' && summaryData) {
                      return `${summaryData.period_start} to ${summaryData.period_end}`;
                    } else if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
                      return `${customStartDate} to ${customEndDate}`;
                    } else if (selectedPeriod !== 'quarter') {
                      const days = parseInt(selectedPeriod);
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - days);
                      return `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;
                    }
                    return 'Loading...';
                  })()} 
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Period Filter Controls */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-300">Filter:</label>
              
              <Select value={selectedPeriod} onValueChange={(value) => {
                setSelectedPeriod(value);
                if (value !== 'custom') {
                  setShowCustomDatePicker(false);
                } else {
                  setShowCustomDatePicker(true);
                }
              }}>
                <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="quarter" className="text-white hover:bg-gray-700">Quarter</SelectItem>
                  <SelectItem value="30" className="text-white hover:bg-gray-700">30 days</SelectItem>
                  <SelectItem value="60" className="text-white hover:bg-gray-700">60 days</SelectItem>
                  <SelectItem value="90" className="text-white hover:bg-gray-700">90 days</SelectItem>
                  <SelectItem value="custom" className="text-white hover:bg-gray-700">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Custom Date Pickers */}
              {showCustomDatePicker && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              )}
            </div>
            
            <Button
              onClick={() => loadData()}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="border-gray-600 hover:border-cyan-400 text-white"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            
            <Button
              onClick={() => setPresentMode(true)}
              variant="outline"
              size="sm"
              className="border-purple-600 hover:border-purple-400 text-purple-300"
            >
              <Presentation className="h-4 w-4 mr-2" />
              Present
            </Button>
          </div>
        </div>
        
        {/* KPI Chips */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPIChip
            title="Books"
            value={summaryData?.kpis.books || 0}
            delta={summaryData?.kpis.books_delta}
            icon={<Users className="h-6 w-6" />}
            color="from-blue-600 to-blue-800"
          />
          <KPIChip
            title="Opportunities"
            value={summaryData?.kpis.opps || 0}
            delta={summaryData?.kpis.opps_delta}
            icon={<Target className="h-6 w-6" />}
            color="from-green-600 to-green-800"
          />
          <KPIChip
            title="Deals"
            value={summaryData?.kpis.deals || 0}
            delta={summaryData?.kpis.deals_delta}
            icon={<Award className="h-6 w-6" />}
            color="from-yellow-600 to-yellow-800"
          />
          <KPIChip
            title="Forecast"
            value={summaryData?.kpis.forecast || 0}
            delta={summaryData?.kpis.forecast_delta}
            icon={<TrendingUp className="h-6 w-6" />}
            color="from-purple-600 to-purple-800"
            clickable={true}
            onClick={() => setForecastModalOpen(true)}
          />
        </div>
        
        {/* Advanced Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TimeseriesChartPanel 
            data={timeseriesData} 
            metric={selectedMetric} 
            onMetricChange={handleMetricChange} 
          />
          <AIInsightsPanel 
            summaryData={summaryData} 
            milestonesData={milestonesData} 
            streaksData={streaksData} 
          />
        </div>
        
        {/* Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProgressPanel data={summaryData} />
          <MilestonePanel data={milestonesData} />
          <HeatmapPanel data={heatmapData} />
          <StreaksPanel data={streaksData} />
          <HighlightsPanel data={highlightsData} />
          
          {/* Performance Metrics Card */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300 text-sm">Completion Rate</span>
                  <span className="text-white font-medium">
                    {(() => {
                      if (!summaryData || summaryData.kpis.forecast === 0) return '0%';
                      const totalActivities = summaryData.kpis.books + summaryData.kpis.opps + summaryData.kpis.deals;
                      const completionRate = Math.round((totalActivities / summaryData.kpis.forecast) * 100);
                      return `${completionRate}%`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300 text-sm">Daily Average</span>
                  <span className="text-white font-medium">
                    {(() => {
                      if (!summaryData || summaryData.days_passed === 0) return '0.0';
                      const totalActivities = summaryData.kpis.books + summaryData.kpis.opps + summaryData.kpis.deals;
                      return (totalActivities / summaryData.days_passed).toFixed(1);
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300 text-sm">Team Size</span>
                  <span className="text-white font-medium">
                    {streaksData ? streaksData.streaks.length : 12}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300 text-sm">Period Progress</span>
                  <span className="text-white font-medium">
                    {summaryData 
                      ? Math.round((summaryData.days_passed / summaryData.days_in_period) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Footer Stats */}
        <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-400">
                Last updated: {new Date().toLocaleString('no-NO')}
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                {refreshing && (
                  <div className="flex items-center gap-1">
                    <div className="animate-spin h-3 w-3 border border-purple-500 border-t-transparent rounded-full" />
                    <span>Refreshing...</span>
                  </div>
                )}
                <span>Period: {summaryData?.days_passed || 0}/{summaryData?.days_in_period || 0} days</span>
                <span>Range: {summaryData?.comparison_period || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Forecast Breakdown Modal */}
      <ForecastBreakdownModal 
        isOpen={forecastModalOpen}
        onClose={() => setForecastModalOpen(false)}
        teamId={teamId}
      />
    </div>
  );
}
