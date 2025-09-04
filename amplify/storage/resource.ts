import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'postImages',
  access: (allow) => ({
    'public/*': [
      allow.groups(['admins']).to(['read', 'write', 'delete']),
      allow.authenticated.to(['read']),
      allow.guest.to(['read'])
    ],
    'posts/*': [
      allow.groups(['admins']).to(['read', 'write', 'delete']),
      allow.authenticated.to(['read']),
      allow.guest.to(['read'])
    ]
  })
});