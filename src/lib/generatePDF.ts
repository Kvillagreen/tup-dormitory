import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Interface for Dorm Application Data
interface DormApplicationData {
    date?: string;
    fullName: {
        last: string;
        first: string;
        middle: string;
    };
    nickname?: string;
    courseYearSection: string;
    sex: string;
    dateOfBirth: string;
    placeOfBirth: string;
    permanentAddress: string;
    contactNumber: string;
    lodgingPeriod?: {
        term?: string[];
        month?: boolean;
        day?: boolean;
    };
    relativeInTalisay?: {
        name: string;
        address: string;
    };
    father?: {
        name: string;
        occupation: string;
    };
    mother?: {
        name: string;
        occupation: string;
    };
    emergencyContact?: {
        name: string;
        contactNumber: string;
        address: string;
    };
    logoUrl?: string;
    imageUrl?: string;
}

const generateDormPDF = async (data: DormApplicationData) => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 40;

    // University Logo
    const logoX = margin;
    const logoY = 40;
    const logoWidth = 80;
    const logoHeight = 80;

    try {
        // Add University Logo
        if (data.logoUrl) {
            const logoResponse = await fetch(data.logoUrl);
            const logoBlob = await logoResponse.blob();
            const logoUrl = URL.createObjectURL(logoBlob);
            doc.addImage(logoUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
        }

        // University Header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('TECHNOLOGICAL UNIVERSITY OF THE PHILIPPINES VISAYAS', pageWidth / 2, 110, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('City of Talisay, Negros Occidental', pageWidth / 2, 125, { align: 'center' });

        // Application Title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('APPLICATION TO LODGE', pageWidth / 2, 150, { align: 'center' });
        doc.setFont('helvetica', 'normal');

        // Date (top right)
        doc.setFontSize(10);
        doc.text(`Date: ${data.date || ''}`, pageWidth - margin, 170, { align: 'right' });

        // Dormitory Management Section
        doc.setFontSize(10);
        doc.text('TO THE DORMITORY MANAGEMENT:', margin, 200);

        const fullName = `${data.fullName.first} ${data.fullName.middle} ${data.fullName.last}`;
        doc.text(`I, ${fullName}, would like to apply to lodge at the TUP VISAYAS DORMITORY for the period:`, margin, 220);

        // Lodging Period Checkboxes with more precise positioning
        const terms = ['FIRST', '2ND', '3RD', 'SUMMER'];
        terms.forEach((term, index) => {
            const checkboxX = margin + (index * 100);
            doc.text('( )', checkboxX, 240);
            doc.text(term, checkboxX + 20, 240);
        });

        // Month and Day checkboxes
        doc.text('( ) Month', margin, 260);
        doc.text('( ) Day', margin + 150, 260);

        // Promise Statement
        doc.text('I promise to comply with the rules and regulations now enforced or may be', margin, 300);
        doc.text('promulgated from time to time by the management of this dormitory.', margin, 315);

        // Signature Section
        if (data.imageUrl) {
            try {
                const signatureResponse = await fetch(data.imageUrl);
                const signatureBlob = await signatureResponse.blob();
                const signatureUrl = URL.createObjectURL(signatureBlob);

                // Signature placement
                const signatureWidth = 120;
                const signatureHeight = 40;
                const signatureX = pageWidth - margin - signatureWidth;
                const signatureY = 340;

                // Add signature image
                doc.addImage(signatureUrl, 'JPEG', signatureX, signatureY, signatureWidth, signatureHeight);
            } catch (error) {
                console.error("Signature image loading failed:", error);
            }
        }

        // Signature line
        doc.line(pageWidth - margin - 150, 390, pageWidth - margin - 50, 390);
        doc.setFontSize(8);
        doc.text('Signature of Applicant', pageWidth - margin - 100, 405, { align: 'center' });

        // Approval Section
        doc.setFontSize(10);
        doc.text('RECOMMENDING APPROVAL:', margin, 450);
        doc.text('APPROVED BY:', pageWidth - margin - 150, 450);

        doc.line(margin, 480, margin + 200, 480);
        doc.text('Asst. Dorm-in-Charge', margin, 495);

        doc.line(pageWidth - margin - 200, 480, pageWidth - margin, 480);
        doc.text('Dorm-in-Charge', pageWidth - margin - 200, 495);

        // Second Page
        doc.addPage();

        // Divider and Instructions
        doc.setFontSize(10);
        doc.text('***************************************************************************************', margin, 40);
        doc.text('(please print all entries)', margin, 60);

        // Personal Data Title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PERSONAL DATA', pageWidth / 2, 100, { align: 'center' });
        doc.setFont('helvetica', 'normal');

        // Personal Information Grid
        const personalInfoData = [
            ['Name:', `${data.fullName.last}, ${data.fullName.first} ${data.fullName.middle}`],
            ['Nickname:', data.nickname || ''],
            ['Course, Year & Section at TUP Visayas:', data.courseYearSection],
            ['Sex:', data.sex],
            ['Date of Birth:', data.dateOfBirth],
            ['Place of Birth:', data.placeOfBirth],
            ['Permanent Address:', data.permanentAddress],
            ['Contact No.:', data.contactNumber],
            ['Name & Address of Relative in Talisay City (if any):',
                data.relativeInTalisay ? `${data.relativeInTalisay.name}, ${data.relativeInTalisay.address}` : ''],
            ["Father's Name:", data.father?.name || ''],
            ["Father's Occupation:", data.father?.occupation || ''],
            ["Mother's Name:", data.mother?.name || ''],
            ["Mother's Occupation:", data.mother?.occupation || ''],
            ['In case of emergency, please notify:',
                data.emergencyContact ?
                    `${data.emergencyContact.name}, ${data.emergencyContact.contactNumber}, ${data.emergencyContact.address}`
                    : '']
        ];

        autoTable(doc, {
            startY: 120,
            margin: { left: margin },
            body: personalInfoData,
            theme: 'plain',
            styles: { fontSize: 10 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 200 },
                1: { cellWidth: 300 }
            }
        });

        // Save PDF
        doc.save('dorm_application.pdf');

    } catch (error) {
        console.error("PDF generation failed:", error);
    }
};

export default generateDormPDF;