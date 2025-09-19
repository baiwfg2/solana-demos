use solana_program::{
    account_info::{AccountInfo},
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
    program_error::ProgramError,
};

use crate::state::MoviesInstruction;

fn add_movie_review(_program_id: &Pubkey, _accounts: &[AccountInfo],
    title: String, rating: u8, description: String) -> ProgramResult {
    msg!("Adding movie review:");
    msg!("Title: {}", title);
    msg!("Rating: {}", rating);
    msg!("Description: {}", description);
    Ok(())
}

pub fn inst_movies_review(program_id: &Pubkey,
    accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
    let inst = MoviesInstruction::unpack(instruction_data)?;
    match inst {
        MoviesInstruction::AddMovieReview { title, rating, description } => {
            add_movie_review(program_id, accounts, title, rating, description)
        },
        _ => Err(ProgramError::InvalidInstructionData),
    }
}