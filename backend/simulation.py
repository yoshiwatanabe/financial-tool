from typing import List
from models import SimulationInput, Asset, Pension, LifeEvent


def calculate_asset_value(
    asset: Asset,
    current_year: int,
    years_elapsed: int,
    exchange_rate: float
) -> float:
    """
    Calculate the value of an asset at a given year.
    
    Args:
        asset: Asset object with initial value and growth parameters
        current_year: Current year in simulation
        years_elapsed: Years since start of simulation
        exchange_rate: USD/JPY exchange rate
    
    Returns:
        Asset value in USD
    """
    # Start with current value
    value = asset.current_value
    
    # Apply growth and contributions for each year
    for year in range(years_elapsed):
        # Apply annual return
        value *= (1 + asset.expected_return_rate)
        # Add annual contributions (monthly * 12)
        value += asset.contribution_monthly * 12
    
    # Convert to USD if needed
    if asset.currency == "JPY":
        value = value / exchange_rate
    
    return value


def calculate_pension_income(
    pension: Pension,
    current_age: int,
    years_since_start: int,
    inflation_rate: float,
    exchange_rate: float
) -> float:
    """
    Calculate annual pension income for a given year.
    
    Args:
        pension: Pension object
        current_age: Current age in simulation
        years_since_start: Years since pension started (0 if not started)
        inflation_rate: Annual inflation rate
        exchange_rate: USD/JPY exchange rate
    
    Returns:
        Annual pension income in USD (0 if not started)
    """
    # Check if pension has started
    if current_age < pension.start_age:
        return 0.0
    
    # Calculate monthly amount
    monthly_amount = pension.monthly_amount_estimated
    
    # Apply inflation adjustment if configured
    if pension.is_inflation_adjusted and years_since_start > 0:
        monthly_amount *= (1 + inflation_rate) ** years_since_start
    
    # Calculate annual income
    annual_income = monthly_amount * 12
    
    # Convert to USD if needed
    if pension.currency == "JPY":
        annual_income = annual_income / exchange_rate
    
    return annual_income


def apply_life_event_impact(
    event: LifeEvent,
    current_year: int,
    current_month: int
) -> tuple[float, float]:
    """
    Check if a life event occurs and return its impact.
    
    Args:
        event: LifeEvent object
        current_year: Current year in simulation
        current_month: Current month in simulation
    
    Returns:
        Tuple of (one_time_impact, monthly_impact)
    """
    # Check if event occurs in this period
    if event.year == current_year and event.month == current_month:
        return (event.impact_one_time, event.impact_monthly)
    
    # If event has already occurred, apply monthly impact
    if event.year < current_year or (event.year == current_year and event.month < current_month):
        return (0.0, event.impact_monthly)
    
    return (0.0, 0.0)


from datetime import datetime

