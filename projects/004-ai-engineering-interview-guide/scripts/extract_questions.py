"""Extract the fixed upstream README's question entries and answer links.

The source checkout under upstream/ is deliberately ignored by the parent repo.
Run this only when updating the research snapshot, then review the new JSON.
"""

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SUMMARY = json.loads((ROOT / "data/source-summary.json").read_text(encoding="utf-8"))
README = (ROOT / "upstream/README.md").read_text(encoding="utf-8-sig")
GROUPS = {section["group"] for section in SUMMARY["sections"]}
SECTIONS = {(section["group"], section["name"]): section for section in SUMMARY["sections"]}
LINK = re.compile(r"\[([^\]]+)\]\((https?://[^)]+)\)")
ASKED_AT = re.compile(r"\[([^\]]+)\]\(#([^)]+)\)")


def plain(text):
    """Remove inline Markdown decoration without rewriting the question."""
    return text.replace("`", "").replace("**", "").replace("\\_", "_").strip()


questions = []
group = ""
section = None
topic = ""
current = None
for line_number, line in enumerate(README.splitlines(), 1):
    if line.startswith("## "):
        group = line[3:]
        section = None
        current = None
    elif line.startswith("### "):
        section = SECTIONS.get((group, line[4:])) if group in GROUPS else None
        topic = section["name"] if section else ""
        current = None
    elif section is not None:
        if line.startswith("#### "):
            topic = line[5:]
        elif line.startswith("> **Roles this covers:**"):
            section.setdefault("_roles", line.split("**", 2)[2].strip())
        elif line.startswith("> **Interview loop, as publicly reported:**"):
            section.setdefault("_interview_loop", line.split("**", 2)[2].strip())
        elif line.startswith("- "):
            current = {
                "id": f"q-{len(questions)+1:03d}",
                "group": group,
                "section": section["name"],
                "topic": topic,
                "question": plain(line[2:]),
                "line": line_number,
                "source_url": f"{SUMMARY['repository']}/blob/{SUMMARY['commit']}/README.md#L{line_number}",
                "answer_links": [],
                "asked_at": [],
            }
            questions.append(current)
        elif current is not None and line.startswith("  - Answer:"):
            current["answer_links"].extend({"title": title, "url": url} for title, url in LINK.findall(line))
        elif current is not None and line.startswith("  - Asked at:"):
            current["asked_at"].extend({"name": title, "anchor": anchor} for title, anchor in ASKED_AT.findall(line))

section_details = [
    {
        "group": section["group"],
        "name": section["name"],
        "roles": section.get("_roles", ""),
        "interview_loop": section.get("_interview_loop", ""),
    }
    for section in SUMMARY["sections"]
]
assert len(questions) == SUMMARY["totals"]["question_entries"] == 598
assert sum(bool(q["answer_links"]) for q in questions) == SUMMARY["totals"]["entries_with_answer_links"] == 232
for section in SUMMARY["sections"]:
    related = [q for q in questions if q["group"] == section["group"] and q["section"] == section["name"]]
    assert len(related) == section["question_entries"], section["name"]
    assert sum(bool(q["answer_links"]) for q in related) == section["entries_with_answer_links"], section["name"]

output = {
    "repository": SUMMARY["repository"],
    "commit": SUMMARY["commit"],
    "question_count": len(questions),
    "answer_linked_count": sum(bool(q["answer_links"]) for q in questions),
    "sections": section_details,
    "questions": questions,
}
(ROOT / "data/questions.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Extracted {output['question_count']} questions, {output['answer_linked_count']} with answer links.")
