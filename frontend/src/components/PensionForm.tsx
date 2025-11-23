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
import type { Pension } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { Checkbox } from "./ui/checkbox";

const formSchema = z.object({
    name: z.string().min(2),
    type: z.enum(["SocialSecurity", "JPPension", "PrivateAnnuity", "Other"]),
    start_age: z.coerce.number().min(50).max(80),
    monthly_amount_estimated: z.coerce.number().min(0),
    currency: z.enum(["USD", "JPY"]),
    is_inflation_adjusted: z.boolean().default(true),
});

interface PensionFormProps {
    onSubmit: (pension: Pension) => void;
}

export function PensionForm({ onSubmit }: PensionFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "SocialSecurity",
            start_age: 65,
            monthly_amount_estimated: 0,
            currency: "USD",
            is_inflation_adjusted: true,
        },
    });

    function handleSubmit(values: z.infer<typeof formSchema>) {
        const pension: Pension = {
            id: uuidv4(),
            ...values,
        };
        onSubmit(pension);
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
                            <FormLabel>Pension Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. US Social Security" {...field} />
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
                                        <SelectItem value="SocialSecurity">Social Security (US)</SelectItem>
                                        <SelectItem value="JPPension">Japan Pension (Nenkin)</SelectItem>
                                        <SelectItem value="PrivateAnnuity">Private Annuity</SelectItem>
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
                        name="start_age"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Age</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="monthly_amount_estimated"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monthly Amount (Est.)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="is_inflation_adjusted"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Inflation Adjusted?
                                </FormLabel>
                            </div>
                        </FormItem>
                    )}
                />
                <Button type="submit">Add Pension</Button>
            </form>
        </Form>
    );
}
