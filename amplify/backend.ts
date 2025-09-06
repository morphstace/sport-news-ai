import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { correctTextFunction, generateTagsFunction, summarizeTextFunction } from './functions/gemini/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  correctTextFunction,
  generateTagsFunction,
  summarizeTextFunction,
});
