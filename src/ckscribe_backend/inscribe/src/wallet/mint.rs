use crate::{ecdsa_api::get_ecdsa_signature, MintArgs, STATE};
use bitcoin::{
    consensus::serialize,
    hashes::Hash,
    script::{Builder, PushBytesBuf},
    sighash::{EcdsaSighashType, SighashCache},
    Address, AddressType, Transaction,
};
use ic_cdk::api::management_canister::bitcoin::{MillisatoshiPerByte, Utxo};
use ic_cdk::println;

use std::str::FromStr;

pub const SIG_HASH_TYPE: EcdsaSighashType = EcdsaSighashType::All;

pub async fn build_and_sign_mint_transaction(
    derivation_path: &Vec<Vec<u8>>,
    owned_utxos: &[Utxo],
    ecdsa_public_key: &[u8],
    key_name: String,
    own_p2pkh_address: String,
    mint_args: MintArgs,
) -> Transaction {
    let network = STATE.with_borrow(|state| *state.network.as_ref().unwrap());
    let own_address = Address::from_str(&own_p2pkh_address)
        .unwrap()
        .assume_checked();
    let fee_per_byte = super::common::get_fee_per_byte(network).await;

    let transaction = build_p2pkh_spend_tx(
        &ecdsa_public_key,
        &own_address,
        &owned_utxos,
        fee_per_byte,
        &mint_args,
    )
    .await;

    let tx_bytes = serialize(&transaction);
    println!("Transaction to sign: {}", hex::encode(tx_bytes));

    let signed_transaction = ecdsa_sign_transaction(
        &ecdsa_public_key,
        &own_address,
        transaction,
        key_name,
        derivation_path.clone(),
        get_ecdsa_signature,
    )
    .await;
    return signed_transaction;
}

async fn build_p2pkh_spend_tx(
    own_public_key: &[u8],
    own_address: &Address,
    own_utxos: &[Utxo],
    fee_per_vbyte: MillisatoshiPerByte,
    mint_args: &MintArgs,
) -> Transaction {
    // We have a chicken-and-egg problem where we need to know the length
    // of the transaction in order to compute its proper fee, but we need
    // to know the proper fee in order to figure out the inputs needed for
    // the transaction.
    //
    // We solve this problem iteratively. We start with a fee of zero, build
    // and sign a transaction, see what its size is, and then update the fee,
    // rebuild the transaction, until the fee is set to the correct amount.
    let mut total_fee = 0;
    loop {
        let (transaction, _prevouts) = super::common::build_transaction_mint_with_fee(
            own_utxos,
            own_address,
            total_fee,
            &mint_args
        )
        .expect("Error building transaction.");

        // Sign the transaction. In this case, we only care about the size
        // of the signed transaction, so we use a mock signer here for efficiency.
        let signed_transaction = ecdsa_sign_transaction(
            own_public_key,
            own_address,
            transaction.clone(),
            String::from(""), // mock key name
            vec![],           // mock derivation path
            super::common::mock_signer,
        )
        .await;

        let tx_vsize = signed_transaction.vsize() as u64;

        if (tx_vsize * fee_per_vbyte) / 1000 == total_fee {
            println!("Transaction built with fee {}.", total_fee);
            return transaction;
        } else {
            total_fee = (tx_vsize * fee_per_vbyte) / 1000;
        }
    }
}

async fn ecdsa_sign_transaction<SignFun, Fut>(
    own_public_key: &[u8],
    own_address: &Address,
    mut transaction: Transaction,
    key_name: String,
    derivation_path: Vec<Vec<u8>>,
    signer: SignFun,
) -> Transaction
where
    SignFun: Fn(String, Vec<Vec<u8>>, Vec<u8>) -> Fut,
    Fut: std::future::Future<Output = Vec<u8>>,
{
    // Verify that our own address is P2PKH.
    assert_eq!(
        own_address.address_type(),
        Some(AddressType::P2pkh),
        "This example supports signing p2pkh addresses only."
    );

    let txclone = transaction.clone();
    for (index, input) in transaction.input.iter_mut().enumerate() {
        let sighash = SighashCache::new(&txclone)
            .legacy_signature_hash(index, &own_address.script_pubkey(), SIG_HASH_TYPE.to_u32())
            .unwrap();

        let signature = signer(
            key_name.clone(),
            derivation_path.clone(),
            sighash.as_byte_array().to_vec(),
        )
        .await;

        // Convert signature to DER.
        let der_signature = sec1_to_der(signature);

        let mut sig_with_hashtype: Vec<u8> = der_signature;
        sig_with_hashtype.push(SIG_HASH_TYPE.to_u32() as u8);

        let sig_with_hashtype_push_bytes = PushBytesBuf::try_from(sig_with_hashtype).unwrap();
        let own_public_key_push_bytes = PushBytesBuf::try_from(own_public_key.to_vec()).unwrap();
        input.script_sig = Builder::new()
            .push_slice(sig_with_hashtype_push_bytes)
            .push_slice(own_public_key_push_bytes)
            .into_script();
        input.witness.clear();
    }

    transaction
}

// Converts a SEC1 ECDSA signature to the DER format.
fn sec1_to_der(sec1_signature: Vec<u8>) -> Vec<u8> {
    let r: Vec<u8> = if sec1_signature[0] & 0x80 != 0 {
        // r is negative. Prepend a zero byte.
        let mut tmp = vec![0x00];
        tmp.extend(sec1_signature[..32].to_vec());
        tmp
    } else {
        // r is positive.
        sec1_signature[..32].to_vec()
    };

    let s: Vec<u8> = if sec1_signature[32] & 0x80 != 0 {
        // s is negative. Prepend a zero byte.
        let mut tmp = vec![0x00];
        tmp.extend(sec1_signature[32..].to_vec());
        tmp
    } else {
        // s is positive.
        sec1_signature[32..].to_vec()
    };

    // Convert signature to DER.
    vec![
        vec![0x30, 4 + r.len() as u8 + s.len() as u8, 0x02, r.len() as u8],
        r,
        vec![0x02, s.len() as u8],
        s,
    ]
    .into_iter()
    .flatten()
    .collect()
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
