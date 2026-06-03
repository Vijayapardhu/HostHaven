CREATE TABLE "platform_amenities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_amenities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_amenities_name_key" ON "platform_amenities"("name");
