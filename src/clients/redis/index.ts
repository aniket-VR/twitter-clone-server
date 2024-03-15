import { Redis } from "ioredis";
const redisClient = new Redis(process.env.REDIS_URL as string);
redisClient.connect(() => {
  console.log("connectd redis");
});
export default redisClient;
