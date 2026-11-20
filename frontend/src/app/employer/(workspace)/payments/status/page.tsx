import { createEmployerModuleMetadata } from "@/components/employer-dashboard/EmployerModulePage";
import { PaymentStatusContent } from "@/components/employer-subscription/PaymentStatusContent";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export const metadata = createEmployerModuleMetadata({
  title: "Payment status",
  description: "Check the status of your AsliJobs plan payment",
});

export default function EmployerPaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
