/**
 * Seed random posts from distinct user accounts (production RDS).
 * Usage: npx tsx scripts/seed-random-posts.ts [--count=100] [--dry-run]
 */
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

function loadProductionPrismaUrl(): string {
  const txt = readFileSync("docker-compose.production.yml", "utf8");
  const m = txt.match(/DATABASE_URL:\s*\$\{DATABASE_URL:-([^}]+)\}/);
  if (!m) throw new Error("DATABASE_URL default not found in docker-compose.production.yml");
  const dsn = m[1];
  const p = dsn.match(/^([^:]+):([^@]+)@tcp\(([^)]+)\)\/([^?]+)(?:\?.*)?$/);
  if (!p) throw new Error("Unsupported DSN format");
  return `mysql://${encodeURIComponent(p[1])}:${encodeURIComponent(p[2])}@${p[3]}/${p[4]}`;
}

const QUESTIONS = [
  // 考研 / 保研
  "双非想冲985，现在大三还来得及吗？",
  "跨专业考研计算机，零基础从哪里入手？",
  "保研夏令营被拒了两次，预推免还有希望吗？",
  "考研二战值得吗？一战差线5分",
  "保研和出国读研怎么选，家里预算有限",
  "408复习到一半感觉进度很慢，正常吗",
  "保研个人陈述怎么写才不模板化？",
  "考研期间要不要实习，会不会影响复习？",
  "推免系统填报有什么容易踩的坑？",
  "目标院校改了考纲，现在换学校来得及吗？",
  "保研面试被问「为什么选我们」怎么答？",
  "考研政治从几月开始背比较合适？",
  "夏令营入营了但导师没回复邮件，要再发吗？",
  "专硕和学硕对以后读博影响大吗？",
  "保研边缘人，绩点3.6还有戏吗？",

  // 职业 / 转行
  "28岁从传统制造业转互联网，现实吗？",
  "产品经理和运营怎么选，哪个更适合文科生？",
  "工作三年想读MBA，值不值？",
  "裸辞Gap三个月找工作，HR会介意吗？",
  "国企和互联网Offer同时到手，怎么选？",
  "想转数据分析，需要学到什么程度才能投简历？",
  "35岁程序员还有竞争力吗，要不要转管理？",
  "实习转正概率低，要不要提前找下家？",
  "第一份工作选大厂还是小公司？",
  "被裁后是先休息还是立刻投简历？",
  "远程办公岗位怎么辨别是不是坑？",
  "想进Consulting，背景一般怎么补？",
  "职业迷茫期，怎么确定自己适合什么方向？",
  "工资涨不动，跳槽还是内部转岗？",
  "文科生除了考公还能走哪些路？",

  // 副业 / 创业
  "下班后做副业，每天2小时能做什么？",
  "小红书起号一个月没流量，还要继续吗？",
  "想卖虚拟资料，会不会侵权？",
  "副业收入超过主业了，要不要全职？",
  "一个人创业怎么找第一个付费用户？",
  "摆摊和做自媒体哪个更适合新手？",
  "知识付费课程定价99还是199合理？",
  "社群运营怎么提高活跃度？",
  "做电商没有供应链，代发模式靠谱吗？",
  "副业被公司发现会有风险吗？",
  "AI工具能不能帮我自动做内容？",
  "小成本创业项目有哪些试错成本低的？",
  "合伙创业股权怎么分比较公平？",
  "自由职业者怎么交社保更划算？",
  "想做一人公司，先从哪一步开始？",

  // AI / 技术学习
  "零基础学Python，三个月能找实习吗？",
  "ChatGPT写代码靠谱吗，程序员会被替代吗？",
  "想学大模型应用开发，路线怎么规划？",
  "非科班转码，项目经历怎么攒？",
  "AI绘画接单能当副业吗？",
  "Prompt工程师这个方向还有前景吗？",
  "自学前端还是后端，哪个更好找工作？",
  "LeetCode刷多少题够应付面试？",
  "开源项目贡献对求职帮助大吗？",
  "想做一个AI Agent产品，技术栈怎么选？",

  // 留学 / 出海
  "美国CS硕士一年制值得读吗？",
  "雅思6.5够申请英国好学校吗？",
  "Gap year出国，签证会被拒吗？",
  "海外找实习，LinkedIn怎么优化？",
  "想移民加拿大，走留学路径现实吗？",
  "欧洲和新加坡读研怎么选？",
  "出国读研回来就业竞争力怎么样？",
  "DIY申请还是找中介，差别大吗？",
  "海外生活成本太高，有没有性价比高的城市？",
  "工作几年后出国读博，来得及吗？",

  // 生活 / 成长
  "总是拖延，有什么可执行的办法？",
  "如何建立早起的习惯，试了很多次都失败",
  "社交恐惧，职场沟通怎么练？",
  "读完研还是觉得很迷茫，正常吗？",
  "怎么平衡工作和学习，不想躺平",
  "长期焦虑，要不要去看心理咨询？",
  "30岁之前应该优先搞钱还是搞兴趣？",
  "怎么拒绝无效社交又不伤感情？",
  "独居久了感觉越来越封闭，怎么办？",
  "想提升表达能力，看书还是练演讲？",
  "完美主义导致不敢开始，怎么破？",
  "和父母观念冲突很大，怎么沟通？",
  "如何设定可坚持的年度目标？",
  "感觉朋友都在进步，只有自己在原地踏步",
  "下班后只想刷手机，怎么恢复精力？",

  // 兴趣 / 旅行 / 宠物
  "第一次养猫，需要准备什么？",
  "想养柯基，上班族适合吗？",
  "一个人去日本自由行，英语不好行不行？",
  "周末周边游有什么小众推荐？",
  "健身新手去健身房会不会很尴尬？",
  "想学摄影，手机够用还是得上相机？",
  "长途旅行怎么省钱又不将就？",
  "宠物看病太贵，有没有保险推荐？",
  "想报个潜水证，东南亚哪里性价比高？",
  "宅家太久想出去走走，独自旅行安全吗？",

  // 求职 / 面试
  "简历投出去没回音，是简历问题还是市场问题？",
  "面试被问期望薪资，怎么说比较合适？",
  "无经验怎么写项目经历才不虚？",
  "技术面挂了，还能争取HR面吗？",
  "秋招补录还有机会吗？",
  "内推真的比海投管用吗？",
  "外企和民企面试风格差很多，怎么准备？",
  "群面总是插不上话，怎么办？",
  "背调会查什么，离职原因怎么说？",
  "收到Offer但还想等更好的，能拖多久？",
];

