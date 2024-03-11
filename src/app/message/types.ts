export const types = `#graphql
  
type MessageContainer {
    sender    :     String,
    reciver     :   String,
    id          :   String ,   
    reciverMessage: [Message] 
  }
  
  type Message {
    container   :MessageContainer,
    containerId: String,
    senderID   : String,
    reciverId  : String,
    message    : String,
    id        :  String          }

`;
