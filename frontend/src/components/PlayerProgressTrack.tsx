

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { PlayersResponse, DailyPlayersResponse } from 'types';
import brain from 'brain';
import { 
  getAvatarAnimationClass, 
  getTrophyAnimationClass, 
  getProgressBarClass,
  injectCosmicAnimations 
} from 'utils/cosmicAnimations';
import { useNavigate } from 'react-router-dom';

export interface Props {
  refreshTrigger?: number;
  hideToggle?: boolean;
  viewMode?: 'daily' | 'quarterly';
}

type ViewMode = 'daily' | 'quarterly';

// Avatar states with spaceship themes
const AVATAR_STATES = {
  damaged: {
    image: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/spaceship_damaged.png',
    effect: 'opacity-70 animate-pulse',
    description: 'Damaged',
    color: 'text-red-400',
    glow: 'drop-shadow-lg'
  },
  normal: {
    image: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/spaceship_normal.png',
    effect: '',
    description: 'Cruising',
    color: 'text-blue-400',
    glow: 'drop-shadow-md'
  },
  boosted: {
    image: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/spaceship_boosted.png',
    effect: 'animate-bounce',
    description: 'Boosted!',
    color: 'text-purple-400',
    glow: 'drop-shadow-[0_0_15px_rgba(147,51,234,0.8)]'
  },
  supercharged: {
    image: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/spaceship_supercharged.png',
    effect: 'animate-pulse',
    description: 'Supercharged!',
    color: 'text-yellow-400',
    glow: 'drop-shadow-[0_0_20px_rgba(234,179,8,0.9)]'
  },
  legendary: {
    image: 'https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/spaceship_legendary.png',
    effect: 'animate-bounce',
    description: 'Legendary!',
    color: 'text-orange-400',
    glow: 'drop-shadow-[0_0_25px_rgba(251,146,60,1)]'
  }
};

// Progressive progress bar styles based on percentage
const getProgressBarStyles = (percentage: number) => {
  if (percentage >= 90) {
    // 90-100%: Rainbow shimmer effect
    return {
      background: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)',
      backgroundSize: '400% 400%',
      animation: 'rainbow-shimmer 2s ease-in-out infinite',
      filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.8))'
    };
  } else if (percentage >= 70) {
    // 70-80%: Intense cosmic glow
    return {
      background: 'linear-gradient(90deg, #8B5CF6, #EC4899, #F59E0B)',
      filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.9)) brightness(1.3)',
      animation: 'cosmic-glow 1.5s ease-in-out infinite alternate'
    };
  } else if (percentage >= 50) {
    // 50-60%: Sparkle particles
    return {
      background: 'linear-gradient(90deg, #F59E0B, #EAB308, #FCD34D)',
      filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.8))',
      animation: 'sparkle 1s ease-in-out infinite'
    };
  } else if (percentage >= 30) {
    // 30-40%: Color shift to gold/orange
    return {
      background: 'linear-gradient(90deg, #F97316, #FB923C, #FDBA74)',
      filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))'
    };
  } else if (percentage >= 10) {
    // 10-20%: Glow effect starts
    return {
      background: 'linear-gradient(90deg, #3B82F6, #6366F1, #8B5CF6)',
      filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))'
    };
  } else {
    // 0-10%: Basic blue/purple
    return {
      background: 'linear-gradient(90deg, #1E40AF, #3730A3)',
      filter: 'none'
    };
  }
};

