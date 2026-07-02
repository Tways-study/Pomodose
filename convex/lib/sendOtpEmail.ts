"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import nodemailer from "nodemailer";

const PURPOSE_COPY = {
  verify: {
    subject: "Confirm your email for Pomodose",
    heading: "Confirm it's you, Doc",
    body: "Here's your code to confirm your email and finish setting up your dose log:",
  },
  reset: {
    subject: "Reset your Pomodose password",
    heading: "Let's get you back in, Doc",
    body: "Here's your code to reset your password:",
  },
} as const;

export const send = internalAction({
  args: {
    to: v.string(),
    code: v.string(),
    purpose: v.union(v.literal("verify"), v.literal("reset")),
  },
  returns: v.null(),
  handler: async (_ctx, { to, code, purpose }) => {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error("GMAIL_USER/GMAIL_APP_PASSWORD are not configured on this deployment.");
    }

    const copy = PURPOSE_COPY[purpose];
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `Pomodose <${user}>`,
      to,
      subject: copy.subject,
      text: `${copy.heading}\n\n${copy.body}\n\n${code}\n\nThis code expires in 15 minutes. If you didn't request this, you can ignore this email.`,
      html: `<div style="font-family: Georgia, serif; color: #2E2433;">
  <h2 style="font-weight: 500;">${copy.heading}</h2>
  <p style="font-family: Arial, sans-serif;">${copy.body}</p>
  <p style="font-size: 28px; font-weight: 600; letter-spacing: 0.08em;">${code}</p>
  <p style="font-family: Arial, sans-serif; color: #6B5E6F; font-size: 13px;">This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
</div>`,
    });
    return null;
  },
});
