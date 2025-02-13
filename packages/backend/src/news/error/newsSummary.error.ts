export class NewsSummaryException extends Error {
  private readonly error?: unknown;
  constructor(message: string, error?: unknown) {
    super(message);
    this.error = error;
  }

  getError() {
    return this.error;
  }
}

export class SummaryAPIException extends NewsSummaryException {
  constructor(message: string, error?: unknown) {
    super(`Failed to Summarize News: ${message}`, error);
  }
}

export class SummaryFieldException extends NewsSummaryException {
  constructor(message: string, error?: unknown) {
    super(`Wrong field format from clova response: ${message}`, error);
  }
}

export class SummaryJsonException extends NewsSummaryException {
  constructor(message: string, error?: unknown) {
    super(`Failed to parse clova response: ${message}`, error);
  }
}

export class TokenAPIException extends NewsSummaryException {
  constructor(message: string, error?: unknown) {
    super(`Failed to Calculate Token: ${message}`, error);
  }
}
