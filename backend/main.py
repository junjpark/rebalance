from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import create_db_and_tables
from app.routes.shoes import router as shoes_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Rebalance API",
    description="Track shoe wear patterns with heatmap analysis.",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(shoes_router)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
