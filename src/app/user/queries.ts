export const queries = `#graphql
verifyGoogleToken(token:String!):String
helloFromServer:String
getCurrentUser:User
getUserFromId(id:String!):User
recommendation:[User]
getFollowing:[User]
`;
