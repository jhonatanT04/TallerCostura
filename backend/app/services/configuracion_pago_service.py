from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ConfiguracionPago
from app.schemas.pago import ConfiguracionPagoDTO, ConfiguracionPagoRequest


def obtener(db: Session) -> ConfiguracionPagoDTO:
    config = obtener_entidad(db)
    db.commit()  # por si se acaba de crear la fila por defecto
    return ConfiguracionPagoDTO.de(config)


def actualizar(db: Session, request: ConfiguracionPagoRequest) -> ConfiguracionPagoDTO:
    config = obtener_entidad(db)
    config.precio_mullos = request.precio_mullos
    config.precio_ataches = request.precio_ataches
    db.commit()
    return ConfiguracionPagoDTO.de(config)


def obtener_entidad(db: Session) -> ConfiguracionPago:
    """Devuelve la configuración global; si no existe la crea con ceros (sin commit:
    lo hace quien llama). OJO: escribe en la BD, no usar en una transacción de solo lectura."""
    config = db.scalar(select(ConfiguracionPago).order_by(ConfiguracionPago.id).limit(1))
    if config is None:
        config = ConfiguracionPago(precio_mullos=0, precio_ataches=0)
        db.add(config)
        db.flush()
    return config
