from __future__ import annotations

import json
import os
import traceback

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google import genai
from google.genai import errors as genai_errors

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

PROMPT = """You are a shoe damage analysis expert. Examine this shoe photo carefully and identify ALL visible damage.

For each damage region, return:
- label: short name (e.g. "Scuff mark", "Sole separation", "Worn tread", "Stain", "Crease damage", "Tear")
- area: which part — one of "sole", "side", "heel", "top", "toe"
- severity: one of "minor", "moderate", "severe"
- description: one sentence describing the damage
- bbox: bounding box as [x, y, width, height] in PERCENTAGES of image dimensions (0-100). Be as accurate as possible.

Return a JSON object: {"damages": [...]}
If no shoe or no damage, return {"damages": []}.
Valid JSON only — no markdown, no explanation."""


@app.post("/api/analyze-shoe")
async def analyze_shoe(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        mime = file.content_type or "image/jpeg"

        image_part = genai.types.Part.from_bytes(data=contents, mime_type=mime)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[PROMPT, image_part],
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=1024,
            ),
        )

        raw = response.text or '{"damages": []}'
        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            result = {"damages": []}

        return result

    except genai_errors.ClientError as e:
        print(traceback.format_exc())
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            return JSONResponse(
                status_code=429,
                content={"error": "Gemini rate limit exceeded. Wait a moment and try again."},
            )
        return JSONResponse(
            status_code=502,
            content={"error": f"Gemini API error: {e}"},
        )
    except Exception as e:
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("scan:app", host="0.0.0.0", port=3000, reload=True)
