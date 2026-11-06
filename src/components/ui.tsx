import Link from "next/link";
import { ReactNode } from "react";

export const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-black px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

export const cardClass =
  "rounded-2xl border border-black/10 bg-white p-5 shadow-sm";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 text-gray-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-8 text-gray-600" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
      {label}
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      {message}
    </p>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className={`${cardClass} py-10 text-center`}>
      <h2 className="text-xl font-black text-black">{title}</h2>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-gray-600">{description}</p>
      )}
      {actionHref && actionLabel && (
        <Link href={actionHref} className={`${primaryButtonClass} mt-5`}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function LoginPrompt({ reason }: { reason: string }) {
  return (
    <EmptyState
      title="Log in to continue"
      description={reason}
      actionHref="/login"
      actionLabel="Log In or Sign Up"
    />
  );
}

export function RatingBadge({ rating }: { rating: number }) {
  const value = Number(rating);
  const color =
    value >= 8.5
      ? "bg-green-100 text-green-800"
      : value >= 6.5
        ? "bg-yellow-100 text-yellow-800"
        : "bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-flex shrink-0 items-baseline rounded-full px-3 py-1 text-sm font-black ${color}`}
    >
      {value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}
      <span className="ml-0.5 text-xs font-semibold opacity-70">/10</span>
    </span>
  );
}

export function TagPill({ tag }: { tag: string }) {
  return (
    <span className="rounded-full bg-[#faf7ef] px-3 py-1 text-xs font-semibold text-gray-700">
      {tag}
    </span>
  );
}
