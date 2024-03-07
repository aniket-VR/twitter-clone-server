import  express  from "express";
import { ApolloServer } from "@apollo/server";
import {expressMiddleware} from "@apollo/server/express4"
import bodyParser from "body-parser";
import cors from "cors"
import { User } from "./user";
import { GraphqlContext } from "../interfaces";
import JWTService from "../services/jwt";
import { Tweet } from "./tweet";
export  async function initServer() {
    const app = express();
    console.log("call get")
    app.use(bodyParser.json())
    app.use(cors())
    const graphqlServer = new ApolloServer<GraphqlContext>({
        typeDefs:`
          ${User.types}
          ${Tweet.types}
          type Query {
           ${User.queries}
           ${Tweet.queries}
          }
          type Mutation {
            ${Tweet.mutations}
            ${User.mutations}
          }
        `,
        resolvers:{
          Query:{
           ...User.resolvers.quries,
           ...Tweet.resolvers.queries
          },
          Mutation:{
           ...Tweet.resolvers.mutations,
           ...User.resolvers.mutations  
          },
          ...Tweet.resolvers.extraResolver,
          ...User.resolvers.extraResolver 

        }
       
      });
    await graphqlServer.start();
    
    app.use("/graphql",expressMiddleware(graphqlServer,{context:
      async({req,res})=>{ 
        const token = req.headers.authorization;
        console.log(token+"serve r")
        
        // console.log(JWTService.decodeToken(token))
      return {
        user: (token=="" || token=="undefined" || token==undefined)?"undefined":JWTService.decodeToken(token.split("Bearer ")[1])
    }}}))
    return app; 
}