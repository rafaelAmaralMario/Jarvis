"""Version management and update checking via GitHub releases."""

import json
import os
import platform
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from typing import Optional
from urllib.request import urlopen, Request

import httpx

APP_NAME = "JARVIS"
APP_VERSION = "0.1.0"
REPO_OWNER = "anomalyco"
REPO_NAME = "jarvis"
GITHUB_API = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases"


@dataclass
class ReleaseInfo:
    tag_name: str
    name: str
    body: str
    published_at: str
    prerelease: bool
    download_url: str = ""
    filename: str = ""


@dataclass
class UpdateStatus:
    current_version: str
    latest_version: str = ""
    update_available: bool = False
    releases: list = field(default_factory=list)
    error: str = ""


def get_app_version() -> str:
    return APP_VERSION


def _parse_version(v: str) -> tuple[int, ...]:
    v = v.lstrip("vV")
    parts = []
    for p in v.split("."):
        digit_part = ""
        for ch in p:
            if ch.isdigit():
                digit_part += ch
            else:
                break
        try:
            parts.append(int(digit_part) if digit_part else 0)
        except ValueError:
            parts.append(0)
    while len(parts) < 3:
        parts.append(0)
    return tuple(parts[:3])


def is_newer(v1: str, v2: str) -> bool:
    return _parse_version(v1) > _parse_version(v2)


def check_for_updates() -> UpdateStatus:
    status = UpdateStatus(current_version=APP_VERSION)
    try:
        req = Request(GITHUB_API, headers={"User-Agent": f"{APP_NAME}/{APP_VERSION}", "Accept": "application/vnd.github.v3+json"})
        resp = urlopen(req, timeout=10)
        data = json.loads(resp.read().decode())
        releases: list[ReleaseInfo] = []
        for r in data:
            rel = ReleaseInfo(
                tag_name=r.get("tag_name", ""),
                name=r.get("name", ""),
                body=r.get("body", ""),
                published_at=r.get("published_at", ""),
                prerelease=r.get("prerelease", False),
            )
            for asset in r.get("assets", []):
                name = asset.get("name", "")
                if platform.system() == "Windows" and (name.endswith(".exe") or name.endswith(".msi")):
                    rel.download_url = asset.get("browser_download_url", "")
                    rel.filename = name
                    break
                elif platform.system() == "Darwin" and name.endswith(".dmg"):
                    rel.download_url = asset.get("browser_download_url", "")
                    rel.filename = name
                    break
                elif platform.system() == "Linux" and name.endswith(".AppImage"):
                    rel.download_url = asset.get("browser_download_url", "")
                    rel.filename = name
                    break
            releases.append(rel)
        status.releases = [_serialize(r) for r in releases]
        if releases:
            latest = releases[0]
            status.latest_version = latest.tag_name.lstrip("vV")
            if is_newer(latest.tag_name.lstrip("vV"), APP_VERSION):
                status.update_available = True
    except Exception as e:
        status.error = str(e)
    return status


def get_available_versions() -> list[str]:
    try:
        req = Request(GITHUB_API, headers={"User-Agent": f"{APP_NAME}/{APP_VERSION}", "Accept": "application/vnd.github.v3+json"})
        resp = urlopen(req, timeout=10)
        data = json.loads(resp.read().decode())
        return [r.get("tag_name", "").lstrip("vV") for r in data if not r.get("prerelease")]
    except Exception:
        return []


def download_and_install(version: str) -> str:
    target_tag = f"v{version}" if not version.startswith("v") else version
    try:
        req = Request(GITHUB_API, headers={"User-Agent": f"{APP_NAME}/{APP_VERSION}", "Accept": "application/vnd.github.v3+json"})
        resp = urlopen(req, timeout=10)
        data = json.loads(resp.read().decode())
    except Exception as e:
        raise RuntimeError(f"Falha ao buscar releases: {e}")

    for r in data:
        if r.get("tag_name") == target_tag:
            system = platform.system()
            for asset in r.get("assets", []):
                name = asset.get("name", "")
                if system == "Windows" and (name.endswith(".exe") or name.endswith(".msi")):
                    download_url = asset.get("browser_download_url", "")
                    break
                elif system == "Darwin" and name.endswith(".dmg"):
                    download_url = asset.get("browser_download_url", "")
                    break
                elif system == "Linux" and name.endswith(".AppImage"):
                    download_url = asset.get("browser_download_url", "")
                    break
            else:
                raise RuntimeError(f"Nenhum asset encontrado para {system} na release {target_tag}")

            dest = os.path.join(tempfile.gettempdir(), f"{APP_NAME}-{version}{os.path.splitext(download_url)[1]}")
            req = Request(download_url, headers={"User-Agent": f"{APP_NAME}/{APP_VERSION}"})
            with urlopen(req, timeout=300) as src, open(dest, "wb") as f:
                f.write(src.read())
            return dest

    raise RuntimeError(f"Release {target_tag} não encontrada")


def _serialize(obj):
    if hasattr(obj, "__dataclass_fields__"):
        return {f: getattr(obj, f) for f in obj.__dataclass_fields__}
    return obj
