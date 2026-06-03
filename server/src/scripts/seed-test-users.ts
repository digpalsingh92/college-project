import "dotenv/config";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import prisma from "../lib/prisma.js";
import { DayOfWeek } from "../../generated/prisma/enums.js";

async function main() {
  console.log("🌱 Seeding test doctors and patients...");

  const plainPassword = "Password123";
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const testDoctors = [
    {
      name: "Dr. John Watson",
      email: "watson@mediso.com",
      role: "doctor" as const,
      specialization: "Cardiologist",
      experience: 12,
      consultationFee: 500,
    },
    {
      name: "Dr. Sarah Jenkins",
      email: "jenkins@mediso.com",
      role: "doctor" as const,
      specialization: "Dermatologist",
      experience: 8,
      consultationFee: 400,
    },
    {
      name: "Dr. Charles Xavier",
      email: "xavier@mediso.com",
      role: "doctor" as const,
      specialization: "Neurologist",
      experience: 20,
      consultationFee: 800,
    },
    {
      name: "Dr. Gregory House",
      email: "house@mediso.com",
      role: "doctor" as const,
      specialization: "Gastroenterologist",
      experience: 15,
      consultationFee: 600,
    },
    {
      name: "Dr. Emily Vance",
      email: "vance@mediso.com",
      role: "doctor" as const,
      specialization: "Ophthalmologist",
      experience: 14,
      consultationFee: 700,
    },
    {
      name: "Dr. Arthur Dent",
      email: "dent@mediso.com",
      role: "doctor" as const,
      specialization: "Orthopedic Surgeon",
      experience: 11,
      consultationFee: 550,
    },
  ];

  const testPatients = [
    {
      name: "Alice Smith",
      email: "alice.smith@gmail.com",
      role: "patient" as const,
      age: 28,
    },
    {
      name: "Bob Jones",
      email: "bob.jones@gmail.com",
      role: "patient" as const,
      age: 35,
    },
    {
      name: "Charlie Brown",
      email: "charlie.brown@gmail.com",
      role: "patient" as const,
      age: 42,
    },
    {
      name: "Diana Prince",
      email: "diana.prince@gmail.com",
      role: "patient" as const,
      age: 30,
    },
  ];

  const csvRows: string[][] = [
    ["Name", "Role", "Specialization/Age", "Email", "Password"],
  ];

  // 1. Seed Doctors
  for (const doc of testDoctors) {
    console.log(`Processing doctor: ${doc.name}...`);
    // Delete if existing
    const existing = await prisma.user.findUnique({
      where: { email: doc.email },
      include: { doctorProfile: true },
    });

    let userId = "";

    if (existing) {
      // Clear associated schedules/appointments/profile to avoid constraint issues, or just update
      await prisma.appointment.deleteMany({
        where: { OR: [{ doctorId: existing.id }, { patientId: existing.id }] },
      });
      await prisma.schedule.deleteMany({ where: { doctorId: existing.id } });
      await prisma.doctorUnavailability.deleteMany({ where: { doctorId: existing.id } });
      if (existing.doctorProfile) {
        await prisma.doctorProfile.delete({ where: { id: existing.doctorProfile.id } });
      }

      const updatedUser = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: doc.name,
          passwordHash,
          role: doc.role,
        },
      });
      userId = updatedUser.id;
    } else {
      const newUser = await prisma.user.create({
        data: {
          name: doc.name,
          email: doc.email,
          passwordHash,
          role: doc.role,
        },
      });
      userId = newUser.id;
    }

    // Create doctor profile
    await prisma.doctorProfile.create({
      data: {
        userId,
        specialization: doc.specialization,
        experience: doc.experience,
        consultationFee: doc.consultationFee,
      },
    });

    // Create schedule for MONDAY, WEDNESDAY, FRIDAY (9:00 AM to 5:00 PM)
    const daysToCreate: DayOfWeek[] = ["MONDAY", "WEDNESDAY", "FRIDAY"];
    for (const day of daysToCreate) {
      await prisma.schedule.create({
        data: {
          doctorId: userId,
          dayOfWeek: day,
          startTime: 9 * 60, // 540 minutes
          endTime: 17 * 60,  // 1020 minutes
          slotDurationMinutes: 30,
        },
      });
    }

    csvRows.push([
      doc.name,
      "Doctor",
      doc.specialization,
      doc.email,
      plainPassword,
    ]);
  }

  // 2. Seed Patients
  for (const pat of testPatients) {
    console.log(`Processing patient: ${pat.name}...`);
    const existing = await prisma.user.findUnique({
      where: { email: pat.email },
    });

    if (existing) {
      // Clear appointments to avoid constraint issues
      await prisma.appointment.deleteMany({
        where: { OR: [{ doctorId: existing.id }, { patientId: existing.id }] },
      });

      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: pat.name,
          passwordHash,
          role: pat.role,
          age: pat.age,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          name: pat.name,
          email: pat.email,
          passwordHash,
          role: pat.role,
          age: pat.age,
        },
      });
    }

    csvRows.push([
      pat.name,
      "Patient",
      String(pat.age),
      pat.email,
      plainPassword,
    ]);
  }

  // 3. Write CSV
  const csvContent = csvRows
    .map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const projectRoot = path.resolve("/Users/shimpysingh/Desktop/college-project");
  const csvPath = path.join(projectRoot, "test-accounts.csv");

  fs.writeFileSync(csvPath, csvContent, "utf8");
  console.log(`📊 Exported test accounts CSV to: ${csvPath}`);
  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Failed to seed test users:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
