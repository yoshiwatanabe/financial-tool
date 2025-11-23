from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date

class Asset(BaseModel):
    id: str
    name: str
    type: Literal["401k", "IRA", "RothIRA", "Brokerage", "Crypto", "RealEstate", "Cash", "Other"]
    current_value: float
    currency: Literal["USD", "JPY"] = "USD"
    contribution_monthly: float = 0.0
    contribution_currency: Literal["USD", "JPY"] = "USD"
    expected_return_rate: float = 0.05  # Annual return rate (0.05 = 5%)
    is_taxable: bool = True

class Pension(BaseModel):
    id: str
    name: str
    type: Literal["SocialSecurity", "JPPension", "PrivateAnnuity", "Other"]
    start_age: int
    monthly_amount_estimated: float
    currency: Literal["USD", "JPY"] = "USD"
    is_inflation_adjusted: bool = True

class LifeEvent(BaseModel):
    id: str
    name: str
    type: Literal["Retirement", "Relocation", "EducationEnd", "Other"]
    year: int
    month: int = 1
    description: Optional[str] = None
    impact_one_time: float = 0.0  # Positive for income, negative for cost
    impact_monthly: float = 0.0   # Change in monthly cashflow

class UserProfile(BaseModel):
    birth_year: int
    spouse_birth_year: Optional[int] = None
    current_location: Literal["US", "JP"] = "US"
    retirement_age: int = 65
    life_expectancy: int = 95

class SimulationInput(BaseModel):
    profile: UserProfile
    assets: List[Asset]
    pensions: List[Pension]
    life_events: List[LifeEvent]
    exchange_rate_usd_jpy: float = 150.0
    inflation_rate_us: float = 0.03
    inflation_rate_jp: float = 0.01
