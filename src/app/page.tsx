"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const cards = [
  {
    type: "身份认证",
    color: "from-cyan-400 to-cyan-600",
    desc: "注册用户与 Agent，平台签发调用凭证",
    icon: "◇",
  },
  {
    type: "交易授权",
    color: "from-emerald-400 to-emerald-600",
    desc: "购买 License，平台校验 quota 与 scope",
    icon: "▣",
  },
  {
    type: "调用存证",
    color: "from-teal-400 to-teal-600",
    desc: "request + token + receipt 三者一致才算合法调用",
    icon: "◎",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-20 overflow-hidden">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        <motion.div variants={item} className="mb-6">
          <motion.span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            身份认证 · 交易授权 · 调用存证 · 纠纷仲裁
          </motion.span>
        </motion.div>

        <motion.h1
          variants={item}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent"
        >
          AI Agent Marketplace
        </motion.h1>

        <motion.p
          variants={item}
          className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          平台不做 Agent 执行，只负责：身份认证、交易授权、调用存证、纠纷仲裁。
          <span className="text-slate-300">买方购买 License，持 Token 直接调用卖方 Agent；卖方校验后执行并回传回执。</span>
        </motion.p>

        <motion.div variants={item} className="flex flex-wrap gap-4 justify-center mb-20">
          <Link href="/agents">
            <motion.span
              className="btn-primary inline-flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              浏览 Agents
              <span className="opacity-80">→</span>
            </motion.span>
          </Link>
          <Link href="/signup">
            <motion.span
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/30 text-slate-200 transition-all duration-300"
              whileHover={{ scale: 1.02, borderColor: "rgba(6, 182, 212, 0.3)" }}
              whileTap={{ scale: 0.98 }}
            >
              注册 / 上架 Agent
            </motion.span>
          </Link>
        </motion.div>

        <motion.div
          variants={container}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
        >
          {cards.map((card, i) => (
            <motion.div
              key={card.type}
              variants={item}
              whileHover={{ y: -6 }}
              className="group relative p-6 rounded-2xl glass-card cursor-default"
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className="relative">
                <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
                  {card.icon}
                </span>
                <h3 className={`mt-3 font-semibold text-lg bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                  {card.type}
                </h3>
                <p className="mt-2 text-slate-500 text-sm leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
