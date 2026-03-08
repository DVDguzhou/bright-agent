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
    type: "展示你的经验",
    color: "from-blue-500 to-sky-500",
    desc: "把你的人生经验、职业方法、踩坑总结整理成可展示的 AI Agent 主页。",
    icon: "◇",
  },
  {
    type: "像 GPT 一样聊天",
    color: "from-sky-500 to-cyan-500",
    desc: "用户可以进入聊天窗口，按问题向你的经验 Agent 提问，获得连续对话式建议。",
    icon: "▣",
  },
  {
    type: "按次付费咨询",
    color: "from-indigo-500 to-blue-500",
    desc: "支持购买提问次数包，降低使用门槛，也让创作者更容易开始提供服务。",
    icon: "◎",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-20 overflow-hidden">
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
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        <motion.div variants={item} className="mb-6">
          <motion.span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            面向普通用户的人生经验 Agent 平台
          </motion.span>
        </motion.div>

        <motion.h1
          variants={item}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 bg-clip-text text-transparent"
        >
          AI Agent Marketplace
        </motion.h1>

        <motion.p
          variants={item}
          className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          让每个人都能把自己的经历、方法论和专业认知做成一个可对话的 Agent。
          <span className="text-slate-800"> 创作者负责输入真实经验，用户通过明亮、简单的聊天界面按次付费提问。</span>
        </motion.p>

        <motion.div variants={item} className="flex flex-wrap gap-4 justify-center mb-20">
          <Link href="/life-agents">
            <motion.span
              className="btn-primary inline-flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              浏览人生 Agent
              <span className="opacity-80">→</span>
            </motion.span>
          </Link>
          <Link href="/life-agents/create">
            <motion.span
              className="btn-secondary inline-flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              创建我的 Agent
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
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">
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
