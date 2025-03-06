"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Camera, Loader2, X, Bell, FileText, Save, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { userStore } from "../lib/store/userStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from "../lib/supabase/supabase";
import { updateMyUserDetailsById } from "../lib/apis/userApi";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  schoolName: z.string().min(2, "School name must be at least 2 characters"),
  schoolAddress: z.string().min(5, "School address must be at least 5 characters"),
  avatar: z
    .custom<File>()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      "Max file size is 5MB"
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported"
    )
    .optional(),
  studentId: z.string().min(1, "Student ID is required"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface User {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  schoolName: string;
  schoolAddress: string;
  avatarUrl?: string;
  studentId: string;
}

export default function ProfileSettings() {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any | null>(null);



  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      schoolName: "",
      schoolAddress: "",
      studentId: "",
    },
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const user = localStorage.getItem("user");
        if (!user) throw new Error("User not found");

        const userData: User = JSON.parse(user);
        setUserData(userData);
        Object.entries(userData).forEach(([key, value]) => {
          if (key in form.getValues()) {
            form.setValue(key as keyof ProfileFormValues, value as never);
          }
        });

        if (userData.avatarUrl) {
          setPreview(userData.avatarUrl);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset any previous errors
    setError(null);

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Only .jpg, .jpeg, .png and .webp formats are supported");
      return;
    }

    try {
      // Set loading state
      setIsSaving(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData._id}-${Date.now()}.${fileExt}`;
      const filePath = `users/${fileName}`;

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from('monkey-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('monkey-images')
        .getPublicUrl(filePath);

      // Update form and preview
      form.setValue("avatar", file);
      setPreview(publicUrl);

      toast.success("Your profile picture has been updated", {
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const clearImage = async () => {
    try {
      // If there's an existing image, delete it from Supabase
      if (preview) {
        const fileName = preview.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('monkey-images')
            .remove([`users/${fileName}`]);
        }
      }

      form.setValue("avatar", undefined);
      setPreview(null);

      toast.success("Your profile picture has been removed", {
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error removing image:', err);
      toast.error("Failed to remove image. Please try again.");
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSaving(true);

      const prepareData = {
        email: data.email,
        phone: data.phone,
        studentId: data.studentId,
        schoolName: data.schoolName,
        schoolAddress: data.schoolAddress,
        middleName: data.middleName,
        address: data.address,
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: preview,
      };

      await updateMyUserDetailsById(userData._id, prepareData);

      // Update local storage with the new data including the avatar URL
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = {
        ...user,
        ...prepareData
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Your profile information has been saved successfully", {
        autoClose: 3000,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMessage);
      toast.error(errorMessage, {
        autoClose: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onError = (errors: any) => {
    // Get all error messages
    const errorMessages = Object.values(errors)
      .map((error: any) => error.message)
      .filter(Boolean);

    // Show each error as a toast
    errorMessages.forEach((message) => {
      toast.error(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#8B2131] mx-auto" />
          <p className="text-gray-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <User className="h-6 w-6 text-[#8B2131]" />
                Profile Settings
              </h1>
              <p className="text-gray-500">
                Manage your personal information and preferences
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              {/*     <Button
                variant="outline"
                className="flex items-center gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 flex-1 sm:flex-none justify-center"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </Button> */}
              <Button
                className="flex items-center gap-2 text-white bg-[#8B2131] hover:bg-[#761B29] flex-1 sm:flex-none justify-center"
                onClick={form.handleSubmit(onSubmit, onError)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Save Changes</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="personalInfo" className="w-full">
          <TabsList className="grid grid-cols-2 max-w-md mb-6 bg-white border border-gray-200 p-1 rounded-lg">
            <TabsTrigger value="personalInfo" className="data-[state=active]:bg-[#8B2131] data-[state=active]:text-white">
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="academic" className="data-[state=active]:bg-[#8B2131] data-[state=active]:text-white">
              Academic
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personalInfo" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <Card className="overflow-hidden border-none rounded-2xl shadow-md">
              <div className="h-2 bg-gradient-to-r from-[#8B2131] to-[#aa3045]" />
              <CardHeader className="bg-white pb-0 pt-6">
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and contact information</CardDescription>
              </CardHeader>

              <CardContent className="p-6 bg-white">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center pb-6 border-b border-gray-100">
                      <div className="relative group">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-md transition-transform group-hover:scale-105">
                          <AvatarImage src={preview || userData.avatarUrl} alt="Profile" className="object-cover" />
                          <AvatarFallback className="bg-[#8B2131]/10 text-[#8B2131] text-lg font-medium">
                            {form.getValues("firstName")?.[0]}
                            {form.getValues("lastName")?.[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="absolute -bottom-2 -right-2 flex gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full shadow-md bg-white hover:bg-[#8B2131] hover:text-white transition-colors"
                            onClick={() => document.getElementById("avatar-upload")?.click()}
                          >
                            <Camera className="h-4 w-4" />
                            <span className="sr-only">Upload avatar</span>
                          </Button>
                          {preview && (
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="h-8 w-8 rounded-full shadow-md"
                              onClick={clearImage}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove avatar</span>
                            </Button>
                          )}
                        </div>

                        <Input
                          id="avatar-upload"
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES.join(",")}
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>

                      <div className="flex-1 space-y-1">
                        <h3 className="font-medium text-gray-900">Profile Picture</h3>
                        <p className="text-sm text-gray-500">
                          Upload a clear photo to help others recognize you
                        </p>
                        <p className="text-xs text-gray-400">
                          JPG, PNG or WebP, max 5MB
                        </p>

                        {error && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTitle>Upload failed</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>

                    {/* Personal Info Fields */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">First Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your first name"
                                {...field}
                                className="border-gray-200 focus-visible:ring-[#8B2131] focus-visible:ring-offset-0 focus-visible:border-[#8B2131] h-11 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-[#8B2131]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Last Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your last name"
                                {...field}
                                className="border-gray-200 focus-visible:ring-[#8B2131] focus-visible:ring-offset-0 focus-visible:border-[#8B2131] h-11 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-[#8B2131]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="middleName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Middle Name <span className="text-gray-400 font-normal">(Optional)</span></FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your middle name"
                                {...field}
                                className="border-gray-200 focus-visible:ring-[#8B2131] focus-visible:ring-offset-0 focus-visible:border-[#8B2131] h-11 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-[#8B2131]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                              Email
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                Cannot change
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter your email"
                                {...field}
                                disabled
                                className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed h-11 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-[#8B2131]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="Enter your phone number"
                                {...field}
                                className="border-gray-200 focus-visible:ring-[#8B2131] focus-visible:ring-offset-0 focus-visible:border-[#8B2131] h-11 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-[#8B2131]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Home Address</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your home address"
                                {...field}
                                className="border-gray-200 focus-visible:ring-[#8B2131] focus-visible:ring-offset-0 focus-visible:border-[#8B2131] h-11 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-[#8B2131]" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <Card className="overflow-hidden border-none rounded-2xl shadow-md">
              <div className="h-2 bg-gradient-to-r from-[#8B2131] to-[#aa3045]" />
              <CardHeader className="bg-white pb-0 pt-6">
                <CardTitle>Academic Information</CardTitle>
                <CardDescription>Manage your school details and student identification</CardDescription>
              </CardHeader>

              <CardContent className="p-6 bg-white">
                <Form {...form}>
                  <form className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="schoolName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">School Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your school name"
                                {...field}
                                className="border-gray-200 focus-visible:ring-[#8B2131] focus-visible:ring-offset-0 focus-visible:border-[#8B2131] h-11 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-[#8B2131]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="schoolAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">School Address</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your school address"
                                {...field}
                                className="border-gray-200 focus-visible:ring-[#8B2131] focus-visible:ring-offset-0 focus-visible:border-[#8B2131] h-11 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-[#8B2131]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="studentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Student ID</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your student ID number"
                                {...field}
                                className="border-gray-200 focus-visible:ring-[#8B2131] focus-visible:ring-offset-0 focus-visible:border-[#8B2131] h-11 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-[#8B2131]" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Floating Save Button - Mobile Only */}
        <div className="sm:hidden fixed bottom-6 right-6 z-10">
          <Button
            onClick={form.handleSubmit(onSubmit, onError)}
            disabled={isSaving}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-[#8B2131] hover:bg-[#761B29] flex items-center justify-center"
          >
            {isSaving ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Save className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}