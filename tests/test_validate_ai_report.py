import importlib.util
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "validate_ai_report.py"
spec = importlib.util.spec_from_file_location("validate_ai_report", MODULE_PATH)
assert spec and spec.loader
validate_ai_report = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validate_ai_report)
validate_report = validate_ai_report.validate_report
validate_summary = validate_ai_report.validate_summary


def test_report_validator_rejects_truncated_url_in_footnote(tmp_path: Path):
    report = tmp_path / "report.md"
    report.write_text(
        "---\n"
        "报告撰写日期: 2026-06-09\n"
        "下次更新建议: 2026-06-24（Micron 财报）\n"
        "---\n"
        "# AI产业投资转折点研究报告\n\n"
        "![short skirts clip](../assets/short_skirts_clip.png)\n\n"
        "## 2. 一页结论\n\n"
        "## 10. 交易员版本结论\n\n"
        "## 脚注\n\n"
        "[^1]: Reuters, https://www.reuters.com/business/media-telecom/sk-hyn...6-07/\n",
        encoding="utf-8",
    )

    errors = validate_report(report)

    assert any("截断 URL" in err and "line 15" in err for err in errors)


def test_report_validator_accepts_full_url(tmp_path: Path):
    report = tmp_path / "report.md"
    report.write_text(
        "---\n"
        "报告撰写日期: 2026-06-09\n"
        "下次更新建议: 2026-06-24（Micron 财报）\n"
        "---\n"
        "# AI产业投资转折点研究报告\n\n"
        "![short skirts clip](../assets/short_skirts_clip.png)\n\n"
        "## 2. 一页结论\n\n"
        "## 10. 交易员版本结论\n\n"
        "## 脚注\n\n"
        "[^1]: Reuters, https://www.reuters.com/world/asia-pacific/south-koreas-naver-build-gigawatt-scale-ai-factories-using-nvidia-technology-2026-06-07/\n",
        encoding="utf-8",
    )

    assert validate_report(report) == []


def test_summary_validator_rejects_long_report_sections(tmp_path: Path):
    summary = tmp_path / "telegram_summary.md"
    summary.write_text(
        "## 2. 一页结论\n\n"
        "## 3. AI 转折点雷达表\n\n"
        "## 10. 交易员版本结论\n",
        encoding="utf-8",
    )

    errors = validate_summary(summary)

    assert any("不该推送" in err for err in errors)
