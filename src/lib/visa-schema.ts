import { z } from "zod";

export const visaFormSchema = z.object({
  visaNo: z.string().trim().min(1, "Visa No. is required"),
  validFrom: z.string().trim().min(1, "Valid from date is required"),
  validUntil: z.string().trim().min(1, "Valid until date is required"),
  durationOfStay: z.string().trim().min(1, "Duration of stay is required"),

  placeOfIssueEn: z.string().trim().min(1, "Place of issue (English) is required"),
  placeOfIssueAr: z.string().trim().min(1, "Place of issue (Arabic) is required"),

  visaTypeEn: z.string().trim().min(1, "Visa type (English) is required"),
  visaTypeAr: z.string().trim().min(1, "Visa type (Arabic) is required"),

  fullName: z.string().trim().min(1, "Full name is required"),
  surname: z.string().trim().optional(),
  givenNames: z.string().trim().optional(),

  nationalityEn: z.string().trim().min(1, "Nationality (English) is required"),
  nationalityAr: z.string().trim().min(1, "Nationality (Arabic) is required"),
  nationalityCode: z
    .string()
    .trim()
    .min(3, "3-letter ISO code is required")
    .max(3, "3-letter ISO code must be 3 characters"),

  passportNo: z.string().trim().min(1, "Passport No. is required"),
  passportExpiryDate: z.string().trim().min(1, "Passport expiry date is required"),

  refNo: z.string().trim().min(1, "Ref. No. is required"),
  refDate: z.string().trim().min(1, "Ref. Date is required"),

  occupationEn: z.string().trim().min(1, "Occupation (English) is required"),
  occupationAr: z.string().trim().min(1, "Occupation (Arabic) is required"),

  employerName: z.string().trim().min(1, "Employer name is required"),

  visaFeesEn: z.string().trim().min(1, "Visa fees (English) is required"),
  visaFeesAr: z.string().trim().min(1, "Visa fees (Arabic) is required"),

  barcode2No: z.string().trim().min(1, "Second barcode number is required"),

  religionEn: z.string().trim().min(1, "Religion (English) is required"),
  religionAr: z.string().trim().min(1, "Religion (Arabic) is required"),

  dateOfBirth: z.string().trim().min(1, "Date of birth is required"),
  sexEn: z.enum(["Male", "Female"]),
  statusEn: z.string().trim().default("Valid"),
  statusAr: z.string().trim().default("سارية"),

  photoDataUrl: z.string().min(1, "Applicant photo is required"),
});

export type VisaFormData = z.infer<typeof visaFormSchema>;

export const DEFAULT_VISA_DATA: Omit<VisaFormData, "photoDataUrl"> = {
  visaNo: "6167276337",
  validFrom: "29/10/2026",
  validUntil: "28/01/2027",
  durationOfStay: "90",
  placeOfIssueEn: "Saudi Mission In Mumbai",
  placeOfIssueAr: "الممثلية السعودية في مومباي",
  visaTypeEn: "Work",
  visaTypeAr: "عمل",
  fullName: "VISAL TAHIR",
  surname: "TAHIR",
  givenNames: "VISAL",
  nationalityEn: "India",
  nationalityAr: "الهند",
  nationalityCode: "IND",
  passportNo: "U1162277",
  passportExpiryDate: "21/10/2029",
  refNo: "1109277654",
  refDate: "29/10/2026",
  occupationEn: "Product Sorting Worker",
  occupationAr: "عامل فرز منتجات",
  employerName: "مؤسسة خالد محمد بن عبدالعزيز المطوع للمقاولات العامة",
  visaFeesEn: "Free",
  visaFeesAr: "بدون رسوم",
  barcode2No: "E825489729",
  religionEn: "Islam",
  religionAr: "الاسلام",
  dateOfBirth: "20/05/1997",
  sexEn: "Male",
  statusEn: "Valid",
  statusAr: "سارية",
};

