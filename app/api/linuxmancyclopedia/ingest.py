#! /usr/bin/env python3
"""Ingest Debian/Ubuntu man pages and TLDR snippets into Qdrant."""

from __future__ import annotations

import argparse
import gzip
import os
import unicodedata
import uuid
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterator, List

import re

from qdrant_client import QdrantClient
from qdrant_client.http import exceptions as qdrant_exceptions
from qdrant_client.http import models as qmodels
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

MODEL_NAME = "Snowflake/snowflake-arctic-embed-m-v2.0"
UUID_NAMESPACE = uuid.uuid5(uuid.NAMESPACE_URL, "linux-explained/vector-docs")

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_MAN_ROOT = (
    REPO_ROOT
    / "app"
    / "api"
    / "linuxmancyclopedia"
    / "manpage_dump"
    / "debs"
    / "extracted"
    / "usr"
    / "share"
    / "man"
)
DEFAULT_TLDR_ROOT = REPO_ROOT / "data" / "tldr"

SECTION_ALIASES: Dict[str, set[str]] = {
    "NAME": {
        "NAME",
        "NOMBRE",
        "NOM",
        "NOME",
        "BEZEICHNUNG",
        "НАЗВАНИЕ",
        "名称",
    },
    "SYNOPSIS": {
        "SYNOPSIS",
        "SINOPSIS",
        "SINOPSE",
        "SYNTHESE",
        "SYNTAXE",
        "ÜBERSICHT",
    },
    "DESCRIPTION": {
        "DESCRIPTION",
        "DESCRIPCIÓN",
        "DESCRIZIONE",
        "DESCRIÇÃO",
        "BESCHREIBUNG",
        "描述",
    },
    "OPTIONS": {
        "OPTIONS",
        "OPCIONES",
        "OPZIONI",
        "OPÇÕES",
        "OPTIONEN",
        "参数",
    },
}

SECTION_RE = re.compile(r"^\.(?:SH|Ss)\s+\"?([^\"\n]+)\"?.*$", re.IGNORECASE)
FORMATTING_MACRO_RE = re.compile(r"^\.(?:[A-Z]{1,2})(?:\s+.*)?$")
MAN_SECTION_SUFFIXES = {f".{idx}" for idx in range(1, 10)}


@dataclass
class ManRecord:
    language: str
    sections: Dict[str, str]
    source: str


