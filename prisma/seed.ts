import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** Fixed so the landing page can always link to a working card. */
const DEMO_CODE = "DEMO247";

/**
 * The demo guest has no real photograph, so the slot is filled with an honest
 * placeholder rather than a stock face — it shows hosts what the frame is for.
 */
const PLACEHOLDER = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#211913"/>
  <g fill="none" stroke="#C79A3F" stroke-width="2" opacity="0.45">
    <path d="M0 300h800M400 0v600"/>
    <rect x="60" y="60" width="680" height="480"/>
  </g>
  <text x="400" y="290" text-anchor="middle" fill="#FAF7F0" font-family="Georgia, serif" font-size="34" font-style="italic">Your photo with the hosts</text>
  <text x="400" y="335" text-anchor="middle" fill="#C79A3F" font-family="monospace" font-size="16" letter-spacing="6">GOES HERE</text>
</svg>`;

async function main() {
  const uploads = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploads, { recursive: true });
  await writeFile(path.join(uploads, "demo-photo.svg"), PLACEHOLDER, "utf8");

  await db.guest.deleteMany({ where: { code: DEMO_CODE } });
  await db.event.deleteMany({ where: { title: "Megersa & Sara — Wedding" } });

  const event = await db.event.create({
    data: {
      title: "Megersa & Sara — Wedding",
      kind: "WEDDING",
      hostNames: "Megersa & Sara",
      eventDate: new Date("2026-09-12T00:00:00Z"),
      venue: "Sheraton Addis, Lalibela Hall",
      defaultMessage:
        "Thank you so much for celebrating this special day with us. Your love and support carried us here, and having you in the room means everything.",
    },
  });

  const guests: Array<{
    code: string;
    name: string;
    honorific?: string;
    tableName: string;
    message?: string;
    photoUrl?: string;
  }> = [
    {
      code: DEMO_CODE,
      name: "Bekele Alemu",
      honorific: "Ato",
      tableName: "Table 4",
      photoUrl: "/uploads/demo-photo.svg",
      message:
        "You have been in our corner since the very first day, Bekele. Thank you for standing with us again today — this table would not be the same without you.",
    },
    { code: "HANNA24", name: "Hanna Girma", honorific: "Woizero", tableName: "Table 4" },
    { code: "YONAS37", name: "Yonas Tesfaye", honorific: "Dr.", tableName: "Table 7" },
    { code: "MERON42", name: "Meron Haile", tableName: "Table 7" },
    { code: "TADE289", name: "Tadesse Bekele", honorific: "Ato", tableName: "Table 2" },
    { code: "RAHEL46", name: "Rahel Wolde", tableName: "Table 2" },
  ];

  for (const guest of guests) {
    await db.guest.upsert({
      where: { code: guest.code },
      update: {},
      create: { ...guest, eventId: event.id },
    });
  }

  console.log(`Seeded "${event.title}" with ${guests.length} guests.`);
  console.log(`Demo guest page: /g/${DEMO_CODE}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
