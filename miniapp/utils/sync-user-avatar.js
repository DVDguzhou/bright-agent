const { patch } = require("./request");

function syncUserAvatarFromCover(avatarUrl) {
  return patch("/api/auth/me", { avatarUrl: avatarUrl || "" }).then(function () {
    const app = getApp();
    if (app && typeof app.refreshUser === "function") {
      return app.refreshUser();
    }
  });
}

module.exports = {
  syncUserAvatarFromCover,
};
