"use server";

import { visaFormSchema, type VisaFormData } from "@/lib/visa-schema";
import { generateMrzLines } from "@/lib/mrz";
import { isCloudinaryConfigured, uploadBufferToCloudinary } from "@/lib/cloudinary";
import { renderVerificationCardPng, renderVisaPdfBuffer } from "@/lib/render-documents";

export interface VisaGenerationResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  pdfUrl?: string;
  verificationImageUrl?: string;
  qrDataUrl?: string;
  mrz?: [string, string];
  visaNo?: string;
}

export async function generateAndStoreVisaAction(
  formData: FormData
): Promise<VisaGenerationResult> {
  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      error:
        "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.local and restart the server.",
    };
  }

  let photoDataUrl = String(formData.get("photoDataUrl") ?? "");
  const photoFile = formData.get("photoFile");

  if (photoFile instanceof File && photoFile.size > 0) {
    const arrayBuffer = await photoFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = photoFile.type || "image/jpeg";
    photoDataUrl = `data:${mimeType};base64,${base64}`;
  }

  const rawInput = {
    visaNo: formData.get("visaNo"),
    validFrom: formData.get("validFrom"),
    validUntil: formData.get("validUntil"),
    durationOfStay: formData.get("durationOfStay"),
    placeOfIssueEn: formData.get("placeOfIssueEn"),
    placeOfIssueAr: formData.get("placeOfIssueAr"),
    visaTypeEn: formData.get("visaTypeEn"),
    visaTypeAr: formData.get("visaTypeAr"),
    fullName: formData.get("fullName"),
    surname: formData.get("surname") || undefined,
    givenNames: formData.get("givenNames") || undefined,
    nationalityEn: formData.get("nationalityEn"),
    nationalityAr: formData.get("nationalityAr"),
    nationalityCode: formData.get("nationalityCode"),
    passportNo: formData.get("passportNo"),
    passportExpiryDate: formData.get("passportExpiryDate"),
    refNo: formData.get("refNo"),
    refDate: formData.get("refDate"),
    occupationEn: formData.get("occupationEn"),
    occupationAr: formData.get("occupationAr"),
    employerName: formData.get("employerName"),
    visaFeesEn: formData.get("visaFeesEn"),
    visaFeesAr: formData.get("visaFeesAr"),
    barcode2No: formData.get("barcode2No"),
    religionEn: formData.get("religionEn"),
    religionAr: formData.get("religionAr"),
    dateOfBirth: formData.get("dateOfBirth"),
    sexEn: formData.get("sexEn"),
    statusEn: formData.get("statusEn") || "Valid",
    statusAr: formData.get("statusAr") || "سارية",
    photoDataUrl,
  };

  const parsed = visaFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data: VisaFormData = parsed.data;
  const mrz = generateMrzLines(data);
  const timestamp = Date.now();
  const safeVisaNo = data.visaNo.replace(/[^a-zA-Z0-9_-]/g, "");

  try {
    // 1. Render Verification Card Image (the document shown when QR is scanned)
    const cardPngBuffer = await renderVerificationCardPng(data, mrz);

    // 2. Upload Verification Card Image to Cloudinary
    const cardUpload = await uploadBufferToCloudinary(cardPngBuffer, {
      folder: "ksa-visas/verification-cards",
      publicId: `card-${safeVisaNo}-${timestamp}`,
      resourceType: "image",
      format: "png",
    });

    // 3. Render Main Visa PDF with QR code pointing to the Cloudinary Verification Card URL
    const { pdfBuffer, qrDataUrl } = await renderVisaPdfBuffer(
      data,
      mrz,
      cardUpload.secureUrl
    );

    // 4. Upload Main Visa PDF to Cloudinary
    const pdfUpload = await uploadBufferToCloudinary(pdfBuffer, {
      folder: "ksa-visas/pdfs",
      publicId: `visa-${safeVisaNo}-${timestamp}.pdf`,
      resourceType: "raw",
    });

    return {
      success: true,
      pdfUrl: pdfUpload.secureUrl,
      verificationImageUrl: cardUpload.secureUrl,
      qrDataUrl,
      mrz,
      visaNo: data.visaNo,
    };
  } catch (err) {
    console.error("Visa generation failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to generate and store visa.",
    };
  }
}

