export function getVerifiedVariant(user, isCreatorProfile) {
  if (isCreatorProfile) return "creator";

  const orientation = (user?.orientation || "").toLowerCase();
  const isOutNonStraight =
    user?.showOrientation && orientation && orientation !== "straight";

  if (isOutNonStraight) return "pride";

  return "verified";
}
