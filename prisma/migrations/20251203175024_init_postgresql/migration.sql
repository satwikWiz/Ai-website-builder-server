-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "variantNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "html" TEXT NOT NULL DEFAULT '',
    "elements" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Variant_subdomain_idx" ON "Variant"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_subdomain_variantNumber_key" ON "Variant"("subdomain", "variantNumber");
