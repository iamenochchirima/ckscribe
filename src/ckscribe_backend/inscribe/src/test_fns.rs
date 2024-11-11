use crate::{
    schnorr_api::{self, get_schnorr_public_key},
    utils::generate_derivation_path,
    PublicKeyReply, SignatureReply,
};

use bitcoin::{
    hashes::{sha256, Hash},
    secp256k1::{schnorr, Message, PublicKey, Secp256k1, XOnlyPublicKey},
};
use ic_cdk::update;

#[update]
pub async fn generate_and_verify_schnorr() -> Result<String, String> {
    let caller = ic_cdk::id();
    let derivation_path = generate_derivation_path(&caller);
    let schnorr_public_key = get_schnorr_public_key(derivation_path.clone()).await;

    let res = test_sign(&derivation_path, &schnorr_public_key).await;

    return res;
}

pub async fn test_sign(
    derivation_path: &Vec<Vec<u8>>,
    schnorr_public_key: &[u8],
) -> Result<String, String> {
    let text = "Hello, World!";
    let bytes_vec = text.as_bytes().to_vec();

    let message_digest = sha256::Hash::hash(&bytes_vec).to_byte_array();

    let schnorr_signature =
        schnorr_api::schnorr_sign(message_digest.to_vec(), derivation_path.clone()).await;

    let secp = bitcoin::secp256k1::Secp256k1::verification_only();

    let schnorr_public_key: XOnlyPublicKey =
        PublicKey::from_slice(schnorr_public_key).unwrap().into();

    let sig_ = schnorr::Signature::from_slice(&schnorr_signature).unwrap();
    let msg = Message::from_slice(&message_digest).unwrap();
    // Use `expect` to trap with a detailed error message if verification fails
    match secp.verify_schnorr(&sig_, &msg, &schnorr_public_key) {
        Ok(_) => {
            return Ok("Signature is valid".to_string());
        }
        Err(e) => {
            return Err(format!(
                "Signature verification failed! Error: {:?}. Details:\n- Signature: {:?}\n- Message: {:?}\n- Public Key: {:?}",
                e, sig_, msg, hex::encode(schnorr_public_key.serialize())
            ));
        }
    }
}

#[update]
pub async fn verify_schnorr_signature(
    pubkey: String,
    signature: String,
    message: String,
) -> Result<String, String> {
    // Parse the Schnorr public key (X-only format, 32 bytes).
    let pubkey_bytes = match hex::decode(pubkey) {
        Ok(bytes) if bytes.len() == 32 => bytes,
        _ => return Err("Invalid public key format".to_string()),
    };

    // Parse the signature (Schnorr signature, 64 bytes).
    let signature_bytes = match hex::decode(signature) {
        Ok(bytes) if bytes.len() == 64 => bytes,
        _ => return Err("Invalid signature format".to_string()),
    };

    // Parse the message (message to be verified, typically in bytes).
    let message_bytes = match hex::decode(message) {
        Ok(bytes) => bytes,
        _ => return Err("Invalid message format".to_string()),
    };

    // Create the Secp256k1 context for verification
    let secp = Secp256k1::verification_only();

    // Convert the public key from bytes to XOnlyPublicKey
    let pubkey = match XOnlyPublicKey::from_slice(&pubkey_bytes) {
        Ok(pk) => pk,
        Err(_) => return Err("Failed to convert public key to XOnlyPublicKey".to_string()),
    };

    // Convert the signature from bytes to a Schnorr signature
    let sig = match schnorr::Signature::from_slice(&signature_bytes) {
        Ok(s) => s,
        Err(_) => return Err("Failed to convert signature".to_string()),
    };

    // Convert the message to a Message object
    let msg = match Message::from_slice(&message_bytes) {
        Ok(m) => m,
        Err(_) => return Err("Failed to convert message".to_string()),
    };

    let is_valid = secp.verify_schnorr(&sig, &msg, &pubkey).is_ok();

    if is_valid {
        Ok("Signature is valid".to_string())
    } else {
        Err("Signature verification failed".to_string())
    }
}

#[update]
async fn public_key() -> Result<PublicKeyReply, String> {
    let caller = ic_cdk::id();
    let derivation_path = generate_derivation_path(&caller);
    let schnorr_public_key = get_schnorr_public_key(derivation_path.clone()).await;
    Ok(PublicKeyReply {
        public_key_hex: hex::encode(&schnorr_public_key),
    })
}

#[update]
async fn sign(message: String) -> Result<SignatureReply, String> {
    let caller = ic_cdk::id();
    let derivation_path = generate_derivation_path(&caller);
    let bytes_vec = message.as_bytes().to_vec();
    let message_digest = sha256::Hash::hash(&bytes_vec).to_byte_array();

    let schnorr_signature =
        schnorr_api::schnorr_sign(message_digest.to_vec(), derivation_path.clone()).await;

    Ok(SignatureReply {
        signature_hex: hex::encode(&schnorr_signature),
        message: hex::encode(message_digest),
    })
}
