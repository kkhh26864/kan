import type { NextApiRequest, NextApiResponse } from "next";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env as nextRuntimeEnv } from "next-runtime-env";

import { createNextApiContext } from "@kan/api/trpc";

import { env } from "~/env";

// 注意：此API路由使用Node.js运行时，不兼容Edge Runtime
// export const runtime = 'edge';

const allowedContentTypes = ["image/jpeg", "image/png"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { user } = await createNextApiContext(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { filename, contentType } = req.body as {
      filename: string;
      contentType: string;
    };

    // Specific to avatar uploads for now
    const filenameRegex = /^[a-f0-9\-]+\/[a-zA-Z0-9_\-]+(\.jpg|\.jpeg|\.png)$/;

    if (!filenameRegex.test(filename)) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    if (
      typeof contentType !== "string" ||
      !allowedContentTypes.includes(contentType)
    ) {
      return res.status(400).json({ error: "Invalid content type" });
    }

    const client = new S3Client({
      region: env.S3_REGION ?? "",
      endpoint: env.S3_ENDPOINT ?? "",
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });

    const signedUrl = await getSignedUrl(
      // @ts-ignore
      client,
      new PutObjectCommand({
        Bucket: nextRuntimeEnv("NEXT_PUBLIC_AVATAR_BUCKET_NAME") ?? "",
        Key: filename,
      }),
    );

    return res.status(200).json({ url: signedUrl, key: filename });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}
