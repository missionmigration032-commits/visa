import type { VisaFormData } from "./visa-schema";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PDF_WATERMARK_SVG = (() => {
  const petals = Array.from({ length: 18 })
    .map((_, i) => {
      const angle = i * 10;
      return `<ellipse cx="220" cy="220" rx="195" ry="72" transform="rotate(${angle} 220 220)" stroke="#7a9c76" stroke-width="0.6" fill="none"/>`;
    })
    .join("");
  const innerPetals = Array.from({ length: 12 })
    .map((_, i) => {
      const angle = i * 15;
      return `<ellipse cx="220" cy="220" rx="132" ry="48" transform="rotate(${angle} 220 220)" stroke="#7a9c76" stroke-width="0.55" fill="none"/>`;
    })
    .join("");

  return `
<svg viewBox="0 0 440 440" width="460" height="460" xmlns="http://www.w3.org/2000/svg">
  <g opacity="0.75">
    ${petals}
    ${innerPetals}
    <circle cx="220" cy="220" r="204" stroke="#7a9c76" stroke-width="0.9" fill="none" stroke-dasharray="4 2"/>
    <circle cx="220" cy="220" r="170" stroke="#7a9c76" stroke-width="0.7" fill="none"/>
    <circle cx="220" cy="220" r="140" stroke="#7a9c76" stroke-width="0.8" fill="none" stroke-dasharray="6 3"/>
    <circle cx="220" cy="220" r="96" stroke="#7a9c76" stroke-width="0.7" fill="none"/>
  </g>
  <g transform="translate(132, 138) scale(1.46)" fill="#7a9c76">
    <path d="M58 46 L62 46 L61 24 L59 24 Z" />
    <path d="M60 25 C50 18, 38 19, 32 25 C42 22, 51 23, 60 27 Z" />
    <path d="M60 25 C70 18, 82 19, 88 25 C78 22, 69 23, 60 27 Z" />
    <path d="M60 23 C48 12, 36 10, 28 15 C40 15, 50 18, 60 25 Z" />
    <path d="M60 23 C72 12, 84 10, 92 15 C80 15, 70 18, 60 25 Z" />
    <path d="M60 21 C54 8, 46 4, 40 6 C48 9, 55 15, 60 23 Z" />
    <path d="M60 21 C66 8, 74 4, 80 6 C72 9, 65 15, 60 23 Z" />
    <path d="M26 86 C42 74, 62 60, 88 42 L91 45 C66 64, 46 78, 30 90 Z" />
    <path d="M94 86 C78 74, 58 60, 32 42 L29 45 C54 64, 74 78, 90 90 Z" />
    <rect x="20" y="84" width="14" height="3.5" rx="1.5" transform="rotate(-35 27 86)" />
    <rect x="86" y="84" width="14" height="3.5" rx="1.5" transform="rotate(35 93 86)" />
  </g>
</svg>
`;
})();

function buildChevronStripSvg(count: number): string {
  const step = 22;
  const width = count * step;
  const items = Array.from({ length: count })
    .map((_, i) => {
      const x = i * step;
      const isStriped = i % 2 === 1;
      if (!isStriped) {
        return `<path d="M${x + 2} 3 L${x + 6.5} 3 L${x + 8.5} 10.5 L${x + 12.5} 2 L${x + 17.5} 2 L${x + 10.5} 17 L${x + 5.5} 17 Z" fill="#8b6fa8"/>`;
      }
      return `
        <g clip-path="url(#chev-clip-${i})">
          <defs>
            <clipPath id="chev-clip-${i}">
              <path d="M${x + 2} 3 L${x + 6.5} 3 L${x + 8.5} 10.5 L${x + 12.5} 2 L${x + 17.5} 2 L${x + 10.5} 17 L${x + 5.5} 17 Z"/>
            </clipPath>
          </defs>
          <rect x="${x}" y="0" width="20" height="18" fill="#a894bf"/>
          <rect x="${x}" y="4.5" width="20" height="1.3" fill="#ffffff"/>
          <rect x="${x}" y="8" width="20" height="1.3" fill="#ffffff"/>
          <rect x="${x}" y="11.5" width="20" height="1.3" fill="#ffffff"/>
          <rect x="${x}" y="15" width="20" height="1.3" fill="#ffffff"/>
        </g>
      `;
    })
    .join("");

  return `<svg viewBox="0 0 ${width} 19" width="100%" height="16" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${items}</svg>`;
}

