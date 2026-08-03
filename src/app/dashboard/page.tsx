import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "控制台" };

export default function DashboardPage() {
  return (
    <section aria-labelledby="dashboard-title">
      <p className="eyebrow">控制台空殼</p>
      <h1 id="dashboard-title">你的照片地圖入口</h1>
      <p className="lead">登入與照片數量摘要會在後續階段加入。</p>
      <div className="card-grid">
        <article className="card">
          <h2>上傳照片</h2>
          <p>未來可一次選擇最多 10 張照片，每張上限 15 MiB。</p>
          <Link className="secondary-link" href="/upload">
            前往上傳空殼
          </Link>
        </article>
        <article className="card">
          <h2>查看地圖</h2>
          <p>未來只會顯示目前登入者自己且具有有效 GPS 的照片。</p>
          <Link className="secondary-link" href="/map">
            前往地圖空殼
          </Link>
        </article>
      </div>
    </section>
  );
}
