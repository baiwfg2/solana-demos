use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::PdaCounter;

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        space = PdaCounter::LEN,
        seeds = [b"pdacounter"],
        bump
    )]
    pub counter: Account<'info, PdaCounter>,

    #[account(
        mut,
        seeds = [b"vault", payer.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn incre(ctx: Context<Increment>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count += 1;
    msg!("incre pda counter to {}", counter.count);

    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.payer.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
    };
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    system_program::transfer(cpi_ctx, 1_000_000)?;
    Ok(())
}
