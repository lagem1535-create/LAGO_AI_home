// LAGO AI — Cloudflare Worker
// 정적 파일(public/)은 Workers Assets가 내보내고, /api/* 만 이 코드가 처리해요.
// 시크릿(대시보드 또는 `npx wrangler secret put 이름`으로 넣기):
//   FIREBASE_CONFIG  — Firebase 웹 앱 설정 JSON 한 줄 (예: {"apiKey":"...","authDomain":"...","projectId":"...","appId":"..."})
//   DATA_GO_KR_KEY   — 공공데이터포털(data.go.kr) 일반 인증키 (Decoding 키)
// 키는 브라우저로 내려보내지 않아요. 공공데이터 호출은 이 Worker가 대신 해요.

const UA = "LAGO-AI/0.1 (https://lago-ai-home.lagem1535.workers.dev)";

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });

function readFirebase(env) {
  if (!env.FIREBASE_CONFIG) return null;
  try {
    const c = JSON.parse(env.FIREBASE_CONFIG);
    // 웹 앱에 필요한 값만 골라서 내려보내요.
    const keep = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId", "measurementId"];
    return Object.fromEntries(keep.filter((k) => c[k]).map((k) => [k, c[k]]));
  } catch {
    return { error: "FIREBASE_CONFIG가 올바른 JSON이 아니에요" };
  }
}

// ---------- 위키백과 (키 필요 없음) ----------
async function wiki(q) {
  const base = "https://ko.wikipedia.org";
  const h = { "user-agent": UA, accept: "application/json" };
  // 1) 검색해서 가장 알맞은 문서 제목 찾기
  const s = await fetch(
    `${base}/w/api.php?action=query&list=search&format=json&srlimit=3&utf8=1&srsearch=${encodeURIComponent(q)}`,
    { headers: h, cf: { cacheTtl: 3600 } }
  );
  if (!s.ok) throw new Error("wiki search " + s.status);
  const hits = (await s.json())?.query?.search || [];
  if (!hits.length) return { found: false, q };
  // 2) 문서 요약 가져오기
  const out = [];
  for (const hit of hits.slice(0, 2)) {
    const r = await fetch(`${base}/api/rest_v1/page/summary/${encodeURIComponent(hit.title.replace(/ /g, "_"))}`, {
      headers: h,
      cf: { cacheTtl: 3600 },
    });
    if (!r.ok) continue;
    const d = await r.json();
    out.push({ title: d.title, extract: d.extract, url: d.content_urls?.desktop?.page || `${base}/wiki/${encodeURIComponent(hit.title)}` });
  }
  return { found: out.length > 0, q, results: out };
}

// ---------- 공공데이터포털 예시: 한국천문연구원 특일 정보(공휴일) ----------
// 활용 신청: data.go.kr 에서 "한국천문연구원_특일 정보" 검색 → 활용신청
async function holidays(env, year, month) {
  if (!env.DATA_GO_KR_KEY) return json({ error: "DATA_GO_KR_KEY 시크릿이 없어요" }, 503);
  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month)) return json({ error: "year=YYYY&month=M 형식으로 보내 주세요" }, 400);
  const u = new URL("https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo");
  u.searchParams.set("serviceKey", env.DATA_GO_KR_KEY);
  u.searchParams.set("solYear", year);
  u.searchParams.set("solMonth", String(month).padStart(2, "0"));
  u.searchParams.set("_type", "json");
  u.searchParams.set("numOfRows", "50");
  const r = await fetch(u, { headers: { "user-agent": UA }, cf: { cacheTtl: 86400 } });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { return json({ error: "공공데이터 응답이 JSON이 아니에요 (키 또는 활용신청을 확인해 주세요)", raw: text.slice(0, 300) }, 502); }
  let items = data?.response?.body?.items?.item || [];
  if (!Array.isArray(items)) items = [items];
  return json({
    source: "공공데이터포털 · 한국천문연구원 특일 정보",
    year, month,
    items: items.map((i) => ({ date: String(i.locdate), name: i.dateName, holiday: i.isHoliday === "Y" })),
  }, 200, { "cache-control": "public, max-age=3600" });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (!p.startsWith("/api/")) return env.ASSETS.fetch(req);
    if (req.method !== "GET") return json({ error: "GET만 돼요" }, 405);
    try {
      if (p === "/api/config") {
        return json({
          firebase: readFirebase(env),
          publicData: !!env.DATA_GO_KR_KEY,
          wiki: true,
        });
      }
      if (p === "/api/wiki") {
        const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
        if (!q) return json({ error: "q가 필요해요" }, 400);
        return json(await wiki(q), 200, { "cache-control": "public, max-age=600" });
      }
      if (p === "/api/holidays") {
        const now = new Date();
        return await holidays(env, url.searchParams.get("year") || String(now.getFullYear()), url.searchParams.get("month") || String(now.getMonth() + 1));
      }
      return json({ error: "없는 주소예요" }, 404);
    } catch (e) {
      return json({ error: "서버 오류", detail: String(e.message || e) }, 500);
    }
  },
};
