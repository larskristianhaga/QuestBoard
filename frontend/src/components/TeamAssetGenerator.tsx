import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Palette, Eye, Lock, Unlock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import { AssetConfig, GenerateAssetsRequest, GenerateAssetsResponse, AssetUrls } from 'types';

interface Props {
  competitionId: number;
  teamName: string;
  onAssetsGenerated?: (assets: AssetUrls) => void;
}

const PRESET_PALETTES = {
  'cosmic-purple': ['#8B5CF6', '#EC4899', '#06B6D4'],
  'neon-blue': ['#3B82F6', '#06B6D4', '#10B981'],
  'fire-orange': ['#F97316', '#EF4444', '#FBBF24'],
  'electric-green': ['#10B981', '#06B6D4', '#8B5CF6'],
  'sunset-red': ['#EF4444', '#F97316', '#EC4899'],
  'galaxy-dark': ['#6366F1', '#8B5CF6', '#EC4899']
};

const MOTIFS = [
  { value: 'comet', label: '☄️ Comet', description: 'Fast-moving celestial body' },
  { value: 'nebula', label: '🌌 Nebula', description: 'Colorful space clouds' },
  { value: 'raptor', label: '🦅 Raptor', description: 'Swift predatory bird' },
  { value: 'phoenix', label: '🔥 Phoenix', description: 'Mythical fire bird' },
  { value: 'galaxy', label: '🌀 Galaxy', description: 'Spiral star system' },
  { value: 'lightning', label: '⚡ Lightning', description: 'Electric energy' }
];

const STYLE_PRESETS = [
  { value: 'retro-cockpit', label: '🚀 Retro Cockpit', description: 'Classic sci-fi dashboard style' },
  { value: 'neon-vapor', label: '🌆 Neon Vapor', description: 'Synthwave aesthetics' },
  { value: 'pixel-quest', label: '🎮 Pixel Quest', description: '8-bit gaming style' },
  { value: 'hard-sci', label: '🔬 Hard Sci-Fi', description: 'Technical futuristic look' }
];

