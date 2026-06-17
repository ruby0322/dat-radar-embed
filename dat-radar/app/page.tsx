import DashboardClient from "./dashboard-client";

export default async function Page({ params, searchParams }: PageProps<"/">) {
  await Promise.all([params, searchParams]);
  return <DashboardClient />;
}
