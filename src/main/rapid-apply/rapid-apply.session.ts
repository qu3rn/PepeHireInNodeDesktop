export interface RapidApplySessionState {
  attemptId: string;
  offerId: string;
  status: string;
  cancelled: boolean;
  startedAt: string;
}

export class RapidApplySessionStore {
  private readonly sessions = new Map<string, RapidApplySessionState>();

  start(attemptId: string, offerId: string): RapidApplySessionState {
    const session: RapidApplySessionState = {
      attemptId,
      offerId,
      status: "created",
      cancelled: false,
      startedAt: new Date().toISOString()
    };
    this.sessions.set(attemptId, session);
    return session;
  }

  setStatus(attemptId: string, status: string): void {
    const session = this.sessions.get(attemptId);
    if (!session) return;
    session.status = status;
  }

  cancel(attemptId: string): boolean {
    const session = this.sessions.get(attemptId);
    if (!session) return false;
    session.cancelled = true;
    session.status = "cancelled";
    return true;
  }

  isCancelled(attemptId: string): boolean {
    return this.sessions.get(attemptId)?.cancelled ?? false;
  }

  end(attemptId: string): void {
    this.sessions.delete(attemptId);
  }

  activeCount(): number {
    return this.sessions.size;
  }
}
