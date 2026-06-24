export const CREATOR_ID = 5;
export const isCreator = (user) =>
  user?.id === CREATOR_ID || user?.author?.id === CREATOR_ID;
export const isBirthday = (user) => {
  if (!user?.birthday) return false;
  const b = new Date(user.birthday);
  const now = new Date();
  return b.getMonth() === now.getMonth() && b.getDate() === now.getDate();
};
