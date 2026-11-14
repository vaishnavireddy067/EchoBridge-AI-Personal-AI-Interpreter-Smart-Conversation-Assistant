from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse
import re

GOOGLE_SPEECH_KEY = "AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw"

def score_text_for_lang(text: str, target_lang: str) -> float:
    if not text or not text.strip():
        return 0.0
    clean = text.strip()
    words = re.findall(r'\b\w+\b', clean)
    n_words = len(words)
    score = float(n_words * 2.0)

    has_telugu = bool(re.search(r'[\u0C00-\u0C7F]', clean))
    has_devanagari = bool(re.search(r'[\u0900-\u097F]', clean))
    has_tamil = bool(re.search(r'[\u0B80-\u0BFF]', clean))
    has_kannada = bool(re.search(r'[\u0C80-\u0CFF]', clean))
    has_latin = bool(re.search(r'[A-Za-z]', clean))

    if target_lang == 'en':
        if has_latin:
            score += 15.0
        if has_telugu or has_devanagari or has_tamil or has_kannada:
            score -= 30.0
    elif target_lang == 'te':
        if has_telugu:
            score += 25.0
            phonetic_loanwords = ['మై', 'నేమ్', 'ఇస్', 'ఈజ్', 'ఐ', 'లీవ్', 'లివ్', 'ఇన్', 'హైదరాబాద్', 'వాంట్', 'గో', 'హోమ్']
            loan_count = sum(1 for pw in phonetic_loanwords if pw in clean)
            if loan_count >= 2:
                score -= (loan_count * 5.0)
        else:
            score -= 20.0
    elif target_lang == 'hi':
        if has_devanagari:
            score += 20.0
        else:
            score -= 20.0
    elif target_lang == 'mr':
        if has_devanagari:
            score += 20.0
            marathi_markers = ['आहे', 'माझं', 'माझे', 'नाव', 'राहतो', 'राहते', 'तुम्ही']
            if any(m in clean for m in marathi_markers):
                score += 15.0
        else:
            score -= 20.0
    elif target_lang == 'ta':
        if has_tamil:
            score += 25.0
        else:
            score -= 20.0
    elif target_lang == 'kn':
        if has_kannada:
            score += 25.0
        else:
            score -= 20.0

    return max(0.0, score)

def query_google_speech(raw_pcm_or_wav: bytes, lang: str = "en-US") -> str:
    # Google Chrome Speech API v2
    url = f"https://www.google.com/speech-api/v2/recognize?client=chromium&lang={lang}&key={GOOGLE_SPEECH_KEY}&pFilter=0"
    headers = {"Content-Type": "audio/l16; rate=16000"}

    # Strip 44-byte WAV header if present to get raw 16kHz 16-bit PCM
    payload = raw_pcm_or_wav
    if payload.startswith(b"RIFF") and len(payload) > 44:
        payload = payload[44:]

    req = urllib.request.Request(url, data=payload, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=4) as response:
            resp_body = response.read().decode("utf-8")
            # Google returns multiple JSON lines, e.g. {"result":[]} \n {"result":[{"alternative":[{"transcript":"..."}]}]}
            for line in resp_body.splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    results = data.get("result", [])
                    if results and len(results) > 0:
                        alt = results[0].get("alternative", [])
                        if alt and len(alt) > 0:
                            trans = alt[0].get("transcript", "")
                            if trans and trans.strip():
                                return trans.strip()
                except Exception:
                    continue
    except Exception:
        pass
    return ""

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            content_type = self.headers.get('Content-Type', '')

            audio_data = b""
            body = self.rfile.read(content_length)

            # Extract audio from multipart/form-data or raw bytes
            if "multipart/form-data" in content_type:
                # Find boundary
                boundary_match = re.search(r'boundary=([^;]+)', content_type)
                if boundary_match:
                    boundary = boundary_match.group(1).encode('utf-8').strip(b'"\'')
                    parts = body.split(b'--' + boundary)
                    for part in parts:
                        if b'name="audio"' in part:
                            # Split header and body of part
                            header_end = part.find(b'\r\n\r\n')
                            if header_end != -1:
                                audio_part = part[header_end + 4:]
                                if audio_part.endswith(b'\r\n'):
                                    audio_part = audio_part[:-2]
                                audio_data = audio_part
                                break
            else:
                audio_data = body

            if not audio_data or len(audio_data) < 200:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Empty audio data"}).encode('utf-8'))
                return

            candidates = [
                ('en-US', 'en', 'English'),
                ('te-IN', 'te', 'Telugu'),
                ('hi-IN', 'hi', 'Hindi'),
                ('mr-IN', 'mr', 'Marathi'),
                ('ta-IN', 'ta', 'Tamil'),
                ('kn-IN', 'kn', 'Kannada'),
            ]

            best_transcript = ""
            best_code = "en"
            best_lang = "English"
            best_score = -1.0

            for locale, code, name in candidates:
                txt = query_google_speech(audio_data, locale)
                if txt:
                    sc = score_text_for_lang(txt, code)
                    if sc > best_score:
                        best_score = sc
                        best_transcript = txt
                        best_code = code
                        best_lang = name

            res = {
                "transcript": best_transcript,
                "detected_code": best_code,
                "detected_lang": best_lang,
                "confidence": 1.0 if best_transcript else 0.0
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

