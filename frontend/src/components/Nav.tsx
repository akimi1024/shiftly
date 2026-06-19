import Link from "next/link";

const links = [
  { href: "/requirements", label: "必要人数" },
  { href: "/requests", label: "シフト希望" },
  { href: "/shortage", label: "過不足" },
  { href: "/shifts", label: "確定シフト" },
  { href: "/settings", label: "設定" },
];

export default function Nav() {
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex h-14 max-w-4xl items-center gap-6 px-4">
        <span className="text-lg font-bold">Shiftly</span>
        <div className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
