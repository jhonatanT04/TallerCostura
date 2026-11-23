"""Proveedores de IA intercambiables para el asistente.

Se eligen con variables de entorno (solo desarrollo/despliegue):
- ASISTENTE_PROVEEDOR: openai (por defecto) | gemini | anthropic
- ASISTENTE_MODELO: opcional; si está vacío se usa MODELOS_POR_DEFECTO[proveedor]
- OPENAI_API_KEY / GEMINI_API_KEY / ANTHROPIC_API_KEY: la del proveedor elegido
"""

from app.config import Settings
from app.services.ia.base import ErrorProveedor, Proveedor

MODELOS_POR_DEFECTO = {
    "openai": "gpt-5.5",
    "gemini": "gemini-3.5-flash",
    "anthropic": "claude-opus-5-5",
}


def crear_proveedor(settings: Settings) -> Proveedor:
    nombre = settings.asistente_proveedor
    modelo = settings.asistente_modelo.strip() or MODELOS_POR_DEFECTO[nombre]

    # Los SDK se importan aquí para que solo se cargue el del proveedor elegido.
    if nombre == "openai":
        from app.services.ia.proveedor_openai import ProveedorOpenAI

        return ProveedorOpenAI(_clave(settings.openai_api_key, "OPENAI_API_KEY"), modelo)
    if nombre == "gemini":
        from app.services.ia.proveedor_gemini import ProveedorGemini

        return ProveedorGemini(_clave(settings.gemini_api_key, "GEMINI_API_KEY"), modelo)
    from app.services.ia.proveedor_anthropic import ProveedorAnthropic

    return ProveedorAnthropic(_clave(settings.anthropic_api_key, "ANTHROPIC_API_KEY"), modelo)


def _clave(valor: str, variable: str) -> str:
    if not valor.strip():
        raise ErrorProveedor("configuracion", f"Falta {variable}")
    return valor.strip()
