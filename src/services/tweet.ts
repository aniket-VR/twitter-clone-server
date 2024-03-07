import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prismaClient } from "../clients/db";
import { GraphqlContext } from "../interfaces";
import { Tweet } from "@prisma/client";

interface CreateTweetPayload {
    content:string;
    imageURL?:string;
}
const s3Client = new S3Client({
    region:process.env.AWS_DEFAULT_REGION as string,
    credentials:{ secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY as string,
        accessKeyId:process.env.AWS_ACCESS_KEY_ID as string
    }
})

class TweetServices{

  public static async createUserTweet(payload:CreateTweetPayload,ctx:GraphqlContext){
    if(!ctx.user) throw new Error("You are not authenticated")
    const tweet = await prismaClient.tweet.create({
        data:{
            content:payload.content,
            imageURL:payload.imageURL,
            author:{connect:{id:ctx.user.id}}
        }})
    return tweet  
  }
  public static async getAllTweets(){
    return await prismaClient.tweet.findMany({orderBy:{createdAt:"desc"}})
  }
  public static async createSignedUrl(imageType:string,ctx:GraphqlContext){
    if(!ctx.user ||!ctx.user.id) throw new Error("Unauthenticated")
        const allowedImageTypes =["png","jpg","jpeg","webp"]
        if(!allowedImageTypes.includes(imageType)) throw new Error("Unsupported image type")
        const putObjectCommand= new PutObjectCommand({
          Bucket:process.env.AWS_S3_BUCKET,
          Key:`uploads/${ctx.user.id}/tweets/${Date.now().toString()}.${imageType}`,
        })
        const signedURL = await getSignedUrl(s3Client,putObjectCommand);
        return signedURL;
  }
  public static async getAuthor(parent:Tweet){
    return prismaClient.user.findUnique({where :{id:parent.authorId}})
  }
}

export default TweetServices;