import ModuleForm from "@/components/ModuleForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <ModuleForm moduleKey="expenses" error={error} />;
}
