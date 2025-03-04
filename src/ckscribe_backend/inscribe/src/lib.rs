#![warn(missing_debug_implementations)]

use std::{cell::RefCell, collections::HashMap, time::Duration};

use bitcoin::Transaction;
use candid::{CandidType, Principal};
use ckbtc_api::{CkBTC, CkBTCMinter};
use hex::ToHex;
use ic_cdk::{
    api::management_canister::{
        bitcoin::{BitcoinNetwork, Utxo},
        ecdsa::{EcdsaCurve, EcdsaKeyId},
    }, init, post_upgrade, pre_upgrade, query, update
};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    writer::Writer,
    DefaultMemoryImpl, Memory as _,
};
use icrc_ledger_types::icrc1::account::Account;
use ordinals::Runestone;
use serde::{Deserialize, Serialize};
use slotmap::{Key, KeyData};
use wallet::{etch::{build_and_sign_etching_transaction, check_etching, estimate_etching_transaction_fees}, mint::build_and_sign_mint_transaction};

use crate::{
    ecdsa_api::get_ecdsa_public_key,
    schnorr_api::get_schnorr_public_key,
    utils::{always_fail, generate_derivation_path, public_key_to_p2pkh_address},
};
pub mod wallet;
pub mod btc_api;
pub mod ckbtc_api;
pub mod ecdsa_api;
pub mod schnorr_api;
pub mod tags;
pub mod utils;
pub mod test_fns;
pub mod types;

pub use types::*;


#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum EcdsaKeyIds {
    TestKey1,
    ProductionKey,
    TestKeyLocalDevelopment,
}

