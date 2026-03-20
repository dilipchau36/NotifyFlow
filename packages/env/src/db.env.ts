import {createEnv} from "@t3-oss/env-core"
import {z} from "zod";

export const dbEnv = createEnv({
    server:{
        URL: z.string().default("")
    },
    runtimeEnv: process.env
})