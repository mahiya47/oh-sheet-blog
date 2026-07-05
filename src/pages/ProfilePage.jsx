import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Crown,
  Cake,
  Github,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { CREATOR_ID, isBirthday } from "../lib/creator.js";
import { DEFAULT_COVER } from "../lib/covers.js";
import { getAccountAgeBadge, getScoreBadge } from "../lib/badges.js";
import Avatar from "../components/Avatar.jsx";
import Feed from "../components/Feed.jsx";
import UserListModal from "../components/UserListModal.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import Lightbox from "../components/Lightbox.jsx";
import Badge from "../components/Badge.jsx";

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
    getFollowers,
    getFollowingList,
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
  const [listModal, setListModal] = useState(null); // { title, users } or null
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    getFeed();
  }, [getFeed]);

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

  const isImageCover =
    profile.coverUrl?.startsWith("http") ||
    profile.coverUrl?.startsWith("data:");

  const ageBadge = getAccountAgeBadge(profile.createdAt);
  const scoreBadge = getScoreBadge(profile.score);

  const socialLinks = [
    { url: profile.githubUrl, Icon: Github, label: "GitHub" },
    { url: profile.twitterUrl, Icon: Twitter, label: "Twitter/X" },
    { url: profile.linkedinUrl, Icon: Linkedin, label: "LinkedIn" },
    { url: profile.instagramUrl, Icon: Instagram, label: "Instagram" },
  ].filter((s) => s.url);

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

  const openFollowers = async () => {
    const users = await getFollowers(profile.id);
    setListModal({ title: "Followers", users });
  };

  const openFollowing = async () => {
    const users = await getFollowingList(profile.id);
    setListModal({ title: "Following", users });
  };

  return (
    <>
      <section className="profile">
        <div
          className="profile-cover"
          style={{
            background: isImageCover
              ? `url(${profile.coverUrl}) center/cover no-repeat`
              : profile.coverUrl || DEFAULT_COVER,
          }}
        />
        <div className="profile-info">
          <div className="profile-top">
            <button
              type="button"
              onClick={() =>
                profile.avatarUrl && setLightboxSrc(profile.avatarUrl)
              }
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: profile.avatarUrl ? "zoom-in" : "default",
              }}
              aria-label="View profile photo"
            >
              <Avatar user={profile} size={104} />
            </button>
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
            {profile?.emailVerified && <VerifiedBadge size={18} />}
            {isCreatorProfile && (
              <span className="creator-badge">
                <Crown size={12} /> Creator
              </span>
            )}
            {isBirthday(profile) && (
              <Cake
                size={20}
                style={{ marginLeft: 8, verticalAlign: "middle" }}
              />
            )}
          </h1>
          <p className="profile-handle">@{profile.username}</p>
          <p className="profile-bio">
            {profile.bio?.trim() ? profile.bio : "No bio yet."}
          </p>

          {socialLinks.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "var(--space-4)",
              }}
            >
              {socialLinks.map(({ url, Icon, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  style={{
                    width: 34,
                    height: 34,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    border: "2px solid var(--border, #333)",
                    color: "inherit",
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          )}

          {(ageBadge || scoreBadge) && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: "var(--space-4)",
              }}
            >
              <Badge badge={ageBadge} />
              <Badge badge={scoreBadge} />
            </div>
          )}

          {(profile.gender || profile.orientation) && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: "var(--space-4)",
              }}
            >
              {profile.gender && <span className="tag">{profile.gender}</span>}
              {profile.orientation && (
                <span className="tag">{profile.orientation}</span>
              )}
            </div>
          )}

          <div className="profile-stats">
            <button
              type="button"
              onClick={openFollowing}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <b>{counts.following}</b>
              <span>Following</span>
            </button>
            <button
              type="button"
              onClick={openFollowers}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <b>{counts.followers}</b>
              <span>Followers</span>
            </button>
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

      {listModal && (
        <UserListModal
          title={listModal.title}
          users={listModal.users}
          onClose={() => setListModal(null)}
        />
      )}

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  );
}
