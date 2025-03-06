import { z } from "zod";

export const dormApplicationSchema = z.object({
    date: z.string().min(1, "Date is required"),
    fullName: z.object({
        last: z.string().min(1, "Last name is required"),
        first: z.string().min(1, "First name is required"),
        middle: z.string().optional(),
    }),
    nickname: z.string().optional(),
    courseYearSection: z.string().min(1, "Course, Year & Section is required"),
    sex: z.enum(["Male", "Female", "Other"]),
    permanentAddress: z.string().min(1, "Permanent address is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    placeOfBirth: z.string().min(1, "Place of birth is required"),
    contactNumber: z.string().min(1, "Contact number is required"),
    relativeInTalisay: z.object({
        name: z.string().optional(),
        address: z.string().optional(),
    }),
    father: z.object({
        name: z.string().min(1, "Father's name is required"),
        occupation: z.string().optional(),
    }),
    mother: z.object({
        name: z.string().min(1, "Mother's name is required"),
        occupation: z.string().optional(),
    }),
    emergencyContact: z.object({
        name: z.string().min(1, "Emergency contact name is required"),
        contactNumber: z.string().min(1, "Emergency contact number is required"),
        address: z.string().min(1, "Emergency contact address is required"),
    }),
    lodgingPeriod: z.object({
        term: z.enum(["First", "Second", "Third", "Summer"]).optional(),
        month: z.string().optional(),
        day: z.string().optional(),
    }),
    distance: z.string().optional(),
    monthlyIncome: z.string().optional(),
    imageUrl: z.string().optional(), // Signature Upload
});

export type DormApplication = z.infer<typeof dormApplicationSchema>;
