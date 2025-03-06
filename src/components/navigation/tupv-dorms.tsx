"use client"
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from 'react-toastify';
import { AnimatePresence, motion } from "framer-motion";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons
import { AlertCircle, Bed, ChevronDown, Download, FormInputIcon, Home, MapPin, Users } from "lucide-react";

// API functions
import { getDormsByAdminIdApiRequest, sendStudentApplicationFormApiRequest } from "@/src/lib/apis/userApi";
import { uploadPdfFile } from "@/src/lib/supabase/supabase";

// Components
import ImportantDialog from "../ImportantDialog";
import ApplicationDialog from "../ApplicationFormDialog";

// Type definitions
interface Room {
    id: string;
    roomName: string;
    description: string;
    maxPax: number;
    type: string;
    _id: string;
    adminId?: string;
}

interface Dorm {
    _id: string;
    adminId: string;
    location: string;
    name: string;
    rooms: Room[];
    createdAt: string;
    updatedAt: string;
    __v: number;
    image?: string;
}

// Form schema
const formSchema = z.object({
    distance: z.string()
        .min(1, "Distance is required")
        .refine(
            (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 228,
            "Distance must be a positive number up to 228 km"
        ),
    monthlyIncome: z.string()
        .min(1, "Monthly income is required")
        .refine(
            (val) => !isNaN(Number(val)) && Number(val) > 0,
            "Monthly income must be greater than 0"
        ),
    applicationForm: z.instanceof(File)
        .refine((file) => !!file, "Application form is required")
        .refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
        .refine(
            (file) => file.type === "application/pdf",
            "Only PDF files are allowed"
        ),
});

type FormData = z.infer<typeof formSchema>;

const DormsAndRooms = () => {
    // State
    const [dormsData, setDormsData] = useState<Dorm[]>([]);
    const [search, setSearch] = useState("");
    const [filterLocation, setFilterLocation] = useState("all");
    const [filterGender, setFilterGender] = useState("all");
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [showApplicationDialog, setShowApplicationDialog] = useState(false);

    // Initialize form
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            distance: '',
            monthlyIncome: '',
        },
    });

    // Handle localStorage only on client-side
    useEffect(() => {
        /*    // Check localStorage for application acknowledgement
           const hasAcknowledged = typeof window !== 'undefined'
               ? localStorage.getItem(`application-acknowledged`)
               : null;
           setShowApplicationDialog(!hasAcknowledged);
    */
        // Get user status from localStorage
        const userStatus = typeof window !== 'undefined'
            ? localStorage.getItem("user")
            : null;

        if (userStatus) {
            try {
                const parsedUser = JSON.parse(userStatus);
                setStatus(parsedUser.status);
                setUser(parsedUser);
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }

        // Fetch dorms data
        fetchDorms();
    }, []);

    // Fetch dorms data
    const fetchDorms = async () => {
        try {
            const response = await getDormsByAdminIdApiRequest("67b6122b87e0d9aae35ffdd6");
            setDormsData(response.dorms);
        } catch (error) {
            console.error("Failed to fetch dorms:", error);
        }
    };

    // Modify the filtering logic to get all rooms across dorms
    const allRooms = dormsData.flatMap(dorm =>
        dorm.rooms.map(room => ({
            ...room,
            dormName: dorm.name,
            dormLocation: dorm.location
        }))
    );

    const filteredRooms = allRooms.filter(room => {
        const matchesSearch = room.dormName.toLowerCase().includes(search.toLowerCase()) ||
            room.dormLocation.toLowerCase().includes(search.toLowerCase());
        const matchesLocation = filterLocation === "all" || room.dormLocation === filterLocation;
        const matchesGender = filterGender === "all" || room.type === filterGender;

        return matchesSearch && matchesLocation && matchesGender;
    });

    // Handle application form submission
    const handleSubmit = async (data: FormData) => {
        if (!selectedRoom) {
            toast.error("No room selected for booking.");
            return;
        }

        setIsLoading(true);

        try {
            // Upload PDF
            const uploadResult = await uploadPdfFile({
                file: data.applicationForm,
                folder: "applications",
                customFileName: `application-${user?._id || 'user'}-${Date.now()}`,
            });

            if (uploadResult.error) {
                throw new Error(`Failed to upload application form: ${uploadResult.error}`);
            }

            // Calculate distance score
            const minPoints = 0;
            const maxPoints = 100;
            const minDistance = 0;
            const maxDistance = 228;
            const inputDistance = parseFloat(data.distance);

            const distanceScore = ((minPoints + (inputDistance - minDistance) * (maxPoints - minPoints)) / (maxDistance - minDistance)) * 0.5;

            // Calculate income score
            const incomeRanges = [
                { min: 219140, score: 1 },
                { min: 131484, score: 2 },
                { min: 76669, score: 3 },
                { min: 43828, score: 4 },
                { min: 21194, score: 5 },
                { min: 9520, score: 6 },
                { min: 0, score: 7 },
            ];

            const inputIncome = parseFloat(data.monthlyIncome);
            const incomeScore = incomeRanges.find(range => inputIncome >= range.min)?.score || 7;

            const xmin = 1;
            const xmax = 7;
            const x = incomeScore;

            // Correct formula for income normalization
            const actualIncomeScore = ((x - xmin) / (xmax - xmin)) * 40;

            // Prepare booking data
            const bookingData: any = {
                dormId: selectedRoom._id,
                roomId: selectedRoom.roomName,
                roomName: selectedRoom.roomName,
                adminId: "67b6122b87e0d9aae35ffdd6",
                maxPax: selectedRoom.maxPax,
                description: selectedRoom.description,
                userId: user?._id || 'anonymous',
                name: user ? `${user.firstName} ${user.lastName}` : 'Anonymous User',
                email: user?.email || 'no-email',
                phone: user?.phone || 'no-phone',
                distance: data.distance,
                distanceScore: distanceScore.toFixed(2),
                monthlyIncome: data.monthlyIncome,
                incomeScore: actualIncomeScore.toFixed(2),
                applicationFormUrl: uploadResult.url,
            };

            // Submit booking request
            await sendStudentApplicationFormApiRequest(bookingData);
            toast.success("Booking request submitted successfully!");
            setIsOpen(false);
            form.reset();
        } catch (error: any) {
            console.error("Error submitting booking:", error);
            toast.error(`Failed to submit booking request: ${error.message || "Unknown error"}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Add new function to handle random room selection
    const handleRandomRoomApplication = () => {
        // Filter only available rooms (where maxPax > 0)
        const availableRooms = filteredRooms.filter(room => room.maxPax > 0);

        if (availableRooms.length === 0) {
            toast.error("No available rooms found.");
            return;
        }

        // Select a random room from available rooms
        const randomIndex = Math.floor(Math.random() * availableRooms.length);
        const randomRoom = availableRooms[randomIndex];

        // Set the selected room and open the dialog
        setSelectedRoom(randomRoom);
        /* setIsOpen(true); */
        setShowApplicationDialog(true)
    };

    return (
        <div className="min-h-screen w-full">
            <div className="w-full space-y-8    my-5 min-h-screen">
                {/* Page Header */}
                <div className="relative overflow-hidden rounded-3xl shadow-lg p-10 bg-gray-50  ">
                    {/* Decorative Background */}
                    <div className="absolute inset-0 bg-gradient-to-br  rounded-3xl pointer-events-none" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col gap-4 text-center md:text-left">
                        <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#8B2131] to-[#a94351]">
                            Room Management
                        </h1>
                        <p className="text-gray-700 text-lg leading-relaxed max-w-2xl">
                            Enjoy an exclusive dormitory experience where comfort meets privacy in a space tailored just for you.
                        </p>

                        {/* Replace the individual room buttons with a single Apply button */}
                        <div className="mt-8 flex justify-center">
                            <Button
                                className="px-8 py-6 text-lg font-medium bg-[#8B2131] text-white hover:bg-[#8b2121]"
                                onClick={handleRandomRoomApplication}
                                disabled={isLoading}
                            >
                                Apply for Room
                            </Button>
                        </div>
                    </div>

                    {/* Decorative Blob */}
                    <div className="absolute right-0 top-0 w-72 h-72  rounded-full -mr-24 -mt-24 blur-[100px]" />
                </div>


                {/* Remove the button from the room cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredRooms.map((room) => {
                        const isFull = room.maxPax === 0;
                        return (
                            <motion.div
                                key={room._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`relative p-6 rounded-xl shadow-lg bg-white 
                                ${isFull ? 'border-2 border-[#8B2131]/20' : 'border border-gray-100'}`}
                            >
                                {isFull && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#8B2131]/90 to-[#a94351]/90 
                                        backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4 z-10">
                                        <AlertCircle className="w-8 h-8 text-white animate-pulse" />
                                        <span className="text-2xl font-bold text-white">Room Unavailable</span>
                                    </div>
                                )}

                                <div className={`space-y-4 ${isFull ? 'opacity-50' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-semibold text-gray-900">{room.dormName}</h3>
                                            <h4 className="text-lg text-gray-700">{room.roomName}</h4>
                                            {/*  <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">{room.dormLocation}</span>
                                            </div> */}
                                            {/* <Badge variant="secondary"
                                                className={`${room.type === "Male"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-pink-100 text-pink-800"}`}
                                            >
                                                {room.type}
                                            </Badge> */}
                                        </div>
                                        <div className="flex items-center gap-2 text-[#8B2131]">
                                            <Users className="h-5 w-5" />
                                            <span className="text-lg">{room.maxPax} slots</span>
                                        </div>
                                    </div>

                                    {room.description && (
                                        <p className="text-gray-600">{room.description}</p>
                                    )}


                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Application Form Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Application Form</DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">
                            Please provide the required details below.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="distance"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex gap-1">
                                            Distance from home to TUP Visayas (km)
                                            <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="Enter distance"
                                                {...field}
                                                onBlur={(e) => {
                                                    const value = e.target.value.trim();
                                                    field.onChange(value === '' ? '' : value);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="monthlyIncome"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex gap-1">
                                            Family Monthly Income
                                            <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="Enter monthly income"
                                                {...field}
                                                onBlur={(e) => {
                                                    const value = e.target.value.trim();
                                                    field.onChange(value === '' ? '' : value);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="applicationForm"
                                render={({ field: { onChange, value, ...field } }) => (
                                    <FormItem>
                                        <FormLabel className="flex gap-1">
                                            Upload Application Form (PDF)
                                            <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) onChange(file);
                                                }}
                                                {...field}
                                            />
                                        </FormControl>
                                        <p className="text-xs text-gray-500">
                                            Upload your application form (PDF format, max 10MB)
                                        </p>
                                        <FormMessage className="text-xs text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                    disabled={isLoading}
                                    className="hover:bg-gray-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Submitting..." : "Submit"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <ApplicationDialog
                open={showApplicationDialog}
                onClose={setShowApplicationDialog}
                selectedRoom={selectedRoom}
                user={user}
            />

            {/* Important Dialog */}

        </div>
    );
};

export default DormsAndRooms;