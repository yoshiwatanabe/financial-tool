export interface LifeEvent {
    id?: string;
    name: string;
    year: number;
    month: number;
    description?: string;
    impact_one_time: number;
    impact_monthly: number;
    is_inflation_adjusted?: boolean;
}

export interface UserProfile {
    birth_year: number;
    life_expectancy: number;
    retirement_age: number;
    spouse_birth_year?: number;
}

export interface Asset {
    id?: string;
    name: string;
    type: string;
    currency: string;
    current_value: number;
    contribution_monthly: number;
    expected_return_rate: number;
    withdrawal_start_age?: number;
    withdrawal_rate?: number;
}

export interface Pension {
    id?: string;
    name: string;
    currency: string;
    monthly_amount_estimated: number;
    start_age: number;
    is_inflation_adjusted: boolean;
}

export interface SimulationInput {
    profile: UserProfile;
    assets: Asset[];
    pensions: Pension[];
    life_events: LifeEvent[];
    exchange_rate_usd_jpy: number;
    inflation_rate_us: number;
    inflation_rate_jp: number;
}

export interface SimulationResult {
    year: number;
    age: number;
    total_assets: number;
    pension_incomes: Record<string, number>;
    asset_balances?: Record<string, number>;
    asset_drawdowns?: Record<string, number>;
}
