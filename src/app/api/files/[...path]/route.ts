import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isValidSession } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { absoluteFromRelative } from "@/lib/uploads";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1];

  if (!isValidSession(token)) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { path: segments } = await context.params;
  const relativePath = segments.map((segment) => decodeURIComponent(segment)).join("/");

  try {
    const absolute = absoluteFromRelative(relativePath);
    const data = await readFile(absolute);
    const ext = path.extname(absolute).toLowerCase();
    return new NextResponse(data, {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
