// This line tells Clippy "don't warn me about large error types in Result" for this entire file
#![allow(clippy::result_large_err)]
#![allow(warnings)]
#![allow(unused)]
#![allow(dead_code)]
// or RUSTFLAGS="-A warnings" anchor build

use anchor_lang::prelude::*;

pub mod instructions;
pub use instructions::*;

pub mod state;
// 只有在根模块（lib.rs）中声明的模块，才能被其他模块通过 crate:: 路径访问
pub mod error;

/*
pub use state::*;
由于 lib.rs 中的 pub use state::*; 把 state 模块中
的所有公共项都重导出到了 crate 根部，所以 crate::PdaCounter 是有效的

如果想写完全路径，则在lib.rs 只加上 pub mod state
*/

declare_id!("6KF9cy5LX8xq3rVEb8qF6C4n3z1ot9daDB9s7nRVEwuv");

#[program]
pub mod counter {
    use super::*;

    pub fn close(ctx: Context<CloseCounter>) -> Result<()> {
        msg!("closing counter at value: {}", ctx.accounts.counter.count);
        Ok(())
    }

    pub fn decrement(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.counter.count = ctx.accounts.counter.count.checked_sub(1).unwrap();
        Ok(())
    }

    pub fn increment(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.counter.count = ctx.accounts.counter.count.checked_add(1).unwrap();
        Ok(())
    }

    pub fn initialize(ctx: Context<InitializeCounter>) -> Result<()> {
        let init_counter = &mut ctx.accounts.counter;
        init_counter.count = 0;
        Ok(())
    }

    pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
        ctx.accounts.counter.count = value.clone();
        Ok(())
    }

    pub fn incre(ctx: Context<Increment>) -> Result<()> {
        instructions::increment::incre(ctx)
    }
}

#[derive(Accounts)]
pub struct InitializeCounter<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        space = 8 + Counter::INIT_SPACE,
        payer = payer
    )]
    pub counter: Account<'info, Counter>,
    #[account(
        mut,
        seeds = [b"vault", payer.key().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseCounter<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        close = payer, // close account and return lamports to payer
    )]
    pub counter: Account<'info, Counter>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    count: u8,
}
