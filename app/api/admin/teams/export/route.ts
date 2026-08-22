import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdminApiAuth } from "@/lib/admin-api-auth";
import { connectDB } from "@/lib/db";
import { getAllTeamsForExport } from "@/lib/export-teams";

export async function GET() {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  try {
    await connectDB();
    const rows = await getAllTeamsForExport();

    const worksheetRows = rows.map((row) => ({
      "Team Name": row.teamName,
      "Student Name": row.studentName,
      Email: row.email,
      "Phone Number": row.phone,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetRows);
    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 28 },
      { wch: 32 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teams");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as Buffer;

    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `hackathon-teams-${dateStamp}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/admin/teams/export failed:", error);
    return NextResponse.json(
      { error: "Failed to export teams" },
      { status: 500 },
    );
  }
}
