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

IMAGE_ANGLES = [
    ("front", "Front view — toe pointing at camera", "Toe Box - Lateral"),
    ("lateral", "Lateral side view — right side facing camera", "Lateral Midsole"),
    ("back", "Back view — heel facing camera", "Heel Counter"),
    ("medial", "Medial side view — left side facing camera", "Medial Forefoot"),
    ("top", "Top-down view — looking down at shoe", "Toe Box - Medial"),
    ("sole", "Sole view — shoe flipped over, sole facing camera", "Outsole - Toe"),
]

PROMPT = """You are a shoe damage detection system. You will receive 6 photos of the SAME shoe taken from different angles. Be aggressive — it is better to flag something questionable than to miss real damage.

The 6 images are provided in this order:
1. Front view (toe pointing at camera) → inspect "Toe Box - Lateral"
2. Lateral side view (right side) → inspect "Lateral Midsole"
3. Back view (heel facing camera) → inspect "Heel Counter"
4. Medial side view (left side) → inspect "Medial Forefoot"
5. Top-down view (looking down) → inspect "Toe Box - Medial"
6. Sole view (shoe flipped, sole up) → inspect "Outsole - Toe"

DAMAGE CRITERIA — flag the location as damaged if ANY of these are present:

1. Structural Damage: Any rips, tears, or holes anywhere on the shoe.
2. Surface Wear: Heavy stains, severe scuff marks, or heavy creasing in the materials.
3. Sole Degradation: Significant wear and tear on either the bottom tread (outsole) or the interior insole.
4. Missing Parts: Any missing original components, such as laces or insoles.

For each of the 6 locations return:
- "location": exact name from the list above
- "damaged": true or false
- "confidence": 0-100 (how sure you are that the damage meets the criteria above)
- "damage_type": one of "structural", "surface_wear", "sole_degradation", "missing_parts", or null if not damaged
- "description": SHORT description, max 12 words
- "bbox": bounding box around the SPECIFIC damaged area as [ymin, xmin, ymax, xmax] on a 0-1000 scale, or null if not damaged or not visible.
  IMPORTANT bbox instructions:
  - The coordinates are relative to the INDIVIDUAL image for that angle.
  - 0,0 is the top-left corner. 1000,1000 is the bottom-right corner.
  - Draw the box TIGHTLY around just the damaged area, not the entire shoe.
  - ymin < ymax and xmin < xmax always.
  - If damage covers a small scratch, the box should be small. If it covers a large tear, the box should be larger.
  - Think step by step: first locate the damage visually, then estimate its top-left and bottom-right corners.

Always return all 6 locations. Keep descriptions very short.

Return JSON: {"locations": [...], "summary": {"Toe Box - Lateral": N, "Toe Box - Medial": N, "Heel Counter": N, "Lateral Midsole": N, "Medial Forefoot": N, "Outsole - Toe": N}}
where N = number of damage instances at that location (0 if none)."""


@app.post("/api/analyze-shoe")
async def analyze_shoe(
    front: UploadFile = File(...),
    lateral: UploadFile = File(...),
    back: UploadFile = File(...),
    medial: UploadFile = File(...),
    top: UploadFile = File(...),
    sole: UploadFile = File(...),
):
    try:
        parts = []
        parts.append(PROMPT)

        for upload, (key, angle_desc, _loc) in zip(
            [front, lateral, back, medial, top, sole], IMAGE_ANGLES
        ):
            data = await upload.read()
            mime = upload.content_type or "image/jpeg"
            parts.append(f"\n--- Image {key}: {angle_desc} ---")
            parts.append(genai.types.Part.from_bytes(data=data, mime_type=mime))

        total_bytes = sum(len(p) if isinstance(p, (bytes, str)) else 0 for p in parts)
        print(f"[scan] Sending 6 images ({total_bytes} bytes text + images) to Gemini...")

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=parts,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=8192,
            ),
        )

        raw = response.text
        print(f"[scan] Gemini response: {raw!r}")
        finish = response.candidates[0].finish_reason if response.candidates else "no candidates"
        print(f"[scan] Finish reason: {finish}")

        if not raw:
            return JSONResponse(status_code=502, content={"error": "Empty response from AI"})

        if str(finish) == "FinishReason.MAX_TOKENS":
            return JSONResponse(status_code=502, content={"error": "AI response was truncated. Please try again."})

        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            print(f"[scan] JSON parse failed on: {raw!r}")
            return JSONResponse(status_code=502, content={"error": "AI returned invalid JSON. Please try again."})

        for loc in result.get("locations", []):
            bbox = loc.get("bbox")
            if bbox and len(bbox) == 4:
                ymin, xmin, ymax, xmax = bbox
                loc["bbox"] = [
                    xmin / 10.0,
                    ymin / 10.0,
                    (xmax - xmin) / 10.0,
                    (ymax - ymin) / 10.0,
                ]

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


