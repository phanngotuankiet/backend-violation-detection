-- CreateTable
CREATE TABLE "VideosProcessed" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "actionResult" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideosProcessed_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VideosProcessed" ADD CONSTRAINT "VideosProcessed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
