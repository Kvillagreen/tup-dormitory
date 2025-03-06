import axios, { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { FormMessage } from '@/components/ui/form';

//const baseUrl = 'http://localhost:8000/api/v1';

//const baseUrl = 'http://localhost:8000/api/v1';

const baseUrl = 'https://tupv-dormitory-server-4pgk.onrender.com/api/v1';


export const createUserApiRequest = async (data: any): Promise<any> => {
    try {
        // Make sure to provide the correct URL for the Axios request
        const response: AxiosResponse = await axios.post(`${baseUrl}/user/signup`, data);
        return response.data; // Return the response data
    } catch (error) {
        console.log("error", error);
        // Handle error appropriately
        if (error instanceof AxiosError) {
            // Axios error handling
            if (error.response) {
                // Notify user of the error
                toast.error(error.response.data.message || `Error ${error.response.status}: ${error.response.statusText}`);
                throw new Error(error.response.data.FormMessage || `Error ${error.response.status}: ${error.response.statusText}`);
            } else if (error.request) {
                // Notify user of no response
                toast.error('No response received from the server.');
                throw new Error('No response received from the server.');
            } else {
                // Something happened in setting up the request that triggered an Error
                toast.error(error.message);
                throw new Error(error.message);
            }
        } else {
            toast.error('An unexpected error occurred.');
            throw new Error('An unexpected error occurred.');
        }
    }
};

/* 
export const requestToBookApiRequest = async (data: any): Promise<any> => {
    try {
        console.log("data", data);
        // Make sure to provide the correct URL for the Axios request
        const response = await axios.post(`${baseUrl}/user/application/student`, data);
        console.log("response", response);
        return response.data; // Return the response data
    } catch (error) {
        console.log("error", error);
        // Handle error appropriately
        if (error instanceof AxiosError) {
            // Axios error handling
            if (error.response) {
                // The request was made and the server responded with a status code outside the 2xx range
                throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
            } else if (error.request) {
                // The request was made but no response was received
                throw new Error('No response received from the server.');
            } else {
                // Something happened in setting up the request that triggered an Error
                throw new Error(error.message);
            }
        } else {
            throw new Error('An unexpected error occurred.');
        }
    }
}; */


export const signInUserApiRequest = async (data: any): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await axios.post(`${baseUrl}/user/signin`, data);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.log("error", error)
            if (error.response) {
                // Notify user of the error
                toast.error(error.response.data.message || `Error ${error.response.status}: ${error.response.statusText}`);
                throw new Error(error.response.data.message || `Error ${error.response.status}: ${error.response.statusText}`);
            } else if (error.request) {
                // Notify user of no response
                toast.error("No response received from the server.");
                throw new Error("No response received from the server.");
            }
        }
        // Notify user of unexpected error
        toast.error("An unexpected error occurred.");
        throw new Error("An unexpected error occurred.");
    }
};


interface StudentQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    studentId?: string;
    firstName?: string;
    lastName?: string;
}

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface Student {
    id: string;
    name: string;
    dorm: string;
    room: string;
    status: "Active" | "Inactive";
    // Add other student fields here
}

interface StudentResponse {
    success: boolean;
    message: string;
    students: any[];
    pagination: PaginationInfo;
}

