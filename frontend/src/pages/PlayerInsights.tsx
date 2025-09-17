


import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import brain from 'brain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, TrendingUp, Target, Activity, Award, Zap, Rocket, Star, Trophy, Flame, Eye, BarChart3, Map } from 'lucide-react';
import { PlayerInsightsSummary } from 'components/PlayerInsightsSummary';
import { PlayerInsightsTimeseries } from 'components/PlayerInsightsTimeseries';
import { PlayerInsightsFunnel } from 'components/PlayerInsightsFunnel';
import { PlayerInsightsHeatmap } from 'components/PlayerInsightsHeatmap';
import { PlayerInsightsStreaks } from 'components/PlayerInsightsStreaks';
import { PlayersResponse, DailyPlayersResponse } from 'types';
import { injectCosmicAnimations } from 'utils/cosmicAnimations';

interface PlayerInsightsProps {}

// Simple CSS-only Starfield Component 
function CosmicStarfield({ 
  className = ""
}: { 
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* CSS-only animated stars */}
      <div className="absolute inset-0">
        {/* Layer 1: Background stars */}
        <div 
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse opacity-40"
          style={{ left: '10%', top: '15%', animationDelay: '0s', animationDuration: '3s' }}
        />
        <div 
          className="absolute w-1 h-1 bg-blue-200 rounded-full animate-pulse opacity-40"
          style={{ left: '20%', top: '25%', animationDelay: '1s', animationDuration: '2.5s' }}
        />
        <div 
          className="absolute w-1 h-1 bg-purple-200 rounded-full animate-pulse opacity-40"
          style={{ left: '30%', top: '35%', animationDelay: '2s', animationDuration: '4s' }}
        />
        <div 
          className="absolute w-1 h-1 bg-cyan-200 rounded-full animate-pulse opacity-40"
          style={{ left: '40%', top: '45%', animationDelay: '0.5s', animationDuration: '3.5s' }}
        />
        <div 
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse opacity-40"
          style={{ left: '50%', top: '55%', animationDelay: '1.5s', animationDuration: '2s' }}
        />
        <div 
          className="absolute w-1 h-1 bg-pink-200 rounded-full animate-pulse opacity-40"
          style={{ left: '60%', top: '65%', animationDelay: '2.5s', animationDuration: '4.5s' }}
        />
        <div 
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse opacity-40"
          style={{ left: '70%', top: '75%', animationDelay: '0.8s', animationDuration: '3.2s' }}
        />
        <div 
          className="absolute w-1 h-1 bg-blue-200 rounded-full animate-pulse opacity-40"
          style={{ left: '80%', top: '20%', animationDelay: '1.8s', animationDuration: '2.8s' }}
        />
        <div 
          className="absolute w-1 h-1 bg-purple-200 rounded-full animate-pulse opacity-40"
          style={{ left: '90%', top: '40%', animationDelay: '3s', animationDuration: '3.8s' }}
        />
        <div 
          className="absolute w-1 h-1 bg-cyan-200 rounded-full animate-pulse opacity-40"
          style={{ left: '15%', top: '80%', animationDelay: '0.3s', animationDuration: '4.2s' }}
        />
        
        {/* Layer 2: Mid-ground stars */}
        <div 
          className="absolute w-2 h-2 bg-white rounded-full animate-pulse opacity-60"
          style={{ left: '25%', top: '10%', animationDelay: '0.2s', animationDuration: '2.2s' }}
        />
        <div 
          className="absolute w-2 h-2 bg-cyan-300 rounded-full animate-pulse opacity-60"
          style={{ left: '45%', top: '20%', animationDelay: '1.2s', animationDuration: '3.2s' }}
        />
        <div 
          className="absolute w-2 h-2 bg-purple-300 rounded-full animate-pulse opacity-60"
          style={{ left: '65%', top: '30%', animationDelay: '2.2s', animationDuration: '2.8s' }}
        />
        <div 
          className="absolute w-2 h-2 bg-pink-300 rounded-full animate-pulse opacity-60"
          style={{ left: '85%', top: '60%', animationDelay: '0.7s', animationDuration: '3.7s' }}
        />
        <div 
          className="absolute w-2 h-2 bg-blue-300 rounded-full animate-pulse opacity-60"
          style={{ left: '35%', top: '70%', animationDelay: '1.7s', animationDuration: '2.3s' }}
        />
        
        {/* Layer 3: Foreground stars */}
        <div 
          className="absolute w-3 h-3 bg-white rounded-full animate-pulse opacity-80"
          style={{ left: '5%', top: '5%', animationDelay: '0.1s', animationDuration: '1.8s' }}
        />
        <div 
          className="absolute w-3 h-3 bg-cyan-400 rounded-full animate-pulse opacity-80"
          style={{ left: '75%', top: '15%', animationDelay: '1.1s', animationDuration: '2.6s' }}
        />
        <div 
          className="absolute w-3 h-3 bg-purple-400 rounded-full animate-pulse opacity-80"
          style={{ left: '95%', top: '85%', animationDelay: '2.1s', animationDuration: '1.9s' }}
        />
        <div 
          className="absolute w-3 h-3 bg-pink-400 rounded-full animate-pulse opacity-80"
          style={{ left: '55%', top: '90%', animationDelay: '0.6s', animationDuration: '3.1s' }}
        />
      </div>
    </div>
  );
}

