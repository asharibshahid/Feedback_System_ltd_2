export const config = {
  auth: false,
};

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
const DEFAULT_BASE = "https://bakematevisits.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let parsed: Record<string, unknown> = {};
  try {
    parsed = await req.json();
  } catch {
    parsed = {};
  }

  const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
  const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
  const visitId = typeof parsed.visitId === "string" ? parsed.visitId.trim() : "";
  const testimonialLink = typeof parsed.testimonialLink === "string" ? parsed.testimonialLink.trim() : "";
  const appBaseUrlEnv = Deno.env.get("APP_BASE_URL") || DEFAULT_BASE;
  const appBaseUrl =
    typeof parsed.appBaseUrl === "string" && parsed.appBaseUrl.trim()
      ? parsed.appBaseUrl.trim()
      : appBaseUrlEnv;

  if (!email) {
    return json({ ok: false, error: "Missing email" }, 400);
  }

  try {
    const link = "https://docs.google.com/forms/d/e/1FAIpQLSeEsner41jxNo8BfbEHr92y4Wwa_m-JcVBLai-04lStnJE8Dg/viewform"

    const displayName = name || "there";

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; padding: 12px;">
        <p style="margin: 0 0 12px 0;">Hi ${displayName} 👋</p>
        <p style="margin: 0 0 16px 0;">Thank you for your precious time.</p>
        <a
          href="${link}"
          target="_blank"
          rel="noreferrer"
          style="
            display: inline-block;
            background: #E04428;
            color: #ffffff;
            padding: 12px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(224, 68, 40, 0.25);
          "
        >
          Leave feedback
        </a>
        <p style="margin: 16px 0 6px 0; font-size: 12px; color: #555;">If the button doesn't work, copy this link:</p>
        <p style="margin: 0; font-size: 12px; word-break: break-all;">
          <a href="${link}" target="_blank" rel="noreferrer" style="color: #0a66c2; text-decoration: underline;">${link}</a>
        </p>
      </div>
    `;

    const text = `Hi ${displayName}\n\nThank you for your precious time.\nLeave feedback: ${link}\n`;

    await resend.emails.send({
      from: "Bakemate <noreply@bakematevisits.com>",
      to: [email],
      subject: "Thanks for your precious time",
      html,
      text,
    });

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: String(error), step: "send-email" }, 500);
  }
});
