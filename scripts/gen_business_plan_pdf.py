# -*- coding: utf-8 -*-
"""Render a Markdown business plan to PDF (UTF-8, 微软雅黑)."""
from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
MD = DOCS / "商业计划书-BrightAgent.md"
OUT = DOCS / "business-plan-brightagent.pdf"
FONT = Path(r"C:\Windows\Fonts\msyh.ttc")

NAVY = (30, 58, 95)
ACCENT = (37, 99, 235)
BODY_GRAY = (45, 55, 65)
MUTED = (120, 128, 140)
TABLE_HEADER = (235, 241, 255)
TABLE_BORDER = (210, 220, 235)


def strip_md(s: str) -> str:
    s = re.sub(r"^>\s*", "", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"\*([^*]+)\*", r"\1", s)
    s = re.sub(r"`([^`]+)`", r"\1", s)
    return s


class PlanPDF(FPDF):
    def __init__(self, font_name: str) -> None:
        super().__init__()
        self._ff = font_name

    def footer(self) -> None:
        if self.page_no() == 1:
            return
        self.set_y(-14)
        self.set_font(self._ff, size=8)
        self.set_text_color(*MUTED)
        self.cell(0, 10, f"BrightAgent    ·    {self.page_no()}", align="C")


def render_h2(pdf: PlanPDF, text: str) -> None:
    pdf.ln(3)
    pdf.set_fill_color(*ACCENT)
    pdf.rect(pdf.l_margin, pdf.get_y() + 1.5, 3, 7, "F")
    pdf.set_x(pdf.l_margin + 6)
    pdf.set_text_color(*NAVY)
    pdf.set_font(pdf._ff, size=13)
    pdf.multi_cell(0, 8, text)
    pdf.set_x(pdf.l_margin)
    pdf.ln(1)
    pdf.set_font(pdf._ff, size=11)
    pdf.set_text_color(*BODY_GRAY)


def render_h3(pdf: PlanPDF, text: str) -> None:
    pdf.ln(1.5)
    pdf.set_text_color(*ACCENT)
    pdf.set_font(pdf._ff, size=11)
    pdf.multi_cell(0, 7, text)
    pdf.ln(0.5)
    pdf.set_font(pdf._ff, size=11)
    pdf.set_text_color(*BODY_GRAY)


