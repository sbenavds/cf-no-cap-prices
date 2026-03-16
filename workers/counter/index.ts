import { DurableObject } from "cloudflare:workers"

/**
 * VisitorCounter — Durable Object
 * Tracks active sessions per product using heartbeats.
 * Each session refreshes a 30s TTL; alarms evict expired sessions.
 */
export class VisitorCounter extends DurableObject {
  private sessions = new Map<string, number>() // sessionId → expiresAt (ms)

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get("sid")

    if (!sessionId) return new Response("Missing sid", { status: 400 })

    if (request.method === "POST") {
      this.sessions.set(sessionId, Date.now() + 30_000)
      await this.ctx.storage.setAlarm(Date.now() + 30_000)
    }

    return Response.json({ count: this.sessions.size })
  }

  async alarm(): Promise<void> {
    const now = Date.now()
    for (const [sid, expiresAt] of this.sessions) {
      if (expiresAt < now) this.sessions.delete(sid)
    }
    if (this.sessions.size > 0) {
      await this.ctx.storage.setAlarm(Date.now() + 10_000)
    }
  }
}

interface Env {
  VISITOR_COUNTER: DurableObjectNamespace
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const productId = url.searchParams.get("pid") ?? "default"
    const stub = env.VISITOR_COUNTER.get(env.VISITOR_COUNTER.idFromName(productId))
    return stub.fetch(request)
  },
} satisfies ExportedHandler<Env>
