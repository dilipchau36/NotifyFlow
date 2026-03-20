import { Pool } from "pg";
import { config } from "../../config";

export const createPool = () => new Pool(config.db);

export type DbPool = Pool;
