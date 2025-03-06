"use client";

import { useState, useEffect } from "react";
import {
    Menu,
    Home,
    Users,
    Bed,
    LogOut,
    Building,
    Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { userStore } from "@/src/lib/store/userStore";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllPendingApplicationsTotalCountApiRequest } from "@/src/lib/apis/userApi";
import { Skeleton } from "@/components/ui/skeleton";
import { List } from "lucide-react";
export default function LeftNav() {
    const [isOpen, setIsOpen] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const [pendingTotalCount, setPendingTotalCount] = useState<number>(0);
    const [notificationUnreadCount, setNotificationUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const { notifCount } = userStore;




    // Retrieve user from localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);
    // For non-admin users, get the notifications unread count from localStorage
    useEffect(() => {
        if (user && user.role !== "admin") {
            const storedUnread = localStorage.getItem("unreadCount");
            if (storedUnread) {
                setNotificationUnreadCount(Number(storedUnread));
            }
        }
    }, [user]);

    // For admin users, fetch pending applications count
    useEffect(() => {
        const fetchPendingCount = async () => {


            if (!user || !user._id) return;
            setLoading(true);
            try {
                const pendingTotalCountResponse = await getAllPendingApplicationsTotalCountApiRequest();
                setPendingTotalCount(pendingTotalCountResponse.applications.length);
            } catch (err) {
                console.error("Error fetching pending applications:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === "admin") {
            fetchPendingCount();
        }
    }, [user?._id, user?.role]);



    // Build menu items array.
    // For admin, use pendingTotalCount; for students, use notificationUnreadCount.
    const menuItems = [
        { name: "Home", icon: Home, href: "/" },
        ...(user?.role !== "admin" ? [{ name: "Rooms", icon: Building, href: "/tupv-dorms" }] : []),
        ...(user?.role !== "student"
            ? [
                { name: "Students", icon: Users, href: "/students" },
                { name: "My Dorm", icon: Building, href: "/dorms" },
                { name: "View Attendance", icon: List, href: "https://attendance-dormitory.vercel.app/attendance" },
            ]
            : []),
        { name: "Applications", icon: Bed, href: "/applications" },
        {
            name: "Notifications",
            icon: Bell,
            href: user?.role === "admin" ? "/applications" : "/notification",
            highlight:
                user?.role === "admin"
                    ? pendingTotalCount > 0
                    : notificationUnreadCount > 0,
        },
    ];

    const handleLogout = () => {
        try {
            userStore.clearUser();
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            localStorage.removeItem("application-acknowledged");
            localStorage.removeItem("unreadCount");
            localStorage.removeItem("studentTotalCount");
            router.push("/signin");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const getInitials = () => {
        return `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`.toUpperCase();
    };

    return (
        <aside
            className={cn(
                "min-h-screen bg-white shadow-md border-r transition-all duration-300 flex flex-col",
                isOpen ? "w-64" : "w-16"
            )}
        >
            <div className="flex items-center justify-between p-4 border-b">
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
                    <Menu className="h-6 w-6 text-gray-600" />
                </Button>
                {isOpen && (
                    <div className="text-lg font-semibold text-[#8B2131]">
                        {user?.role === "admin" ? "Admin Portal" : "Student Portal"}
                    </div>
                )}
            </div>

            <div className={cn("flex items-center p-4 border-b", isOpen ? "justify-start" : "justify-center")}>
                {user ? (
                    <>
                        <Avatar className="h-10 w-10 border-2 border-[#8B2131]">
                            {user?.avatarUrl ? (
                                <AvatarImage src={user.avatarUrl} alt="Profile" className="object-cover" />
                            ) : (
                                <AvatarFallback className="bg-[#8B2131] text-white">
                                    {getInitials()}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        {isOpen && (
                            <div className="ml-3">
                                <p className="text-sm font-medium truncate">
                                    {`${user?.firstName} ${user?.lastName}`}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                        )}
                    </>
                ) : (
                    <Skeleton className="h-10 w-10 rounded-full" />
                )}
            </div>

            <nav className="mt-4 space-y-1 flex-1 px-2">
                {menuItems.map(({ name, icon: Icon, href, highlight }) => (
                    <a
                        key={name}
                        href={href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-all",
                            "hover:bg-gray-100 hover:text-red-500"
                        )}
                        {...(name === "View Attendance"
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                    >
                        {name === "Notifications" ? (
                            <div className="relative">
                                <Icon className="h-5 w-5 text-[#8B2131]" />
                                {highlight && (
                                    <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                        {user?.role === "admin"
                                            ? pendingTotalCount > 99
                                                ? "99+"
                                                : pendingTotalCount
                                            : notificationUnreadCount > 99
                                                ? "99+"
                                                : notificationUnreadCount}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <Icon className="h-5 w-5 text-[#8B2131]" />
                        )}
                        {isOpen && <span className="text-sm font-medium">{name}</span>}
                    </a>
                ))}
            </nav>


            <div className="p-4 border-t">
                <button
                    className={cn(
                        "flex items-center w-full gap-3 px-3 py-2 rounded-md",
                        "text-red-600 hover:bg-red-50 hover:text-red-800 transition-all",
                        !isOpen && "justify-center"
                    )}
                    onClick={handleLogout}
                >
                    <LogOut className="h-5 w-5" />
                    {isOpen && <span className="text-sm font-medium">Logout</span>}
                </button>
            </div>
        </aside>
    );
}
