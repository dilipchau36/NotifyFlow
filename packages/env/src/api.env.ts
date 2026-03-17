import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const apiEnv = createEnv({
  server: {
    PORT: z.string().default('3001'),
    SENDGRID_API_KEY: z.string().min(1),
    TWILIO_ACCOUNT_SID: z.string().min(1),
    TWILIO_AUTH_TOKEN: z.string().min(1),
  },
  runtimeEnv: process.env,
})