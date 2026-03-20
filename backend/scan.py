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

LOCATIONS = [
    "Toe Box - Lateral",
    "Toe Box - Medial",
    "Heel Counter",
    "Lateral Midsole",
    "Medial Forefoot",
    "Outsole - Toe",
]

PROMPT = f"""You are a shoe damage analysis expert. Examine this shoe photo carefully.

You must ONLY inspect these 6 locations on the shoe:
{chr(10).join(f"  {i+1}. {loc}" for i, loc in enumerate(LOCATIONS))}

Damage is defined as: scratches, holes, or tears that would prompt someone to buy a new shoe.
Ignore normal wear, dirt, creasing from use, or cosmetic marks that do not affect structural integrity.

For EACH of the 6 locations, return an entry with:
- "location": the exact location name from the list above
- "damaged": true or false
- "confidence": integer 0-100, how confident you are that the damage you found IS real damage (scratches/holes/tears)
- "damage_type": one of "scratch", "hole", "tear", or null if not damaged
- "description": one sentence describing what you see at that location, or "No damage detected" if clean
- "bbox": bounding box as [x, y, width, height] in PERCENTAGES of image dimensions (0-100), pointing to that location on the shoe. If the location is not visible in the image, use null.

ALWAYS return all 6 locations even if they are not damaged or not visible.

Return a JSON object with:
- "locations": array of 6 location objects as described above
- "summary": object with keys being each location name and values being the number of distinct damage instances found there (0 if none)

Valid JSON only — no markdown, no explanation."""


@app.post("/api/analyze-shoe")
async def analyze_shoe(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        mime = file.content_type or "image/jpeg"

        image_part = genai.types.Part.from_bytes(data=contents, mime_type=mime)

        print(f"[scan] Sending {len(contents)} bytes ({mime}) to Gemini...")

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[PROMPT, image_part],
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=2048,
            ),
        )

        raw = response.text
        print(f"[scan] Gemini response text: {raw!r}")
        print(f"[scan] Finish reason: {response.candidates[0].finish_reason if response.candidates else 'no candidates'}")

        if not raw:
            return {"locations": [], "summary": {}}

        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            print(f"[scan] JSON parse failed on: {raw!r}")
            result = {"locations": [], "summary": {}}

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
