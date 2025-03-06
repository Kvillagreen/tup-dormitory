"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createUserApiRequest } from '@/src/lib/apis/userApi';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useCallback, useState } from 'react';
import Image from 'next/image';
import logo from "@/public/dormlogo.png"
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Define the signup schema
const signupSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters long"),
    phone: z.string().optional(),
    studentId: z.string().min(1, "Student ID is required"),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignUp() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset, // Added reset function
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
    });



    const onSubmit = useCallback(async (data: SignupFormValues) => {
        try {
            setIsLoading(true);
            const response = await createUserApiRequest(data);
            console.log("Response from API:", response);

            toast.success("Signed up successfully!");


            // Reset the form fields after successful signup
            reset();
            setIsLoading(false);

            // Delay navigation to sign-in page by 1 second
            setTimeout(() => {
                router.push("/signin");
            }, 1000);

        } catch (error: any) {
            const errorMessage = error?.message || "An error occurred during signup.";
            setIsLoading(false);
            toast.error(errorMessage); // Optionally show the error message as a toast
        }
    }, [reset]); // Include reset in the dependency array

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-200" >
            <div className="p-12 w-full max-w-2xl bg-white rounded-2xl shadow-lg my-20">
                <Image src={logo} alt="logo" width={100} height={100} className="mx-auto" />
                <h2 className=" text-2xl font-bold text-gray-900 text-center">Student Sign Up</h2>
                <p className="text-center text-gray-600 mb-4">Please fill in the details to create your student account for the dormitory.</p>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-6 shadow-lg" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <div className='flex gap-5 w-full'>
                        <InputField id="firstName" placeholder="First Name" register={register} error={errors.firstName} />
                        <InputField id="lastName" placeholder="Last Name" register={register} error={errors.lastName} />
                    </div>

                    <InputField id="email" type="email" placeholder="Email" register={register} error={errors.email} />
                    <InputField id="phone" type="tel" placeholder="Phone Number" register={register} error={errors.phone} />
                    <InputField id="studentId" placeholder="Student ID" register={register} error={errors.studentId} />
                    <InputField id="password" type="password" placeholder="Password" register={register} error={errors.password} />
                    <InputField id="confirmPassword" type="password" placeholder="Confirm Password" register={register} error={errors.confirmPassword} />

                    <Button disabled={isLoading} type="submit" className="w-full h-[75px] rounded-2xl bg-[#8b2131] hover:bg-[#761b29] text-white">
                        {isLoading ? "Signing Up..." : "Sign Up"}
                    </Button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href="/signin" className="font-medium text-[#8b2131] hover:text-[#761b29]">
                        Sign in
                    </Link>
                </p>
                <p className="mt-6 text-center text-sm text-gray-500">
                    After signing up, please fill out the application form you will see in the navigation "Rooms" Management.
                </p>
                <div className="flex items-start space-x-3 bg-yellow-100 p-3 rounded-md">
                    <AlertCircle className="text-yellow-600" size={24} />
                    <p className="text-gray-700 text-sm">
                        To proceed with your dorm application, please download and fill out the application form.
                    </p>
                </div>
                <ToastContainer />
            </div>
        </div>
    );
}

const InputField = ({ id, type = "text", placeholder, register, error }: any) => (
    <div className='w-full'>
        <Input
            id={id}
            type={type}
            placeholder={placeholder}
            {...register(id)}
            className={`w-full h-[62px] pl-8 rounded-[16.54px] placeholder:text-gray-400 ${error ? 'border-red-500' : ''}`}
        />
        {error && <span className="text-red-500 text-sm">{error.message}</span>}
    </div>
);
