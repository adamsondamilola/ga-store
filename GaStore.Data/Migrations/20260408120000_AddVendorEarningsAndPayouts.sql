ALTER TABLE "BankAccounts"
    ADD COLUMN IF NOT EXISTS "BankCode" character varying(50),
    ADD COLUMN IF NOT EXISTS "PreferredPayoutGateway" character varying(50),
    ADD COLUMN IF NOT EXISTS "PaystackRecipientCode" character varying(100),
    ADD COLUMN IF NOT EXISTS "FlutterwaveRecipientCode" character varying(100),
    ADD COLUMN IF NOT EXISTS "IsDefaultPayoutAccount" boolean NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS "IsPayoutVerified" boolean NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS "VendorPayouts"
(
    "Id" uuid NOT NULL,
    "DateCreated" timestamp with time zone,
    "DateUpdated" timestamp with time zone,
    "VendorId" uuid NOT NULL,
    "BankAccountId" uuid NOT NULL,
    "ProcessedByAdminId" uuid NOT NULL,
    "Gateway" character varying(50) NOT NULL,
    "Status" character varying(50) NOT NULL,
    "GrossAmount" numeric NOT NULL,
    "PlatformCommissionAmount" numeric NOT NULL,
    "FlatFeeAmount" numeric NOT NULL,
    "NetAmount" numeric NOT NULL,
    "EarningsCount" integer NOT NULL,
    "Reference" character varying(150),
    "ExternalTransferId" character varying(150),
    "FailureReason" character varying(500),
    "InitiatedOn" timestamp with time zone NOT NULL,
    "CompletedOn" timestamp with time zone,
    CONSTRAINT "PK_VendorPayouts" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_VendorPayouts_BankAccounts_BankAccountId" FOREIGN KEY ("BankAccountId") REFERENCES "BankAccounts" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_VendorPayouts_Users_ProcessedByAdminId" FOREIGN KEY ("ProcessedByAdminId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_VendorPayouts_Users_VendorId" FOREIGN KEY ("VendorId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "VendorEarnings"
(
    "Id" uuid NOT NULL,
    "DateCreated" timestamp with time zone,
    "DateUpdated" timestamp with time zone,
    "VendorId" uuid NOT NULL,
    "OrderId" uuid NOT NULL,
    "OrderItemId" uuid NOT NULL,
    "ProductId" uuid,
    "VendorPayoutId" uuid,
    "ProductName" character varying(255),
    "VariantName" character varying(255),
    "Quantity" integer NOT NULL,
    "UnitPrice" numeric NOT NULL,
    "GrossAmount" numeric NOT NULL,
    "PlatformCommissionRate" numeric NOT NULL,
    "PlatformCommissionAmount" numeric NOT NULL,
    "FlatFeeAmount" numeric NOT NULL,
    "NetAmount" numeric NOT NULL,
    "Currency" character varying(10) NOT NULL DEFAULT 'NGN',
    "Status" character varying(50) NOT NULL DEFAULT 'Available',
    "EarnedOn" timestamp with time zone NOT NULL,
    "PaidOutOn" timestamp with time zone,
    "Notes" character varying(500),
    CONSTRAINT "PK_VendorEarnings" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_VendorEarnings_OrderItems_OrderItemId" FOREIGN KEY ("OrderItemId") REFERENCES "OrderItems" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_VendorEarnings_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_VendorEarnings_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_VendorEarnings_Users_VendorId" FOREIGN KEY ("VendorId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_VendorEarnings_VendorPayouts_VendorPayoutId" FOREIGN KEY ("VendorPayoutId") REFERENCES "VendorPayouts" ("Id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_VendorEarnings_OrderItemId" ON "VendorEarnings" ("OrderItemId");
CREATE INDEX IF NOT EXISTS "IX_VendorEarnings_OrderId" ON "VendorEarnings" ("OrderId");
CREATE INDEX IF NOT EXISTS "IX_VendorEarnings_VendorId" ON "VendorEarnings" ("VendorId");
CREATE INDEX IF NOT EXISTS "IX_VendorEarnings_VendorPayoutId" ON "VendorEarnings" ("VendorPayoutId");
CREATE INDEX IF NOT EXISTS "IX_VendorPayouts_BankAccountId" ON "VendorPayouts" ("BankAccountId");
CREATE INDEX IF NOT EXISTS "IX_VendorPayouts_ProcessedByAdminId" ON "VendorPayouts" ("ProcessedByAdminId");
CREATE INDEX IF NOT EXISTS "IX_VendorPayouts_VendorId" ON "VendorPayouts" ("VendorId");
