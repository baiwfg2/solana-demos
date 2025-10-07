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
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello, native - movies!");
    movies_review::inst_movies_review(program_id, accounts, instruction_data)?;
    Ok(())
}