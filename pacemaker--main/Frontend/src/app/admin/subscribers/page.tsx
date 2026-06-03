'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LegacySubscribersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/subscriptions');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
      <p className="text-gray-500 font-bold">Redirecting you to Subscriptions dashboard...</p>
    </div>
  );
}
