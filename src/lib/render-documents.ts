import fs from "node:fs/promises";
import path from "node:path";
import bwipjs from "bwip-js";
import QRCode from "qrcode";
import {
  createCanvas,
  GlobalFonts,
  loadImage,
  type SKRSContext2D,
} from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";
import type { VisaFormData } from "./visa-schema";

let fontsRegistered = false;

function ensureFontsRegistered() {
  if (fontsRegistered) return;
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  GlobalFonts.registerFromPath(
    path.join(fontsDir, "NotoSans-Regular.ttf"),
    "NotoSans"
  );
  GlobalFonts.registerFromPath(
    path.join(fontsDir, "NotoSans-Bold.ttf"),
    "NotoSansBold"
  );
  GlobalFonts.registerFromPath(
    path.join(fontsDir, "NotoSansArabic-Regular.ttf"),
    "NotoSansArabic"
  );
  GlobalFonts.registerFromPath(
    path.join(fontsDir, "NotoSansArabic-Bold.ttf"),
    "NotoSansArabicBold"
  );
  GlobalFonts.registerFromPath(
    path.join(fontsDir, "NotoMono-Regular.ttf"),
    "NotoMono"
  );
  fontsRegistered = true;
}

const FONT_REGULAR = "NotoSans, NotoSansArabic, sans-serif";
const FONT_BOLD = "NotoSansBold, NotoSansArabicBold, sans-serif";
const FONT_MONO = "NotoMono, monospace";

async function loadPublicAssetImage(filename: string) {
  const filePath = path.join(process.cwd(), "public", "assets", filename);
  const buffer = await fs.readFile(filePath);
  return loadImage(buffer);
}

async function loadDataUrlImage(dataUrl: string) {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const buffer = Buffer.from(base64, "base64");
  return loadImage(buffer);
}

