const prisma = require("./prisma");

// Returns an array of user IDs that should be hidden from `userId`'s view:
// people they blocked, and people who blocked them.
async function getHiddenUserIds(userId) {
  if (!userId) return [];

  const [iBlocked, blockedMe] = await Promise.all([
    prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    }),
    prisma.block.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    }),
  ]);

  return [
    ...iBlocked.map((b) => b.blockedId),
    ...blockedMe.map((b) => b.blockerId),
  ];
}

module.exports = { getHiddenUserIds };
