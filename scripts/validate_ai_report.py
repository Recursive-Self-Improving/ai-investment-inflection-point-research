#!/usr/bin/env python3
"""Validate AI investment inflection-point report artifacts.

This script is intentionally boring. Boring QA saves you from publishing clown-footnote URLs.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterable

TRUNCATED_URL_RE = re.compile(r"https?://\S*(?:\.\.\.|…)\S*")
FOOTNOTE_DEF_RE = re.compile(r"^\[\^[^\]]+\]:", re.MULTILINE)
FORBIDDEN_REPORT_MARKERS = [
    "## Response",
    "Current Session Context",
    "Conversation started:",
    "tool_calls",
    "<available_skills>",
    "你在执行 AI 投资转折点研究流水线的【阶段",
]
FORBIDDEN_SUMMARY_HEADINGS = [
    "## 3. AI 转折点雷达表",
    "## 4. Top",
    "## 5. 做空或受损资产",
    "## 6. 配对交易和跨市场传导",
    "## 7. 观察名单",
    "## 8. 数据缺口",
    "## 9. 硬性要求",
]


def _line_no(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def _find_truncated_urls(text: str) -> list[tuple[int, str]]:
    return [(_line_no(text, m.start()), m.group(0).rstrip(".,);]")) for m in TRUNCATED_URL_RE.finditer(text)]


def validate_report(report_path: Path) -> list[str]:
    errors: list[str] = []
    if not report_path.exists():
        return [f"正式报告不存在: {report_path}"]
    text = report_path.read_text(encoding="utf-8")

    if not text.startswith("---\n"):
        errors.append("正式报告缺少 YAML frontmatter")
    if "报告撰写日期:" not in text:
        errors.append("正式报告 frontmatter 缺少 报告撰写日期")
    if "下次更新建议:" not in text:
        errors.append("正式报告 frontmatter 缺少 下次更新建议")
    if "# AI产业投资转折点研究报告" not in text:
        errors.append("正式报告缺少正文标题 # AI产业投资转折点研究报告")
    if "![short skirts clip](../assets/short_skirts_clip.png)" not in text:
        errors.append("正式报告缺少 hero image")
    if "## 2. 一页结论" not in text:
        errors.append("正式报告缺少 ## 2. 一页结论")
    if "## 10. 交易员版本结论" not in text:
        errors.append("正式报告缺少 ## 10. 交易员版本结论")
    if not FOOTNOTE_DEF_RE.search(text):
        errors.append("正式报告没有脚注来源定义")

    for marker in FORBIDDEN_REPORT_MARKERS:
        if marker in text:
            errors.append(f"正式报告包含禁止标记: {marker}")

    for line, url in _find_truncated_urls(text):
        errors.append(f"正式报告含截断 URL: line {line}: {url}")

    return errors


def validate_summary(summary_path: Path) -> list[str]:
    errors: list[str] = []
    if not summary_path.exists():
        return [f"摘要草稿不存在: {summary_path}"]
    text = summary_path.read_text(encoding="utf-8")

    if "## 2. 一页结论" not in text:
        errors.append("摘要草稿缺少 ## 2. 一页结论")
    if "## 10. 交易员版本结论" not in text:
        errors.append("摘要草稿缺少 ## 10. 交易员版本结论")
    for heading in FORBIDDEN_SUMMARY_HEADINGS:
        if heading in text:
            errors.append(f"摘要草稿包含不该推送的长报告章节: {heading}")
    for line, url in _find_truncated_urls(text):
        errors.append(f"摘要草稿含截断 URL: line {line}: {url}")
    return errors


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate AI report and Telegram summary artifacts")
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--summary", required=False, type=Path)
    args = parser.parse_args(list(argv) if argv is not None else None)

    errors = validate_report(args.report)
    if args.summary:
        errors.extend(validate_summary(args.summary))

    if errors:
        print("QA_FAILED")
        for err in errors:
            print(f"- {err}")
        return 1

    print("QA_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
