/**
 * API Security Utilities
 * Generates HMAC signatures for API requests and decodes obfuscated responses.
 */

// Obfuscated secret key parts (XOR with 0x5A to avoid plaintext in bundle)
// Actual key: "nusantara-cctv-api-key-2026"
const _k = [
  0x34,
  0x2f,
  0x29,
  0x3b,
  0x34,
  0x2e,
  0x3b,
  0x28,
  0x3b,
  0x77, // nusantara-
  0x39,
  0x39,
  0x2e,
  0x2c,
  0x77, // cctv-
  0x3b,
  0x2a,
  0x33,
  0x77, // api-
  0x31,
  0x3f,
  0x23,
  0x77, // key-
  0x68,
  0x6a,
  0x68,
  0x6c, // 2026
];

function _dk(): string {
  return _k.map((c) => String.fromCharCode(c ^ 0x5a)).join("");
}

/**
 * Convert string to Uint8Array
 */
function strToBytes(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert ArrayBuffer to hex string
 */
function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate HMAC-SHA256 signature
 */
async function hmacSha256(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    strToBytes(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    strToBytes(message) as BufferSource,
  );
  return bufToHex(signature);
}

/**
 * Generate signed headers for API requests
 */
export async function getSignedHeaders(
  path: string,
): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${timestamp}:${path}`;
  const signature = await hmacSha256(message, _dk());

  return {
    "X-Api-Timestamp": timestamp,
    "X-Api-Signature": signature,
  };
}

/**
 * Decode obfuscated API response
 * Server sends: { d: base64(reversed(JSON)) }
 */
export function decodeResponse(encoded: { d: string }): unknown {
  try {
    const reversed = atob(encoded.d);
    const json = reversed.split("").reverse().join("");
    return JSON.parse(json);
  } catch {
    console.error("[API Security] Failed to decode response");
    return [];
  }
}

/**
 * Fetch CCTV data with signed request and decode obfuscated response
 */
export async function fetchCctvDataSecure(
  path: string = "/api/cctvs",
): Promise<unknown> {
  const headers = await getSignedHeaders(path);
  const res = await fetch(path, { headers });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  // If response is obfuscated (has 'd' property), decode it
  if (
    data &&
    typeof data === "object" &&
    "d" in data &&
    typeof data.d === "string"
  ) {
    return decodeResponse(data as { d: string });
  }

  // Fallback: return raw data (shouldn't happen in production)
  return data;
}
