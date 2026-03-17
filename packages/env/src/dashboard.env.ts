import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const dashboardEnv = createEnv({
    clientPrefix: 'NEXT_PUBLIC_',
    client: {
        NEXT_PUBLIC_API_URL: z.string().url(),
        NEXT_PUBLIC_WS_URL: z.string().url(),
    },
    // t3 env requires you to explicitly map client vars
    runtimeEnv: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    },
})