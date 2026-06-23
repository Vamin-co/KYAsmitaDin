// In-shell fallback for delegate screens. The app header (with the logo) and bottom
// nav persist around this, so a quiet brand-red spinner is all that's needed.
export default function Loading() {
  return (
    <div className="flex justify-center py-20">
      <div
        className="size-6 rounded-full border-2 border-line border-t-brand animate-spin"
        aria-hidden="true"
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
