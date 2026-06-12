"""WhatsApp integration — send and read messages."""

import logging
import os

logger = logging.getLogger(__name__)


class WhatsAppService:
    def __init__(self, phone: str = ""):
        self._phone = phone or os.environ.get("WHATSAPP_PHONE", "")

    def send_message(self, to: str, message: str) -> dict:
        try:
            import pywhatkit
            pywhatkit.sendwhatmsg_instantly(
                phone_no=to,
                message=message,
                wait_time=15,
                tab_close=True,
            )
            return {"success": True, "to": to, "message": message}
        except ImportError:
            return {"success": False, "error": "pywhatkit not installed"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def read_messages(self, limit: int = 10) -> dict:
        return {"success": False, "error": "WhatsApp read requires whatsapp-web.js setup"}
