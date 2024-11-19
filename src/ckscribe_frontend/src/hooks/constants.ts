export const network = process.env.DFX_NETWORK || "local";
export const host = network === "ic" ? "https://icp0.io" : "http://localhost:4943";