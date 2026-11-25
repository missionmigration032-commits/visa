/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useTransition } from "react";
import {
  FileText,
  QrCode,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import {
  generateAndStoreVisaAction,
  type VisaGenerationResult,
} from "@/app/actions/visa-actions";
import { DEFAULT_VISA_DATA } from "@/lib/visa-schema";
import { generateMrzLines } from "@/lib/mrz";

const NATIONALITY_PRESETS = [
  { en: "India", ar: "الهند", code: "IND" },
  { en: "Pakistan", ar: "باكستان", code: "PAK" },
  { en: "Bangladesh", ar: "بنغلاديش", code: "BGD" },
  { en: "Nepal", ar: "نيبال", code: "NPL" },
  { en: "Egypt", ar: "مصر", code: "EGY" },
  { en: "Philippines", ar: "الفلبين", code: "PHL" },
  { en: "Sri Lanka", ar: "سريلانكا", code: "LKA" },
  { en: "Indonesia", ar: "إندونيسيا", code: "IDN" },
];

const RELIGION_PRESETS = [
  { en: "Islam", ar: "الاسلام" },
  { en: "Christianity", ar: "المسيحية" },
  { en: "Hinduism", ar: "الهندوسية" },
  { en: "Buddhism", ar: "البوذية" },
  { en: "Other", ar: "أخرى" },
];

const VISA_TYPE_PRESETS = [
  { en: "Work", ar: "عمل" },
  { en: "Visit", ar: "زيارة" },
  { en: "Business Visit", ar: "زيارة عمل" },
  { en: "Family Visit", ar: "زيارة عائلية" },
  { en: "Residence", ar: "إقامة" },
];

interface VisaBuilderProps {
  cloudinaryReady: boolean;
}

export default function VisaBuilder({ cloudinaryReady }: VisaBuilderProps) {
  const [form, setForm] = useState(DEFAULT_VISA_DATA);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [result, setResult] = useState<VisaGenerationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const liveMrz = generateMrzLines(form);

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const img = new Image();
      img.onload = () => {
        const maxDim = 500;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setPhotoPreview(compressed);
          setPhotoFile(null);
        } else {
          setPhotoPreview(reader.result as string);
          setPhotoFile(file);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function handleResetSample() {
    setForm(DEFAULT_VISA_DATA);
    setResult(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== undefined) fd.append(k, String(v));
    });
    if (photoFile) {
      fd.append("photoFile", photoFile);
    } else if (photoPreview) {
      fd.append("photoDataUrl", photoPreview);
    }

    startTransition(async () => {
      const res = await generateAndStoreVisaAction(fd);
      setResult(res);
    });
  }

  const fieldErrors = result?.fieldErrors ?? {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                KSA Visa &amp; QR Verification Generator
              </h1>
              <p className="text-xs text-slate-500">
                Generates bilingual Visa PDF + MOFA QR Verification Card &amp; stores both in Cloudinary
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                cloudinaryReady
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
              }`}
            >
              {cloudinaryReady ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Cloudinary Connected
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Cloudinary Env Missing
                </>
              )}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        {!cloudinaryReady && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Cloudinary credentials required</p>
            <p className="mt-1 text-amber-800">
              Create a <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
              file in the project root with{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">CLOUDINARY_CLOUD_NAME</code>,{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">CLOUDINARY_API_KEY</code>, and{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">CLOUDINARY_API_SECRET</code>, then restart the dev server.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-12">
          {/* Left: Form */}
          <form onSubmit={handleSubmit} className="min-w-0 space-y-5 sm:space-y-6 lg:col-span-7">
            {/* Applicant Photo & Core Numbers */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  1. Applicant Photo &amp; Visa Identifiers
                </h2>
                <button
                  type="button"
                  onClick={handleResetSample}
                  className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  Load Sample Values
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Applicant Photo *
                  </label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-3 text-center hover:border-emerald-500 hover:bg-emerald-50/40 transition">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Applicant preview"
                        className="h-36 w-28 rounded-lg object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="flex h-36 flex-col items-center justify-center gap-2 text-slate-500">
                        <Upload className="h-6 w-6" />
                        <span className="text-xs font-medium">Upload Portrait</span>
                        <span className="text-[11px] text-slate-400">JPG / PNG</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  {fieldErrors.photoDataUrl && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.photoDataUrl[0]}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:col-span-8 sm:grid-cols-2">
                  <InputField
                    label="Visa No. (رقم التأشيرة)"
                    value={form.visaNo}
                    onChange={(v) => updateField("visaNo", v)}
                    error={fieldErrors.visaNo?.[0]}
                  />
                  <InputField
                    label="Second Barcode No."
                    value={form.barcode2No}
                    onChange={(v) => updateField("barcode2No", v)}
                    error={fieldErrors.barcode2No?.[0]}
                  />
                  <InputField
                    label="Valid From (DD/MM/YYYY)"
                    value={form.validFrom}
                    onChange={(v) => updateField("validFrom", v)}
                    error={fieldErrors.validFrom?.[0]}
                  />
                  <InputField
                    label="Valid Until (DD/MM/YYYY)"
                    value={form.validUntil}
                    onChange={(v) => updateField("validUntil", v)}
                    error={fieldErrors.validUntil?.[0]}
                  />
                  <InputField
                    label="Duration of Stay (Days)"
                    value={form.durationOfStay}
                    onChange={(v) => updateField("durationOfStay", v)}
                    error={fieldErrors.durationOfStay?.[0]}
                  />
                  <InputField
                    label="Ref. No. (رقم المستند)"
                    value={form.refNo}
                    onChange={(v) => updateField("refNo", v)}
                    error={fieldErrors.refNo?.[0]}
                  />
                  <InputField
                    label="Ref. Date (التاريخ)"
                    value={form.refDate}
                    onChange={(v) => updateField("refDate", v)}
                    error={fieldErrors.refDate?.[0]}
                  />
                </div>
              </div>
            </section>

            {/* Personal Details */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-slate-900">
                2. Applicant &amp; Passport Details
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  label="Full Name (الاسم)"
                  value={form.fullName}
                  onChange={(v) => updateField("fullName", v.toUpperCase())}
                  error={fieldErrors.fullName?.[0]}
                />
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="MRZ Surname"
                    value={form.surname ?? ""}
                    onChange={(v) => updateField("surname", v.toUpperCase())}
                  />
                  <InputField
                    label="MRZ Given Name"
                    value={form.givenNames ?? ""}
                    onChange={(v) => updateField("givenNames", v.toUpperCase())}
                  />
                </div>

                <InputField
                  label="Passport No. (رقم الجواز)"
                  value={form.passportNo}
                  onChange={(v) => updateField("passportNo", v.toUpperCase())}
                  error={fieldErrors.passportNo?.[0]}
                />
                <InputField
                  label="Passport Expiry (DD/MM/YYYY)"
                  value={form.passportExpiryDate}
                  onChange={(v) => updateField("passportExpiryDate", v)}
                  error={fieldErrors.passportExpiryDate?.[0]}
                />

                <InputField
                  label="Date of Birth (DD/MM/YYYY)"
                  value={form.dateOfBirth}
                  onChange={(v) => updateField("dateOfBirth", v)}
                  error={fieldErrors.dateOfBirth?.[0]}
                />

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sex (الجنس)
                  </label>
                  <select
                    value={form.sexEn}
                    onChange={(e) =>
                      updateField("sexEn", e.target.value as "Male" | "Female")
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Male">Male - ذكر</option>
                    <option value="Female">Female - أنثى</option>
                  </select>
                </div>

                <div className="sm:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nationality Preset
                    </label>
                    <select
                      value={
                        NATIONALITY_PRESETS.find(
                          (n) => n.en === form.nationalityEn
                        )?.en ?? "custom"
                      }
                      onChange={(e) => {
                        const preset = NATIONALITY_PRESETS.find(
                          (n) => n.en === e.target.value
                        );
                        if (preset) {
                          setForm((prev) => ({
                            ...prev,
                            nationalityEn: preset.en,
                            nationalityAr: preset.ar,
                            nationalityCode: preset.code,
                          }));
                        }
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                    >
                      {NATIONALITY_PRESETS.map((n) => (
                        <option key={n.code} value={n.en}>
                          {n.en} - {n.ar} ({n.code})
                        </option>
                      ))}
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <InputField
                    label="Nationality (English)"
                    value={form.nationalityEn}
                    onChange={(v) => updateField("nationalityEn", v)}
                    error={fieldErrors.nationalityEn?.[0]}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <InputField
                        label="Nationality (Arabic)"
                        dir="rtl"
                        value={form.nationalityAr}
                        onChange={(v) => updateField("nationalityAr", v)}
                        error={fieldErrors.nationalityAr?.[0]}
                      />
                    </div>
                    <InputField
                      label="ISO"
                      value={form.nationalityCode}
                      onChange={(v) =>
                        updateField("nationalityCode", v.toUpperCase().slice(0, 3))
                      }
                      error={fieldErrors.nationalityCode?.[0]}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Religion Preset
                    </label>
                    <select
                      value={
                        RELIGION_PRESETS.find((r) => r.en === form.religionEn)
                          ?.en ?? "custom"
                      }
                      onChange={(e) => {
                        const preset = RELIGION_PRESETS.find(
                          (r) => r.en === e.target.value
                        );
                        if (preset) {
                          setForm((prev) => ({
                            ...prev,
                            religionEn: preset.en,
                            religionAr: preset.ar,
                          }));
                        }
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                    >
                      {RELIGION_PRESETS.map((r) => (
                        <option key={r.en} value={r.en}>
                          {r.en} - {r.ar}
                        </option>
                      ))}
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <InputField
                    label="Religion (English)"
                    value={form.religionEn}
                    onChange={(v) => updateField("religionEn", v)}
                    error={fieldErrors.religionEn?.[0]}
                  />
                  <InputField
                    label="Religion (Arabic)"
                    dir="rtl"
                    value={form.religionAr}
                    onChange={(v) => updateField("religionAr", v)}
                    error={fieldErrors.religionAr?.[0]}
                  />
                </div>
              </div>
            </section>

            {/* Mission, Occupation, Employer */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-slate-900">
                3. Mission, Occupation &amp; Employer
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  label="Place of Issue (English)"
                  value={form.placeOfIssueEn}
                  onChange={(v) => updateField("placeOfIssueEn", v)}
                  error={fieldErrors.placeOfIssueEn?.[0]}
                />
                <InputField
                  label="Place of Issue (Arabic)"
                  dir="rtl"
                  value={form.placeOfIssueAr}
                  onChange={(v) => updateField("placeOfIssueAr", v)}
                  error={fieldErrors.placeOfIssueAr?.[0]}
                />

                <div className="sm:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Visa Type Preset
                    </label>
                    <select
                      value={
                        VISA_TYPE_PRESETS.find((t) => t.en === form.visaTypeEn)
                          ?.en ?? "custom"
                      }
                      onChange={(e) => {
                        const preset = VISA_TYPE_PRESETS.find(
                          (t) => t.en === e.target.value
                        );
                        if (preset) {
                          setForm((prev) => ({
                            ...prev,
                            visaTypeEn: preset.en,
                            visaTypeAr: preset.ar,
                          }));
                        }
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                    >
                      {VISA_TYPE_PRESETS.map((t) => (
                        <option key={t.en} value={t.en}>
                          {t.en} - {t.ar}
                        </option>
                      ))}
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <InputField
                    label="Visa Type (English)"
                    value={form.visaTypeEn}
                    onChange={(v) => updateField("visaTypeEn", v)}
                    error={fieldErrors.visaTypeEn?.[0]}
                  />
                  <InputField
                    label="Visa Type (Arabic)"
                    dir="rtl"
                    value={form.visaTypeAr}
                    onChange={(v) => updateField("visaTypeAr", v)}
                    error={fieldErrors.visaTypeAr?.[0]}
                  />
                </div>

                <InputField
                  label="Occupation (English)"
                  value={form.occupationEn}
                  onChange={(v) => updateField("occupationEn", v)}
                  error={fieldErrors.occupationEn?.[0]}
                />
                <InputField
                  label="Occupation (Arabic)"
                  dir="rtl"
                  value={form.occupationAr}
                  onChange={(v) => updateField("occupationAr", v)}
                  error={fieldErrors.occupationAr?.[0]}
                />

                <div className="sm:col-span-2">
                  <InputField
                    label="Employer Name (اسم صاحب العمل)"
                    dir="rtl"
                    value={form.employerName}
                    onChange={(v) => updateField("employerName", v)}
                    error={fieldErrors.employerName?.[0]}
                  />
                </div>

                <InputField
                  label="Visa Fees (English)"
                  value={form.visaFeesEn}
                  onChange={(v) => updateField("visaFeesEn", v)}
                  error={fieldErrors.visaFeesEn?.[0]}
                />
                <InputField
                  label="Visa Fees (Arabic)"
                  dir="rtl"
                  value={form.visaFeesAr}
                  onChange={(v) => updateField("visaFeesAr", v)}
                  error={fieldErrors.visaFeesAr?.[0]}
                />
              </div>
            </section>

            {result && !result.success && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {result.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 transition"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Verification Card, QR &amp; PDF in Cloudinary...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4" />
                  Generate Visa PDF &amp; QR Verification Image
                </>
              )}
            </button>
          </form>

          {/* Right: Live MRZ Preview & Cloudinary Output */}
          <div className="min-w-0 space-y-6 lg:col-span-5">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Live MRZ & Summary */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Live MRZ &amp; Summary Preview
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Automatically computed ICAO 9303 Machine Readable Zone
                </p>

                <div className="mt-4 rounded-xl bg-slate-900 p-3 sm:p-4 font-mono text-[10px] sm:text-xs leading-relaxed text-emerald-300 overflow-x-auto whitespace-pre">
                  <div>{liveMrz[0]}</div>
                  <div>{liveMrz[1]}</div>
                </div>

                <dl className="mt-4 divide-y divide-slate-100 text-xs">
                  <div className="flex flex-wrap justify-between gap-2 py-2">
                    <dt className="text-slate-500">Visa No.</dt>
                    <dd className="font-semibold text-slate-900">{form.visaNo}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 py-2">
                    <dt className="text-slate-500">Applicant</dt>
                    <dd className="font-semibold text-slate-900">{form.fullName}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 py-2">
                    <dt className="text-slate-500">Validity</dt>
                    <dd className="font-semibold text-slate-900">
                      {form.validFrom} → {form.validUntil} ({form.durationOfStay}d)
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 py-2">
                    <dt className="text-slate-500">Passport / DOB</dt>
                    <dd className="font-semibold text-slate-900">
                      {form.passportNo} · {form.dateOfBirth}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Generated Result Card */}
              {result?.success && (
                <div className="rounded-2xl border border-emerald-200 bg-white p-4 sm:p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <h3 className="text-base font-semibold">
                      Stored in Cloudinary!
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <a
                      href={result.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 transition"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-700" />
                        Open Generated Visa PDF
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <a
                      href={result.verificationImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-100 transition"
                    >
                      <span className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-slate-600" />
                        Open QR Verification Image
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {result.qrDataUrl && (
                    <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <img
                        src={result.qrDataUrl}
                        alt="Visa Verification QR Code"
                        className="h-36 w-36 rounded-lg border border-white bg-white p-1 shadow-sm"
                      />
                      <p className="mt-2 text-xs text-slate-600">
                        Scan this QR code to open the Verification Card image stored in Cloudinary
                      </p>
                    </div>
                  )}

                  {result.verificationImageUrl && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-600">
                        QR Target Verification Card Preview:
                      </p>
                      <img
                        src={result.verificationImageUrl}
                        alt="Generated Verification Card"
                        className="w-full rounded-xl border border-slate-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  error,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none ${
          error
            ? "border-red-400 bg-red-50 focus:border-red-600"
            : "border-slate-300 bg-white focus:border-emerald-600"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
