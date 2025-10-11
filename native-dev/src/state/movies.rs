use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    msg,
    program_error::ProgramError,
    program_pack::{IsInitialized, Sealed}, pubkey::Pubkey,
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
    AddComment {
        comment: String,
    },
    InitializeMint,
}

#[derive(BorshDeserialize)]
struct MovieReviewPayload {
    title: String,
    rating: u8,
    description: String,
}

#[derive(BorshSerialize, BorshDeserialize, Default)]
pub struct MovieAccountState {
    /*
     * We add a discriminator field to each struct, 
     * including the existing MovieAccountState. Since we now have multiple account types, 
     * we only need a way to fetch the account type we need from the client. 
     * This discriminator is a string that will filter through accounts when we fetch our program accounts
     */
    pub discriminator: String,
    pub is_initialized: bool,
    pub reviewer: Pubkey,
    pub rating: u8,
    pub title: String,
    pub description: String,
}

impl MovieAccountState {
    pub const DISCRIMINATOR: &'static str = "review";
    pub fn get_account_size(title: String, desc: String) -> usize {
        return 4 + MovieAccountState::DISCRIMINATOR.len()
            + 1
            + 32
            + 1
            + 4 + title.len()
            + 4 + desc.len();
    }
}

// Sealed is Solana's version of Rust's Sized trait. This simply specifies
//that MovieAccountState has a known size and provides for some compiler optimizations.
impl Sealed for MovieAccountState {}

impl IsInitialized for MovieAccountState {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

#[derive(BorshSerialize, BorshDeserialize)]
pub struct MovieCommentCounter {
    pub discriminator: String,
    pub is_initialized: bool,
    pub counter: u64
}

impl MovieCommentCounter {
    pub const DISCRIMINATOR: &'static str = "counter";
    pub const SIZE: usize = 4 + MovieCommentCounter::DISCRIMINATOR.len() + 1 + 8;
}

impl IsInitialized for MovieCommentCounter {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

#[derive(BorshSerialize, BorshDeserialize)]
pub struct MovieComment {
    pub discriminator: String,
    pub is_initialized: bool,
    pub reviewer: Pubkey,
    pub commenter: Pubkey,
    pub comment: String,
    pub count: u64
}

impl MovieComment {
    pub const DISCRIMINATOR: &'static str = "comment";
    pub fn get_account_size(comment: String) -> usize {
        return 4 + MovieComment::DISCRIMINATOR.len()
            + 1
            + 32
            + 32
            + 4 + comment.len()
            + 8;
    }
}

impl IsInitialized for MovieComment {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

#[derive(BorshDeserialize)]
struct CommentPayload {
    comment: String,
}

impl MoviesInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&variant, rest) = input
            .split_first()
            .ok_or(ProgramError::InvalidInstructionData)?;
        Ok(match variant {
            0 => {
                let payload = MovieReviewPayload::try_from_slice(rest)
                    .map_err(|_| ProgramError::InvalidInstructionData)?;
                Self::AddMovieReview {
                    title: payload.title,
                    rating: payload.rating,
                    description: payload.description,
                }
            }
            1 => {
                let payload = MovieReviewPayload::try_from_slice(rest)
                    .map_err(|_| ProgramError::InvalidInstructionData)?;
                Self::UpdateMovieReview {
                    title: payload.title,
                    rating: payload.rating,
                    description: payload.description,
                }
            }
            2 => {
                let payload = CommentPayload::try_from_slice(rest).unwrap();
                Self::AddComment {
                    comment: payload.comment,
                }
            }
            3 => Self::InitializeMint,
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }
}
