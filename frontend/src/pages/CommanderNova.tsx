



import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Zap, Send, Star, Target, TrendingUp, Users, Trophy, BookOpen, Presentation } from 'lucide-react';
import brain from 'brain';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  type: 'user' | 'veyra';
  content: string;
  timestamp: Date;
  mcpAction?: string;
}

interface VeyraPersonality {
  mood: 'tactical' | 'motivational' | 'analytical' | 'storytelling';
  backstoryTopic?: string;
}

const CommanderVeyra: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'veyra',
      content: "🌌 **Commander Veyra here!** Welcome to the cosmic command center, warriors! I've conquered the Stellar Nexus, defeated the Dark Fleet of Arcturus, and now I'm here to lead you magnificent 12 against that cosmic tyrant Zephyr. \n\nI know each of you personally - your combat potential, your strategic minds, your warrior hearts. Ready for tactical briefing? Ask me about competitions, leaderboards, or let me share some battle wisdom from across the galaxies! ⚡",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [personality, setPersonality] = useState<VeyraPersonality>({ mood: 'tactical' });
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateVeyraResponse = async (userMessage: string): Promise<string> => {
    // Detect if user is asking for MCP actions
    const mcpKeywords = {
      'leaderboard': 'checking battle standings',
      'competition': 'analyzing current missions', 
      'progress': 'reviewing warrior advancement',
      'log': 'recording tactical achievements',
      'create': 'initiating new campaign',
      'insights': 'gathering cosmic intelligence'
    };

    let mcpAction = '';
    let mcpResponse = '';
    
    for (const [keyword, action] of Object.entries(mcpKeywords)) {
      if (userMessage.toLowerCase().includes(keyword)) {
        mcpAction = action;
        
        try {
          if (keyword === 'leaderboard') {
            const response = await brain.mcp_get_leaderboard({});
            const data = await response.json();
            mcpResponse = `\n\n📊 **TACTICAL OVERVIEW:**\n${data.leaderboard?.map((p: any, i: number) => 
              `${i + 1}. **${p.name}** - ${p.points} cosmic points`
            ).join('\n') || 'No active competition detected.'}`;
          }
          else if (keyword === 'progress') {
            // Extract player name if mentioned
            const playerNames = ['RIKKE', 'SIGGEN', 'GARD', 'THEA', 'ITHY', 'EMILIE', 'SCHOLZ', 'HEFF', 'KAREN', 'TOBIAS', 'ANDREAS', 'SONDRE'];
            const mentionedPlayer = playerNames.find(name => 
              userMessage.toUpperCase().includes(name)
            );
            
            if (mentionedPlayer) {
              const response = await brain.mcp_get_player_progress({ player_name: mentionedPlayer });
              const data = await response.json();
              mcpResponse = `\n\n⚡ **${mentionedPlayer}'S BATTLE STATUS:**\n• **Current Power:** ${data.current_points || 0} cosmic points\n• **Books Secured:** ${data.current_books || 0}\n• **Opportunities:** ${data.current_opps || 0}\n• **Deals Conquered:** ${data.current_deals || 0}`;
            }
          }
        } catch (error) {
          console.error('MCP Error:', error);
          mcpResponse = '\n\n🌌 *Cosmic interference detected. Systems recalibrating...*';
        }
        break;
      }
    }

    // Generate Veyra's personality response
    const responses = {
      tactical: [
        `⚡ **TACTICAL ANALYSIS INITIATED!** From my campaigns in the Vortex Wars, here's what I observe...`,
        `🎯 **STRATEGIC ASSESSMENT:** During the Siege of Stellar Prime, I learned that...`,
        `🌌 **COMMANDER'S EVALUATION:** This reminds me of when we faced the Shadow Armada...`
      ],
      motivational: [
        `🚀 **WARRIORS ASSEMBLE!** Listen well, cosmic champions! On the battlefields of Nebula-9, I witnessed...`,
        `⭐ **INSPIRATION PROTOCOL:** You know what? This is exactly like when I led the final assault against...`,
        `💫 **VICTORY SURGE:** Back when I commanded the Starfire Legion against impossible odds...`
      ],
      storytelling: [
        `📖 **LEGEND FROM THE VOID:** Ah, this reminds me of the Epic Battle of Crystal Moons! Picture this...`,
        `🌟 **TALE OF CONQUEST:** You want to hear about true adversity? Let me tell you about Zephyr's predecessor, the Void Emperor...`,
        `🎭 **COSMIC CHRONICLE:** In the ancient archives of Galactic Command, there's an epic about...`
      ],
      analytical: [
        `🔍 **DATA MATRIX ANALYSIS:** Let me process these cosmic metrics through my battle algorithms...`,
        `📈 **PERFORMANCE SCAN:** From a strategic standpoint, my tactical computers indicate...`,
        `🧠 **STRATEGIC CALCULATION:** Based on battlefield data from 127 different star systems...`
      ]
    };

    const baseResponse = responses[personality.mood][Math.floor(Math.random() * responses[personality.mood].length)];
    
    // Add cosmic wisdom based on context
    let wisdom = "";
    if (userMessage.toLowerCase().includes('help') || userMessage.toLowerCase().includes('stuck')) {
      wisdom = "\n\nRemember, young warrior: Even the mightiest cosmic storms pass. Every setback is just energy building for your next breakthrough! I've seen it on a thousand worlds. 🌟";
    } else if (userMessage.toLowerCase().includes('team') || userMessage.toLowerCase().includes('together')) {
      wisdom = "\n\nThe 12 of you remind me of the legendary Star Squadron - each unique, but unstoppable when united! Zephyr fears teamwork above all else. ⚔️";
    } else if (userMessage.toLowerCase().includes('zephyr')) {
      wisdom = "\n\n🔥 **ABOUT ZEPHYR:** That cosmic menace thinks he's clever, but I've been tracking his dark schemes across three galaxies. His weakness? He underestimates the power of determined sales warriors like yourselves!";
    }

    return baseResponse + mcpResponse + wisdom;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const veyraResponse = await generateVeyraResponse(userMessage.content);
      
      const veyraMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'veyra',
        content: veyraResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, veyraMessage]);
      
      // Randomly change Nova's mood for variety
      if (Math.random() < 0.3) {
        const moods: VeyraPersonality['mood'][] = ['tactical', 'motivational', 'analytical', 'storytelling'];
        setPersonality({ mood: moods[Math.floor(Math.random() * moods.length)] });
      }
    } catch (error) {
      console.error('Error generating Nova response:', error);
      toast.error('Cosmic interference detected! Try again.');
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const launchPresentMode = () => {
    navigate('/PresentMode');
    addMessage({
      id: Date.now().toString(),
      type: 'veyra',
      content: "🌌⚡ Present Mode activated! Your meeting display is now live with auto-cycling battle data. Perfect for Monday kickoffs and Friday wraps!",
      timestamp: new Date(),
      mood: 'tactical'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6 bg-black/30 border-purple-500/30">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="https://static.databutton.com/public/d978a819-e5a6-4daa-b966-24efa651c3ca/ChatGPT Image Sep 2, 2025, 01_06_27 AM.png" 
                alt="Commander Veyra" 
                className="w-24 h-24 rounded-full border-4 border-purple-400 shadow-lg shadow-purple-500/50"
              />
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-2">
              ⚡ Commander Veyra's Command Center
            </CardTitle>
            <p className="text-purple-200">
              Your cosmic sales commander • Zephyr's nemesis • Tactical advisor to the 12 warriors
            </p>
            <Badge variant="outline" className="mx-auto mt-2 border-purple-400 text-purple-200">
              Mood: {personality.mood.charAt(0).toUpperCase() + personality.mood.slice(1)} 🌌
            </Badge>
          </CardHeader>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Button 
            onClick={() => handleQuickAction('leaderboard')}
            variant="outline"
            className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 p-4 h-auto flex flex-col items-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            <span className="text-sm">Battle Standings</span>
          </Button>
          
          <Button 
            onClick={() => handleQuickAction('log_books')}
            variant="outline"
            className="border-green-500/50 text-green-400 hover:bg-green-500/20 p-4 h-auto flex flex-col items-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-sm">Log Books</span>
          </Button>
          
          <Button 
            onClick={() => handleQuickAction('progress')}
            variant="outline"
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 p-4 h-auto flex flex-col items-center gap-2"
          >
            <Target className="w-5 h-5" />
            <span className="text-sm">My Progress</span>
          </Button>
          
          <Button 
            onClick={launchPresentMode}
            variant="outline"
            className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20 p-4 h-auto flex flex-col items-center gap-2"
          >
            <Presentation className="w-5 h-5" />
            <span className="text-sm">Present Mode</span>
          </Button>
        </div>

        {/* Chat Area */}
        <Card className="bg-black/30 border-purple-500/30">
          <CardContent className="p-0">
            <ScrollArea className="h-96 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600/80 text-white'
                          : 'bg-purple-600/80 text-white'
                      }`}
                    >
                      {message.type === 'veyra' && (
                        <div className="flex items-center mb-2">
                          <Zap className="w-4 h-4 mr-2" />
                          <span className="font-bold text-yellow-300">Commander Nova</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-purple-600/80 text-white p-3 rounded-lg">
                      <div className="flex items-center">
                        <Zap className="w-4 h-4 mr-2 animate-pulse" />
                        <span className="font-bold text-yellow-300">Commander Nova</span>
                      </div>
                      <div className="text-purple-200 mt-2">Accessing cosmic intelligence...</div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={scrollRef} />
            </ScrollArea>
            
            {/* Input Area */}
            <div className="border-t border-purple-500/30 p-4">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Commander Nova about battles, tactics, or cosmic wisdom..."
                  className="bg-black/30 border-purple-500/30 text-white placeholder-purple-300"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommanderVeyra;
