import { NextResponse } from "next/server";
import { isValidSession } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { createOcrProvider } from "@/lib/ocr";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1];

  if (!isValidSession(token)) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Upload a licence photo." }, { status: 400 });
  }

  try {
    const provider = createOcrProvider();
    const result = await provider.extractLicence(Buffer.from(await image.arrayBuffer()));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "OCR failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
