/*
  Warnings:

  - You are about to drop the column `prodi` on the `dosen` table. All the data in the column will be lost.
  - You are about to drop the column `prodi` on the `mahasiswa` table. All the data in the column will be lost.
  - You are about to drop the column `prodi` on the `mata_kuliah` table. All the data in the column will be lost.
  - Made the column `prodi_id` on table `dosen` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prodi_id` on table `mahasiswa` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prodi_id` on table `mata_kuliah` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `semester_id` to the `tugas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "dosen" DROP CONSTRAINT "dosen_prodi_id_fkey";

-- DropForeignKey
ALTER TABLE "mahasiswa" DROP CONSTRAINT "mahasiswa_prodi_id_fkey";

-- DropForeignKey
ALTER TABLE "mata_kuliah" DROP CONSTRAINT "mata_kuliah_prodi_id_fkey";

-- AlterTable
ALTER TABLE "dosen" DROP COLUMN "prodi",
ALTER COLUMN "prodi_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "mahasiswa" DROP COLUMN "prodi",
ALTER COLUMN "prodi_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "mata_kuliah" DROP COLUMN "prodi",
ALTER COLUMN "prodi_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "tugas" ADD COLUMN     "semester_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "dosen" ADD CONSTRAINT "dosen_prodi_id_fkey" FOREIGN KEY ("prodi_id") REFERENCES "prodi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mahasiswa" ADD CONSTRAINT "mahasiswa_prodi_id_fkey" FOREIGN KEY ("prodi_id") REFERENCES "prodi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mata_kuliah" ADD CONSTRAINT "mata_kuliah_prodi_id_fkey" FOREIGN KEY ("prodi_id") REFERENCES "prodi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;
