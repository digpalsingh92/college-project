import "dotenv/config";
import prisma from "../lib/prisma.js";

/**
 * Seed ResourceUnit rows for every existing Resource.
 *
 * For each Resource row:
 *   - Creates `totalUnits` ResourceUnit entries
 *   - Marks (totalUnits - availableUnits) as OCCUPIED, rest as VACANT
 *   - If the resource status is INACTIVE, marks all units isActive = false
 *   - Assigns sequential unitNumber like BED-001, MRI-001, etc.
 */

const CATEGORY_PREFIX: Record<string, string> = {
  BED: "BED",
  MACHINE: "MCH",
  OT: "OT",
  LAB: "LAB",
};

async function main() {
  console.log("\n🔧 Seeding ResourceUnit rows from existing Resources...\n");

  // Clear existing units to allow re-running
  const deletedCount = await prisma.resourceUnit.deleteMany({});
  if (deletedCount.count > 0) {
    console.log(`  🗑  Cleared ${deletedCount.count} existing ResourceUnit rows.\n`);
  }

  const resources = await prisma.resource.findMany({
    include: { resourceType: true },
    orderBy: { createdAt: "asc" },
  });

  // Track per-category counters for globally unique unit numbers
  const categoryCounters: Record<string, number> = {};

  let totalCreated = 0;

  for (const resource of resources) {
    const category = resource.resourceType.category;
    const prefix = CATEGORY_PREFIX[category] ?? category;

    if (!categoryCounters[prefix]) {
      categoryCounters[prefix] = 0;
    }

    const occupiedCount = resource.totalUnits - resource.availableUnits;
    const isResourceInactive =
      resource.status === "INACTIVE" || resource.status === "MAINTENANCE";

    const unitData = [];

    for (let i = 0; i < resource.totalUnits; i++) {
      categoryCounters[prefix]++;
      const unitNumber = `${prefix}-${String(categoryCounters[prefix]).padStart(3, "0")}`;

      const isOccupied = i < occupiedCount;

      unitData.push({
        unitNumber,
        isActive: !isResourceInactive,
        occupancyStatus: isOccupied ? ("OCCUPIED" as const) : ("VACANT" as const),
        resourceId: resource.id,
      });
    }

    if (unitData.length > 0) {
      await prisma.resourceUnit.createMany({ data: unitData });
      totalCreated += unitData.length;
      console.log(
        `  ✓ ${resource.resourceType.name} → ${unitData.length} units ` +
          `(${occupiedCount} occupied, ${resource.availableUnits} vacant` +
          `${isResourceInactive ? ", all inactive" : ""})`
      );
    }
  }

  console.log(`\n✅ Created ${totalCreated} ResourceUnit rows across ${resources.length} resources.\n`);
}

main()
  .catch((error) => {
    console.error("Failed to seed resource units:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
