import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type BitcoinNetwork = { 'mainnet' : null } |
  { 'regtest' : null } |
  { 'testnet' : null };
export interface EtchingArgs {
  'cap' : bigint,
  'height' : [] | [[bigint, bigint]],
  'turbo' : boolean,
  'premine' : bigint,
  'rune' : string,
  'divisibility' : number,
  'offset' : [] | [[bigint, bigint]],
  'fee_rate' : [] | [bigint],
  'amount' : bigint,
  'symbol' : number,
}
export interface InitArgs {
  'network' : BitcoinNetwork,
  'ckbtc_minter' : Principal,
  'schnorr_canister' : Principal,
  'ckbtc_ledger' : Principal,
  'timer_for_reveal_txn' : number,
}
export interface PublicKeyReply { 'public_key_hex' : string }
export type Result = { 'Ok' : [string, string] } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : string } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : PublicKeyReply } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : SignatureReply } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : SignatureVerificationReply } |
  { 'Err' : string };
export type SchnorrAlgorithm = { 'ed25519' : null } |
  { 'bip340secp256k1' : null };
export interface SignatureReply { 'message' : string, 'signature_hex' : string }
export interface SignatureVerificationReply { 'is_signature_valid' : boolean }
export interface _SERVICE {
  'confirm_and_convert_ckbtc' : ActorMethod<[], bigint>,
  'etch_rune' : ActorMethod<[EtchingArgs], Result>,
  'generate_and_verify_schnorr' : ActorMethod<[SchnorrAlgorithm], Result_1>,
  'get_btc_balance' : ActorMethod<[], bigint>,
  'get_deposit_address_for_bitcoin' : ActorMethod<[], string>,
  'get_deposit_address_for_ckbtc' : ActorMethod<[], string>,
  'get_estimated_cbktc_conversion_fee' : ActorMethod<[], bigint>,
  'public_key' : ActorMethod<[SchnorrAlgorithm], Result_2>,
  'query_conversion_status' : ActorMethod<[bigint], string>,
  'sign' : ActorMethod<[string, SchnorrAlgorithm], Result_3>,
  'verify' : ActorMethod<[string, string, string, SchnorrAlgorithm], Result_4>,
  'verify_schnorr_signature' : ActorMethod<[string, string, string], Result_1>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
