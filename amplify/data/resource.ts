import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

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
      allow.authenticated().to(['create', 'read']), // Tutti gli utenti autenticati possono creare e leggere
      allow.ownerDefinedIn("authorId").to(['read', 'update', 'delete']), // Il proprietario può fare tutto
      allow.group('admins').to(['create', 'read', 'update', 'delete']), // Gli admin possono fare tutto
      allow.publicApiKey().to(['read']) // Lettura pubblica
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool", // Cambiato da apiKey a userPool per le operazioni autenticate
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});