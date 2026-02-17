import type {
  BenefitType,
  Country,
  Currency,
  EligibilityRuleType,
  ProgramStatus,
} from "@validatehome/shared";
import type { RawProgramData, RawSource } from "../types/extraction.js";

export const FIXTURE_COUNTRIES: readonly Country[] = ["US", "UK", "AU", "CA"];

export const FIXTURE_PROGRAMS: readonly {
  country: Country;
  rawSource: RawSource;
  rawProgram: RawProgramData;
}[] = [
  {
    country: "US",
    rawSource: {
      id: "us-federal-001",
      url: "https://www.energy.gov/eere/solar-energy-heating",
      type: "webpage",
      country: "US",
      fetchedAt: new Date("2026-01-15T10:00:00Z"),
      rawContent: `
        <div class="program-title">Residential Clean Energy Credit</div>
        <div class="program-description">A federal tax credit for solar energy systems installed on your home.</div>
        <div class="program-status">open</div>
        <div class="budget-info">Total Budget: $1000000000, Remaining: $750000000</div>
        <div class="dates">Start: 01/01/2022, End: 12/31/2032</div>
        <div class="jurisdiction">Federal</div>
        <div class="benefits">30% tax credit, up to $10000</div>
        <div class="eligibility">Homeowner, Primary residence</div>
      `,
    },
    rawProgram: {
      sourceId: "us-federal-001",
      name: {
        value: "Residential Clean Energy Credit",
        confidence: 0.95,
        sourceSelector: ".program-title",
        rawValue: "Residential Clean Energy Credit",
      },
      description: {
        value: "A federal tax credit for solar energy systems installed on your home.",
        confidence: 0.9,
        sourceSelector: ".program-description",
        rawValue: "A federal tax credit for solar energy systems installed on your home.",
      },
      url: { value: null, confidence: 0, sourceSelector: ".program-link a", rawValue: undefined },
      status: {
        value: "open" as ProgramStatus,
        confidence: 0.95,
        sourceSelector: ".program-status",
        rawValue: "open",
      },
      budgetTotal: {
        value: "1000000000",
        confidence: 0.85,
        sourceSelector: ".budget-info",
        rawValue: "Total Budget: $1000000000",
      },
      budgetRemaining: {
        value: "750000000",
        confidence: 0.85,
        sourceSelector: ".budget-info",
        rawValue: "Remaining: $750000000",
      },
      startDate: {
        value: "2022-01-01",
        confidence: 0.8,
        sourceSelector: ".dates",
        rawValue: "01/01/2022",
      },
      endDate: {
        value: "2032-12-31",
        confidence: 0.8,
        sourceSelector: ".dates",
        rawValue: "12/31/2032",
      },
      applicationDeadline: { value: null, confidence: 0 },
      jurisdictionName: {
        value: "Federal",
        confidence: 0.95,
        sourceSelector: ".jurisdiction",
        rawValue: "Federal",
      },
      jurisdictionLevel: {
        value: "federal",
        confidence: 0.95,
        sourceSelector: ".jurisdiction",
        rawValue: "Federal",
      },
      benefits: [
        {
          type: { value: "tax_credit" as BenefitType, confidence: 0.9 },
          maxAmount: { value: "10000", confidence: 0.85 },
          percentage: { value: 30, confidence: 0.9 },
          incomeCap: { value: null, confidence: 0 },
          perUnitAmount: { value: null, confidence: 0 },
          currency: { value: "USD" as Currency, confidence: 1 },
          description: { value: "30% tax credit, up to $10000", confidence: 0.85 },
        },
      ],
      eligibilityRules: [
        {
          ruleType: { value: "property_type" as EligibilityRuleType, confidence: 0.85 },
          criteria: {
            value: { propertyTypes: ["single_family", "multi_family"] },
            confidence: 0.8,
          },
          description: { value: "Homeowner, Primary residence", confidence: 0.8 },
        },
      ],
      categories: { value: ["solar", "clean-energy"], confidence: 0.7 },
    },
  },
  {
    country: "UK",
    rawSource: {
      id: "uk-grant-001",
      url: "https://www.gov.uk/boiler-upgrade-scheme",
      type: "webpage",
      country: "UK",
      fetchedAt: new Date("2026-01-20T14:30:00Z"),
      rawContent: `
        <h1>Boiler Upgrade Scheme</h1>
        <p class="description">A grant towards the cost of replacing fossil fuel boilers with heat pumps.</p>
        <span class="status">open</span>
        <div class="funding">Total: £150000000, Available: £100000000</div>
        <div class="deadline">Application Deadline: 2028-03-31</div>
        <div class="region">England and Wales</div>
        <div class="incentives">£7500 grant</div>
        <div class="requirements">Owner-occupied, EPC rating D or above</div>
      `,
    },
    rawProgram: {
      sourceId: "uk-grant-001",
      name: {
        value: "Boiler Upgrade Scheme",
        confidence: 0.95,
        sourceSelector: "h1",
        rawValue: "Boiler Upgrade Scheme",
      },
      description: {
        value: "A grant towards the cost of replacing fossil fuel boilers with heat pumps.",
        confidence: 0.9,
        sourceSelector: ".description",
        rawValue: "A grant towards the cost of replacing fossil fuel boilers with heat pumps.",
      },
      url: { value: null, confidence: 0 },
      status: {
        value: "open" as ProgramStatus,
        confidence: 0.9,
        sourceSelector: ".status",
        rawValue: "open",
      },
      budgetTotal: {
        value: "150000000",
        confidence: 0.8,
        sourceSelector: ".funding",
        rawValue: "Total: £150000000",
      },
      budgetRemaining: {
        value: "100000000",
        confidence: 0.8,
        sourceSelector: ".funding",
        rawValue: "Available: £100000000",
      },
      startDate: { value: null, confidence: 0 },
      endDate: { value: null, confidence: 0 },
      applicationDeadline: {
        value: "2028-03-31",
        confidence: 0.85,
        sourceSelector: ".deadline",
        rawValue: "2028-03-31",
      },
      jurisdictionName: {
        value: "England and Wales",
        confidence: 0.9,
        sourceSelector: ".region",
        rawValue: "England and Wales",
      },
      jurisdictionLevel: {
        value: "federal",
        confidence: 0.8,
        sourceSelector: ".region",
        rawValue: "England and Wales",
      },
      benefits: [
        {
          type: { value: "grant" as BenefitType, confidence: 0.9 },
          maxAmount: { value: "7500", confidence: 0.9 },
          percentage: { value: null, confidence: 0 },
          incomeCap: { value: null, confidence: 0 },
          perUnitAmount: { value: null, confidence: 0 },
          currency: { value: "GBP" as Currency, confidence: 1 },
          description: { value: "£7500 grant", confidence: 0.9 },
        },
      ],
      eligibilityRules: [
        {
          ruleType: { value: "property_type" as EligibilityRuleType, confidence: 0.85 },
          criteria: { value: { propertyTypes: ["single_family", "rental"] }, confidence: 0.8 },
          description: { value: "Owner-occupied, EPC rating D or above", confidence: 0.8 },
        },
      ],
      categories: { value: ["heat-pump", "boiler"], confidence: 0.75 },
    },
  },
  {
    country: "AU",
    rawSource: {
      id: "au-rebate-001",
      url: "https://www.energy.nsw.gov.au/sustainable-living/energy-efficiency-and-savings-households",
      type: "webpage",
      country: "AU",
      fetchedAt: new Date("2026-02-01T09:00:00Z"),
      rawContent: `
        <h1>Solar for Schools Program</h1>
        <p>Rebate for solar panel installation on school buildings.</p>
        <span class="status">funded</span>
        <div class="budget">$50000000 total funding</div>
        <div class="closing">Closes: 30/06/2027</div>
        <div class="location">New South Wales</div>
        <div class="rebates">Up to $50000 per school</div>
        <div class="criteria">Schools, must have suitable roof space</div>
      `,
    },
    rawProgram: {
      sourceId: "au-rebate-001",
      name: { value: "Solar for Schools Program", confidence: 0.95 },
      description: {
        value: "Rebate for solar panel installation on school buildings.",
        confidence: 0.9,
      },
      url: { value: null, confidence: 0 },
      status: { value: "funded" as ProgramStatus, confidence: 0.9 },
      budgetTotal: { value: "50000000", confidence: 0.85 },
      budgetRemaining: { value: null, confidence: 0 },
      startDate: { value: null, confidence: 0 },
      endDate: { value: "2027-06-30", confidence: 0.8 },
      applicationDeadline: { value: "2027-06-30", confidence: 0.8 },
      jurisdictionName: { value: "New South Wales", confidence: 0.9 },
      jurisdictionLevel: { value: "state", confidence: 0.85 },
      benefits: [
        {
          type: { value: "rebate" as BenefitType, confidence: 0.9 },
          maxAmount: { value: "50000", confidence: 0.85 },
          percentage: { value: null, confidence: 0 },
          incomeCap: { value: null, confidence: 0 },
          perUnitAmount: { value: null, confidence: 0 },
          currency: { value: "AUD" as Currency, confidence: 1 },
          description: { value: "Up to $50000 per school", confidence: 0.85 },
        },
      ],
      eligibilityRules: [
        {
          ruleType: { value: "equipment" as EligibilityRuleType, confidence: 0.8 },
          criteria: { value: { equipment: ["solar"] }, confidence: 0.75 },
          description: { value: "Schools, must have suitable roof space", confidence: 0.8 },
        },
      ],
      categories: { value: ["solar", "schools"], confidence: 0.8 },
    },
  },
  {
    country: "CA",
    rawSource: {
      id: "ca-credit-001",
      url: "https://www.canada.ca/en/department-finance/programs/clean-technology-investment-tax-credit.html",
      type: "webpage",
      country: "CA",
      fetchedAt: new Date("2026-01-25T16:00:00Z"),
      rawContent: `
        <h1>Clean Technology Investment Tax Credit</h1>
        <p>A refundable tax credit for investments in clean energy technologies.</p>
        <div class="status-badge">open</div>
        <div class="funding-details">Budget: $2500000000 available</div>
        <div class="dates">Effective: 2023-03-28, Until: 2034</div>
        <div class="jurisdiction">Federal</div>
        <div class="incentives">30% investment tax credit</div>
        <div class="requirements">Canadian-controlled corporations, clean technology investments</div>
      `,
    },
    rawProgram: {
      sourceId: "ca-credit-001",
      name: { value: "Clean Technology Investment Tax Credit", confidence: 0.95 },
      description: {
        value: "A refundable tax credit for investments in clean energy technologies.",
        confidence: 0.9,
      },
      url: { value: null, confidence: 0 },
      status: { value: "open" as ProgramStatus, confidence: 0.9 },
      budgetTotal: { value: "2500000000", confidence: 0.85 },
      budgetRemaining: { value: null, confidence: 0 },
      startDate: { value: "2023-03-28", confidence: 0.8 },
      endDate: { value: "2034-12-31", confidence: 0.75 },
      applicationDeadline: { value: null, confidence: 0 },
      jurisdictionName: { value: "Federal", confidence: 0.95 },
      jurisdictionLevel: { value: "federal", confidence: 0.95 },
      benefits: [
        {
          type: { value: "tax_credit" as BenefitType, confidence: 0.95 },
          maxAmount: { value: null, confidence: 0 },
          percentage: { value: 30, confidence: 0.9 },
          incomeCap: { value: null, confidence: 0 },
          perUnitAmount: { value: null, confidence: 0 },
          currency: { value: "CAD" as Currency, confidence: 1 },
          description: { value: "30% investment tax credit", confidence: 0.9 },
        },
      ],
      eligibilityRules: [
        {
          ruleType: { value: "contractor" as EligibilityRuleType, confidence: 0.85 },
          criteria: { value: { entityTypes: ["corporation"] }, confidence: 0.8 },
          description: {
            value: "Canadian-controlled corporations, clean technology investments",
            confidence: 0.85,
          },
        },
      ],
      categories: { value: ["clean-technology", "investment"], confidence: 0.8 },
    },
  },
];

export function getFixtureByCountry(country: Country) {
  return FIXTURE_PROGRAMS.find((f) => f.country === country);
}

export function getAllFixtures() {
  return FIXTURE_PROGRAMS;
}
