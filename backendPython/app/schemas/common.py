from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict
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
