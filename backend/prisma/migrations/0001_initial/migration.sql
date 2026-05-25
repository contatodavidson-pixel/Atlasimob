-- Atlas — Migration inicial para PostgreSQL
-- Gerada a partir do schema Prisma

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'INVESTOR',
    "phone" TEXT,
    "whatsappPhone" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "investorProfile" TEXT NOT NULL DEFAULT 'CASUAL',
    "budget" DOUBLE PRECISION,
    "preferredCities" TEXT NOT NULL DEFAULT '[]',
    "preferredTypes" TEXT NOT NULL DEFAULT '[]',
    "minYield" DOUBLE PRECISION,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER,
    "propertyType" TEXT NOT NULL,
    "description" TEXT,
    "imageUrls" TEXT NOT NULL DEFAULT '[]',
    "listingUrl" TEXT NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "priceReduced" BOOLEAN NOT NULL DEFAULT false,
    "priceReducedBy" DOUBLE PRECISION,
    "motivatedSeller" BOOLEAN NOT NULL DEFAULT false,
    "analysisStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "tag" TEXT,
    "grossYield" DOUBLE PRECISION,
    "netYield" DOUBLE PRECISION,
    "cashflow" DOUBLE PRECISION,
    "roi" DOUBLE PRECISION,
    "estimatedRent" DOUBLE PRECISION,
    "managementFee" DOUBLE PRECISION,
    "maintenanceCost" DOUBLE PRECISION,
    "insuranceCost" DOUBLE PRECISION,
    "mortgagePayment" DOUBLE PRECISION,
    "aiAnalysis" TEXT,
    "aiSummary" TEXT,
    "score" DOUBLE PRECISION,
    "belowMarketPct" DOUBLE PRECISION,
    "daysListed" INTEGER,
    "liquidityIndex" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SCRAPER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedProperty" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedProperty_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Investor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'LEAD',
    "budget" DOUBLE PRECISION,
    "minBudget" DOUBLE PRECISION,
    "maxBudget" DOUBLE PRECISION,
    "preferredAreas" TEXT NOT NULL DEFAULT '[]',
    "propertyTypes" TEXT NOT NULL DEFAULT '[]',
    "minYield" DOUBLE PRECISION,
    "notes" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailHistory" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvestorMatch" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestorMatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlertConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "channels" TEXT NOT NULL DEFAULT '[]',
    "filters" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RealEstateAgency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "creci" TEXT,
    "specialty" TEXT NOT NULL DEFAULT 'Residencial',
    "type" TEXT NOT NULL DEFAULT 'Independente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RealEstateAgency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "city" TEXT,
    "source" TEXT NOT NULL DEFAULT 'landing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Property_externalId_key" ON "Property"("externalId");
CREATE UNIQUE INDEX "SavedProperty_userId_propertyId_key" ON "SavedProperty"("userId", "propertyId");
CREATE UNIQUE INDEX "Investor_email_key" ON "Investor"("email");
CREATE UNIQUE INDEX "InvestorMatch_investorId_propertyId_key" ON "InvestorMatch"("investorId", "propertyId");
CREATE UNIQUE INDEX "RealEstateAgency_name_city_state_key" ON "RealEstateAgency"("name", "city", "state");
CREATE UNIQUE INDEX "Waitlist_email_key" ON "Waitlist"("email");

-- Performance indexes
CREATE INDEX "Property_area_idx" ON "Property"("area");
CREATE INDEX "Property_tag_idx" ON "Property"("tag");
CREATE INDEX "Property_analysisStatus_idx" ON "Property"("analysisStatus");
CREATE INDEX "Property_score_idx" ON "Property"("score");
CREATE INDEX "Property_grossYield_idx" ON "Property"("grossYield");
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");
CREATE INDEX "PriceHistory_propertyId_idx" ON "PriceHistory"("propertyId");
CREATE INDEX "Waitlist_email_idx" ON "Waitlist"("email");
CREATE INDEX "Waitlist_createdAt_idx" ON "Waitlist"("createdAt");

-- Foreign keys
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SavedProperty" ADD CONSTRAINT "SavedProperty_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SavedProperty" ADD CONSTRAINT "SavedProperty_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EmailHistory" ADD CONSTRAINT "EmailHistory_investorId_fkey"
    FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InvestorMatch" ADD CONSTRAINT "InvestorMatch_investorId_fkey"
    FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InvestorMatch" ADD CONSTRAINT "InvestorMatch_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AlertConfig" ADD CONSTRAINT "AlertConfig_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
