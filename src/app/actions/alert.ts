"use server"

import { saveAlert } from "@/lib/cf/d1"
import { getCloudflareContext } from "@opennextjs/cloudflare"

export type AlertActionState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; message: string }

export async function saveAlertAction(
  _prev: AlertActionState,
  formData: FormData
): Promise<AlertActionState> {
  const productUrl = formData.get("productUrl")
  const email = formData.get("email")
  const threshold = formData.get("threshold")

  if (
    typeof productUrl !== "string" ||
    typeof email !== "string" ||
    typeof threshold !== "string"
  ) {
    return { status: "error", message: "Invalid form data." }
  }

  const thresholdPrice = Number.parseFloat(threshold)
  if (!email.includes("@") || Number.isNaN(thresholdPrice) || thresholdPrice <= 0) {
    return { status: "error", message: "Please enter a valid email and price." }
  }

  try {
    const { env } = getCloudflareContext()
    await saveAlert(env.DB, { productUrl, thresholdPrice, email })
    return { status: "saved" }
  } catch {
    return { status: "error", message: "Could not save alert. Try again." }
  }
}
