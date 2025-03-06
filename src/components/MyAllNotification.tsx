"use client";

import { useCallback, useEffect, useState } from "react";
import {
    getAllMyNotificationNoticePayment,
    getAllMyNotificationEviction,
    getMyApplicationByIdApiRequest,
    markedAllNotificationAsReadApiRequest,
} from "../lib/apis/userApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertCircle,
    Bell,
    CheckCircle,
    Clock,
    XCircle,
    UserCheck,
    MapPin,
    DollarSign,
    CalendarClock,
    Eye,
    FileX,
} from "lucide-react";
import Link from "next/link";

interface Notification {
    _id: string;
    type: "payment" | "eviction" | "general";
    message?: string;
    status?: "pending" | "overdue" | "paid";
    createdAt: Date;
    unseen: boolean | string;
    evictionReason?: string;
    evictionNoticeDate?: string;
    evictionNoticeTime?: string;
    evicted?: boolean;
    firstName?: string;
    lastName?: string;
    roomId?: string;
    description?: string;
    amount?: number;
    dueDate?: Date;
}

interface SelectedRoom {
    adminId: string;
    description: string;
    maxPax: number;
    roomName: string;
    type: string;
    _id: string;
}

interface Application {
    adminId: string;
    applicationFormUrl: string;
    assessment: string;
    createdAt: string;
    description: string;
    distance: number;
    distanceKm: number;
    distanceScore: number;
    userId: string;
    dormId: string;
    status: string;
    email: string;
    incomeScore: number;
    interviewDate: string;
    interviewNotes: string;
    interviewScore: number;
    interviewTime: string;
    maxPax: number;
    monthlyIncome: string;
    name: string;
    phone: string;
    recommendation: string;
    roomId: string;
    roomName: string;
    selectedRoom: SelectedRoom;
    _id: string;
    unseen?: string;
}

type StatusConfigKey = "pending" | "overdue" | "paid" | "approved" | "rejected";

interface StatusConfig {
    color: string;
    icon: React.ReactNode;
    label: string;
}

const statusConfig: Record<StatusConfigKey, StatusConfig> = {
    pending: { color: "bg-yellow-500", icon: <Clock className="h-4 w-4" />, label: "Pending" },
    overdue: { color: "bg-red-500", icon: <XCircle className="h-4 w-4" />, label: "Overdue" },
    paid: { color: "bg-green-500", icon: <CheckCircle className="h-4 w-4" />, label: "Paid" },
    approved: { color: "bg-green-500", icon: <CheckCircle className="h-4 w-4" />, label: "Approved" },
    rejected: { color: "bg-red-500", icon: <XCircle className="h-4 w-4" />, label: "Rejected" },
};

