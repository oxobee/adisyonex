--
-- PostgreSQL database dump
--

\restrict NJ3yLDQ6ns8PONLFnUDLsqAALJAzYunaT6zVFhavo60kc1iFjOE59PhRZJQ6oEL

-- Dumped from database version 16.15 (Homebrew)
-- Dumped by pg_dump version 16.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AiTaskStatus; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."AiTaskStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."AiTaskStatus" OWNER TO ugurugurlu;

--
-- Name: AiTaskType; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."AiTaskType" AS ENUM (
    'MENU_DIGITIZATION',
    'MENU_URL_ANALYSIS',
    'ITEM_DESCRIPTION',
    'IMAGE_GENERATION',
    'PHOTO_PROFESSIONALIZATION',
    'ALLERGEN_CALORIE_EST'
);


ALTER TYPE public."AiTaskType" OWNER TO ugurugurlu;

--
-- Name: AiTransactionType; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."AiTransactionType" AS ENUM (
    'BONUS_GRANT',
    'ADMIN_RECHARGE',
    'USAGE_DEDUCT',
    'REFUND'
);


ALTER TYPE public."AiTransactionType" OWNER TO ugurugurlu;

--
-- Name: DietaryType; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."DietaryType" AS ENUM (
    'VEG',
    'NON_VEG',
    'EGG'
);


ALTER TYPE public."DietaryType" OWNER TO ugurugurlu;

--
-- Name: Disable86Reason; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."Disable86Reason" AS ENUM (
    'OUT_OF_STOCK',
    'QUALITY',
    'PREP_TIME',
    'OTHER'
);


ALTER TYPE public."Disable86Reason" OWNER TO ugurugurlu;

--
-- Name: DiscountType; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."DiscountType" AS ENUM (
    'NONE',
    'PERCENT',
    'FLAT'
);


ALTER TYPE public."DiscountType" OWNER TO ugurugurlu;

--
-- Name: EmploymentType; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."EmploymentType" AS ENUM (
    'FULL_TIME',
    'PART_TIME',
    'CONTRACT'
);


ALTER TYPE public."EmploymentType" OWNER TO ugurugurlu;

--
-- Name: Gender; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER'
);


ALTER TYPE public."Gender" OWNER TO ugurugurlu;

--
-- Name: GstRegistrationType; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."GstRegistrationType" AS ENUM (
    'REGULAR',
    'COMPOSITION',
    'UNREGISTERED'
);


ALTER TYPE public."GstRegistrationType" OWNER TO ugurugurlu;

--
-- Name: LicensePlan; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."LicensePlan" AS ENUM (
    'TRIAL',
    'MONTHLY',
    'YEARLY',
    'LIFETIME'
);


ALTER TYPE public."LicensePlan" OWNER TO ugurugurlu;

--
-- Name: LicenseStatus; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."LicenseStatus" AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'GRACE_PERIOD',
    'SUSPENDED'
);


ALTER TYPE public."LicenseStatus" OWNER TO ugurugurlu;

--
-- Name: MenuItemType; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."MenuItemType" AS ENUM (
    'SERVED',
    'PACKAGED_GOODS'
);


ALTER TYPE public."MenuItemType" OWNER TO ugurugurlu;

--
-- Name: OrderLineState; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."OrderLineState" AS ENUM (
    'UNSENT',
    'FIRED',
    'SERVED',
    'VOID',
    'PREPARING',
    'PREPARED'
);


ALTER TYPE public."OrderLineState" OWNER TO ugurugurlu;

--
-- Name: OrderSource; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."OrderSource" AS ENUM (
    'STAFF',
    'SELF_ORDER'
);


ALTER TYPE public."OrderSource" OWNER TO ugurugurlu;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'OPEN',
    'COMPLETED',
    'VOID'
);


ALTER TYPE public."OrderStatus" OWNER TO ugurugurlu;

--
-- Name: OrderType; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."OrderType" AS ENUM (
    'DINE_IN',
    'TAKEAWAY',
    'DELIVERY'
);


ALTER TYPE public."OrderType" OWNER TO ugurugurlu;

--
-- Name: PaymentMode; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."PaymentMode" AS ENUM (
    'CASH',
    'UPI',
    'CARD',
    'OTHER'
);


ALTER TYPE public."PaymentMode" OWNER TO ugurugurlu;

--
-- Name: QualityLevel; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."QualityLevel" AS ENUM (
    'ECONOMY',
    'STANDARD',
    'PROFESSIONAL',
    'ULTRA'
);


ALTER TYPE public."QualityLevel" OWNER TO ugurugurlu;

--
-- Name: RestaurantFormat; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."RestaurantFormat" AS ENUM (
    'FINE_DINING',
    'CASUAL_DINING',
    'QSR',
    'CAFE',
    'CLOUD_KITCHEN',
    'BAR',
    'BAKERY',
    'FOOD_TRUCK',
    'OTHER'
);


ALTER TYPE public."RestaurantFormat" OWNER TO ugurugurlu;

--
-- Name: StaffRole; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."StaffRole" AS ENUM (
    'WAITER',
    'KITCHEN',
    'MANAGEMENT',
    'CASHIER',
    'OTHER'
);


ALTER TYPE public."StaffRole" OWNER TO ugurugurlu;

--
-- Name: StaffStatus; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."StaffStatus" AS ENUM (
    'ACTIVE',
    'ON_LEAVE',
    'INACTIVE'
);


ALTER TYPE public."StaffStatus" OWNER TO ugurugurlu;

--
-- Name: StockMovementType; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."StockMovementType" AS ENUM (
    'RECEIVE',
    'WASTE',
    'CORRECTION',
    'SALE_DEPLETION'
);


ALTER TYPE public."StockMovementType" OWNER TO ugurugurlu;

--
-- Name: StockUnit; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."StockUnit" AS ENUM (
    'KG',
    'GRAM',
    'LITRE',
    'ML',
    'PIECE',
    'PACK',
    'BOTTLE',
    'DOZEN'
);


