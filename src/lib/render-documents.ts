import fs from "node:fs/promises";
import path from "node:path";
import bwipjs from "bwip-js";
import QRCode from "qrcode";
import { chromium as playwrightChromium, type Browser } from "playwright-core";
import sparticuzChromium from "@sparticuz/chromium";
import type { VisaFormData } from "./visa-schema";
import { renderVerificationCardHtml, renderVisaPdfHtml } from "./visa-templates";

function generateCode128Svg(text: string): string {
  return bwipjs.toSVG({
    bcid: "code128",
    text,
    scale: 2,
    height: 8,
    includetext: false,
  });
}

async function loadPublicAssetDataUrl(
  filename: string,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg"
): Promise<string> {
  const filePath = path.join(process.cwd(), "public", "assets", filename);
  const buffer = await fs.readFile(filePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function launchBrowser(): Promise<Browser> {
  const isServerless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
  );

  if (isServerless) {
    const executablePath = await sparticuzChromium.executablePath();
    return playwrightChromium.launch({
      args: sparticuzChromium.args,
      executablePath,
      headless: true,
    });
  }

  try {
    const { chromium } = await import("playwright");
    return await chromium.launch({ headless: true });
  } catch {
    const executablePath = await sparticuzChromium.executablePath();
    return playwrightChromium.launch({
      args: sparticuzChromium.args,
      executablePath,
      headless: true,
    });
  }
}

export async function renderVerificationCardPng(
  data: VisaFormData,
  mrz: [string, string]
): Promise<Buffer> {
  const mofaLogoDataUrl = await loadPublicAssetDataUrl("mofa-logo.png", "image/png");
  const html = renderVerificationCardHtml(data, mrz, mofaLogoDataUrl);
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage({
      viewport: { width: 637, height: 729 },
      deviceScaleFactor: 2,
    });
    await page.setContent(html, { waitUntil: "networkidle" });
    const screenshot = await page.screenshot({ type: "png" });
    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
}

export async function renderVisaPdfBuffer(
  data: VisaFormData,
  mrz: [string, string],
  qrTargetUrl: string
): Promise<{ pdfBuffer: Buffer; qrDataUrl: string }> {
  const barcode1Svg = generateCode128Svg(data.visaNo);
  const barcode2Svg = generateCode128Svg(data.barcode2No);

  const [
    qrSvg,
    qrDataUrl,
    ksaVisaLogoDataUrl,
    ksaHeaderTitleDataUrl,
    fingerprintDataUrl,
  ] = await Promise.all([
    QRCode.toString(qrTargetUrl, {
      type: "svg",
      margin: 1,
      width: 140,
      errorCorrectionLevel: "M",
    }),
    QRCode.toDataURL(qrTargetUrl, {
      margin: 1,
      width: 240,
      errorCorrectionLevel: "M",
    }),
    loadPublicAssetDataUrl("ksa-visa-logo.jpg"),
    loadPublicAssetDataUrl("ksa-header-title.jpg"),
    loadPublicAssetDataUrl("fingerprint.jpg"),
  ]);

  const html = renderVisaPdfHtml(data, mrz, {
    barcode1Svg,
    barcode2Svg,
    qrSvg,
    ksaVisaLogoDataUrl,
    ksaHeaderTitleDataUrl,
    fingerprintDataUrl,
  });

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      pageRanges: "1",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
    return { pdfBuffer: Buffer.from(pdf), qrDataUrl };
  } finally {
    await browser.close();
  }
}
