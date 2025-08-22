import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'
import App from './App.jsx'
import { Authenticator } from '@aws-amplify/ui-react';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Authenticator>
      <App />
    </Authenticator>
  </React.StrictMode>
);