// Cosmic VFX System for Competitions 2.0
// Advanced visual effects for enhanced player engagement

export interface CosmicEffect {
  type: 'streak' | 'combo' | 'multiplier' | 'achievement' | 'rank_up' | 'cosmic_event';
  intensity: 'low' | 'medium' | 'high' | 'legendary';
  duration: number;
  element?: HTMLElement;
}

export class CosmicVFXEngine {
  private static instance: CosmicVFXEngine;
  private activeEffects: Map<string, CosmicEffect> = new Map();
  private isInitialized = false;

  static getInstance(): CosmicVFXEngine {
    if (!CosmicVFXEngine.instance) {
      CosmicVFXEngine.instance = new CosmicVFXEngine();
    }
    return CosmicVFXEngine.instance;
  }

  initialize() {
    if (this.isInitialized || typeof document === 'undefined') return;
    
    this.injectCosmicStyles();
    this.createStarField();
    this.isInitialized = true;
  }

  private injectCosmicStyles() {
    const styleId = 'cosmic-vfx-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Cosmic VFX Animations */
      @keyframes cosmic-pulse {
        0%, 100% { 
          transform: scale(1) rotate(0deg);
          box-shadow: 0 0 20px rgba(147, 51, 234, 0.5);
        }
        25% { 
          transform: scale(1.05) rotate(1deg);
          box-shadow: 0 0 30px rgba(147, 51, 234, 0.8);
        }
        50% { 
          transform: scale(1.1) rotate(0deg);
          box-shadow: 0 0 40px rgba(147, 51, 234, 1);
        }
        75% { 
          transform: scale(1.05) rotate(-1deg);
          box-shadow: 0 0 30px rgba(147, 51, 234, 0.8);
        }
      }

      @keyframes cosmic-streak {
        0% {
          transform: translateX(-100%) scale(0);
          opacity: 0;
        }
        50% {
          transform: translateX(0%) scale(1.2);
          opacity: 1;
        }
        100% {
          transform: translateX(100%) scale(0.8);
          opacity: 0;
        }
      }

      @keyframes cosmic-combo {
        0% {
          transform: scale(0) rotate(-180deg);
          opacity: 0;
          filter: hue-rotate(0deg);
        }
        50% {
          transform: scale(1.3) rotate(0deg);
          opacity: 1;
          filter: hue-rotate(180deg);
        }
        100% {
          transform: scale(1) rotate(180deg);
          opacity: 1;
          filter: hue-rotate(360deg);
        }
      }

      @keyframes cosmic-achievement {
        0% {
          transform: scale(0) translateY(50px);
          opacity: 0;
          filter: brightness(0.5);
        }
        25% {
          transform: scale(1.2) translateY(-10px);
          opacity: 0.8;
          filter: brightness(1.5);
        }
        50% {
          transform: scale(1.1) translateY(-5px);
          opacity: 1;
          filter: brightness(2);
        }
        100% {
          transform: scale(1) translateY(0);
          opacity: 1;
          filter: brightness(1);
        }
      }

      @keyframes starfield-drift {
        0% { transform: translateY(0px) translateX(0px); }
        25% { transform: translateY(-2px) translateX(1px); }
        50% { transform: translateY(-1px) translateX(-1px); }
        75% { transform: translateY(1px) translateX(1px); }
        100% { transform: translateY(0px) translateX(0px); }
      }

      @keyframes rank-ascend {
        0% {
          transform: translateY(20px) scale(0.8);
          opacity: 0;
        }
        50% {
          transform: translateY(-10px) scale(1.2);
          opacity: 0.8;
        }
        100% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }

      /* Cosmic Effect Classes */
      .cosmic-pulse {
        animation: cosmic-pulse 2s ease-in-out infinite;
      }

      .cosmic-streak {
        animation: cosmic-streak 1.5s ease-out;
      }

      .cosmic-combo {
        animation: cosmic-combo 2s ease-in-out;
      }

      .cosmic-achievement {
        animation: cosmic-achievement 1.5s ease-out;
      }

      .rank-ascend {
        animation: rank-ascend 1s ease-out;
      }

      .cosmic-starfield {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
        opacity: 0.3;
      }

      .cosmic-star {
        position: absolute;
        background: white;
        border-radius: 50%;
        animation: starfield-drift 8s ease-in-out infinite;
      }

      .cosmic-particle {
        position: absolute;
        background: linear-gradient(45deg, #a855f7, #ec4899);
        border-radius: 50%;
        pointer-events: none;
        z-index: 100;
      }
    `;
    document.head.appendChild(style);
  }

  private createStarField() {
    const starField = document.createElement('div');
    starField.className = 'cosmic-starfield';
    starField.id = 'cosmic-starfield';

    // Create random stars
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'cosmic-star';
      star.style.width = `${Math.random() * 3 + 1}px`;
      star.style.height = star.style.width;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 8}s`;
      star.style.opacity = `${Math.random() * 0.8 + 0.2}`;
      starField.appendChild(star);
    }

    document.body.appendChild(starField);
  }

  triggerEffect(effect: CosmicEffect, elementId?: string): void {
    const element = elementId ? document.getElementById(elementId) : effect.element;
    if (!element) return;

    const effectId = `${effect.type}_${Date.now()}`;
    this.activeEffects.set(effectId, effect);

    switch (effect.type) {
      case 'streak':
        this.triggerStreakEffect(element, effect);
        break;
      case 'combo':
        this.triggerComboEffect(element, effect);
        break;
      case 'multiplier':
        this.triggerMultiplierEffect(element, effect);
        break;
      case 'achievement':
        this.triggerAchievementEffect(element, effect);
        break;
      case 'rank_up':
        this.triggerRankUpEffect(element, effect);
        break;
      case 'cosmic_event':
        this.triggerCosmicEvent(effect);
        break;
    }

    // Auto-cleanup
    setTimeout(() => {
      this.activeEffects.delete(effectId);
    }, effect.duration);
  }

