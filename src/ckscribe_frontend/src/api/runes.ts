// src/api.ts
import axios from "axios";

const BITCOIN_RPC_URL = "http://localhost:18443"; 
const BITCOIN_RPC_USER = "ic-btc-integration";
const BITCOIN_RPC_PASSWORD = "QPQiNaph19FqUsCrBRN0FII7lyM26B51fAMeBQzCb-E="; 

const auth = {
  username: BITCOIN_RPC_USER,
  password: BITCOIN_RPC_PASSWORD,
};


export const fetchRunes = async (address: string) => {
  try {

    const response = await axios.post(
      BITCOIN_RPC_URL,
      {
        jsonrpc: "1.0",
        id: "fetchRunes",
        method: "scantxoutset",
        params: ["start", [`addr(${address})`]],
      },
      { auth }
    );

    const utxos = response.data.result.unspents.filter(
      (utxo: any) => utxo.scriptPubKey === "your_rune_script_identifier"
    );

    return utxos;
  } catch (error) {
    console.error("Error fetching Runes:", error);
    throw error;
  }
};
