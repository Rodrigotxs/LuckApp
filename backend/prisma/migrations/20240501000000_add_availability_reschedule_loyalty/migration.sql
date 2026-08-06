-- CreateEnum
CREATE TYPE "RescheduleStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED_BY_CLIENT');

-- AlterTable Owner: OTP, reset senha, CEP
ALTER TABLE "Owner" ADD COLUMN "zipCode" TEXT;
ALTER TABLE "Owner" ADD COLUMN "otpCode" TEXT;
ALTER TABLE "Owner" ADD COLUMN "otpExpiresAt" TIMESTAMP(3);
ALTER TABLE "Owner" ADD COLUMN "passwordResetToken" TEXT;
ALTER TABLE "Owner" ADD COLUMN "passwordResetExpires" TIMESTAMP(3);

-- AlterTable Client: OTP por e-mail, reset senha, pontos fidelidade
ALTER TABLE "Client" ADD COLUMN "emailOtpCode" TEXT;
ALTER TABLE "Client" ADD COLUMN "emailOtpExpiresAt" TIMESTAMP(3);
ALTER TABLE "Client" ADD COLUMN "passwordResetToken" TEXT;
ALTER TABLE "Client" ADD COLUMN "passwordResetExpires" TIMESTAMP(3);
ALTER TABLE "Client" ADD COLUMN "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;

-- AlterTable Appointment: flag para não contar ponto duas vezes
ALTER TABLE "Appointment" ADD COLUMN "loyaltyPointsGiven" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable AvailabilityBlock
CREATE TABLE "AvailabilityBlock" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "barberId" TEXT,
    "unitId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "fullDay" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AvailabilityBlock_ownerId_startAt_idx" ON "AvailabilityBlock"("ownerId", "startAt");
CREATE INDEX "AvailabilityBlock_barberId_startAt_idx" ON "AvailabilityBlock"("barberId", "startAt");

ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable RescheduleRequest
CREATE TABLE "RescheduleRequest" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "requestedStart" TIMESTAMP(3) NOT NULL,
    "status" "RescheduleStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RescheduleRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RescheduleRequest_appointmentId_idx" ON "RescheduleRequest"("appointmentId");
CREATE INDEX "RescheduleRequest_ownerId_status_idx" ON "RescheduleRequest"("ownerId", "status");

ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
