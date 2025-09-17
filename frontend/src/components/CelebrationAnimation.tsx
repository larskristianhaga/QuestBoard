import React, { useEffect } from 'react';

export interface CelebrationAnimationProps {
  show: boolean;
  type: string;
  onComplete: () => void;
}

const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({ show, type, onComplete }) => {
  useEffect(() => {
    if (show) {
      // Auto-complete after 2 seconds
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="text-6xl animate-bounce">
        {type || '🎉'}
      </div>
    </div>
  );
};

export default CelebrationAnimation;
