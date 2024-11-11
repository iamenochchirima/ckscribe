import {
    createContext,
    useContext,
    useEffect,
    useState,
    FC,
  } from "react";
  import {
    AuthClient,
    AuthClientCreateOptions,
    AuthClientLoginOptions,
  } from "@dfinity/auth-client";
  import { canisterId as iiCanId } from "../../../declarations/internet_identity";
  import { canisterId , idlFactory} from "../../../declarations/inscribe";
  import { Actor, ActorSubclass, HttpAgent, Identity } from "@dfinity/agent";
import { network } from "./constants";
import { _SERVICE } from '../../../declarations/inscribe/inscribe.did';
  
  const localhost = "http://localhost:4943";
  const host = "https://icp0.io";
  
  interface AuthContextType {
    isAuthenticated: boolean | null;
    backendActor: ActorSubclass<_SERVICE> | null;
    identity: Identity | null;
    login: () => void;
    logout: () => void;
    blockId : bigint | null;
    setBlockId : (id : bigint) => void;
  }
  
  const AuthContext = createContext<AuthContextType | null>(null);
  
  interface DefaultOptions {
    createOptions: AuthClientCreateOptions;
    loginOptions: AuthClientLoginOptions;
  }
  
  const defaultOptions: DefaultOptions = {
    createOptions: {
      idleOptions: {
        disableIdle: true,
      },
    },
    loginOptions: {
      identityProvider:
        network === "ic"
          ? "https://identity.ic0.app/#authorize"
          : `http://${iiCanId}.localhost:4943`,
    },
  };
  
  export const useAuthClient = (options = defaultOptions) => {
    

    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [authClient, setAuthClient] = useState<AuthClient | null>(null);
    const [backendActor, setBackendActor] = useState<ActorSubclass<_SERVICE> | null>(null);
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [blockId, setBlockId] = useState<bigint | null>(null);
  
  
    useEffect(() => {
      AuthClient.create(options.createOptions).then(async (client) => {
        updateClient(client);
      });
    }, []);
  
    const login = () => {
      authClient?.login({
        ...options.loginOptions,
        onSuccess: () => {
          updateClient(authClient);
        },
      });
    };
  
    
    async function updateClient(client: AuthClient) {
      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);
  
      setAuthClient(client);
  
      const _identity = client.getIdentity();
      setIdentity(_identity);
  
      let agent = await HttpAgent.create({
        host: network === "local" ? localhost : host,
        identity: _identity,
      });
  
      if (network === "local") {
        agent.fetchRootKey();
      }
  
      const _backendActor: ActorSubclass<_SERVICE> = Actor.createActor(
        idlFactory,
        {
          agent,
          canisterId: canisterId,
        }
      );
      setBackendActor(_backendActor);
    }
  
  
  
    async function logout() {
      await authClient?.logout();
      await updateClient(authClient);
    }
  
    return {
      isAuthenticated,
      backendActor,
      login,
      logout,
      identity,
      blockId,
      setBlockId
    };
  };
  
  interface LayoutProps {
    children: React.ReactNode;
  }
  
  export const AuthProvider: FC<LayoutProps> = ({ children }) => {
    const auth = useAuthClient();
  
    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
  };
  
  export const useAuth = () => useContext(AuthContext);