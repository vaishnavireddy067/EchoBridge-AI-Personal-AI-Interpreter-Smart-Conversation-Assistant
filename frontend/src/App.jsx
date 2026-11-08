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
  Repeat
} from 'lucide-react';

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

export default function App() {
  // Navigation View
  const [activeNav, setActiveNav] = useState('translator'); // 'translator' | 'speak-translate' | 'conversation' | 'documents' | 'history' | 'favorites' | 'analytics' | 'settings'

  // Translation State
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [inputText, setInputText] = useState('danyavadalu');
  const [translatedText, setTranslatedText] = useState('thank you');
  const [detectedLangName, setDetectedLangName] = useState('Telugu (తెలుగు)');
  const [detectedCode, setDetectedCode] = useState('te');
  const [transliteratedScript, setTransliteratedScript] = useState('ధన్యవాదాలు');
  const [isTranslating, setIsTranslating] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);

  // Voice Input Specific State
  const [voiceLang, setVoiceLang] = useState('te');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoiceStudio, setShowVoiceStudio] = useState(false);
  const [speechInterim, setSpeechInterim] = useState('');

  // 🔊 SPEAK & TRANSLATE (Smart Speaker Mode State)
  const [speakerInputLang, setSpeakerInputLang] = useState('te');
  const [speakerTargetLang, setSpeakerTargetLang] = useState('en');
  const [speakerHeardText, setSpeakerHeardText] = useState('నమస్తే');
  const [speakerTransScript, setSpeakerTransScript] = useState('నమస్తే');
  const [speakerResponseText, setSpeakerResponseText] = useState('Hello');
  const [speakerState, setSpeakerState] = useState('idle'); // 'idle' | 'listening' | 'translating' | 'speaking'
  const [speakerContinuous, setSpeakerContinuous] = useState(false);

  // AI Features State
  const [selectedTone, setSelectedTone] = useState('default');
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [explanationData, setExplanationData] = useState(null);
  const [alternativesData, setAlternativesData] = useState(null);
  const [grammarData, setGrammarData] = useState(null);

  // Settings
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [autoSpeak, setAutoSpeak] = useState(false);
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
  const abortControllerRef = useRef(null);

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

    try {
      const resp = await fetch('http://127.0.0.1:8000/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          source_lang: sl,
          target_lang: tl,
          tone: tone
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
  }, [autoSpeak]);

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

  // 🔊 SPEAK & TRANSLATE (Smart Speaker Mode: Voice Processing)
  const processSpeakerVoice = async (spokenPhrase) => {
    if (!spokenPhrase.trim()) return;
    setSpeakerState('translating');
    setSpeakerHeardText(spokenPhrase);

    try {
      const resp = await fetch('http://127.0.0.1:8000/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: spokenPhrase,
          source_lang: speakerInputLang,
          target_lang: speakerTargetLang
        })
      });
      const data = await resp.json();

      setSpeakerResponseText(data.translated_text);
      setSpeakerTransScript(data.transliterated_script);
      setSpeakerState('speaking');

      // Add to history
      const newItem = {
        id: 'speak_item_' + Date.now(),
        original_text: spokenPhrase,
        translated_text: data.translated_text,
        detected_lang: data.detected_lang,
        detected_code: data.detected_code,
        target_lang: data.target_lang,
        transliterated_script: data.transliterated_script,
        favorite: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev]);

      // Speak back the response
      const utterance = new SpeechSynthesisUtterance(data.translated_text);
      utterance.lang = SPEECH_LANGS[speakerTargetLang]?.code || speakerTargetLang || 'en-US';
      utterance.rate = speechSpeed;

      utterance.onend = () => {
        setSpeakerState('idle');
        if (speakerContinuous && speakerRecognitionRef.current) {
          try {
            speakerRecognitionRef.current.start();
            setSpeakerState('listening');
          } catch (e) {}
        }
      };

      utterance.onerror = () => {
        setSpeakerState('idle');
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setSpeakerState('idle');
      showToast("Error translating speech");
    }
  };

  // Toggle Smart Speaker Listening
  const toggleSpeakerListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech Recognition not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    if (speakerState === 'listening') {
      if (speakerRecognitionRef.current) speakerRecognitionRef.current.stop();
      setSpeakerState('idle');
      showToast("Speaker listening paused");
    } else {
      window.speechSynthesis.cancel();
      const sr = new SpeechRecognition();
      sr.continuous = false;
      sr.interimResults = false;
      sr.lang = SPEECH_LANGS[speakerInputLang]?.code || 'te-IN';

      sr.onresult = (e) => {
        const text = e.results[0][0].transcript;
        if (text) {
          processSpeakerVoice(text);
        }
      };

      sr.onerror = (e) => {
        console.warn("Smart speaker speech error", e);
        setSpeakerState('idle');
      };

      sr.onend = () => {
        if (speakerState === 'listening') setSpeakerState('idle');
      };

      speakerRecognitionRef.current = sr;
      try {
        sr.start();
        setSpeakerState('listening');
        showToast(`Smart Speaker is listening in ${SPEECH_LANGS[speakerInputLang]?.name || speakerInputLang}... Speak now!`);
      } catch (e) {
        setSpeakerState('idle');
      }
    }
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

  // Text-to-Speech Playback
  const speakText = (text, langCode) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    const bcp47 = SPEECH_LANGS[langCode]?.code || langCode || 'en-US';
    utterance.lang = bcp47;
    utterance.rate = speechSpeed;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
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
        body: JSON.stringify({ text, source_lang: sLang, target_lang: tLang })
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
      
      {/* TOAST POPUP */}
      {toastMessage && (
        <div className="fixed top-6 right-8 z-50 bg-slate-900/95 border border-indigo-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🧭 LEFT SIDEBAR */}
      {/* ========================================================= */}
      <aside className="w-64 shrink-0 bg-[#0a0f1e] border-r border-slate-800/80 flex flex-col justify-between p-4 z-20">
        
        {/* Brand & Logo */}
        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Globe className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                AI Smart
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Translator</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Break Language Barriers with AI ✨</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            <SidebarBtn 
              active={activeNav === 'translator'} 
              icon={<Layers className="w-4 h-4" />} 
              label="Translator" 
              onClick={() => setActiveNav('translator')}
            />
            {/* 🔊 NEW: DEDICATED SPEAK & TRANSLATE MODE */}
            <SidebarBtn 
              active={activeNav === 'speak-translate'} 
              icon={<Radio className="w-4 h-4 text-rose-400" />} 
              label="Speak & Translate" 
              badge="Speaker"
              onClick={() => setActiveNav('speak-translate')}
            />
            <SidebarBtn 
              active={activeNav === 'conversation'} 
              icon={<MessageSquare className="w-4 h-4 text-orange-400" />} 
              label="Conversation" 
              onClick={() => setActiveNav('conversation')}
            />
            <SidebarBtn 
              active={activeNav === 'documents'} 
              icon={<FileText className="w-4 h-4 text-emerald-400" />} 
              label="Documents" 
              onClick={() => setActiveNav('documents')}
            />
            <SidebarBtn 
              active={activeNav === 'history'} 
              icon={<Clock className="w-4 h-4" />} 
              label="History" 
              badge={history.length}
              onClick={() => setActiveNav('history')}
            />
            <SidebarBtn 
              active={activeNav === 'favorites'} 
              icon={<Heart className="w-4 h-4" />} 
              label="Favorites" 
              badge={favoritesList.length}
              onClick={() => setActiveNav('favorites')}
            />
            <SidebarBtn 
              active={activeNav === 'analytics'} 
              icon={<BarChart3 className="w-4 h-4" />} 
              label="Analytics" 
              onClick={() => setActiveNav('analytics')}
            />
            <SidebarBtn 
              active={activeNav === 'settings'} 
              icon={<Settings className="w-4 h-4" />} 
              label="Settings" 
              onClick={() => setActiveNav('settings')}
            />
          </nav>
        </div>

        {/* Sidebar Footer: Upgrade Card & Profile */}
        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          
          <div className="bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">Upgrade to Pro</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-snug">
              Unlock advanced features and more languages!
            </p>
            <button 
              onClick={() => setShowProModal(true)}
              className="w-full py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-98"
            >
              Upgrade
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <img 
                src={userProfile.avatar} 
                alt="User" 
                className="w-9 h-9 rounded-full ring-2 ring-indigo-500/40 object-cover" 
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">{userProfile.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{userProfile.email}</div>
              </div>
            </div>
            <button 
              title="Logout" 
              onClick={() => showToast("Logged in as John Doe (Demo Account)")}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
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
        <header className="h-16 shrink-0 border-b border-slate-800/80 px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-10 bg-[#090e1c]/80">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AI Neural Engine Active
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>
            <button 
              onClick={() => showToast("Notifications: You have no unread alerts")}
              className="relative p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
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
        {/* VIEW: 🔊 SPEAK & TRANSLATE (SMART SPEAKER MODE) */}
        {/* ========================================================= */}
        {activeNav === 'speak-translate' && (
          <div className="p-8 max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-between space-y-8 animate-in fade-in duration-200">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                Smart AI Speaker Mode
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                🔊 Speak & Translate
              </h2>
              <p className="text-slate-400 text-xs max-w-lg mx-auto">
                Speak directly to the device. It listens, understands your language, translates, and immediately speaks the reply aloud.
              </p>
            </div>

            {/* Smart Speaker Control Bar */}
            <div className="w-full bg-slate-900/80 border border-slate-800 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md shadow-xl">
              
              {/* Spoken Language */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">You Speak:</span>
                <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-blue-400" />
                  <select 
                    value={speakerInputLang}
                    onChange={(e) => setSpeakerInputLang(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {Object.entries(SPEECH_LANGS).map(([code, info]) => (
                      <option key={code} value={code} className="bg-slate-900 text-slate-100">{info.flag} {info.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <span className="text-slate-500 font-extrabold hidden sm:inline">➔</span>

              {/* Speaker Response Language */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Speaker Responds In:</span>
                <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  <select 
                    value={speakerTargetLang}
                    onChange={(e) => setSpeakerTargetLang(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {Object.entries(LANGUAGES).filter(([c]) => c !== 'auto').map(([code, name]) => (
                      <option key={code} value={code} className="bg-slate-900 text-slate-100">{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Continuous Listening Toggle */}
              <button 
                onClick={() => setSpeakerContinuous(!speakerContinuous)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  speakerContinuous 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Continuous loop: Speaker keeps listening after replying"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Auto-Loop</span>
              </button>

            </div>

            {/* CENTRAL SMART SPEAKER ORB */}
            <div className="flex flex-col items-center justify-center my-6 relative">
              
              {/* Outer pulsing acoustic halo */}
              {speakerState === 'listening' && (
                <div className="absolute w-64 h-64 rounded-full bg-rose-500/20 border-2 border-rose-500/30 animate-ping pointer-events-none" />
              )}
              {speakerState === 'speaking' && (
                <div className="absolute w-64 h-64 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 animate-pulse-ring pointer-events-none" />
              )}
              {speakerState === 'translating' && (
                <div className="absolute w-64 h-64 rounded-full bg-indigo-500/20 border-2 border-indigo-500/30 animate-spin pointer-events-none" />
              )}

              {/* Speaker Button */}
              <button 
                onClick={toggleSpeakerListening}
                className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer ${
                  speakerState === 'listening'
                    ? 'bg-gradient-to-tr from-rose-600 via-pink-600 to-red-500 text-white shadow-rose-500/50 ring-8 ring-rose-500/20'
                    : speakerState === 'translating'
                    ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white shadow-purple-500/50 animate-pulse ring-8 ring-purple-500/20'
                    : speakerState === 'speaking'
                    ? 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-500 text-white shadow-emerald-500/50 ring-8 ring-emerald-500/20 animate-bounce'
                    : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-500/40 hover:scale-105 hover:shadow-blue-500/60 ring-8 ring-slate-800'
                }`}
              >
                {speakerState === 'speaking' ? (
                  <Volume2 className="w-14 h-14" />
                ) : speakerState === 'listening' ? (
                  <Mic className="w-14 h-14 animate-pulse" />
                ) : speakerState === 'translating' ? (
                  <Sparkles className="w-14 h-14 animate-spin-slow" />
                ) : (
                  <Mic className="w-14 h-14" />
                )}
              </button>

              <span className="text-sm font-bold text-slate-200 mt-6 tracking-wide uppercase text-[11px] bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800">
                {speakerState === 'listening' && `Listening for ${SPEECH_LANGS[speakerInputLang]?.name}...`}
                {speakerState === 'translating' && "Understanding & Translating..."}
                {speakerState === 'speaking' && `🔊 Responding in ${LANGUAGES[speakerTargetLang]}...`}
                {speakerState === 'idle' && "Tap Microphone to Speak"}
              </span>

            </div>

            {/* DUAL DISPLAY CARDS: USER SPOKE vs SPEAKER RESPONDED */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Box 1: What You Said */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-bold flex items-center gap-1.5 text-blue-400 uppercase tracking-wide">
                      <Mic className="w-4 h-4" /> 🎤 YOU SAID — {SPEECH_LANGS[speakerInputLang]?.name || 'Telugu (తెలుగు)'}
                    </span>
                    {speakerTransScript && (
                      <span className="text-[10px] bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
                        {speakerTransScript}
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-slate-100 min-h-[50px] leading-relaxed">
                    "{speakerHeardText || "Speak into microphone..."}"
                  </p>
                </div>
                <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between">
                  <span>Input Speech / Romanized Audio</span>
                  <span className="text-blue-400/80 font-mono text-[10px]">{speakerInputLang}</span>
                </div>
              </div>

              {/* Box 2: Speaker Response */}
              <div className="bg-slate-900/80 border border-purple-500/30 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between text-xs text-purple-300 mb-2">
                    <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide">
                      <Volume2 className="w-4 h-4 text-purple-400" /> 🔊 TRANSLATED RESPONSE — {LANGUAGES[speakerTargetLang] || 'English'}
                    </span>
                    <button 
                      onClick={() => speakText(speakerResponseText, speakerTargetLang)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-purple-300 transition-colors"
                      title="Replay Spoken Audio"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-2xl font-extrabold text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 bg-clip-text min-h-[50px] leading-relaxed">
                    "{speakerResponseText || "Waiting for your voice..."}"
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-3 text-xs">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Spoken aloud in real-time
                  </span>
                  <button 
                    onClick={() => handleCopy(speakerResponseText, 'speak_out')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    {copiedId === 'speak_out' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                </div>
              </div>

            </div>

            {/* 1-CLICK QUICK TEST PHRASES */}
            <div className="w-full bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                ⚡ 1-Click Test Phrases (Meaning Translation Demonstration):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { phrase: 'నమస్తే', target: 'en', expected: 'Hello' },
                  { phrase: 'తిన్నారా?', target: 'en', expected: 'Did you eat?' },
                  { phrase: 'Namaste', target: 'en', expected: 'Hello' },
                  { phrase: 'Tinnara?', target: 'en', expected: 'Did you eat?' },
                  { phrase: 'నమస్తే', target: 'es', expected: 'Hola' },
                  { phrase: 'నమస్తే', target: 'hi', expected: 'नमस्ते' },
                  { phrase: 'ధన్యవాదాలు', target: 'en', expected: 'Thank you' },
                  { phrase: 'Danyavadalu', target: 'en', expected: 'Thank you' },
                  { phrase: 'Ela unnaru?', target: 'en', expected: 'How are you?' },
                  { phrase: 'Khana khaya?', target: 'en', expected: 'Did you eat?' }
                ].map((demo, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSpeakerTargetLang(demo.target);
                      processSpeakerVoice(demo.phrase);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700/80 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span>🎤 "{demo.phrase}"</span>
                    <span className="text-[10px] text-purple-400 font-bold">→ {LANGUAGES[demo.target]} ({demo.expected})</span>
                  </button>
                ))}
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

      </div>

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
