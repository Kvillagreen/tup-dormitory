import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import { getDormByIdApiRequest, updateDormAndRoomsDataApiRequest } from "../lib/apis/userApi";
import { toast } from "sonner";

interface Room {
    id: string;
    roomName: string;
    description: string;
    maxPax: number;
    type: "Male" | "Female" | "Mixed";
    _id: string;
}

interface Dorm {
    _id: string;
    adminId: string;
    location: string;
    name: string;
    rooms: Room[];
    createdAt: string;
    updatedAt: string;
    __v: number;
}

interface EditDormDialogProps {
    open: boolean;
    onClose: () => void;
    onUpdate?: (updatedDorm: Dorm) => void;
    dorm: Dorm | null;
}

const EditDormDialog: React.FC<EditDormDialogProps> = ({
    open,
    onClose,
    onUpdate = () => { },
    dorm
}) => {
    const [formState, setFormState] = useState<{
        loading: boolean;
        error: string | null;
        data: any | null;
        activeTab: "details" | "rooms";
    }>({
        loading: false,
        error: null,
        data: null,
        activeTab: "details"
    });

    useEffect(() => {
        const fetchDormData = async () => {
            if (!open || !dorm?._id) return;

            console.log('Fetching dorm data for ID:', dorm._id);
            setFormState(prev => ({ ...prev, loading: true, error: null }));

            try {
                const response = await getDormByIdApiRequest(dorm._id);
                console.log('Fetched dorm data:', response.dorm);
                setFormState(prev => ({
                    ...prev,
                    loading: false,
                    data: response.dorm
                }));
            } catch (error) {
                console.error('Error fetching dorm data:', error);
                setFormState(prev => ({
                    ...prev,
                    loading: false,
                    error: "Failed to load dormitory data. Please try again."
                }));
            }
        };

        fetchDormData();
    }, [dorm?._id, open]);

    const handleUpdateDormInfo = (field: keyof Dorm, value: string) => {
        console.log(`Updating dorm info - ${field}:`, value);
        setFormState(prev => ({
            ...prev,
            data: prev.data ? { ...prev.data, [field]: value } : null
        }));
    };

    const handleUpdateRoomInfo = (roomIndex: number, field: keyof Room, value: any) => {
        console.log(`Updating room ${roomIndex} - ${field}:`, value);
        setFormState(prev => {
            if (!prev.data) return prev;

            const updatedRooms = [...prev.data.rooms];
            const processedValue = field === 'maxPax'
                ? (value === '' ? '' : Math.max(1, parseInt(value) || 1))
                : value;

            console.log(`Processed value for ${field}:`, processedValue);
            updatedRooms[roomIndex] = {
                ...updatedRooms[roomIndex],
                [field]: processedValue
            };

            return {
                ...prev,
                data: { ...prev.data, rooms: updatedRooms }
            };
        });
    };

    const handleSubmit = async () => {
        if (!formState.data) return;

        setFormState(prev => ({ ...prev, loading: true }));

        try {
            const preData = {
                rooms: formState.data.rooms,
                adminId: "67b6122b87e0d9aae35ffdd6",
            }
            const response = await updateDormAndRoomsDataApiRequest(preData);
            console.log("Response", response);
            toast.success("Dormitory data updated successfully!");
            onUpdate(response.dorm);
            onClose();
        } catch (error) {
            console.error('Error updating dorm:', error);
            toast.error(error instanceof Error ? error.message : "Failed to update dormitory data. Please try again.");
        } finally {
            setFormState(prev => ({ ...prev, loading: false }));
        }
    };


    if (formState.loading) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[650px] bg-white">
                    <DialogHeader>
                        <DialogTitle>Loading Dormitory Data</DialogTitle>
                        <DialogDescription>Please wait while we fetch the dormitory information.</DialogDescription>
                    </DialogHeader>
                    <div className="py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-maroon-600 border-t-transparent mx-auto mb-2" />
                        <p className="text-gray-600">Loading dormitory data...</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (formState.error || !formState.data) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[650px]">
                    <DialogHeader>
                        <DialogTitle>Error Loading Data</DialogTitle>
                        <DialogDescription className="text-red-500">
                            {formState.error || "Unable to load dormitory data."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={onClose}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[750px] max-h-[90vh] bg-white">
                <DialogHeader>
                    <DialogTitle>Edit Dormitory: {formState.data.name}</DialogTitle>
                    <DialogDescription>
                        Make changes to your dormitory details and room configurations here.
                    </DialogDescription>
                </DialogHeader>

                <Tabs
                    value={formState.activeTab}
                    onValueChange={(value: string) => {
                        if (value === "details" || value === "rooms") {
                            setFormState(prev => ({ ...prev, activeTab: value }));
                        }
                    }}
                    className="flex-1 overflow-hidden flex flex-col mt-4"
                >
                    <TabsList className="mb-4">
                        <TabsTrigger value="details">
                            Dorm Details
                        </TabsTrigger>
                        <TabsTrigger value="rooms">
                            Rooms ({formState.data.rooms.length})
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-hidden">
                        <TabsContent value="details" className="h-[calc(90vh-350px)] min-h-[400px]">
                            <ScrollArea className="h-[calc(90vh-350px)]">
                                <div className="space-y-6 p-4">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="dormName">Dorm Name</Label>
                                            <Input
                                                id="dormName"
                                                value={formState.data.name}
                                                onChange={(e) => handleUpdateDormInfo('name', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Location</Label>
                                            <Input
                                                id="location"
                                                value={formState.data.location}
                                                onChange={(e) => handleUpdateDormInfo('location', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <Card>
                                        <CardContent className="p-6">
                                            <h3 className="text-sm font-semibold mb-4">Dormitory Information</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Created</p>
                                                    <p className="font-medium">{new Date(formState.data.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Last Updated</p>
                                                    <p className="font-medium">{new Date(formState.data.updatedAt).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Total Rooms</p>
                                                    <p className="font-medium">{formState.data.rooms.length}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Admin ID</p>
                                                    <p className="font-medium">{formState.data.adminId}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="rooms" className="h-full">
                            <ScrollArea className="h-[calc(90vh-350px)] min-h-[400px]">
                                <div className="space-y-6 p-4">
                                    {formState.data.rooms.map((room: any, index: number) => (
                                        <Card key={room._id || room.id}>
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="font-semibold">Room {index + 1}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${room.type === 'Male' ? 'bg-blue-100 text-blue-700' :
                                                        room.type === 'Female' ? 'bg-pink-100 text-pink-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {room.type}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`room-${index}-name`}>Room Name</Label>
                                                        <Input
                                                            id={`room-${index}-name`}
                                                            value={room.roomName || ''}
                                                            onChange={(e) => handleUpdateRoomInfo(index, 'roomName', e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor={`room-${index}-type`}>Type</Label>
                                                        <Select
                                                            value={room.type}
                                                            onValueChange={(value: "Male" | "Female" | "Mixed") =>
                                                                handleUpdateRoomInfo(index, 'type', value)
                                                            }
                                                        >
                                                            <SelectTrigger id={`room-${index}-type`}>
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Male">Male</SelectItem>
                                                                <SelectItem value="Female">Female</SelectItem>
                                                                <SelectItem value="Mixed">Mixed</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor={`room-${index}-max`}>Max Occupants</Label>
                                                        <Input
                                                            id={`room-${index}-max`}
                                                            type="number"
                                                            min="1"
                                                            value={room.maxPax || ''}
                                                            onChange={(e) => handleUpdateRoomInfo(index, 'maxPax', e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="space-y-2 col-span-2">
                                                        <Label htmlFor={`room-${index}-desc`}>Description</Label>
                                                        <Input
                                                            id={`room-${index}-desc`}
                                                            value={room.description || ''}
                                                            onChange={(e) => handleUpdateRoomInfo(index, 'description', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="text-white" style={{ backgroundColor: "#8B2131", borderColor: "#761B29" }}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditDormDialog;