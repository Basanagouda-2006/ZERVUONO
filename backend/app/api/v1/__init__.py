from fastapi import APIRouter
from app.api.v1 import (
    auth,
    organizations,
    requests,
    assets,
    locations,
    preventive,
    notifications,
    reports,
    files,
    ai,
    audit,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(requests.router, prefix="/requests", tags=["Maintenance Requests"])
api_router.include_router(assets.router, prefix="/assets", tags=["Assets"])
api_router.include_router(locations.router, prefix="/locations", tags=["Locations"])
api_router.include_router(preventive.router, prefix="/preventive", tags=["Preventive Maintenance"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(reports.router, prefix="/reports", tags=["Operational Reports"])
api_router.include_router(files.router, prefix="/files", tags=["Files & Evidence"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Assistance"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Logs"])
