import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import TweetServices from "../../services/tweet";
interface CreateTweetPayload {
    content:string;
    imageURL?:string;
}
export const mutations = {
    createTweet:async(parent:any,{payload}:{payload:CreateTweetPayload},ctx:GraphqlContext)=>{
        const tweet = await TweetServices.createUserTweet(payload,ctx)
        return tweet   
    },
}
export const queries = {
    getAllTweet: async(parent:any,ctx:GraphqlContext)=>{
        return TweetServices.getAllTweets()
    },
    getSignedURLForTweet:async(parent:any,{imageType}:{imageType:string},ctx:GraphqlContext)=>{
        const signedUrl=await TweetServices.createSignedUrl(imageType,ctx);
        return signedUrl
    }
}
const extraResolver ={ 
    Tweet : {
       author: (parent:Tweet)=>TweetServices.getAuthor(parent)
    }
}
export const resolvers = {mutations,extraResolver,queries}