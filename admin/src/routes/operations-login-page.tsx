import { OperationsGuestGuard } from "../components/operations/auth/OperationsAuthGuard";
import { OperationsLoginPageContent } from "../components/operations/login/OperationsLoginPageContent";
import "../components/operations/login/operations-login.css";

export function OperationsLoginPage() {
  return (
    <OperationsGuestGuard>
      <OperationsLoginPageContent />
    </OperationsGuestGuard>
  );
}
