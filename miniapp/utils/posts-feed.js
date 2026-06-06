const { absUrl } = require("./request");
const { formatTimeAgo } = require("./format");
const { resolveLifeAgentCoverDisplayUrl } = require("./covers");

function truncateText(text, max) {
  const s = String(text || "").trim();
  const limit = max || 120;
  if (s.length <= limit) return s;
  return s.slice(0, limit) + "…";
}

function normalizeCommentPreview(raw) {
  const isAgent = !!raw.isAgentReply;
  const name = isAgent
    ? raw.agentName || "Agent"
    : raw.authorName || "用户";
  let avatarFull = "";
  if (isAgent) {
    avatarFull = resolveLifeAgentCoverDisplayUrl(
      "",
      raw.agentCoverUrl,
      ""
    );
    if (raw.agentCoverUrl && avatarFull.indexOf("default-cover") >= 0) {
      avatarFull = absUrl(raw.agentCoverUrl);
    }
  } else if (raw.authorAvatarUrl) {
    avatarFull = absUrl(raw.authorAvatarUrl);
  }
  const agentProfileId = isAgent
    ? String(raw.agentId || raw.authorId || "")
    : "";
  return {
    id: String(raw.id || ""),
    preview: truncateText(raw.content, 120),
    authorName: name,
    authorId: String(raw.authorId || ""),
    agentId: String(raw.agentId || ""),
    agentProfileId: agentProfileId,
    avatarFull: avatarFull,
    isAgentReply: isAgent,
    initial: name.charAt(0) || "?",
  };
}

function isPrivatePost(raw) {
  const visibility = String(
    (raw && raw.visibility) || "public"
  ).toLowerCase();
  return visibility === "private";
}

function filterPostsForTab(items, tab) {
  const list = Array.isArray(items) ? items : [];
  if (tab === "mine") return list;
  return list.filter(function (raw) {
    return !isPrivatePost(raw);
  });
}

function normalizePost(raw, userId) {
  const images = Array.isArray(raw.images) ? raw.images : [];
  const imageUrls = images.slice(0, 3).map(function (src) {
    return absUrl(src);
  });
  const authorName = String(raw.authorName || "用户");
  const previewComments = Array.isArray(raw.previewComments)
    ? raw.previewComments.map(normalizeCommentPreview)
    : [];
  return {
    id: String(raw.id || ""),
    content: String(raw.content || ""),
    images: imageUrls,
    allImageCount: images.length,
    imageGridClass:
      imageUrls.length === 1
        ? "grid-1"
        : imageUrls.length === 2
          ? "grid-2"
          : "grid-3",
    visibility: isPrivatePost(raw) ? "private" : "public",
    isPrivate: isPrivatePost(raw),
    authorName: authorName,
    authorId: String(raw.authorId || ""),
    authorAgentProfileId: String(raw.authorAgentProfileId || ""),
    authorAvatarFull: raw.authorAvatarUrl ? absUrl(raw.authorAvatarUrl) : "",
    authorInitial: authorName.charAt(0) || "用",
    timeLabel: formatTimeAgo(raw.createdAt),
    likes: Number(raw.likes) || 0,
    commentsCount: Number(raw.commentsCount) || 0,
    likedByMe: !!raw.likedByMe,
    likeLabel: (Number(raw.likes) || 0) > 0 ? String(raw.likes) : "赞",
    commentLabel:
      (Number(raw.commentsCount) || 0) > 0
        ? raw.commentsCount + " 条评论"
        : "评论",
    previewComments: previewComments,
    showMoreComments:
      (Number(raw.commentsCount) || 0) > previewComments.length,
    moreCommentsLabel:
      "查看全部 " + (Number(raw.commentsCount) || 0) + " 条评论",
    isMine: !!(userId && raw.authorId && userId === raw.authorId),
  };
}

module.exports = {
  normalizePost,
  normalizeCommentPreview,
  truncateText,
  isPrivatePost,
  filterPostsForTab,
};
