import uuid
import string
import random


def generate_unique_link(length: int = 8) -> str:
    """Генерация уникальной ссылки."""
    return str(uuid.uuid4())[:length]


def generate_short_code(length: int = 6) -> str:
    """Генерация короткого кода."""
    chars = string.ascii_lowercase + string.digits
    return "".join(random.choices(chars, k=length))