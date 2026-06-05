"""Standalone knowledge graph builder — nodes, edges, JSON export."""

import json
from dataclasses import dataclass, field

from jarvis.database import Database


@dataclass
class GraphNode:
    id: str = ""
    label: str = ""
    folder: str = ""
    tags: list[str] = field(default_factory=list)
    link_count: int = 0


@dataclass
class GraphEdge:
    source: str = ""
    target: str = ""
    link_type: str = "wikilink"


@dataclass
class GraphData:
    nodes: list[GraphNode] = field(default_factory=list)
    edges: list[GraphEdge] = field(default_factory=list)


def _parse_tags(tags_str: str) -> list[str]:
    if not tags_str:
        return []
    return [t.strip() for t in tags_str.split(",") if t.strip()]


class GraphBuilder:
    def __init__(self, db: Database):
        self._db = db

    def build(self) -> GraphData:
        note_rows = self._db.fetchall(
            "SELECT id, title, folder, tags FROM notes ORDER BY title"
        )
        edge_rows = self._db.fetchall(
            "SELECT source_id, target_id, link_type FROM note_links"
        )

        link_count: dict[str, int] = {}
        for e in edge_rows:
            link_count[e["source_id"]] = link_count.get(e["source_id"], 0) + 1
            link_count[e["target_id"]] = link_count.get(e["target_id"], 0) + 1

        node_ids: set[str] = set()
        nodes: list[GraphNode] = []
        for r in note_rows:
            nid = r["id"]
            node_ids.add(nid)
            tags = _parse_tags(r["tags"])
            nodes.append(GraphNode(
                id=nid,
                label=r["title"],
                folder=r["folder"],
                tags=tags,
                link_count=link_count.get(nid, 0),
            ))

        edges: list[GraphEdge] = []
        for e in edge_rows:
            if e["source_id"] in node_ids and e["target_id"] in node_ids:
                edges.append(GraphEdge(
                    source=e["source_id"],
                    target=e["target_id"],
                    link_type=e["link_type"],
                ))

        return GraphData(nodes=nodes, edges=edges)

    def build_json(self) -> str:
        graph = self.build()

        nodes_list = []
        for n in graph.nodes:
            node_obj: dict = {
                "id": n.id,
                "label": n.label,
                "folder": n.folder,
                "tags": n.tags,
                "linkCount": n.link_count,
            }
            nodes_list.append(node_obj)

        edges_list = []
        for e in graph.edges:
            edge_obj: dict = {
                "source": e.source,
                "target": e.target,
                "linkType": e.link_type,
            }
            edges_list.append(edge_obj)

        return json.dumps(
            {"nodes": nodes_list, "edges": edges_list},
            ensure_ascii=False,
        )
