import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajmhkwiqsnuilsacrxby.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbWhrd2lxc251aWxzYWNyeGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTM3NjYsImV4cCI6MjA1NTI4OTc2Nn0.VoBxw4__-fOWPllqQyIzCpCxwh8AjTfdHNvoJG8iY6A'; // Keep keys secure!
// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
interface UploadPdfResponse {
    url: string | null;
    error: string | null;
    filePath: string | null;
}

interface UploadPdfOptions {
    file: File;
    customFileName?: string;
    maxSizeMB?: number;
    folder?: string;
}

/**
 * Validates a PDF file based on type and size constraints
 */
const validatePdf = (file: File, maxSizeMB: number): string | null => {
    // Check file type
    if (!file.type || file.type !== 'application/pdf') {
        return 'Please upload a valid PDF file';
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return `File size must be under ${maxSizeMB}MB`;
    }

    return null;
};

/**
 * Uploads a PDF file to Supabase Storage
 */
export const uploadPdfFile = async ({
    file,
    customFileName,
    folder = 'applications'
}: UploadPdfOptions): Promise<UploadPdfResponse> => {
    try {
        // Generate unique file name
        const timestamp = new Date().getTime();
        const sanitizedFileName = customFileName || file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileExtension = sanitizedFileName.toLowerCase().endsWith('.pdf') ? '' : '.pdf';
        const finalFileName = `${timestamp}-${sanitizedFileName}${fileExtension}`;

        // Construct the file path
        const filePath = `${folder}/${finalFileName}`;

        // Upload to Supabase
        const { error: uploadError } = await supabase.storage
            .from('monkey-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                contentType: 'application/pdf',
                upsert: false
            });

        if (uploadError) {
            throw new Error(uploadError.message);
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from('monkey-images')
            .getPublicUrl(filePath);

        return {
            url: publicUrl,
            error: null,
            filePath
        };

    } catch (error) {
        console.error('PDF upload failed:', error);
        return {
            url: null,
            error: error instanceof Error ? error.message : 'Failed to upload PDF',
            filePath: null
        };
    }
};

// Optional: Helper function to get file download URL
export const getPdfDownloadUrl = async (filePath: string): Promise<string | null> => {
    try {
        const { data: { publicUrl } } = supabase.storage
            .from('monkey-images')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error getting download URL:', error);
        return null;
    }
};

export const handleFileUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `applications/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('applications')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('applications')
        .getPublicUrl(filePath);

    return publicUrl; // Return the URL of the uploaded file
};

// Allowed image types
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_MB = 5; // 5MB

// Image upload function
export const uploadImage = async (file: File): Promise<{ url: string | null; error: string | null }> => {
    try {
        // Validate file type
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            return { url: null, error: 'Only .jpg, .jpeg, .png, and .webp formats are supported' };
        }

        // Validate file size
        const maxSizeBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return { url: null, error: 'File size must be under 5MB' };
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `image-${Date.now()}.${fileExt}`;
        const filePath = `images/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw new Error(uploadError.message);
        }

        // Get public URL
        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        return { url: data.publicUrl, error: null };
    } catch (error) {
        console.error('Image upload failed:', error);
        return { url: null, error: error instanceof Error ? error.message : 'Failed to upload image' };
    }
};
