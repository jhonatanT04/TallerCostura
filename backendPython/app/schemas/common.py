from decimal import Decimal
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, PlainSerializer
from pydantic.alias_generators import to_camel
from pydantic_core import PydanticCustomError


class CamelModel(BaseModel):
    """JSON en camelCase, igual que los records de Java."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


def _not_blank(v: str) -> str:
    if not v.strip():
        raise PydanticCustomError("not_blank", "no debe estar vacío")
    return v


NotBlank = Annotated[str, AfterValidator(_not_blank)]


# BigDecimal de Java se serializa como número JSON (no como string, que es lo que
# Pydantic hace por defecto con Decimal).
Money = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]


def _min_6(v: str) -> str:
    if len(v) < 6:
        raise PydanticCustomError(
            "password_size", "La contraseña debe tener al menos 6 caracteres"
        )
    return v


Password = Annotated[NotBlank, AfterValidator(_min_6)]
