import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthPage } from "../routes/auth";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  authCallback: null as null | ((event: string, session?: unknown) => void),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    ...options,
    useSearch: () => ({ next: "panel" }),
  }),
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (callback: (event: string, session?: unknown) => void) => {
        mocks.authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      updateUser: mocks.updateUser,
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

describe("authentication flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authCallback = null;
    mocks.signInWithPassword.mockImplementation(async () => {
      mocks.authCallback?.("SIGNED_IN", { user: { id: "test-user" } });
      return { error: null };
    });
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    mocks.updateUser.mockResolvedValue({ error: null });
  });

  it("normalizes email and navigates once after a successful login", async () => {
    render(<AuthPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "  TEST@Example.COM " } });
    fireEvent.change(screen.getByLabelText("Palavra-passe"), { target: { value: "123456" } });
    expect(screen.getByLabelText("Palavra-passe")).not.toHaveAttribute("minlength");

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(mocks.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "123456",
      });
    });
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/painel" });
  });

  it("does not submit a registration with a whitespace-only name", async () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole("button", { name: /Regista-te/i }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText("Palavra-passe"), { target: { value: "securepass123" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Indica o teu nome."));
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("uses a normalized email for password recovery", async () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole("button", { name: /Esqueci-me da palavra-passe/i }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "  PERSON@Example.COM " } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar instruções" }));

    await waitFor(() => {
      expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith("person@example.com", {
        redirectTo: expect.stringContaining("/auth?next=panel"),
      });
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Se existir uma conta com esse email, receberás instruções para recuperar o acesso.",
    );
  });
});
