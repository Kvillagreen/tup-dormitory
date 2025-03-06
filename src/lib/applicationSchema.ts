
    // lib/schemas/application-schema.ts
import { z } from 'zod';

export const applicationSchema = z.object({
  date: z.string(),
  name: z.string().optional(),
  lastName: z.string().min(2, { message: "Last name is required" }),
  firstName: z.string().min(2, { message: "First name is required" }),
  middleName: z.string().optional(),
  periodType: z.enum(["Term", "Month", "Day"]),
  term: z.enum(["FIRST", "2ND", "3RD", "SUMMER"]).optional(),
  course: z.string().min(2, { message: "Course information is required" }),
  sex: z.string().min(1, { message: "Sex is required" }),
  nickname: z.string().optional(),
  permanentAddress: z.string().min(2, { message: "Permanent address is required" }),
  dateOfBirth: z.string().min(2, { message: "Date of birth is required" }),
  placeOfBirth: z.string().min(2, { message: "Place of birth is required" }),
  contactNo: z.string().min(2, { message: "Contact number is required" }),
  relativeInTalisay: z.string().optional(),
  fatherName: z.string().min(2, { message: "Father's name is required" }),
  fatherOccupation: z.string().min(2, { message: "Father's occupation is required" }),
  motherName: z.string().min(2, { message: "Mother's name is required" }),
  motherOccupation: z.string().min(2, { message: "Mother's occupation is required" }),
  emergencyContact: z.string().min(2, { message: "Emergency contact is required" }),
  emergencyContactNo: z.string().min(2, { message: "Emergency contact number is required" }),
  emergencyAddress: z.string().min(2, { message: "Emergency address is required" }),
  roomNumber: z.string().optional(),
  deckPreference: z.enum(["Lower", "Upper"]).optional(),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;