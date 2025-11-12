'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, User } from 'lucide-react';
import type { Profile } from '@/types';

export function DashboardHeader({
  user,
  onMenuToggle,
}: {
  user: Profile;
  onMenuToggle: () => void;
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold text-blue-600">SiteFlow</span>
        </Link>

        {/* User menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{user.full_name || user.email}</span>
          </Button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="mt-1 text-xs font-medium text-blue-600 capitalize">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
