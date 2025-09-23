use solana_program::{
    account_info::{next_account_info, AccountInfo},
    borsh1::try_from_slice_unchecked,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

// MovieAccountState::try_from_slice and serialize
use crate::state::MoviesInstruction;
use crate::{state::MovieAccountState, ReviewError};
use borsh::{BorshDeserialize, BorshSerialize};

fn add_movie_review(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    title: String,
    rating: u8,
    description: String,
) -> ProgramResult {
    if rating < 1 || rating > 5 {
        msg!("movies-review: Invalid rating: {}", rating);
        return Err(ReviewError::InvalidRating.into());
    }

    let accounts_iter = &mut accounts.iter();
    let payer = next_account_info(accounts_iter)?;
    let pda_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    if !payer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Even though pda_account should reference the same account, you still need to call
    // find_program_address() as the bump seed is required for the derivation
    let (pda, bump_seed) =
        Pubkey::find_program_address(&[payer.key.as_ref(), title.as_bytes().as_ref()], program_id);
    if pda != *pda_account.key {
        msg!("movies-review: Invalid PDA: {}", pda);
        return Err(ReviewError::InvalidPDA.into());
    }
    let account_len: usize = 1 + 1 + 4 + title.len() + 4 + description.len();
    if account_len > 1000 {
        msg!("Invalid data length: {}", account_len);
        return Err(ReviewError::InvalidDataLength.into());
    }
    let rent = Rent::get()?;
    let required_lamports = rent.minimum_balance(account_len);

    let cpi_inst = &system_instruction::create_account(
        payer.key,
        pda_account.key,
        required_lamports,
        account_len as u64, // usize -> u64 is always safe, so skip use try_into()
        program_id,
    );
    let seeds = &[payer.key.as_ref(), title.as_bytes().as_ref(), &[bump_seed]];
    let account_infos = &[payer.clone(), pda_account.clone(), system_program.clone()];
    invoke_signed(cpi_inst, account_infos, &[seeds])?;
    msg!("movies-review: PDA created: {}", pda);
    let mut account_data = MovieAccountState::try_from_slice(&pda_account.data.borrow())
        .unwrap_or(MovieAccountState::default());
    //let mut account_data = try_from_slice_unchecked::<MovieAccountState>(&pda_account.data.borrow()).unwrap();
    if account_data.is_initialized {
        msg!("Account already initialized");
        return Err(ProgramError::AccountAlreadyInitialized);
    }
    account_data.is_initialized = true;
    account_data.rating = rating;
    account_data.title = title;
    account_data.description = description;

    // account_data.serialize(&mut &mut pda_account.data.borrow_mut()[..])?;
    // more clear:
    let mut data = pda_account.data.borrow_mut();
    account_data.serialize(&mut data.as_mut())?;
    Ok(())
}

fn update_check(
    program_id: &Pubkey,
    pda_account: &AccountInfo,
    payer: &AccountInfo,
    title: &String,
    rating: u8,
    description: &String,
) -> ProgramResult {
    if pda_account.owner != program_id {
        return Err(ProgramError::IllegalOwner);
    }
    if !payer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    let (pda, _bump_seed) =
        Pubkey::find_program_address(&[payer.key.as_ref(), title.as_bytes().as_ref()], program_id);
    if pda != *pda_account.key {
        return Err(ReviewError::InvalidPDA.into());
    }

    if rating < 1 || rating > 5 {
        return Err(ReviewError::InvalidRating.into());
    }
    // better to re-calculate rent
    let total_len: usize = 1 + 1 + 4 + title.len() + 4 + description.len();
    if total_len > 1000 {
        return Err(ReviewError::InvalidDataLength.into());
    }
    Ok(())
}

fn update_movie_review(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    title: String,
    rating: u8,
    description: String,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let payer = next_account_info(accounts_iter)?;
    let pda_account = next_account_info(accounts_iter)?;

    update_check(program_id, pda_account, payer, &title, rating, &description)?;

    let mut account_data =
        try_from_slice_unchecked::<MovieAccountState>(&pda_account.data.borrow()).unwrap();
    if !account_data.is_initialized {
        return Err(ReviewError::UninitializedAccount.into());
    }
    account_data.rating = rating;
    account_data.description = description;
    account_data.serialize(&mut &mut pda_account.data.borrow_mut()[..])?;

    Ok(())
}

pub fn inst_movies_review(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let inst = MoviesInstruction::unpack(instruction_data)?;
    match inst {
        MoviesInstruction::AddMovieReview {
            title,
            rating,
            description,
        } => add_movie_review(program_id, accounts, title, rating, description),

        MoviesInstruction::UpdateMovieReview {
            title,
            rating,
            description,
        } => update_movie_review(program_id, accounts, title, rating, description),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}
