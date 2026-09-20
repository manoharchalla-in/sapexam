import { redirect } from 'next/navigation';

export default async function AssessmentResultRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/result/${id}`);
}
