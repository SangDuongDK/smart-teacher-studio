import { z } from "zod";

export const QuestionTypeEnum = z.enum([
  "MULTIPLE_CHOICE",
  "FILL_IN_BLANK",
  "MATCHING",
  "REORDER_SENTENCE",
  "TRUE_FALSE",
]);

export const DifficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);

export const MultipleChoiceSchema = z.object({
  type: z.literal("MULTIPLE_CHOICE"),
  prompt: z.string(),
  difficulty: DifficultyEnum,
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  explanation: z.string(),
});

export const FillInBlankSchema = z.object({
  type: z.literal("FILL_IN_BLANK"),
  prompt: z.string(),
  difficulty: DifficultyEnum,
  hint: z.string().optional(),
  correctAnswer: z.string(),
  explanation: z.string(),
});

export const MatchingSchema = z.object({
  type: z.literal("MATCHING"),
  prompt: z.string(),
  difficulty: DifficultyEnum,
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).min(3),
  explanation: z.string(),
});

export const SentenceReorderSchema = z.object({
  type: z.literal("REORDER_SENTENCE"),
  prompt: z.string(),
  difficulty: DifficultyEnum,
  shuffledWords: z.array(z.string()).min(3),
  correctAnswer: z.string(),
  explanation: z.string(),
});

export const TrueFalseSchema = z.object({
  type: z.literal("TRUE_FALSE"),
  context: z.string().optional(),
  prompt: z.string(),
  difficulty: DifficultyEnum,
  correctAnswer: z.boolean(),
  explanation: z.string(),
});

export const ExerciseItemSchema = z.discriminatedUnion("type", [
  MultipleChoiceSchema,
  FillInBlankSchema,
  MatchingSchema,
  SentenceReorderSchema,
  TrueFalseSchema,
]);

export const ExerciseResponseSchema = z.object({
  grade: z.number().int().min(1).max(9),
  topic: z.string(),
  exercises: z.array(ExerciseItemSchema),
});

export type ExerciseResponseDtoType = z.infer<typeof ExerciseResponseSchema>;
export type ExerciseItemType = z.infer<typeof ExerciseItemSchema>;