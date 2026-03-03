import { publicServerTRPC } from '@/lib/trpc/server';
import { notFound } from 'next/navigation';
import { PublisherProfileClient } from './client';

interface PageProps {
  params: Promise<{ userId: string; locale: string }>;
}

export default async function PublisherProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const trpc = await publicServerTRPC();

  let profile;
  try {
    profile = await trpc.community.getPublisherProfile({ userId });
  } catch {
    notFound();
  }

  return <PublisherProfileClient userId={userId} profile={profile} />;
}
