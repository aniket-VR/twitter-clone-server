import { Redis } from "ioredis";
const redisClient = new Redis(
  "redis://default:58cde67bbfa648a4baaa5d0ed59ad756@usw1-knowing-raccoon-33148.upstash.io:33148"
);
export default redisClient;
