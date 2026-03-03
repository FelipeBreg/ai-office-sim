import type { Metadata } from 'next';
import { publicServerTRPC } from '@/lib/trpc/server';
import { notFound } from 'next/navigation';
import { WorkflowDetailClient } from './client';

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
    return { title: 'Workflow — AI Office Community' };
  }
}

export default async function WorkflowDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const trpc = await publicServerTRPC();

  let listing;
  try {
    listing = await trpc.community.getBySlug({ slug });
  } catch {
    notFound();
  }

  if (listing.type !== 'workflow') notFound();

  return <WorkflowDetailClient listing={listing} />;
}
