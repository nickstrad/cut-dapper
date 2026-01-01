import puppeteer from "puppeteer";

// Zod schema matching the Clipper model (commented out until AI extraction is re-enabled)
// const ClipperExtractSchema = z.object({
//   name: z.string().describe("Full product name of the clipper or trimmer"),
//   brand: z.string().describe("Brand name (e.g., Andis, Wahl, BaBylissPRO)"),
//   model: z.string().describe("Model name or number"),
//   description: z.string().describe("Product description"),
//   imageUrls: z
//     .array(z.string().describe("Product image URL (full URL)"))
//     .describe("Array of product image URLs"),
// });

export type ClipperExtractData = {
  name: string;
  brand: string;
  model: string;
  description: string;
  imageUrls: string[];
};

type LLMProvider = "openai" | "anthropic" | "google";

/**
 * Create LLM instance based on provider (commented out until AI extraction is re-enabled)
 */
// function createLLM(provider: LLMProvider = "openai") {
//   switch (provider) {
//     case "openai":
//       return new ChatOpenAI({
//         model: "gpt-4o-mini",
//         temperature: 0,
//         apiKey: process.env.OPENAI_API_KEY,
//       });
//     case "anthropic":
//       return new ChatAnthropic({
//         model: "claude-3-5-sonnet-20241022",
//         temperature: 0,
//         apiKey: process.env.ANTHROPIC_API_KEY,
//       });
//     case "google":
//       return new ChatGoogleGenerativeAI({
//         model: "gemini-1.5-flash",
//         temperature: 0,
//         apiKey: process.env.GOOGLE_API_KEY,
//       });
//     default:
//       throw new Error(`Unsupported LLM provider: ${provider}`);
//   }
// }

type AmazonProductData = {
  title: string;
  brand: string;
  description: string;
  features: string[];
  images: string[];
  technicalDetails: Record<string, string>;
};

/**
 * Extract structured product data from Amazon page using Puppeteer
 */
