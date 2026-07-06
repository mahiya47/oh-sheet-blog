import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Cake,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  Award,
  Pencil,
  Info as InfoIcon,
  MapPin,
  Briefcase,
  GraduationCap,
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
import { getVerifiedVariant } from "../lib/verifiedVariant.js";
import Lightbox from "../components/Lightbox.jsx";
import AchievementsModal from "../components/AchievementsModal.jsx";

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
  const [listModal, setListModal] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [tab, setTab] = useState("sheets"); // "sheets" | "photos" | "about"

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
  const photoPosts = userPosts.filter((p) => p.imageUrl);
  const isMe = currentUser?.id === profile.id;
  const following = counts.isFollowing;
  const isCreatorProfile = profile.id === CREATOR_ID;

  const isImageCover =
    profile.coverUrl?.startsWith("http") ||
    profile.coverUrl?.startsWith("data:");

  const ageBadge = getAccountAgeBadge(profile.createdAt);
  const scoreBadge = getScoreBadge(profile.score);
  const earnedBadges = [ageBadge, scoreBadge].filter(Boolean);

  const socialLinks = [
    { url: profile.githubUrl, Icon: Github, label: "GitHub" },
    { url: profile.twitterUrl, Icon: Twitter, label: "Twitter/X" },
    { url: profile.linkedinUrl, Icon: Linkedin, label: "LinkedIn" },
    { url: profile.instagramUrl, Icon: Instagram, label: "Instagram" },
  ].filter((s) => s.url);

  const hasAbout =
    profile.birthday ||
    profile.gender ||
    profile.orientation ||
    profile.currentCity ||
    profile.work ||
    profile.education ||
    socialLinks.length > 0;

  const formattedBirthday = profile.birthday
    ? new Date(profile.birthday).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

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

  const AboutRow = ({ icon: Icon, children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Icon size={18} style={{ opacity: 0.7, flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  );

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
                <Link
                  to="/settings"
                  className="btn btn-ghost"
                  aria-label="Edit profile"
                  style={{ width: 38, height: 38, padding: 0 }}
                >
                  <Pencil size={15} />
                </Link>
              ) : (
                <button
                  type="button"
                  className={`btn ${following ? "btn-danger" : "btn-accent"}`}
                  onClick={onFollow}
                  style={{ fontSize: "0.75rem", padding: "7px 14px" }}
                >
                  {following ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
          </div>

          <h1 className="profile-name">
            {profile.displayName}
            {profile?.emailVerified && (
              <VerifiedBadge
                size={18}
                variant={getVerifiedVariant(profile, isCreatorProfile)}
              />
            )}
            {profile.pronouns && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 400,
                  color: "var(--text-muted)",
                  marginLeft: 8,
                }}
              >
                ({profile.pronouns})
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

          {/* Following / Followers row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <button
              type="button"
              onClick={openFollowing}
              className="btn btn-ghost"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.7rem",
                padding: "6px 10px",
              }}
            >
              <b>{counts.following}</b> Following
            </button>
            <button
              type="button"
              onClick={openFollowers}
              className="btn btn-ghost"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.7rem",
                padding: "6px 10px",
              }}
            >
              <b>{counts.followers}</b> Followers
            </button>
          </div>

          {/* Achievements — its own row, icon-only, only if earned */}
          {earnedBadges.length > 0 && (
            <div style={{ marginBottom: "var(--space-4)" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAchievements(true)}
                aria-label="View achievements"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 38,
                  height: 38,
                  padding: 0,
                }}
              >
                <Award size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="profile-tabs">
          <button
            type="button"
            className={`tab ${tab === "sheets" ? "active" : ""}`}
            onClick={() => setTab("sheets")}
            style={{ border: "none", cursor: "pointer" }}
          >
            Sheets
          </button>
          <button
            type="button"
            className={`tab ${tab === "photos" ? "active" : ""}`}
            onClick={() => setTab("photos")}
            style={{ border: "none", cursor: "pointer" }}
          >
            Photos ({photoPosts.length})
          </button>
          {hasAbout && (
            <button
              type="button"
              className={`tab ${tab === "about" ? "active" : ""}`}
              onClick={() => setTab("about")}
              style={{
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <InfoIcon size={14} /> About
            </button>
          )}
        </div>
      </section>

      {tab === "sheets" && (
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
      )}

      {tab === "photos" &&
        (photoPosts.length === 0 ? (
          <div className="empty">
            <p>No photos yet.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 8,
            }}
          >
            {photoPosts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLightboxSrc(p.imageUrl)}
                style={{
                  background: "none",
                  border: "2px solid var(--border, #333)",
                  borderRadius: "var(--radius)",
                  padding: 0,
                  cursor: "zoom-in",
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                }}
              >
                <img
                  src={p.imageUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </button>
            ))}
          </div>
        ))}

      {tab === "about" && (
        <div className="panel" style={{ padding: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {profile.work && (
              <AboutRow icon={Briefcase}>
                Works at <b>{profile.work}</b>
              </AboutRow>
            )}
            {profile.education && (
              <AboutRow icon={GraduationCap}>
                Studied at <b>{profile.education}</b>
              </AboutRow>
            )}
            {profile.currentCity && (
              <AboutRow icon={MapPin}>
                Lives in <b>{profile.currentCity}</b>
              </AboutRow>
            )}
            {formattedBirthday && (
              <AboutRow icon={Cake}>Born {formattedBirthday}</AboutRow>
            )}

            {(profile.gender || profile.orientation) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {profile.gender && (
                  <span className="tag">{profile.gender}</span>
                )}
                {profile.orientation && (
                  <span className="tag">{profile.orientation}</span>
                )}
              </div>
            )}

            {socialLinks.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: 8,
                  }}
                >
                  Links
                </div>
                <div style={{ display: "flex", gap: 10 }}>
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
              </div>
            )}
          </div>
        </div>
      )}

      {listModal && (
        <UserListModal
          title={listModal.title}
          users={listModal.users}
          onClose={() => setListModal(null)}
        />
      )}

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      {showAchievements && (
        <AchievementsModal
          badges={earnedBadges}
          onClose={() => setShowAchievements(false)}
        />
      )}
    </>
  );
}