impl EcdsaKeyIds {
    pub fn to_key_id(&self) -> EcdsaKeyId {
        EcdsaKeyId {
            curve: EcdsaCurve::Secp256k1,
            name: match self {
                Self::TestKey1 => "test_key_1".into(),
                Self::ProductionKey => "key_1".into(),
                Self::TestKeyLocalDevelopment => "dfx_test_key".into(),
            },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueuedRevealTxn {
    pub reveal_txn: Transaction,
    pub timer_id: KeyData,
    pub commit_tx_address: String,
}

#[derive(Default, Debug, Serialize, Deserialize)]
pub struct State {
    pub ckbtc_ledger: Option<Principal>,
    pub ckbtc_minter: Option<Principal>,
    pub network: Option<BitcoinNetwork>,
    pub ecdsa_key: Option<EcdsaKeyIds>,
    pub schnorr_key: Option<SchnorrKeyId>,
    pub queue_count: u128,
    pub timer_for_reveal_txn: u32,
    pub reveal_txn_in_queue: HashMap<u128, QueuedRevealTxn>,
}

pub type Memory = VirtualMemory<DefaultMemoryImpl>;

pub fn get_upgrade_memory() -> Memory {
    MEMORY_MANAGER.with_borrow(|memory| memory.get(MemoryId::new(0)))
}

thread_local! {
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    pub static STATE: RefCell<State> = RefCell::default();
}

#[derive(CandidType, Deserialize, Debug)]
pub struct InitArgs {
    pub ckbtc_ledger: Principal,
    pub ckbtc_minter: Principal,
    pub network: BitcoinNetwork,
    pub timer_for_reveal_txn: u32, // should be provided as mins
}

#[init]
pub fn init(arg: InitArgs) {
    getrandom::register_custom_getrandom!(always_fail);
    let (ecdsa_key_id, schnorr_key) = match arg.network {
        BitcoinNetwork::Mainnet => (
            EcdsaKeyIds::ProductionKey,
            SchnorrKeyId {
                name: "test_key_1".to_string(),
                algorithm: types::SchnorrAlgorithm::Bip340Secp256k1,
            },
        ),
        BitcoinNetwork::Regtest => (
            EcdsaKeyIds::TestKeyLocalDevelopment,
            SchnorrKeyId {
                name: "dfx_test_key".to_string(),
                algorithm: types::SchnorrAlgorithm::Bip340Secp256k1,
            },
        ),
        BitcoinNetwork::Testnet => (
            EcdsaKeyIds::TestKey1,
            SchnorrKeyId {
                name: "test_key_1".to_string(),
                algorithm: types::SchnorrAlgorithm::Bip340Secp256k1,
            },
        ),
    };
    STATE.with_borrow_mut(|state| {
        state.network = Some(arg.network);
        state.ckbtc_minter = Some(arg.ckbtc_minter);
        state.ckbtc_ledger = Some(arg.ckbtc_ledger);
        state.ecdsa_key = Some(ecdsa_key_id);
        state.schnorr_key = Some(schnorr_key);
        state.timer_for_reveal_txn = arg.timer_for_reveal_txn;
    })
}

#[pre_upgrade]
pub fn pre_upgrade() {
    let mut state_bytes = vec![];
    STATE
        .with_borrow(|s| ciborium::ser::into_writer(&s, &mut state_bytes))
        .expect("Failed to write bytes");
    let len = state_bytes.len() as u32;
    let mut memory = get_upgrade_memory();
    let mut writer = Writer::new(&mut memory, 0);
    writer.write(&len.to_le_bytes()).unwrap();
    writer.write(&state_bytes).unwrap();
}

#[post_upgrade]
pub fn post_upgrade() {
    let memory = get_upgrade_memory();

    // Read the length of the state bytes.
    let mut state_len_bytes = [0; 4];
    memory.read(0, &mut state_len_bytes);
    let state_len = u32::from_le_bytes(state_len_bytes) as usize;

    // Read the bytes
    let mut state_bytes = vec![0; state_len];
    memory.read(4, &mut state_bytes);

    // Deserialize and set the state.
    let state = ciborium::de::from_reader(&*state_bytes).expect("failed to decode state");
    STATE.with(|s| *s.borrow_mut() = state);
}

#[update]
pub async fn get_deposit_address_for_bitcoin() -> String {
    let caller = ic_cdk::id();
    let derivation_path = generate_derivation_path(&caller);
    let ecdsa_public_key = get_ecdsa_public_key(derivation_path).await;
    public_key_to_p2pkh_address(&ecdsa_public_key)
}

#[update]
pub async fn get_btc_balance() -> u64 {
    let caller = ic_cdk::id();
    let derivation_path = generate_derivation_path(&caller);
    let ecdsa_public_key = get_ecdsa_public_key(derivation_path).await;
    let address = public_key_to_p2pkh_address(&ecdsa_public_key);
    btc_api::get_balance_of(address).await
}

#[update]
pub async fn get_adddress_balance(address: String) -> u64 {
    btc_api::get_balance_of(address).await
}

#[query]
pub fn get_deposit_address_for_ckbtc() -> String {
    Account {
        owner: ic_cdk::id(),
        subaccount: None,
    }
    .to_string()
}

#[query(composite = true)]
pub async fn get_estimated_cbktc_conversion_fee() -> u64 {
    let ckbtc_minter = STATE.with_borrow(|state| CkBTCMinter::new(state.ckbtc_minter.unwrap()));
    let response = ckbtc_minter.estimate_withdrawal_fee(None).await;
    response.bitcoin_fee + response.minter_fee
}

#[update]
pub async fn confirm_and_convert_ckbtc() -> u64 {
    let caller = ic_cdk::id();
    let account = Account {
        owner: caller,
        subaccount: None,
    };
    let (ckbtc_minter, ckbtc_ledger) = STATE.with_borrow(|state| {
        let ckbtc_minter = CkBTCMinter::new(state.ckbtc_minter.unwrap());
        let ckbtc_ledger = CkBTC::new(state.ckbtc_ledger.unwrap());
        (ckbtc_minter, ckbtc_ledger)
    });
    let balance = ckbtc_ledger.get_balance_of(account).await;
    let balance = u64::try_from(balance).unwrap();
    ic_cdk::println!("Balance: {}", balance);
    let estimated_fee = ckbtc_minter.estimate_withdrawal_fee(Some(balance)).await;
    let deposit_fee = ckbtc_minter.get_deposit_fee().await;
    let total_fee = estimated_fee.bitcoin_fee + estimated_fee.minter_fee;

    ic_cdk::println!("\n\n\n\n\n");
    ic_cdk::println!("Deposit Fee: {}", deposit_fee);
    ic_cdk::println!("Total Fee: {}", total_fee);
    ic_cdk::println!("Balance: {}", balance);
    ic_cdk::println!("\n\n\n\n\n");

    if balance <= total_fee + deposit_fee + 20000 {
        let err_msg = format!(
            "Balance too Low! Current Balance: {}, Expected atleast {}",
            balance,
            total_fee + deposit_fee + 20000
        );
        ic_cdk::trap(&err_msg)
    }
    let derivation_path =  generate_derivation_path(&caller);
    let ecdsa_public_key = get_ecdsa_public_key(derivation_path.clone()).await;
    let p2pkh_address = public_key_to_p2pkh_address(&ecdsa_public_key);
    let ckbtc_deposit_address = ckbtc_minter.get_withdrawal_account().await;
    if let Err(e) = ckbtc_ledger
        .icrc1_transfer(ckbtc_deposit_address, balance as u128)
        .await
    {
        let err_msg = format!("{:?}", e);
        ic_cdk::trap(&err_msg)
    }
    let amount = balance - 10 - total_fee - deposit_fee;

    ic_cdk::println!("\n\n\n\n\n");
    ic_cdk::println!("Amount: {}", amount);
    ic_cdk::println!("\n\n\n\n\n");

    match ckbtc_minter
        .retrieve_btc(ckbtc_api::RetrieveBtcArgs {
            address: p2pkh_address,
            amount,
        })
        .await
    {
        Ok(index) => index.block_index,
        Err(e) => {
            let err_msg = format!("{:?}", e);
            ic_cdk::trap(&err_msg)
        }
    }
}

#[query(composite = true)]
pub async fn query_conversion_status(block_index: u64) -> String {
    let ckbtc_minter = STATE.with_borrow(|state| {
        let canister_id = *state.ckbtc_minter.as_ref().unwrap();
        CkBTCMinter::new(canister_id)
    });
    ckbtc_minter
        .retrieve_btc_status_v2(ckbtc_api::RetrieveBtcStatusArgs { block_index })
        .await
        .to_string()
}

#[derive(CandidType, Deserialize, Debug)]
pub struct EtchingArgs {
    pub divisibility: u8,
    pub symbol: u32,
    pub rune: String,
    pub amount: u128,
    pub cap: u128,
    pub turbo: bool,
    pub premine: u128,
    pub height: Option<(u64, u64)>,
    pub offset: Option<(u64, u64)>,
    pub fee_rate: Option<u64>,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct RuneMintId {
    pub block: u64,
    pub tx: u32,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct MintArgs {
    pub rune_id: RuneMintId,
    pub amount: u64,
    pub dst: String,
    pub fee_rate: Option<u64>,
}


#[update]
pub async fn etch_rune(mut args: EtchingArgs) -> (String, String) {
    let caller = ic_cdk::id();
    args.rune = args.rune.to_ascii_uppercase();
    let derivation_path = generate_derivation_path(&caller);
    let ecdsa_public_key = get_ecdsa_public_key(derivation_path.clone()).await;
    let schnorr_public_key = get_schnorr_public_key(derivation_path.clone()).await;
    let caller_p2pkh_address = public_key_to_p2pkh_address(&ecdsa_public_key);
    let balance = btc_api::get_balance_of(caller_p2pkh_address.clone()).await;
    if balance < 10_000_000 {
        ic_cdk::trap("Not enough balance")
    }
    let utxos_response = btc_api::get_utxos_of(caller_p2pkh_address.clone()).await;
    check_etching(utxos_response.tip_height, &args);
    let (commit_tx_address, commit_tx, reveal_tx) = build_and_sign_etching_transaction(
        &derivation_path,
        &utxos_response.utxos,
        &ecdsa_public_key,
        &schnorr_public_key,
        caller_p2pkh_address,
        args,
    )
    .await;
    let commit_txid = btc_api::send_bitcoin_transaction(commit_tx).await;
    let id = STATE.with_borrow_mut(|state| {
        let id = state.queue_count;
        state.queue_count += 1;
        id
    });
    let time = STATE.with_borrow(|state| state.timer_for_reveal_txn as u64 * 60);
    let timer_id = ic_cdk_timers::set_timer_interval(Duration::from_secs(time), move || {
        ic_cdk::spawn(confirm_min_commitment_and_send_reveal_txn(id))
    });
    let queue_txn = QueuedRevealTxn {
        commit_tx_address: commit_tx_address.to_string(),
        reveal_txn: reveal_tx.clone(),
        timer_id: timer_id.data(),
    };
    STATE.with_borrow_mut(|state| state.reveal_txn_in_queue.insert(id, queue_txn));
    (commit_txid, reveal_tx.txid().encode_hex())
}

pub async fn confirm_min_commitment_and_send_reveal_txn(id: u128) {
    let reveal_txn = STATE.with_borrow(|state| state.reveal_txn_in_queue.get(&id).unwrap().clone());
    let utxos_response = btc_api::get_utxos_of(reveal_txn.commit_tx_address).await;
    let utxos = utxos_response.utxos;
    if utxos.is_empty() {
        ic_cdk::trap("No UTXOs Found")
    }
    if utxos_response.tip_height - utxos[0].height < Runestone::COMMIT_CONFIRMATIONS as u32 - 1 {
        ic_cdk::trap("Not enough commit confirmation")
    }
    btc_api::send_bitcoin_transaction(reveal_txn.reveal_txn).await;
    ic_cdk_timers::clear_timer(reveal_txn.timer_id.into());
    STATE.with_borrow_mut(|state| state.reveal_txn_in_queue.remove(&id));
}


#[update]
pub async fn mint_runes(args: MintArgs) -> String {
    let caller = ic_cdk::id();
    let derivation_path = generate_derivation_path(&caller);
    let ecdsa_public_key = get_ecdsa_public_key(derivation_path.clone()).await;
    let own_p2pkh_address = public_key_to_p2pkh_address(&ecdsa_public_key);
    let key_name = STATE.with_borrow(|state| state.ecdsa_key.as_ref().unwrap().to_key_id().name.clone());
    let balance = btc_api::get_balance_of(own_p2pkh_address.clone()).await;
    if balance < 10_000_000 {
        ic_cdk::trap("Not enough balance")
    }
    let utxos_response = btc_api::get_utxos_of(own_p2pkh_address.clone()).await;
    let mint_txn = build_and_sign_mint_transaction(
        &derivation_path,
        &utxos_response.utxos,
        &ecdsa_public_key,
        key_name,
        own_p2pkh_address,
        args,
    )
    .await;
    btc_api::send_bitcoin_transaction(mint_txn).await
}

#[update]
pub async fn get_utxos() -> Vec<Utxo> {
    let caller = ic_cdk::id();
    let derivation_path = generate_derivation_path(&caller);
    let ecdsa_public_key = get_ecdsa_public_key(derivation_path.clone()).await;
    let caller_p2pkh_address = public_key_to_p2pkh_address(&ecdsa_public_key);
    let utxos_response = btc_api::get_utxos_of(caller_p2pkh_address).await;
    utxos_response.utxos
}

#[update]
pub async fn estimate_etching_fee(args: EtchingArgs) -> (String, String, String){
    let caller = ic_cdk::id();
    let derivation_path = generate_derivation_path(&caller);
    let ecdsa_public_key = get_ecdsa_public_key(derivation_path.clone()).await;
    let schnorr_public_key = get_schnorr_public_key(derivation_path.clone()).await;
    let caller_p2pkh_address = public_key_to_p2pkh_address(&ecdsa_public_key);

    // Fetch the UTXOs for the caller's address
    let utxos_response = btc_api::get_utxos_of(caller_p2pkh_address.clone()).await;

    estimate_etching_transaction_fees(&utxos_response.utxos, &schnorr_public_key, caller_p2pkh_address, args).await
}


ic_cdk::export_candid!();
