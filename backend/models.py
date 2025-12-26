from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    username: str
    hashed_password: str
    role: str = "user"  # "user" or "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: str
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    created_at: datetime

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # "concert", "sports", "festival", "conference"
    date: datetime
    location: str
    expected_attendance: int
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventCreate(BaseModel):
    name: str
    type: str
    date: datetime
    location: str
    expected_attendance: int

class EventResponse(BaseModel):
    id: str
    name: str
    type: str
    date: datetime
    location: str
    expected_attendance: int
    created_by: str
    created_at: datetime

class PredictionRequest(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    hour: int
    is_weekend: bool
    is_holiday: bool
    event_type: Optional[str] = None
    weather_condition: str  # "clear", "cloudy", "rain", "snow"

class PredictionResponse(BaseModel):
    predicted_demand: int
    confidence: float
    input_features: dict
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HistoricalData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime
    hour: int
    temperature: float
    humidity: float
    wind_speed: float
    weather_condition: str
    actual_demand: int
    is_weekend: bool
    is_holiday: bool
    event_type: Optional[str] = None

class HistoricalDataResponse(BaseModel):
    id: str
    date: datetime
    hour: int
    temperature: float
    humidity: float
    wind_speed: float
    weather_condition: str
    actual_demand: int
    is_weekend: bool
    is_holiday: bool
    event_type: Optional[str] = None
