import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Crown } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { CREATOR_ID } from "../lib/creator.js";
import Avatar from "../components/Avatar.jsx";
import Feed from "../components/Feed.jsx";

export default function ProfilePage() {
  const { userId } = useParams();
  const {
    currentUser,
    getFeed,
    posts,
    getProfile,
    getUserPosts,
    getFollowInfo,
    toggleFollow,
  } = useStore();
  const toast = useToast();

  const targetId = Number(userId) || currentUser?.id;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    followers: 0,
    following: 0,
    isFollowing: false,
  });

  // load posts (so we can show this user's sheets)
  useEffect(() => {
    getFeed();
  }, [getFeed]);

  // load the profile + follow info whenever the target changes
  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    Promise.all([getProfile(targetId), getFollowInfo(targetId)]).then(
      ([prof, info]) => {
        setProfile(prof);
        setCounts(info);
        setLoading(false);
      },
    );
  }, [targetId]);

  if (loading) {
    return (
      <p
        style={{
          textAlign: "center",
          padding: "40px",
          color: "var(--text-dim)",
        }}
      >
        Loading profile…
      </p>
    );
  }

  if (!profile) {
    return (
      <div className="empty">
        <p>That account doesn’t exist.</p>
        <p style={{ marginTop: 12 }}>
          <Link to="/feed">Back to the feed</Link>
        </p>
      </div>
    );
  }

  const userPosts = getUserPosts(profile.id);
  const isMe = currentUser?.id === profile.id;
  const following = counts.isFollowing;
  const isCreatorProfile = profile.id === CREATOR_ID;

  const onFollow = async () => {
    await toggleFollow(profile.id, following);
    const fresh = await getFollowInfo(profile.id);
    setCounts(fresh);
    toast(
      following
        ? `Unfollowed @${profile.username}.`
        : `Following @${profile.username}.`,
      "accent",
    );
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
                <Link to="/settings" className="btn">
                  Edit profile
                </Link>
              ) : (
                <button
                  type="button"
                  className={`btn ${following ? "btn-danger" : "btn-accent"}`}
                  onClick={onFollow}
                >
                  {following ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
          </div>

          <h1 className="profile-name">
            {profile.displayName}
            {isCreatorProfile && (
              <span className="creator-badge">
                <Crown size={12} /> Creator
              </span>
            )}
          </h1>
          <p className="profile-handle">@{profile.username}</p>
          <p className="profile-bio">
            {profile.bio?.trim() ? profile.bio : "No bio yet."}
          </p>

          <div className="profile-stats">
            <div>
              <b>{counts.following}</b>
              <span>Following</span>
            </div>
            <div>
              <b>{counts.followers}</b>
              <span>Followers</span>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <div className="tab active">Sheets</div>
        </div>
      </section>

      <Feed
        posts={userPosts}
        emptyTitle={
          isMe
            ? "You haven't posted a sheet yet."
            : "@" + profile.username + " hasn't posted yet."
        }
        emptyTo={isMe ? "/create" : undefined}
        emptyToLabel="Post your first sheet"
      />
    </>
  );
}
