from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select

from app.database import SessionLocal
from app.models import ConfiguracionPago, OrdenPago, RegistroBlusa
from tests.conftest import auth, crear_empleado, login

LUNES = date(2026, 11, 2)


def insertar(usuario_id, cuando: datetime, confeccion=0, mullos=0, ataches=0) -> None:
    with SessionLocal() as db:
        db.add(RegistroBlusa(usuario_id=usuario_id, color="rojo", talla="M",
                             cantidad_confeccion=confeccion, cantidad_mullos=mullos,
                             cantidad_ataches=ataches, fecha_registro=cuando))
        db.commit()


def dia(d: date, hora=12) -> datetime:
    return datetime(d.year, d.month, d.day, hora, tzinfo=UTC)


def configurar(client, admin, mullos, ataches):
    r = client.put("/api/configuracion-pago", json={"precioMullos": mullos, "precioAtaches": ataches},
                   headers=admin)
    assert r.status_code == 200, r.text


def contar_pagos() -> int:
    with SessionLocal() as db:
        return db.scalar(select(func.count()).select_from(OrdenPago))


def preparar_semana(client, admin):
    """María: 2.50 por blusa. Mullos 0.25, ataches 0.10.
    En la semana: confección 10+5, mullos 12, ataches 20 + registros fuera de rango."""
    maria = crear_empleado(client, admin, "maria", pagoPorBlusa="2.50")
    ana = crear_empleado(client, admin, "ana", pagoPorBlusa=3)
    configurar(client, admin, "0.25", "0.10")
    insertar(maria["id"], dia(LUNES, 0) , confeccion=10, mullos=12)          # lunes 00:00 (incluido)
    insertar(maria["id"], dia(LUNES + timedelta(days=6), 23), confeccion=5, ataches=20)  # domingo 23:00
    insertar(maria["id"], dia(LUNES - timedelta(days=1), 23), confeccion=100)  # domingo anterior
    insertar(maria["id"], dia(LUNES + timedelta(days=7), 0), confeccion=100)   # lunes siguiente
    insertar(ana["id"], dia(LUNES), confeccion=50)                              # otra empleada
    return maria, ana


ESPERADO = {
    "semanaInicio": "2026-11-02", "semanaFin": "2026-11-08",
    "totalBlusas": 15, "totalConMullos": 12, "totalConAtaches": 20,
    "montoBlusas": 37.5,   # 15 × 2.50
    "montoMullos": 3.0,    # 12 × 0.25
    "montoAtaches": 2.0,   # 20 × 0.10
    "montoTotal": 42.5,
}


def test_configuracion_se_crea_con_ceros_y_se_actualiza(client, admin):
    r = client.get("/api/configuracion-pago", headers=admin)
    assert r.status_code == 200 and r.json() == {"precioMullos": 0.0, "precioAtaches": 0.0}
    configurar(client, admin, "0.25", 0)
    assert client.get("/api/configuracion-pago", headers=admin).json() == {"precioMullos": 0.25, "precioAtaches": 0.0}
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(ConfiguracionPago)) == 1

    r = client.put("/api/configuracion-pago", json={"precioMullos": -1, "precioAtaches": 0}, headers=admin)
    assert r.status_code == 400 and r.json() == {"message": "precioMullos: El precio no puede ser negativo"}


def test_previsualizar_no_guarda_y_coincide_con_calcular(client, admin):
    maria, _ = preparar_semana(client, admin)

    r = client.get(f"/api/pagos/previsualizar?empleadoId={maria['id']}&semanaInicio={LUNES}", headers=admin)
    assert r.status_code == 200, r.text
    prev = r.json()
    assert prev | ESPERADO == prev
    assert prev["id"] is None and prev["fechaPago"] is None and prev["estado"] == "PENDIENTE"
    assert prev["empleado"]["username"] == "maria"
    assert contar_pagos() == 0

    r = client.post("/api/pagos/calcular", json={"empleadoId": maria["id"], "semanaInicio": str(LUNES)},
                    headers=admin)
    assert r.status_code == 201, r.text
    pago = r.json()
    assert pago | ESPERADO == pago
    assert pago["id"] is not None and pago["estado"] == "PAGADO" and pago["fechaPago"].endswith("Z")
    assert contar_pagos() == 1


def test_semana_ya_pagada_409(client, admin):
    maria, _ = preparar_semana(client, admin)
    body = {"empleadoId": maria["id"], "semanaInicio": str(LUNES)}
    assert client.post("/api/pagos/calcular", json=body, headers=admin).status_code == 201

    msg = {"message": "Ya se generó el pago de la semana del 2026-11-02 para este empleado"}
    r = client.post("/api/pagos/calcular", json=body, headers=admin)
    assert r.status_code == 409 and r.json() == msg
    r = client.get(f"/api/pagos/previsualizar?empleadoId={maria['id']}&semanaInicio={LUNES}", headers=admin)
    assert r.status_code == 409 and r.json() == msg
    assert contar_pagos() == 1


