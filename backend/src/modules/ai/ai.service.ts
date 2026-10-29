import { 
  Injectable, 
  InternalServerErrorException, 
  GatewayTimeoutException, 
  ServiceUnavailableException 
} from '@nestjs/common';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { K9_LESSON_SYSTEM_PROMPT } from './prompts/lesson-generator.prompt';
import { LessonPlanZodSchema, LessonPlanOutput } from './schemas/lesson-plan.schema'; 
import { ExerciseResponseSchema, ExerciseResponseDtoType } from './schemas/exercise.schema';
import { buildExercisePrompt, ExercisePromptInput } from './prompts/exercise-generator.prompt';

export interface GenerateLessonInput {
  grade: number;
  topic: string;
  skill: string;
  unit?: string;
  duration?: number;
  difficulty?: string;
  additionalRequirements?: string;
}

// 1. Schema cho Lesson Plan
const GEMINI_LESSON_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    targetGrade: { type: Type.STRING },
    cefrLevel: { type: Type.STRING, enum: ['Pre-A1', 'A1', 'A2', 'B1'] },
    audioScript: {
      type: Type.STRING,
      description:
        'The complete, highly detailed listening script/dialogue (80-140 words for Primary, 120-180 words for Secondary). Must include character names, context, and clear clues for comprehension questions. If the primary skill is not Listening, return an empty string ("").',
    },
    objectives: {
      type: Type.OBJECT,
      properties: {
        knowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        attitudes: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['knowledge', 'skills', 'attitudes'],
    },
    vocabulary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          partOfSpeech: { type: Type.STRING },
          phonetic: { type: Type.STRING },
          meaningVi: { type: Type.STRING },
          exampleSentence: { type: Type.STRING },
        },
        required: ['word', 'partOfSpeech', 'phonetic', 'meaningVi', 'exampleSentence'],
      },
    },
    grammar: {
      type: Type.OBJECT,
      properties: {
        targetStructure: { type: Type.STRING },
        formula: { type: Type.STRING },
        explanationVi: { type: Type.STRING },
        commonMistakesVi: { type: Type.STRING },
        examples: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['targetStructure', 'formula', 'explanationVi', 'examples'],
    },
    activities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stage: {
            type: Type.STRING,
            enum: ['Warm-up', 'Presentation', 'Controlled Practice', 'Production/Wrap-up'],
          },
          title: { type: Type.STRING },
          durationMinutes: { type: Type.INTEGER },
          instructionsVi: { type: Type.STRING },
          studentActions: { type: Type.STRING },
        },
        required: ['stage', 'title', 'durationMinutes', 'instructionsVi', 'studentActions'],
      },
    },
  },
  required: ['targetGrade', 'cefrLevel', 'objectives', 'vocabulary', 'grammar', 'activities'],
};

// 2. Schema cho Bài tập
const GEMINI_EXERCISE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    grade: { type: Type.INTEGER },
    topic: { type: Type.STRING },
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ['MULTIPLE_CHOICE', 'FILL_IN_BLANK', 'MATCHING', 'REORDER_SENTENCE', 'TRUE_FALSE'],
          },
          prompt: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ['EASY', 'MEDIUM', 'HARD'] },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.STRING },
          hint: { type: Type.STRING },
          pairs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                left: { type: Type.STRING },
                right: { type: Type.STRING },
              },
              required: ['left', 'right'],
            },
          },
          shuffledWords: { type: Type.ARRAY, items: { type: Type.STRING } },
          context: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ['type', 'prompt', 'difficulty', 'explanation'],
      },
    },
  },
  required: ['grade', 'topic', 'exercises'],
};

@Injectable()
export class AIService {
  private aiClient: GoogleGenAI;

