"use client"
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { updateApplicationDataWithInterviewScoreApiRequest } from "../lib/apis/userApi";
import { toast } from "react-toastify";

const scoreSchema = z.object({
    distanceScore: z.coerce
        .number()
        .min(0, "Score cannot be negative")
        .max(50, "Maximum score is 50"),
    distanceKm: z.coerce
        .number()
        .min(0, "Distance must be 0 or greater"),
    incomeScore: z.coerce
        .number()
        .min(0, "Score cannot be negative")
        .max(40, "Maximum score is 40"),
    monthlyIncome: z.coerce
        .number()
        .min(0, "Income must be 0 or greater"),
    interviewScore: z.coerce
        .number()
        .min(0, "Score cannot be negative")
        .max(10, "Maximum score is 10"),
    interviewNotes: z.string().optional(),
    recommendation: z.enum(["approve", "reject"]),
});

type ScoreFormData = z.infer<typeof scoreSchema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ScoreFormData & { totalScore: number }) => Promise<void>;
    applicationData: {
        name: string;
        id: string;
        [key: string]: any;
    };
}

export function InterviewScoring({ isOpen, onClose, onSubmit, applicationData }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const form = useForm<ScoreFormData>({
        resolver: zodResolver(scoreSchema),
        defaultValues: {
            distanceScore: applicationData?.distanceScore || 0,
            distanceKm: applicationData?.distance || 0,
            incomeScore: applicationData?.incomeScore || 0,
            monthlyIncome: applicationData?.monthlyIncome || 0,
            interviewScore: 0,
            interviewNotes: applicationData?.interviewNotes || "No notes",
            recommendation: "approve",
        },
    });

    const watchScores = form.watch([
        "distanceScore",
        "incomeScore",
        "interviewScore",
    ]);

    const totalScore = useMemo(() => {
        return watchScores.reduce((sum, score) => sum + (Number(score) || 0), 0);
    }, [watchScores]);

    const scorePercentage = useMemo(() => {
        return Math.round((totalScore / 100) * 100);
    }, [totalScore]);

    useEffect(() => {
        form.setValue("recommendation", totalScore >= 70 ? "approve" : "reject", {
            shouldValidate: true,
        });
    }, [totalScore, form]);

    const handleSubmit = useCallback(
        async (data: ScoreFormData) => {
            try {
                setIsLoading(true);
                const prepareData = {
                    ...data,
                    totalScore,
                    applicationId: applicationData._id,
                    userId: applicationData.userId,
                    assessment: "completed",
                } as const;

                await updateApplicationDataWithInterviewScoreApiRequest(applicationData._id, prepareData);
                await onSubmit(prepareData);
                form.reset();
                setIsLoading(false);
                onClose();
            } catch (error) {
                console.error("Submission error:", error);
                setIsLoading(false);
                toast.error("Failed to submit assessment");
            }
        },
        [onSubmit, totalScore, form, onClose, applicationData]
    );

    const ScoreSection = useCallback(
        ({ title, maxScore, children }: { title: string; maxScore: number; children: React.ReactNode }) => (
            <Card className="border-none shadow-sm">
                <CardHeader className="p-4">
                    <CardTitle className="text-lg font-semibold text-slate-800">
                        {title} ({maxScore}%)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                    {children}
                </CardContent>
            </Card>
        ),
        []
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-900">
                        Interview Assessment
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                        Evaluating application for{" "}
                        <span className="font-semibold text-slate-700">
                            {applicationData?.name}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">Total Score</span>
                        <span className="text-sm font-bold text-slate-700">{totalScore}/100</span>
                    </div>
                    <Progress value={scorePercentage} className="h-2" />
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <div className="space-y-6">
                            <ScoreSection title="Distance Assessment" maxScore={50}>
                                <FormField
                                    control={form.control}
                                    name="distanceKm"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700">Distance (km)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    className="border-slate-200 focus:ring-slate-400"
                                                    {...field}
                                                    disabled
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="distanceScore"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700">Score (0-50)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    className="border-slate-200 focus:ring-slate-400"
                                                    {...field}
                                                    disabled
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </ScoreSection>

                            <ScoreSection title="Family Income Assessment" maxScore={40}>
                                <FormField
                                    control={form.control}
                                    name="monthlyIncome"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700">Monthly Income</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="100"
                                                    className="border-slate-200 focus:ring-slate-400"
                                                    {...field}
                                                    disabled
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="incomeScore"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700">Score (0-40)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    className="border-slate-200 focus:ring-slate-400"
                                                    {...field}
                                                    disabled
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </ScoreSection>

                            <ScoreSection title="Interview Evaluation" maxScore={10}>
                                <FormField
                                    control={form.control}
                                    name="interviewScore"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700">Score (0-10)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    className="border-slate-200 focus:ring-slate-400"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="interviewNotes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700">Interview Notes</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    rows={4}
                                                    className="resize-none border-slate-200 focus:ring-slate-400"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </ScoreSection>


                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="border-slate-200 hover:bg-slate-100"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={isLoading || form.formState.isSubmitting}
                            >
                                {isLoading || form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Assessment"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}