// System Card Interface
interface SystemCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  component: React.ComponentType<any>;
  isActive: boolean;
}

// Ship avatar states matching the QuestBoard system
const AVATAR_STATES = {
  damaged: {
    image: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/spaceship_damaged.png',
    effect: 'opacity-70 animate-pulse',
    description: 'Hull Damaged',
    color: 'text-red-400',
    glow: 'drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]',
    statusText: '🚨 Systems Critical'
  },
  normal: {
    image: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/spaceship_normal.png',
    effect: '',
    description: 'Steady Cruise',
    color: 'text-blue-400',
    glow: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]',
    statusText: '✈️ Cruising Speed'
  },
  boosted: {
    image: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/spaceship_boosted.png',
    effect: 'animate-bounce',
    description: 'Engines Boosted',
    color: 'text-purple-400',
    glow: 'drop-shadow-[0_0_20px_rgba(147,51,234,0.9)]',
    statusText: '🚀 Thrusters Engaged'
  },
  supercharged: {
    image: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/spaceship_supercharged.png',
    effect: 'animate-pulse',
    description: 'Warp Drive Active',
    color: 'text-yellow-400',
    glow: 'drop-shadow-[0_0_25px_rgba(234,179,8,1)]',
    statusText: '⚡ Supercharged!'
  },
  legendary: {
    image: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/spaceship_legendary.png',
    effect: 'animate-bounce',
    description: 'Legendary Status',
    color: 'text-orange-400',
    glow: 'drop-shadow-[0_0_30px_rgba(251,146,60,1)]',
    statusText: '👑 Legendary Commander!'
  }
};

