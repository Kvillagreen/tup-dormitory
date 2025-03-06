
import LeftNav from "@/src/components/navigation/left-navigation";
import ClientHydrationUser from "./ClientHydrationUser";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { userStore } from '@/src/lib/store/userStore';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <div className="flex min-h-screen bg-muted/40">
            {/* Left Sidebar Navigation */}
            <LeftNav /* user={user} */ /> {/* ✅ Pass user data to LeftNav */}

            {/* Main content area */}
            <div className="flex flex-1 flex-col w-full">
                <div className="flex-1 flex flex-col">
                    <main className="grid flex-1 items-start gap-2 p-4 sm:px-6 sm:py-0 md:gap-4 bg-transparent">
                        {children}
                    </main>
                </div>
            </div>

            <ClientHydrationUser />
        </div>
    );
}
