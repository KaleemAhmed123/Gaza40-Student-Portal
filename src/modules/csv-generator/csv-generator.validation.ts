import { z } from "zod";
import { DATASET_COLUMNS } from "./csv-column-definitions";

// ─── Date range field options per dataset ────────────────────────────────────

const STUDENT_DATE_FIELDS   = ["studentSignupDate", "offerCreatedAt"] as const;
const MENTOR_DATE_FIELDS    = ["mentorSignupDate",  "offerCreatedAt"] as const;
const RA_DATE_FIELDS        = ["regionalAdminSignupDate", "offerCreatedAt"] as const;

// ─── Per-filter schemas ───────────────────────────────────────────────────────

const studentFiltersSchema = z.object({
  regionId:           z.string().optional(),
  universityId:       z.string().optional(),
  scholarshipName:    z.string().optional(),
  financialGapExists: z.boolean().optional(),
  financialGapMin:    z.number().optional(),
  financialGapMax:    z.number().optional(),
  approvedOffer:      z.boolean().optional(),
  activeOffer:        z.boolean().optional(),
}).optional();

const mentorFiltersSchema = z.object({
  regionId:     z.string().optional(),
  universityId: z.string().optional(),
  approvedOffer:z.boolean().optional(),
  activeOffer:  z.boolean().optional(),
}).optional();

const regionalAdminFiltersSchema = z.object({
  regionId:           z.string().optional(),
  universityId:       z.string().optional(),
  financialGapExists: z.boolean().optional(),
  financialGapMin:    z.number().optional(),
  financialGapMax:    z.number().optional(),
  approvedOffer:      z.boolean().optional(),
  activeOffer:        z.boolean().optional(),
}).optional();

// ─── 90-day range guard ───────────────────────────────────────────────────────

const MAX_DATE_RANGE_DAYS = 90;

function withinMaxRange(from: Date, to: Date): boolean {
  const diffMs = to.getTime() - from.getTime();
  return diffMs >= 0 && diffMs <= MAX_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000;
}

// ─── Column key validators per dataset ───────────────────────────────────────

function buildColumnSchema(dataset: keyof typeof DATASET_COLUMNS) {
  const keys = Object.keys(DATASET_COLUMNS[dataset]);
  return z
    .array(z.string().refine((k) => keys.includes(k), { message: `Invalid column key for dataset "${dataset}"` }))
    .min(1, "Select at least one column");
}

// ─── Per-dataset body types ───────────────────────────────────────────────────

export type StudentCsvBody = {
  dataset:        "students";
  dateRangeField: typeof STUDENT_DATE_FIELDS[number];
  dateRangeFrom:  Date;
  dateRangeTo:    Date;
  columns:        string[];
  filters?:       z.infer<typeof studentFiltersSchema>;
};

export type MentorCsvBody = {
  dataset:        "mentors";
  dateRangeField: typeof MENTOR_DATE_FIELDS[number];
  dateRangeFrom:  Date;
  dateRangeTo:    Date;
  columns:        string[];
  filters?:       z.infer<typeof mentorFiltersSchema>;
};

export type RegionalAdminCsvBody = {
  dataset:        "regional_admins";
  dateRangeField: typeof RA_DATE_FIELDS[number];
  dateRangeFrom:  Date;
  dateRangeTo:    Date;
  columns:        string[];
  filters?:       z.infer<typeof regionalAdminFiltersSchema>;
};

export type GenerateCsvBody = StudentCsvBody | MentorCsvBody | RegionalAdminCsvBody;

// ─── Per-dataset Zod schemas ──────────────────────────────────────────────────
// Note: ZodDiscriminatedUnion does not support ZodEffects (refined schemas),
// so we validate date ranges manually in the service layer after parsing.

export const studentBodySchema = z.object({
  dataset:        z.literal("students"),
  dateRangeField: z.enum(STUDENT_DATE_FIELDS),
  dateRangeFrom:  z.coerce.date(),
  dateRangeTo:    z.coerce.date(),
  columns:        buildColumnSchema("students"),
  filters:        studentFiltersSchema,
});

export const mentorBodySchema = z.object({
  dataset:        z.literal("mentors"),
  dateRangeField: z.enum(MENTOR_DATE_FIELDS),
  dateRangeFrom:  z.coerce.date(),
  dateRangeTo:    z.coerce.date(),
  columns:        buildColumnSchema("mentors"),
  filters:        mentorFiltersSchema,
});

export const regionalAdminBodySchema = z.object({
  dataset:        z.literal("regional_admins"),
  dateRangeField: z.enum(RA_DATE_FIELDS),
  dateRangeFrom:  z.coerce.date(),
  dateRangeTo:    z.coerce.date(),
  columns:        buildColumnSchema("regional_admins"),
  filters:        regionalAdminFiltersSchema,
});

/** Discriminated union on `dataset` field */
export const generateCsvBodySchema = z.discriminatedUnion("dataset", [
  studentBodySchema,
  mentorBodySchema,
  regionalAdminBodySchema,
]);

/**
 * Call after Zod parse to enforce the 90-day date range.
 * Kept separate because ZodDiscriminatedUnion can't be refined.
 */
export function assertDateRange(body: GenerateCsvBody): void {
  if (!withinMaxRange(body.dateRangeFrom, body.dateRangeTo)) {
    throw new Error(`Date range must not exceed ${MAX_DATE_RANGE_DAYS} days`);
  }
}

/** List / history query */
export const listCsvJobsQuerySchema = z.object({
  page:     z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
});

export type ListCsvJobsQuery = z.infer<typeof listCsvJobsQuerySchema>;