const defaultStatusConfig: StatusConfig = {
    color: "bg-gray-500",
    icon: <Clock className="h-4 w-4" />,
    label: "Unknown"
};

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [application, setApplication] = useState<Application | null>(null);
    const [applicationNotFound, setApplicationNotFound] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userId, setUserId] = useState("");

    // Get user ID from localStorage only once on component mount
    useEffect(() => {
        console.log("Initial component mount - fetching user ID");
        try {
            const userData = JSON.parse(localStorage.getItem("user") || "{}");
            if (userData._id) {
                console.log("User ID found:", userData._id);
                setUserId(userData._id);
            } else {
                console.error("User ID not found in localStorage");
                setError("User not authenticated");
                setLoading(false);
            }
        } catch (err) {
            console.error("Failed to parse user data:", err);
            setError("Authentication error");
            setLoading(false);
        }
    }, []);

    // Memoize formatDate and formatTime functions to prevent unnecessary re-renders
    const formatDate = useCallback((dateString?: string | Date): string => {
        if (!dateString) return "N/A";
        const date = typeof dateString === "string" ? new Date(dateString) : dateString;
        if (isNaN(date.getTime())) return "Invalid date";
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
        });
    }, []);

    const formatTime = useCallback((timeString?: string): string => {
        if (!timeString) return "N/A";
        if (/^\d{1,2}:\d{2}\s?(?:AM|PM)$/i.test(timeString)) return timeString;
        try {
            if (/^\d{1,2}$/.test(timeString)) {
                const hour = parseInt(timeString);
                const period = hour >= 12 ? "PM" : "AM";
                const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                return `${hour12}:00 ${period}`;
            }
            if (/^\d{1,2}:\d{2}$/.test(timeString)) {
                const [hourStr, minute] = timeString.split(":");
                const hour = parseInt(hourStr);
                const period = hour >= 12 ? "PM" : "AM";
                const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                return `${hour12}:${minute} ${period}`;
            }
            return timeString;
        } catch (error) {
            return timeString;
        }
    }, []);

    // Helper function to safely get status config
    const getStatusInfo = useCallback((statusKey?: string): StatusConfig => {
        if (!statusKey) return defaultStatusConfig;
        return statusConfig[statusKey as StatusConfigKey] || defaultStatusConfig;
    }, []);

    // Fetch notifications data
    const fetchNotifications = useCallback(async () => {
        if (!userId) {
            console.log("fetchNotifications: No userId available, skipping fetch");
            return;
        }

        console.log("Fetching notifications for user ID:", userId);
        try {
            setLoading(true);
            setError(null);

            // Fetch payment and eviction notifications in parallel
            console.log("Starting API calls for payment and eviction notifications");
            const [paymentRes, evictionRes] = await Promise.all([
                getAllMyNotificationNoticePayment(userId),
                getAllMyNotificationEviction(userId),
            ]);

            console.log("Payment notifications response:", paymentRes);
            console.log("Eviction notifications response:", evictionRes);

            // Fetch application data
            try {
                console.log("Fetching application data for user ID:", userId);
                const applicationRes = await getMyApplicationByIdApiRequest(userId);
                console.log("Application data response:", applicationRes);

                if (applicationRes.data) {
                    setApplication(applicationRes.data);
                    setApplicationNotFound(false);
                    console.log("Application data found and set");
                } else {
                    setApplication(null);
                    setApplicationNotFound(true);
                    console.log("No application data found");
                }
            } catch (appErr) {
                console.error("Application fetch error:", appErr);
                setApplication(null);
                setApplicationNotFound(true);
            }

            // Process payment notifications
            const paymentNotifications = Array.isArray(paymentRes.noticePayments)
                ? paymentRes.noticePayments.map((notice: any) => ({
                    ...notice,
                    type: "payment",
                }))
                : [];
            console.log(`Processed ${paymentNotifications.length} payment notifications`);

            // Process eviction notifications
            const evictionNotifications = Array.isArray(evictionRes.evictions)
                ? evictionRes.evictions.map((eviction: any) => ({
                    ...eviction,
                    type: "eviction",
                }))
                : [];
            console.log(`Processed ${evictionNotifications.length} eviction notifications`);

            // Combine and sort by createdAt (newest first)
            const allNotifications = [...paymentNotifications, ...evictionNotifications].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            console.log(`Total combined notifications: ${allNotifications.length}`);

            setNotifications(allNotifications);

            // Count unseen notifications
            const unseenNotifications = allNotifications.filter(
                (notification) => notification.unseen === true || notification.unseen === "unseen"
            ).length;
            console.log(`Unseen notifications count: ${unseenNotifications}`);

            // Check if application is unseen
            const appUnseenCount = application && application.unseen === "unseen" ? 1 : 0;
            console.log(`Unseen application count: ${appUnseenCount}`);

            const totalUnread = unseenNotifications + appUnseenCount;
            setUnreadCount(totalUnread);
            console.log(`Total unread count set to: ${totalUnread}`);

            // Update unread count in localStorage
            localStorage.setItem("unreadCount", String(totalUnread));
        } catch (err) {
            console.error("Fetch error:", err);
            setNotifications([]);
            setError(err instanceof Error ? err.message : "Failed to fetch notifications");
        } finally {
            setLoading(false);
            console.log("Fetch completed, loading state set to false");
        }
    }, [userId, application]);

    // Fetch data when userId changes
    useEffect(() => {
        console.log("useEffect triggered by userId change:", userId);
        if (userId) {
            fetchNotifications();
        }
    }, [userId]); // Added fetchNotifications to dependency array

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        if (!userId) {
            console.error("markAllAsRead: User not authenticated");
            setError("User not authenticated");
            return;
        }

        console.log("Marking all notifications as read for user ID:", userId);
        try {
            // Update local state immediately for better UX
            setNotifications(prev =>
                prev.map(notification => ({
                    ...notification,
                    unseen: false,
                }))
            );
            console.log("Local notification state updated to mark all as read");

            if (application && application.unseen === "unseen") {
                setApplication({
                    ...application,
                    unseen: "seen",
                });
                console.log("Local application state updated to mark as read");
            }

            // Reset unread count
            setUnreadCount(0);
            localStorage.setItem("unreadCount", "0");
            console.log("Unread count reset to 0 in state and localStorage");

            // Call API to update backend
            console.log("Calling API to mark all notifications as read");
            const response = await markedAllNotificationAsReadApiRequest(userId);
            console.log("API response for marking all as read:", response);

            // Refresh notifications to ensure UI is in sync with backend
            console.log("Refreshing notifications after marking all as read");
            await fetchNotifications();
        } catch (err) {
            console.error("Failed to mark notifications as read:", err);
            setError("Failed to mark notifications as read");

            // Revert local changes if API call fails
            console.log("API call failed, reverting local changes");
            fetchNotifications();
        }
    }, [userId, application, fetchNotifications]);

    // Application section rendering
    const renderApplicationSection = useCallback(() => {
        if (loading) {
            return <Skeleton className="h-[180px] w-full rounded-xl mb-6" />;
        }

        if (applicationNotFound) {
            return (
                <div className="text-center p-8 border border-gray-200 rounded-lg shadow-sm bg-white mb-6">
                    <FileX className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Application Found</h3>
                    <p className="text-gray-600 mb-4">You haven't submitted any applications yet.</p>
                    <Link href={"/tupv-dorms"}>
                        <Button variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                            Browse Available Dormitories
                        </Button>
                    </Link>
                </div>
            );
        }

        if (!application) {
            return (
                <div className="text-center p-6 border border-gray-200 rounded-lg shadow-sm bg-white mb-6">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Unable to load application data</p>
                </div>
            );
        }

        // Get status info for application
        const statusInfo = getStatusInfo(application.status);
        const isUnread = application.unseen === "unseen";

        return (
            <div
                className={`border ${isUnread ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
                    } rounded-lg shadow-sm mb-6 overflow-hidden transition-colors`}
            >
                <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">Application Status</h3>
                            {isUnread && (
                                <Badge className="bg-blue-500 text-white px-2 py-0.5 text-xs rounded-full">
                                    New
                                </Badge>
                            )}
                        </div>
                        <Badge className={`${statusInfo.color} text-white flex items-center gap-2 px-3 py-1.5 rounded-full`}>
                            {statusInfo.icon} {statusInfo.label}
                        </Badge>
                    </div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border-r border-gray-200 pr-4">
                        <div className="flex items-start mb-4">
                            <UserCheck className="text-blue-500 mr-2 h-5 w-5 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700">Interview Details</h4>
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Date:</span>{" "}
                                        {formatDate(application.interviewDate) || "Not scheduled"}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Time:</span>{" "}
                                        {formatTime(application.interviewTime) || "Not scheduled"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-r border-gray-200 px-4">
                        <div className="flex items-start mb-4">
                            <MapPin className="text-blue-500 mr-2 h-5 w-5 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700">Distance Assessment</h4>
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Distance:</span> {application.distanceKm?.toFixed(1) || "N/A"} km
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Score:</span> {application.distanceScore || "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <DollarSign className="text-blue-500 mr-2 h-5 w-5 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700">Financial</h4>
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Income:</span> ₱{parseInt(application.monthlyIncome || "0").toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Score:</span> {application.incomeScore || "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pl-4">
                        <div className="flex items-start mb-4">
                            <CalendarClock className="text-blue-500 mr-2 h-5 w-5 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700">Final Assessment</h4>
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Assessment:</span> {application.assessment || "Pending"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {application.selectedRoom && (
                            <div className="mt-2">
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">Selected Room</h4>
                                <p className="text-sm text-gray-600">{application.selectedRoom.roomName}</p>
                                <p className="text-sm text-gray-600">{application.selectedRoom.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }, [loading, application, applicationNotFound, getStatusInfo, formatDate, formatTime]);

    // Notification content rendering
    const renderNotificationContent = useCallback(() => {
        if (loading) {
            return [...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-[80px] w-full rounded-xl mb-4" />
            ));
        }

        if (error) {
            return (
                <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">{error}</p>
                    <Button onClick={() => fetchNotifications()} className="mt-4">
                        Try Again
                    </Button>
                </div>
            );
        }

        if (notifications.length === 0) {
            return (
                <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No notifications at this time</p>
                </div>
            );
        }

        return notifications.map((notif) => {
            // Get notification status
            const statusInfo = notif.type === "payment"
                ? getStatusInfo(notif.status)
                : defaultStatusConfig;

            const isUnread = notif.unseen === true || notif.unseen === "unseen";

            return (
                <div
                    key={notif._id}
                    className={`p-4 border ${isUnread
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white"
                        } rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-between mb-4`}
                >
                    <div className="flex items-center gap-4">
                        {isUnread && (
                            <div className="min-w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        {notif.type === "eviction" ? (
                            <Badge
                                className={`${notif.evicted ? "bg-red-500" : "bg-green-500"
                                    } text-white flex items-center gap-2 px-3 py-1 rounded-full`}
                            >
                                {notif.evicted ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                {notif.evicted ? "Evicted" : "Not Evicted"}
                            </Badge>
                        ) : (
                            <Badge
                                className={`${statusInfo.color} text-white flex items-center gap-2 px-3 py-1 rounded-full`}
                            >
                                {statusInfo.icon}
                                {statusInfo.label}
                            </Badge>
                        )}
                        <div className="flex flex-col">
                            {notif.type === "eviction" ? (
                                <>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {notif.firstName || "User"} {notif.lastName || ""} has been evicted
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        <span className="font-medium">Room:</span> {notif.roomId || "N/A"}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        <span className="font-medium">Reason:</span> {notif.evictionReason || "N/A"}
                                    </p>
                                    <div className="flex gap-4 mt-1">
                                        <p className="text-xs text-gray-600">
                                            <span className="font-medium">Date:</span> {formatDate(notif.evictionNoticeDate)}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            <span className="font-medium">Time:</span> {formatTime(notif.evictionNoticeTime)}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {notif.firstName || "User"} {notif.lastName || ""} - {notif.description || "Payment Notification"}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        <span className="font-medium">Amount:</span> ₱{notif.amount?.toLocaleString() || 0}
                                    </p>
                                    <div className="flex gap-4 mt-1">
                                        <p className="text-xs text-gray-600">
                                            <span className="font-medium">Due:</span> {formatDate(notif.dueDate as Date)}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            <span className="font-medium">Created:</span> {formatDate(notif.createdAt)}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            );
        });
    }, [loading, error, notifications, fetchNotifications, getStatusInfo, formatDate, formatTime]);

    // Add a debugging useEffect to track state changes
    useEffect(() => {
        console.log("State update - Current state:");
        console.log("userId:", userId);
        console.log("loading:", loading);
        console.log("error:", error);
        console.log("notifications count:", notifications.length);
        console.log("unreadCount:", unreadCount);
        console.log("application exists:", !!application);
        console.log("applicationNotFound:", applicationNotFound);
    }, [userId, loading, error, notifications, unreadCount, application, applicationNotFound]);

    return (
        <Card className="w-full mt-6 border-none shadow-xl rounded-xl bg-gray-50">
            <CardHeader className="border-b bg-white rounded-t-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">Notifications</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            Stay updated with your latest notifications
                        </p>
                    </div>
                    <div className="flex gap-4 items-center">
                        {unreadCount > 0 && (
                            <Button
                                onClick={markAllAsRead}
                                variant="outline"
                                className="flex items-center gap-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                                disabled={loading}
                            >
                                <Eye className="h-4 w-4" />
                                Mark all as read
                            </Button>
                        )}
                        <div className="relative">
                            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Bell className="h-6 w-6 text-blue-600" />
                            </div>
                            {unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {renderApplicationSection()}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
                    <div className="gap-5">
                        {notifications.length > 0 && (
                            <Badge className="bg-blue-100 text-blue-800 px-2 py-1">
                                {notifications.length} {notifications.length === 1 ? "notification" : "notifications"}
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="space-y-2">{renderNotificationContent()}</div>
            </CardContent>
        </Card>
    );
}