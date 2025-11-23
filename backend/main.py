from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from models import SimulationInput
from simulation import run_simulation
from pydantic import BaseModel
from typing import List, Dict

import json
import os

DATA_FILE = "user_data.json"

@app.post("/save")
def save_data(input_data: SimulationInput):
    """Save simulation data to a local JSON file"""
    try:
        with open(DATA_FILE, "w") as f:
            json.dump(input_data.model_dump(), f, indent=2)
        return {"status": "success", "message": "Data saved successfully"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/load")
def load_data():
    """Load simulation data from local JSON file"""
    if not os.path.exists(DATA_FILE):
        return {"status": "error", "message": "No saved data found"}
    
    try:
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/simulate")
def simulate(input_data: SimulationInput):
    return run_simulation(input_data)
