
import React, { useState, useEffect } from 'react';
import { UserButton, useUser } from "@stackframe/react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Settings, Trophy, Rocket, BarChart3, Zap } from 'lucide-react';
import ChallengesWidget from 'components/ChallengesWidget';
import Leaderboard from 'components/Leaderboard';
import PlayerProgressTrack, { PlayerProgressToggle } from 'components/PlayerProgressTrack';
import MoonRace from 'components/MoonRace';
import PlanetaryObjectives from 'components/PlanetaryObjectives';
import BookingCompetitionWidget from 'components/BookingCompetitionWidget';
import { Button } from '@/components/ui/button';
import brain from 'brain';
import ActivityLogger from 'components/ActivityLogger';
import ActivityHistory from 'components/ActivityHistory';
import ActivityMenu from 'components/ActivityMenu';
import { injectCosmicAnimations } from 'utils/cosmicAnimations';
import { BattleIcon } from 'components/BattleIcon';
import BattlePopup from 'components/BattlePopup';
import { useNavigate } from 'react-router-dom';
import { auth } from 'app/auth';
import { CompetitionProvider } from 'utils/competitionContext';
import VeyraWelcomePopup from 'components/VeyraWelcomePopup';

export default function App() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false); // Changed from true to false
  const [showTeamProgress, setShowTeamProgress] = useState(true);
  const [mobilePlayerExpanded, setMobilePlayerExpanded] = useState(true);
  const [mobileTeamExpanded, setMobileTeamExpanded] = useState(false);
  const [mobileChallengesExpanded, setMobileChallengesExpanded] = useState(false);
  const [mobileCompetitionExpanded, setMobileCompetitionExpanded] = useState(true);
  const [playerViewMode, setPlayerViewMode] = useState<'daily' | 'quarterly'>('quarterly');
  const [battlePopupOpen, setBattlePopupOpen] = useState(false);
  const [showActivityMenu, setShowActivityMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const user = useUser();

  // Initialize cosmic animations
  useEffect(() => {
    injectCosmicAnimations();
  }, []);

  // Check admin status when user is available and authenticated
  useEffect(() => {
    const checkAdminStatus = async () => {
      // Prevent multiple checks
      if (adminCheckDone) return;
      
      if (!user) {
        setIsAdmin(false);
        setAdminCheckDone(true);
        return;
      }

      try {
        // Wait for auth token to be available
        const token = await auth.getAuthToken();
        if (!token) {
          setIsAdmin(false);
          setAdminCheckDone(true);
          return;
        }

        const response = await brain.is_admin();
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.is_admin);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        setIsAdmin(false);
      } finally {
        setAdminCheckDone(true);
      }
    };

    checkAdminStatus();
  }, [user, adminCheckDone]);

  const handleActivityLogged = () => {
    // Trigger refresh of activity history and any dashboard stats
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBattleIconClick = () => {
    setBattlePopupOpen(true);
  };

  const handleBattlePopupClose = () => {
    setBattlePopupOpen(false);
  };

  return (
    <CompetitionProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative">
        {/* Enhanced cosmic background */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='stars' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='25' cy='25' r='1' fill='white' opacity='0.8'/%3E%3Ccircle cx='75' cy='75' r='1.5' fill='%2306b6d4' opacity='0.6'/%3E%3Ccircle cx='50' cy='10' r='0.8' fill='%23a855f7' opacity='0.8'/%3E%3Ccircle cx='15' cy='60' r='0.5' fill='white' opacity='0.5'/%3E%3Ccircle cx='85' cy='30' r='1.2' fill='%23ec4899' opacity='0.7'/%3E%3Ccircle cx='5' cy='85' r='0.6' fill='%2306b6d4' opacity='0.6'/%3E%3Ccircle cx='90' cy='60' r='0.8' fill='%23a855f7' opacity='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23stars)'/%3E%3C/svg%3E")`
        }} />
        
        {/* Header - Responsive design */}
        <header className="backdrop-blur-sm bg-black/20 border-b border-purple-400/30">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col gap-4">
              {/* Top Row: Logo and User */}
              <div className="flex items-center justify-between">
                {/* Icon - Left */}
                <img 
                  src="https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/QuestBoard%20Icon.png" 
                  alt="QuestBoard Icon" 
                  className="h-16 md:h-18 object-contain"
                />
                
                {/* QuestBoard Text - Center */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                  <img 
                    src="https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/QuestBoard%20logo.png" 
                    alt="QuestBoard Logo" 
                    className="h-20 md:h-24 object-contain"
                  />
                </div>

                {/* User Profile - Right */}
                <UserButton />
              </div>

              {/* Control Buttons - Responsive Grid */}
              <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                {/* Leaderboard Button */}
                <Button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  variant={showLeaderboard ? "default" : "outline"}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-purple-400/50 backdrop-blur-sm transition-all duration-200 font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 flex-shrink-0"
                >
                  <Trophy className="w-5 h-5" />
                  <span className="hidden sm:inline ml-2">{showLeaderboard ? 'Hide' : 'Show'} Leaderboard</span>
                  <span className="sm:hidden ml-2">LB</span>
                </Button>
                
                {/* Team Progress Button */}
                <Button
                  onClick={() => setShowTeamProgress(!showTeamProgress)}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-indigo-400/50 backdrop-blur-sm transition-all duration-200 font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 flex-shrink-0"
                >
                  <Rocket className="w-5 h-5" />
                  <span className="hidden sm:inline ml-2">{showTeamProgress ? 'Hide' : 'Show'} Team</span>
                  <span className="sm:hidden ml-2">Team</span>
                </Button>
                
                {/* Team Bridge Button */}
                <Button
                  onClick={() => navigate('/team-insights')}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white border-cyan-400/50 backdrop-blur-sm transition-all duration-200 font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 flex-shrink-0"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="hidden sm:inline ml-2">Bridge</span>
                  <span className="sm:hidden ml-2">Bridge</span>
                </Button>
                
                {/* Admin Button */}
                {isAdmin === true && (
                  <Button
                    onClick={() => navigate('/admin-dashboard')}
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white border-orange-400/50 backdrop-blur-sm transition-all duration-200 font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 flex-shrink-0"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="hidden sm:inline ml-2">Admin</span>
                  </Button>
                )}
                
                {/* Battle Icon */}
                <BattleIcon 
                  onClick={handleBattleIconClick} 
                />
                
                {/* Activities Menu - Direct Access */}
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-emerald-400/50 backdrop-blur-sm transition-all duration-200 font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 flex-shrink-0"
                  onClick={() => setShowActivityMenu(true)}
                >
                  <Zap className="w-5 h-5" />
                  <span className="hidden sm:inline ml-2">Activities</span>
                  <span className="sm:hidden ml-2">Activity</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Activity Menu Sheet */}
          <ActivityMenu 
            refreshTrigger={refreshTrigger}
            onActivityLogged={handleActivityLogged}
            isOpen={showActivityMenu}
            onOpenChange={setShowActivityMenu}
          />
        </header>

        {/* Main Content - Responsive Layout */}
        <main className="relative z-10 p-3 md:p-8">
          <div className="w-full space-y-4 md:space-y-6">
            {/* Mobile Layout - Stacked with Expandable Sections */}
            <div className="xl:hidden space-y-4">
              {/* Player Progress - Mobile */}
              <Card className="bg-gradient-to-br from-slate-900/90 to-blue-900/60 border-blue-500/40 backdrop-blur-sm shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent relative flex items-center justify-center gap-2">
                    👤 Player Progress
                    {/* Toggle positioned absolute in top-right of header */}
                    <div className="absolute -top-2 -right-2">
                      <PlayerProgressToggle 
                        viewMode={playerViewMode}
                        onViewModeChange={setPlayerViewMode}
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <PlayerProgressTrack 
                    refreshTrigger={refreshTrigger} 
                    hideToggle={true}
                    viewMode={playerViewMode}
                  />
                </CardContent>
              </Card>
              
              {/* Team Progress - Mobile */}
              {showTeamProgress && (
                <Card className="bg-gradient-to-br from-slate-900/90 to-purple-900/60 border-purple-500/40 backdrop-blur-sm shadow-2xl">
                  <CardHeader 
                    className="pb-2 cursor-pointer"
                    onClick={() => setMobileTeamExpanded(!mobileTeamExpanded)}
                  >
                    <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
                      🌌 Team Progress & Planetary Objectives
                      {mobileTeamExpanded ? <ChevronUp className="w-5 h-5 text-purple-400" /> : <ChevronDown className="w-5 h-5 text-purple-400" />}
                    </CardTitle>
                  </CardHeader>
                  {mobileTeamExpanded && (
                    <CardContent className="pt-0 space-y-4">
                      <MoonRace />
                      <PlanetaryObjectives />
                    </CardContent>
                  )}
                </Card>
              )}
              
              {/* Leaderboard - Mobile */}
              {showLeaderboard && (
                <Card className="bg-slate-900/50 border-purple-500/30 backdrop-blur-sm shadow-2xl">
                  <CardContent className="p-4">
                    <Leaderboard 
                      refreshTrigger={refreshTrigger} 
                      isVisible={showLeaderboard}
                      onToggleVisibility={() => setShowLeaderboard(false)}
                    />
                  </CardContent>
                </Card>
              )}
              
              {/* Challenges Widget - Mobile */}
              <div className="relative">
                <Card 
                  className="bg-gradient-to-br from-slate-900/80 to-emerald-900/20 border-emerald-500/30 backdrop-blur-sm shadow-2xl cursor-pointer"
                  onClick={() => setMobileChallengesExpanded(!mobileChallengesExpanded)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
                      🎯 Bonus Challenges
                      {mobileChallengesExpanded ? <ChevronUp className="w-5 h-5 text-emerald-400" /> : <ChevronDown className="w-5 h-5 text-emerald-400" />}
                    </CardTitle>
                  </CardHeader>
                  {mobileChallengesExpanded && (
                    <CardContent className="pt-0">
                      <ChallengesWidget />
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>

            {/* Desktop Layout - 2x2 Grid */}
            <div className="hidden xl:block">
              {/* Complete 2x2 Grid Layout */}
              <div className="grid grid-cols-2 gap-6 h-[calc(100vh-180px)] max-h-[900px]">
                {/* ROW 1: Player Progress + Team Progress */}
                {/* Player Progress - Desktop Top Left */}
                <div className="flex flex-col">
                  <Card className="bg-gradient-to-br from-slate-900/90 to-blue-900/60 border-blue-500/40 backdrop-blur-sm shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="pb-4 flex-shrink-0">
                      <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent relative flex items-center justify-center gap-2">
                        👤 Player Progress
                        {/* Toggle positioned absolute in top-right of header */}
                        <div className="absolute -top-1 -right-1">
                          <PlayerProgressToggle 
                            viewMode={playerViewMode}
                            onViewModeChange={setPlayerViewMode}
                          />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-4">
                      <PlayerProgressTrack 
                        refreshTrigger={refreshTrigger} 
                        hideToggle={true}
                        viewMode={playerViewMode}
                      />
                    </CardContent>
                  </Card>
                </div>
                
                {/* Team Progress - Desktop Top Right */}
                {showTeamProgress ? (
                  <div className="flex flex-col">
                    <Card className="bg-gradient-to-br from-slate-900/90 to-purple-900/60 border-purple-500/40 backdrop-blur-sm shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 flex-1 flex flex-col overflow-hidden">
                      <CardHeader className="pb-4 flex-shrink-0">
                        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          🌌 Team Progress & Planetary Objectives
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-hidden p-4">
                        <div className="grid grid-cols-2 gap-4 h-full">
                          {/* Moon Race - Left Side */}
                          <div className="h-full overflow-hidden">
                            <MoonRace />
                          </div>
                          {/* Planetary Objectives - Right Side */}
                          <div className="h-full overflow-hidden">
                            <PlanetaryObjectives />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <p className="text-slate-400 text-center">Team progress hidden</p>
                  </div>
                )}
                
                {/* ROW 2: Challenges + Booking Competition */}
                {/* Challenges Widget - Desktop Bottom Left */}
                <div className="flex flex-col">
                  <Card className="bg-gradient-to-br from-slate-900/80 to-emerald-900/20 border-emerald-500/30 backdrop-blur-sm shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="pb-4 flex-shrink-0">
                      <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
                        🎯 Bonus Challenges
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-4">
                      <ChallengesWidget />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            
            {/* Leaderboard - Overlay positioned absolutely when visible */}
            {showLeaderboard && (
              <div className="fixed top-20 right-4 w-80 z-50">
                <Card className="bg-slate-900/95 border-purple-500/50 backdrop-blur-sm shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
                  <CardContent className="p-4">
                    <Leaderboard 
                      refreshTrigger={refreshTrigger} 
                      isVisible={showLeaderboard}
                      onToggleVisibility={() => setShowLeaderboard(false)}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
        
        {/* Battle Popup */}
        <BattlePopup 
          isOpen={battlePopupOpen}
          onClose={handleBattlePopupClose}
        />
        
        {/* Guest Welcome from Commander Veyra */}
        <VeyraWelcomePopup />
      </div>
    </CompetitionProvider>
  );
}
