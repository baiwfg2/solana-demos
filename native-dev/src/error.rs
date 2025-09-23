use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ReviewError {
    #[error("Account not initialized yet")]
    UninitializedAccount,
    #[error("PDA derived does not equal to PDA passed in")]
    InvalidPDA,
    #[error("input data exceeds maximum length")]
    InvalidDataLength,
    #[error("Rating greater than 5 or less than 1")]
    InvalidRating,
}

impl From<ReviewError> for ProgramError {
    fn from(e: ReviewError) -> Self {
        ProgramError::Custom(e as u32)
    }
}