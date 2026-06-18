import { Link, useParams } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Feed from '../components/Feed.jsx';

export default function ProfilePage() {
  const { userId } = useParams();
  const { currentUser, getProfile, getFollowCounts, getUserPosts, isFollowing, toggleFollow } = useStore();
  const toast = useToast();

  const targetId = userId || currentUser?.id;
  const profile = getProfile(targetId);

  if (!profile) {
    return (
      <div className="empty">
        <p>That account doesn’t exist.</p>
        <p style={{ marginTop: 12 }}><Link to="/feed">Back to the feed</Link></p>
      </div>
    );
  }

  const counts = getFollowCounts(profile.id);
  const posts = getUserPosts(profile.id);
  const isMe = currentUser?.id === profile.id;
  const following = isFollowing(profile.id);

  const onFollow = () => {
    toggleFollow(profile.id);
    toast(following ? `Unfollowed @${profile.username}.` : `Following @${profile.username}.`, 'accent');
  };

  return (
    <>
      <section className="profile">
        <div className="profile-cover" />
        <div className="profile-info">
          <div className="profile-top">
            <Avatar user={profile} size={104} />
            <div>
              {isMe ? (
                <Link to="/settings" className="btn">Edit profile</Link>
              ) : (
                <button type="button" className={`btn ${following ? 'btn-danger' : 'btn-accent'}`} onClick={onFollow}>
                  {following ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          <h1 className="profile-name">{profile.displayName}</h1>
          <p className="profile-handle">@{profile.username}</p>
          <p className="profile-bio">{profile.bio?.trim() ? profile.bio : 'No bio yet.'}</p>

          <div className="profile-stats">
            <div><b>{counts.following}</b><span>Following</span></div>
            <div><b>{counts.followers}</b><span>Followers</span></div>
          </div>
        </div>

        <div className="profile-tabs">
          <div className="tab active">Sheets</div>
        </div>
      </section>

      <Feed
        posts={posts}
        emptyTitle={isMe ? "You haven't posted a sheet yet." : '@' + profile.username + " hasn't posted yet."}
        emptyTo={isMe ? '/create' : undefined}
        emptyToLabel="Post your first sheet"
      />
    </>
  );
}
