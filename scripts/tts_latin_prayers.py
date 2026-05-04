"""Synthesize Latin prayer lines from src/data/prayers-latin.json using Coqui TTS.

Default model is Italian VITS (single speaker, no reference audio). Ecclesiastical
Latin is closer to Italian phonetics than English-only models; override with
--model and optional --language / --speaker for multilingual models (see Coqui docs).

Usage (from repo root, with venv activated):
  python scripts/tts_latin_prayers.py
  python scripts/tts_latin_prayers.py --keys sign-of-the-cross our-father
  python scripts/tts_latin_prayers.py --model "tts_models/multilingual/multi-dataset/xtts_v2" --language en --speaker "Craig Gutsy"
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PRAYERS = ROOT / "src/data/prayers-latin.json"
DEFAULT_OUT = ROOT / "public/audio/latin"
# Single-speaker Italian VITS: no speaker_wav; reasonable for Church Latin.
DEFAULT_MODEL = "tts_models/it/mai_female/vits"


def _normalize_for_tts(text: str) -> str:
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def main() -> int:
    parser = argparse.ArgumentParser(description="TTS for prayers in prayers-latin.json")
    parser.add_argument(
        "--prayers",
        type=Path,
        default=DEFAULT_PRAYERS,
        help="Path to prayers-latin.json",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUT,
        help="Directory for generated .wav files",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help="Coqui model name (see `tts --list_models`)",
    )
    parser.add_argument(
        "--keys",
        nargs="*",
        help="Only these prayer ids; default is all keys in the JSON",
    )
    parser.add_argument(
        "--language",
        default=None,
        help="For multilingual models (e.g. xtts_v2): language code",
    )
    parser.add_argument(
        "--speaker",
        default=None,
        help="For multi-speaker models: built-in speaker name",
    )
    parser.add_argument(
        "--speaker-wav",
        type=Path,
        default=None,
        help="Reference wav for voice cloning (multilingual models)",
    )
    args = parser.parse_args()

    try:
        import torch
        from TTS.api import TTS
    except ImportError:
        print(
            "Missing dependency. Create a venv and run:\n"
            "  pip install -r requirements-tts.txt",
            file=sys.stderr,
        )
        return 1

    if not args.prayers.is_file():
        print(f"Not found: {args.prayers}", file=sys.stderr)
        return 1

    data = json.loads(args.prayers.read_text(encoding="utf-8"))
    keys = list(args.keys) if args.keys else sorted(data.keys())

    device = "cuda" if torch.cuda.is_available() else "cpu"
    tts = TTS(args.model).to(device)

    args.output_dir.mkdir(parents=True, exist_ok=True)

    for key in keys:
        if key not in data:
            print(f"Unknown key (skipped): {key}", file=sys.stderr)
            continue
        entry = data[key]
        text = entry.get("text") if isinstance(entry, dict) else None
        if not text:
            print(f"No text for key (skipped): {key}", file=sys.stderr)
            continue
        text = _normalize_for_tts(text)
        out_path = args.output_dir / f"{key}.wav"
        kwargs: dict = {"text": text, "file_path": str(out_path)}
        if args.language is not None:
            kwargs["language"] = args.language
        if args.speaker is not None:
            kwargs["speaker"] = args.speaker
        if args.speaker_wav is not None:
            kwargs["speaker_wav"] = str(args.speaker_wav)

        tts.tts_to_file(**kwargs)
        print(out_path)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
