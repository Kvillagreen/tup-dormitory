"use client";

import { useEffect, useState } from "react";
import StudentDashboard from "@/src/components/StudentDashboard";
import AdminDashboard from "@/src/components/AdminDashboard";
import { userStore } from "@/src/lib/store/userStore";

const HomeScreen = () => {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true); // Ensure hydration happens on client
    }, []);

    if (!isHydrated) {
        return <p>Loading...</p>; // Prevent SSR mismatches
    }

    const user = userStore.user;

    // Determine the role and render the appropriate dashboard
    const isAdmin = userStore.user?.role === "admin";
    const isStudent = userStore.user?.role === "student";

    return (
        <div>
            {isAdmin ? <AdminDashboard user={user} /> : isStudent ? <StudentDashboard student={user} /> : <p>Unauthorized access</p>}
        </div>
    );
};

export default HomeScreen;
