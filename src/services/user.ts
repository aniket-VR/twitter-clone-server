import axios from "axios";
import { prismaClient } from "../clients/db";
import JWTService from "./jwt";
import { GraphqlContext, User } from "../interfaces";
import redisClient from "../clients/redis";

interface GoogleTokenResult {
  iss?: string;
  nbf?: string;
  aud?: string;
  sub?: string;
  email: string;
  email_verified: string;
  azp?: string;
  name?: string;
  picture?: string;
  given_name: string;
  family_name?: string;
  iat?: string;
  exp?: string;
  jti?: string;
  alg?: string;
  kid?: string;
  typ?: string;
}
class UserServices {
  public static async verifyUserGoogleToken(token: string) {
    const googleAuthUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleAuthUrl.searchParams.set("id_token", token);
    const { data } = await axios.get<GoogleTokenResult>(
      googleAuthUrl.toString(),
      {
        responseType: "json",
      }
    );

    const user = await prismaClient.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      await prismaClient.user.create({
        data: {
          email: data.email,
          firstName: data.given_name,
          lastName: data.family_name,
          profileImageUrl: data.picture,
        },
      });
    }
    const userInDb = await prismaClient.user.findUnique({
      where: {
        email: data.email,
      },
    });
    if (!userInDb) throw "user not found with this email";
    const userToken = await JWTService.generateTokenForUser(userInDb);
    return userToken;
  }
  public static async getCurrentUserFollowing(ctx: GraphqlContext) {
    if (!ctx.user?.id) return null;
    const resp = await redisClient.get(`CURRENT_USER_FOLLOWING:${ctx.user.id}`);
    if (resp) return JSON.parse(resp);
    const result = await prismaClient.follows.findMany({
      where: { followerId: ctx.user.id },
      include: {
        following: true,
      },
    });
    const finalOutput = [];
    for (const user of result) {
      const following = user;
      const temp: User = {
        firstName: following.following.firstName,
        lastName: following.following.lastName,
        email: following.following.email,
        id: following.following.id,
        profileImageUrl: following.following.profileImageUrl,
      };
      finalOutput.push(temp);
    }
    await redisClient.set(
      `CURRENT_USER_FOLLOWING:${ctx.user.id}`,
      JSON.stringify(finalOutput)
    );
    return finalOutput;
  }
  public static async getCurrentUser(ctx: GraphqlContext) {
    const id = ctx?.user?.id;
    if (!id) return null;
    const currentUser = await redisClient.get(`CURRENT_USER:${ctx?.user?.id}`);
    if (currentUser) return JSON.parse(currentUser);
    const user = await prismaClient.user.findUnique({ where: { id } });
    await redisClient.set(`CURRENT_USER:${ctx.user?.id}`, JSON.stringify(user));
    return user;
  }
  public static async followUser(from: string, to: string) {
    return await prismaClient.follows.create({
      data: {
        follower: { connect: { id: from } },
        following: { connect: { id: to } },
      },
    });
  }
  public static async checkFollow(from: string, to: string) {
    const result = await prismaClient.follows.findUnique({
      where: { followerId_followingId: { followerId: from, followingId: to } },
    });
    if (!result) return false;
    return true;
  }
  public static async recommendationUser(ctx: GraphqlContext) {
    const user = [];
    const result = await redisClient.get(
      `USER_RECOMMENDATIONS:${ctx.user?.id}`
    );
    if (result) console.log("redis database");
    if (result) return JSON.parse(result);
    const myFollwings = await prismaClient.follows.findMany({
      where: {
        follower: {
          id: ctx?.user?.id,
        },
      },
      include: {
        following: {
          include: {
            followers: {
              include: {
                following: true,
              },
            },
          },
        },
      },
    });
    //   ans.push(result[0].following.followers)
    for (const followings of myFollwings) {
      for (const followingOfFollowedUser of followings.following.followers) {
        if (
          followingOfFollowedUser.following.id !== ctx?.user?.id &&
          myFollwings.findIndex(
            (e) => e?.followingId === followingOfFollowedUser?.following.id
          ) < 0
        ) {
          user.push(followingOfFollowedUser.following);
        }
      }
      console.log();
    }
    await redisClient.set(
      `USER_RECOMMENDATIONS:${ctx.user?.id}`,
      JSON.stringify(user)
    );
    if (user) console.log("calculated ");
    return user;
  }
  public static async unFollow(from: string, to: string) {
    return await prismaClient.follows.delete({
      where: {
        followerId_followingId: { followerId: from, followingId: to },
      },
    });
  }
}
export default UserServices;
