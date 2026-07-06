import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, PENDING_OTP_COOKIE } from "../_otp";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  
  response.cookies.delete(AUTH_COOKIE);
  response.cookies.delete(PENDING_OTP_COOKIE);
  
  return response;
}
