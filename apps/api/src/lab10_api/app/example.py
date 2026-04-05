"""Ejemplo de función pura de dominio (fácil de testear sin HTTP)."""


def ping_message() -> str:
    return "pong"
