/**
 * Voice Synthesis (TTS), Voice Recognition (STT), and Runtime Permissions Utility
 * Designed for cross-platform compatibility across Web, Android WebView (APK), and Windows Desktop (EXE).
 */

export interface VoiceOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

/**
 * Strips markdown symbols, asterisks, hashtags, bullets, tables, emojis, and formatting for clear Arabic speech.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Remove markdown code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown headings like #, ##, ###
    .replace(/^[ \t]*#+[ \t]+/gm, '')
    // Remove bold and italic markers like ***text***, **text**, *text*, ___text___, __text__, _text_
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/___([^_]+)___/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove markdown links [text](url) -> keep text only
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove strikethroughs ~~text~~
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove table separators and pipes | --- |
    .replace(/\|[-:\s|]+\|/g, ' ')
    .replace(/\|/g, ' ')
    // Remove blockquotes >
    .replace(/^[ \t]*>[ \t]*/gm, '')
    // Remove bullet characters (*, -, +, •) at line beginnings
    .replace(/^[ \t]*[-*+•][ \t]+/gm, '')
    // Remove numbered list prefixes like 1. or 2)
    .replace(/^[ \t]*\d+[\.\)][ \t]+/gm, '')
    // Remove remaining markdown / decorative characters
    .replace(/[*#_`~>•\\^{}]/g, ' ')
    // Remove emojis and unicode pictorial symbols for natural Arabic speech
    .replace(
      /[\u{1F300}-\u{1FAD6}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2300}-\u{23FF}\u{2B50}\u{FE00}-\u{FE0F}]/gu,
      ' '
    )
    // Replace multiple spaces and newlines with natural sentence pauses
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\.{2,}/g, '.')
    .trim();
}

/**
 * Checks if Speech Synthesis (TTS) is supported.
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

// Voice cache for asynchronous getVoices in Chrome / Android WebView
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const initVoices = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    } catch (e) {}
  };
  initVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = initVoices;
  }
}

/**
 * Finds the best Arabic voice, prioritizing Saudi Arabic (ar-SA) as requested.
 */
export function getBestArabicVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices() || [];

  // 1. Exact Saudi Arabic ar-SA
  const saudiVoice = voices.find(
    (v) => v.lang === 'ar-SA' || v.lang === 'ar_SA' || v.lang.toLowerCase().includes('sa')
  );
  if (saudiVoice) return saudiVoice;

  // 2. Any Arabic dialect (ar-YE, ar-EG, ar-XA, etc.)
  const anyArabic = voices.find(
    (v) => v.lang.toLowerCase().startsWith('ar') || v.name.toLowerCase().includes('arabic')
  );
  if (anyArabic) return anyArabic;

  return null;
}

/**
 * Splits text into natural sentence chunks to prevent Android WebView 200-character timeout bugs.
 */
export function splitIntoSentences(text: string, maxLen = 160): string[] {
  if (!text) return [];
  if (text.length <= maxLen) return [text];

  const rawParts = text.split(/(?<=[.!؟؛\n])\s+/);
  const chunks: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxLen) {
      chunks.push(trimmed);
    } else {
      const subParts = trimmed.split(/(?<=[،,])\s+/);
      let currentChunk = '';
      for (const sp of subParts) {
        const candidate = (currentChunk + ' ' + sp).trim();
        if (candidate.length <= maxLen) {
          currentChunk = candidate;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          if (sp.length <= maxLen) {
            currentChunk = sp.trim();
          } else {
            const words = sp.split(/\s+/);
            let wChunk = '';
            for (const w of words) {
              if ((wChunk + ' ' + w).trim().length <= maxLen) {
                wChunk = (wChunk + ' ' + w).trim();
              } else {
                if (wChunk) chunks.push(wChunk);
                wChunk = w;
              }
            }
            if (wChunk) currentChunk = wChunk;
          }
        }
      }
      if (currentChunk) chunks.push(currentChunk);
    }
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Unlocks audio playback and SpeechSynthesis across Web and Android WebView (Capacitor / APK).
 * Must be invoked during a direct user gesture (e.g. clicking mic button or send button).
 */
export function unlockAudioAndSpeechSynthesis(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Resume SpeechSynthesis if paused
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();

      // Silent utterance during user gesture unlocks media playback restrictions
      const warmUp = new SpeechSynthesisUtterance('');
      warmUp.volume = 0;
      warmUp.rate = 10;
      warmUp.lang = 'ar-SA';
      window.speechSynthesis.speak(warmUp);
    }

    // 2. Unlock Web Audio Context for Capacitor / Android WebView
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      if (!(window as any).__sharedAudioCtx) {
        (window as any).__sharedAudioCtx = new AudioCtx();
      }
      const ctx = (window as any).__sharedAudioCtx;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Audio/TTS unlock warning:', err);
  }
}

