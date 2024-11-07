export const idlFactory = ({ IDL }) => {
  const HttpRequest = IDL.Record({
    'url' : IDL.Text,
    'method' : IDL.Text,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'certificate_version' : IDL.Opt(IDL.Nat16),
  });
  const HttpResponse = IDL.Record({
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'status_code' : IDL.Nat16,
  });
  const SchnorrAlgorithm = IDL.Variant({
    'ed25519' : IDL.Null,
    'bip340secp256k1' : IDL.Null,
  });
  const SchnorrKeyId = IDL.Record({
    'algorithm' : SchnorrAlgorithm,
    'name' : IDL.Text,
  });
  const SchnorrPublicKeyArgs = IDL.Record({
    'key_id' : SchnorrKeyId,
    'canister_id' : IDL.Opt(IDL.Principal),
    'derivation_path' : IDL.Vec(IDL.Vec(IDL.Nat8)),
  });
  const SchnorrPublicKeyResult = IDL.Record({
    'public_key' : IDL.Vec(IDL.Nat8),
    'chain_code' : IDL.Vec(IDL.Nat8),
  });
  const SignWithSchnorrArgs = IDL.Record({
    'key_id' : SchnorrKeyId,
    'derivation_path' : IDL.Vec(IDL.Vec(IDL.Nat8)),
    'message' : IDL.Vec(IDL.Nat8),
  });
  const SignWithSchnorrResult = IDL.Record({ 'signature' : IDL.Vec(IDL.Nat8) });
  return IDL.Service({
    'http_request' : IDL.Func([HttpRequest], [HttpResponse], ['query']),
    'schnorr_public_key' : IDL.Func(
        [SchnorrPublicKeyArgs],
        [SchnorrPublicKeyResult],
        [],
      ),
    'sign_with_schnorr' : IDL.Func(
        [SignWithSchnorrArgs],
        [SignWithSchnorrResult],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
