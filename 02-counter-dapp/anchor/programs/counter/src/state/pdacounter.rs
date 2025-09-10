use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PdaCounter {
    pub count: u64,
}

impl PdaCounter {
    pub const LEN: usize = Self::DISCRIMINATOR.len() + Self::INIT_SPACE;
}