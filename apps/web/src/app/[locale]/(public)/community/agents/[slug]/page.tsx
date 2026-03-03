import type { Metadata } from 'next';
import { publicServerTRPC } from '@/lib/trpc/server';
import { notFound } from 'next/navigation';
import { AgentDetailClient } from './client';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const trpc = await publicServerTRPC();
    const listing = await trpc.community.getBySlug({ slug });
    return {
      title: `${listing.nameEn} — AI Office Community`,
      description: listing.descriptionEn?.slice(0, 160),
      openGraph: {
        title: listing.nameEn,
        description: listing.descriptionEn?.slice(0, 160),
        type: 'website',
      },
    };
  } catch {
    return { title: 'Agent — AI Office Community' };
  }
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const trpc = await publicServerTRPC();

  let listing;
  try {
    listing = await trpc.community.getBySlug({ slug });
  } catch {
    notFound();
  }

  if (listing.type !== 'agent') notFound();

  return <AgentDetailClient listing={listing} />;
}
