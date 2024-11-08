use bitcoin::{
    absolute::LockTime,
    consensus,
    hashes::{sha256, Hash},
    opcodes,
    script::{Builder, PushBytes},
    secp256k1::{
        constants::SCHNORR_SIGNATURE_SIZE, schnorr, Message, PublicKey, Secp256k1, XOnlyPublicKey,
    },
    sighash::{EcdsaSighashType, Prevouts, SighashCache, TapSighashType},
    taproot::{ControlBlock, LeafVersion, Signature, TapLeafHash, TaprootBuilder},
    Address, Amount, FeeRate, Network, OutPoint, Script, ScriptBuf, Sequence, Transaction, TxIn,
    TxOut, Txid, Witness,
};
use crate::{
    ecdsa_api::ecdsa_sign, schnorr_api, tags::Tag, utils::sec1_to_der, EtchingArgs, STATE,
};
use ic_cdk::update;

use crate::{
    ecdsa_api::get_ecdsa_public_key, schnorr_api::get_schnorr_public_key,
    utils::generate_derivation_path,
};

#[update]
pub async fn generate_and_verify_schnorr() -> Result<String, String> {
    let caller = ic_cdk::id();
    let derivation_path = generate_derivation_path(&caller);
    let ecdsa_public_key = get_ecdsa_public_key(derivation_path.clone()).await;
    let schnorr_public_key = get_schnorr_public_key(derivation_path.clone()).await;

    let res = sign(&derivation_path, &ecdsa_public_key, &schnorr_public_key).await;

    return res;
}

pub async fn sign(
    derivation_path: &Vec<Vec<u8>>,
    ecdsa_public_key: &[u8],
    schnorr_public_key: &[u8],
) -> Result<String, String> {
    let secp256k1 = Secp256k1::new();

    let schnorr_public_key: XOnlyPublicKey = PublicKey::from_slice(schnorr_public_key).unwrap().into();

    let secp = bitcoin::secp256k1::Secp256k1::verification_only();

    let mut sighash_cache = SighashCache::new(&mut reveal_tx);
    let mut signing_data = vec![];
    let leaf_hash = TapLeafHash::from_script(&reveal_script, LeafVersion::TapScript);
    sighash_cache
        .taproot_encode_signing_data_to(
            &mut signing_data,
            0,
            &Prevouts::All(&[commit_tx.output[vout].clone()]),
            None,
            Some((leaf_hash, 0xFFFFFFFF)),
            TapSighashType::Default,
        )
        .unwrap();
    let mut hashed_tag = sha256::Hash::hash(b"TapSighash").to_byte_array().to_vec();
    let mut prefix = hashed_tag.clone();
    prefix.append(&mut hashed_tag);
    let signing_data: Vec<_> = prefix.iter().chain(signing_data.iter()).cloned().collect();

        
    let schnorr_signature = schnorr_api::schnorr_sign(signing_data.clone(), derivation_path.clone()).await;

    let sig_ = schnorr::Signature::from_slice(&schnorr_signature).unwrap();
    let digest = sha256::Hash::hash(&signing_data).to_byte_array();
    let msg = Message::from_slice(&digest).unwrap();

    return Ok("".to_string());
}
