export default function GuestNotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink px-6">
      <div className="w-full max-w-[30rem] bg-cotton">
        <div className="tibeb h-4" aria-hidden="true" />
        <div className="px-8 py-12 sm:px-10">
          <h1 className="font-display text-3xl font-bold text-coffee">
            This card isn&apos;t linked to a guest yet
          </h1>
          <p className="mt-4 font-body text-ash">
            The code on the card may have been mistyped, or the host hasn&apos;t finished
            setting up this table. Ask the host to check the code printed under the QR.
          </p>
        </div>
        <div className="tibeb h-4" aria-hidden="true" />
      </div>
    </main>
  );
}
