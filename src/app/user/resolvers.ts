import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserServices from "../../services/user";


const quries  = {
    verifyGoogleToken: async (parent:any,{token}:{token:string})=>{
        const verifyedToken = await UserServices.verifyUserGoogleToken(token)
        return verifyedToken;
    },
    getCurrentUser:async (parent:any,args:any,ctx:GraphqlContext)=>{
       const user = UserServices.getCurrentUser(ctx)
       return user;
    },
    getUserFromId: async(parent:any,{id}:{id:string})=>{
        return prismaClient.user.findUnique({where:{id}})
    },
    
   
}
const mutations = {
    unFollowUser:async(parent:any,{to}:{to:string},ctx:GraphqlContext)=>{
        if(!ctx?.user?.id) throw new Error("unauthenticated")
        await UserServices.unFollow(ctx.user.id,to)
        return true;
    },
    followUser:async(parent:any,{to}:{to:string},ctx:GraphqlContext)=>{
        if(!ctx?.user?.id) throw new Error("unauthenticated")
        const reuslt=  await UserServices.followUser(ctx.user.id,to)
        return true;
    },
    checkFollowStaus:async(parent:any,{to}:{to:string},ctx:GraphqlContext)=>{
        if(!ctx?.user?.id) throw new Error("unauthenticated")
        return await UserServices.checkFollow(ctx.user.id,to);
    }
}
const extraResolver = {
    User: {
    tweets : (parent:User)=> prismaClient.tweet.findMany({where:{authorId:parent.id}}),
    followers:async(parent:User)=> {
        const result = await prismaClient.follows.findMany({where:{following:{id:parent.id}},include:{follower:true,following:true}})
        return result.map((e)=>e.follower)
    },
    following:async(parent:User)=> {
        const reuslt = await prismaClient.follows.findMany({where:{follower:{id:parent.id}},include:{follower:true,following:true}})
        return reuslt.map((e)=>e.following)
    },
    recommendation:async(parent:any,{},ctx:GraphqlContext)=>{
        if(!ctx.user) throw new Error("unauthenticate")
        return await UserServices.recommendationUser(ctx);
      }
    }

}
export const resolvers = {quries,extraResolver,mutations}

