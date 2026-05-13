import "dotenv/config";
import prisma from "../lib/prisma.js";

/**
 * Seed data modelled after the CSV dataset format:
 *   bed_capacity_dataset_01.csv → Department, Total_Beds, Free_Beds, Total_ICU_Beds, Free_ICU_Beds, …
 *
 * Each row becomes a ResourceType + Resource pair.  totalUnits maps to Total_Beds / capacity
 * and availableUnits maps to Free_Beds / free units.
 */

type ResourceStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "OCCUPIED" | "VACANT";

interface SeedItem {
  name: string;
  basePrice: number;
  description: string;
  totalUnits: number;
  availableUnits: number;
  status: ResourceStatus;
}

// ── Beds: mirrors bed_capacity_dataset_01.csv departments ──
const BEDS: SeedItem[] = [
  { name: "Emergency Department (ED)", basePrice: 4500, description: "Emergency department beds with quick-access rails and full monitoring", totalUnits: 160, availableUnits: 22, status: "OCCUPIED" },
  { name: "Trauma Center", basePrice: 5200, description: "Trauma center beds for critical injury patients", totalUnits: 125, availableUnits: 15, status: "OCCUPIED" },
  { name: "General Surgery", basePrice: 3000, description: "General surgery ward beds for pre and post-operative care", totalUnits: 200, availableUnits: 35, status: "OCCUPIED" },
  { name: "Cardiac Surgery", basePrice: 5500, description: "Cardiac surgery department with ICU-grade monitoring", totalUnits: 135, availableUnits: 25, status: "OCCUPIED" },
  { name: "Neurosurgery", basePrice: 6000, description: "Neurosurgery department beds with neuro-monitoring equipment", totalUnits: 118, availableUnits: 18, status: "OCCUPIED" },
  { name: "Orthopedic Surgery", basePrice: 3200, description: "Orthopedic ward beds with traction and mobility aids", totalUnits: 160, availableUnits: 28, status: "OCCUPIED" },
  { name: "Internal Medicine", basePrice: 2000, description: "Internal medicine ward for chronic and acute medical conditions", totalUnits: 255, availableUnits: 48, status: "OCCUPIED" },
  { name: "Cardiology", basePrice: 4800, description: "Cardiology department beds with continuous cardiac monitoring", totalUnits: 152, availableUnits: 24, status: "OCCUPIED" },
  { name: "Neurology", basePrice: 4200, description: "Neurology ward beds with EEG and neuro assessment tools", totalUnits: 130, availableUnits: 20, status: "OCCUPIED" },
  { name: "Pediatrics General", basePrice: 2200, description: "Pediatric general ward for children ages 0–18", totalUnits: 180, availableUnits: 32, status: "OCCUPIED" },
  { name: "Pediatric ICU (PICU)", basePrice: 7500, description: "Pediatric intensive care beds with full life-support systems", totalUnits: 45, availableUnits: 7, status: "OCCUPIED" },
  { name: "Neonatal ICU (NICU)", basePrice: 8000, description: "Neonatal ICU cribs for premature and critically ill newborns", totalUnits: 60, availableUnits: 10, status: "OCCUPIED" },
  { name: "Obstetrics & Gynecology (O&G)", basePrice: 2800, description: "Maternity and gynecology beds for labor, delivery and recovery", totalUnits: 165, availableUnits: 30, status: "OCCUPIED" },
  { name: "Oncology", basePrice: 5000, description: "Oncology ward beds for cancer treatment and chemotherapy patients", totalUnits: 158, availableUnits: 26, status: "OCCUPIED" },
  { name: "Burn Unit", basePrice: 6500, description: "Specialized burn unit with isolation and sterile environment", totalUnits: 60, availableUnits: 7, status: "OCCUPIED" },
  { name: "Transplant Unit", basePrice: 9000, description: "Transplant unit beds with immunosuppression monitoring", totalUnits: 70, availableUnits: 9, status: "OCCUPIED" },
  { name: "Rehabilitation Unit", basePrice: 1800, description: "Rehabilitation beds for physical therapy and recovery programs", totalUnits: 160, availableUnits: 50, status: "VACANT" },
  { name: "Psychiatry", basePrice: 1500, description: "Psychiatric ward beds for mental health inpatient care", totalUnits: 200, availableUnits: 50, status: "VACANT" },
  { name: "Palliative Care", basePrice: 1200, description: "Palliative care beds for end-of-life comfort and pain management", totalUnits: 90, availableUnits: 30, status: "VACANT" },
  { name: "Infectious Diseases", basePrice: 3800, description: "Negative-pressure isolation beds for infectious disease control", totalUnits: 102, availableUnits: 16, status: "OCCUPIED" },
];

