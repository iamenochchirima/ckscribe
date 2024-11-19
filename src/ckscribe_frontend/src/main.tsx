import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './hooks/Context';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter } from 'react-router-dom';
import { SiwbIdentityProvider } from 'ic-use-siwb-identity';
import type { _SERVICE as siwbService } from '../../declarations/idls/ic_siwb_provider.d.ts';
import { host } from './hooks/constants';
import { canisterId, idlFactory } from '../../declarations/ic_siwb_provider';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SiwbIdentityProvider<siwbService>
      canisterId={canisterId}
      idlFactory={idlFactory}
      httpAgentOptions={{ host: host }}
    >
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <ToastContainer />
      </AuthProvider>
    </SiwbIdentityProvider>
  </React.StrictMode>,
);
