export const api = {
  async get(_url: string) {
    return { data: { items: [], stripeConfigured: false, totals: { bookings: 0, jobRevenue: 0, annualRecurringRevenue: 0 } } };
  },
  async post(_url: string, _body?: unknown) {
    return { data: { reply: 'Chat runs on the live AppDeploy site. Use the contact form here, or visit the production app.', ok: true } };
  },
  async put(_url: string, _body?: unknown) {
    return { data: { ok: true } };
  },
  async delete(_url: string) {
    return { data: { ok: true } };
  },
};

export const auth = {
  isSignedIn() {
    return false;
  },
  async getUser() {
    return null as { email?: string } | null;
  },
  async signIn(_opts?: unknown) {
    return { user: { email: '' } };
  },
  async signOut() {},
};
