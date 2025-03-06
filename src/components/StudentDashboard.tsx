"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { File, HelpCircle, Settings } from "lucide-react";
import ImportantDialog from "./ImportantDialog";

export default function StudentDashboard({ student }: any) {
    const router = useRouter();
    const [unseenNotification, setUnseenNotifications] = useState<number>(0);
    const [unRead, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<string | null>(null); // Store the status
    /* 
        const [showApplicationDialog, setShowApplicationDialog] = useState(() => {
            // Check localStorage for acknowledgment
            const hasAcknowledged = localStorage.getItem(`application-acknowledged-${student._id}`);
            return !hasAcknowledged;
        });
    
        const [hasDownloaded, setHasDownloaded] = useState(false);
     */
    // Fetch current user data from localStorage
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setStatus(parsedUser.status); // Set the user status
        }
    }, []);

    /*  const handleDownload = () => {
         const pdfUrl = "/APPLICATION_FORM.pdf";
         const link = document.createElement("a");
         link.href = pdfUrl;
         link.download = "APPLICATION_FORM.pdf";
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         setHasDownloaded(true);
     };
 
     const handleAcknowledgment = () => {
         localStorage.setItem(`application-acknowledged-${student._id}`, "true");
         setShowApplicationDialog(false);
     }; */

    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-800">Welcome, {student.firstName}</h1>
                        <p className="text-gray-500">Student ID: {student.studentId}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button

                            className="flex items-center gap-3 px-3 py-2 rounded-md transition-all text-black bg-white hover:bg-red-600"
                        >
                            <File className="h-4 w-4" />
                            Download Application Form
                        </Button>
                        <Button
                            onClick={() => router.push("/profile")}
                            className="flex items-center gap-3 px-3 py-2 rounded-md transition-all text-white bg-[#8B2131] hover:bg-red-600"
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Button>
                    </div>
                </div>
            </div>

            {/* Student Information Card */}
            <Card className="shadow-md border border-gray-200 rounded-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-800">Student Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                    <p>
                        <span className="font-medium">Name:</span> {student.firstName} {student.middleName} {student.lastName}
                    </p>
                    <p>
                        <span className="font-medium">Email:</span> {student.email}
                    </p>
                    <p>
                        <span className="font-medium">Phone:</span> {student.phone}
                    </p>
                    <p>
                        <span className="font-medium">Role:</span> {student.role}
                    </p>

                    {/* Student ID Field */}
                    {student.role === "student" && (
                        <div className="col-span-2">
                            <span className="font-medium">Student ID:</span>
                            <Input value={student.studentId} readOnly className="mt-1" />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Conditionally Render ImportantDialog (Only if status is NOT "approved") */}
            {/*       {status !== "approved" && (
                <ImportantDialog
                    student={student}
                    showApplicationDialog={showApplicationDialog}
                    setShowApplicationDialog={setShowApplicationDialog}
                />
            )}
 */}
            {/* Help Button */}
            <div className="fixed bottom-6 right-6">
                <Button className="rounded-full w-12 h-12 p-0 shadow-lg flex items-center justify-center bg-[#8B2131] text-white hover:bg-[#761B29]">
                    <HelpCircle className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
}
