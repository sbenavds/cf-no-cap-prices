import { describe, expect, it } from "vitest"
import { validateProductUrl } from "@/lib/validators/url"

describe("validateProductUrl", () => {
  describe("valid URLs", () => {
    it("accepts https product URLs", () => {
      const result = validateProductUrl("https://amazon.com/dp/B09V3KXJPB")
      expect(result.ok).toBe(true)
    })

    it("accepts http URLs", () => {
      const result = validateProductUrl("http://ebay.com/item/123")
      expect(result.ok).toBe(true)
    })

    it("trims whitespace", () => {
      const result = validateProductUrl("  https://walmart.com/ip/123  ")
      expect(result.ok).toBe(true)
    })
  })

  describe("invalid URLs", () => {
    it("rejects plain text", () => {
      const result = validateProductUrl("not a url")
      expect(result.ok).toBe(false)
    })

    it("rejects empty string", () => {
      const result = validateProductUrl("")
      expect(result.ok).toBe(false)
    })
  })

  describe("blocked schemes", () => {
    it("rejects file:// URLs", () => {
      const result = validateProductUrl("file:///etc/passwd")
      expect(result.ok).toBe(false)
    })

    it("rejects javascript: URLs", () => {
      const result = validateProductUrl("javascript:alert(1)")
      expect(result.ok).toBe(false)
    })

    it("rejects data: URLs", () => {
      const result = validateProductUrl("data:text/html,<h1>hi</h1>")
      expect(result.ok).toBe(false)
    })

    it("rejects ftp:// URLs", () => {
      const result = validateProductUrl("ftp://files.example.com/product.zip")
      expect(result.ok).toBe(false)
    })
  })

  describe("private / local addresses", () => {
    it("rejects 127.0.0.1", () => {
      const result = validateProductUrl("http://127.0.0.1/admin")
      expect(result.ok).toBe(false)
    })

    it("rejects localhost", () => {
      const result = validateProductUrl("http://localhost:3000")
      expect(result.ok).toBe(false)
    })

    it("rejects 10.x.x.x", () => {
      const result = validateProductUrl("http://10.0.0.1/product")
      expect(result.ok).toBe(false)
    })

    it("rejects 192.168.x.x", () => {
      const result = validateProductUrl("http://192.168.1.1/shop")
      expect(result.ok).toBe(false)
    })

    it("rejects 172.16–31.x.x", () => {
      const result = validateProductUrl("http://172.16.0.1/item")
      expect(result.ok).toBe(false)
    })
  })

  describe("phishing blocklist", () => {
    it("rejects arnazon.com", () => {
      const result = validateProductUrl("https://arnazon.com/dp/fake")
      expect(result.ok).toBe(false)
    })

    it("rejects paypa1.com", () => {
      const result = validateProductUrl("https://paypa1.com/checkout")
      expect(result.ok).toBe(false)
    })

    it("rejects amazon-deals.net", () => {
      const result = validateProductUrl("https://amazon-deals.net/offer")
      expect(result.ok).toBe(false)
    })
  })

  describe("invalid hostnames", () => {
    it("rejects hostname without TLD", () => {
      const result = validateProductUrl("https://localhost-prod/item")
      expect(result.ok).toBe(false)
    })
  })
})
