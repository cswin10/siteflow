import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ClipboardCheck,
  Hammer,
  FileText,
  Shield,
  Bell,
  BarChart3,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Construction Site Management</span>
            <span className="block text-blue-600">Made Simple</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            SiteFlow streamlines your construction operations with real-time job tracking,
            compliance management, and seamless team communication.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Everything you need to manage your sites
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Hammer className="h-8 w-8 text-blue-600" />}
              title="Job Tracker"
              description="Track progress, assign tasks, and upload photos in real-time"
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8 text-blue-600" />}
              title="Site Diary"
              description="Digital daily logs with voice-to-text and easy export"
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-blue-600" />}
              title="Compliance Management"
              description="PPE checks, CSCS cards, and safety documentation"
            />
            <FeatureCard
              icon={<Bell className="h-8 w-8 text-blue-600" />}
              title="SMS Alerts"
              description="Automated notifications for updates and compliance"
            />
            <FeatureCard
              icon={<ClipboardCheck className="h-8 w-8 text-blue-600" />}
              title="Client Portal"
              description="Give clients real-time visibility into their projects"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
              title="Analytics Dashboard"
              description="Track completion rates and identify bottlenecks"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; 2025 SiteFlow by Dizzy Otter. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
