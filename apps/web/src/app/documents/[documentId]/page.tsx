import { GeneratedDocumentWorkspace } from "@/components/documents/generated-document-workspace";

type GeneratedDocumentPageProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export default async function GeneratedDocumentPage({
  params,
}: GeneratedDocumentPageProps) {
  const { documentId } = await params;

  return <GeneratedDocumentWorkspace documentId={documentId} />;
}