"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { z } from "zod";
import { observer } from "mobx-react-lite";
import { userStore } from "@/src/lib/store/userStore";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInUserApiRequest } from "@/src/lib/apis/userApi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/public/dormlogo.png"

// Define the sign-in schema
const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const SignIn = observer(() => {

    const [isLoading, setIsLoading] = useState(false);
    const [fullName, setFullName] = useState("");
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
    });

    const onSubmit = async (data: SignInFormValues) => {
        setIsLoading(true);
        try {
            // Call sign-in API
            const response = await signInUserApiRequest(data);

            if (!response?.success) {
                throw new Error(response?.message || "Unknown error occurred.");
            }
            console.log("response", response)
            // Extract user data and token
            const { token, user } = response;
            console.log("user", user)

            // Store the token in sessionStorage
            localStorage.setItem("authToken", token);

            // Store user data in MobX
            userStore.setUser(user); // Ensure user data is stored correctly
            console.log("userStore.user", userStore.user)

            // Set the full name for the welcome message
            setFullName(`${user.firstName} ${user.lastName}`);

            toast.success(`Welcome back, ${user.firstName}!`);

            // Navigate to the home screen
            router.push("/");

        } catch (error: any) {
            console.log("etestrror", error)
            const errorMessage = error?.message || "Invalid credentials. Please try again.";
            console.log("errorMessage", errorMessage)
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="flex items-center justify-center h-screen bg-gray-200">
            <div className="p-12 w-full max-w-2xl bg-white rounded-2xl shadow-lg">
                <Image src={logo} alt="logo" width={100} height={100} className="mx-auto" />
                <h2 className="text-2xl font-bold text-gray-900 text-center">Dormitory Sign In</h2>
                <p className="text-center text-gray-600 mb-4">Enter your credentials to access your account.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-6 shadow-lg" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <div className='w-full'>
                        <Input
                            type="email"
                            placeholder="Email"
                            {...register("email")}
                            className={`w-full h-[62px] pl-8 rounded-[16.54px] border ${errors.email ? "border-red-500" : "border-gray-300"}`}
                        />
                        {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
                    </div>

                    <div className='w-full'>
                        <Input
                            type="password"
                            placeholder="Password"
                            {...register("password")}
                            className={`w-full h-[62px] pl-8 rounded-[16.54px] border ${errors.password ? "border-red-500" : "border-gray-300"}`}
                        />
                        {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
                    </div>

                    <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-sm text-[#8b2131] hover:text-[#761b29]">
                            Forgot Password?
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-[75px] rounded-2xl bg-[#8b2131] hover:bg-[#761b29] text-white"
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing In..." : "Sign In"}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-medium text-[#8b2131] hover:text-[#761b29]">
                        Sign Up
                    </Link>
                </p>
            </div>
            <ToastContainer />
        </div>
    );
});



export default SignIn;
