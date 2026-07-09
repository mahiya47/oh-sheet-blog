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
  ShieldOff,
  Flag,
  MoreHorizontal,
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { CREATOR_ID, isBirthday } from "../lib/creator.js";
import { DEFAULT_COVER } from "../lib/covers.js";
import {
  getAccountAgeBadge,
  getScoreBadge,
  getPostCountBadge,
} from "../lib/badges.js";
import Avatar from "../components/Avatar.jsx";
import Feed from "../components/Feed.jsx";
import UserListModal from "../components/UserListModal.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import { getVerifiedVariant } from "../lib/verifiedVariant.js";
import Lightbox from "../components/Lightbox.jsx";
import AchievementsModal from "../components/AchievementsModal.jsx";
import ProfileSkeleton from "../components/ProfileSkeleton.jsx";
import ReportModal from "../components/ReportModal.jsx";

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
    blockUser,
    unblockUser,
    getBlockStatus,
    submitReport,
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
  const [blockStatus, setBlockStatus] = useState({
    iBlockedThem: false,
    theyBlockedMe: false,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    getFeed();
  }, [getFeed]);

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    Promise.all([
      getProfile(targetId),
      getFollowInfo(targetId),
      currentUser?.id !== targetId
        ? getBlockStatus(targetId)
        : Promise.resolve({ iBlockedThem: false, theyBlockedMe: false }),
    ]).then(([prof, info, block]) => {
      setProfile(prof);
      setCounts(info);
      setBlockStatus(block);
      setLoading(false);
    });
  }, [targetId]);

  if (loading) {
    return <ProfileSkeleton />;
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
  const postBadge = getPostCountBadge(userPosts.length);
  const earnedBadges = [ageBadge, scoreBadge, postBadge].filter(Boolean);
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

  const onToggleBlock = async () => {
    setMenuOpen(false);
    if (blockStatus.iBlockedThem) {
      const ok = await unblockUser(profile.id);
      if (ok) {
        setBlockStatus((s) => ({ ...s, iBlockedThem: false }));
        toast(`Unblocked @${profile.username}.`, "accent");
      }
    } else {
      const ok = await blockUser(profile.id);
      if (ok) {
        setBlockStatus((s) => ({ ...s, iBlockedThem: true }));
        const fresh = await getFollowInfo(profile.id);
        setCounts(fresh);
        toast(`Blocked @${profile.username}.`, "danger");
      }
    }
  };

  const onSubmitReport = async (reason) => {
    setShowReport(false);
    const res = await submitReport(profile.id, reason);
    if (res.ok) {
      toast(
        `Thanks — we'll take a look at @${profile.username}'s account.`,
        "accent",
      );
    } else {
      toast(res.error || "Could not submit report.", "danger");
    }

    if (!blockStatus.iBlockedThem) {
      const wantsBlock = window.confirm(
        `Report submitted. Want to also block @${profile.username} so you don't see their content anymore?`,
      );
      if (wantsBlock) {
        const ok = await blockUser(profile.id);
        if (ok) {
          setBlockStatus((s) => ({ ...s, iBlockedThem: true }));
          const fresh = await getFollowInfo(profile.id);
          setCounts(fresh);
          toast(`Blocked @${profile.username}.`, "danger");
        }
      }
    }
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

  // If they've blocked me, show a minimal "unavailable" state instead of their content
  if (!isMe && blockStatus.theyBlockedMe) {
    return (
      <div className="empty">
        <p>This profile isn't available.</p>
        <p style={{ marginTop: 12 }}>
          <Link to="/feed">Back to the feed</Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="profile">
        <div
          className="profile-cover"
          style={{
            background: isImageCover
              ? `url(${profile.coverUrl}) center/cover no-repeat`
              : profile.coverUrl || DEFAULT_COVER,
            animation: "fadeIn 0.4s ease",
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
                animation: "fadeIn 0.4s ease 0.1s both",
              }}
              aria-label="View profile photo"
            >
              <Avatar user={profile} size={104} />
            </button>
            <div style={{ display: "flex", gap: 8 }}>
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
                <>
                  {!blockStatus.iBlockedThem && (
                    <button
                      type="button"
                      className={`btn ${following ? "btn-danger" : "btn-accent"}`}
                      onClick={onFollow}
                      style={{ fontSize: "0.75rem", padding: "7px 14px" }}
                    >
                      {following ? "Unfollow" : "Follow"}
                    </button>
                  )}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setMenuOpen((o) => !o)}
                      aria-label="More options"
                      style={{ width: 38, height: 38, padding: 0 }}
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {menuOpen && (
                      <div
                        className="more-menu"
                        role="menu"
                        style={{ right: 0, minWidth: 180 }}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setMenuOpen(false);
                            setShowReport(true);
                          }}
                        >
                          <Flag size={15} />
                          Report @{profile.username}
                        </button>
                        <button
                          type="button"
                          className="danger"
                          role="menuitem"
                          onClick={onToggleBlock}
                        >
                          <ShieldOff size={15} />
                          {blockStatus.iBlockedThem
                            ? "Unblock"
                            : `Block @${profile.username}`}
                        </button>
                      </div>
                    )}
                  </div>
                </>
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
          {(earnedBadges.length > 0 || socialLinks.length > 0) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: "var(--space-4)",
              }}
            >
              {earnedBadges.length > 0 && (
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
              )}
              {socialLinks.map(({ url, Icon, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="social-icon-btn"
                  style={{
                    width: 38,
                    height: 38,
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

      {showReport && (
        <ReportModal
          username={profile.username}
          onClose={() => setShowReport(false)}
          onSubmit={onSubmitReport}
        />
      )}
    </>
  );
}
