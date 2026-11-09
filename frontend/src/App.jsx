import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Globe, 
  ArrowRightLeft, 
  Mic, 
  MicOff, 
  Volume2, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  Star, 
  Trash2, 
  Search, 
  Sparkles, 
  Send, 
  RotateCcw, 
  SlidersHorizontal, 
  Headphones, 
  FileText, 
  Upload, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut, 
  Moon, 
  Sun, 
  Bell, 
  ChevronDown, 
  CheckCircle2, 
  User, 
  Crown, 
  FileDown, 
  Layers, 
  Play, 
  Pause, 
  X, 
  RefreshCw,
  Zap,
  BookOpen,
  HelpCircle,
  Clock,
  Heart,
  CheckCircle,
  FileCheck,
  SendHorizontal,
  Radio,
  VolumeX,
  Repeat,
  Wifi,
  WifiOff,
  Printer,
  Menu,
  ArrowLeft
} from 'lucide-react';
import { translateOffline, OFFLINE_PHRASEBOOK, OFFLINE_PACKS } from './offlineEngine.js';

const LANGUAGES = {
  auto: "Auto Detect",
  en: "English",
  te: "Telugu (తెలుగు)",
  hi: "Hindi (हिन्दी)",
  ta: "Tamil (தமிழ்)",
  kn: "Kannada (ಕನ್ನಡ)",
  ml: "Malayalam (മലയാളം)",
  mr: "Marathi (मराठी)",
  gu: "Gujarati (ગુજરાતી)",
  bn: "Bengali (বাংলা)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
  ur: "Urdu (اردو)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  de: "German (Deutsch)",
  it: "Italian (Italiano)",
  pt: "Portuguese (Português)",
  ru: "Russian (Русский)",
  ja: "Japanese (日本語)",
  ko: "Korean (한국어)",
  'zh-CN': "Chinese (Simplified)",
  ar: "Arabic (العربية)",
  tr: "Turkish (Türkçe)",
  nl: "Dutch (Nederlands)",
  pl: "Polish (Polski)",
  vi: "Vietnamese (Tiếng Việt)",
  id: "Indonesian (Bahasa)",
  th: "Thai (ไทย)",
  sv: "Swedish (Svenska)",
  el: "Greek (Ελληνικά)"
};

