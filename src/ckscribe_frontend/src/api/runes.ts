// src/api.ts
import axios from "axios";

const BITCOIN_RPC_URL = "/api"; // Use the proxy path instead of localhost directly
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
      (utxo: any) => utxo.scriptPubKey === "76a914bf32ac6dedc47d380a2823c95eafe68abd56a6e488ac"
    );

    return utxos;
  } catch (error) {
    console.error("Error fetching Runes:", error);
    throw error;
  }
};


export const fetchRunesData = async () => {
  try {
    const response = await axios.get("http://localhost:8080/runes", {
      headers: {
        Accept: "application/json",
      },
    });
    return response.data.entries; 
  } catch (error) {
    console.error("Error fetching Runes data:", error);
    throw error;
  }
};

