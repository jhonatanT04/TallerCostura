from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Cliente
from app.schemas.orden import ClienteResponse, CrearClienteRequest


def crear(db: Session, request: CrearClienteRequest) -> ClienteResponse:
    cliente = Cliente(nombre=request.nombre, telefono=request.telefono)
    db.add(cliente)
    db.commit()
    return ClienteResponse.de(cliente)


def listar(db: Session) -> list[ClienteResponse]:
    return [ClienteResponse.de(c) for c in db.scalars(select(Cliente).order_by(Cliente.nombre))]
