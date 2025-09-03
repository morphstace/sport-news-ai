import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { postConfirmation } from '../auth/post-confirmation/resource';

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
      category: a.string().required(),
      tags: a.string(),
      publishedAt: a.datetime().required(),
      authorId: a.string().required(),
      imageUrl: a.string(), // Aggiungi questo campo per l'URL dell'immagine
    })
    .authorization((allow) => [
      allow.group('admins').to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['create','read','update']),
      allow.publicApiKey().to(['read'])
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});