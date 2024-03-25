import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
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
    const tweetId = id;
    if (!ctx?.user?.id) return false;
    await redisClient.del("ALL_TWEETS");
    await redisClient.del(`GETUSER_WITH_ID:${ctx?.user.id}`);
    await redisClient.del(`CURRENT_USER:${ctx?.user?.id}`);

    const result = await prismaClient.tweet.delete({ where: { id: id } });
    console.log("delete twiiter");
    if (result) return true;
    return false;
  },
  bookmarkTweet: async (
    parent: any,
    { tweetId, check }: { tweetId: String; check: Boolean },
    ctx: GraphqlContext
  ) => {
    const result = await TweetServices.bookmarkTweet(ctx, { tweetId, check });
    return result;
  },
  getBookMark: async (parent: any, {}, ctx: GraphqlContext) => {
    if (!ctx?.user?.id) throw new Error("unauthenticated");
    const result = await prismaClient.bookmark.findMany({
      where: {
        userId: ctx.user.id,
      },
      include: {
        tweet: {
          include: {
            author: true,
          },
        },
      },
    });
    console.log(result);
    return result;
  },
  likeTweet: async (
    parent: any,
    { tweetId, check }: { tweetId: String; check: Boolean },
    ctx: GraphqlContext
  ) => {
    console.log(tweetId);
    const result = await TweetServices.likeTweet(ctx, { tweetId, check });
    return result;
  },
};
const extraResolver = {
  Tweet: {
    author: (parent: Tweet) => TweetServices.getAuthor(parent),
  },
};
export const resolvers = { mutations, extraResolver, queries };
