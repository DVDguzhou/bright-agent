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
    type: "分享本地经验",
    color: "from-blue-500 to-sky-500",
    desc: "菜市场、酒吧、大学、创业——你的真实经历、踩坑总结和本地知识，做成可展示的 Agent 主页。",
    icon: "◇",
  },
  {
    type: "像 GPT 一样聊天",
    color: "from-sky-500 to-cyan-500",
    desc: "用户进入聊天窗口，按问题向你提问，获得基于你亲身经验的连续对话式建议。",
    icon: "▣",
  },
  {
    type: "按次付费咨询",
    color: "from-indigo-500 to-blue-500",
    desc: "购买提问次数包，降低使用门槛，让创作者把本地经验转化为可 monetize 的服务。",
    icon: "◎",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-8 sm:py-20 overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-sky-400/10 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center"
      >
        <motion.div variants={item} className="mb-4 sm:mb-6">
          <motion.span
            className="inline-block px-3 py-1.5 sm:px-4 rounded-full text-xs sm:text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 max-w-full break-words"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            专注本地的经验 Agent 市场 · 训练你的私人AI化身帮你赚钱
          </motion.span>
        </motion.div>

        <motion.h1
          variants={item}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 bg-clip-text text-transparent break-words"
        >
          Bright Agent Hub
        </motion.h1>

        <motion.p
          variants={item}
          className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed break-words px-2"
        >
          学长分享雅思经验、菜市场大妈说哪些摊位新鲜实惠、酒吧达人告诉你哪家好哪家差、创业者说哪些行业值得一试——把真实本地经验做成可对话的 Agent，用户按次付费咨询。
        </motion.p>

        <motion.div variants={item} className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center mb-12 sm:mb-20">
          <Link href="/life-agents" className="w-full sm:w-auto">
            <motion.span
              className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto min-w-[140px]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              浏览人生 Agent
              <span className="opacity-80">→</span>
            </motion.span>
          </Link>
          <Link href="/life-agents/create" className="w-full sm:w-auto">
            <motion.span
              className="btn-secondary inline-flex items-center justify-center gap-2 w-full sm:w-auto min-w-[140px]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              创建我的 Agent
            </motion.span>
          </Link>
        </motion.div>

        <motion.div
          variants={container}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left"
        >
          {cards.map((card) => (
            <motion.div
              key={card.type}
              variants={item}
              whileHover={{ y: -6 }}
              className="group relative p-4 sm:p-6 rounded-2xl glass-card cursor-default overflow-hidden"
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className="relative min-w-0">
                <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
                  {card.icon}
                </span>
                <h3 className={`mt-3 font-semibold text-base sm:text-lg bg-gradient-to-r ${card.color} bg-clip-text text-transparent break-words`}>
                  {card.type}
                </h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed break-words">
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
