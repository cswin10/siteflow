'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Shield,
  Users,
  Bell,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ['admin', 'site_manager', 'worker', 'client'],
  },
  {
    name: 'Jobs',
    href: '/jobs',
    icon: <Briefcase className="h-5 w-5" />,
    roles: ['admin', 'site_manager', 'worker', 'client'],
  },
  {
    name: 'Site Diary',
    href: '/diary',
    icon: <FileText className="h-5 w-5" />,
    roles: ['admin', 'site_manager', 'worker'],
  },
  {
    name: 'Compliance',
    href: '/compliance',
    icon: <Shield className="h-5 w-5" />,
    roles: ['admin', 'site_manager', 'worker'],
  },
  {
    name: 'Team',
    href: '/team',
    icon: <Users className="h-5 w-5" />,
    roles: ['admin', 'site_manager'],
  },
  {
    name: 'Alerts',
    href: '/alerts',
    icon: <Bell className="h-5 w-5" />,
    roles: ['admin', 'site_manager'],
  },
];

export function DashboardSidebar({
  userRole,
  isOpen,
  onClose,
}: {
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const filteredNav = navigation.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Mobile close button */}
          <div className="flex h-16 items-center justify-between px-4 lg:hidden">
            <span className="text-xl font-bold text-blue-600">SiteFlow</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer info */}
          <div className="border-t border-gray-200 p-4">
            <p className="text-xs text-gray-500">SiteFlow v1.0</p>
            <p className="mt-1 text-xs text-gray-400">by Dizzy Otter</p>
          </div>
        </div>
      </aside>
    </>
  );
}