// Active HTML5 Audio element for fallback
let currentAudioElement: HTMLAudioElement | null = null;

/**
 * Checks if native Android TextToSpeech is available via Capacitor JavascriptInterface.
 */
export function isAndroidNativeTTSAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).AndroidNativeTTS?.isAvailable?.());
}

/**
 * Plays high-precision tactile sound chimes for hands-free state confirmation.
 */
export function playVoiceChime(type: 'prepared' | 'success' | 'cancel' | 'switch' | 'listening'): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!(window as any).__sharedAudioCtx) {
      (window as any).__sharedAudioCtx = new AudioCtx();
    }
    const ctx = (window as any).__sharedAudioCtx;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'prepared') {
      // Crisp 2-tone chime: D5 (587Hz) -> A5 (880Hz) indicating item is prepared on screen
      osc.frequency.setValueAtTime(587, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'success') {
      // Cheerful 3-tone arpeggio: C5 (523Hz) -> E5 (659Hz) -> G5 (783Hz) for successful save
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.08);
      osc.frequency.setValueAtTime(783, now + 0.16);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.46);
    } else if (type === 'cancel') {
      // Descending tone: 440Hz -> 280Hz for discard/cancel
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.start(now);
      osc.stop(now + 0.27);
    } else if (type === 'switch') {
      // Quick double pip: 660Hz -> 820Hz for section switch
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.08);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.23);
    } else if (type === 'listening') {
      // Soft ping: 880Hz
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.19);
    }
  } catch (e) {
    // Graceful fallback
  }
}

/**
 * Fallback audio stream playback via /api/tts using HTML5 Audio element.
 * Completely bypasses mobile WebView / browser speech synthesis limitations.
 */
export function playAudioTts(text: string, options: VoiceOptions = {}): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const cleaned = cleanTextForSpeech(text).slice(0, 260);
    if (!cleaned) return false;

    if (currentAudioElement) {
      try {
        currentAudioElement.pause();
        currentAudioElement = null;
      } catch (e) {}
    }

    const audioUrl = `/api/tts?text=${encodeURIComponent(cleaned)}&lang=ar`;
    const audio = new Audio(audioUrl);
    currentAudioElement = audio;
    audio.volume = options.volume ?? 1.0;

    audio.onplay = () => {
      options.onStart?.();
    };

    audio.onended = () => {
      if (currentAudioElement === audio) {
        currentAudioElement = null;
      }
      options.onEnd?.();
    };

    audio.onerror = (err) => {
      if (currentAudioElement === audio) {
        currentAudioElement = null;
      }
      console.warn('Audio TTS stream error:', err);
      options.onError?.(err);
    };

    audio.play().catch((err) => {
      console.warn('Audio TTS play failed:', err);
      options.onError?.(err);
    });

    return true;
  } catch (e) {
    options.onError?.(e);
    return false;
  }
}

/**
 * Speaks text out loud in Arabic using:
 * 1. Native Android TTS (in Capacitor Android APK)
 * 2. Web Speech Synthesis (in Chrome / Safari / Electron / Desktop)
 * 3. High-fidelity Audio stream fallback (/api/tts)
 */