RETURN_PROMPT_TEMPLATE = """You are a shoe return assessment system for a retail company. You will receive 6 photos of the SAME shoe taken from different angles. Your job is to decide whether the shoe can be resold.

SHOE INFO:
- Model: {shoe_name}
- Official colorway: {colorway}

CRITICAL: The colors listed in the official colorway above are INTENTIONAL DESIGN COLORS, not stains or dirt. For example, brown/tan/clay/earth tones, red accents, dark patches, or multi-toned panels are part of the shoe's factory design. Do NOT flag the shoe's own colorway as staining, discoloration, or dirt. Only flag stains or discoloration that clearly do NOT belong to the original design — e.g. mud splatter, food stains, yellowing from age, water marks with visible tide lines.

The 6 images are provided in this order:
1. Front view (toe pointing at camera)
2. Lateral side view (right side)
3. Back view (heel facing camera)
4. Medial side view (left side)
5. Top-down view (looking down)
6. Sole view (shoe flipped, sole up)

ASSESSMENT CRITERIA:

1. Structural Damage: Any rips, tears, or holes anywhere on the shoe.
2. Surface Wear: Heavy stains (NOT the shoe's natural colors), severe scuff marks, or heavy creasing in the materials.
3. Sole Degradation: Significant wear and tear on either the bottom tread (outsole) or the interior insole.
4. Missing Parts: Any missing original components, such as laces or insoles.

VERDICTS — choose exactly one:

- "full_refund": The shoe is in EXCELLENT condition — no damage from any criteria above. Looks unworn or barely worn. Could be put back on the shelf and resold as new.
- "trade_in": The shoe shows SOME wear or minor damage but is still wearable and could be resold at a discount. Not perfect but not destroyed.
- "not_eligible": The shoe has SIGNIFICANT damage from one or more criteria above. Cannot be resold in any capacity.

Return JSON:
{{
  "verdict": "full_refund" | "trade_in" | "not_eligible",
  "confidence": 0-100 (how confident you are in this verdict),
  "condition": "Excellent" | "Good" | "Fair" | "Poor" (one-word summary),
  "reasoning": 2-3 sentences explaining your decision. Do NOT mention the colorway as an issue.,
  "issues": ["list of specific issues found, if any — empty array if none. Do NOT list the shoe's design colors as issues."]
}}

Be fair but thorough. Examine every angle carefully."""


@app.post("/api/assess-return")
async def assess_return(
    front: UploadFile = File(...),
    lateral: UploadFile = File(...),
    back: UploadFile = File(...),
    medial: UploadFile = File(...),
    top: UploadFile = File(...),
    sole: UploadFile = File(...),
    shoe_name: str = "Unknown",
    colorway: str = "Unknown",
):
    try:
        prompt = RETURN_PROMPT_TEMPLATE.format(shoe_name=shoe_name, colorway=colorway)
        print(f"[return] Shoe: {shoe_name}, Colorway: {colorway}")
        parts: list = [prompt]

        angle_labels = ["front", "lateral", "back", "medial", "top", "sole"]
        for upload, label in zip(
            [front, lateral, back, medial, top, sole], angle_labels
        ):
            data = await upload.read()
            mime = upload.content_type or "image/jpeg"
            parts.append(f"\n--- Image: {label} view ---")
            parts.append(genai.types.Part.from_bytes(data=data, mime_type=mime))

        print("[return] Sending 6 images to Gemini for return assessment...")

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=parts,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=2048,
            ),
        )

        raw = response.text
        print(f"[return] Gemini response: {raw!r}")

        if not raw:
            return JSONResponse(status_code=502, content={"error": "Empty response from AI"})

        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            print(f"[return] JSON parse failed on: {raw!r}")
            return JSONResponse(status_code=502, content={"error": "AI returned invalid response"})

        return result

    except genai_errors.ClientError as e:
        print(traceback.format_exc())
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded. Wait a moment and try again."},
            )
        return JSONResponse(status_code=502, content={"error": f"Gemini API error: {e}"})
    except Exception as e:
        print(traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": str(e)})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("scan:app", host="0.0.0.0", port=3000, reload=True)
