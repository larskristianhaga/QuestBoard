


import React, { useState, useEffect } from 'react';
import { useUser } from '@stackframe/react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface VeyraWelcomePopupProps {
  onClose?: () => void;
}

export const VeyraWelcomePopup: React.FC<VeyraWelcomePopupProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const user = useUser();

  useEffect(() => {
    // Only show for guest users (not logged in) and only once per session
    if (!user && !hasShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
      }, 1500); // Show after 1.5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [user, hasShown]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // Don't render if user is logged in
  if (user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-slate-900/95 to-purple-900/90 border-cyan-400/50 backdrop-blur-sm">
        <div className="relative p-6">
          {/* Commander Veyra Avatar */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center overflow-hidden border-2 border-cyan-400/30">
              <img 
                src="https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/Commander Veyra.png"
                alt="Commander Veyra"
                className="w-full h-full object-cover rounded-full"
                style={{
                  filter: 'saturate(1.4) contrast(1.2) brightness(1.3) drop-shadow(0 0 10px rgba(34, 211, 238, 0.6))'
                }}
              />
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Commander Veyra
            </h2>
            
            <div className="space-y-3 text-gray-200">
              <p className="text-sm leading-relaxed">
                <span className="text-cyan-400">"Welcome, traveler!"</span>
              </p>
              
              <p className="text-sm leading-relaxed">
                You've arrived at <span className="text-purple-400 font-semibold">Skyline Stories</span> —  
                where we talk about AI and the Dragon that's shaping our future. 🐉🔥
              </p>
              
              <p className="text-sm leading-relaxed">
                I'm here to inspire, not frighten —  
                to help you tame the fire, ride the dragon, and turn chaos into creation.
              </p>
              
              <p className="text-sm leading-relaxed text-green-400">
                Enjoy the party! 🎉
              </p>
              
              <p className="text-xs text-cyan-400">
                💫 <em>"Your quest begins now – ride the dragon fire!"</em>
              </p>
            </div>
            
            {/* Action Button */}
            <Button 
              onClick={handleClose}
              className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-medium transition-all duration-200"
            >
              🌟 Begin Cosmic Exploration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VeyraWelcomePopup;
