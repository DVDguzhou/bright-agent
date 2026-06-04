"use client";

import Link from "next/link";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { getDisplayAvatar } from "@/lib/avatar";
import { DEFAULT_COVER_URL, normalizeLifeAgentCoverImgSrc } from "@/lib/life-agent-covers";

export type PostCommentPreviewItem = {
  id: string;
  content: string;
  authorName: string;
  authorId: string;
  authorAvatarUrl?: string;
  isAgentReply: boolean;
  agentName?: string;
  agentId?: string;
  agentCoverUrl?: string;
};

function truncateComment(text: string, max = 120): string {
  const s = text.trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function PostCommentPreviewRow({ comment }: { comment: PostCommentPreviewItem }) {
  const agentProfileId = comment.agentId || comment.authorId;
  const displayName = comment.isAgentReply
    ? comment.agentName || "Agent"
    : comment.authorName;
  const agentCoverSrc = comment.agentCoverUrl
    ? normalizeLifeAgentCoverImgSrc(comment.agentCoverUrl)
    : DEFAULT_COVER_URL;

  return (
    <div className="flex items-start gap-2">
      {comment.isAgentReply && agentProfileId ? (
        <Link
          href={`/life-agents/${agentProfileId}`}
          className="relative mt-0.5 h-6 w-6 shrink-0 overflow-hidden rounded-full bg-paper-200/60 ring-1 ring-hairline/25"
          aria-label={`查看 ${displayName} 的资料`}
        >
          <LifeAgentCoverImage
            src={agentCoverSrc}
            alt=""
            fill
            compact
            className="object-cover"
            sizes="24px"
          />
        </Link>
      ) : (
        <div className="relative mt-0.5 h-6 w-6 shrink-0 overflow-hidden rounded-full bg-paper-100 ring-1 ring-hairline/25">
          <img
            src={getDisplayAvatar({ avatarUrl: comment.authorAvatarUrl, name: comment.authorName })}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
      <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink">
        {comment.isAgentReply && agentProfileId ? (
          <Link href={`/life-agents/${agentProfileId}`} className="font-semibold text-ink-700">
            {displayName}
          </Link>
        ) : (
          <span className="font-semibold">{displayName}</span>
        )}
        <span className="text-ink-500">：{truncateComment(comment.content)}</span>
      </p>
    </div>
  );
}

export function PostCommentPreviewList({
  comments,
  postId,
  totalCount,
}: {
  comments: PostCommentPreviewItem[];
  postId: string;
  totalCount: number;
}) {
  if (comments.length === 0 && totalCount === 0) return null;

  return (
    <div className="mt-2.5 space-y-2">
      {comments.map((comment) => (
        <PostCommentPreviewRow key={comment.id} comment={comment} />
      ))}
      {totalCount > comments.length ? (
        <Link
          href={`/posts/${postId}`}
          className="block pt-0.5 text-xs font-medium text-ink-300 transition hover:text-ink-500"
        >
          查看全部 {totalCount} 条评论
        </Link>
      ) : null}
    </div>
  );
}
