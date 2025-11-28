import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { SimulationResult, UserProfile, Pension } from "../types";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

interface InheritanceCalculatorProps {
    simulationResult: SimulationResult[];
    profile: UserProfile;
    pensions: Pension[];
    exchangeRate: number;
}


export function InheritanceCalculator({ simulationResult, profile, pensions, exchangeRate }: InheritanceCalculatorProps) {
    const currentYear = new Date().getFullYear();
    const [inheritanceYear, setInheritanceYear] = useState<number>(currentYear + 10);
    const [interestRate, setInterestRate] = useState<number>(2.5); // Default 2.5%
    const [spouseLifeExpectancyAge, setSpouseLifeExpectancyAge] = useState<number>(87); // Default 87 for female
    const [numberOfHeirs, setNumberOfHeirs] = useState<number>(1); // Default 1 heir
    const [calculationExchangeRate, setCalculationExchangeRate] = useState<number>(exchangeRate);

    // Find the simulation result for the selected inheritance year
    const targetResult = useMemo(() => {
        return simulationResult.find(r => r.year === inheritanceYear);
    }, [simulationResult, inheritanceYear]);

    // Calculate Pension Valuations (PV Method)
    const pensionValuations = useMemo(() => {
        if (!targetResult) return [];

        const spouseAgeAtInheritance = inheritanceYear - (profile.spouse_birth_year || profile.birth_year);
        const remainingLifeExpectancy = Math.max(0, spouseLifeExpectancyAge - spouseAgeAtInheritance);

        // PV Factor Formula: (1 - (1 + r)^-n) / r
        const r = interestRate / 100;
        const n = remainingLifeExpectancy;
        let pvFactor = 0;

        if (r === 0) {
            pvFactor = n;
        } else {
            pvFactor = (1 - Math.pow(1 + r, -n)) / r;
        }

        return pensions.map(pension => {
            const annualAmountUSD = targetResult.pension_incomes[pension.name] || 0;
            const valuationUSD = annualAmountUSD * pvFactor;
            const valuationJPY = valuationUSD * calculationExchangeRate;

            return {
                name: pension.name,
                annualAmountUSD,
                valuationUSD,
                valuationJPY
            };
        });
    }, [targetResult, pensions, interestRate, spouseLifeExpectancyAge, inheritanceYear, profile, calculationExchangeRate]);

    // Calculate Asset Valuations (Balance Method)
    const assetValuations = useMemo(() => {
        if (!targetResult || !targetResult.asset_balances) return [];

        return Object.entries(targetResult.asset_balances).map(([name, balanceUSD]) => {
            const valuationJPY = balanceUSD * calculationExchangeRate;
            return {
                name,
                balanceUSD,
                valuationUSD: balanceUSD, // For assets, valuation is the balance
                valuationJPY
            };
        });
    }, [targetResult, calculationExchangeRate]);

    const spouseAge = inheritanceYear - (profile.spouse_birth_year || profile.birth_year);
    const remainingYears = Math.max(0, spouseLifeExpectancyAge - spouseAge);

    // Totals
    const totalPensionValuationJPY = pensionValuations.reduce((sum, v) => sum + v.valuationJPY, 0);
    const totalAssetValuationJPY = assetValuations.reduce((sum, v) => sum + v.valuationJPY, 0);
    const totalValuationJPY = totalPensionValuationJPY + totalAssetValuationJPY;

    const exemptionLimit = 5000000 * numberOfHeirs;

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Inheritance Tax Valuation Estimator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Inheritance Year (Year of Death): {inheritanceYear} (Spouse Age: {spouseAge})</Label>
                            <Slider
                                value={[inheritanceYear]}
                                min={currentYear}
                                max={currentYear + 50}
                                step={1}
                                onValueChange={(vals: number[]) => setInheritanceYear(vals[0])}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Statutory Interest Rate (%)</Label>
                                <Input
                                    type="number"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                                    step={0.1}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Spouse Life Expectancy Age</Label>
                                <Input
                                    type="number"
                                    value={spouseLifeExpectancyAge}
                                    onChange={(e) => setSpouseLifeExpectancyAge(parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Number of Statutory Heirs</Label>
                                <Input
                                    type="number"
                                    value={numberOfHeirs}
                                    onChange={(e) => setNumberOfHeirs(parseInt(e.target.value) || 1)}
                                    min={1}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Exchange Rate (USD/JPY)</Label>
                                <Input
                                    type="number"
                                    value={calculationExchangeRate}
                                    onChange={(e) => setCalculationExchangeRate(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Heirs used for Exemption (5M JPY × Heirs). Exchange Rate used for JPY Valuation.
                        </p>
                    </div>

                    <div className="space-y-4 bg-secondary/20 p-4 rounded-md">
                        <h3 className="font-semibold">Calculation Parameters</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span>Remaining Life Expectancy:</span>
                            <span className="font-mono">{remainingYears} years</span>

                            <span>PV Factor (複利年金現価率):</span>
                            <span className="font-mono">
                                {interestRate > 0
                                    ? ((1 - Math.pow(1 + interestRate / 100, -remainingYears)) / (interestRate / 100)).toFixed(3)
                                    : remainingYears.toFixed(3)}
                            </span>

                            <span className="font-semibold mt-2">Exemption Limit (非課税枠):</span>
                            <span className="font-mono font-semibold mt-2">¥{exemptionLimit.toLocaleString()}</span>

                            <span className="font-semibold">Exchange Rate:</span>
                            <span className="font-mono">¥{calculationExchangeRate}/USD</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-8">
                    {/* Pensions Table */}
                    <div>
                        <h3 className="font-semibold mb-2">1. Foreign Pensions (PV Method)</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                            Valued based on Present Value of Life Annuity (Social Security, Annuities).
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-secondary/50">
                                    <tr>
                                        <th className="px-4 py-2">Pension Name</th>
                                        <th className="px-4 py-2">Annual Amount (USD)</th>
                                        <th className="px-4 py-2">Valuation (USD)</th>
                                        <th className="px-4 py-2">Valuation (JPY)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pensionValuations.map((v, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="px-4 py-2 font-medium">{v.name}</td>
                                            <td className="px-4 py-2">${v.annualAmountUSD.toLocaleString()}</td>
                                            <td className="px-4 py-2">${v.valuationUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                            <td className="px-4 py-2 font-bold">¥{v.valuationJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-secondary/10 font-bold">
                                        <td className="px-4 py-2">Subtotal</td>
                                        <td className="px-4 py-2">-</td>
                                        <td className="px-4 py-2">${pensionValuations.reduce((sum, v) => sum + v.valuationUSD, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td className="px-4 py-2">¥{totalPensionValuationJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Assets Table */}
                    <div>
                        <h3 className="font-semibold mb-2">2. Assets (Balance Method)</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                            Valued based on account balance at time of death (401k, IRA, Savings).
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-secondary/50">
                                    <tr>
                                        <th className="px-4 py-2">Asset Name</th>
                                        <th className="px-4 py-2">Balance (USD)</th>
                                        <th className="px-4 py-2">Valuation (USD)</th>
                                        <th className="px-4 py-2">Valuation (JPY)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assetValuations.map((v, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="px-4 py-2 font-medium">{v.name}</td>
                                            <td className="px-4 py-2">${v.balanceUSD.toLocaleString()}</td>
                                            <td className="px-4 py-2">${v.valuationUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                            <td className="px-4 py-2 font-bold">¥{v.valuationJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-secondary/10 font-bold">
                                        <td className="px-4 py-2">Subtotal</td>
                                        <td className="px-4 py-2">-</td>
                                        <td className="px-4 py-2">${assetValuations.reduce((sum, v) => sum + v.valuationUSD, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td className="px-4 py-2">¥{totalAssetValuationJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Grand Total */}
                    <div className="bg-secondary/20 p-4 rounded-md">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Total Estimated Valuation (合計相続税評価額)</h3>
                            <span className="text-xl font-bold text-primary">¥{totalValuationJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-right">
                            * JPY conversion uses the specified exchange rate (1 USD = {calculationExchangeRate} JPY).
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
