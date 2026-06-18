import { useStore } from '../lib/store.jsx';
import Feed from '../components/Feed.jsx';

export default function TrendingPage() {
  const { getFeed } = useStore();
  // 'top' ranks by fire (likes), which is what "trending" means here.
  const posts = getFeed('top');

  return (
    <>
      <h1 style={{ textTransform: 'uppercase', fontSize: '1.4rem' }}>Trending sheets</h1>
      <Feed posts={posts} emptyTitle="Nothing trending yet." />
    </>
  );
}