export function renderVerificationCardHtml(
  data: VisaFormData,
  mrz: [string, string],
  mofaLogoDataUrl: string
): string {
  const sexAr = data.sexEn === "Female" ? "أنثى" : "ذكر";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Mono&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 637px;
      height: 729px;
      background: #ffffff;
      font-family: 'Noto Sans', 'Noto Sans Arabic', 'Liberation Sans', sans-serif;
      color: #1f2937;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .card {
      width: 625px;
      height: 717px;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .content {
      padding: 26px 36px 14px 36px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header-left {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding-left: 14px;
    }
    .header-left .ar {
      font-size: 16px;
      font-weight: 700;
      color: #26533c;
      direction: rtl;
    }
    .header-left .en {
      font-size: 18px;
      font-weight: 800;
      color: #26533c;
      letter-spacing: 0.4px;
    }
    .top-section {
      display: flex;
      gap: 26px;
      margin-bottom: 20px;
      align-items: flex-start;
    }
    .photo-box {
      width: 118px;
      height: 138px;
      border: 1px solid #9ca3af;
      padding: 3px;
      background: #ffffff;
      flex-shrink: 0;
    }
    .photo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .top-fields {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field-labels {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 14px;
      color: #4b5563;
      font-weight: 400;
    }
    .field-labels .ar {
      direction: rtl;
      font-size: 14.5px;
    }
    .field-value {
      background: #ebebeb;
      border: 1px solid #b5b5b5;
      height: 29px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14.5px;
      font-weight: 700;
      color: #111827;
      padding: 0 10px;
    }
    .middle-fields {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 10px;
    }
    .mrz {
      margin-top: 36px;
      font-family: 'Noto Mono', 'DejaVu Sans Mono', 'Liberation Mono', monospace;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.4px;
      line-height: 1.75;
      color: #111827;
      white-space: pre;
    }
    .footer-status {
      background: #d7f0de;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 500;
      color: #4b5563;
      border-top: 1px solid #c6e8cf;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="content">
      <div class="header">
        <div class="header-left">
          <div class="ar">تأشيرة</div>
          <div class="en">VISA</div>
        </div>
        <img src="${mofaLogoDataUrl}" alt="Ministry of Foreign Affairs" style="height: 58px; width: auto; object-fit: contain;" />
      </div>

      <div class="top-section">
        <div class="photo-box">
          <img src="${data.photoDataUrl}" alt="Applicant" />
        </div>
        <div class="top-fields">
          <div class="field-group">
            <div class="field-labels">
              <span>Visa No.</span>
              <span class="ar">رقم التأشيرة</span>
            </div>
            <div class="field-value">${escapeHtml(data.visaNo)}</div>
          </div>
          <div class="field-group">
            <div class="field-labels">
              <span>Religion</span>
              <span class="ar">الديانة</span>
            </div>
            <div class="field-value">${escapeHtml(data.religionEn)} - ${escapeHtml(data.religionAr)}</div>
          </div>
          <div class="field-group">
            <div class="field-labels">
              <span>Passport Expiry Date</span>
              <span class="ar">تاريخ انتهاء الجواز</span>
            </div>
            <div class="field-value">${escapeHtml(data.passportExpiryDate)}</div>
          </div>
        </div>
      </div>

      <div class="middle-fields">
        <div class="field-group">
          <div class="field-labels">
            <span>Nationality</span>
            <span class="ar">الجنسية</span>
          </div>
          <div class="field-value">${escapeHtml(data.nationalityEn)} - ${escapeHtml(data.nationalityAr)}</div>
        </div>
        <div class="field-group">
          <div class="field-labels">
            <span>Date of Birth</span>
            <span class="ar">تاريخ الميلاد</span>
          </div>
          <div class="field-value">${escapeHtml(data.dateOfBirth)}</div>
        </div>
        <div class="field-group">
          <div class="field-labels">
            <span>Sex</span>
            <span class="ar">الجنس</span>
          </div>
          <div class="field-value">${escapeHtml(data.sexEn)} - ${sexAr}</div>
        </div>
      </div>

      <div class="mrz">${escapeHtml(mrz[0])}<br/>${escapeHtml(mrz[1])}</div>
    </div>

    <div class="footer-status">${escapeHtml(data.statusAr)} - ${escapeHtml(data.statusEn)}</div>
  </div>
</body>
</html>`;
}

export function renderVisaPdfHtml(
  data: VisaFormData,
  mrz: [string, string],
  assets: {
    barcode1Svg: string;
    barcode2Svg: string;
    qrSvg: string;
    ksaVisaLogoDataUrl: string;
    ksaHeaderTitleDataUrl: string;
    fingerprintDataUrl: string;
  }
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Mono&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 210mm;
      height: 296mm;
      overflow: hidden;
      background: #ffffff;
      font-family: 'Noto Sans', 'Noto Sans Arabic', 'Liberation Sans', sans-serif;
      color: #1f2937;
      padding: 6mm 12mm 5mm 12mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .watermark {
      position: absolute;
      top: 46%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.11;
      pointer-events: none;
      z-index: 0;
    }
    .page-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .top-summary {
      display: flex;
      gap: 24px;
      align-items: stretch;
      margin-bottom: 5px;
    }
    .photo-frame {
      width: 134px;
      height: 150px;
      overflow: hidden;
      flex-shrink: 0;
      background: #f9fafb;
    }
    .photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .summary-table {
      flex: 1;
      width: 100%;
      border-collapse: collapse;
    }
    .summary-table tr {
      border-bottom: 1px solid #cbd5e1;
    }
    .summary-table td {
      padding: 5.5px 4px;
      font-size: 11.5px;
      vertical-align: middle;
    }
    .summary-table td.lbl-en {
      width: 30%;
      color: #111827;
      text-align: left;
      font-weight: 500;
    }
    .summary-table td.val {
      width: 40%;
      font-weight: 700;
      text-align: center;
      font-size: 13px;
      color: #000000;
    }
    .summary-table td.lbl-ar {
      width: 30%;
      color: #111827;
      text-align: right;
      direction: rtl;
      font-weight: 500;
    }
    .chevron-divider {
      margin: 3px 0 4px 0;
      width: 67%;
      margin-left: auto;
      line-height: 0;
    }
    .chevron-divider.full {
      width: 100%;
      margin: 3px 0 5px 0;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
    }
    .details-table tr {
      border-bottom: 1px solid #cbd5e1;
    }
    .details-table td {
      padding: 4px 4px;
      font-size: 11px;
      vertical-align: middle;
    }
    .details-table td.lbl-en {
      width: 20%;
      color: #111827;
      text-align: left;
      font-weight: 500;
    }
    .details-table td.val {
      width: 60%;
      font-weight: 700;
      text-align: center;
      font-size: 12.5px;
      color: #000000;
    }
    .details-table td.lbl-ar {
      width: 20%;
      color: #111827;
      text-align: right;
      direction: rtl;
      font-weight: 500;
    }
    .barcodes-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin-top: 6px;
    }
    .barcode-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
    }
    .barcode-item svg {
      height: 20px;
      width: 215px;
    }
    .barcode-text {
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #000000;
    }
    .fingerprint-row {
      display: flex;
      align-items: center;
      padding-left: 72px;
      margin-top: 1px;
    }
    .qr-section {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin-top: 2px;
      margin-bottom: 4px;
    }
    .qr-caption-en {
      text-align: right;
      font-size: 8.5px;
      font-weight: 600;
      color: #111827;
      line-height: 1.35;
    }
    .qr-caption-ar {
      text-align: left;
      direction: rtl;
      font-size: 9.5px;
      font-weight: 600;
      color: #111827;
      line-height: 1.35;
    }
    .qr-box {
      width: 58px;
      height: 58px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-box svg {
      width: 58px;
      height: 58px;
    }
    .mrz-footer {
      margin-top: auto;
      padding-top: 2px;
      padding-bottom: 2px;
      padding-left: 60px;
      font-family: 'Noto Mono', 'DejaVu Sans Mono', 'Liberation Mono', monospace;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.5px;
      line-height: 1.45;
      color: #000000;
      text-align: left;
      white-space: pre;
    }
  </style>
</head>
<body>
  <div class="watermark">${PDF_WATERMARK_SVG}</div>
  <div class="page-inner">
    <div class="header">
      <img src="${assets.ksaVisaLogoDataUrl}" alt="KSA VISA" style="height: 82px; width: auto; object-fit: contain;" />
      <img src="${assets.ksaHeaderTitleDataUrl}" alt="Kingdom of Saudi Arabia" style="height: 78px; width: auto; object-fit: contain;" />
    </div>

    <div class="top-summary">
      <div class="photo-frame">
        <img src="${data.photoDataUrl}" alt="Applicant Photo" />
      </div>
      <table class="summary-table">
        <tr>
          <td class="lbl-en">Visa No.</td>
          <td class="val">${escapeHtml(data.visaNo)}</td>
          <td class="lbl-ar">رقم التأشيرة</td>
        </tr>
        <tr>
          <td class="lbl-en">Valid from</td>
          <td class="val">${escapeHtml(data.validFrom)}</td>
          <td class="lbl-ar">صالحة اعتبارا من</td>
        </tr>
        <tr>
          <td class="lbl-en">Valid until</td>
          <td class="val">${escapeHtml(data.validUntil)}</td>
          <td class="lbl-ar">صالحة لغاية</td>
        </tr>
        <tr>
          <td class="lbl-en">Duration of Stay</td>
          <td class="val">${escapeHtml(data.durationOfStay)} يوم Days</td>
          <td class="lbl-ar">مدة الإقامة</td>
        </tr>
      </table>
    </div>

    <div class="chevron-divider">${buildChevronStripSvg(22)}</div>

    <table class="details-table">
      <tr>
        <td class="lbl-en">Place of issue</td>
        <td class="val">${escapeHtml(data.placeOfIssueAr)} - ${escapeHtml(data.placeOfIssueEn)}</td>
        <td class="lbl-ar">مكان الإصدار</td>
      </tr>
      <tr>
        <td class="lbl-en">Visa Type</td>
        <td class="val">${escapeHtml(data.visaTypeEn)} - ${escapeHtml(data.visaTypeAr)}</td>
        <td class="lbl-ar">نوع التأشيرة</td>
      </tr>
      <tr>
        <td class="lbl-en">Name</td>
        <td class="val">${escapeHtml(data.fullName)}</td>
        <td class="lbl-ar">الاسم</td>
      </tr>
      <tr>
        <td class="lbl-en">Nationality</td>
        <td class="val">${escapeHtml(data.nationalityEn)} - ${escapeHtml(data.nationalityAr)}</td>
        <td class="lbl-ar">الجنسية</td>
      </tr>
      <tr>
        <td class="lbl-en">Passport No.</td>
        <td class="val">${escapeHtml(data.passportNo)}</td>
        <td class="lbl-ar">رقم الجواز</td>
      </tr>
      <tr>
        <td class="lbl-en">Ref. No.</td>
        <td class="val">${escapeHtml(data.refNo)}</td>
        <td class="lbl-ar">رقم المستند</td>
      </tr>
      <tr>
        <td class="lbl-en">Ref. Date</td>
        <td class="val">${escapeHtml(data.refDate)}</td>
        <td class="lbl-ar">التاريخ</td>
      </tr>
      <tr>
        <td class="lbl-en">Occupation</td>
        <td class="val">${escapeHtml(data.occupationAr)} &nbsp;-&nbsp; ${escapeHtml(data.occupationEn)}</td>
        <td class="lbl-ar">المهنة</td>
      </tr>
      <tr>
        <td class="lbl-en">Employer name</td>
        <td class="val">${escapeHtml(data.employerName)}</td>
        <td class="lbl-ar">اسم صاحب العمل</td>
      </tr>
      <tr>
        <td class="lbl-en">Visa Fees</td>
        <td class="val">${escapeHtml(data.visaFeesEn)} - ${escapeHtml(data.visaFeesAr)}</td>
        <td class="lbl-ar">الرسوم</td>
      </tr>
    </table>

    <div class="barcodes-section">
      <div class="barcode-item">
        ${assets.barcode1Svg}
        <div class="barcode-text">${escapeHtml(data.visaNo)}</div>
      </div>
      <div class="barcode-item">
        ${assets.barcode2Svg}
        <div class="barcode-text">${escapeHtml(data.barcode2No)}</div>
      </div>
    </div>

    <div class="fingerprint-row">
      <img src="${assets.fingerprintDataUrl}" alt="Fingerprint" style="width: 44px; height: 44px; object-fit: contain;" />
    </div>

    <div class="chevron-divider full">${buildChevronStripSvg(32)}</div>

    <div class="qr-section">
      <div class="qr-caption-en">
        <strong>For Visa Inquiry</strong><br/>
        Please scan QR code
      </div>
      <div class="qr-box">${assets.qrSvg}</div>
      <div class="qr-caption-ar">
        <strong>للإستعلام عن التأشيرة</strong><br/>
        يرجى مسح رمز الاستجابة السريعة
      </div>
    </div>

    <div class="mrz-footer">${escapeHtml(mrz[0])}<br/>${escapeHtml(mrz[1])}</div>
  </div>
</body>
</html>`;
}

