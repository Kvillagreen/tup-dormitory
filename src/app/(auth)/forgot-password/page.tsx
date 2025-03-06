"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { resetPasswordEmailApiRequest, verifyOtpApiRequest, setNewPasswordApiRequest } from "@/src/lib/apis/userApi";

// Update validation schemas with more specific rules
const emailSchema = z.object({
    email: z.string()
        .min(1, "Email is required")
        .email("Please enter a valid email address")
});

const otpSchema = z.object({
    digit1: z.string().length(1, "Required"),
    digit2: z.string().length(1, "Required"),
    digit3: z.string().length(1, "Required"),
    digit4: z.string().length(1, "Required"),
    digit5: z.string().length(1, "Required"),
    digit6: z.string().length(1, "Required")
});

const passwordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ForgotPassword() {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState<"email" | "otp" | "password">("email");
    const [userEmail, setUserEmail] = useState("");

    // Reference for OTP inputs to manage focus
    const [otpRefs, setOtpRefs] = useState<(HTMLInputElement | null)[]>([]);

    // Initialize form handlers with proper types
    const emailForm = useForm<EmailFormValues>({
        resolver: zodResolver(emailSchema),
        defaultValues: {
            email: ""
        }
    });

    const otpForm = useForm<OtpFormValues>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            digit1: "",
            digit2: "",
            digit3: "",
            digit4: "",
            digit5: "",
            digit6: ""
        }
    });

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password: "",
            confirmPassword: ""
        }
    });

    // Setup OTP input references
    useEffect(() => {
        setOtpRefs(Array(6).fill(null));
    }, []);

    // Handle OTP input focus management
    const handleOtpInput = (index: number, value: string) => {
        // Only accept digits
        if (!/^\d*$/.test(value)) return;

        // Auto-focus next input on entry
        if (value && index < 5 && otpRefs[index + 1]) {
            otpRefs[index + 1]?.focus();
        }
    };

    // Handle backspace in OTP inputs
    const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === "Backspace" && index > 0 && !otpForm.getValues()[`digit${index + 1}` as keyof OtpFormValues]) {
            e.preventDefault();
            otpRefs[index - 1]?.focus();
        }
    };

    // Convert OTP form values to a single string
    const getOtpString = (data: OtpFormValues): string => {
        return Object.values(data).join("");
    };

    // Email submission handler
    const handleEmailSubmit = async (data: EmailFormValues) => {
        setIsLoading(true);
        try {
            console.log("data", data.email);
            // API call to request password reset
            await resetPasswordEmailApiRequest(data.email);

            // Store email for later steps
            setUserEmail(data.email || "");
            setCurrentStep("otp");

            // Focus first OTP input when showing OTP form
            setTimeout(() => {
                if (otpRefs[0]) otpRefs[0].focus();
            }, 100);

            toast.success("OTP sent to your email", {
                position: "top-right",
                autoClose: 5000
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to send OTP. Please try again.", {
                position: "top-right",
                autoClose: 5000
            });
        } finally {
            setIsLoading(false);
        }
    };

    // OTP verification handler
    const handleOtpSubmit = async (data: OtpFormValues) => {
        setIsLoading(true);
        try {
            const otpString = getOtpString(data);
            await verifyOtpApiRequest(userEmail, otpString);

            setCurrentStep("password");
            toast.success("OTP verified successfully", {
                position: "top-right",
                autoClose: 5000
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Invalid OTP. Please try again.", {
                position: "top-right",
                autoClose: 5000
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Password reset handler
    const handlePasswordSubmit = async (data: PasswordFormValues) => {
        setIsLoading(true);
        try {
            await setNewPasswordApiRequest(userEmail, data.password);

            toast.success("Password reset successful!", {
                position: "top-right",
                autoClose: 3000
            });

            // Redirect to login page after short delay
            setTimeout(() => {
                window.location.href = "/signin";
            }, 1500);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to reset password. Please try again.", {
                position: "top-right",
                autoClose: 5000
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle resend OTP
    const handleResendOtp = async () => {
        if (!userEmail) return;

        setIsLoading(true);
        try {
            await resetPasswordEmailApiRequest(userEmail);

            toast.success("New OTP sent to your email", {
                position: "top-right",
                autoClose: 5000
            });

            // Reset OTP form
            otpForm.reset();

            // Focus first OTP input
            setTimeout(() => {
                if (otpRefs[0]) otpRefs[0].focus();
            }, 100);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to resend OTP. Please try again.", {
                position: "top-right",
                autoClose: 5000
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <div className="flex items-center justify-center min-h-screen bg-gray-200">
                <Card className="p-12 w-full max-w-2xl bg-white rounded-2xl shadow-lg border-0">
                    <CardHeader className="space-y-1 flex flex-col items-center">
                        <div className=" mb-2">
                            <Image
                                src="/dormlogo.png"
                                alt="Logo"
                                width={100}
                                height={100}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <CardTitle className="text-2xl font-bold text-center">
                            {currentStep === "email" && "Reset Your Password"}
                            {currentStep === "otp" && "Verify OTP Code"}
                            {currentStep === "password" && "Create New Password"}
                        </CardTitle>
                        <CardDescription className="text-center">
                            {currentStep === "email" && "Enter your email to receive a verification code"}
                            {currentStep === "otp" && `Enter the 6-digit code sent to ${userEmail}`}
                            {currentStep === "password" && "Create a new password for your account"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {currentStep === "email" && (
                            <Form {...emailForm}>
                                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                                    <FormField
                                        control={emailForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="email"
                                                        placeholder="Email address"
                                                        autoComplete="email"
                                                        className={`w-full h-[62px] pl-8 rounded-[16.54px] placeholder:text-gray-400 ${emailForm.formState.errors.email ? 'border-red-500 focus:ring-red-500' : ''
                                                            }`}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-sm text-red-500 mt-1" />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full h-[75px] rounded-2xl bg-[#8b2131] hover:bg-[#761b29] text-white"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Sending..." : "Send Verification Code"}
                                    </Button>
                                </form>
                            </Form>
                        )}

                        {currentStep === "otp" && (
                            <Form {...otpForm}>
                                <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
                                    <div className="flex flex-col space-y-4">
                                        <div className="flex justify-center space-x-2">
                                            {/* OTP input fields (6 digits) */}
                                            {Array.from({ length: 6 }).map((_, index) => (
                                                <FormField
                                                    key={index}
                                                    control={otpForm.control}
                                                    name={`digit${index + 1}` as keyof OtpFormValues}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    maxLength={1}
                                                                    className={`w-[50px] h-[62px] text-center rounded-[16.54px] placeholder:text-gray-400 ${otpForm.formState.errors[`digit${index + 1}` as keyof OtpFormValues]
                                                                        ? 'border-red-500 focus:ring-red-500'
                                                                        : ''
                                                                        }`}
                                                                    onChange={(e) => {
                                                                        field.onChange(e);
                                                                        handleOtpInput(index, e.target.value);
                                                                    }}
                                                                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                                                    ref={(el) => {
                                                                        otpRefs[index] = el;
                                                                    }}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>

                                        <div className="text-center">
                                            {(otpForm.formState.errors.digit1 ||
                                                otpForm.formState.errors.digit2 ||
                                                otpForm.formState.errors.digit3 ||
                                                otpForm.formState.errors.digit4 ||
                                                otpForm.formState.errors.digit5 ||
                                                otpForm.formState.errors.digit6) && (
                                                    <p className="text-sm font-medium text-red-500 mt-2">
                                                        Please enter all 6 digits
                                                    </p>
                                                )}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-[75px] rounded-2xl bg-[#8b2131] hover:bg-[#761b29] text-white"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Verifying..." : "Verify Code"}
                                    </Button>

                                    <div className="text-sm text-center mt-2">
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            className="text-[#8b2131] hover:text-[#761b29] hover:underline"
                                            disabled={isLoading}
                                        >
                                            Didn't receive a code? Send again
                                        </button>
                                    </div>
                                </form>
                            </Form>
                        )}

                        {currentStep === "password" && (
                            <Form {...passwordForm}>
                                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                                    <FormField
                                        control={passwordForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>New Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        placeholder="At least 8 characters"
                                                        autoComplete="new-password"
                                                        className={`w-full h-[62px] pl-8 rounded-[16.54px] placeholder:text-gray-400 ${passwordForm.formState.errors.password ? 'border-red-500 focus:ring-red-500' : ''
                                                            }`}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-sm text-red-500 mt-1" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        placeholder="Confirm your password"
                                                        autoComplete="new-password"
                                                        className={`w-full h-[62px] pl-8 rounded-[16.54px] placeholder:text-gray-400 ${passwordForm.formState.errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''
                                                            }`}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-sm text-red-500 mt-1" />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full h-[75px] rounded-2xl bg-[#8b2131] hover:bg-[#761b29] text-white"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Resetting..." : "Reset Password"}
                                    </Button>
                                </form>
                            </Form>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-center">
                        <Link
                            href="/signin"
                            className="text-sm text-[#8b2131] hover:text-[#761b29] hover:underline"
                        >
                            Back to Sign In
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}