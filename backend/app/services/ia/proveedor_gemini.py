import logging

from google import genai
from google.genai import errors, types

from app.schemas.asistente import MensajeChat
from app.services.ia.base import (
    MAX_VUELTAS,
    RESPUESTA_RECHAZO,
    DefinicionHerramienta,
    DemasiadasVueltas,
    Ejecutor,
    ErrorProveedor,
)

log = logging.getLogger(__name__)

_ROLES = {"user": "user", "assistant": "model"}


class ProveedorGemini:
    """Gemini API (google-genai) con function calling manual."""

    nombre = "gemini"

    def __init__(self, api_key: str, modelo: str):
        self.modelo = modelo
        self._cliente = genai.Client(api_key=api_key)

    def responder(
        self,
        *,
        sistema: str,
        mensajes: list[MensajeChat],
        herramientas: list[DefinicionHerramienta],
        ejecutar: Ejecutor,
    ) -> str:
        config = types.GenerateContentConfig(
            system_instruction=sistema,
            tools=[
                types.Tool(
                    function_declarations=[
                        types.FunctionDeclaration(
                            name=h.nombre,
                            description=h.descripcion,
                            parameters_json_schema=h.parametros,
                        )
                        for h in herramientas
                    ]
                )
            ],
            # Las herramientas las ejecuta este ciclo, no el SDK.
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        )
        contenidos: list[types.Content] = [
            types.Content(role=_ROLES[m.rol], parts=[types.Part.from_text(text=m.texto)])
            for m in mensajes
        ]

        for _ in range(MAX_VUELTAS):
            respuesta = self._generar(contenidos, config)
            if not respuesta.candidates or respuesta.candidates[0].content is None:
                # Sin candidatos: el prompt o la respuesta fueron bloqueados por seguridad.
                return RESPUESTA_RECHAZO

            llamadas = respuesta.function_calls or []
            if not llamadas:
                return respuesta.text or ""

            # Se devuelve el contenido del modelo tal cual (conserva las thought signatures).
            contenidos.append(respuesta.candidates[0].content)
            partes = []
            for llamada in llamadas:
                contenido, es_error = ejecutar(llamada.name or "", dict(llamada.args or {}))
                partes.append(
                    types.Part(
                        function_response=types.FunctionResponse(
                            id=llamada.id,
                            name=llamada.name,
                            response={"error": contenido} if es_error else {"output": contenido},
                        )
                    )
                )
            contenidos.append(types.Content(role="user", parts=partes))
        raise DemasiadasVueltas()

    def _generar(self, contenidos: list[types.Content], config: types.GenerateContentConfig):
        try:
            return self._cliente.models.generate_content(
                model=self.modelo, contents=contenidos, config=config
            )
        except errors.APIError as e:
            # Una clave inválida llega como 400 API_KEY_INVALID, no como 401.
            if e.code in (401, 403) or "API_KEY" in str(e):
                raise ErrorProveedor("credenciales", str(e)) from e
            if e.code == 429:
                raise ErrorProveedor("limite", str(e)) from e
            raise ErrorProveedor("servicio", str(e)) from e
        except Exception as e:  # errores de red del cliente HTTP subyacente
            log.exception("Error llamando a Gemini")
            raise ErrorProveedor("conexion", str(e)) from e
