/**
 * 🧪 AUDIO QUALITY TESTING UTILITIES
 * 
 * Simple utilities to test and verify audio quality features
 */

import { selectOptimalAudioSource } from './audioSourceOptimizer';

/**
 * Test the audio source optimizer with sample JioSaavn data
 */
export function testAudioSourceOptimizer() {
  console.log('🧪 Testing Audio Source Optimizer...');
  
  // Sample JioSaavn downloadUrl data (typical response format)
  const sampleDownloadUrls = [
    { quality: '96kbps', link: 'https://example.com/song_96.mp3' },
    { quality: '160kbps', link: 'https://example.com/song_160.mp3' },
    { quality: '320kbps', link: 'https://example.com/song_320.mp3' }
  ];
  
  const result = selectOptimalAudioSource(sampleDownloadUrls);
  
  console.log('📊 Audio Source Selection Result:', {
    selectedUrl: result.selectedUrl,
    detectedQuality: result.detectedQuality,
    detectedBitrate: result.detectedBitrate,
    availableOptions: result.availableQualities.length
  });
  
  // Verify highest quality was selected
  const expectedHighest = sampleDownloadUrls.find(url => url.quality.includes('320'));
  const isCorrect = result.selectedUrl === expectedHighest?.link;
  
  console.log(isCorrect ? '✅ Test PASSED: Highest quality selected' : '❌ Test FAILED: Wrong quality selected');
  
  return isCorrect;
}

/**
 * Test Web Audio API availability
 */
export function testWebAudioSupport() {
  console.log('🧪 Testing Web Audio API Support...');
  
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const isSupported = !!AudioContextClass;
  
  console.log(isSupported ? '✅ Web Audio API: Supported' : '❌ Web Audio API: Not Supported');
  
  if (isSupported) {
    try {
      const testContext = new AudioContextClass();
      console.log('📊 Audio Context Info:', {
        sampleRate: testContext.sampleRate,
        state: testContext.state,
        maxChannelCount: testContext.destination.maxChannelCount
      });
      testContext.close();
    } catch (error) {
      console.warn('⚠️ Web Audio API available but failed to create context:', error);
    }
  }
  
  return isSupported;
}

/**
 * Run all audio quality tests
 */
export function runAudioQualityTests() {
  console.log('🎵 Running Audio Quality Tests...');
  console.log('================================');
  
  const optimizerTest = testAudioSourceOptimizer();
  const webAudioTest = testWebAudioSupport();
  
  const allPassed = optimizerTest && webAudioTest;
  
  console.log('================================');
  console.log(allPassed ? '🎉 All Audio Tests PASSED' : '⚠️ Some Audio Tests FAILED');
  
  return {
    optimizer: optimizerTest,
    webAudio: webAudioTest,
    allPassed
  };
}