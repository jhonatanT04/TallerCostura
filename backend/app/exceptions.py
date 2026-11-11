from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

# Todas las respuestas de error usan {"message": "..."}, igual que GlobalExceptionHandler.


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_error(request: Request, exc: StarletteHTTPException):
        message = exc.detail
        if exc.status_code == 404 and message == "Not Found":
            message = f"Endpoint no encontrado: {request.url.path}"
        return JSONResponse(
            {"message": message}, status_code=exc.status_code, headers=exc.headers
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError):
        partes = []
        for err in exc.errors():
            loc = err["loc"]
            if loc and loc[0] in ("query", "path"):
                return JSONResponse(
                    {"message": f"Falta el parámetro {loc[-1]}"}
                    if err["type"] == "missing"
                    else {"message": f"Valor inválido para el parámetro {loc[-1]}"},
                    status_code=400,
                )
            campo = _ruta(loc)
            msg = "no debe estar vacío" if err["type"] == "missing" else err["msg"]
            partes.append(f"{campo}: {msg}")
        return JSONResponse({"message": ", ".join(partes)}, status_code=400)


def _ruta(loc: tuple) -> str:
    partes = [p for p in loc if p != "body"]
    if not partes:
        return "body"
    ruta = ""
    for p in partes:
        ruta += f"[{p}]" if isinstance(p, int) else (f".{p}" if ruta else str(p))
    return ruta
