import { getBaseUrl } from "@/lib/get-base-url";

export default async function DemoPage() {
  const baseUrl = await getBaseUrl();
  const demoApiKey = process.env.DEMO_API_KEY ?? "demo-dat-radar-key";
  const iframeCode = `<iframe src="${baseUrl}/embed/MSTR?range=1y&theme=dark" width="100%" height="320" style="border:0;" title="DAT Radar Embed"></iframe>`;
  const fetchCode = `fetch("${baseUrl}/api/v1/mnav/MSTR?range=90d", {\n  headers: { "X-API-Key": "${demoApiKey}" }\n}).then((r) => r.json()).then(console.log);`;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">DAT Radar Partner Demo</h1>
      <p className="mt-2 text-slate-300">
        This page shows how partners can consume DAT Radar via iframe widget and JSON API.
      </p>

      <section className="mt-6 space-y-3 rounded-lg border border-slate-700 p-4">
        <h2 className="text-lg font-medium">1. Iframe Embed</h2>
        <pre className="overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-200">{iframeCode}</pre>
        <iframe
          src="/embed/MSTR?range=1y&theme=dark"
          width="100%"
          height="320"
          style={{ border: 0 }}
          title="DAT Radar Embed"
        />
      </section>

      <section className="mt-6 space-y-3 rounded-lg border border-slate-700 p-4">
        <h2 className="text-lg font-medium">2. API Integration</h2>
        <pre className="overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-200">{fetchCode}</pre>
        <p className="text-sm text-slate-400">Demo key: {demoApiKey}</p>
      </section>
    </main>
  );
}
