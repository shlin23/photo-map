import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MobileNavigation } from "@/components/mobile-navigation";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "照片地圖",
    template: "%s｜照片地圖",
  },
  description: "將自己的照片依拍攝位置顯示在地圖上的行動優先網站。",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        <header className="site-header">
          <LinkBrand />
          <MobileNavigation />
        </header>
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}

function LinkBrand() {
  return (
    <div className="brand" aria-label="照片地圖">
      Photo Map
    </div>
  );
}
