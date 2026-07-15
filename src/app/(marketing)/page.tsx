import { auth } from '@/lib/auth';
import { LandingPage } from '@/features/marketing';

export default async function HomePage() {
  const session = await auth();
  return <LandingPage isLoggedIn={!!session?.user} />;
}
