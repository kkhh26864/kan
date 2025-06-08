import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "next-runtime-env";
import { z } from "zod";

import { createNextApiContext } from "@kan/api/trpc";
import * as workspaceRepo from "@kan/db/repository/workspace.repo";
import { createStripeClient } from "@kan/stripe";

// 注意：此API路由使用Node.js运行时，不兼容Edge Runtime
// export const runtime = 'edge';

const workspaceSlugSchema = z
  .string()
  .min(3)
  .max(24)
  .regex(/^(?![-]+$)[a-zA-Z0-9-]+$/);

interface CheckoutSessionRequest {
  successUrl: string;
  cancelUrl: string;
  slug: string;
  workspacePublicId: string;
  stripeCustomerId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const stripe = createStripeClient();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { user, db } = await createNextApiContext(req);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const body = req.body as CheckoutSessionRequest;
    const { successUrl, cancelUrl, slug, workspacePublicId } = body;

    if (!successUrl || !cancelUrl || !slug || !workspacePublicId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const slugResult = workspaceSlugSchema.safeParse(slug);

    if (!slugResult.success) {
      return new Response(JSON.stringify({ error: "Invalid workspace slug" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const workspace = await workspaceRepo.getAllByUserId(db, user.id);

    const isMemberOfWorkspace = workspace.some(
      ({ workspace }) => workspace.publicId === body.workspacePublicId,
    );

    if (!isMemberOfWorkspace) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRO_PLAN_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${env("NEXT_PUBLIC_BASE_URL")}${successUrl}`,
      cancel_url: `${env("NEXT_PUBLIC_BASE_URL")}${cancelUrl}`,
      customer: user.stripeCustomerId ?? undefined,
      metadata: {
        workspaceSlug: slug,
        workspacePublicId,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Error creating checkout session" });
  }
}
