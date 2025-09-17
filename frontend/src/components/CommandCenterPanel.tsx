


import React, { useEffect, useRef, useState } from 'react';
import { X, Zap, Target, Map, Mic, Clock } from 'lucide-react';
import brain from 'brain';
import type { LeaderboardRequest, PlayerProgressRequest, LogEventRequest } from 'types';
import { narrativeEngine, activityEventBus, parseActivityEvent } from './NarrativeEngine';

interface CommandCenterPanelProps {
  onClose: () => void;
}

interface NarrativeMessage {
  id: string;
  speaker: 'veyra' | 'zephyr';
  text: string;
  timestamp: Date;
  action?: string;
}

export const CommandCenterPanel: React.FC<CommandCenterPanelProps> = ({ onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [presentMode, setPresentMode] = useState(false);
  const [messages, setMessages] = useState<NarrativeMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  
  // Rate limiting: 1 message per 10 seconds
  const RATE_LIMIT_MS = 3000; // Reduced from 10 seconds to 3 seconds

  // Load selected player on mount
  useEffect(() => {
    loadSelectedPlayer();
  }, []);

  const loadSelectedPlayer = async () => {
    try {
      const response = await brain.get_my_player();
      if (!response.ok) return;
      
      const data = await response.json();
      setSelectedPlayer(data ? data.player_name : null);
    } catch (error) {
      console.error('Failed to load selected player:', error);
    }
  };

  useEffect(() => {
    // Load present mode from localStorage
    const savedPresentMode = localStorage.getItem('present_mode');
    if (savedPresentMode === 'true') {
      setPresentMode(true);
    }

    // Focus trap setup
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Simple focus trap - keep focus within panel
        const focusableElements = panelRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Focus first element when panel opens
    if (panelRef.current) {
      const firstFocusable = panelRef.current.querySelector('button, input') as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    // Subscribe to activity events
    const unsubscribe = activityEventBus.subscribe((event) => {
      const narrativeMessage = narrativeEngine.onActivityLogged(event);
      addNarrativeMessage('veyra', narrativeMessage, `activity_${event.type}`);
      
      // Add Zephyr counter-response (30% chance)
      if (Math.random() < 0.3) {
        setTimeout(() => {
          const zephyrResponse = narrativeEngine.getZephyrResponse(narrativeMessage);
          addNarrativeMessage('zephyr', zephyrResponse);
        }, 2000 + Math.random() * 3000); // 2-5 second delay
      }
    });

    // Add initial welcome message with snapshot
    handleQuickAction('snapshot', true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      unsubscribe();
    };
  }, []);

  const addNarrativeMessage = (speaker: 'veyra' | 'zephyr', text: string, action?: string) => {
    const now = Date.now();
    // Allow action-triggered messages to bypass rate limiting
    if (now - lastMessageTime < RATE_LIMIT_MS && !action) {
      console.log('Rate limited: message not added');
      return;
    }
    
    const newMessage: NarrativeMessage = {
      id: `${speaker}-${Date.now()}-${Math.random()}`,
      speaker,
      text,
      timestamp: new Date(),
      action
    };
    
    setMessages(prev => [...prev, newMessage]);
    if (!action) { // Only update rate limit for non-action messages
      setLastMessageTime(now);
    }
  };

  const handlePresentModeToggle = () => {
    const newMode = !presentMode;
    setPresentMode(newMode);
    localStorage.setItem('present_mode', String(newMode));
    console.log('ui.cc_present_mode', { enabled: newMode });
    
    if (newMode) {
      addNarrativeMessage('veyra', 'Present Mode activated. Numbers frozen, spirits flowing free.');
    } else {
      addNarrativeMessage('veyra', 'Live data stream resumed. The cosmos awakens.');
    }
  };

  const handleQuickAction = async (action: string, isInitial = false) => {
    if (isLoading) return;
    
    // Immediate visual feedback
    addNarrativeMessage('veyra', '⚡ Command received, processing...', action);
    
    console.log('ui.cc_action_clicked', { action });
    setIsLoading(true);
    
    try {
      switch (action) {
        case 'snapshot': {
          // Get leaderboard snapshot
          const request: LeaderboardRequest = { competition_id: 0, limit: 5 };
          const response = await brain.mcp_get_leaderboard(request);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.standings?.length > 0) {
              const topPlayer = data.standings[0];
              const totalPlayers = data.standings.length;
              
              if (isInitial) {
                addNarrativeMessage(
                  'veyra', 
                  `Constellation patterns scanned. ${topPlayer.name || 'Unknown warrior'} leads with ${topPlayer.points || 0} cosmic points. ${totalPlayers} souls in formation.`, 
                  'snapshot'
                );
              } else {
                addNarrativeMessage(
                  'veyra', 
                  `Current scan: ${topPlayer.name || 'Unknown'} commands the void with ${topPlayer.points || 0} points. Formation stable.`, 
                  'snapshot'
                );
              }
            } else {
              addNarrativeMessage('veyra', 'The cosmos falls silent. No active battles detected.', 'snapshot');
            }
          } else {
            addNarrativeMessage('veyra', 'Cosmic interference. Scanning systems offline.', 'snapshot');
          }
          break;
        }
        
        case 'rush': {
          // Start a rush event (log a motivational burst)
          const request: LogEventRequest = {
            competition_id: 0,
            player_name: selectedPlayer || undefined, // Include selected player
            activity_type: 'book', // Change to valid activity type
            count: 1,
            description: 'Commander Veyra initiated team rush protocol'
          };
          
          const response = await brain.mcp_log_competition_event(request);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              const playerText = selectedPlayer ? ` for ${selectedPlayer}` : '';
              addNarrativeMessage('veyra', `Rush protocol activated${playerText}! Cosmic energy channeled through the void!`, 'rush');
              // Add Zephyr counter-message
              setTimeout(() => {
                addNarrativeMessage('zephyr', 'Your brief flare disturbs nothing. The storm endures.');
              }, 2000);
              
              // Simulate team motivation boost
              const motivationalMessage = narrativeEngine.getMotivationalMessage();
              setTimeout(() => {
                addNarrativeMessage('veyra', motivationalMessage);
              }, 5000);
            } else {
              addNarrativeMessage('veyra', `Rush systems offline: ${data.message || 'Manual protocols engaged.'}`, 'rush');
            }
          } else {
            addNarrativeMessage('veyra', 'Energy conduits blocked. The void resists.', 'rush');
          }
          break;
        }
        
        case 'gateways': {
          // Show opportunities/gateways by getting current progress
          const request: PlayerProgressRequest = { period: 'current_quarter' };
          const response = await brain.mcp_get_player_progress(request);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.progress) {
              const opps = data.progress.current_opps || 0;
              const deals = data.progress.current_deals || 0;
              
              addNarrativeMessage(
                'veyra', 
                `Gateway matrix reveals: ${opps} pathways discovered, ${deals} constellations secured. The nexus pulses.`, 
                'gateways'
              );
              
              // Check for milestone achievements
              const goalOpps = data.progress.goal_opps || 10;
              const oppPercentage = Math.round((opps / goalOpps) * 100);
              
              if (oppPercentage >= 75) {
                setTimeout(() => {
                  const milestoneMessage = narrativeEngine.onMilestoneReached(
                    data.player_name || 'Warrior', 
                    'Gateway Discovery', 
                    oppPercentage
                  );
                  addNarrativeMessage('veyra', milestoneMessage, 'milestone');
                }, 2000);
              }
            } else {
              addNarrativeMessage('veyra', 'Gateway sensors offline. Navigate by starlight.', 'gateways');
            }
          } else {
            addNarrativeMessage('veyra', 'Dimensional barriers detected. Gateway mapping interrupted.', 'gateways');
          }
          break;
        }
      }
    } catch (error) {
      console.error('MCP Action Error:', error);
      addNarrativeMessage('veyra', 'System anomaly detected. Recalibrating cosmic arrays.', action);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const userInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    
    // Add user message first
    addNarrativeMessage('veyra', `🗨️ "${userInput}"`, 'user_input');
    
    try {
      // Try OpenAI-powered Veyra chat first
      try {
        const chatRequest = {
          message: userInput,
          context: `Current session: Command Center active. Team status monitoring in progress.`
        };
        
        const response = await brain.cosmic_chat(chatRequest);
        
        if (response.ok) {
          const data = await response.json();
          
          setTimeout(() => {
            addNarrativeMessage('veyra', data.response, 'ai_response');
          }, 800); // Slight delay for realistic feel
          
        } else {
          throw new Error('OpenAI API unavailable');
        }
      } catch (aiError) {
        console.log('AI chat fallback triggered:', aiError);
        
        // Fallback to keyword-based responses
        if (userInput.toLowerCase().includes('status') || userInput.toLowerCase().includes('report')) {
          await handleQuickAction('snapshot');
        } else if (userInput.toLowerCase().includes('boost') || userInput.toLowerCase().includes('energy')) {
          await handleQuickAction('rush');
        } else if (userInput.toLowerCase().includes('gateway') || userInput.toLowerCase().includes('opportunity')) {
          await handleQuickAction('gateways');
        } else if (userInput.toLowerCase().includes('motivate') || userInput.toLowerCase().includes('inspire')) {
          const motivationalMessage = narrativeEngine.getMotivationalMessage();
          setTimeout(() => {
            addNarrativeMessage('veyra', motivationalMessage);
          }, 1000);
        } else {
          // Generic fallback response
          setTimeout(() => {
            addNarrativeMessage('veyra', 'Your words echo through the cosmic void. The constellation network receives your transmission, warrior.');
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Query processing error:', error);
      addNarrativeMessage('veyra', 'Cosmic interference detected. Communication arrays recalibrating.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-end p-6 pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto z-[9998]"
        onClick={onClose}
      />
      
      {/* Command Center Panel */}
      <div
        ref={panelRef}
        className={`
          relative pointer-events-auto z-[10000]
          w-full max-w-md h-[560px]
          lg:w-[420px] lg:h-[560px]
          rounded-3xl
          border border-cyan-400/30
          transition-all duration-300 ease-out
          ${presentMode ? 'scale-105' : ''}
        `}
        style={{
          background: 'linear-gradient(135deg, #0b0f1a 0%, #1a1f2e 50%, #0b0f1a 100%)',
          boxShadow: `
            0 0 20px #4de2e8,
            0 0 40px rgba(77, 226, 232, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Scanline Effect */}
        <div 
          className="absolute inset-0 rounded-3xl opacity-20 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(77, 226, 232, 0.1) 2px, rgba(77, 226, 232, 0.1) 4px)',
          }}
        />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-400/20">
          <div className="flex items-center space-x-3">
            {/* Veyra Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center relative overflow-hidden">
              <img 
                src="https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/Commander Veyra.png"
                alt="Commander Veyra"
                className="w-full h-full object-cover rounded-full"
                style={{
                  filter: 'saturate(1.4) contrast(1.2) brightness(1.3) drop-shadow(0 0 8px rgba(34, 211, 238, 0.8))'
                }}
              />
              {/* Cosmic glow overlay */}
              <div className="absolute inset-0 rounded-full border border-cyan-400/60 animate-pulse" />
            </div>
            
            <div>
              <h2 className="text-cyan-400 font-bold text-lg tracking-wider">
                War of Constellations
              </h2>
              <p className="text-cyan-200/60 text-xs">
                Week 36 • Team Oslo
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Present Mode Toggle */}
            <button
              onClick={handlePresentModeToggle}
              disabled={isLoading}
              className={`
                px-3 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50
                ${presentMode 
                  ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40' 
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:border-cyan-400/30'
                }
              `}
            >
              Present Mode
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-cyan-400 hover:bg-slate-600/50 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        {/* Message Feed */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-80">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`
                p-3 rounded-xl max-w-xs transition-all duration-300
                ${message.speaker === 'veyra' 
                  ? 'bg-cyan-900/30 border border-cyan-400/20 text-cyan-100 ml-auto' 
                  : 'bg-red-900/30 border border-red-400/20 text-red-100'
                }
              `}
              style={{
                boxShadow: message.speaker === 'veyra' 
                  ? '0 0 8px rgba(77, 226, 232, 0.2)' 
                  : '0 0 8px rgba(215, 38, 61, 0.2)'
              }}
            >
              <div className="flex items-start space-x-2">
                {message.action && (
                  <div className={`mt-1 ${message.speaker === 'veyra' ? 'text-cyan-400' : 'text-red-400'}`}>
                    {message.action === 'snapshot' && <Zap size={12} />}
                    {message.action === 'rush' && <Target size={12} />}
                    {message.action === 'gateways' && <Map size={12} />}
                    {message.action === 'user_query' && <Clock size={12} />}
                    {message.action?.startsWith('activity_') && <Zap size={12} />}
                    {message.action === 'milestone' && <Target size={12} />}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <span className="text-xs opacity-60 block mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-center">
              <div className="flex space-x-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="p-4 border-t border-cyan-400/20">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={() => handleQuickAction('snapshot')}
              disabled={isLoading}
              className="flex flex-col items-center p-2 rounded-lg bg-slate-800/50 hover:bg-cyan-900/30 border border-slate-600/50 hover:border-cyan-400/30 transition-all text-xs disabled:opacity-50"
            >
              <Zap size={16} className="text-cyan-400 mb-1" />
              <span className="text-cyan-200">Snapshot</span>
            </button>
            
            <button
              onClick={() => handleQuickAction('rush')}
              disabled={isLoading}
              className="flex flex-col items-center p-2 rounded-lg bg-slate-800/50 hover:bg-cyan-900/30 border border-slate-600/50 hover:border-cyan-400/30 transition-all text-xs disabled:opacity-50"
            >
              <Target size={16} className="text-cyan-400 mb-1" />
              <span className="text-cyan-200">Start Rush</span>
            </button>
            
            <button
              onClick={() => handleQuickAction('gateways')}
              disabled={isLoading}
              className="flex flex-col items-center p-2 rounded-lg bg-slate-800/50 hover:bg-cyan-900/30 border border-slate-600/50 hover:border-cyan-400/30 transition-all text-xs disabled:opacity-50"
            >
              <Map size={16} className="text-cyan-400 mb-1" />
              <span className="text-cyan-200">Gateways</span>
            </button>
          </div>
          
          {/* Input */}
          <form onSubmit={handleSubmitMessage} className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              placeholder="Ask Veyra…"
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-600/50 text-cyan-100 placeholder-slate-400 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Mic size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