export const getAllStudentsApiRequest = async (
    params: StudentQueryParams
): Promise<StudentResponse> => {
    try {
        // Extract and validate parameters
        const { page = 1, limit = 10, search, studentId, firstName, lastName } = params;

        // Make the API request
        const response: AxiosResponse<StudentResponse> = await axios.get(
            `${baseUrl}/user/students`,
            {
                params: {
                    page: Math.max(page, 1),
                    limit: Math.max(limit, 1),
                    search: search?.trim() || undefined,
                    studentName: studentId || undefined,
                    firstName: firstName?.trim() || undefined,
                    lastName: lastName?.trim() || undefined
                },
                timeout: 10000, // Set a reasonable timeout (10 seconds)
            }
        );
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        // Handle different error types
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{ message?: string }>;

            if (axiosError.response) {
                // Server responded with error status (4xx, 5xx)
                const errorMessage = axiosError.response.data?.message ||
                    `Error ${axiosError.response.status}: ${axiosError.response.statusText}`;
                throw new Error(errorMessage);
            } else if (axiosError.request) {
                // Request made but no response received (network issues)
                throw new Error("No response received from the server. Please check your connection.");
            } else {
                // Error in setting up the request
                throw new Error(`Request configuration error: ${axiosError.message}`);
            }
        }

        // For non-Axios errors
        throw new Error((error as Error)?.message || "An unexpected error occurred.");
    }
};

export const createDormApiRequest = async (data: any): Promise<any> => {
    try {
        const response: AxiosResponse = await axios.post(`${baseUrl}/user/dorm`, data);
        return response.data; // Return the response data
    } catch (error) {
        // Handle error appropriately
        if (error instanceof AxiosError) {
            if (error.response) {
                // The request was made and the server responded with a status code outside the 2xx range
                throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
            } else if (error.request) {
                // The request was made but no response was received
                throw new Error('No response received from the server.');
            } else {
                // Something happened in setting up the request that triggered an Error
                throw new Error(error.message);
            }
        } else {
            throw new Error('An unexpected error occurred.');
        }
    }
};

export const getAllStudentsTotalCountApiRequest = async (): Promise<any> => {
    try {

        // Make the API request
        const response: AxiosResponse<StudentResponse> = await axios.get(
            `${baseUrl}/user/students/total`,
        );

        console.log("response", response.data);
        return response.data;
    } catch (error) {
        // Handle different error types
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{ message?: string }>;

            if (axiosError.response) {
                // Server responded with error status (4xx, 5xx)
                const errorMessage = axiosError.response.data?.message ||
                    `Error ${axiosError.response.status}: ${axiosError.response.statusText}`;
                throw new Error(errorMessage);
            } else if (axiosError.request) {
                // Request made but no response received (network issues)
                throw new Error("No response received from the server. Please check your connection.");
            } else {
                // Error in setting up the request
                throw new Error(`Request configuration error: ${axiosError.message}`);
            }
        }

        // For non-Axios errors
        throw new Error((error as Error)?.message || "An unexpected error occurred.");
    }
};

export const getAllTotalsDormAndRoomsApiRequest = async (adminId: string): Promise<{ totalDorms: number; totalRooms: number }> => {
    try {
        if (!adminId) {
            throw new Error("Admin ID is required.");
        }

        console.log("Fetching dorm and room totals for adminId:", adminId);

        // Correct API request using GET and adminId in URL
        const response: AxiosResponse<{
            success: boolean;
            message: string;
            totalDorms: number;
            totalRooms: number;
        }> = await axios.get(`${baseUrl}/user/dorms/total/${adminId}`);

        console.log("API response:", response.data);

        // Ensure response is successful
        if (!response.data.success) {
            throw new Error(response.data.message || "Failed to fetch dormitory data.");
        }

        return {
            totalDorms: response.data.totalDorms,
            totalRooms: response.data.totalRooms,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{ message?: string }>;
            if (axiosError.response) {
                throw new Error(axiosError.response.data?.message || `Error ${axiosError.response.status}: ${axiosError.response.statusText}`);
            } else if (axiosError.request) {
                throw new Error("No response received from the server. Please check your connection.");
            } else {
                throw new Error(`Request configuration error: ${axiosError.message}`);
            }
        }
        throw new Error((error as Error)?.message || "An unexpected error occurred.");
    }
};
/* 
interface Room {
    id: string;
    roomName: string;
    description: string;
    maxPax: number;
    type: string;
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

interface any {
    success: boolean;
    message: string;
    dorms: Dorm[];
} */

