import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prismaClient } from "../clients/db";
import { GraphqlContext } from "../interfaces";
import { Tweet } from "@prisma/client";
import redisClient from "../clients/redis";

interface CreateTweetPayload {
  content: string;
  imageURL?: string;
}
const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION as string,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  },
});

class TweetServices {
  public static async createUserTweet(
    payload: CreateTweetPayload,
    ctx: GraphqlContext
  ) {
    await redisClient.del("ALL_TWEETS");
    await redisClient.del(`GETUSER_WITH_ID:${ctx?.user?.id}`);
    if (!ctx.user) throw new Error("You are not authenticated");
    const tweet = await prismaClient.tweet.create({
      data: {
        content: payload.content,
        imageURL: payload.imageURL,
        author: { connect: { id: ctx.user.id } },
      },
    });
    return tweet;
  }

  public static async getAllTweets() {
    const result = await redisClient.get("ALL_TWEETS");
    if (result) {
      return JSON.parse(result);
    }
    const tweets = await prismaClient.tweet.findMany({
      orderBy: { createdAt: "desc" },
    });
    await redisClient.set("ALL_TWEETS", JSON.stringify(tweets));
    console.log("database tweets");
    return tweets;
  }
  public static async likeTweet(
    ctx: GraphqlContext,
    { tweetId, check }: { tweetId: String; check: Boolean }
  ) {
    console.log("tweetlike");
    if (!ctx?.user?.id) throw new Error("unauthenitcated");
    const result = await prismaClient.like.findFirst({
      where: {
        tweedId: tweetId as string,
        userId: ctx.user?.id as string,
      },
    });
    if (check) {
      return result ? true : false;
    }
    // await redisClient.setex(`LIKE_STATUS:${ctx.user.id}-${tweetId}`, 5, "10");
    if (result) {
      console.log("tweet delete");
      return await prismaClient.like
        .delete({
          where: {
            id: result.id,
          },
        })
        .then(() => {
          return false;
        });
    } else {
      return await prismaClient.like
        .create({
          data: {
            tweedId: tweetId as string,
            userId: ctx.user?.id as string,
          },
        })
        .then(() => {
          return true;
        });
    }
  }
  public static async bookmarkTweet(
    ctx: GraphqlContext,
    { tweetId, check }: { tweetId: String; check: Boolean }
  ) {
    console.log("tweetlike");
    if (!ctx?.user?.id) throw new Error("unauthenitcated");
    const result = await prismaClient.bookmark.findFirst({
      where: {
        tweetId: tweetId as string,
        userId: ctx.user?.id as string,
      },
    });
    if (check) {
      return result ? true : false;
    }
    // await redisClient.setex(`LIKE_STATUS:${ctx.user.id}-${tweetId}`, 5, "10");
    if (result) {
      console.log("tweet delete");
      return await prismaClient.bookmark
        .delete({
          where: {
            id: result.id,
          },
        })
        .then(() => {
          return false;
        });
    } else {
      return await prismaClient.bookmark
        .create({
          data: {
            tweetId: tweetId as string,
            userId: ctx.user?.id as string,
          },
        })
        .then(() => {
          return true;
        });
    }
  }
  public static async createSignedUrl(imageType: string, ctx: GraphqlContext) {
    if (!ctx.user || !ctx.user.id) throw new Error("Unauthenticated");
    const allowedImageTypes = ["png", "jpg", "jpeg", "webp"];
    if (!allowedImageTypes.includes(imageType))
      throw new Error("Unsupported image type");
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `uploads/${
        ctx.user.id
      }/tweets/${Date.now().toString()}.${imageType}`,
    });
    const signedURL = await getSignedUrl(s3Client, putObjectCommand);
    return signedURL;
  }
  public static async getAuthor(parent: Tweet) {
    return prismaClient.user.findUnique({ where: { id: parent.authorId } });
  }
}

export default TweetServices;
