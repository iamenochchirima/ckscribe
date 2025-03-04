use crate::{
    ecdsa_api::ecdsa_sign, schnorr_api, tags::Tag, utils::sec1_to_der, EtchingArgs, STATE,
};
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
use ic_cdk::api::management_canister::bitcoin::{BitcoinNetwork, Utxo};
use ordinals::{Artifact, Etching, Rune, Runestone, SpacedRune, Terms};
use std::str::FromStr;

pub const SIG_HASH_TYPE: EcdsaSighashType = EcdsaSighashType::All;

pub async fn build_and_sign_etching_transaction(
    derivation_path: &Vec<Vec<u8>>,
    owned_utxos: &[Utxo],
    ecdsa_public_key: &[u8],
    schnorr_public_key: &[u8],
    caller_p2pkh_address: String,
    etching_args: EtchingArgs,
) -> (Address, Transaction, Transaction) {
    let SpacedRune { rune, spacers } = SpacedRune::from_str(&etching_args.rune).unwrap();
    let symbol = char::from_u32(etching_args.symbol).unwrap();

    // building the reveal script
    let secp256k1 = Secp256k1::new();

    let schnorr_public_key: XOnlyPublicKey =
        PublicKey::from_slice(schnorr_public_key).unwrap().into();

    const PROTOCOL_ID: [u8; 3] = *b"ord";
    let mut reveal_script = Builder::new()
        .push_slice(schnorr_public_key.serialize())
        .push_opcode(opcodes::all::OP_CHECKSIG)
        .push_opcode(opcodes::OP_FALSE)
        .push_opcode(opcodes::all::OP_IF)
        .push_slice(PROTOCOL_ID);

    Tag::Rune.encode(&mut reveal_script, &Some(rune.commitment()));

    let reveal_script = reveal_script
        .push_opcode(opcodes::all::OP_ENDIF)
        .into_script();

    let taproot_send_info = TaprootBuilder::new()
        .add_leaf(0, reveal_script.clone())
        .unwrap()
        .finalize(&secp256k1, schnorr_public_key)
        .unwrap();

    let control_block = taproot_send_info
        .control_block(&(reveal_script.clone(), LeafVersion::TapScript))
        .unwrap();

    let network = STATE.with_borrow(|state| {
        let network = state.network.as_ref().unwrap();
        match network {
            BitcoinNetwork::Mainnet => Network::Bitcoin,
            BitcoinNetwork::Testnet => Network::Testnet,
            BitcoinNetwork::Regtest => Network::Regtest,
        }
    });
    let caller_address = Address::from_str(&caller_p2pkh_address)
        .unwrap()
        .assume_checked();

    let commit_tx_address = Address::p2tr_tweaked(taproot_send_info.output_key(), network);

    let mut reveal_input = vec![OutPoint::null()];
    let mut reveal_output = vec![];

    let mut pointer = None;
    if etching_args.premine > 0 {
        reveal_output.push(TxOut {
            script_pubkey: caller_address.script_pubkey(),
            value: 10_000, //TODO: Double check this value if it's correct
        });
        pointer = Some(reveal_output.len() as u32 - 1u32);
    }

    let (height, offset) = match (etching_args.height, etching_args.offset) {
        (Some((start, stop)), None) => {
            let height = (Some(start), Some(stop));
            (height, (None, None))
        }
        (None, Some((start, stop))) => {
            let offset = (Some(start), Some(stop));
            ((None, None), offset)
        }
        (Some((h_start, h_stop)), Some((o_start, o_stop))) => {
            let height = (Some(h_start), Some(h_stop));
            let offset = (Some(o_start), Some(o_stop));
            (height, offset)
        }
        (None, None) => ic_cdk::trap("No Term Set"),
    };

    let runestone = Runestone {
        etching: Some(Etching {
            rune: Some(rune),
            symbol: Some(symbol),
            divisibility: Some(etching_args.divisibility),
            premine: Some(etching_args.premine),
            spacers: Some(spacers),
            turbo: etching_args.turbo,
            terms: Some(Terms {
                cap: Some(etching_args.cap),
                amount: Some(etching_args.amount),
                height,
                offset,
            }),
        }),
        edicts: vec![],
        mint: None,
        pointer,
    };

    let script_pubkey = runestone.encipher();
    if script_pubkey.len() > 82 {
        ic_cdk::trap("Exceeds OP_RETURN size of 82")
    }
    reveal_output.push(TxOut {
        script_pubkey,
        value: 0,
    });

    let fee_rate = FeeRate::from_sat_per_vb(etching_args.fee_rate.unwrap_or(10)).unwrap();
    let (_, reveal_fee) = build_reveal_transaction(
        0,
        &control_block,
        fee_rate,
        reveal_output.clone(),
        reveal_input.clone(),
        &reveal_script,
    );

    let mut utxos_to_spend = vec![];
    let mut total_spent = 0;
    owned_utxos.iter().for_each(|utxo| {
        total_spent += utxo.value;
        utxos_to_spend.push(utxo);
    });

    let input = utxos_to_spend
        .into_iter()
        .map(|utxo| TxIn {
            previous_output: OutPoint::new(
                Txid::from_raw_hash(Hash::from_slice(&utxo.outpoint.txid).unwrap()),
                utxo.outpoint.vout,
            ),
            sequence: Sequence::ENABLE_RBF_NO_LOCKTIME,
            witness: Witness::new(),
            script_sig: ScriptBuf::new(),
        })
        .collect::<Vec<TxIn>>();

    let mut commit_tx = Transaction {
        input,
        output: vec![TxOut {
            script_pubkey: commit_tx_address.script_pubkey(),
            value: total_spent,
        }],
        lock_time: LockTime::ZERO,
        version: 2,
    };

    let sig_bytes = 73;
    let commit_fee =
        FeeRate::from_sat_per_vb(fee_rate.to_sat_per_kwu() * commit_tx.vsize() as u64 + sig_bytes)
            .unwrap();
    commit_tx.output[0].value = total_spent - commit_fee.to_sat_per_kwu();

    // signing the commit_tx
    let commit_tx_cache = SighashCache::new(commit_tx.clone());
    for (index, input) in commit_tx.input.iter_mut().enumerate() {
        let sighash = commit_tx_cache
            .legacy_signature_hash(
                index,
                &caller_address.script_pubkey(),
                SIG_HASH_TYPE.to_u32(),
            )
            .unwrap();
        let signature = ecdsa_sign(sighash.to_byte_array().to_vec(), derivation_path.clone()).await;
        let der_signature = sec1_to_der(signature);
        let mut sig_with_hashtype = der_signature;
        sig_with_hashtype.push(SIG_HASH_TYPE.to_u32() as u8);
        input.script_sig = ScriptBuf::builder()
            .push_slice::<&PushBytes>(sig_with_hashtype.as_slice().try_into().unwrap())
            .push_slice::<&PushBytes>(ecdsa_public_key.try_into().unwrap())
            .into_script();
        input.witness.clear();
    }
    let (vout, _) = commit_tx
        .output
        .iter()
        .enumerate()
        .find(|(_vout, output)| output.script_pubkey == commit_tx_address.script_pubkey())
        .unwrap();
    reveal_input[0] = OutPoint {
        txid: commit_tx.txid(),
        vout: vout as u32,
    };
    reveal_output.push(TxOut {
        script_pubkey: caller_address.script_pubkey(),
        value: total_spent - commit_fee.to_sat_per_kwu() - reveal_fee.to_sat(),
    });
    // building the reveal txn
    let mut reveal_tx = Transaction {
        version: 2,
        lock_time: LockTime::ZERO,
        input: reveal_input
            .iter()
            .map(|outpoint| TxIn {
                previous_output: *outpoint,
                witness: Witness::new(),
                script_sig: ScriptBuf::new(),
                sequence: Sequence::from_height(Runestone::COMMIT_CONFIRMATIONS - 1),
            })
            .collect(),
        output: reveal_output,
    };
    for output in reveal_tx.output.iter() {
        if output.value < output.script_pubkey.dust_value().to_sat() {
            ic_cdk::trap("commit txn output would be dust")
        }
    }
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

    let signing_digest = sha256::Hash::hash(&signing_data).to_byte_array();

    let schnorr_signature =
        schnorr_api::schnorr_sign(signing_digest.to_vec().clone(), derivation_path.clone()).await;
    ic_cdk::println!("sig size: {}", schnorr_signature.len());
    // Verify the signature to be sure that signing works
    let secp = bitcoin::secp256k1::Secp256k1::verification_only();

    let sig_ = schnorr::Signature::from_slice(&schnorr_signature).unwrap();
    let msg = Message::from_slice(&signing_digest).unwrap();
    assert!(secp
        .verify_schnorr(&sig_, &msg, &schnorr_public_key)
        .is_ok());

    let witness = sighash_cache.witness_mut(0).unwrap();
    witness.push(
        Signature {
            sig: schnorr::Signature::from_slice(&schnorr_signature).unwrap(),
            hash_ty: TapSighashType::Default,
        }
        .to_vec(),
    );
    witness.push(reveal_script);
    witness.push(&control_block.serialize());
    if Runestone::decipher(&reveal_tx).unwrap() != Artifact::Runestone(runestone) {
        ic_cdk::trap("Runestone mismatched")
    }
    let commit_tx_bytes = consensus::serialize(&commit_tx);
    let reveal_tx_bytes = consensus::serialize(&reveal_tx);
    ic_cdk::println!("Commit tx bytes: {}", hex::encode(commit_tx_bytes));
    ic_cdk::println!("Reveal tx bytes: {}", hex::encode(reveal_tx_bytes));
    (commit_tx_address, commit_tx, reveal_tx)
}

