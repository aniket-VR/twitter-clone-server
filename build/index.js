"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_io_1 = require("socket.io");
const db_1 = require("./clients/db");
dotenv_1.default.config();
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = yield (0, app_1.initServer)();
        const server = http_1.default.createServer(app);
        const socket = new socket_io_1.Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
        });
        socket.on("connection", (conSocket) => {
            console.log("socket connected");
            conSocket.on("send_message", (temp) => __awaiter(this, void 0, void 0, function* () {
                const result = yield db_1.prismaClient.messageContainer.findMany({
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
                    yield db_1.prismaClient.message.create({
                        data: {
                            message: temp.message,
                            reciverId: temp.reciver,
                            senderID: temp.sender,
                            containerId: result[0].id,
                        },
                    });
                    conSocket.broadcast.emit(`${temp.sender}-${temp.reciver}`, temp.message);
                    return;
                }
                const result1 = yield db_1.prismaClient.messageContainer.findMany({
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
                    yield db_1.prismaClient.message.create({
                        data: {
                            message: temp.message,
                            reciverId: temp.reciver,
                            senderID: temp.sender,
                            containerId: result1[0].id,
                        },
                    });
                    conSocket.broadcast.emit(`${temp.sender}-${temp.reciver}`, temp.message);
                    return;
                }
                yield db_1.prismaClient.messageContainer
                    .create({
                    data: {
                        reciver: temp.reciver,
                        sender: temp.sender,
                    },
                })
                    .then(() => {
                    conSocket.broadcast.emit(`${temp.sender}-${temp.reciver}`, temp.message);
                });
            }));
        });
        server.listen(8000, () => console.log("server started at PORT:8000"));
    });
}
init();
