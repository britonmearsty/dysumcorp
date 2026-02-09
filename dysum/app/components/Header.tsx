'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600';
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Dysum</span>
            </Link>
          </div>

          <nav className="flex items-center space-x-8">
            <Link href="/" className={`transition-colors ${isActive('/')}`}>
              Home
            </Link>
            <Link href="/create" className={`transition-colors ${isActive('/create')}`}>
              Write
            </Link>
            <Link href="/about" className={`transition-colors ${isActive('/about')}`}>
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
