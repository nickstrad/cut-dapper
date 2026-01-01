// =====================================================================================
// Amazon PA-API 5.0: URL -> ASIN -> GetItems -> { name, description, imageUrls, brand, model }
// Uses Axios + built-in crypto for SigV4 signing.
//
// Requires env:
//   PAAPI_ACCESS_KEY, PAAPI_SECRET_KEY, PAAPI_PARTNER_TAG
// Optional env:
//   PAAPI_HOST (default: webservices.amazon.com), PAAPI_REGION (default: us-east-1)
//
// References:
// - Required headers + x-amz-target format:  [oai_citation:3‡Amazon Web Services](https://webservices.amazon.com/paapi5/documentation/sending-request.html)
// - GetItems + Resources options:  [oai_citation:4‡Amazon Web Services](https://webservices.amazon.com/paapi5/documentation/get-items.html)
// - Images resource returns URLs:  [oai_citation:5‡Amazon Web Services](https://webservices.amazon.com/paapi5/documentation/images.html?utm_source=chatgpt.com)
// - ItemInfo resource:  [oai_citation:6‡Amazon Web Services](https://webservices.amazon.com/paapi5/documentation/item-info.html?utm_source=chatgpt.com)
// =====================================================================================

import axios from "axios";
import crypto from "crypto";
import type { FormValues } from "../clippers/components/clipper-form";

// PA-API response types
interface PaapiImage {
  Large?: { URL?: string };
}

interface PaapiItem {
  ItemInfo?: {
    Title?: { DisplayValue?: string };
    Features?: { DisplayValues?: string[] };
    ByLineInfo?: {
      Brand?: { DisplayValue?: string };
      Manufacturer?: { DisplayValue?: string };
    };
    ManufactureInfo?: {
      Brand?: { DisplayValue?: string };
      Model?: { DisplayValue?: string };
    };
    ProductInfo?: {
      Model?: { DisplayValue?: string };
    };
    TechnicalInfo?: {
      Model?: { DisplayValue?: string };
    };
  };
  Images?: {
    Primary?: PaapiImage;
    Variants?: PaapiImage[];
  };
}

const PAAPI_HOST = process.env.PAAPI_HOST ?? "webservices.amazon.com";
const PAAPI_REGION = process.env.PAAPI_REGION ?? "us-east-1";
const PAAPI_SERVICE = "ProductAdvertisingAPI";

function assertEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function toAmzDate(now = new Date()): { amzDate: string; dateStamp: string } {
  // ISO8601 basic: YYYYMMDD'T'HHMMSS'Z'  [oai_citation:8‡Amazon Web Services](https://webservices.amazon.com/paapi5/documentation/sending-request.html)
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = now.getUTCFullYear();
  const mm = pad(now.getUTCMonth() + 1);
  const dd = pad(now.getUTCDate());
  const hh = pad(now.getUTCHours());
  const mi = pad(now.getUTCMinutes());
  const ss = pad(now.getUTCSeconds());
  const dateStamp = `${yyyy}${mm}${dd}`;
  const amzDate = `${dateStamp}T${hh}${mi}${ss}Z`;
  return { amzDate, dateStamp };
}

function buildAuthorizationHeader(args: {
  accessKey: string;
  secretKey: string;
  amzDate: string;
  dateStamp: string;
  region: string;
  service: string;
  host: string;
  target: string;
  payload: string; // JSON string
  contentType: string;
  contentEncoding: string;
  method: "POST";
  path: string; // "/"
}): { authorization: string; signedHeaders: string } {
  const {
    accessKey,
    secretKey,
    amzDate,
    dateStamp,
    region,
    service,
    host,
    target,
    payload,
    contentType,
    contentEncoding,
    method,
    path,
  } = args;

  // PA-API expects these signed headers (case-sensitive keys as documented)  [oai_citation:9‡Amazon Web Services](https://webservices.amazon.com/paapi5/documentation/sending-request.html)
  const canonicalHeaders =
    `content-encoding:${contentEncoding}\n` +
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n`;

  const signedHeaders =
    "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const canonicalQueryString = ""; // PA-API uses POST with JSON body typically
  const payloadHash = sha256Hex(payload);

  const canonicalRequest =
    `${method}\n` +
    `${path}\n` +
    `${canonicalQueryString}\n` +
    `${canonicalHeaders}\n` +
    `${signedHeaders}\n` +
    `${payloadHash}`;

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `${algorithm}\n` +
    `${amzDate}\n` +
    `${credentialScope}\n` +
    `${sha256Hex(canonicalRequest)}`;

  // Derive signing key (SigV4)
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");

  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign, "utf8")
    .digest("hex");

  const authorization =
    `${algorithm} ` +
    `Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  return { authorization, signedHeaders };
}

