from fastapi import APIRouter
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import personas
from app.api.v1.endpoints import chat
from app.api.v1.endpoints import favorites
from app.api.v1.endpoints import reports
from app.api.v1.endpoints import conversations
from app.api.v1.endpoints import admin
from app.api.v1.endpoints import collections

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(personas.router)
api_router.include_router(favorites.router)
api_router.include_router(chat.router)
api_router.include_router(reports.router)
api_router.include_router(conversations.router)
api_router.include_router(admin.router)
api_router.include_router(collections.router)
