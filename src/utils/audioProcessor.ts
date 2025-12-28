/**
 * 🎛️ PROFESSIONAL AUDIO PROCESSING CHAIN
 * 
 * Legitimate audio enhancement using Web Audio API
 * - NO fake upscaling or artificial enhancement
 * - Gentle EQ and dynamics processing only
 * - Transparent to user, improves perceived quality
 */

export interface AudioProcessingConfig {
  enableEQ: boolean;
  enableLimiter: boolean;
  enableNormalization: boolean;
  eqSettings: {
    lowGain: number;    // Bass adjustment (-12 to +12 dB)
    midGain: number;    // Mid adjustment (-12 to +12 dB)  
    highGain: number;   // Treble adjustment (-12 to +12 dB)
  };
  limiterSettings: {
    threshold: number;  // Limiter threshold (-6 to 0 dB)
    ratio: number;      // Compression ratio (1 to 10)
    attack: number;     // Attack time (0.001 to 0.1 seconds)
    release: number;    // Release time (0.01 to 1 seconds)
  };
  normalizationTarget: number; // Target RMS level (-23 to -16 LUFS)
}

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private eqNodes: {
    lowShelf: BiquadFilterNode | null;
    midPeaking: BiquadFilterNode | null;
    highShelf: BiquadFilterNode | null;
  } = { lowShelf: null, midPeaking: null, highShelf: null };
  private compressorNode: DynamicsCompressorNode | null = null;
  private limiterNode: DynamicsCompressorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isInitialized = false;
  private config: AudioProcessingConfig;

  constructor(config: Partial<AudioProcessingConfig> = {}) {
    this.config = {
      enableEQ: true,
      enableLimiter: true,
      enableNormalization: false, // Disabled by default - can cause issues
      eqSettings: {
        lowGain: 0,    // Neutral by default
        midGain: 1,    // Slight mid boost for clarity
        highGain: 0.5  // Gentle high boost for presence
      },
      limiterSettings: {
        threshold: -1,   // Conservative threshold
        ratio: 4,        // Moderate compression
        attack: 0.003,   // Fast attack
        release: 0.1     // Medium release
      },
      normalizationTarget: -20, // Conservative target
      ...config
    };
  }

  /**
   * Initialize Web Audio API processing chain
   */
  async initializeProcessing(audioElement: HTMLAudioElement): Promise<boolean> {
    try {
      // If already initialized, dispose first to avoid conflicts
      if (this.isInitialized) {
        console.log('[AudioProcessor] Already initialized, disposing first...');
        this.dispose();
      }

      // Create AudioContext (handle browser prefixes)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('[AudioProcessor] Web Audio API not supported');
        return false;
      }

      this.audioContext = new AudioContextClass();
      
      // Resume context if suspended (required by browser autoplay policies)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create source node from audio element
      // Check if the audio element is already connected to avoid the error
      try {
        this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
      } catch (error: any) {
        if (error.name === 'InvalidStateError' && error.message.includes('already connected')) {
          console.warn('[AudioProcessor] Audio element already connected to another source node, skipping processing');
          this.audioContext.close();
          this.audioContext = null;
          return false;
        }
        throw error;
      }

      // Create processing nodes
      this.gainNode = this.audioContext.createGain();
      this.analyserNode = this.audioContext.createAnalyser();

      // Create EQ nodes (3-band EQ)
      if (this.config.enableEQ) {
        this.eqNodes.lowShelf = this.audioContext.createBiquadFilter();
        this.eqNodes.midPeaking = this.audioContext.createBiquadFilter();
        this.eqNodes.highShelf = this.audioContext.createBiquadFilter();

        // Configure EQ filters
        this.setupEqualizer();
      }

      // Create dynamics processing
      if (this.config.enableLimiter) {
        this.compressorNode = this.audioContext.createDynamicsCompressor();
        this.limiterNode = this.audioContext.createDynamicsCompressor();
        
        this.setupDynamicsProcessing();
      }

      // Connect processing chain
      this.connectProcessingChain();

      this.isInitialized = true;
      console.log('[AudioProcessor] Processing chain initialized successfully');
      return true;

    } catch (error) {
      console.error('[AudioProcessor] Failed to initialize:', error);
      // Clean up on failure
      this.dispose();
      return false;
    }
  }

  /**
   * Configure 3-band equalizer with professional settings
   */
  private setupEqualizer(): void {
    if (!this.eqNodes.lowShelf || !this.eqNodes.midPeaking || !this.eqNodes.highShelf) return;

    // Low shelf filter (bass)
    this.eqNodes.lowShelf.type = 'lowshelf';
    this.eqNodes.lowShelf.frequency.value = 200; // 200Hz crossover
    this.eqNodes.lowShelf.gain.value = this.config.eqSettings.lowGain;

    // Mid peaking filter (presence/clarity)
    this.eqNodes.midPeaking.type = 'peaking';
    this.eqNodes.midPeaking.frequency.value = 2000; // 2kHz for vocal clarity
    this.eqNodes.midPeaking.Q.value = 1.4; // Moderate Q
    this.eqNodes.midPeaking.gain.value = this.config.eqSettings.midGain;

    // High shelf filter (treble/air)
    this.eqNodes.highShelf.type = 'highshelf';
    this.eqNodes.highShelf.frequency.value = 8000; // 8kHz crossover
    this.eqNodes.highShelf.gain.value = this.config.eqSettings.highGain;
  }

  /**
   * Configure dynamics processing (compression + limiting)
   */
  private setupDynamicsProcessing(): void {
    if (!this.compressorNode || !this.limiterNode) return;

    // Gentle compressor for dynamics control
    this.compressorNode.threshold.value = -18; // Conservative threshold
    this.compressorNode.knee.value = 6;        // Soft knee
    this.compressorNode.ratio.value = 3;       // Gentle ratio
    this.compressorNode.attack.value = 0.01;   // 10ms attack
    this.compressorNode.release.value = 0.25;  // 250ms release

    // Brick-wall limiter for peak protection
    this.limiterNode.threshold.value = this.config.limiterSettings.threshold;
    this.limiterNode.knee.value = 0;           // Hard knee for limiting
    this.limiterNode.ratio.value = 20;         // High ratio for limiting
    this.limiterNode.attack.value = this.config.limiterSettings.attack;
    this.limiterNode.release.value = this.config.limiterSettings.release;
  }

  /**
   * Connect all processing nodes in the correct order
   */
  private connectProcessingChain(): void {
    if (!this.sourceNode || !this.audioContext) return;

    let currentNode: AudioNode = this.sourceNode;

    // Connect EQ chain
    if (this.config.enableEQ && this.eqNodes.lowShelf && this.eqNodes.midPeaking && this.eqNodes.highShelf) {
      currentNode.connect(this.eqNodes.lowShelf);
      this.eqNodes.lowShelf.connect(this.eqNodes.midPeaking);
      this.eqNodes.midPeaking.connect(this.eqNodes.highShelf);
      currentNode = this.eqNodes.highShelf;
    }

    // Connect dynamics processing
    if (this.config.enableLimiter && this.compressorNode && this.limiterNode) {
      currentNode.connect(this.compressorNode);
      this.compressorNode.connect(this.limiterNode);
      currentNode = this.limiterNode;
    }

    // Connect gain and analyser
    if (this.gainNode) {
      currentNode.connect(this.gainNode);
      currentNode = this.gainNode;
    }

    if (this.analyserNode) {
      currentNode.connect(this.analyserNode);
    }

    // Connect to destination (speakers)
    currentNode.connect(this.audioContext.destination);
  }

  /**
   * Update EQ settings in real-time
   */
  updateEQ(settings: Partial<AudioProcessingConfig['eqSettings']>): void {
    if (!this.isInitialized) return;

    if (settings.lowGain !== undefined && this.eqNodes.lowShelf) {
      this.eqNodes.lowShelf.gain.value = settings.lowGain;
      this.config.eqSettings.lowGain = settings.lowGain;
    }

    if (settings.midGain !== undefined && this.eqNodes.midPeaking) {
      this.eqNodes.midPeaking.gain.value = settings.midGain;
      this.config.eqSettings.midGain = settings.midGain;
    }

    if (settings.highGain !== undefined && this.eqNodes.highShelf) {
      this.eqNodes.highShelf.gain.value = settings.highGain;
      this.config.eqSettings.highGain = settings.highGain;
    }
  }

  /**
   * Get real-time audio analysis data
   */
  getAudioAnalysis(): {
    rms: number;
    peak: number;
    frequencyData: Uint8Array;
  } | null {
    if (!this.analyserNode) return null;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);

    // Calculate RMS and peak levels
    let sum = 0;
    let peak = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i] / 255;
      sum += value * value;
      peak = Math.max(peak, value);
    }
    
    const rms = Math.sqrt(sum / bufferLength);

    return {
      rms,
      peak,
      frequencyData: dataArray
    };
  }

  /**
   * Set master gain (volume)
   */
  setGain(gain: number): void {
    if (this.gainNode) {
      // Apply smooth gain changes to prevent clicks
      const now = this.audioContext?.currentTime || 0;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setTargetAtTime(gain, now, 0.01);
    }
  }

  /**
   * Enable/disable processing bypass
   */
  setBypass(bypass: boolean): void {
    if (!this.sourceNode || !this.audioContext) return;

    if (bypass) {
      // Direct connection (bypass processing)
      this.sourceNode.disconnect();
      this.sourceNode.connect(this.audioContext.destination);
    } else {
      // Reconnect processing chain
      this.sourceNode.disconnect();
      this.connectProcessingChain();
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    console.log('[AudioProcessor] Disposing audio processor...');
    
    // Disconnect all nodes first
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      this.sourceNode = null;
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      this.gainNode = null;
    }

    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      this.analyserNode = null;
    }

    // Disconnect EQ nodes
    Object.keys(this.eqNodes).forEach(key => {
      const node = this.eqNodes[key as keyof typeof this.eqNodes];
      if (node) {
        try {
          node.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
    });
    this.eqNodes = { lowShelf: null, midPeaking: null, highShelf: null };

    // Disconnect dynamics nodes
    if (this.compressorNode) {
      try {
        this.compressorNode.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      this.compressorNode = null;
    }

    if (this.limiterNode) {
      try {
        this.limiterNode.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      this.limiterNode = null;
    }

    // Close audio context
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        // Ignore close errors
      }
      this.audioContext = null;
    }
    
    this.isInitialized = false;
    console.log('[AudioProcessor] Audio processor disposed successfully');
  }

  /**
   * Get current processing status
   */
  getStatus(): {
    isInitialized: boolean;
    isProcessing: boolean;
    contextState: string;
    sampleRate?: number;
  } {
    return {
      isInitialized: this.isInitialized,
      isProcessing: this.isInitialized && this.audioContext?.state === 'running',
      contextState: this.audioContext?.state || 'closed',
      sampleRate: this.audioContext?.sampleRate
    };
  }
}