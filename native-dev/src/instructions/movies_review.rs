use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    system_instruction,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    // for Rent::get()
    sysvar::Sysvar,
};

// MovieAccountState::try_from_slice and serialize
use borsh::{BorshSerialize, BorshDeserialize};
use crate::state::MovieAccountState;
use crate::state::MoviesInstruction;

fn add_movie_review(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    title: String,
    rating: u8,
    description: String,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let payer = next_account_info(accounts_iter)?;
    let pda_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    // Even though pda_account should reference the same account, you still need to call
    // find_program_address() as the bump seed is required for the derivation
    let (pda, bump_seed) =
        Pubkey::find_program_address(&[payer.key.as_ref(), title.as_bytes().as_ref()], program_id);
    let account_len: usize = 1 + 1 + 4 + title.len() + 4 + description.len();
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
        _ => Err(ProgramError::InvalidInstructionData),
    }
}
