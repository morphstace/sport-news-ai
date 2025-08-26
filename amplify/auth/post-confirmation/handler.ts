import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { type Schema } from "../../data/resource";
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';

Amplify.configure({
    API: {
        GraphQL: {
            endpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT!,
            region: process.env.AWS_REGION!,
            defaultAuthMode: "iam",
        },
    },
},
{
    Auth: {
        credentialsProvider: {
            getCredentialsAndIdentityId: async () => ({
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                    sessionToken: process.env.AWS_SESSION_TOKEN!,
                },
            }),
            clearCredentialsAndIdentityId: () => {
                /* noop */
            },
        },
    },
}
);

const client = generateClient<Schema>({
    authMode: 'iam',
});

export const handler: PostConfirmationTriggerHandler = async (event) => {
    const { userAttributes } = event.request;
    
    const firstName = userAttributes.given_name || '';
    const lastName = userAttributes.family_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    try {
        const result = await client.models.UserProfile.create({
            email: userAttributes.email,
            name: fullName || userAttributes.email,
            firstName: firstName,
            lastName: lastName,
            profileOwner: `${userAttributes.sub}::${event.userName}`,
        });
        
        console.log('User profile created successfully:', {
            email: userAttributes.email,
            name: fullName,
            firstName,
            lastName,
            result: result.data
        });
        
    } catch (error) {
        console.error('Error creating user profile:', error);
    }
    
    return event;
};