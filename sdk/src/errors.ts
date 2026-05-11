export class ConnectionTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectionTimeoutError";
  }
}

export class ConnectionRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectionRejectedError";
  }
}

export class AgentNotFoundError extends Error {
  constructor(alias: string) {
    super(`[Registry] Agent not found: ${alias}`);
    this.name = "AgentNotFoundError";
  }
}

export class AliasTakenError extends Error {
  constructor(alias: string) {
    super(`[Registry] Alias already registered: ${alias}`);
    this.name = "AliasTakenError";
  }
}
