

import React, { useState } from 'react';
import { Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompetition } from 'utils/competitionContext';

interface BattleIconProps {
  onClick: () => void;
}

export function BattleIcon({ onClick }: BattleIconProps) {
  const [isSwinging, setIsSwinging] = useState(false);
  const { activeCompetition } = useCompetition();

  const handleClick = () => {
    // Trigger sword swing animation
    setIsSwinging(true);
    setTimeout(() => setIsSwinging(false), 600); // Animation duration
    
    // Call the original onClick
    onClick();
  };

  // Don't show if no active competition
  if (!activeCompetition) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      className="relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
    >
      <div className={`sword-container ${isSwinging ? 'sword-swing' : ''}`}>
        <Swords 
          className="h-6 w-6 sword-icon text-white" 
        />
      </div>
      <span className="ml-2">Battle!</span>
      
      {/* Sparkle effects */}
      {isSwinging && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="sparkle sparkle-1">✨</div>
          <div className="sparkle sparkle-2">⚔️</div>
          <div className="sparkle sparkle-3">💫</div>
        </div>
      )}
    </Button>
  );
}
