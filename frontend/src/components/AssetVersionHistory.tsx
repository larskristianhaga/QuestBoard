import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Lock, Unlock, History, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import { TeamAssetResponse } from 'types';

interface Props {
  competitionId: number;
  teamName: string;
  onVersionSelected?: (version: TeamAssetResponse) => void;
}

export default function AssetVersionHistory({ competitionId, teamName, onVersionSelected }: Props) {
  const [versions, setVersions] = useState<TeamAssetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [managingVersion, setManagingVersion] = useState<number | null>(null);

  useEffect(() => {
    loadVersions();
  }, [competitionId, teamName]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await brain.get_team_assets({ 
        competition_id: competitionId, 
        team_name: teamName 
      });
      const versionList: TeamAssetResponse[] = await response.json();
      setVersions(versionList);
    } catch (error) {
      console.error('Failed to load versions:', error);
      toast.error('Failed to load asset versions');
    } finally {
      setLoading(false);
    }
  };

  const manageAsset = async (version: number, action: string) => {
    setManagingVersion(version);
    try {
      const response = await brain.manage_assets(
        { 
          competition_id: competitionId, 
          team_name: teamName, 
          action 
        },
        { version }
      );
      
      const result = await response.json();
      if (result.success) {
        toast.success(`Asset ${action}ed successfully`);
        await loadVersions(); // Reload to show updated state
      } else {
        toast.error(`Failed to ${action} asset`);
      }
    } catch (error) {
      console.error(`Asset ${action} error:`, error);
      toast.error(`Failed to ${action} asset`);
    } finally {
      setManagingVersion(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('no-NO', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  const downloadAsset = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading versions...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Version History
          <Badge variant="secondary">{versions.length} versions</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No asset versions found. Generate your first assets!
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {versions.map((version, index) => {
                const config = version.config as any;
                return (
                  <div key={version.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          v{version.version}
                        </Badge>
                        {version.is_locked && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Locked
                          </Badge>
                        )}
                        {index === 0 && (
                          <Badge variant="destructive">Latest</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(version.created_at.toString())}
                      </div>
                    </div>

                    {/* Asset Preview */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center">
                        <div className="border rounded p-2 bg-checkered mb-1">
                          <img
                            src={version.assets.emblem_url || ''}
                            alt="Emblem"
                            className="w-12 h-12 mx-auto object-contain"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">Emblem</span>
                      </div>
                      <div className="text-center">
                        <div className="border rounded p-2 bg-checkered mb-1">
                          <img
                            src={version.assets.avatar_url || ''}
                            alt="Avatar"
                            className="w-12 h-12 mx-auto object-contain"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">Avatar</span>
                      </div>
                      <div className="text-center">
                        <div className="border rounded p-2 bg-checkered mb-1">
                          <img
                            src={version.assets.banner_url || ''}
                            alt="Banner"
                            className="w-full h-6 object-cover rounded"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">Banner</span>
                      </div>
                    </div>

                    {/* Configuration Details */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {config.motif}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {config.preset}
                      </Badge>
                      {config.palette && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Colors:</span>
                          {config.palette.slice(0, 3).map((color: string, idx: number) => (
                            <div
                              key={idx}
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator className="my-3" />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onVersionSelected?.(version)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAsset(
                          version.assets.emblem_url || '', 
                          `${teamName}_emblem_v${version.version}.png`
                        )}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>

                      {version.is_locked ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => manageAsset(version.version, 'unlock')}
                          disabled={managingVersion === version.version}
                        >
                          <Unlock className="h-3 w-3 mr-1" />
                          Unlock
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => manageAsset(version.version, 'lock')}
                          disabled={managingVersion === version.version}
                        >
                          <Lock className="h-3 w-3 mr-1" />
                          Lock
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
