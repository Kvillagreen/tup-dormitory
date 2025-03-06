import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import React, { useEffect, useState } from "react";
import { FiDollarSign, FiPlus } from "react-icons/fi";
import { toast } from "react-toastify";
import { getAllMyNotificationNoticePayment, sendNoticePaymentApiRequest } from "../lib/apis/userApi";


const StudentPaymentDialog = ({
    isOpen,
    onClose,
    student,
    onUpdatePaymentStatus
}: any) => {
    const [paymentNotices, setPaymentNotices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newNotice, setNewNotice] = useState<any>({
        amount: "",
        dueDate: "",
        description: ""
    });
    console.log("student", student)

    const fetchNotifications = async () => {
        if (!student) return;
        try {
            console.log("student._id", student._id)
            const notifications = await getAllMyNotificationNoticePayment(student._id);
            console.log("notifications", notifications.noticePayments);

            // Collect unseen notifications
            setPaymentNotices(notifications.noticePayments); // Update state with the count of unseen notifications

        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };


    useEffect(() => {

        fetchNotifications();
    }, [student]);



    // Pagination settings
    const itemsPerPage = 10;
    const totalPages = Math.ceil(paymentNotices.length / itemsPerPage);
    const paginatedPayments = paymentNotices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusColor = (status: string) => {
        const colors = {
            paid: "bg-emerald-100 text-emerald-800",
            pending: "bg-amber-100 text-amber-800",
            overdue: "bg-rose-100 text-rose-800"
        };
        return colors[status as keyof typeof colors] || "bg-gray-100";
    };

    const handleCreateNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;

        try {
            setIsLoading(true);
            /*     await onCreatePaymentNotice(student._id, newNotice);
     */
            const newPaymentNotice: any = {
                ...student,
                adminId: "67b6122b87e0d9aae35ffdd6",
                userId: student._id,
                studentId: student.studentId,
                amount: Number(newNotice.amount),
                status: "pending",
                dueDate: newNotice.dueDate,
                description: newNotice.description,
                email: student.email,
                firstName: student.firstName,
                lastName: student.lastName,
                role: student.role,
            };


            console.log("newPaymentNotice", newPaymentNotice)

            await sendNoticePaymentApiRequest(newPaymentNotice);


            setPaymentNotices(prev => [newPaymentNotice, ...prev]);
            setIsFormOpen(false);
            setNewNotice({ amount: "", dueDate: "", description: "" });
            toast.success("Payment notice created successfully");
            fetchNotifications();
            onClose();

        } catch (error) {
            fetchNotifications();
            toast.error("Failed to create payment notice");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (noticeId: string, newStatus: string) => {
        try {
            setIsLoading(true);
            const paidDate = newStatus === "paid" ? new Date().toISOString() : undefined;
            const prepareData = {
                noticeId,
                status: newStatus,
                paidDate
            };
            console.log("Prepared data for status update:", prepareData);
            await onUpdatePaymentStatus(noticeId, prepareData);

            setPaymentNotices(prev =>
                prev.map((notice: any) =>
                    notice._id === noticeId
                        ? {
                            ...notice,
                            status: newStatus as any["status"],
                            paidDate: newStatus === "paid" ? new Date().toISOString() : undefined
                        }
                        : notice
                )
            );
            console.log("Updated status:", newStatus, "for notice ID:", noticeId);
        } catch (error) {
            toast.error("Failed to update payment status");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        });
    };

    if (!student) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden bg-white">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex flex-col items-start gap-1 text-xl font-semibold">
                        <div className="flex items-center gap-2">
                            <FiDollarSign className="text-red-600" />
                            Payment Management
                        </div>
                        <div className="text-lg">
                            Student Name: {student.firstName} {student.lastName}
                            <span className="text-sm text-gray-500 ml-3">
                                ( Student ID: {student.studentId} | Room ID: {student.roomId} )
                            </span>
                        </div>

                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col h-full">
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">Payment History</h3>
                            <Button
                                onClick={() => setIsFormOpen(true)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <FiPlus className="mr-2" />
                                New Payment Notice
                            </Button>
                        </div>

                        <Card className="border-0 shadow-none">
                            <ScrollArea className="h-[calc(90vh-280px)]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead>Description</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Paid Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedPayments.map((notice) => (
                                            <TableRow key={notice._id} className="hover:bg-slate-50">
                                                <TableCell className="font-medium">{notice.description}</TableCell>
                                                <TableCell>₱{notice.amount.toLocaleString()}</TableCell>
                                                <TableCell>{formatDate(new Date(notice.dueDate))}</TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(notice.status)}>
                                                        {notice.status.charAt(0).toUpperCase() + notice.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {notice.paidDate
                                                        ? formatDate(new Date(notice.paidDate))
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <select
                                                            value={notice.status}
                                                            onChange={(e) => handleStatusUpdate(notice._id, e.target.value)}
                                                            className="border rounded p-1 text-sm"
                                                            disabled={isLoading}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="paid">Paid</option>
                                                            <option value="overdue">Overdue</option>
                                                        </select>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </Card>
                    </div>

                    <div className="border-t p-4 mt-auto">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    /*      disabled={currentPage === 1} */
                                    />
                                </PaginationItem>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page =>
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    )
                                    .map((page, i, arr) => (
                                        <React.Fragment key={page}>
                                            {i > 0 && arr[i - 1] !== page - 1 && (
                                                <PaginationItem>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            )}
                                            <PaginationItem>
                                                <PaginationLink
                                                    onClick={() => setCurrentPage(page)}
                                                    isActive={currentPage === page}
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </React.Fragment>
                                    ))
                                }
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    /* disabled={currentPage === totalPages} */
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>

                {/* Create Payment Notice Dialog */}
                <Dialog open={isFormOpen} onOpenChange={() => setIsFormOpen(false)}>
                    <DialogContent className="sm:max-w-md bg-white">
                        <DialogHeader>
                            <DialogTitle>Create Payment Notice</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateNotice} className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="amount">Amount (₱)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter amount"
                                        value={newNotice.amount}
                                        onChange={(e) => setNewNotice((prev: any) => ({
                                            ...prev,
                                            amount: e.target.value
                                        }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={newNotice.dueDate}
                                        onChange={(e) => setNewNotice((prev: any) => ({
                                            ...prev,
                                            dueDate: e.target.value
                                        }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="e.g., Room rent for March 2024"
                                        value={newNotice.description}
                                        onChange={(e) => setNewNotice((prev: any) => ({
                                            ...prev,
                                            description: e.target.value
                                        }))}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsFormOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Creating..." : "Create Notice"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
};

export default StudentPaymentDialog;