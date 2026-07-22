"""OpenAI-compatible MLC stub for local demo (no GPU / no multi-GB weights).

Production can point MLC_BASE_URL at a real mlc-llm serve instance.
Gate analyze still uses listing-rules; this stub proves the compose topology.
"""

from __future__ import annotations

import time
from typing import Any

from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="MLC stub", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "engine": "mlc-stub"}


@app.get("/v1/models")
def models() -> dict[str, Any]:
    return {
        "object": "list",
        "data": [
            {
                "id": "gemma-2-2b-it-q4f16_1-MLC",
                "object": "model",
                "owned_by": "mlc-stub",
            }
        ],
    }


@app.post("/v1/chat/completions")
async def chat(body: dict[str, Any]) -> JSONResponse:
    messages = body.get("messages") or []
    last = ""
    if messages:
        last = str(messages[-1].get("content", ""))
    reply = (
        "[mlc-stub] Listing risk summary: check absolute claims, title length, "
        "description completeness, and return policy language. "
        f"Input chars={len(last)}."
    )
    time.sleep(0.05)
    return JSONResponse(
        {
            "id": "chatcmpl-stub",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": body.get("model") or "gemma-2-2b-it-q4f16_1-MLC",
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": reply},
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": max(1, len(last) // 4),
                "completion_tokens": max(1, len(reply) // 4),
                "total_tokens": max(2, (len(last) + len(reply)) // 4),
            },
        }
    )
