"""Calendar service — CalDAV integration for events."""

import logging
import os
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)


class CalendarService:
    def __init__(self, url: str = "", username: str = "", password: str = ""):
        self._url = url or os.environ.get("CALDAV_URL", "")
        self._username = username or os.environ.get("CALDAV_USER", "")
        self._password = password or os.environ.get("CALDAV_PASS", "")
        self._client = None

    def _connect(self):
        if self._client:
            return
        try:
            import caldav
        except ImportError:
            raise RuntimeError("caldav library not installed")
        self._client = caldav.DAVClient(
            url=self._url, username=self._username, password=self._password
        )

    def list_events(self, days: int = 7) -> dict:
        self._connect()
        try:
            principal = self._client.principal()
            calendars = principal.calendars()
            results = []
            now = datetime.now(timezone.utc)
            end = now + timedelta(days=days)
            for cal in calendars:
                events = cal.date_search(start=now, end=end)
                for e in events:
                    vevent = e.vevent
                    results.append({
                        "summary": str(getattr(vevent, "summary", "")),
                        "start": str(getattr(vevent, "dtstart", "")),
                        "end": str(getattr(vevent, "dtend", "")),
                        "calendar": str(getattr(cal, "name", "")),
                        "uid": str(getattr(vevent, "uid", "")),
                    })
            return {"success": True, "events": results}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def create_event(self, summary: str, start: str, end: str, description: str = "") -> dict:
        self._connect()
        try:
            principal = self._client.principal()
            calendars = principal.calendars()
            if not calendars:
                return {"success": False, "error": "No calendars found"}
            cal = calendars[0]
            event = cal.save_event(
                dtstart=start, dtend=end, summary=summary, description=description
            )
            return {"success": True, "uid": str(getattr(event, "uid", "")), "summary": summary}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def update_event(self, uid: str, summary: str = "", start: str = "", end: str = "") -> dict:
        self._connect()
        try:
            principal = self._client.principal()
            for cal in principal.calendars():
                events = cal.events()
                for e in events:
                    if str(getattr(e, "uid", "")) == uid:
                        e.vevent.summary = summary or e.vevent.summary
                        if start:
                            e.vevent.dtstart = start
                        if end:
                            e.vevent.dtend = end
                        e.save()
                        return {"success": True, "uid": uid}
            return {"success": False, "error": f"Event {uid} not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}
