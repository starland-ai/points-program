use anchor_lang::prelude::*;

declare_id!("GBmUeF3tu8PfHjpddLH3q4LERPz1Ftq7aXZwVWebfJwr");

#[program]
pub mod starland_points_v1 {
    use super::*;
 
    pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> Result<()> {
        let user_points = &mut ctx.accounts.user_points;

        if user_points.points != 0 {
            return Err(ErrorCode::AlreadyInitialized)?;
        }


        user_points.authority = authority;
        user_points.points = 0;
        user_points.last_signature = [0u8; 96];
        user_points.claim_count = 0;
        Ok(())
    }

    pub fn claim_points(ctx: Context<ClaimPoints>, amount: u64, signature: [u8; 96]) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.authority.key(),
            ctx.accounts.user_points.authority,
            ErrorCode::NotOwner
        );

        ctx.accounts.user_points.points += amount;
        ctx.accounts.user_points.claim_count += 1;
        ctx.accounts.user_points.last_signature = signature;

        Ok(())
    }
}

#[account]
pub struct UserPoints {
    pub authority: Pubkey,
    pub points: u64,              
    pub last_signature: [u8; 96], 
    pub claim_count: u64,         
}


#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer=authority, space=8+32+8+8*96+8)]
    pub user_points: Account<'info, UserPoints>,
    #[account(mut)]
    pub authority: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimPoints<'info> {
    #[account(mut, has_one = authority)]
    pub user_points: Account<'info, UserPoints>,
    #[account()]
    pub authority: Signer<'info>,
}


#[error_code]
pub enum ErrorCode {
    #[msg("Already initialized.")]
    AlreadyInitialized,
    #[msg("Not the owner of the points account.")]
    NotOwner,
}
