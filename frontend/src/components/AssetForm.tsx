import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import type { Asset } from "../types";
import { v4 as uuidv4 } from 'uuid';

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    type: z.enum(["401k", "IRA", "RothIRA", "Brokerage", "Crypto", "RealEstate", "Cash", "Other"]),
    current_value: z.coerce.number().min(0),
    currency: z.enum(["USD", "JPY"]),
    contribution_monthly: z.coerce.number().min(0),
    expected_return_rate: z.coerce.number().min(0).max(1),
    withdrawal_start_age: z.number().optional(),
    withdrawal_rate: z.number().min(0).max(1).optional(),
});

interface AssetFormProps {
    onSubmit: (asset: Asset) => void;
}

export function AssetForm({ onSubmit }: AssetFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "401k",
            current_value: 0,
            currency: "USD",
            contribution_monthly: 0,
            expected_return_rate: 0.05,
            withdrawal_rate: 0,
        },
    });

    function handleSubmit(values: z.infer<typeof formSchema>) {
        const asset: Asset = {
            id: uuidv4(),
            ...values,
            contribution_currency: values.currency, // Default to same currency for now
            is_taxable: values.type !== "401k" && values.type !== "IRA" && values.type !== "RothIRA",
        };
        onSubmit(asset);
        form.reset();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 border p-4 rounded-lg">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Asset Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Fidelity 401k" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="401k">401k</SelectItem>
                                        <SelectItem value="IRA">IRA</SelectItem>
                                        <SelectItem value="RothIRA">Roth IRA</SelectItem>
                                        <SelectItem value="Brokerage">Brokerage</SelectItem>
                                        <SelectItem value="Crypto">Crypto</SelectItem>
                                        <SelectItem value="RealEstate">Real Estate</SelectItem>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="JPY">JPY</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="current_value"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Value</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="contribution_monthly"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monthly Contribution</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4 border-t pt-4 mt-4">
                    <h4 className="font-medium text-sm">Withdrawal Strategy (Optional)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="withdrawal_start_age"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Age</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g. 65" {...field}
                                            value={field.value || ''}
                                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="withdrawal_rate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Annual Rate (%)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" placeholder="e.g. 4.0" {...field}
                                            value={field.value ? (field.value * 100).toString() : ''}
                                            onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) / 100 : 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <Button type="submit">Add Asset</Button>
            </form>
        </Form >
    );
}
