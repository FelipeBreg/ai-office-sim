'use client';

import ReferenceSidebar from '../../_components/reference-sidebar';
import { topics } from '../_lib/docs-data';

export default function DocsSidebar() {
  return (
    <ReferenceSidebar
      topics={topics}
      basePath="/docs"
      defaultSlug="overview"
      title="Topics"
    />
  );
}
