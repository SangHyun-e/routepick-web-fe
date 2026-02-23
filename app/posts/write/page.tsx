import PostWrite from '@/feature/post/components/PostWrite';
import { fetchMeServer } from '@/feature/user/api.server';

export default async function Page() {
  const meRes = await fetchMeServer();
  const isAdmin = meRes.ok && meRes.data?.role === 'ADMIN';

  return <PostWrite isAdmin={isAdmin} />;
}
