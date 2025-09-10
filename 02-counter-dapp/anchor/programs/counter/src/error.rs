use anchor_lang::prelude::*;

#[error_code]
pub enum CounterError {
    #[msg("custom error message")]
    Underflow,
}
