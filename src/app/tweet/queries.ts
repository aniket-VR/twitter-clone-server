export const queries = `#graphql
   getAllTweet:[Tweet]
   getSignedURLForTweet(imageType:String!):String
   deleteTwitte(id:String!):Boolean
   likeTweet(tweetId:String!):Boolean
`;