// Progressive card background styles based on percentage
const getCardBackgroundStyles = (percentage: number) => {
  if (percentage >= 90) {
    // 90-100%: Rainbow cosmic background
    return 'bg-gradient-to-br from-yellow-500 via-pink-500 to-purple-600 border-yellow-400/60 shadow-yellow-500/30';
  } else if (percentage >= 70) {
    // 70-89%: Intense cosmic glow
    return 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 border-purple-400/60 shadow-purple-500/30';
  } else if (percentage >= 50) {
    // 50-69%: Golden sparkle
    return 'bg-gradient-to-br from-orange-500 via-yellow-500 to-amber-500 border-orange-400/60 shadow-orange-500/30';
  } else if (percentage >= 30) {
    // 30-49%: Orange warmth
    return 'bg-gradient-to-br from-blue-500 via-orange-500 to-red-500 border-orange-400/50 shadow-orange-500/20';
  } else if (percentage >= 10) {
    // 10-29%: Blue glow starts
    return 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 border-blue-400/50 shadow-blue-500/20';
  } else {
    // 0-9%: Basic dark cosmic
    return 'bg-gradient-to-br from-slate-600 via-blue-700 to-purple-800 border-slate-500/30 shadow-slate-500/10';
  }
};

export default function PlayerProgressTrack({ refreshTrigger, hideToggle = false, viewMode: externalViewMode }: Props) {
  const [playersData, setPlayersData] = useState<PlayersResponse | null>(null);
  const [dailyPlayersData, setDailyPlayersData] = useState<DailyPlayersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('quarterly');
  const navigate = useNavigate();
  
  // Use external viewMode if provided, otherwise use internal state
  const viewMode = externalViewMode || internalViewMode;
  const setViewMode = externalViewMode ? () => {} : setInternalViewMode;

  // Ensure cosmic animations are injected
  useEffect(() => {
    injectCosmicAnimations();
  }, []);

  const fetchPlayerProgress = async () => {
    try {
      if (viewMode === 'daily') {
        const response = await brain.get_players_daily_progress();
        const data = await response.json();
        setDailyPlayersData(data);
      } else {
        const response = await brain.get_players_progress();
        const data = await response.json();
        setPlayersData(data);
      }
    } catch (error) {
      console.error('Failed to fetch player progress:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPlayerProgress();
  }, [refreshTrigger, viewMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🌌</div>
          <p className="text-slate-300 text-lg">Loading Player Progress...</p>
        </div>
      </div>
    );
  }

  if (!playersData && !dailyPlayersData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-slate-300 text-lg">Failed to load player data</p>
        </div>
      </div>
    );
  }

  // Get current data based on view mode
  const currentData = viewMode === 'daily' ? dailyPlayersData : playersData;
  const players = currentData?.players || [];

  const PlayerCard = ({ player, isLarge = false }: { player: any; isLarge?: boolean }) => {
    const avatar = AVATAR_STATES[player.avatar_state as keyof typeof AVATAR_STATES];
    
    // Handle different progress calculation based on view mode
    let progressWidth: number;
    let pointsText: string;
    
    if (viewMode === 'daily') {
      progressWidth = player.daily_goal_points > 0 
        ? Math.min((player.daily_points / player.daily_goal_points) * 100, 100)
        : 0;
      pointsText = `${player.daily_points}/${player.daily_goal_points.toFixed(1)}`;
    } else {
      progressWidth = player.goal_points > 0 
        ? Math.min((player.points / player.goal_points) * 100, 100)
        : 0;
      pointsText = `${player.points}/${player.goal_points}`;
    }
    
    const progressStyles = getProgressBarStyles(progressWidth);
    
    // Enhanced animation classes based on progress
    const avatarAnimationClass = getAvatarAnimationClass(progressWidth);
    const trophyAnimationClass = getTrophyAnimationClass(player.position);
    const progressBarClass = getProgressBarClass(progressWidth);
    const cardBackgroundClass = getCardBackgroundStyles(progressWidth);
    
    // Medal emblems for top 3 performance
    const getMedal = (position: number) => {
      if (position === 1) return { emoji: '🥇', color: 'from-yellow-400 to-yellow-600' };
      if (position === 2) return { emoji: '🥈', color: 'from-gray-300 to-gray-500' };
      if (position === 3) return { emoji: '🥉', color: 'from-orange-400 to-orange-600' };
      return null;
    };

    const medal = getMedal(player.position);

    return (
      <div className={`relative backdrop-blur-sm hover:border-purple-400/60 transition-all duration-500 smooth-scale group aspect-square p-2 rounded-xl overflow-hidden ${avatarAnimationClass} ${cardBackgroundClass}`}>
        {/* Position badge */}
        {medal && (
          <div className={`absolute top-1 right-1 w-6 h-6 rounded-full bg-gradient-to-r ${medal.color} flex items-center justify-center text-xs font-bold shadow-lg`}>
            {medal.emoji}
          </div>
        )}
        
        {/* Avatar */}
        <div className="flex justify-center mb-2">
          <img 
            src={avatar.image} 
            alt={player.name}
            className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-12 lg:h-12 xl:w-10 xl:h-10 2xl:w-12 2xl:h-12 object-contain ${avatar.glow} ${avatarAnimationClass} smooth-glow drop-shadow-xl cursor-pointer hover:scale-110 transition-transform`}
            onClick={() => navigate(`/player-insights?player=${encodeURIComponent(player.name)}`)}
          />
        </div>
        
        {/* Name */}
        <div className="text-center mb-2">
          <h3 className={`text-xs sm:text-sm md:text-base lg:text-base xl:text-sm 2xl:text-base font-bold text-white drop-shadow-lg truncate ${trophyAnimationClass}`}>
            {player.name.split(' ')[0]}
          </h3>
          <p className="text-xs text-slate-200/70">
            {pointsText}
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-auto">
          <div className={`relative h-1.5 sm:h-2 md:h-2.5 bg-black/30 rounded-full overflow-hidden border border-cyan-400/30 ${progressBarClass} mb-1`}>
            <div
              className="absolute top-0 left-0 h-full transition-all duration-1500 ease-out rounded-full smooth-glow"
              style={{
                width: `${progressWidth}%`,
                ...progressStyles
              }}
            />
          </div>
          <div className="text-center">
            <span className={`text-xs font-bold drop-shadow-lg ${
              progressWidth >= 90 ? 'animate-pulse text-yellow-300' : 
              progressWidth >= 70 ? 'text-cyan-300' :
              progressWidth >= 30 ? 'text-blue-300' : 'text-slate-300'
            }`}>
              {progressWidth.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full relative">
      {/* Toggle Button - Only show if not hidden */}
      {!hideToggle && (
        <div className="absolute top-0 left-0 z-10">
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-1 border border-purple-500/30">
            <Button
              variant={viewMode === 'quarterly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('quarterly')}
              className={`mr-1 text-xs ${
                viewMode === 'quarterly' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'text-purple-300 hover:text-white hover:bg-purple-600/50'
              }`}
            >
              Q
            </Button>
            <Button
              variant={viewMode === 'daily' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('daily')}
              className={`text-xs ${
                viewMode === 'daily' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'text-purple-300 hover:text-white hover:bg-purple-600/50'
              }`}
            >
              D
            </Button>
          </div>
        </div>
      )}
      
      {/* TV-optimized 4x3 Grid with more spacing for animations */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 h-full auto-rows-fr p-4 ${hideToggle ? 'pt-4' : 'pt-12'}`}>
        {players
          .sort((a, b) => a.name.localeCompare(b.name)) // Alphabetical sorting
          .map((player) => (
            <PlayerCard 
              key={player.id} 
              player={player}
            />
          ))}
      </div>
    </div>
  );
}

// Export the toggle component for use in parent
export function PlayerProgressToggle({ 
  viewMode, 
  onViewModeChange 
}: { 
  viewMode: 'daily' | 'quarterly';
  onViewModeChange: (mode: 'daily' | 'quarterly') => void;
}) {
  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg p-1 border border-purple-500/30">
      <Button
        variant={viewMode === 'quarterly' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('quarterly')}
        className={`mr-1 text-xs ${
          viewMode === 'quarterly' 
            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
            : 'text-purple-300 hover:text-white hover:bg-purple-600/50'
        }`}
      >
        Q
      </Button>
      <Button
        variant={viewMode === 'daily' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('daily')}
        className={`text-xs ${
          viewMode === 'daily' 
            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
            : 'text-purple-300 hover:text-white hover:bg-purple-600/50'
        }`}
      >
        D
      </Button>
    </div>
  );
}
