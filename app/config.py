import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///dev.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")

    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_ACCESS_COOKIE_NAME = "access_token_cookie"
    JWT_ACCESS_COOKIE_PATH = "/"
    JWT_REFRESH_COOKIE_PATH = "/token/refresh"
    JWT_ACCESS_CSRF_HEADER_NAME = "X-CSRF-TOKEN"

    JWT_COOKIE_SECURE = os.getenv("JWT_COOKIE_SECURE", "False").lower() == "true"
    JWT_COOKIE_SAMESITE = os.getenv("JWT_COOKIE_SAMESITE", "Lax")

    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
