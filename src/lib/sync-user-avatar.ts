/** 将封面 URL 同步写入用户头像（与 ProfileAvatarEditor 反向绑定一致）。 */
export async function patchUserAvatarFromCoverUrl(avatarUrl: string): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ avatarUrl: avatarUrl.trim() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
