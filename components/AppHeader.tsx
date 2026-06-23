// Slim, brand-accent top bar for the delegate app shell. The color wordmark reads
// only on light surfaces, so it sits on paper with a hairline rule beneath. Sticky
// so the brand stays anchored as the page scrolls; honors Telegram's top safe area.
export function AppHeader() {
  return (
    <header
      className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-line"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-md mx-auto px-4 h-12 flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/AsmitaDin_Logo_Color.png" alt="Asmita Din" className="h-6 w-auto" />
      </div>
    </header>
  );
}
