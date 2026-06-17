import { CaseDetailWorkspace } from "@/components/cases/case-detail-workspace";

type CaseDetailPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { caseId } = await params;
  return <CaseDetailWorkspace caseId={caseId} />;
}
