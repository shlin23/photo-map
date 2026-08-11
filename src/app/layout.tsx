import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";

import { MobileNavigation } from "@/components/mobile-navigation";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { withBasePath } from "@/lib/app-path";

import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

export const metadata: Metadata = {
  title: {
    default: "Photo Map",
    template: "%s | Photo Map",
  },
  description: "Upload geotagged photos and view where they were taken.",
  manifest: withBasePath("/manifest.webmanifest"),
  icons: {
    icon: withBasePath("/icons/rail-pm.svg"),
    apple: withBasePath("/icons/rail-pm-apple.png"),
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "RAIL PM" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <LinkBrand />
          <MobileNavigation />
          <PwaInstallButton />
        </header>
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}

function LinkBrand() {
  return (
    <div className="brand" aria-label="Photo Map">
      <Image src={withBasePath("/icons/rail-pm.svg")} alt="" width={42} height={42} priority />
      <span>RAIL PM</span>
    </div>
  );
}
