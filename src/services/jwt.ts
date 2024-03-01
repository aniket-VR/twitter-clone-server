import { User } from "@prisma/client"
import { prismaClient } from "../clients/db"
import jwt from "jsonwebtoken"
const JWT_SECRET ="LKADJF@33jlk"
class JWTService{
    public static async generateTokenForUser(user:User) {
       
        const payload ={
            id:user?.id,
            email:user?.email
        }
        const token = await jwt.sign(payload,JWT_SECRET)
        return token;
    }
}
export default JWTService