import uuid
from datetime import datetime
from typing import Any, Optional

from sqlmodel import JSON, Column, Field, Relationship, SQLModel


class Shoe(SQLModel, table=True):
    __tablename__ = "shoe"  # type: ignore

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    user: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    images: list["ShoeImage"] = Relationship(back_populates="shoe")


class ShoeImage(SQLModel, table=True):
    __tablename__ = "shoe_image"  # type: ignore

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    file: str
    heatmap: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

    shoe_id: uuid.UUID = Field(foreign_key="shoe.id")
    shoe: Shoe = Relationship(back_populates="images")
