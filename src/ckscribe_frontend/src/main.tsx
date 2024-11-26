import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './hooks/Context';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter } from 'react-router-dom';
import type { _SERVICE as siwbService } from '../../declarations/ic_siwb_provider/ic_siwb_provider.did';
import { host } from './hooks/constants';
import { SiwbIdentityProvider } from 'ic-siwb-lasereyes-connector';
import { canisterId, idlFactory } from '../../declarations/ic_siwb_provider';
import { LaserEyesProvider, TESTNET4 } from '@omnisat/lasereyes';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LaserEyesProvider config={{ network: TESTNET4 }}>
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
    </LaserEyesProvider>
  </React.StrictMode>,
);
