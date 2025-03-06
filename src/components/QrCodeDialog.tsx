'use client'
import React, { useEffect } from 'react';
import QRCode from 'react-qr-code';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";


const DormitoryQRCode: React.FC<any> = ({ applicationData }: any) => {

    const userData = JSON.parse(localStorage.getItem("user") || "{}");

    // Create a formatted string of the data for the QR code
    const qrData = JSON.stringify({
        id: applicationData._id,
        name: applicationData.name,
        room: applicationData.roomId,
        dorm: applicationData.dormId,
        checkIn: applicationData.checkInDate,
        checkOut: applicationData.checkOutDate,
        guests: applicationData.numberOfGuests,
        studentId: userData.studentId
    });


    return (
        <Dialog>
            <DialogTrigger asChild>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle>Dormitory Access QR Code</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center space-y-6 py-4">
                    <div className="bg-white p-4 rounded-lg">
                        <QRCode
                            value={qrData}
                            size={200}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                    <div className="space-y-2 text-center">
                        <p className="text-lg font-semibold">{applicationData.name}</p>
                        <div className="text-sm text-gray-500">
                            <p>Room {applicationData.roomId} • Dorm {applicationData.dormId}</p>
                            {userData.role === 'student' && (
                                <p>Student ID: {userData.studentId}</p>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DormitoryQRCode;