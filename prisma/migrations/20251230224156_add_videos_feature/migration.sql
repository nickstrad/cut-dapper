-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "channelTitle" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_clippers" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "clipperId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_clippers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "videos_videoId_key" ON "videos"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "video_clippers_videoId_clipperId_key" ON "video_clippers"("videoId", "clipperId");

-- AddForeignKey
ALTER TABLE "video_clippers" ADD CONSTRAINT "video_clippers_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_clippers" ADD CONSTRAINT "video_clippers_clipperId_fkey" FOREIGN KEY ("clipperId") REFERENCES "clippers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