// ── Machines: medical equipment inventory ──
const MACHINES: SeedItem[] = [
  { name: "MRI Scanner", basePrice: 8500, description: "3T MRI scanner for advanced cross-sectional imaging diagnostics", totalUnits: 4, availableUnits: 2, status: "ACTIVE" },
  { name: "CT Scanner", basePrice: 5200, description: "128-slice CT scanner for rapid whole-body imaging", totalUnits: 6, availableUnits: 3, status: "ACTIVE" },
  { name: "X-Ray Machine", basePrice: 1500, description: "Digital X-ray unit for standard radiography", totalUnits: 12, availableUnits: 8, status: "ACTIVE" },
  { name: "Ultrasound", basePrice: 2000, description: "Portable ultrasound system for bedside and prenatal diagnostics", totalUnits: 10, availableUnits: 6, status: "ACTIVE" },
  { name: "Ventilator", basePrice: 3500, description: "ICU-grade mechanical ventilator with adaptive modes", totalUnits: 30, availableUnits: 8, status: "OCCUPIED" },
  { name: "ECG Machine", basePrice: 800, description: "12-lead ECG for cardiac rhythm monitoring", totalUnits: 20, availableUnits: 14, status: "ACTIVE" },
  { name: "Defibrillator", basePrice: 2500, description: "Automated external defibrillator for emergency resuscitation", totalUnits: 15, availableUnits: 12, status: "ACTIVE" },
  { name: "Dialysis Machine", basePrice: 6000, description: "Hemodialysis machine for renal replacement therapy", totalUnits: 8, availableUnits: 2, status: "OCCUPIED" },
  { name: "Infusion Pump", basePrice: 600, description: "IV infusion pump for precise medication delivery", totalUnits: 50, availableUnits: 35, status: "ACTIVE" },
  { name: "Anesthesia Machine", basePrice: 7500, description: "Modern anesthesia workstation with integrated monitoring", totalUnits: 10, availableUnits: 5, status: "ACTIVE" },
  { name: "C-Arm Fluoroscopy", basePrice: 9500, description: "Mobile C-arm for real-time intraoperative imaging", totalUnits: 3, availableUnits: 1, status: "OCCUPIED" },
  { name: "PET Scanner", basePrice: 12000, description: "PET-CT combo scanner for oncology and metabolic imaging", totalUnits: 2, availableUnits: 1, status: "ACTIVE" },
  { name: "Mammography Unit", basePrice: 4000, description: "Digital mammography unit for breast cancer screening", totalUnits: 3, availableUnits: 2, status: "ACTIVE" },
  { name: "Blood Gas Analyzer", basePrice: 1200, description: "Point-of-care blood gas and electrolyte analyzer", totalUnits: 8, availableUnits: 5, status: "ACTIVE" },
  { name: "Patient Monitor", basePrice: 900, description: "Multi-parameter bedside patient monitor (SpO2, ECG, BP, Temp)", totalUnits: 60, availableUnits: 20, status: "OCCUPIED" },
];

async function seedCategory(items: SeedItem[], category: "BED" | "MACHINE") {
  for (const item of items) {
    let rt = await prisma.resourceType.findFirst({
      where: { name: item.name, category },
    });

    if (!rt) {
      rt = await prisma.resourceType.create({
        data: {
          name: item.name,
          category,
          basePrice: item.basePrice,
          description: item.description,
        },
      });
    } else {
      await prisma.resourceType.update({
        where: { id: rt.id },
        data: { basePrice: item.basePrice, description: item.description },
      });
    }

    await prisma.resource.create({
      data: {
        resourceTypeId: rt.id,
        totalUnits: item.totalUnits,
        availableUnits: item.availableUnits,
        status: item.status,
      },
    });

    const occupancy = item.totalUnits - item.availableUnits;
    console.log(`  ✓ ${category} → ${item.name}  [${occupancy}/${item.totalUnits} occupied]  ${item.status}`);
  }
}

async function main() {
  console.log("\n🏥 Seeding hospital resources (CSV-aligned data)...\n");

  console.log("── Beds (20 departments) ──");
  await seedCategory(BEDS, "BED");

  console.log("\n── Machines (15 types) ──");
  await seedCategory(MACHINES, "MACHINE");

  console.log(`\n✅ Successfully seeded ${BEDS.length} bed departments and ${MACHINES.length} machine types.\n`);
}

main()
  .catch((error) => {
    console.error("Failed to seed resources:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
