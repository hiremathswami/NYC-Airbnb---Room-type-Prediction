from fastapi import FastAPI
import joblib
import pandas as pd
from pydantic import BaseModel, Field
from pathlib import Path

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

COLUMNS = ['neighbourhood_group', 'neighbourhood', 'latitude', 'longitude',
        'price', 'minimum_nights', 'number_of_reviews',
       'reviews_per_month', 'calculated_host_listings_count',
       'availability_365']

MODEL_PATH = Path(__file__).resolve().parent / 'model_pipeline.pkl'
model = joblib.load(MODEL_PATH)

class Features(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude must be between -90 and 90 degrees.")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude must be between -180 and 180 degrees.")
    price: float = Field(..., gt=0, description="Price must be a positive number.")
    minimum_nights: int = Field(..., ge=1, le=365,description="Minimum nights must be at least 1.")
    number_of_reviews: int = Field(..., ge=0, description="Number of reviews must be a non-negative integer.")
    reviews_per_month: float = Field(..., ge=0, description="Reviews per month must be a non-negative number.")
    calculated_host_listings_count: int = Field(..., ge=0, description="Calculated host listings count must be a non-negative integer.")
    availability_365: int = Field(..., ge=0, le=365,description="Availability in the last 365 days must be a non-negative integer.")
    neighbourhood_group: str = Field(...,  min_length=1, description="Bronx neighbourhood group must be either 0 or 1.")
    neighbourhood: str = Field(..., min_length=1, description="Neighbourhood must be a non-empty string.")

@app.get('/')
def greet():
    return "hello Guyys"


@app.post('/predict')
def predict(features : Features):
    row = pd.DataFrame([features.model_dump()], columns=COLUMNS, index=[0])
    prediction=  model.predict(row)
    probability = model.predict_proba(row)

    return {
        "prediction": prediction[0],
        "Probability": probability[0].tolist()
        }