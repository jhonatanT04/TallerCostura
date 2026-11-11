import time

import jwt

from app.config import get_settings
from app.models import Usuario

ALGORITHMS = ["HS256", "HS384", "HS512"]


def _algorithm(secret: bytes) -> str:
    # jjwt (Keys.hmacShaKeyFor + signWith) elige el algoritmo según el largo de la
    # clave; se replica para que los tokens sean intercambiables con el backend Java.
    bits = len(secret) * 8
    if bits >= 512:
        return "HS512"
    if bits >= 384:
        return "HS384"
    return "HS256"


def generate_token(usuario: Usuario) -> str:
    s = get_settings()
    secret = s.jwt_secret_key.encode()
    now = int(time.time())
    payload = {
        "sub": usuario.username,
        "role": usuario.role.value,
        "iat": now,
        "exp": now + s.jwt_expiration_ms // 1000,
    }
    return jwt.encode(payload, secret, algorithm=_algorithm(secret))


def extract_username(token: str) -> str:
    """Lanza jwt.ExpiredSignatureError o jwt.InvalidTokenError."""
    secret = get_settings().jwt_secret_key.encode()
    claims = jwt.decode(token, secret, algorithms=ALGORITHMS, options={"require": ["sub", "exp"]})
    return claims["sub"]
