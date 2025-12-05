import google.generativeai as genai
import os

try:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable is not set.")
        print("Please run: export GEMINI_API_KEY='your_key_here' && python3 check_models.py")
        exit(1)

    genai.configure(api_key=api_key)

    print("Fetching available models...")
    found_flash = False
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
            if "flash" in m.name and "tts" in m.name:
                print(f"  ^^^ FOUND TTS CANDIDATE: {m.name}")
            if "gemini-2.5" in m.name:
                 print(f"  ^^^ FOUND GEMINI 2.5: {m.name}")

except Exception as e:
    print(f"An error occurred: {e}")
