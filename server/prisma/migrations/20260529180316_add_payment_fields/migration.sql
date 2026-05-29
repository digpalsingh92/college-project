-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "insurancePolicy" TEXT,
ADD COLUMN     "insuranceProvider" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';