pub fn build_reveal_transaction(
    commit_input_index: usize,
    control_block: &ControlBlock,
    fee_rate: FeeRate,
    output: Vec<TxOut>,
    input: Vec<OutPoint>,
    script: &Script,
) -> (Transaction, Amount) {
    let reveal_txn = Transaction {
        input: input
            .into_iter()
            .map(|previous_output| TxIn {
                previous_output,
                script_sig: Script::builder().into_script(),
                witness: Witness::new(),
                sequence: Sequence::from_height(Runestone::COMMIT_CONFIRMATIONS - 1),
            })
            .collect(),
        output,
        lock_time: LockTime::ZERO,
        version: 2,
    };
    let fee = {
        let mut reveal_txn_clone = reveal_txn.clone();
        for (current_index, txin) in reveal_txn_clone.input.iter_mut().enumerate() {
            if current_index == commit_input_index {
                txin.witness.push(
                    Signature::from_slice(&[0; SCHNORR_SIGNATURE_SIZE])
                        .unwrap()
                        .to_vec(),
                );
                txin.witness.push(script);
                txin.witness.push(control_block.serialize());
            } else {
                txin.witness = Witness::from_slice(&[&[0; SCHNORR_SIGNATURE_SIZE]]);
            }
        }
        Amount::from_sat(
            (fee_rate.to_sat_per_kwu() as f64 * reveal_txn_clone.vsize() as f64).round() as u64,
        )
    };
    (reveal_txn, fee)
}

