
import Twilio from "twilio";
import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { encodePendingOtp, OTP_TTL_MS, PENDING_OTP_COOKIE, type Role } from "../_otp";

export const dynamic = "force-dynamic";

function generateOtp() {
	return randomInt(100000, 1000000).toString();
}

function isEmail(value: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhoneNumber(value: string) {
	return /^[+]?\d[\d\s()-]{7,}$/.test(value);
}

async function sendEmailOtp(identifier: string, otp: string) {
	const resendKey = process.env.RESEND_API_KEY;

	if (!resendKey) {
		if (process.env.NODE_ENV !== "production") {
			console.log(`[auth] OTP for ${identifier}: ${otp}`);
			return;
		}

		throw new Error("Resend API key is not configured");
	}

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			"Authorization": `Bearer ${resendKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: "onboarding@resend.dev",
			to: [identifier],
			subject: "Your CareTransition AI OTP",
			text: `Your OTP is ${otp}. It expires soon.`,
			html: `<p>Your OTP is <strong>${otp}</strong>. It expires soon.</p>`,
		}),
	});

	if (!response.ok) {
		const err = await response.json().catch(() => null);
		console.error("Resend error:", err);
		throw new Error("Failed to send email via Resend");
	}
}

async function sendSmsOtp(identifier: string, otp: string) {
	const accountSid = process.env.TWILIO_ACCOUNT_SID;
	const authToken = process.env.TWILIO_AUTH_TOKEN;
	const fromNumber = process.env.TWILIO_FROM_NUMBER;
	const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

	if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
		if (process.env.NODE_ENV !== "production") {
			console.log(`[auth] OTP for ${identifier}: ${otp}`);
			return;
		}

		throw new Error("SMS service is not configured");
	}

	const client = Twilio(accountSid, authToken);

	await client.messages.create({
		body: `Your CareTransition AI OTP is ${otp}. It expires soon.`,
		to: identifier,
		from: fromNumber,
		messagingServiceSid,
	});
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
		const role = body?.role as Role | undefined;

		if (!identifier || !role) {
			return NextResponse.json(
				{ success: false, message: "identifier and role are required" },
				{ status: 400 }
			);
		}

		if (role !== "doctor" && role !== "patient") {
			return NextResponse.json(
				{ success: false, message: "role must be doctor or patient" },
				{ status: 400 }
			);
		}

		if (!isEmail(identifier)) {
			return NextResponse.json(
				{ success: false, message: "A valid email address is required" },
				{ status: 400 }
			);
		}

		const otp = generateOtp();
		const pendingOtp = {
			identifier,
			role,
			otp: otp,
			expiresAt: Date.now() + OTP_TTL_MS,
		};

		await sendEmailOtp(identifier, otp);

		const response = NextResponse.json({ success: true, message: "OTP sent" });
		response.cookies.set(PENDING_OTP_COOKIE, encodePendingOtp(pendingOtp), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: OTP_TTL_MS / 1000,
		});

		return response;
	} catch (error) {
		console.error("Error in auth OTP API:", error);

		return NextResponse.json(
			{ success: false, message: "Failed to send OTP" },
			{ status: 500 }
		);
	}
}
