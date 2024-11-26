
import ConnectedButton from "./ConnectedButton";
import { useState } from "react";
import ConnectDialog from "./ConnectDialog";
import { useSiwbIdentity } from "ic-siwb-lasereyes-connector";

const ConnectWallet = () => {
  const { isInitializing, identity } = useSiwbIdentity();
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  return (
    <div>
      {!isInitializing && identity ?
        <div>
          <ConnectedButton />
        </div> : <button
          onClick={() => setConnectDialogOpen(true)}
          className="bg-white rounded p-2 text-[#4701AE]  font-semibold">
          Connect Wallet
        </button>}
      <ConnectDialog isOpen={connectDialogOpen} setIsOpen={() => setConnectDialogOpen(false)} />
    </div>
  )
}

export default ConnectWallet