import Link from "next/link";

import { navigationItems } from "@/lib/navigation";

export function MobileNavigation() {
  return (
    <nav aria-label="主要導覽" className="site-navigation">
      <ul>
        {navigationItems.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
