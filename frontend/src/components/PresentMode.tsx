
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Maximize2, Calendar, Trophy, TrendingUp } from 'lucide-react';
import brain from 'brain';
import { toast } from 'sonner';

interface TeamInsights {
  team_totals: {
    points: number;
    books: number;
    calls: number;
    lifts: number;
    active_players: number;
  };
  top_performers: Array<{
    player: string;
    points: number;
    books: number;
    calls: number;
    lifts: number;
  }>;
  momentum: string;
  highlights: string[];
  generated_at: string;
}

interface LeaderboardStanding {
  player_name: string;
  score: number;
  total_activities: number;
  books: number;
  calls: number;
  lifts: number;
  rank: number;
}

interface PresentModeProps {
  autoAdvance?: boolean;
  cycleInterval?: number; // seconds
}

const PresentMode: React.FC<PresentModeProps> = ({ 
  autoAdvance = true, 
  cycleInterval = 10 
}) => {
  const [currentPanel, setCurrentPanel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoAdvance);
  const [teamInsights, setTeamInsights] = useState<TeamInsights | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  const panels = [
    { id: 'overview', title: '🌌 Team Overview', icon: '📊' },
    { id: 'leaderboard', title: '🏆 Battle Standings', icon: '👑' },
    { id: 'highlights', title: '⭐ Weekly Highlights', icon: '🎯' },
    { id: 'momentum', title: '🚀 Team Momentum', icon: '📈' }
  ];

  // Auto-advance logic
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentPanel(prev => (prev + 1) % panels.length);
    }, cycleInterval * 1000);

    return () => clearInterval(interval);
  }, [isPlaying, cycleInterval, panels.length]);

  // Load data
  useEffect(() => {
    loadMeetingData();
    
    // Refresh data every 30 seconds
    const refreshInterval = setInterval(loadMeetingData, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  const loadMeetingData = async () => {
    try {
      setLoading(true);
      
      // Load team insights
      const insightsResponse = await brain.mcp_get_team_insights({
        horizon: 'week'
      });
      
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        if (insightsData.success) {
          setTeamInsights(insightsData.insights);
        }
      }
      
      // Load leaderboard
      const leaderboardResponse = await brain.mcp_get_leaderboard();
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        if (leaderboardData.success) {
          setLeaderboard(leaderboardData.standings);
        }
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading meeting data:', error);
      toast.error('Failed to load meeting data');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const goToPanel = (index: number) => {
    setCurrentPanel(index);
    setIsPlaying(false); // Pause auto-advance when manually navigating
  };

  const refresh = () => {
    loadMeetingData();
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const executeMeetingWorkflow = async (workflowType: string) => {
    try {
      setWorkflowLoading(true);
      
      const response = await brain.execute_meeting_workflow({
        workflow_type: workflowType,
        auto_actions: true
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`${workflowType.replace('_', ' ')} workflow executed successfully!`);
          // Refresh data after workflow
          await loadMeetingData();
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast.error('Failed to execute meeting workflow');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const renderOverviewPanel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {teamInsights?.team_totals.points || 0}
            </div>
            <div className="text-sm text-gray-300">Total Points</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {teamInsights?.team_totals.books || 0}
            </div>
            <div className="text-sm text-gray-300">Books</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border-orange-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">
              {teamInsights?.team_totals.calls || 0}
            </div>
            <div className="text-sm text-gray-300">Calls</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {teamInsights?.team_totals.lifts || 0}
            </div>
            <div className="text-sm text-gray-300">Lifts</div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl text-center">⚔️ Active Warriors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-400 mb-2">
              {teamInsights?.team_totals.active_players || 0}
            </div>
            <div className="text-gray-300">Warriors in the battle against Zephyr</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLeaderboardPanel = () => (
    <div className="space-y-4">
      {leaderboard.slice(0, 8).map((player, index) => (
        <Card 
          key={player.player_name} 
          className={`
            ${index === 0 ? 'bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-500/50' :
              index === 1 ? 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 border-gray-400/50' :
              index === 2 ? 'bg-gradient-to-r from-orange-800/50 to-orange-700/50 border-orange-600/50' :
              'bg-gray-900/30 border-gray-700/50'}
          `}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold
                  ${index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-400 text-black' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-gray-700 text-gray-300'}
                `}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-bold text-lg">{player.player_name}</div>
                  <div className="text-sm text-gray-400">
                    📚 {player.books} | 📞 {player.calls} | 💰 {player.lifts}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-400">{player.score}</div>
                <div className="text-sm text-gray-400">points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderHighlightsPanel = () => (
    <div className="space-y-6">
      {teamInsights?.highlights.map((highlight, index) => (
        <Card key={index} className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <div className="text-xl text-center font-medium text-purple-200">
              {highlight}
            </div>
          </CardContent>
        </Card>
      )) || (
        <Card className="bg-gray-900/30 border-gray-700">
          <CardContent className="p-6 text-center">
            <div className="text-gray-400">Loading highlights...</div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderMomentumPanel = () => {
    const momentum = teamInsights?.momentum || 'building';
    const momentumColor = 
      momentum === 'strong' ? 'from-green-900/50 to-emerald-900/50 border-green-500/30 text-green-400' :
      momentum === 'building' ? 'from-yellow-900/50 to-orange-900/50 border-yellow-500/30 text-yellow-400' :
      'from-blue-900/50 to-purple-900/50 border-blue-500/30 text-blue-400';
    
    const momentumIcon = 
      momentum === 'strong' ? '🚀' :
      momentum === 'building' ? '📈' : '🌱';
    
    return (
      <div className="space-y-6">
        <Card className={`bg-gradient-to-br ${momentumColor}`}>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">{momentumIcon}</div>
            <div className="text-3xl font-bold mb-2 capitalize">{momentum}</div>
            <div className="text-lg opacity-80">Team Momentum</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/30 border-gray-700">
          <CardHeader>
            <CardTitle className="text-center">🎯 This Week's Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-lg text-cyan-300">
              Unite the 12 warriors against Zephyr's forces
            </div>
            <div className="text-gray-400">
              Every book, call, and lift weakens Zephyr's grip on the galaxy
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCurrentPanel = () => {
    switch (panels[currentPanel].id) {
      case 'overview': return renderOverviewPanel();
      case 'leaderboard': return renderLeaderboardPanel();
      case 'highlights': return renderHighlightsPanel();
      case 'momentum': return renderMomentumPanel();
      default: return renderOverviewPanel();
    }
  };

  if (loading && !teamInsights) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="text-2xl text-cyan-400 mb-4">🌌 Loading Battle Data...</div>
            <div className="text-gray-400">Connecting to QuestBoard Command Center</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            🌌 QuestBoard Present Mode
            <Badge variant="outline" className="border-cyan-500 text-cyan-400">
              {panels[currentPanel].title}
            </Badge>
          </h1>
          
          <div className="flex items-center gap-2">
            {/* Meeting Workflow Buttons */}
            <Button 
              onClick={() => executeMeetingWorkflow('monday_kickoff')} 
              variant="outline" 
              size="sm"
              disabled={workflowLoading}
              className="border-green-500 text-green-400 hover:bg-green-500/20"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Monday Kickoff
            </Button>
            
            <Button 
              onClick={() => executeMeetingWorkflow('midweek_check')} 
              variant="outline" 
              size="sm"
              disabled={workflowLoading}
              className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/20"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Midweek Check
            </Button>
            
            <Button 
              onClick={() => executeMeetingWorkflow('friday_wrap')} 
              variant="outline" 
              size="sm"
              disabled={workflowLoading}
              className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Friday Wrap
            </Button>
            
            <div className="h-6 w-px bg-gray-600 mx-2" />
            
            <Button 
              onClick={togglePlayback} 
              variant="outline" 
              size="sm"
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button 
              onClick={refresh} 
              variant="outline" 
              size="sm"
              className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button 
              onClick={toggleFullscreen} 
              variant="outline" 
              size="sm"
              className="border-gray-500 text-gray-400 hover:bg-gray-500/20"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Panel Navigation */}
        <div className="flex gap-2 mb-4">
          {panels.map((panel, index) => (
            <Button
              key={panel.id}
              onClick={() => goToPanel(index)}
              variant={currentPanel === index ? "default" : "outline"}
              size="sm"
              className={`
                ${currentPanel === index 
                  ? 'bg-cyan-600 text-white' 
                  : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                }
              `}
            >
              {panel.icon} {panel.title}
            </Button>
          ))}
        </div>
        
        {/* Progress indicator */}
        {isPlaying && (
          <div className="mb-4">
            <Progress 
              value={(currentPanel + 1) / panels.length * 100} 
              className="h-1"
            />
            <div className="text-xs text-gray-400 mt-1">
              Auto-advancing in {cycleInterval}s | Last updated: {lastUpdated.toLocaleTimeString()}
              {workflowLoading && ' | Executing workflow...'}
            </div>
          </div>
        )}
      </div>
      
      {/* Current Panel Content */}
      <div className="transition-all duration-500 ease-in-out">
        {renderCurrentPanel()}
      </div>
    </div>
  );
};

export default PresentMode;
