use anchor_lang::prelude::*;

declare_id!("eCv677gAYX6ptLtJrPv9Rj8C4eGA4c9ecswRT5QJbeG");

#[program]
pub mod synapse {
    use super::*;

    pub fn register_agent(ctx: Context<RegisterAgent>, alias: String) -> Result<()> {
        require!(alias.len() <= 32, ErrorCode::AliasTooLong);

        let registry = &mut ctx.accounts.agent_registry;
        registry.alias = alias;
        registry.owner = ctx.accounts.owner.key();
        registry.registered_at = Clock::get()?.unix_timestamp;
        registry.bump = ctx.bumps.agent_registry;

        Ok(())
    }

    #[allow(unused_variables)]
    pub fn create_session(
        ctx: Context<CreateSession>,
        timestamp: u64,
        encrypted_offer: Vec<u8>,
    ) -> Result<()> {
        let session = &mut ctx.accounts.session;
        session.initiator = ctx.accounts.initiator.key();
        session.responder = ctx.accounts.responder.key();
        session.encrypted_offer = encrypted_offer;
        session.encrypted_answer = None;
        session.status = SessionStatus::Pending;
        session.created_at = timestamp as i64;
        session.expires_at = (timestamp + 300) as i64; // 5 mins TTL
        session.bump = ctx.bumps.session;

        Ok(())
    }

    pub fn respond_session(
        ctx: Context<RespondSession>, 
        encrypted_answer: Vec<u8>,
    ) -> Result<()> {
        let session = &mut ctx.accounts.session;
        
        require!(
            session.status == SessionStatus::Pending,
            ErrorCode::InvalidSessionStatus
        );
        require!(
            session.expires_at > Clock::get()?.unix_timestamp,
            ErrorCode::SessionExpired
        );

        session.encrypted_answer = Some(encrypted_answer);
        session.status = SessionStatus::Active;

        Ok(())
    }

    pub fn close_session(_ctx: Context<CloseSession>) -> Result<()> {
        // The session account will be closed and rent returned to the initiator
        // because of the `close = initiator` constraint.
        Ok(())
    }

    pub fn expire_session(ctx: Context<ExpireSession>) -> Result<()> {
        let session = &ctx.accounts.session;
        require!(
            session.expires_at <= Clock::get()?.unix_timestamp,
            ErrorCode::SessionNotExpired
        );
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(alias: String)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + AgentRegistry::MAX_SIZE,
        seeds = [b"agent", alias.as_bytes()],
        bump
    )]
    pub agent_registry: Account<'info, AgentRegistry>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(timestamp: i64)]
pub struct CreateSession<'info> {
    #[account(
        init,
        payer = initiator,
        space = 8 + 4000, // 8 discriminator + 4000 space for WebRTC payloads
        seeds = [b"session", initiator.key().as_ref(), responder.key().as_ref(), &timestamp.to_le_bytes()],
        bump
    )]
    pub session: Account<'info, Session>,
    #[account(mut)]
    pub initiator: Signer<'info>,
    /// CHECK: The responder's public key
    pub responder: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RespondSession<'info> {
    #[account(
        mut,
        has_one = responder
    )]
    pub session: Account<'info, Session>,
    pub responder: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseSession<'info> {
    #[account(
        mut,
        has_one = initiator,
        close = initiator
    )]
    pub session: Account<'info, Session>,
    pub initiator: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExpireSession<'info> {
    #[account(
        mut,
        close = initiator // Rent is returned to initiator
    )]
    pub session: Account<'info, Session>,
    /// CHECK: We just need the initiator account to return the rent
    #[account(mut, address = session.initiator)]
    pub initiator: UncheckedAccount<'info>,
}

#[account]
pub struct AgentRegistry {
    pub alias: String, // max 32 chars -> 4 + 32
    pub owner: Pubkey, // 32
    pub registered_at: i64, // 8
    pub bump: u8, // 1
}

impl AgentRegistry {
    pub const MAX_SIZE: usize = 4 + 32 + 32 + 8 + 1;
}

#[account]
pub struct Session {
    pub initiator: Pubkey, // 32
    pub responder: Pubkey, // 32
    pub encrypted_offer: Vec<u8>, // 4 + ~1500
    pub encrypted_answer: Option<Vec<u8>>, // 1 + 4 + ~1500
    pub status: SessionStatus, // 1
    pub created_at: i64, // 8
    pub expires_at: i64, // 8
    pub bump: u8, // 1
}

impl Session {
    pub const MAX_SIZE: usize = 4000;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum SessionStatus {
    Pending,
    Active,
    Closed,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Alias is too long. Maximum 32 characters.")]
    AliasTooLong,
    #[msg("Session is not in pending status.")]
    InvalidSessionStatus,
    #[msg("Session has expired.")]
    SessionExpired,
    #[msg("Session has not expired yet.")]
    SessionNotExpired,
}
