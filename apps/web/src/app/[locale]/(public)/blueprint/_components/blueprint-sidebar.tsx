'use client';

import ReferenceSidebar from '../../_components/reference-sidebar';
import { blueprintTopics } from '../_lib/blueprint-topics';

export default function BlueprintSidebar() {
  return (
    <ReferenceSidebar
      topics={blueprintTopics}
      basePath="/blueprint"
      defaultSlug="visao-geral"
      title="Blueprint"
    />
  );
}
