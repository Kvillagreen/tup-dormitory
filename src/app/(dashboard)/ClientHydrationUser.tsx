"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userStore } from '@/src/lib/store/userStore';

const ClientHydrationUser = () => {
    const router = useRouter();

    useEffect(() => {
        // Retrieve user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            userStore.setUser(parsedUser);
            console.log("User data from localStorage:", parsedUser);
        }

        // Check if the page has already been reloaded
        const hasReloaded = sessionStorage.getItem("hasReloaded");

        if (!hasReloaded) {
            // First reload
            sessionStorage.setItem("hasReloaded", "true");
            setTimeout(() => {
                window.location.reload();
            }, 500); // Small delay ensures hydration completes
        } else {
            console.log("Skipping second reload.");
        }

        // Redirect if user is not authenticated
        if (!userStore.isAuthenticated) {
            router.push("/signin");
        }
    }, [router]);

    return null;
}

export default ClientHydrationUser;
