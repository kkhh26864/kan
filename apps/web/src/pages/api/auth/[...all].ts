import type { NextApiRequest, NextApiResponse } from "next";
import { initAuth } from "@kan/auth/server";
import { createDrizzleClient } from "@kan/db/client";

// 验证环境变量
const requiredEnvVars = [
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL', 
  'BETTER_AUTH_TRUSTED_ORIGINS',
  'POSTGRES_URL',
  'EMAIL_FROM',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

console.log('✅ All required environment variables are present');

// 初始化数据库和认证
const db = createDrizzleClient();
const auth = initAuth(db);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 构建完整的URL，包含查询参数
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const url = new URL(req.url!, `${protocol}://${host}`);
    
    // 处理请求体
    let body: string | undefined;
    if (!['GET', 'HEAD'].includes(req.method!)) {
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (req.body && typeof req.body === 'object') {
        body = JSON.stringify(req.body);
      }
    }

    const request = new Request(url.toString(), {
      method: req.method,
      headers: new Headers(req.headers as Record<string, string>),
      body: body,
    });

    // 调用 better-auth 处理器
    const response = await auth.handler(request);
    
    // 设置响应头
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // 设置状态码和响应体
    res.status(response.status);
    
    if (response.body) {
      const responseText = await response.text();
      res.send(responseText);
    } else {
      res.end();
    }
    
  } catch (error) {
    console.error('Auth handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
