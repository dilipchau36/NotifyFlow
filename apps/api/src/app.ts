import "./loadEnv"

import {apiEnv} from "@notifyflow/env"
import express from 'express'

console.log(apiEnv.PORT)
console.log(apiEnv.SENDGRID_API_KEY)


const app = express()
const PORT = apiEnv.PORT || 3001

app.use(express.json())

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})