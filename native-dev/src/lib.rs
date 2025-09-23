use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg
};

pub mod state;
pub mod instructions;
pub use instructions::*;

pub mod error;
pub use error::*;

entrypoint!(process_instruction);

pub fn process_instruction(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello, native - movies!");
    movies_review::inst_movies_review(_program_id, _accounts, _instruction_data)?;
    Ok(())
}