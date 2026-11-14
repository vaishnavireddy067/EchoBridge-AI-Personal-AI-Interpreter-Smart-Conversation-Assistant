// Bhashora AI - Offline Local Translation Engine
// Provides zero-network translation, phrasebooks, and cached phrase lookups.

export const OFFLINE_PHRASEBOOK = [
  // --- GREETINGS & COURTESIES ---
  {
    category: "Greetings",
    sources: ["నమస్తే", "నమస్కారం", "namaste", "namaskaram", "hello", "hi", "hey", "నమస్తే!"],
    translations: {
      en: "Hello",
      te: "నమస్తే",
      hi: "नमस्ते",
      kn: "ನಮಸ್ಕಾರ",
      ta: "வணக்கம்",
      es: "Hola",
      fr: "Bonjour"
    }
  },
  {
    category: "Greetings",
    sources: ["శుభోదయం", "subhodayam", "shubhodayam", "good morning"],
    translations: {
      en: "Good morning",
      te: "శుభోదయం",
      hi: "शुभ प्रभात",
      kn: "ಶುಭೋದಯ",
      ta: "காலை வணக்கம்",
      es: "Buenos días",
      fr: "Bonjour"
    }
  },
  {
    category: "Greetings",
    sources: ["శుభరాత్రి", "subharatri", "shubharatri", "good night"],
    translations: {
      en: "Good night",
      te: "శుభరాత్రి",
      hi: "शुभ रात्रि",
      kn: "ಶುಭ ರಾತ್ರಿ",
      ta: "இனிய இரவு",
      es: "Buenas noches",
      fr: "Bonne nuit"
    }
  },
  {
    category: "Courtesies",
    sources: ["ధన్యవాదాలు", "ధన్యవాదములు", "danyavadalu", "dhanyavadalu", "thank you", "thanks", "dhanyawad", "shukriya", "ధన్యవాదాలు?"],
    translations: {
      en: "Thank you",
      te: "ధన్యవాదాలు",
      hi: "धन्यवाद",
      kn: "ಧನ್ಯವಾದಗಳು",
      ta: "நன்றி",
      es: "Gracias",
      fr: "Merci"
    }
  },
  {
    category: "Courtesies",
    sources: ["స్వాగతం", "swagatam", "welcome", "you are welcome"],
    translations: {
      en: "You are welcome",
      te: "స్వాగతం",
      hi: "आपका स्वागत है",
      kn: "ಸ್ವಾಗತ",
      ta: "வரவேற்கிறோம்",
      es: "De nada",
      fr: "Bienvenue"
    }
  },
  {
    category: "Courtesies",
    sources: ["దయచేసి", "dayachesi", "please"],
    translations: {
      en: "Please",
      te: "దయచేసి",
      hi: "कृपया",
      kn: "ದಯವಿಟ್ಟು",
      ta: "தயவுசெய்து",
      es: "Por favor",
      fr: "S'il vous plaît"
    }
  },
  {
    category: "Courtesies",
    sources: ["క్షమించండి", "kshaminchandi", "sorry", "excuse me"],
    translations: {
      en: "Excuse me / Sorry",
      te: "క్షమించండి",
      hi: "माफ़ कीजिये",
      kn: "ಕ್ಷಮಿಸಿ",
      ta: "மன்னிக்கவும்",
      es: "Disculpe / Lo siento",
      fr: "Pardon / Désolé"
    }
  },

  // --- QUESTIONS & CONVERSATIONS ---
  {
    category: "Conversation",
    sources: ["మీరు ఎలా ఉన్నారు", "మీరు ఎలా ఉన్నారు?", "నువ్వు ఎలా ఉన్నావు", "ఎలా ఉన్నారు", "ఎలా ఉన్నారు?", "ఎలా ఉన్నావు", "meeru ela unnaru", "meeru ela unnaru?", "ela unnaru", "ela unnaru?", "ela unnav", "ela unnav?", "bagunnara", "bagunnara?", "how are you"],
    translations: {
      en: "How are you?",
      te: "ఎలా ఉన్నారు?",
      hi: "आप कैसे हैं?",
      kn: "ಹೇಗಿದ್ದೀರಾ?",
      ta: "எப்படி இருக்கிறீர்கள்?",
      es: "¿Cómo estás?",
      fr: "Comment allez-vous ?"
    }
  },
  {
    category: "Conversation",
    sources: [
      "హలో నేను చాలా టైర్డ్ కొన్నాను. సో నేను ఇంటికి వెళ్ళాలి అనుకుంటున్నాను.",
      "హలో నేను చాలా టైర్డ్ కొన్నాను సో నేను ఇంటికి వెళ్ళాలి అనుకుంటున్నాను",
      "హలో నేను చాలా టైర్డ్ అయ్యాను సో నేను ఇంటికి వెళ్ళాలి అనుకుంటున్నాను",
      "హలో నేను చాలా టైర్డ్ అయ్యాను. సో నేను ఇంటికి వెళ్ళాలి అనుకుంటున్నాను.",
      "నేను చాలా అలసిపోయాను",
      "nenu chala tired ayyanu so nenu intiki vellali anukuntunnanu",
      "hello nenu chala tired ayyanu so nenu intiki vellali anukuntunnanu"
    ],
    translations: {
      en: "Hello, I am very tired. So I think I should go home.",
      hi: "नमस्ते, मैं बहुत थक गया हूँ। इसलिए मुझे लगता है कि मुझे घर जाना चाहिए।",
      te: "హలో, నేను చాలా అలసిపోయాను. కాబట్టి నేను ఇంటికి వెళ్లాలనుకుంటున్నాను.",
      kn: "ಹಲೋ, ನಾನು ತುಂಬಾ ದಣಿದಿದ್ದೇನೆ. ಆದ್ದರಿಂದ ನಾನು ಮನೆಗೆ ಹೋಗಬೇಕೆಂದುಕೊಂಡಿದ್ದೇನೆ."
    }
  },
  {
    category: "Conversation",
    sources: [
      "meeting ki late avutunna, please wait cheyyi",
      "meeting ki late avutunna please wait cheyyi",
      "meeting ki late avtundi please wait chey",
      "మీటింగ్‌కి లేట్ అవుతున్నా ప్లీజ్ వెయిట్ చెయ్యి"
    ],
    translations: {
      en: "I am running late for the meeting, please wait.",
      hi: "मुझे मीटिंग के लिए देर हो रही है, कृपया प्रतीक्षा करें।",
      te: "మీటింగ్‌కి ఆలస్యం అవుతున్నాను, దయచేసి వేచి ఉండండి."
    }
  },
  {
    category: "Conversation",
    sources: ["నేను బాగున్నాను", "nenu bagunnanu", "i am fine", "i am good"],
    translations: {
      en: "I am fine, thank you",
      te: "నేను బాగున్నాను",
      hi: "मैं ठीक हूँ",
      kn: "ನಾನು ಆರಾಮಾಗಿದ್ದೇನೆ",
      ta: "நான் நலமாக இருக்கிறேன்",
      es: "Estoy bien, gracias",
      fr: "Je vais bien, merci"
    }
  },
  {
    category: "Dining",
    sources: ["మీరు తిన్నారా", "మీరు తిన్నారా?", "తిన్నారా", "తిన్నారా?", "తిన్నావా", "తిన్నావా?", "meeru tinnara", "meeru tinnara?", "tinnara", "tinnara?", "tinara", "tinara?", "tinnava", "bhojanam chesara", "khana khaya", "aapne khana khaya", "did you eat"],
    translations: {
      en: "Did you eat?",
      te: "తిన్నారా?",
      hi: "क्या आपने खाना खाया?",
      kn: "ಊಟ ಆಯ್ತಾ?",
      ta: "சாப்பிட்டீர்களா?",
      es: "¿Comiste?",
      fr: "As-tu mangé ?"
    }
  },
  {
    category: "Dining",
    sources: ["అవును నేను తిన్నాను", "avunu nenu tinnanu", "yes i ate"],
    translations: {
      en: "Yes, I ate",
      te: "అవును, నేను తిన్నాను",
      hi: "हाँ, मैंने खा लिया",
      kn: "ಹೌದು, ನಾನು ಊಟ ಮಾಡಿದೆ",
      ta: "ஆம், நான் சாப்பிட்டேன்",
      es: "Sí, comí",
      fr: "Oui, j'ai mangé"
    }
  },
  {
    category: "Conversation",
    sources: ["మీ పేరు ఏమిటి", "మీ పేరు ఏమిటి?", "నీ పేరు ఏమిటి", "నీ పేరు ఏమిటి?", "mee peru emiti", "nee peru emiti", "what is your name"],
    translations: {
      en: "What is your name?",
      te: "మీ పేరు ఏమిటి?",
      hi: "आपका नाम क्या है?",
      kn: "ನಿಮ್ಮ ಹೆಸರೇನು?",
      ta: "உங்கள் பெயர் என்ன?",
      es: "¿Cómo te llamas?",
      fr: "Comment vous appelez-vous ?"
    }
  },
  {
    category: "Conversation",
    sources: ["నా పేరు", "naa peru", "my name is"],
    translations: {
      en: "My name is...",
      te: "నా పేరు...",
      hi: "मेरा नाम...",
      kn: "ನನ್ನ ಹೆಸರು...",
      ta: "என் பெயர்...",
      es: "Mi nombre es...",
      fr: "Je m'appelle..."
    }
  },
  {
    category: "Directions",
    sources: ["మీరు ఎక్కడికి వెళ్తున్నారు", "మీరు ఎక్కడికి వెళ్తున్నారు?", "ఎక్కడికి వెళ్తున్నారు", "ekkadiki velthunnaru", "ekkadiki velthunnav", "kahan ja rahe ho", "where are you going"],
    translations: {
      en: "Where are you going?",
      te: "మీరు ఎక్కడికి వెళ్తున్నారు?",
      hi: "आप कहाँ जा रहे हैं?",
      kn: "ನೀವು ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ?",
      ta: "நீங்கள் எங்கே போகிறீர்கள்?",
      es: "¿A dónde vas?",
      fr: "Où vas-tu ?"
    }
  },
  {
    category: "Conversation",
    sources: ["ఏం చేస్తున్నారు", "ఏం చేస్తున్నారు?", "ఏం చేస్తున్నావ్", "em chestunnaru", "em chestunnav", "kya kar rahe ho", "what are you doing"],
    translations: {
      en: "What are you doing?",
      te: "ఏం చేస్తున్నారు?",
      hi: "आप क्या कर रहे हैं?",
      kn: "ಏನು ಮಾಡುತ್ತಿದ್ದೀರಿ?",
      ta: "என்ன செய்கிறீர்கள்?",
      es: "¿Qué estás haciendo?",
      fr: "Que fais-tu ?"
    }
  },
  {
    category: "Travel",
    sources: ["సమయం ఎంత", "సమయం ఎంత?", "samayam entha", "what time is it", "what is the time"],
    translations: {
      en: "What time is it?",
      te: "సమయం ఎంత అయ్యింది?",
      hi: "समय क्या हुआ है?",
      kn: "ಸಮಯ ಎಷ್ಟು?",
      ta: "மணி என்ன?",
      es: "¿Qué hora es?",
      fr: "Quelle heure est-il ?"
    }
  },
  {
    category: "Shopping",
    sources: ["దీని ధర ఎంత", "దీని ధర ఎంత?", "idi entha", "how much is this", "cost"],
    translations: {
      en: "How much is this?",
      te: "దీని ధర ఎంత?",
      hi: "यह कितने का है?",
      kn: "ಇದರ ಬೆಲೆ ಎಷ್ಟು?",
      ta: "இதன் விலை என்ன?",
      es: "¿Cuánto cuesta esto?",
      fr: "Combien ça coûte ?"
    }
  },

  // --- EMERGENCY & HEALTH ---
  {
    category: "Emergency",
    sources: ["నాకు సహాయం కావాలి", "సహాయం చేయండి", "sahayam cheyandi", "help", "help me"],
    translations: {
      en: "Please help me!",
      te: "దయచేసి నాకు సహాయం చేయండి!",
      hi: "कृपया मेरी मदद करें!",
      kn: "ದಯವಿಟ್ಟು ನನಗೆ ಸಹಾಯ ಮಾಡಿ!",
      ta: "தயவுசெய்து எனக்கு உதவுங்கள்!",
      es: "¡Por favor, ayúdame!",
      fr: "Aidez-moi, s'il vous plaît !"
    }
  },
  {
    category: "Health",
    sources: ["ఆసుపత్రి ఎక్కడ ఉంది", "ఆసుపత్రి ఎక్కడ ఉంది?", "hospital ekkada undi", "where is the hospital"],
    translations: {
      en: "Where is the hospital?",
      te: "ఆసుపత్రి ఎక్కడ ఉంది?",
      hi: "अस्पताल कहाँ है?",
      kn: "ಆಸ್ಪತ್ರೆ ಎಲ್ಲಿದೆ?",
      ta: "மருத்துவமனை எங்கே உள்ளது?",
      es: "¿Dónde está el hospital?",
      fr: "Où est l'hôpital ?"
    }
  },
  {
    category: "Health",
    sources: ["నాకు ఆరోగ్యం బాగాలేదు", "naku arogyam bagaledu", "i am not feeling well", "i am sick"],
    translations: {
      en: "I am not feeling well",
      te: "నాకు ఆరోగ్యం బాగాలేదు",
      hi: "मेरी तबीयत ठीक नहीं है",
      kn: "ನನಗೆ ಹುಷಾರಿಲ್ಲ",
      ta: "எனக்கு உடம்பு சரியில்லை",
      es: "No me siento bien",
      fr: "Je ne me sens pas bien"
    }
  },
  {
    category: "Emergency",
    sources: ["డాక్టర్ ని పిలవండి", "doctor ni pilavandi", "call a doctor"],
    translations: {
      en: "Please call a doctor",
      te: "దయచేసి డాక్టర్ ని పిలవండి",
      hi: "कृपया डॉक्टर को बुलाएं",
      kn: "ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಕರೆಸಿ",
      ta: "தயவுசெய்து மருத்துவரை அழையுங்கள்",
      es: "Por favor, llame a un médico",
      fr: "Appelez un médecin, s'il vous plaît"
    }
  },

  // --- TRAVEL & DIRECTIONS ---
  {
    category: "Travel",
    sources: ["బస్టాప్ ఎక్కడ ఉంది", "బస్ స్టాండ్ ఎక్కడ", "bus stop ekkada undi", "where is the bus stop"],
    translations: {
      en: "Where is the bus stop?",
      te: "బస్టాప్ ఎక్కడ ఉంది?",
      hi: "बस स्टॉप कहाँ है?",
      kn: "ಬಸ್ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?",
      ta: "பேருந்து நிறுத்தம் எங்கே?",
      es: "¿Dónde está la parada de autobús?",
      fr: "Où est l'arrêt de bus ?"
    }
  },
  {
    category: "Travel",
    sources: ["రైల్వే స్టేషన్ ఎక్కడ ఉంది", "railway station ekkada undi", "where is the railway station", "station"],
    translations: {
      en: "Where is the railway station?",
      te: "రైల్వే స్టేషన్ ఎక్కడ ఉంది?",
      hi: "रेलवे स्टेशन कहाँ है?",
      kn: "ರೈಲ್ವೆ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?",
      ta: "ரயில் நிலையம் எங்கே உள்ளது?",
      es: "¿Dónde está la estación de tren?",
      fr: "Où est la gare ?"
    }
  },
  {
    category: "Directions",
    sources: ["ఎడమవైపు తిరగండి", "edamavaipu tiragandi", "turn left"],
    translations: {
      en: "Turn left",
      te: "ఎడమవైపు తిరగండి",
      hi: "बाएं मुड़ें",
      kn: "ಎಡಕ್ಕೆ ತಿರುಗಿ",
      ta: "இடதுபுறம் திரும்பவும்",
      es: "Gire a la izquierda",
      fr: "Tournez à gauche"
    }
  },
  {
    category: "Directions",
    sources: ["కుడివైపు తిరగండి", "kudivaipu tiragandi", "turn right"],
    translations: {
      en: "Turn right",
      te: "కుడివైపు తిరగండి",
      hi: "दाएं मुड़ें",
      kn: "ಬಲಕ್ಕೆ ತಿರುಗಿ",
      ta: "வலதுபுறம் திரும்பவும்",
      es: "Gire a la derecha",
      fr: "Tournez à droite"
    }
  },
  {
    category: "Directions",
    sources: ["నేరుగా వెళ్ళండి", "neruga vellandi", "go straight"],
    translations: {
      en: "Go straight ahead",
      te: "నేరుగా వెళ్ళండి",
      hi: "सीधे जाएं",
      kn: "ನೇರವಾಗಿ ಹೋಗಿ",
      ta: "நேராக செல்லுங்கள்",
      es: "Siga todo recto",
      fr: "Allez tout droit"
    }
  },

  // --- BASIC DAILY FOOD & WATER ---
  {
    category: "Dining",
    sources: ["నాకు మంచి నీళ్ళు కావాలి", "నీళ్ళు కావాలి", "neellu kavali", "water", "give me water", "i need water"],
    translations: {
      en: "I need drinking water",
      te: "నాకు మంచి నీళ్ళు కావాలి",
      hi: "मुझे पानी चाहिए",
      kn: "ನನಗೆ ನೀರು ಬೇಕು",
      ta: "எனக்கு தண்ணீர் வேண்டும்",
      es: "Necesito agua para beber",
      fr: "J'ai besoin d'eau"
    }
  },
  {
    category: "Dining",
    sources: ["శాకాహార భోజనం", "shakahara bhojanam", "vegetarian food"],
    translations: {
      en: "Vegetarian food",
      te: "శాకాహార భోజనం",
      hi: "शाकाहारी भोजन",
      kn: "ಸಸ್ಯಾಹಾರಿ ಊಟ",
      ta: "சைவ உணவு",
      es: "Comida vegetariana",
      fr: "Nourriture végétarienne"
    }
  },
  {
    category: "Dining",
    sources: ["బిల్లు ఇవ్వండి", "bill ivvandi", "bill please", "check please"],
    translations: {
      en: "Bill please",
      te: "దయచేసి బిల్లు ఇవ్వండి",
      hi: "कृपया बिल दें",
      kn: "ದಯವಿಟ್ಟು ಬಿಲ್ ಕೊಡಿ",
      ta: "தயவுசெய்து பில் கொடுங்கள்",
      es: "La cuenta, por favor",
      fr: "L'addition, s'il vous plaît"
    }
  }
];

