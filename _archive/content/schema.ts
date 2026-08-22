import { z } from "zod";

/**
 * Content schemas. Everything in src/content/ is pure JSON validated through here.
 * See GDD §18 for the full field rationale.
 */

export const ElementSchema = z.enum([
  "bloom", // noun
  "spark", // verb
  "flow", // adjective
  "echo", // particle / grammar
  "stone", // character (kanji / Thai letter)
  "light", // phrase / idiom
]);
export type Element = z.infer<typeof ElementSchema>;

export const PartOfSpeechSchema = z.enum([
  "noun",
  "verb",
  "adjective",
  "particle",
  "phrase",
  "character",
  "counter",
  "adverb",
]);

/** Element is derived from part of speech — this is what makes combos teach grammar. */
export const POS_TO_ELEMENT: Record<z.infer<typeof PartOfSpeechSchema>, Element> = {
  noun: "bloom",
  verb: "spark",
  adjective: "flow",
  particle: "echo",
  character: "stone",
  phrase: "light",
  counter: "stone",
  adverb: "flow",
};

export const ExampleSchema = z.object({
  sentence: z.string().min(1),
  reading: z.string().min(1),
  translation: z.record(z.string(), z.string()),
  audio: z.string().optional(),
  context: z.string().min(1),
});

export const KotodamaSchema = z.object({
  name: z.string().min(1),
  sprite: z.string().min(1),
  spriteEvolved: z.string().optional(),
  description: z.record(z.string(), z.string()),
  rarity: z.enum(["common", "uncommon", "rare", "legendary"]),
  habitat: z.array(z.string()).min(1),
  evolveFrom: z.string().optional(),
  evolveCondition: z
    .object({
      type: z.enum(["combo_count", "review_streak", "chapter"]),
      value: z.number().int().positive(),
    })
    .optional(),
});

export const VocabEntrySchema = z.object({
  id: z.string().min(1),
  lang: z.enum(["ja", "th"]),

  // Writing
  written: z.string().min(1),
  reading: z.string().min(1),
  romanization: z.string().min(1),

  // Meaning, keyed by the learner's native language
  meaning: z.record(z.string(), z.string()),

  // Classification
  pos: PartOfSpeechSchema,
  element: ElementSchema,
  level: z.string().min(1),
  chapter: z.number().int().nonnegative(),
  tags: z.array(z.string()),
  frequency: z.number().int().positive(),

  // Audio
  audio: z.string().min(1),
  /** Japanese: 0 = heiban, 1 = atamadaka, ... */
  pitchAccent: z.number().int().nonnegative().optional(),
  /** Thai: 0 = mid, 1 = low, 2 = falling, 3 = high, 4 = rising */
  tone: z.number().int().min(0).max(4).optional(),
  /** Thai: why this word carries this tone — the part that actually teaches. */
  toneRule: z.string().optional(),
  /** Thai: confusable neighbours, used as intelligent distractors. */
  minimalPairs: z.array(z.string()).optional(),
  /** Thai: using the wrong register is a social error, so we track it. */
  register: z.enum(["formal", "polite", "casual", "monastic"]).optional(),

  // Grammar — consumed by the combo validator
  conjugationGroup: z.string().optional(),
  particleAffinity: z.array(z.string()).optional(),
  counterWord: z.string().optional(),

  examples: z.array(ExampleSchema).min(1),
  kotodama: KotodamaSchema,

  mnemonic: z.record(z.string(), z.string()).optional(),
  strokeOrder: z.array(z.string()).optional(),

  /** Set by AI-generated content that a native speaker has not yet verified. */
  needsReview: z.boolean().optional(),
});

export type VocabEntry = z.infer<typeof VocabEntrySchema>;

export const VocabFileSchema = z.array(VocabEntrySchema);

// ── Dialogue ─────────────────────────────────────────────────────────────────

export const DialogueLineSchema = z.object({
  /** The language being learned (L2). Rendered in the main slot. */
  l2: z.string().min(1),
  /** Furigana / romanisation — shown when the player enables reading aid. */
  reading: z.string().optional(),
  /** L1 translation keyed by locale code. */
  translation: z.record(z.string(), z.string()).optional(),
  /** Optional voice file for this line. */
  audio: z.string().optional(),
  /** Vocab IDs that are new in this line — highlighted in LAVENDER_3. */
  newWordIds: z.array(z.string()).optional(),
});

export const DialogueChoiceSchema = z.object({
  /** Button label shown in the player's L1. */
  label: z.record(z.string(), z.string()),
  /** What the player "says" in L2 (shown briefly before advancing). */
  l2Response: z.string(),
  /** Node ID to jump to after this choice. */
  nextId: z.string(),
});

export const DialogueNodeSchema = z.object({
  /** Unique key within the dialogue file. */
  id: z.string().min(1),
  /** NPC that speaks — matches NPC.getNpcId(). */
  speakerNpcId: z.string().min(1),
  /** Speaker display name, keyed by locale. */
  speakerName: z.record(z.string(), z.string()),
  lines: z.array(DialogueLineSchema).min(1),
  /** Branching choices shown after the last line. */
  choices: z.array(DialogueChoiceSchema).optional(),
  /** Auto-advance to this node ID after all lines (when no choices). */
  nextId: z.string().optional(),
  /** If true, dialogue box closes after this node completes. */
  endsDialogue: z.boolean().optional().default(false),
});

export type DialogueLine = z.infer<typeof DialogueLineSchema>;
export type DialogueNode = z.infer<typeof DialogueNodeSchema>;

export const DialogueFileSchema = z.array(DialogueNodeSchema);

export function parseDialogueFile(raw: unknown, fileName: string): DialogueNode[] {
  const result = DialogueFileSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => `  · [${i.path.join(".")}] ${i.message}`)
      .join("\n");
    throw new Error(`Invalid dialogue in ${fileName}:\n${issues}`);
  }
  return result.data;
}

/**
 * Parse a content file, failing loudly with the offending entry.
 * Silent content failures are far worse than a crash at load time.
 */
export function parseVocabFile(raw: unknown, fileName: string): VocabEntry[] {
  const result = VocabFileSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => `  · [${i.path.join(".")}] ${i.message}`)
      .join("\n");
    throw new Error(`Invalid content in ${fileName}:\n${issues}`);
  }
  return result.data;
}
