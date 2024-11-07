import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface HttpRequest {
  'url' : string,
  'method' : string,
  'body' : Uint8Array | number[],
  'headers' : Array<[string, string]>,
  'certificate_version' : [] | [number],
}
export interface HttpResponse {
  'body' : Uint8Array | number[],
  'headers' : Array<[string, string]>,
  'status_code' : number,
}
export type SchnorrAlgorithm = { 'ed25519' : null } |
  { 'bip340secp256k1' : null };
export interface SchnorrKeyId {
  'algorithm' : SchnorrAlgorithm,
  'name' : string,
}
export interface SchnorrPublicKeyArgs {
  'key_id' : SchnorrKeyId,
  'canister_id' : [] | [Principal],
  'derivation_path' : Array<Uint8Array | number[]>,
}
export interface SchnorrPublicKeyResult {
  'public_key' : Uint8Array | number[],
  'chain_code' : Uint8Array | number[],
}
export interface SignWithSchnorrArgs {
  'key_id' : SchnorrKeyId,
  'derivation_path' : Array<Uint8Array | number[]>,
  'message' : Uint8Array | number[],
}
export interface SignWithSchnorrResult { 'signature' : Uint8Array | number[] }
export interface _SERVICE {
  'http_request' : ActorMethod<[HttpRequest], HttpResponse>,
  'schnorr_public_key' : ActorMethod<
    [SchnorrPublicKeyArgs],
    SchnorrPublicKeyResult
  >,
  'sign_with_schnorr' : ActorMethod<
    [SignWithSchnorrArgs],
    SignWithSchnorrResult
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
