-- CreateEnum
CREATE TYPE "CustomerDiscountScope" AS ENUM ('EVERY_ORDER', 'DATE_RANGE');

-- AlterTable
ALTER TABLE "Restaurant"
  ADD COLUMN "birthdayAutomationEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "birthdayDiscountType" "DiscountType" NOT NULL DEFAULT 'PERCENT',
  ADD COLUMN "birthdayDiscountValue" DECIMAL(10,2) NOT NULL DEFAULT 10,
  ADD COLUMN "birthdayDaysBefore" INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN "birthdayMessageTitle" TEXT NOT NULL DEFAULT 'Doğum gününüz yaklaşıyor!',
  ADD COLUMN "birthdayMessageContent" TEXT NOT NULL DEFAULT 'Merhaba {name}, doğum gününüze özel indirim sizi bekliyor. Sizi ağırlamaktan mutluluk duyarız!';

-- CreateTable
CREATE TABLE "CustomerDiscount" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "scope" "CustomerDiscountScope" NOT NULL DEFAULT 'EVERY_ORDER',
  "type" "DiscountType" NOT NULL,
  "value" DECIMAL(10,2) NOT NULL,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BirthdayMessageSimulation" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "campaignYear" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BirthdayMessageSimulation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerDiscount_customerId_isActive_idx" ON "CustomerDiscount"("customerId", "isActive");
CREATE UNIQUE INDEX "BirthdayMessageSimulation_customerId_campaignYear_key" ON "BirthdayMessageSimulation"("customerId", "campaignYear");
CREATE INDEX "BirthdayMessageSimulation_restaurantId_createdAt_idx" ON "BirthdayMessageSimulation"("restaurantId", "createdAt");

-- AddForeignKey
ALTER TABLE "CustomerDiscount" ADD CONSTRAINT "CustomerDiscount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BirthdayMessageSimulation" ADD CONSTRAINT "BirthdayMessageSimulation_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BirthdayMessageSimulation" ADD CONSTRAINT "BirthdayMessageSimulation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
