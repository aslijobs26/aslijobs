/** Minimal types for @cashfreepayments/cashfree-js (the package ships none). */
declare module "@cashfreepayments/cashfree-js" {
  export type CashfreeMode = "sandbox" | "production";

  export type CashfreeCheckoutOptions = {
    paymentSessionId: string;
    /** `_modal` opens an in-page popup; `_self` redirects to Cashfree. */
    redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | HTMLElement;
    returnUrl?: string;
  };

  export type CashfreeCheckoutResult = {
    error?: { message?: string; code?: string; type?: string };
    redirect?: boolean;
    paymentDetails?: { paymentMessage?: string };
  };

  export type Cashfree = {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult>;
  };

  export function load(options: { mode: CashfreeMode }): Promise<Cashfree | null>;
}
