export const types =`#grapql

   input CreateTweetData{
      content:String!
      imageURL:String
   }
   type Tweet{
    id: ID!
    content: String!
    imageURL:String
    author: User
   }
`