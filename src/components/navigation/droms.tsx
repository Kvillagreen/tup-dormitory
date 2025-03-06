"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@radix-ui/react-label";
import { deleteDormByIdApiRequest, getDormsByAdminIdApiRequest } from "@/src/lib/apis/userApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as z from "zod";
import EditDormDialog from "../EditDormDialog";

const roomSchema = z.object({
    roomName: z.string().min(1, "Room name is required"),
    type: z.enum(["Male", "Female", "Mixed"]),
    maxPax: z.number().min(1, "Must allow at least one person"),
    description: z.string().optional()
});

const dormSchema = z.object({
    name: z.string().min(1, "Dorm name is required"),
    location: z.string().min(1, "Location is required"),
    rooms: z.array(roomSchema).min(1, "At least one room is required")
});

type DormFormValues = z.infer<typeof dormSchema>;

type Dorm = {
    _id: string;
    name: string;
    location: string;
    rooms: { roomName: string; type: string; maxPax: number; description?: string }[];
};

const Dorms = () => {
    const [dormsData, setDormsData] = useState<Dorm[]>([]);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedDorm, setSelectedDorm] = useState<Dorm | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { control, handleSubmit, reset, formState: { errors } } = useForm<DormFormValues>({
        resolver: zodResolver(dormSchema),
        defaultValues: { name: "", location: "", rooms: [] }
    });

    useEffect(() => {
        const fetchDorms = async () => {
            setIsLoading(true);
            try {
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    const response = await getDormsByAdminIdApiRequest(user?._id || "67b6122b87e0d9aae35ffdd6");
                    setDormsData(response.dorms || []);
                }
            } catch (error: any) {
                toast.error("Failed to fetch dorms: " + error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDorms();
    }, []);

    const openEditDialog = useCallback((dorm: Dorm) => {
        setSelectedDorm(dorm);
        setEditDialogOpen(true);
    }, []);

    const handleDormUpdate = useCallback((updatedDorm: Dorm) => {
        setDormsData(prevDorms => prevDorms.map(dorm => dorm._id === updatedDorm._id ? updatedDorm : dorm));
        toast.success("Dorm updated successfully!");
    }, []);

    const totalRooms = useMemo(() => dormsData.reduce((sum, dorm) => sum + dorm.rooms.length, 0), [dormsData]);
    const totalCapacity = useMemo(() => dormsData.reduce((sum, dorm) => sum + dorm.rooms.reduce((roomSum, room) => roomSum + room.maxPax, 0), 0), [dormsData]);
    const firstDorm = useMemo(() => dormsData[0], [dormsData]);

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800">Dormitory Details</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <StatCard label="Total Rooms" value={totalRooms} color="text-[#8B2131]" />
                <StatCard label="Available Slots" value={totalCapacity} color="text-green-600" />
            </div>

            {isLoading ? (
                <p className="text-lg text-gray-500 text-center">Loading...</p>
            ) : firstDorm ? (
                <DormCard dorm={firstDorm} openEditDialog={openEditDialog} />
            ) : (
                <p className="text-lg text-gray-500 text-center">No dorms available.</p>
            )}

            <EditDormDialog open={isEditDialogOpen} onClose={() => setEditDialogOpen(false)} onUpdate={handleDormUpdate} dorm={selectedDorm as any} />
        </div>
    );
};

const DormCard = memo(({ dorm, openEditDialog }: { dorm: Dorm; openEditDialog: (dorm: Dorm) => void }) => (
    <Card className="w-full border-gray-200 rounded-xl shadow-sm">
        <div className="h-2 bg-[#8B2131]" />
        <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">{dorm.name}</CardTitle>
            <Badge className="text-sm bg-gray-100 text-gray-800 w-fit px-2 py-1 rounded-lg">{dorm.location}</Badge>
        </CardHeader>
        <CardContent>
            <Label>Created Rooms:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dorm.rooms.map((room, index) => (
                    <RoomCard key={index} room={room} />
                ))}
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => openEditDialog(dorm)}>
                <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
        </CardFooter>
    </Card>
));

const RoomCard = memo(({ room }: { room: Dorm["rooms"][0] }) => {
    const isFull = room.maxPax === 0;

    return (
        <div
            className={`p-4 rounded-lg border ${isFull ? "border-red-400 bg-red-50 opacity-80" : "border-gray-200 bg-white"}
                relative overflow-hidden transition duration-300`}
        >
            <h3 className={`font-medium ${isFull ? "text-red-700" : "text-gray-900"}`}>{room.roomName}</h3>

            <Badge
                className={
                    isFull
                        ? "bg-red-600 text-white"
                        : room.type === "Male"
                            ? "bg-blue-100 text-blue-800"
                            : room.type === "Female"
                                ? "bg-pink-100 text-pink-800"
                                : "bg-gray-100 text-gray-800"
                }
            >
                {isFull ? "Fully Occupied" : room.type}
            </Badge>

            <p className={`text-sm ${isFull ? "text-red-600 font-semibold" : "text-gray-600 my-2"}`}>
                {isFull ? "This room has no available spots." : `Available Slots: ${room.maxPax}`}
            </p>

            {room.description && <p className="mt-1 text-gray-500">{room.description}</p>}
        </div>
    );
});

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);

export default Dorms;