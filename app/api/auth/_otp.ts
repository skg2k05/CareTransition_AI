import { createHmac } from "crypto";

export type Role = "doctor" | "patient";

export type PendingOtp = {
	identifier: string;
	role: Role;
	otp: string;
	expiresAt: number;
};

export const PENDING_OTP_COOKIE = "caretransition_pending_otp";
export const AUTH_COOKIE = "caretransition_auth";
export const OTP_TTL_MS = 10 * 60 * 1000;
export const JWT_TTL_SECONDS = 60 * 60 * 24;

const BASE64URL_REPLACE = /\+/g;
const BASE64URL_SLASH = /\//g;
const BASE64URL_PAD = /=+$/g;

function toBase64Url(value: string) {
	return Buffer.from(value, "utf8")
		.toString("base64")
		.replace(BASE64URL_REPLACE, "-")
		.replace(BASE64URL_SLASH, "_")
		.replace(BASE64URL_PAD, "");
}

function fromBase64Url(value: string) {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	const padding = normalized.length % 4;
	const padded = padding === 0 ? normalized : `${normalized}${"=".repeat(4 - padding)}`;
	return Buffer.from(padded, "base64").toString("utf8");
}

export function encodePendingOtp(pendingOtp: PendingOtp) {
	return toBase64Url(JSON.stringify(pendingOtp));
}

export function decodePendingOtp(value: string | undefined | null): PendingOtp | null {
	if (!value) {
		return null;
	}

	try {
		const decoded = JSON.parse(fromBase64Url(value)) as Partial<PendingOtp>;

		if (
			typeof decoded.identifier !== "string" ||
			typeof decoded.role !== "string" ||
			typeof decoded.otp !== "string" ||
			typeof decoded.expiresAt !== "number"
		) {
			return null;
		}

		return {
			identifier: decoded.identifier,
			role: decoded.role as Role,
			otp: decoded.otp,
			expiresAt: decoded.expiresAt,
		};
	} catch {
		return null;
	}
}

function encodeBase64UrlJson(value: Record<string, unknown>) {
	return toBase64Url(JSON.stringify(value));
}

function getJwtSecret() {
	return process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "caretransition-dev-secret";
}

export function createJwtToken(payload: Record<string, unknown>, expiresInSeconds = JWT_TTL_SECONDS) {
	const header = { alg: "HS256", typ: "JWT" };
	const issuedAt = Math.floor(Date.now() / 1000);
	const tokenPayload = {
		...payload,
		iat: issuedAt,
		exp: issuedAt + expiresInSeconds,
	};

	const encodedHeader = encodeBase64UrlJson(header);
	const encodedPayload = encodeBase64UrlJson(tokenPayload);
	const unsignedToken = `${encodedHeader}.${encodedPayload}`;
	const signature = createHmac("sha256", getJwtSecret())
		.update(unsignedToken)
		.digest("base64")
		.replace(BASE64URL_REPLACE, "-")
		.replace(BASE64URL_SLASH, "_")
		.replace(BASE64URL_PAD, "");

	return `${unsignedToken}.${signature}`;
}