const PlayerInsights: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const playerName = searchParams.get('player');
  const [selectedSystem, setSelectedSystem] = useState<SystemCard | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  // Initialize cosmic animations
  useEffect(() => {
    injectCosmicAnimations();
  }, []);

  // Fetch players data for general info
  const { data: playersData } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await brain.get_players_progress();
      return response.json();
    },
  });

  // Fetch player insights summary for accurate statistics
  const { data: playerSummary } = useQuery({
    queryKey: ['playerInsightsSummary', playerName],
    queryFn: async () => {
      if (!playerName) return null;
      const response = await brain.get_player_insights_summary({ 
        player_name: decodeURIComponent(playerName), 
        range: 'Q' 
      });
      return response.json();
    },
    enabled: !!playerName,
  });

  // Fetch quarterly leaderboard to determine achievements
  const { data: quarterlyLeaderboard } = useQuery({
    queryKey: ['quarterlyLeaderboard'],
    queryFn: async () => {
      const response = await brain.get_leaderboard({ period: 'quarter' });
      return response.json();
    },
  });

  // Fetch competitions to check for wins
  const { data: competitions } = useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      const response = await brain.list_competitions();
      return response.json();
    },
  });

  if (!playerName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Player Not Found</h1>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to QuestBoard
          </Button>
        </div>
      </div>
    );
  }

  // Calculate achievements for current player
  const calculateAchievements = () => {
    const decodedPlayerName = decodeURIComponent(playerName || '');
    const achievements = [];

    // Quarterly leaderboard wins (🏆)
    if (quarterlyLeaderboard?.leaderboard) {
      const playerRank = quarterlyLeaderboard.leaderboard.find(p => p.name === decodedPlayerName)?.rank;
      if (playerRank === 1) {
        achievements.push({
          icon: '🏆',
          color: 'from-yellow-400 to-yellow-600',
          shadow: 'shadow-yellow-500/30',
          title: 'Quarterly Champion',
          description: `#1 in ${quarterlyLeaderboard.quarter}`
        });
      }
    }

    // Competition wins (⭐) - simplified: check if player appears in any competition
    // In a real implementation, you'd check each competition's leaderboard
    // For now, we'll show stars for top performers
    if (quarterlyLeaderboard?.leaderboard) {
      const playerRank = quarterlyLeaderboard.leaderboard.find(p => p.name === decodedPlayerName)?.rank;
      if (playerRank && playerRank <= 3) {
        // Multiple stars for multiple top finishes
        const starCount = playerRank === 1 ? 3 : playerRank === 2 ? 2 : 1;
        for (let i = 0; i < starCount; i++) {
          achievements.push({
            icon: '⭐',
            color: 'from-purple-500 to-purple-700',
            shadow: 'shadow-purple-500/30',
            title: 'Top Performer',
            description: `Rank #${playerRank} performer`
          });
        }
      }
    }

    return achievements;
  };

  const playerAchievements = calculateAchievements();

  // Calculate team stats comparison
  const calculateTeamComparison = () => {
    if (!playerSummary || !quarterlyLeaderboard?.leaderboard || quarterlyLeaderboard.leaderboard.length === 0) {
      return { percentage: 0, isAbove: true, formattedText: 'Loading...' };
    }

    const currentPlayerPoints = playerSummary.points.current;
    const teamTotalPoints = quarterlyLeaderboard.leaderboard.reduce((sum, player) => sum + player.points, 0);
    const teamAveragePoints = teamTotalPoints / quarterlyLeaderboard.leaderboard.length;
    
    if (teamAveragePoints === 0) {
      return { percentage: 0, isAbove: true, formattedText: 'No team data' };
    }

    const percentageDiff = ((currentPlayerPoints - teamAveragePoints) / teamAveragePoints) * 100;
    const isAbove = percentageDiff > 0;
    const formattedText = `${isAbove ? '+' : ''}${Math.round(percentageDiff)}%`;
    
    return {
      percentage: Math.abs(Math.round(percentageDiff)),
      isAbove,
      formattedText
    };
  };

  const teamComparison = calculateTeamComparison();

  const decodedPlayerName = decodeURIComponent(playerName);
  
  // Find current player's data to get ship status
  const currentPlayer = playersData?.players?.find(p => p.name === decodedPlayerName);
  const avatarState = currentPlayer?.avatar_state || 'normal';
  const shipData = AVATAR_STATES[avatarState as keyof typeof AVATAR_STATES] || AVATAR_STATES.normal;

  // System Cards Configuration
  const systemCards: SystemCard[] = [
    {
      id: 'mission-overview',
      title: 'Mission Control',
      description: 'Progress & Pace Overview',
      icon: <Target className="w-8 h-8" />,
      color: 'from-cyan-500/20 to-blue-500/20',
      glowColor: 'shadow-cyan-500/30',
      component: (props: any) => <PlayerInsightsSummary playerName={decodedPlayerName} {...props} />,
      isActive: true
    },
    {
      id: 'velocity-trends',
      title: 'Velocity Scanner',
      description: 'Performance Trends & Charts',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'from-purple-500/20 to-indigo-500/20',
      glowColor: 'shadow-purple-500/30',
      component: (props: any) => <PlayerInsightsTimeseries playerName={decodedPlayerName} {...props} />,
      isActive: true
    },
    {
      id: 'energy-funnel',
      title: 'Energy Conversion',
      description: 'Sales Funnel Analysis',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-fuchsia-500/20 to-pink-500/20',
      glowColor: 'shadow-fuchsia-500/30',
      component: (props: any) => <PlayerInsightsFunnel playerName={decodedPlayerName} {...props} />,
      isActive: true
    },
    {
      id: 'activity-matrix',
      title: 'Temporal Matrix',
      description: 'Activity Heatmap & Patterns',
      icon: <BarChart3 className="w-8 h-8" />,
      color: 'from-emerald-500/20 to-green-500/20',
      glowColor: 'shadow-emerald-500/30',
      component: (props: any) => <PlayerInsightsHeatmap playerName={decodedPlayerName} {...props} />,
      isActive: true
    },
    {
      id: 'achievement-constellation',
      title: 'Honor Constellation',
      description: 'Streaks & Achievements',
      icon: <Trophy className="w-8 h-8" />,
      color: 'from-amber-500/20 to-orange-500/20',
      glowColor: 'shadow-amber-500/30',
      component: (props: any) => <PlayerInsightsStreaks playerName={decodedPlayerName} {...props} />,
      isActive: true
    }
  ];

  const openSystemPopup = (system: SystemCard) => {
    setSelectedSystem(system);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedSystem(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#050510] relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Animated Starfield */}
        <div className="cosmic-stars absolute inset-0"></div>
        
        {/* Floating Cosmic Particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse opacity-60`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Moving Galaxy Dust */}
        <div className="absolute inset-0">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="absolute w-px h-8 bg-gradient-to-b from-transparent via-purple-300/20 to-transparent rotating-slow"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
        
        {/* Distant Planets */}
        <div className="absolute top-10 right-10 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600/30 to-pink-400/20 blur-sm animate-pulse"></div>
        <div className="absolute bottom-20 left-16 w-12 h-12 rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-400/30 blur-sm animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-8 h-8 rounded-full bg-gradient-to-br from-green-400/20 to-teal-300/30 blur-sm animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>
      
      {/* Cockpit Window Frame */}
      <div className="relative h-48 md:h-64">
        {/* Main viewport with enhanced border effects */}
        <div className="absolute inset-4 rounded-3xl border-4 border-cyan-400/40 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent overflow-hidden">
          {/* Inner starfield for depth */}
          <CosmicStarfield speed={2} density={0.001} className="opacity-60" />
          
          {/* Enhanced heads-up display overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Central crosshair with pulse effect */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-12 h-12 border-2 border-cyan-400/70 rounded-full animate-pulse">
                <div className="absolute top-1/2 left-1/2 w-3 h-3 transform -translate-x-1/2 -translate-y-1/2 bg-cyan-400/90 rounded-full animate-ping" />
                <div className="absolute top-1/2 left-1/2 w-1 h-1 transform -translate-x-1/2 -translate-y-1/2 bg-cyan-300 rounded-full" />
              </div>
            </div>

            {/* Corner UI elements */}
            <div className="absolute top-4 left-4 text-cyan-400/60 text-xs font-mono">
              PILOT-{decodedPlayerName.substring(0, 8).toUpperCase()}
            </div>
            <div className="absolute top-4 right-4 text-cyan-400/60 text-xs font-mono">
              STATUS: {shipData.description.toUpperCase()}
            </div>
            <div className="absolute bottom-4 left-4 text-cyan-400/60 text-xs font-mono">
              INSIGHTS-MODULE
            </div>
            <div className="absolute bottom-4 right-4 text-cyan-400/60 text-xs font-mono">
              {new Date().toLocaleTimeString()}
            </div>

            {/* Scanning lines effect */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" 
                   style={{ top: '30%', animationDelay: '0s' }} />
              <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" 
                   style={{ top: '70%', animationDelay: '2s' }} />
            </div>
          </div>
        </div>

        {/* Cockpit bezel and controls */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {/* Top bezel */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-8 w-32 bg-gradient-to-b from-slate-800 to-slate-900 rounded-b-lg border-x border-b border-slate-600" />
          
          {/* Side bezels */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-32 bg-gradient-to-r from-slate-800 to-slate-900 rounded-r-lg border-y border-r border-slate-600" />
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-32 bg-gradient-to-l from-slate-800 to-slate-900 rounded-l-lg border-y border-l border-slate-600" />
        </div>
      </div>

      {/* Navigation */}
      <div className="relative z-10 px-6 pt-4">
        <Button 
          onClick={() => navigate('/')} 
          variant="outline" 
          className="bg-slate-800/50 border-purple-500/50 text-purple-200 hover:bg-purple-900/50 backdrop-blur-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to QuestBoard
        </Button>
      </div>

      {/* Player Dashboard Card */}
      <div className="relative bg-slate-900/70 backdrop-blur-sm border border-purple-500/40 rounded-3xl p-8 mb-8 overflow-hidden">
        {/* Animated starfield background */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute top-4 left-8 w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
          <div className="absolute top-12 right-12 w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-16 left-16 w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-20 left-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-8 right-20 w-1 h-1 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-8 right-1/4 w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            {/* Left: Player Profile */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                {/* Cosmic avatar ring */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-1 shadow-2xl shadow-purple-500/50">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-800 overflow-hidden">
                    <img 
                      src={shipData.image} 
                      alt={`${avatarState} spaceship`}
                      className={`w-16 h-16 object-contain ${shipData.effect} ${shipData.glow}`}
                    />
                  </div>
                </div>
                {/* Status indicator */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-3 border-slate-900 flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse" />
                </div>
                {/* Orbital rings */}
                <div className="absolute inset-0 rounded-full border border-purple-400/20 animate-spin" style={{ animation: 'spin 20s linear infinite' }} />
                <div className="absolute inset-2 rounded-full border border-cyan-400/15 animate-spin" style={{ animation: 'spin 30s linear infinite reverse' }} />
              </div>
              
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                  {currentPlayer?.name || 'Space Commander'}
                </h1>
                <p className="text-cyan-300 font-medium text-lg mb-3">Cosmic Sales Commander</p>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <span className="text-lg">⭐</span>
                    <span className="text-sm font-medium">Cosmic Points</span>
                  </div>
                  <div className="flex items-center space-x-2 text-purple-400">
                    <span className="text-lg">🏆</span>
                    <span className="text-sm font-medium">Galaxy Rank #{currentPlayer?.position || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Current Vessel Status */}
            <div className="text-right">
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-cyan-500/30">
                <div className="flex items-center justify-end space-x-3 mb-3">
                  <img 
                    src={shipData.image} 
                    alt={`${avatarState} spaceship`}
                    className={`w-8 h-8 object-contain ${shipData.effect} ${shipData.glow}`}
                  />
                  <div>
                    <p className="text-cyan-300 font-semibold text-lg">Current Vessel</p>
                    <p className="text-slate-400 text-sm">Personal Transport</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="text-sm text-cyan-400 font-medium">{shipData.statusText}</span>
                  </div>
                  <p className={`font-bold text-lg ${shipData.color}`}>{shipData.description}</p>
                  <p className="text-slate-400 text-sm">Progress: {Math.round(currentPlayer?.progress_percentage || 0)}%</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Center: Achievements & Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Achievements */}
            <div className="text-center">
              <h3 className="text-purple-300 font-bold text-xl mb-6">Achievements</h3>
              <div className="flex justify-center space-x-3">
                {playerAchievements.length > 0 ? (
                  playerAchievements.map((achievement, index) => (
                    <div 
                      key={index}
                      className={`w-14 h-14 bg-gradient-to-br ${achievement.color} rounded-full flex items-center justify-center text-2xl shadow-lg ${achievement.shadow} hover:scale-110 transition-transform`}
                      title={`${achievement.title}: ${achievement.description}`}
                    >
                      {achievement.icon}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-sm italic">
                    Complete challenges to earn achievements
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress Donuts */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* Books Progress Donut */}
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <path className="stroke-slate-600" strokeWidth="2.5" fill="none" 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    {/* Progress circle - show actual books vs team average */}
                    <path 
                      className="stroke-blue-400 drop-shadow-lg" 
                      strokeWidth="2.5" 
                      fill="none" 
                      strokeDasharray={`${Math.min(100, playerSummary ? 
                        (playerSummary.books.current / Math.max(
                          (playersData?.players.reduce((sum, p) => sum + (p.activities_count || 0), 0) || 0) / Math.max(playersData?.players.length || 1, 1) * 0.4, // Estimate 40% are books
                          1
                        )) * 100 : 0)}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-blue-300">
                    {playerSummary?.books.current || 0}
                  </div>
                </div>
                <div className="text-sm text-blue-400 font-semibold">📚 Books</div>
                <div className="text-sm text-blue-300 font-medium">
                  {playersData ? `Avg: ${Math.round((playersData.players.reduce((sum, p) => sum + (p.activities_count || 0), 0)) / playersData.players.length * 0.4)}` : 'Loading...'}
                </div>
              </div>
              
              {/* Opps Progress Donut */}
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <path className="stroke-slate-600" strokeWidth="2.5" fill="none" 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    {/* Progress circle - show actual opps vs team average */}
                    <path 
                      className="stroke-purple-400 drop-shadow-lg" 
                      strokeWidth="2.5" 
                      fill="none" 
                      strokeDasharray={`${Math.min(100, playerSummary ? 
                        (playerSummary.opps.current / Math.max(
                          (playersData?.players.reduce((sum, p) => sum + (p.activities_count || 0), 0) || 0) / Math.max(playersData?.players.length || 1, 1) * 0.35, // Estimate 35% are opps
                          1
                        )) * 100 : 0)}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-purple-300">
                    {playerSummary?.opps.current || 0}
                  </div>
                </div>
                <div className="text-sm text-purple-400 font-semibold">🎯 Opps</div>
                <div className="text-sm text-purple-300 font-medium">
                  {playersData ? `Avg: ${Math.round((playersData.players.reduce((sum, p) => sum + (p.activities_count || 0), 0)) / playersData.players.length * 0.35)}` : 'Loading...'}
                </div>
              </div>
              
              {/* Deals Progress Donut */}
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <path className="stroke-slate-600" strokeWidth="2.5" fill="none" 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    {/* Progress circle - show actual deals vs team average */}
                    <path 
                      className="stroke-green-400 drop-shadow-lg" 
                      strokeWidth="2.5" 
                      fill="none" 
                      strokeDasharray={`${Math.min(100, playerSummary ? 
                        (playerSummary.deals.current / Math.max(
                          (playersData?.players.reduce((sum, p) => sum + (p.activities_count || 0), 0) || 0) / Math.max(playersData?.players.length || 1, 1) * 0.25, // Estimate 25% are deals
                          1
                        )) * 100 : 0)}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-green-300">
                    {playerSummary?.deals.current || 0}
                  </div>
                </div>
                <div className="text-sm text-green-400 font-semibold">💰 Deals</div>
                <div className="text-sm text-green-300 font-medium">
                  {playersData ? `Avg: ${Math.round((playersData.players.reduce((sum, p) => sum + (p.activities_count || 0), 0)) / playersData.players.length * 0.25)}` : 'Loading...'}
                </div>
              </div>
            </div>
            
            {/* Team Stats */}
            <div className="text-center">
              <h3 className="text-purple-300 font-bold text-xl mb-6">vs Team</h3>
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 rounded-2xl p-6 border border-cyan-500/30 shadow-lg">
                <div className={`font-bold text-2xl mb-2 ${
                  teamComparison.isAbove ? 'text-cyan-400' : 'text-orange-400'
                }`}>
                  📊 {teamComparison.formattedText}
                </div>
                <div className="text-slate-400 text-sm font-medium">
                  {teamComparison.isAbove ? 'above' : 'below'} team avg
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main System Grid */}
      <main className="relative z-10 px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
              🌌 Command & Control Systems
            </h2>
            <p className="text-purple-200 text-lg">
              Access your galactic performance analytics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemCards.map((system) => (
              <Card 
                key={system.id}
                className={`
                  relative group cursor-pointer transition-all duration-500 transform hover:scale-105
                  bg-gradient-to-br ${system.color} 
                  border border-white/20 hover:border-white/40
                  backdrop-blur-sm ${system.glowColor} hover:shadow-2xl
                  overflow-hidden
                `}
                onClick={() => openSystemPopup(system)}
              >
                {/* Card glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${system.color} border border-white/30 group-hover:border-white/50 transition-all duration-300`}>
                      <div className="text-white group-hover:scale-110 transition-transform duration-300">
                        {system.icon}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {system.title}
                      </h3>
                      <p className="text-white/70 text-sm">
                        {system.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${system.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                      <span className="text-xs text-white/60 font-mono">
                        {system.isActive ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                    
                    <Eye className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors duration-300" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Back to Mission Control */}
          <div className="text-center mt-12">
            <Button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-2xl shadow-purple-500/30 hover:scale-105 transition-all duration-300"
            >
              <Rocket className="mr-2 h-5 w-5" />
              Return to QuestBoard
            </Button>
          </div>
        </div>
      </main>

      {/* System Detail Popup */}
      <Dialog open={isPopupOpen} onOpenChange={closePopup}>
        <DialogContent className="
          max-w-6xl max-h-[90vh] 
          bg-gradient-to-br from-slate-900/95 to-purple-900/95 
          border border-cyan-400/30 
          backdrop-blur-md
          overflow-hidden
        ">
          <DialogHeader className="border-b border-white/10 pb-4 mb-4">
            <DialogTitle className="flex items-center space-x-3 text-2xl">
              {selectedSystem && (
                <>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${selectedSystem.color} border border-white/30`}>
                    <div className="text-white">
                      {selectedSystem.icon}
                    </div>
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      {selectedSystem.title}
                    </span>
                    <p className="text-sm text-white/60 font-normal">
                      {selectedSystem.description}
                    </p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[calc(90vh-120px)]">
            {selectedSystem?.component && (
              <selectedSystem.component />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerInsights;
