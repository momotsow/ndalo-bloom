import { NextResponse } from "next/server";
import { healthService } from "@/application/health-service";

/**
 * Health endpoint. Delegates to the Application service — no direct Prisma or
 * provider imports here (FR-8).
 */
export async function GET(): Promise<NextResponse> {
  const status = await healthService.getStatus();
  const httpStatus = status.database === "up" ? 200 : 503;
  return NextResponse.json(status, { status: httpStatus });
}
