import { type NextApiRequest, type NextApiResponse } from "next";

import { openApiDocument } from "@kan/api/openapi";

// 注意：此API路由不能使用Edge Runtime，因为依赖trpc-to-openapi
// export const runtime = 'edge';

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).send(openApiDocument);
};

export default handler;
