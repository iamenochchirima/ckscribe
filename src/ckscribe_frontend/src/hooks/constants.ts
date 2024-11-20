export const network = process.env.DFX_NETWORK || "local";
export const host = network === "ic" ? "https://icp0.io" : "http://127.0.0.1:4943";