function drawCoverImage(
  ctx: SKRSContext2D,
  img: Awaited<ReturnType<typeof loadImage>>,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function roundRectPath(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawChevronStrip(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const step = 20;
  const count = Math.floor(width / step);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const cx = x + i * step;
    const isStriped = i % 2 === 1;

    ctx.beginPath();
    ctx.moveTo(cx + 2, y + 2);
    ctx.lineTo(cx + 6.5, y + 2);
    ctx.lineTo(cx + 8.5, y + height * 0.55);
    ctx.lineTo(cx + 12.5, y + 1);
    ctx.lineTo(cx + 17.5, y + 1);
    ctx.lineTo(cx + 10.5, y + height - 1);
    ctx.lineTo(cx + 5.5, y + height - 1);
    ctx.closePath();

    if (!isStriped) {
      ctx.fillStyle = "#8b6fa8";
      ctx.fill();
    } else {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = "#a894bf";
      ctx.fillRect(cx, y, step, height);
      ctx.fillStyle = "#ffffff";
      for (let sy = y + 3.5; sy < y + height; sy += 3.5) {
        ctx.fillRect(cx, sy, step, 1.3);
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawGuillocheWatermark(
  ctx: SKRSContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.save();
  ctx.globalAlpha = 0.11;
  ctx.strokeStyle = "#7a9c76";
  ctx.fillStyle = "#7a9c76";

  // Outer & inner rosettes
  for (let i = 0; i < 18; i++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((i * 10 * Math.PI) / 180);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.92, radius * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 0; i < 12; i++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((i * 15 * Math.PI) / 180);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.62, radius * 0.23, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Concentric rings
  [0.96, 0.8, 0.66, 0.45].forEach((r, idx) => {
    ctx.lineWidth = idx % 2 === 0 ? 1 : 0.7;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Central palm + crossed swords emblem silhouette
  ctx.translate(cx, cy);
  const s = radius / 110;
  ctx.scale(s, s);
  ctx.fillRect(-3, -36, 6, 32);
  for (let a = -2; a <= 2; a++) {
    ctx.save();
    ctx.translate(0, -34);
    ctx.rotate(a * 0.35);
    ctx.beginPath();
    ctx.ellipse(0, -14, 4, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Crossed swords
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-42, 34);
  ctx.lineTo(38, -16);
  ctx.moveTo(42, 34);
  ctx.lineTo(-38, -16);
  ctx.stroke();

  ctx.restore();
}

export async function renderVerificationCardPng(
  data: VisaFormData,
  mrz: [string, string]
): Promise<Buffer> {
  ensureFontsRegistered();

  const scale = 2;
  const W = 637;
  const H = 729;
  const canvas = createCanvas(W * scale, H * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Outer card
  const cx = 6;
  const cy = 6;
  const cw = W - 12;
  const ch = H - 12;

  ctx.save();
  roundRectPath(ctx, cx, cy, cw, ch, 16);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#d1d5db";
  ctx.stroke();
  ctx.clip();

  // Header
  ctx.fillStyle = "#26533c";
  ctx.textAlign = "center";
  ctx.font = `700 16px ${FONT_BOLD}`;
  ctx.fillText("تأشيرة", 78, 52);
  ctx.font = `800 18px ${FONT_BOLD}`;
  ctx.fillText("VISA", 78, 75);

  const mofaLogo = await loadPublicAssetImage("mofa-logo.png");
  const mofaH = 58;
  const mofaW = (mofaLogo.width / mofaLogo.height) * mofaH;
  ctx.drawImage(mofaLogo, W - 42 - mofaW, 32, mofaW, mofaH);

  // Applicant photo box
  const photoX = 42;
  const photoY = 114;
  const photoW = 118;
  const photoH = 138;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 1;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  const applicantPhoto = await loadDataUrlImage(data.photoDataUrl);
  drawCoverImage(ctx, applicantPhoto, photoX + 3, photoY + 3, photoW - 6, photoH - 6);

  // Helper for grey input boxes
  const drawCardField = (
    x: number,
    y: number,
    w: number,
    labelEn: string,
    labelAr: string,
    value: string
  ) => {
    ctx.fillStyle = "#4b5563";
    ctx.font = `400 14px ${FONT_REGULAR}`;
    ctx.textAlign = "left";
    ctx.fillText(labelEn, x, y);
    ctx.textAlign = "right";
    ctx.fillText(labelAr, x + w, y);

    const boxY = y + 7;
    const boxH = 29;
    ctx.fillStyle = "#ebebeb";
    ctx.fillRect(x, boxY, w, boxH);
    ctx.strokeStyle = "#b5b5b5";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, boxY, w, boxH);

    ctx.fillStyle = "#111827";
    ctx.font = `700 14.5px ${FONT_BOLD}`;
    ctx.textAlign = "center";
    ctx.fillText(value, x + w / 2, boxY + 20);
  };

  // Top right 3 fields
  const rightX = 186;
  const rightW = W - 42 - rightX;
  drawCardField(rightX, 126, rightW, "Visa No.", "رقم التأشيرة", data.visaNo);
  drawCardField(
    rightX,
    182,
    rightW,
    "Religion",
    "الديانة",
    `${data.religionEn} - ${data.religionAr}`
  );
  drawCardField(
    rightX,
    238,
    rightW,
    "Passport Expiry Date",
    "تاريخ انتهاء الجواز",
    data.passportExpiryDate
  );

  // Middle 3 full-width fields
  const fullX = 42;
  const fullW = W - 84;
  drawCardField(
    fullX,
    320,
    fullW,
    "Nationality",
    "الجنسية",
    `${data.nationalityEn} - ${data.nationalityAr}`
  );
  drawCardField(fullX, 386, fullW, "Date of Birth", "تاريخ الميلاد", data.dateOfBirth);
  const sexAr = data.sexEn === "Female" ? "أنثى" : "ذكر";
  drawCardField(fullX, 452, fullW, "Sex", "الجنس", `${data.sexEn} - ${sexAr}`);

  // MRZ
  ctx.fillStyle = "#111827";
  ctx.font = `600 13.5px ${FONT_MONO}`;
  ctx.textAlign = "left";
  ctx.fillText(mrz[0], fullX, 558);
  ctx.fillText(mrz[1], fullX, 584);

  // Footer status bar
  const footerH = 42;
  const footerY = cy + ch - footerH;
  ctx.fillStyle = "#d7f0de";
  ctx.fillRect(cx, footerY, cw, footerH);
  ctx.strokeStyle = "#c6e8cf";
  ctx.beginPath();
  ctx.moveTo(cx, footerY);
  ctx.lineTo(cx + cw, footerY);
  ctx.stroke();

  ctx.fillStyle = "#4b5563";
  ctx.font = `500 15px ${FONT_REGULAR}`;
  ctx.textAlign = "center";
  ctx.fillText(`${data.statusAr} - ${data.statusEn}`, W / 2, footerY + 27);

  ctx.restore();
  return canvas.toBuffer("image/png");
}

export async function renderVisaPdfBuffer(
  data: VisaFormData,
  mrz: [string, string],
  qrTargetUrl: string
): Promise<{ pdfBuffer: Buffer; qrDataUrl: string }> {
  ensureFontsRegistered();

  // Render A4 at 2.5x resolution (794 x 1123 logical px * 2.5 = 1985 x 2807 px)
  const W = 794;
  const H = 1123;
  const scale = 2.5;
  const canvas = createCanvas(W * scale, H * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  const padX = 44;
  const contentW = W - padX * 2;

  // Watermark behind details table
  drawGuillocheWatermark(ctx, W / 2, 510, 195);

  // Load assets in parallel
  const [
    ksaVisaLogo,
    ksaHeaderTitle,
    fingerprintImg,
    applicantPhoto,
    barcode1Buf,
    barcode2Buf,
    qrPngBuf,
    qrDataUrl,
  ] = await Promise.all([
    loadPublicAssetImage("ksa-visa-logo.jpg"),
    loadPublicAssetImage("ksa-header-title.jpg"),
    loadPublicAssetImage("fingerprint.jpg"),
    loadDataUrlImage(data.photoDataUrl),
    bwipjs.toBuffer({
      bcid: "code128",
      text: data.visaNo,
      scale: 3,
      height: 8,
      includetext: false,
    }),
    bwipjs.toBuffer({
      bcid: "code128",
      text: data.barcode2No,
      scale: 3,
      height: 8,
      includetext: false,
    }),
    QRCode.toBuffer(qrTargetUrl, {
      margin: 1,
      width: 240,
      errorCorrectionLevel: "M",
    }),
    QRCode.toDataURL(qrTargetUrl, {
      margin: 1,
      width: 240,
      errorCorrectionLevel: "M",
    }),
  ]);

  // Header Logos
  const leftLogoH = 82;
  const leftLogoW = (ksaVisaLogo.width / ksaVisaLogo.height) * leftLogoH;
  ctx.drawImage(ksaVisaLogo, padX, 24, leftLogoW, leftLogoH);

  const rightLogoH = 78;
  const rightLogoW = (ksaHeaderTitle.width / ksaHeaderTitle.height) * rightLogoH;
  ctx.drawImage(ksaHeaderTitle, W - padX - rightLogoW, 26, rightLogoW, rightLogoH);

  // Applicant Photo
  const photoX = padX;
  const photoY = 120;
  const photoW = 136;
  const photoH = 160;
  drawCoverImage(ctx, applicantPhoto, photoX, photoY, photoW, photoH);

  // Top 4-row Summary Table
  const sumX = photoX + photoW + 24;
  const sumW = W - padX - sumX;
  const summaryRows = [
    ["Visa No.", data.visaNo, "رقم التأشيرة"],
    ["Valid from", data.validFrom, "صالحة اعتبارا من"],
    ["Valid until", data.validUntil, "صالحة لغاية"],
    ["Duration of Stay", `${data.durationOfStay} يوم Days`, "مدة الإقامة"],
  ];

  let curY = 122;
  const sumRowH = 39;
  for (const [lblEn, val, lblAr] of summaryRows) {
    const textY = curY + 24;
    ctx.fillStyle = "#111827";
    ctx.font = `500 12px ${FONT_REGULAR}`;
    ctx.textAlign = "left";
    ctx.fillText(lblEn, sumX + 2, textY);

    ctx.fillStyle = "#000000";
    ctx.font = `700 13.5px ${FONT_BOLD}`;
    ctx.textAlign = "center";
    ctx.fillText(val, sumX + sumW / 2, textY);

    ctx.fillStyle = "#111827";
    ctx.font = `500 12px ${FONT_REGULAR}`;
    ctx.textAlign = "right";
    ctx.fillText(lblAr, sumX + sumW - 2, textY);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sumX, curY + sumRowH);
    ctx.lineTo(sumX + sumW, curY + sumRowH);
    ctx.stroke();

    curY += sumRowH;
  }

  // Top Chevron Divider (under summary table)
  drawChevronStrip(ctx, sumX, curY + 8, sumW, 18);

  // Main 10-row Details Table
  const detailRows = [
    [
      "Place of issue",
      `${data.placeOfIssueAr} - ${data.placeOfIssueEn}`,
      "مكان الإصدار",
    ],
    ["Visa Type", `${data.visaTypeEn} - ${data.visaTypeAr}`, "نوع التأشيرة"],
    ["Name", data.fullName, "الاسم"],
    [
      "Nationality",
      `${data.nationalityEn} - ${data.nationalityAr}`,
      "الجنسية",
    ],
    ["Passport No.", data.passportNo, "رقم الجواز"],
    ["Ref. No.", data.refNo, "رقم المستند"],
    ["Ref. Date", data.refDate, "التاريخ"],
    [
      "Occupation",
      `${data.occupationAr}   -   ${data.occupationEn}`,
      "المهنة",
    ],
    ["Employer name", data.employerName, "اسم صاحب العمل"],
    ["Visa Fees", `${data.visaFeesEn} - ${data.visaFeesAr}`, "الرسوم"],
  ];

  curY = curY + 34;
  const detailRowH = 38;
  for (const [lblEn, val, lblAr] of detailRows) {
    const textY = curY + 24;
    ctx.fillStyle = "#111827";
    ctx.font = `500 11.5px ${FONT_REGULAR}`;
    ctx.textAlign = "left";
    ctx.fillText(lblEn, padX + 2, textY);

    ctx.fillStyle = "#000000";
    ctx.font = `700 13px ${FONT_BOLD}`;
    ctx.textAlign = "center";
    ctx.fillText(val, W / 2, textY);

    ctx.fillStyle = "#111827";
    ctx.font = `500 11.5px ${FONT_REGULAR}`;
    ctx.textAlign = "right";
    ctx.fillText(lblAr, W - padX - 2, textY);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, curY + detailRowH);
    ctx.lineTo(W - padX, curY + detailRowH);
    ctx.stroke();

    curY += detailRowH;
  }

  // Barcodes
  const [bc1Img, bc2Img, qrImg] = await Promise.all([
    loadImage(barcode1Buf),
    loadImage(barcode2Buf),
    loadImage(qrPngBuf),
  ]);

  const bcW = 220;
  const bcH = 26;
  const bcX = (W - bcW) / 2;

  ctx.drawImage(bc1Img, bcX, curY + 14, bcW, bcH);
  ctx.fillStyle = "#000000";
  ctx.font = `700 12px ${FONT_BOLD}`;
  ctx.textAlign = "center";
  ctx.fillText(data.visaNo, W / 2, curY + 54);

  ctx.drawImage(bc2Img, bcX, curY + 64, bcW, bcH);
  ctx.fillText(data.barcode2No, W / 2, curY + 104);

  // Fingerprint icon
  const fpY = curY + 108;
  ctx.drawImage(fingerprintImg, padX + 68, fpY, 44, 44);

  // Full-width bottom Chevron Divider
  const chev2Y = fpY + 52;
  drawChevronStrip(ctx, padX, chev2Y, contentW, 18);

  // QR Code Section
  const qrSize = 72;
  const qrX = (W - qrSize) / 2;
  const qrY = chev2Y + 26;
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = "#111827";
  ctx.font = `700 9.5px ${FONT_BOLD}`;
  ctx.textAlign = "right";
  ctx.fillText("For Visa Inquiry", qrX - 14, qrY + 30);
  ctx.font = `500 9px ${FONT_REGULAR}`;
  ctx.fillText("Please scan QR code", qrX - 14, qrY + 44);

  ctx.textAlign = "left";
  ctx.font = `700 10.5px ${FONT_BOLD}`;
  ctx.fillText("للإستعلام عن التأشيرة", qrX + qrSize + 14, qrY + 30);
  ctx.font = `500 9.5px ${FONT_REGULAR}`;
  ctx.fillText("يرجى مسح رمز الاستجابة السريعة", qrX + qrSize + 14, qrY + 44);

  // Bottom 2-line MRZ
  const mrzY = qrY + qrSize + 34;
  ctx.fillStyle = "#000000";
  ctx.font = `500 13.5px ${FONT_MONO}`;
  ctx.textAlign = "left";
  ctx.fillText(mrz[0], padX + 54, mrzY);
  ctx.fillText(mrz[1], padX + 54, mrzY + 22);

  // Embed crisp PNG into single A4 PDF page (595.28 x 841.89 pt)
  const pagePngBuffer = canvas.toBuffer("image/png");
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const embeddedPng = await pdfDoc.embedPng(pagePngBuffer);
  page.drawImage(embeddedPng, {
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
  });

  const pdfBytes = await pdfDoc.save();
  return { pdfBuffer: Buffer.from(pdfBytes), qrDataUrl };
}
