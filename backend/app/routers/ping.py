from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

router = APIRouter(prefix="/api", tags=["ping"])


@router.get("/ping", response_class=PlainTextResponse)
def ping() -> str:
    return "pong"
