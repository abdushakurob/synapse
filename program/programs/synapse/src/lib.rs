use anchor_lang::prelude::*;

declare_id!("eCv677gAYX6ptLtJrPv9Rj8C4eGA4c9ecswRT5QJbeG");

#[program]
pub mod synapse {
    use super::*;

    pub fn register_agent(
        ctx: Context<RegisterAgent>, 
        alias: String,
        category: String,
        capabilities: Vec<String>,
    ) -> Result<()> {
        require!(alias.len() <= 32, ErrorCode::AliasTooLong);
        require!(category.len() <= 32, ErrorCode::CategoryTooLong);

        let registry = &mut ctx.accounts.agent_registry;
        registry.alias = alias;
        registry.owner = ctx.accounts.owner.key();
        registry.category = category;
        registry.capabilities = capabilities;
        registry.accept_list = Vec::new();
        registry.is_open = true; // Default to open
        registry.registered_at = Clock::get()?.unix_timestamp;
        registry.bump = ctx.bumps.agent_registry;

        Ok(())
    }

    pub fn configure_agent(
        ctx: Context<ConfigureAgent>,
        accept_list: Vec<Pubkey>,
        is_open: bool,
        category: Option<String>,
        capabilities: Option<Vec<String>>,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.agent_registry;
        
        registry.accept_list = accept_list;
        registry.is_open = is_open;
        
        if let Some(cat) = category {
            require!(cat.len() <= 32, ErrorCode::CategoryTooLong);
            registry.category = cat;
        }
        
        if let Some(caps) = capabilities {
            registry.capabilities = caps;
        }

        Ok(())
    }

    pub fn create_session(
        ctx: Context<CreateSession>,
        timestamp: u64,
        encrypted_offer: Vec<u8>,
        _responder_alias: String, // Pass alias for PDA derivation
    ) -> Result<()> {
        let responder_registry = &ctx.accounts.responder_registry;
        let initiator = ctx.accounts.initiator.key();

        // Enforcement: Check if responder accepts this initiator
        if !responder_registry.is_open {
            let is_authorized = responder_registry.accept_list.iter().any(|pk| pk == &initiator);
            require!(is_authorized, ErrorCode::UnauthorizedInitiator);
        }

        let session = &mut ctx.accounts.session;
        session.initiator = initiator;
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
#[instruction(alias: String, category: String, capabilities: Vec<String>)]
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
pub struct ConfigureAgent<'info> {
    #[account(
        mut,
        has_one = owner,
    )]
    pub agent_registry: Account<'info, AgentRegistry>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(timestamp: u64, encrypted_offer: Vec<u8>, responder_alias: String)]
pub struct CreateSession<'info> {
    #[account(
        init,
        payer = initiator,
        space = 8 + 4000, 
        seeds = [b"session", initiator.key().as_ref(), responder.key().as_ref(), &timestamp.to_le_bytes()],
        bump
    )]
    pub session: Account<'info, Session>,
    #[account(mut)]
    pub initiator: Signer<'info>,
    /// CHECK: Checked via responder_registry seeds
    pub responder: UncheckedAccount<'info>,
    #[account(
        seeds = [b"agent", responder_alias.as_bytes()],
        bump = responder_registry.bump,
    )]
    pub responder_registry: Account<'info, AgentRegistry>,
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
        close = initiator 
    )]
    pub session: Account<'info, Session>,
    /// CHECK: The account to receive the returned rent
    #[account(mut, address = session.initiator)]
    pub initiator: UncheckedAccount<'info>,
}

#[account]
pub struct AgentRegistry {
    pub owner: Pubkey,          // 32
    pub alias: String,          // 4 + 32
    pub category: String,       // 4 + 32
    pub capabilities: Vec<String>, // 4 + (10 * 32)
    pub accept_list: Vec<Pubkey>, // 4 + (100 * 32)
    pub is_open: bool,          // 1
    pub registered_at: i64,     // 8
    pub bump: u8,               // 1
}

impl AgentRegistry {
    pub const MAX_SIZE: usize = 36 + 32 + 36 + 324 + 3204 + 1 + 8 + 1;
}

#[account]
pub struct Session {
    pub initiator: Pubkey,
    pub responder: Pubkey,
    pub encrypted_offer: Vec<u8>,
    pub encrypted_answer: Option<Vec<u8>>,
    pub status: SessionStatus,
    pub created_at: i64,
    pub expires_at: i64,
    pub bump: u8,
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
    #[msg("Category is too long. Maximum 32 characters.")]
    CategoryTooLong,
    #[msg("Session is not in pending status.")]
    InvalidSessionStatus,
    #[msg("Session has expired.")]
    SessionExpired,
    #[msg("Session has not expired yet.")]
    SessionNotExpired,
    #[msg("Initiator is not authorized to connect to this agent.")]
    UnauthorizedInitiator,
}
