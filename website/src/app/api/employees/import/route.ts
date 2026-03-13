import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireRole, getOrganizationId } from "@/lib/api-utils";
import { hash } from "bcrypt";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

interface CsvRow {
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  department?: string;
  position?: string;
  employeeNumber?: string;
  hourlyRate?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ValidRow extends CsvRow {
  rowNumber: number;
}

const VALID_ROLES = ["ADMIN", "MANAGER", "REPRESENTATIVE", "EMPLOYEE"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || "").trim().replace(/^"|"$/g, "");
    });

    rows.push({
      firstName: row.firstName || "",
      lastName: row.lastName || "",
      email: row.email || "",
      role: row.role || "",
      department: row.department || "",
      position: row.position || "",
      employeeNumber: row.employeeNumber || "",
      hourlyRate: row.hourlyRate || "",
    });
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (!inQuotes && current.length === 0) {
        inQuotes = true;
      } else if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (inQuotes) {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

// POST /api/employees/import - Import employees from CSV
export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);
    const userRole = session.user.role;

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get("dryRun") === "true";

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse(dict.api.employees.import?.noFileProvided || "No CSV file provided");
    }

    if (!file.name.endsWith(".csv")) {
      return errorResponse(dict.api.employees.import?.invalidFileType || "File must be a CSV");
    }

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length === 0) {
      return errorResponse(dict.api.employees.import?.emptyFile || "CSV file is empty or has no data rows");
    }

    // Validate all rows
    const errors: ValidationError[] = [];
    const valid: ValidRow[] = [];
    const emailsSeen = new Set<string>();

    // Fetch existing emails in this org to check duplicates
    const existingUsers = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: { email: true, employeeNumber: true },
    });
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
    const existingEmpNumbers = new Set(
      existingUsers.filter((u) => u.employeeNumber).map((u) => u.employeeNumber!)
    );

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is header, data starts at row 2
      let rowHasError = false;

      // Required fields
      if (!row.firstName) {
        errors.push({ row: rowNumber, field: "firstName", message: "First name is required" });
        rowHasError = true;
      }
      if (!row.lastName) {
        errors.push({ row: rowNumber, field: "lastName", message: "Last name is required" });
        rowHasError = true;
      }
      if (!row.email) {
        errors.push({ row: rowNumber, field: "email", message: "Email is required" });
        rowHasError = true;
      } else if (!EMAIL_REGEX.test(row.email)) {
        errors.push({ row: rowNumber, field: "email", message: "Invalid email format" });
        rowHasError = true;
      } else if (emailsSeen.has(row.email.toLowerCase())) {
        errors.push({ row: rowNumber, field: "email", message: "Duplicate email in CSV" });
        rowHasError = true;
      } else if (existingEmails.has(row.email.toLowerCase())) {
        errors.push({ row: rowNumber, field: "email", message: "Email already exists in organization" });
        rowHasError = true;
      }

      // Validate role
      if (row.role) {
        const normalizedRole = row.role.toUpperCase();
        if (!VALID_ROLES.includes(normalizedRole)) {
          errors.push({ row: rowNumber, field: "role", message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
          rowHasError = true;
        } else if (userRole === "MANAGER" && normalizedRole === "ADMIN") {
          errors.push({ row: rowNumber, field: "role", message: "Managers cannot import admin users" });
          rowHasError = true;
        }
      }

      // Validate hourlyRate
      if (row.hourlyRate) {
        const rate = parseFloat(row.hourlyRate);
        if (isNaN(rate) || rate < 0) {
          errors.push({ row: rowNumber, field: "hourlyRate", message: "Hourly rate must be a valid positive number" });
          rowHasError = true;
        }
      }

      // Validate employeeNumber uniqueness
      if (row.employeeNumber && existingEmpNumbers.has(row.employeeNumber)) {
        errors.push({ row: rowNumber, field: "employeeNumber", message: "Employee number already in use" });
        rowHasError = true;
      }

      if (!rowHasError) {
        valid.push({ ...row, rowNumber });
        if (row.email) emailsSeen.add(row.email.toLowerCase());
        if (row.employeeNumber) existingEmpNumbers.add(row.employeeNumber);
      }
    }

    // If dry run, return validation results only
    if (dryRun) {
      return successResponse({
        valid: valid.map((v) => ({
          row: v.rowNumber,
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          role: v.role?.toUpperCase() || "EMPLOYEE",
          department: v.department,
          position: v.position,
          employeeNumber: v.employeeNumber,
          hourlyRate: v.hourlyRate,
        })),
        errors,
        totalRows: rows.length,
        validCount: valid.length,
        errorCount: errors.length,
      });
    }

    // Create employees
    const created: { id: string; email: string; firstName: string; lastName: string; temporaryPassword: string }[] = [];

    for (const row of valid) {
      const tempPassword = `Welcome${Date.now().toString(36)}!`;
      const passwordHash = await hash(tempPassword, 12);

      const employee = await prisma.user.create({
        data: {
          email: row.email.toLowerCase(),
          passwordHash,
          firstName: row.firstName,
          lastName: row.lastName,
          role: (row.role?.toUpperCase() as "ADMIN" | "MANAGER" | "REPRESENTATIVE" | "EMPLOYEE") || "EMPLOYEE",
          department: row.department || null,
          position: row.position || null,
          employeeNumber: row.employeeNumber || null,
          hourlyRate: row.hourlyRate ? parseFloat(row.hourlyRate) : null,
          hireDate: new Date(),
          organizationId: orgId,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      created.push({ ...employee, temporaryPassword: tempPassword });
    }

    return successResponse({
      imported: created.length,
      skipped: errors.length,
      employees: created,
      errors,
    }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse(dict.api.common.unauthorized, 401);
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse(dict.api.common.forbidden, 403);
    }
    if (error instanceof Error && error.message === "NoOrganization") {
      return errorResponse(dict.api.common.noOrganization, 400);
    }
    console.error("Error importing employees:", error);
    return errorResponse(dict.api.employees.import?.failedImport || "Failed to import employees", 500);
  }
}
