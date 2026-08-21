from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.seed import seed_database
from app.routers import (
    auth, restaurants, bookings, checkin, 
    recommendations, reviews, complaints, waitlist, 
    profile, owner, admin
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize tables and seed dataset
    print("Starting Smart Restaurant Finder (Tamil Nadu Edition)...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_database()
    yield
    # Shutdown
    await engine.dispose()
    print("Application shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Intelligent Tamil Nadu restaurant discovery and reservation platform",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global custom exception handler for clean, friendly API errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log unexpected errors while returning structured error to client
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred while processing your request. Please try again."}
    )

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(restaurants.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(checkin.router, prefix=settings.API_V1_STR)
app.include_router(recommendations.router, prefix=settings.API_V1_STR)
app.include_router(reviews.router, prefix=settings.API_V1_STR)
app.include_router(complaints.router, prefix=settings.API_V1_STR)
app.include_router(waitlist.router, prefix=settings.API_V1_STR)
app.include_router(profile.router, prefix=settings.API_V1_STR)
app.include_router(owner.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "region": "Tamil Nadu, India",
        "status": "online",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