pub fn check_etching(height: u32, arg: &EtchingArgs) {
    if arg.height.is_none() && arg.offset.is_none() {
        ic_cdk::trap("No mint term selected")
    }
    let network = STATE.with_borrow(|state| match state.network.as_ref().unwrap() {
        BitcoinNetwork::Mainnet => Network::Bitcoin,
        BitcoinNetwork::Testnet => Network::Testnet,
        BitcoinNetwork::Regtest => Network::Regtest,
    });
    let minimum = Rune::minimum_at_height(network, ordinals::Height(height));
    let SpacedRune { rune, spacers: _ } = SpacedRune::from_str(&arg.rune).unwrap();
    if rune < minimum {
        ic_cdk::trap("Rune is less than Minimum")
    }
    if rune.is_reserved() {
        ic_cdk::trap("Rune is reserved")
    }
    if char::from_u32(arg.symbol).is_none() {
        ic_cdk::trap("Failed to validate symbol")
    }
    if arg.amount == 0 || arg.cap == 0 {
        ic_cdk::trap("Can't be Zero")
    }
    if arg.divisibility > 38 {
        ic_cdk::trap("Exceeds max allowed divisibility")
    }
    if let Some((start, stop)) = arg.height {
        if start >= stop {
            ic_cdk::trap("Height Start must be lower than Height Stop")
        }
    }
    if let Some((start, stop)) = arg.offset {
        if start >= stop {
            ic_cdk::trap("Offset Start must be lower than Offset Stop")
        }
    }
}