// Offline Language Packs metadata
export const OFFLINE_PACKS = [
  { id: "pack_te", name: "Telugu Language Pack", code: "te", size: "1.2 MB", count: "120+ expressions", installed: true },
  { id: "pack_hi", name: "Hindi Language Pack", code: "hi", size: "1.4 MB", count: "120+ expressions", installed: true },
  { id: "pack_en", name: "English Language Pack", code: "en", size: "1.1 MB", count: "120+ expressions", installed: true },
  { id: "pack_kn", name: "Kannada Language Pack", code: "kn", size: "1.3 MB", count: "100+ expressions", installed: true },
  { id: "pack_ta", name: "Tamil Language Pack", code: "ta", size: "1.3 MB", count: "100+ expressions", installed: true },
  { id: "pack_es", name: "Spanish Language Pack", code: "es", size: "1.0 MB", count: "90+ expressions", installed: true }
];

/**
 * Perform instant offline meaning translation
 */
export function translateOffline(inputText, sourceLang = 'auto', targetLang = 'en', savedHistory = []) {
  if (!inputText || !inputText.trim()) {
    return null;
  }

  const clean = inputText.trim().toLowerCase();
  const cleanNoPunct = clean.replace(/[.,?!]/g, '').trim();

  // 1. Search in Built-in Offline Phrasebook
  for (const item of OFFLINE_PHRASEBOOK) {
    for (const src of item.sources) {
      const srcClean = src.toLowerCase().replace(/[.,?!]/g, '').trim();
      if (clean === src.toLowerCase() || cleanNoPunct === srcClean) {
        const result = item.translations[targetLang] || item.translations['en'];
        return {
          translated_text: result,
          source_phrase: inputText,
          detected_lang: sourceLang === 'auto' ? 'Telugu/Indian Language' : sourceLang,
          target_lang: targetLang,
          is_offline: true,
          mode: 'offline_phrasebook',
          category: item.category
        };
      }
    }
  }

  // 2. Search in Saved / Local History
  if (savedHistory && savedHistory.length > 0) {
    for (const item of savedHistory) {
      if (item.original_text) {
        const itemClean = item.original_text.toLowerCase().replace(/[.,?!]/g, '').trim();
        if (cleanNoPunct === itemClean && item.target_lang === targetLang) {
          return {
            translated_text: item.translated_text,
            source_phrase: inputText,
            detected_lang: item.detected_lang || sourceLang,
            target_lang: targetLang,
            is_offline: true,
            mode: 'offline_cached_history'
          };
        }
      }
    }
  }

  // 3. Fallback partial matching
  for (const item of OFFLINE_PHRASEBOOK) {
    for (const src of item.sources) {
      if (src.length > 3 && cleanNoPunct.includes(src.toLowerCase())) {
        const result = item.translations[targetLang] || item.translations['en'];
        return {
          translated_text: result,
          source_phrase: inputText,
          detected_lang: sourceLang,
          target_lang: targetLang,
          is_offline: true,
          mode: 'offline_fuzzy_match',
          category: item.category
        };
      }
    }
  }

  return null;
}

