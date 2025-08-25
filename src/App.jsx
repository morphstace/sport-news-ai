import { useEffect, useState } from 'react'
import { 
  Button,
  Heading,
  Flex,
  View,
  Grid,
  Divider,
  Authenticator
} from '@aws-amplify/ui-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {Amplify} from 'aws-amplify';
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from 'aws-amplify/data';
import outputs from "../amplify_outputs.json";
import HomePage from './HomePage';
import PostEditor from './PostEditor';
import PostList from './PostList';
/**
 * @type {import('aws-amplify/data').Client<ImportAttributes('../amplify/data/resource').Schema>}
 */

Amplify.configure(outputs);
const client = generateClient({
  authMode: "userPool",
});

function AuthenticatedApp({signOut}) {
  const [userprofiles, setUserProfiles] = useState([]);
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [showPostList, setShowPostList] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
   const { data: profiles } = await client.models.UserProfile.list();
   setUserProfiles(profiles);
  }

  if (showPostEditor) {
    return (
      <PostEditor
        onBack={() => setShowPostEditor(false)}
        signOut={signOut}
      />
    )
  }

  if (showPostList) {
    return (
      <PostList
        onBack={() => setShowPostList(false)}
        onCreateNew={() => {
          setShowPostList(false);
          setShowPostEditor(true);
        }}
        signOut={signOut}
      />
    )
  }

  return (
    <Flex
      className='App'
      justifyContent='center'
      alignItems="center"
      direction= "column"
      width="70%"
      margin="0 auto"
    >
      <Heading level={1}> My Profile</Heading>

      <Divider />
      {/**Sezione nagivation/actions */}
      <Flex gap="1rem" margin="1rem 0">
        <Button
          variation='primary'
          onClick={() => setShowPostEditor(true)}
        >
          Create New Post
        </Button>
        <Button
          variation="outline"
          onClick={() => setShowPostList(true)}
        >
          Manage Posts
        </Button>
      </Flex>
      <Grid
        margin="3rem 0"
        autoFlow="column"
        justifyContent="center"
        gap="2rem"
        alignContent="center"
      >
        {userprofiles.map((userprofile) => (
          <Flex
            key={userprofile.id || userprofile.email}
            direction="column"
            justifyContent="center"
            alignItems="center"
            gap="2rem"
            border="1px solid #ccc"
            padding="2rem"
            borderRadius="5%"
             className="box"
          >
            <View>
              <Heading level="3">{userprofile.name}</Heading>
            </View>
          </Flex>
        ))}
      </Grid>
      <Button onClick={signOut}>Sign Out</Button>
    </Flex>
  );
}

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  
  // Se vogliamo mostrare il login
  if (showLogin) {
    return (
      <Authenticator>
        {({ signOut, user }) => {
          return user ? (
            <AuthenticatedApp signOut={signOut} />
          ) : (
            <div>Loading login form...</div> // DEBUG: mostra qualcosa mentre carica
          );
        }}
      </Authenticator>
    );
  }

  // Homepage pubblica
  return (
      <HomePage onLoginClick={() => {
      setShowLogin(true);
    }} />
  );
}