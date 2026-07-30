import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost" | "quiet";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/**
 * Botão do design system (classe `.cta` em app/globals.css).
 * Componente puro — quem chama controla `disabled`/`type` conforme o
 * estado de pending do formulário (via useTransition na página).
 */
export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const variantClass = variant === "primary" ? "" : variant;
  return <button className={`cta ${variantClass} ${className}`.trim()} {...props} />;
}
