export type AssetType = "401k" | "IRA" | "RothIRA" | "Brokerage" | "Crypto" | "RealEstate" | "Cash" | "Other";
export type Currency = "USD" | "JPY";

export interface Asset {
    id: string;
    name: string;
    type: AssetType;
    current_value: number;
    currency: Currency;
    contribution_monthly: number;
    contribution_currency: Currency;
    expected_return_rate: number;
    is_taxable: boolean;
}

export type PensionType = "SocialSecurity" | "JPPension" | "PrivateAnnuity" | "Other";

export interface Pension {
    id: string;
    name: string;
    type: PensionType;
    start_age: number;
    monthly_amount_estimated: number;
    currency: Currency;
    is_inflation_adjusted: boolean;
}

export type LifeEventType = "Retirement" | "Relocation" | "EducationEnd" | "Other";

export interface LifeEvent {
    id: string;
    name: string;
    type: LifeEventType;
    year: number;
    month: number;
    description?: string;
    impact_one_time: number;
    impact_monthly: number;
}

export interface UserProfile {
    birth_year: number;
    spouse_birth_year?: number;
    current_location: "US" | "JP";
    retirement_age: number;
    life_expectancy: number;
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
}
