import os
import json
import webbrowser
import requests
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

API_KEY = os.getenv("API_KEY") or os.getenv("GEMINI_API_KEY")
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent"

SYSTEM_INSTRUCTION = """
You are a highly skilled Physics Simulation Developer Agent. 
Your goal is to write clean, visually stunning, and physically accurate 2D/3D simulations using HTML5, Vanilla CSS, and Vanilla JavaScript.

When the user asks you to model a physics experiment, you must generate a complete, working simulation split into four files:
1. `index.html`: The user interface layout, controls (sliders, buttons), and canvas elements.
2. `style.css`: Modern, dark-themed, glassmorphic styling. Use Outfit or Inter fonts.
3. `main.js`: Handles animation loops, event listeners (sliders), canvas rendering, and UI updates.
4. `physics.js`: The physical engine. It should contain equations, constants, integration methods (Euler, Verlet, or RK4), and return the physical state.

You must respond ONLY in a JSON format matching the following structure:
{
  "explanation": "A short, markdown-formatted explanation of the physics and algorithms used.",
  "files": {
    "index.html": "... HTML code ...",
    "style.css": "... CSS code ...",
    "main.js": "... JS code ...",
    "physics.js": "... JS code ..."
  }
}

Do not include any other markdown formatting outside of the JSON block. Do not include markdown code block syntax (like ```json) in your raw response; output raw JSON text directly.
"""

def generate_simulation(prompt, history=None):
    if not API_KEY:
        print("HATA: GEMINI_API_KEY bulunamadı! Lütfen .env dosyasını kontrol edin.")
        return None

    print("\nAjan düşünüyor ve fizik simülasyonunu kodluyor... Lütfen bekleyin...\n")

    # Geçmişi ve anlık mesajı birleştir
    contents = []
    if history:
        for msg in history:
            contents.append(msg)
    contents.append({"role": "user", "parts": [{"text": prompt}]})

    payload = {
        "contents": contents,
        "systemInstruction": {
            "parts": [{"text": SYSTEM_INSTRUCTION}]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2
        }
    }

    try:
        response = requests.post(f"{API_URL}?key={API_KEY}", json=payload)
        response.raise_for_status()
        data = response.json()
        
        # Yanıtı parse et
        response_text = data['candidates'][0]['content']['parts'][0]['text']
        result = json.loads(response_text)
        return result
    except Exception as e:
        print(f"HATA: API çağrısı sırasında bir sorun oluştu: {e}")
        if 'response' in locals() and response.text:
            print("API Yanıtı:", response.text)
        return None

def save_files(simulation_data, folder_name="double-slit"):
    # Klasör oluştur
    os.makedirs(folder_name, exist_ok=True)
    
    # Dosyaları yaz
    for filename, content in simulation_data['files'].items():
        filepath = os.path.join(folder_name, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[YAZILDI] {filepath}")

    print(f"\nSimülasyon başarıyla '{folder_name}' klasörüne kaydedildi.")
    return os.path.abspath(os.path.join(folder_name, "index.html"))

def main():
    print("=" * 60)
    print("      Otonom Fizik Simülasyon Ajanı (Physics Agent) v1.0")
    print("=" * 60)

    if not API_KEY:
        print("\nHATA: GEMINI_API_KEY eksik! Lütfen .env dosyasını kontrol edin.")
        return

    history = []
    
    # Varsayılan ilk komut
    default_prompt = "Young's Double Slit experiment. Interactive sliders for wavelength, slit distance, slit width. Dynamic canvas showing wave fronts propagating from two slits, and a second canvas showing the interference/diffraction pattern intensity profile."
    
    print(f"\nİlk simülasyon hazırlanıyor: Young's Double Slit")
    result = generate_simulation(default_prompt, history)
    
    if result:
        print("\n--- Ajan Açıklaması ---")
        print(result.get("explanation", "Açıklama bulunamadı."))
        print("-" * 30)
        
        html_path = save_files(result, "double-slit")
        
        # Tarayıcıda aç
        print("\nSimülasyon tarayıcıda açılıyor...")
        webbrowser.open(f"file:///{html_path}")
        
        # Geçmişe ekle
        history.append({"role": "user", "parts": [{"text": default_prompt}]})
        history.append({"role": "model", "parts": [{"text": json.dumps(result)}]})
    
    # İterasyon döngüsü
    while True:
        print("\n" + "="*40)
        print("Ne yapmak istersiniz?")
        print("1. Simülasyonu güncelle (Geri bildirim ver)")
        print("2. Yeni bir simülasyon başlat")
        print("3. Çıkış")
        choice = input("Seçiminiz (1/2/3): ").strip()
        
        if choice == "3":
            print("Görüşmek üzere!")
            break
            
        elif choice == "1":
            feedback = input("\nGüncelleme isteğinizi yazın (Örn: 'dalga boyunu mavi yap', 'dalga animasyon hızını düşür'): ").strip()
            if not feedback:
                continue
            
            result = generate_simulation(feedback, history)
            if result:
                print("\n--- Güncellenen Ajan Açıklaması ---")
                print(result.get("explanation", ""))
                html_path = save_files(result, "double-slit")
                webbrowser.open(f"file:///{html_path}")
                
                # Geçmişi güncelle
                history.append({"role": "user", "parts": [{"text": feedback}]})
                history.append({"role": "model", "parts": [{"text": json.dumps(result)}]})
                
        elif choice == "2":
            new_prompt = input("\nYeni simüle etmek istediğiniz konuyu yazın: ").strip()
            if not new_prompt:
                continue
            
            folder = input("Kaydetmek istediğiniz klasör adı (Örn: chaos-pendulum): ").strip() or "simulation"
            history = [] # Geçmişi sıfırla
            
            result = generate_simulation(new_prompt, history)
            if result:
                print("\n--- Ajan Açıklaması ---")
                print(result.get("explanation", ""))
                html_path = save_files(result, folder)
                webbrowser.open(f"file:///{html_path}")
                
                history.append({"role": "user", "parts": [{"text": new_prompt}]})
                history.append({"role": "model", "parts": [{"text": json.dumps(result)}]})

if __name__ == "__main__":
    main()
