const hosts = [
  "https://admin.aslijobs.com",
  "https://aslijobs-admin.vercel.app",
];

for (const base of hosts) {
  const htmlRes = await fetch(`${base}/`);
  const html = await htmlRes.text();
  const assets = [...html.matchAll(/\/assets\/[^"']+\.js/g)].map((m) => m[0]);
  const unique = [...new Set(assets)];
  const findings = { base, status: htmlRes.status, assets: unique, apiHints: [] };

  for (const asset of unique.slice(0, 6)) {
    const jsRes = await fetch(`${base}${asset}`);
    const js = await jsRes.text();
    const matches = [
      ...js.matchAll(/https:\/\/aslijobs-backend\.onrender\.com[^"'`\\s]*/g),
      ...js.matchAll(/VITE_API_URL[^"'`\\n]{0,80}/g),
      ...js.matchAll(/["']\/api\/v1["']/g),
    ].map((m) => m[0]);
    findings.apiHints.push({
      asset,
      hits: [...new Set(matches)].slice(0, 20),
    });
  }

  console.log(JSON.stringify(findings, null, 2));
}
