/**
 * 登录页可选登录方式（构建时由 NEXT_PUBLIC_* 控制，改后需重新 build 前端）。
 * 默认关闭微信、手机号，仅展示邮箱登录。
 */
export const LOGIN_SHOW_WECHAT = process.env.NEXT_PUBLIC_LOGIN_SHOW_WECHAT === "true";
export const LOGIN_SHOW_PHONE = process.env.NEXT_PUBLIC_LOGIN_SHOW_PHONE === "true";
