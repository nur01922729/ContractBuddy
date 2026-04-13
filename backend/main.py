from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models

app = FastAPI(title="ContractBuddy API")

# Create database tables
print("🔧 Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://yourcontractbuddy.netlify.app",
        "https://*.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from routers import auth, contracts

app.include_router(auth.router)
app.include_router(contracts.router)

@app.get("/")
def root():
    return {"message": "✅ ContractBuddy API is running!"}

@app.get("/health")
def health():
    return {"status": "healthy"}