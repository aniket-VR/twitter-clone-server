import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
interface CreateTweetPayload {
    content:string;
    imageURL?:string;
}
export const mutations = {
    createTweet:async(parent:any,{payload}:{payload:CreateTweetPayload},ctx:GraphqlContext)=>{
        console.log("hello",ctx.user)
        if(!ctx.user) throw new Error("You are not authenticated")
     const tweet = await prismaClient.tweet.create({
    data:{
        content:payload.content,
        imageURL:payload.imageURL,
        author:{connect:{id:ctx.user.id}}
    }})
     return tweet   
    },
}
export const queries = {
    getAllTweet: async(parent:any,ctx:GraphqlContext)=>{
        return prismaClient.tweet.findMany({orderBy:{createdAt:"desc"}})
    }
}
const extraResolver ={ 
    Tweet : {
       author: (parent:Tweet)=> prismaClient.user.findUnique({where :{id:parent.authorId}})
    }
}
export const resolvers = {mutations,extraResolver,queries}