ALTER TYPE public."StockUnit" OWNER TO ugurugurlu;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."UserRole" AS ENUM (
    'MANAGER',
    'ADMIN',
    'SUPER_ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO ugurugurlu;

--
-- Name: VideoKind; Type: TYPE; Schema: public; Owner: ugurugurlu
--

CREATE TYPE public."VideoKind" AS ENUM (
    'LINK',
    'FILE'
);


ALTER TYPE public."VideoKind" OWNER TO ugurugurlu;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AiCreditTransaction; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."AiCreditTransaction" (
    id text NOT NULL,
    "walletId" text NOT NULL,
    amount integer NOT NULL,
    type public."AiTransactionType" NOT NULL,
    action text NOT NULL,
    "referenceId" text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AiCreditTransaction" OWNER TO ugurugurlu;

--
-- Name: AiCreditWallet; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."AiCreditWallet" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    balance integer DEFAULT 100 NOT NULL,
    "totalUsed" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AiCreditWallet" OWNER TO ugurugurlu;

--
-- Name: AiMenuDraft; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."AiMenuDraft" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    "sourceType" text NOT NULL,
    "sourceUrl" text,
    categories jsonb NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AiMenuDraft" OWNER TO ugurugurlu;

--
-- Name: AiModelConfig; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."AiModelConfig" (
    id text NOT NULL,
    "modelId" text NOT NULL,
    "displayName" text NOT NULL,
    provider text NOT NULL,
    "taskType" public."AiTaskType" NOT NULL,
    "qualityLevel" public."QualityLevel" DEFAULT 'STANDARD'::public."QualityLevel" NOT NULL,
    "creditCost" integer DEFAULT 20 NOT NULL,
    "actualCostEst" numeric(10,4) DEFAULT 0.02 NOT NULL,
    "isEnabled" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AiModelConfig" OWNER TO ugurugurlu;

--
-- Name: AiSetting; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."AiSetting" (
    id text DEFAULT 'global_ai_settings'::text NOT NULL,
    "openRouterApiKey" text,
    "defaultVisionModel" text DEFAULT 'google/gemini-2.5-flash'::text NOT NULL,
    "defaultTextModel" text DEFAULT 'google/gemini-2.5-flash'::text NOT NULL,
    "defaultImageModel" text DEFAULT 'google/gemini-2.5-flash-image'::text NOT NULL,
    "lowBalanceThresholdUsd" numeric(10,2) DEFAULT 5.0 NOT NULL,
    "maxCostPerRequestUsd" numeric(10,2) DEFAULT 1.0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AiSetting" OWNER TO ugurugurlu;

--
-- Name: AiTask; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."AiTask" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    type public."AiTaskType" NOT NULL,
    status public."AiTaskStatus" DEFAULT 'PENDING'::public."AiTaskStatus" NOT NULL,
    "modelUsed" text,
    "tokensUsed" integer,
    "creditsSpent" integer DEFAULT 0 NOT NULL,
    "inputPayload" jsonb NOT NULL,
    "resultPayload" jsonb,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AiTask" OWNER TO ugurugurlu;

--
-- Name: AiUsageLog; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."AiUsageLog" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    "operationType" public."AiTaskType" NOT NULL,
    "qualityLevel" public."QualityLevel",
    model text NOT NULL,
    provider text,
    "promptTokens" integer DEFAULT 0 NOT NULL,
    "completionTokens" integer DEFAULT 0 NOT NULL,
    "totalTokens" integer DEFAULT 0 NOT NULL,
    "actualProviderCost" numeric(10,6) DEFAULT 0 NOT NULL,
    "chargedCredits" integer DEFAULT 0 NOT NULL,
    status public."AiTaskStatus" DEFAULT 'COMPLETED'::public."AiTaskStatus" NOT NULL,
    "durationMs" integer DEFAULT 0 NOT NULL,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AiUsageLog" OWNER TO ugurugurlu;

--
-- Name: Customer; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    "birthDate" timestamp(3) without time zone,
    "birthDay" integer,
    "birthMonth" integer,
    "birthYear" integer,
    notes text,
    source text DEFAULT 'QR_MENU'::text,
    "orderCount" integer DEFAULT 0 NOT NULL,
    "totalSpent" numeric(10,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Customer" OWNER TO ugurugurlu;

--
-- Name: DiningTable; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."DiningTable" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    label text NOT NULL,
    seats integer,
    section text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "billRequestedAt" timestamp(3) without time zone
);


ALTER TABLE public."DiningTable" OWNER TO ugurugurlu;

--
-- Name: MenuCategory; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."MenuCategory" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    name text NOT NULL,
    description text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."MenuCategory" OWNER TO ugurugurlu;

--
-- Name: MenuItem; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."MenuItem" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    "categoryId" text NOT NULL,
    name text NOT NULL,
    "shortDescription" text,
    "longDescription" text,
    "itemType" public."MenuItemType" DEFAULT 'SERVED'::public."MenuItemType" NOT NULL,
    "dietaryType" public."DietaryType",
    price numeric(10,2) NOT NULL,
    "priceTaxInclusive" boolean,
    "goodsGstRate" numeric(5,2),
    "hsnSacCode" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    allergens jsonb,
    calories integer,
    "prepTimeMinutes" integer DEFAULT 15
);


ALTER TABLE public."MenuItem" OWNER TO ugurugurlu;

--
-- Name: MenuItemAvailability; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."MenuItemAvailability" (
    id text NOT NULL,
    "menuItemId" text NOT NULL,
    reason public."Disable86Reason" NOT NULL,
    note text,
    "disabledById" text NOT NULL,
    "disabledAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resumeAt" timestamp(3) without time zone,
    "reenabledAt" timestamp(3) without time zone,
    "reenabledById" text
);


ALTER TABLE public."MenuItemAvailability" OWNER TO ugurugurlu;

--
-- Name: MenuItemImage; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."MenuItemImage" (
    id text NOT NULL,
    "menuItemId" text NOT NULL,
    url text NOT NULL,
    "storageKey" text NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MenuItemImage" OWNER TO ugurugurlu;

--
-- Name: MenuItemModifierGroup; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."MenuItemModifierGroup" (
    "menuItemId" text NOT NULL,
    "modifierGroupId" text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."MenuItemModifierGroup" OWNER TO ugurugurlu;

--
-- Name: MenuItemVariant; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."MenuItemVariant" (
    id text NOT NULL,
    "menuItemId" text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."MenuItemVariant" OWNER TO ugurugurlu;

--
-- Name: Modifier; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."Modifier" (
    id text NOT NULL,
    "groupId" text NOT NULL,
    name text NOT NULL,
    "priceDelta" numeric(10,2) DEFAULT 0 NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Modifier" OWNER TO ugurugurlu;

--
-- Name: ModifierGroup; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."ModifierGroup" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    name text NOT NULL,
    "minSelect" integer DEFAULT 0 NOT NULL,
    "maxSelect" integer DEFAULT 1 NOT NULL,
    "isRequired" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."ModifierGroup" OWNER TO ugurugurlu;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    "orderNumber" integer NOT NULL,
    "invoiceNumber" integer,
    "idempotencyKey" text NOT NULL,
    "orderType" public."OrderType" DEFAULT 'TAKEAWAY'::public."OrderType" NOT NULL,
    status public."OrderStatus" DEFAULT 'OPEN'::public."OrderStatus" NOT NULL,
    "tableLabel" text,
    "customerName" text,
    "customerPhone" text,
    "customerAddress" text,
    note text,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    "taxTotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "discountType" public."DiscountType" DEFAULT 'NONE'::public."DiscountType" NOT NULL,
    "discountValue" numeric(10,2) DEFAULT 0 NOT NULL,
    "discountReason" text,
    "discountTotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "compTotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "roundOff" numeric(10,2) DEFAULT 0 NOT NULL,
    "grandTotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "placedById" text,
    "voidedById" text,
    "voidReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "settledAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    "tableId" text,
    "placedByStaffId" text,
    "billRequestedAt" timestamp(3) without time zone
);


ALTER TABLE public."Order" OWNER TO ugurugurlu;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "menuItemId" text,
    "variantId" text,
    name text NOT NULL,
    "variantName" text,
    "unitPrice" numeric(10,2) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "lineNote" text,
    "taxRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "taxKind" text DEFAULT 'NONE'::text NOT NULL,
    "taxInclusive" boolean DEFAULT false NOT NULL,
    state public."OrderLineState" DEFAULT 'UNSENT'::public."OrderLineState" NOT NULL,
    "isComp" boolean DEFAULT false NOT NULL,
    "compReason" text,
    "firedAt" timestamp(3) without time zone,
    "voidReason" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    source public."OrderSource" DEFAULT 'STAFF'::public."OrderSource" NOT NULL,
    "itemType" public."MenuItemType" DEFAULT 'SERVED'::public."MenuItemType"
);


ALTER TABLE public."OrderItem" OWNER TO ugurugurlu;

--
-- Name: OrderItemModifier; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."OrderItemModifier" (
    id text NOT NULL,
    "orderItemId" text NOT NULL,
    "modifierId" text,
    name text NOT NULL,
    "priceDelta" numeric(10,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public."OrderItemModifier" OWNER TO ugurugurlu;

--
-- Name: OtpChallenge; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."OtpChallenge" (
    id text NOT NULL,
    phone text NOT NULL,
    "codeHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "consumedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OtpChallenge" OWNER TO ugurugurlu;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    mode public."PaymentMode" NOT NULL,
    amount numeric(10,2) NOT NULL,
    tendered numeric(10,2),
    reference text,
    "receivedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Payment" OWNER TO ugurugurlu;

--
-- Name: PushToken; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."PushToken" (
    id text NOT NULL,
    "subjectKind" text NOT NULL,
    "subjectId" text NOT NULL,
    "restaurantId" text,
    "deviceId" text NOT NULL,
    "expoPushToken" text NOT NULL,
    platform text NOT NULL,
    "appVersion" text NOT NULL,
    locale text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PushToken" OWNER TO ugurugurlu;

--
-- Name: RecipeComponent; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."RecipeComponent" (
    id text NOT NULL,
    "menuItemId" text NOT NULL,
    "stockItemId" text NOT NULL,
    quantity numeric(12,3) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RecipeComponent" OWNER TO ugurugurlu;

--
-- Name: Restaurant; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."Restaurant" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    email text,
    phone text,
    city text,
    country text DEFAULT 'IN'::text NOT NULL,
    timezone text,
    "isActive" boolean DEFAULT true NOT NULL,
    "onboardedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "ownerId" text NOT NULL,
    "gstRegistrationType" public."GstRegistrationType" DEFAULT 'UNREGISTERED'::public."GstRegistrationType" NOT NULL,
    gstin text,
    "pricesTaxInclusive" boolean DEFAULT false NOT NULL,
    "sacCode" text DEFAULT '996331'::text,
    "serviceGstRate" numeric(5,2),
    "nextInvoiceSeq" integer DEFAULT 1 NOT NULL,
    "addressLine1" text,
    "addressLine2" text,
    "brandColor" text,
    "businessHours" jsonb,
    "coverUrl" text,
    cuisines text[] DEFAULT ARRAY[]::text[],
    "facebookUrl" text,
    "fssaiExpiry" timestamp(3) without time zone,
    "fssaiLicense" text,
    "googleUrl" text,
    "instagramUrl" text,
    "legalName" text,
    "logoUrl" text,
    "panNumber" text,
    "postalCode" text,
    "restaurantFormat" public."RestaurantFormat",
    "seatingCapacity" integer,
    "serviceDelivery" boolean DEFAULT false NOT NULL,
    "serviceDineIn" boolean DEFAULT true NOT NULL,
    "serviceTakeaway" boolean DEFAULT true NOT NULL,
    state text,
    tagline text,
    website text,
    "defaultOrderType" public."OrderType" DEFAULT 'TAKEAWAY'::public."OrderType" NOT NULL,
    username text,
    "selfOrderEnabled" boolean DEFAULT false NOT NULL,
    "invoiceFooterNote" text,
    latitude double precision,
    longitude double precision,
    "licenseExpiresAt" timestamp(3) without time zone,
    "licenseNote" text,
    "licensePlan" public."LicensePlan" DEFAULT 'TRIAL'::public."LicensePlan" NOT NULL,
    "licenseStartsAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "licenseStatus" public."LicenseStatus" DEFAULT 'ACTIVE'::public."LicenseStatus" NOT NULL,
    "salesRepId" text
);


ALTER TABLE public."Restaurant" OWNER TO ugurugurlu;

--
-- Name: RestaurantImage; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."RestaurantImage" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    url text NOT NULL,
    "storageKey" text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RestaurantImage" OWNER TO ugurugurlu;

--
-- Name: RestaurantVideo; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."RestaurantVideo" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    kind public."VideoKind" NOT NULL,
    url text NOT NULL,
    "storageKey" text,
    caption text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RestaurantVideo" OWNER TO ugurugurlu;

--
-- Name: SalesRep; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."SalesRep" (
    id text NOT NULL,
    name text NOT NULL,
    title text DEFAULT 'Satış & Müşteri Temsilcisi'::text NOT NULL,
    email text,
    phone text,
    whatsapp text,
    "photoUrl" text,
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SalesRep" OWNER TO ugurugurlu;

--
-- Name: Staff; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."Staff" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    "employeeCode" text NOT NULL,
    name text NOT NULL,
    role public."StaffRole" NOT NULL,
    status public."StaffStatus" DEFAULT 'ACTIVE'::public."StaffStatus" NOT NULL,
    "photoUrl" text,
    phone text NOT NULL,
    email text,
    "addressLine1" text,
    "addressLine2" text,
    city text,
    state text,
    "postalCode" text,
    "dateOfBirth" timestamp(3) without time zone,
    gender public."Gender",
    "joiningDate" timestamp(3) without time zone,
    "employmentType" public."EmploymentType",
    "emergencyContactName" text,
    "emergencyContactPhone" text,
    notes text,
    "pinHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "loginFailedAttempts" integer DEFAULT 0 NOT NULL,
    "loginLockedUntil" timestamp(3) without time zone,
    "allowedRoutes" jsonb,
    "jobTitle" text
);


ALTER TABLE public."Staff" OWNER TO ugurugurlu;

--
-- Name: StockItem; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."StockItem" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    name text NOT NULL,
    unit public."StockUnit" NOT NULL,
    category text,
    "onHand" numeric(12,3) DEFAULT 0 NOT NULL,
    "reorderLevel" numeric(12,3),
    "parLevel" numeric(12,3),
    "costPerUnit" numeric(12,2),
    supplier text,
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."StockItem" OWNER TO ugurugurlu;

--
-- Name: StockMovement; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."StockMovement" (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    "stockItemId" text NOT NULL,
    type public."StockMovementType" NOT NULL,
    quantity numeric(12,3) NOT NULL,
    "resultingOnHand" numeric(12,3) NOT NULL,
    reason text,
    note text,
    "orderId" text,
    "createdById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StockMovement" OWNER TO ugurugurlu;

--
-- Name: SystemSetting; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."SystemSetting" (
    id text DEFAULT 'global'::text NOT NULL,
    "systemName" text DEFAULT 'Elitale Restro'::text NOT NULL,
    "systemTagline" text DEFAULT 'Gelişmiş Restoran & QR Menü Yönetim Sistemi'::text,
    "logoUrl" text,
    "faviconUrl" text,
    "ogImageUrl" text,
    "metaTitle" text DEFAULT 'Elitale Restro | Restoran ve QR Menü Otomasyonu'::text,
    "metaDescription" text DEFAULT 'Yeni nesil restoran adisyon, sipariş, mutfak ve QR menü yönetim platformu.'::text,
    "metaKeywords" text DEFAULT 'restoran otomasyonu, adisyon sistemi, qr menü, pos kasa'::text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemSetting" OWNER TO ugurugurlu;

--
-- Name: User; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public."User" (
    id text NOT NULL,
    phone text NOT NULL,
    "phoneVerifiedAt" timestamp(3) without time zone,
    email text,
    "emailVerifiedAt" timestamp(3) without time zone,
    name text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    role public."UserRole" DEFAULT 'MANAGER'::public."UserRole" NOT NULL,
    "suspendedAt" timestamp(3) without time zone,
    "pinFailedAttempts" integer DEFAULT 0 NOT NULL,
    "pinHash" text,
    "pinLockedUntil" timestamp(3) without time zone,
    "pinUpdatedAt" timestamp(3) without time zone,
    "salesRepId" text
);


ALTER TABLE public."User" OWNER TO ugurugurlu;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: ugurugurlu
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO ugurugurlu;

--
-- Data for Name: AiCreditTransaction; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."AiCreditTransaction" (id, "walletId", amount, type, action, "referenceId", description, "createdAt") FROM stdin;
cmth81tq90001otptm5kl2nc3	cmth81tq20000otptgu9ztbw1	100	BONUS_GRANT	INITIAL_WELCOME_GRANT	\N	Hoş Geldiniz Hediye AI Kredisi	2026-08-31 12:35:44.961
\.


--
-- Data for Name: AiCreditWallet; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."AiCreditWallet" (id, "restaurantId", balance, "totalUsed", "createdAt", "updatedAt") FROM stdin;
cmth81tq20000otptgu9ztbw1	cmtgma0r10001ak8o7fbaijuh	100	0	2026-08-31 12:35:44.954	2026-08-31 12:35:44.954
\.


--
-- Data for Name: AiMenuDraft; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."AiMenuDraft" (id, "restaurantId", "sourceType", "sourceUrl", categories, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiModelConfig; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."AiModelConfig" (id, "modelId", "displayName", provider, "taskType", "qualityLevel", "creditCost", "actualCostEst", "isEnabled", "sortOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiSetting; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."AiSetting" (id, "openRouterApiKey", "defaultVisionModel", "defaultTextModel", "defaultImageModel", "lowBalanceThresholdUsd", "maxCostPerRequestUsd", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiTask; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."AiTask" (id, "restaurantId", type, status, "modelUsed", "tokensUsed", "creditsSpent", "inputPayload", "resultPayload", "errorMessage", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiUsageLog; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."AiUsageLog" (id, "restaurantId", "operationType", "qualityLevel", model, provider, "promptTokens", "completionTokens", "totalTokens", "actualProviderCost", "chargedCredits", status, "durationMs", "errorMessage", "createdAt") FROM stdin;
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."Customer" (id, "restaurantId", name, phone, "birthDate", "birthDay", "birthMonth", "birthYear", notes, source, "orderCount", "totalSpent", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: DiningTable; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."DiningTable" (id, "restaurantId", label, seats, section, "sortOrder", "isActive", "createdAt", "updatedAt", "deletedAt", "billRequestedAt") FROM stdin;
cmtgmsm67000aak8osnip5erp	cmtgma0r10001ak8o7fbaijuh	Masa1	4	Salon	1	t	2026-08-31 02:40:43.327	2026-08-31 02:40:51.825	\N	\N
\.


--
-- Data for Name: MenuCategory; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."MenuCategory" (id, "restaurantId", name, description, "sortOrder", "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
cmtgmnnaz0002ak8o3istgxt8	cmtgma0r10001ak8o7fbaijuh	Tavuk Menü	tavuk menüler burada yer almaktadır	0	t	2026-08-31 02:36:51.515	2026-08-31 02:36:51.515	\N
\.


--
-- Data for Name: MenuItem; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."MenuItem" (id, "restaurantId", "categoryId", name, "shortDescription", "longDescription", "itemType", "dietaryType", price, "priceTaxInclusive", "goodsGstRate", "hsnSacCode", "sortOrder", "isActive", "createdAt", "updatedAt", "deletedAt", allergens, calories, "prepTimeMinutes") FROM stdin;
cmtgmp7yb0003ak8oz790f959	cmtgma0r10001ak8o7fbaijuh	cmtgmnnaz0002ak8o3istgxt8	Big Chicken	Harika chicken menülerimizi denemenizi tavsiye ederiz	Muhteşem menümüz \nTavuk baharat ve soslarla bezenmiş mükemmel yemek	SERVED	NON_VEG	300.00	\N	\N	\N	0	t	2026-08-31 02:38:04.931	2026-08-31 03:02:03.133	\N	\N	\N	15
\.


--
-- Data for Name: MenuItemAvailability; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."MenuItemAvailability" (id, "menuItemId", reason, note, "disabledById", "disabledAt", "resumeAt", "reenabledAt", "reenabledById") FROM stdin;
\.


--
-- Data for Name: MenuItemImage; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."MenuItemImage" (id, "menuItemId", url, "storageKey", "isPrimary", "sortOrder", "createdAt") FROM stdin;
\.


--
-- Data for Name: MenuItemModifierGroup; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."MenuItemModifierGroup" ("menuItemId", "modifierGroupId", "sortOrder") FROM stdin;
cmtgmp7yb0003ak8oz790f959	cmtgnhyeu000lak8o32r8mvms	0
cmtgmp7yb0003ak8oz790f959	cmtgniqwt000pak8orv4cuhse	1
\.


--
-- Data for Name: MenuItemVariant; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."MenuItemVariant" (id, "menuItemId", name, price, "sortOrder", "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
cmtgnk1of000sak8oyu3vl5vr	cmtgmp7yb0003ak8oz790f959	küçük	100.00	0	t	2026-08-31 03:02:03.133	2026-08-31 03:02:03.133	\N
cmtgnk1og000tak8o8m6coeqk	cmtgmp7yb0003ak8oz790f959	orta	200.00	0	t	2026-08-31 03:02:03.133	2026-08-31 03:02:03.133	\N
cmtgnk1og000uak8ojzy4xw61	cmtgmp7yb0003ak8oz790f959	büyük	300.00	0	t	2026-08-31 03:02:03.133	2026-08-31 03:02:03.133	\N
\.


--
-- Data for Name: Modifier; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."Modifier" (id, "groupId", name, "priceDelta", "sortOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
cmtgnhyey000mak8oqadcagxs	cmtgnhyeu000lak8o32r8mvms	Ketçap	0.00	0	t	2026-08-31 03:00:25.59	2026-08-31 03:00:25.59
cmtgnhyey000nak8o02vmjifo	cmtgnhyeu000lak8o32r8mvms	Acı Sos	0.00	0	t	2026-08-31 03:00:25.59	2026-08-31 03:00:25.59
cmtgnhyey000oak8o35faj4o5	cmtgnhyeu000lak8o32r8mvms	Ranch Sos	0.00	0	t	2026-08-31 03:00:25.59	2026-08-31 03:00:25.59
cmtgniqwu000qak8ojb03lexd	cmtgniqwt000pak8orv4cuhse	Jalepeno	0.00	0	t	2026-08-31 03:01:02.525	2026-08-31 03:01:02.525
cmtgniqwu000rak8ott72qxjz	cmtgniqwt000pak8orv4cuhse	Uzun Biber	1.00	0	t	2026-08-31 03:01:02.525	2026-08-31 03:01:02.525
\.


--
-- Data for Name: ModifierGroup; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."ModifierGroup" (id, "restaurantId", name, "minSelect", "maxSelect", "isRequired", "sortOrder", "createdAt", "updatedAt", "deletedAt") FROM stdin;
cmtgnhyeu000lak8o32r8mvms	cmtgma0r10001ak8o7fbaijuh	Sos Seçimi	0	3	f	0	2026-08-31 03:00:25.59	2026-08-31 03:00:25.59	\N
cmtgniqwt000pak8orv4cuhse	cmtgma0r10001ak8o7fbaijuh	Turşu Seçimi	0	2	f	0	2026-08-31 03:01:02.525	2026-08-31 03:01:02.525	\N
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."Order" (id, "restaurantId", "orderNumber", "invoiceNumber", "idempotencyKey", "orderType", status, "tableLabel", "customerName", "customerPhone", "customerAddress", note, subtotal, "taxTotal", "discountType", "discountValue", "discountReason", "discountTotal", "compTotal", "roundOff", "grandTotal", "placedById", "voidedById", "voidReason", "createdAt", "updatedAt", "settledAt", "deletedAt", "tableId", "placedByStaffId", "billRequestedAt") FROM stdin;
cmtgmuve7000cak8opb7uief6	cmtgma0r10001ak8o7fbaijuh	1	1	cf4c3a60-4c28-4acf-a813-53b1298a6269	TAKEAWAY	COMPLETED	\N	\N	\N	\N	\N	300.00	0.00	NONE	0.00	\N	0.00	0.00	0.00	300.00	\N	\N	\N	2026-08-31 02:42:28.591	2026-08-31 02:49:02.244	2026-08-31 02:49:02.242	\N	\N	cmtgmub9o000bak8ozadkm7md	\N
cmtgn4ppo000jak8o0ra4m9if	cmtgma0r10001ak8o7fbaijuh	2	2	7003200b-ab3d-420a-b36c-a73c59d596ef	DINE_IN	COMPLETED	Masa1	\N	+905550570368	\N	\N	401.00	0.00	NONE	0.00	\N	0.00	0.00	0.00	401.00	\N	\N	\N	2026-08-31 02:50:07.788	2026-08-31 03:07:27.244	2026-08-31 03:07:27.24	\N	cmtgmsm67000aak8osnip5erp	\N	\N
cmtgnrjhi0013ak8om3tz1cqe	cmtgma0r10001ak8o7fbaijuh	3	\N	5e7403db-0235-4103-996e-b781c5af63ed	DINE_IN	OPEN	Masa1	\N	+905550570368	\N	\N	0.00	0.00	NONE	0.00	\N	0.00	0.00	0.00	0.00	\N	\N	\N	2026-08-31 03:07:52.806	2026-08-31 03:07:52.806	\N	\N	cmtgmsm67000aak8osnip5erp	\N	\N
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."OrderItem" (id, "orderId", "menuItemId", "variantId", name, "variantName", "unitPrice", quantity, "lineNote", "taxRate", "taxKind", "taxInclusive", state, "isComp", "compReason", "firedAt", "voidReason", "sortOrder", "createdAt", source, "itemType") FROM stdin;
cmtgmuveb000dak8ocam5rsxx	cmtgmuve7000cak8opb7uief6	cmtgmp7yb0003ak8oz790f959	cmtgmrh960007ak8o47gc7zwm	Big Chicken	küçük	100.00	1	\N	0.00	NONE	f	SERVED	f	\N	2026-08-31 02:42:28.588	\N	0	2026-08-31 02:42:28.591	STAFF	SERVED
cmtgmz49s000gak8o8k5uuw6l	cmtgmuve7000cak8opb7uief6	cmtgmp7yb0003ak8oz790f959	cmtgmrh960008ak8oztv46by3	Big Chicken	orta	200.00	1	\N	0.00	NONE	f	SERVED	f	\N	2026-08-31 02:45:46.727	\N	1	2026-08-31 02:45:46.72	STAFF	SERVED
cmtgn4ppp000kak8oh6uc3065	cmtgn4ppo000jak8o0ra4m9if	cmtgmp7yb0003ak8oz790f959	cmtgmrh960007ak8o47gc7zwm	Big Chicken	küçük	100.00	1	acılı	0.00	NONE	f	SERVED	f	\N	2026-08-31 02:50:07.784	\N	0	2026-08-31 02:50:07.788	SELF_ORDER	SERVED
cmtgnkv1i000vak8os4bqls08	cmtgn4ppo000jak8o0ra4m9if	cmtgmp7yb0003ak8oz790f959	cmtgnk1og000tak8o8m6coeqk	Big Chicken	orta	200.00	1	\N	0.00	NONE	f	SERVED	f	\N	2026-08-31 03:02:41.199	\N	1	2026-08-31 03:02:41.19	SELF_ORDER	SERVED
cmtgnlxxv0010ak8odixspevb	cmtgn4ppo000jak8o0ra4m9if	cmtgmp7yb0003ak8oz790f959	cmtgnk1of000sak8oyu3vl5vr	Big Chicken	küçük	100.00	1	\N	0.00	NONE	f	SERVED	f	\N	2026-08-31 03:03:31.631	\N	2	2026-08-31 03:03:31.603	SELF_ORDER	SERVED
cmtgnrjhk0014ak8owews8qmg	cmtgnrjhi0013ak8om3tz1cqe	cmtgmp7yb0003ak8oz790f959	cmtgnk1of000sak8oyu3vl5vr	Big Chicken	küçük	100.00	1	\N	0.00	NONE	f	FIRED	f	\N	2026-08-31 03:07:52.8	\N	0	2026-08-31 03:07:52.806	SELF_ORDER	SERVED
\.


--
-- Data for Name: OrderItemModifier; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."OrderItemModifier" (id, "orderItemId", "modifierId", name, "priceDelta") FROM stdin;
cmtgnkv1j000wak8o9ng9rqnl	cmtgnkv1i000vak8os4bqls08	cmtgnhyey000mak8oqadcagxs	Ketçap	0.00
cmtgnkv1j000xak8ot2y77iq0	cmtgnkv1i000vak8os4bqls08	cmtgniqwu000qak8ojb03lexd	Jalepeno	0.00
cmtgnkv1j000yak8oqpluosk3	cmtgnkv1i000vak8os4bqls08	cmtgniqwu000rak8ott72qxjz	Uzun Biber	1.00
cmtgnrjhk0015ak8o508yvgni	cmtgnrjhk0014ak8owews8qmg	cmtgnhyey000nak8o02vmjifo	Acı Sos	0.00
\.


--
-- Data for Name: OtpChallenge; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."OtpChallenge" (id, phone, "codeHash", "expiresAt", attempts, "consumedAt", "createdAt") FROM stdin;
cmtglicso0000n98obxu1cgm2	+905550570368	f696a4d63db4d6fc6f6e2e8daa9d6ca4fb5aaba0b31899fe6fe0071e55eec895	2026-08-31 02:09:44.996	0	\N	2026-08-31 02:04:45
cmtgm83t20000ak8ozl2kkmeh	+905550570368	04a9b5e6041f2a58dc7267b5c5bb4e0ad754d28d37d0dd8382f3d9fdb5dd9ff5	2026-08-31 02:29:46.402	0	\N	2026-08-31 02:24:46.406
cmtgn4nc4000iak8oddg09uiv	+905550570368	04a9b5e6041f2a58dc7267b5c5bb4e0ad754d28d37d0dd8382f3d9fdb5dd9ff5	2026-08-31 02:55:04.708	0	\N	2026-08-31 02:50:04.708
cmtgnlu7w000zak8olg764w4f	+905550570368	04a9b5e6041f2a58dc7267b5c5bb4e0ad754d28d37d0dd8382f3d9fdb5dd9ff5	2026-08-31 03:08:26.779	0	\N	2026-08-31 03:03:26.78
cmtgnrhd70012ak8ol8u5sjcr	+905550570368	04a9b5e6041f2a58dc7267b5c5bb4e0ad754d28d37d0dd8382f3d9fdb5dd9ff5	2026-08-31 03:12:50.059	0	\N	2026-08-31 03:07:50.059
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."Payment" (id, "orderId", mode, amount, tendered, reference, "receivedById", "createdAt") FROM stdin;
cmtgn3b51000hak8ou7tupmxs	cmtgmuve7000cak8opb7uief6	CASH	300.00	\N	\N	cmtglhq0t0000mp8ohqrcsxd3	2026-08-31 02:49:02.244
cmtgnqzrh0011ak8o3d1r10qc	cmtgn4ppo000jak8o0ra4m9if	CARD	401.00	\N	\N	cmtglhq0t0000mp8ohqrcsxd3	2026-08-31 03:07:27.244
\.


--
-- Data for Name: PushToken; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."PushToken" (id, "subjectKind", "subjectId", "restaurantId", "deviceId", "expoPushToken", platform, "appVersion", locale, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RecipeComponent; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."RecipeComponent" (id, "menuItemId", "stockItemId", quantity, "createdAt") FROM stdin;
\.


--
-- Data for Name: Restaurant; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."Restaurant" (id, name, slug, email, phone, city, country, timezone, "isActive", "onboardedAt", "createdAt", "updatedAt", "deletedAt", "ownerId", "gstRegistrationType", gstin, "pricesTaxInclusive", "sacCode", "serviceGstRate", "nextInvoiceSeq", "addressLine1", "addressLine2", "brandColor", "businessHours", "coverUrl", cuisines, "facebookUrl", "fssaiExpiry", "fssaiLicense", "googleUrl", "instagramUrl", "legalName", "logoUrl", "panNumber", "postalCode", "restaurantFormat", "seatingCapacity", "serviceDelivery", "serviceDineIn", "serviceTakeaway", state, tagline, website, "defaultOrderType", username, "selfOrderEnabled", "invoiceFooterNote", latitude, longitude, "licenseExpiresAt", "licenseNote", "licensePlan", "licenseStartsAt", "licenseStatus", "salesRepId") FROM stdin;
cmtgma0r10001ak8o7fbaijuh	Ugur Burger	ugur-burger	\N	\N	Beylikdüzü	IN	\N	t	2026-08-31 02:26:15.757	2026-08-31 02:26:15.757	2026-08-31 03:09:01.938	\N	cmtglhq0t0000mp8ohqrcsxd3	UNREGISTERED	\N	f	996331	\N	3	\N	\N	\N	[{"day": 0, "opensAt": "11:00", "closesAt": "23:00", "isClosed": false}, {"day": 1, "opensAt": "11:00", "closesAt": "23:00", "isClosed": false}, {"day": 2, "opensAt": "11:00", "closesAt": "23:00", "isClosed": false}, {"day": 3, "opensAt": "11:00", "closesAt": "23:00", "isClosed": false}, {"day": 4, "opensAt": "11:00", "closesAt": "23:00", "isClosed": false}, {"day": 5, "opensAt": "11:00", "closesAt": "23:00", "isClosed": false}, {"day": 6, "opensAt": "11:00", "closesAt": "23:00", "isClosed": false}]	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	t	t	\N	\N	\N	TAKEAWAY	ugurburger	t	\N	\N	\N	\N	\N	TRIAL	2026-08-31 15:01:36.137	ACTIVE	\N
\.


--
-- Data for Name: RestaurantImage; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."RestaurantImage" (id, "restaurantId", url, "storageKey", "sortOrder", "createdAt") FROM stdin;
\.


--
-- Data for Name: RestaurantVideo; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."RestaurantVideo" (id, "restaurantId", kind, url, "storageKey", caption, "sortOrder", "createdAt") FROM stdin;
\.


--
-- Data for Name: SalesRep; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."SalesRep" (id, name, title, email, phone, whatsapp, "photoUrl", notes, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Staff; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."Staff" (id, "restaurantId", "employeeCode", name, role, status, "photoUrl", phone, email, "addressLine1", "addressLine2", city, state, "postalCode", "dateOfBirth", gender, "joiningDate", "employmentType", "emergencyContactName", "emergencyContactPhone", notes, "pinHash", "createdAt", "updatedAt", "deletedAt", "loginFailedAttempts", "loginLockedUntil", "allowedRoutes", "jobTitle") FROM stdin;
cmtgmxlfj000fak8oepjh1mb4	cmtgma0r10001ak8o7fbaijuh	Yönetici	Uğur	MANAGEMENT	ACTIVE	\N	+905550570368	ai.oxobee@gmail.com	Güzelyurt Mah 2116 Sokak No 15/10	\N	Esenyurt	İstanbul	34515	\N	\N	\N	\N	\N	\N	\N	bf0a302228c98ed50cb64755f64adf37b93042d9b1ba17498101b8528fa5c125	2026-08-31 02:44:35.647	2026-08-31 02:44:35.647	\N	0	\N	\N	\N
cmtgmwyfx000eak8ojhji902y	cmtgma0r10001ak8o7fbaijuh	Mutfak	Emre Tekneci	KITCHEN	ACTIVE	\N	+905550570369	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	bf0a302228c98ed50cb64755f64adf37b93042d9b1ba17498101b8528fa5c125	2026-08-31 02:44:05.853	2026-08-31 03:05:39.638	\N	0	\N	\N	\N
cmtgmub9o000bak8ozadkm7md	cmtgma0r10001ak8o7fbaijuh	Salon 1	Ebru UĞURLU	WAITER	ACTIVE	\N	+905550570368	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	bf0a302228c98ed50cb64755f64adf37b93042d9b1ba17498101b8528fa5c125	2026-08-31 02:42:02.508	2026-08-31 03:05:58.93	\N	0	\N	\N	\N
\.


--
-- Data for Name: StockItem; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."StockItem" (id, "restaurantId", name, unit, category, "onHand", "reorderLevel", "parLevel", "costPerUnit", supplier, notes, "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
cmtgnvva10016ak8ozpelw9sx	cmtgma0r10001ak8o7fbaijuh	Peynir	KG	Sür Ürünleri	100.000	\N	\N	\N	Emre Büfe	\N	t	2026-08-31 03:11:14.713	2026-08-31 03:11:14.72	\N
\.


--
-- Data for Name: StockMovement; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."StockMovement" (id, "restaurantId", "stockItemId", type, quantity, "resultingOnHand", reason, note, "orderId", "createdById", "createdAt") FROM stdin;
cmtgnvvab0017ak8otjgdyp4p	cmtgma0r10001ak8o7fbaijuh	cmtgnvva10016ak8ozpelw9sx	CORRECTION	100.000	100.000	Opening stock	\N	\N	cmtglhq0t0000mp8ohqrcsxd3	2026-08-31 03:11:14.723
\.


--
-- Data for Name: SystemSetting; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."SystemSetting" (id, "systemName", "systemTagline", "logoUrl", "faviconUrl", "ogImageUrl", "metaTitle", "metaDescription", "metaKeywords", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public."User" (id, phone, "phoneVerifiedAt", email, "emailVerifiedAt", name, "isActive", "createdAt", "updatedAt", "deletedAt", role, "suspendedAt", "pinFailedAttempts", "pinHash", "pinLockedUntil", "pinUpdatedAt", "salesRepId") FROM stdin;
cmtgjt4qu00000u8obucwsbv6	+917597365803	\N	soni@elitale.com	\N	Dharmendra Soni	t	2026-08-31 01:17:08.551	2026-08-31 02:18:52.277	\N	ADMIN	\N	0	\N	\N	\N	\N
cmtglhq0t0000mp8ohqrcsxd3	+905550570368	\N	ugur@adisyonex.com	\N	Uğur UĞURLU	t	2026-08-31 02:04:15.485	2026-08-31 02:23:02.114	\N	SUPER_ADMIN	\N	0	\N	\N	\N	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: ugurugurlu
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
be0d7866-c4a7-4d9b-92eb-45da3b9f9570	dc8303d6429c23ff5aa1a75ca0e8990b89c290a390dccb0987cf0f6f556006e0	2026-08-31 04:17:01.367859+03	20260718213759_add_restaurant_username	\N	\N	2026-08-31 04:17:01.366901+03	1
4aa24e36-7daa-4155-ad75-db26e3e317d2	5079a0defa6bf6264786cb890661478095f778163a98e78d057ab932bf2d20ac	2026-08-31 04:17:01.311504+03	20260718071046_init	\N	\N	2026-08-31 04:17:01.308435+03	1
23c68fb2-2521-42a0-a434-215e3e6cde89	762bd40f54d502b9deb9ed3995945799c392faeb080a5a3e7b9d0a03063c373b	2026-08-31 04:17:01.317267+03	20260718085936_admin	\N	\N	2026-08-31 04:17:01.311833+03	1
e283e2ca-5a28-4e43-a810-d1311b77e738	3f01d2db3c20ca8e2f86da460a7f06d9345d97e6a6b339bb616e132fd0571f03	2026-08-31 04:17:01.319729+03	20260718092621_add_otp_challenge	\N	\N	2026-08-31 04:17:01.31758+03	1
80f61e17-2579-461a-b7a1-0aa6748c689e	01f740483e1311480c7afc133923f86b3234f0c93621286fef24d936d551e48f	2026-08-31 04:17:01.368624+03	20260719080712_add_staff_login_lockout	\N	\N	2026-08-31 04:17:01.368051+03	1
36d8ac97-f196-49da-b056-933b310c80c7	33b15e10086ca0f0ee308b96c1af6b10ffb8fa801e1ee9349423733221d599f5	2026-08-31 04:17:01.335181+03	20260718120400_add_menu	\N	\N	2026-08-31 04:17:01.320205+03	1
5f3d53f1-6a15-4b71-b837-c13f186f467d	7d054de7caa6af2912d3a6966ebea38b54b1c8a24f6e9a67aba22e79f3465a63	2026-08-31 04:17:01.344549+03	20260718145823_add_orders	\N	\N	2026-08-31 04:17:01.335483+03	1
bf85a9f6-69b4-4234-b402-57ef3781999d	0cc54816b8019593291f2b5c646f8dc7e251f0863ea9baa5b3fcd5c86a6fc6ee	2026-08-31 04:17:01.348156+03	20260718160455_add_tables	\N	\N	2026-08-31 04:17:01.34478+03	1
bc23ae5e-6d12-4c87-88c9-ee7c046256a4	39a3bf3fd509afcdd909eeaf54b41a5e3b583f3d49ffa041cc4b3330304d6341	2026-08-31 04:17:01.369626+03	20260719090546_add_order_staff_attribution	\N	\N	2026-08-31 04:17:01.368824+03	1
78704c3a-3d95-43cc-aaed-bcfedd195d57	3bb46de694ef76a8a9fe09517dbc4e0d76e4c39ad65036cf02bee9ebb984f8b2	2026-08-31 04:17:01.351197+03	20260718163942_add_restaurant_profile	\N	\N	2026-08-31 04:17:01.348367+03	1
5ebbe8a8-ca1f-4bac-aa28-54362f414c11	820a78f5726c9b14feaaf29a04416a70ae06cd9f439eb25f72494abeb751f8e4	2026-08-31 04:17:01.353584+03	20260718172916_add_restaurant_videos	\N	\N	2026-08-31 04:17:01.351392+03	1
2596fb03-c90e-4fb2-ae48-e77514ff4de1	64b471d2ae932e573fd7fc1533a4b50e31ac6e4ebf06bbdfa4bfab14e688aac5	2026-08-31 04:17:01.354528+03	20260718174657_add_default_order_type	\N	\N	2026-08-31 04:17:01.353802+03	1
4b2cedcb-23c4-43d7-a085-ac52e9a012aa	c18802d2ef31c6f838f13fb39abb7fae9841a6ef8b94aeab1d7305ab69a9cba7	2026-08-31 04:17:01.370441+03	20260719104015_add_line_prep_states	\N	\N	2026-08-31 04:17:01.369829+03	1
96868c1c-ad12-41bc-8b71-cf1d3729eec9	5b7946e48112f419f03b26e4cd1aab91967162e30de45400b5479f2eb2695fcd	2026-08-31 04:17:01.361563+03	20260718190708_add_inventory	\N	\N	2026-08-31 04:17:01.354805+03	1
06a9ad95-574c-495b-b531-23368bbe0c9c	6bf9a40c6381c6a23b24fe5793c2bb36de3796dd1b8b5481462ddec7dc6fbea7	2026-08-31 04:17:01.365+03	20260718195936_add_staff	\N	\N	2026-08-31 04:17:01.361781+03	1
c23f46c3-caaa-4acc-8f48-4288f6e9687c	32ad4897f9776aaad974936e11eb861591d27f23054b38660d9aded61fa923e4	2026-08-31 04:17:01.36588+03	20260718203858_staff_shared_pin	\N	\N	2026-08-31 04:17:01.365193+03	1
88fe2a9b-e231-467f-bd70-93c82dabf9fa	5efcb0d2dacd5312dc70be745c2dabedd23c2a07b7a9a434b98b59b53d87a45b	2026-08-31 04:17:01.371537+03	20260719184253_add_self_order	\N	\N	2026-08-31 04:17:01.370621+03	1
bedab72d-2d23-4d44-825e-2fdff1c2dfbb	c10ad81b39a0ac2490e297f616f9d7ae48fe76139c577abdec10e2ebe9621b39	2026-08-31 04:17:01.366727+03	20260718210936_add_manager_pin	\N	\N	2026-08-31 04:17:01.366058+03	1
e09749fd-316a-4221-a27a-ac7efc25faec	c9f4f0b7bc360da6030f1d51b59c59e5cfe43bc2c02aaf9ed6e87127f66cd539	2026-08-31 04:17:01.372294+03	20260719215326_add_invoice_footer_note	\N	\N	2026-08-31 04:17:01.371711+03	1
67a18cab-7c8c-43d7-b0a9-ed5733e3e9c3	02c4b6dfae50beb37a44242e9528e56f2725414d00e3d2c7b5132cfdb8e18373	2026-08-31 04:17:01.373068+03	20260720164400_add_restaurant_geolocation	\N	\N	2026-08-31 04:17:01.37247+03	1
43e47bed-6f5a-42cd-aa17-1aadc01669c1	62bf6d423fc630f7013490676d72b5506a2581d0292216a9e9d4a7cbba6de296	2026-08-31 04:17:01.375468+03	20260814150000_add_push_tokens	\N	\N	2026-08-31 04:17:01.373254+03	1
\.


--
-- Name: AiCreditTransaction AiCreditTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."AiCreditTransaction"
    ADD CONSTRAINT "AiCreditTransaction_pkey" PRIMARY KEY (id);


--
-- Name: AiCreditWallet AiCreditWallet_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."AiCreditWallet"
    ADD CONSTRAINT "AiCreditWallet_pkey" PRIMARY KEY (id);


--
-- Name: AiMenuDraft AiMenuDraft_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."AiMenuDraft"
    ADD CONSTRAINT "AiMenuDraft_pkey" PRIMARY KEY (id);


--
-- Name: AiModelConfig AiModelConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."AiModelConfig"
    ADD CONSTRAINT "AiModelConfig_pkey" PRIMARY KEY (id);


--
-- Name: AiSetting AiSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."AiSetting"
    ADD CONSTRAINT "AiSetting_pkey" PRIMARY KEY (id);


--
-- Name: AiTask AiTask_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."AiTask"
    ADD CONSTRAINT "AiTask_pkey" PRIMARY KEY (id);


--
-- Name: AiUsageLog AiUsageLog_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."AiUsageLog"
    ADD CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: DiningTable DiningTable_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."DiningTable"
    ADD CONSTRAINT "DiningTable_pkey" PRIMARY KEY (id);


--
-- Name: MenuCategory MenuCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuCategory"
    ADD CONSTRAINT "MenuCategory_pkey" PRIMARY KEY (id);


--
-- Name: MenuItemAvailability MenuItemAvailability_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuItemAvailability"
    ADD CONSTRAINT "MenuItemAvailability_pkey" PRIMARY KEY (id);


--
-- Name: MenuItemImage MenuItemImage_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuItemImage"
    ADD CONSTRAINT "MenuItemImage_pkey" PRIMARY KEY (id);


--
-- Name: MenuItemModifierGroup MenuItemModifierGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuItemModifierGroup"
    ADD CONSTRAINT "MenuItemModifierGroup_pkey" PRIMARY KEY ("menuItemId", "modifierGroupId");


--
-- Name: MenuItemVariant MenuItemVariant_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuItemVariant"
    ADD CONSTRAINT "MenuItemVariant_pkey" PRIMARY KEY (id);


--
-- Name: MenuItem MenuItem_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuItem"
    ADD CONSTRAINT "MenuItem_pkey" PRIMARY KEY (id);


--
-- Name: ModifierGroup ModifierGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."ModifierGroup"
    ADD CONSTRAINT "ModifierGroup_pkey" PRIMARY KEY (id);


--
-- Name: Modifier Modifier_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Modifier"
    ADD CONSTRAINT "Modifier_pkey" PRIMARY KEY (id);


--
-- Name: OrderItemModifier OrderItemModifier_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."OrderItemModifier"
    ADD CONSTRAINT "OrderItemModifier_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: OtpChallenge OtpChallenge_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."OtpChallenge"
    ADD CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PushToken PushToken_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."PushToken"
    ADD CONSTRAINT "PushToken_pkey" PRIMARY KEY (id);


--
-- Name: RecipeComponent RecipeComponent_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."RecipeComponent"
    ADD CONSTRAINT "RecipeComponent_pkey" PRIMARY KEY (id);


--
-- Name: RestaurantImage RestaurantImage_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."RestaurantImage"
    ADD CONSTRAINT "RestaurantImage_pkey" PRIMARY KEY (id);


--
-- Name: RestaurantVideo RestaurantVideo_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."RestaurantVideo"
    ADD CONSTRAINT "RestaurantVideo_pkey" PRIMARY KEY (id);


--
-- Name: Restaurant Restaurant_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Restaurant"
    ADD CONSTRAINT "Restaurant_pkey" PRIMARY KEY (id);


--
-- Name: SalesRep SalesRep_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."SalesRep"
    ADD CONSTRAINT "SalesRep_pkey" PRIMARY KEY (id);


--
-- Name: Staff Staff_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_pkey" PRIMARY KEY (id);


--
-- Name: StockItem StockItem_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."StockItem"
    ADD CONSTRAINT "StockItem_pkey" PRIMARY KEY (id);


--
-- Name: StockMovement StockMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_pkey" PRIMARY KEY (id);


--
-- Name: SystemSetting SystemSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."SystemSetting"
    ADD CONSTRAINT "SystemSetting_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AiCreditTransaction_createdAt_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "AiCreditTransaction_createdAt_idx" ON public."AiCreditTransaction" USING btree ("createdAt");


--
-- Name: AiCreditTransaction_walletId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "AiCreditTransaction_walletId_idx" ON public."AiCreditTransaction" USING btree ("walletId");


--
-- Name: AiCreditWallet_restaurantId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "AiCreditWallet_restaurantId_idx" ON public."AiCreditWallet" USING btree ("restaurantId");


--
-- Name: AiCreditWallet_restaurantId_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "AiCreditWallet_restaurantId_key" ON public."AiCreditWallet" USING btree ("restaurantId");


--
-- Name: AiMenuDraft_restaurantId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "AiMenuDraft_restaurantId_idx" ON public."AiMenuDraft" USING btree ("restaurantId");


--
-- Name: AiModelConfig_isEnabled_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "AiModelConfig_isEnabled_idx" ON public."AiModelConfig" USING btree ("isEnabled");


--
-- Name: AiModelConfig_taskType_qualityLevel_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "AiModelConfig_taskType_qualityLevel_idx" ON public."AiModelConfig" USING btree ("taskType", "qualityLevel");


--
-- Name: AiTask_createdAt_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "AiTask_createdAt_idx" ON public."AiTask" USING btree ("createdAt");


--
-- Name: AiTask_restaurantId_type_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "AiTask_restaurantId_type_idx" ON public."AiTask" USING btree ("restaurantId", type);


--
-- Name: AiTask_status_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "AiTask_status_idx" ON public."AiTask" USING btree (status);


--
-- Name: AiUsageLog_createdAt_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "AiUsageLog_createdAt_idx" ON public."AiUsageLog" USING btree ("createdAt");


--
-- Name: AiUsageLog_operationType_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "AiUsageLog_operationType_idx" ON public."AiUsageLog" USING btree ("operationType");


--
-- Name: AiUsageLog_restaurantId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "AiUsageLog_restaurantId_idx" ON public."AiUsageLog" USING btree ("restaurantId");


--
-- Name: Customer_restaurantId_birthMonth_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "Customer_restaurantId_birthMonth_idx" ON public."Customer" USING btree ("restaurantId", "birthMonth");


--
-- Name: Customer_restaurantId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "Customer_restaurantId_idx" ON public."Customer" USING btree ("restaurantId");


--
-- Name: Customer_restaurantId_phone_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "Customer_restaurantId_phone_key" ON public."Customer" USING btree ("restaurantId", phone);


--
-- Name: DiningTable_restaurantId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "DiningTable_restaurantId_idx" ON public."DiningTable" USING btree ("restaurantId");


--
-- Name: DiningTable_restaurantId_label_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "DiningTable_restaurantId_label_key" ON public."DiningTable" USING btree ("restaurantId", label);


--
-- Name: MenuCategory_restaurantId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "MenuCategory_restaurantId_idx" ON public."MenuCategory" USING btree ("restaurantId");


--
-- Name: MenuCategory_restaurantId_name_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "MenuCategory_restaurantId_name_key" ON public."MenuCategory" USING btree ("restaurantId", name);


--
-- Name: MenuItemAvailability_menuItemId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "MenuItemAvailability_menuItemId_idx" ON public."MenuItemAvailability" USING btree ("menuItemId");


--
-- Name: MenuItemImage_menuItemId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "MenuItemImage_menuItemId_idx" ON public."MenuItemImage" USING btree ("menuItemId");


--
-- Name: MenuItemModifierGroup_modifierGroupId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "MenuItemModifierGroup_modifierGroupId_idx" ON public."MenuItemModifierGroup" USING btree ("modifierGroupId");


--
-- Name: MenuItemVariant_menuItemId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "MenuItemVariant_menuItemId_idx" ON public."MenuItemVariant" USING btree ("menuItemId");


--
-- Name: MenuItem_categoryId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "MenuItem_categoryId_idx" ON public."MenuItem" USING btree ("categoryId");


--
-- Name: MenuItem_restaurantId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "MenuItem_restaurantId_idx" ON public."MenuItem" USING btree ("restaurantId");


--
-- Name: ModifierGroup_restaurantId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "ModifierGroup_restaurantId_idx" ON public."ModifierGroup" USING btree ("restaurantId");


--
-- Name: Modifier_groupId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "Modifier_groupId_idx" ON public."Modifier" USING btree ("groupId");


--
-- Name: OrderItemModifier_orderItemId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "OrderItemModifier_orderItemId_idx" ON public."OrderItemModifier" USING btree ("orderItemId");


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: Order_idempotencyKey_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON public."Order" USING btree ("idempotencyKey");


--
-- Name: Order_restaurantId_orderNumber_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "Order_restaurantId_orderNumber_key" ON public."Order" USING btree ("restaurantId", "orderNumber");


--
-- Name: Order_restaurantId_status_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "Order_restaurantId_status_idx" ON public."Order" USING btree ("restaurantId", status);


--
-- Name: Order_tableId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "Order_tableId_idx" ON public."Order" USING btree ("tableId");


--
-- Name: OtpChallenge_phone_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "OtpChallenge_phone_idx" ON public."OtpChallenge" USING btree (phone);


--
-- Name: Payment_orderId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "Payment_orderId_idx" ON public."Payment" USING btree ("orderId");


--
-- Name: PushToken_restaurantId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "PushToken_restaurantId_idx" ON public."PushToken" USING btree ("restaurantId");


--
-- Name: PushToken_subjectKind_subjectId_deviceId_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "PushToken_subjectKind_subjectId_deviceId_key" ON public."PushToken" USING btree ("subjectKind", "subjectId", "deviceId");


--
-- Name: PushToken_subjectKind_subjectId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "PushToken_subjectKind_subjectId_idx" ON public."PushToken" USING btree ("subjectKind", "subjectId");


--
-- Name: RecipeComponent_menuItemId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "RecipeComponent_menuItemId_idx" ON public."RecipeComponent" USING btree ("menuItemId");


--
-- Name: RecipeComponent_menuItemId_stockItemId_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "RecipeComponent_menuItemId_stockItemId_key" ON public."RecipeComponent" USING btree ("menuItemId", "stockItemId");


--
-- Name: RecipeComponent_stockItemId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "RecipeComponent_stockItemId_idx" ON public."RecipeComponent" USING btree ("stockItemId");


--
-- Name: RestaurantImage_restaurantId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "RestaurantImage_restaurantId_idx" ON public."RestaurantImage" USING btree ("restaurantId");


--
-- Name: RestaurantVideo_restaurantId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "RestaurantVideo_restaurantId_idx" ON public."RestaurantVideo" USING btree ("restaurantId");


--
-- Name: Restaurant_isActive_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "Restaurant_isActive_idx" ON public."Restaurant" USING btree ("isActive");


--
-- Name: Restaurant_ownerId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "Restaurant_ownerId_idx" ON public."Restaurant" USING btree ("ownerId");


--
-- Name: Restaurant_salesRepId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "Restaurant_salesRepId_idx" ON public."Restaurant" USING btree ("salesRepId");


--
-- Name: Restaurant_slug_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "Restaurant_slug_key" ON public."Restaurant" USING btree (slug);


--
-- Name: Restaurant_username_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "Restaurant_username_key" ON public."Restaurant" USING btree (username);


--
-- Name: SalesRep_isActive_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "SalesRep_isActive_idx" ON public."SalesRep" USING btree ("isActive");


--
-- Name: Staff_restaurantId_employeeCode_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "Staff_restaurantId_employeeCode_key" ON public."Staff" USING btree ("restaurantId", "employeeCode");


--
-- Name: Staff_restaurantId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "Staff_restaurantId_idx" ON public."Staff" USING btree ("restaurantId");


--
-- Name: StockItem_restaurantId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "StockItem_restaurantId_idx" ON public."StockItem" USING btree ("restaurantId");


--
-- Name: StockItem_restaurantId_name_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "StockItem_restaurantId_name_key" ON public."StockItem" USING btree ("restaurantId", name);


--
-- Name: StockMovement_orderId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "StockMovement_orderId_idx" ON public."StockMovement" USING btree ("orderId");


--
-- Name: StockMovement_restaurantId_createdAt_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "StockMovement_restaurantId_createdAt_idx" ON public."StockMovement" USING btree ("restaurantId", "createdAt");


--
-- Name: StockMovement_stockItemId_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "StockMovement_stockItemId_idx" ON public."StockMovement" USING btree ("stockItemId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_phone_key; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE UNIQUE INDEX "User_phone_key" ON public."User" USING btree (phone);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: ugurugurlu
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: AiCreditTransaction AiCreditTransaction_walletId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."AiCreditTransaction"
    ADD CONSTRAINT "AiCreditTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public."AiCreditWallet"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AiCreditWallet AiCreditWallet_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."AiCreditWallet"
    ADD CONSTRAINT "AiCreditWallet_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public."Restaurant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AiTask AiTask_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."AiTask"
    ADD CONSTRAINT "AiTask_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public."Restaurant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Customer Customer_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public."Restaurant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DiningTable DiningTable_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."DiningTable"
    ADD CONSTRAINT "DiningTable_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public."Restaurant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MenuCategory MenuCategory_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuCategory"
    ADD CONSTRAINT "MenuCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public."Restaurant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MenuItemAvailability MenuItemAvailability_menuItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuItemAvailability"
    ADD CONSTRAINT "MenuItemAvailability_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES public."MenuItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MenuItemImage MenuItemImage_menuItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuItemImage"
    ADD CONSTRAINT "MenuItemImage_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES public."MenuItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MenuItemModifierGroup MenuItemModifierGroup_menuItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuItemModifierGroup"
    ADD CONSTRAINT "MenuItemModifierGroup_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES public."MenuItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MenuItemModifierGroup MenuItemModifierGroup_modifierGroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuItemModifierGroup"
    ADD CONSTRAINT "MenuItemModifierGroup_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES public."ModifierGroup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MenuItemVariant MenuItemVariant_menuItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuItemVariant"
    ADD CONSTRAINT "MenuItemVariant_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES public."MenuItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MenuItem MenuItem_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuItem"
    ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."MenuCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MenuItem MenuItem_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."MenuItem"
    ADD CONSTRAINT "MenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public."Restaurant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ModifierGroup ModifierGroup_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."ModifierGroup"
    ADD CONSTRAINT "ModifierGroup_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public."Restaurant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Modifier Modifier_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Modifier"
    ADD CONSTRAINT "Modifier_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."ModifierGroup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItemModifier OrderItemModifier_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."OrderItemModifier"
    ADD CONSTRAINT "OrderItemModifier_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES public."OrderItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public."Restaurant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public."DiningTable"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecipeComponent RecipeComponent_menuItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."RecipeComponent"
    ADD CONSTRAINT "RecipeComponent_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES public."MenuItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecipeComponent RecipeComponent_stockItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."RecipeComponent"
    ADD CONSTRAINT "RecipeComponent_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES public."StockItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RestaurantImage RestaurantImage_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."RestaurantImage"
    ADD CONSTRAINT "RestaurantImage_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public."Restaurant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RestaurantVideo RestaurantVideo_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."RestaurantVideo"
    ADD CONSTRAINT "RestaurantVideo_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public."Restaurant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Restaurant Restaurant_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Restaurant"
    ADD CONSTRAINT "Restaurant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Restaurant Restaurant_salesRepId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Restaurant"
    ADD CONSTRAINT "Restaurant_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES public."SalesRep"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Staff Staff_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public."Restaurant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockItem StockItem_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."StockItem"
    ADD CONSTRAINT "StockItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public."Restaurant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockMovement StockMovement_stockItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES public."StockItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_salesRepId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ugurugurlu
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES public."SalesRep"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict NJ3yLDQ6ns8PONLFnUDLsqAALJAzYunaT6zVFhavo60kc1iFjOE59PhRZJQ6oEL

