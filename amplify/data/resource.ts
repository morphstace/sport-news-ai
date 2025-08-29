import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { postConfirmation } from '../auth/post-confirmation/resource';

const schema = a.schema({
  UserProfile: a
    .model({
      email: a.string().required(),
      name: a.string(),           // Nome completo
      firstName: a.string().required(),      // Nome
      lastName: a.string().required(),       // Cognome
      profileOwner: a.string(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn("profileOwner"),
      allow.group('admins').to(['read', 'update', 'delete']), // Aggiungi permessi admin
    ]),

  Post: a
    .model({
      title: a.string().required(),
      content: a.string().required(),
      category: a.string().required(),
      tags: a.string(),
      publishedAt: a.datetime().required(),
      authorId: a.string().required(),
    })
    .authorization((allow) => [
      allow.group('admins').to(['create', 'read', 'update', 'delete']), // Admin può tutto
      allow.authenticated().to(['read']),
      allow.publicApiKey().to(['read']) // Cambiato da allow.guest() a allow.publicApiKey()
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey", // Cambiato da "userPool" a "apiKey"
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});