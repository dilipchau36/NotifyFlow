import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const commonEnv = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    JWT_SECRET: z.string().min(16),
    AWS_REGION: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    SQS_QUEUE_URL: z.string().url(),
  },
  runtimeEnv: process.env,
})