def test_monto_congelado_si_cambian_las_tarifas(client, admin):
    maria, _ = preparar_semana(client, admin)
    client.post("/api/pagos/calcular", json={"empleadoId": maria["id"], "semanaInicio": str(LUNES)}, headers=admin)
    client.patch(f"/api/empleados/{maria['id']}/pago", json={"pagoPorBlusa": 10}, headers=admin)
    configurar(client, admin, 5, 5)
    pago = client.get("/api/pagos", headers=admin).json()[0]
    assert pago["montoTotal"] == 42.5


def test_tarifas_en_cero_409_con_todos_los_problemas(client, admin):
    maria = crear_empleado(client, admin, "maria")  # pagoPorBlusa = 0
    insertar(maria["id"], dia(LUNES), confeccion=1, mullos=1, ataches=1)
    r = client.get(f"/api/pagos/previsualizar?empleadoId={maria['id']}&semanaInicio={LUNES}", headers=admin)
    assert r.status_code == 409
    assert r.json() == {"message": "El empleado Maria no tiene tarifa por blusa configurada. "
                                   "No hay precio de mullos configurado. No hay precio de ataches configurado"}
    r = client.post("/api/pagos/calcular", json={"empleadoId": maria["id"], "semanaInicio": str(LUNES)},
                    headers=admin)
    assert r.status_code == 409
    assert contar_pagos() == 0


def test_tarifa_cero_sin_trabajo_de_ese_tipo_es_valido(client, admin):
    maria = crear_empleado(client, admin, "maria", pagoPorBlusa=2)  # mullos/ataches en 0
    insertar(maria["id"], dia(LUNES), confeccion=4)
    r = client.post("/api/pagos/calcular", json={"empleadoId": maria["id"], "semanaInicio": str(LUNES)},
                    headers=admin)
    assert r.status_code == 201 and r.json()["montoTotal"] == 8.0

    # Semana sin trabajo: se paga en 0.
    otra = str(LUNES + timedelta(days=7))
    r = client.post("/api/pagos/calcular", json={"empleadoId": maria["id"], "semanaInicio": otra}, headers=admin)
    assert r.status_code == 201 and r.json()["montoTotal"] == 0.0 and r.json()["totalBlusas"] == 0


def test_errores_404_y_400(client, admin):
    r = client.post("/api/pagos/calcular", json={"empleadoId": 9999, "semanaInicio": str(LUNES)}, headers=admin)
    assert r.status_code == 404 and r.json() == {"message": "Empleado no encontrado"}

    r = client.get(f"/api/pagos/previsualizar?semanaInicio={LUNES}", headers=admin)
    assert r.status_code == 400 and r.json() == {"message": "Falta el parámetro empleadoId"}

    r = client.get("/api/pagos/previsualizar?empleadoId=1&semanaInicio=ayer", headers=admin)
    assert r.status_code == 400 and r.json() == {"message": "Valor inválido para el parámetro semanaInicio"}

    r = client.get("/api/pagos/empleado/9999", headers=admin)
    assert r.status_code == 404


def test_listados_y_permisos(client, admin):
    maria, ana = preparar_semana(client, admin)
    t_maria = auth(login(client, "maria", "secreta1"))
    t_ana = auth(login(client, "ana", "secreta1"))

    for emp in (maria, ana):
        r = client.post("/api/pagos/calcular", json={"empleadoId": emp["id"], "semanaInicio": str(LUNES)},
                        headers=admin)
        assert r.status_code == 201, r.text

    assert [p["empleado"]["username"] for p in client.get("/api/pagos", headers=admin).json()] == ["ana", "maria"]
    assert len(client.get(f"/api/pagos/empleado/{maria['id']}", headers=admin).json()) == 1

    mios = client.get("/api/pagos/mios", headers=t_ana).json()
    assert [p["empleado"]["username"] for p in mios] == ["ana"]
    assert mios[0]["montoTotal"] == 150.0  # 50 × 3

    # /mios solo EMPLEADO; el resto solo ADMIN.
    assert client.get("/api/pagos/mios", headers=admin).status_code == 403
    assert client.get("/api/pagos", headers=t_maria).status_code == 403
    assert client.get(f"/api/pagos/empleado/{maria['id']}", headers=t_maria).status_code == 403
    assert client.post("/api/pagos/calcular", json={}, headers=t_maria).status_code == 403
    assert client.get("/api/configuracion-pago", headers=t_maria).status_code == 403
