import Link from "next/link";

import { navigationItems } from "@/lib/navigation";

export function MobileNavigation() {
  return (
    <nav aria-label="Main navigation" className="site-navigation">
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
