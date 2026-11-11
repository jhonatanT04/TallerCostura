import bcrypt

# Compatible con BCryptPasswordEncoder de Spring (hashes $2a$10$...).


def hash_password(raw: str) -> str:
    return bcrypt.hashpw(raw.encode(), bcrypt.gensalt(rounds=10)).decode()


def verify_password(raw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(raw.encode(), hashed.encode())
    except ValueError:  # hash mal formado o contraseña > 72 bytes
        return False
