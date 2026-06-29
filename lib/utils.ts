import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import Groq from "groq-sdk";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 1. Groq client initialization
let groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is not set. Please configure it in your environment.");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// 2. Retry logic with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Retry failed");
}

// 3. JSON parser with fallback
export function safeParseJson<T>(jsonString: string, fallback: T): T {
  try {
    let cleaned = jsonString.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error("JSON parsing error, using fallback:", e);
    return fallback;
  }
}

// 4. Logger utility
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, ...args);
  },
  success: (message: string, ...args: any[]) => {
    console.log(`[SUCCESS] [${new Date().toISOString()}] ${message}`, ...args);
  }
};
