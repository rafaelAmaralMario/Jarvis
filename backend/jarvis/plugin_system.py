"""Plugin system — auto-load, hot-reload, sandboxed plugins."""

import importlib.util
import inspect
import logging
import os
import sys
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

PLUGIN_DIR = Path.home() / ".jarvis" / "plugins"


class JarvisPlugin:
    """Base class for all plugins. Subclass this and implement the interface."""

    name: str = ""
    version: str = "0.1.0"
    description: str = ""

    def on_load(self) -> None:
        """Called when plugin is loaded."""

    def on_unload(self) -> None:
        """Called when plugin is unloaded."""

    def get_tools(self) -> list[dict[str, Any]]:
        """Return tool definitions that will be registered in ToolManager.
        Each tool is a dict with keys: name, description, parameters, handler
        """
        return []


class PluginLoader:
    def __init__(self, plugin_dir: str | Path = ""):
        self._plugin_dir = Path(plugin_dir) if plugin_dir else PLUGIN_DIR
        self._plugins: dict[str, JarvisPlugin] = {}
        self._timestamps: dict[str, float] = {}
        self._tools: list[dict[str, Any]] = []

    @property
    def tools(self) -> list[dict[str, Any]]:
        return list(self._tools)

    def ensure_dir(self) -> None:
        self._plugin_dir.mkdir(parents=True, exist_ok=True)
        init_file = self._plugin_dir / "__init__.py"
        if not init_file.exists():
            init_file.write_text("")

    def discover(self) -> list[Path]:
        self.ensure_dir()
        return sorted(self._plugin_dir.glob("*.py"))

    def load_all(self) -> None:
        for path in self.discover():
            if path.name == "__init__.py":
                continue
            self._load_plugin(path)

    def _load_plugin(self, path: Path) -> JarvisPlugin | None:
        module_name = f"jarvis_user_plugin_{path.stem}"
        if module_name in sys.modules:
            del sys.modules[module_name]

        try:
            spec = importlib.util.spec_from_file_location(module_name, path)
            if spec is None or spec.loader is None:
                logger.warning("Could not load plugin %s", path)
                return None
            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            spec.loader.exec_module(module)
        except Exception as e:
            logger.exception("Failed to load plugin %s: %s", path, e)
            return None

        plugin_instance = None
        for _, obj in inspect.getmembers(module, inspect.isclass):
            if (
                issubclass(obj, JarvisPlugin)
                and obj is not JarvisPlugin
            ):
                try:
                    plugin_instance = obj()
                except Exception as e:
                    logger.exception("Failed to instantiate plugin %s: %s", path, e)
                    continue

                plugin_instance.name = plugin_instance.name or path.stem
                try:
                    plugin_instance.on_load()
                except Exception as e:
                    logger.exception("Plugin %s on_load failed: %s", path, e)

                self._plugins[path.stem] = plugin_instance
                self._timestamps[str(path)] = path.stat().st_mtime

                for tool_def in plugin_instance.get_tools():
                    tool_def["_plugin"] = path.stem
                    self._tools.append(tool_def)

                logger.info("Plugin loaded: %s v%s", plugin_instance.name, plugin_instance.version)
                return plugin_instance

        logger.warning("No JarvisPlugin subclass found in %s", path)
        return None

    def unload(self, name: str) -> None:
        plugin = self._plugins.pop(name, None)
        if plugin is None:
            return
        try:
            plugin.on_unload()
        except Exception as e:
            logger.exception("Plugin %s on_unload failed: %s", name, e)
        self._tools = [t for t in self._tools if t.get("_plugin") != name]
        logger.info("Plugin unloaded: %s", name)

    def check_hot_reload(self) -> list[str]:
        """Check for modified/new/deleted plugins and reload as needed. Returns list of events."""
        events = []
        current_paths = set()

        for path in self.discover():
            if path.name == "__init__.py":
                continue
            current_paths.add(str(path))
            key = str(path)
            old_mtime = self._timestamps.get(key)
            try:
                new_mtime = path.stat().st_mtime
            except OSError:
                continue

            if key not in self._timestamps:
                logger.info("New plugin detected: %s", path)
                self.load_all()
                events.append(f"loaded:{path.stem}")
            elif old_mtime and new_mtime > old_mtime:
                logger.info("Plugin modified, reloading: %s", path)
                self.unload(path.stem)
                self._load_plugin(path)
                events.append(f"reloaded:{path.stem}")

        loaded_stems = {p.stem for p in Path(self._plugin_dir).glob("*.py") if p.name != "__init__.py"}
        for plugin_name in list(self._plugins.keys()):
            if plugin_name not in {p.stem for p in Path(self._plugin_dir).glob("*.py") if p.name != "__init__.py"}:
                logger.info("Plugin removed, unloading: %s", plugin_name)
                self.unload(plugin_name)
                events.append(f"unloaded:{plugin_name}")

        return events

    def list_plugins(self) -> list[dict[str, Any]]:
        return [
            {
                "name": p.name,
                "version": p.version,
                "description": p.description,
                "tools": len(p.get_tools()),
            }
            for p in self._plugins.values()
        ]
