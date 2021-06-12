import { StrictMode } from "react";
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from "react-router-dom";
import './index.css';
import App from './App';
import { PlaylistProvider } from "./context/playlist-context";
import { LoaderContextProvider } from "./context/loader-context";
import { AuthProvider } from "./context/auth-context";

const rootElement = document.getElementById("root");

ReactDOM.render(
  <StrictMode>
      <Router>
      <LoaderContextProvider>
      <AuthProvider>
      <PlaylistProvider>
        <App />
      </PlaylistProvider>
      </AuthProvider>
      </LoaderContextProvider>
      </Router>
  </StrictMode>,
  rootElement
);
