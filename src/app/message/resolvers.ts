import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";

const quries = {
  getPreviousMessage: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    console.log("get previous message");
    if (!ctx?.user?.id) throw new Error("unauthorized");
    let resp = await prismaClient.messageContainer.findFirst({
      where: {
        reciver: ctx.user?.id,
        sender: to,
      },
      include: {
        reciverMessage: true,
      },
    });
    if (resp) return resp;
    resp = await prismaClient.messageContainer.findFirst({
      where: {
        sender: ctx.user?.id,
        reciver: to,
      },
      include: {
        reciverMessage: true,
      },
    });
    if (resp) return resp;
  },
};
export const resolvers = { quries };
