use crate::wallet::wallet_types::GetBlockHeadersRequest;
use crate::STATE;
use bitcoin::{sighash::EcdsaSighashType, Transaction,
    absolute::LockTime, blockdata::witness::Witness, hashes::Hash, Address, OutPoint,
    ScriptBuf, Sequence, TxIn, TxOut, Txid,
};
use hex::ToHex;
use ic_cdk::api::management_canister::bitcoin::{bitcoin_get_current_fee_percentiles, BitcoinNetwork, GetCurrentFeePercentilesRequest, GetUtxosResponse, MillisatoshiPerByte, Utxo};
use candid::Principal;
use ic_cdk::println;

pub const SIG_HASH_TYPE: EcdsaSighashType = EcdsaSighashType::All;

pub async fn get_balance_of(address: String) -> u64 {
    let network = STATE.with_borrow(|state| *state.network.as_ref().unwrap());
    ic_cdk::api::management_canister::bitcoin::bitcoin_get_balance(
        ic_cdk::api::management_canister::bitcoin::GetBalanceRequest {
            address,
            network,
            min_confirmations: None,
        },
    )
    .await
    .unwrap()
    .0
}

pub async fn get_utxos_of(address: String) -> GetUtxosResponse {
    println!("Getting UTXOs for address: {}", address);

    let network = STATE.with_borrow(|state| *state.network.as_ref().unwrap());
    println!("Network: {:?}", network);

    let response = ic_cdk::api::management_canister::bitcoin::bitcoin_get_utxos(
        ic_cdk::api::management_canister::bitcoin::GetUtxosRequest {
            address,
            network,
            filter: None,
        },
    )
    .await
    .unwrap()
    .0;

    println!("Received response: {:?}", response);

    response
}

pub async fn send_bitcoin_transaction(txn: Transaction) -> String {
    let transaction = bitcoin::consensus::serialize(&txn);
    let network = STATE.with_borrow(|state| *state.network.as_ref().unwrap());
    ic_cdk::api::management_canister::bitcoin::bitcoin_send_transaction(
        ic_cdk::api::management_canister::bitcoin::SendTransactionRequest {
            transaction,
            network,
        },
    )
    .await
    .unwrap();
    txn.txid().encode_hex()
}

/// Returns the block headers in the given height range.
pub(crate) async fn get_block_headers(network: BitcoinNetwork, start_height: u32, end_height: Option<u32>) -> GetBlockHeadersResponse{
    let cycles = match network {
        BitcoinNetwork::Mainnet => 10_000_000_000,
        BitcoinNetwork::Testnet => 10_000_000_000,
        BitcoinNetwork::Regtest => 0,
    };

    let request = GetBlockHeadersRequest{
        start_height,
        end_height,
        network
    };

    let res = ic_cdk::api::call::call_with_payment128::<(GetBlockHeadersRequest,), (GetBlockHeadersResponse,)>(
        Principal::management_canister(),
        "bitcoin_get_block_headers",
        (request,),
        cycles,
    )
    .await;

    res.unwrap().0
}

pub async fn get_current_fee_percentiles(network: BitcoinNetwork) -> Vec<MillisatoshiPerByte> {
    let res =
        bitcoin_get_current_fee_percentiles(GetCurrentFeePercentilesRequest { network }).await;

    res.unwrap().0
}

pub fn build_transaction_with_fee(
    own_utxos: &[Utxo],
    own_address: &Address,
    dst_address: &Address,
    amount: u64,
    fee: u64,
) -> Result<(Transaction, Vec<TxOut>), String> {
    // Assume that any amount below this threshold is dust.
    const DUST_THRESHOLD: u64 = 1_000;

    // Select which UTXOs to spend. We naively spend the oldest available UTXOs,
    // even if they were previously spent in a transaction. This isn't a
    // problem as long as at most one transaction is created per block and
    // we're using min_confirmations of 1.
    let mut utxos_to_spend = vec![];
    let mut total_spent = 0;
    for utxo in own_utxos.iter().rev() {
        total_spent += utxo.value;
        utxos_to_spend.push(utxo);
        if total_spent >= amount + fee {
            // We have enough inputs to cover the amount we want to spend.
            break;
        }
    }

    if total_spent < amount + fee {
        return Err(format!(
            "Insufficient balance: {}, trying to transfer {} satoshi with fee {}",
            total_spent, amount, fee
        ));
    }

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

    let prevouts = utxos_to_spend
        .into_iter()
        .map(|utxo| TxOut {
            value: utxo.value,
            script_pubkey: own_address.script_pubkey(),
        })
        .collect();

    let mut outputs = vec![TxOut {
        script_pubkey: dst_address.script_pubkey(),
        value: amount,
    }];

    let remaining_amount = total_spent - amount - fee;

    if remaining_amount >= DUST_THRESHOLD {
        outputs.push(TxOut {
            script_pubkey: own_address.script_pubkey(),
            value: remaining_amount,
        });
    }

    Ok((
        Transaction {
            input: inputs,
            output: outputs,
            lock_time: LockTime::ZERO,
            version: 2,
        },
        prevouts,
    ))
}