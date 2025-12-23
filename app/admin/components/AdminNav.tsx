"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function AdminNav({ user }: { user: any }) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link
              href="/admin"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
            >
              🏠 Dashboard
            </Link>

            <Link
              href="/admin/operatorzy"
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                isActive("/admin/operatorzy")
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📡 Operatorzy
            </Link>

            <Link
              href="/admin/oferty"
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                isActive("/admin/oferty")
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              💰 Oferty
            </Link>

            <Link
              href="/admin/zasiegi"
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                isActive("/admin/zasiegi")
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              🗺️ Zasięgi
            </Link>

            <Link
              href="/admin/sprzedaz"
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                isActive("/admin/sprzedaz")
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              💵 Sprzedaż
            </Link>

            <Link
              href="/admin/blog"
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                isActive("/admin/blog")
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📝 Blog
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}