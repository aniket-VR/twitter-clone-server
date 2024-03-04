import axios from "axios"
import { json } from "body-parser";
import { prismaClient } from "../../clients/db";
import JWTService from "../../services/jwt";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";

interface GoogleTokenResult{
        iss?:string,
        nbf?:string,
        aud?:string,
        sub?:string,
        email:string,
        email_verified:string,
        azp?:string,
        name?:string,
        picture?:string,
        given_name:string,
        family_name?:string,
        iat?:string,
        exp?:string,
        jti?:string,
        alg?:string,
        kid?:string,
        typ?:string 

}
const quries  = {
verifyGoogleToken: async (parent:any,{token}:{token:string})=>{
    const googleToken = token
    console.log("veriftygoogletoken")
    const googleAuthUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleAuthUrl.searchParams.set("id_token",googleToken)
    const {data} = await axios.get<GoogleTokenResult>(googleAuthUrl.toString(),{
        responseType:"json"
    })
    const user =await prismaClient.user.findUnique({
        where: {email:data.email}
    })
    if(!user){
        await prismaClient.user.create({
            data :{
                email:data.email,
                firstName:data.given_name,
                lastName:data.family_name,
                profileImageUrl:data.picture,
            }
        })
    }
    const userInDb = await prismaClient.user.findUnique({where:{
        email:data.email
    }})
    if(!userInDb) throw ("user not found with this email")
    const userToken = await JWTService.generateTokenForUser(userInDb);
  
    return userToken;
},
    helloFromServer:()=>"hello from server aniket",
    getCurrentUser:async (parent:any,args:any,ctx:GraphqlContext)=>{
        console.log("getcurrent user")
        const id = ctx.user?.id
        if(!id)return null;
        const user = await prismaClient.user.findUnique({where:{id}})
        return user;
    },
    getUserFromId: async(parent:any,{id}:{id:string})=>{
        return prismaClient.user.findUnique({where
        :{id}})
    }
}
const extraResolver = {
    User: {
    tweets : (parent:User)=> prismaClient.tweet.findMany({where:{authorId:parent.id}})
    }
}
export const resolvers = {quries,extraResolver}