@dataclass
class CommandDocument:
    command: str
    text: str
    languages: List[str]
    sections: List[str]
    tldr_languages: List[str]
    sources: List[str]

    def payload(self) -> Dict[str, object]:
        return {
            "command": self.command,
            "languages": self.languages,
            "sections": self.sections,
            "tldr_languages": self.tldr_languages,
            "sources": self.sources,
            "document": self.text,
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Index man pages into Qdrant.")
    parser.add_argument("--man-root", type=Path, default=DEFAULT_MAN_ROOT)
    parser.add_argument("--tldr-root", type=Path, default=DEFAULT_TLDR_ROOT)
    parser.add_argument(
        "--collection",
        type=str,
        default=os.getenv("QDRANT_COLLECTION", "linux_commands"),
    )
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument(
        "--device",
        type=str,
        default=os.getenv("EMBEDDING_DEVICE", "cpu"),
    )
    parser.add_argument("--qdrant-url", type=str, default=os.getenv("QDRANT_URL"))
    parser.add_argument("--qdrant-host", type=str, default=os.getenv("QDRANT_HOST", "localhost"))
    parser.add_argument("--qdrant-port", type=int, default=int(os.getenv("QDRANT_PORT", "6333")))
    parser.add_argument("--qdrant-api-key", type=str, default=os.getenv("QDRANT_API_KEY"))
    parser.add_argument("--timeout", type=int, default=int(os.getenv("QDRANT_TIMEOUT", "60")))
    return parser.parse_args()


def ensure_paths(man_root: Path, tldr_root: Path) -> None:
    if not man_root.exists():
        raise FileNotFoundError(f"Man page root not found: {man_root}")
    if not tldr_root.exists():
        raise FileNotFoundError(f"TLDR root not found: {tldr_root}")


def discover_man_files(man_root: Path) -> Iterator[Path]:
    for path in man_root.rglob("*"):
        if path.is_file() and looks_like_man_page(path):
            yield path


def looks_like_man_page(path: Path) -> bool:
    name = path.name
    if name.endswith(".gz"):
        name = name[:-3]
    if "." not in name:
        return False
    suffix = "." + name.split(".")[-1]
    return suffix in MAN_SECTION_SUFFIXES


def detect_language(path: Path, root: Path) -> str:
    rel = path.relative_to(root)
    first = rel.parts[0]
    return "en" if first.startswith("man") else first


def command_from_path(path: Path) -> str:
    name = path.name
    if name.endswith(".gz"):
        name = name[:-3]
    if "." not in name:
        return ""
    return name.rsplit(".", 1)[0].lower()


def read_man_file(path: Path) -> str:
    if path.suffix == ".gz":
        with gzip.open(path, "rt", encoding="utf-8", errors="ignore") as handle:
            return handle.read()
    return path.read_text(encoding="utf-8", errors="ignore")


def strip_formatting(line: str) -> str:
    line = line.replace("\\-", "-")
    line = re.sub(r"\\f[PRBI]", "", line)
    line = re.sub(r"\\s-?\d+", "", line)
    return line.strip()


def normalize_header(raw: str) -> str | None:
    ascii_text = (
        unicodedata.normalize("NFKD", raw)
        .encode("ascii", "ignore")
        .decode("ascii")
        .upper()
        .strip()
    )
    for canonical, aliases in SECTION_ALIASES.items():
        if ascii_text in aliases:
            return canonical
    return None


def extract_sections(text: str) -> Dict[str, str]:
    sections: Dict[str, List[str]] = defaultdict(list)
    current: str | None = None
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        match = SECTION_RE.match(line)
        if match:
            header = normalize_header(match.group(1))
            current = header
            continue
        if current is None:
            continue
        if line.startswith("."):
            cleaned = _render_macro_line(line)
        else:
            cleaned = strip_formatting(line)
        if cleaned:
            sections[current].append(cleaned)
    return {key: "\n".join(values).strip() for key, values in sections.items() if values}


def _render_macro_line(line: str) -> str:
    if not FORMATTING_MACRO_RE.match(line):
        return strip_formatting(line)
    parts = line.split(maxsplit=1)
    macro = parts[0][1:].upper()
    value = strip_formatting(parts[1]) if len(parts) > 1 else ""
    if macro in {"B", "I", "IR", "SM", "SB"}:
        return value
    if macro in {"BR", "PP", "P", "LP", "HP", "IP", "TP"}:
        return ""
    return value


def merge_sections(primary: Dict[str, str], incoming: Dict[str, str]) -> Dict[str, str]:
    merged = dict(primary)
    for key, value in incoming.items():
        if not value:
            continue
        if key not in merged or len(value) > len(merged[key]):
            merged[key] = value
    return merged


def score_sections(sections: Dict[str, str]) -> int:
    return sum(len(text) for text in sections.values())


def parse_tldr_file(path: Path) -> str | None:
    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    if not lines:
        return None
    summary: List[str] = []
    examples: List[str] = []
    current_desc: str | None = None
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# "):
            continue
        if stripped.startswith(">"):
            summary.append(stripped.lstrip(">").strip())
            continue
        if stripped.startswith("- "):
            current_desc = stripped[2:].strip()
            continue
        if stripped.startswith("`") and stripped.endswith("`"):
            command_text = stripped.strip("`").strip()
            if current_desc:
                examples.append(f"- {current_desc}\n  Example: {command_text}")
            else:
                examples.append(f"- Example:\n  {command_text}")
            current_desc = None
    if not summary and not examples:
        return None
    parts = []
    if summary:
        parts.append("Summary: " + " ".join(summary))
    if examples:
        parts.append("Examples:\n" + "\n".join(examples))
    return "\n\n".join(parts).strip()


def load_tldr_corpus(tldr_root: Path) -> Dict[str, List[Dict[str, str]]]:
    datasets: Dict[str, List[Dict[str, str]]] = defaultdict(list)
    variant_dirs = [tldr_root / "pages"]
    variant_dirs.extend(sorted(tldr_root.glob("pages.*")))
    for directory in variant_dirs:
        if not directory.exists():
            continue
        lang = "en" if directory.name == "pages" else directory.name.split(".", 1)[1]
        for md_file in directory.rglob("*.md"):
            content = parse_tldr_file(md_file)
            if not content:
                continue
            datasets[md_file.stem].append(
                {
                    "language": lang,
                    "content": content,
                    "source": str(md_file.relative_to(REPO_ROOT)),
                    "category": md_file.parent.name,
                }
            )
    return datasets


def format_man_block(language: str, record: ManRecord) -> tuple[str, List[str]]:
    label = "English" if language == "en" else language
    sections_present = []
    section_lines = [f"### Man Page ({label})"]
    for section_name in ("NAME", "SYNOPSIS", "DESCRIPTION", "OPTIONS"):
        value = record.sections.get(section_name)
        if value:
            sections_present.append(section_name)
            section_lines.append(f"{section_name.title()}:\n{value}")
    return "\n\n".join(section_lines).strip(), sections_present


def build_documents(
    man_records: Dict[str, Dict[str, ManRecord]],
    tldr_records: Dict[str, List[Dict[str, str]]],
) -> List[CommandDocument]:
    commands = sorted(set(man_records.keys()) | set(tldr_records.keys()))
    documents: List[CommandDocument] = []
    for command in commands:
        man_by_lang = man_records.get(command, {})
        tldr_entries = tldr_records.get(command, [])
        parts: List[str] = []
        languages: List[str] = []
        sections_present: List[str] = []
        sources: List[str] = []
        english = man_by_lang.get("en")
        if english:
            block, block_sections = format_man_block("en", english)
            parts.append(block)
            languages.append("en")
            sections_present.extend(block_sections)
            sources.append(english.source)
        for lang, record in sorted(man_by_lang.items()):
            if lang == "en":
                continue
            block, block_sections = format_man_block(lang, record)
            parts.append(block)
            languages.append(lang)
            sections_present.extend(block_sections)
            sources.append(record.source)
        if tldr_entries:
            tldr_parts = ["### TLDR Examples"]
            tldr_languages: List[str] = []
            for entry in sorted(tldr_entries, key=lambda item: (item["language"], item["category"])):
                tldr_languages.append(entry["language"])
                tldr_parts.append(
                    f"[{entry['language']} • {entry['category']}]"
                    f"\n{entry['content']}"
                )
                sources.append(entry["source"])
            parts.append("\n\n".join(tldr_parts).strip())
        else:
            tldr_languages = []
        if not parts:
            continue
        documents.append(
            CommandDocument(
                command=command,
                text="\n\n".join(parts),
                languages=languages,
                sections=sorted(set(sections_present)),
                tldr_languages=sorted(set(tldr_languages)),
                sources=sources,
            )
        )
    return documents


def ensure_collection(client: QdrantClient, collection: str, dim: int) -> None:
    try:
        info = client.get_collection(collection)
        existing_dim = info.config.params.vectors.size if isinstance(
            info.config.params.vectors, qmodels.VectorParams
        ) else info.config.params.vectors["size"]
        if existing_dim != dim:
            raise RuntimeError(
                f"Collection '{collection}' exists with vector size {existing_dim}, expected {dim}."
            )
        return
    except qdrant_exceptions.UnexpectedResponse:
        pass
    client.create_collection(
        collection_name=collection,
        vectors_config=qmodels.VectorParams(size=dim, distance=qmodels.Distance.COSINE),
        optimizers_config=qmodels.OptimizersConfigDiff(
            indexing_threshold=20000,
            default_segment_number=2,
        ),
        on_disk_payload=True,
    )


def embed_documents(
    model: SentenceTransformer,
    documents: List[CommandDocument],
    batch_size: int,
) -> List[List[float]]:
    vectors: List[List[float]] = []
    iterator = range(0, len(documents), batch_size)
    for start in tqdm(iterator, desc="Embedding", unit="batch"):
        batch = documents[start : start + batch_size]
        embeddings = model.encode(
            [doc.text for doc in batch],
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        for vector in embeddings:
            vectors.append(vector.tolist())
    return vectors


def upsert_documents(
    client: QdrantClient,
    collection: str,
    documents: List[CommandDocument],
    vectors: List[List[float]],
    batch_size: int,
) -> None:
    total = len(documents)
    for start in tqdm(range(0, total, batch_size), desc="Upserting", unit="batch"):
        end = start + batch_size
        batch_docs = documents[start:end]
        batch_vectors = vectors[start:end]
        points = [
            qmodels.PointStruct(
                id=str(uuid.uuid5(UUID_NAMESPACE, doc.command)),
                vector=vector,
                payload=doc.payload(),
            )
            for doc, vector in zip(batch_docs, batch_vectors, strict=False)
        ]
        client.upsert(collection_name=collection, wait=True, points=points)


def build_qdrant_client(args: argparse.Namespace) -> QdrantClient:
    if args.qdrant_url:
        return QdrantClient(
            url=args.qdrant_url,
            api_key=args.qdrant_api_key,
            timeout=args.timeout,
        )
    return QdrantClient(
        host=args.qdrant_host,
        port=args.qdrant_port,
        api_key=args.qdrant_api_key,
        timeout=args.timeout,
    )


def main() -> None:
    args = parse_args()
    ensure_paths(args.man_root, args.tldr_root)

    man_index: Dict[str, Dict[str, ManRecord]] = defaultdict(dict)
    print(f"Scanning man pages under {args.man_root} ...")
    man_file_count = 0
    for file_path in tqdm(discover_man_files(args.man_root), desc="Parsing man pages", unit="file"):
        man_file_count += 1
        language = detect_language(file_path, args.man_root)
        command = command_from_path(file_path)
        if not command:
            continue
        text = read_man_file(file_path)
        sections = extract_sections(text)
        if not sections:
            sections = {"DESCRIPTION": strip_formatting(text)}
        record = man_index[command].get(language)
        rel_path = str(file_path.relative_to(REPO_ROOT))
        if record:
            merged = merge_sections(record.sections, sections)
            if score_sections(merged) >= score_sections(record.sections):
                man_index[command][language] = ManRecord(language, merged, rel_path)
        else:
            man_index[command][language] = ManRecord(language, sections, rel_path)

    print(f"Indexed {len(man_index)} unique commands from {man_file_count} man files.")

    print(f"Loading TLDR corpus from {args.tldr_root} ...")
    tldr_index = load_tldr_corpus(args.tldr_root)
    tldr_entry_count = sum(len(entries) for entries in tldr_index.values())
    print(f"Loaded {tldr_entry_count} TLDR entries covering {len(tldr_index)} commands.")

    documents = build_documents(man_index, tldr_index)
    if not documents:
        print("No documents to ingest. Exiting.")
        return
    print(f"Prepared {len(documents)} merged command documents.")

    print(f"Loading embedding model '{MODEL_NAME}' on device {args.device} ...")
    model = SentenceTransformer(MODEL_NAME, device=args.device, trust_remote_code=True)
    vector_dim = model.get_sentence_embedding_dimension()

    client = build_qdrant_client(args)
    ensure_collection(client, args.collection, vector_dim)

    vectors = embed_documents(model, documents, args.batch_size)
    upsert_documents(client, args.collection, documents, vectors, args.batch_size)

    print(f"Ingestion complete. {len(documents)} documents upserted into '{args.collection}'.")


if __name__ == "__main__":
    main()

