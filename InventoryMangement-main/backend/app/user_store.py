"""
Simple in-memory user store for JWT auth.
For production replace with a database-backed user model.
"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pre-hashed password for "admin123"
_USERS: dict = {}


def _init():
    _USERS["admin"] = pwd_context.hash("admin123")


_init()


def get_user(username: str):
    if username in _USERS:
        return {"username": username}
    return None


def verify(username: str, password: str) -> bool:
    if username not in _USERS:
        return False
    return pwd_context.verify(password, _USERS[username])


def create_user(username: str, password: str):
    if username in _USERS:
        return False
    _USERS[username] = pwd_context.hash(password)
    return True
