import fitz  # PyMuPDF
import easyocr
import io
from PIL import Image
from groq import Groq
import os
from dotenv import load_dotenv
import json

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_text_from_file(file_path: str) -> str:
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text("text")
        doc.close()
    except:
        pass

    # If very little text → do OCR (for scanned Indian docs)
    if len(text.strip()) < 200:
        print("🔍 Using OCR fallback...")
        reader = easyocr.Reader(['en', 'hi'], gpu=False)
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            pix = page.get_pixmap(dpi=300)  # higher DPI = better accuracy
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='PNG')
            result = reader.readtext(img_byte_arr.getvalue(), detail=0)
            text += " ".join(result) + "\n"
        doc.close()

    return text.strip()[:20000]  # limit to avoid token overflow

def analyze_contract(text: str, jurisdiction: str = "India") -> dict:
    if not text or len(text) < 50:
        return {
            "overall_risk": 30,
            "summary": "Could not extract readable text from the document. Please upload a clearer PDF or photo.",
            "top_risks": [],
            "clauses": []
        }

    system_prompt = f"""You are ContractBuddy, an expert Indian legal analyst.
    Analyze ANY legal/government document (contract, loan receipt, rent agreement, MoU, government letter, etc.).
    Jurisdiction: {jurisdiction} (use Indian Contract Act, labour laws, DPDP Act, etc.).

    Return ONLY valid JSON with this exact structure (no extra text, no markdown):
    {{
      "overall_risk": number (0-100),
      "summary": "short plain English summary in 1-2 sentences",
      "top_risks": ["risk 1", "risk 2", "risk 3"],
      "clauses": [
        {{"clause": "short clause title", "risk": number, "explanation": "simple explanation in Hinglish/English"}}
      ]
    }}

    If text is unclear, still return JSON with low risk and honest summary."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Document text:\n\n{text}"}
            ],
            temperature=0.2,
            max_tokens=3000
        )
        content = response.choices[0].message.content.strip()
        return json.loads(content)
    except Exception as e:
        print("Groq JSON parse error:", e)
        # Fallback with better message
        return {
            "overall_risk": 40,
            "summary": "AI could not fully parse this document. Try a clearer PDF with selectable text.",
            "top_risks": ["Poor text quality"],
            "clauses": []
        }