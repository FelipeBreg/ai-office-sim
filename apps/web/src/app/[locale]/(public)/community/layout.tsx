import { Store } from 'lucide-react';
import ReferenceLayout from '../_components/reference-layout';

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReferenceLayout
      sidebar={<div />}
      headerIcon={Store}
      headerTitle="Community"
      backLabel="Back"
      ctaTitle="Share your creations"
      ctaDescription="Publish your best agents and workflows for others to use."
      ctaButtonLabel="Get Started"
    >
      {children}
    </ReferenceLayout>
  );
}
