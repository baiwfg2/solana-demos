use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::PdaCounter;
use crate::error::CounterError;

#[derive(Accounts)]
pub struct Decrement<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
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

pub fn decre(ctx: Context<Decrement>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    require!(counter.count > 0, CounterError::Underflow);
    counter.count = counter.count.checked_sub(1).unwrap();
    msg!("decre pda counter to {}", counter.count);

    // get the user's public key to create seeds for vault PDA
    let user_key = ctx.accounts.payer.key();
    // 包含3个字节切片引用的数组
    let seeds = [
        b"vault",
        user_key.as_ref(),
        &[ctx.bumps.vault],
    ];
    /*
    对 &seeds[..]的解释：
    seeds[..] 将数组转换为切片：&[&[u8]]
    外层的 & 创建对这个切片的引用：&&[&[u8]]

    -- 为什么需要这种嵌套结构？
    最外层 &[]：多个签名者的数组
    中间层 &[]：单个签名者的种子数组
    最内层 &[u8]：实际的种子字节
     */
    let signer_seeds = &[&seeds[..]];
    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.payer.to_account_info(),
    };
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_ctx = CpiContext::new(
        cpi_program, cpi_accounts).with_signer(signer_seeds);
    system_program::transfer(cpi_ctx, 1_000_000)?;
    Ok(())
}