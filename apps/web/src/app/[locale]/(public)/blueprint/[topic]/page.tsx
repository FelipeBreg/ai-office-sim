import { redirect } from 'next/navigation';
import { blueprintContent } from '../_lib/blueprint-content';
import { blueprintTopics } from '../_lib/blueprint-topics';

interface Props {
  params: Promise<{ locale: string; topic: string }>;
}

export function generateStaticParams() {
  return blueprintTopics.map((t) => ({ topic: t.slug }));
}

export default async function BlueprintTopicPage({ params }: Props) {
  const { locale, topic } = await params;
  const content = blueprintContent[topic];

  if (!content) {
    redirect(`/${locale}/blueprint/visao-geral`);
  }

  return <>{content}</>;
}
