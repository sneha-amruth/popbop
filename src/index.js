import { StrictMode } from "react";
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from "react-router-dom";
import './index.css';
import App from './App';
import { PlaylistProvider } from "./context/playlist-context";

const rootElement = document.getElementById("root");

ReactDOM.render(
  <StrictMode>
      <Router>
      <PlaylistProvider>
        <App />
      </PlaylistProvider>
      </Router>
  </StrictMode>,
  rootElement
);
