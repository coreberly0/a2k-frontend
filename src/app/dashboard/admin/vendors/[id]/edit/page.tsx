import ModuleForm from "@/components/ModuleForm";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  return <ModuleForm moduleKey="vendors" id={id} error={error} />;
}
