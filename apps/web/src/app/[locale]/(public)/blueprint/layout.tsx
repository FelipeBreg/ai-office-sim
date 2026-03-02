import { BookOpen } from 'lucide-react';
import ReferenceLayout from '../_components/reference-layout';
import BlueprintSidebar from './_components/blueprint-sidebar';

export default function BlueprintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReferenceLayout
      sidebar={<BlueprintSidebar />}
      headerIcon={BookOpen}
      headerTitle="Blueprint Empresarial"
      backLabel="Voltar"
      ctaTitle="Automatize com o AI Office Sim"
      ctaDescription="Crie seu escritório virtual com agentes de IA que executam esses processos automaticamente."
      ctaButtonLabel="Começar Agora"
    >
      {children}
    </ReferenceLayout>
  );
}