export function speakArabic(text: string, options: VoiceOptions = {}): boolean {
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return false;

  // Stop any active speech before starting
  stopSpeaking();

  // 1. Android Native TextToSpeech in APK
  if (isAndroidNativeTTSAvailable()) {
    try {
      const uttId = 'utt_' + Date.now();
      const onEnd = (e: any) => {
        if (!e.detail?.id || e.detail.id === uttId) {
          window.removeEventListener('nativeTtsEnd', onEnd);
          window.removeEventListener('nativeTtsError', onError);
          options.onEnd?.();
        }
      };
      const onError = (e: any) => {
        if (!e.detail?.id || e.detail.id === uttId) {
          window.removeEventListener('nativeTtsEnd', onEnd);
          window.removeEventListener('nativeTtsError', onError);
          playAudioTts(cleaned, options);
        }
      };
      window.addEventListener('nativeTtsEnd', onEnd);
      window.addEventListener('nativeTtsError', onError);

      (window as any).AndroidNativeTTS.speak(cleaned, uttId);
      options.onStart?.();
      return true;
    } catch (err) {
      console.warn('Native Android TTS error, using fallback:', err);
    }
  }

  // 2. Web Speech Synthesis
  if (isSpeechSynthesisSupported()) {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const chunks = splitIntoSentences(cleaned, 160);
      if (chunks.length === 0) return false;

      const arabicVoice = getBestArabicVoice();
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      // On Android mobile web where voices list is empty, fallback to audio stream
      if (isMobile && (!cachedVoices || cachedVoices.length === 0)) {
        return playAudioTts(cleaned, options);
      }

      const utterances: SpeechSynthesisUtterance[] = chunks.map((chunk, idx) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = 'ar-SA';
        utterance.rate = options.rate ?? 1.0;
        utterance.pitch = options.pitch ?? 1.0;
        utterance.volume = options.volume ?? 1.0;

        if (arabicVoice) {
          utterance.voice = arabicVoice;
        }

        if (idx === 0 && options.onStart) {
          utterance.onstart = options.onStart;
        }

        if (idx === chunks.length - 1) {
          utterance.onend = () => {
            (window as any).__activeUtterances = null;
            if (options.onEnd) options.onEnd();
          };
        }

        utterance.onerror = (err) => {
          (window as any).__activeUtterances = null;
          console.warn('SpeechSynthesis error, triggering audio fallback:', err);
          playAudioTts(cleaned, options);
        };

        return utterance;
      });

      (window as any).__activeUtterances = utterances;

      setTimeout(() => {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          for (const utt of utterances) {
            window.speechSynthesis.speak(utt);
          }
        } catch (playErr) {
          playAudioTts(cleaned, options);
        }
      }, 25);

      return true;
    } catch (err) {
      return playAudioTts(cleaned, options);
    }
  }

  // 3. Audio stream fallback
  return playAudioTts(cleaned, options);
}

/**
 * Stops any active speech synthesis across all tiers (Native TTS, Web Speech, and Audio).
 */
export function stopSpeaking(): void {
  // 1. Android Native TTS
  if (isAndroidNativeTTSAvailable()) {
    try {
      (window as any).AndroidNativeTTS.stop();
    } catch (e) {}
  }

  // 2. Web Speech Synthesis
  if (isSpeechSynthesisSupported()) {
    try {
      (window as any).__activeUtterances = null;
      window.speechSynthesis.cancel();
    } catch (e) {}
  }

  // 3. HTML5 Audio Element
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
      currentAudioElement = null;
    } catch (e) {}
  }
}

/**
 * Checks if Speech Recognition (STT) is supported.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Creates and configures a SpeechRecognition instance for Arabic with multi-locale fallback (ar-YE -> ar-SA -> ar).
 */
export function createSpeechRecognizer(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (err: any) => void,
  onEnd: () => void,
  langPreference: string = 'ar-YE'
): any {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  try {
    const recognition = new SpeechRecognition();

    // Prefer Yemeni or Saudi Arabic dialect which Android Speech Services support best
    recognition.lang = langPreference || 'ar-YE';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      const isFinal = Boolean(finalTranscript);
      if (text) {
        onResult(text, isFinal);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error:', event.error, event);
      onError(event);
    };

    recognition.onend = onEnd;

    return recognition;
  } catch (err) {
    console.error('Failed to instantiate SpeechRecognition:', err);
    return null;
  }
}

export interface ContinuousVoiceSessionController {
  start: () => boolean;
  stop: () => void;
  pauseForSpeech: () => void;
  resumeAfterSpeech: () => void;
  isActive: () => boolean;
}

/**
 * Creates an uninterrupted, self-healing continuous audio session for Hands-Free voice input.
 * Automatically keeps microphone active, handles Android WebView lifecycles, and silences itself during speech.
 */
