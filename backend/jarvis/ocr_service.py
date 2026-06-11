"""OCR service — extract text from images using Tesseract."""

import logging
import os

logger = logging.getLogger(__name__)


class OCRService:
    def extract_text(self, path: str, language: str = "por+eng") -> dict:
        try:
            import pytesseract
            from PIL import Image
        except ImportError:
            return {"success": False, "error": "pytesseract or Pillow not installed"}
        if not os.path.exists(path):
            return {"success": False, "error": f"File not found: {path}"}
        try:
            img = Image.open(path)
            data = pytesseract.image_to_data(img, lang=language, output_type=pytesseract.Output.DICT)
            text = pytesseract.image_to_string(img, lang=language)
            confidence = sum(data["conf"]) / len(data["conf"]) if data["conf"] else 0
            return {
                "success": True,
                "text": text.strip(),
                "confidence": confidence,
                "language": language,
                "blocks": len([c for c in data["conf"] if c > 0]),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
