import { auth } from '@/lib/auth';
import { getRoleHome } from '@/config/routes';
import { LandingPage } from '@/features/marketing';

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const portalHref = isLoggedIn ? getRoleHome(session.user.role) : undefined;
  return <LandingPage isLoggedIn={isLoggedIn} portalHref={portalHref} />;
}
