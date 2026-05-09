// prisma/seed.ts
import { PrismaClient } from "../generated/prisma/index.js";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { resolve } from "path";

const prisma = new PrismaClient();

interface CsvUnit {
  code: string;
  title: string;
}

async function parseCsv(filePath: string): Promise<CsvUnit[]> {
  const units: CsvUnit[] = [];

  const rl = createInterface({
    input:     createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let isHeader = true;
  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; } // skip ",code,title" header

    // columns: index, code, title
    const parts = line.split(",");
    const code  = parts[1]?.trim();
    const title = parts.slice(2).join(",").trim(); // title may contain commas

    if (code && title) units.push({ code, title });
  }

  return units;
}

async function main() {
  const filePath = resolve("prisma/data/all_units.csv");

  console.log("\n📂 Parsing CSV...");
  const units = await parseCsv(filePath);
  console.log(`📦 Found ${units.length} units\n`);

  const BATCH = 100;
  for (let i = 0; i < units.length; i += BATCH) {
    const chunk = units.slice(i, i + BATCH);

    await Promise.all(
      chunk.map(({ code, title }) =>
        prisma.unit.upsert({
          where:  { unitId: code },
          create: {
            unitId:           code,
            unitName:         title,
            unitDesc:         "",   // enrich later from handbook
            credits:          6,    // default Monash credit points
            semestersOffered: [],   // enrich later
          },
          update: {
            unitName: title,        // keep name fresh if CSV is updated
          },
        })
      )
    );

    console.log(`  ✅ ${Math.min(i + BATCH, units.length)} / ${units.length}`);
  }

  console.log(`\n🏁 Done — seeded ${units.length} units\n`);
}

main()
  .catch((e) => { console.error("❌", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());