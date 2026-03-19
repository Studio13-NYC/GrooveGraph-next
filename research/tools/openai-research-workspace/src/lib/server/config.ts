export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getResearchModel(): string {
  return process.env.OPENAI_RESEARCH_MODEL ?? "gpt-5.4";
}

export function getExtractionModel(): string {
  return process.env.OPENAI_RESEARCH_EXTRACTION_MODEL ?? "gpt-5.4-mini";
}
