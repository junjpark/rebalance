from __future__ import annotations

import shutil
import uuid
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import Session, select

from app.database import get_session
from app.models import Shoe, ShoeImage

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
    file: str
    heatmap: dict[str, Any] | None


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


def _save_upload(upload: UploadFile, dest_dir: Path) -> str:
    """Stub: persist an uploaded file to *dest_dir* and return its relative path."""
    suffix = Path(upload.filename).suffix if upload.filename else ".bin"
    filename = f"{uuid.uuid4()}{suffix}"
    dest = dest_dir / filename
    with dest.open("wb") as f:
        shutil.copyfileobj(upload.file, f)
    return str(dest)


# TODO: replace this with Justin's function
def _stub_heatmap() -> dict[str, Any]:
    """Return a placeholder heatmap payload until real analysis is wired in."""
    return {
        "zones": {
            "heel": 0.0,
            "arch": 0.0,
            "ball": 0.0,
            "toe": 0.0,
        },
        "analyzed": False,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/", response_model=AddShoeResponse, status_code=201)
def add_shoe(
    name: Annotated[str, Form()],
    user: Annotated[str, Form()],
    images: Annotated[list[UploadFile], File()],
    session: Session = Depends(get_session),
) -> AddShoeResponse:
    """Create a new shoe record, persist the uploaded images, and return the shoe id."""
    shoe = Shoe(name=name, user=user)
    session.add(shoe)
    session.flush()  # populate shoe.id before using it for the sub-directory

    shoe_dir = UPLOADS_DIR / str(shoe.id)
    shoe_dir.mkdir(parents=True, exist_ok=True)

    for upload in images:
        file_path = _save_upload(upload, shoe_dir)
        shoe_image = ShoeImage(
            file=file_path,
            heatmap=_stub_heatmap(),
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
    """Return a shoe's metadata, image paths, and heatmap data."""
    shoe = session.get(Shoe, shoe_id)
    if shoe is None:
        raise HTTPException(status_code=404, detail="Shoe not found")

    images_out = [
        ShoeImageOut(id=img.id, file=img.file, heatmap=img.heatmap)
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
