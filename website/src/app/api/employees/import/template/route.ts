import { NextResponse } from "next/server";

// GET /api/employees/import/template - Download CSV template
export async function GET() {
  const headers = "firstName,lastName,email,role,department,position,employeeNumber,hourlyRate";
  const row1 = "John,Doe,john.doe@example.com,EMPLOYEE,Operations,Barista,EMP-001,185.00";
  const row2 = "Jane,Smith,jane.smith@example.com,MANAGER,Sales,Shift Lead,EMP-002,220.00";

  const csv = [headers, row1, row2].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="employee-import-template.csv"',
    },
  });
}