export function extractAmazonAsin(url: string): string {
  // Common Amazon patterns:
  // /dp/ASIN, /gp/product/ASIN, ... ASIN is 10 chars (letters+digits)
  const match =
    url.match(/\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i) ||
    url.match(/\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i) ||
    url.match(/\/product\/([A-Z0-9]{10})(?:[/?]|$)/i);

  if (!match) throw new Error("Could not extract ASIN from Amazon URL");
  return match[1].toUpperCase();
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function cleanText(s: unknown): string {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function pickFirst(...vals: Array<string | undefined | null>): string {
  for (const v of vals) {
    const t = cleanText(v);
    if (t) return t;
  }
  return "";
}

function mapPaapiItemToForm(item: PaapiItem, amazonUrl: string): FormValues {
  const name = cleanText(item?.ItemInfo?.Title?.DisplayValue);

  // Description: PA-API often provides Features bullets; use them as a readable description
  const features: string[] =
    item?.ItemInfo?.Features?.DisplayValues?.map((x) =>
      cleanText(x)
    ).filter(Boolean) ?? [];
  const description = features.length ? features.join("\n") : "";

  // Brand/model: often inside ByLineInfo / ManufactureInfo / ProductInfo depending on category
  const brand = pickFirst(
    item?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
    item?.ItemInfo?.ManufactureInfo?.Brand?.DisplayValue,
    item?.ItemInfo?.ByLineInfo?.Manufacturer?.DisplayValue
  );

  const model = pickFirst(
    item?.ItemInfo?.ManufactureInfo?.Model?.DisplayValue,
    item?.ItemInfo?.ProductInfo?.Model?.DisplayValue,
    item?.ItemInfo?.TechnicalInfo?.Model?.DisplayValue
  );

  // Images: Primary + Variants, Large urls recommended
  const primary = item?.Images?.Primary?.Large?.URL
    ? [item.Images.Primary.Large.URL]
    : [];
  const variants =
    item?.Images?.Variants?.map((v) => v?.Large?.URL).filter(Boolean) ??
    [];

  // Convert to { value: string }[] format to match FormValues type
  const imageUrls = uniq([...primary, ...variants])
    .map(cleanText)
    .filter(Boolean)
    .map((url) => ({ value: url }));

  return {
    name,
    description,
    amazonUrl, // Include the original Amazon URL
    imageUrls,
    brand,
    model,
  };
}

export async function fetchAmazonClipperMetaFromUrl(
  inputUrl: string
): Promise<FormValues> {
  const accessKey = assertEnv("PAAPI_ACCESS_KEY");
  const secretKey = assertEnv("PAAPI_SECRET_KEY");
  const partnerTag = assertEnv("PAAPI_PARTNER_TAG");

  const asin = extractAmazonAsin(inputUrl);

  // GetItems operation + resources  [oai_citation:10‡Amazon Web Services](https://webservices.amazon.com/paapi5/documentation/get-items.html)
  const payloadObj = {
    ItemIds: [asin],
    ItemIdType: "ASIN",
    Marketplace: "www.amazon.com",
    PartnerTag: partnerTag,
    PartnerType: "Associates",
    Resources: [
      "Images.Primary.Large",
      "Images.Variants.Large",
      "ItemInfo.Title",
      "ItemInfo.Features",
      "ItemInfo.ByLineInfo",
      "ItemInfo.ManufactureInfo",
      "ItemInfo.ProductInfo",
      "ItemInfo.TechnicalInfo",
    ],
  };

  const payload = JSON.stringify(payloadObj);

  const { amzDate, dateStamp } = toAmzDate(new Date());

  // x-amz-target format documented here; GetItems target is: ...ProductAdvertisingAPIv1.GetItems  [oai_citation:11‡Amazon Web Services](https://webservices.amazon.com/paapi5/documentation/sending-request.html)
  const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems";

  const contentType = "application/json; charset=utf-8";
  const contentEncoding = "amz-1.0";

  const { authorization } = buildAuthorizationHeader({
    accessKey,
    secretKey,
    amzDate,
    dateStamp,
    region: PAAPI_REGION,
    service: PAAPI_SERVICE,
    host: PAAPI_HOST,
    target,
    payload,
    contentType,
    contentEncoding,
    method: "POST",
    path: "/",
  });

  const res = await axios.post(`https://${PAAPI_HOST}/`, payload, {
    headers: {
      host: PAAPI_HOST,
      "content-type": contentType,
      "content-encoding": contentEncoding,
      "x-amz-date": amzDate,
      "x-amz-target": target,
      Authorization: authorization,
    },
    timeout: 15_000,
    validateStatus: (s) => s >= 200 && s < 300,
  });

  const data = res.data;

  const item = data?.ItemsResult?.Items?.[0];
  if (!item) {
    const err =
      data?.Errors?.[0]?.Message ||
      "No item returned from PA-API (check credentials/resources/ASIN).";
    throw new Error(err);
  }

  const mapped = mapPaapiItemToForm(item, inputUrl);

  // If model is still empty, a tiny heuristic: remove brand from name
  if (!mapped.model && mapped.name && mapped.brand) {
    mapped.model = cleanText(
      mapped.name.replace(new RegExp(`\\b${mapped.brand}\\b`, "i"), "")
    ).slice(0, 80);
  }

  return mapped;
}

// -------------------------------------------------------------------------------------
// Example usage (server-side):
// const meta = await fetchAmazonClipperMetaFromUrl("https://www.amazon.com/.../dp/B0D6PXMF24?th=1");
// -> meta = { name, description, imageUrls, brand, model }
// -------------------------------------------------------------------------------------
