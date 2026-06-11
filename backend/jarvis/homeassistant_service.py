"""Home Assistant integration via REST API."""

import logging
import os

import httpx

logger = logging.getLogger(__name__)


class HomeAssistantService:
    def __init__(self, url: str = "", token: str = ""):
        self._url = url.rstrip("/") or os.environ.get("HA_URL", "http://localhost:8123")
        self._token = token or os.environ.get("HA_TOKEN", "")
        self._client = httpx.Client(
            base_url=self._url,
            headers={
                "Authorization": f"Bearer {self._token}",
                "Content-Type": "application/json",
            },
            timeout=10,
        )

    def list_devices(self) -> dict:
        try:
            resp = self._client.get("/api/states")
            resp.raise_for_status()
            states = resp.json()
            devices = []
            for s in states:
                devices.append({
                    "entity_id": s.get("entity_id", ""),
                    "state": s.get("state", ""),
                    "friendly_name": s.get("attributes", {}).get("friendly_name", ""),
                })
            return {"success": True, "devices": devices}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def control_device(self, entity_id: str, action: str, **kwargs) -> dict:
        try:
            domain = entity_id.split(".")[0]
            if action == "turn_on":
                resp = self._client.post(f"/api/services/{domain}/turn_on", json={"entity_id": entity_id})
            elif action == "turn_off":
                resp = self._client.post(f"/api/services/{domain}/turn_off", json={"entity_id": entity_id})
            elif action == "toggle":
                resp = self._client.post(f"/api/services/{domain}/toggle", json={"entity_id": entity_id})
            elif action == "set":
                data = {"entity_id": entity_id, **kwargs}
                resp = self._client.post(f"/api/services/{domain}/set", json=data)
            else:
                return {"success": False, "error": f"Unknown action: {action}"}
            resp.raise_for_status()
            return {"success": True, "action": action, "entity_id": entity_id}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_sensor(self, entity_id: str) -> dict:
        try:
            resp = self._client.get(f"/api/states/{entity_id}")
            resp.raise_for_status()
            data = resp.json()
            return {
                "success": True,
                "entity_id": data.get("entity_id", ""),
                "state": data.get("state", ""),
                "attributes": data.get("attributes", {}),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
