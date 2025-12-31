import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
// ============================================================================
// SEED DATA - Add new clippers and videos here
// ============================================================================

const CLIPPERS_DATA = [
  {
    name: "Andis 01820 Professional Fade Master Hair Clipper",
    brand: "Andis",
    model: "Master",
    description: "",
    amazonUrl:
      "https://www.amazon.com/Andis-01820-Professional-Clipper-Adjustable/dp/B0BJN9D45S",
    imageUrls: [],
  },
  {
    name: "Andis 01815 Professional Master Adjustable Blade Hair Clipper",
    brand: "Andis",
    model: "Master Adjustable",
    description: "",
    amazonUrl:
      "https://www.amazon.com/Andis-01815-Professional-Adjustable-Trimmer/dp/B0BJNTZZ9M",
    imageUrls: [],
  },
  {
    name: "Wahl Professional 5 Star Series Magic Clip Cordless Hair Clipper",
    brand: "Wahl",
    model: "Magic Clip",
    description: "",
    amazonUrl:
      "https://www.amazon.com/Wahl-Professional-5-Star-Cordless-Magic/dp/B00UK8WFQO",
    imageUrls: [],
  },
  {
    name: "Wahl Professional 5-Star Vapor Clipper with F32 Fadeout Adjustable Balding Blade",
    brand: "Wahl",
    model: "Vapor",
    description: "",
    amazonUrl:
      "https://www.amazon.com/Wahl-Professional-Operation-Adjustable-Adaptable/dp/B0DFSS6H7X",
    imageUrls: [],
  },
  {
    name: "Wahl Professional Hi-Viz Trimmer, DLC-Coated Wide T-Blade",
    brand: "Wahl",
    model: "Hi-Viz",
    description: "",
    amazonUrl:
      "https://www.amazon.com/Wahl-Professional-Star-Hi-Viz-Trimmer/dp/B0CFRFNDLP",
    imageUrls: [],
  },
  {
    name: "Andis 04780 Professional T-Outliner Beard & Hair Trimmer for Men with Carbon Steel T-Blade",
    brand: "Andis",
    model: "T-Outliner",
    description: "",
    amazonUrl:
      "https://www.amazon.com/Andis-04780-Professional-T-Outliner-Technology/dp/B0BJ15Z14D",
    imageUrls: [],
  },
  {
    name: "Andis 74055 Professional Corded/Cordless Hair & Beard Trimmer",
    brand: "Andis",
    model: "T-Outliner Cordless",
    description: "",
    amazonUrl:
      "https://www.amazon.com/Andis-74055-Professional-Cordless-T-Outliner/dp/B0BJL7W4HP",
    imageUrls: [],
  },
  {
    name: "BaBylissPRO FXONE Professional Cordless Clipper in Gold",
    brand: "BaBylissPRO",
    model: "FXOne Cordless Clipper",
    description: "",
    amazonUrl:
      "https://www.amazon.com/BaBylissPRO-FXONE-GOLDFX-Metal-Clipper/dp/B0CFS49J9B",
    imageUrls: [],
  },
  {
    name: "Andis 79160 Supra ZR II Cordless Rechargeable Hair Clipper",
    brand: "Andis",
    model: "Supra ZR II",
    description: "",
    amazonUrl:
      "https://www.amazon.com/Andis-79160-Rechargeable-Detachable-Lithium-Ion/dp/B0BZTFB8XB",
    imageUrls: [],
  },
  {
    name: "Andis 32810 Slimline Pro Cord/Cordless Beard Trimmer Lithium Ion T-Blade Trimmer",
    brand: "Andis",
    model: "Slimline Pro",
    description: "",
    amazonUrl:
      "https://www.amazon.com/Andis-32810-Slimline-Cordless-Trimmer/dp/B0BRYP4NGB",
    imageUrls: [],
  },
  {
    name: "FX+ Professional Barber Cord/Cordless Hair Trimmers",
    brand: "BaBylissPRO",
    model: "FX+ Trimmer",
    description: "",
    amazonUrl:
      "https://www.amazon.com/BaBylissPRO-GOLDFX-Metal-Lithium-Trimmer/dp/B0CFSQ6GZ7",
    imageUrls: [],
  },
];

const VIDEOS_DATA = [
  {
    videoId: "Fw0gJjoXn-4",
    title: "BARBER TUTORIAL: HOW TO DO A AMAZING HIGH TAPER 🔥🔱",
    description: "",
    thumbnailUrl: "",
    duration: "",
    channelTitle: "gamechanger",
    tags: {},
    // Reference clippers by their model names
    clipperModels: [
      "Supra ZR II",
      "Slimline Pro",
      "FXOne Cordless Clipper",
      "FX+ Trimmer",
    ],
  },
];

// ============================================================================
// SEED LOGIC
// ============================================================================

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Create clippers
  console.log("📦 Creating clippers...");
  const createdClippers = await Promise.all(
    CLIPPERS_DATA.map((clipperData) =>
      prisma.clipper.create({
        data: clipperData,
      })
    )
  );
  console.log(`✅ Created ${createdClippers.length} clippers\n`);

  // Create a map of model -> clipper ID for easy lookup
  const clipperModelMap = new Map(
    createdClippers.map((clipper: { model: string; id: string }) => [
      clipper.model,
      clipper.id,
    ])
  );

  // Create videos with clipper associations
  console.log("🎥 Creating videos...");
  for (const videoData of VIDEOS_DATA) {
    const { clipperModels, ...videoFields } = videoData;

    // Find clipper IDs by model names
    const clipperIds = clipperModels
      .map((model) => clipperModelMap.get(model))
      .filter((id): id is string => id !== undefined);

    if (clipperIds.length !== clipperModels.length) {
      console.warn(
        `⚠️  Warning: Some clipper models not found for video "${videoData.title}"`
      );
      console.warn(`   Expected: ${clipperModels.join(", ")}`);
      console.warn(
        `   Found: ${clipperIds.length}/${clipperModels.length} clippers`
      );
    }

    await prisma.video.create({
      data: {
        ...videoFields,
        clippers: {
          create: clipperIds.map((clipperId) => ({ clipperId })),
        },
      },
    });

    console.log(`  ✓ Created: "${videoData.title}"`);
  }
  console.log(`✅ Created ${VIDEOS_DATA.length} videos\n`);

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("\n❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