  constructor() {
    this.aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async onModuleInit() {
    try {
      const pager = await this.aiClient.models.list();
      console.log('--- DANH SÁCH MODEL KHẢ DỤNG ---');
      for await (const model of pager) {
        if (model.supportedActions?.includes('generateContent')) {
          console.log(model.name);
        }
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách model:', err);
    }
  }

  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs = 25000): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new GatewayTimeoutException('Thời gian xử lý của AI vượt quá 25 giây'));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
  }

  private sanitizeLessonData(data: LessonPlanOutput): LessonPlanOutput {
    return {
      ...data,
      audioScript: data.audioScript ? data.audioScript.trim() : '',
      vocabulary: data.vocabulary.map((item) => ({
        ...item,
        word: item.word.trim(),
        meaningVi: item.meaningVi.trim(),
        phonetic: item.phonetic.startsWith('/') ? item.phonetic.trim() : `/${item.phonetic.trim()}/`,
      })),
      activities: data.activities.map((act) => ({
        ...act,
        title: act.title.trim(),
        instructionsVi: act.instructionsVi.trim(),
      })),
    };
  }

  private cleanPromptText(raw: string): string {
    if (!raw) return '';
    let cleaned = raw.trim();

    const patterns = [
      /^(choose|select|pick)\s+the\s+correct\s+(word|words|answer|answers|option|options|preposition|form|tense|letter)(\s+to\s+complete\s+the\s+sentence)?:\s*/i,
      /^(choose|select)\s+the\s+best\s+(answer|option|word):\s*/i,
      /^(complete|fill\s+in)\s+the\s+(sentence|sentences|word|words|blank|blanks|gap|gaps):\s*/i,
      /^(reorder|rearrange)\s+the\s+(words|words\s+to\s+make\s+a\s+sentence):\s*/i,
      /^(match\s+the\s+words|match\s+each\s+item):\s*/i,
    ];

    for (const p of patterns) {
      cleaned = cleaned.replace(p, '');
    }

    cleaned = cleaned.trim();
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return cleaned;
  }

  private sanitizeExerciseData(data: ExerciseResponseDtoType): ExerciseResponseDtoType {
    return {
      ...data,
      exercises: data.exercises.map((item: any) => ({
        ...item,
        prompt: this.cleanPromptText(item.prompt),
        explanation: item.explanation.trim(),
        options: item.options ? item.options.map((opt: string) => opt.trim()) : undefined,
        correctAnswer:
          typeof item.correctAnswer === 'string'
            ? item.correctAnswer.trim()
            : item.correctAnswer,
        shuffledWords: item.shuffledWords
          ? item.shuffledWords.map((word: string) => word.trim())
          : undefined,
        pairs: item.pairs
          ? item.pairs.map((pair: { left: string; right: string }) => ({
              left: pair.left.trim(),
              right: pair.right.trim(),
            }))
          : undefined,
      })),
    };
  }

  async generateLessonPlan(input: GenerateLessonInput): Promise<LessonPlanOutput> {
    const modelsToTry = [
      'models/gemini-2.5-flash',
      'models/gemini-flash-lite-latest',
      'models/gemini-3.5-flash',
      'models/gemini-3.8-flash',
    ];

    const isListening = input.skill.toLowerCase().includes('listen');
    const totalDuration = Number(input.duration) || 45;
    const diffLevel = input.difficulty || 'Intermediate';

    let difficultyGuideline = '';
    switch (diffLevel.toLowerCase()) {
      case 'easy':
      case 'beginner':
      case 'cơ bản':
        difficultyGuideline = `
- DIFFICULTY LEVEL: BASIC / EASY:
  * Vocabulary: 3-5 simple words.
  * Grammar: Short repetitive sentences.
  * Listening Script: Short simple sentences, slow pace, clear acoustic clues.`;
        break;

      case 'hard':
      case 'advanced':
      case 'nâng cao':
        difficultyGuideline = `
- DIFFICULTY LEVEL: ADVANCED / HARD:
  * Vocabulary: 6-8 richer words, descriptive adjectives.
  * Grammar: Compound and complex sentence structures with conjunctions (because, although, while).
  * Listening Script: Rapid natural pace, 8-10 dialogue turns, includes subtle details and distractors.`;
        break;

      default:
        difficultyGuideline = `
- DIFFICULTY LEVEL: INTERMEDIATE:
  * Vocabulary: 5-6 standard curriculum words with full phonetic transcription.
  * Grammar: Standard communicative structures with clear usage rules.
  * Listening Script: Balanced dialogue (6-8 turns), natural conversational flow.`;
        break;
    }

    const userMessage = `
You are an elite K-9 English pedagogical specialist. Create a complete, highly practical lesson plan adhering strictly to EVERY parameter below:

=== 1. GENERAL PARAMETERS ===
- Target Grade: Grade ${input.grade}
- Unit: ${input.unit || 'Unit 1'}
- Topic: "${input.topic}"
- Primary Skill: ${input.skill}
- Total Allocated Time: ${totalDuration} minutes
- Selected Difficulty: ${diffLevel}

=== 2. PEDAGOGICAL & DIFFICULTY RULES ===
${difficultyGuideline}

=== 3. TIME ALLOCATION RULE (STRICT MANDATORY) ===
- You must create exactly 4 stages: ['Warm-up', 'Presentation', 'Controlled Practice', 'Production/Wrap-up'].
- The sum of "durationMinutes" across all 4 activity stages MUST EQUAL EXACTLY ${totalDuration} minutes.

=== 4. SPECIFIC TEACHER REQUIREMENTS (HIGHEST PRIORITY) ===
${
  input.additionalRequirements && input.additionalRequirements.trim() !== ''
    ? `IMPORTANT: The teacher has requested the following custom instructions:
"${input.additionalRequirements}"
-> You MUST directly incorporate these specific requirements into the lesson context, vocabulary, audioScript (if Listening), and classroom activities.`
    : '- No additional requirements. Follow standard pedagogical best practices.'
}

=== 5. SPECIAL RULES FOR PRIMARY SKILL: "${input.skill}" ===
${
  isListening
    ? `CRITICAL REQUIREMENT FOR "LISTENING" SKILL:
1. FIELD "audioScript":
   - You MUST write a complete, natural listening dialogue between 2-3 characters.
   - Script Length: 80 to 120 words for Grade 1-5; 120 to 170 words for Grade 6-9.
   - FORMATTING REQUIREMENT FOR "audioScript":
     * Each dialogue turn MUST be on its own line using a newline character (\\n).
     * DO NOT collapse or join turns into a single paragraph.
     * Example:
       Nam: Hi Mai! How are you?
       Mai: I am doing well, thank you.
2. ALIGNMENT WITH ACTIVITIES:
   - In "Controlled Practice", the teacher instructions MUST directly reference this audioScript.`
    : `NON-LISTENING SKILL:
- Leave "audioScript" as an empty string ("").`
}
`.trim();

    let lastError: any = null;

    for (const [index, modelName] of modelsToTry.entries()) {
      try {
        console.log(`[Lesson Attempt ${index + 1}] Đang gọi model: ${modelName}...`);

        const response = await this.executeWithTimeout(
          this.aiClient.models.generateContent({
            model: modelName,
            contents: userMessage,
            config: {
              systemInstruction: K9_LESSON_SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: GEMINI_LESSON_SCHEMA,
              temperature: 0.25,
            },
          }),
          25000
        );

        if (response.text) {
          let rawData: any;
          try {
            rawData = JSON.parse(response.text);
          } catch {
            throw new Error('Dữ liệu trả về không phải là JSON hợp lệ');
          }

          const validated = LessonPlanZodSchema.safeParse(rawData);
          if (!validated.success) {
            console.warn(`Model ${modelName} trả về JSON sai schema:`, validated.error.format());
            throw new Error('Dữ liệu JSON sinh ra thiếu các trường bắt buộc');
          }

          return this.sanitizeLessonData(validated.data);
        }
      } catch (error: any) {
        console.warn(`Model ${modelName} gặp sự cố:`, error?.message || error);
        lastError = error;

        if (index < modelsToTry.length - 1) {
          await new Promise((res) => setTimeout(res, (index + 1) * 800));
        }
      }
    }

    if (lastError instanceof GatewayTimeoutException) {
      throw lastError;
    }

    throw new ServiceUnavailableException(
      'Tất cả các model AI hiện đang quá tải hoặc gặp sự cố, vui lòng thử lại sau giây lát.'
    );
  }

  async generateExercises(input: ExercisePromptInput): Promise<ExerciseResponseDtoType> {
    const modelsToTry = [
      'models/gemini-2.5-flash',
      'models/gemini-flash-lite-latest',
      'models/gemini-3.5-flash',
      'models/gemini-3.8-flash',
    ];

    const prompt = buildExercisePrompt(input);
    let lastError: any = null;

    for (const [index, modelName] of modelsToTry.entries()) {
      try {
        console.log(`[Exercise Attempt ${index + 1}] Đang gọi model: ${modelName}...`);

        const response = await this.executeWithTimeout(
          this.aiClient.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: GEMINI_EXERCISE_SCHEMA,
              temperature: 0.3,
            },
          }),
          25000
        );

        if (response.text) {
          let rawData: any;
          try {
            rawData = JSON.parse(response.text);
          } catch {
            throw new Error('Dữ liệu bài tập trả về không phải là JSON hợp lệ');
          }

          if (Array.isArray(rawData.exercises)) {
            rawData.exercises = rawData.exercises.map((item: any) => {
              if (item.type === 'TRUE_FALSE' && typeof item.correctAnswer === 'string') {
                item.correctAnswer = item.correctAnswer.toLowerCase() === 'true';
              }
              return item;
            });
          }

          const validated = ExerciseResponseSchema.safeParse(rawData);
          if (!validated.success) {
            console.warn(`Model ${modelName} trả về JSON sai schema bài tập:`, validated.error.format());
            throw new Error('Dữ liệu bài tập sinh ra thiếu hoặc sai định dạng');
          }

          return this.sanitizeExerciseData(validated.data);
        }
      } catch (error: any) {
        console.warn(`Model ${modelName} gặp sự cố khi tạo bài tập:`, error?.message || error);
        lastError = error;

        if (index < modelsToTry.length - 1) {
          await new Promise((res) => setTimeout(res, (index + 1) * 800));
        }
      }
    }

    if (lastError instanceof GatewayTimeoutException) {
      throw lastError;
    }

    throw new ServiceUnavailableException(
      'Tất cả các model AI hiện đang quá tải hoặc gặp sự cố, vui lòng thử lại sau giây lát.'
    );
  }
}