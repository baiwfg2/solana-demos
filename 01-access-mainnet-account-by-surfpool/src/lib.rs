  use pinocchio::{
    account_info::AccountInfo,
    instruction::{AccountMeta,Instruction,Signer},
    cpi::invoke,
    entrypoint,
    msg,
    ProgramResult,
    pubkey::Pubkey
  };

  entrypoint!(process_instruction);

  pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
  ) -> ProgramResult {
    msg!("Hello from my program inside the surfpool !");

    let program_to_call = &accounts[0];
    let counter_account = &accounts[1];
    let value = counter_account.try_borrow_data()?.get(15).copied().unwrap_or(0) + 1;
    invoke(&Instruction {
      program_id: program_to_call.key(),
      accounts: &[AccountMeta{
        pubkey: counter_account.key(), is_signer: false, is_writable: true
      }],
      //data: &[3, counter_account.try_borrow_data().unwrap()[15] + 1]
      // the above statement given by Andy reports errors: instruction tries to borrow reference for an account which is already borrowed
      // So I change to the following
      data: &[3, value],
    }, &[counter_account])?; // no pass of program_to_call
    msg!("CPI to counter program successful!");

    Ok(())
  }
