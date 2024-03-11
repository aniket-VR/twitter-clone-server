import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserServices from "../../services/user";
import redisClient from "../../clients/redis";

const quries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const verifyedToken = await UserServices.verifyUserGoogleToken(token);
    return verifyedToken;
  },
  getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
    const user = UserServices.getCurrentUser(ctx);
    return user;
  },
  getUserFromId: async (parent: any, { id }: { id: string }) => {
    const result = await redisClient.get(`GETUSER_WITH_ID:${id}`);
    if (result) return JSON.parse(result);
    const resp = await prismaClient.user.findUnique({ where: { id } });
    await redisClient.set(`GETUSER_WITH_ID:${id}`, JSON.stringify(resp));
    return resp;
  },
  getFollowing: async (parent: any, {}, ctx: GraphqlContext) => {
    return await UserServices.getCurrentUserFollowing(ctx);
  },
};
const mutations = {
  unFollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx?.user?.id) throw new Error("unauthenticated");
    await redisClient.del(`CURRENT_USER_FOLLOWING:${ctx.user.id}`);
    await redisClient.del(`USER_RECOMMENDATIONS:${ctx?.user.id}`);
    await redisClient.del(`GETUSER_WITH_ID:${to}`);
    await redisClient.del(`CURRENT_USER:${ctx?.user?.id}`);
    await UserServices.unFollow(ctx.user.id, to);
    return true;
  },
  followUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx?.user?.id) throw new Error("unauthenticated");
    await redisClient.del(`CURRENT_USER_FOLLOWING:${ctx.user.id}`);
    await redisClient.del(`USER_RECOMMENDATIONS:${ctx?.user.id}`);
    await redisClient.del(`GETUSER_WITH_ID:${to}`);
    await redisClient.del(`CURRENT_USER:${ctx?.user?.id}`);
    const reuslt = await UserServices.followUser(ctx.user.id, to);
    return true;
  },
  checkFollowStaus: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx?.user?.id) throw new Error("unauthenticated");
    return await UserServices.checkFollow(ctx.user.id, to);
  },
};
const extraResolver = {
  User: {
    tweets: (parent: User) =>
      prismaClient.tweet.findMany({ where: { authorId: parent.id } }),
    followers: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { following: { id: parent.id } },
        include: { follower: true, following: true },
      });
      return result.map((e) => e.follower);
    },
    following: async (parent: User) => {
      const reuslt = await prismaClient.follows.findMany({
        where: { follower: { id: parent.id } },
        include: { follower: true, following: true },
      });
      return reuslt.map((e) => e.following);
    },
    recommendation: async (parent: any, {}, ctx: GraphqlContext) => {
      if (!ctx.user) throw new Error("unauthenticate");
      return await UserServices.recommendationUser(ctx);
    },
  },
};
export const resolvers = { quries, extraResolver, mutations };
