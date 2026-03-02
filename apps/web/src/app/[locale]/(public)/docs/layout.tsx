import { Terminal } from 'lucide-react';
import ReferenceLayout from '../_components/reference-layout';
import DocsSidebar from './_components/docs-sidebar';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReferenceLayout
      sidebar={<DocsSidebar />}
      headerIcon={Terminal}
      headerTitle="Documentation"
      backLabel="Back"
      ctaTitle="Ready to try it?"
      ctaDescription="Create your AI office in minutes. No credit card required for alpha."
      ctaButtonLabel="Get Started"
    >
      {children}
    </ReferenceLayout>
  );
}
