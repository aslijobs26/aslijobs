import { Check, Lock } from "lucide-react";
import { useState, type CSSProperties, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  OPERATIONS_LOGIN_ASSETS,
  OPERATIONS_LOGIN_COPY,
} from "../../../constants/operations-login";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import {
  getOperationsAuthErrorMessage,
  loginOperationsTeam,
} from "../../../services/operations-auth.service";
import { establishOperationsClientSession } from "../../../utils/operations-session";
import { OperationsLoginTestimonialCarousel } from "./OperationsLoginTestimonialCarousel";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function OperationsLoginForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: loginOperationsTeam,
    onSuccess: async (data) => {
      setErrorMessage(null);
      await establishOperationsClientSession(queryClient, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      navigate(OPERATIONS_ROUTES.DASHBOARD, { replace: true });
    },
    onError: (error) => {
      setErrorMessage(
        getOperationsAuthErrorMessage(error, "Login failed. Please try again."),
      );
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <div className="operations-login-form-body">
      <h1 className="operations-login-heading">{OPERATIONS_LOGIN_COPY.heading}</h1>
      <p className="operations-login-subtitle">{OPERATIONS_LOGIN_COPY.subtitle}</p>

      <form className="operations-login-form" onSubmit={handleSubmit} noValidate>
        {errorMessage ? (
          <p className="operations-login-alert" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div>
          <label className="operations-login-label" htmlFor="operations-email">
            {OPERATIONS_LOGIN_COPY.emailLabel}
            <span aria-hidden="true"> *</span>
          </label>
          <input
            id="operations-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={OPERATIONS_LOGIN_COPY.emailPlaceholder}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrorMessage(null);
            }}
            className="operations-login-field-input"
            required
          />
          <p className="operations-login-helper">
            <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {OPERATIONS_LOGIN_COPY.emailHelper}
          </p>
        </div>

        <div>
          <label className="operations-login-label" htmlFor="operations-password">
            {OPERATIONS_LOGIN_COPY.passwordLabel}
            <span aria-hidden="true"> *</span>
          </label>
          <input
            id="operations-password"
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={8}
            placeholder={OPERATIONS_LOGIN_COPY.passwordPlaceholder}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrorMessage(null);
            }}
            className="operations-login-field-input"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="operations-login-submit"
        >
          <Lock className="size-4" aria-hidden="true" />
          {loginMutation.isPending
            ? OPERATIONS_LOGIN_COPY.submittingLabel
            : OPERATIONS_LOGIN_COPY.submitLabel}
        </button>
      </form>

      <p className="operations-login-trust">
        <Lock className="size-3.5 shrink-0" aria-hidden="true" />
        {OPERATIONS_LOGIN_COPY.trustText}
      </p>
    </div>
  );
}

export function OperationsLoginVisualPanel() {
  return (
    <aside
      className="operations-login-panel"
      style={
        {
          "--operations-login-panel-bg-mobile": `url(${OPERATIONS_LOGIN_ASSETS.panelBackgroundMobile})`,
          "--operations-login-panel-bg-tablet": `url(${OPERATIONS_LOGIN_ASSETS.panelBackgroundTablet})`,
          "--operations-login-panel-bg-desktop": `url(${OPERATIONS_LOGIN_ASSETS.panelBackground})`,
        } as CSSProperties
      }
    >
      <div className="operations-login-panel-ambient" aria-hidden="true" />
      <div className="operations-login-panel-vignette" aria-hidden="true" />
      <div className="operations-login-panel-overlay">
        <div className="operations-login-panel-bottom">
          <OperationsLoginTestimonialCarousel />
        </div>
      </div>
    </aside>
  );
}

export function OperationsLoginPageContent() {
  return (
    <main className="operations-login-page">
      <div className="operations-login-layout">
        <section className="operations-login-form-section">
          <div className="operations-login-topbar">
            <div className="operations-login-brand">
              <img
                src={OPERATIONS_LOGIN_ASSETS.logo}
                alt="AsliJobs"
                className="operations-login-brand-logo"
              />
              <span className="operations-login-brand-tagline">
                India&apos;s Trusted WhatsApp Job Network
              </span>
            </div>
          </div>

          <div className="operations-login-form-container">
            <OperationsLoginForm />

            <footer className="operations-login-footer">
              <span>{OPERATIONS_LOGIN_COPY.footer}</span>
              <span className="operations-login-footer-separator" aria-hidden="true">
                |
              </span>
              <a href="#" className="operations-login-footer-link">
                Privacy Policy
              </a>
              <span className="operations-login-footer-separator" aria-hidden="true">
                |
              </span>
              <a href="#" className="operations-login-footer-link">
                Terms of Service
              </a>
              <span className="operations-login-footer-separator" aria-hidden="true">
                |
              </span>
              <a href="#" className="operations-login-footer-link">
                Help
              </a>
            </footer>
          </div>
        </section>

        <OperationsLoginVisualPanel />
      </div>
    </main>
  );
}
