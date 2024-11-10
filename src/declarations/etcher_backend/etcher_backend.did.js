export const idlFactory = ({ IDL }) => {
  const BitcoinNetwork = IDL.Variant({
    'mainnet' : IDL.Null,
    'regtest' : IDL.Null,
    'testnet' : IDL.Null,
  });
  const InitArgs = IDL.Record({
    'network' : BitcoinNetwork,
    'ckbtc_minter' : IDL.Principal,
    'schnorr_canister' : IDL.Principal,
    'ckbtc_ledger' : IDL.Principal,
    'timer_for_reveal_txn' : IDL.Nat32,
  });
  const EtchingArgs = IDL.Record({
    'cap' : IDL.Nat,
    'height' : IDL.Opt(IDL.Tuple(IDL.Nat64, IDL.Nat64)),
    'turbo' : IDL.Bool,
    'premine' : IDL.Nat,
    'rune' : IDL.Text,
    'divisibility' : IDL.Nat8,
    'offset' : IDL.Opt(IDL.Tuple(IDL.Nat64, IDL.Nat64)),
    'fee_rate' : IDL.Opt(IDL.Nat64),
    'amount' : IDL.Nat,
    'symbol' : IDL.Nat32,
  });
  const Result = IDL.Variant({
    'Ok' : IDL.Tuple(IDL.Text, IDL.Text),
    'Err' : IDL.Text,
  });
  const SchnorrAlgorithm = IDL.Variant({
    'ed25519' : IDL.Null,
    'bip340secp256k1' : IDL.Null,
  });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const PublicKeyReply = IDL.Record({ 'public_key_hex' : IDL.Text });
  const Result_2 = IDL.Variant({ 'Ok' : PublicKeyReply, 'Err' : IDL.Text });
  const SignatureReply = IDL.Record({
    'message' : IDL.Text,
    'signature_hex' : IDL.Text,
  });
  const Result_3 = IDL.Variant({ 'Ok' : SignatureReply, 'Err' : IDL.Text });
  const SignatureVerificationReply = IDL.Record({
    'is_signature_valid' : IDL.Bool,
  });
  const Result_4 = IDL.Variant({
    'Ok' : SignatureVerificationReply,
    'Err' : IDL.Text,
  });
  return IDL.Service({
    'confirm_and_convert_ckbtc' : IDL.Func([], [IDL.Nat64], []),
    'etch_rune' : IDL.Func([EtchingArgs], [Result], []),
    'generate_and_verify_schnorr' : IDL.Func(
        [SchnorrAlgorithm],
        [Result_1],
        [],
      ),
    'get_btc_balance' : IDL.Func([], [IDL.Nat64], []),
    'get_deposit_address_for_bitcoin' : IDL.Func([], [IDL.Text], []),
    'get_deposit_address_for_ckbtc' : IDL.Func([], [IDL.Text], ['query']),
    'get_estimated_cbktc_conversion_fee' : IDL.Func(
        [],
        [IDL.Nat64],
        ['composite_query'],
      ),
    'public_key' : IDL.Func([SchnorrAlgorithm], [Result_2], []),
    'query_conversion_status' : IDL.Func(
        [IDL.Nat64],
        [IDL.Text],
        ['composite_query'],
      ),
    'sign' : IDL.Func([IDL.Text, SchnorrAlgorithm], [Result_3], []),
    'verify' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, SchnorrAlgorithm],
        [Result_4],
        ['query'],
      ),
    'verify_schnorr_signature' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Result_1],
        [],
      ),
  });
};
export const init = ({ IDL }) => {
  const BitcoinNetwork = IDL.Variant({
    'mainnet' : IDL.Null,
    'regtest' : IDL.Null,
    'testnet' : IDL.Null,
  });
  const InitArgs = IDL.Record({
    'network' : BitcoinNetwork,
    'ckbtc_minter' : IDL.Principal,
    'schnorr_canister' : IDL.Principal,
    'ckbtc_ledger' : IDL.Principal,
    'timer_for_reveal_txn' : IDL.Nat32,
  });
  return [InitArgs];
};
