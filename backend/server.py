from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List
import random
import uuid # For generating unique IDs for events

app = FastAPI()

# 1. Security Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# 2. In-Memory Databases (Resets when server restarts)
fake_users_db = {} 
fake_events_db = [
    {"id": "1", "name": "City Marathon", "date": "2025-05-20", "location": "Central Park"},
    {"id": "2", "name": "Midnight Ride", "date": "2025-06-15", "location": "Downtown"},
]

# 3. Data Models
class UserAuth(BaseModel):
    username: str
    password: str

class Event(BaseModel):
    name: str
    date: str
    location: str

class PredictionRequest(BaseModel):
    temperature: float
    humidity: float
    windspeed: float
    season: int
    holiday: int
    workingday: int
    weather: int

# 4. Helper: Get Current User
async def get_current_user(token: str = Depends(oauth2_scheme)):
    if token not in fake_users_db:
        raise HTTPException(status_code=401, detail="Invalid token")
    return token # Returns username

# --- ENDPOINTS ---

@app.post("/auth/register")
async def register(user: UserAuth):
    if user.username in fake_users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    fake_users_db[user.username] = user.password
    return {"message": "Registered successfully"}

@app.post("/auth/login")
async def login(user: UserAuth):
    if user.username not in fake_users_db or fake_users_db[user.username] != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": user.username, "token_type": "bearer"}

@app.get("/events")
async def get_events(user: str = Depends(get_current_user)):
    return fake_events_db

@app.post("/events")
async def create_event(event: Event, user: str = Depends(get_current_user)):
    new_event = event.dict()
    new_event["id"] = str(uuid.uuid4())
    fake_events_db.append(new_event)
    return new_event

@app.post("/predict")
async def make_prediction(request: PredictionRequest, user: str = Depends(get_current_user)):
    # Prediction Logic
    demand = 50
    if request.season == 3: demand += 40
    if request.weather == 1: demand += 30
    if 20 < request.temperature < 30: demand += 50
    demand += random.randint(-10, 20)
    return {"predicted_demand": max(0, demand)}

@app.get("/profile")
async def get_profile(user: str = Depends(get_current_user)):
    return {"username": user, "role": "Standard User", "member_since": "2025"}

@app.get("/")
async def root():
    return {"message": "Full Stack Bike API is Running!"}