export function createContinuousVoiceSession(callbacks: {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (err: any) => void;
  onStateChange: (state: 'listening' | 'speaking' | 'paused' | 'stopped') => void;
  langPreference?: string;
}): ContinuousVoiceSessionController {
  let isSessionActive = false;
  let isPausedForSpeech = false;
  let activeRecognizer: any = null;
  let restartTimeout: any = null;

  const initRecognizer = () => {
    if (!isSessionActive || isPausedForSpeech) return;

    try {
      if (activeRecognizer) {
        try {
          activeRecognizer.onend = null;
          activeRecognizer.onerror = null;
          activeRecognizer.stop();
        } catch (e) {}
        activeRecognizer = null;
      }

      const recognizer = createSpeechRecognizer(
        (transcript, isFinal) => {
          if (!isSessionActive || isPausedForSpeech) return;
          callbacks.onTranscript(transcript, isFinal);
        },
        (err) => {
          const errCode = err?.error || '';
          if (errCode === 'no-speech') {
            // Normal silence period in continuous room audio
            return;
          }
          if (errCode === 'aborted') {
            // Speech recognition stopped intentionally
            return;
          }
          if (errCode === 'not-allowed') {
            callbacks.onError(err);
            isSessionActive = false;
            callbacks.onStateChange('stopped');
            return;
          }
          callbacks.onError(err);
        },
        () => {
          // OnEnd fired: auto-resume with stable debounce if session is active
          if (isSessionActive && !isPausedForSpeech) {
            if (restartTimeout) clearTimeout(restartTimeout);
            restartTimeout = setTimeout(() => {
              if (isSessionActive && !isPausedForSpeech) {
                initRecognizer();
              }
            }, 250);
          }
        },
        callbacks.langPreference || 'ar-YE'
      );

      if (recognizer) {
        activeRecognizer = recognizer;
        recognizer.start();
        callbacks.onStateChange('listening');
      }
    } catch (e) {
      console.warn('Failed to start continuous recognizer loop:', e);
      if (isSessionActive && !isPausedForSpeech) {
        if (restartTimeout) clearTimeout(restartTimeout);
        restartTimeout = setTimeout(() => {
          if (isSessionActive && !isPausedForSpeech) initRecognizer();
        }, 300);
      }
    }
  };

  return {
    start: () => {
      unlockAudioAndSpeechSynthesis();
      isSessionActive = true;
      isPausedForSpeech = false;
      initRecognizer();
      return true;
    },
    stop: () => {
      isSessionActive = false;
      isPausedForSpeech = false;
      if (restartTimeout) clearTimeout(restartTimeout);
      if (activeRecognizer) {
        try {
          activeRecognizer.onend = null;
          activeRecognizer.onerror = null;
          activeRecognizer.stop();
        } catch (e) {}
        activeRecognizer = null;
      }
      callbacks.onStateChange('stopped');
    },
    pauseForSpeech: () => {
      isPausedForSpeech = true;
      callbacks.onStateChange('speaking');
      if (activeRecognizer) {
        try {
          activeRecognizer.stop();
        } catch (e) {}
      }
    },
    resumeAfterSpeech: () => {
      if (!isSessionActive) return;
      isPausedForSpeech = false;
      callbacks.onStateChange('listening');
      if (restartTimeout) clearTimeout(restartTimeout);
      restartTimeout = setTimeout(() => {
        if (isSessionActive && !isPausedForSpeech) {
          initRecognizer();
        }
      }, 80);
    },
    isActive: () => isSessionActive,
  };
}

/* =========================================================================
   RUNTIME PERMISSIONS UTILITIES
   ========================================================================= */

export interface PermissionsState {
  microphone: 'granted' | 'denied' | 'prompt' | 'unsupported';
  camera: 'granted' | 'denied' | 'prompt' | 'unsupported';
  notifications: 'granted' | 'denied' | 'default' | 'unsupported';
}

/**
 * Checks current permissions status.
 */
export async function checkAllPermissions(): Promise<PermissionsState> {
  const result: PermissionsState = {
    microphone: 'prompt',
    camera: 'prompt',
    notifications: 'default',
  };

  // Notifications
  if (typeof window !== 'undefined' && 'Notification' in window) {
    result.notifications = Notification.permission;
  } else {
    result.notifications = 'unsupported';
  }

  // Permissions API for Camera / Mic
  if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
    try {
      const mic = await navigator.permissions.query({ name: 'microphone' as any });
      result.microphone = mic.state as any;
    } catch (e) {
      // not supported in all browsers
    }

    try {
      const cam = await navigator.permissions.query({ name: 'camera' as any });
      result.camera = cam.state as any;
    } catch (e) {
      // not supported in all browsers
    }
  }

  return result;
}

/**
 * Requests Microphone Access (for Voice AI Assistant and Voice recognition).
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (err) {
    console.warn('Microphone permission denied or unavailable:', err);
    return false;
  }
}

/**
 * Requests Camera Access (for Barcode & QR Scanner and Live Webcam on Laptops).
 */
export async function requestCameraPermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    let stream: MediaStream;
    try {
      // First try rear camera if available (phones/tablets)
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
    } catch {
      // Fallback for laptops and desktops with standard webcams
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
    }
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (err) {
    console.warn('Camera permission denied or unavailable:', err);
    return false;
  }
}

/**
 * Requests Notification Permission (for inventory alerts & shifts).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return false;
  }
}

/**
 * Auto-request essential runtime permissions on first use or onboarding.
 */
export async function requestEssentialAppPermissions(): Promise<{
  microphone: boolean;
  camera: boolean;
  notifications: boolean;
}> {
  const [mic, cam, notif] = await Promise.allSettled([
    requestMicrophonePermission(),
    requestCameraPermission(),
    requestNotificationPermission(),
  ]);

  return {
    microphone: mic.status === 'fulfilled' ? mic.value : false,
    camera: cam.status === 'fulfilled' ? cam.value : false,
    notifications: notif.status === 'fulfilled' ? notif.value : false,
  };
}
