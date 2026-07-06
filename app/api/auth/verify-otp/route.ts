import { NextRequest, NextResponse } from "next/server";
import {
	AUTH_COOKIE,
	createJwtToken,
	decodePendingOtp,
	PENDING_OTP_COOKIE,
} from "../_otp";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
		const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

		if (!identifier || !otp) {
			return NextResponse.json(
				{ success: false, message: "identifier and otp are required" },
				{ status: 400 }
			);
		}

		const pendingOtp = decodePendingOtp(request.cookies.get(PENDING_OTP_COOKIE)?.value);

		if (!pendingOtp) {
			return NextResponse.json(
				{ success: false, message: "No pending OTP found" },
				{ status: 400 }
			);
		}

		if (pendingOtp.identifier !== identifier) {
			return NextResponse.json(
				{ success: false, message: "identifier does not match the pending OTP" },
				{ status: 400 }
			);
		}

		if (pendingOtp.expiresAt < Date.now()) {
			return NextResponse.json(
				{ success: false, message: "OTP has expired" },
				{ status: 400 }
			);
		}

		if (pendingOtp.otp !== otp) {
			return NextResponse.json(
				{ success: false, message: "Invalid OTP" },
				{ status: 400 }
			);
		}

		const token = createJwtToken({
			sub: identifier,
			identifier,
			role: pendingOtp.role,
		});

		const response = NextResponse.json({
			success: true,
			message: "OTP verified",
			token,
		});

		response.cookies.set(AUTH_COOKIE, token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24,
		});
		response.cookies.delete(PENDING_OTP_COOKIE);

		return response;
	} catch (error) {
		console.error("Error in OTP verification API:", error);

		return NextResponse.json(
			{ success: false, message: "Failed to verify OTP" },
			{ status: 500 }
		);
	}
}