def run_simulation(input_data: SimulationInput) -> List[dict]:
    """
    Run the financial simulation based on input data.
    
    Args:
        input_data: SimulationInput containing profile, assets, pensions, and life events
    
    Returns:
        List of simulation results for each year
    """
    results = []
    profile = input_data.profile
    
    # Calculate simulation range
    start_year = profile.birth_year
    end_year = start_year + profile.life_expectancy
    current_real_year = datetime.now().year
    
    # Initialize asset states with 0 (will be set to current_value at current_real_year)
    # We use a dictionary to track the running value of each asset by ID
    # But since we only output total assets, we can just track the list of asset values
    # actually, we need to track each asset individually to apply its specific growth rate
    
    # However, for years < current_real_year, we don't have data.
    # We will output 0 for total assets in the past.
    # We will initialize the running values at year == current_real_year.
    
    running_asset_values = {} # Map asset_id -> current value
    
    # Track recurring monthly impacts from life events
    recurring_monthly_impact = 0.0
    
    for year in range(start_year, end_year + 1):
        current_age = year - profile.birth_year
        
        # 1. Initialize or Update Asset Values
        if year < current_real_year:
            # Past: We don't know the history, so we report 0 for simplicity
            # (Or we could try to back-calculate, but that's complex/inaccurate)
            total_assets = 0.0
        elif year == current_real_year:
            # Present: Initialize with user inputs
            total_assets = 0.0
            for asset in input_data.assets:
                running_asset_values[asset.id] = asset.current_value
                total_assets += asset.current_value
        else:
            # Future: Apply growth and contributions to running values
            total_assets = 0.0
            for asset in input_data.assets:
                if asset.id in running_asset_values:
                    # Apply annual return
                    running_asset_values[asset.id] *= (1 + asset.expected_return_rate)
                    # Add annual contributions
                    running_asset_values[asset.id] += asset.contribution_monthly * 12
                    
                    # Convert to USD for display if needed (assuming running value is in native currency)
                    # Wait, the input current_value is just a number. The asset has a currency field.
                    # We should track values in their native currency and convert only for the total sum.
                    
                    val_in_usd = running_asset_values[asset.id]
                    if asset.currency == "JPY":
                        val_in_usd /= input_data.exchange_rate_usd_jpy
                    
                    total_assets += val_in_usd
            
        # 2. Calculate Pension Income (only relevant if it adds to assets)
        # In this simple model, we assume surplus income becomes assets (cash?)
        # But we don't have a "Cash" asset bucket that automatically grows.
        # We will add net income (pension + life events) to the total_assets directly.
        # To do this properly in the loop, we should distribute it to some asset or just keep a "Cash" accumulator.
        # For simplicity, let's add it to a generic "Accumulated Cash" bucket if year >= current_real_year.
        
        total_pension_income = 0.0
        if year >= current_real_year:
            for pension in input_data.pensions:
                if current_age >= pension.start_age:
                    monthly = pension.monthly_amount_estimated
                    # Inflation
                    years_since_start = max(0, year - current_real_year) # Simplified inflation from now
                    # Actually inflation should start from now, not from pension start?
                    # Usually inflation applies from today.
                    
                    if pension.currency == "USD":
                        inflation = input_data.inflation_rate_us
                    else:
                        inflation = input_data.inflation_rate_jp
                        
                    if pension.is_inflation_adjusted:
                        monthly *= (1 + inflation) ** years_since_start
                    
                    annual = monthly * 12
                    if pension.currency == "JPY":
                        annual /= input_data.exchange_rate_usd_jpy
                    
                    total_pension_income += annual

        # 3. Life Events
        one_time_impact = 0.0
        # Update recurring impact
        for event in input_data.life_events:
            if event.year == year and event.month == 1: # Simplified to annual resolution
                one_time_impact += event.impact_one_time
                recurring_monthly_impact += event.impact_monthly
            elif event.year == year:
                 # If event starts mid-year, we should handle it, but for now let's just add it
                 one_time_impact += event.impact_one_time
                 recurring_monthly_impact += event.impact_monthly

        # Apply Net Income to Assets (Future only)
        if year > current_real_year:
            # We need a place to store this "extra" money.
            # Let's assume it goes into a "Savings" bucket (0% growth for now, or inflation matched?)
            # For this MVP, we'll just add it to the total. 
            # Ideally, we should have a "Cash" asset in running_asset_values.
            
            net_annual_flow = total_pension_income + one_time_impact + (recurring_monthly_impact * 12)
            
            # We simply add this to the total. 
            # Note: This doesn't compound the net flow! 
            # To fix this, we should treat this 'surplus' as a new contribution to a generic asset.
            # Let's add it to the first asset? No, that's arbitrary.
            # Let's just keep a separate "accumulated_surplus" variable.
            pass # Logic handled below
            
    # Refined Loop for State Tracking
    # -------------------------------
    # Let's restart the loop logic to be cleaner.
    
    results = []
    
    # State
    asset_states = {} # id -> value (native currency)
    accumulated_surplus = 0.0 # USD
    
    current_recurring_monthly_impact = 0.0 # USD
    
    for year in range(start_year, end_year + 1):
        current_age = year - profile.birth_year
        
        # --- 1. Handle Past/Present/Future ---
        if year < current_real_year:
            # Past: Just show 0
            results.append({"year": year, "age": current_age, "total_assets": 0.0})
            continue
            
        if year == current_real_year:
            # Initialization Year
            total_val_usd = 0.0
            for asset in input_data.assets:
                asset_states[asset.id] = asset.current_value
                
                val_usd = asset.current_value
                if asset.currency == "JPY":
                    val_usd /= input_data.exchange_rate_usd_jpy
                total_val_usd += val_usd
            
            # Initialize recurring impacts that might have started in the past?
            # The current input doesn't specify start date for recurring, only "Year".
            # We assume Life Events in the input list are FUTURE or CURRENT events?
            # If user enters a past event, we should probably pick up its recurring impact.
            for event in input_data.life_events:
                if event.year <= current_real_year:
                    current_recurring_monthly_impact += event.impact_monthly
            
            # Create initial asset breakdown
            initial_asset_breakdown = {}
            for asset in input_data.assets:
                val_usd = asset.current_value
                if asset.currency == "JPY":
                    val_usd /= input_data.exchange_rate_usd_jpy
                initial_asset_breakdown[asset.name] = round(val_usd, 2)

            results.append({
                "year": year, 
                "age": current_age, 
                "total_assets": round(total_val_usd, 2),
                "pension_incomes": {},
                "asset_balances": initial_asset_breakdown,
                "asset_drawdowns": {}
            })
            continue
            
        # --- Future Years (year > current_real_year) ---
        
        # A. Grow Existing Assets
        year_total_assets_usd = 0.0
        asset_breakdown = {}
        asset_drawdowns = {}
        
        for asset in input_data.assets:
            if asset.id in asset_states:
                # Grow
                asset_states[asset.id] *= (1 + asset.expected_return_rate)
                
                # Contribute (only if before retirement)
                # Strictly enforce retirement age for stopping contributions
                if current_age < profile.retirement_age:
                    asset_states[asset.id] += asset.contribution_monthly * 12
                
                # Withdraw (if applicable)
                withdrawal_amount_usd = 0.0
                if asset.withdrawal_start_age is not None and current_age >= asset.withdrawal_start_age:
                    # Calculate withdrawal in native currency
                    withdrawal_native = asset_states[asset.id] * asset.withdrawal_rate
                    asset_states[asset.id] -= withdrawal_native
                    
                    # Convert withdrawal to USD for reporting
                    withdrawal_amount_usd = withdrawal_native
                    if asset.currency == "JPY":
                        withdrawal_amount_usd /= input_data.exchange_rate_usd_jpy
                    
                    asset_drawdowns[asset.name] = round(withdrawal_amount_usd, 2)
                
                # Convert to USD
                val_usd = asset_states[asset.id]
                if asset.currency == "JPY":
                    val_usd /= input_data.exchange_rate_usd_jpy
                
                year_total_assets_usd += val_usd
                asset_breakdown[asset.name] = round(val_usd, 2)
        
        # B. Calculate Pension Income for this year
        year_pension_income_usd = 0.0
        pension_breakdown = {}
        
        for pension in input_data.pensions:
            if current_age >= pension.start_age:
                monthly = pension.monthly_amount_estimated
                # Inflation from NOW
                years_from_now = year - current_real_year
                
                inflation = input_data.inflation_rate_us if pension.currency == "USD" else input_data.inflation_rate_jp
                
                if pension.is_inflation_adjusted:
                    monthly *= (1 + inflation) ** years_from_now
                
                annual = monthly * 12
                if pension.currency == "JPY":
                    annual /= input_data.exchange_rate_usd_jpy
                
                year_pension_income_usd += annual
                pension_breakdown[pension.name] = round(annual, 2)
            else:
                pension_breakdown[pension.name] = 0.0
        
        # C. Life Events for this year
        year_one_time_impact_usd = 0.0
        for event in input_data.life_events:
            if event.year == year:
                year_one_time_impact_usd += event.impact_one_time
                
                # Handle recurring impact start
                monthly_impact = event.impact_monthly
                if event.is_inflation_adjusted:
                    # Apply inflation from NOW until event start
                    years_from_now = max(0, year - current_real_year)
                    # Use US inflation as default for life events (or could be mixed, but simple for now)
                    monthly_impact *= (1 + input_data.inflation_rate_us) ** years_from_now
                
                current_recurring_monthly_impact += monthly_impact

        # Apply inflation to ALREADY ACTIVE recurring impacts?
        # The current logic sums up impacts. If we want dynamic inflation on the total recurring impact,
        # we need to track each active recurring event separately.
        # For MVP, let's assume the 'current_recurring_monthly_impact' is fixed once added, 
        # UNLESS we refactor to track active events.
        # Refactoring to track active events is better for "inflation adjusted living cost".
        
        # REFACTOR: Track active recurring events
        # We need to rebuild current_recurring_monthly_impact each year from active events to apply inflation correctly.
        # But `current_recurring_monthly_impact` variable was accumulating. 
        # Let's change strategy: Iterate all events, check if they are active (year <= current_year), and sum them up.
        
        current_recurring_monthly_impact = 0.0
        for event in input_data.life_events:
            if event.year <= year:
                # Event is active
                monthly = event.impact_monthly
                if monthly != 0:
                    if event.is_inflation_adjusted:
                        years_from_now = max(0, year - current_real_year)
                        monthly *= (1 + input_data.inflation_rate_us) ** years_from_now
                    current_recurring_monthly_impact += monthly
        
        # D. Net Flow (Income - Expenses)
        # Expenses are negative impacts in life events
        # Note: Asset withdrawals are also "Income" in terms of cash flow available for spending,
        # but they are already deducted from assets.
        # If we want to track "Total Income Available", we should sum pension + withdrawals.
        # But for "Net Flow" affecting Surplus, withdrawals are just a transfer from Asset to Cash (Surplus).
        
        total_withdrawals_usd = sum(asset_drawdowns.values())
        net_annual_flow = year_pension_income_usd + year_one_time_impact_usd + (current_recurring_monthly_impact * 12) + total_withdrawals_usd
        
        # E. Apply Net Flow to Surplus
        # We assume surplus grows at inflation rate (purchasing power parity) or 0? 
        # Let's assume it's cash earning 0% real return (so just inflation adjusted? or just nominal 0?)
        # Let's keep it simple: nominal 0 growth for surplus cash.
        accumulated_surplus += net_annual_flow
        
        # Final Total
        total = year_total_assets_usd + accumulated_surplus
        results.append({
            "year": year,
            "age": current_age,
            "total_assets": round(total, 2),
            "pension_incomes": pension_breakdown,
            "asset_balances": asset_breakdown,
            "asset_drawdowns": asset_drawdowns
        })

    return results
