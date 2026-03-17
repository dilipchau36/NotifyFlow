import path from "path";
import dotenv from "dotenv";


// root level .env
dotenv.config({path:path.resolve(__dirname,"../../../.env")})

// load app-level .env.local
dotenv.config({path:path.resolve(__dirname,"../.env.local")})