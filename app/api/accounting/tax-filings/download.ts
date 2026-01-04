import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { checkPermission } from "@/lib/auth";
import path from "path";
import fs from "fs";

export async function GET(req: NextRequest) {
  const user = await requireAuth(["company_admin"]);
  if (!checkPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = req.nextUrl || new URL(req.url);
  const filename = url.searchParams.get("file");
  if (!filename || filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }
  const filePath = path.join(process.cwd(), "public", "uploads", "tax-filings", filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === ".pdf") contentType = "application/pdf";
  if (ext === ".png") contentType = "image/png";
  if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
    },
  });
} 