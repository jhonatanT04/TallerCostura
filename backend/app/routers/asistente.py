from fastapi import APIRouter

from app.schemas.asistente import ChatRequest, ChatResponse
from app.security.deps import AdminUser
from app.services import asistente_service

router = APIRouter(prefix="/api/asistente", tags=["asistente"])


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, _: AdminUser):
    """Pregunta al asistente. Solo consulta datos; si propone confirmar un pago, el
    frontend lo registra con POST /api/pagos/calcular."""
    return asistente_service.conversar(request)
