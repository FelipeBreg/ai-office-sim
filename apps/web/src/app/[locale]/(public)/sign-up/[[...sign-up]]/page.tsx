import { SignUp } from '@clerk/nextjs';

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-deepest">
      <SignUp
        forceRedirectUrl={`/${locale}`}
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-bg-base border border-border-default',
          },
        }}
      />
    </main>
  );
}
