"""RAG — Retrieval-Augmented Generation with ChromaDB + Ollama embeddings."""

import logging
import os
import re
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class Chunk:
    text: str
    metadata: dict = field(default_factory=dict)
    embedding: list[float] | None = None


@dataclass
class SearchResult:
    chunks: list[Chunk] = field(default_factory=list)
    query: str = ""
    error: str | None = None


class RAGService:
    def __init__(self, persist_dir: str | None = None):
        self._persist_dir = persist_dir or os.path.join(
            os.path.dirname(__file__), "..", "..", "data", "chromadb"
        )
        self._collection = None
        self._client = None
        self._embed_model = "nomic-embed-text"

    def _get_client(self):
        if self._client is not None:
            return self._client
        import chromadb
        self._client = chromadb.PersistentClient(path=self._persist_dir)
        return self._client

    def _get_collection(self, name: str = "documents"):
        if self._collection is not None:
            return self._collection
        client = self._get_client()
        try:
            self._collection = client.get_collection(name)
        except Exception:
            self._collection = client.create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"},
            )
        return self._collection

    def embed(self, texts: list[str]) -> list[list[float]]:
        import httpx
        try:
            resp = httpx.post(
                "http://localhost:11434/api/embed",
                json={"model": self._embed_model, "input": texts},
                timeout=30.0,
            )
            resp.raise_for_status()
            data = resp.json()
            embeddings = data.get("embeddings", [])
            if not embeddings:
                raise ValueError("No embeddings returned")
            return embeddings
        except Exception as e:
            logger.warning("Ollama embedding failed: %s. Using fallback.", e)
            return self._embed_fallback(texts)

    _FALLBACK_MODEL = None

    @staticmethod
    def _embed_fallback(texts: list[str]) -> list[list[float]]:
        try:
            if RAGService._FALLBACK_MODEL is None:
                from sentence_transformers import SentenceTransformer
                RAGService._FALLBACK_MODEL = SentenceTransformer(
                    "paraphrase-multilingual-MiniLM-L12-v2",
                    device="cpu",
                )
            emb = RAGService._FALLBACK_MODEL.encode(texts, normalize_embeddings=True)
            return emb.tolist()
        except ImportError:
            pass
        import hashlib
        results = []
        for t in texts:
            h = hashlib.sha256(t.encode()).digest()
            vec = [b / 255.0 for b in h[:384]]
            results.append(vec)
        return results

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 512, overlap: int = 64) -> list[str]:
        paragraphs = re.split(r"\n\s*\n", text)
        chunks = []
        current = ""
        for p in paragraphs:
            p = p.strip()
            if not p:
                continue
            if len(current) + len(p) < chunk_size:
                current = (current + "\n\n" + p).strip()
            else:
                if current:
                    chunks.append(current)
                if len(p) > chunk_size:
                    sentences = re.split(r"(?<=[.?!])\s+", p)
                    current = ""
                    for s in sentences:
                        if len(current) + len(s) < chunk_size:
                            current = (current + " " + s).strip()
                        else:
                            if current:
                                chunks.append(current)
                            current = s
                else:
                    current = p
        if current:
            chunks.append(current)
        if overlap > 0 and len(chunks) > 1:
            overlapped = []
            for i, c in enumerate(chunks):
                if i > 0:
                    prev_tail = chunks[i - 1][-overlap:]
                    c = prev_tail + " " + c
                overlapped.append(c)
            chunks = overlapped
        return chunks

    def index_document(
        self,
        file_path: str,
        collection_name: str = "documents",
        chunk_size: int = 512,
        overlap: int = 64,
    ) -> dict:
        from jarvis.document_service import DocumentReader
        ext = os.path.splitext(file_path)[1].lower()
        reader = DocumentReader()
        if ext == ".pdf":
            doc = reader.read_pdf(file_path)
        elif ext == ".docx":
            doc = reader.read_docx(file_path)
        elif ext in (".xlsx", ".xls"):
            doc = reader.read_xlsx(file_path)
        else:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    doc_text = f.read()
                from dataclasses import dataclass
                @dataclass
                class SimpleDoc:
                    text: str
                    pages: int = 0
                    file_path: str = ""
                    file_type: str = ""
                    size_bytes: int = 0
                doc = SimpleDoc(text=doc_text, file_path=file_path)
            except Exception as e:
                return {"success": False, "error": f"Cannot read {file_path}: {e}"}
        chunks = self.chunk_text(doc.text, chunk_size, overlap)
        if not chunks:
            return {"success": False, "error": "No text found in document"}
        embeddings = self.embed(chunks)
        ids = [f"{os.path.basename(file_path)}_{i}" for i in range(len(chunks))]
        metadatas = [
            {"source": file_path, "chunk": i, "total": len(chunks)}
            for i in range(len(chunks))
        ]
        collection = self._get_collection(collection_name)
        try:
            existing_ids = set(collection.get(ids=ids, include=[])["ids"])
            new_ids = []
            new_embeddings = []
            new_docs = []
            new_metas = []
            for i, cid in enumerate(ids):
                if cid not in existing_ids:
                    new_ids.append(cid)
                    new_embeddings.append(embeddings[i])
                    new_docs.append(chunks[i])
                    new_metas.append(metadatas[i])
            if new_ids:
                collection.add(
                    ids=new_ids,
                    embeddings=new_embeddings,
                    documents=new_docs,
                    metadatas=new_metas,
                )
        except Exception:
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=chunks,
                metadatas=metadatas,
            )
        logger.info("Indexed %d chunks from %s", len(chunks), file_path)
        return {
            "success": True,
            "chunks": len(chunks),
            "file": file_path,
        }

    def index_text(
        self,
        text: str,
        source: str = "memory",
        collection_name: str = "documents",
    ) -> dict:
        chunks = self.chunk_text(text, 256, 32)
        if not chunks:
            return {"success": False, "error": "No text to index"}
        embeddings = self.embed(chunks)
        import hashlib
        ids = [f"{source}_{hashlib.md5(c.encode()).hexdigest()[:8]}" for c in chunks]
        metadatas = [{"source": source, "chunk": i} for i in range(len(chunks))]
        collection = self._get_collection(collection_name)
        try:
            existing = set(collection.get(ids=ids, include=[])["ids"])
        except Exception:
            existing = set()
        new_ids = [ids[i] for i in range(len(ids)) if ids[i] not in existing]
        if not new_ids:
            return {"success": True, "chunks": 0}
        collection.add(
            ids=new_ids,
            embeddings=[embeddings[i] for i in range(len(ids)) if ids[i] in new_ids],
            documents=[chunks[i] for i in range(len(ids)) if ids[i] in new_ids],
            metadatas=[metadatas[i] for i in range(len(ids)) if ids[i] in new_ids],
        )
        return {"success": True, "chunks": len(new_ids)}

    def query(
        self,
        query_text: str,
        n_results: int = 5,
        collection_name: str = "documents",
    ) -> SearchResult:
        result = SearchResult(query=query_text)
        try:
            collection = self._get_collection(collection_name)
            q_embedding = self.embed([query_text])
            if not q_embedding:
                result.error = "Failed to generate query embedding"
                return result
            resp = collection.query(
                query_embeddings=q_embedding,
                n_results=n_results,
                include=["documents", "metadatas", "distances"],
            )
            docs = resp.get("documents", [[]])[0]
            metas = resp.get("metadatas", [[]])[0]
            dists = resp.get("distances", [[]])[0]
            for i in range(len(docs)):
                result.chunks.append(Chunk(
                    text=docs[i],
                    metadata={
                        **(metas[i] if i < len(metas) else {}),
                        "score": f"{1 - dists[i]:.3f}" if i < len(dists) else "",
                    },
                ))
        except Exception as e:
            result.error = str(e)
            logger.exception("RAG query failed")
        return result

    def query_with_context(
        self,
        query_text: str,
        n_results: int = 5,
        collection_name: str = "documents",
        system_prompt: str | None = None,
    ) -> dict:
        search = self.query(query_text, n_results, collection_name)
        if search.error:
            return {"success": False, "error": search.error}
        if not search.chunks:
            return {"success": False, "error": "No relevant documents found"}
        context = "\n\n".join(
            f"[{i + 1}] (fonte: {c.metadata.get('source', '?')}, "
            f"relevância: {c.metadata.get('score', '?')})\n{c.text}"
            for i, c in enumerate(search.chunks)
        )
        return {
            "success": True,
            "context": context,
            "chunks": [
                {
                    "text": c.text,
                    "source": c.metadata.get("source", ""),
                    "score": c.metadata.get("score", ""),
                }
                for c in search.chunks
            ],
            "query": query_text,
        }

    def list_indexed_documents(self, collection_name: str = "documents") -> list[dict]:
        try:
            collection = self._get_collection(collection_name)
            data = collection.get(include=["metadatas"])
            sources = {}
            for meta in data.get("metadatas", []):
                src = meta.get("source", "unknown")
                if src not in sources:
                    sources[src] = {"file": src, "chunks": 0}
                sources[src]["chunks"] += 1
            return sorted(sources.values(), key=lambda x: x["file"])
        except Exception as e:
            logger.warning("Failed to list indexed docs: %s", e)
            return []

    def delete_document(self, file_path: str, collection_name: str = "documents") -> bool:
        try:
            collection = self._get_collection(collection_name)
            data = collection.get(include=["metadatas"])
            to_delete = [
                data["ids"][i]
                for i, meta in enumerate(data.get("metadatas", []))
                if meta.get("source") == file_path
            ]
            if to_delete:
                collection.delete(ids=to_delete)
            return True
        except Exception as e:
            logger.warning("Failed to delete doc %s: %s", file_path, e)
            return False

    @property
    def embed_model(self) -> str:
        return self._embed_model

    @embed_model.setter
    def embed_model(self, model: str) -> None:
        self._embed_model = model
