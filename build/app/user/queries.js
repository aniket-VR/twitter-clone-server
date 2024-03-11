"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = void 0;
exports.queries = `#graphql
verifyGoogleToken(token:String!):String
helloFromServer:String
getCurrentUser:User
getUserFromId(id:String!):User
recommendation:[User]
getFollowing:[User]
`;
