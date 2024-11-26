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
import { canisterId as inscribeCanisterId, idlFactory as inscribeIDL } from "../../../declarations/inscribe";
import { canisterId as ckbtcMinterCanisterId, idlFactory as ckbtcMinterIDL } from "../../../declarations/ckbtc_minter";
import { canisterId as ckbtcLedgerCanisterId, idlFactory as ckbtcLedgerIDL } from "../../../declarations/ckbtc_ledger";
import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import { host, network } from "./constants";
import { _SERVICE as InscribeSERVICE } from '../../../declarations/inscribe/inscribe.did';
import { _SERVICE as ckbtcMinterSERVICE } from '../../../declarations/ckbtc_minter/ckbtc_minter.did';
import { _SERVICE as ckbtcLedgerSERVICE } from '../../../declarations/ckbtc_ledger/ckbtc_ledger.did';
import { useSiwbIdentity } from "ic-siwb-lasereyes-connector";



interface AuthContextType {
  inscribeActor: ActorSubclass<InscribeSERVICE> | null;
  ckbtcMinterActor: ActorSubclass<ckbtcMinterSERVICE> | null;
  ckbtcLedgerActor: ActorSubclass<ckbtcLedgerSERVICE> | null;
  // login: () => void;
  // logout: () => void;
  blockId: bigint | null;
  setBlockId: (id: bigint) => void;
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

  const [inscribeActor, setInscribe] = useState<ActorSubclass<InscribeSERVICE> | null>(null);
  const [ckbtcMinterActor, setckbtcMinter] = useState<ActorSubclass<ckbtcMinterSERVICE> | null>(null);
  const [ckbtcLedgerActor, setckbtcLedger] = useState<ActorSubclass<ckbtcLedgerSERVICE> | null>(null);
  const [blockId, setBlockId] = useState<bigint | null>(null);

  const { identity } = useSiwbIdentity();


  useEffect(() => {
    if (identity) {
      updateClient();
    }
  }, [identity]);

  // const login = () => {
  //   authClient?.login({
  //     ...options.loginOptions,
  //     onSuccess: () => {
  //       updateClient(authClient);
  //     },
  //   });
  // };


  async function updateClient() {
    // const isAuthenticated = await client.isAuthenticated();
    // setIsAuthenticated(isAuthenticated);

    // setAuthClient(client);

    // const _identity = client.getIdentity();
    // setIdentity(_identity);

    console.log("Host is: ", host);

    let agent = new HttpAgent({
      host: host,
      identity: identity,
    });

    if (network === "local") {
      agent.fetchRootKey();
    }

    const _backendActor: ActorSubclass<InscribeSERVICE> = Actor.createActor(
      inscribeIDL,
      {
        agent,
        canisterId: inscribeCanisterId,
      }
    );
    setInscribe(_backendActor);

    const _ckbtcMinterActor: ActorSubclass<ckbtcMinterSERVICE> = Actor.createActor(
      ckbtcMinterIDL,
      {
        agent,
        canisterId: ckbtcMinterCanisterId,
      }
    );
    setckbtcMinter(_ckbtcMinterActor);

    const _ckbtcLedgerActor: ActorSubclass<ckbtcLedgerSERVICE> = Actor.createActor(
      ckbtcLedgerIDL,
      {
        agent,
        canisterId: ckbtcLedgerCanisterId,
      }
    );
    setckbtcLedger(_ckbtcLedgerActor);
  }



  // async function logout() {
  //   await authClient?.logout();
  //   await updateClient(authClient);
  // }

  return {
    // isAuthenticated,
    inscribeActor,
    ckbtcMinterActor,
    ckbtcLedgerActor,
    // login,
    // logout,
    // identity,
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