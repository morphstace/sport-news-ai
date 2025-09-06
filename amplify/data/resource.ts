import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { correctTextFunction, generateTagsFunction, summarizeTextFunction } from '../functions/gemini/resource';

const schema = a.schema({
  UserProfile: a
    .model({
      email: a.string().required(),
      name: a.string(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      profileOwner: a.string(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn("profileOwner"),
      allow.group('admins').to(['read', 'update', 'delete']),
      allow.publicApiKey().to(['read'])
    ]),

  Post: a
    .model({
      title: a.string().required(),
      content: a.string().required(),
      tags: a.string(),
      publishedAt: a.datetime().required(),
      authorId: a.string().required(),
      imageUrl: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.group('admins').to(['create', 'read', 'update', 'delete']),
      allow.publicApiKey().to(['read'])
    ]),

  correctText: a
    .query()
    .arguments({ text: a.string().required() })
    .returns(a.string())
    .authorization(allow => [allow.group('admins')])
    .handler(a.handler.function(correctTextFunction)),

  generateTags: a
    .query()
    .arguments({
      title: a.string().required(),
      content: a.string().required()
    })
    .returns(a.string())
    .authorization(allow => [allow.group('admins')])
    .handler(a.handler.function(generateTagsFunction)),

  summarizeText: a
    .query()
    .arguments({ text: a.string().required() })
    .returns(a.string())
    .authorization(allow => [allow.group('admins')])
    .handler(a.handler.function(summarizeTextFunction)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});