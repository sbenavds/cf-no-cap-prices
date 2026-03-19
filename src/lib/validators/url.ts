const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|localhost)/i

const BLOCKED_SCHEMES = new Set(["file:", "ftp:", "javascript:", "data:"])

// Known phishing / typosquat domains targeting major retailers
const PHISHING_BLOCKLIST = new Set([
  "arnazon.com",
  "amazon-deals.net",
  "ebay-support.com",
  "walmart-offers.net",
  "bestbuy-deals.com",
  "paypa1.com",
  "app1e.com",
  "rn.com", // rn looks like m
])

export type UrlValidationResult = { ok: true; url: URL } | { ok: false; error: string }

export function validateProductUrl(raw: string): UrlValidationResult {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return { ok: false, error: "Invalid URL." }
  }

  if (BLOCKED_SCHEMES.has(url.protocol)) {
    return { ok: false, error: "URL scheme not allowed." }
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "Only HTTP and HTTPS URLs are supported." }
  }

  if (PRIVATE_IP.test(url.hostname)) {
    return { ok: false, error: "Private or local addresses are not allowed." }
  }

  if (!url.hostname.includes(".")) {
    return { ok: false, error: "Invalid hostname." }
  }

  const hostname = url.hostname.toLowerCase()
  if (PHISHING_BLOCKLIST.has(hostname)) {
    return { ok: false, error: "This domain is blocked." }
  }

  return { ok: true, url }
}
