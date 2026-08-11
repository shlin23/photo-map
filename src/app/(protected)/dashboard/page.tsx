import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <section aria-labelledby="dashboard-title">
      <h1 id="dashboard-title">Your Photo Map</h1>
      <p className="lead">Upload and explore your geotagged photos.</p>
      <div className="card-grid">
        <article className="card">
          <h2>Upload Photos</h2>
          <p>Select up to 10 photos. Each photo can be up to 15 MiB.</p>
          <Link className="secondary-link" href="/upload">
            Upload Photos
          </Link>
        </article>
        <article className="card">
          <h2>View Map</h2>
          <p>View your geotagged photos on an interactive map.</p>
          <Link className="secondary-link" href="/map">
            View Map
          </Link>
        </article>
      </div>
    </section>
  );
}
