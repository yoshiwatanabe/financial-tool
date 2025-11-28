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
import { Checkbox } from "./ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import type { LifeEvent } from "../types";
import { v4 as uuidv4 } from 'uuid';

const formSchema = z.object({
    name: z.string().min(2),
    type: z.enum(["Retirement", "Relocation", "EducationEnd", "Other"]),
    year: z.coerce.number().min(1900).max(2100),
    month: z.coerce.number().min(1).max(12),
    description: z.string().optional(),
    impact_one_time: z.coerce.number(),
    impact_monthly: z.coerce.number(),
    is_inflation_adjusted: z.boolean().default(false),
});

type LifeEventFormValues = z.infer<typeof formSchema>;

interface LifeEventFormProps {
    onSubmit: (event: LifeEvent) => void;
}

export function LifeEventForm({ onSubmit }: LifeEventFormProps) {
    const form = useForm<LifeEventFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "Retirement",
            year: new Date().getFullYear() + 1,
            month: 1,
            description: "",
            impact_one_time: 0,
            impact_monthly: 0,
            is_inflation_adjusted: false,
        },
    });

    function handleSubmit(values: LifeEventFormValues) {
        const event: LifeEvent = {
            id: uuidv4(),
            ...values,
        };
        onSubmit(event);
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
                            <FormLabel>Event Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Retirement" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
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
                                    <SelectItem value="Retirement">Retirement</SelectItem>
                                    <SelectItem value="Relocation">Relocation (e.g. Move to Japan)</SelectItem>
                                    <SelectItem value="EducationEnd">Education End</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Year</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="month"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Month</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="impact_one_time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>One-time Impact ($)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="impact_monthly"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monthly Impact ($)</FormLabel>
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
                                    Inflation Adjusted
                                </FormLabel>
                                <p className="text-sm text-muted-foreground">
                                    If checked, the monthly impact will increase with US inflation rate.
                                </p>
                            </div>
                        </FormItem>
                    )}
                />
                <Button type="submit">Add Life Event</Button>
            </form>
        </Form>
    );
}
