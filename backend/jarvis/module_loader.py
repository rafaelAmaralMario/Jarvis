"""Module/extension loader — discovers and loads Python plugins."""

import importlib
import importlib.util
import os
import sys
from dataclasses import dataclass


@dataclass
class ModuleInfo:
    name: str
    path: str
    version: str = "0.1.0"
    description: str = ""
    enabled: bool = True


@dataclass
class LoadedModule:
    name: str
    path: str
    module: object


class ModuleLoader:
    def __init__(self):
        self._loaded: dict[str, LoadedModule] = {}

    def discover(self, directory: str) -> list[ModuleInfo]:
        result: list[ModuleInfo] = []
        if not os.path.isdir(directory):
            return result
        for entry in sorted(os.listdir(directory)):
            if not entry.endswith(".py"):
                continue
            if entry.startswith("_"):
                continue
            name = entry[:-3]
            path = os.path.join(directory, entry)
            result.append(ModuleInfo(name=name, path=path))
        return result

    def load(self, module_name: str) -> object:
        if module_name in self._loaded:
            return self._loaded[module_name].module

        spec = importlib.util.find_spec(module_name)
        if spec is None:
            raise ImportError(f"Module not found: {module_name}")

        mod = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = mod
        spec.loader.exec_module(mod)

        self._loaded[module_name] = LoadedModule(
            name=module_name,
            path=getattr(mod, "__file__", ""),
            module=mod,
        )
        return mod

    def load_from_path(self, path: str) -> object:
        name = os.path.splitext(os.path.basename(path))[0]
        if name in self._loaded:
            return self._loaded[name].module

        parent = os.path.dirname(os.path.abspath(path))
        if parent not in sys.path:
            sys.path.insert(0, parent)

        spec = importlib.util.spec_from_file_location(name, path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load module from path: {path}")

        mod = importlib.util.module_from_spec(spec)
        sys.modules[name] = mod
        spec.loader.exec_module(mod)

        self._loaded[name] = LoadedModule(name=name, path=path, module=mod)
        return mod

    def reload(self, module_name: str) -> object:
        if module_name not in self._loaded:
            return self.load(module_name)
        mod = importlib.reload(self._loaded[module_name].module)
        self._loaded[module_name].module = mod
        return mod

    def unload(self, module_name: str) -> bool:
        if module_name not in self._loaded:
            return False
        del self._loaded[module_name]
        if module_name in sys.modules:
            del sys.modules[module_name]
        return True

    def get_module(self, name: str) -> LoadedModule | None:
        return self._loaded.get(name)

    def list_loaded(self) -> list[LoadedModule]:
        return list(self._loaded.values())