  private triggerStreakEffect(element: HTMLElement, effect: CosmicEffect) {
    element.classList.add('cosmic-streak');
    this.createParticles(element, 5, effect.intensity);
    
    setTimeout(() => {
      element.classList.remove('cosmic-streak');
    }, effect.duration);
  }

  private triggerComboEffect(element: HTMLElement, effect: CosmicEffect) {
    element.classList.add('cosmic-combo');
    this.createParticles(element, 8, effect.intensity);
    
    setTimeout(() => {
      element.classList.remove('cosmic-combo');
    }, effect.duration);
  }

  private triggerMultiplierEffect(element: HTMLElement, effect: CosmicEffect) {
    element.classList.add('cosmic-pulse');
    
    setTimeout(() => {
      element.classList.remove('cosmic-pulse');
    }, effect.duration);
  }

  private triggerAchievementEffect(element: HTMLElement, effect: CosmicEffect) {
    element.classList.add('cosmic-achievement');
    this.createParticles(element, 15, effect.intensity);
    
    setTimeout(() => {
      element.classList.remove('cosmic-achievement');
    }, effect.duration);
  }

  private triggerRankUpEffect(element: HTMLElement, effect: CosmicEffect) {
    element.classList.add('rank-ascend');
    this.createParticles(element, 20, 'legendary');
    
    setTimeout(() => {
      element.classList.remove('rank-ascend');
    }, effect.duration);
  }

  private triggerCosmicEvent(effect: CosmicEffect) {
    // Screen-wide cosmic event (e.g., new competition starts)
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1000;
      animation: cosmic-pulse 3s ease-out;
    `;
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, effect.duration);
  }

  private createParticles(element: HTMLElement, count: number, intensity: string) {
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'cosmic-particle';
      
      const size = this.getParticleSize(intensity);
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${rect.left + Math.random() * rect.width}px`;
      particle.style.top = `${rect.top + Math.random() * rect.height}px`;
      
      const duration = 1000 + Math.random() * 1000;
      const distance = 50 + Math.random() * 100;
      const angle = Math.random() * 360;
      
      particle.style.animation = `
        cosmic-particle-${i} ${duration}ms ease-out forwards
      `;
      
      // Create unique keyframe animation for each particle
      const keyframes = `
        @keyframes cosmic-particle-${i} {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(
              ${Math.cos(angle) * distance}px,
              ${Math.sin(angle) * distance}px
            ) scale(0);
          }
        }
      `;
      
      const style = document.createElement('style');
      style.textContent = keyframes;
      document.head.appendChild(style);
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        document.body.removeChild(particle);
        document.head.removeChild(style);
      }, duration);
    }
  }

  private getParticleSize(intensity: string): number {
    switch (intensity) {
      case 'low': return 2 + Math.random() * 2;
      case 'medium': return 3 + Math.random() * 3;
      case 'high': return 4 + Math.random() * 4;
      case 'legendary': return 6 + Math.random() * 6;
      default: return 3;
    }
  }

  cleanup() {
    const starField = document.getElementById('cosmic-starfield');
    if (starField) {
      document.body.removeChild(starField);
    }
    
    const style = document.getElementById('cosmic-vfx-styles');
    if (style) {
      document.head.removeChild(style);
    }
    
    this.activeEffects.clear();
    this.isInitialized = false;
  }
}

// Helper functions for easy VFX triggering
export const triggerStreakVFX = (element: HTMLElement, streakCount: number) => {
  const intensity = streakCount > 10 ? 'legendary' : streakCount > 5 ? 'high' : 'medium';
  CosmicVFXEngine.getInstance().triggerEffect({
    type: 'streak',
    intensity,
    duration: 1500,
    element
  });
};

export const triggerComboVFX = (element: HTMLElement, comboType: string) => {
  CosmicVFXEngine.getInstance().triggerEffect({
    type: 'combo',
    intensity: 'high',
    duration: 2000,
    element
  });
};

export const triggerMultiplierVFX = (element: HTMLElement, multiplier: number) => {
  const intensity = multiplier >= 3 ? 'legendary' : multiplier >= 2 ? 'high' : 'medium';
  CosmicVFXEngine.getInstance().triggerEffect({
    type: 'multiplier',
    intensity,
    duration: 2000,
    element
  });
};

export const triggerAchievementVFX = (element: HTMLElement, rarity: string) => {
  const intensity = rarity === 'legendary' ? 'legendary' : rarity === 'epic' ? 'high' : 'medium';
  CosmicVFXEngine.getInstance().triggerEffect({
    type: 'achievement',
    intensity,
    duration: 1500,
    element
  });
};

export const triggerRankUpVFX = (element: HTMLElement) => {
  CosmicVFXEngine.getInstance().triggerEffect({
    type: 'rank_up',
    intensity: 'legendary',
    duration: 1000,
    element
  });
};

export const triggerCosmicEventVFX = () => {
  CosmicVFXEngine.getInstance().triggerEffect({
    type: 'cosmic_event',
    intensity: 'legendary',
    duration: 3000
  });
};

// Initialize VFX engine
export const initializeCosmicVFX = () => {
  CosmicVFXEngine.getInstance().initialize();
};

export const cleanupCosmicVFX = () => {
  CosmicVFXEngine.getInstance().cleanup();
};
