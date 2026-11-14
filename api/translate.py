from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse

def query_neural_translate(text: str, sl: str = 'auto', tl: str = 'en'):
    if not text or not text.strip():
        return text, sl
    
    clean = text.strip()
    encoded = urllib.parse.quote(clean)
    clients = ['dict-chrome-ex', 'gtx', 'webapp']
    
    for client in clients:
        try:
            url = f"https://translate.googleapis.com/translate_a/single?client={client}&sl={sl}&tl={tl}&dt=t&dt=rm&q={encoded}"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                payload = json.loads(response.read().decode("utf-8"))
                translated_segments = []
                target_roman = None
                if payload and len(payload) > 0 and payload[0]:
                    for item in payload[0]:
                        if item and isinstance(item, list) and len(item) > 0 and item[0] and isinstance(item[0], str):
                            translated_segments.append(item[0])
                        elif item and isinstance(item, list) and len(item) > 2 and item[2]:
                            target_roman = item[2]
                translated_text = "".join(translated_segments).strip()
                detected_code = payload[2] if len(payload) > 2 and payload[2] else sl
                if translated_text and translated_text.lower() != clean.lower():
                    return translated_text, detected_code, target_roman
        except Exception:
            continue
            
    # Fallback to MyMemory
    try:
        eff_sl = sl
        if eff_sl == 'auto':
            if any('\u0c00' <= char <= '\u0c7f' for char in clean):
                eff_sl = 'te'
            elif any('\u0900' <= char <= '\u097f' for char in clean):
                marathi_markers = ['आहे', 'माझं', 'माझे', 'नाव', 'कसा', 'कशी', 'आहोत', 'राहते', 'राहतो', 'घरी', 'नाही', 'तुम्ही', 'काय', 'कुठे']
                if any(m in clean for m in marathi_markers) or tl == 'mr':
                    eff_sl = 'mr'
                else:
                    eff_sl = 'hi'
            elif any('\u0b80' <= char <= '\u0bff' for char in clean):
                eff_sl = 'ta'
            elif any('\u0c80' <= char <= '\u0cff' for char in clean):
                eff_sl = 'kn'
            elif any('\u0d00' <= char <= '\u0d7f' for char in clean):
                eff_sl = 'ml'
            elif any('\u0980' <= char <= '\u09ff' for char in clean):
                eff_sl = 'bn'
            else:
                eff_sl = 'en'
        mm_url = f"https://api.mymemory.translated.net/get?q={encoded}&langpair={eff_sl}|{tl}"
        req = urllib.request.Request(mm_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            tr = data.get("responseData", {}).get("translatedText")
            if tr and tr.strip() and tr.strip().lower() != clean.lower():
                return tr.strip(), eff_sl, tr.strip()
    except Exception:
        pass

    return clean, sl, clean

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
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body) if body else {}

            text = data.get('text', '')
            source_lang = data.get('source_lang', 'auto')
            target_lang = data.get('target_lang', 'en')

            translated_text, detected_code, transliterated_script = query_neural_translate(
                text, source_lang, target_lang
            )

            response_data = {
                "original_text": text,
                "translated_text": translated_text,
                "detected_code": detected_code,
                "detected_lang": detected_code,
                "target_lang": target_lang,
                "pronunciation": transliterated_script,
                "transliterated_script": transliterated_script,
                "meaning": text if target_lang != 'en' else translated_text,
                "engine": "vercel_serverless"
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

