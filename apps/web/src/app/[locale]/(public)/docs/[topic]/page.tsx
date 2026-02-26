import { redirect } from 'next/navigation';
import { topicContent, topics } from '../_lib/docs-data';

interface Props {
  params: Promise<{ locale: string; topic: string }>;
}

export function generateStaticParams() {
  return topics.map((t) => ({ topic: t.slug }));
}

export default async function TopicPage({ params }: Props) {
  const { locale, topic } = await params;
  const content = topicContent[topic];

  if (!content) {
    redirect(`/${locale}/docs/overview`);
  }

  return <>{content}</>;
}
