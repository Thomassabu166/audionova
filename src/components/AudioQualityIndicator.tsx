/**
 * 🎵 HONEST AUDIO QUALITY INDICATOR
 * 
 * Displays actual audio quality information without misleading users
 * Shows source quality, processing status, and format information
 */

import React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Info, Zap, ZapOff } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { getQualityDescription } from '../utils/audioSourceOptimizer';

interface AudioQualityIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const AudioQualityIndicator: React.FC<AudioQualityIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const { 
    currentAudioInfo, 
    audioProcessingEnabled, 
    setAudioProcessingEnabled,
    audioProcessor 
  } = useMusic();

  if (!currentAudioInfo) {
    return null;
  }

  const qualityDescription = getQualityDescription(
    currentAudioInfo.detectedQuality,
    currentAudioInfo.detectedBitrate
  );

  const processingStatus = audioProcessor?.getStatus();

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-orange-500/10 text-orange-700 border-orange-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  if (!showDetails) {
    // Simple badge version
    return (
      <Badge 
        variant="outline" 
        className={`${getQualityColor(currentAudioInfo.detectedQuality)} ${className}`}
      >
        {qualityDescription}
      </Badge>
    );
  }

  // Detailed popover version
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-2 ${className}`}
        >
          <Badge 
            variant="outline" 
            className={getQualityColor(currentAudioInfo.detectedQuality)}
          >
            {qualityDescription}
          </Badge>
          <Info className="w-3 h-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Audio Quality Information</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source Quality:</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getQualityColor(currentAudioInfo.detectedQuality)}`}
                >
                  {currentAudioInfo.detectedQuality}
                </Badge>
              </div>
              
              {currentAudioInfo.detectedBitrate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bitrate:</span>
                  <span>{currentAudioInfo.detectedBitrate}kbps</span>
                </div>
              )}
              
              {currentAudioInfo.detectedFormat && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="uppercase">{currentAudioInfo.detectedFormat}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Options:</span>
                <span>{currentAudioInfo.availableQualities.length}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Audio Enhancement</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAudioProcessingEnabled(!audioProcessingEnabled)}
                className="gap-2"
              >
                {audioProcessingEnabled ? (
                  <>
                    <Zap className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">ON</span>
                  </>
                ) : (
                  <>
                    <ZapOff className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">OFF</span>
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Gentle EQ for clarity</p>
              <p>• Soft limiting for consistency</p>
              <p>• No artificial upscaling</p>
            </div>

            {processingStatus && (
              <div className="mt-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing:</span>
                  <span className={processingStatus.isProcessing ? 'text-green-600' : 'text-gray-500'}>
                    {processingStatus.isProcessing ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {processingStatus.sampleRate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sample Rate:</span>
                    <span>{processingStatus.sampleRate}Hz</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Quality is limited by the source audio from JioSaavn. 
              Enhancement improves clarity without fake upscaling.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AudioQualityIndicator;