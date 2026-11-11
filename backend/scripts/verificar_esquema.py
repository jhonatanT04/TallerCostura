"""Compara los modelos SQLAlchemy con las tablas reales de Postgres.

Solo lectura: la sesión se fuerza a READ ONLY, así que no puede modificar nada.
Uso (desde backendPython/):  uv run python -m scripts.verificar_esquema
"""
from sqlalchemy import event, inspect

from app.database import Base, engine
import app.models  # noqa: F401  registra todos los modelos


@event.listens_for(engine, "connect")
def _solo_lectura(dbapi_conn, _):
    cur = dbapi_conn.cursor()
    cur.execute("SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY")
    cur.close()


insp = inspect(engine)
problemas = 0
with engine.connect() as c:
    print("read-only:", c.exec_driver_sql("SHOW transaction_read_only").scalar())
for tabla in Base.metadata.sorted_tables:
    if not insp.has_table(tabla.name):
        print(f"FALTA TABLA {tabla.name}"); problemas += 1; continue
    reales = {col["name"]: col for col in insp.get_columns(tabla.name)}
    for col in tabla.columns:
        r = reales.get(col.name)
        if r is None:
            print(f"  {tabla.name}.{col.name}: NO EXISTE en la BD"); problemas += 1; continue
        if bool(r["nullable"]) != bool(col.nullable):
            print(f"  {tabla.name}.{col.name}: nullable BD={r['nullable']} modelo={col.nullable}"); problemas += 1
    extra = set(reales) - {c.name for c in tabla.columns}
    # columnas que existen en la BD pero el modelo no conoce (si son NOT NULL sin default, los INSERT fallarían)
    for nombre in sorted(extra):
        r = reales[nombre]
        grave = not r["nullable"] and r["default"] is None
        print(f"  {tabla.name}.{nombre}: solo en la BD (nullable={r['nullable']}, default={r['default']}){'  <-- GRAVE' if grave else ''}")
        problemas += grave
    tipos = ", ".join(f"{n}:{reales[n]['type']}" for n in reales)
    print(f"{tabla.name}: OK -> {tipos}")
print("PROBLEMAS:", problemas)
