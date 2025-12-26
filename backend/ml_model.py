import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os
from pathlib import Path

MODEL_PATH = Path(__file__).parent / "bike_demand_model.pkl"

def train_and_save_model():
    """Train a simple Random Forest model with mock data and save it"""
    # Generate synthetic training data
    np.random.seed(42)
    n_samples = 1000
    
    # Features: temperature, humidity, wind_speed, hour, is_weekend, is_holiday, weather_clear, weather_cloudy, weather_rain, weather_snow, event_concert, event_sports, event_festival, event_none
    X = np.random.rand(n_samples, 14)
    
    # Adjust features to be more realistic
    X[:, 0] = X[:, 0] * 40 - 5  # temperature: -5 to 35°C
    X[:, 1] = X[:, 1] * 100  # humidity: 0-100%
    X[:, 2] = X[:, 2] * 30  # wind_speed: 0-30 km/h
    X[:, 3] = (X[:, 3] * 24).astype(int)  # hour: 0-23
    X[:, 4] = (X[:, 4] > 0.7).astype(int)  # is_weekend: 0 or 1
    X[:, 5] = (X[:, 5] > 0.9).astype(int)  # is_holiday: 0 or 1
    
    # Weather conditions (one-hot encoded)
    weather = np.random.choice([0, 1, 2, 3], n_samples)
    X[:, 6:10] = 0
    for i in range(n_samples):
        X[i, 6 + weather[i]] = 1
    
    # Event types (one-hot encoded)
    event = np.random.choice([0, 1, 2, 3], n_samples, p=[0.7, 0.1, 0.1, 0.1])
    X[:, 10:14] = 0
    for i in range(n_samples):
        X[i, 10 + event[i]] = 1
    
    # Target: bike demand (influenced by features)
    y = (
        50 +  # base demand
        X[:, 0] * 3 +  # temperature effect
        -X[:, 1] * 0.2 +  # humidity effect (negative)
        -X[:, 2] * 1 +  # wind effect (negative)
        X[:, 4] * 30 +  # weekend boost
        X[:, 5] * 50 +  # holiday boost
        -X[:, 8] * 40 +  # rain penalty
        -X[:, 9] * 60 +  # snow penalty
        X[:, 10] * 80 +  # concert boost
        X[:, 11] * 100 +  # sports event boost
        X[:, 12] * 120 +  # festival boost
        np.random.randn(n_samples) * 20  # random noise
    )
    y = np.maximum(y, 0)  # ensure non-negative
    
    # Train model
    model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
    model.fit(X, y)
    
    # Save model
    joblib.dump(model, MODEL_PATH)
    print(f"Model trained and saved to {MODEL_PATH}")
    return model

def load_model():
    """Load the trained model or train a new one if it doesn't exist"""
    if not os.path.exists(MODEL_PATH):
        print("Model not found, training new model...")
        return train_and_save_model()
    return joblib.load(MODEL_PATH)

def predict_demand(features: dict) -> dict:
    """Make a prediction using the trained model"""
    model = load_model()
    
    # Prepare features in the correct order
    weather_encoding = {
        "clear": [1, 0, 0, 0],
        "cloudy": [0, 1, 0, 0],
        "rain": [0, 0, 1, 0],
        "snow": [0, 0, 0, 1]
    }
    
    event_encoding = {
        "concert": [1, 0, 0, 0],
        "sports": [0, 1, 0, 0],
        "festival": [0, 0, 1, 0],
        None: [0, 0, 0, 1]
    }
    
    weather = weather_encoding.get(features.get("weather_condition", "clear"), [1, 0, 0, 0])
    event = event_encoding.get(features.get("event_type"), [0, 0, 0, 1])
    
    X = np.array([[
        features.get("temperature", 20),
        features.get("humidity", 50),
        features.get("wind_speed", 10),
        features.get("hour", 12),
        int(features.get("is_weekend", False)),
        int(features.get("is_holiday", False)),
        *weather,
        *event
    ]])
    
    prediction = model.predict(X)[0]
    
    # Calculate confidence (simplified)
    confidence = min(0.95, max(0.65, 0.85 - abs(prediction - 150) / 1000))
    
    return {
        "predicted_demand": int(max(0, prediction)),
        "confidence": round(confidence, 2)
    }

# Initialize model on import
if not os.path.exists(MODEL_PATH):
    train_and_save_model()
