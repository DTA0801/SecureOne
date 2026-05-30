import { redirect } from "next/navigation";

export default async function AppHomePage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  redirect(`/app/${applicationId}/users`);
}
