import type {
  BenefitType,
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
import { BaseExtractor, EXTRACTOR_VERSION, type Extractor } from "./base.js";

export class PdfExtractor extends BaseExtractor implements Extractor {
  readonly config = {
    sourceType: "pdf" as const,
    country: "US",
    encoding: "utf-8" as const,
  };

  readonly version = EXTRACTOR_VERSION;

  async extract(source: RawSource): Promise<ExtractionResult<RawProgramData>> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const transformationRules: string[] = [
      "pdf-text-extraction",
      "status-mapping",
      "currency-normalization",
    ];

    try {
      const text = await this.extractTextFromPdf(source.rawContent);

      const name = this.extractProgramName(text);
      const description = this.extractDescription(text);
      const url = this.extractUrl(text);
      const status = this.extractStatus(text);
      const budget = this.extractBudget(text);
      const dates = this.extractDates(text);
      const jurisdiction = this.extractJurisdiction(text);
      const benefits = this.extractBenefits(text, source.country);
      const eligibilityRules = this.extractEligibilityRules(text);

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
              jurisdictionName: jurisdiction.name,
              jurisdictionLevel: jurisdiction.level,
              benefits,
              eligibilityRules,
              categories: { value: [], confidence: 0 },
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
          `PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
        warnings,
        provenance: this.createProvenance(source, transformationRules),
      };
    }
  }

  private async extractTextFromPdf(rawContent: string): Promise<string> {
    if (rawContent.startsWith("%PDF")) {
      return this.parsePdfContent(rawContent);
    }
    return rawContent;
  }

  private parsePdfContent(pdfContent: string): string {
    const lines = pdfContent.split("\n");
    const textLines: string[] = [];
    let inTextBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("BT")) {
        inTextBlock = true;
        continue;
      }
      if (trimmed.startsWith("ET")) {
        inTextBlock = false;
        continue;
      }

      if (inTextBlock && trimmed.startsWith("(") && trimmed.endsWith(")")) {
        const text = trimmed.slice(1, -1);
        textLines.push(
          text.replace(/\\(\d{3})/g, (_, octal) => String.fromCodePoint(Number.parseInt(octal, 8))),
        );
      }

      if (trimmed.startsWith("Tj") || trimmed.startsWith("TJ")) {
        const match = trimmed.match(/\[(.*?)\]/);
        if (match?.[1]) {
          const parts = match[1].split(/[()]+/).filter(Boolean);
          textLines.push(...parts);
        }
      }
    }

    return textLines.join(" ").replace(/\\s+/g, " ").trim();
  }

  private extractProgramName(text: string): ExtractedField<string | null> {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    const firstMeaningfulLine = lines.find(
      (line) => line.length > 5 && !line.match(/^(program|grant|rebate|credit)/i),
    );

    return {
      value: firstMeaningfulLine?.trim() ?? null,
      confidence: firstMeaningfulLine ? 0.7 : 0,
      rawValue: firstMeaningfulLine,
    };
  }

  private extractDescription(text: string): ExtractedField<string | null> {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const description = sentences.slice(0, 2).join(". ").trim();

    return {
      value: description || null,
      confidence: description ? 0.6 : 0,
      rawValue: description,
    };
  }

  private extractUrl(text: string): ExtractedField<string | null> {
    const urlMatch = text.match(/https?:\/\/[^\s<>"]+/);

    return {
      value: urlMatch?.[0] ?? null,
      confidence: urlMatch ? 0.9 : 0,
      rawValue: urlMatch?.[0],
    };
  }

  private extractStatus(text: string): ExtractedField<ProgramStatus> {
    const lower = text.toLowerCase();
    let status: ProgramStatus = "open";
    let confidence = 0.5;

    if (lower.includes("closed") || lower.includes("expired") || lower.includes("ended")) {
      status = "closed";
      confidence = 0.8;
    } else if (lower.includes("coming soon") || lower.includes("upcoming")) {
      status = "coming_soon";
      confidence = 0.8;
    } else if (lower.includes("waitlist") || lower.includes("wait list")) {
      status = "waitlist";
      confidence = 0.8;
    } else if (lower.includes("reserved") || lower.includes("allocated")) {
      status = "reserved";
      confidence = 0.7;
    } else if (lower.includes("funded") || lower.includes("available")) {
      status = "funded";
      confidence = 0.7;
    } else if (
      lower.includes("open") ||
      lower.includes("accepting") ||
      lower.includes("available")
    ) {
      status = "open";
      confidence = 0.7;
    }

    return { value: status, confidence };
  }

  private extractBudget(text: string): {
    total: ExtractedField<string | null>;
    remaining: ExtractedField<string | null>;
  } {
    const totalPatterns = [
      /total\s*(?:budget|fund|funding|allocation)[:\s]*\$?([\d,]+(?:\.\d{2})?)/gi,
      /budget[:\s]*\$?([\d,]+(?:\.\d{2})?)/gi,
      /\$([\d,]+(?:\.\d{2})?)\s*(?:total|budget|fund)/gi,
    ];

    const remainingPatterns = [
      /remaining\s*(?:budget|fund|funding)[:\s]*\$?([\d,]+(?:\.\d{2})?)/gi,
      /available[:\s]*\$?([\d,]+(?:\.\d{2})?)/gi,
    ];

    let total: ExtractedField<string | null> = { value: null, confidence: 0 };
    let remaining: ExtractedField<string | null> = { value: null, confidence: 0 };

    for (const pattern of totalPatterns) {
      const match = pattern.exec(text);
      if (match?.[1]) {
        total = {
          value: match[1].replaceAll(",", ""),
          confidence: 0.7,
          rawValue: match[0],
        };
        break;
      }
    }

    for (const pattern of remainingPatterns) {
      const match = pattern.exec(text);
      if (match?.[1]) {
        remaining = {
          value: match[1].replaceAll(",", ""),
          confidence: 0.7,
          rawValue: match[0],
        };
        break;
      }
    }

    return { total, remaining };
  }

  private extractDates(text: string): {
    start: ExtractedField<string | null>;
    end: ExtractedField<string | null>;
    deadline: ExtractedField<string | null>;
  } {
    const datePatterns = [
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/g,
      /(\w+\s+\d{1,2},?\s+\d{4})/g,
      /(\d{4}[/-]\d{1,2}[/-]\d{1,2})/g,
    ];

    const deadlinePatterns = [
      /deadline[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,
      /application\s*deadline[:\s]*(\w+\s+\d{1,2},?\s+\d{4})/gi,
      /expires?[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,
      /close[sd]?[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,
    ];

    const dates: string[] = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    }

    let deadline: ExtractedField<string | null> = { value: null, confidence: 0 };
    for (const pattern of deadlinePatterns) {
      const match = pattern.exec(text);
      if (match?.[1]) {
        deadline = {
          value: match[1],
          confidence: 0.8,
          rawValue: match[0],
        };
        break;
      }
    }

    const firstDate = dates[0] ?? null;
    const secondDate = dates[1] ?? null;
    return {
      start: { value: firstDate, confidence: firstDate ? 0.6 : 0 },
      end: { value: secondDate, confidence: secondDate ? 0.6 : 0 },
      deadline,
    };
  }

  private extractJurisdiction(text: string): {
    name: ExtractedField<string | null>;
    level: ExtractedField<string | null>;
  } {
    const federalKeywords = ["federal", "nation", "country-wide", "us government", "uk government"];
    const stateKeywords = ["state", "province", "territory", "department of"];
    const localKeywords = ["county", "city", "municipal", "local", "utility"];

    const lower = text.toLowerCase();

    let name: ExtractedField<string | null> = { value: null, confidence: 0 };
    let level: ExtractedField<string | null> = { value: null, confidence: 0 };

    for (const kw of federalKeywords) {
      if (lower.includes(kw)) {
        name = { value: "Federal", confidence: 0.7 };
        level = { value: "federal", confidence: 0.7 };
        break;
      }
    }

    if (!name.value) {
      for (const kw of stateKeywords) {
        const match = lower.match(new RegExp(`(${kw})\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)`, "i"));
        if (match?.[2]) {
          name = { value: match[2], confidence: 0.7 };
          level = { value: "state", confidence: 0.7 };
          break;
        }
      }
    }

    if (!name.value) {
      for (const kw of localKeywords) {
        if (lower.includes(kw)) {
          name = { value: "Local", confidence: 0.5 };
          level = { value: "local", confidence: 0.5 };
          break;
        }
      }
    }

    return { name, level };
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

  private extractBenefits(text: string, country: string): ExtractedBenefit[] {
    const benefits: ExtractedBenefit[] = [];
    const currency = this.getCurrency(country);

    const amountPatterns = [
      /\$([\d,]+(?:\.\d{2})?)\s*(?:maximum|max|up to)?/gi,
      /([\d,]+(?:\.\d{2})?)\s*%?\s*(?:tax credit|rebate|grant|discount)/gi,
    ];

    const percentPattern = /(\d+)\s*%/g;

    const lines = text
      .split(/[.;\n]/)
      .filter(
        (l) =>
          l.includes("credit") ||
          l.includes("rebate") ||
          l.includes("grant") ||
          l.includes("discount"),
      );

    for (const line of lines.slice(0, 5)) {
      let amount: ExtractedField<string | null> = { value: null, confidence: 0 };
      let percentage: ExtractedField<number | null> = { value: null, confidence: 0 };

      for (const pattern of amountPatterns) {
        const match = pattern.exec(line);
        if (match?.[1]) {
          amount = {
            value: match[1].replaceAll(",", ""),
            confidence: 0.7,
            rawValue: match[0],
          };
          break;
        }
      }

      const percentMatch = percentPattern.exec(line);
      if (percentMatch?.[1]) {
        percentage = {
          value: parseInt(percentMatch[1], 10),
          confidence: 0.8,
          rawValue: percentMatch[0],
        };
      }

      const typeMatch = this.inferBenefitType(line);

      benefits.push({
        type: { value: typeMatch, confidence: typeMatch ? 0.7 : 0.5 },
        maxAmount: amount,
        percentage,
        incomeCap: { value: null, confidence: 0 },
        perUnitAmount: { value: null, confidence: 0 },
        currency: { value: currency, confidence: 1.0 },
        description: { value: line.trim(), confidence: line.trim() ? 0.6 : 0 },
      });
    }

    return benefits;
  }

  private inferBenefitType(text: string): BenefitType {
    const lower = text.toLowerCase();
    if (lower.includes("tax credit") || (lower.includes("tax") && lower.includes("credit")))
      return "tax_credit";
    if (lower.includes("rebate")) return "rebate";
    if (lower.includes("grant")) return "grant";
    if (lower.includes("loan")) return "loan";
    if (lower.includes("financing")) return "financing";
    return "rebate";
  }

  private extractEligibilityRules(text: string): ExtractedEligibilityRule[] {
    const rules: ExtractedEligibilityRule[] = [];

    const eligibilityKeywords = ["eligibility", "qualify", "requirement", "must be", "who can"];

    const lines = text
      .split(/[.;\n]/)
      .filter((l) => eligibilityKeywords.some((kw) => l.toLowerCase().includes(kw)));

    for (const line of lines.slice(0, 5)) {
      const ruleType = this.inferEligibilityType(line);

      rules.push({
        ruleType: { value: ruleType, confidence: ruleType ? 0.7 : 0.5 },
        criteria: { value: { raw: line.trim() }, confidence: 0.6 },
        description: { value: line.trim(), confidence: line.trim() ? 0.6 : 0 },
      });
    }

    return rules;
  }

  private inferEligibilityType(text: string): EligibilityRuleType {
    const lower = text.toLowerCase();
    if (lower.includes("income")) return "income";
    if (lower.includes("property") || lower.includes("homeowner") || lower.includes("residential"))
      return "property_type";
    if (
      lower.includes("location") ||
      lower.includes("zip") ||
      lower.includes("postal") ||
      lower.includes("address")
    )
      return "geo";
    if (
      lower.includes("equipment") ||
      lower.includes("solar") ||
      lower.includes("heat pump") ||
      lower.includes("install")
    )
      return "equipment";
    if (lower.includes("contractor") || lower.includes("installer") || lower.includes("certified"))
      return "contractor";
    return "property_type";
  }
}
