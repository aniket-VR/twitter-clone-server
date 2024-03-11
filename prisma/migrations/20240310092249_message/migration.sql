-- CreateTable
CREATE TABLE "MessageContainer" (
    "sender" TEXT NOT NULL,
    "reciver" TEXT NOT NULL,
    "id" TEXT NOT NULL,

    CONSTRAINT "MessageContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "containerId" TEXT NOT NULL,
    "senderID" TEXT NOT NULL,
    "reciverId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "id" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "MessageContainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