pub async fn estimate_etching_transaction_fees(
    owned_utxos: &[Utxo],
    schnorr_public_key: &[u8],
    caller_p2pkh_address: String,
    etching_args: EtchingArgs,
) -> (String, String, String) {
    let SpacedRune { rune, spacers } = SpacedRune::from_str(&etching_args.rune).unwrap();
    let symbol = char::from_u32(etching_args.symbol).unwrap();

    let secp256k1 = Secp256k1::new();
    let schnorr_public_key: XOnlyPublicKey =
        PublicKey::from_slice(schnorr_public_key).unwrap().into();

    const PROTOCOL_ID: [u8; 3] = *b"ord";
    let reveal_script = Builder::new()
        .push_slice(schnorr_public_key.serialize())
        .push_opcode(opcodes::all::OP_CHECKSIG)
        .push_opcode(opcodes::OP_FALSE)
        .push_opcode(opcodes::all::OP_IF)
        .push_slice(PROTOCOL_ID)
        .push_opcode(opcodes::all::OP_ENDIF)
        .into_script();

    let caller_address = Address::from_str(&caller_p2pkh_address)
        .unwrap()
        .assume_checked();

    let taproot_send_info = TaprootBuilder::new()
        .add_leaf(0, reveal_script.clone())
        .unwrap()
        .finalize(&secp256k1, schnorr_public_key)
        .unwrap();

    let control_block = taproot_send_info
        .control_block(&(reveal_script.clone(), LeafVersion::TapScript))
        .unwrap();

    let mut reveal_output = vec![];

    if etching_args.premine > 0 {
        reveal_output.push(TxOut {
            script_pubkey: caller_address.script_pubkey(),
            value: 10_000,
        });
    }

    let runestone = Runestone {
        etching: Some(Etching {
            rune: Some(rune),
            symbol: Some(symbol),
            divisibility: Some(etching_args.divisibility),
            premine: Some(etching_args.premine),
            spacers: Some(spacers),
            turbo: etching_args.turbo,
            terms: Some(Terms {
                cap: Some(etching_args.cap),
                amount: Some(etching_args.amount),
                height: match etching_args.height {
                    Some((start, stop)) => (Some(start), Some(stop)),
                    None => (None, None),
                },
                offset: match etching_args.offset {
                    Some((start, stop)) => (Some(start), Some(stop)),
                    None => (None, None),
                },
            }),
        }),
        edicts: vec![],
        mint: None,
        pointer: None,
    };

    let script_pubkey = runestone.encipher();
    if script_pubkey.len() > 82 {
        ic_cdk::trap("Exceeds OP_RETURN size of 82");
    }

    reveal_output.push(TxOut {
        script_pubkey,
        value: 0,
    });

    let fee_rate = FeeRate::from_sat_per_vb(etching_args.fee_rate.unwrap_or(10)).unwrap();

    let (_, reveal_fee) = build_reveal_transaction(
        0,
        &control_block,
        fee_rate,
        reveal_output.clone(),
        vec![OutPoint::null()],
        &reveal_script,
    );

    let mut total_spent = 0;
    let mut utxos_to_spend = vec![];

    owned_utxos.iter().for_each(|utxo| {
        total_spent += utxo.value;
        utxos_to_spend.push(utxo);
    });

    let sig_bytes = 73; // Approximation for signature size
    let commit_fee = FeeRate::from_sat_per_vb(
        fee_rate.to_sat_per_kwu() * (utxos_to_spend.len() + 1) as u64 + sig_bytes,
    )
    .unwrap();

    let total_fees = commit_fee.to_sat_per_kwu() + reveal_fee.to_sat();

    ic_cdk::println!(
        "Estimated commit fee: {}\nEstimated reveal fee: {}",
        commit_fee.to_sat_per_kwu(),
        reveal_fee.to_sat()
    );

    (
        "Commit fee: ".to_string() + &commit_fee.to_sat_per_kwu().to_string(),
        "Reveal fee: ".to_string() + &reveal_fee.to_sat().to_string(),
        "Total fees: ".to_string() + &total_fees.to_string(),
    )
}
