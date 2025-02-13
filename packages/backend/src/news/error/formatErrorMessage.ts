import { NewsSummaryException } from './newsSummary.error';

export const formatErrorMessage = (error: unknown, stockName: string) => {
  if (error instanceof NewsSummaryException) {
    return `Error processing news for ${stockName}: ${error.message}`;
  }

  return `Unknown Error processing news for ${stockName}: ${String(error)}`;
};