export default function TeamAssetGenerator({ competitionId, teamName, onAssetsGenerated }: Props) {
  const [config, setConfig] = useState<AssetConfig>({
    label: teamName,
    motif: 'comet',
    preset: 'retro-cockpit',
    palette: PRESET_PALETTES['cosmic-purple']
  });
  
  const [preview, setPreview] = useState<AssetUrls | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [credits, setCredits] = useState(0);
  const [selectedPalette, setSelectedPalette] = useState('cosmic-purple');
  const [customColors, setCustomColors] = useState(['#8B5CF6', '#EC4899', '#06B6D4']);
  const [showCustomPalette, setShowCustomPalette] = useState(false);

  const updateConfig = (field: keyof AssetConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const selectPresetPalette = (paletteKey: string) => {
    setSelectedPalette(paletteKey);
    setShowCustomPalette(false);
    updateConfig('palette', PRESET_PALETTES[paletteKey as keyof typeof PRESET_PALETTES]);
  };

  const updateCustomColor = (index: number, color: string) => {
    const newColors = [...customColors];
    newColors[index] = color;
    setCustomColors(newColors);
    if (showCustomPalette) {
      updateConfig('palette', newColors);
    }
  };

  const useCustomPalette = () => {
    setShowCustomPalette(true);
    setSelectedPalette('');
    updateConfig('palette', customColors);
  };

  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      const request: GenerateAssetsRequest = {
        config,
        preview_only: true
      };
      
      const response = await brain.generate_assets(
        { competition_id: competitionId, team_name: teamName },
        request
      );
      
      const result: GenerateAssetsResponse = await response.json();
      
      if (result.success) {
        setPreview(result.assets);
        setCredits(result.credits_used);
        toast.success('Preview generated successfully!');
      } else {
        toast.error('Failed to generate preview');
      }
    } catch (error) {
      console.error('Preview generation error:', error);
      toast.error('Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmGeneration = async () => {
    if (!preview) return;
    
    setIsConfirming(true);
    try {
      const request: GenerateAssetsRequest = {
        config,
        preview_only: false
      };
      
      const response = await brain.generate_assets(
        { competition_id: competitionId, team_name: teamName },
        request
      );
      
      const result: GenerateAssetsResponse = await response.json();
      
      if (result.success) {
        setCredits(prev => prev + result.credits_used);
        toast.success(`Assets generated! Version ${result.version} created.`);
        onAssetsGenerated?.(result.assets);
      } else {
        toast.error('Failed to generate final assets');
      }
    } catch (error) {
      console.error('Asset generation error:', error);
      toast.error('Failed to generate assets');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Generate AI Assets for {teamName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Label */}
          <div className="space-y-2">
            <Label htmlFor="team-label">Team Label</Label>
            <Input
              id="team-label"
              value={config.label}
              onChange={(e) => updateConfig('label', e.target.value)}
              placeholder="Enter team name or label"
            />
          </div>

          {/* Motif Selector */}
          <div className="space-y-2">
            <Label>Design Motif</Label>
            <Select value={config.motif} onValueChange={(value) => updateConfig('motif', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTIFS.map((motif) => (
                  <SelectItem key={motif.value} value={motif.value}>
                    <div className="flex flex-col">
                      <span>{motif.label}</span>
                      <span className="text-xs text-muted-foreground">{motif.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Style Preset */}
          <div className="space-y-2">
            <Label>Style Preset</Label>
            <Select value={config.preset} onValueChange={(value) => updateConfig('preset', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    <div className="flex flex-col">
                      <span>{preset.label}</span>
                      <span className="text-xs text-muted-foreground">{preset.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Palette Picker */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color Palette
            </Label>
            
            {/* Preset Palettes */}
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PRESET_PALETTES).map(([key, colors]) => (
                <button
                  key={key}
                  onClick={() => selectPresetPalette(key)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    selectedPalette === key && !showCustomPalette
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex gap-1 mb-1">
                    {colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {key.replace('-', ' ')}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Palette */}
            <div className="border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={useCustomPalette}
                className={showCustomPalette ? 'bg-purple-50 border-purple-500' : ''}
              >
                Custom Palette
              </Button>
              
              {showCustomPalette && (
                <div className="mt-2 flex gap-2">
                  {customColors.map((color, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => updateCustomColor(idx, e.target.value)}
                        className="w-12 h-12 rounded border"
                      />
                      <span className="text-xs text-center">{color}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Generate Preview Button */}
          <Button
            onClick={generatePreview}
            disabled={isGenerating || !config.label.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Preview...</>
            ) : (
              <><Eye className="h-4 w-4 mr-2" /> Generate Preview</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Asset Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Emblem */}
              <div className="text-center space-y-2">
                <Label>Emblem (512x512)</Label>
                <div className="border rounded-lg p-4 bg-checkered">
                  <img
                    src={preview.emblem_url || ''}
                    alt="Team Emblem"
                    className="w-32 h-32 mx-auto object-contain"
                  />
                </div>
              </div>
              
              {/* Avatar */}
              <div className="text-center space-y-2">
                <Label>Avatar (256x256)</Label>
                <div className="border rounded-lg p-4 bg-checkered">
                  <img
                    src={preview.avatar_url || ''}
                    alt="Team Avatar"
                    className="w-24 h-24 mx-auto object-contain"
                  />
                </div>
              </div>
              
              {/* Banner */}
              <div className="text-center space-y-2">
                <Label>Banner (1600x900)</Label>
                <div className="border rounded-lg p-4 bg-checkered">
                  <img
                    src={preview.banner_url || ''}
                    alt="Team Banner"
                    className="w-full h-16 object-cover rounded"
                  />
                </div>
              </div>
            </div>
            
            {/* Config Summary */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">Motif: {config.motif}</Badge>
              <Badge variant="outline">Style: {config.preset}</Badge>
              <Badge variant="outline">Colors: {config.palette.length}</Badge>
            </div>
            
            {/* Confirm Generation */}
            <Button
              onClick={confirmGeneration}
              disabled={isConfirming}
              className="w-full"
              size="lg"
            >
              {isConfirming ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Final Assets...</>
              ) : (
                <>Confirm & Generate Final Assets (1 Credit)</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Credits Info */}
      {credits > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              Credits used this session: <Badge variant="secondary">{credits}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
