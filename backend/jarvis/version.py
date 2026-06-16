"""Version management and update checking via GitHub releases."""

import json
import os
import platform
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from urllib.request import Request, urlopen

APP_NAME = "JARVIS"
APP_VERSION = "0.2.0"
REPO_OWNER = "anomalyco"
REPO_NAME = "jarvis"
GITHUB_API = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases"
UPDATER_SCRIPT = "jarvis_update.bat"


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


def _fetch_releases() -> list[dict]:
    req = Request(
        GITHUB_API,
        headers={
            "User-Agent": f"{APP_NAME}/{APP_VERSION}",
            "Accept": "application/vnd.github.v3+json",
        },
    )
    resp = urlopen(req, timeout=10)
    return json.loads(resp.read().decode())


def _get_asset_for_platform(assets: list[dict]) -> tuple[str, str]:
    system = platform.system()
    for asset in assets:
        name = asset.get("name", "")
        if system == "Windows" and (name.endswith(".exe") or name.endswith(".msi") or name.endswith(".zip")):
            return asset.get("browser_download_url", ""), name
        if system == "Darwin" and (name.endswith(".dmg") or name.endswith(".zip")):
            return asset.get("browser_download_url", ""), name
        if system == "Linux" and (name.endswith(".AppImage") or name.endswith(".deb")):
            return asset.get("browser_download_url", ""), name
    return "", ""


def check_for_updates() -> UpdateStatus:
    status = UpdateStatus(current_version=APP_VERSION)
    try:
        data = _fetch_releases()
        releases: list[ReleaseInfo] = []
        for r in data:
            rel = ReleaseInfo(
                tag_name=r.get("tag_name", ""),
                name=r.get("name", ""),
                body=r.get("body", ""),
                published_at=r.get("published_at", ""),
                prerelease=r.get("prerelease", False),
            )
            url, fname = _get_asset_for_platform(r.get("assets", []))
            rel.download_url = url
            rel.filename = fname
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
        data = _fetch_releases()
        return [r.get("tag_name", "").lstrip("vV") for r in data if not r.get("prerelease")]
    except Exception:
        return []


def _download_file(url: str, dest: str) -> str:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = Request(url, headers={"User-Agent": f"{APP_NAME}/{APP_VERSION}"})
    with urlopen(req, timeout=300) as src, open(dest, "wb") as f:
        f.write(src.read())
    return dest


def _create_updater_bat(
    downloaded_path: str,
    current_pid: int,
    is_installer: bool,
) -> str:
    bat_path = os.path.join(tempfile.gettempdir(), UPDATER_SCRIPT)
    lines = [
        "@echo off",
        "title JARVIS Updater",
        "",
        ":wait",
        f"  tasklist /FI \"PID eq {current_pid}\" 2>NUL | find \"{current_pid}\" >NUL",
        "  if not errorlevel 1 (",
        "    timeout /t 1 /nobreak >NUL",
        "    goto wait",
        "  )",
        "",
    ]
    if is_installer:
        lines += [
            "echo Instalando JARVIS...",
            f"start /wait \"\" \"{downloaded_path}\" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-",
            "",
            f'if exist "{_get_installed_exe_path()}" (',
            f'  start "" "{_get_installed_exe_path()}"',
            ")",
        ]
    else:
        current_exe = sys.executable if getattr(sys, 'frozen', False) else ""
        if current_exe:
            lines += [
                'echo Atualizando JARVIS...',
                f'copy /Y "{downloaded_path}" "{current_exe}"',
                f'start "" "{current_exe}"',
            ]
        else:
            lines.append(f'start "" "{downloaded_path}"')

    lines.append("")
    lines.append("echo Atualizacao concluida.")
    lines.append("if exist \"%~f0\" del \"%~f0\"")
    lines.append("exit")

    content = "\r\n".join(lines)
    with open(bat_path, "w", newline="\r\n") as f:
        f.write(content)
    return bat_path


def _get_installed_exe_path() -> str:
    if getattr(sys, 'frozen', False):
        return sys.executable
    return os.path.join(os.path.dirname(sys.executable) if hasattr(sys, 'executable') else os.getcwd(), f"{APP_NAME}.exe")


def _is_installer(filename: str) -> bool:
    name = filename.lower()
    return "setup" in name or "installer" in name


def download_and_install(version: str) -> dict:
    target_tag = f"v{version}" if not version.startswith("v") else version
    try:
        data = _fetch_releases()
    except Exception as e:
        raise RuntimeError(f"Falha ao buscar releases: {e}")

    for r in data:
        if r.get("tag_name") == target_tag:
            download_url, filename = _get_asset_for_platform(r.get("assets", []))
            if not download_url:
                raise RuntimeError(f"Nenhum asset compatível encontrado para {platform.system()} na release {target_tag}")

            ext = os.path.splitext(download_url)[1] or ".exe"
            dest = os.path.join(tempfile.gettempdir(), f"{APP_NAME}-{version}{ext}")

            downloaded = _download_file(download_url, dest)

            frozen = getattr(sys, 'frozen', False)
            if frozen:
                is_inst = _is_installer(filename)
                current_pid = os.getpid()
                bat = _create_updater_bat(downloaded, current_pid, is_inst)
                try:
                    subprocess.Popen(
                        ["cmd.exe", "/c", bat],
                        creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0,
                        close_fds=True,
                    )
                except Exception:
                    pass
                return {
                    "success": True,
                    "path": downloaded,
                    "restart": True,
                    "message": "Atualização preparada. O JARVIS será reiniciado para aplicar a atualização.",
                }
            else:
                return {"success": True, "path": downloaded, "restart": False}

    raise RuntimeError(f"Release {target_tag} não encontrada")


def _serialize(obj):
    if hasattr(obj, "__dataclass_fields__"):
        return {f: getattr(obj, f) for f in obj.__dataclass_fields__}
    return obj
