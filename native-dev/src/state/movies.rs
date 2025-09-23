use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    msg,
    program_error::ProgramError,
    program_pack::{IsInitialized, Sealed},
};

// strictly speak, it deesn't belong to state which is meant to be persisted on-chain
pub enum MoviesInstruction {
    AddMovieReview {
        title: String,
        rating: u8,
        description: String,
    },
    UpdateMovieReview {
        title: String,
        rating: u8,
        description: String,
    },
}

#[derive(BorshDeserialize)]
struct MovieReviewPayload {
    title: String,
    rating: u8,
    description: String,
}

#[derive(BorshSerialize, BorshDeserialize, Default)]
pub struct MovieAccountState {
    pub is_initialized: bool,
    pub rating: u8,
    pub title: String,
    pub description: String,
}

// Sealed is Solana's version of Rust's Sized trait. This simply specifies
//that MovieAccountState has a known size and provides for some compiler optimizations.
impl Sealed for MovieAccountState {}

impl IsInitialized for MovieAccountState {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl MoviesInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&variant, rest) = input
            .split_first()
            .ok_or(ProgramError::InvalidInstructionData)?;
        let payload = MovieReviewPayload::try_from_slice(rest)
            .map_err(|_| ProgramError::InvalidInstructionData)?;
        match variant {
            0 => Ok(Self::AddMovieReview {
                title: payload.title,
                rating: payload.rating,
                description: payload.description,
            }),
            1 => Ok(Self::UpdateMovieReview {
                title: payload.title,
                rating: payload.rating,
                description: payload.description,
            }),
            _ => Err(ProgramError::InvalidInstructionData),
        }
    }
}