const SPEECH_LANGS = {
  te: { code: 'te-IN', name: 'Telugu (తెలుగు)', flag: '🇮🇳' },
  hi: { code: 'hi-IN', name: 'Hindi (हिन्दी)', flag: '🇮🇳' },
  en: { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  ta: { code: 'ta-IN', name: 'Tamil (தமிழ்)', flag: '🇮🇳' },
  kn: { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳' },
  ml: { code: 'ml-IN', name: 'Malayalam (മലയാളം)', flag: '🇮🇳' },
  mr: { code: 'mr-IN', name: 'Marathi (मराठी)', flag: '🇮🇳' },
  gu: { code: 'gu-IN', name: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
  bn: { code: 'bn-IN', name: 'Bengali (বাংলা)', flag: '🇮🇳' },
  pa: { code: 'pa-IN', name: 'Punjabi (ਪੰਜਾਬੀ)', flag: '🇮🇳' },
  ur: { code: 'ur-IN', name: 'Urdu (اردو)', flag: '🇮🇳' },
  es: { code: 'es-ES', name: 'Spanish (Español)', flag: '🇪🇸' },
  fr: { code: 'fr-FR', name: 'French (Français)', flag: '🇫🇷' },
  de: { code: 'de-DE', name: 'German (Deutsch)', flag: '🇩🇪' },
  it: { code: 'it-IT', name: 'Italian (Italiano)', flag: '🇮🇹' },
  pt: { code: 'pt-BR', name: 'Portuguese (Português)', flag: '🇧🇷' },
  ru: { code: 'ru-RU', name: 'Russian (Русский)', flag: '🇷🇺' },
  ja: { code: 'ja-JP', name: 'Japanese (日本語)', flag: '🇯🇵' },
  ko: { code: 'ko-KR', name: 'Korean (한국어)', flag: '🇰🇷' },
  'zh-CN': { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  ar: { code: 'ar-SA', name: 'Arabic (العربية)', flag: '🇸🇦' },
  tr: { code: 'tr-TR', name: 'Turkish (Türkçe)', flag: '🇹🇷' },
  nl: { code: 'nl-NL', name: 'Dutch (Nederlands)', flag: '🇳🇱' },
  pl: { code: 'pl-PL', name: 'Polish (Polski)', flag: '🇵🇱' },
  vi: { code: 'vi-VN', name: 'Vietnamese (Tiếng Việt)', flag: '🇻🇳' },
  id: { code: 'id-ID', name: 'Indonesian (Bahasa)', flag: '🇮🇩' },
  th: { code: 'th-TH', name: 'Thai (ไทย)', flag: '🇹🇭' },
  sv: { code: 'sv-SE', name: 'Swedish (Svenska)', flag: '🇸🇪' },
  el: { code: 'el-GR', name: 'Greek (Ελληνικά)', flag: '🇬🇷' }
};

const POPULAR_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
];

const SCENARIOS = [
  { id: 'general', label: 'General Talk', icon: '🌐', desc: 'Everyday casual & polite conversation' },
  { id: 'doctor', label: 'Doctor Visit', icon: '🏥', desc: 'Medical consult, pain, symptoms & tests' },
  { id: 'travel', label: 'Transit & Travel', icon: '🚉', desc: 'Railway, bus station, platforms & fares' },
  { id: 'emergency', label: 'Emergency SOS', icon: '🚨', desc: 'Urgent medical, police & critical help' },
  { id: 'interview', label: 'Job Interview', icon: '💼', desc: 'Professional experience, roles & skills' },
  { id: 'shopping', label: 'Bargain & Shop', icon: '🛍️', desc: 'Pricing, sizes, discounts & payment' }
];

export default function App() {
  // 3-Stage Experience:
  // Page 1: Splash (showSplash = true for 2.0s, NO button, auto-transitions)
  // Page 2: Main Standalone Live Translator (currentStage = 'translator')
  // Page 3: Full EchoBridge AI Workspace with Sidebar (currentStage = 'workspace')
  const [currentStage, setCurrentStage] = useState('translator');
  const [showSplash, setShowSplash] = useState(true);
  const [activeNav, setActiveNav] = useState('live-interpreter');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Page 1 Splash Screen: 2-second automatic transition to Page 2
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 🎭 Scenario Preset State (Feature 4: Doctor, Travel, Emergency, Interview, Shopping)
  const [selectedScenario, setSelectedScenario] = useState('general');

  // 🔀 Code-Mixed Language State (Feature 3: Tenglish, Hinglish, Tanglish)
  const [codeMixedInfo, setCodeMixedInfo] = useState({ isCodeMixed: false, type: null });

  // 👑 Cultural & Politeness Coach State (Feature 5: Honorifics & respectful address)
  const [politenessInfo, setPolitenessInfo] = useState({ flag: false, tip: null, suggestion: null });

  // 🌐 Automatic Two-Way Language Detection (Feature 2: Drop manual language selection)
  const [autoTwoWayDetect, setAutoTwoWayDetect] = useState(true);

  // 🎯 Pronunciation Practice State (Feature 6: Coach & scoring)
  const [showPronounceModal, setShowPronounceModal] = useState(false);
  const [pronounceResult, setPronounceResult] = useState(null);
  const [isPronouncing, setIsPronouncing] = useState(false);

  // 📄 Shareable & Printable Transcript Modal State (Feature 8)
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  // 📴 Offline Mode & Network Sensing State
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [forceOfflineMode, setForceOfflineMode] = useState(false);
  const isEffectivelyOffline = !isOnline || forceOfflineMode;
  const [offlineCategory, setOfflineCategory] = useState('All');
  const [offlineSearch, setOfflineSearch] = useState('');

  // Translation State
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [detectedLangName, setDetectedLangName] = useState('Auto Detect');
  const [detectedCode, setDetectedCode] = useState('auto');
  const [transliteratedScript, setTransliteratedScript] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);

  // Voice Input Specific State
  const [voiceLang, setVoiceLang] = useState('te');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoiceStudio, setShowVoiceStudio] = useState(false);
  const [speechInterim, setSpeechInterim] = useState('');

  // 🎙️ LIVE INTERPRETER & SMART SPEAKER STATE (Hands-free Continuous Auto-Listen)
  const [speakerInputLang, setSpeakerInputLang] = useState('te');
  const [speakerTargetLang, setSpeakerTargetLang] = useState('hi');
  const [speakerHeardText, setSpeakerHeardText] = useState('మీరు ఎలా ఉన్నారు?');
  const [speakerTransScript, setSpeakerTransScript] = useState('మీరు ఎలా ఉన్నారు?');
  const [speakerResponseText, setSpeakerResponseText] = useState('आप कैसे हैं?');
  const [speakerState, setSpeakerState] = useState('idle'); // 'idle' | 'listening' | 'translating' | 'speaking'
  const [speakerContinuous, setSpeakerContinuous] = useState(true);

  // 🔥 Live Continuous Auto-Listen Session State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveInterimText, setLiveInterimText] = useState('');
  const [twoWayAutoSwitch, setTwoWayAutoSwitch] = useState(true);
  const [currentSpeakerTurn, setCurrentSpeakerTurn] = useState('A'); // 'A' (e.g. te) | 'B' (e.g. hi)
  const [liveSessionLog, setLiveSessionLog] = useState([]);

  // AI Features State
  const [selectedTone, setSelectedTone] = useState('default');
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [explanationData, setExplanationData] = useState(null);
  const [alternativesData, setAlternativesData] = useState(null);
  const [grammarData, setGrammarData] = useState(null);
  const [smartReplies, setSmartReplies] = useState([
    { reply: "Hello! Nice to meet you.", tone: "Friendly" },
    { reply: "Hi, how are you doing today?", tone: "Casual" },
    { reply: "Greetings! Hope you have a wonderful day.", tone: "Polite" }
  ]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  // Settings
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // History & Favorites (localStorage)
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('echobridge_history_v3');
      return saved ? JSON.parse(saved) : [
        {
          id: 'sample_1',
          original_text: 'danyavadalu',
          translated_text: 'thank you',
          detected_lang: 'Telugu (తెలుగు)',
          detected_code: 'te',
          target_lang: 'en',
          transliterated_script: 'ధన్యవాదాలు',
          favorite: true,
          time: '11:00 AM',
          timestamp: Date.now() - 3600000
        },
        {
          id: 'sample_2',
          original_text: 'Tinnara?',
          translated_text: 'Did you eat?',
          detected_lang: 'Telugu (తెలుగు)',
          detected_code: 'te',
          target_lang: 'en',
          transliterated_script: 'తిన్నారా?',
          favorite: true,
          time: '10:45 AM',
          timestamp: Date.now() - 7200000
        }
      ];
    } catch {
      return [];
    }
  });

  const [historySearch, setHistorySearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Document Translation State
  const [documentFile, setDocumentFile] = useState(null);
  const [documentResult, setDocumentResult] = useState(null);
  const [isTranslatingDoc, setIsTranslatingDoc] = useState(false);

  // Pro Upgrade & Live DB Analytics State
  const [showProModal, setShowProModal] = useState(false);
  const [dbAnalytics, setDbAnalytics] = useState(null);

  const fetchDbAnalytics = useCallback(async () => {
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/analytics');
      if (resp.ok) {
        const data = await resp.json();
        setDbAnalytics(data);
      }
    } catch (e) {
      console.warn("Analytics fetch error", e);
    }
  }, []);

  useEffect(() => {
    fetchDbAnalytics();
  }, [history, fetchDbAnalytics]);

  // Two-Way Conversation Mode State
  const [conversation, setConversation] = useState([
    { id: 1, speaker: 'A', text: 'Hello, nice to meet you!', lang: 'en', translated: 'హలో, మిమ్మల్ని కలవడం ఆనందంగా ఉంది!' },
    { id: 2, speaker: 'B', text: 'నమస్కారం, మీరు ఎలా ఉన్నారు?', lang: 'te', translated: 'Hello, how are you?' }
  ]);
  const [convSpeakerA_Lang, setConvSpeakerA_Lang] = useState('en');
  const [convSpeakerB_Lang, setConvSpeakerB_Lang] = useState('te');
  const [convInputA, setConvInputA] = useState('');
  const [convInputB, setConvInputB] = useState('');

  // User Profile
  const [userProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    plan: 'Pro Member',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
  });

  const recognitionRef = useRef(null);
  const speakerRecognitionRef = useRef(null);
  const liveRecognitionRef = useRef(null);
  const isLiveActiveRef = useRef(false);
  const twoWayAutoSwitchRef = useRef(true);
  const currentSpeakerTurnRef = useRef('A');
  const liveStatusRef = useRef('idle');
  const abortControllerRef = useRef(null);
  const startLiveTurnRef = useRef(null);
  const accumulatedSpeechRef = useRef('');
  const speechSilenceTimerRef = useRef(null);

  // Sync refs with reactive state
  useEffect(() => {
    isLiveActiveRef.current = isLiveActive;
  }, [isLiveActive]);

  useEffect(() => {
    twoWayAutoSwitchRef.current = twoWayAutoSwitch;
  }, [twoWayAutoSwitch]);

  useEffect(() => {
    currentSpeakerTurnRef.current = currentSpeakerTurn;
  }, [currentSpeakerTurn]);

  // Online / Offline Sensing
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("🌐 Network connection online: Cloud AI active");
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("📴 Network disconnected: Zero-Network Offline Engine active");
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem('echobridge_history_v3', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);

  // Show Toast
  const showToast = (msg, duration = 2500) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, duration);
  };

  // Text-to-Speech Playback with Native Voice Matching & Callback
  const speakText = useCallback((text, langCode, onEndCallback = null) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) {
      if (onEndCallback) onEndCallback();
      return;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    const bcp47 = SPEECH_LANGS[langCode]?.code || (langCode === 'kn' ? 'kn-IN' : langCode === 'te' ? 'te-IN' : langCode === 'hi' ? 'hi-IN' : langCode === 'ta' ? 'ta-IN' : 'en-US');
    utterance.lang = bcp47;
    utterance.rate = speechSpeed || 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const match = voices.find(v => v.lang === bcp47 || v.lang.replace('_', '-') === bcp47 || v.lang.startsWith(langCode));
      if (match) utterance.voice = match;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis playback notice:", e);
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  }, [speechSpeed]);

  // AI Feature: Smart Suggested Replies (Scenario-Aware)
  const fetchSmartReplies = useCallback(async (phrase, targetLangCode, convHistory = null, scenarioOverride = null) => {
    if (!phrase || !phrase.trim()) return;
    setIsLoadingReplies(true);
    const scen = scenarioOverride || selectedScenario;
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/ai/suggest-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: phrase,
          target_lang: targetLangCode || 'en',
          context: convHistory,
          scenario: scen
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.replies && data.replies.length > 0) {
          setSmartReplies(data.replies);
        }
      }
    } catch (e) {
      console.warn("Replies suggestion notice", e);
    } finally {
      setIsLoadingReplies(false);
    }
  }, [selectedScenario]);

  // Instant Smart Translation
  const performTranslation = useCallback(async (text, sl, tl, tone = 'default', saveToHistory = false) => {
    if (!text || !text.trim()) {
      setTranslatedText('');
      setTransliteratedScript(null);
      setIsTranslating(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsTranslating(true);
    const startTime = performance.now();

    // 📴 ZERO-NETWORK OFFLINE CHECK
    if (isEffectivelyOffline) {
      const off = translateOffline(text, sl, tl, history);
      if (off) {
        setTranslatedText(off.translated_text);
        setDetectedLangName(off.detected_lang || 'Offline Local');
        setDetectedCode(sl === 'auto' ? 'te' : sl);
        setTransliteratedScript(null);
        setLatencyMs(0);
        setIsTranslating(false);

        if (saveToHistory) {
          const newItem = {
            id: 'item_' + Date.now(),
            original_text: text,
            translated_text: off.translated_text,
            detected_lang: off.detected_lang || 'Offline Local',
            detected_code: sl === 'auto' ? 'te' : sl,
            target_lang: tl,
            transliterated_script: null,
            favorite: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
          };
          setHistory(prev => [newItem, ...prev.filter(p => p.original_text !== text)]);
        }

        if (autoSpeak && off.translated_text) {
          speakText(off.translated_text, tl);
        }
        return;
      }
    }

    try {
      const resp = await fetch('http://127.0.0.1:8000/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          source_lang: sl,
          target_lang: tl,
          tone: tone,
          scenario: selectedScenario
        }),
        signal: abortControllerRef.current.signal
      });

      if (!resp.ok) throw new Error("Translation failed");
      const data = await resp.json();

      setTranslatedText(data.translated_text);
      setDetectedLangName(data.detected_lang);
      setDetectedCode(data.detected_code);
      setTransliteratedScript(data.transliterated_script);
      setLatencyMs(Math.round(performance.now() - startTime));

      // Update Code-Mixed and Politeness Coach state
      setCodeMixedInfo({ isCodeMixed: data.code_mixed, type: data.code_mixed_type });
      setPolitenessInfo({ flag: data.politeness_flag, tip: data.politeness_tip, suggestion: data.politeness_suggestion });

      // Update Smart Replies for this translated text
      fetchSmartReplies(data.translated_text, data.target_lang, null, selectedScenario);

      if (saveToHistory) {
        const newItem = {
          id: 'item_' + Date.now(),
          original_text: text,
          translated_text: data.translated_text,
          detected_lang: data.detected_lang,
          detected_code: data.detected_code,
          target_lang: data.target_lang,
          transliterated_script: data.transliterated_script,
          favorite: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        };
        setHistory(prev => [newItem, ...prev.filter(p => p.original_text !== text)]);
      }

      if (autoSpeak && data.translated_text) {
        speakText(data.translated_text, data.target_lang);
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error("Translation error", e);
      }
    } finally {
      setIsTranslating(false);
    }
  }, [autoSpeak, isEffectivelyOffline, history, selectedScenario, fetchSmartReplies]);

  // Debounced translation as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      performTranslation(inputText, sourceLang, targetLang, selectedTone, false);
    }, 280);

    return () => clearTimeout(timer);
  }, [inputText, sourceLang, targetLang, selectedTone, performTranslation]);

  // General Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const r = new SpeechRecognition();
      r.continuous = true;
      r.interimResults = true;

      r.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setSpeechInterim(transcript);
          setInputText(transcript);
        }
      };

      r.onerror = (e) => {
        console.warn("Speech recognition error", e);
        setIsListening(false);
        setSpeechInterim('');
      };

      r.onend = () => {
        setIsListening(false);
        setSpeechInterim('');
      };

      recognitionRef.current = r;
    }
  }, []);

  // 🎙️ LIVE INTERPRETER ENGINE (Continuous Auto-Listen + Offline + 2-Way Auto-Switch)

  const stopLiveInterpretation = useCallback(() => {
    isLiveActiveRef.current = false;
    setIsLiveActive(false);
    setSpeakerState('idle');
    setLiveInterimText('');
    accumulatedSpeechRef.current = '';
    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }
    if (liveRecognitionRef.current) {
      try { liveRecognitionRef.current.abort(); } catch (e) {}
    }
    if (speakerRecognitionRef.current) {
      try { speakerRecognitionRef.current.abort(); } catch (e) {}
    }
    window.speechSynthesis.cancel();
    showToast("Live Interpreter Paused");
  }, []);

  const processSpeakerVoice = useCallback(async (spokenPhrase, forceInputLang = null, forceTargetLang = null) => {
    if (!spokenPhrase || !spokenPhrase.trim()) return;
    
    const pairLangA = (sourceLang !== 'auto' ? sourceLang : (speakerInputLang || 'te'));
    const pairLangB = (targetLang !== 'auto' ? targetLang : (speakerTargetLang || 'kn'));

    let sLang = pairLangA;
    let tLang = pairLangB;

    // 🌐 Automatic Two-Way Language & Script Detection (No Manual Switching Needed)
    if (!forceInputLang) {
      const lower = spokenPhrase.toLowerCase();
      const hasKannada = /[\u0C80-\u0CFF]/.test(spokenPhrase);
      const hasTelugu = /[\u0C00-\u0C7F]/.test(spokenPhrase) ||
        lower.split(/\s+/).some(w => ['namaste', 'ela', 'unnaru', 'unnav', 'tinnara', 'tinara', 'danyavadalu', 'dhanyavadalu', 'meeru', 'nuvvu', 'chesara', 'avutunna', 'cheyyi', 'chesta', 'ki', 'lo', 'em', 'chestunnav', 'ekkadiki', 'velthunnav'].includes(w));
      const hasHindi = /[\u0900-\u097F]/.test(spokenPhrase) ||
        lower.split(/\s+/).some(w => ['aap', 'kaise', 'hain', 'ho', 'kya', 'kar', 'rahe', 'dhanyawad', 'shukriya'].includes(w));
      const hasTamil = /[\u0B80-\u0BFF]/.test(spokenPhrase);

      if (hasKannada) {
        sLang = 'kn';
        tLang = (pairLangA !== 'kn') ? pairLangA : (pairLangB !== 'kn' ? pairLangB : 'te');
        currentSpeakerTurnRef.current = 'B';
        setCurrentSpeakerTurn('B');
      } else if (hasTelugu) {
        sLang = 'te';
        tLang = (pairLangB !== 'te') ? pairLangB : (pairLangA !== 'te' ? pairLangA : 'kn');
        currentSpeakerTurnRef.current = 'A';
        setCurrentSpeakerTurn('A');
      } else if (hasHindi) {
        sLang = 'hi';
        tLang = (pairLangA === 'hi') ? pairLangB : pairLangA;
      } else if (hasTamil) {
        sLang = 'ta';
        tLang = (pairLangA === 'ta') ? pairLangB : pairLangA;
      } else {
        // Fallback to turn-based alternating speaker routing
        if (currentSpeakerTurnRef.current === 'B') {
          sLang = pairLangB;
          tLang = pairLangA;
        } else {
          sLang = pairLangA;
          tLang = pairLangB;
        }
      }
    } else {
      sLang = forceInputLang;
      tLang = forceTargetLang || (sLang === pairLangA ? pairLangB : pairLangA);
    }

    setSpeakerState('translating');
    liveStatusRef.current = 'translating';
    setSpeakerHeardText(spokenPhrase);
    setInputText(spokenPhrase);

    let translated = '';
    let translitScript = null;
    let detectedLang = sLang;
    let engineUsed = 'cloud';
    let codeMixedType = null;

    // 📴 Check Offline Engine first if forced or internet is down
    if (isEffectivelyOffline) {
      const off = translateOffline(spokenPhrase, sLang, tLang, history);
      translated = off ? off.translated_text : `[Offline] ${spokenPhrase}`;
      detectedLang = off?.detected_lang || sLang;
      engineUsed = 'offline_engine';
    } else {
      try {
        const resp = await fetch('http://127.0.0.1:8000/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: spokenPhrase.trim(),
            source_lang: sLang,
            target_lang: tLang,
            scenario: selectedScenario
          })
        });

        if (resp.ok) {
          const data = await resp.json();
          translated = data.translated_text;
          translitScript = data.transliterated_script;
          detectedLang = data.detected_lang;
          engineUsed = data.engine || 'cloud';
          codeMixedType = data.code_mixed_type;

          // Prevent translating into the exact same language
          if (data.detected_code && data.detected_code === tLang) {
            const reversedTarget = (tLang === pairLangA ? pairLangB : pairLangA);
            try {
              const revResp = await fetch('http://127.0.0.1:8000/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: spokenPhrase.trim(),
                  source_lang: data.detected_code,
                  target_lang: reversedTarget,
                  scenario: selectedScenario
                })
              });
              if (revResp.ok) {
                const revData = await revResp.json();
                translated = revData.translated_text;
                translitScript = revData.transliterated_script;
                tLang = reversedTarget;
              }
            } catch (revErr) {}
          }

          setCodeMixedInfo({ isCodeMixed: data.code_mixed, type: data.code_mixed_type });
          setPolitenessInfo({ flag: data.politeness_flag, tip: data.politeness_tip, suggestion: data.politeness_suggestion });
        } else {
          // Fallback to offline
          const off = translateOffline(spokenPhrase, sLang, tLang, history);
          translated = off ? off.translated_text : spokenPhrase;
          engineUsed = 'offline_fallback';
        }
      } catch (e) {
        console.warn("Speech translation network notice, using offline fallback", e);
        const off = translateOffline(spokenPhrase, sLang, tLang, history);
        translated = off ? off.translated_text : spokenPhrase;
        engineUsed = 'offline_fallback';
      }
    }

    // Update state for Page 2 and Page 3
    setTranslatedText(translated);
    setSpeakerResponseText(translated);
    setSpeakerTransScript(translitScript);
    setTransliteratedScript(translitScript);
    setDetectedCode(sLang);
    setDetectedLangName(LANGUAGES[sLang] || sLang);
    setSpeakerState('speaking');
    liveStatusRef.current = 'speaking';

    // Record in Live Session Log
    const newLogItem = {
      id: 'live_' + Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      spoken: spokenPhrase,
      translated: translated,
      sourceLang: sLang,
      targetLang: tLang,
      speaker: currentSpeakerTurnRef.current === 'A' ? `Person A (${LANGUAGES[sLang] || sLang})` : `Person B (${LANGUAGES[sLang] || sLang})`,
      scenario: selectedScenario,
      codeMixedType: codeMixedType,
      engine: engineUsed
    };
    setLiveSessionLog(prev => [newLogItem, ...prev]);

    // Record in global History
    const newItem = {
      id: 'speak_item_' + Date.now(),
      original_text: spokenPhrase,
      translated_text: translated,
      detected_lang: LANGUAGES[sLang] || sLang,
      detected_code: sLang,
      target_lang: tLang,
      transliterated_script: translitScript,
      favorite: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    setHistory(prev => [newItem, ...prev]);

    // Fetch smart reply suggestions adapted to scenario
    fetchSmartReplies(translated, tLang, null, selectedScenario);

    // 🔊 AUTOMATIC MANDATORY TEXT-TO-SPEECH PLAYBACK
    // Stop any existing speech synthesis before speaking new output
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(translated);
    const bcp47 = SPEECH_LANGS[tLang]?.code || (tLang === 'kn' ? 'kn-IN' : tLang === 'te' ? 'te-IN' : tLang === 'hi' ? 'hi-IN' : tLang === 'ta' ? 'ta-IN' : 'en-US');
    utterance.lang = bcp47;
    utterance.rate = speechSpeed || 1.0;

    // Pick matching browser native voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const match = voices.find(v => v.lang === bcp47 || v.lang.replace('_', '-') === bcp47 || v.lang.startsWith(tLang));
      if (match) utterance.voice = match;
    }

    utterance.onend = () => {
      // Toggle 2-way turn for the next speaker
      const nextTurn = currentSpeakerTurnRef.current === 'A' ? 'B' : 'A';
      currentSpeakerTurnRef.current = nextTurn;
      setCurrentSpeakerTurn(nextTurn);

      if (isLiveActiveRef.current) {
        setSpeakerState('listening');
        liveStatusRef.current = 'listening';
        // ⏳ 250ms silence delay so microphone does NOT hear the device's own audio
        setTimeout(() => {
          if (isLiveActiveRef.current && startLiveTurnRef.current) {
            startLiveTurnRef.current();
          }
        }, 250);
      } else {
        setSpeakerState('idle');
        liveStatusRef.current = 'idle';
      }
    };

    utterance.onerror = (e) => {
      console.warn("TTS playback notice:", e);
      const nextTurn = currentSpeakerTurnRef.current === 'A' ? 'B' : 'A';
      currentSpeakerTurnRef.current = nextTurn;
      setCurrentSpeakerTurn(nextTurn);

      if (isLiveActiveRef.current) {
        setSpeakerState('listening');
        liveStatusRef.current = 'listening';
        setTimeout(() => {
          if (isLiveActiveRef.current && startLiveTurnRef.current) {
            startLiveTurnRef.current();
          }
        }, 250);
      } else {
        setSpeakerState('idle');
        liveStatusRef.current = 'idle';
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [sourceLang, targetLang, speakerInputLang, speakerTargetLang, isEffectivelyOffline, history, speechSpeed, fetchSmartReplies, selectedScenario]);

  // Start a single listening turn in the continuous loop
  const startLiveTurn = useCallback(() => {
    if (!isLiveActiveRef.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech Recognition not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    if (liveRecognitionRef.current) {
      try { liveRecognitionRef.current.abort(); } catch (e) {}
    }

    const sr = new SpeechRecognition();
    sr.continuous = true;
    sr.interimResults = true;

    const pairLangA = (sourceLang !== 'auto' ? sourceLang : (speakerInputLang || 'te'));
    const pairLangB = (targetLang !== 'auto' ? targetLang : (speakerTargetLang || 'kn'));
    const activeLang = currentSpeakerTurnRef.current === 'B' ? pairLangB : pairLangA;

    sr.lang = SPEECH_LANGS[activeLang]?.code || (activeLang === 'kn' ? 'kn-IN' : activeLang === 'te' ? 'te-IN' : 'en-US');

    sr.onstart = () => {
      setSpeakerState('listening');
      liveStatusRef.current = 'listening';
    };

    sr.onresult = (e) => {
      let currentSessionText = '';
      for (let i = 0; i < e.results.length; i++) {
        currentSessionText += e.results[i][0].transcript + ' ';
      }
      const fullTrimmed = currentSessionText.trim();
      if (!fullTrimmed) return;

      // Update what user said in real-time so the full sentence is visible live as they speak
      setInputText(fullTrimmed);
      setLiveInterimText(fullTrimmed);
      accumulatedSpeechRef.current = fullTrimmed;

      // Reset the silence debounce timer
      if (speechSilenceTimerRef.current) {
        clearTimeout(speechSilenceTimerRef.current);
      }

      // Allow natural breathing pauses: wait 1300ms of true silence before finalizing the full sentence
      speechSilenceTimerRef.current = setTimeout(() => {
        const finalPhrase = accumulatedSpeechRef.current.trim();
        if (finalPhrase) {
          accumulatedSpeechRef.current = '';
          setLiveInterimText('');
          // Stop recognition BEFORE processing & speaking so mic never hears TTS!
          try { sr.stop(); } catch (err) {}
          liveRecognitionRef.current = null;
          processSpeakerVoice(finalPhrase);
        }
      }, 1300);
    };

    sr.onerror = (e) => {
      if (e.error === 'no-speech' && isLiveActiveRef.current) {
        setTimeout(() => {
          if (isLiveActiveRef.current) startLiveTurn();
        }, 300);
      } else if (e.error !== 'aborted') {
        console.warn("Live listening error:", e.error);
      }
    };

    sr.onend = () => {
      // If recognition stopped but we still have speech accumulated:
      if (accumulatedSpeechRef.current.trim()) {
        if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
        const finalPhrase = accumulatedSpeechRef.current.trim();
        accumulatedSpeechRef.current = '';
        setLiveInterimText('');
        liveRecognitionRef.current = null;
        processSpeakerVoice(finalPhrase);
        return;
      }

      if (isLiveActiveRef.current && liveStatusRef.current === 'listening') {
        setTimeout(() => {
          if (isLiveActiveRef.current && liveStatusRef.current === 'listening') {
            startLiveTurn();
          }
        }, 250);
      }
    };

    liveRecognitionRef.current = sr;
    try {
      sr.start();
      setSpeakerState('listening');
      liveStatusRef.current = 'listening';
    } catch (e) {
      console.warn("SR start notice:", e);
    }
  }, [sourceLang, targetLang, speakerInputLang, speakerTargetLang, processSpeakerVoice]);

  useEffect(() => {
    startLiveTurnRef.current = startLiveTurn;
  }, [startLiveTurn]);

  // Toggle Live Interpreting (Continuous Hands-Free Two-Way Loop)
  const toggleLiveInterpreting = () => {
    if (isLiveActive) {
      stopLiveInterpretation();
    } else {
      isLiveActiveRef.current = true;
      setIsLiveActive(true);
      setSpeakerState('listening');
      liveStatusRef.current = 'listening';
      const pairLangA = (sourceLang !== 'auto' ? sourceLang : (speakerInputLang || 'te'));
      const pairLangB = (targetLang !== 'auto' ? targetLang : (speakerTargetLang || 'kn'));
      showToast(`🟢 Live Interpreter ACTIVE: ${LANGUAGES[pairLangA] || pairLangA} ⇄ ${LANGUAGES[pairLangB] || pairLangB}`);
      startLiveTurn();
    }
  };

  // Toggle Single Tap Smart Speaker Listening
  const toggleSpeakerListening = () => {
    if (isLiveActive) {
      stopLiveInterpretation();
      return;
    }
    toggleLiveInterpreting();
  };

  // Toggle Voice Input in general
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      showToast("Speech Recognition not supported in this browser. Please use Chrome/Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setSpeechInterim('');
      showToast("Microphone stopped");
    } else {
      try {
        const activeCode = sourceLang !== 'auto' ? sourceLang : voiceLang;
        const bcp47 = SPEECH_LANGS[activeCode]?.code || 'te-IN';
        recognitionRef.current.lang = bcp47;
        recognitionRef.current.start();
        setIsListening(true);
        showToast(`Listening in ${SPEECH_LANGS[activeCode]?.name || activeCode}... Speak now!`);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Swap Languages
  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      const currentDetected = detectedCode || 'te';
      setSourceLang(targetLang);
      setTargetLang(currentDetected);
      setInputText(translatedText);
      showToast(`Swapped: ${LANGUAGES[targetLang]} ⇄ ${LANGUAGES[currentDetected]}`);
    } else {
      const oldSource = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(oldSource);
      setInputText(translatedText);
      showToast(`Swapped: ${LANGUAGES[targetLang]} ⇄ ${LANGUAGES[oldSource]}`);
    }
  };

  // Copy
  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Native Share
  const handleShare = async (orig, trans, sLang, tLang) => {
    const textToShare = `Original: ${orig}\n\nTranslated (${LANGUAGES[tLang] || tLang}): ${trans}\n\n— Translated via EchoBridge AI Smart Translator`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'AI Smart Translation', text: textToShare });
        showToast("Shared successfully!");
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy(textToShare, 'share_main');
        }
      }
    } else {
      handleCopy(textToShare, 'share_main');
    }
  };

  // Download Translation as .txt
  const handleDownloadSingle = () => {
    const content = `Original (${detectedLangName}):\n${inputText}\n\nTranslated (${LANGUAGES[targetLang]}):\n${translatedText}\n\nGenerated with AI Smart Translator on ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded translation!");
  };

  // Toggle Favorite
  const handleSaveCurrent = () => {
    if (!inputText || !translatedText) return;
    const existing = history.find(h => h.original_text === inputText && h.target_lang === targetLang);
    if (existing) {
      setHistory(prev => prev.map(item => item.id === existing.id ? { ...item, favorite: !item.favorite } : item));
      showToast(existing.favorite ? "Removed from Favorites" : "Added to Favorites ⭐");
    } else {
      const newItem = {
        id: 'item_' + Date.now(),
        original_text: inputText,
        translated_text: translatedText,
        detected_lang: detectedLangName,
        detected_code: detectedCode,
        target_lang: targetLang,
        transliterated_script: transliteratedScript,
        favorite: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev]);
      showToast("Saved to Favorites ⭐");
    }
  };

  const isCurrentFavorite = useMemo(() => {
    return history.some(h => h.original_text === inputText && h.target_lang === targetLang && h.favorite);
  }, [history, inputText, targetLang]);

  // AI Feature: Explain Translation
  const handleExplain = async () => {
    if (!inputText || !translatedText) return;
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          translated_text: translatedText,
          source_lang: detectedCode || sourceLang,
          target_lang: targetLang
        })
      });
      const data = await resp.json();
      setExplanationData(data);
      setShowAiMenu(true);
    } catch (e) {
      showToast("Could not generate explanation");
    }
  };

  // AI Feature: Alternative Translations
  const handleGetAlternatives = async () => {
    if (!inputText) return;
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/ai/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          source_lang: sourceLang,
          target_lang: targetLang
        })
      });
      const data = await resp.json();
      setAlternativesData(data.alternatives);
      setShowAiMenu(true);
    } catch (e) {
      showToast("Could not fetch alternatives");
    }
  };

  // AI Feature: Grammar Polish
  const handleGrammarCheck = async () => {
    if (!inputText) return;
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/ai/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, lang: sourceLang })
      });
      const data = await resp.json();
      setGrammarData(data);
      if (data.has_corrections) {
        setInputText(data.corrected_text);
        showToast("Grammar and punctuation polished ✨");
      } else {
        showToast("Your input is grammatically clean!");
      }
    } catch (e) {
      showToast("Grammar check unavailable");
    }
  };

  // 🎯 Pronunciation Practice Coach (Feature 6: Record user pronunciation & score)
  const handlePracticePronunciation = (phraseToPractice = null, langToPractice = null) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech Recognition not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    const targetPhrase = phraseToPractice || speakerResponseText || translatedText;
    const targetLangCode = langToPractice || speakerTargetLang || targetLang;

    if (!targetPhrase) {
      showToast("Please translate a phrase first to practice pronunciation.");
      return;
    }

    setIsPronouncing(true);
    showToast(`🎤 Pronounce "${targetPhrase}" into your microphone now...`);

    const sr = new SpeechRecognition();
    sr.continuous = false;
    sr.interimResults = false;
    sr.lang = SPEECH_LANGS[targetLangCode]?.code || 'en-US';

    sr.onresult = async (e) => {
      const spokenAttempt = e.results[0][0].transcript;
      setIsPronouncing(false);

      try {
        const resp = await fetch('http://127.0.0.1:8000/api/pronunciation/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference_text: targetPhrase,
            spoken_attempt: spokenAttempt,
            target_lang: targetLangCode
          })
        });

        if (resp.ok) {
          const scoreData = await resp.json();
          setPronounceResult({
            ...scoreData,
            target_lang: targetLangCode,
            reference: scoreData.reference || targetPhrase,
            attempt: scoreData.attempt || spokenAttempt,
            matched_words: scoreData.matched_words || scoreData.word_analysis || []
          });
          setShowPronounceModal(true);
          showToast(`Score: ${scoreData.score}% — ${scoreData.grade}`);
        }
      } catch (err) {
        showToast("Error evaluating pronunciation");
      }
    };

    sr.onerror = (e) => {
      setIsPronouncing(false);
      showToast("Could not capture pronunciation attempt. Try again.");
    };

    try {
      sr.start();
    } catch (err) {
      setIsPronouncing(false);
    }
  };

  // Document Translation Handler
  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocumentFile(file);
    setIsTranslatingDoc(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);

    try {
      const resp = await fetch('http://127.0.0.1:8000/api/document/translate', {
        method: 'POST',
        body: formData
      });
      if (!resp.ok) throw new Error("Document translation failed");
      const data = await resp.json();
      setDocumentResult(data);
      showToast(`Document translated (${data.total_paragraphs} paragraphs)`);
    } catch (err) {
      showToast("Error translating document: " + err.message);
    } finally {
      setIsTranslatingDoc(false);
    }
  };

  // Two-Way Conversation Send
  const handleSendConversationMessage = async (speaker, text) => {
    if (!text.trim()) return;
    const sLang = speaker === 'A' ? convSpeakerA_Lang : convSpeakerB_Lang;
    const tLang = speaker === 'A' ? convSpeakerB_Lang : convSpeakerA_Lang;

    try {
      const resp = await fetch('http://127.0.0.1:8000/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          source_lang: sLang, 
          target_lang: tLang,
          conversation_context: conversation.slice(-4)
        })
      });
      const data = await resp.json();

      const newMsg = {
        id: Date.now(),
        speaker,
        text,
        lang: sLang,
        translated: data.translated_text
      };
      setConversation(prev => [...prev, newMsg]);
      if (speaker === 'A') setConvInputA('');
      else setConvInputB('');

      speakText(data.translated_text, tLang);

      // Fetch smart suggestions for the next speaker's reply
      fetchSmartReplies(data.translated_text, tLang, [...conversation, newMsg]);
    } catch (err) {
      showToast("Conversation translation error");
    }
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    const q = historySearch.toLowerCase().trim();
    return history.filter(item => {
      const matchesSearch = !q || 
        item.original_text.toLowerCase().includes(q) ||
        item.translated_text.toLowerCase().includes(q) ||
        (item.detected_lang && item.detected_lang.toLowerCase().includes(q));
      return matchesSearch;
    });
  }, [history, historySearch]);

  const favoritesList = useMemo(() => {
    return history.filter(h => h.favorite);
  }, [history]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070b15] text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* 🌐 2-SECOND BRAND SPLASH / INTRO SCREEN */}
      {showSplash && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#050814] via-[#091129] to-[#040712] flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
          {/* Glowing Ambient Background Orb */}
          <div className="absolute w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute w-64 h-64 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none -top-10" />

          {/* Central 3D-styled AI Orb / Logo */}
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[3px] shadow-[0_0_60px_rgba(59,130,246,0.5)] animate-spin-slow">
              <div className="w-full h-full rounded-full bg-[#090e1f] flex items-center justify-center backdrop-blur-xl">
                <Globe className="w-14 h-14 text-cyan-300 animate-pulse" />
              </div>
            </div>
            {/* Pulsing Soundwave Rings */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />
          </div>

          {/* Brand Typography */}
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
            EchoBridge <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">AI</span>
          </h1>
          <p className="text-base md:text-lg font-medium text-indigo-300/90 mb-1">
            "Breaking Language Barriers, Instantly."
          </p>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-8">
            Personal Live AI Interpreter
          </p>

          {/* Animated Audio Soundwave Bars */}
          <div className="flex items-center gap-1.5 h-8 mb-8">
            {[40, 75, 100, 60, 90, 45, 80, 55, 30].map((h, i) => (
              <span
                key={i}
                className="w-1.5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 0.12}s`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>

          {/* Animated Dots Loading */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-cyan-400/80 text-sm font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* TOAST POPUP */}
      {toastMessage && (
        <div className="fixed top-6 right-8 z-50 bg-slate-900/95 border border-indigo-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🚀 PAGE 2: MAIN STANDALONE TRANSLATOR (MINIMAL & FOCUSED) */}
      {/* ========================================================= */}
      {currentStage === 'translator' ? (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gradient-to-b from-[#080d1e] via-[#091128] to-[#050814] animate-in fade-in duration-300">
          
          {/* Top Bar */}
          <header className="h-16 shrink-0 border-b border-slate-800/80 px-6 md:px-12 flex items-center justify-between backdrop-blur-md sticky top-0 z-20 bg-[#080d1e]/85">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Globe className="w-5 h-5 text-white animate-spin-slow" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  EchoBridge <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">Personal Live AI Interpreter</p>
              </div>
            </div>

            {/* Menu / Explore More Button (Takes user to Page 3) */}
            <button
              onClick={() => setCurrentStage('workspace')}
              className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-indigo-500/50 transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-95 group"
              title="Open full workspace with sidebar and all tools"
            >
              <Menu className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-200">Explore Tools</span>
              <span className="text-xs text-indigo-400">➔</span>
            </button>
          </header>

          {/* Main Clean Center Content */}
          <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col justify-center items-center space-y-6">
            
            {/* Minimal Language Controls */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-3 shadow-xl flex items-center justify-between gap-2">
              {/* I Speak */}
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-950/70 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-blue-400 shrink-0">I Speak:</span>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer w-full"
                >
                  <option value="te" className="bg-slate-900 text-white">🇮🇳 Telugu (తెలుగు)</option>
                  <option value="hi" className="bg-slate-900 text-white">🇮🇳 Hindi (हिन्दी)</option>
                  <option value="en" className="bg-slate-900 text-white">🇺🇸 English</option>
                  <option value="ta" className="bg-slate-900 text-white">🇮🇳 Tamil (தமிழ்)</option>
                  <option value="kn" className="bg-slate-900 text-white">🇮🇳 Kannada (ಕನ್ನಡ)</option>
                  <option value="ml" className="bg-slate-900 text-white">🇮🇳 Malayalam (മലയാളം)</option>
                  <option value="mr" className="bg-slate-900 text-white">🇮🇳 Marathi (मराठी)</option>
                  <option value="bn" className="bg-slate-900 text-white">🇮🇳 Bengali (বাংলা)</option>
                  <option value="auto" className="bg-slate-900 text-white">🌐 Auto Detect</option>
                </select>
              </div>

              {/* Swap Button */}
              <button
                onClick={handleSwapLanguages}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white border border-slate-700 transition-all hover:scale-110 active:scale-95 cursor-pointer shrink-0"
                title="Swap Languages"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>

              {/* Translate To */}
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-950/70 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-purple-400 shrink-0">Translate To:</span>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer w-full"
                >
                  <option value="hi" className="bg-slate-900 text-white">🇮🇳 Hindi (हिन्दी)</option>
                  <option value="en" className="bg-slate-900 text-white">🇺🇸 English</option>
                  <option value="te" className="bg-slate-900 text-white">🇮🇳 Telugu (తెలుగు)</option>
                  <option value="ta" className="bg-slate-900 text-white">🇮🇳 Tamil (தமிழ்)</option>
                  <option value="kn" className="bg-slate-900 text-white">🇮🇳 Kannada (ಕನ್ನಡ)</option>
                  <option value="ml" className="bg-slate-900 text-white">🇮🇳 Malayalam (മലയാളം)</option>
                  <option value="mr" className="bg-slate-900 text-white">🇮🇳 Marathi (मराठी)</option>
                  <option value="bn" className="bg-slate-900 text-white">🇮🇳 Bengali (বাংলা)</option>
                  <option value="es" className="bg-slate-900 text-white">🇪🇸 Spanish</option>
                  <option value="fr" className="bg-slate-900 text-white">🇫🇷 French</option>
                </select>
              </div>
            </div>

            {/* HERO CENTER: Large Two-Way Live Interpreter Button */}
            <div className="relative py-4 flex flex-col items-center">
              {/* Concentric pulsing rings when listening */}
              <div className={`absolute w-52 h-52 rounded-full border transition-all duration-700 pointer-events-none ${
                isLiveActive && speakerState === 'listening'
                  ? 'border-cyan-400/30 scale-125 animate-ping' 
                  : 'border-blue-500/10'
              }`} style={{ animationDuration: '2s' }} />

              <div className={`absolute w-40 h-40 rounded-full border transition-all duration-500 pointer-events-none ${
                isLiveActive && speakerState === 'listening'
                  ? 'border-indigo-400/40 scale-110 animate-pulse' 
                  : speakerState === 'speaking'
                  ? 'border-purple-400/50 scale-105 animate-pulse'
                  : 'border-slate-800/80'
              }`} />

              {/* The Hero Button */}
              <button
                onClick={toggleLiveInterpreting}
                className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative z-10 cursor-pointer group active:scale-95 ${
                  isLiveActive && speakerState === 'listening'
                    ? 'bg-gradient-to-tr from-rose-500 via-pink-600 to-red-600 shadow-rose-500/50 ring-4 ring-rose-400/40 animate-pulse' 
                    : speakerState === 'translating'
                    ? 'bg-gradient-to-tr from-amber-500 via-orange-600 to-yellow-500 shadow-amber-500/50 ring-4 ring-amber-400/40'
                    : speakerState === 'speaking'
                    ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-purple-500/50 ring-4 ring-purple-400/40 animate-pulse'
                    : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 hover:shadow-cyan-500/50 hover:scale-105'
                }`}
                title={isLiveActive ? "Live Interpreter Active — Tap to Pause" : "Tap to Start Live Two-Way Interpreter"}
              >
                {isLiveActive && speakerState === 'listening' ? (
                  <Mic className="w-12 h-12 text-white animate-bounce" />
                ) : speakerState === 'translating' ? (
                  <Sparkles className="w-12 h-12 text-white animate-spin-slow" />
                ) : speakerState === 'speaking' ? (
                  <Volume2 className="w-12 h-12 text-white animate-pulse" />
                ) : (
                  <Mic className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
                )}
              </button>

              {/* State Machine Status Label */}
              <div className="mt-4 flex flex-col items-center gap-1">
                <span className={`text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full border ${
                  isLiveActive && speakerState === 'listening'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                    : speakerState === 'translating' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : speakerState === 'speaking'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse'
                    : 'bg-slate-800/70 text-slate-300 border-slate-700/60'
                }`}>
                  {isLiveActive && speakerState === 'listening' 
                    ? `🟢 Listening... (${currentSpeakerTurn === 'A' ? (LANGUAGES[sourceLang !== 'auto' ? sourceLang : 'te'] || 'Telugu') : (LANGUAGES[targetLang] || 'Kannada')})`
                    : speakerState === 'translating' 
                    ? '✨ Understanding & Translating...' 
                    : speakerState === 'speaking' 
                    ? `🔊 Speaking Aloud...` 
                    : '🎙️ Tap to Start Live Interpreter'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isLiveActive && speakerState === 'listening'
                    ? `Speak naturally • Will translate & reply in ${currentSpeakerTurn === 'A' ? (LANGUAGES[targetLang] || 'Kannada') : (LANGUAGES[sourceLang !== 'auto' ? sourceLang : 'te'] || 'Telugu')}`
                    : speakerState === 'speaking'
                    ? 'Microphone paused so interpreter does not hear itself'
                    : isLiveActive
                    ? 'Live Interpreter running...'
                    : `Hands-free two-way conversation: ${LANGUAGES[sourceLang !== 'auto' ? sourceLang : 'te']} ⇄ ${LANGUAGES[targetLang]}`}
                </span>
              </div>
            </div>

            {/* Optional Sleek Text Input */}
            <div className="w-full relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    performTranslation(inputText, sourceLang, targetLang, 'default', true);
                  }
                }}
                placeholder="Type here in Telugu, Kannada, Hindi, English..."
                className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-3 px-4 pr-24 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 shadow-inner"
              />
              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                {inputText && (
                  <button
                    onClick={() => { setInputText(''); setTranslatedText(''); }}
                    className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => performTranslation(inputText, sourceLang, targetLang, 'default', true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs hover:from-blue-500 hover:to-cyan-400 transition-all cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* RESULTS DISPLAY: YOU SAID ↓ TRANSLATED RESPONSE */}
            <div className="w-full space-y-4 pt-2">
              {/* YOU SAID */}
              <div className="w-full bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-extrabold uppercase tracking-wide text-blue-400 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" /> YOU SAID ({LANGUAGES[detectedCode || sourceLang] || 'Source'})
                  </span>
                  {transliteratedScript && (
                    <span className="text-[11px] bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30 font-semibold">
                      {transliteratedScript}
                    </span>
                  )}
                </div>
                <p className="text-xl md:text-2xl font-bold text-slate-100 min-h-[36px] leading-relaxed">
                  {inputText ? `"${inputText}"` : <span className="text-slate-600 text-base italic">Speak or type a phrase above...</span>}
                </p>
              </div>

              {/* Animated Arrow */}
              <div className="flex items-center justify-center">
                <div className="px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 shadow-md">
                  <span>↓ Meaning Understood & Translated</span>
                </div>
              </div>

              {/* TRANSLATED RESPONSE */}
              <div className="w-full bg-slate-900/90 border border-purple-500/40 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-purple-300 mb-1.5">
                  <span className="font-extrabold uppercase tracking-wide flex items-center gap-1.5 text-purple-400">
                    <Volume2 className="w-3.5 h-3.5 text-purple-400" /> TRANSLATED RESPONSE ({LANGUAGES[targetLang] || 'Target'})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => speakText(translatedText, targetLang)}
                      disabled={!translatedText}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 transition-colors cursor-pointer disabled:opacity-30"
                      title="Speak Translated Voice Again"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopy(translatedText, 'page2_trans')}
                      disabled={!translatedText}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer disabled:opacity-30"
                      title="Copy Translation"
                    >
                      {copiedId === 'page2_trans' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-extrabold text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 bg-clip-text min-h-[42px] leading-relaxed">
                  {translatedText ? `"${translatedText}"` : <span className="text-slate-600 text-base italic">Translated speech will appear and speak here...</span>}
                </p>
              </div>
            </div>

          </main>
        </div>
      ) : (
        /* ========================================================= */
        /* 🏢 PAGE 3: FULL WORKSPACE WITH SIDEBAR                    */
        /* ========================================================= */
        <>
          {/* Mobile Drawer Backdrop */}
          {sidebarOpen && (
            <div 
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
            />
          )}

          {/* ========================================================= */}
          {/* 🧭 LEFT SIDEBAR DRAWER */}
          {/* ========================================================= */}
          <aside className={`fixed md:static inset-y-0 left-0 w-72 shrink-0 bg-[#0a0f1e] border-r border-slate-800/80 flex flex-col justify-between p-4 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Brand & Logo */}
        <div>
          <div className="flex items-center justify-between px-2 py-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Globe className="w-5 h-5 text-white animate-spin-slow" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                  EchoBridge <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">Personal Live AI Interpreter ✨</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grouped Nav Items */}
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            <SidebarBtn 
              active={activeNav === 'live-interpreter' || activeNav === 'speak-translate'} 
              icon={<Radio className="w-4 h-4 text-rose-400 animate-pulse" />} 
              label="Live Conversation" 
              badge="HERO ⭐"
              onClick={() => { setActiveNav('live-interpreter'); setSidebarOpen(false); }}
            />
            <SidebarBtn 
              active={activeNav === 'translator'} 
              icon={<Zap className="w-4 h-4 text-amber-400" />} 
              label="Quick Translate" 
              onClick={() => { setActiveNav('translator'); setSidebarOpen(false); }}
            />
            <SidebarBtn 
              active={activeNav === 'conversation'} 
              icon={<MessageSquare className="w-4 h-4 text-orange-400" />} 
              label="Speak & Translate" 
              onClick={() => { setActiveNav('conversation'); setSidebarOpen(false); }}
            />

            <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Smart AI Features
            </div>

            <SidebarBtn 
              active={false} 
              icon={<Sparkles className="w-4 h-4 text-purple-400" />} 
              label="Smart Replies" 
              badge="Active"
              onClick={() => { 
                setActiveNav('live-interpreter'); 
                setSidebarOpen(false);
                showToast("Smart Replies are active right below conversation turns!");
              }}
            />
            <SidebarBtn 
              active={false} 
              icon={<Layers className="w-4 h-4 text-blue-400" />} 
              label="Scenario Mode" 
              badge={selectedScenario.toUpperCase()}
              onClick={() => { 
                setActiveNav('live-interpreter'); 
                setSidebarOpen(false);
                showToast(`Current Scenario: ${selectedScenario}`);
              }}
            />
            <SidebarBtn 
              active={false} 
              icon={<Mic className="w-4 h-4 text-emerald-400" />} 
              label="Pronunciation Coach" 
              onClick={() => { 
                setSidebarOpen(false);
                handlePracticePronunciation();
              }}
            />

            <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Records & Stats
            </div>

            <SidebarBtn 
              active={activeNav === 'history'} 
              icon={<Clock className="w-4 h-4" />} 
              label="History" 
              badge={history.length}
              onClick={() => { setActiveNav('history'); setSidebarOpen(false); }}
            />
            <SidebarBtn 
              active={activeNav === 'favorites'} 
              icon={<Heart className="w-4 h-4" />} 
              label="Favorites" 
              badge={favoritesList.length}
              onClick={() => { setActiveNav('favorites'); setSidebarOpen(false); }}
            />
            <SidebarBtn 
              active={activeNav === 'analytics'} 
              icon={<BarChart3 className="w-4 h-4" />} 
              label="Analytics" 
              onClick={() => { setActiveNav('analytics'); setSidebarOpen(false); }}
            />

            <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Offline & System
            </div>

            <SidebarBtn 
              active={activeNav === 'offline'} 
              icon={<WifiOff className="w-4 h-4 text-emerald-400" />} 
              label="Offline Emergency" 
              badge={isEffectivelyOffline ? "Active" : "Pack"}
              onClick={() => { setActiveNav('offline'); setSidebarOpen(false); }}
            />
            <SidebarBtn 
              active={activeNav === 'documents'} 
              icon={<FileText className="w-4 h-4 text-cyan-400" />} 
              label="Documents" 
              onClick={() => { setActiveNav('documents'); setSidebarOpen(false); }}
            />
            <SidebarBtn 
              active={activeNav === 'settings'} 
              icon={<Settings className="w-4 h-4" />} 
              label="Settings" 
              onClick={() => { setActiveNav('settings'); setSidebarOpen(false); }}
            />
          </nav>
        </div>

        {/* Sidebar Footer: Upgrade Card & Profile */}
        <div className="space-y-3 pt-3 border-t border-slate-800/80">
          
          <div className="bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-3 shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">Pro Member</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2 leading-snug">
              Unlimited Live Interpreting & Offline Packs
            </p>
            <button 
              onClick={() => setShowProModal(true)}
              className="w-full py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-98 cursor-pointer"
            >
              View Plan Features
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <img 
                src={userProfile.avatar} 
                alt="User" 
                className="w-8 h-8 rounded-full ring-2 ring-indigo-500/40 object-cover" 
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">{userProfile.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{userProfile.email}</div>
              </div>
            </div>
            <button 
              title="Logout" 
              onClick={() => showToast("Logged in as John Doe (Active User)")}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </aside>

      {/* ========================================================= */}
      {/* 🖥️ MAIN WORKSPACE CONTENT AREA */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gradient-to-b from-[#090e1c] via-[#091024] to-[#070b16]">
        
        {/* Top Navbar */}
        <header className="h-16 shrink-0 border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-10 bg-[#090e1c]/80">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentStage('translator')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95 transition-all"
              title="Return to Main Standalone Live Translator"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Translator</span>
            </button>

            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/70 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Toggle Menu / All Tools"
            >
              <Menu className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline text-xs font-bold text-slate-300">Menu</span>
            </button>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">EchoBridge AI</span>
              <span className="text-slate-400">• Live Two-Way Interpreter</span>
            </div>

            {isEffectivelyOffline ? (
              <button 
                onClick={() => {
                  setForceOfflineMode(false);
                  showToast("Switched to Cloud Hybrid AI Mode ⚡");
                }}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 hover:bg-amber-500/25 transition-all cursor-pointer"
                title="Click to toggle Cloud AI mode"
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>📴 Offline Local Engine</span>
                {forceOfflineMode && <span className="text-[10px] text-amber-400/80 bg-amber-950/60 px-1.5 py-0.2 rounded font-mono">Simulated</span>}
              </button>
            ) : (
              <button 
                onClick={() => {
                  setForceOfflineMode(true);
                  showToast("Simulating Zero-Network Offline Mode: Built-in phrase packs active 📴");
                }}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5 hover:bg-blue-500/20 transition-all cursor-pointer"
                title="Click to simulate Zero-Network Offline Mode"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>⚡ Cloud AI Active</span>
              </button>
            )}

            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-800 pl-3">
              <span className="text-slate-500">Mode:</span>
              <button 
                onClick={() => setActiveNav('live-interpreter')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${activeNav === 'live-interpreter' || activeNav === 'speak-translate' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/30' : 'hover:text-white'}`}
              >
                Live 🔥
              </button>
              <button 
                onClick={() => setActiveNav('translator')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${activeNav === 'translator' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'hover:text-white'}`}
              >
                Quick
              </button>
              <button 
                onClick={() => setActiveNav('offline')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${activeNav === 'offline' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/30' : 'hover:text-white'}`}
              >
                Offline 📴
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>
            <button 
              onClick={() => showToast("EchoBridge AI status: All systems operational")}
              className="relative p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* VIEW 1: TRANSLATOR (PRIMARY PORTFOLIO DASHBOARD) */}
        {/* ========================================================= */}
        {activeNav === 'translator' && (
          <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-200">
            
            {/* HERO SECTION */}
            <div className="text-center relative pt-2 pb-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Next-Gen Multi-Modal AI Translation
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                ✨ AI Smart Translator
              </h2>
              <p className="text-slate-300 text-base font-medium mt-2">
                Translate. Understand. Communicate.
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Powered by Advanced AI • Supports 100+ Languages • Sub-second Instant Response
              </p>

              {/* Quick Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
                <FeaturePill icon={<Globe className="w-3.5 h-3.5 text-blue-400" />} label="Auto Detect" onClick={() => setSourceLang('auto')} />
                <FeaturePill icon={<Radio className="w-3.5 h-3.5 text-rose-400" />} label="Speak & Translate" onClick={() => setActiveNav('speak-translate')} />
                <FeaturePill icon={<Volume2 className="w-3.5 h-3.5 text-emerald-400" />} label="Text to Speech" onClick={() => speakText(translatedText, targetLang)} />
                <FeaturePill icon={<FileText className="w-3.5 h-3.5 text-amber-400" />} label="Document Translate" onClick={() => setActiveNav('documents')} />
                <FeaturePill icon={<MessageSquare className="w-3.5 h-3.5 text-purple-400" />} label="Conversation Mode" onClick={() => setActiveNav('conversation')} />
              </div>
            </div>

            {/* MAIN DUAL-PANE TRANSLATION CARD */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                
                {/* LEFT PANEL: Source Input */}
                <div className="flex flex-col justify-between bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 min-h-[260px] focus-within:border-blue-500/50 transition-all">
                  
                  <div className="flex items-center justify-between border-b border-slate-800/70 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <select 
                        value={sourceLang}
                        onChange={(e) => {
                          setSourceLang(e.target.value);
                          if (e.target.value !== 'auto') {
                            setVoiceLang(e.target.value);
                          }
                        }}
                        className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
                      >
                        {Object.entries(LANGUAGES).map(([code, name]) => (
                          <option key={code} value={code} className="bg-slate-900 text-slate-100">{name}</option>
                        ))}
                      </select>
                    </div>

                    {detectedLangName && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-400" />
                        Detected: {detectedLangName}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Enter text or click mic to speak in any language (e.g. danyavadalu, Tinnara?, Namaste)..."
                      className="w-full h-full min-h-[140px] bg-transparent text-slate-100 placeholder:text-slate-600 text-base leading-relaxed resize-none focus:outline-none"
                    />

                    {transliteratedScript && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>Romanized Script: <strong className="text-white font-medium">{transliteratedScript}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800/70 mt-3 text-slate-400 text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={toggleVoiceInput}
                        className={`p-2 rounded-xl transition-all ${
                          isListening 
                            ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                        title="Voice Input (Speech to Text)"
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>

                      <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60 text-xs">
                        <span className="text-[10px] text-slate-400 font-medium">Voice:</span>
                        <select 
                          value={voiceLang}
                          onChange={(e) => {
                            setVoiceLang(e.target.value);
                            showToast(`Voice microphone set to ${SPEECH_LANGS[e.target.value]?.name || e.target.value}`);
                          }}
                          className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
                        >
                          {Object.entries(SPEECH_LANGS).map(([code, info]) => (
                            <option key={code} value={code} className="bg-slate-900 text-slate-100">
                              {info.flag} {info.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button 
                        onClick={handleGrammarCheck}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors hidden sm:flex"
                        title="AI Grammar Correction"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>Grammar Polish</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-500">
                      {inputText.length} / 5000
                    </span>
                  </div>

                </div>

                {/* FLOATING SWAP BUTTON */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <button 
                    onClick={handleSwapLanguages}
                    title="Swap languages"
                    className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-xl shadow-blue-600/40 border-2 border-slate-900 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-5 h-5" />
                  </button>
                </div>

                {/* RIGHT PANEL: Target Output */}
                <div className="flex flex-col justify-between bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 min-h-[260px] relative">
                  
                  <div className="flex items-center justify-between border-b border-slate-800/70 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-400" />
                      <select 
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
                      >
                        {Object.entries(LANGUAGES).filter(([code]) => code !== 'auto').map(([code, name]) => (
                          <option key={code} value={code} className="bg-slate-900 text-slate-100">{name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-850 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px]">
                      <span className="text-slate-500">Tone:</span>
                      <select 
                        value={selectedTone}
                        onChange={(e) => setSelectedTone(e.target.value)}
                        className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer capitalize"
                      >
                        <option value="default" className="bg-slate-900">Default</option>
                        <option value="formal" className="bg-slate-900">Formal</option>
                        <option value="casual" className="bg-slate-900">Casual</option>
                        <option value="professional" className="bg-slate-900">Professional</option>
                        <option value="friendly" className="bg-slate-900">Friendly</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {isTranslating ? (
                      <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        <span>Instant Translating...</span>
                      </div>
                    ) : translatedText ? (
                      <div>
                        <p className="text-slate-100 text-lg font-semibold leading-relaxed">
                          {translatedText}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Zap className="w-3 h-3" /> {latencyMs || '< 20'}ms Instant
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600 text-sm italic py-4">
                        ✨ Your translation will appear here instantly...
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/70 mt-3 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => speakText(translatedText, targetLang)}
                        disabled={!translatedText}
                        className={`p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-30 ${isSpeaking ? 'text-blue-400 animate-pulse' : 'text-slate-300'}`}
                        title="Text-to-Speech"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleCopy(translatedText, 'main_out')}
                        disabled={!translatedText}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-30"
                        title="Copy to Clipboard"
                      >
                        {copiedId === 'main_out' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={handleDownloadSingle}
                        disabled={!translatedText}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-30"
                        title="Download as Text"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleShare(inputText, translatedText, sourceLang, targetLang)}
                        disabled={!translatedText}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-30"
                        title="Share Translation"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={handleSaveCurrent}
                        disabled={!translatedText}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-30"
                        title="Save to Favorites"
                      >
                        <Star className={`w-4 h-4 ${isCurrentFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePracticePronunciation(translatedText, targetLang)}
                        disabled={!translatedText || isPronouncing}
                        className={`px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-30 cursor-pointer ${isPronouncing ? 'animate-pulse ring-2 ring-emerald-500/50' : ''}`}
                        title="Practice Spoken Pronunciation"
                      >
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isPronouncing ? 'Listening...' : 'Practice Voice'}</span>
                      </button>
                      <button 
                        onClick={handleExplain}
                        disabled={!translatedText}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Explain
                      </button>
                      <button 
                        onClick={handleGetAlternatives}
                        disabled={!translatedText}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Alternatives
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* Big Translate Button */}
              <div className="flex justify-center mt-6">
                <button 
                  onClick={() => performTranslation(inputText, sourceLang, targetLang, selectedTone, true)}
                  disabled={!inputText.trim()}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Translate →</span>
                </button>
              </div>

            </div>

            {/* AI EXPLANATION / ALTERNATIVES DRAWER */}
            {showAiMenu && (explanationData || alternativesData) && (
              <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-sm text-slate-100">AI Deep Analysis & Alternatives</h3>
                  </div>
                  <button onClick={() => setShowAiMenu(false)} className="text-slate-500 hover:text-slate-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {explanationData && (
                  <div className="mb-4 space-y-2">
                    <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Pronunciation & Context</div>
                    <p className="text-sm text-slate-300">{explanationData.cultural_note}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {explanationData.breakdown?.map((b, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-200 border border-slate-700">
                          <strong>{b.word}</strong>: {b.meaning}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {alternativesData && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="text-xs text-purple-300 font-semibold uppercase tracking-wider">Alternative Phrasings</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                      {alternativesData.map((alt, idx) => (
                        <div key={idx} className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase">{alt.tone}</span>
                          <p className="text-sm font-semibold text-slate-100 mt-1">{alt.text}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{alt.tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4 FEATURE CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: 🔊 Speak & Translate (Smart Speaker Mode) */}
              <FeatureCard 
                color="indigo"
                icon={<Radio className="w-5 h-5 text-rose-400" />}
                title="Speak & Translate"
                desc="Smart Speaker: Speak & it responds aloud"
                onClick={() => setActiveNav('speak-translate')}
              />

              <FeatureCard 
                color="orange"
                icon={<MessageSquare className="w-5 h-5 text-orange-400" />}
                title="Conversation Mode"
                desc="Real-time two-way dialogue between 2 people"
                onClick={() => setActiveNav('conversation')}
              />

              <FeatureCard 
                color="emerald"
                icon={<FileText className="w-5 h-5 text-emerald-400" />}
                title="Document Translator"
                desc="Upload PDF, DOCX, TXT and more"
                onClick={() => setActiveNav('documents')}
              />

              <FeatureCard 
                color="blue"
                icon={<Clock className="w-5 h-5 text-blue-400" />}
                title="Translation History"
                desc="Access your past translations"
                onClick={() => setActiveNav('history')}
              />
            </div>

            {/* BOTTOM SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-300">Popular Languages</h4>
                  </div>
                  <span className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-medium">View All 100+ →</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {POPULAR_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setTargetLang(lang.code);
                        showToast(`Target language set to ${lang.name}`);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        targetLang === lang.code 
                          ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-sm' 
                          : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border-slate-700/60'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-300">Quick Actions</h4>
                  </div>

                  <div className="space-y-2 text-xs">
                    <button 
                      onClick={() => performTranslation(inputText, 'auto', targetLang, 'default', false)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 flex items-center justify-between transition-colors"
                    >
                      <span>Detect Language</span>
                      <span className="text-[10px] text-blue-400 font-semibold">{detectedCode}</span>
                    </button>
                    <button 
                      onClick={handleSaveCurrent}
                      className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 flex items-center justify-between transition-colors"
                    >
                      <span>Save Translation</span>
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    <button 
                      onClick={() => handleShare(inputText, translatedText, sourceLang, targetLang)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 flex items-center justify-between transition-colors"
                    >
                      <span>Share Translation</span>
                      <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: 🎙️ FLAGSHIP LIVE INTERPRETER (UNIVERSAL MODE) */}
        {/* ========================================================= */}
        {(activeNav === 'live-interpreter' || activeNav === 'speak-translate') && (
          <div className="p-6 md:p-8 max-w-5xl mx-auto w-full flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">
            
            {/* Header Banner */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                Live Hands-Free Continuous Interpreter 🔥
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                🎙️ Universal Live Interpreter
              </h2>
              <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">
                Continuous auto-listening, meaning understanding, and voice translation without repeatedly pressing the mic.
              </p>
            </div>

            {/* 🎭 SCENARIO PRESETS BAR (Feature 4: Doctor, Travel, Emergency, Interview, Shopping) */}
            <div className="w-full bg-slate-900/60 border border-slate-800 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Scenario:
                </span>
                {SCENARIOS.map((scen) => (
                  <button
                    key={scen.id}
                    onClick={() => {
                      setSelectedScenario(scen.id);
                      showToast(`Switched scenario to: ${scen.label}`);
                      fetchSmartReplies(speakerResponseText, speakerTargetLang, null, scen.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      selectedScenario === scen.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/30'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                    }`}
                    title={scen.desc}
                  >
                    <span>{scen.icon}</span>
                    <span>{scen.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick SOS Trigger (Feature 7) */}
              <button
                onClick={() => {
                  setSelectedScenario('emergency');
                  setSpeakerInputLang('te');
                  setSpeakerTargetLang('en');
                  processSpeakerVoice('దయచేసి అంబులెన్స్ పిలవండి, ఇది ఎమర్జెన్సీ!', 'te', 'en');
                  showToast("🚨 Emergency SOS Phrase Activated!");
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
                title="Immediate 1-Touch Emergency Medical SOS"
              >
                <span>🚨 Emergency SOS</span>
              </button>
            </div>

            {/* 🔮 CENTRAL 3D GLOWING AI ORB & HERO CONVERSATION VISUALIZER */}
            <div className="w-full bg-gradient-to-b from-slate-900/90 via-[#0a1128]/80 to-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
              
              {/* Ambient radial blur glow */}
              <div className="absolute w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none -top-16" />

              {/* Central Glowing AI Audio Orb */}
              <div className="relative my-3 flex items-center justify-center">
                {/* Concentric pulsing rings */}
                <div className={`absolute w-36 h-36 rounded-full border transition-all duration-700 pointer-events-none ${
                  isLiveActive 
                    ? 'border-cyan-400/30 scale-125 animate-ping' 
                    : 'border-blue-500/10'
                }`} style={{ animationDuration: '2.4s' }} />

                <div className={`absolute w-28 h-28 rounded-full border transition-all duration-500 pointer-events-none ${
                  isLiveActive 
                    ? 'border-indigo-400/40 scale-110 animate-pulse' 
                    : 'border-slate-800'
                }`} />

                {/* The Core Orb Button */}
                <button
                  onClick={toggleLiveInterpreting}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative z-10 cursor-pointer group active:scale-95 ${
                    isLiveActive 
                      ? 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-cyan-500/50 ring-4 ring-cyan-400/40 animate-pulse' 
                      : 'bg-gradient-to-tr from-blue-700 via-indigo-700 to-cyan-600 hover:shadow-blue-500/40 hover:scale-105'
                  }`}
                  title={isLiveActive ? "Click to Pause Live Interpreter" : "Click to Start Live Conversation"}
                >
                  {isLiveActive ? (
                    <Mic className="w-8 h-8 text-white animate-bounce" />
                  ) : (
                    <Mic className="w-8 h-8 text-white/90 group-hover:scale-110 transition-transform" />
                  )}
                </button>
              </div>

              {/* Status Header */}
              <div className="mt-2 space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-slate-800 text-xs">
                  <span className={`w-2 h-2 rounded-full ${isLiveActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="font-bold text-white tracking-wide">
                    {speakerState === 'listening' ? '👂 Listening to speech...' :
                     speakerState === 'translating' ? '🧠 AI Interpreting meaning...' :
                     speakerState === 'speaking' ? '🔊 Speaking translation...' :
                     isLiveActive ? '🟢 Live Interpreter Active' : 'Ready to Interpret'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {isLiveActive 
                    ? 'Speak naturally in Telugu or Hindi/English — automatic turn detection active' 
                    : 'Two people speak naturally in different languages. EchoBridge AI translates and speaks in real-time.'}
                </p>
              </div>

              {/* Audio Waveform visualization bars when active */}
              {isLiveActive && (
                <div className="flex items-center gap-1.5 h-6 mt-3">
                  {[30, 60, 95, 45, 80, 50, 90, 70, 40, 65, 35].map((h, i) => (
                    <span 
                      key={i} 
                      className="w-1 bg-gradient-to-t from-cyan-400 to-indigo-400 rounded-full animate-pulse"
                      style={{ 
                        height: `${h}%`,
                        animationDelay: `${i * 0.08}s`,
                        animationDuration: '0.7s'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* UNIVERSAL LANGUAGE CONFIGURATION BAR */}
            <div className="w-full bg-slate-900/90 border border-slate-800 p-5 rounded-3xl backdrop-blur-xl shadow-2xl space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                
                {/* 🎤 I SPEAK */}
                <div className="md:col-span-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5" /> 🎤 I SPEAK (My Language)
                    </span>
                    <select 
                      value={speakerInputLang}
                      onChange={(e) => setSpeakerInputLang(e.target.value)}
                      className="bg-transparent text-sm font-bold text-slate-100 focus:outline-none cursor-pointer"
                    >
                      {Object.entries(SPEECH_LANGS).map(([code, info]) => (
                        <option key={code} value={code} className="bg-slate-900 text-slate-100">{info.flag} {info.name}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold">
                    Source
                  </span>
                </div>

                {/* Swap Button */}
                <div className="md:col-span-1 flex justify-center">
                  <button 
                    onClick={() => {
                      const prevIn = speakerInputLang;
                      setSpeakerInputLang(speakerTargetLang);
                      setSpeakerTargetLang(prevIn);
                      showToast(`Swapped: ${SPEECH_LANGS[speakerTargetLang]?.name || speakerTargetLang} ⇄ ${SPEECH_LANGS[prevIn]?.name || prevIn}`);
                    }}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white border border-slate-700 transition-all hover:scale-110 active:scale-95 shadow-md cursor-pointer"
                    title="Swap Spoken and Response Languages"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* 🌍 TRANSLATE TO */}
                <div className="md:col-span-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5" /> 🌍 TRANSLATE TO (Speaker Responds)
                    </span>
                    <select 
                      value={speakerTargetLang}
                      onChange={(e) => setSpeakerTargetLang(e.target.value)}
                      className="bg-transparent text-sm font-bold text-slate-100 focus:outline-none cursor-pointer"
                    >
                      {Object.entries(LANGUAGES).filter(([c]) => c !== 'auto').map(([code, name]) => (
                        <option key={code} value={code} className="bg-slate-900 text-slate-100">{name}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                    Target
                  </span>
                </div>

              </div>

              {/* ACTION BUTTONS & TWO-WAY TOGGLE */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                
                {/* 🟢 START / 🔴 STOP LIVE BUTTON */}
                <button 
                  onClick={toggleLiveInterpreting}
                  className={`flex-1 min-w-[240px] py-3.5 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-3 transition-all duration-300 shadow-xl cursor-pointer active:scale-98 ${
                    isLiveActive 
                      ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/40 ring-4 ring-rose-500/20 animate-pulse' 
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/40 hover:shadow-emerald-500/60 ring-4 ring-emerald-500/10'
                  }`}
                >
                  {isLiveActive ? (
                    <>
                      <MicOff className="w-5 h-5 text-white animate-spin-slow" />
                      <span>🔴 STOP LIVE INTERPRETING</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 text-white" />
                      <span>🟢 START LIVE INTERPRETING (Hands-Free Auto-Listen)</span>
                    </>
                  )}
                </button>

                {/* 🌐 Feature 2: Auto Two-Way Language Detect Toggle */}
                <button 
                  onClick={() => {
                    const next = !autoTwoWayDetect;
                    setAutoTwoWayDetect(next);
                    showToast(next ? "🌐 Auto Two-Way Detection ACTIVE: Zero-interruption speech routing" : "Manual Language Switch Active");
                  }}
                  className={`px-3.5 py-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    autoTwoWayDetect 
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-lg shadow-blue-600/20' 
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Automatically identifies which person is speaking and translates to the other language without touching anything"
                >
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>Auto Two-Way Detect</span>
                  {autoTwoWayDetect && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>

                {/* Two-Way Alternating Switch Toggle */}
                <button 
                  onClick={() => {
                    const next = !twoWayAutoSwitch;
                    setTwoWayAutoSwitch(next);
                    showToast(next ? "👥 Two-Way Turn Alternate Active: Will alternate after each sentence" : "Single speaker mode active");
                  }}
                  className={`px-3.5 py-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    twoWayAutoSwitch 
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-lg shadow-indigo-600/20' 
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Alternates turns between Speaker 1 and Speaker 2"
                >
                  <Repeat className="w-4 h-4 text-indigo-400" />
                  <span>Turn Alternate</span>
                  {twoWayAutoSwitch && (
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                      {currentSpeakerTurn === 'A' ? SPEECH_LANGS[speakerInputLang]?.name?.split(' ')[0] : LANGUAGES[speakerTargetLang]?.split(' ')[0]}
                    </span>
                  )}
                </button>

              </div>

            </div>

            {/* 👑 CULTURAL & POLITENESS COACH CARD (Feature 5) */}
            {politenessInfo.flag && (
              <div className="w-full bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-900/20 border border-amber-500/40 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wide block">
                      👑 Cultural & Politeness Coach
                    </span>
                    <p className="text-xs text-slate-300 leading-snug">
                      {politenessInfo.tip}
                    </p>
                  </div>
                </div>
                {politenessInfo.suggestion && (
                  <button
                    onClick={() => {
                      setSpeakerHeardText(politenessInfo.suggestion);
                      processSpeakerVoice(politenessInfo.suggestion);
                      showToast("Switched to respectful honorific form ✨");
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Use Respectful Alternative ➔
                  </button>
                )}
              </div>
            )}

            {/* LIVE AUDIO STATUS & INTERIM DISPLAY */}
            <div className={`w-full rounded-2xl p-4 border transition-all ${
              isLiveActive 
                ? 'bg-rose-950/20 border-rose-500/30 shadow-lg' 
                : 'bg-slate-900/50 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    speakerState === 'listening' ? 'bg-rose-500 animate-ping' :
                    speakerState === 'translating' ? 'bg-amber-400 animate-pulse' :
                    speakerState === 'speaking' ? 'bg-emerald-400 animate-bounce' : 'bg-slate-600'
                  }`} />
                  {speakerState === 'listening' && (
                    <span className="text-rose-300 font-bold">
                      👂 Listening in {SPEECH_LANGS[twoWayAutoSwitch && currentSpeakerTurn === 'B' ? speakerTargetLang : speakerInputLang]?.name}... Speak now!
                    </span>
                  )}
                  {speakerState === 'translating' && (
                    <span className="text-amber-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                      🧠 Understanding meaning & translating in real-time...
                    </span>
                  )}
                  {speakerState === 'speaking' && (
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      🔊 Speaking aloud in {LANGUAGES[speakerTargetLang]}...
                    </span>
                  )}
                  {speakerState === 'idle' && (
                    <span className="text-slate-400">
                      Standby • Click "Start Live Interpreting" to begin continuous hands-free translation
                    </span>
                  )}
                </span>
                
                <span className="text-[11px] text-slate-500">
                  {isEffectivelyOffline ? '📴 Zero-Network Offline Engine' : '⚡ Hybrid Fast Path + AI Active'}
                </span>
              </div>

              {/* Interim Real-Time Speech Text */}
              {liveInterimText && (
                <div className="bg-slate-950/60 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-200 italic flex items-center gap-2">
                  <Mic className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
                  <span>Hearing: "{liveInterimText}..."</span>
                </div>
              )}
            </div>

            {/* DUAL DISPLAY CARDS: USER SPOKE vs SPEAKER RESPONDED */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Box 1: What You Said */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
                    <span className="font-bold flex items-center gap-1.5 text-blue-400 uppercase tracking-wide">
                      <Mic className="w-4 h-4" /> 🎤 YOU SAID — {SPEECH_LANGS[speakerInputLang]?.name || 'Telugu (తెలుగు)'}
                    </span>
                    {speakerTransScript && (
                      <span className="text-[10px] bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
                        {speakerTransScript}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-slate-100 min-h-[50px] leading-relaxed">
                    "{speakerHeardText || "Waiting for speech..."}"
                  </p>

                  {/* 🔀 Feature 3: Code-Mixed Language Badge */}
                  {codeMixedInfo.isCodeMixed && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Code-Mixed: <strong className="text-white font-bold">{codeMixedInfo.type}</strong></span>
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between">
                  <span>Input Meaning & Context</span>
                  <span className="text-blue-400 font-mono text-[11px]">{speakerInputLang}</span>
                </div>
              </div>

              {/* Box 2: Speaker Response */}
              <div className="bg-slate-900/90 border border-purple-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between text-xs text-purple-300 mb-2.5">
                    <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide">
                      <Volume2 className="w-4 h-4 text-purple-400" /> 🔊 TRANSLATED RESPONSE — {LANGUAGES[speakerTargetLang] || 'Hindi'}
                    </span>
                    <button 
                      onClick={() => speakText(speakerResponseText, speakerTargetLang)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-purple-300 transition-colors cursor-pointer"
                      title="Replay Spoken Audio"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-2xl font-extrabold text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 bg-clip-text min-h-[50px] leading-relaxed">
                    "{speakerResponseText || "Waiting for speech..."}"
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800/80 mt-3 text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Spoken in real-time
                    </span>

                    {/* 🎯 Feature 6: Pronunciation Practice Trigger */}
                    <button
                      onClick={() => handlePracticePronunciation(speakerResponseText, speakerTargetLang)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      title="Practice pronouncing this sentence"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Practice Speaking</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => handleCopy(speakerResponseText, 'speak_out')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'speak_out' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                </div>
              </div>

            </div>

            {/* SMART SUGGESTED REPLIES FOR CONFIDENT COMMUNICATION (Feature 1) */}
            <div className="w-full bg-slate-900/70 border border-indigo-500/30 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Smart Suitable Replies ({selectedScenario.toUpperCase()} Mode):</span>
                </div>
                <span className="text-[10px] text-slate-400">Tap any reply to speak aloud in {LANGUAGES[speakerTargetLang]}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {smartReplies.map((r, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      speakText(r.reply, speakerTargetLang);
                      showToast(`Speaking reply: "${r.reply}"`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-indigo-400 text-xs text-slate-200 transition-all flex items-center gap-2 group cursor-pointer active:scale-95"
                  >
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">
                      {r.tone}
                    </span>
                    <span className="font-medium group-hover:text-white">"{r.reply}"</span>
                    <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* 1-CLICK QUICK TEST PHRASES (MEANING TRANSLATION & SCENARIO DEMOS) */}
            <div className="w-full bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                ⚡ 1-Click Feature Demonstrations (Scenario, Politeness & Code-Mixing):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { phrase: 'మీరు ఎలా ఉన్నారు?', input: 'te', target: 'hi', expected: 'आप कैसे हैं?', label: 'Telugu ➔ Hindi Meaning' },
                  { phrase: 'Meeting ki late avutunna, please wait cheyyi', input: 'te', target: 'en', expected: 'Late for meeting', label: '🔀 Tenglish Mix' },
                  { phrase: 'nuvvu ekkadiki velthunnav', input: 'te', target: 'en', expected: 'Where are you going', label: '👑 Politeness Coach' },
                  { phrase: 'I have severe chest pain and breathlessness', input: 'en', target: 'te', expected: 'తీవ్రమైన ఛాతీ నొప్పి', label: '🏥 Doctor Mode' },
                  { phrase: 'Train platform number kitna hai?', input: 'hi', target: 'te', expected: 'రైలు ప్లాట్‌ఫారమ్', label: '🚉 Transit Mode' },
                  { phrase: 'మీరు ఎక్కడికి వెళ్తున్నారు?', input: 'te', target: 'hi', expected: 'आप कहाँ जा रहे हैं?', label: 'Telugu ➔ Hindi' },
                  { phrase: 'నమస్తే', input: 'te', target: 'en', expected: 'Hello', label: 'నమస్తే ➔ Hello' },
                  { phrase: 'తిన్నారా?', input: 'te', target: 'en', expected: 'Did you eat?', label: 'తిన్నారా ➔ Did you eat?' },
                  { phrase: 'Danyavadalu', input: 'te', target: 'en', expected: 'Thank you', label: 'Romanized Telugu' },
                  { phrase: 'Ela unnaru?', input: 'te', target: 'hi', expected: 'आप कैसे हैं?', label: 'Ela unnaru ➔ Hindi' }
                ].map((demo, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSpeakerInputLang(demo.input);
                      setSpeakerTargetLang(demo.target);
                      processSpeakerVoice(demo.phrase, demo.input, demo.target);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700/80 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/30">{demo.label}</span>
                    <span>"{demo.phrase.length > 25 ? demo.phrase.substring(0, 25) + '...' : demo.phrase}"</span>
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE CONVERSATION STREAM LOG WITH EXPORT TRANSCRIPT (Feature 8) */}
            <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-sm text-slate-200">Live Session Stream ({liveSessionLog.length})</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* 📄 Feature 8: Export Transcript Button */}
                  <button
                    onClick={() => setShowTranscriptModal(true)}
                    className="px-3 py-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export Transcript 📄</span>
                  </button>

                  <button 
                    onClick={() => setLiveSessionLog([])}
                    className="text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {liveSessionLog.map((log) => (
                  <div key={log.id} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold text-[10px]">
                          {log.speaker}
                        </span>
                        <span className="text-slate-500 text-[10px]">{log.time}</span>
                        {log.scenario && log.scenario !== 'general' && (
                          <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800/30">
                            [{log.scenario}]
                          </span>
                        )}
                        {log.codeMixedType && (
                          <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/30">
                            [{log.codeMixedType}]
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-slate-300">
                        <span className="font-medium text-slate-200">"{log.spoken}"</span>
                        <span className="text-slate-500">➔</span>
                        <span className="font-bold text-indigo-300">"{log.translated}"</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => speakText(log.translated, log.targetLang)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                      title="Replay Voice"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: 📴 ZERO-NETWORK OFFLINE TRANSLATION HUB */}
        {/* ========================================================= */}
        {activeNav === 'offline' && (
          <div className="p-6 md:p-8 max-w-5xl mx-auto w-full flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <WifiOff className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Zero-Network Offline Translation Engine
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                📴 Offline Translation Hub
              </h2>
              <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">
                No internet? No problem. EchoBridge AI includes pre-loaded local phrase packs, semantic meaning caches, and offline voice synthesis for seamless communication anytime, anywhere.
              </p>
            </div>

            {/* Offline Status & Force Toggle Bar */}
            <div className="w-full bg-slate-900/90 border border-slate-800 p-5 rounded-3xl backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isEffectivelyOffline ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                  <span className="font-extrabold text-sm text-slate-100">
                    Status: {isEffectivelyOffline ? 'Offline Local Engine Active' : 'Online (Internet Connected)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {isEffectivelyOffline 
                    ? 'Using zero-network built-in language packs & cached translations.' 
                    : 'Cloud AI active. You can test Zero-Network Mode by clicking the toggle button.'}
                </p>
              </div>

              <button 
                onClick={() => {
                  setForceOfflineMode(!forceOfflineMode);
                  showToast(!forceOfflineMode ? "📴 Simulated Offline Mode Enabled" : "⚡ Cloud AI Enabled");
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  forceOfflineMode 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/20' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {forceOfflineMode ? "Disable Forced Offline Mode" : "Simulate Zero-Network Mode 📴"}
              </button>
            </div>

            {/* Downloaded Offline Language Packs */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" /> Pre-Loaded Offline Language Packs
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {OFFLINE_PACKS.map((pack) => (
                  <div key={pack.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-slate-200">{pack.name}</div>
                      <div className="text-[11px] text-slate-400">{pack.count} • {pack.size}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Ready
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Offline Phrasebook & Tester */}
            <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" /> Built-in Offline Phrasebook ({OFFLINE_PHRASEBOOK.length} Phrases)
                  </h3>
                  <p className="text-xs text-slate-400">Click any phrase to translate and speak offline instantly</p>
                </div>
                
                {/* Search */}
                <input 
                  type="text"
                  placeholder="Search offline phrases..."
                  value={offlineSearch}
                  onChange={(e) => setOfflineSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Greetings', 'Courtesies', 'Conversation', 'Dining', 'Directions', 'Health', 'Emergency', 'Shopping'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setOfflineCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      offlineCategory === cat 
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Phrases Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {OFFLINE_PHRASEBOOK
                  .filter(item => {
                    const matchesCat = offlineCategory === 'All' || item.category === offlineCategory;
                    const matchesSearch = !offlineSearch || 
                      item.sources.some(s => s.toLowerCase().includes(offlineSearch.toLowerCase())) ||
                      Object.values(item.translations).some(t => t.toLowerCase().includes(offlineSearch.toLowerCase()));
                    return matchesCat && matchesSearch;
                  })
                  .map((item, idx) => {
                    const primaryTelugu = item.sources.find(s => /[\u0C00-\u0C7F]/.test(s)) || item.sources[0];
                    const romanized = item.sources.find(s => s !== primaryTelugu && /^[a-zA-Z\s?]+$/.test(s)) || '';
                    const translated = item.translations[targetLang] || item.translations['en'];

                    return (
                      <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between gap-2 hover:border-emerald-500/40 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200 text-sm">{primaryTelugu}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                        </div>
                        {romanized && (
                          <span className="text-[11px] text-indigo-400 italic">"{romanized}"</span>
                        )}
                        <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-xs">
                          <span className="font-semibold text-emerald-300">➔ {translated}</span>
                          <button 
                            onClick={() => {
                              speakText(translated, targetLang);
                              showToast(`Spoken offline: "${translated}"`);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-800 text-emerald-400 transition-colors cursor-pointer"
                            title="Play Offline Voice"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: TRANSLATION HISTORY */}
        {/* ========================================================= */}
        {activeNav === 'history' && (
          <div className="p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-400" /> Translation History
                </h2>
                <p className="text-slate-400 text-xs mt-1">Review, search, replay and export your translations</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search history..."
                    className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
                  />
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("Clear all history?")) {
                      setHistory([]);
                      showToast("History cleared");
                    }
                  }}
                  disabled={history.length === 0}
                  className="p-2 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-400 hover:bg-rose-900/60 transition-colors disabled:opacity-30"
                  title="Clear All"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-16 text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-semibold">No translations found</p>
                <p className="text-xs text-slate-600 mt-1">Translations you create will be automatically preserved here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map(item => (
                  <div key={item.id} className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex flex-col gap-2 transition-all group">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 font-semibold text-slate-300">
                          {item.detected_lang || 'Source'} → {LANGUAGES[item.target_lang] || item.target_lang}
                        </span>
                        <span>{item.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => speakText(item.translated_text, item.target_lang)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-lg transition-colors"
                          title="Replay Audio"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleCopy(item.translated_text, item.id)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
                          title="Copy"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={() => {
                            setHistory(prev => prev.map(p => p.id === item.id ? { ...p, favorite: !p.favorite } : p));
                          }}
                          className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Favorite"
                        >
                          <Star className={`w-3.5 h-3.5 ${item.favorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-amber-400'}`} />
                        </button>
                        <button 
                          onClick={() => setHistory(prev => prev.filter(p => p.id !== item.id))}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300">{item.original_text}</p>
                    <div className="border-t border-slate-800/80 my-1" />
                    <p className="text-base font-semibold text-blue-300">{item.translated_text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: FAVORITES */}
        {/* ========================================================= */}
        {activeNav === 'favorites' && (
          <div className="p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> Starred & Saved Translations
              </h2>
              <p className="text-slate-400 text-xs mt-1">Bookmarked translations for quick access</p>
            </div>

            {favoritesList.length === 0 ? (
              <div className="text-center py-16 text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-semibold">No favorites saved yet</p>
                <p className="text-xs text-slate-600 mt-1">Click the star icon ⭐ on any translation card to bookmark it.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favoritesList.map(item => (
                  <div key={item.id} className="bg-slate-900/80 border border-amber-500/30 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="font-semibold text-slate-300">{item.detected_lang} → {LANGUAGES[item.target_lang]}</span>
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{item.original_text}</p>
                      <p className="text-base font-bold text-amber-300">{item.translated_text}</p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80 mt-4">
                      <button 
                        onClick={() => speakText(item.translated_text, item.target_lang)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-blue-400" /> Play
                      </button>
                      <button 
                        onClick={() => handleCopy(item.translated_text, 'fav_' + item.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                      <button 
                        onClick={() => {
                          setHistory(prev => prev.map(p => p.id === item.id ? { ...p, favorite: false } : p));
                          showToast("Removed from favorites");
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-xs text-rose-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: DOCUMENT TRANSLATION */}
        {/* ========================================================= */}
        {activeNav === 'documents' && (
          <div className="p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-emerald-400" /> Document Translation
              </h2>
              <p className="text-slate-400 text-xs mt-1">Translate entire PDF, DOCX, and TXT documents preserving structure</p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-3xl p-8 text-center bg-slate-900/60 transition-all">
              <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-3 animate-bounce" />
              <h3 className="font-bold text-base text-slate-200">Upload your file to translate</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">Supports .PDF, .DOCX, .TXT, and .MD files</p>
              
              <div className="flex items-center justify-center gap-3">
                <label className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer shadow-lg shadow-emerald-600/30 transition-all">
                  <span>Browse Document</span>
                  <input type="file" accept=".pdf,.docx,.txt,.md" onChange={handleDocumentUpload} className="hidden" />
                </label>
              </div>

              {isTranslatingDoc && (
                <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400 text-sm">
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>Translating document paragraphs with neural engine...</span>
                </div>
              )}
            </div>

            {documentResult && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      {documentResult.filename}
                    </h4>
                    <span className="text-[11px] text-slate-400">{documentResult.total_paragraphs} paragraphs translated into {LANGUAGES[targetLang]}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const blob = new Blob([documentResult.full_translated_text], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `translated-${documentResult.filename}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast("Downloaded translated document");
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Translated (.txt)
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {documentResult.paragraphs?.map((para, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
                      <div className="text-slate-400">{para.original}</div>
                      <div className="text-emerald-300 font-medium">{para.translated}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: TWO-WAY REAL-TIME CONVERSATION MODE */}
        {/* ========================================================= */}
        {activeNav === 'conversation' && (
          <div className="p-8 max-w-5xl mx-auto w-full flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-orange-400" /> Real-time Two-Way Conversation Mode
              </h2>
              <p className="text-slate-400 text-xs mt-1">Split-screen live interpreter for two people conversing in different languages</p>
            </div>

            <div className="flex-1 min-h-[350px] bg-slate-900/60 border border-slate-800 rounded-3xl p-6 overflow-y-auto space-y-4">
              {conversation.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.speaker === 'A' ? 'items-start' : 'items-end'}`}>
                  <div className={`max-w-md p-4 rounded-2xl ${
                    msg.speaker === 'A' 
                      ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tl-sm' 
                      : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 rounded-tr-sm'
                  }`}>
                    <div className="flex items-center justify-between gap-4 text-[10px] uppercase font-bold text-slate-400 mb-1">
                      <span>{msg.speaker === 'A' ? 'Speaker A' : 'Speaker B'} ({LANGUAGES[msg.lang] || msg.lang})</span>
                      <button onClick={() => speakText(msg.translated, msg.speaker === 'A' ? convSpeakerB_Lang : convSpeakerA_Lang)}>
                        <Volume2 className="w-3.5 h-3.5 hover:text-white" />
                      </button>
                    </div>
                    <p className="text-sm font-medium">{msg.text}</p>
                    <div className="mt-1 pt-1 border-t border-slate-700/50 text-xs font-semibold text-slate-200">
                      ↳ {msg.translated}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CONVERSATION SMART REPLIES (Headline Pitch Feature) */}
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Suggested Replies:</span>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {smartReplies.map((r, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const lastSpeaker = conversation[conversation.length - 1]?.speaker;
                      if (lastSpeaker === 'A') {
                        setConvInputB(r.reply);
                        showToast(`Filled in Speaker B: "${r.reply}"`);
                      } else {
                        setConvInputA(r.reply);
                        showToast(`Filled in Speaker A: "${r.reply}"`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600/30 text-xs text-slate-200 border border-slate-700/80 hover:border-indigo-400/50 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <span className="text-[10px] uppercase font-bold text-indigo-400">{r.tone}:</span>
                    <span className="font-medium">"{r.reply}"</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold text-blue-400">Speaker A Language:</span>
                  <select 
                    value={convSpeakerA_Lang} 
                    onChange={(e) => setConvSpeakerA_Lang(e.target.value)}
                    className="bg-slate-800 text-xs px-2 py-1 rounded-lg border border-slate-700 text-slate-200"
                  >
                    {Object.entries(LANGUAGES).filter(([c]) => c !== 'auto').map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={convInputA}
                    onChange={(e) => setConvInputA(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendConversationMessage('A', convInputA)}
                    placeholder="Speaker A speaks / types..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <button 
                    onClick={() => handleSendConversationMessage('A', convInputA)}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    <SendHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold text-indigo-400">Speaker B Language:</span>
                  <select 
                    value={convSpeakerB_Lang} 
                    onChange={(e) => setConvSpeakerB_Lang(e.target.value)}
                    className="bg-slate-800 text-xs px-2 py-1 rounded-lg border border-slate-700 text-slate-200"
                  >
                    {Object.entries(LANGUAGES).filter(([c]) => c !== 'auto').map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={convInputB}
                    onChange={(e) => setConvInputB(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendConversationMessage('B', convInputB)}
                    placeholder="Speaker B speaks / types..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <button 
                    onClick={() => handleSendConversationMessage('B', convInputB)}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <SendHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: ANALYTICS DASHBOARD */}
        {/* ========================================================= */}
        {activeNav === 'analytics' && (
          <div className="p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-cyan-400" /> Translation Analytics & Insights
              </h2>
              <p className="text-slate-400 text-xs mt-1">Live metrics, vocabulary growth, and speed performance</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Translations" value={dbAnalytics?.total_translations ?? history.length} subtitle="+ live synced" />
              <MetricCard title="Words Interpreted" value={dbAnalytics?.total_words ?? 384} subtitle="Persistent in SQLite" />
              <MetricCard title="Avg Latency" value={`${dbAnalytics?.average_latency_ms ?? latencyMs ?? 28} ms`} subtitle="Ultra-low response" />
              <MetricCard title="Favorites Saved" value={dbAnalytics?.favorites_count ?? favoritesList.length} subtitle="Starred expressions" />
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="font-bold text-sm text-slate-200">Most Translated Language Pairs</h4>
              <div className="space-y-3">
                {dbAnalytics?.language_pairs && dbAnalytics.language_pairs.length > 0 ? (
                  dbAnalytics.language_pairs.map((p, idx) => (
                    <LanguageProgress 
                      key={idx} 
                      label={p.pair} 
                      percentage={Math.min(100, Math.round((p.count / (dbAnalytics.total_translations || 1)) * 100))} 
                      count={`${p.count} translations`} 
                      color={idx === 0 ? 'blue' : idx === 1 ? 'indigo' : 'purple'} 
                    />
                  ))
                ) : (
                  <>
                    <LanguageProgress label="Telugu (తెలుగు) ⇄ English" percentage={75} count="32 translations" color="blue" />
                    <LanguageProgress label="Hindi (हिन्दी) ⇄ English" percentage={45} count="18 translations" color="indigo" />
                    <LanguageProgress label="Spanish (Español) ⇄ English" percentage={20} count="8 translations" color="purple" />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 7: SETTINGS */}
        {/* ========================================================= */}
        {activeNav === 'settings' && (
          <div className="p-8 max-w-3xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-400" /> Application Settings
              </h2>
              <p className="text-slate-400 text-xs mt-1">Configure audio, AI options, and profile preferences</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h4 className="font-semibold text-sm text-slate-200">Auto Speak Output</h4>
                  <p className="text-xs text-slate-400">Automatically speak translated sentences after recognition</p>
                </div>
                <button 
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${autoSpeak ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h4 className="font-semibold text-sm text-slate-200">Speech Rate / Speed</h4>
                  <p className="text-xs text-slate-400">Adjust the voice playback speed</p>
                </div>
                <div className="flex gap-1.5 bg-slate-800 p-1 rounded-xl">
                  {[0.8, 1.0, 1.25].map(s => (
                    <button
                      key={s}
                      onClick={() => setSpeechSpeed(s)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${speechSpeed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h4 className="font-semibold text-sm text-slate-200">Default Target Language</h4>
                  <p className="text-xs text-slate-400">Language selected upon opening the app</p>
                </div>
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-xl"
                >
                  {Object.entries(LANGUAGES).filter(([c]) => c !== 'auto').map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>

              {/* 📴 OFFLINE MODE TOGGLE */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h4 className="font-semibold text-sm text-slate-200">Force Offline Simulation</h4>
                  <p className="text-xs text-slate-400">Test offline phrase packs & voice without disconnecting WiFi</p>
                </div>
                <button 
                  onClick={() => {
                    setForceOfflineMode(!forceOfflineMode);
                    showToast(!forceOfflineMode ? "📴 Offline Simulation Mode Active" : "⚡ Cloud AI Mode Restored");
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${forceOfflineMode ? 'bg-amber-600 justify-end' : 'bg-slate-700 justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* OFFLINE PACKS STATUS */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-slate-200">Installed Offline Packs</h4>
                  <button 
                    onClick={() => setActiveNav('offline')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    Open Offline Hub ➔
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OFFLINE_PACKS.map((p) => (
                    <div key={p.id} className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="text-slate-200 font-medium">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{p.count} • {p.size}</div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">Installed</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* PRO UPGRADE MODAL */}
        {showProModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-center">
              <button 
                onClick={() => setShowProModal(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
                <Crown className="w-7 h-7 text-slate-950" />
              </div>

              <h3 className="text-2xl font-extrabold text-white">Upgrade to Pro Membership</h3>
              <p className="text-slate-400 text-xs mt-1 mb-6">
                Supercharge your translation workflow with full AI features & unlimited access
              </p>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-left space-y-3 mb-6">
                {[
                  "Unlimited instant translations (< 20ms response)",
                  "All 100+ global & Indian languages unlocked",
                  "Document Translation (PDF, DOCX, TXT without limits)",
                  "Two-way Real-time Conversation Mode",
                  "Smart Speaker Hands-free Voice Translation Loop",
                  "OpenAI GPT-4o-mini & Deep Context Analysis",
                  "Cloud & SQLite Persistent Storage Sync"
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between bg-indigo-950/30 border border-indigo-500/30 p-3.5 rounded-2xl mb-6 text-left">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block">Current Status</span>
                  <span className="text-sm font-bold text-white">Pro Member (Active Demo)</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Active
                </span>
              </div>

              <button 
                onClick={() => {
                  setShowProModal(false);
                  showToast("Pro features are fully active and unlocked on your account!");
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
              >
                Keep Enjoying Pro Features
              </button>
            </div>
          </div>
        )}

        {/* 🎯 PRONUNCIATION PRACTICE MODAL */}
        {showPronounceModal && pronounceResult && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full text-center relative shadow-2xl">
              <button 
                onClick={() => setShowPronounceModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Mic className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">Pronunciation Coach</h3>
              <p className="text-xs text-slate-400 mb-6">Real-time phonetic and speech accuracy analysis</p>

              {/* Accuracy Score Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Accuracy Score</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    pronounceResult.score >= 80 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : pronounceResult.score >= 60 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {pronounceResult.grade}
                  </span>
                </div>
                <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 mb-2">
                  {pronounceResult.score}%
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${
                      pronounceResult.score >= 80 ? 'bg-emerald-400' : pronounceResult.score >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                    }`} 
                    style={{ width: `${pronounceResult.score}%` }}
                  />
                </div>
              </div>

              {/* Sentences */}
              <div className="space-y-3 mb-5 text-left text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">TARGET SENTENCE:</span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-100 font-semibold text-sm">{pronounceResult.reference || pronounceResult.reference_text}</span>
                    <button 
                      onClick={() => speakText(pronounceResult.reference || pronounceResult.reference_text, pronounceResult.target_lang)}
                      className="p-1.5 rounded-lg bg-slate-800 text-indigo-300 hover:bg-slate-700 cursor-pointer"
                      title="Listen to Native Pronunciation"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">WHAT WE HEARD:</span>
                  <span className="text-emerald-300 font-medium text-sm">
                    "{pronounceResult.attempt || pronounceResult.spoken_attempt || 'No clear speech detected'}"
                  </span>
                </div>
              </div>

              {/* Word by Word Analysis */}
              {(pronounceResult.matched_words || pronounceResult.word_analysis) && (pronounceResult.matched_words || pronounceResult.word_analysis).length > 0 && (
                <div className="mb-5 text-left">
                  <span className="text-[10px] text-slate-400 font-bold block mb-2 uppercase">Word Breakdown:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(pronounceResult.matched_words || pronounceResult.word_analysis).map((w, idx) => (
                      <span 
                        key={idx}
                        className={`text-xs px-2 py-0.5 rounded-md font-mono ${
                          w.status === 'correct' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {w.status === 'correct' ? '✓ ' : '✗ '}{w.word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              <p className="text-xs text-slate-300 bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 mb-6 text-left">
                💡 <span className="font-semibold text-indigo-300">Coach Feedback:</span> {pronounceResult.feedback}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const phrase = pronounceResult.reference || pronounceResult.reference_text;
                    const lang = pronounceResult.target_lang;
                    setShowPronounceModal(false);
                    handlePracticePronunciation(phrase, lang);
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-4 h-4" /> Try Again
                </button>
                <button 
                  onClick={() => setShowPronounceModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 📄 BILINGUAL CONVERSATION TRANSCRIPT MODAL */}
        {showTranscriptModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full relative shadow-2xl flex flex-col max-h-[85vh]">
              <button 
                onClick={() => setShowTranscriptModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Bilingual Consultation Transcript</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    <span>Scenario: <strong className="text-indigo-300 capitalize">{selectedScenario}</strong></span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>{history.length} exchanges</span>
                  </div>
                </div>
              </div>

              {/* Scrollable Conversation Record */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
                {history.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">No conversation history yet. Start speaking in Live Interpreter or Quick Translator to build the transcript.</p>
                ) : (
                  history.slice().reverse().map((item, idx) => (
                    <div key={item.id || idx} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/60 pb-1.5">
                        <span className="font-semibold text-indigo-400">Speaker #{idx + 1} ({item.detected_lang || 'Source'})</span>
                        <span className="text-slate-500">{item.time}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-200 text-xs"><strong className="text-slate-400">Spoken:</strong> {item.original_text}</p>
                        <p className="text-emerald-300 text-xs"><strong className="text-emerald-400">Translated ({LANGUAGES[item.target_lang] || item.target_lang}):</strong> {item.translated_text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const transcriptText = history.slice().reverse().map((item, idx) => 
                        `[${item.time}] Speaker #${idx + 1} (${item.detected_lang || 'Source'}):\n${item.original_text}\n-> Translated (${LANGUAGES[item.target_lang] || item.target_lang}): ${item.translated_text}\n`
                      ).join('\n---\n\n');
                      const header = `ECHOBRIDGE AI — CONVERSATION TRANSCRIPT\nScenario: ${selectedScenario.toUpperCase()}\nDate: ${new Date().toLocaleString()}\nExchanges: ${history.length}\n${'='.repeat(45)}\n\n`;
                      navigator.clipboard.writeText(header + transcriptText);
                      showToast("Full conversation transcript copied to clipboard!");
                    }}
                    disabled={history.length === 0}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-30 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy All
                  </button>

                  <button 
                    onClick={() => {
                      const transcriptText = history.slice().reverse().map((item, idx) => 
                        `### Turn ${idx + 1} (${item.time})\n- **${item.detected_lang || 'Source'}**: ${item.original_text}\n- **${LANGUAGES[item.target_lang] || item.target_lang}**: ${item.translated_text}\n`
                      ).join('\n');
                      const header = `# EchoBridge AI — Consultation Transcript\n\n- **Scenario**: ${selectedScenario}\n- **Date**: ${new Date().toLocaleString()}\n- **Exchanges**: ${history.length}\n\n---\n\n`;
                      const blob = new Blob([header + transcriptText], { type: 'text/markdown;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `echobridge-transcript-${selectedScenario}-${Date.now()}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast("Transcript downloaded as Markdown!");
                    }}
                    disabled={history.length === 0}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-30 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .md
                  </button>

                  <button 
                    onClick={() => window.print()}
                    disabled={history.length === 0}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-30 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print / PDF
                  </button>
                </div>

                <button 
                  onClick={() => setShowTranscriptModal(false)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
        </>
      )}

    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENTS
// -------------------------------------------------------------

function SidebarBtn({ active, icon, label, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span>{label}</span>
      </div>
      {badge !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function FeaturePill({ icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-medium border flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 ${
        active 
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-md shadow-rose-500/20' 
          : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-slate-700/60'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function FeatureCard({ color, icon, title, desc, onClick }) {
  const colorMap = {
    indigo: 'from-indigo-500/10 to-purple-500/10 border-indigo-500/30 hover:border-indigo-400/50',
    emerald: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30 hover:border-emerald-400/50',
    orange: 'from-orange-500/10 to-amber-500/10 border-orange-500/30 hover:border-orange-400/50',
    blue: 'from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-400/50',
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-4.5 cursor-pointer transition-all hover:scale-[1.02] shadow-lg group`}
    >
      <div className="w-10 h-10 rounded-xl bg-slate-900/80 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-bold text-sm text-slate-100">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 leading-snug">{desc}</p>
    </div>
  );
}

function MetricCard({ title, value, subtitle }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <span className="text-xs uppercase font-bold text-slate-500 block mb-1">{title}</span>
      <span className="text-2xl font-extrabold text-white block">{value}</span>
      <span className="text-[11px] text-emerald-400 font-medium block mt-1">{subtitle}</span>
    </div>
  );
}

function LanguageProgress({ label, percentage, count, color }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-slate-500">{count}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div 
          className={`h-full rounded-full ${color === 'blue' ? 'bg-blue-500' : color === 'indigo' ? 'bg-indigo-500' : 'bg-purple-500'}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
