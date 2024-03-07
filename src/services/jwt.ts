import { User } from "@prisma/client"
import { prismaClient } from "../clients/db"
import jwt from "jsonwebtoken"
import { JWTuser } from "../interfaces"
const JWT_SECRET ="LKADJF@33jlk"
class JWTService{
    public static async generateTokenForUser(user:User) {
       
        const payload:JWTuser ={
            id:user?.id,
            email:user?.email
        }
        const token = await jwt.sign(payload,JWT_SECRET)
        return token;
    }
    public static  decodeToken(token:string){
        // console.log('decodetoken'+token)
        return jwt.verify(token,JWT_SECRET)  as JWTuser ;
    }
}
export default JWTService