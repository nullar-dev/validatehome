/**
 * Seed script for ValidateHome database.
 * Run with: pnpm db:seed
 *
 * SonarCloud suppression: seed scripts intentionally repeat similar insertion patterns
 * for data setup. This is acceptable for one-time infrastructure code.
 */
// sonarcloud-disable-next-line no-duplicated-lines
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { createDb } from "./index.js";
import { benefits } from "./schema/benefit.js";
import { productCategories, programCategories } from "./schema/category.js";
import { geoMappings } from "./schema/geo.js";
import { jurisdictions } from "./schema/jurisdiction.js";
import { programs } from "./schema/program.js";

const logInfo = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

const logError = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

function loadDotEnvIfPresent(): void {
  const candidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")];

  for (const filePath of candidates) {
    if (!existsSync(filePath)) {
      continue;
    }

    const raw = readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, equalsIndex).trim();
      if (!key || process.env[key] !== undefined) {
        continue;
      }

      const value = trimmed
        .slice(equalsIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      process.env[key] = value;
    }
  }
}

function must<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`Missing required seed value: ${label}`);
  }
  return value;
}

async function seed() {
  loadDotEnvIfPresent();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logError("DATABASE_URL environment variable is required");
    process.exitCode = 1;
    return;
  }

  const db = createDb(connectionString);
  try {
    logInfo("Seeding database...");

    const existingPrograms = await db.select({ count: sql<number>`count(*)::int` }).from(programs);
    if ((existingPrograms[0]?.count ?? 0) > 0) {
      logInfo("Seed data already present; skipping.");
      return;
    }

    await db.transaction(async (tx) => {
      // --- Jurisdictions ---
      const federalRows = await tx
        .insert(jurisdictions)
        .values([
          { name: "United States (Federal)", isoCode: "US", country: "US", level: "federal" },
          { name: "United Kingdom (Federal)", isoCode: "UK", country: "UK", level: "federal" },
          { name: "Australia (Federal)", isoCode: "AU", country: "AU", level: "federal" },
          { name: "Canada (Federal)", isoCode: "CA", country: "CA", level: "federal" },
        ])
        .returning();
      const usFederal = must(federalRows[0], "usFederal");
      const ukFederal = must(federalRows[1], "ukFederal");
      const auFederal = must(federalRows[2], "auFederal");
      const caFederal = must(federalRows[3], "caFederal");
      const usFederalId = usFederal.id;
      const ukFederalId = ukFederal.id;
      const auFederalId = auFederal.id;
      const caFederalId = caFederal.id;
      logInfo("  Created 4 federal jurisdictions");

      const stateRows = await tx
        .insert(jurisdictions)
        .values([
          {
            name: "California",
            isoCode: "US-CA",
            country: "US" as const,
            level: "state" as const,
            parentId: usFederalId,
          },
          {
            name: "New York",
            isoCode: "US-NY",
            country: "US" as const,
            level: "state" as const,
            parentId: usFederalId,
          },
          {
            name: "Massachusetts",
            isoCode: "US-MA",
            country: "US" as const,
            level: "state" as const,
            parentId: usFederalId,
          },
          {
            name: "England",
            isoCode: "UK-ENG",
            country: "UK" as const,
            level: "state" as const,
            parentId: ukFederalId,
          },
          {
            name: "New South Wales",
            isoCode: "AU-NSW",
            country: "AU" as const,
            level: "state" as const,
            parentId: auFederalId,
          },
          {
            name: "British Columbia",
            isoCode: "CA-BC",
            country: "CA" as const,
            level: "state" as const,
            parentId: caFederalId,
          },
        ])
        .returning();
      const usCa = must(stateRows[0], "usCa");
      const usNy = must(stateRows[1], "usNy");
      const usMa = must(stateRows[2], "usMa");
      const ukEng = must(stateRows[3], "ukEng");
      const auNsw = must(stateRows[4], "auNsw");
      const caBc = must(stateRows[5], "caBc");
      const usCaId = usCa.id;
      const usNyId = usNy.id;
      const usMaId = usMa.id;
      const ukEngId = ukEng.id;
      const auNswId = auNsw.id;
      const caBcId = caBc.id;
      logInfo("  Created 6 state/province jurisdictions");

      // --- Product Categories ---
      const categoryData = [
        {
          name: "Heat Pumps",
          slug: "heat-pumps",
          description: "Air source and ground source heat pumps",
          iconName: "thermometer",
        },
        {
          name: "Solar Panels",
          slug: "solar-panels",
          description: "Residential solar PV systems",
          iconName: "sun",
        },
        {
          name: "Insulation",
          slug: "insulation",
          description: "Wall, roof, and floor insulation",
          iconName: "home",
        },
        {
          name: "EV Chargers",
          slug: "ev-chargers",
          description: "Electric vehicle charging stations",
          iconName: "zap",
        },
        {
          name: "Windows & Doors",
          slug: "windows-doors",
          description: "Energy-efficient windows and doors",
          iconName: "layout",
        },
        {
          name: "Water Heaters",
          slug: "water-heaters",
          description: "Heat pump and solar water heaters",
          iconName: "droplet",
        },
        {
          name: "Smart Thermostats",
          slug: "smart-thermostats",
          description: "Connected heating controls",
          iconName: "settings",
        },
        {
          name: "Battery Storage",
          slug: "battery-storage",
          description: "Home battery storage systems",
          iconName: "battery",
        },
      ];
      const categories = await tx.insert(productCategories).values(categoryData).returning();
      logInfo("  Created 8 product categories");

      const categoryIdBySlug = (slug: string): string =>
        must(
          categories.find((c) => c.slug === slug),
          `${slug} category`,
        ).id;

      const heatPumpCatId = categoryIdBySlug("heat-pumps");
      const solarCatId = categoryIdBySlug("solar-panels");
      const insulationCatId = categoryIdBySlug("insulation");
      const evChargerCatId = categoryIdBySlug("ev-chargers");
      const waterHeaterCatId = categoryIdBySlug("water-heaters");

      // --- Programs ---
      const programData = [
        // US Federal
        {
          jurisdictionId: usFederalId,
          name: "IRS 25C Tax Credit",
          slug: "irs-25c-tax-credit",
          description:
            "Federal tax credit for energy-efficient home improvements including heat pumps, insulation, and windows.",
          status: "open" as const,
          budgetTotal: "999999999.00",
          programUrl:
            "https://www.irs.gov/credits-deductions/energy-efficient-home-improvement-credit",
          categoryIds: [heatPumpCatId, insulationCatId],
          benefitData: [
            {
              type: "tax_credit" as const,
              maxAmount: "2000.00",
              percentage: 30,
              currency: "USD" as const,
              description: "30% of cost, up to $2,000 for heat pumps",
            },
          ],
        },
        {
          jurisdictionId: usFederalId,
          name: "IRS 25D Residential Clean Energy Credit",
          slug: "irs-25d-residential-clean-energy",
          description:
            "Federal tax credit for solar panels, battery storage, and geothermal heat pumps.",
          status: "open" as const,
          programUrl: "https://www.irs.gov/credits-deductions/residential-clean-energy-credit",
          categoryIds: [solarCatId],
          benefitData: [
            {
              type: "tax_credit" as const,
              percentage: 30,
              currency: "USD" as const,
              description: "30% of cost with no cap",
            },
          ],
        },
        // US California
        {
          jurisdictionId: usCaId,
          name: "TECH Clean California",
          slug: "tech-clean-california",
          description: "California incentive program for heat pump HVAC and water heaters.",
          status: "open" as const,
          budgetTotal: "120000000.00",
          budgetRemaining: "45000000.00",
          budgetPctUsed: 62,
          programUrl: "https://www.techcleanca.com",
          categoryIds: [heatPumpCatId, waterHeaterCatId],
          benefitData: [
            {
              type: "rebate" as const,
              maxAmount: "3000.00",
              currency: "USD" as const,
              description: "Up to $3,000 for qualifying heat pump systems",
            },
          ],
        },
        // US New York
        {
          jurisdictionId: usNyId,
          name: "NY Clean Heat",
          slug: "ny-clean-heat",
          description: "New York State incentive for heat pump installations.",
          status: "open" as const,
          programUrl: "https://cleanheat.ny.gov",
          categoryIds: [heatPumpCatId],
          benefitData: [
            {
              type: "rebate" as const,
              maxAmount: "4000.00",
              currency: "USD" as const,
              description: "Up to $4,000 per ton for air-source heat pumps",
            },
          ],
        },
        // US Massachusetts
        {
          jurisdictionId: usMaId,
          name: "Mass Save Heat Pump Program",
          slug: "mass-save-heat-pump",
          description: "Massachusetts utility-sponsored rebates for heat pump installations.",
          status: "open" as const,
          programUrl: "https://www.masssave.com/residential/rebates-and-incentives/heat-pumps",
          categoryIds: [heatPumpCatId],
          benefitData: [
            {
              type: "rebate" as const,
              maxAmount: "10000.00",
              currency: "USD" as const,
              description: "Up to $10,000 for whole-home heat pump systems",
            },
          ],
        },
        // UK
        {
          jurisdictionId: ukFederalId,
          name: "Boiler Upgrade Scheme",
          slug: "boiler-upgrade-scheme",
          description: "UK government grant for replacing fossil fuel heating with heat pumps.",
          status: "open" as const,
          budgetTotal: "450000000.00",
          budgetRemaining: "180000000.00",
          budgetPctUsed: 60,
          programUrl: "https://www.gov.uk/apply-boiler-upgrade-scheme",
          categoryIds: [heatPumpCatId],
          benefitData: [
            {
              type: "grant" as const,
              maxAmount: "7500.00",
              currency: "GBP" as const,
              description: "£7,500 grant for air source heat pumps",
            },
          ],
        },
        {
          jurisdictionId: ukFederalId,
          name: "ECO4",
          slug: "eco4-scheme",
          description:
            "Energy Company Obligation scheme providing insulation and heating upgrades for low-income households.",
          status: "open" as const,
          programUrl:
            "https://www.ofgem.gov.uk/environmental-and-social-schemes/energy-company-obligation-eco",
          categoryIds: [insulationCatId, heatPumpCatId],
          benefitData: [
            {
              type: "grant" as const,
              maxAmount: "10000.00",
              currency: "GBP" as const,
              description: "Fully funded measures for eligible households",
            },
          ],
        },
        // Australia
        {
          jurisdictionId: auFederalId,
          name: "Small-scale Renewable Energy Scheme",
          slug: "small-scale-renewable-energy-scheme",
          description:
            "Federal scheme providing Small-scale Technology Certificates (STCs) for solar and heat pumps.",
          status: "open" as const,
          programUrl:
            "https://www.cleanenergyregulator.gov.au/RET/About-the-Renewable-Energy-Target/The-small-scale-renewable-energy-scheme",
          categoryIds: [solarCatId, heatPumpCatId],
          benefitData: [
            {
              type: "rebate" as const,
              maxAmount: "3000.00",
              currency: "AUD" as const,
              description: "Value varies by location and system size via STCs",
            },
          ],
        },
        {
          jurisdictionId: auNswId,
          name: "NSW Energy Savings Scheme",
          slug: "nsw-energy-savings-scheme",
          description: "NSW scheme providing certificates for energy-efficient upgrades.",
          status: "open" as const,
          programUrl:
            "https://www.energy.nsw.gov.au/nsw-plans-and-progress/regulation-and-policy/energy-security-safeguard/energy-savings-scheme",
          categoryIds: [heatPumpCatId, insulationCatId],
          benefitData: [
            {
              type: "rebate" as const,
              maxAmount: "4000.00",
              currency: "AUD" as const,
              description: "Discounts via Energy Savings Certificates",
            },
          ],
        },
        // Canada
        {
          jurisdictionId: caFederalId,
          name: "Canada Greener Homes Grant",
          slug: "canada-greener-homes-grant",
          description:
            "Federal grant for home energy retrofits including heat pumps, insulation, and solar.",
          status: "waitlist" as const,
          budgetTotal: "2600000000.00",
          budgetRemaining: "400000000.00",
          budgetPctUsed: 85,
          programUrl:
            "https://natural-resources.canada.ca/energy-efficiency/homes/canada-greener-homes-initiative/canada-greener-homes-grant/23441",
          categoryIds: [heatPumpCatId, insulationCatId, solarCatId],
          benefitData: [
            {
              type: "grant" as const,
              maxAmount: "5000.00",
              currency: "CAD" as const,
              description: "Up to $5,000 for eligible retrofits",
            },
          ],
        },
        {
          jurisdictionId: caBcId,
          name: "CleanBC Better Homes",
          slug: "cleanbc-better-homes",
          description: "BC provincial rebates for heat pumps, insulation, and EV chargers.",
          status: "open" as const,
          programUrl: "https://betterhomesbc.ca",
          categoryIds: [heatPumpCatId, insulationCatId, evChargerCatId],
          benefitData: [
            {
              type: "rebate" as const,
              maxAmount: "6000.00",
              currency: "CAD" as const,
              description: "Up to $6,000 for heat pump installations",
            },
          ],
        },
      ];

      for (const p of programData) {
        const { categoryIds, benefitData, ...programFields } = p;
        const [insertedProgram] = await tx.insert(programs).values(programFields).returning();
        const program = must(insertedProgram, `program ${programFields.slug}`);

        if (benefitData.length > 0) {
          await tx
            .insert(benefits)
            .values(benefitData.map((b) => ({ ...b, programId: program.id })));
        }

        if (categoryIds.length > 0) {
          await tx
            .insert(programCategories)
            .values(categoryIds.map((catId) => ({ programId: program.id, categoryId: catId })));
        }
      }
      logInfo(`  Created ${programData.length} programs with benefits and categories`);

      // --- Geo Mappings (top ZIP/postcodes) ---
      const geoData = [
        // US
        {
          postalCode: "90210",
          country: "US" as const,
          jurisdictionIds: [usFederalId, usCaId],
          city: "Beverly Hills",
          stateProvince: "CA",
          lat: "34.0901168",
          lng: "-118.4064506",
        },
        {
          postalCode: "10001",
          country: "US" as const,
          jurisdictionIds: [usFederalId, usNyId],
          city: "New York",
          stateProvince: "NY",
          lat: "40.7484284",
          lng: "-73.9967422",
        },
        {
          postalCode: "02101",
          country: "US" as const,
          jurisdictionIds: [usFederalId, usMaId],
          city: "Boston",
          stateProvince: "MA",
          lat: "42.3700998",
          lng: "-71.0588801",
        },
        {
          postalCode: "94102",
          country: "US" as const,
          jurisdictionIds: [usFederalId, usCaId],
          city: "San Francisco",
          stateProvince: "CA",
          lat: "37.7790262",
          lng: "-122.4199061",
        },
        {
          postalCode: "95814",
          country: "US" as const,
          jurisdictionIds: [usFederalId, usCaId],
          city: "Sacramento",
          stateProvince: "CA",
          lat: "38.5815719",
          lng: "-121.4943996",
        },
        // UK
        {
          postalCode: "SW1A 1AA",
          country: "UK" as const,
          jurisdictionIds: [ukFederalId, ukEngId],
          city: "London",
          stateProvince: "England",
          lat: "51.5014",
          lng: "-0.1419",
        },
        {
          postalCode: "M1 1AE",
          country: "UK" as const,
          jurisdictionIds: [ukFederalId, ukEngId],
          city: "Manchester",
          stateProvince: "England",
          lat: "53.4808",
          lng: "-2.2426",
        },
        {
          postalCode: "B1 1BB",
          country: "UK" as const,
          jurisdictionIds: [ukFederalId, ukEngId],
          city: "Birmingham",
          stateProvince: "England",
          lat: "52.4862",
          lng: "-1.8904",
        },
        // AU
        {
          postalCode: "2000",
          country: "AU" as const,
          jurisdictionIds: [auFederalId, auNswId],
          city: "Sydney",
          stateProvince: "NSW",
          lat: "-33.8688",
          lng: "151.2093",
        },
        {
          postalCode: "2600",
          country: "AU" as const,
          jurisdictionIds: [auFederalId],
          city: "Canberra",
          stateProvince: "ACT",
          lat: "-35.2809",
          lng: "149.1300",
        },
        // CA
        {
          postalCode: "V6B 1A1",
          country: "CA" as const,
          jurisdictionIds: [caFederalId, caBcId],
          city: "Vancouver",
          stateProvince: "BC",
          lat: "49.2827",
          lng: "-123.1207",
        },
        {
          postalCode: "K1A 0B1",
          country: "CA" as const,
          jurisdictionIds: [caFederalId],
          city: "Ottawa",
          stateProvince: "ON",
          lat: "45.4215",
          lng: "-75.6972",
        },
      ];

      await tx.insert(geoMappings).values(geoData);
      logInfo(`  Created ${geoData.length} geo mappings`);

      logInfo("Seed complete!");
    });
  } finally {
    await db.close();
  }
}

try {
  await seed();
} catch (err) {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  logError(`Seed failed: ${message}`);
  process.exitCode = 1;
}
