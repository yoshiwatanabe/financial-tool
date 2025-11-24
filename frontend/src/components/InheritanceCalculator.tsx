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

    // Find the simulation result for the selected inheritance year
    const targetResult = useMemo(() => {
        return simulationResult.find(r => r.year === inheritanceYear);
    }, [simulationResult, inheritanceYear]);

    // Calculate valuations
    const valuations = useMemo(() => {
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
            // Get annual amount from simulation result
            // Note: simulationResult.pension_incomes is in USD
            const annualAmountUSD = targetResult.pension_incomes[pension.name] || 0;

            // Valuation in USD
            const valuationUSD = annualAmountUSD * pvFactor;

            // Valuation in JPY (using current exchange rate for simplicity, 
            // though strictly it should be rate at inheritance, which we simulate as constant or user input)
            const valuationJPY = valuationUSD * exchangeRate;

            return {
                name: pension.name,
                annualAmountUSD,
                valuationUSD,
                valuationJPY
            };
        });
    }, [targetResult, pensions, interestRate, spouseLifeExpectancyAge, inheritanceYear, profile, exchangeRate]);

    const spouseAge = inheritanceYear - (profile.spouse_birth_year || profile.birth_year);
    const remainingYears = Math.max(0, spouseLifeExpectancyAge - spouseAge);

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Inheritance Tax Valuation Estimator (Foreign Pensions)</CardTitle>
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
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="font-semibold mb-4">Estimated Valuation (相続税評価額)</h3>
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
                                {valuations.map((v, i) => (
                                    <tr key={i} className="border-b">
                                        <td className="px-4 py-2 font-medium">{v.name}</td>
                                        <td className="px-4 py-2">${v.annualAmountUSD.toLocaleString()}</td>
                                        <td className="px-4 py-2">${v.valuationUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td className="px-4 py-2 font-bold">¥{v.valuationJPY.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    </tr>
                                ))}
                                <tr className="bg-secondary/20 font-bold">
                                    <td className="px-4 py-2">Total</td>
                                    <td className="px-4 py-2">-</td>
                                    <td className="px-4 py-2">${valuations.reduce((sum, v) => sum + v.valuationUSD, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-2">¥{valuations.reduce((sum, v) => sum + v.valuationJPY, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        * Valuation calculated using "Present Value of Life Annuity" method based on the selected interest rate and remaining life expectancy.
                        <br />
                        * JPY conversion uses the current simulation exchange rate (1 USD = {exchangeRate} JPY).
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
