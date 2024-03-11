import { initServer } from "./app";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { prismaClient } from "./clients/db";
dotenv.config();
async function init() {
  const app = await initServer();
  const server = http.createServer(app);
  const socket = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  socket.on("connection", (conSocket) => {
    console.log("socket connected");
    conSocket.on("send_message", async (temp) => {
      const result = await prismaClient.messageContainer.findMany({
        where: {
          sender: temp.sender,
          reciver: temp.reciver,
        },
        include: {
          reciverMessage: false,
        },
      });
      if (result.length != 0) {
        console.log(result);
        // await prismaClient.message.create({
        //   data: {
        //     senderID: temp.sender,
        //     reciverId: temp.reciver,
        //     message: temp.message,
        //     containerId: result[0].id,
        //   },
        // });
        await prismaClient.message.create({
          data: {
            message: temp.message,
            reciverId: temp.reciver,
            senderID: temp.sender,
            containerId: result[0].id,
          },
        });
        conSocket.broadcast.emit(
          `${temp.sender}-${temp.reciver}`,
          temp.message
        );
        return;
      }
      const result1 = await prismaClient.messageContainer.findMany({
        where: {
          sender: temp.reciver,
          reciver: temp.sender,
        },
        include: {
          reciverMessage: false,
        },
      });
      if (result1.length != 0) {
        console.log(result1);
        // await prismaClient.message.create({
        //   data: {
        //     senderID: temp.sender,
        //     reciverId: temp.reciver,
        //     message: temp.message,
        //     containerId: result1[0].id,
        //   },
        // });
        await prismaClient.message.create({
          data: {
            message: temp.message,
            reciverId: temp.reciver,
            senderID: temp.sender,
            containerId: result1[0].id,
          },
        });
        conSocket.broadcast.emit(
          `${temp.sender}-${temp.reciver}`,
          temp.message
        );
        return;
      }
      await prismaClient.messageContainer
        .create({
          data: {
            reciver: temp.reciver,
            sender: temp.sender,
          },
        })
        .then(() => {
          conSocket.broadcast.emit(
            `${temp.sender}-${temp.reciver}`,
            temp.message
          );
        });
    });
  });
  server.listen(8000, () => console.log("server started at PORT:8000"));
}
init();
