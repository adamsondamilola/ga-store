BEGIN;

ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "IsVendor" boolean NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "KycStatus" integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "CanPost" boolean NOT NULL DEFAULT FALSE;

ALTER TABLE "Products"
    ADD COLUMN IF NOT EXISTS "VendorId" uuid,
    ADD COLUMN IF NOT EXISTS "IsPublished" boolean NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "ReviewStatus" integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "ReviewRejectionReason" text NULL,
    ADD COLUMN IF NOT EXISTS "SubmittedForReviewAt" timestamp with time zone NULL,
    ADD COLUMN IF NOT EXISTS "ReviewedAt" timestamp with time zone NULL,
    ADD COLUMN IF NOT EXISTS "ReviewedByAdminId" uuid NULL;

UPDATE "Products"
SET "VendorId" = "UserId"
WHERE "VendorId" IS NULL;

ALTER TABLE "Products"
    ALTER COLUMN "VendorId" SET NOT NULL;

UPDATE "Products"
SET
    "IsPublished" = CASE WHEN "IsApproved" THEN TRUE ELSE FALSE END,
    "ReviewStatus" = CASE WHEN "IsApproved" THEN 2 ELSE 0 END,
    "ReviewedAt" = CASE WHEN "IsApproved" THEN COALESCE("DateApproved", "DateUpdated", "DateCreated") ELSE NULL END,
    "ReviewedByAdminId" = CASE WHEN "IsApproved" THEN "ApprovedBy" ELSE NULL END
WHERE "ReviewStatus" = 0
  AND "SubmittedForReviewAt" IS NULL;

CREATE TABLE IF NOT EXISTS "VendorKycs"
(
    "Id" uuid NOT NULL,
    "DateCreated" timestamp with time zone NULL,
    "DateUpdated" timestamp with time zone NULL,
    "UserId" uuid NOT NULL,
    "LivePictureUrl" text NULL,
    "ValidIdUrl" text NULL,
    "BusinessCertificateUrl" text NULL,
    "IdType" text NULL,
    "BusinessName" text NULL,
    "BusinessAddress" text NULL,
    "Status" integer NOT NULL DEFAULT 0,
    "RejectionReason" text NULL,
    "SubmittedAt" timestamp with time zone NULL,
    "ReviewedAt" timestamp with time zone NULL,
    "ReviewedByAdminId" uuid NULL,
    CONSTRAINT "PK_VendorKycs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_VendorKycs_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_VendorKycs_Users_ReviewedByAdminId" FOREIGN KEY ("ReviewedByAdminId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_VendorKycs_UserId" ON "VendorKycs" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_VendorKycs_ReviewedByAdminId" ON "VendorKycs" ("ReviewedByAdminId");

CREATE INDEX IF NOT EXISTS "IX_Products_VendorId" ON "Products" ("VendorId");
CREATE INDEX IF NOT EXISTS "IX_Products_ReviewedByAdminId" ON "Products" ("ReviewedByAdminId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Products_Users_VendorId'
    ) THEN
        ALTER TABLE "Products"
            ADD CONSTRAINT "FK_Products_Users_VendorId"
            FOREIGN KEY ("VendorId") REFERENCES "Users" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Products_Users_ReviewedByAdminId'
    ) THEN
        ALTER TABLE "Products"
            ADD CONSTRAINT "FK_Products_Users_ReviewedByAdminId"
            FOREIGN KEY ("ReviewedByAdminId") REFERENCES "Users" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

COMMIT;
