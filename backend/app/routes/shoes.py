import uuid
from pathlib import Path
from typing import Annotated, Optional, cast

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import Session, select

from app.database import get_session
from app.models import Shoe, ShoeImage
from app.scanner import (
    ANGLE_TO_LOCATION,
    Angle,
    LocationResult,
    ScanResult,
    analyze_shoe,
)

router = APIRouter(prefix="/shoes", tags=["shoes"])

UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class AddShoeResponse(BaseModel):
    id: uuid.UUID


class ShoeImageOut(BaseModel):
    id: uuid.UUID
    angle: Angle
    file: str
    heatmap: Optional[LocationResult]


class ShoeOut(BaseModel):
    id: uuid.UUID
    name: str
    user: str
    images: list[ShoeImageOut]


class AllShoeIdsResponse(BaseModel):
    ids: list[uuid.UUID]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _save_bytes(data: bytes, filename: str, dest_dir: Path) -> str:
    """Persist *data* to *dest_dir*/*filename* and return the relative path string."""
    dest = dest_dir / filename
    dest.write_bytes(data)
    return str(dest)


def _ext_from_mime(mime: str) -> str:
    """Return a file extension for *mime*, defaulting to ``.jpg``."""
    mapping: dict[str, str] = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/bmp": ".bmp",
        "image/tiff": ".tiff",
    }
    return mapping.get(mime, ".jpg")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/", response_model=AddShoeResponse, status_code=201)
async def add_shoe(
    name: Annotated[str, Form()],
    user: Annotated[str, Form()],
    front: Annotated[UploadFile, File()],
    lateral: Annotated[UploadFile, File()],
    back: Annotated[UploadFile, File()],
    medial: Annotated[UploadFile, File()],
    top: Annotated[UploadFile, File()],
    sole: Annotated[UploadFile, File()],
    session: Session = Depends(get_session),
) -> AddShoeResponse:
    """Accept 6 shoe images, run Gemini damage analysis, persist everything, and return the shoe id."""
    named_uploads: list[tuple[Angle, UploadFile]] = [
        ("front", front),
        ("lateral", lateral),
        ("back", back),
        ("medial", medial),
        ("top", top),
        ("sole", sole),
    ]

    # Read all file bytes upfront — the streams are consumed once, then used
    # for both disk persistence and the Gemini API call.
    image_data: list[tuple[Angle, bytes, str]] = []
    for angle, upload in named_uploads:
        data = await upload.read()
        mime = upload.content_type or "image/jpeg"
        image_data.append((angle, data, mime))

    # Run Gemini analysis. If the API is unavailable we still save the shoe,
    # just without heatmaps.
    location_map: dict[str, LocationResult] = {}
    try:
        scan: ScanResult = await analyze_shoe(
            [(data, mime) for _, data, mime in image_data]
        )
        location_map = {r.location: r for r in scan.locations}
    except Exception as exc:
        print(
            f"[scanner] Gemini analysis failed, storing images without heatmaps: {exc}"
        )

    # Persist the shoe row and flush to get its id for the upload sub-directory.
    shoe = Shoe(name=name, user=user)
    session.add(shoe)
    session.flush()

    shoe_dir = UPLOADS_DIR / str(shoe.id)
    shoe_dir.mkdir(parents=True, exist_ok=True)

    for angle, data, mime in image_data:
        filename = f"{uuid.uuid4()}{_ext_from_mime(mime)}"
        file_path = _save_bytes(data, filename, shoe_dir)

        location_name = ANGLE_TO_LOCATION[angle]
        result = location_map.get(location_name)

        shoe_image = ShoeImage(
            angle=angle,
            file=file_path,
            heatmap=result.model_dump() if result is not None else None,
            shoe_id=shoe.id,
        )
        session.add(shoe_image)

    session.commit()
    session.refresh(shoe)
    return AddShoeResponse(id=shoe.id)


@router.get("/", response_model=AllShoeIdsResponse)
def list_shoe_ids(
    session: Session = Depends(get_session),
) -> AllShoeIdsResponse:
    """Return every shoe id stored in the database."""
    shoes = session.exec(select(Shoe)).all()
    return AllShoeIdsResponse(ids=[shoe.id for shoe in shoes])


@router.get("/{shoe_id}", response_model=ShoeOut)
def get_shoe(
    shoe_id: uuid.UUID,
    session: Session = Depends(get_session),
) -> ShoeOut:
    """Return a shoe's metadata, image paths, and per-image Gemini damage heatmaps."""
    shoe = session.get(Shoe, shoe_id)
    if shoe is None:
        raise HTTPException(status_code=404, detail="Shoe not found")

    images_out = [
        ShoeImageOut(
            id=img.id,
            angle=cast(Angle, img.angle),
            file=img.file,
            heatmap=LocationResult.model_validate(img.heatmap)
            if img.heatmap is not None
            else None,
        )
        for img in shoe.images
    ]
    return ShoeOut(id=shoe.id, name=shoe.name, user=shoe.user, images=images_out)


@router.get("/{shoe_id}/images/{image_id}")
def get_shoe_image(
    shoe_id: uuid.UUID,
    image_id: uuid.UUID,
    session: Session = Depends(get_session),
) -> FileResponse:
    """Stream the raw image file back to the caller."""
    shoe = session.get(Shoe, shoe_id)
    if shoe is None:
        raise HTTPException(status_code=404, detail="Shoe not found")

    image = session.get(ShoeImage, image_id)
    if image is None or image.shoe_id != shoe_id:
        raise HTTPException(status_code=404, detail="Image not found")

    image_path = Path(image.file)
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image file missing on disk")

    return FileResponse(path=str(image_path))
