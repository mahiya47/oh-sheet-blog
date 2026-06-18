import { useStore } from '../lib/store.jsx';
import Feed from '../components/Feed.jsx';

export default function FollowingPage() {
  const { getFollowingFeed } = useStore();
  const posts = getFollowingFeed();

  return (
    <>
      <h1 style={{ textTransform: 'uppercase', fontSize: '1.4rem' }}>Following feed</h1>
      <Feed
        posts={posts}
        emptyTitle="You aren't following anyone yet."
        emptyHint="Find people whose sheets you like and follow them."
        emptyTo="/feed"
        emptyToLabel="Explore sheets"
      />
    </>
  );
}
