"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DormApplication, dormApplicationSchema } from "../lib/zodSchema/RoomSchema";
import { supabase, uploadPdfFile } from "../lib/supabase/supabase";
import { toast } from "react-toastify";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
import { jsPDF } from "jspdf"; // Import jsPDF
import generatePDF from "../lib/generatePDF";
import { sendStudentApplicationFormApiRequest } from "../lib/apis/userApi";

interface DormApplicationFormProps {
  open: boolean;
  onClose: (value: boolean) => void;
  selectedRoom: any;
  user: any;
}

export default function DormApplicationForm({ open, onClose, selectedRoom, user }: any) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadPage, setShowUploadPage] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState<any>(null)


  const form = useForm<DormApplication>({
    resolver: zodResolver(dormApplicationSchema),
    defaultValues: {
      date: "",
      fullName: { last: "", first: "", middle: "" },
      nickname: "",
      courseYearSection: "",
      sex: "Male",
      permanentAddress: "",
      dateOfBirth: "",
      placeOfBirth: "",
      contactNumber: "",
      relativeInTalisay: { name: "", address: "" },
      father: { name: "", occupation: "" },
      mother: { name: "", occupation: "" },
      emergencyContact: { name: "", contactNumber: "", address: "" },
      lodgingPeriod: { term: undefined, month: "", day: "" },
      distance: "",
      monthlyIncome: "",
      imageUrl: "",
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous errors
    setUploadError(null);

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadError("Only .jpg, .jpeg, .png, and .webp formats are supported");
      return;
    }

    try {
      // Set uploading state
      setIsUploading(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || "png";
      const fileName = `image-${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`; // Ensure it uploads inside 'images/' folder

      // Upload to Supabase Storage (monkey-images bucket)
      const { error: uploadError } = await supabase.storage
        .from('monkey-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL of uploaded image
      const { data } = supabase.storage.from('monkey-images').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      if (!publicUrl) throw new Error("Failed to retrieve uploaded image URL");

      // Update form with image URL
      form.setValue("imageUrl", publicUrl);

      toast.success("Image uploaded successfully");
    } catch (err) {
      console.error("Image upload error:", err);
      setUploadError(err instanceof Error ? err.message : "Failed to upload image");
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };


  const prepareData = (data: DormApplication) => {
    return {
      ...data,
      imageUrl: form.getValues("imageUrl"), // Attach uploaded image URL
    };
  };


  const onSubmit = async (data: DormApplication) => {
    try {
      if (!selectedRoom) {
        toast.error("No room selected for booking.");
        return;
      }

      setIsLoading(true);

      // Calculate distance score
      const minPoints = 0;
      const maxPoints = 100;
      const minDistance = 0;
      const maxDistance = 228;
      const inputDistance = parseFloat(data.distance as any);

      const distanceScore = ((minPoints + (inputDistance - minDistance) * (maxPoints - minPoints)) / (maxDistance - minDistance)) * 0.5;

      // Calculate income score
      const incomeRanges = [
        { min: 219140, score: 1 },
        { min: 131484, score: 2 },
        { min: 76669, score: 3 },
        { min: 43828, score: 4 },
        { min: 21194, score: 5 },
        { min: 9520, score: 6 },
        { min: 0, score: 7 },
      ];

      const inputIncome = parseFloat(data.monthlyIncome as any);
      const incomeScore = incomeRanges.find(range => inputIncome >= range.min)?.score || 7;

      const xmin = 1;
      const xmax = 7;
      const x = incomeScore;

      // Correct formula for income normalization
      const actualIncomeScore = ((x - xmin) / (xmax - xmin)) * 40;

      // Generate PDF with form data
      const preparedData = {
        imageUrl: form.getValues("imageUrl"),
        ...data
      }
      /*   const pdfDoc = new jsPDF();
        await generatePDF(preparedData as any);
   */
      // Convert PDF to Blob/File
      /*   const pdfBlob = new Blob([pdfDoc.output('blob')], { type: 'application/pdf' }); */
      /*   const pdfFile = new File([pdfBlob], `application-${Date.now()}.pdf`, { type: 'application/pdf' });
   */
      // Upload PDF
      /*    const uploadResult = await uploadPdfFile({
           file: pdfFile,
           folder: "applications",
           customFileName: `application-${user?._id || 'user'}-${Date.now()}`,
         }); */

      /*      if (uploadResult.error) {
             throw new Error(`Failed to upload application form: ${uploadResult.error}`);
           }
      */

      /* // Upload PDF
      const uploadResult = await uploadPdfFile({
        file: data.applicationForm,
        folder: "applications",
        customFileName: `application-${user?._id || 'user'}-${Date.now()}`,
      });

      if (uploadResult.error) {
        throw new Error(`Failed to upload application form: ${uploadResult.error}`);
      } */

      // Prepare booking data
      const bookingData = {
        dormId: selectedRoom._id,
        roomId: selectedRoom.roomName,
        roomName: selectedRoom.roomName,
        adminId: "67b6122b87e0d9aae35ffdd6",
        maxPax: selectedRoom.maxPax,
        description: selectedRoom.description,
        userId: user?._id || 'anonymous',
        name: `${data.fullName.first} ${data.fullName.last}`,
        email: user?.email || 'no-email',
        phone: data.contactNumber || 'no-phone',
        distance: data.distance,
        distanceScore: distanceScore.toFixed(2),
        monthlyIncome: data.monthlyIncome,
        incomeScore: actualIncomeScore.toFixed(2),
        applicationFormUrl: form.getValues("imageUrl"),

      };
      console.log("bpoo", bookingData)


       const response = await fetch("https://tup-ers.infotech3c.com/services/printable/test.php", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify(bookingData),
       });
 
       if (!response.ok) {
         throw new Error("Failed to process application form download.");
       }
 
       const blob = await response.blob();
       const url = window.URL.createObjectURL(blob);
       const link = document.createElement("a");
       link.href = url;
       link.download = "APPLICATION_FORM.pdf";
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       window.URL.revokeObjectURL(url);
 
       setHasDownloaded(true);
  
      // Submit booking request
      /*   await sendStudentApplicationFormApiRequest(bookingData);
        toast.success("Application submitted successfully!"); */
      /*  onClose(false);
       form.reset(); */
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(`Failed to submit application: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  /*   const handleNext = async () => {
      const isValid = await form.trigger();
      if (isValid) {
        const formData = form.getValues();
        // Validate required fields before proceeding
        if (!formData.imageUrl) {
          toast.error("Please upload your signature before proceeding");
          return;
        }
        setShowUploadPage(true);
      } else {
        toast.error("Please fill in all required fields");
      }
    }; */

  /*   if (showUploadPage) {
      return (
        <Dialog open={open} onOpenChange={onClose}>
          <FinalUploadPage
            formData={form.getValues()}
            onBack={() => setShowUploadPage(false)}
            onClose={onClose}
            selectedRoom={selectedRoom}
            user={user}
          />
        </Dialog>
      );
    } */

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 bg-white">
        <DialogHeader className="p-6 bg-[#8B2131] text-white sticky top-0 z-10">
          <DialogTitle className="text-2xl font-bold">Application to Lodge</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-full px-8 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Date Field */}
              <div className="w-full flex justify-end">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="w-[200px]">
                      <FormLabel className="text-sm font-medium text-gray-700">Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName.last"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Last Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter last name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fullName.first"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">First Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter first name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fullName.middle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Middle Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter middle name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Nickname</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter nickname"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="courseYearSection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Course, Year & Section</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="e.g., BSIT 2-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Sex</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]">
                              <SelectValue placeholder="Select sex" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="permanentAddress"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-sm font-medium text-gray-700">Permanent Address</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="min-h-[80px] border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter complete address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Date of Birth</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="placeOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Place of Birth</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter place of birth"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Contact Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter contact number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Family Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">Family Information</h2>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="father.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Father's Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter father's name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="father.occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Father's Occupation</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter father's occupation"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="mother.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Mother's Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter mother's name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mother.occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Mother's Occupation</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter mother's occupation"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">Emergency Contact</h2>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="emergencyContact.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Contact Person</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter contact person's name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContact.contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Contact Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter contact number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="emergencyContact.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Address</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="min-h-[80px] border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                          placeholder="Enter complete address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Lodging Details Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">Lodging Details</h2>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="lodgingPeriod.term"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Term</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]">
                              <SelectValue placeholder="Select term" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
                            <SelectItem value="First">First</SelectItem>
                            <SelectItem value="Second">Second</SelectItem>
                            <SelectItem value="Third">Third</SelectItem>
                            <SelectItem value="Summer">Summer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="distance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Distance from TUP-V (km)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter distance"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthlyIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Monthly Family Income</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                            placeholder="Enter monthly income"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Signature Upload Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">Digital Signature</h2>
                  <Separator className="flex-1" />
                </div>

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Upload Signature</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="h-10 border-gray-300 focus:border-[#8B2131] focus:ring-[#8B2131]"
                        />
                      </FormControl>
                      {uploadError && (
                        <div className="text-red-500 text-sm mt-1">{uploadError}</div>
                      )}
                      {isUploading && (
                        <div className="text-gray-500 text-sm mt-1">Uploading signature...</div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex w-full gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onClose(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"

                  className="px-6 bg-[#8B2131] text-white hover:bg-[#a94351]"
                >
                  submit
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>


      </DialogContent>
    </Dialog>
  );
}
