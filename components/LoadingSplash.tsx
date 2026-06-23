// Full-screen branded splash shown while the first authenticated route resolves.
// Paper surface + color wordmark (light-surface only) + a brand-red spinner,
// matching the login "Signing you in" treatment.
export function LoadingSplash() {
  return (
    <main className="min-h-dvh bg-paper flex flex-col items-center justify-center px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/AsmitaDin_Logo_Color.png"
        alt="Asmita Din"
        className="h-16 w-auto animate-rise"
      />
      <div
        className="mt-6 size-6 rounded-full border-2 border-line border-t-brand animate-spin"
        aria-hidden="true"
      />
      <span className="sr-only">Loading</span>
    </main>
  );
}
