import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { ProfileSettingsView } from '@/features/profile';
import { getPatientProfile } from '@/features/profile/services';

export const metadata: Metadata = {
  title: 'Profile Settings — HealthMate',
  description: 'Manage your HealthMate patient profile.',
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const profile = await getPatientProfile(session.user.id, session.user.role);

  return <ProfileSettingsView initialProfile={profile} />;
}