async function extractAmazonProductData(
  url: string
): Promise<AmazonProductData> {
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
      console.warn(
        "Product title selector not found, continuing with available content"
      );
    }

    // Extract structured data from specific Amazon elements
    const productData = await page.evaluate(() => {
      // Helper to safely get text content
      const getText = (selector: string): string => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() || "";
      };

      // Helper to get all text from multiple elements
      const getTexts = (selector: string): string[] => {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements)
          .map((el) => el.textContent?.trim() || "")
          .filter((text) => text.length > 0);
      };

      // Extract product title
      const title = getText("#productTitle");

      // Extract brand (multiple possible locations)
      let brand = getText("#bylineInfo");
      if (!brand) {
        brand = getText('a[id="bylineInfo"]');
      }
      if (!brand) {
        brand = getText(".po-brand .po-break-word");
      }
      // Remove "Visit the X Store" or "Brand: " prefix
      brand = brand
        .replace(/^(Visit the |Brand:\s*)/i, "")
        .replace(/\s+Store$/i, "")
        .trim();

      // Extract product description and features
      const description = getText("#productDescription p");
      const features = getTexts(
        "#feature-bullets li span.a-list-item, #feature-bullets-btf li span.a-list-item"
      );

      // Extract images
      const images: string[] = [];

      // Try main image
      const mainImg = document.querySelector<HTMLImageElement>(
        "#landingImage, #imgBlkFront"
      );
      if (mainImg?.src) {
        images.push(mainImg.src);
      }

      // Try image gallery
      const galleryImgs = document.querySelectorAll<HTMLImageElement>(
        ".imageThumbnail img, #altImages img"
      );
      galleryImgs.forEach((img) => {
        if (img.src && !images.includes(img.src)) {
          // Get high-res version by manipulating URL
          const highResUrl = img.src.replace(/\._.*?_\./, ".");
          images.push(highResUrl);
        }
      });

      // Try data attributes for high-quality images
      const imgBlock = document.querySelector("#imageBlock");
      if (imgBlock) {
        const dataAttr = imgBlock.getAttribute("data-a-dynamic-image");
        if (dataAttr) {
          try {
            const imageData = JSON.parse(dataAttr);
            Object.keys(imageData).forEach((url) => {
              if (!images.includes(url)) {
                images.push(url);
              }
            });
          } catch {
            // Ignore JSON parse errors
          }
        }
      }

      // Extract technical details
      const technicalDetails: Record<string, string> = {};
      const detailRows = document.querySelectorAll(
        "#productDetails_techSpec_section_1 tr, .prodDetTable tr"
      );
      detailRows.forEach((row) => {
        const th = row.querySelector("th");
        const td = row.querySelector("td");
        if (th && td) {
          const key = th.textContent?.trim() || "";
          const value = td.textContent?.trim() || "";
          if (key && value) {
            technicalDetails[key] = value;
          }
        }
      });

      return {
        title,
        brand,
        description,
        features,
        images,
        technicalDetails,
      };
    });

    await browser.close();
    return productData;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw new Error(
      `Failed to extract product data from ${url}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Extract clipper data from Amazon URL using web scraping
 */
export async function extractClipperFromAmazonURL(params: {
  url: string;
  provider?: LLMProvider;
}): Promise<ClipperExtractData & { amazonUrl: string }> {
  const { url } = params;

  // Extract structured product data from Amazon page
  const productData = await extractAmazonProductData(url);

  // For now, return the scraped data directly without AI processing
  // Extract model from technical details if available
  const model =
    productData.technicalDetails["Model Number"] ||
    productData.technicalDetails["Item model number"] ||
    productData.technicalDetails["Model"] ||
    "Unknown Model";

  const result = {
    name: productData.title,
    brand: productData.brand,
    model: model,
    description:
      productData.description || productData.features.slice(0, 2).join(" "),
    imageUrls: productData.images,
    amazonUrl: url,
  };

  return result;

  // TODO: Uncomment when ready to use AI for extraction
  // // Create LLM with structured output
  // const llm = createLLM(provider);
  // const structuredLLM = llm.withStructuredOutput(ClipperExtractSchema);
  //
  // // Format the extracted data for LLM processing
  // const formattedData = `
  // Product Title: ${productData.title}
  //
  // Brand: ${productData.brand}
  //
  // Description: ${productData.description}
  //
  // Features:
  // ${productData.features.map((f, i) => `${i + 1}. ${f}`).join("\n")}
  //
  // Technical Details:
  // ${Object.entries(productData.technicalDetails)
  //   .map(([key, value]) => `- ${key}: ${value}`)
  //   .join("\n")}
  //
  // Available Images: ${productData.images.length} image(s)
  // `.trim();
  //
  // // Extract clipper data using LLM
  // const extractedData = await structuredLLM.invoke([
  //   {
  //     role: "system",
  //     content: `You are an expert at extracting and structuring hair clipper/trimmer product information.
  //
  // Extract the following information from the provided Amazon product data:
  // - name: The full product title/name
  // - brand: The manufacturer/brand (e.g., Andis, Wahl, BaBylissPRO, StyleCraft)
  // - model: The model name or number (look in title, technical details, or features)
  // - description: A concise product description (1-2 sentences summarizing key features)
  // - imageUrls: Array of product image URLs (use the provided image URLs)
  //
  // IMPORTANT:
  // - Extract the EXACT brand and model from the provided data, do NOT make up or reuse data from previous requests
  // - The model number is often found in the title, technical details (like "Model Number"), or features
  // - Be precise and only use information from the current product data provided`,
  //   },
  //   {
  //     role: "user",
  //     content: `Extract clipper/trimmer product information from this Amazon product:\n\n${formattedData}`,
  //   },
  // ]);
  //
  // return {
  //   ...extractedData,
  //   amazonUrl: url,
  // };
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
