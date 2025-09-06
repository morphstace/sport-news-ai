import { defineFunction, secret } from '@aws-amplify/backend';

export const correctTextFunction = defineFunction({
  name: 'correct-text-function',
  entry: './correctText.ts',
  environment: {
    VITE_GEMINI_API_KEY: secret('GEMINI_API_KEY')
  },
  timeoutSeconds: 60,
});

export const generateTagsFunction = defineFunction({
  name: 'generate-tags-function',
  entry: './generateTags.ts',
  environment: {
    VITE_GEMINI_API_KEY: secret('GEMINI_API_KEY')
  },
  timeoutSeconds: 60,
});

export const summarizeTextFunction = defineFunction({
  name: 'summarize-text-function',
  entry: './summarizeText.ts',
  environment: {
    VITE_GEMINI_API_KEY: secret('GEMINI_API_KEY')
  },
  timeoutSeconds: 60,
});