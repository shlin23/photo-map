import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero" aria-labelledby="home-title">
      <p className="eyebrow">Phase 0</p>
      <h1 id="home-title">把照片帶回拍攝地點</h1>
      <p className="lead">
        照片地圖將讓你登入後上傳照片，並依照片中的 GPS 資訊顯示自己的拍攝足跡。
      </p>
      <p className="notice">目前是可啟動、可測試的頁面空殼，尚未開放登入與照片功能。</p>
      <Link className="primary-link" href="/dashboard">
        查看控制台空殼
      </Link>
    </section>
  );
}
