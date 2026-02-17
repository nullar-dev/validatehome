import type {
  BenefitType,
  Country,
  Currency,
  EligibilityRuleType,
  ProgramStatus,
} from "@validatehome/shared";
import type {
  ExtractedBenefit,
  ExtractedEligibilityRule,
  ExtractedField,
  ExtractionResult,
  RawProgramData,
  RawSource,
} from "../types/extraction.js";
import { BaseExtractor, EXTRACTOR_VERSION, type Extractor, type ExtractorConfig } from "./base.js";

interface HtmlExtractorConfig extends ExtractorConfig {
  readonly selectors: {
    readonly name: string;
    readonly description: string;
    readonly url: string;
    readonly status: string;
    readonly budget: string;
    readonly dates: string;
    readonly jurisdiction: string;
    readonly benefits: string;
    readonly eligibility: string;
  };
}

export class HtmlExtractor extends BaseExtractor implements Extractor<RawProgramData> {
  readonly config: HtmlExtractorConfig = {
    sourceType: "webpage" as const,
    country: "US" as Country,
    selectors: {
      name: "[data-program-name], h1, .program-title",
      description: "[data-program-description], .program-description, .description",
      url: "[data-program-url], .program-link a, a.program-url",
      status: "[data-program-status], .program-status, .status-badge",
      budget: "[data-program-budget], .budget-info, .funding-details",
      dates: "[data-program-dates], .dates, .deadline-info",
      jurisdiction: "[data-jurisdiction], .jurisdiction, .state-name",
      benefits: "[data-benefits], .benefits-list, .incentives",
      eligibility: "[data-eligibility], .eligibility-requirements, .requirements",
    },
  };

  readonly version = EXTRACTOR_VERSION;

  async extract(source: RawSource): Promise<ExtractionResult<RawProgramData>> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const transformationRules: string[] = [
      "html-text-extraction",
      "status-mapping",
      "currency-normalization",
    ];

