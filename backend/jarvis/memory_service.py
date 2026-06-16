"""Long-term memory with knowledge graph + vector store + user profile."""

import json
import logging
import os
import re
from dataclasses import dataclass, field, asdict
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class Entity:
    name: str
    type: str = "concept"
    mentions: int = 1
    last_seen: str = ""
    attributes: dict = field(default_factory=dict)


@dataclass
class Relation:
    source: str
    target: str
    relation: str
    weight: int = 1


@dataclass
class MemoryEntry:
    content: str
    entities: list[str] = field(default_factory=list)
    timestamp: str = ""
    importance: float = 1.0
    source: str = "conversation"


class MemoryService:
    def __init__(self, persist_dir: str | None = None, llm_generate=None):
        self._base_dir = persist_dir or os.path.join(
            os.path.dirname(__file__), "..", "..", "data", "memory"
        )
        os.makedirs(self._base_dir, exist_ok=True)
        self._graph_path = os.path.join(self._base_dir, "knowledge_graph.json")
        self._profile_path = os.path.join(self._base_dir, "user_profile.json")
        self._graph: dict[str, dict[str, Any]] = {"entities": {}, "relations": []}
        self._profile: dict[str, Any] = {}
        self._llm = llm_generate
        self._rag = None
        self._load()
        self._init_vector_store()

    def _load(self):
        if os.path.exists(self._graph_path):
            try:
                with open(self._graph_path) as f:
                    self._graph = json.load(f)
            except Exception:
                self._graph = {"entities": {}, "relations": []}
        if os.path.exists(self._profile_path):
            try:
                with open(self._profile_path) as f:
                    self._profile = json.load(f)
            except Exception:
                self._profile = {}

    def _save_graph(self):
        os.makedirs(os.path.dirname(self._graph_path), exist_ok=True)
        with open(self._graph_path, "w") as f:
            json.dump(self._graph, f, indent=2)

    def _save_profile(self):
        os.makedirs(os.path.dirname(self._profile_path), exist_ok=True)
        with open(self._profile_path, "w") as f:
            json.dump(self._profile, f, indent=2)

    def _init_vector_store(self):
        try:
            from jarvis.rag_service import RAGService
            vec_dir = os.path.join(self._base_dir, "chromadb")
            self._rag = RAGService(persist_dir=vec_dir)
        except Exception as e:
            logger.warning("Vector store init failed: %s", e)

    def _get_rag(self):
        if self._rag is None:
            self._init_vector_store()
        return self._rag

    @property
    def graph(self):
        return self._graph

    @property
    def profile(self):
        return self._profile

    def learn_from_conversation(self, messages: list[dict]) -> dict:
        if not messages or not self._llm:
            return {"extracted": 0, "entities": 0}
        text = "\n".join(
            f"{m.get('role', 'user')}: {m.get('content', '')}"
            for m in messages[-10:]
        )
        return self._extract_and_store(text, source="conversation")

    def _extract_and_store(self, text: str, source: str = "conversation") -> dict:
        entities = self._extract_entities(text)
        entity_names = []
        for ent in entities:
            existing = self._graph["entities"].get(ent["name"])
            if existing:
                existing["mentions"] += 1
                existing["last_seen"] = _now()
                for k, v in ent.get("attributes", {}).items():
                    existing.setdefault("attributes", {})[k] = v
            else:
                ent["mentions"] = 1
                ent["last_seen"] = _now()
                self._graph["entities"][ent["name"]] = ent
            entity_names.append(ent["name"])

        relations = self._extract_relations(text, entity_names)
        for rel in relations:
            existing = None
            for r in self._graph["relations"]:
                if r["source"] == rel["source"] and r["target"] == rel["target"] and r["relation"] == rel["relation"]:
                    existing = r
                    break
            if existing:
                existing["weight"] += 1
            else:
                self._graph["relations"].append(rel)

        profile_updates = self._extract_profile(text)
        if profile_updates:
            self._profile.update(profile_updates)
            self._save_profile()

        self._save_graph()

        rag = self._get_rag()
        if rag:
            try:
                rag.index_text(text[:1000], source=source, collection_name="memory")
            except Exception:
                pass

        return {
            "extracted": len(entities) + len(relations),
            "entities": len(entity_names),
        }

    def _extract_entities(self, text: str) -> list[dict]:
        if not self._llm:
            return self._extract_entities_regex(text)
        prompt = (
            "Extract entities (people, places, organizations, technologies, concepts) "
            "from this text. Return ONLY a JSON array of objects with 'name', 'type', 'attributes' (object).\n\n"
            f"Text: {text[:2000]}"
        )
        try:
            resp = self._llm(prompt)
            return self._parse_json_list(resp)
        except Exception:
            return self._extract_entities_regex(text)

    @staticmethod
    def _extract_entities_regex(text: str) -> list[dict]:
        entities = []
        patterns = [
            r'\b([A-Z][a-z]+(?: [A-Z][a-z]+)*)\b',
        ]
        seen = set()
        for pat in patterns:
            for match in re.finditer(pat, text):
                name = match.group(1)
                if name not in seen and len(name) > 2:
                    seen.add(name)
                    entities.append({"name": name, "type": "concept", "attributes": {}})
        return entities[:20]

    def _extract_relations(self, text: str, entity_names: list[str]) -> list[dict]:
        if len(entity_names) < 2 or not self._llm:
            return []
        prompt = (
            "Extract relationships between these entities from the text. "
            "Return ONLY a JSON array of objects with 'source', 'target', 'relation'.\n\n"
            f"Entities: {', '.join(entity_names[:10])}\n"
            f"Text: {text[:2000]}"
        )
        try:
            resp = self._llm(prompt)
            return self._parse_json_list(resp)
        except Exception:
            return []

    def _extract_profile(self, text: str) -> dict:
        if not self._llm:
            return {}
        prompt = (
            "Extract user profile information from this text. Look for: name, location, job, "
            "interests, preferences, skills, goals. Return ONLY a JSON object (can be empty).\n\n"
            f"Text: {text[:2000]}"
        )
        try:
            resp = self._llm(prompt)
            data = json.loads(resp)
            if isinstance(data, dict):
                return {k: v for k, v in data.items() if v}
        except Exception:
            pass
        return {}

    @staticmethod
    def _parse_json_list(text: str) -> list[dict]:
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0]
        text = text.strip()
        if text.startswith("["):
            return json.loads(text)
        match = re.search(r"\[.*?\]", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        return []

    def remember(self, content: str, importance: float = 1.0) -> dict:
        return self._extract_and_store(content, source="explicit")

    def recall(self, query: str, n: int = 5) -> list[dict]:
        results = []
        seen = set()
        rag = self._get_rag()
        if rag:
            try:
                search = rag.query(query, n, "memory")
                for chunk in search.chunks:
                    key = chunk.text[:100]
                    if key not in seen:
                        seen.add(key)
                        results.append({
                            "content": chunk.text[:500],
                            "score": chunk.metadata.get("score", ""),
                            "source": chunk.metadata.get("source", "memory"),
                        })
            except Exception as e:
                logger.warning("Vector recall failed: %s", e)

        graph_results = self._query_graph(query, n)
        for gr in graph_results:
            key = gr["content"][:100]
            if key not in seen:
                seen.add(key)
                results.append(gr)

        return results[:n]

    def _query_graph(self, query: str, n: int) -> list[dict]:
        query_lower = query.lower()
        results = []
        for name, ent in self._graph.get("entities", {}).items():
            if any(q in name.lower() or q in ent.get("type", "").lower() for q in query_lower.split()):
                results.append({
                    "content": f"Entity: {name} ({ent.get('type', 'concept')}) — mentioned {ent.get('mentions', 1)} times",
                    "score": "0.8",
                    "source": "knowledge_graph",
                })
        for rel in self._graph.get("relations", []):
            if any(q in rel["source"].lower() or q in rel["target"].lower() or q in rel["relation"].lower() for q in query_lower.split()):
                results.append({
                    "content": f"Relation: {rel['source']} —[{rel['relation']}]→ {rel['target']} (weight: {rel.get('weight', 1)})",
                    "score": "0.7",
                    "source": "knowledge_graph",
                })
        return results[:n]

    def get_user_profile(self) -> dict:
        return dict(self._profile)

    def get_knowledge_summary(self) -> str:
        entities = self._graph.get("entities", {})
        relations = self._graph.get("relations", [])
        if not entities and not relations:
            return "No knowledge stored yet."
        lines = [f"Entities ({len(entities)}):"]
        for name, ent in sorted(entities.items(), key=lambda x: -x[1].get("mentions", 1))[:20]:
            lines.append(f"  - {name} ({ent.get('type', 'concept')}) x{ent.get('mentions', 1)}")
        if relations:
            lines.append(f"\nRelations ({len(relations)}):")
            for rel in relations[:15]:
                lines.append(f"  - {rel['source']} → {rel['relation']} → {rel['target']}")
        return "\n".join(lines)


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
