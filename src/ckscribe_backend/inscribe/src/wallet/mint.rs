use crate::{MintArgs, STATE};
use bitcoin::{
    absolute::LockTime,
    blockdata::witness::Witness,
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
    TxOut, Txid,
};
use ic_cdk::api::management_canister::bitcoin::{BitcoinNetwork, Utxo};
use ordinals::{RuneId, Runestone};

use std::str::FromStr;

pub const SIG_HASH_TYPE: EcdsaSighashType = EcdsaSighashType::All;

pub async fn build_and_sign_mint_transaction(
    derivation_path: &Vec<Vec<u8>>,
    owned_utxos: &[Utxo],
    ecdsa_public_key: &[u8],
    schnorr_public_key: &[u8],
    caller_p2pkh_address: String,
    mint_args: MintArgs,
) -> Transaction {
    let network = STATE.with_borrow(|state| *state.network.as_ref().unwrap());
    let caller_address = Address::from_str(&caller_p2pkh_address)
    .unwrap()
    .assume_checked();
    let fee_per_byte = super::common::get_fee_per_byte(network).await;

    let transaction = build_p2pkh_spend_tx(
        &own_public_key,
        &own_address,
        &own_utxos,
        &dst_address,
        amount,
        fee_per_byte,
    )
    .await;

    let rune_id = RuneId::new(mint_args.rune_id.block, mint_args.rune_id.tx);

    let runestone = Runestone {
        etching: None,
        edicts: vec![],
        mint: rune_id,
        pointer: None,
    };

    let script_pubkey = runestone.encipher();
    if script_pubkey.len() > 82 {
        ic_cdk::trap("Exceeds OP_RETURN size of 82")
    }

    let mut utxos_to_spend = vec![];
    let mut total_spent = 0;

    owned_utxos.iter().for_each(|utxo| {
        total_spent += utxo.value;
        utxos_to_spend.push(utxo);
    });

    let inputs: Vec<TxIn> = utxos_to_spend
        .iter()
        .map(|utxo| TxIn {
            previous_output: OutPoint {
                txid: Txid::from_raw_hash(Hash::from_slice(&utxo.outpoint.txid).unwrap()),
                vout: utxo.outpoint.vout,
            },
            sequence: Sequence::max_value(),
            witness: Witness::new(),
            script_sig: ScriptBuf::new(),
        })
        .collect();

    let mut outputs = vec![TxOut {
        script_pubkey: script_pubkey,
        value: 0,
    }];

    outputs.push(TxOut {
        script_pubkey: caller_address.script_pubkey(),
        value: total_spent // TODO: subtract fee
    });

    let mut unsigned_tx = Transaction {
        version: 2,
        lock_time: LockTime::ZERO,
        input: inputs,
        output: outputs,
    };
    unsigned_tx
}



// pub async fn build_and_sign_mint_transaction(
//     derivation_path: &Vec<Vec<u8>>,
//     owned_utxos: &[Utxo],
//     ecdsa_public_key: &[u8],
//     schnorr_public_key: &[u8],
//     caller_p2pkh_address: String,
//     mint_args: MintArgs,
// ) -> Transaction {
//     let network = STATE.with_borrow(|state| *state.network.as_ref().unwrap());
//     let caller_address = Address::from_str(&caller_p2pkh_address)
//     .unwrap()
//     .assume_checked();
//     let fee_per_byte = super::common::get_fee_per_byte(network).await;

//     let rune_id = RuneId::new(mint_args.rune_id.block, mint_args.rune_id.tx);

//     let runestone = Runestone {
//         etching: None,
//         edicts: vec![],
//         mint: rune_id,
//         pointer: None,
//     };

//     let script_pubkey = runestone.encipher();
//     if script_pubkey.len() > 82 {
//         ic_cdk::trap("Exceeds OP_RETURN size of 82")
//     }

//     let mut utxos_to_spend = vec![];
//     let mut total_spent = 0;

//     owned_utxos.iter().for_each(|utxo| {
//         total_spent += utxo.value;
//         utxos_to_spend.push(utxo);
//     });

//     let inputs: Vec<TxIn> = utxos_to_spend
//         .iter()
//         .map(|utxo| TxIn {
//             previous_output: OutPoint {
//                 txid: Txid::from_raw_hash(Hash::from_slice(&utxo.outpoint.txid).unwrap()),
//                 vout: utxo.outpoint.vout,
//             },
//             sequence: Sequence::max_value(),
//             witness: Witness::new(),
//             script_sig: ScriptBuf::new(),
//         })
//         .collect();

//     let mut outputs = vec![TxOut {
//         script_pubkey: script_pubkey,
//         value: 0,
//     }];

//     outputs.push(TxOut {
//         script_pubkey: caller_address.script_pubkey(),
//         value: total_spent // TODO: subtract fee
//     });

//     let mut tx = Transaction {
//         version: 2,
//         lock_time: LockTime::ZERO,
//         input: inputs,
//         output: outputs,
//     };
//     tx
// }