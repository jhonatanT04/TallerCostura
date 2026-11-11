from datetime import date, datetime, time


def rango_local(desde: date, hasta: date) -> tuple[datetime, datetime]:
    """Desde el inicio de `desde` hasta el final de `hasta` (inclusive) en la zona
    horaria del servidor, igual que `ZoneId.systemDefault()` en Java. Se controla
    con la variable de entorno TZ."""
    tz = datetime.now().astimezone().tzinfo
    return datetime.combine(desde, time.min, tz), datetime.combine(hasta, time.max, tz)


def hoy_local() -> date:
    return datetime.now().date()
