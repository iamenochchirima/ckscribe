use candid::CandidType;
use ic_cdk::api::management_canister::bitcoin::BitcoinNetwork;
use serde::Deserialize;

pub type Height = u32;
pub type BlockHeader = Vec<u8>;

/// Element in the Response of [bitcoin_get_current_fee_percentiles](super::bitcoin_get_current_fee_percentiles).
pub type MillisatoshiPerByte = u64;

/// A request for getting the block headers for a given height range.
#[derive(CandidType, Debug, Deserialize, PartialEq, Eq)]
pub struct GetBlockHeadersRequest {
    pub start_height: Height,
    pub end_height: Option<Height>,
    pub network: BitcoinNetwork,
}

/// The response returned for a request for getting the block headers from a given height.
#[derive(CandidType, Debug, Deserialize, PartialEq, Eq, Clone)]
pub struct GetBlockHeadersResponse {
    pub tip_height: Height,
    pub block_headers: Vec<BlockHeader>,
}
