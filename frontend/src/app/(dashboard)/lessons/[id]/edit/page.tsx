import React from 'react';
import { LessonEditor } from '@/components/editor/LessonEditor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonEditPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="h-full w-full">
      <LessonEditor lessonId={id} />
    </div>
  );
}