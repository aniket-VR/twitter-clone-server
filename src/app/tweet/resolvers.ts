import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import TweetServices from "../../services/tweet";
import redisClient from "../../clients/redis";
interface CreateTweetPayload {
  content: string;
  imageURL?: string;
}
export const mutations = {
  createTweet: async (
    parent: any,
    { payload }: { payload: CreateTweetPayload },
    ctx: GraphqlContext
  ) => {
    const tweet = await TweetServices.createUserTweet(payload, ctx);
    return tweet;
  },
};
export const queries = {
  getAllTweet: async (parent: any, ctx: GraphqlContext) => {
    return TweetServices.getAllTweets();
  },
  getSignedURLForTweet: async (
    parent: any,
    { imageType }: { imageType: string },
    ctx: GraphqlContext
  ) => {
    const signedUrl = await TweetServices.createSignedUrl(imageType, ctx);
    return signedUrl;
  },
  deleteTwitte: async (
    parent: any,
    { id }: { id: string },
    ctx: GraphqlContext
  ) => {
    console.log(id);
    if (!ctx?.user?.id) return false;
    await redisClient.del("ALL_TWEETS");
    await redisClient.del(`GETUSER_WITH_ID:${ctx?.user.id}`);
    await redisClient.del(`CURRENT_USER:${ctx?.user?.id}`);
    const result = await prismaClient.tweet.delete({ where: { id: id } });
    console.log("delete twiiter");
    if (result) return true;
    return false;
  },
};
const extraResolver = {
  Tweet: {
    author: (parent: Tweet) => TweetServices.getAuthor(parent),
  },
};
export const resolvers = { mutations, extraResolver, queries };
