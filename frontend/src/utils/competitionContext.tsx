
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CompetitionResponse, CompetitionResponseV2 } from 'types';
import brain from 'brain';
import { toast } from 'sonner';

export interface ActiveCompetition {
  id: number;
  name: string;
  isV2: boolean;
  data: CompetitionResponse | CompetitionResponseV2;
}

interface CompetitionContextType {
  activeCompetition: ActiveCompetition | null;
  setActiveCompetition: (competition: ActiveCompetition | null) => void;
  refreshActiveCompetition: () => Promise<void>;
  isLoading: boolean;
}

const CompetitionContext = createContext<CompetitionContextType | undefined>(undefined);

export function CompetitionProvider({ children }: { children: ReactNode }) {
  const [activeCompetition, setActiveCompetition] = useState<ActiveCompetition | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshActiveCompetition = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 CompetitionContext: Refreshing active competition...');
      
      // Check both v1 and v2 competitions in parallel
      const [v1Response, v2Response] = await Promise.all([
        brain.list_competitions().catch(() => ({ ok: false })),
        brain.list_competitions_v2().catch(() => ({ ok: false }))
      ]);

      let foundActive: ActiveCompetition | null = null;

      // Check v1 competitions first
      if (v1Response.ok) {
        const v1ResponseData = await v1Response.json();
        const v1Competitions: CompetitionResponse[] = Array.isArray(v1ResponseData) ? v1ResponseData : v1ResponseData.data || [];
        console.log('📊 CompetitionContext: V1 competitions:', v1Competitions);
        
        // Filter active and non-hidden competitions
        const activeV1Competitions = v1Competitions.filter(c => c.is_active && !c.is_hidden);
        
        if (activeV1Competitions.length > 0) {
          // Priority 1: Find competition with actual data (same as MCP logic)
          for (const comp of activeV1Competitions) {
            try {
              const entriesResponse = await brain.leaderboard({ competitionId: comp.id });
              if (entriesResponse.ok) {
                const entriesData = await entriesResponse.json();
                if (entriesData.rows && entriesData.rows.length > 0) {
                  console.log('⚡ CompetitionContext: Active V1 competition with data found:', comp.id);
                  foundActive = {
                    id: comp.id,
                    name: comp.name,
                    isV2: false,
                    data: comp
                  };
                  break;
                }
              }
            } catch (error) {
              console.log('Failed to check entries for competition', comp.id, error);
            }
          }
          
          // Priority 2: If no competition has data, use the first active one
          if (!foundActive) {
            const firstActive = activeV1Competitions[0];
            console.log('⚡ CompetitionContext: Active V1 competition found (no data yet):', firstActive.id);
            foundActive = {
              id: firstActive.id,
              name: firstActive.name,
              isV2: false,
              data: firstActive
            };
          }
        }
      }

      // Check v2 competitions if no v1 active found
      if (!foundActive && v2Response.ok) {
        const v2ResponseData = await v2Response.json();
        const v2Competitions: CompetitionResponseV2[] = Array.isArray(v2ResponseData) ? v2ResponseData : v2ResponseData.data || [];
        console.log('📊 CompetitionContext: V2 competitions:', v2Competitions);
        const activeV2 = v2Competitions.find(c => c.state === 'active' && !c.is_hidden);
        console.log('⚡ CompetitionContext: Active V2 competition found:', activeV2);
        if (activeV2) {
          foundActive = {
            id: activeV2.id,
            name: activeV2.name,
            isV2: true,
            data: activeV2
          };
        }
      }

      console.log('🎯 CompetitionContext: Final active competition:', foundActive);
      setActiveCompetition(foundActive);
    } catch (error) {
      console.error('❌ CompetitionContext: Error refreshing active competition:', error);
      toast.error('Failed to load active competition');
    } finally {
      setIsLoading(false);
    }
  };

  // Load active competition on mount
  useEffect(() => {
    refreshActiveCompetition();
  }, []);

  return (
    <CompetitionContext.Provider value={{
      activeCompetition,
      setActiveCompetition,
      refreshActiveCompetition,
      isLoading
    }}>
      {children}
    </CompetitionContext.Provider>
  );
}

export function useCompetition() {
  const context = useContext(CompetitionContext);
  if (context === undefined) {
    throw new Error('useCompetition must be used within a CompetitionProvider');
  }
  return context;
}
