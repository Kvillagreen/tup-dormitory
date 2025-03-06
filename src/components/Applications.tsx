'use client'
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Users, Clock, Building, Download } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
    getAllApplicationByIdApiRequest,
    updateApplicationStatusApiRequest,
    updateApplicationInterviewApiRequest,
    deleteApplicationStudentSideApiRequest,
    getDormsByAdminIdApiRequest,
    rejectApplicationApiRequest,
} from "../lib/apis/userApi";

import DormitoryQRCode from "./QrCodeDialog";
import QRScanner from "./QrScanner";
import { toast } from "react-toastify";
import { InterviewScoring } from "./InterviewScoring";

type Reservation = {
    _id: string;
    dormId: string;
    roomId: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    maxPax: number;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    status: "pending" | "for-interview" | "approved" | "rejected";
    createdAt: string;
    interviewDate?: string;
    interviewTime?: string;
    description?: string;
};

export default function ApplicationsDashboard() {
    const [applications, setApplications] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<"student" | "admin">("student");
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [isClient, setIsClient] = useState(false);

    // Add this to your state declarations
    const [isScoring, setIsScoring] = useState(false);

    // Add this state to manage the dialog visibility
    const [isScoringDialogOpen, setIsScoringDialogOpen] = useState(false);

    const [selectedApplication, setSelectedApplication] = useState<any>(null);
    const [dormsData, setDormsData] = useState<any>(null);
    const [allRooms, setAllRooms] = useState<any[]>([]);

    // Add this state to manage the selected room
    const [selectedRoom, setSelectedRoom] = useState<any | null>(null);

    useEffect(() => {
        setIsClient(true);
        fetchApplications();
    }, []);

    useEffect(() => {
        const fetchDorms = async () => {
            try {
                const response = await getDormsByAdminIdApiRequest("67b6122b87e0d9aae35ffdd6");

                // Ensure response.dorms is an array and map it to an object
                if (Array.isArray(response.dorms)) {
                    const dormsObject = response.dorms.reduce((acc: Record<string, any>, dorm: any) => {
                        const dormObject = { ...dorm }; // Spread the dorm object to ensure immutability
                        return dormObject;
                    }, {});
                    console.log('dormsObject', dormsObject.rooms);
                    setAllRooms(dormsObject.rooms);
                } else {
                    console.error("Expected response.dorms to be an array");
                }
            } catch (error) {
                console.error("Failed to fetch dorms:", error);
            }
        };

        // Get user data from localStorage
        const userData: any = localStorage.getItem("user");

        if (userData) {
            setUserData(JSON.parse(userData)); // Set user state if user data exists
        }

        fetchDorms();
    }, []);


    // Function to fetch applications and update the state
    const fetchApplications = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            setUserRole(user.role || "student");
            setUserData(user);
            const data = await getAllApplicationByIdApiRequest(user._id, user.role);
            console.log("Data:", data);
            setApplications(data.applications);
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusChange = async (application: any, newStatus: string) => {
        console.log("application", application);
        setLoading(true);
        try {
            if (newStatus === "approved") {
                // Check if selectedRoom is not set or doesn't have roomName
                if (!selectedRoom || !selectedRoom.roomName) {
                    toast.error("Please select a room first");
                    setLoading(false);
                    return;
                }
            }

            // Prepare the data - using consistent field references
            const prepareData: any = {
                adminId: "67b6122b87e0d9aae35ffdd6",
                selectedRoom,
                // Use roomId consistently - this should match what your schema expects
                roomId: selectedRoom?.roomId || selectedRoom?._id || selectedRoom?.id || "",
                roomName: selectedRoom?.roomName || "",
                assesment: application.assesment || "",
                interviewScore: application.interviewScore || "",
                totalScore: application.totalScore || "",
                distance: application.distance || "",
                distanceScore: application.distanceScore || "",
                monthlyIncome: application.monthlyIncome,
                incomeScore: application.incomeScore,
                distanceKm: application.distanceKm,
                name: application.name,
                email: application.email,
                phone: application.phone,
                maxPax: application.maxPax,
                recommendation: application.recommendation,
                description: application.description,
                createdAt: application.createdAt,
                applicationFormUrl: application.applicationFormUrl,
                dormId: application.dormId,
                interviewDate: application.interviewDate,
                interviewTime: application.interviewTime,
                status: newStatus,
                userId: application.userId,
            };

            console.log("Using data:", prepareData);

            await rejectApplicationApiRequest(application._id, prepareData);
            toast.success("Status updated successfully!");
            fetchApplications();
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error("Failed to update status:", error);
            toast.error("Failed to update status. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChangeInterview = async (application: any, newStatus: string) => {
        setLoading(true);
        try {
            if (newStatus === "approved") {
                // Check if selectedRoom is not set
                if (!selectedRoom) {
                    toast.error("Please select a room first");
                    setLoading(false);
                    return;
                }
            }

            // Prepare data - using consistent field references
            const prepareData: any = {
                adminId: "67b6122b87e0d9aae35ffdd6",
                selectedRoom,
                // Use roomId consistently - checks all possible ID fields
                roomId: selectedRoom.roomId || selectedRoom._id || selectedRoom.id || "",
                roomName: selectedRoom.roomName || "",
                assesment: application.assesment || "",
                interviewScore: application.interviewScore || "",
                totalScore: application.totalScore || "",
                distance: application.distance || "",
                distanceScore: application.distanceScore || "",
                monthlyIncome: application.monthlyIncome,
                incomeScore: application.incomeScore,
                distanceKm: application.distanceKm,
                name: application.name,
                email: application.email,
                phone: application.phone,
                maxPax: application.maxPax,
                recommendation: application.recommendation,
                description: application.description,
                createdAt: application.createdAt,
                applicationFormUrl: application.applicationFormUrl,
                dormId: application.dormId,
                interviewDate: application.interviewDate,
                interviewTime: application.interviewTime,
                status: newStatus,
                userId: application.userId,

            };

            console.log("Using data:", prepareData);

            await updateApplicationStatusApiRequest(application._id, prepareData);
            toast.success("Status updated successfully!");
            fetchApplications();
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error("Failed to update status:", error);
            toast.error("Failed to update status. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    // Schedule an interview and update status to "for-interview"
    const scheduleInterview = async (
        application: any,
        date: Date,
        time: string
    ) => {
        if (!date || !time) {
            toast.error("Please select both date and time");
            return;
        }
        setLoading(true);
        try {
            console.log("asspdjapdasop", application);
            console.log("Scheduling interview:", application, date, time);
            const prepareData = {
                adminId: "67b6122b87e0d9aae35ffdd6",
                applicationId: application._id,
                date: date.toISOString(),
                time: time,
                status: "for-interview",
                interview: true,
                ...application,
                email: application.email,
            }
            console.log("Preparing data:", prepareData);
            await updateApplicationInterviewApiRequest(application._id, prepareData);
            toast.success("Interview scheduled successfully!");
            setLoading(false);
            // Update the status after scheduling the interview
            fetchApplications();
        } catch (error) {
            setLoading
            console.error("Failed to schedule interview:", error);
            toast.error("Failed to schedule interview. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Ensure consistent date formatting
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // ApplicationCard component now manages its own date and time state
    const ApplicationCard = ({ app, index }: { app: any; index: number }) => {
        const [localDate, setLocalDate] = useState<Date | null>(null);
        const [localTime, setLocalTime] = useState<string>("");


        const [dataApp, setDataApp] = useState<any>(null);

        useEffect(() => {
            setDataApp(app);
        }, [app]);

        const statusColors: { [key in any["status"]]: string } = {
            pending: "bg-yellow-100 text-yellow-800",
            "for-interview": "bg-blue-100 text-blue-800",
            approved: "bg-green-100 text-green-800",
            rejected: "bg-red-100 text-red-800",
        };

        const timeSlots = [
            "09:00 AM",
            "09:30 AM",
            "10:00 AM",
            "10:30 AM",
            "11:00 AM",
            "11:30 AM",
            "02:00 PM",
            "02:30 PM",
            "03:00 PM",
            "03:30 PM",
            "04:00 PM",
            "04:30 PM",
        ];

        /*     const handleScanResult = (rawData: string, parsedData?: any) => {
                if (parsedData) {
                    // Successfully parsed JSON
                    console.log("Processed QR data:", parsedData);
                    toast.success(`Scanned user: ${parsedData.name || "Unknown"}`);
    
                    // You can now safely use the parsed data
                    const { name, room, dorm, checkIn, checkOut, guests, studentId, _id } = parsedData;
                    console.log("Parsed data:", parsedData);
                    // Update your application state as needed
                    // Example: updateScanLog(_id, name, new Date());
                } else {
                    // Handle non-parseable data gracefully
                    toast.info("Scanned QR code with non-standard format");
                    console.log("Could not parse QR data as JSON");
                }
            }; */

        // Add this function to handle the scoring submission
        const handleScoringSubmit = async (scoringData: any) => {
            try {
                console.log('Interview Scoring Data:', scoringData);
                // Call your API to save the scoring data
                // await updateApplicationScoreApiRequest(applicationId, scoringData);

                // If the total score is >= 70, show the approve/reject buttons
                if (scoringData.totalScore >= 70) {
                    // Show the approval buttons
                    // You might want to update your application state here
                }

                toast.success('Interview scoring submitted successfully!');
                fetchApplications(); // Refresh the applications list
            } catch (error) {
                console.error('Failed to submit interview scoring:', error);
                toast.error('Failed to submit interview scoring. Please try again.');
            }
        };


        const handleOpenPdf = (pdfUrl: string) => {

            window.open(pdfUrl, "_blank", "noopener,noreferrer");
        };


        return (
            <Card className="border rounded-xl shadow-lg hover:shadow-
            xl transition-all duration-300 bg-white w-full p-2 relative">
                {/* Add rank badge if totalScore exists */}

                <CardHeader className="pb-4">
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold" style={{ color: "#8B2131" }}>
                                    {/* Removed Room ID UI */}
                                    {/* Request Room: {app.roomId} */}
                                </CardTitle>
                                {/* Removed Dorm ID UI */}
                                {/* Room Description */}
                                <div className="borderbg-gray-50">
                                    <h3 className="text-lg font-bold text-maroon-700 mb-2 flex items-center gap-2">

                                        {app.status === "pending" ? "🏠 Application for the Dorm" : "🏠 Application for the Room"}
                                    </h3>
                                </div>
                            </div>
                            <Badge className={`${statusColors[app.status]} px-3 py-1 rounded-full text-xs font-medium`}>
                                {app.status
                                    .split("-")
                                    .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(" ")}
                            </Badge>
                        </div>
                        {userRole === "admin" && (
                            <div className="space-y-5 bg-white p-5 rounded-lg shadow-lg border border-gray-200">

                                {/* Header */}
                                <div className="border-b pb-2 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-maroon-700">📌 Applicant Details</h2>

                                    {app.totalScore && (
                                        <span className="flex items-center gap-1 text-yellow-600">
                                            🏆
                                            Rank<span className="text-lg font-bold">#{index + 1}</span>
                                        </span>
                                    )}
                                </div>

                                {/* Applicant Info */}
                                <div className="space-y-3 text-gray-800 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">👤 Name:</span>
                                        <span className="font-semibold">{app.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">📧 Email:</span>
                                        <span className="font-semibold">{app.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">📞 Phone:</span>
                                        <span className="font-semibold">{app.phone}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">💵 Monthly Income:</span>
                                        <span className="font-semibold">₱{app.monthlyIncome.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">💰 Family Income Score:</span>
                                        <span className="font-semibold">{app.incomeScore}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">📍 Distance:</span>
                                        <span className="font-semibold">{app.distance} km</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">📊 Distance Score:</span>
                                        <span className="font-semibold">{app.distanceScore}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">🗣 Interview Score:</span>
                                        <span className="font-semibold">
                                            {app.interviewScore ? app.interviewScore + "%" : "Waiting for the result"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">🏆 Total Score:</span>
                                        <span className="font-semibold">
                                            {app.totalScore != null ? app.totalScore.toFixed(2) + "%" : "Waiting for the result"}
                                        </span>
                                    </div>
                                    {/*     <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">📝 Interview Notes:</span>
                                        <span className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap" title={app.interviewNotes}>
                                            {app.interviewNotes ? app.interviewNotes : "Waiting for the result"}
                                        </span>
                                    </div> */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">🏠 Designated Room:</span>
                                        <span className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap" title={app.selectedRoom?.roomName || "Waiting for the result"}>
                                            {app.selectedRoom?.roomName || "Waiting for the result"}
                                        </span>
                                    </div>



                                    {/* Application Download Section */}
                                    <div className="flex items-center justify-between bg-blue-100 p-3 rounded-md">
                                        <span className="text-blue-800 font-medium">📄 Student Application Form</span>
                                        <Button
                                            onClick={() => handleOpenPdf(app.applicationFormUrl)}
                                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                                            title="Download Student Application Form"
                                        >
                                            <Download size={18} />
                                            <span>Download</span>
                                        </Button>
                                    </div>

                                    <div className="text-sm text-gray-700">
                                        {app.interviewDate && app.interviewTime ? (
                                            <p className="text-gray-800 font-medium">
                                                <span className="text-blue-600 font-semibold">📅 Interview Scheduled:</span> {formatDate(app.interviewDate)} at {app.interviewTime}
                                            </p>
                                        ) : (
                                            <p className="text-red-600 font-medium">⚠️ No interview scheduled yet.</p>
                                        )}
                                    </div>

                                    {/*   <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">🏠 Room Type:</span>
                                        <span className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap" title={app.selectedRoom?.type || "Waiting for the result"}>
                                            {app.selectedRoom?.type || "Waiting for the result"}
                                        </span>
                                    </div> */}
                                </div>

                                {/* Room Description */}
                                {/*   <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg shadow-md">
                                    <h3 className="text-lg font-bold text-maroon-700 mb-2">🏠 Room Description</h3>
                                    <p className="text-gray-700 text-sm leading-relaxed">{app.description}</p>
                                </div> */}

                                {/* Interview Score Section */}

                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">

                    {userRole === "student" && (
                        <div className="grid grid-cols-1 gap-4 bg-white p-5 rounded-lg shadow-lg border border-gray-200">
                            {/* Application Date */}
                            <div className="flex items-center gap-2 text-maroon-700 text-sm">
                                <Calendar className="h-5 w-5 text-maroon-500" />
                                <span className="font-medium">{isClient ? formatDate(app.createdAt) : "Loading..."}</span>
                            </div>

                            {/* Student Name */}
                            <div className="flex items-center gap-2 text-maroon-700">
                                <Users className="h-6 w-6 text-maroon-500" />
                                <span className="text-xl font-semibold">{app.name}</span>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-3 text-gray-800 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 font-medium">👤 Name:</span>
                                    <span className="font-semibold">{app.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 font-medium">📧 Email:</span>
                                    <span className="font-semibold">{app.email}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 font-medium">📞 Phone:</span>
                                    <span className="font-semibold">{app.phone}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 font-medium">💵 Monthly Income:</span>
                                    <span className="font-semibold">₱{app.monthlyIncome.toLocaleString()}</span>
                                </div>
                                {/* <div className="flex items-center justify-between">
                                    <span className="text-gray-600 font-medium">💰 Family Income Score:</span>
                                    <span className="font-semibold">{app.incomeScore}%</span>
                                </div> */}
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 font-medium">📍 Distance:</span>
                                    <span className="font-semibold">{app.distance} km</span>
                                </div>
                                {/* <div className="flex items-center justify-between">
                                    <span className="text-gray-600 font-medium">📊 Distance Score:</span>
                                    <span className="font-semibold">{app.distanceScore}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 font-medium">🗣 Interview Score:</span>
                                    <span className="font-semibold">
                                        {app.interviewScore ? app.interviewScore + "%" : "Waiting for the result"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 font-medium">🏆 Total Score:</span>
                                    <span className="font-semibold">
                                        {app.totalScore != null ? app.totalScore + "%" : "Waiting for the result"}
                                    </span>
                                </div> */}
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 font-medium">🏠 Designated Room:</span>
                                    <span className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap" title={app.selectedRoom?.roomName || "Waiting for the result"}>
                                        {app.selectedRoom?.roomName || "Waiting for the result"}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-700">
                                    {app.interviewDate && app.interviewTime ? (
                                        <p className="text-gray-800 font-medium">
                                            <span className="text-blue-600 font-semibold">📅 Interview Scheduled:</span> {formatDate(app.interviewDate)} at {app.interviewTime}
                                        </p>
                                    ) : (
                                        <p className="text-red-600 font-medium">⚠️ No interview scheduled yet.</p>
                                    )}
                                </div>
                                {/*   <div className="flex items-center justify-between">
                                    <span className="text-gray-600 font-medium">🏠 Room Type:</span>
                                    <span className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap" title={app.selectedRoom?.type || "Waiting for the result"}>
                                        {app.selectedRoom?.type || "Waiting for the result"}
                                    </span>
                                </div> */}
                            </div>



                            {/* Interview Score Section */}
                            {app.assessment === "completed" && (
                                <div className="p-4 border rounded-lg shadow-md bg-gray-50">
                                    <h3 className="text-lg font-bold text-maroon-700 mb-2">📝 Interview Score</h3>
                                    <div className="space-y-2 text-gray-800 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">📍 Distance Score:</span>
                                            <span className="font-semibold">{app.distanceScore}%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">💰 Family Income Score:</span>
                                            <span className="font-semibold">{app.incomeScore}%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">🗣 Interview Score:</span>
                                            <span className="font-semibold">{app.interviewScore}%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">💵 Monthly Income:</span>
                                            <span className="font-semibold">₱{app.monthlyIncome.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">✅ Recommendation:</span>
                                            <span className="font-semibold capitalize">{app.recommendation}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 font-medium">🏆 Total Score:</span>
                                            <span className="font-semibold">
                                                {app.totalScore != null ? app.totalScore.toFixed(2) + "%" : "Waiting for the result"}
                                            </span>
                                        </div>

                                        <div className="text-sm text-gray-700">
                                            {app.interviewDate && app.interviewTime ? (
                                                <p className="text-gray-800 font-medium">
                                                    <span className="text-blue-600 font-semibold">📅 Interview Scheduled:</span> {formatDate(app.interviewDate)} at {app.interviewTime}
                                                </p>
                                            ) : (
                                                <p className="text-red-600 font-medium">⚠️ No interview scheduled yet.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Interview Notes with Hover Effect for Long Text */}
                                    {/*  <div className="mt-3">
                                        <h4 className="text-sm font-bold text-gray-700">📝 Interview Notes</h4>
                                        <div className="relative group">
                                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 group-hover:line-clamp-none">
                                                {app.interviewNotes}
                                            </p>
                                            <div className="absolute hidden group-hover:block bg-white p-2 shadow-lg border rounded-lg text-xs text-gray-700 w-full">
                                                {app.interviewNotes}
                                            </div>
                                        </div>
                                    </div> */}
                                </div>
                            )}
                        </div>
                    )}






                    {userRole === "admin" && app.status === "pending" && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex flex-col space-y-2">
                                <div className="font-medium text-gray-700">Schedule Interview</div>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left font-normal"
                                            >
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {localDate ? formatDate(localDate.toISOString()) : "Pick date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white">
                                            <CalendarPicker
                                                mode="single"
                                                selected={localDate as any}
                                                onSelect={setLocalDate as any}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <Select value={localTime} onValueChange={setLocalTime}>
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder="Select time" className="bg-white">
                                                <div className="flex items-center bg-white">
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    <span>{localTime || "Pick time"}</span>
                                                </div>
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {timeSlots.map((time) => (
                                                <SelectItem key={time} value={time}>
                                                    {time}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => scheduleInterview(app, localDate!, localTime)}
                                    disabled={loading || !localDate || !localTime}
                                >
                                    Schedule Interview
                                </Button>
                            </div>
                            {/*   <div className="flex gap-2">
                                <Button
                                    className="w-1/2 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleStatusChange(app as any, "approved")}
                                    disabled={loading}
                                >
                                    Approve
                                </Button>
                                <Button
                                    className="w-1/2 bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => handleStatusChange(app as any, "rejected")}
                                    disabled={loading}
                                >
                                    Reject
                                </Button>
                            </div> */}
                        </div>
                    )}




                    {userRole === "admin" && app.status === "for-interview" && (
                        <div className="space-y-6 pt-4 border-t">
                            {/* Interview Schedule */}
                            <div className="text-sm text-gray-700">
                                {app.interviewDate && app.interviewTime ? (
                                    <p className="text-gray-800 font-medium">
                                        <span className="text-blue-600 font-semibold">📅 Interview Scheduled:</span> {formatDate(app.interviewDate)} at {app.interviewTime}
                                    </p>
                                ) : (
                                    <p className="text-red-600 font-medium">⚠️ No interview scheduled yet.</p>
                                )}
                            </div>
                            {app.totalScore && (
                                <div className="flex flex-col space-y-2">
                                    <div className="font-medium text-gray-700">Select Designated Room</div>
                                    <Select
                                        value={selectedRoom?._id || ""}
                                        onValueChange={(value) => {
                                            const selected = allRooms.find((room) => room._id === value);
                                            console.log("selected", selected);
                                            setSelectedRoom(selected || null);
                                        }}
                                    >
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder="Select a designated room" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {allRooms.map((room) => (
                                                <SelectItem key={room._id} value={room._id} className="text-gray-700">
                                                    <p className="text-gray-700">{room.roomName}</p>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                            )}

                            {/* Show Open Scoring Dialog ONLY if assessment is NOT completed */}
                            {app.assessment !== "completed" && (
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow-md transition-all"
                                    onClick={() => {

                                        setIsScoringDialogOpen(true);
                                    }}
                                >
                                    🎯 Open Scoring Dialog
                                </Button>
                            )}

                            {/* Interview Scoring Modal */}
                            {app.status === "for-interview" && app.assessment !== "completed" && (
                                <InterviewScoring
                                    isOpen={isScoringDialogOpen}
                                    onClose={() => setIsScoringDialogOpen(false)}
                                    onSubmit={handleScoringSubmit}
                                    applicationData={app}
                                />
                            )}

                            {/* Show "Approve" & "Reject" if Assessment is Completed */}
                            {app.assessment === "completed" && (
                                <div className="flex gap-3">
                                    <Button
                                        className="w-1/2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow-md transition-all"
                                        disabled={loading}
                                        onClick={() => handleStatusChangeInterview(app, "approved")}
                                    >
                                        ✅ Approve
                                    </Button>
                                    <Button
                                        disabled={loading}
                                        className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg shadow-md transition-all"
                                        onClick={() => handleStatusChange(app, "rejected")}
                                    >
                                        ❌ Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}





                    {userRole === "admin" && app.status === "approved" && (
                        <div className="space-y-4 pt-4 border-t">
                            <DormitoryQRCode applicationData={app} />
                        </div>
                    )}

                    {userRole === "student" && app.status === "approved" && (
                        <div className="space-y-4 pt-4 border-t">
                            <DormitoryQRCode applicationData={app} />
                        </div>
                    )}

                    {userRole === "student" && app.status === "pending" && (
                        <div className="flex gap-2 pt-4">
                            <Button
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleDelete(app)}
                            >
                                Delete
                            </Button>
                        </div>
                    )}

                    {/*  {userRole === "admin" && (
                        <div className="space-y-4 pt-4 border-t">
                            <h2 className="text-2xl font-bold mb-4">QR Code Scanner</h2>
                            <QRScanner onScan={handleScanResult as any} />
                        </div>
                    )} */}
                </CardContent>
            </Card>
        );
    };

    // Function to handle deletion of an application
    const handleDelete = async (data: any) => {
        setLoading(true);
        try {
            console.log("Deleting application:sss", data);

            const prepareData = {
                status: data.status,
                applicationId: data._id,
            }
            console.log("Preparing data:", prepareData);
            const response = await deleteApplicationStudentSideApiRequest(prepareData);
            console.log("Response:", response);
            toast.success("Application deleted successfully!");
            /*     await deleteApplicationApiRequest(applicationId); */

            fetchApplications();
        } catch (error) {
            console.error("Failed to delete application:", error);
            toast.error("Failed to delete application. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const filterApplications = (status: Reservation["status"]) => {
        // Filter applications by status
        const filtered = applications.filter((app) => app.status === status);

        // Sort by totalScore in descending order
        return filtered.sort((a, b) => {
            // Handle cases where totalScore might be undefined/null
            const scoreA = a.totalScore || 0;
            const scoreB = b.totalScore || 0;
            return scoreB - scoreA;
        });
    };

    const TabSection = ({ value, applications }: { value: string; applications: any[] }) => (
        <TabsContent value={value} className="space-y-6">
            {applications.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <div className="text-gray-500" style={{ color: "#8B2131" }}>
                        No {value.replace("-", " ")} applications found
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                    {applications.map((app, index) => (
                        <ApplicationCard key={app._id} app={app} index={index} />
                    ))}
                </div>
            )}
        </TabsContent>
    );

    return (
        <div className="w-full p-8 max-w-[1600px] mx-auto mb-10">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl shadow-md p-8 border border-gray-100 mb-10">
                <div className="relative z-10 flex flex-col gap-3">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8B2131] to-[#a94351]">
                        My Applications
                    </h1>
                    <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
                        Track the status of your housing applications
                    </p>
                </div>
                <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#8B2131]/5 to-[#a94351]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="pending" className="space-y-8">
                <TabsList className="bg-gray-100 p-1 rounded-lg">
                    {["pending", "for-interview", "approved", "rejected"].map((status) => (
                        <TabsTrigger
                            key={status}
                            value={status}
                            className="flex items-center gap-2 px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-md transition-all"
                        >
                            {status.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                            <Badge variant="secondary" className="ml-2 bg-white">
                                {filterApplications(status as any["status"]).length}
                            </Badge>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {["pending", "for-interview", "approved", "rejected"].map((status) => (
                    <TabSection
                        key={status}
                        value={status}
                        applications={filterApplications(status as any["status"])}
                    />
                ))}
            </Tabs>
        </div>
    );
}