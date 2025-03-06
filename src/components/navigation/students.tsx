"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { deleteStudentApiRequest, getAllStudentsApiRequest, sendEvictionNoticeApiRequest, undoEvictionApiRequest, updatePaymentStatusApiRequest } from "@/src/lib/apis/userApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiHash, FiMail, FiPhone, FiSearch, FiUser } from "react-icons/fi";
import { toast } from "react-toastify";
import { z } from "zod";
import { EvictionDialog } from "../EvictionDialog";
import StudentPaymentDialog from "../ViewStudentDetails";

// Type definitions
interface PaginationState {
    page: number;
    limit: number;
}

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

// Pagination component with maroon theme colors
const PaginationComponent = ({ paginationInfo, handlePageChange, isLoading }: any) => {
    const renderPaginationItems = () => {
        const items = [];
        const maxVisiblePages = 5;
        const halfVisiblePages = Math.floor(maxVisiblePages / 2);

        let startPage = Math.max(1, paginationInfo.page - halfVisiblePages);
        let endPage = Math.min(paginationInfo.totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page
        if (startPage > 1) {
            items.push(
                <PaginationItem key="first">
                    <PaginationLink
                        onClick={() => handlePageChange(1)}
                        className="text-gray-700 hover:text-maroon-600 hover:bg-maroon-50"
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
            );

            if (startPage > 2) {
                items.push(
                    <PaginationItem key="ellipsis-start">
                        <PaginationEllipsis className="text-gray-500" />
                    </PaginationItem>
                );
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        onClick={() => handlePageChange(i)}
                        isActive={i === paginationInfo.page}
                        className={i === paginationInfo.page
                            ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                            : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        // Last page
        if (endPage < paginationInfo.totalPages) {
            if (endPage < paginationInfo.totalPages - 1) {
                items.push(
                    <PaginationItem key="ellipsis-end">
                        <PaginationEllipsis className="text-gray-500" />
                    </PaginationItem>
                );
            }

            items.push(
                <PaginationItem key="last">
                    <PaginationLink
                        onClick={() => handlePageChange(paginationInfo.totalPages)}
                        className="text-gray-700 hover:text-maroon-600 hover:bg-maroon-50"
                    >
                        {paginationInfo.totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    return (
        <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
                Showing {((paginationInfo.page - 1) * paginationInfo.limit) + 1} to{" "}
                {Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)} of{" "}
                {paginationInfo.total} students
            </div>
            <Pagination>
                <PaginationContent className="flex items-center gap-2">
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => handlePageChange(paginationInfo.page - 1)}
                            className={`cursor-pointer border-gray-200 text-gray-700 transition-colors
                                ${!paginationInfo.hasPrevPage || isLoading ? "pointer-events-none opacity-50" : ""}`}
                            style={{ "--tw-ring-color": "rgba(139, 33, 49, 0.2)" } as React.CSSProperties}
                        />
                    </PaginationItem>

                    {/* Render pagination numbers */}
                    {Array.from({ length: paginationInfo.totalPages }, (_, index) => (
                        <PaginationItem key={index}>
                            <PaginationLink
                                onClick={() => handlePageChange(index + 1)}
                                className={`cursor-pointer border-gray-200 text-gray-700 transition-colors
                                    ${paginationInfo.page === index + 1 ? "font-bold bg-maroon-100" : ""}`}
                            >
                                {index + 1}
                            </PaginationLink>
                        </PaginationItem>
                    ))}

                    <PaginationItem>
                        <PaginationNext
                            onClick={() => handlePageChange(paginationInfo.page + 1)}
                            className={`cursor-pointer border-gray-200 text-gray-700 transition-colors
                                ${!paginationInfo.hasNextPage || isLoading ? "pointer-events-none opacity-50" : ""}`}
                            style={{ "--tw-ring-color": "rgba(139, 33, 49, 0.2)" } as React.CSSProperties}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>

    );
};

// Define Zod schema for form validation
const paymentNoticeSchema = z.object({
    amount: z.string().optional(),
    dueDate: z.string().nonempty("Due date is required"),
    description: z.string().nonempty("Description is required"),
});


export const evictionSchema = z.object({
    evictionReason: z.string().min(5, "Reason must be at least 5 characters long"),
    evictionNoticeDate: z.string().optional(),
    evictionNoticeTime: z.string().optional(),
    notes: z.string().optional(),
});

// Define a TypeScript type based on the schema
export type EvictionFormData = z.infer<typeof evictionSchema>;

const Students = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchStudentId, setSearchStudentId] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const debouncedStudentId = useDebounce(searchStudentId, 500);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        limit: 10,
    });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [paymentNoticeForm, setPaymentNoticeForm] = useState({
        amount: "",
        dueDate: "",
        description: "",
    });
    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(paymentNoticeSchema),
    });
    const [showWithRoom, setShowWithRoom] = useState<any>(false);
    const [showWithoutRoom, setShowWithoutRoom] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    const [isEvictionOpen, setIsEvictionOpen] = useState(false);


    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const response = await getAllStudentsApiRequest({
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch,
                studentId: debouncedStudentId || undefined,
            });
            setStudents(response.students as any[]);
            setPaginationInfo(response.pagination);
        } catch (error: any) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, pagination.limit, debouncedSearch, debouncedStudentId]);

    const handleError = (error: any) => {
        toast.error("Error fetching students. Please try again.");
        setIsError(true);
    };

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= paginationInfo.totalPages) {
            setPagination((prev) => ({ ...prev, page: newPage }));
        }
    };

    const handleViewStudent = (student: any) => {
        console.log("Viewing student:", student);
        setSelectedStudent(student);
        setIsViewDialogOpen(true);
    };

    // Render empty table rows for loading state
    const renderSkeletonRows = () => {
        return Array(pagination.limit)
            .fill(0)
            .map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                        <Skeleton className="h-6 w-32" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-6 w-48" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-6 w-20" />
                    </TableCell>
                </TableRow>
            ));
    };

    /*  // Function to handle sending the notice
     const handleSendNotice = async (data: any) => {
         try {
             const prepareData = {
                 amount: data.amount,
                 dueDate: data.dueDate,
                 description: data.description,
                 studentId: selectedStudent?.studentId,
                 userId: selectedStudent?._id,
                 email: selectedStudent?.email,
                 firstName: selectedStudent?.firstName,
                 lastName: selectedStudent?.lastName,
                 phone: selectedStudent?.phone,
                 role: selectedStudent?.role,
             }
 
             await sendNoticePaymentApiRequest(prepareData);
 
             toast.success("Payment notice sent successfully!");
             // Log the payment notice form data and the selected student
             console.log("Notice sent!", data, "Selected Student:", selectedStudent);
             setIsDialogOpen(false); // Close the dialog after sending
         } catch (error) {
             handleError(error);
         }
     }; */

    const filteredStudents = () => {
        if (showWithRoom) {
            return students.filter(student => student.roomId);
        }
        if (showWithoutRoom) {
            return students.filter(student => !student.roomId);
        }
        return students;
    };


    const handleUpdatePaymentStatus = async (noticeId: any, prepareData: any) => {
        console.log("Payment ID:", noticeId, "New Statussss222:", prepareData);
        try {
            const response = await updatePaymentStatusApiRequest(noticeId, prepareData);
            console.log("Payment status updated successfully!", response);
            toast.success("Payment status updated successfully!");
            console.log("Payment status updated successfully!");

        } catch (error) {
            console.log("errrrr", error)
            handleError(error);
        }
    }

    const handleEvictStudent = (student: any) => {
        console.log("Evicting student:", student);
        setSelectedStudent(student);
        setIsEvictionOpen(true);
    };

    const confirmEviction = async (data: EvictionFormData) => {
        if (!selectedStudent) {
            toast.error("No student selected.");
            return;
        }

        // New check for designated room
        if (!selectedStudent.roomId) {
            toast.error("Cannot evict the user as there is no designated room.");
            return;
        }

        const evictionData = {
            studentId: selectedStudent.studentId,
            userId: selectedStudent._id,
            roomId: selectedStudent.roomId,
            roomName: selectedStudent.roomName,
            phone: selectedStudent.phone,
            email: selectedStudent.email,
            firstName: selectedStudent.firstName,
            lastName: selectedStudent.lastName,
            adminId: selectedStudent.adminId,
            applicationId: selectedStudent.applicationId,
            evictionReason: data.evictionReason,
            evictionNoticeDate: data.evictionNoticeDate,
            evictionNoticeTime: data.evictionNoticeTime,
        };
        console.log("Eviction data:", evictionData);
        try {
            toast.info("Processing eviction...");

            const response = await sendEvictionNoticeApiRequest(evictionData);
            console.log("Response:", response);
            toast.success(response.message || "Eviction recorded successfully.");
            setIsEvictionOpen(false); // Close modal after success
            fetchStudents();
        } catch (error: any) {
            toast.error(error.message || "Failed to process eviction.");
        }
    };


    const handleUndoEviction = useCallback(async (student: any) => {
        console.log("Undoing eviction for student:", student);
        setIsLoading(true);
        try {
            await undoEvictionApiRequest(student._id);
            toast.success("Eviction undone successfully!");
            fetchStudents();
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    }, [fetchStudents]);

    const handleDeleteStudent = useCallback(async (student: any) => {
        console.log("Deleting student:", student);
        setIsLoading(true);
        try {
            await deleteStudentApiRequest(student._id);
            toast.success("Student deleted successfully!");
            fetchStudents();
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    }, [fetchStudents]);

    return (
        <Card className="w-full mt-5 border-gray-200 shadow-sm rounded-xl my-8">
            <CardHeader className="pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-800">Student Directory</CardTitle>
                        <CardDescription className="text-gray-500 mt-1">
                            Manage and view all student records
                        </CardDescription>
                    </div>
                    <div className="h-10 w-10 bg-maroon-50 rounded-full flex items-center justify-center">
                        <FiUser className="h-5 w-5 text-maroon-600" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex flex-col space-y-6">
                    <div className="flex flex-col md:flex-row justify-end gap-4">
                        <div className="relative w-full md:w-1/3">
                            <FiHash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Find by Student Name..."
                                value={searchStudentId}
                                onChange={(e) => setSearchStudentId(e.target.value)}
                                className="pl-10 w-full border-gray-200 focus-visible:ring-maroon-200 focus-visible:border-maroon-400"
                                style={{ "--tw-ring-color": "rgba(139, 33, 49, 0.2)" } as any}
                            />
                        </div>
                        <div className="w-full md:w-auto">
                            <Button
                                onClick={fetchStudents}
                                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                style={{ backgroundColor: "#007BFF", borderColor: "#0056b3" }}
                            >
                                <FiSearch className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </div>
                        <div className="w-full md:w-auto">
                            <Button
                                onClick={() => {
                                    setShowWithRoom(true);
                                    setShowWithoutRoom(false);
                                }}
                                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white"
                            >
                                Show With Room
                            </Button>
                        </div>
                        <div className="w-full md:w-auto">
                            <Button
                                onClick={() => {
                                    setShowWithoutRoom(true);
                                    setShowWithRoom(false);
                                }}
                                className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white"
                            >
                                Show N/A Room
                            </Button>
                        </div>
                    </div>

                    <div className="border rounded-md overflow-x-auto border-gray-200">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-100 hover:bg-gray-200">
                                    <TableHead className="whitespace-nowrap font-semibold text-gray-800">
                                        <div className="flex items-center gap-2">
                                            <FiUser className="text-gray-600" />
                                            <span>Name</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap font-semibold text-gray-800">
                                        <div className="flex items-center gap-2">
                                            <FiMail className="text-gray-600" />
                                            <span>Email</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap font-semibold text-gray-800">
                                        <div className="flex items-center gap-2">
                                            <FiPhone className="text-gray-600" />
                                            <span>Phone</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap font-semibold text-gray-800">Student ID</TableHead>
                                    <TableHead className="whitespace-nowrap font-semibold text-gray-800">Designated Room</TableHead>
                                    <TableHead className="whitespace-nowrap font-semibold text-gray-800">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    renderSkeletonRows()
                                ) : isError ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center p-8 text-red-500"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <p>Error fetching students</p>
                                                <Button
                                                    variant="outline"
                                                    onClick={fetchStudents}
                                                    className="mt-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                                                >
                                                    Try Again
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStudents().length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center p-8 text-gray-500"
                                        >
                                            <p>No students found</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents().map((student) => (
                                        <TableRow
                                            key={student._id}
                                            className={`hover:bg-slate-50 transition-colors ${student.evicted ? "bg-red-100" : ""}`}
                                        >
                                            <TableCell className="font-medium text-gray-800">
                                                {student.firstName} {student.lastName}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-700">
                                                {student.email}
                                            </TableCell>
                                            <TableCell className="text-sm">{student.phone}</TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {student.studentId}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {student.roomName ? student.roomName : "N/A"}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="flex items-center gap-2">
                                                    {student.evicted ? (
                                                        <Badge className="p-1 bg-red-500 text-white">
                                                            Evicted!
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-yellow-500 hover:bg-yellow-50"
                                                            onClick={() => handleEvictStudent(student)}
                                                            disabled={isLoading}
                                                        >
                                                            Evict
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-gray-500 hover:bg-gray-50"
                                                        onClick={() => handleViewStudent(student)}
                                                        disabled={isLoading}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-white  bg-red-500 hover:bg-red-50"
                                                        onClick={() => handleDeleteStudent(student)}
                                                        disabled={isLoading}
                                                    >
                                                        Delete Student
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Component */}
                    {!isLoading && !isError && filteredStudents().length > 0 && (
                        <PaginationComponent
                            paginationInfo={paginationInfo}
                            handlePageChange={handlePageChange}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            </CardContent>
            {/* Payment Notice Dialog */}
            {/*   <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white">
                    <DialogHeader>
                        <DialogTitle>Send Payment Notice</DialogTitle>
                        <DialogDescription>
                            Send a payment reminder to {selectedStudent?.firstName} {selectedStudent?.lastName}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(handleSendNotice)}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="amount" className="text-right">
                                    Amount
                                </Label>
                                <Controller
                                    name="amount"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="Enter amount"
                                            className="col-span-3"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    )}
                                />
                                {errors.amount && <span className="text-red-500">{errors.amount.message}</span>}
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="dueDate" className="text-right">
                                    Due Date
                                </Label>
                                <Controller
                                    name="dueDate"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="dueDate"
                                            type="date"
                                            className="col-span-3"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    )}
                                />
                                {errors.dueDate && <span className="text-red-500">{errors.dueDate.message}</span>}
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">
                                    Description
                                </Label>
                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => (
                                        <Textarea
                                            id="description"
                                            placeholder="Enter payment notice details"
                                            className="col-span-3"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    )}
                                />
                                {errors.description && <span className="text-red-500">{errors.description.message}</span>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Send Notice
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog> */}
            <StudentPaymentDialog
                isOpen={isViewDialogOpen}
                onClose={() => setIsViewDialogOpen(false)}
                student={selectedStudent}
                onUpdatePaymentStatus={handleUpdatePaymentStatus}
            />

            <EvictionDialog
                isOpen={isEvictionOpen}
                onClose={() => setIsEvictionOpen(false)}
                onConfirm={confirmEviction}
                student={selectedStudent}
            />

        </Card >
    );
};

export default Students