function parseArgs() {
  const dryRun = process.argv.includes("--dry-run");
  const countArg = process.argv.find((a) => a.startsWith("--count="));
  const count = countArg ? Math.max(1, parseInt(countArg.split("=")[1] ?? "100", 10)) : 100;
  return { dryRun, count };
}

function randomPastDate(daysBack: number): Date {
  const now = Date.now();
  const offsetMs = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offsetMs);
}

async function main() {
  const { dryRun, count } = parseArgs();
  if (count > QUESTIONS.length) {
    throw new Error(`Only ${QUESTIONS.length} unique questions available, requested ${count}`);
  }

  process.env.DATABASE_PRISMA_URL = loadProductionPrismaUrl();
  const prisma = new PrismaClient();

  try {
    const users = await prisma.$queryRawUnsafe<
      { id: string; email: string; name: string | null }[]
    >(
      "SELECT id, email, name FROM users ORDER BY RAND() LIMIT ?",
      count,
    );

    if (users.length < count) {
      throw new Error(`Need ${count} users but only found ${users.length}`);
    }

    const shuffledQuestions = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, count);

    if (dryRun) {
      console.log(
        JSON.stringify(
          users.map((u, i) => ({
            userId: u.id,
            author: u.name ?? u.email,
            content: shuffledQuestions[i],
          })),
          null,
          2,
        ),
      );
      return;
    }

    const rows: string[] = [];
    const params: unknown[] = [];
    for (let i = 0; i < count; i++) {
      const user = users[i]!;
      const content = shuffledQuestions[i]!;
      const createdAt = randomPastDate(14);
      rows.push("(?, ?, ?, ?, 0, 0, ?, ?)");
      params.push(randomUUID(), user.id, content, "[]", createdAt, createdAt);
    }

    const batchSize = 25;
    for (let start = 0; start < rows.length; start += batchSize) {
      const chunkRows = rows.slice(start, start + batchSize);
      const chunkParams = params.slice(start * 6, (start + batchSize) * 6);
      await prisma.$executeRawUnsafe(
        `INSERT INTO posts (id, user_id, content, images, likes, comments_count, created_at, updated_at) VALUES ${chunkRows.join(", ")}`,
        ...chunkParams,
      );
    }

    const summary = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      "SELECT COUNT(*) AS count FROM posts",
    );
    const latest = await prisma.$queryRawUnsafe<
      { content: string; name: string | null; created_at: Date }[]
    >(
      `SELECT p.content, u.name, p.created_at
       FROM posts p JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC LIMIT 5`,
    );

    console.log(
      JSON.stringify(
        {
          inserted: count,
          totalPosts: summary[0]?.count?.toString(),
          sampleLatest: latest,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
