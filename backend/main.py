from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import auth, contracts

app = FastAPI(title="ContractBuddy API")

# Create tables
print("🔧 Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully")

# CORS - This must be configured correctly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Import routers
from routers import auth, contracts

app.include_router(auth.router)
app.include_router(contracts.router)

@app.get("/")
def root():
    return {"message": "✅ ContractBuddy API is running!"}