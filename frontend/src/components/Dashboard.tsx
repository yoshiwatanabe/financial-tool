import { useState } from "react";
import type { Asset, Pension, LifeEvent, UserProfile, SimulationInput, SimulationResult } from "../types";
import { AssetForm } from "./AssetForm";
import { PensionForm } from "./PensionForm";
import { LifeEventForm } from "./LifeEventForm";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, BarChart, Bar } from 'recharts';

export function Dashboard() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [pensions, setPensions] = useState<Pension[]>([]);
    const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
    const [profile, setProfile] = useState<UserProfile>({
        birth_year: 1975,
        spouse_birth_year: 1975,
        current_location: "US",
        retirement_age: 65,
        life_expectancy: 95,
    });
    const [simulationResult, setSimulationResult] = useState<SimulationResult[] | null>(null);

    const handleAddAsset = (asset: Asset) => {
        setAssets([...assets, asset]);
    };

    const handleAddPension = (pension: Pension) => {
        setPensions([...pensions, pension]);
    };

    const handleAddLifeEvent = (event: LifeEvent) => {
        setLifeEvents([...lifeEvents, event]);
    };

    const runSimulation = async () => {
        const input: SimulationInput = {
            profile,
            assets,
            pensions,
            life_events: lifeEvents,
            exchange_rate_usd_jpy: 150,
            inflation_rate_us: 0.02,
            inflation_rate_jp: 0.01,
        };

        try {
            const response = await fetch('http://localhost:8000/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
            });
            const result = await response.json();
            setSimulationResult(result);
        } catch (error) {
            console.error("Simulation failed:", error);
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-8">
            <h1 className="text-3xl font-bold">Cross-Border Financial Simulator</h1>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col space-y-1.5">
                        <label htmlFor="birth_year" className="text-sm font-medium">Your Birth Year</label>
                        <input
                            id="birth_year"
                            type="number"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={profile.birth_year}
                            onChange={(e) => setProfile({ ...profile, birth_year: parseInt(e.target.value) || 1975 })}
                        />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <label htmlFor="spouse_birth_year" className="text-sm font-medium">Spouse Birth Year</label>
                        <input
                            id="spouse_birth_year"
                            type="number"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={profile.spouse_birth_year}
                            onChange={(e) => setProfile({ ...profile, spouse_birth_year: parseInt(e.target.value) || 1975 })}
                        />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <label htmlFor="retirement_age" className="text-sm font-medium">Retirement Age</label>
                        <input
                            id="retirement_age"
                            type="number"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={profile.retirement_age}
                            onChange={(e) => setProfile({ ...profile, retirement_age: parseInt(e.target.value) || 65 })}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AssetForm onSubmit={handleAddAsset} />
                        <div className="mt-4 space-y-2">
                            {assets.map((a, index) => (
                                <div key={index} className="flex justify-between items-center text-sm p-2 bg-secondary/20 rounded">
                                    <span>{a.name}: {a.currency} {a.current_value}</span>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        const newAssets = [...assets];
                                        newAssets.splice(index, 1);
                                        setAssets(newAssets);
                                    }}>×</Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pensions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PensionForm onSubmit={handleAddPension} />
                        <div className="mt-4 space-y-2">
                            {pensions.map((p, index) => (
                                <div key={index} className="flex justify-between items-center text-sm p-2 bg-secondary/20 rounded">
                                    <span>{p.name}: {p.currency} {p.monthly_amount_estimated}/mo</span>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        const newPensions = [...pensions];
                                        newPensions.splice(index, 1);
                                        setPensions(newPensions);
                                    }}>×</Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Life Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LifeEventForm onSubmit={handleAddLifeEvent} />
                        <div className="mt-4 space-y-2">
                            {lifeEvents.map((e, index) => (
                                <div key={index} className="flex justify-between items-center text-sm p-2 bg-secondary/20 rounded">
                                    <span>{e.name} ({e.year}) - Impact: ${e.impact_monthly}/mo</span>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        const newEvents = [...lifeEvents];
                                        newEvents.splice(index, 1);
                                        setLifeEvents(newEvents);
                                    }}>×</Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={async () => {
                    try {
                        const input: SimulationInput = {
                            profile,
                            assets,
                            pensions,
                            life_events: lifeEvents,
                            exchange_rate_usd_jpy: 150,
                            inflation_rate_us: 0.02,
                            inflation_rate_jp: 0.01,
                        };
                        const response = await fetch('http://localhost:8000/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(input),
                        });
                        const result = await response.json();
                        if (result.status === 'success') {
                            alert('Data saved successfully!');
                        } else {
                            alert('Failed to save data: ' + result.message);
                        }
                    } catch (error) {
                        console.error('Save failed:', error);
                        alert('Save failed. See console for details.');
                    }
                }}>Save Data</Button>

                <Button variant="outline" onClick={async () => {
                    try {
                        const response = await fetch('http://localhost:8000/load');
                        const result = await response.json();
                        if (result.status === 'error') {
                            alert('Failed to load data: ' + result.message);
                            return;
                        }

                        // Update state with loaded data
                        if (result.assets) setAssets(result.assets);
                        if (result.pensions) setPensions(result.pensions);
                        if (result.life_events) setLifeEvents(result.life_events);
                        if (result.profile) setProfile(result.profile);

                        alert('Data loaded successfully!');
                    } catch (error) {
                        console.error('Load failed:', error);
                        alert('Load failed. See console for details.');
                    }
                }}>Load Data</Button>

                <Button size="lg" onClick={runSimulation}>Run Simulation</Button>
            </div>

            {simulationResult && (
                <Card>
                    <CardHeader>
                        <CardTitle>Simulation Results</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={simulationResult}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis
                                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                                />
                                <Tooltip
                                    labelFormatter={(year) => {
                                        const age = year - profile.birth_year;
                                        return `${year} (Age: ${age})`;
                                    }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Total Assets"]}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="total_assets" stroke="#8884d8" name="Total Assets" />
                                <ReferenceLine x={new Date().getFullYear()} stroke="green" label="Now" />
                                {lifeEvents.map((event, index) => (
                                    <ReferenceLine key={index} x={event.year} stroke="red" label={event.name} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {simulationResult && pensions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Annual Pension Income (Projected)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={simulationResult}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    labelFormatter={(year) => {
                                        const age = year - profile.birth_year;
                                        return `${year} (Age: ${age})`;
                                    }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                                />
                                <Legend />
                                {pensions.map((p, index) => (
                                    <Bar
                                        key={p.id}
                                        dataKey={`pension_incomes.${p.name}`}
                                        name={p.name}
                                        stackId="a"
                                        fill={`hsl(${index * 60}, 70%, 50%)`}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
