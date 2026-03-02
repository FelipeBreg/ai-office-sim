export interface ReferenceSubtopic {
  id: string;
  label: string;
}

export interface ReferenceTopic {
  slug: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subtopics?: ReferenceSubtopic[];
}