def measure_cell_height(pdf: PlanPDF, width: float, text: str, line_height: float = 6) -> float:
    try:
        lines = pdf.multi_cell(width, line_height, text, dry_run=True, output="LINES")
        return max(line_height + 2, len(lines) * line_height + 2)
    except TypeError:
        text_width = max(pdf.get_string_width(text), width / 3)
        approx_lines = max(1, int((text_width // max(width - 2, 1)) + 1))
        return approx_lines * line_height + 2


def render_table(pdf: PlanPDF, rows: list[list[str]]) -> None:
    if not rows:
        return

    col_count = max(len(row) for row in rows)
    normalized = [row + [""] * (col_count - len(row)) for row in rows]
    available_width = pdf.w - pdf.l_margin - pdf.r_margin

    if col_count == 2:
        widths = [available_width * 0.28, available_width * 0.72]
    elif col_count == 3:
        widths = [available_width * 0.22, available_width * 0.39, available_width * 0.39]
    else:
        widths = [available_width / col_count] * col_count

    pdf.ln(1.5)
    for row_idx, row in enumerate(normalized):
        line_height = 5.5
        row_height = max(measure_cell_height(pdf, width, cell, line_height) for width, cell in zip(widths, row))

        if pdf.get_y() + row_height > pdf.page_break_trigger:
            pdf.add_page()
            pdf.set_font(pdf._ff, size=11)
            pdf.set_text_color(*BODY_GRAY)

        x0 = pdf.l_margin
        y0 = pdf.get_y()
        for col_idx, (width, cell) in enumerate(zip(widths, row)):
            pdf.set_xy(x0, y0)
            pdf.set_draw_color(*TABLE_BORDER)
            pdf.set_fill_color(*(TABLE_HEADER if row_idx == 0 else (255, 255, 255)))
            if row_idx == 0:
                pdf.set_font(pdf._ff, size=10)
                pdf.set_text_color(*NAVY)
            else:
                pdf.set_font(pdf._ff, size=10)
                pdf.set_text_color(*BODY_GRAY)
            pdf.multi_cell(
                width,
                line_height,
                cell,
                border=1,
                fill=True,
                new_x="RIGHT",
                new_y="TOP",
                max_line_height=line_height,
            )
            x0 += width
        pdf.set_xy(pdf.l_margin, y0 + row_height)

    pdf.ln(2)
    pdf.set_font(pdf._ff, size=11)
    pdf.set_text_color(*BODY_GRAY)


def parse_table_row(line: str) -> list[str]:
    stripped = line.strip().strip("|")
    return [cell.strip() for cell in stripped.split("|")]


def draw_cover(pdf: PlanPDF, title: str, tagline: str) -> None:
    pdf.add_page()
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, 210, 52, "F")
    pdf.set_y(18)
    pdf.set_font(pdf._ff, size=26)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 14, "BrightAgent", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(pdf._ff, size=11)
    pdf.set_text_color(200, 210, 230)
    pdf.cell(0, 8, "Agent Marketplace & Trust Layer", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(22)
    pdf.set_text_color(*NAVY)
    pdf.set_font(pdf._ff, size=18)
    pdf.cell(0, 10, title, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(pdf._ff, size=10)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 8, tagline, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)
    pdf.set_draw_color(*ACCENT)
    pdf.set_line_width(0.6)
    y0 = pdf.get_y()
    pdf.line(pdf.l_margin, y0, 210 - pdf.r_margin, y0)
    pdf.set_line_width(0.2)
    pdf.ln(10)
    pdf.set_text_color(*MUTED)
    pdf.set_font(pdf._ff, size=9)
    pdf.cell(0, 6, date.today().isoformat(), align="C", new_x="LMARGIN", new_y="NEXT")


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else MD
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else OUT

    if not src.is_absolute():
        src = ROOT / src
    if not dst.is_absolute():
        dst = ROOT / dst

    if not src.is_file():
        raise SystemExit(f"Missing {src}")

    raw_lines = src.read_text(encoding="utf-8").splitlines()
    lines = [strip_md(line.rstrip()) for line in raw_lines]

    doc_title = "商业计划书（摘要版）"
    tagline = "个人经验与决策陪伴 · Agent as Service"
    for line in lines:
        if line.startswith("# ") and "商业计划" in line:
            doc_title = line[2:].strip()
        if line.startswith("BrightAgent") and "—" in line:
            tagline = line.split("—", 1)[-1].strip()
            break

    pdf = PlanPDF("YaHei" if FONT.is_file() else "Helvetica")
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_left_margin(22)
    pdf.set_right_margin(22)

    if FONT.is_file():
        pdf.add_font("YaHei", "", str(FONT))
    pdf.set_font(pdf._ff, size=11)

    draw_cover(pdf, doc_title, tagline)

    pdf.add_page()
    pdf.set_text_color(*BODY_GRAY)
    pdf.set_font(pdf._ff, size=11)

    i = 0
    while i < len(raw_lines):
        raw = raw_lines[i]
        cleaned = lines[i]
        if raw.startswith("# ") and "商业计划" in cleaned:
            i += 1
            continue
        if cleaned.startswith("BrightAgent") and "—" in cleaned and "Agent as Service" in cleaned:
            i += 1
            continue
        if raw.strip() == "---":
            pdf.ln(2)
            pdf.set_draw_color(220, 225, 232)
            y = pdf.get_y()
            pdf.line(pdf.l_margin, y, 210 - pdf.r_margin, y)
            pdf.ln(6)
            i += 1
            continue
        if raw.lstrip().startswith("|"):
            table_lines: list[str] = []
            while i < len(raw_lines) and raw_lines[i].lstrip().startswith("|"):
                table_lines.append(raw_lines[i])
                i += 1
            rows = [parse_table_row(line) for line in table_lines if not re.fullmatch(r"\|\s*[-:| ]+\|", line.strip())]
            render_table(pdf, rows)
            continue
        if not cleaned.strip():
            pdf.ln(4)
            i += 1
            continue
        if cleaned.startswith("# "):
            pdf.set_text_color(*NAVY)
            pdf.set_font(pdf._ff, size=17)
            pdf.ln(2)
            pdf.multi_cell(0, 9, cleaned[2:].strip())
            pdf.ln(2)
            pdf.set_font(pdf._ff, size=11)
            pdf.set_text_color(*BODY_GRAY)
        elif cleaned.startswith("### "):
            render_h3(pdf, cleaned[4:].strip())
        elif cleaned.startswith("## "):
            render_h2(pdf, cleaned[3:].strip())
        elif raw.startswith("> "):
            pdf.set_text_color(*MUTED)
            pdf.set_font(pdf._ff, size=10)
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 5.5, cleaned)
            pdf.set_x(pdf.l_margin)
            pdf.ln(0.5)
            pdf.set_font(pdf._ff, size=11)
            pdf.set_text_color(*BODY_GRAY)
        elif re.match(r"^[-*]\s", cleaned) or re.match(r"^\d+\.\s", cleaned.strip()):
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 6.5, cleaned.strip())
            pdf.set_x(pdf.l_margin)
            pdf.ln(0.5)
        elif "对照阅读" in cleaned:
            pdf.ln(4)
            pdf.set_text_color(*MUTED)
            pdf.set_font(pdf._ff, size=9)
            pdf.multi_cell(0, 5, cleaned)
            pdf.set_font(pdf._ff, size=11)
            pdf.set_text_color(*BODY_GRAY)
        else:
            pdf.multi_cell(0, 6.5, cleaned)
            pdf.ln(1)
        i += 1

    dst.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(dst))
    print(f"Wrote {dst}")


if __name__ == "__main__":
    main()
