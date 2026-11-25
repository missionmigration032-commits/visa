import type { VisaFormData } from "./visa-schema";

const MRZ_WEIGHTS = [7, 3, 1];

function charValue(ch: string): number {
  if (ch === "<") return 0;
  if (ch >= "0" && ch <= "9") return ch.charCodeAt(0) - 48;
  if (ch >= "A" && ch <= "Z") return ch.charCodeAt(0) - 55;
  return 0;
}

export function computeMrzCheckDigit(input: string): string {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum += charValue(input[i]) * MRZ_WEIGHTS[i % 3];
  }
  return String(sum % 10);
}

function sanitizeMrzText(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "<");
}

function toMrzDate(ddmmyyyy: string): string {
  const parts = ddmmyyyy.split(/[\/\-]/);
  if (parts.length !== 3) return "000000";
  const [dd, mm, yyyy] = parts;
  const yy = yyyy.length === 4 ? yyyy.slice(2) : yyyy.padStart(2, "0");
  return `${yy}${mm.padStart(2, "0")}${dd.padStart(2, "0")}`;
}

export function generateMrzLines(data: Pick<
  VisaFormData,
  | "fullName"
  | "surname"
  | "givenNames"
  | "passportNo"
  | "nationalityCode"
  | "dateOfBirth"
  | "sexEn"
  | "passportExpiryDate"
  | "visaNo"
>): [string, string] {
  let surname = data.surname?.trim();
  let givenNames = data.givenNames?.trim();

  if (!surname || !givenNames) {
    const parts = data.fullName.trim().split(/\s+/);
    if (parts.length > 1) {
      surname = surname || parts[parts.length - 1];
      givenNames = givenNames || parts.slice(0, -1).join(" ");
    } else {
      surname = surname || parts[0] || "UNKNOWN";
      givenNames = givenNames || "";
    }
  }

  const nameField = `${sanitizeMrzText(surname)}<<${sanitizeMrzText(givenNames)}`;
  const line1 = `V<SAU${nameField}`.slice(0, 44).padEnd(44, "<");

  const passportField = sanitizeMrzText(data.passportNo).slice(0, 9).padEnd(9, "<");
  const passportCheck = computeMrzCheckDigit(passportField);
  const nat = sanitizeMrzText(data.nationalityCode).slice(0, 3).padEnd(3, "<");
  const dob = toMrzDate(data.dateOfBirth);
  const sex = data.sexEn === "Female" ? "F" : "M";
  const expiry = toMrzDate(data.passportExpiryDate);
  const expiryCheck = computeMrzCheckDigit(expiry);

  const optionalPrefix = "01";
  const visaField = sanitizeMrzText(data.visaNo);
  const optionalRaw = `${optionalPrefix}${visaField}`.slice(0, 15).padEnd(15, "<");
  const compositeCheck = computeMrzCheckDigit(
    `${passportField}${passportCheck}${dob}${expiry}${expiryCheck}${optionalRaw}`
  );

  // Format matching reference: U1162277<8IND970520M2910218016167276337<<<<<<<<<<<4 (44 chars)
  // Note: 9 + 1 + 3 + 6 + 1 + 6 + 1 + 16 + 1 = 44 chars
  const optional16 = `${optionalPrefix}${visaField}`.slice(0, 16).padEnd(16, "<");
  const line2 = `${passportField}${passportCheck}${nat}${dob}${sex}${expiry}${expiryCheck}${optional16}${compositeCheck}`;

  return [line1, line2.slice(0, 44)];
}

