"""Email integration — IMAP read, SMTP send."""

import email
import imaplib
import logging
import os
import re
import smtplib
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from email import encoders

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self, host: str = "", user: str = "", password: str = ""):
        self._imap_host = host or os.environ.get("EMAIL_IMAP_HOST", "imap.gmail.com")
        self._smtp_host = host or os.environ.get("EMAIL_SMTP_HOST", "smtp.gmail.com")
        self._user = user or os.environ.get("EMAIL_USER", "")
        self._password = password or os.environ.get("EMAIL_PASS", "")

    def read_emails(self, folder: str = "INBOX", limit: int = 10, search: str = "") -> dict:
        try:
            mail = imaplib.IMAP4_SSL(self._imap_host)
            mail.login(self._user, self._password)
            mail.select(folder)

            if search:
                status, ids = mail.search(None, "ALL")
            else:
                status, ids = mail.search(None, "ALL")

            if status != "OK":
                return {"success": False, "error": "Search failed"}

            id_list = ids[0].split() if ids[0] else []
            id_list = id_list[-limit:] if len(id_list) > limit else id_list
            id_list = id_list[::-1]

            emails = []
            for eid in id_list:
                status, data = mail.fetch(eid, "(RFC822)")
                if status != "OK":
                    continue
                raw = email.message_from_bytes(data[0][1])
                emails.append({
                    "id": eid.decode(),
                    "from": str(raw.get("From", "")),
                    "subject": str(raw.get("Subject", "")),
                    "date": str(raw.get("Date", "")),
                    "folder": folder,
                })

            mail.logout()
            return {"success": True, "emails": emails}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def send_email(self, to: str, subject: str, body: str, html: bool = True, attachments: list | None = None) -> dict:
        try:
            msg = MIMEMultipart()
            msg["From"] = formataddr(("", self._user))
            msg["To"] = to
            msg["Subject"] = subject

            if html:
                msg.attach(MIMEText(body, "html"))
            else:
                msg.attach(MIMEText(body, "plain"))

            for att in (attachments or []):
                part = MIMEBase("application", "octet-stream")
                with open(att["path"], "rb") as f:
                    part.set_payload(f.read())
                import encodings.base64_codec
                from email import encoders
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f'attachment; filename="{att.get("filename", "file")}"',
                )
                msg.attach(part)

            with smtplib.SMTP_SSL(self._smtp_host, 465) as server:
                server.login(self._user, self._password)
                server.send_message(msg)

            return {"success": True, "to": to, "subject": subject}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def reply_email(self, email_id: str, body: str, folder: str = "INBOX", html: bool = True) -> dict:
        try:
            mail = imaplib.IMAP4_SSL(self._imap_host)
            mail.login(self._user, self._password)
            mail.select(folder)

            status, data = mail.fetch(email_id.encode(), "(RFC822)")
            if status != "OK":
                return {"success": False, "error": "Email not found"}

            raw = email.message_from_bytes(data[0][1])
            original_subject = str(raw.get("Subject", ""))
            original_from = str(raw.get("From", ""))
            original_msg_id = str(raw.get("Message-ID", ""))

            reply_subject = f"Re: {original_subject}" if not original_subject.startswith("Re:") else original_subject
            match = re.search(r"<(.+?)>", original_from)
            reply_to_addr = match.group(1) if match else original_from.split(",")[0].strip()

            msg = MIMEMultipart()
            msg["From"] = formataddr(("", self._user))
            msg["To"] = reply_to_addr
            msg["Subject"] = reply_subject
            msg["In-Reply-To"] = original_msg_id
            msg["References"] = original_msg_id

            if html:
                msg.attach(MIMEText(body, "html"))
            else:
                msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP_SSL(self._smtp_host, 465) as server:
                server.login(self._user, self._password)
                server.send_message(msg)

            mail.logout()
            return {"success": True, "to": reply_to_addr, "subject": reply_subject}
        except Exception as e:
            return {"success": False, "error": str(e)}
