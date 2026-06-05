"""Terminal emulation — PTY via subprocess with I/O."""


class TerminalManager:
    def __init__(self):
        self._terminals: dict[str, dict] = {}
