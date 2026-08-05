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
  Menu,
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

// Custom Pinterest Icon matching Lucide sizing
const PinterestIcon = ({ size = 18, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={style}
  >
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.163 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.633 0 12.017 0z" />
  </svg>
);

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
  const [tab, setTab] = useState("sheets");
  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const [blockStatus, setBlockStatus] = useState({
    iBlockedThem: false,
    theyBlockedMe: false,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Pinterest State
  const [pins, setPins] = useState([]);
  const [pinsLoading, setPinsLoading] = useState(false);
  const [pinsError, setPinsError] = useState(null);

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

  // Fetch Pinterest RSS Feed
  useEffect(() => {
    if (tab === "pins" && profile?.pinterestUrl && pins.length === 0) {
      try {
        let username = "";
        let cleanUrl = profile.pinterestUrl.trim();
        if (!cleanUrl.startsWith("http")) {
          cleanUrl = "https://" + cleanUrl;
        }

        const urlObj = new URL(cleanUrl);
        const pathSegments = urlObj.pathname.split("/").filter(Boolean);

        if (pathSegments.length > 0) {
          username = pathSegments[0];
        }

        if (!username) throw new Error("No username found");

        setPinsLoading(true);
        fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=https://www.pinterest.com/${username}/feed.rss`,
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.status === "ok") {
              const fetchedPins = (data.items || [])
                .map((item) => {
                  const imgMatch = item.description?.match(/src="([^"]+)"/);
                  let img = item.thumbnail || (imgMatch ? imgMatch[1] : null);

                  if (!img && item.enclosure && item.enclosure.link) {
                    img = item.enclosure.link;
                  }

                  const hdImage = img ? img.replace(/\d+x/, "736x") : null;

                  return {
                    id: item.guid || item.link,
                    link: item.link,
                    title: item.title || "Pin",
                    image: hdImage || img,
                  };
                })
                .filter((p) => p.image);
              setPins(fetchedPins);
            } else {
              setPinsError(
                "Could not load pins. (Is the Pinterest board public?)",
              );
            }
          })
          .catch(() => setPinsError("Failed to fetch pins."))
          .finally(() => setPinsLoading(false));
      } catch (err) {
        setPinsError("Invalid Pinterest URL. Please check your Settings.");
      }
    }
  }, [tab, profile?.pinterestUrl, pins.length]);

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
    { url: profile.pinterestUrl, Icon: PinterestIcon, label: "Pinterest" },
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
            "--cover-image": isImageCover
              ? `url(${profile.coverUrl})`
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

        {/* Clean, singular Tabs Section using `.more-menu` */}
        <div className="profile-tabs">
          <button
            type="button"
            className={`tab ${tab === "sheets" ? "active" : ""}`}
            onClick={() => {
              setTab("sheets");
              setTabMenuOpen(false);
            }}
          >
            Sheets
          </button>

          <button
            type="button"
            className={`tab ${tab === "photos" ? "active" : ""}`}
            onClick={() => {
              setTab("photos");
              setTabMenuOpen(false);
            }}
          >
            Photos ({photoPosts.length})
          </button>

          {/* Desktop Tabs (Hidden on mobile) */}
          {profile?.pinterestUrl && (
            <button
              type="button"
              className={`tab hide-on-mobile ${tab === "pins" ? "active" : ""}`}
              onClick={() => {
                setTab("pins");
                setTabMenuOpen(false);
              }}
            >
              <PinterestIcon size={14} /> Pins
            </button>
          )}

          {hasAbout && (
            <button
              type="button"
              className={`tab hide-on-mobile ${tab === "about" ? "active" : ""}`}
              onClick={() => {
                setTab("about");
                setTabMenuOpen(false);
              }}
            >
              <InfoIcon size={14} /> About
            </button>
          )}

          {/* Mobile Burger Menu (Hidden on desktop) */}
          {(profile?.pinterestUrl || hasAbout) && (
            <div
              className="show-on-mobile"
              style={{ marginLeft: "auto", position: "relative" }}
            >
              <button
                type="button"
                className={`tab ${["pins", "about"].includes(tab) ? "active" : ""}`}
                onClick={() => setTabMenuOpen((prev) => !prev)}
              >
                <Menu size={18} />
              </button>

              {/* The Dropdown Menu */}
              {tabMenuOpen && (
                <div
                  className="more-menu"
                  style={{ right: 0, top: "100%", zIndex: 100, minWidth: 150 }}
                >
                  {profile?.pinterestUrl && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setTab("pins");
                        setTabMenuOpen(false);
                      }}
                      style={{
                        color: tab === "pins" ? "var(--accent)" : "inherit",
                      }}
                    >
                      <PinterestIcon size={14} /> Pins
                    </button>
                  )}
                  {hasAbout && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setTab("about");
                        setTabMenuOpen(false);
                      }}
                      style={{
                        color: tab === "about" ? "var(--accent)" : "inherit",
                      }}
                    >
                      <InfoIcon size={14} /> About
                    </button>
                  )}
                </div>
              )}
            </div>
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

      {tab === "pins" && (
        <div style={{ paddingTop: 16 }}>
          {!profile?.pinterestUrl ? (
            <div className="empty">
              <p>No Pinterest account linked.</p>
              {isMe && (
                <p style={{ marginTop: 12 }}>
                  <Link
                    to="/settings"
                    style={{ color: "var(--accent)", fontWeight: 700 }}
                  >
                    Link your Pinterest in Settings
                  </Link>
                </p>
              )}
            </div>
          ) : pinsLoading ? (
            <div
              className="loading"
              style={{ textAlign: "center", color: "var(--text-dim)" }}
            >
              Loading pins...
            </div>
          ) : pinsError ? (
            <div className="empty">
              <p>{pinsError}</p>
            </div>
          ) : pins.length === 0 ? (
            <div className="empty">
              <p>No pins found on this board.</p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginTop: 8,
                }}
              >
                Note: It can take up to 24 hours for new pins to appear here due
                to RSS delays.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 8,
              }}
            >
              {pins.map((pin) => (
                <a
                  key={pin.id}
                  href={pin.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    border: "2px solid var(--border, #333)",
                    borderRadius: "var(--radius)",
                    padding: 0,
                    aspectRatio: "1 / 1",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  title={pin.title}
                >
                  <img
                    src={pin.image}
                    alt={pin.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

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
