// use std::time::{SystemTime, UNIX_EPOCH};

// use crate::{
//     ecdsa_api::ecdsa_sign, schnorr_api, tags::Tag, utils::sec1_to_der, EtchingArgs, STATE,
// };
// use bitcoin::{
//     absolute::LockTime,
//     consensus,
//     hashes::{sha256, Hash},
//     opcodes,
//     script::{Builder, PushBytes},
//     secp256k1::{
//         constants::SCHNORR_SIGNATURE_SIZE, schnorr, Message, PublicKey, Secp256k1, XOnlyPublicKey,
//     },
//     sighash::{EcdsaSighashType, Prevouts, SighashCache, TapSighashType},
//     taproot::{ControlBlock, LeafVersion, Signature, TapLeafHash, TaprootBuilder},
//     Address, Amount, FeeRate, Network, OutPoint, Script, ScriptBuf, Sequence, Transaction, TxIn,
//     TxOut, Txid, Witness,
// };

// use ic_cdk::println;

// #[update]
// pub async fn generate_and_verify_schnorr(algorithm: SchnorrAlgorithm) -> Result<String, String> {
//     let derivation_path = vec![ic_cdk::api::caller().as_slice().to_vec()];

//     let request = ManagementCanisterSchnorrPublicKeyRequest {
//         canister_id: None,
//         derivation_path: vec![ic_cdk::api::caller().as_slice().to_vec()],
//         key_id: SchnorrKeyIds::TestKeyLocalDevelopment.to_key_id(algorithm),
//     };

//     let (res,): (ManagementCanisterSchnorrPublicKeyReply,) = ic_cdk::call(
//         Principal::management_canister(),
//         "schnorr_public_key",
//         (request,),
//     )
//     .await
//     .map_err(|e| format!("schnorr_public_key failed {}", e.1))?;
//     let schnorr_public_key = res.public_key;

//     let res = test_sign(&derivation_path, &schnorr_public_key).await;

//     return res;
// }


// pub async fn test_sign(
//     derivation_path: &Vec<Vec<u8>>,
//     schnorr_public_key: &[u8],
// ) -> Result<String, String> {
//     let signing_data = vec![0u8; 32];
//     let internal_request = ManagementCanisterSignatureRequest {
//         message: signing_data.clone(),
//         derivation_path: derivation_path.clone(),
//         key_id: SchnorrKeyIds::TestKeyLocalDevelopment.to_key_id({
//             SchnorrAlgorithm::Bip340Secp256k1
//         }),
//     };

//     let (internal_reply,): (ManagementCanisterSignatureReply,) =
//         ic_cdk::api::call::call_with_payment(
//             Principal::management_canister(),
//             "sign_with_schnorr",
//             (internal_request,),
//             26_153_846_153,
//         )
//         .await
//         .map_err(|e| format!("sign_with_schnorr failed {e:?}"))?;

//     let schnorr_signature = internal_reply.signature;


// //    match verify_bip340_secp256k1(&schnorr_signature, &signing_data, schnorr_public_key) {
// //     Ok(SignatureVerificationReply { is_signature_valid }) => {
// //         if is_signature_valid {
// //             Ok("Signature is valid".to_string())
// //         } else {
// //             Err("Signature verification failed".to_string())
// //         }
// //     }
// //     Err(e) => Err(e),
// // }
//     // Verify the signature to be sure that signing works
//     let secp = bitcoin::secp256k1::Secp256k1::verification_only();

//     let schnorr_public_key: XOnlyPublicKey =
//         PublicKey::from_slice(schnorr_public_key).unwrap().into();


//     let sig_ = schnorr::Signature::from_slice(&schnorr_signature).unwrap();
//     let digest = sha256::Hash::hash(&signing_data).to_byte_array();
//     let msg = Message::from_slice(&digest).unwrap();

//     // Use `expect` to trap with a detailed error message if verification fails
//     match secp.verify_schnorr(&sig_, &msg, &schnorr_public_key) {
//         Ok(_) => println!("Signature verification succeeded."),
//         Err(e) => {
//             return Err(format!(
//                 "Signature verification failed! Error: {:?}. Details:\n- Signature: {:?}\n- Message: {:?}\n- Public Key: {:?}",
//                 e, sig_, msg, schnorr_public_key
//             ));
//         }
//     }

//     Ok("Test signing and verification completed.".to_string())
// }

// #[update]
// pub async fn verify_schnorr_signature(
//     pubkey: String,
//     signature: String,
//     message: String,
// ) -> Result<String, String> {
//     // Parse the Schnorr public key (X-only format, 32 bytes).
//     let pubkey_bytes = match hex::decode(pubkey) {
//         Ok(bytes) if bytes.len() == 32 => bytes,
//         _ => return Err("Invalid public key format".to_string()),
//     };

//     // Parse the signature (Schnorr signature, 64 bytes).
//     let signature_bytes = match hex::decode(signature) {
//         Ok(bytes) if bytes.len() == 64 => bytes,
//         _ => return Err("Invalid signature format".to_string()),
//     };

//     // Parse the message (message to be verified, typically in bytes).
//     let message_bytes = match hex::decode(message) {
//         Ok(bytes) => bytes,
//         _ => return Err("Invalid message format".to_string()),
//     };

//     // Create the Secp256k1 context for verification
//     let secp = Secp256k1::verification_only();

//     // Convert the public key from bytes to XOnlyPublicKey
//     let pubkey = match XOnlyPublicKey::from_slice(&pubkey_bytes) {
//         Ok(pk) => pk,
//         Err(_) => return Err("Failed to convert public key to XOnlyPublicKey".to_string()),
//     };

//     // Convert the signature from bytes to a Schnorr signature
//     let sig = match schnorr::Signature::from_slice(&signature_bytes) {
//         Ok(s) => s,
//         Err(_) => return Err("Failed to convert signature".to_string()),
//     };

//     // Convert the message to a Message object
//     let msg = match Message::from_slice(&message_bytes) {
//         Ok(m) => m,
//         Err(_) => return Err("Failed to convert message".to_string()),
//     };

//     // Verify the Schnorr signature
//     let is_valid = secp.verify_schnorr(&sig, &msg, &pubkey).is_ok();

//     if is_valid {
//         Ok("Signature is valid".to_string())
//     } else {
//         Err("Signature verification failed".to_string())
//     }
// }



