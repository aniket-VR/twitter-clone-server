import axios from "axios";
import { prismaClient } from "../clients/db";
import JWTService from "./jwt";
import { User } from "../app/user";
import { GraphqlContext } from "../interfaces";

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
  public static async getCurrentUser(ctx: GraphqlContext) {
    const id = ctx.user?.id;
    if (!id) return null;
    const user = await prismaClient.user.findUnique({ where: { id } });
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
    }
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
