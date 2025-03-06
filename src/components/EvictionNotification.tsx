import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { updateEvictionNotificationStatusApiRequest } from "../lib/apis/userApi";

interface User {
    evicted: boolean;
    evictionNoticeDate: string;
    evictionNoticeTime: string;
    evictionReason: string;
}

export default function EvictionNotification() {
    const [isOpen, setIsOpen] = useState(false);
    const [evictionData, setEvictionData] = useState<User | null>(null);

    useEffect(() => {
        // Get user data from localStorage
        const userData = localStorage.getItem("user");
        const hasSeenEvictionNotice = localStorage.getItem("hasSeenEvictionNotice"); // Check if the notice has been seen

        if (userData) {
            try {
                const parsedUser: User = JSON.parse(userData);

                // Check if user is evicted and if they haven't seen the notice
                if (parsedUser.evicted && !hasSeenEvictionNotice) {
                    setEvictionData(parsedUser);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Error parsing user data from localStorage:", error);
            }
        }
    }, []);
    const handleClose = async () => {
        try {
            const userDataString = localStorage.getItem("user");
            if (userDataString) {
                const userData = JSON.parse(userDataString);
                await updateEvictionNotificationStatusApiRequest(userData._id); // Call the API
                setIsOpen(false);
                localStorage.setItem("hasSeenEvictionNotice", "true"); // Set the flag in local storage
            }
        } catch (error) {
            console.error("Error updating eviction notification status:", error);
            toast.error("Error updating eviction notification status");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-white">
                <DialogHeader>
                    <DialogTitle className="text-red-600">Eviction Notice</DialogTitle>
                </DialogHeader>
                {/* Fixed the invalid nesting issue */}
                <div className="text-gray-600 space-y-2">
                    {evictionData ? (
                        <>
                            <div><strong>Date:</strong> {evictionData.evictionNoticeDate}</div>
                            <div><strong>Time:</strong> {evictionData.evictionNoticeTime} PM</div>
                            <div><strong>Reason:</strong> {evictionData.evictionReason}</div>
                        </>
                    ) : (
                        <p>Loading eviction details...</p>
                    )}
                </div>
                <Button onClick={handleClose} className="w-full mt-4">OK</Button>
            </DialogContent>
        </Dialog>
    );
}
