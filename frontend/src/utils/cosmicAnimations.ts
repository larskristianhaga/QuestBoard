


// Cosmic Animation Utilities for QuestBoard
// Performance-optimized animations with motion preferences

// Inject CSS keyframes and utility classes into the document
const injectCosmicAnimations = () => {
  if (typeof document === 'undefined') return;
  
  const styleId = 'cosmic-animations';
  if (document.getElementById(styleId)) return; // Already injected
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Avatar State Animations */
    @keyframes cosmic-shake {
      0%, 100% { transform: translateX(0); }
      10% { transform: translateX(-2px) rotate(-1deg); }
      20% { transform: translateX(2px) rotate(1deg); }
      30% { transform: translateX(-1px) rotate(-0.5deg); }
      40% { transform: translateX(1px) rotate(0.5deg); }
      50% { transform: translateX(-0.5px); }
      60% { transform: translateX(0.5px); }
    }

    @keyframes gentle-bob {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-3px); }
    }

    @keyframes flame-pulse {
      0%, 100% { 
        transform: scale(1);
        filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.6));
      }
      50% { 
        transform: scale(1.05);
        filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.9));
      }
    }

    @keyframes super-glow {
      0%, 100% { 
        transform: scale(1.1);
        filter: drop-shadow(0 0 20px rgba(234, 179, 8, 0.9)) brightness(1.1);
      }
      50% { 
        transform: scale(1.15);
        filter: drop-shadow(0 0 30px rgba(234, 179, 8, 1)) brightness(1.3);
      }
    }

    @keyframes zephyr-float {
      0%, 100% { 
        transform: translateY(0px) translateX(0px);
      }
      25% { 
        transform: translateY(-5px) translateX(2px);
      }
      50% { 
        transform: translateY(0px) translateX(0px);
      }
      75% { 
        transform: translateY(5px) translateX(-2px);
      }
    }

    @keyframes float-fade {
      0% { 
        opacity: 0;
        transform: translateY(10px) scale(0.8);
      }
      20%, 80% { 
        opacity: 1;
        transform: translateY(0px) scale(1);
      }
      100% { 
        opacity: 0;
        transform: translateY(-10px) scale(0.8);
      }
    }

    @keyframes cosmic-particle {
      0% {
        opacity: 0;
        transform: translateY(0px) scale(0);
      }
      20% {
        opacity: 1;
        transform: translateY(-10px) scale(1);
      }
      80% {
        opacity: 1;
        transform: translateY(-30px) scale(0.8);
      }
      100% {
        opacity: 0;
        transform: translateY(-50px) scale(0);
      }
    }

    @keyframes thruster-glow {
      0%, 100% { 
        filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.6));
      }
      50% { 
        filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.9)) drop-shadow(0 0 30px rgba(59, 130, 246, 0.5));
      }
    }

    @keyframes trophy-shine {
      0% { transform: scale(1) rotate(0deg); }
      25% { transform: scale(1.1) rotate(-5deg); }
      50% { transform: scale(1.05) rotate(0deg); }
      75% { transform: scale(1.1) rotate(5deg); }
      100% { transform: scale(1) rotate(0deg); }
    }

    @keyframes rainbow-shimmer {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    @keyframes team-progress-pulse {
      0%, 100% { 
        box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
      }
      50% { 
        box-shadow: 0 0 25px rgba(139, 92, 246, 0.6);
      }
    }

    /* Utility Classes */
    .cosmic-shake {
      animation: cosmic-shake 0.5s ease-in-out infinite;
    }

    .gentle-bob {
      animation: gentle-bob 2s ease-in-out infinite;
    }

    .flame-pulse {
      animation: flame-pulse 1.5s ease-in-out infinite;
    }

    .super-glow {
      animation: super-glow 1s ease-in-out infinite;
    }

    .zephyr-float {
      animation: zephyr-float 3s ease-in-out infinite;
    }

    .thruster-glow {
      animation: thruster-glow 1.5s ease-in-out infinite;
    }

    .trophy-shine {
      animation: trophy-shine 2s ease-in-out infinite;
    }

    .team-progress-pulse {
      animation: team-progress-pulse 2s ease-in-out infinite;
    }

    /* Enhanced Visual States */
    .avatar-damaged {
      filter: grayscale(30%) brightness(0.8);
    }

    .avatar-dormant {
      filter: grayscale(20%) brightness(0.9) saturate(0.8);
      opacity: 0.8;
      transition: all 0.3s ease;
    }

    .avatar-dormant:hover {
      filter: grayscale(10%) brightness(1) saturate(1);
      opacity: 1;
    }

    .avatar-normal {
      filter: brightness(1);
    }

    .avatar-boosted {
      filter: brightness(1.1) saturate(1.2);
    }

    .avatar-supercharged {
      filter: brightness(1.3) saturate(1.4) hue-rotate(15deg);
    }

    .avatar-legendary {
      filter: brightness(1.5) saturate(1.6) hue-rotate(30deg);
    }

    /* Particle System */
    .cosmic-particles {
      position: relative;
      overflow: hidden;
    }

    .cosmic-particles::before,
    .cosmic-particles::after {
      content: '✨';
      position: absolute;
      font-size: 12px;
      animation: cosmic-particle 3s ease-in-out infinite;
      pointer-events: none;
    }

    .cosmic-particles::before {
      top: 20%;
      right: 10%;
      animation-delay: 0s;
    }

    .cosmic-particles::after {
      top: 60%;
      right: 80%;
      animation-delay: 1.5s;
    }

    /* Motion Preferences */
    @media (prefers-reduced-motion: reduce) {
      .cosmic-shake,
      .gentle-bob,
      .flame-pulse,
      .super-glow,
      .zephyr-float,
      .thruster-glow,
      .trophy-shine,
      .team-progress-pulse {
        animation: none;
      }
      
      .cosmic-particles::before,
      .cosmic-particles::after {
        animation: none;
        opacity: 0;
      }
    }

    /* Smooth Transitions */
    .smooth-scale {
      transition: transform 0.3s ease-out;
    }

    .smooth-glow {
      transition: filter 0.5s ease-out;
    }

    .smooth-color {
      transition: color 0.3s ease-out, background-color 0.3s ease-out;
    }
  `;
  
  document.head.appendChild(style);
};

// Avatar state animation mappings based on progress percentage
export const getAvatarAnimationClass = (progressPercentage: number): string => {
  if (progressPercentage >= 100) {
    return 'super-glow avatar-legendary cosmic-particles';
  } else if (progressPercentage >= 70) {
    return 'flame-pulse avatar-supercharged';
  } else if (progressPercentage >= 25) {
    return 'gentle-bob avatar-boosted';
  } else if (progressPercentage > 0) {
    return 'avatar-normal';
  } else {
    // Players with 0% get a calm, inviting state instead of shaking
    return 'avatar-dormant';
  }
};

// Trophy badge animation for top performers
export const getTrophyAnimationClass = (position: number): string => {
  if (position <= 3) {
    return 'trophy-shine';
  }
  return '';
};

// Progress bar enhancement based on percentage
export const getProgressBarClass = (percentage: number): string => {
  if (percentage >= 90) {
    return 'cosmic-particles';
  } else if (percentage >= 70) {
    return 'team-progress-pulse';
  }
  return 'smooth-glow';
};

// Team ship thruster animation based on team progress
export const getTeamShipAnimationClass = (teamProgress: number, isAhead: boolean): string => {
  const baseClass = isAhead ? 'thruster-glow' : '';
  if (teamProgress >= 90) {
    return `${baseClass} cosmic-particles`;
  } else if (teamProgress >= 70) {
    return `${baseClass} team-progress-pulse`;
  }
  return baseClass;
};

// Zephyr alien trash talk messages based on context
export const getZephyrMessage = (teamProgress: number, alienProgress: number, isTeamAhead: boolean): string => {
  const messages = {
    teamWinning: [
      "Impossible! Your species shows... promise.",
      "My calculations did not account for this.",
      "You adapt faster than anticipated.",
      "Perhaps I underestimated humans..."
    ],
    alienWinning: [
      "As expected from my superior intellect.",
      "Your efforts are... amusing.",
      "Victory is inevitable, primitive beings.",
      "I shall claim the moon for Zephyr!"
    ],
    close: [
      "Interesting... this battle intensifies.",
      "Your determination is... unexpected.",
      "The race grows more intriguing.",
      "Both sides show fierce competition."
    ]
  };
  
  if (Math.abs(teamProgress - alienProgress) < 5) {
    return messages.close[Math.floor(Math.random() * messages.close.length)];
  } else if (isTeamAhead) {
    return messages.teamWinning[Math.floor(Math.random() * messages.teamWinning.length)];
  } else {
    return messages.alienWinning[Math.floor(Math.random() * messages.alienWinning.length)];
  }
};

// Initialize animations when module is imported
if (typeof window !== 'undefined') {
  // Inject on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCosmicAnimations);
  } else {
    injectCosmicAnimations();
  }
}

export { injectCosmicAnimations };
