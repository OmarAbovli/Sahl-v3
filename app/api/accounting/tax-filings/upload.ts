import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { checkPermission } from "@/lib/auth";
import path from "path";
import fs from "fs";

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const user = await requireAuth(["company_admin"]);
  if (!checkPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Parse multipart form data
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Only PDF, PNG, JPG allowed." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Max 5MB allowed." }, { status: 400 });
  }

  const filename = `${Date.now()}-${file.name}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "tax-filings");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const fileUrl = `/uploads/tax-filings/${filename}`;
  return NextResponse.json({ url: fileUrl });
} 