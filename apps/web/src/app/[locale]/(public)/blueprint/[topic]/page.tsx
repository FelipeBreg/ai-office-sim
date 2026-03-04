import { redirect } from 'next/navigation';
import { blueprintTopics } from '../_lib/blueprint-topics';

interface Props {
  params: Promise<{ locale: string; topic: string }>;
}

export function generateStaticParams() {
  return blueprintTopics.map((t) => ({ topic: t.slug }));
}

export default async function BlueprintTopicPage({ params }: Props) {
  const { locale, topic } = await params;
  redirect(`/${locale}/docs/${topic}`);
}
