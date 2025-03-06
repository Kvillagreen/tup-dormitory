"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { DoorOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Sample room data
const roomsData = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Room ${i + 1}`,
    status: i % 3 === 0 ? "Occupied" : "Available",
}));

const ROOMS_PER_PAGE = 9;

export default function Rooms() {
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Filter rooms based on search
    const filteredRooms = roomsData.filter((room) =>
        room.name.toLowerCase().includes(search.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE);
    const currentRooms = filteredRooms.slice(
        (currentPage - 1) * ROOMS_PER_PAGE,
        currentPage * ROOMS_PER_PAGE
    );

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Rooms</h1>

            {/* Search Bar */}
            <div className="w-full sm:w-1/2">
                <Input
                    placeholder="Search rooms..."
                    value={search}
                    onChange={(e: any) => {
                        setSearch(e.target.value);
                        setCurrentPage(1); // Reset pagination on search
                    }}
                />
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentRooms.length > 0 ? (
                    currentRooms.map((room) => (
                        <Card
                            key={room.id}
                            className="shadow-md border hover:shadow-lg transition-all duration-200"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg">{room.name}</CardTitle>
                                <DoorOpen
                                    className={`h-6 w-6 ${room.status === "Available" ? "text-green-500" : "text-red-500"
                                        }`}
                                />
                            </CardHeader>
                            <CardContent>
                                <p
                                    className={`text-lg font-semibold ${room.status === "Available" ? "text-green-500" : "text-red-500"
                                        }`}
                                >
                                    {room.status}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <p className="text-center col-span-full text-gray-500">No rooms found.</p>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2"
                    >
                        <ChevronLeft size={18} />
                        Prev
                    </Button>
                    <span className="font-medium">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2"
                    >
                        Next
                        <ChevronRight size={18} />
                    </Button>
                </div>
            )}
        </div>
    );
}
