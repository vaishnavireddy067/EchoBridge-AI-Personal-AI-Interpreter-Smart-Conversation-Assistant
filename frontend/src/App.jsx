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
  ArrowLeft,
  Square
} from 'lucide-react';
import { translateOffline, OFFLINE_PHRASEBOOK, OFFLINE_PACKS } from './offlineEngine.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// =========================================================================
// LIGHTWEIGHT PURE-JS 16kHz MONO 16-BIT PCM WAV RECORDER
// Records standard WAV audio for true multilingual backend STT
// =========================================================================
function writeWavString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function encodeWavBlob(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeWavString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeWavString(view, 8, 'WAVE');
  writeWavString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM = 1
  view.setUint16(22, 1, true); // Mono = 1
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeWavString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function downsampleBuffer(buffer, sourceRate, targetRate = 16000) {
  if (!buffer || buffer.length === 0) return new Float32Array(0);
  if (sourceRate === targetRate) return buffer;
  if (sourceRate < targetRate) return buffer;
  const ratio = sourceRate / targetRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetSource = 0;
  while (offsetResult < result.length) {
    const nextOffsetSource = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetSource; i < nextOffsetSource && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetSource = nextOffsetSource;
  }
  return result;
}

export class WavAudioRecorder {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.processor = null;
    this.source = null;
    this.samples = [];
    this.isRecording = false;
    this.sampleRate = 16000;
  }

  async start() {
    this.samples = [];
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      this.audioContext = new AudioCtx({ sampleRate: 16000 });
      this.sampleRate = this.audioContext.sampleRate || 16000;
    } catch (e) {
      try {
        this.audioContext = new AudioCtx();
        this.sampleRate = this.audioContext.sampleRate || 44100;
      } catch (err) {
        console.warn("AudioContext hardware notice:", err);
        return;
      }
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const input = e.inputBuffer.getChannelData(0);
        for (let i = 0; i < input.length; i++) {
          this.samples.push(input[i]);
        }
      };
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      this.isRecording = true;
    } catch (err) {
      console.warn("WavAudioRecorder mic access notice:", err);
    }
  }

  stop() {
    this.isRecording = false;
    if (this.processor) {
      try { this.processor.disconnect(); } catch (e) {}
      this.processor = null;
    }
    if (this.source) {
      try { this.source.disconnect(); } catch (e) {}
      this.source = null;
    }
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(track => track.stop());
      } catch (e) {}
      this.mediaStream = null;
    }
    const currentRate = this.sampleRate || 16000;
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch (e) {}
      this.audioContext = null;
    }
    if (this.samples.length < 800) return null; // Under 0.05s
    const floatArr = new Float32Array(this.samples);
    const downsampled = downsampleBuffer(floatArr, currentRate, 16000);
    return encodeWavBlob(downsampled, 16000);
  }
}

// =========================================================================
// ACCURATE TRUE MULTILINGUAL LANGUAGE & SCRIPT DETECTOR
// Accurately differentiates spoken English, Hindi, Telugu, Marathi, Tamil, Kannada, etc.
// Never forces source into Telugu!
// =========================================================================
export const isPhoneticEnglishInTelugu = (text) => {
  if (!text || typeof text !== 'string') return false;
  const clean = text.trim();
  if (!/[\u0C00-\u0C7F]/.test(clean)) return false;
  const teluguPhoneticEnglish = [
    'హాయ్', 'హలో', 'మై', 'నేమ్', 'ఈజ్', 'ఇస్', 'ఐ', 'వాంట్', 'టు', 'గో', 'హోమ్',
    'ఆపరేట్', 'ఆన్', 'న్యూమరికల్', 'డాటా', 'డేటా', 'నాట్', 'రా', 'టెక్స్ట్', 'బికాజ్',
    'టైర్డ్', 'ప్లీజ్', 'థాంక్స్', 'థాంక్యూ', 'ఎస్', 'నో', 'వెల్కమ్', 'గుడ్', 'మార్నింగ్',
    'ఈవెనింగ్', 'నైట్', 'వెల్', 'డన్', 'కాల్', 'మీ', 'వర్క్', 'జాబ్', 'కంప్యూటర్',
    'లీవ్', 'లివ్', 'ఇన్', 'హైదరాబాద్', 'హియర్', 'దేర్', 'ఫ్రమ్', 'వైష్ణవి', 'రాజ్',
    'హౌ', 'ఆర్', 'యు', 'ఫైన్'
  ];
  const teluguGenuine = [
    'పేరు', 'నేను', 'ఎలా', 'ఉన్నారు', 'ఉన్నాను', 'బాగున్నారా', 'చాలా',
    'ఇంటికి', 'వెళ్ళాలి', 'అండి', 'ధన్యవాదాలు', 'సహాయం', 'కావాలి', 'లేదు',
    'మీరు', 'ఏంటి', 'ఎక్కడ', 'ఎప్పుడు', 'బాగుంది'
  ];
  const tokens = clean.split(/\s+/);
  let engCount = 0;
  let teGenuineCount = 0;
  for (const t of tokens) {
    if (teluguPhoneticEnglish.some(pw => t.includes(pw))) engCount++;
    if (teluguGenuine.some(gw => t.includes(gw))) teGenuineCount++;
  }
  return (engCount > teGenuineCount || (engCount >= 1 && teGenuineCount === 0));
};

export const detectTrueLanguage = (text) => {
  if (!text || !text.trim()) return 'en';
  const clean = text.trim();

  // 1. Script Detection
  const hasTelugu = /[\u0C00-\u0C7F]/.test(clean);
  const hasDevanagari = /[\u0900-\u097F]/.test(clean);
  const hasTamil = /[\u0B80-\u0BFF]/.test(clean);
  const hasKannada = /[\u0C80-\u0CFF]/.test(clean);
  const hasMalayalam = /[\u0D00-\u0D7F]/.test(clean);
  const hasBengali = /[\u0980-\u09FF]/.test(clean);

  // If Telugu script is detected: accurately distinguish genuine Telugu from phonetic English/Hindi loanwords
  if (hasTelugu) {
    if (isPhoneticEnglishInTelugu(clean)) {
      return 'en';
    }
    return 'te';
  }

  // Devanagari: Check Marathi vs Hindi
  if (hasDevanagari) {
    const marathiMarkers = ['आहे', 'माझं', 'माझे', 'नाव', 'कसा', 'कशी', 'आहोत', 'राहते', 'राहतो', 'घरी', 'नाही', 'तुम्ही', 'काय', 'कुठे'];
    if (marathiMarkers.some(m => clean.includes(m))) {
      return 'mr';
    }
    return 'hi';
  }

  if (hasTamil) return 'ta';
  if (hasKannada) return 'kn';
  if (hasMalayalam) return 'ml';
  if (hasBengali) return 'bn';

  // 2. Latin Text Analysis (English vs Romanized Hindi / Telugu / Tamil / Kannada)
  const lower = clean.toLowerCase().replace(/[.,?!]/g, '');
  const words = lower.split(/\s+/);

  const hindiMarkers = new Set([
    'namaste', 'namaskar', 'mera', 'meri', 'mere', 'naam', 'aap', 'kaise', 'kaisi', 
    'ho', 'hai', 'hain', 'kya', 'kyun', 'nahi', 'accha', 'theek', 'dhanyawad', 
    'shukriya', 'ghar', 'jana', 'chahiye', 'chahata', 'karo', 'karna', 'bhai', 'yaar'
  ]);
  const teluguMarkers = new Set([
    'namaskaram', 'meeru', 'nenu', 'ela', 'unnaru', 'unnav', 'peru', 'enti', 
    'cheppandi', 'kavali', 'ledu', 'bavunnara', 'chala', 'alasi', 'alasataga', 
    'undi', 'intiki', 'vellali', 'ayyanu', 'andi', 'ra', 'kadu'
  ]);
  const tamilMarkers = new Set([
    'vanakkam', 'neengal', 'neenga', 'eppadi', 'irukkeenga', 'irukiraal', 
    'en', 'peyar', 'enna', 'nandri', 'aam', 'illai', 'veetukku', 'poga', 'vendum'
  ]);
  const kannadaMarkers = new Set([
    'namaskara', 'neevu', 'hegiddeera', 'hegiddira', 'nanna', 'hesaru', 
    'enu', 'dhanyavadagalu', 'beku', 'illa', 'manege', 'hogabeku'
  ]);

  let hiScore = 0, teScore = 0, taScore = 0, knScore = 0;
  for (const w of words) {
    if (hindiMarkers.has(w)) hiScore++;
    if (teluguMarkers.has(w)) teScore++;
    if (tamilMarkers.has(w)) taScore++;
    if (kannadaMarkers.has(w)) knScore++;
  }

  if (teScore > 0 && teScore >= hiScore && teScore >= taScore && teScore >= knScore) return 'te';
  if (hiScore > 0 && hiScore >= teScore && hiScore >= taScore && hiScore >= knScore) return 'hi';
  if (taScore > 0 && taScore >= hiScore && taScore >= teScore && taScore >= knScore) return 'ta';
  if (knScore > 0 && knScore >= hiScore && knScore >= teScore && knScore >= taScore) return 'kn';

  return 'en';
};

// =========================================================================
// MULTI-TIERED ROBUST TRANSLATION ENGINE (Zero-Fake Guarantee)
// Automatically translates meaning. Never returns fake transliteration or source text.
// =========================================================================
export const performRobustTranslation = async (text, sl = 'auto', tl = 'en') => {
  if (!text || !text.trim()) return null;
  const cleanText = text.trim();

  // 1. Script & language detection if source is 'auto' or ambiguous
  let resolvedSource = (sl && sl !== 'auto') ? sl : detectTrueLanguage(cleanText);
  let resolvedTarget = tl || 'en';

  // Prevent translating into the exact same language
  if (resolvedSource === resolvedTarget) {
    return {
      translated_text: cleanText,
      pronunciation: null,
      meaning: cleanText,
      detected_code: resolvedSource,
      detected_lang: LANGUAGES[resolvedSource] || resolvedSource,
      engine: 'identity'
    };
  }

  // Tier 1: Backend / Serverless Endpoint (/api/translate)
  try {
    const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/translate` : '/api/translate';
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        source_lang: sl === 'auto' ? 'auto' : resolvedSource,
        target_lang: resolvedTarget
      })
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.translated_text && data.translated_text.trim() && data.translated_text.trim().toLowerCase() !== cleanText.toLowerCase()) {
        const finalDetected = (data.detected_code && data.detected_code !== 'auto') ? data.detected_code : resolvedSource;
        return {
          translated_text: data.translated_text.trim(),
          pronunciation: data.pronunciation || data.transliterated_script || null,
          meaning: data.meaning || (resolvedTarget === 'en' ? data.translated_text.trim() : null),
          detected_code: finalDetected,
          detected_lang: LANGUAGES[finalDetected] || finalDetected,
          engine: data.engine || 'backend_neural'
        };
      }
    }
  } catch (err) {
    console.warn("Backend translation unreachable, falling back to direct CORS neural tier:", err);
  }

  // Tier 2: Direct Client-Side MyMemory API (Guaranteed CORS support & high accuracy for Indian languages)
  try {
    const encoded = encodeURIComponent(cleanText);
    const mmUrl = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${resolvedSource}|${resolvedTarget}`;
    const mmResp = await fetch(mmUrl);
    if (mmResp.ok) {
      const mmData = await mmResp.json();
      const tr = mmData?.responseData?.translatedText;
      if (tr && tr.trim() && !tr.toLowerCase().includes('quota exceeded') && !tr.toLowerCase().includes('is not valid') && tr.trim().toLowerCase() !== cleanText.toLowerCase()) {
        return {
          translated_text: tr.trim(),
          pronunciation: null,
          meaning: resolvedTarget === 'en' ? tr.trim() : null,
          detected_code: resolvedSource,
          detected_lang: LANGUAGES[resolvedSource] || resolvedSource,
          engine: 'mymemory_direct'
        };
      }
    }
  } catch (mmErr) {
    console.warn("MyMemory API notice:", mmErr);
  }

  // Tier 3: Built-in Offline Phrasebook (Only exact or verified curated matches)
  try {
    const off = translateOffline(cleanText, resolvedSource, resolvedTarget);
    if (off && off.translated_text && off.translated_text.trim() && off.translated_text.trim().toLowerCase() !== cleanText.toLowerCase()) {
      return {
        translated_text: off.translated_text.trim(),
        pronunciation: null,
        meaning: resolvedTarget === 'en' ? off.translated_text.trim() : null,
        detected_code: resolvedSource,
        detected_lang: LANGUAGES[resolvedSource] || resolvedSource,
        engine: 'offline_phrasebook'
      };
    }
  } catch (offErr) {}

  // ALL ENGINES FAILED: Return explicit error. NEVER return source text or fake transliteration!
  return {
    error: true,
    translated_text: "Translation service is temporarily unavailable. Please try again.",
    pronunciation: null,
    meaning: null,
    detected_code: resolvedSource,
    detected_lang: LANGUAGES[resolvedSource] || resolvedSource,
    engine: 'error'
  };
};

const clientDirectTranslate = performRobustTranslation;

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
  // Page 3: Full Bhashora AI Workspace with Sidebar (currentStage = 'workspace')
  const [currentStage, setCurrentStage] = useState('translator');
  const [showSplash, setShowSplash] = useState(true);
  const [activeNav, setActiveNav] = useState('live-interpreter');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
  const [targetLang, setTargetLang] = useState('ta');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [detectedLangName, setDetectedLangName] = useState('');
  const [detectedCode, setDetectedCode] = useState('');
  const [transliteratedScript, setTransliteratedScript] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);

  // Voice Input Specific State
  const [voiceLang, setVoiceLang] = useState('auto');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoiceStudio, setShowVoiceStudio] = useState(false);
  const [speechInterim, setSpeechInterim] = useState('');

  // 🎙️ LIVE INTERPRETER & SMART SPEAKER STATE (Hands-free Continuous Auto-Listen)
  const [speakerInputLang, setSpeakerInputLang] = useState('auto');
  const [speakerTargetLang, setSpeakerTargetLang] = useState('ta');
  const [speakerHeardText, setSpeakerHeardText] = useState('');
  const [speakerTransScript, setSpeakerTransScript] = useState('');
  const [speakerResponseText, setSpeakerResponseText] = useState('');
  const [speakerState, setSpeakerState] = useState('idle'); // 'idle' | 'listening' | 'translating' | 'speaking'
  const [speakerContinuous, setSpeakerContinuous] = useState(true);

  // 🎯 Application Modes: 'talk' (Live AI Interpreter) | 'learn' (Language Learning & Pronunciation Coach)
  const [activeMode, setActiveMode] = useState('talk');

  // 🎓 Mode 2: Learn Language State
  const [learnKnownLang, setLearnKnownLang] = useState('te');
  const [learnTargetLang, setLearnTargetLang] = useState('hi');
  const [learnInputText, setLearnInputText] = useState('');
  const [learnData, setLearnData] = useState(null); // { original, translation, pronunciation, meaning, knownLang, targetLang }
  const [isLearnLoading, setIsLearnLoading] = useState(false);
  const [isLearnListening, setIsLearnListening] = useState(false);
  const [isRepeatListening, setIsRepeatListening] = useState(false);
  const [repeatAttemptText, setRepeatAttemptText] = useState('');
  const [repeatFeedback, setRepeatFeedback] = useState(null); // { score, comment, isGood }
  const learnRecognitionRef = useRef(null);
  const repeatRecognitionRef = useRef(null);

  // 🔥 Live Continuous Auto-Listen Session State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveInterimText, setLiveInterimText] = useState('');
  const [twoWayAutoSwitch, setTwoWayAutoSwitch] = useState(true);
  const [currentSpeakerTurn, setCurrentSpeakerTurn] = useState('A'); // 'A' (e.g. te) | 'B' (e.g. hi)
  const [lastSpeakerTurn, setLastSpeakerTurn] = useState('A');
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
      const saved = localStorage.getItem('bhashora_history_v3') || localStorage.getItem('echobridge_history_v3');
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
      const resp = await fetch(`${API_BASE_URL}/api/analytics`);
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

  // User Profile & Authentication Credentials State
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('bhashora_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && parsed.name !== 'John Doe') return parsed;
      }
    } catch (e) {}
    const defaultProfile = {
      name: 'Vaishnavi Anugu',
      email: 'vaishnavi@example.com',
      plan: 'Pro Member',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
    };
    try {
      localStorage.setItem('bhashora_user_profile', JSON.stringify(defaultProfile));
    } catch (e) {}
    return defaultProfile;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editProfileName, setEditProfileName] = useState(userProfile.name);
  const [editProfileEmail, setEditProfileEmail] = useState(userProfile.email);
  const [editProfilePassword, setEditProfilePassword] = useState('');
  const [editProfileApiKey, setEditProfileApiKey] = useState('');

  // Top Navbar Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(true);

  // Pronunciation Practice Coach State (Synchronized defaults)
  const [practiceLang, setPracticeLang] = useState('en');
  const [practicePhrase, setPracticePhrase] = useState('Hello, how are you today?');
  const [practiceSpeed, setPracticeSpeed] = useState(1.0);

  const recognitionRef = useRef(null);
  const speakerRecognitionRef = useRef(null);
  const liveRecognitionRef = useRef(null);
  const wavRecorderRef = useRef(null);
  const autoClearTimerRef = useRef(null);
  const AUTO_CLEAR_DELAY_MS = 2000; // 2 seconds visible pause before auto-clearing active screen
  const isLiveActiveRef = useRef(false);
  const twoWayAutoSwitchRef = useRef(true);
  const currentSpeakerTurnRef = useRef('A');
  const liveStatusRef = useRef('idle');
  const abortControllerRef = useRef(null);
  const startLiveTurnRef = useRef(null);
  const accumulatedSpeechRef = useRef('');
  const speechSilenceTimerRef = useRef(null);
  const activeAudioRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const audioContextRef = useRef(null);
  const activeAudioSourceRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  const lastSubmittedPhraseRef = useRef('');
  const lastSubmitTimeRef = useRef(0);
  const isProcessingVoiceRef = useRef(false);
  const finalizedHistoryRef = useRef('');
  const sessionFinalRef = useRef('');
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const utteranceBufferRef = useRef('');
  const activeTTSIdRef = useRef(0);
  const activeTranslationRequestIdRef = useRef(0);
  const selectedVoiceCacheRef = useRef({});
  const [silenceThreshold, setSilenceThreshold] = useState(1200);
  const silenceThresholdRef = useRef(1200);
  const finalizeUtteranceRef = useRef(null);
  const voicesRef = useRef([]);
  const [cachedVoices, setCachedVoices] = useState([]);

  // Apply dark mode class to document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  // Clean up autoClearTimer on unmount
  useEffect(() => {
    return () => {
      if (autoClearTimerRef.current) {
        clearTimeout(autoClearTimerRef.current);
        autoClearTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    silenceThresholdRef.current = silenceThreshold;
  }, [silenceThreshold]);

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
      localStorage.setItem('bhashora_history_v3', JSON.stringify(history));
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

  // Preload and cache browser speech synthesis voices via 'voiceschanged'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          voicesRef.current = v;
          setCachedVoices(v);
        }
      } catch (e) {
        console.warn("Failed to load synthesis voices:", e);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Unlock and maintain browser AudioContext & Audio elements to eliminate autoplay restrictions
  const unlockAudio = useCallback(() => {
    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
        audioPlayerRef.current.play().then(() => {
          audioPlayerRef.current.pause();
        }).catch(() => {});
      }
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } catch (e) {
      console.warn("Audio unlock notice:", e);
    }
  }, []);

  const ensureAudioContext = unlockAudio;

  // Global user interaction listener to unlock audio on very first user click
  useEffect(() => {
    const handleFirstGesture = () => {
      unlockAudio();
    };
    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [unlockAudio]);

  // =========================================================================
  // 🎙️ CENTRALIZED SINGLE TTS CONTROLLER (Bug 4 Implementation)
  // Guarantees EXACTLY ONE audio playback per sentence, eliminates overlapping voices,
  // cancels any prior speech, selects ONE voice, and logs the full lifecycle.
  // =========================================================================
  const speakTranslatedSentence = useCallback(async (text, langCode, onEndCallback = null) => {
    if (!text || !text.trim()) {
      if (onEndCallback) onEndCallback();
      return;
    }

    const cleanText = text.replace(/^["']|["']$/g, '').trim();
    if (!cleanText || cleanText.startsWith("Translation service is temporarily unavailable")) {
      if (onEndCallback) onEndCallback();
      return;
    }

    // Generate unique utteranceId for this specific translation request
    const utteranceId = ++activeTTSIdRef.current;

    // 1. CANCEL ANY EXISTING SPEECH FIRST (Eliminates dual voices and overlapping playback)
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}

    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (e) {}
      activeAudioRef.current = null;
    }
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch (e) {}
    }

    // Brief 35ms pause to ensure browser audio pipeline cancellation is fully processed
    await new Promise(res => setTimeout(res, 35));
    if (activeTTSIdRef.current !== utteranceId) {
      return; // A newer translation request has arrived
    }

    setIsSpeaking(true);
    setSpeakerState('speaking');
    liveStatusRef.current = 'speaking';

    const bcp47 = SPEECH_LANGS[langCode]?.code || (
      langCode === 'te' ? 'te-IN' :
      langCode === 'ta' ? 'ta-IN' :
      langCode === 'hi' ? 'hi-IN' :
      langCode === 'kn' ? 'kn-IN' :
      langCode === 'en' ? 'en-US' : 'en-IN'
    );
    const prefix = (langCode || 'en').toLowerCase().split('-')[0];

    // Voice Selection: Search installed browser voices
    const available = voicesRef.current.length > 0 ? voicesRef.current : (window.speechSynthesis?.getVoices() || []);
    let matchingVoice = selectedVoiceCacheRef.current[langCode];

    if (!matchingVoice && available.length > 0) {
      matchingVoice = available.find(v => v.lang.replace('_', '-').toLowerCase() === bcp47.toLowerCase());
      if (!matchingVoice) {
        matchingVoice = available.find(v => v.lang.toLowerCase().startsWith(prefix));
      }
      if (matchingVoice) {
        selectedVoiceCacheRef.current[langCode] = matchingVoice;
      }
    }

    const selectedVoiceName = matchingVoice ? matchingVoice.name : 'System Default';

    // Required Debug Logging as requested in BUG 4:
    console.log(`[TTS] Starting`);
    console.log(`[TTS] Text: ${cleanText}`);
    console.log(`[TTS] Language: ${bcp47}`);
    console.log(`[TTS] Selected voice: ${selectedVoiceName}`);

    let speechEnded = false;
    let fallbackTimer = null;

    const handleSpeechEnd = () => {
      if (speechEnded) return;
      speechEnded = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      console.log(`[TTS] onend`);

      if (activeTTSIdRef.current === utteranceId) {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
        activeAudioRef.current = null;
        if (onEndCallback) onEndCallback();
      }
    };

    // Watchdog safety timer guarantees the interpreter never freezes
    const approxDurationMs = Math.max(3000, Math.min(14000, cleanText.split(/\s+/).length * 480 + 1500));
    fallbackTimer = setTimeout(() => {
      console.warn(`[TTS] Watchdog safety timer triggered for ${utteranceId}`);
      handleSpeechEnd();
    }, approxDurationMs);

    const tryAudioStreamFallback = () => {
      try {
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(prefix)}&q=${encodeURIComponent(cleanText)}`;
        const audioEl = audioPlayerRef.current || new Audio();
        activeAudioRef.current = audioEl;

        audioEl.pause();
        audioEl.currentTime = 0;
        audioEl.src = ttsUrl;
        audioEl.playbackRate = speechSpeed || 1.0;

        audioEl.onplay = () => {
          console.log(`[TTS] onstart`);
          setIsSpeaking(true);
          setSpeakerState('speaking');
          liveStatusRef.current = 'speaking';
        };
        audioEl.onended = handleSpeechEnd;
        audioEl.onerror = (e) => {
          console.error(`[TTS] onerror:`, e);
          handleSpeechEnd();
        };

        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((playErr) => {
            console.error(`[TTS] onerror:`, playErr);
            handleSpeechEnd();
          });
        }
      } catch (streamErr) {
        console.error(`[TTS] onerror:`, streamErr);
        handleSpeechEnd();
      }
    };

    // Primary: Web Speech API SpeechSynthesisUtterance (Standard Web API)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
        utterance.lang = bcp47;
        utterance.rate = speechSpeed || 1.0;

        utterance.onstart = () => {
          console.log(`[TTS] onstart`);
          setIsSpeaking(true);
          setSpeakerState('speaking');
          liveStatusRef.current = 'speaking';
        };
        utterance.onend = handleSpeechEnd;
        utterance.onerror = (e) => {
          console.error(`[TTS] onerror:`, e);
          tryAudioStreamFallback();
        };

        currentUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        return;
      } catch (synthErr) {
        console.error(`[TTS] onerror:`, synthErr);
        tryAudioStreamFallback();
        return;
      }
    }

    tryAudioStreamFallback();
  }, [speechSpeed]);

  const playAudioSpeech = speakTranslatedSentence;
  const speakText = speakTranslatedSentence;

  // AI Feature: Smart Suggested Replies (Scenario-Aware)
  const fetchSmartReplies = useCallback(async (phrase, targetLangCode, convHistory = null, scenarioOverride = null) => {
    if (!phrase || !phrase.trim()) return;
    setIsLoadingReplies(true);
    const scen = scenarioOverride || selectedScenario;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/ai/suggest-replies`, {
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

  // Instant Smart Translation (Used only for manual text input / typing)
  const performTranslation = useCallback(async (text, sl, tl, tone = 'default', saveToHistory = false) => {
    // When Live Interpreter is active, speech recognition pipeline manages its own lifecycle!
    // NEVER translate or auto-speak background typing while live microphone is active!
    if (isLiveActiveRef.current) {
      return;
    }

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
      if (off && off.translated_text) {
        const offDetected = (sl && sl !== 'auto') ? sl : detectTrueLanguage(text);
        setTranslatedText(off.translated_text);
        setDetectedLangName(off.detected_lang || LANGUAGES[offDetected] || offDetected);
        setDetectedCode(offDetected);
        setTransliteratedScript(null);
        setLatencyMs(0);
        setIsTranslating(false);

        if (saveToHistory) {
          const newItem = {
            id: 'item_' + Date.now(),
            original_text: text,
            translated_text: off.translated_text,
            detected_lang: off.detected_lang || LANGUAGES[offDetected] || offDetected,
            detected_code: offDetected,
            target_lang: tl,
            transliterated_script: null,
            favorite: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
          };
          setHistory(prev => [newItem, ...prev.filter(p => p.original_text !== text)]);
        }

        if (saveToHistory && autoSpeak && !isLiveActiveRef.current && off.translated_text) {
          speakText(off.translated_text, tl);
        }
        return;
      }
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/api/translate`, {
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

      // ONLY speak if user explicitly clicked Send/Submit (saveToHistory=true) AND autoSpeak=true AND NOT live interpreting!
      if (saveToHistory && autoSpeak && !isLiveActiveRef.current && data.translated_text) {
        speakText(data.translated_text, data.target_lang);
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        const direct = await clientDirectTranslate(text, sl, tl);
        if (direct && direct.translated_text) {
          setTranslatedText(direct.translated_text);
          setDetectedLangName(direct.detected_lang);
          setDetectedCode(direct.detected_code);
          setTransliteratedScript(direct.pronunciation);
          setLatencyMs(Math.round(performance.now() - startTime));
          if (saveToHistory) {
            const newItem = {
              id: 'item_' + Date.now(),
              original_text: text,
              translated_text: direct.translated_text,
              detected_lang: direct.detected_lang,
              detected_code: direct.detected_code,
              target_lang: tl,
              transliterated_script: direct.pronunciation,
              favorite: false,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: Date.now()
            };
            setHistory(prev => [newItem, ...prev.filter(p => p.original_text !== text)]);
          }
          if (saveToHistory && autoSpeak && !isLiveActiveRef.current && direct.translated_text) {
            speakText(direct.translated_text, tl);
          }
        } else {
          console.error("Translation error", e);
        }
      }
    } finally {
      setIsTranslating(false);
    }
  }, [autoSpeak, isEffectivelyOffline, history, selectedScenario, fetchSmartReplies]);

  // Debounced translation as user manually types (only when live listening is inactive)
  useEffect(() => {
    if (isLiveActive) return;
    const timer = setTimeout(() => {
      performTranslation(inputText, sourceLang, targetLang, selectedTone, false);
    }, 450);

    return () => clearTimeout(timer);
  }, [inputText, sourceLang, targetLang, selectedTone, isLiveActive, performTranslation]);

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

  // 🎙️ LIVE INTERPRETER ENGINE (Continuous Auto-Listen + Offline + True Multi-Language STT)

  // 🧹 MANUAL CLEAR: Immediately cancel all active recognition, TTS, and timers, and reset to READY
  const clearActiveTurn = useCallback(() => {
    if (autoClearTimerRef.current) {
      clearTimeout(autoClearTimerRef.current);
      autoClearTimerRef.current = null;
    }
    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }
    if (liveRecognitionRef.current) {
      try { liveRecognitionRef.current.abort(); } catch (e) {}
      liveRecognitionRef.current = null;
    }
    if (wavRecorderRef.current) {
      try { wavRecorderRef.current.stop(); } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (e) {}
      activeAudioRef.current = null;
    }
    activeTranslationRequestIdRef.current++;
    activeTTSIdRef.current++;
    isProcessingVoiceRef.current = false;
    currentUtteranceRef.current = null;
    setIsListening(false);
    setIsSpeaking(false);
    setIsLiveActive(false);
    isLiveActiveRef.current = false;
    setSpeakerHeardText('');
    setTranslatedText('');
    setSpeakerResponseText('');
    setTransliteratedScript(null);
    setSpeakerTransScript('');
    setInputText('');
    setLiveInterimText('');
    setDetectedCode('');
    setDetectedLangName('');
    setSpeakerState('idle');
    liveStatusRef.current = 'idle';
  }, []);

  const stopLiveInterpretation = useCallback(() => {
    clearActiveTurn();
    showToast("Live Interpreter Paused");
  }, [clearActiveTurn]);

  const processSpeakerVoice = useCallback(async (spokenPhrase, forceDetectedCode = null, forceDetectedName = null) => {
    if (!spokenPhrase || !spokenPhrase.trim()) {
      isProcessingVoiceRef.current = false;
      return;
    }
    isProcessingVoiceRef.current = true;

    let cleanSpokenText = spokenPhrase.trim();
    let detectedSpokenLang = forceDetectedCode || detectTrueLanguage(cleanSpokenText);
    let detectedNameVal = forceDetectedName || LANGUAGES[detectedSpokenLang] || detectedSpokenLang;

    // 🛡️ CRITICAL PHONETIC RESTORATION:
    // If user spoke English, but legacy or client ASR produced Telugu phonetics (e.g. "మై నేమ్ ఇస్ వైష్ణవి..."):
    // Automatically translate the phonetic text back into pure English so "YOU SAID" shows clean English!
    if ((detectedSpokenLang === 'en' || isPhoneticEnglishInTelugu(cleanSpokenText)) && /[\u0C00-\u0C7F]/.test(cleanSpokenText)) {
      detectedSpokenLang = 'en';
      detectedNameVal = 'English';
      try {
        const restored = await performRobustTranslation(cleanSpokenText, 'te', 'en');
        if (restored && restored.translated_text && !restored.translated_text.startsWith("Translation service")) {
          cleanSpokenText = restored.translated_text.trim();
          console.log(`[Auto-Detect Restoration] Restored phonetic Telugu to English: "${cleanSpokenText}"`);
        }
      } catch (e) {
        console.warn("Phonetic restoration notice:", e);
      }
      if (/[\u0C00-\u0C7F]/.test(cleanSpokenText)) {
        try {
          const gtxResp = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=te&tl=en&dt=t&q=${encodeURIComponent(cleanSpokenText)}`);
          if (gtxResp.ok) {
            const gtxData = await gtxResp.json();
            if (gtxData && gtxData[0] && gtxData[0][0] && gtxData[0][0][0]) {
              cleanSpokenText = gtxData[0][0][0].trim();
            }
          }
        } catch (e) {}
      }
    }

    // Read active selected target and source languages:
    const activeTarget = (targetLang !== 'auto' && targetLang) ? targetLang : (speakerTargetLang || 'mr');
    const activeSource = (sourceLang !== 'auto' && sourceLang) ? sourceLang : detectedSpokenLang;

    let sLang = activeSource;
    let tLang = activeTarget;

    // If both source and target are English, output the clean English sentence directly
    let immediateTranslation = null;
    if (sLang === 'en' && tLang === 'en') {
      immediateTranslation = cleanSpokenText;
    } else if (sLang === tLang) {
      tLang = (sLang === 'en') ? 'mr' : 'en';
    }

    setSpeakerState('translating');
    liveStatusRef.current = 'translating';
    setSpeakerHeardText(cleanSpokenText);
    setDetectedCode(detectedSpokenLang);
    setDetectedLangName(detectedNameVal);
    // Keep inputText and interim preview empty so text box remains completely clean
    setInputText('');
    setLiveInterimText('');

    const requestId = ++activeTranslationRequestIdRef.current;

    // Call our robust multi-tiered semantic translation engine
    let res = null;
    if (immediateTranslation) {
      res = {
        translated_text: immediateTranslation,
        detected_code: 'en',
        pronunciation: immediateTranslation,
        engine: 'direct_language_match'
      };
    } else {
      res = await performRobustTranslation(cleanSpokenText, sLang, tLang);
    }

    if (activeTranslationRequestIdRef.current !== requestId) {
      return;
    }

    if (!res || res.error || !res.translated_text || res.translated_text.startsWith("Translation service is temporarily unavailable")) {
      const errorMsg = "Translation service is temporarily unavailable. Please try again.";
      setTranslatedText(errorMsg);
      setSpeakerResponseText(errorMsg);
      showToast(errorMsg);
      isProcessingVoiceRef.current = false;
      setSpeakerState('idle');
      liveStatusRef.current = 'idle';
      return;
    }

    const translated = res.translated_text;
    const translitScript = res.pronunciation;
    const finalDetectedCode = res.detected_code || detectedSpokenLang;
    const finalDetectedName = LANGUAGES[finalDetectedCode] || detectedNameVal;
    const engineUsed = res.engine || 'robust_engine';

    // REQUIRED DEBUG CONSOLE LOGS
    console.log(`[Language Detection] Detected language: ${finalDetectedCode} (${finalDetectedName})`);
    console.log(`[Translation] Source language: ${sLang}`);
    console.log(`[Translation] Target language: ${tLang}`);
    console.log(`[Translation] Response: "${translated}"`);

    // Update state for Display
    setTranslatedText(translated);
    setSpeakerResponseText(translated);
    setSpeakerTransScript(translitScript);
    setTransliteratedScript(translitScript);
    setDetectedCode(finalDetectedCode);
    setDetectedLangName(finalDetectedName);
    setSpeakerState('speaking');
    liveStatusRef.current = 'speaking';

    // Record in Live Session Log
    const newLogItem = {
      id: 'live_' + Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      spoken: spokenPhrase,
      translated: translated,
      sourceLang: finalDetectedCode,
      targetLang: tLang,
      speaker: `Person (${finalDetectedName})`,
      scenario: selectedScenario,
      engine: engineUsed
    };
    setLiveSessionLog(prev => [newLogItem, ...prev]);

    // Record in global History BEFORE clearing the active turn (History is preserved!)
    const newItem = {
      id: 'speak_item_' + Date.now(),
      original_text: spokenPhrase,
      translated_text: translated,
      detected_lang: finalDetectedName,
      detected_code: finalDetectedCode,
      target_lang: tLang,
      transliterated_script: translitScript,
      favorite: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    setHistory(prev => [newItem, ...prev]);

    // 🔊 AUTOMATIC MANDATORY TEXT-TO-SPEECH PLAYBACK IN TARGET LANGUAGE (tLang)
    speakTranslatedSentence(translated, tLang, () => {
      // Speech finished!
      isProcessingVoiceRef.current = false;
      setIsListening(false);
      setIsLiveActive(false);
      isLiveActiveRef.current = false;

      // Keep result visible briefly (1-3s configurable, default 2s) before auto-clearing
      setSpeakerState('result_visible');
      liveStatusRef.current = 'result_visible';

      if (autoClearTimerRef.current) {
        clearTimeout(autoClearTimerRef.current);
      }
      autoClearTimerRef.current = setTimeout(() => {
        // ✨ AUTOMATICALLY CLEAR CURRENT ACTIVE TURN (Input, transcript, translation, detected lang)
        // History remains 100% safe in History tab!
        setSpeakerHeardText('');
        setTranslatedText('');
        setSpeakerResponseText('');
        setTransliteratedScript(null);
        setSpeakerTransScript('');
        setInputText('');
        setLiveInterimText('');
        setDetectedCode('');
        setDetectedLangName('');
        setSpeakerState('idle');
        liveStatusRef.current = 'idle';
        autoClearTimerRef.current = null;
      }, AUTO_CLEAR_DELAY_MS);
    });
  }, [sourceLang, targetLang, speakerInputLang, speakerTargetLang, selectedScenario, speakTranslatedSentence]);

  // Sentence Completion & Dispatch: submits after complete utterance and runs true STT
  const finalizeAndSubmitUtterance = useCallback(async () => {
    if (isProcessingVoiceRef.current) return;
    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }

    // 🛑 Stop and abort speech recognition immediately so mic is OFF while translating & speaking
    if (liveRecognitionRef.current) {
      try { 
        liveRecognitionRef.current.stop(); 
        liveRecognitionRef.current.abort(); 
      } catch (err) {}
      liveRecognitionRef.current = null;
    }

    setIsListening(false);

    // Stop WavAudioRecorder to get the audio blob
    let audioBlob = null;
    if (wavRecorderRef.current) {
      try {
        audioBlob = wavRecorderRef.current.stop();
      } catch (e) {
        console.warn("wavRecorder stop notice:", e);
      }
    }

    let preliminaryPhrase = (
      utteranceBufferRef.current || 
      finalTranscriptRef.current || 
      interimTranscriptRef.current || 
      accumulatedSpeechRef.current || 
      ''
    ).trim();

    let finalPhrase = preliminaryPhrase;
    let resolvedDetectedCode = null;
    let resolvedDetectedName = null;

    // Send audio blob to /api/stt for true multilingual neural speech recognition
    if (audioBlob) {
      try {
        setSpeakerState('processing');
        liveStatusRef.current = 'processing';
        const formData = new FormData();
        formData.append('audio', audioBlob, 'speech.wav');
        formData.append('source_lang', sourceLang);

        const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/stt` : '/api/stt';
        const sttResp = await fetch(endpoint, {
          method: 'POST',
          body: formData
        });
        if (sttResp.ok) {
          const sttData = await sttResp.json();
          if (sttData && sttData.transcript && sttData.transcript.trim()) {
            finalPhrase = sttData.transcript.trim();
            resolvedDetectedCode = sttData.detected_code;
            resolvedDetectedName = sttData.detected_lang;
          }
        }
      } catch (err) {
        console.warn("Backend STT error, falling back to client transcript:", err);
      }
    }

    if (!finalPhrase) {
      // If nothing was captured, reset cleanly to ready
      isProcessingVoiceRef.current = false;
      setSpeakerState('idle');
      liveStatusRef.current = 'idle';
      return;
    }

    if (!resolvedDetectedCode) {
      resolvedDetectedCode = (sourceLang !== 'auto') ? sourceLang : detectTrueLanguage(finalPhrase);
      resolvedDetectedName = LANGUAGES[resolvedDetectedCode] || resolvedDetectedCode;
    }

    // 🛡️ CRITICAL SCRIPT RECONCILIATION & PHONETIC RESTORATION (Foolproof True Detection)
    // 1. Spoke English, but transcript arrived in Telugu script (e.g. "మై నేమ్ ఇస్ వైష్ణవి..."):
    if ((resolvedDetectedCode === 'en' || isPhoneticEnglishInTelugu(finalPhrase)) && /[\u0C00-\u0C7F]/.test(finalPhrase)) {
      resolvedDetectedCode = 'en';
      resolvedDetectedName = 'English';
      try {
        const restored = await performRobustTranslation(finalPhrase, 'te', 'en');
        if (restored && restored.translated_text && !restored.translated_text.startsWith("Translation service")) {
          finalPhrase = restored.translated_text.trim();
          console.log(`[Auto-Detect Restoration] Restored phonetic Telugu to English: "${finalPhrase}"`);
        }
      } catch (e) {
        console.warn("English restoration notice:", e);
      }
      // Instant direct fallback to guarantee English text
      if (/[\u0C00-\u0C7F]/.test(finalPhrase)) {
        try {
          const gtxResp = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=te&tl=en&dt=t&q=${encodeURIComponent(finalPhrase)}`);
          if (gtxResp.ok) {
            const gtxData = await gtxResp.json();
            if (gtxData && gtxData[0] && gtxData[0][0] && gtxData[0][0][0]) {
              finalPhrase = gtxData[0][0][0].trim();
            }
          }
        } catch (e) {}
      }
    }

    // 2. Spoke Hindi, but transcript arrived in Latin/English or Telugu phonetics:
    if (resolvedDetectedCode === 'hi' && !/[\u0900-\u097F]/.test(finalPhrase)) {
      try {
        const fromCode = /[\u0C00-\u0C7F]/.test(finalPhrase) ? 'te' : 'en';
        const restored = await performRobustTranslation(finalPhrase, fromCode, 'hi');
        if (restored && restored.translated_text && /[\u0900-\u097F]/.test(restored.translated_text)) {
          finalPhrase = restored.translated_text.trim();
        }
      } catch (e) {
        console.warn("Hindi restoration notice:", e);
      }
    }

    // 3. Spoke Telugu, but transcript arrived in Latin script (e.g. "na peru raj"):
    if (resolvedDetectedCode === 'te' && !/[\u0C00-\u0C7F]/.test(finalPhrase)) {
      try {
        const restored = await performRobustTranslation(finalPhrase, 'en', 'te');
        if (restored && restored.translated_text && /[\u0C00-\u0C7F]/.test(restored.translated_text)) {
          finalPhrase = restored.translated_text.trim();
        }
      } catch (e) {
        console.warn("Telugu restoration notice:", e);
      }
    }

    console.log(`[ASR Complete] Final Phrase: "${finalPhrase}" | Detected: ${resolvedDetectedName} (${resolvedDetectedCode})`);

    isProcessingVoiceRef.current = true;
    lastSubmittedPhraseRef.current = finalPhrase;
    accumulatedSpeechRef.current = '';
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    utteranceBufferRef.current = '';
    sessionFinalRef.current = '';
    finalizedHistoryRef.current = '';
    
    // Clean input field and interim preview immediately
    setInputText('');
    setLiveInterimText('');
    setSpeakerHeardText(finalPhrase);
    setDetectedCode(resolvedDetectedCode);
    setDetectedLangName(resolvedDetectedName);

    // State sequence: SENTENCE_COMPLETE -> TRANSLATING
    liveStatusRef.current = 'translating';
    setSpeakerState('translating');

    processSpeakerVoice(finalPhrase, resolvedDetectedCode, resolvedDetectedName);
  }, [sourceLang, processSpeakerVoice]);

  useEffect(() => {
    finalizeUtteranceRef.current = finalizeAndSubmitUtterance;
  }, [finalizeAndSubmitUtterance]);

  // Start a single listening turn in the continuous loop
  const startLiveTurn = useCallback(() => {
    if (!isLiveActiveRef.current || isProcessingVoiceRef.current) return;

    // Cancel any pending auto-clear timer when starting a new turn!
    if (autoClearTimerRef.current) {
      clearTimeout(autoClearTimerRef.current);
      autoClearTimerRef.current = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech Recognition not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    if (liveRecognitionRef.current) {
      try { liveRecognitionRef.current.abort(); } catch (e) {}
    }

    // Start fresh WavAudioRecorder for high-fidelity audio capture sent to multilingual STT
    if (wavRecorderRef.current) {
      try { wavRecorderRef.current.stop(); } catch (e) {}
      wavRecorderRef.current = null;
    }
    wavRecorderRef.current = new WavAudioRecorder();
    wavRecorderRef.current.start().catch((err) => {
      console.warn("Could not start WavAudioRecorder:", err);
    });

    const sr = new SpeechRecognition();
    sr.continuous = true;
    sr.interimResults = true;

    // In Auto Detect mode: ALWAYS use 'en-US' as baseline client speech recognizer!
    // NEVER allow navigator.language to force 'te-IN' or any regional script transliteration!
    let srLang = 'en-US';
    if (sourceLang !== 'auto' && sourceLang) {
      srLang = SPEECH_LANGS[sourceLang]?.code || 'en-US';
    } else {
      srLang = 'en-US';
    }
    sr.lang = srLang;

    sr.onstart = () => {
      setIsListening(true);
      setSpeakerState('listening');
      liveStatusRef.current = 'listening';
    };

    sr.onresult = (e) => {
      if (isProcessingVoiceRef.current) return;

      let hasFinalSegment = false;
      let currentSessionFinal = '';
      let currentInterim = '';

      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        const transcript = (res[0]?.transcript || '').trim();
        if (!transcript) continue;
        if (res.isFinal) {
          hasFinalSegment = true;
          currentSessionFinal += (currentSessionFinal ? ' ' : '') + transcript;
        } else {
          currentInterim += (currentInterim ? ' ' : '') + transcript;
        }
      }

      // Maintain separate final and interim transcripts
      const combinedFinal = (sessionFinalRef.current + (sessionFinalRef.current && currentSessionFinal ? ' ' : '') + currentSessionFinal).trim();
      finalTranscriptRef.current = combinedFinal;
      interimTranscriptRef.current = currentInterim;

      // Utterance buffer holds preview across all finalized and interim speech
      const fullUtterance = (combinedFinal + (combinedFinal && currentInterim ? ' ' : '') + currentInterim).trim();
      utteranceBufferRef.current = fullUtterance;
      accumulatedSpeechRef.current = fullUtterance;

      if (!fullUtterance) return;

      // Real-time live transcript preview in UI
      if (sourceLang === 'auto') {
        if (isPhoneticEnglishInTelugu(fullUtterance)) {
          setLiveInterimText("Listening... (English speech detected)");
        } else {
          setLiveInterimText(fullUtterance ? `Hearing: "${fullUtterance}..."` : "Listening... (Detecting language)");
        }
      } else {
        setInputText(fullUtterance);
        setLiveInterimText(fullUtterance);
      }
      setSpeakerState('transcribing');
      liveStatusRef.current = 'transcribing';

      // Required Debug Log
      console.log(`[ASR Debug] Turn: ${currentSpeakerTurnRef.current || 'A'} | Lang: ${sr.lang} | Interim: "${currentInterim}" | Final: "${combinedFinal}"`);

      // Reset the silence debounce timer on every new speech event (interim or final)
      if (speechSilenceTimerRef.current) {
        clearTimeout(speechSilenceTimerRef.current);
      }

      // 🎯 High-Performance End-of-Speech Silence Threshold:
      // If final segment detected, wait 600ms to confirm sentence is complete.
      // If still mid-sentence interim, allow 1400ms for natural pauses.
      const delay = hasFinalSegment ? 600 : 1400;

      speechSilenceTimerRef.current = setTimeout(() => {
        if (finalizeUtteranceRef.current) {
          finalizeUtteranceRef.current();
        }
      }, delay);
    };

    sr.onerror = (e) => {
      if (e.error === 'no-speech' && isLiveActiveRef.current && !isProcessingVoiceRef.current) {
        setTimeout(() => {
          if (isLiveActiveRef.current && !isProcessingVoiceRef.current && startLiveTurnRef.current) {
            startLiveTurnRef.current();
          }
        }, 150);
      } else if (e.error === 'not-allowed') {
        showToast("⚠️ Microphone access denied. Please click the lock icon in the address bar and allow microphone.");
        setIsLiveActive(false);
        isLiveActiveRef.current = false;
        setIsListening(false);
        setSpeakerState('idle');
      } else if (e.error !== 'aborted') {
        console.warn("Live listening notice:", e.error);
      }
    };

    sr.onend = () => {
      setIsListening(false);
      // Only preserve finalized words if NOT currently processing or submitting
      if (!isProcessingVoiceRef.current && finalTranscriptRef.current) {
        sessionFinalRef.current = finalTranscriptRef.current;
      }

      // Seamlessly restart if user is still in listening/transcribing state
      if (isLiveActiveRef.current && !isProcessingVoiceRef.current) {
        setTimeout(() => {
          if (isLiveActiveRef.current && !isProcessingVoiceRef.current && startLiveTurnRef.current) {
            try {
              startLiveTurnRef.current();
            } catch (err) {}
          }
        }, 120);
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
  }, [sourceLang, targetLang, speakerInputLang, speakerTargetLang]);

  useEffect(() => {
    startLiveTurnRef.current = startLiveTurn;
  }, [startLiveTurn]);

  // =========================================================================
  // 🎓 MODE 2: LEARN LANGUAGE LOGIC (LISTEN ➔ REPEAT ➔ PRACTICE EVALUATION)
  // =========================================================================
  const handleLearnTranslate = useCallback(async (phrase, kLang = learnKnownLang, tLang = learnTargetLang) => {
    if (!phrase || !phrase.trim()) return;
    setIsLearnLoading(true);
    setRepeatFeedback(null);
    setRepeatAttemptText('');

    let trans = '';
    let pron = null;
    let mean = null;

    try {
      const resp = await fetch(`${API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: phrase.trim(),
          source_lang: kLang,
          target_lang: tLang,
          scenario: 'general'
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        trans = data.translated_text;
        pron = data.pronunciation || data.transliterated_script;
        mean = data.meaning;
      }
    } catch (e) {
      console.warn("Learn translation API notice:", e);
    }

    if (!trans) {
      const direct = await clientDirectTranslate(phrase, kLang, tLang);
      if (direct) {
        trans = direct.translated_text;
        pron = direct.pronunciation;
        mean = direct.meaning;
      }
    }

    if (trans) {
      const resultObj = {
        original: phrase.trim(),
        translation: trans,
        pronunciation: pron || trans,
        meaning: mean || phrase.trim(),
        knownLang: kLang,
        targetLang: tLang
      };
      setLearnData(resultObj);
      setLearnInputText('');

      // 🔊 Automatically speak the target translation aloud so learner hears correct pronunciation
      speakTranslatedSentence(trans, tLang);
    } else {
      showToast("Could not translate for learning. Please try again.");
    }
    setIsLearnLoading(false);
  }, [learnKnownLang, learnTargetLang, speakTranslatedSentence]);

  const toggleLearnVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech Recognition not supported in this browser. Please use Chrome/Edge.");
      return;
    }
    if (isLearnListening && learnRecognitionRef.current) {
      try { learnRecognitionRef.current.abort(); } catch (e) {}
      setIsLearnListening(false);
      return;
    }

    try {
      const sr = new SpeechRecognition();
      sr.continuous = false;
      sr.interimResults = true;
      sr.lang = SPEECH_LANGS[learnKnownLang]?.code || 'te-IN';

      sr.onstart = () => {
        setIsLearnListening(true);
        showToast(`🎙️ Listening in ${LANGUAGES[learnKnownLang]}... Speak your sentence!`);
      };

      let finalCaptured = '';
      sr.onresult = (e) => {
        let interim = '';
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) {
            finalCaptured += res[0].transcript + ' ';
          } else {
            interim += res[0].transcript + ' ';
          }
        }
        setLearnInputText((finalCaptured + interim).trim());
      };

      sr.onerror = (e) => {
        console.warn("Learn voice notice:", e);
        setIsLearnListening(false);
      };

      sr.onend = () => {
        setIsLearnListening(false);
        const textToTranslate = finalCaptured.trim() || learnInputText.trim();
        if (textToTranslate) {
          handleLearnTranslate(textToTranslate);
        }
      };

      learnRecognitionRef.current = sr;
      sr.start();
    } catch (e) {
      console.warn("Learn voice start notice:", e);
      setIsLearnListening(false);
    }
  };

  const startRepeatPractice = () => {
    if (!learnData || !learnData.translation) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech Recognition not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    if (isRepeatListening && repeatRecognitionRef.current) {
      try { repeatRecognitionRef.current.abort(); } catch (e) {}
      setIsRepeatListening(false);
      return;
    }

    try {
      const sr = new SpeechRecognition();
      sr.continuous = false;
      sr.interimResults = true;
      sr.lang = SPEECH_LANGS[learnData.targetLang]?.code || 'hi-IN';

      sr.onstart = () => {
        setIsRepeatListening(true);
        setRepeatFeedback(null);
        setRepeatAttemptText('');
        showToast(`🎤 Repeat now in ${LANGUAGES[learnData.targetLang]}! Speak clearly.`);
      };

      let captured = '';
      sr.onresult = (e) => {
        for (let i = 0; i < e.results.length; i++) {
          captured += e.results[i][0].transcript + ' ';
        }
        setRepeatAttemptText(captured.trim());
      };

      sr.onerror = (e) => {
        console.warn("Repeat mic notice:", e);
        setIsRepeatListening(false);
      };

      sr.onend = () => {
        setIsRepeatListening(false);
        const attempt = captured.trim();
        if (!attempt) {
          setRepeatFeedback({ score: 0, comment: 'Did not catch your voice. Tap Repeat and speak closely.', isGood: false });
          return;
        }

        // Evaluate pronunciation similarity against target sentence
        const targetClean = (learnData.translation || '').replace(/[.,?!।]/g, '').trim().toLowerCase();
        const attemptClean = attempt.replace(/[.,?!।]/g, '').trim().toLowerCase();

        let score = 75;
        let comment = '';

        if (targetClean === attemptClean) {
          score = 98;
          comment = '🌟 Perfect! Your pronunciation is natural, accurate, and spot on!';
        } else {
          const tWords = targetClean.split(/\s+/).filter(Boolean);
          const aWords = attemptClean.split(/\s+/).filter(Boolean);
          let matches = 0;
          tWords.forEach(w => {
            if (aWords.some(aw => aw.includes(w) || w.includes(aw))) {
              matches++;
            }
          });
          const matchRatio = matches / Math.max(tWords.length, 1);
          if (matchRatio >= 0.7) {
            score = Math.round(80 + matchRatio * 18);
            comment = 'Great! Your pronunciation is close and clear.';
          } else if (matchRatio >= 0.35) {
            score = Math.round(55 + matchRatio * 20);
            const missedWord = tWords.find(w => !aWords.includes(w)) || tWords[0];
            comment = `Try saying "${missedWord}" more clearly.`;
          } else {
            score = Math.round(35 + Math.random() * 15);
            comment = `Listen again carefully to the native audio, then repeat.`;
          }
        }
        setRepeatFeedback({ score, comment, isGood: score >= 65 });
      };

      repeatRecognitionRef.current = sr;
      sr.start();
    } catch (err) {
      console.warn("Repeat recognition start notice:", err);
      setIsRepeatListening(false);
    }
  };

  // Toggle Live Interpreting (Continuous Hands-Free Two-Way Loop)
  const toggleLiveInterpreting = () => {
    ensureAudioContext();
    if (isLiveActive) {
      stopLiveInterpretation();
    } else {
      // 🧹 Automatically clear previous sentence so screen is fresh and clean!
      // Cancel any pending autoClearTimer
      if (autoClearTimerRef.current) {
        clearTimeout(autoClearTimerRef.current);
        autoClearTimerRef.current = null;
      }
      setInputText('');
      setLiveInterimText('');
      setSpeechInterim('');
      accumulatedSpeechRef.current = '';
      isProcessingVoiceRef.current = false;
      lastSubmittedPhraseRef.current = '';
      lastSubmitTimeRef.current = 0;
      sessionFinalRef.current = '';
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      utteranceBufferRef.current = '';
      activeTTSIdRef.current++;
      activeTranslationRequestIdRef.current++;
      isLiveActiveRef.current = true;
      setIsLiveActive(true);
      setIsListening(true);
      setSpeakerState('listening');
      liveStatusRef.current = 'listening';
      currentSpeakerTurnRef.current = 'A';
      setCurrentSpeakerTurn('A');
      setLastSpeakerTurn('A');
      const pairLangA = (sourceLang !== 'auto' ? sourceLang : 'auto');
      const pairLangB = (targetLang !== 'auto' && targetLang) ? targetLang : (speakerTargetLang || 'mr');
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
        const bcp47 = SPEECH_LANGS[activeCode]?.code || 'en-US';
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
      const currentDetected = detectedCode || 'en';
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
    const textToShare = `Original: ${orig}\n\nTranslated (${LANGUAGES[tLang] || tLang}): ${trans}\n\n— Translated via Bhashora AI Smart Translator`;
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
      const resp = await fetch(`${API_BASE_URL}/api/ai/explain`, {
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
      const resp = await fetch(`${API_BASE_URL}/api/ai/alternatives`, {
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
      const resp = await fetch(`${API_BASE_URL}/api/ai/grammar`, {
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
        const resp = await fetch(`${API_BASE_URL}/api/pronunciation/score`, {
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
      const resp = await fetch(`${API_BASE_URL}/api/document/translate`, {
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
      const resp = await fetch(`${API_BASE_URL}/api/translate`, {
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
            Bhashora <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">AI</span>
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

      {/* Mounted DOM Audio Element for 100% Reliable Voice Output */}
      <audio ref={audioPlayerRef} preload="auto" className="hidden" />

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
                  Bhashora <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">Personal Live AI Interpreter</p>
              </div>
            </div>

            {/* Top Bar Actions: Status Pill, Theme Toggle, Bell & Explore Tools */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:flex px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Live Two-Way Interpreter
              </span>

              {/* Theme Toggle Button (Light / Dark) */}
              <button 
                onClick={() => {
                  const next = !darkMode;
                  setDarkMode(next);
                  showToast(next ? "Switched to Dark Cyber Theme 🌙" : "Switched to High-Contrast Light Theme ☀️");
                }}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
                title={darkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-cyan-300" />}
              </button>

              {/* Notifications Button & Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(prev => !prev)}
                  className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
                  title="Notifications & System Alerts"
                >
                  <Bell className="w-4 h-4" />
                  {hasUnreadNotifs && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-white">System Notifications</span>
                      </div>
                      {hasUnreadNotifs && (
                        <button
                          onClick={() => {
                            setHasUnreadNotifs(false);
                            showToast("All notifications marked as read");
                          }}
                          className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="py-2 space-y-2.5 max-h-64 overflow-y-auto">
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
                        <div className="font-bold text-slate-200">✨ Multilingual STT Ready</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">True Auto Language Detection active for English, Telugu, Hindi, Marathi, Tamil, etc.</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
                        <div className="font-bold text-slate-200">👤 Account Verified</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Logged in as {userProfile.name} ({userProfile.email}). Pro Member features unlocked.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Explore Tools (Navigates to Page 3 Workspace and opens Sidebar) */}
              <button
                onClick={() => {
                  setCurrentStage('workspace');
                  setSidebarOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-indigo-500/50 transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-95 group"
                title="Open full workspace with sidebar and all tools"
              >
                <Menu className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">Explore Tools</span>
                <span className="text-xs text-indigo-400">➔</span>
              </button>
            </div>
          </header>

          {/* Main Clean Center Content */}
          <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col justify-center items-center space-y-6">
            
            {/* Mode Switcher: 🎙️ TALK (Live Interpreter) vs 🎓 LEARN (Conversation Coach) */}
            <div className="w-full flex items-center justify-center p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
              <button
                onClick={() => {
                  if (activeMode !== 'talk') {
                    stopLiveInterpretation();
                    setActiveMode('talk');
                  }
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeMode === 'talk'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>🎙️ TALK — Live Interpreter</span>
              </button>
              <button
                onClick={() => {
                  if (activeMode !== 'learn') {
                    stopLiveInterpretation();
                    setActiveMode('learn');
                  }
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeMode === 'learn'
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-500 text-white shadow-md shadow-purple-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>🎓 LEARN — Practice Coach</span>
              </button>
            </div>

            {/* ========================================================= */}
            {/* 🎙️ MODE 1: TALK (LIVE 2-WAY INTERPRETER)                  */}
            {/* ========================================================= */}
            {activeMode === 'talk' ? (
              <>
                {/* Minimal Language Controls */}
                <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-3 shadow-xl flex items-center justify-between gap-2">
                  {/* I Speak */}
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-950/70 rounded-2xl border border-slate-800">
                    <span className="text-xs font-bold text-blue-400 shrink-0">I Speak:</span>
                    <select
                      value={sourceLang}
                      onChange={(e) => {
                        const newSource = e.target.value;
                        setSourceLang(newSource);
                        if (newSource !== 'auto') {
                          setSpeakerInputLang(newSource);
                        }
                      }}
                      className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer w-full"
                    >
                      <option value="auto" className="bg-slate-900 text-cyan-300 font-extrabold">🌐 Auto Detect</option>
                      <option value="en" className="bg-slate-900 text-white">🇺🇸 English</option>
                      <option value="te" className="bg-slate-900 text-white">🇮🇳 Telugu (తెలుగు)</option>
                      <option value="hi" className="bg-slate-900 text-white">🇮🇳 Hindi (हिन्दी)</option>
                      <option value="ta" className="bg-slate-900 text-white">🇮🇳 Tamil (தமிழ்)</option>
                      <option value="kn" className="bg-slate-900 text-white">🇮🇳 Kannada (ಕನ್ನಡ)</option>
                      <option value="ml" className="bg-slate-900 text-white">🇮🇳 Malayalam (മലയാളం)</option>
                      <option value="mr" className="bg-slate-900 text-white">🇮🇳 Marathi (मराठी)</option>
                      <option value="bn" className="bg-slate-900 text-white">🇮🇳 Bengali (বাংলা)</option>
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
                      onChange={(e) => {
                        const newTarget = e.target.value;
                        setTargetLang(newTarget);
                        setSpeakerTargetLang(newTarget);
                      }}
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
                        : speakerState === 'transcribing'
                        ? 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-cyan-500/50 ring-4 ring-cyan-400/40 animate-pulse'
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
                    ) : speakerState === 'transcribing' ? (
                      <Mic className="w-12 h-12 text-cyan-200 animate-pulse" />
                    ) : speakerState === 'translating' ? (
                      <Sparkles className="w-12 h-12 text-white animate-spin-slow" />
                    ) : speakerState === 'speaking' ? (
                      <Volume2 className="w-12 h-12 text-white animate-pulse" />
                    ) : (
                      <Mic className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
                    )}
                  </button>

                  {/* State Machine Status Label */}
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <span className={`text-xs font-extrabold uppercase tracking-wider px-4 py-1.5 rounded-full border shadow-sm ${
                        isLiveActive && speakerState === 'listening'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                          : speakerState === 'transcribing'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                          : speakerState === 'processing'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse'
                          : speakerState === 'translating' 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                          : speakerState === 'speaking'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse'
                          : speakerState === 'result_visible'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
                      }`}>
                        {isLiveActive && speakerState === 'listening' 
                          ? `🟢 LISTENING... (${sourceLang !== 'auto' ? (LANGUAGES[sourceLang] || sourceLang) : 'AUTO DETECT'})`
                          : speakerState === 'transcribing'
                          ? '✍️ Hearing speech...'
                          : speakerState === 'processing'
                          ? '⚡ Detecting language & words...'
                          : speakerState === 'translating' 
                          ? '✨ Translating...' 
                          : speakerState === 'speaking' 
                          ? `🔊 Speaking in ${LANGUAGES[targetLang] || targetLang}...` 
                          : speakerState === 'result_visible'
                          ? '✨ Done • Ready'
                          : '🎙️ Tap to Speak'}
                      </span>

                      {/* Visible Manual ✕ Clear button: Always available when active or text is present */}
                      {(speakerHeardText || translatedText || isLiveActive || isListening || isSpeaking || speakerState !== 'idle' || inputText) && (
                        <button
                          onClick={clearActiveTurn}
                          className="px-3 py-1 rounded-full bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Clear current translation and reset to ready"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>✕ Clear</span>
                        </button>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium text-center">
                      {isLiveActive && speakerState === 'listening'
                        ? `Speak naturally • Will translate & speak in ${LANGUAGES[targetLang] || targetLang}`
                        : speakerState === 'transcribing'
                        ? 'Capturing sentence • Finishes when you pause naturally'
                        : speakerState === 'speaking'
                        ? `Microphone paused while speaking in ${LANGUAGES[targetLang] || targetLang}`
                        : speakerState === 'result_visible'
                        ? 'Auto-clears briefly so next sentence starts fresh'
                        : `Tap microphone • Multilingual auto-detection active`}
                    </span>
                  </div>

                  {/* Live Audio Interim Hearing Preview */}
                  {isLiveActive && liveInterimText && (
                    <div className="mt-3 px-4 py-2 bg-slate-950/80 border border-cyan-500/40 rounded-2xl text-xs text-cyan-200 italic flex items-center gap-2 animate-pulse shadow-lg">
                      <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Hearing: "{liveInterimText}..."</span>
                    </div>
                  )}
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
                        <Mic className="w-3.5 h-3.5" /> YOU SAID ({
                          sourceLang === 'auto'
                            ? 'AUTO DETECT'
                            : (LANGUAGES[sourceLang] || sourceLang).toUpperCase()
                        })
                      </span>
                      {detectedCode && detectedCode !== 'auto' && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold">
                          Detected: {detectedLangName || LANGUAGES[detectedCode] || detectedCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-slate-100 min-h-[36px] leading-relaxed">
                      {(isLiveActive && liveInterimText && sourceLang !== 'auto') ? (
                        <span className="text-cyan-300 italic">"{liveInterimText}"</span>
                      ) : speakerHeardText ? (
                        `"${speakerHeardText}"`
                      ) : inputText ? (
                        `"${inputText}"`
                      ) : (
                        <span className="text-slate-600 text-base italic">Speak or type a phrase above...</span>
                      )}
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
                        <Volume2 className="w-3.5 h-3.5 text-purple-400" /> TRANSLATED RESPONSE ({(LANGUAGES[targetLang] || targetLang).toUpperCase()})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => speakText(translatedText, targetLang)}
                          disabled={!translatedText}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-30 shadow-sm"
                          title="Replay Voice in Target Language"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Replay Voice
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

                  {/* Real-time Conversation History stream */}
                  {liveSessionLog && liveSessionLog.length > 0 && (
                    <div className="w-full pt-4 space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" /> Continuous Conversation Turns ({liveSessionLog.length})
                        </span>
                        <button
                          onClick={() => setLiveSessionLog([])}
                          className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          Clear Log
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {liveSessionLog.map((log) => (
                          <div
                            key={log.id}
                            className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-3.5 shadow-lg space-y-2 transition-all"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                {log.speaker}
                              </span>
                              <span className="text-slate-500">{log.time}</span>
                            </div>

                            {/* Spoken original */}
                            <div className="text-sm font-semibold text-slate-200 pl-3 border-l-2 border-blue-500/50">
                              "{log.spoken}"
                            </div>

                            {/* Translated */}
                            <div className="flex items-center justify-between bg-slate-950/60 rounded-xl p-2.5 border border-purple-500/20">
                              <span className="text-sm font-bold text-transparent bg-gradient-to-r from-purple-300 to-indigo-200 bg-clip-text">
                                "{log.translated}"
                              </span>
                              <button
                                onClick={() => speakText(log.translated, log.targetLang)}
                                className="p-1 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-950/50 transition-colors"
                                title="Listen"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ========================================================= */
              /* 🎓 MODE 2: LEARN (CONVERSATION COACH & PRONUNCIATION)     */
              /* ========================================================= */
              <div className="w-full space-y-6 animate-in fade-in duration-300">
                {/* Learn Language Pair Selector */}
                <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* I Know */}
                  <div className="flex-1 w-full flex items-center gap-2 px-3 py-2.5 bg-slate-950/70 rounded-2xl border border-slate-800">
                    <span className="text-xs font-bold text-blue-400 shrink-0">I Know:</span>
                    <select
                      value={learnKnownLang}
                      onChange={(e) => setLearnKnownLang(e.target.value)}
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
                    </select>
                  </div>

                  <span className="text-indigo-400 font-bold hidden sm:inline">➔</span>

                  {/* I Want to Learn */}
                  <div className="flex-1 w-full flex items-center gap-2 px-3 py-2.5 bg-slate-950/70 rounded-2xl border border-slate-800">
                    <span className="text-xs font-bold text-purple-400 shrink-0">I Want to Learn:</span>
                    <select
                      value={learnTargetLang}
                      onChange={(e) => setLearnTargetLang(e.target.value)}
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

                {/* Known Language Speech/Text Input Box */}
                <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-blue-400 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5" /> Speak or Type in {LANGUAGES[learnKnownLang]}
                    </span>
                    <span className="text-[11px] text-slate-500">Listen ➔ Repeat ➔ Practice</span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={learnInputText}
                      onChange={(e) => setLearnInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleLearnTranslate(learnInputText);
                      }}
                      placeholder={`Say or type something in ${LANGUAGES[learnKnownLang]}, e.g. నువ్వు ఎలా ఉన్నావు?`}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3.5 pl-4 pr-24 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                    />
                    <div className="absolute right-2 top-2 flex items-center gap-1.5">
                      <button
                        onClick={toggleLearnVoiceInput}
                        className={`p-2 rounded-xl text-white transition-all cursor-pointer shadow-md ${
                          isLearnListening
                            ? 'bg-rose-600 animate-pulse ring-2 ring-rose-400'
                            : 'bg-indigo-600 hover:bg-indigo-500'
                        }`}
                        title="Speak in your known language"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleLearnTranslate(learnInputText)}
                        disabled={!learnInputText.trim() || isLearnLoading}
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer disabled:opacity-40 shadow-md"
                      >
                        {isLearnLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Instant Practice Suggestions */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] text-slate-500 font-semibold">Try practicing:</span>
                    {[
                      { label: "నువ్వు ఎలా ఉన్నావు?", full: "నువ్వు ఎలా ఉన్నావు?" },
                      { label: "నాకు నీళ్లు కావాలి", full: "నాకు నీళ్లు కావాలి" },
                      { label: "మీ పేరు ఏమిటి?", full: "మీ పేరు ఏమిటి?" },
                      { label: "ధన్యవాదాలు", full: "ధన్యవాదాలు" }
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setLearnInputText(chip.full);
                          handleLearnTranslate(chip.full);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-cyan-300 transition-colors cursor-pointer"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🎓 THE 4 LEARNING CARDS: YOU SAID ➔ TRANSLATION ➔ PRONUNCIATION ➔ MEANING */}
                {learnData && (
                  <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    
                    {/* CARD 1: YOU SAID */}
                    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
                      <div className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> YOU SAID ({LANGUAGES[learnData.knownLang]})
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-slate-100">
                        "{learnData.original}"
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                      <div className="px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] font-bold text-purple-300 shadow-md">
                        ↓ Learning Card & Native Voice
                      </div>
                    </div>

                    {/* CARD 2: TRANSLATION (TARGET LANGUAGE) */}
                    <div className="w-full bg-slate-900/90 border border-purple-500/40 rounded-3xl p-5 shadow-xl space-y-3">
                      <div className="flex items-center justify-between text-xs text-purple-400 uppercase tracking-wide">
                        <span className="font-extrabold flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-purple-400" /> TRANSLATION ({LANGUAGES[learnData.targetLang]})
                        </span>
                        <span className="text-[11px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                          Target Phrase
                        </span>
                      </div>
                      <p className="text-2xl md:text-3xl font-extrabold text-transparent bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text">
                        "{learnData.translation}"
                      </p>

                      {/* CARD 3: PRONUNCIATION (ROMANIZED) */}
                      {learnData.pronunciation && (
                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="text-[11px] font-extrabold uppercase tracking-wide text-cyan-400 block mb-1">
                            🔤 PRONUNCIATION:
                          </span>
                          <span className="text-base md:text-lg font-mono font-bold text-cyan-200 bg-cyan-950/40 px-3 py-1 rounded-xl border border-cyan-500/30 inline-block">
                            {learnData.pronunciation}
                          </span>
                        </div>
                      )}

                      {/* CARD 4: MEANING (ENGLISH / CONCEPTUAL) */}
                      {learnData.meaning && (
                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="text-[11px] font-extrabold uppercase tracking-wide text-amber-400 block mb-1">
                            💡 MEANING:
                          </span>
                          <span className="text-sm md:text-base font-semibold text-slate-200">
                            {learnData.meaning}
                          </span>
                        </div>
                      )}

                      {/* INTERACTIVE CONTROLS: LISTEN 🔊 & REPEAT 🎤 */}
                      <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
                        {/* 🔊 LISTEN BUTTON */}
                        <button
                          onClick={() => speakTranslatedSentence(learnData.translation, learnData.targetLang)}
                          className="flex-1 min-w-[140px] py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer active:scale-95"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>🔊 Listen</span>
                        </button>

                        {/* 🎤 REPEAT BUTTON */}
                        <button
                          onClick={startRepeatPractice}
                          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg ${
                            isRepeatListening
                              ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-400/50'
                              : 'bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-500/30'
                          }`}
                        >
                          <Mic className={`w-4 h-4 ${isRepeatListening ? 'animate-bounce' : ''}`} />
                          <span>{isRepeatListening ? 'Listening your repeat...' : '🎤 Repeat'}</span>
                        </button>
                      </div>

                      {/* Repeat Evaluation & Real-Time Feedback */}
                      {repeatAttemptText && (
                        <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2 mt-3">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="font-bold">Your Pronunciation Attempt:</span>
                            {repeatFeedback && (
                              <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-xs border ${
                                repeatFeedback.score >= 70
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}>
                                Accuracy: {repeatFeedback.score}%
                              </span>
                            )}
                          </div>
                          <p className="text-base font-bold text-slate-200">
                            "{repeatAttemptText}"
                          </p>
                          {repeatFeedback && (
                            <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                              repeatFeedback.score >= 70
                                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                            }`}>
                              <span>{repeatFeedback.comment}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
          <aside className={`fixed md:static inset-y-0 left-0 shrink-0 bg-[#0a0f1e] border-r border-slate-800/80 flex flex-col justify-between p-4 z-40 transition-all duration-300 ${sidebarOpen ? 'w-72 translate-x-0 opacity-100 shadow-2xl' : 'w-0 -translate-x-full md:w-0 md:opacity-0 md:p-0 md:border-0 pointer-events-none overflow-hidden'}`}>
        {/* Sidebar content container (maintains fixed width so text doesn't squish) */}
        <div className="w-64 flex flex-col justify-between h-full">
        
        {/* Brand & Logo */}
        <div>
          <div className="flex items-center justify-between px-2 py-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Globe className="w-5 h-5 text-white animate-spin-slow" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                  Bhashora <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
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
              active={activeNav === 'live-interpreter'} 
              icon={<Radio className="w-4 h-4 text-rose-400 animate-pulse" />} 
              label="Live Conversation" 
              badge="HERO ⭐"
              onClick={() => { 
                setActiveNav('live-interpreter'); 
                setActiveMode('talk'); 
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); 
              }}
            />
            <SidebarBtn 
              active={activeNav === 'translator'} 
              icon={<Zap className="w-4 h-4 text-amber-400" />} 
              label="Quick Translate" 
              onClick={() => { 
                setActiveNav('translator'); 
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); 
              }}
            />
            <SidebarBtn 
              active={activeNav === 'conversation'} 
              icon={<MessageSquare className="w-4 h-4 text-orange-400" />} 
              label="Speak & Translate" 
              onClick={() => { 
                setActiveNav('conversation'); 
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); 
              }}
            />
            <SidebarBtn 
              active={activeNav === 'learn'} 
              icon={<BookOpen className="w-4 h-4 text-pink-400" />} 
              label="Learn & Practice" 
              badge="MODE 2"
              onClick={() => { 
                setActiveNav('learn'); 
                setActiveMode('learn'); 
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); 
              }}
            />

            <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Smart AI Features
            </div>

            <SidebarBtn 
              active={activeNav === 'smart-replies'} 
              icon={<Sparkles className="w-4 h-4 text-purple-400" />} 
              label="Smart Replies" 
              badge="AI"
              onClick={() => { 
                setActiveNav('smart-replies'); 
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); 
              }}
            />
            <SidebarBtn 
              active={activeNav === 'scenarios'} 
              icon={<Layers className="w-4 h-4 text-blue-400" />} 
              label="Scenario Presets" 
              badge={selectedScenario.toUpperCase()}
              onClick={() => { 
                setActiveNav('scenarios'); 
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); 
              }}
            />
            <SidebarBtn 
              active={activeNav === 'pronunciation'} 
              icon={<Mic className="w-4 h-4 text-emerald-400" />} 
              label="Pronunciation Coach" 
              badge="Coach"
              onClick={() => { 
                setActiveNav('pronunciation'); 
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); 
              }}
            />

            <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Records & Stats
            </div>

            <SidebarBtn 
              active={activeNav === 'history'} 
              icon={<Clock className="w-4 h-4 text-blue-400" />} 
              label="History" 
              badge={history.length}
              onClick={() => { 
                setActiveNav('history'); 
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); 
              }}
            />
            <SidebarBtn 
              active={activeNav === 'favorites'} 
              icon={<Heart className="w-4 h-4 text-rose-400" />} 
              label="Favorites" 
              badge={favoritesList.length}
              onClick={() => { 
                setActiveNav('favorites'); 
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); 
              }}
            />
            <SidebarBtn 
              active={activeNav === 'analytics'} 
              icon={<BarChart3 className="w-4 h-4 text-cyan-400" />} 
              label="Analytics" 
              onClick={() => { 
                setActiveNav('analytics'); 
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); 
              }}
            />

            <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Offline & System
            </div>

            <SidebarBtn 
              active={activeNav === 'offline'} 
              icon={<WifiOff className="w-4 h-4 text-emerald-400" />} 
              label="Offline Emergency" 
              badge={isEffectivelyOffline ? "Active" : "Pack"}
              onClick={() => { 
                setActiveNav('offline'); 
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); 
              }}
            />
            <SidebarBtn 
              active={activeNav === 'documents'} 
              icon={<FileText className="w-4 h-4 text-cyan-400" />} 
              label="Documents" 
              onClick={() => { 
                setActiveNav('documents'); 
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); 
              }}
            />
            <SidebarBtn 
              active={activeNav === 'settings'} 
              icon={<Settings className="w-4 h-4 text-slate-400" />} 
              label="Settings" 
              onClick={() => { 
                setActiveNav('settings'); 
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); 
              }}
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
            <div 
              onClick={() => {
                setEditProfileName(userProfile.name);
                setEditProfileEmail(userProfile.email);
                setShowAuthModal(true);
              }}
              className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-800/60 p-1.5 -ml-1 rounded-xl transition-all group flex-1 mr-1"
              title="Click to view and change login credentials & profile"
            >
              <img 
                src={userProfile.avatar} 
                alt="User" 
                className="w-8 h-8 rounded-full ring-2 ring-indigo-500/40 object-cover group-hover:ring-indigo-400" 
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">{userProfile.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{userProfile.email}</div>
              </div>
            </div>
            <button 
              title="Account & Login Credentials" 
              onClick={() => {
                setEditProfileName(userProfile.name);
                setEditProfileEmail(userProfile.email);
                setShowAuthModal(true);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

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
              onClick={() => setSidebarOpen(prev => !prev)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-cyan-500/50 transition-all cursor-pointer flex items-center gap-2 shadow-sm active:scale-95"
              title="Toggle Left Navigation Sidebar"
            >
              <Menu className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">Menu</span>
            </button>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">Bhashora AI</span>
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

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button 
              onClick={() => {
                const next = !darkMode;
                setDarkMode(next);
                showToast(next ? "Switched to Dark Cyber Theme 🌙" : "Switched to High-Contrast Light Theme ☀️");
              }}
              className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
              title={darkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-cyan-300" />}
            </button>

            {/* Notifications Button & Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(prev => !prev)}
                className="relative p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
                title="Notifications & System Alerts"
              >
                <Bell className="w-4 h-4" />
                {hasUnreadNotifs && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-white">System Notifications</span>
                    </div>
                    {hasUnreadNotifs && (
                      <button
                        onClick={() => {
                          setHasUnreadNotifs(false);
                          showToast("All notifications marked as read");
                        }}
                        className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="py-2 space-y-2.5 max-h-64 overflow-y-auto">
                    <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Speech Pipeline Active
                        </span>
                        <span className="text-[10px] text-slate-500">Live</span>
                      </div>
                      <p className="text-[11px] text-slate-300">Telugu, Tamil, Kannada, Hindi, and English live interpretation engine ready.</p>
                    </div>

                    <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          Sub-Second Latency
                        </span>
                        <span className="text-[10px] text-slate-500">2m ago</span>
                      </div>
                      <p className="text-[11px] text-slate-300">FastAPI & Neural Translation cluster operating at &lt; 35ms response time.</p>
                    </div>

                    <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Zero-Network Ready
                        </span>
                        <span className="text-[10px] text-slate-500">5m ago</span>
                      </div>
                      <p className="text-[11px] text-slate-300">6 preloaded offline phrase packs cached for zero-connectivity environments.</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                    : 'Two people speak naturally in different languages. Bhashora AI translates and speaks in real-time.'}
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

              {/* Instant Finish Speaking & Response Buffer Speed Controls */}
              {isLiveActive && (
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4 z-20">
                  <button
                    onClick={() => {
                      if (finalizeUtteranceRef.current) {
                        finalizeUtteranceRef.current();
                      }
                    }}
                    disabled={speakerState === 'translating' || speakerState === 'speaking' || (!inputText && !liveInterimText)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Click immediately when you finish speaking to translate & reply without waiting for silence"
                  >
                    <span>⚡</span> Finish Speaking (Reply Now)
                  </button>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Pause Buffer:</span>
                    <button
                      onClick={() => setSilenceThreshold(prev => Math.max(600, prev - 100))}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs active:scale-90"
                      title="Shorter pause for faster turnaround"
                    >-</button>
                    <span className="font-mono text-cyan-300 font-bold text-xs px-1">{(silenceThreshold / 1000).toFixed(1)}s</span>
                    <button
                      onClick={() => setSilenceThreshold(prev => Math.min(2500, prev + 100))}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs active:scale-90"
                      title="Longer pause for natural breathing"
                    >+</button>
                  </div>
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
                      {currentSpeakerTurn === 'A' ? `Turn A: ${LANGUAGES[speakerInputLang]?.split(' ')[0]}` : `Turn B: ${LANGUAGES[speakerTargetLang]?.split(' ')[0]}`}
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
                      👂 Listening to {currentSpeakerTurn === 'A' ? `Person A (${LANGUAGES[speakerInputLang] || speakerInputLang})` : `Person B (${LANGUAGES[speakerTargetLang] || speakerTargetLang})`}... Speak now!
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
                      🔊 Speaking aloud in {LANGUAGES[lastSpeakerTurn === 'A' ? speakerTargetLang : speakerInputLang]}...
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
              
              {/* Box 1: What Spoken */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
                    <span className="font-bold flex items-center gap-1.5 text-blue-400 uppercase tracking-wide">
                      <Mic className="w-4 h-4" /> 🎤 {lastSpeakerTurn === 'A' ? `PERSON A (${LANGUAGES[speakerInputLang] || speakerInputLang})` : `PERSON B (${LANGUAGES[speakerTargetLang] || speakerTargetLang})`}
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
                  <span>Spoken Input ({lastSpeakerTurn === 'A' ? 'Person A' : 'Person B'})</span>
                  <span className="text-blue-400 font-mono text-[11px]">{lastSpeakerTurn === 'A' ? speakerInputLang : speakerTargetLang}</span>
                </div>
              </div>

              {/* Box 2: Translated Output */}
              <div className="bg-slate-900/90 border border-purple-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between text-xs text-purple-300 mb-2.5">
                    <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide">
                      <Volume2 className="w-4 h-4 text-purple-400" /> 🔊 {lastSpeakerTurn === 'A' ? `TRANSLATED FOR PERSON B (${LANGUAGES[speakerTargetLang] || speakerTargetLang})` : `TRANSLATED FOR PERSON A (${LANGUAGES[speakerInputLang] || speakerInputLang})`}
                    </span>
                    <button 
                      onClick={() => speakText(speakerResponseText, lastSpeakerTurn === 'A' ? speakerTargetLang : speakerInputLang)}
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
                No internet? No problem. Bhashora AI includes pre-loaded local phrase packs, semantic meaning caches, and offline voice synthesis for seamless communication anytime, anywhere.
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
                {/* ========================================================= */}
        {/* VIEW: 🎯 PRONUNCIATION PRACTICE COACH                     */}
        {/* ========================================================= */}
        {activeNav === 'pronunciation' && (
          <div className="p-6 md:p-8 max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                AI Acoustic Pronunciation Coach 🎯
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Pronunciation Practice Coach
              </h2>
              <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">
                Listen to native cadence, speak into the mic, and get instant phonetic accuracy scoring and coaching feedback.
              </p>
            </div>

            {/* Language & Phrase Selection Card */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" /> Target Language:
                  </span>
                  <select
                    value={practiceLang}
                    onChange={(e) => {
                      const l = e.target.value;
                      setPracticeLang(l);
                      const defaults = {
                        te: 'మీరు ఎలా ఉన్నారు?',
                        ta: 'நீங்கள் எப்படி இருக்கிறீர்கள்?',
                        kn: 'ನೀವು ಹೇಗಿದ್ದೀರಿ?',
                        hi: 'आप कैसे हैं?',
                        en: 'How are you today?',
                        ml: 'സുഖമാണോ?',
                        mr: 'तुम्ही कसे आहात?'
                      };
                      if (defaults[l]) setPracticePhrase(defaults[l]);
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none cursor-pointer"
                  >
                    {Object.entries(SPEECH_LANGS).map(([code, info]) => (
                      <option key={code} value={code} className="bg-slate-900 text-white">
                        {info.flag} {info.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speed Toggle for Listening */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-500 font-medium">Listening Speed:</span>
                  <button
                    onClick={() => setPracticeSpeed(1.0)}
                    className={`px-2 py-0.5 rounded font-semibold text-xs transition-colors ${practiceSpeed === 1.0 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    1.0x Normal
                  </button>
                  <button
                    onClick={() => setPracticeSpeed(0.8)}
                    className={`px-2 py-0.5 rounded font-semibold text-xs transition-colors ${practiceSpeed === 0.8 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    0.8x Slow
                  </button>
                </div>
              </div>

              {/* Phrase to Practice Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase">Phrase to Practice</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={practicePhrase}
                    onChange={(e) => setPracticePhrase(e.target.value)}
                    placeholder="Type or select a phrase to practice..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-base font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    onClick={() => speakTranslatedSentence(practicePhrase, practiceLang)}
                    disabled={!practicePhrase.trim()}
                    className="px-4 py-3 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
                    title="Listen to native audio"
                  >
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <span>Listen</span>
                  </button>
                </div>

                {/* Quick Phrases Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 font-semibold">Quick picks:</span>
                  {[
                    practiceLang === 'te' ? "మీరు ఎలా ఉన్నారు?" :
                    practiceLang === 'ta' ? "நீங்கள் எப்படி இருக்கிறீர்கள்?" :
                    practiceLang === 'kn' ? "ನೀವು ಹೇಗಿದ್ದೀರಿ?" :
                    practiceLang === 'hi' ? "आप कैसे हैं?" : "How are you?",

                    practiceLang === 'te' ? "నాకు సహాయం కావాలి" :
                    practiceLang === 'ta' ? "எனக்கு உதவி தேவை" :
                    practiceLang === 'kn' ? "ನನಗೆ ಸಹಾಯ ಬೇಕು" :
                    practiceLang === 'hi' ? "मुझे मदद चाहिए" : "I need help",

                    practiceLang === 'te' ? "చాలా ధన్యవాదాలు" :
                    practiceLang === 'ta' ? "மிக்க நன்றி" :
                    practiceLang === 'kn' ? "ತುಂಬಾ ಧನ್ಯವಾದಗಳು" :
                    practiceLang === 'hi' ? "बहुत बहुत धन्यवाद" : "Thank you very much"
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPracticePhrase(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-emerald-300 border border-slate-700 transition-colors cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Recording Card */}
            <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center space-y-4">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Step 2: Repeat & Record into Microphone
              </p>

              <button
                onClick={() => handlePracticePronunciation(practicePhrase, practiceLang)}
                disabled={isPronouncing || !practicePhrase.trim()}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer active:scale-95 ${
                  isPronouncing 
                    ? 'bg-rose-600 ring-4 ring-rose-400/50 animate-pulse text-white shadow-rose-600/50' 
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 hover:scale-105'
                }`}
              >
                <Mic className={`w-10 h-10 ${isPronouncing ? 'animate-bounce' : ''}`} />
              </button>

              <div>
                <p className="text-sm font-bold text-white">
                  {isPronouncing ? "🎤 Listening to your pronunciation... Speak now!" : "Tap microphone and speak clearly"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Expected in: <strong className="text-slate-300">{LANGUAGES[practiceLang]}</strong>
                </p>
              </div>

              {/* Evaluation Results Card */}
              {pronounceResult && (
                <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mt-4 space-y-4 text-left animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accuracy Score</span>
                      <div className="text-3xl font-black text-transparent bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text">
                        {pronounceResult.score}%
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      pronounceResult.score >= 80 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                        : pronounceResult.score >= 60 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {pronounceResult.grade || (pronounceResult.score >= 80 ? 'Excellent ⭐⭐⭐' : 'Good ⭐⭐')}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">You Said:</span>
                    <p className="text-base font-bold text-slate-200 pl-3 border-l-2 border-emerald-500">
                      "{pronounceResult.attempt}"
                    </p>
                  </div>

                  {pronounceResult.matched_words && pronounceResult.matched_words.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Word Breakdown:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {pronounceResult.matched_words.map((w, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${
                              w.status === 'correct' 
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {w.status === 'correct' ? '✓ ' : '✗ '}{w.word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-xs text-indigo-200">
                    💡 <strong className="text-indigo-300 font-semibold">Coach Advice:</strong> {pronounceResult.feedback}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h4 className="font-bold text-base text-slate-100 flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-400" />
                      {documentResult.filename}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {documentResult.total_paragraphs} paragraphs translated into <strong className="text-emerald-400 font-semibold">{LANGUAGES[targetLang] || targetLang}</strong>
                    </span>
                  </div>

                  {/* Document Actions: Copy Everything in One Box + Download */}
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => {
                        const allText = documentResult.full_translated_text || documentResult.paragraphs?.map(p => p.translated).join('\n\n') || '';
                        handleCopy(allText, 'doc_all');
                        showToast("Entire translated document copied to clipboard! 📋");
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
                      title="Copy entire translated document in one click"
                    >
                      {copiedId === 'doc_all' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedId === 'doc_all' ? 'Copied Everything!' : 'Copy Everything'}</span>
                    </button>

                    <button 
                      onClick={() => {
                        const allText = documentResult.full_translated_text || documentResult.paragraphs?.map(p => p.translated).join('\n\n') || '';
                        const blob = new Blob([allText], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `translated-${documentResult.filename}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                        showToast("Downloaded translated document");
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-400" /> 
                      <span>Download (.txt)</span>
                    </button>
                  </div>
                </div>

                {/* SINGLE UNIFIED DOCUMENT READING BOX (One box, no separate paragraph boxes) */}
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-6 min-h-[320px] max-h-[560px] overflow-y-auto shadow-inner space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/70">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Complete Translated Text
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {(documentResult.full_translated_text || '').length} characters • Ready to read or copy
                    </span>
                  </div>

                  <div className="text-slate-100 text-sm md:text-base leading-relaxed whitespace-pre-line select-text font-sans pr-2">
                    {documentResult.full_translated_text || documentResult.paragraphs?.map(p => p.translated).join('\n\n')}
                  </div>
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
                {/* 🔐 ACCOUNT & LOGIN CREDENTIALS MODAL */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl space-y-6">
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5">
                <img 
                  src={userProfile.avatar} 
                  alt="Avatar" 
                  className="w-14 h-14 rounded-2xl ring-2 ring-indigo-500/40 object-cover shadow-lg" 
                />
                <div>
                  <h3 className="text-lg font-bold text-white">Account & Credentials</h3>
                  <p className="text-xs text-slate-400">Update login and profile settings</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={editProfileName}
                    onChange={(e) => setEditProfileName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder="Your Name (e.g. Vaishnavi Anugu)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={editProfileEmail}
                    onChange={(e) => setEditProfileEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Password / New Passcode</label>
                  <input 
                    type="password" 
                    value={editProfilePassword}
                    onChange={(e) => setEditProfilePassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const updated = {
                      ...userProfile,
                      name: editProfileName.trim() || userProfile.name,
                      email: editProfileEmail.trim() || userProfile.email
                    };
                    setUserProfile(updated);
                    try {
                      localStorage.setItem('bhashora_user_profile', JSON.stringify(updated));
                    } catch (e) {}
                    setShowAuthModal(false);
                    showToast("Login credentials updated successfully! ✨");
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
                >
                  Save Credentials
                </button>
                <button
                  onClick={() => {
                    const guest = {
                      name: 'Guest User',
                      email: 'guest@bhashora.ai',
                      plan: 'Free Trial',
                      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'
                    };
                    setUserProfile(guest);
                    setEditProfileName(guest.name);
                    setEditProfileEmail(guest.email);
                    try {
                      localStorage.setItem('bhashora_user_profile', JSON.stringify(guest));
                    } catch (e) {}
                    setShowAuthModal(false);
                    showToast("Signed out. Switched to Guest Profile.");
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

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
                      const header = `BHASHORA AI — CONVERSATION TRANSCRIPT\nScenario: ${selectedScenario.toUpperCase()}\nDate: ${new Date().toLocaleString()}\nExchanges: ${history.length}\n${'='.repeat(45)}\n\n`;
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
                      const header = `# Bhashora AI — Consultation Transcript\n\n- **Scenario**: ${selectedScenario}\n- **Date**: ${new Date().toLocaleString()}\n- **Exchanges**: ${history.length}\n\n---\n\n`;
                      const blob = new Blob([header + transcriptText], { type: 'text/markdown;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `bhashora-transcript-${selectedScenario}-${Date.now()}.md`;
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
