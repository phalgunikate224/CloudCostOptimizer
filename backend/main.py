from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from data.mock_data import initialize_database
from database import Base, SessionLocal, engine
from routers import anomalies, costs, policies, predictions, recommendations, simulation


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        result = initialize_database(db)
        print(f"Database initialized: {result}")
    finally:
        db.close()
    yield


app = FastAPI(
    title="Cloud Cost Optimizer API",
    description="AI-Powered Cloud Cost Optimization Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(costs.router)
app.include_router(predictions.router)
app.include_router(anomalies.router)
app.include_router(recommendations.router)
app.include_router(policies.router)
app.include_router(simulation.router)


@app.get("/")
def root():
    return {
        "message": "Cloud Cost Optimizer API",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
