"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Agent = {
  id: string;
  name: string;
  description: string | null;
  baseUrl: string;
  supportedScopes: string[];
  status: string;
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = filter ? `/api/agents?scope=${filter}` : "/api/agents";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setAgents(data);
        setLoading(false);
      })
      .catch(() => {
        setAgents([]);
        setLoading(false);
      });
  }, [filter]);

  const scopes = ["", "content.generate", "data.fetch"];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Agents
        </h1>
        <div className="flex flex-wrap gap-2">
          {scopes.map((s) => (
            <motion.button
              key={s || "all"}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                filter === s
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:border-cyan-500/30 hover:text-slate-200"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {s || "全部"}
            </motion.button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="h-40 rounded-2xl glass-card animate-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: i * 0.1 }}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/agents/${agent.id}`}>
                  <motion.div
                    className="block p-6 rounded-2xl glass-card group h-full"
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <h3 className="font-semibold text-lg text-slate-100 group-hover:text-cyan-400 transition-colors">
                      {agent.name}
                    </h3>
                    {agent.description && (
                      <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                        {agent.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {agent.supportedScopes.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-slate-500 text-sm">
                      <span className={`capitalize ${agent.status === "approved" ? "text-emerald-400" : "text-amber-400"}`}>
                        {agent.status}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
