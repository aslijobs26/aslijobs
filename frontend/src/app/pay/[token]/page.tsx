import { PaymentLinkPageContent } from "@/components/payment-link/PaymentLinkPageContent";

export default async function PaymentLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PaymentLinkPageContent token={token} />;
}
