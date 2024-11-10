use crate::{
    ManagementCanisterSchnorrPublicKeyReply, ManagementCanisterSchnorrPublicKeyRequest,
    ManagementCanisterSignatureReply, ManagementCanisterSignatureRequest, SchnorrKeyId, STATE,
};
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Deserialize, Serialize, Debug)]
struct SchnorrPublicKey {
    pub canister_id: Option<Principal>,
    pub derivation_path: Vec<Vec<u8>>,
    pub key_id: SchnorrKeyId,
}

#[derive(CandidType, Deserialize, Debug)]
struct SchnorrPublicKeyReply {
    pub public_key: Vec<u8>,
    pub chain_code: Vec<u8>,
}

#[derive(CandidType, Deserialize, Serialize, Debug)]
struct SignWithSchnorr {
    pub message: Vec<u8>,
    pub derivation_path: Vec<Vec<u8>>,
    pub key_id: SchnorrKeyId,
}

#[derive(CandidType, Deserialize, Debug)]
struct SignWithSchnorrReply {
    pub signature: Vec<u8>,
}

pub async fn get_schnorr_public_key(derivation_path: Vec<Vec<u8>>) -> Vec<u8> {
    let key_id = STATE.with_borrow(|state| state.schnorr_key.as_ref().unwrap().clone());

    let request = ManagementCanisterSchnorrPublicKeyRequest {
        canister_id: None,
        derivation_path: derivation_path.clone(),
        key_id: key_id.clone(),
    };

    let (res,): (ManagementCanisterSchnorrPublicKeyReply,) = match ic_cdk::call(
        Principal::management_canister(),
        "schnorr_public_key",
        (request,),
    )
    .await
    {
        Ok(result) => result,
        Err(e) => {
            ic_cdk::trap(&format!("schnorr_public_key failed: {}", e.1));
        }
    };

    res.public_key
}

pub async fn schnorr_sign(message: Vec<u8>, derivation_path: Vec<Vec<u8>>) -> Vec<u8> {
    let key_id = STATE.with_borrow(|state| state.schnorr_key.as_ref().unwrap().clone());
    let internal_request = ManagementCanisterSignatureRequest {
        message: message.clone(),
        derivation_path: derivation_path.clone(),
        key_id: key_id.clone(),
    };
    let (internal_reply,): (ManagementCanisterSignatureReply,) =
        ic_cdk::api::call::call_with_payment(
            Principal::management_canister(),
            "sign_with_schnorr",
            (internal_request,),
            26_153_846_153,
        )
        .await
        .unwrap();
    internal_reply.signature
}
