import { redirect } from 'next/navigation';

export default async function BlueprintIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/blueprint/visao-geral`);
}
