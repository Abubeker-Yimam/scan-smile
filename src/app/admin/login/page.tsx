import { LoginForm } from "./form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-[24rem] py-10">
      <h1 className="font-display text-3xl font-bold">Host sign in</h1>
      <p className="mt-3 font-body text-ash">
        The dashboard is shared by everyone running the event.
      </p>
      <div className="mt-8">
        <LoginForm next={next ?? "/admin"} />
      </div>
    </div>
  );
}
