import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://username:password@localhost:5432/collab_coding"
    )
    AUTOCOMPLETE_DELAY_MS: int = 600
    MAX_CODE_LENGTH: int = 100000  # 100KB limit per room

settings = Settings()
