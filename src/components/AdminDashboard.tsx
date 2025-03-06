"use client";

import React, { useEffect, useState } from "react";
import { Users, DoorOpen, Clock, Bell, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { userStore } from "../lib/store/userStore";
import {
    getAllPendingApplicationsTotalCountApiRequest,
    getAllStudentsTotalCountApiRequest,
    getAllTotalsDormAndRoomsApiRequest
} from "../lib/apis/userApi";
import Link from "next/link";

export default function AdminDashboard({ user }: { user: any }) {
    const [totalStudents, setTotalStudents] = useState<number | null>(null);
    const [totalDorms, setTotalDorms] = useState<number | null>(null);
    const [totalRooms, setTotalRooms] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pendingTotalCount, setPendingTotalCount] = useState<number | null>(null);
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!user?._id) throw new Error("User ID is missing.");

                // Fetch total students
                const studentResponse = await getAllStudentsTotalCountApiRequest();
                console.log("studentResponse", studentResponse)
                setTotalStudents(studentResponse.total);

                // Fetch total dorms and rooms
                const dormResponse = await getAllTotalsDormAndRoomsApiRequest(user._id);
                setTotalDorms(dormResponse.totalDorms);
                setTotalRooms(dormResponse.totalRooms);

                const pendingTotalCountResponse = await getAllPendingApplicationsTotalCountApiRequest();
                console.log("pendingTotalCountResponse", pendingTotalCountResponse)
                setPendingTotalCount(pendingTotalCountResponse.applications.length);
            } catch (err: any) {
                setError(err.message || "Failed to fetch data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    return (
        <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-800">Dormitory Administration</h1>
                        <p className="text-gray-500">
                            Welcome back,
                            <span className="font-medium text-gray-700">
                                {userStore.user?.firstName} {userStore.user?.lastName}
                            </span>
                        </p>
                    </div>


                </div>
            </div>

            {/* Loading and Error Handling */}
            {loading ? (
                <p className="text-center text-gray-600">Loading data...</p>
            ) : error ? (
                <p className="text-center text-red-600">{error}</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Total Students"
                        value={totalStudents ?? "N/A"}
                        icon={<Users className="h-6 w-6 text-blue-600" />}
                        subtitle="All students registered"
                        trend=""
                        color="maroon"
                    />
                    {/* <StatsCard
                        title="Total Dorms"
                        value={totalDorms ?? "N/A"}
                        icon={<DoorOpen className="h-6 w-6 text-green-600" />}
                        subtitle="Total dormitories"
                        trend="Stable from last month"
                        color="maroon"
                    /> */}
                    <StatsCard
                        title="Total Rooms"
                        value={totalRooms ?? "N/A"}
                        icon={<Clock className="h-6 w-6 text-[#8B2131]" />}
                        subtitle="Total available rooms"
                        trend=""
                        color="maroon"
                    />
                    <StatsCard
                        title="Pending Applications"
                        value={pendingTotalCount ?? "N/A"}
                        icon={<Clock className="h-6 w-6 text-yellow-600" />}
                        subtitle="Students awaiting room approval"
                        trend=""
                        color="maroon"
                    />
                </div>
            )}
        </div>
    );
}

// Stats Card Component
interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtitle: string;
    trend: string;
    color: "blue" | "green" | "maroon";
}

function StatsCard({ title, value, icon, subtitle, trend, color }: StatsCardProps) {
    const getBgColor = (color: string) => {
        switch (color) {
            case "blue":
                return "bg-blue-50";
            case "green":
                return "bg-green-50";
            case "maroon":
                return "bg-red-50";
            default:
                return "bg-gray-50";
        }
    };

    return (
        <Card className="overflow-hidden border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div
                className="h-1"
                style={{
                    backgroundColor: color === "maroon" ? "#8B2131" :
                        color === "blue" ? "#2563EB" :
                            "#16A34A"
                }}
            ></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">{title}</CardTitle>
                <div className={`p-3 rounded-full ${getBgColor(color)}`}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <p className="text-3xl font-bold text-gray-800">{value}</p>
                    <div>
                        <p className="text-sm text-gray-500">{subtitle}</p>
                        <p
                            className="text-xs font-medium mt-1"
                            style={{
                                color: trend.includes("+") ? "#16A34A" : "#DC2626",
                            }}
                        >
                            {trend}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
