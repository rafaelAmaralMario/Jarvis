"""Camera capture and analysis service."""

import base64
import logging
import os

logger = logging.getLogger(__name__)


class CameraService:
    def __init__(self, camera_id: int = 0):
        self._camera_id = camera_id

    def capture(self) -> dict:
        try:
            import cv2
        except ImportError:
            return {"success": False, "error": "opencv-python not installed"}
        cap = cv2.VideoCapture(self._camera_id)
        if not cap.isOpened():
            return {"success": False, "error": "Cannot open camera"}
        ret, frame = cap.read()
        cap.release()
        if not ret:
            return {"success": False, "error": "Failed to capture frame"}
        _, buf = cv2.imencode(".jpg", frame)
        b64 = base64.b64encode(buf).decode()
        return {"success": True, "imageBase64": b64, "format": "jpg"}

    def capture_and_save(self, path: str) -> dict:
        try:
            import cv2
        except ImportError:
            return {"success": False, "error": "opencv-python not installed"}
        cap = cv2.VideoCapture(self._camera_id)
        if not cap.isOpened():
            return {"success": False, "error": "Cannot open camera"}
        ret, frame = cap.read()
        cap.release()
        if not ret:
            return {"success": False, "error": "Failed to capture frame"}
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        cv2.imwrite(path, frame)
        size = os.path.getsize(path)
        return {"success": True, "path": path, "size_bytes": size}

    def analyze(self, prompt: str = "Describe what you see in this image") -> dict:
        capture_result = self.capture()
        if not capture_result["success"]:
            return capture_result
        return {"success": True, "imageBase64": capture_result["imageBase64"], "format": "jpg"}
