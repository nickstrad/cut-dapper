import puppeteer from "puppeteer";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Zod schema matching the Clipper model
const ClipperExtractSchema = z.object({
  name: z.string().describe("Full product name of the clipper or trimmer"),
  brand: z.string().describe("Brand name (e.g., Andis, Wahl, BaBylissPRO)"),
  model: z.string().describe("Model name or number"),
  description: z.string().describe("Product description"),
  imageUrls: z
    .array(z.string().describe("Product image URL (full URL)"))
    .describe("Array of product image URLs"),
});

export type ClipperExtractData = z.infer<typeof ClipperExtractSchema>;

type LLMProvider = "openai" | "anthropic" | "google";

/**
 * Create LLM instance based on provider
 */
function createLLM(provider: LLMProvider = "openai") {
  switch (provider) {
    case "openai":
      return new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0,
        apiKey: process.env.OPENAI_API_KEY,
      });
    case "anthropic":
      return new ChatAnthropic({
        model: "claude-3-5-sonnet-20241022",
        temperature: 0,
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    case "google":
      return new ChatGoogleGenerativeAI({
        model: "gemini-1.5-flash",
        temperature: 0,
        apiKey: process.env.GOOGLE_API_KEY,
      });
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

/**
 * Fetch fully-rendered HTML content from a URL using Puppeteer
 */
async function fetchHTML(url: string): Promise<string> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navigate and wait for content to load
    await page.goto(url, {
      waitUntil: "networkidle2", // Wait until network is mostly idle
      timeout: 30000,
    });

    // Wait for product title to ensure main content is loaded
    try {
      await page.waitForSelector("#productTitle", { timeout: 10000 });
    } catch {
      // If product title doesn't load, continue anyway
      console.warn(
        "Product title selector not found, continuing with available content"
      );
    }

    // Get the fully rendered HTML
    const html = await page.content();

    await browser.close();
    return html;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw new Error(
      `Failed to fetch HTML from ${url}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Extract clipper data from Amazon URL using LLM
 */
export async function extractClipperFromAmazonURL(params: {
  url: string;
  provider?: LLMProvider;
}): Promise<ClipperExtractData & { amazonUrl: string }> {
  const { url, provider = "openai" } = params;

  // Fetch the HTML content
  const html = await fetchHTML(url);

  // Create LLM with structured output
  const llm = createLLM(provider);
  const structuredLLM = llm.withStructuredOutput(ClipperExtractSchema);

  // Extract clipper data
  const extractedData = await structuredLLM.invoke([
    {
      role: "system",
      content: `You are an expert at extracting product information from Amazon product pages.
Extract the following information from the HTML:
- name: The full product title/name
- brand: The manufacturer/brand (e.g., Andis, Wahl, BaBylissPRO, StyleCraft)
- model: The model name or number
- description: A concise product description (1-2 sentences)
- imageUrls: Array of product image URLs (find high-quality images)

Be precise and extract accurate information. If a field is not clearly available, use your best judgment based on the product title and context.`,
    },
    {
      role: "user",
      content: `Extract clipper/trimmer product information from this Amazon HTML:\n\n${html.slice(
        0,
        50000
      )}`,
    },
  ]);

  return {
    ...extractedData,
    amazonUrl: url,
  };
}

export type BatchExtractionResult = {
  url: string;
  status: "success" | "error";
  data?: ClipperExtractData & { amazonUrl: string };
  error?: string;
};

/**
 * Extract clipper data from multiple Amazon URLs in parallel batches
 */
export async function batchExtractClippers(params: {
  urls: string[];
  provider?: LLMProvider;
  batchSize?: number;
}): Promise<BatchExtractionResult[]> {
  const { urls, provider = "openai", batchSize = 3 } = params;
  const results: BatchExtractionResult[] = [];

  // Process URLs in batches
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);

    // Process batch in parallel
    const batchPromises = batch.map(async (url) => {
      try {
        const data = await extractClipperFromAmazonURL({ url, provider });
        return {
          url,
          status: "success" as const,
          data,
        };
      } catch (error) {
        return {
          url,
          status: "error" as const,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}