export const getDormsByAdminIdApiRequest = async (adminId: string): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await axios.get(`${baseUrl}/user/dorms/${adminId || "67b6122b87e0d9aae35ffdd6"}`);
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const deleteDormByIdApiRequest = async (dormId: string): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await axios.delete(`${baseUrl}/user/dorm/${dormId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const getMyApplicationByIdApiRequest = async (userId: string): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await axios.get(`${baseUrl}/user/my-application/${userId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const markedAllNotificationAsReadApiRequest = async (userId: string): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await axios.patch(`${baseUrl}/attendance/seen-all/${userId}`);
        return response.data;
    } catch (error) {
        console.log("er", error)
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const updateEvictionNotificationStatusApiRequest = async (userId: string): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await axios.patch(`${baseUrl}/user/update-eviction-status/${userId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const deleteApplicationStudentSideApiRequest = async (data: any): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await axios.delete(`${baseUrl}/user/delete-application/${data.applicationId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const updateDormAndRoomsDataApiRequest = async (data: any): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await axios.patch(`${baseUrl}/user/update-dorms-and-rooms/${data.adminId}`, data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};



export const getDormByIdApiRequest = async (dormId: string): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await axios.get(`${baseUrl}/user/dorm/${dormId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};


export const getUserByIdApiRequest = async (userId: string): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await axios.get(`${baseUrl}/user/${userId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};


export const getAllPendingApplicationsTotalCountApiRequest = async (): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await axios.get(`${baseUrl}/user/applications/pendings/67b6122b87e0d9aae35ffdd6`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};




export const getAllApplicationByIdApiRequest = async (userId: string, role: string): Promise<any> => {
    try {
        // Use URLSearchParams to handle query parameters
        const params = new URLSearchParams();
        params.append('role', role);
        console.log("userId", userId);
        console.log("role", role);
        const response: AxiosResponse<any> = await axios.get(`${baseUrl}/user/applications/${userId}`, { params });
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};


export const updateApplicationStatusApiRequest = async (applicationId: any, data: any): Promise<any> => {
    try {
        console.log("data222ssssss2", data);
        const response: AxiosResponse<any> = await axios.patch(`${baseUrl}/user/application/${applicationId}`, data);
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        console.log("error", error);
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const rejectApplicationApiRequest = async (applicationId: any, data: any): Promise<any> => {
    try {
        console.log("data222ssssss2", data);
        const response: AxiosResponse<any> = await axios.patch(`${baseUrl}/user/reject-application/${applicationId}`, data);
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        console.log("error", error);
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const resetPasswordEmailApiRequest = async (email: any): Promise<any> => {
    try {
        console.log("data222ssssss2", email);
        const response: AxiosResponse<any> = await axios.post(`${baseUrl}/user/forgot-password/${email}`);
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        console.log("error", error);
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};


export const verifyOtpApiRequest = async (email: any, otp: any): Promise<any> => {
    try {
        console.log("data222ssssss2", email, otp);
        const response: AxiosResponse<any> = await axios.post(`${baseUrl}/user/verify-otp/${email}`, { otp });
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};


export const setNewPasswordApiRequest = async (email: any, password: any): Promise<any> => {
    try {
        console.log("data222ssssss2", email, password);
        const response: AxiosResponse<any> = await axios.post(`${baseUrl}/user/set-new-password/${email}`, { password });
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};


export const updateApplicationInterviewApiRequest = async (applicationId: string, data: any): Promise<any> => {
    try {
        console.log("data", data);


        const response: AxiosResponse<any> = await axios.patch(`${baseUrl}/user/application/interview/${applicationId}`, data);
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const updateMyUserDetailsById = async (userId: string, data: any): Promise<any> => {
    try {
        console.log("data", data);


        const response: AxiosResponse<any> = await axios.patch(`${baseUrl}/user/update-my-user-details/${userId}`, data);
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};



export const sendNoticePaymentApiRequest = async (data: any): Promise<any> => {
    try {
        const response: AxiosResponse = await axios.post(`${baseUrl}/user/notice-payment`, data);
        console.log("response", response.data);
        return response.data; // Return the response data
    } catch (error) {
        // Handle error appropriately
        if (error instanceof AxiosError) {
            if (error.response) {
                // The request was made and the server responded with a status code outside the 2xx range
                throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
            } else if (error.request) {
                // The request was made but no response was received
                throw new Error('No response received from the server.');
            } else {
                // Something happened in setting up the request that triggered an Error
                throw new Error(error.message);
            }
        } else {
            throw new Error('An unexpected error occurred.');
        }
    }
};


export const sendStudentApplicationFormApiRequest = async (data: any): Promise<any> => {
    try {
        const response: AxiosResponse = await axios.post(`${baseUrl}/user/applicationform`, data);
        console.log("response", response.data);
        return response.data; // Return the response data
    } catch (error) {
        console.log("error", error);
        // Handle error appropriately
        if (error instanceof AxiosError) {
            if (error.response) {
                // The request was made and the server responded with a status code outside the 2xx range
                toast.error(`Failed to submit booking request: ${error.response.data.message || error.response.statusText}`);
                throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
            } else if (error.request) {
                // The request was made but no response was received
                toast.error('Failed to submit booking request: No response received from the server.');
                throw new Error('No response received from the server.');
            } else {
                // Something happened in setting up the request that triggered an Error
                toast.error(`Failed to submit booking request: ${error.message}`);
                throw new Error(error.message);
            }
        } else {
            toast.error('Failed to submit booking request: An unexpected error occurred.');
            throw new Error('An unexpected error occurred.');
        }
    }
};


export const getAllMyNotificationNoticePayment = async (userId: string): Promise<any> => {
    try {

        const response: AxiosResponse<any> = await axios.get(`${baseUrl}/user/notice-payments/${userId}`);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const getAllMyNotificationEviction = async (userId: string): Promise<any> => {
    try {

        const response: AxiosResponse<any> = await axios.get(`${baseUrl}/user/my-notification-evicted/${userId}`);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const updatePaymentStatusApiRequest = async (noticeId: string, data: any): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await axios.patch(`${baseUrl}/user/update-status-payment/${noticeId}`, data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};






export const sendEvictionNoticeApiRequest = async (data: any): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await axios.post(`${baseUrl}/user/eviction-notice`, data);
        return response.data; // Return the response data
    } catch (error: any) {
        let errorMessage = "An unexpected error occurred.";

        if (error instanceof AxiosError) {
            if (error.response) {
                errorMessage = `Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`;
            } else if (error.request) {
                errorMessage = "No response received from the server.";
            } else {
                errorMessage = error.message;
            }
        }

        throw new Error(errorMessage);
    }
};

export const deleteStudentApiRequest = async (userId: any): Promise<any> => {
    try {
        console.log("data222ssssss2", userId);
        const response: AxiosResponse<any> = await axios.delete(`${baseUrl}/user/delete-student/${userId}`);
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const undoEvictionApiRequest = async (userId: any): Promise<any> => {
    try {
        console.log("data222ssssss2", userId);
        const response: AxiosResponse<any> = await axios.patch(`${baseUrl}/user/undo-eviction/${userId}`);
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const updateApplicationDataWithInterviewScoreApiRequest = async (applicationId: any, data: any): Promise<any> => {
    try {

        const userId = data.userId;
        const params = new URLSearchParams();
        params.append('userId', userId); // Add userId as a query parameter
        ``
        const response: AxiosResponse<any> = await axios.patch(`${baseUrl}/user/update-application-data/${applicationId}?${params.toString()}`, data);
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

export const generatedPDFApplicationFOrm = async (data: any): Promise<any> => {
    try {


        const response: AxiosResponse<any> = await axios.patch(`${baseUrl}/user/update-application-data/`, data);
        console.log("response", response.data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};


