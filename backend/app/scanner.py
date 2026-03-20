import json
import os
from typing import Literal, Optional

from google import genai
from pydantic import BaseModel

Angle = Literal["front", "lateral", "back", "medial", "top", "sole"]

IMAGE_ANGLES: list[tuple[str, str, str]] = [
    ("front", "Front view — toe pointing at camera", "Toe Box - Lateral"),
    ("lateral", "Lateral side view — right side facing camera", "Lateral Midsole"),
    ("back", "Back view — heel facing camera", "Heel Counter"),
    ("medial", "Medial side view — left side facing camera", "Medial Forefoot"),
    ("top", "Top-down view — looking down at shoe", "Toe Box - Medial"),
    ("sole", "Sole view — shoe flipped over, sole facing camera", "Outsole - Toe"),
]

# Maps angle key -> canonical location name
ANGLE_TO_LOCATION: dict[str, str] = {key: loc for key, _, loc in IMAGE_ANGLES}

DamageType = Literal["structural", "surface_wear", "sole_degradation", "missing_parts"]

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
- "bbox": [x, y, width, height] as percentages (0-100) of THAT image's dimensions, or null

Always return all 6 locations. Keep descriptions very short.

Return JSON: {"locations": [...], "summary": {"Toe Box - Lateral": N, "Toe Box - Medial": N, "Heel Counter": N, "Lateral Midsole": N, "Medial Forefoot": N, "Outsole - Toe": N}}
where N = number of damage instances at that location (0 if none)."""


class LocationResult(BaseModel):
    location: str
    damaged: bool
    confidence: int
    damage_type: Optional[DamageType]
    description: str
    bbox: Optional[list[float]]


class ScanResult(BaseModel):
    locations: list[LocationResult]
    summary: dict[str, int]


def _make_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")
    return genai.Client(api_key=api_key)


async def analyze_shoe(
    images: list[tuple[bytes, str]],
) -> ScanResult:
    """Call Gemini with the 6 shoe images and return a typed ScanResult.

    Args:
        images: Exactly 6 ``(raw_bytes, mime_type)`` tuples in the order
                front, lateral, back, medial, top, sole.

    Returns:
        A :class:`ScanResult` with per-location damage details and a summary.

    Raises:
        ValueError: If fewer or more than 6 images are provided, or if the
                    ``GEMINI_API_KEY`` env var is missing.
    """
    if len(images) != 6:
        raise ValueError(f"Expected exactly 6 images, got {len(images)}")

    client = _make_client()

    parts: list = [PROMPT]
    for (data, mime_type), (key, angle_desc, _loc) in zip(images, IMAGE_ANGLES):
        parts.append(f"\n--- Image {key}: {angle_desc} ---")
        parts.append(genai.types.Part.from_bytes(data=data, mime_type=mime_type))

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=parts,
        config=genai.types.GenerateContentConfig(
            response_mime_type="application/json",
            max_output_tokens=4096,
        ),
    )

    raw = response.text or ""
    if not raw:
        return ScanResult(locations=[], summary={})

    result = json.loads(raw)
    return ScanResult.model_validate(result)