    try {
      const html = source.rawContent;
      const selectors = this.config.selectors;

      const name = this.extractField(html, selectors.name, "program name");
      if (!name.value) {
        errors.push("Could not extract program name");
      }

      const description = this.extractField(html, selectors.description, "description", true);
      const url = this.extractField(html, selectors.url, "URL", true);
      const status = this.extractStatus(html, selectors.status);
      const budget = this.extractBudget(html, selectors.budget);
      const dates = this.extractDates(html, selectors.dates);
      const jurisdiction = this.extractField(html, selectors.jurisdiction, "jurisdiction");
      const jurisdictionLevel = this.extractJurisdictionLevel(html, selectors.jurisdiction);
      const benefits = this.extractBenefits(html, selectors.benefits, source.country);
      const eligibilityRules = this.extractEligibilityRules(html, selectors.eligibility);
      const categories = this.extractCategories(html);

      const hasCriticalErrors = errors.length > 0;

      return {
        success: !hasCriticalErrors,
        data: hasCriticalErrors
          ? undefined
          : {
              sourceId: source.id,
              name,
              description,
              url,
              status,
              budgetTotal: budget.total,
              budgetRemaining: budget.remaining,
              startDate: dates.start,
              endDate: dates.end,
              applicationDeadline: dates.deadline,
              jurisdictionName: jurisdiction,
              jurisdictionLevel,
              benefits,
              eligibilityRules,
              categories,
            },
        errors,
        warnings,
        provenance: this.createProvenance(source, transformationRules),
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          ...errors,
          `Extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
        warnings,
        provenance: this.createProvenance(source, transformationRules),
      };
    }
  }

  private extractField(
    html: string,
    selector: string,
    fieldName: string,
    optional = false,
  ): ExtractedField<string | null> {
    const selectorParts = selector.split(",").map((s) => s.trim());
    let rawValue: string | null = null;
    let confidence = optional ? 0.8 : 0;

    for (const sel of selectorParts) {
      const match = this.extractBySelector(html, sel);
      if (match) {
        rawValue = match;
        confidence = optional ? 0.9 : 0.95;
        break;
      }
    }

    if (!rawValue && !optional) {
      confidence = 0;
    }

    return {
      value: rawValue,
      confidence,
      sourceSelector: selector,
      rawValue: rawValue ?? undefined,
      errors: rawValue ? undefined : [`${fieldName} not found`],
    };
  }

  private extractBySelector(html: string, selector: string): string | null {
    const cleanSelector = selector.replaceAll("]", "").replaceAll("[", "");
    const escapedSelector = this.escapeRegexSpecialChars(cleanSelector);
    const regex = new RegExp(
      `<[^>]*class=["']?[^"']*${escapedSelector}[^"']*["']?[^>]*>([^<]*)`,
      "i",
    );
    const match = regex.exec(html);
    return match?.[1] ? this.stripHtml(match[1]).trim() : null;
  }

  private escapeRegexSpecialChars(str: string): string {
    return str
      .replaceAll("\\", "\\\\")
      .replaceAll("*", "\\*")
      .replaceAll("+", "\\+")
      .replaceAll("?", "\\?")
      .replaceAll("^", "\\^")
      .replaceAll("$", "\\$")
      .replaceAll("{", "\\{")
      .replaceAll("}", "\\}")
      .replaceAll("(", "\\(")
      .replaceAll(")", "\\)")
      .replaceAll("|", "\\|")
      .replaceAll("[", "\\[")
      .replaceAll("]", "\\]");
  }

  private stripHtml(html: string): string {
    return html
      .replaceAll(/<[^>]*>/g, "")
      .replaceAll("&nbsp;", " ")
      .replaceAll("&amp;", "&")
      .trim();
  }

  private extractStatus(html: string, selector: string): ExtractedField<ProgramStatus> {
    const raw = this.extractBySelector(html, selector);
    const statusMap: Record<string, ProgramStatus> = {
      open: "open",
      active: "open",
      "coming soon": "coming_soon",
      waitlist: "waitlist",
      wait: "waitlist",
      reserved: "reserved",
      funded: "funded",
      closed: "closed",
      ended: "closed",
    };

    const normalized = raw ? (statusMap[raw.toLowerCase()] ?? "open") : "open";
    return {
      value: normalized,
      confidence: raw ? 0.85 : 0.5,
      rawValue: raw ?? undefined,
    };
  }

  private extractBudget(
    html: string,
    selector: string,
  ): {
    total: ExtractedField<string | null>;
    remaining: ExtractedField<string | null>;
  } {
    const text = this.extractBySelector(html, selector) ?? "";
    const totalPattern = /\$?([\d,]+(?:\.\d{2})?)\s*(?:total|budget|fund)/i;
    const remainingPattern = /\$?([\d,]+(?:\.\d{2})?)\s*(?:remaining|left|available)/i;
    const totalMatch = totalPattern.exec(text);
    const remainingMatch = remainingPattern.exec(text);

    return {
      total: {
        value: totalMatch?.[1] ? totalMatch[1].replaceAll(",", "") : null,
        confidence: totalMatch ? 0.8 : 0,
        rawValue: totalMatch?.[0] ?? undefined,
      },
      remaining: {
        value: remainingMatch?.[1] ? remainingMatch[1].replaceAll(",", "") : null,
        confidence: remainingMatch ? 0.8 : 0,
        rawValue: remainingMatch?.[0] ?? undefined,
      },
    };
  }

  private extractDates(
    html: string,
    selector: string,
  ): {
    start: ExtractedField<string | null>;
    end: ExtractedField<string | null>;
    deadline: ExtractedField<string | null>;
  } {
    const text = this.extractBySelector(html, selector) ?? "";
    const datePattern1 = /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/g;
    const datePattern2 = /\w+\s+\d{1,2},?\s+\d{4}/g;
    const matches1 = text.match(datePattern1) ?? [];
    const matches2 = text.match(datePattern2) ?? [];
    const matches = [...matches1, ...matches2];

    return {
      start: {
        value: matches[0] ?? null,
        confidence: matches[0] ? 0.7 : 0,
        rawValue: matches[0] ?? undefined,
      },
      end: {
        value: matches[1] ?? null,
        confidence: matches[1] ? 0.7 : 0,
        rawValue: matches[1] ?? undefined,
      },
      deadline: {
        value: matches[2] ?? matches[1] ?? null,
        confidence: matches[2] || matches[1] ? 0.7 : 0,
        rawValue: matches[2] ?? matches[1] ?? undefined,
      },
    };
  }

  private extractJurisdictionLevel(html: string, selector: string): ExtractedField {
    const text = this.extractBySelector(html, selector) ?? "";
    const levelMap: Record<string, string> = {
      federal: "federal",
      state: "state",
      province: "state",
      county: "local",
      city: "local",
      municipal: "local",
      utility: "utility",
    };

    const level = Object.keys(levelMap).find((k) => text.toLowerCase().includes(k)) ?? "state";
    const levelValue = levelMap[level] ?? "state";
    return {
      value: levelValue,
      confidence: 0.8,
      rawValue: text,
    };
  }

  private getCurrency(country: string): Currency {
    const currencyMap: Record<string, Currency> = {
      US: "USD",
      UK: "GBP",
      AU: "AUD",
      CA: "CAD",
    };
    return currencyMap[country] ?? "USD";
  }

  private parseBenefitAmount(match: string): { value: string | null; confidence: number } {
    const amountPattern = /\$?([\d,]+(?:\.\d{2})?)\s*%?/;
    const amountMatch = amountPattern.exec(match);
    return {
      value: amountMatch?.[1] ? amountMatch[1].replaceAll(",", "") : null,
      confidence: amountMatch ? 0.85 : 0,
    };
  }

  private parseBenefitPercentage(match: string): { value: number | null; confidence: number } {
    const percentPattern = /(\d+)\s*%/;
    const percentMatch = percentPattern.exec(match);
    return {
      value: percentMatch?.[1] ? Number.parseInt(percentMatch[1], 10) : null,
      confidence: percentMatch ? 0.85 : 0,
    };
  }

  private extractBenefits(html: string, selector: string, country: string): ExtractedBenefit[] {
    const text = this.extractBySelector(html, selector) ?? "";
    const currency = this.getCurrency(country);
    const benefitMatches = text.split(/[\n,]/).filter((b) => b.trim().length > 0);

    return benefitMatches.map((match) => {
      const amount = this.parseBenefitAmount(match);
      const percentage = this.parseBenefitPercentage(match);
      const typeMatch = this.inferBenefitType(match);

      return {
        type: { value: typeMatch, confidence: typeMatch ? 0.8 : 0.5 },
        maxAmount: amount,
        percentage,
        incomeCap: { value: null, confidence: 0 },
        perUnitAmount: { value: null, confidence: 0 },
        currency: { value: currency, confidence: 1 },
        description: { value: match.trim(), confidence: match.trim() ? 0.7 : 0 },
      };
    });
  }

  private inferBenefitType(text: string): BenefitType {
    const lower = text.toLowerCase();
    const taxCreditRegex = /\btax[-\s]?credit(s)?\b/i;
    if (taxCreditRegex.test(lower) || lower.includes("tax credit")) return "tax_credit";
    if (lower.includes("rebate")) return "rebate";
    if (lower.includes("grant")) return "grant";
    if (lower.includes("loan")) return "loan";
    if (lower.includes("financing")) return "financing";
    return "rebate";
  }

  private extractEligibilityRules(html: string, selector: string): ExtractedEligibilityRule[] {
    const text = this.extractBySelector(html, selector) ?? "";
    const rules: ExtractedEligibilityRule[] = [];

    const ruleMatches = text.split(/[\n,]/).filter((r) => r.trim().length > 0);

    for (const match of ruleMatches) {
      const ruleType = this.inferEligibilityType(match);
      rules.push({
        ruleType: { value: ruleType, confidence: ruleType ? 0.8 : 0.5 },
        criteria: { value: { raw: match.trim() }, confidence: 0.7 },
        description: { value: match.trim(), confidence: 0.7 },
      });
    }

    return rules;
  }

  private inferEligibilityType(text: string): EligibilityRuleType {
    const lower = text.toLowerCase();
    if (lower.includes("income")) return "income";
    if (lower.includes("property") || lower.includes("home")) return "property_type";
    if (lower.includes("location") || lower.includes("zip") || lower.includes("postal"))
      return "geo";
    if (lower.includes("equipment") || lower.includes("solar") || lower.includes("heat pump"))
      return "equipment";
    if (lower.includes("contractor") || lower.includes("installer")) return "contractor";
    return "property_type";
  }

  private extractCategories(_html: string): ExtractedField<string[]> {
    return {
      value: [],
      confidence: 0,
      rawValue: undefined,
    };
  }
}
