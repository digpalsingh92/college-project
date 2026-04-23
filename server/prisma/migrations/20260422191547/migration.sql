-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('BED', 'OT', 'LAB', 'MACHINE');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'OCCUPIED', 'VACANT');

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "resourceTypeId" TEXT NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "availableUnits" INTEGER NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceType_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_resourceTypeId_fkey" FOREIGN KEY ("resourceTypeId") REFERENCES "ResourceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
