export const CREATOR_ID = 5;
export const isCreator = (user) =>
  user?.id === CREATOR_ID || user?.author?.id === CREATOR_ID;
