"use client";

import type { ReactNode } from "react";

const WEFLOW_README = "https://github.com/hicccc77/WeFlow?tab=readme-ov-file";

const STEPS: {
  title: string;
  body: ReactNode;
  imageSrc?: string;
  imageAlt: string;
}[] = [
  {
    title: "下载 WeFlow",
    body: (
      <>
        在电脑浏览器打开 WeFlow 项目主页，从{" "}
        <a
          href={WEFLOW_README}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 underline decoration-violet-300 underline-offset-2 hover:text-violet-700"
        >
          GitHub README
        </a>{" "}
        中的说明前往 Releases 下载并安装（Windows / macOS 等以页面为准）。需微信 4.0 及以上版本，详见{" "}
        <a
          href={WEFLOW_README}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 underline decoration-violet-300 underline-offset-2 hover:text-violet-700"
        >
          官方仓库说明
        </a>
        。
      </>
    ),
    imageAlt: "",
  },
  {
    title: "登录 WeFlow",
    body: "安装完成后打开 WeFlow，按软件内提示完成登录，并确保已连接本机微信数据。",
    imageAlt: "",
  },
  {
    title: "打开「导出」",
    body: "在左侧边栏点击「导出」，进入导出页面。",
    imageSrc: "/weflow-import-guide/steps/step-03.png",
    imageAlt: "WeFlow 左侧菜单选中「导出」",
  },
  {
    title: "选择要导出的会话",
    body: "在「按会话导出」区域，用「私聊 / 群聊」等标签找到目标聊天，可搜索联系人名称。",
    imageSrc: "/weflow-import-guide/steps/step-04.png",
    imageAlt: "按会话导出列表与私聊、群聊切换",
  },
  {
    title: "点击该会话的「导出」",
    body: "在对应会话一行右侧，点击「导出」按钮。",
    imageSrc: "/weflow-import-guide/steps/step-05.png",
    imageAlt: "会话列表中的导出按钮",
  },
  {
    title: "导出选项（建议与下图一致）",
    body: (
      <>
        对话文本格式建议选择 <strong className="font-medium text-slate-800">WeClone CSV</strong>；可按需勾选图片、语音、视频、表情包；建议开启{" "}
        <strong className="font-medium text-slate-800">语音转文字</strong>；发送者名称可选「备注优先」等。确认后点击{" "}
        <strong className="font-medium text-slate-800">创建导出任务</strong>。
      </>
    ),
    imageSrc: "/weflow-import-guide/steps/step-06.png",
    imageAlt: "导出格式与语音转文字等选项",
  },
  {
    title: "任务中心取文件",
    body: "点击右上角「任务中心」，等待任务完成后，点击「目录」打开导出文件夹。",
    imageSrc: "/weflow-import-guide/steps/step-07.png",
    imageAlt: "任务中心与目录按钮",
  },
  {
    title: "进入 texts 文件夹",
    body: (
      <>
        在导出目录中找到并打开 <strong className="font-medium text-slate-800">texts</strong>{" "}
        文件夹（与图片、语音等文件夹并列）。
      </>
    ),
    imageSrc: "/weflow-import-guide/steps/step-08.png",
    imageAlt: "资源管理器中的 texts 文件夹",
  },
  {
    title: "把 CSV 传到手机并上传本页",
    body: (
      <>
        在 <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-800">texts</code> 内找到本次导出生成的{" "}
        <strong className="font-medium text-slate-800">.csv</strong> 文件，通过微信文件助手、网盘、数据线等方式保存到手机，再在本页点击下方「选择文件」上传该 CSV。
      </>
    ),
    imageSrc: "/weflow-import-guide/steps/step-09.png",
    imageAlt: "texts 文件夹内的 CSV 文件",
  },
];

export function WeflowImportGuide() {
  return (
    <div className="mt-3 space-y-5 text-slate-600">
      {STEPS.map((step, i) => (
        <div key={i} className="border-b border-purple-100/80 pb-4 last:border-0 last:pb-0">
          <div className="mb-1.5 flex items-baseline gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-800">
              {i + 1}
            </span>
            <h4 className="text-sm font-semibold text-slate-800">{step.title}</h4>
          </div>
          <div className="ml-8 text-sm leading-relaxed [&_strong]:text-slate-800">{step.body}</div>
          {step.imageSrc ? (
            <div className="ml-8 mt-2 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-50 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element -- static tutorial screenshots */}
              <img
                src={step.imageSrc}
                alt={step.imageAlt}
                className="max-h-[min(52vh,420px)] w-full object-contain object-top"
                loading="lazy"
              />
            </div>
          ) : null}
        </div>
      ))}
      <p className="ml-8 text-xs text-slate-500">
        隐私提示：导出前可在 WeFlow 内控制范围；上传前可删 CSV 中的敏感内容。文件仅用于本次分析与更新你的 Agent。
      </p>
    </div>
  );
}
