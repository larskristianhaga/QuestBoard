import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ActivityLogger from 'components/ActivityLogger';
import ActivityHistory from 'components/ActivityHistory';
import MyBonusChallenges from 'components/MyBonusChallenges';
import PersonalGoalsStatus from 'components/PersonalGoalsStatus';

export interface Props {
  refreshTrigger: number;
  onActivityLogged: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ActivityMenu({ refreshTrigger, onActivityLogged, isOpen, onOpenChange }: Props) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const isMenuOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setIsMenuOpen = onOpenChange || setInternalIsOpen;

  const handleActivityLogged = () => {
    onActivityLogged();
    // Keep menu open so user can see history update
  };

  return (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <SheetContent className="w-[450px] sm:w-[600px] bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-sm border-purple-500/30 overflow-y-auto">
        <SheetHeader className="text-left mb-6">
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎯 Activity Center
          </SheetTitle>
          <SheetDescription className="text-slate-300">
            Log your sales activities and track your progress in the cosmic quest.
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-8">
          {/* Personal Goals Status */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              🎯 Personal Goals
            </h3>
            <PersonalGoalsStatus refreshTrigger={refreshTrigger} />
          </div>
          
          {/* Activity Logger */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              ⚡ Log New Activity
            </h3>
            <ActivityLogger onActivityLogged={handleActivityLogged} />
          </div>
          
          {/* My Bonus Challenges */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              🌟 My Bonus Challenges
            </h3>
            <MyBonusChallenges refreshTrigger={refreshTrigger} />
          </div>
          
          {/* Activity History */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              📜 Recent Activities
            </h3>
            <ActivityHistory refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
