#!/usr/bin/env python3
import json
import os
import re
import sys
from pathlib import Path

try:
    from mlx_lm import load, generate
    HAS_MLX = True
except Exception:
    HAS_MLX = False

COMMON_MISSPELLINGS = {
    "teh": "the",
    "recieve": "receive",
    "seperate": "separate",
    "occured": "occurred",
    "definately": "definitely",
    "wierd": "weird",
    "mispell": "misspell",
    "enviroment": "environment",
    "comit": "commit",
    "acheive": "achieve",
    "succes": "success",
    "succesful": "successful",
    "langauge": "language",
    "foriegn": "foreign",
    "maintainance": "maintenance",
    "intial": "initial",
    "adress": "address",
    "goverment": "government",
    "neccessary": "necessary",
    "seach": "search",
    "wether": "whether",
    "tihs": "this",
    "thier": "their",
    "becuase": "because",
}

COMMON_CORRECTIONS = {
    "dont": "don't",
    "cant": "can't",
    "wont": "won't",
    "im": "I'm",
    "ive": "I've",
    "youve": "you've",
    "its": "it's",
    "thats": "that's",
    "whats": "what's",
    "didnt": "didn't",
    "isnt": "isn't",
    "arent": "aren't",
    "wasnt": "wasn't",
    "couldnt": "couldn't",
    "shouldnt": "shouldn't",
    "wouldnt": "wouldn't",
    "doesnt": "doesn't",
    "havent": "haven't",
    "dont": "don't",
}

WORD_RE = re.compile(r"\b[\w']+\b")


def normalize_word(word: str) -> str:
    return word.lower().strip("'\"")


def parse_model_response(raw_response: str, fallback_text: str) -> dict:
    response = (raw_response or "").strip()
    if not response:
        return fallback_fix(fallback_text)

    try:
        parsed = json.loads(response)
        if isinstance(parsed, dict):
            return {
                "source": fallback_text,
                "corrected": parsed.get("corrected", fallback_text),
                "replacements": parsed.get("replacements", []),
                "mode": "mlx",
                "model": os.environ.get("AI_SPELL_MODEL") or os.environ.get("AI_SPELL_MODEL_PATH") or "mlx-community/SmolLM2-360M-Instruct",
            }
    except Exception:
        pass

    json_blocks = []
    start = 0
    while True:
        left = response.find("{", start)
        if left == -1:
            break
        right = response.rfind("}", left)
        if right <= left:
            break
        json_blocks.append(response[left: right + 1])
        start = right + 1

    replacements = []
    for block in json_blocks:
        try:
            value = json.loads(block)
            if isinstance(value, dict) and ("from" in value or "to" in value):
                replacements.append(
                    {"from": value.get("from", ""), "to": value.get("to", "")})
        except Exception:
            continue

    corrected = fallback_text
    corrected_match = re.search(
        r"corrected\s*[:=]\s*(.+?)(?=\s*(?:replacements|$))", response, flags=re.I | re.S)
    if corrected_match:
        corrected = corrected_match.group(1).strip().strip("\"'`\n ")

    if not corrected or corrected == "":
        corrected = fallback_text

    if not replacements:
        arrow_match = re.search(
            r"(?:^|\n)\s*([A-Za-z][A-Za-z'-]+)\s*(?:->|→|to)\s*([A-Za-z][A-Za-z'-]+)\s*(?:\n|$)", response, flags=re.I)
        if arrow_match:
            replacements.append(
                {"from": arrow_match.group(1), "to": arrow_match.group(2)})

    return {
        "source": fallback_text,
        "corrected": corrected,
        "replacements": replacements,
        "mode": "mlx",
        "model": os.environ.get("AI_SPELL_MODEL") or os.environ.get("AI_SPELL_MODEL_PATH") or "mlx-community/SmolLM2-360M-Instruct",
    }


def fallback_fix(text: str) -> dict:
    words = WORD_RE.findall(text)
    corrected = text
    replacements = []

    for word in words:
        key = normalize_word(word)
        if key in COMMON_MISSPELLINGS:
            replacement = COMMON_MISSPELLINGS[key]
            corrected = re.sub(rf"\b{re.escape(word)}\b",
                               replacement, corrected, count=1)
            replacements.append({"from": word, "to": replacement})
            continue

        if key in COMMON_CORRECTIONS:
            replacement = COMMON_CORRECTIONS[key]
            corrected = re.sub(rf"\b{re.escape(word)}\b",
                               replacement, corrected, count=1)
            replacements.append({"from": word, "to": replacement})

    return {
        "source": text,
        "corrected": corrected,
        "replacements": replacements,
        "mode": "fallback",
        "model": None,
    }


def mlx_fix(text: str) -> dict:
    model_name = os.environ.get("AI_SPELL_MODEL") or os.environ.get(
        "AI_SPELL_MODEL_PATH") or "mlx-community/SmolLM2-360M-Instruct"

    try:
        model, tokenizer = load(model_name)
        prompt = (
            "Correct the spelling and grammar of the text below. "
            "Return only a JSON object with keys 'corrected' and 'replacements'. "
            "Use this format: {\"corrected\": \"...\", \"replacements\": [{\"from\": \"old\", \"to\": \"new\"}]}.\n\nTEXT:\n"
            f"{text}"
        )
        response = generate(model, tokenizer, prompt=prompt,
                            max_tokens=256, verbose=False)
        return parse_model_response(response, text)
    except Exception:
        return fallback_fix(text)


def main() -> int:
    raw = sys.stdin.read().strip()
    print(
        f"[ai-spell] raw length={len(raw)} has_mlx={HAS_MLX}", file=sys.stderr)

    if not raw:
        print(json.dumps({"error": "No text provided"}), file=sys.stderr)
        print(json.dumps({"error": "No text provided"}))
        return 1

    result = mlx_fix(raw) if HAS_MLX else fallback_fix(raw)
    print(
        f"[ai-spell] result mode={result.get('mode')} model={result.get('model')}", file=sys.stderr)
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
