"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ImportantDialog = ({ student, showApplicationDialog, setShowApplicationDialog }: any) => {
    const [hasDownloaded, setHasDownloaded] = useState(false);
    const router = useRouter();

    const pdfUrl = "https://ajmhkwiqsnuilsacrxby.supabase.co/storage/v1/object/public/monkey-images/applications/1740808519390-application-67c2a08cd54ffca1b34409ef-1740808519390.pdf";

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.target = "_blank";
        link.download = "APPLICATION_FORM.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setHasDownloaded(true);
    };

    const handleAcknowledgment = () => {
        localStorage.setItem(`application-acknowledged`, "true");
        setShowApplicationDialog(false);
        router.push("/pdf-editor");
    };

    return (
        <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
            <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-lg p-6">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        Important: Application Form Required
                    </DialogTitle>
                    <DialogDescription asChild className="pt-4">
                        <div className="space-y-4">
                            <p className="text-sm text-gray-700">
                                Before applying for a dormitory room, please:
                            </p>
                            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
                                <li>Download the application form template</li>
                                <li>Fill out the form using iLovePDF editor</li>
                                <li>Submit the completed form with your application</li>
                            </ol>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Button
                        onClick={handleDownload}
                        className="flex items-center gap-2 text-white bg-[#8B2131] hover:bg-[#761B29] transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Download Application Template
                    </Button>
                    <Link href={"/pdf-editor"} className="w-full" target="_blank" rel="noopener noreferrer">
                        <Button disabled={!hasDownloaded} variant="outline" className="transition-colors w-full">
                            Fill Out Using PDF Editor
                        </Button>
                    </Link>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleAcknowledgment}
                        disabled={!hasDownloaded}
                        className="bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                        I have downloaded and understood
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ImportantDialog;
