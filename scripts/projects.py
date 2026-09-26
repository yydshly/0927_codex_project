"""Create numbered research projects and maintain the root README index."""

import argparse
import html
import json
from pathlib import Path
import re
import shutil
import sys
from urllib.parse import quote, urlparse


ROOT = Path(__file__).resolve().parents[1]
START = "<!-- PROJECTS:START -->"
END = "<!-- PROJECTS:END -->"
STATUSES = {"待研究", "研究中", "已完成", "已归档"}
SLUG = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def valid_url(value, github=False):
    if not isinstance(value, str) or re.search(r"[\s<>\\]", value):
        return False
    parsed = urlparse(value)
    return (
        parsed.scheme == "https"
        and bool(parsed.hostname)
        and parsed.username is None
        and parsed.password is None
        and (not github or (
            parsed.netloc == "github.com"
            and re.fullmatch(r"/[^/]+/[^/]+/?", parsed.path) is not None
            and not parsed.query and not parsed.fragment
        ))
    )


def directory_name(project):
    return f"{project['id']:03d}-{project['slug']}"


def validate(project, directory, check_files=True):
    require(isinstance(project, dict), f"{directory}: 元数据必须是 JSON 对象")
    for field in ("id", "order"):
        require(type(project.get(field)) is int and project[field] > 0,
                f"{directory}: {field} 必须为正整数")
    for field in ("slug", "name", "summary", "source", "status", "demo", "cover", "cover_alt"):
        value = project.get(field)
        require(isinstance(value, str) and not any(ord(c) < 32 for c in value),
                f"{directory}: {field} 必须为单行文本")
        if field not in ("demo", "cover", "cover_alt"):
            require(bool(value.strip()), f"{directory}: {field} 不可为空")
    require(SLUG.fullmatch(project["slug"]), f"{directory}: slug 格式不正确")
    require(directory.name == directory_name(project), f"{directory}: 目录名与编号或 slug 不一致")
    require(project["status"] in STATUSES, f"{directory}: 未知研究状态")
    require(valid_url(project["source"], github=True), f"{directory}: source 必须是 HTTPS GitHub 仓库地址")
    require(not project["demo"] or valid_url(project["demo"]), f"{directory}: demo 必须为空或 HTTPS 地址")
    if check_files:
        require((directory / "README.md").is_file(), f"{directory}: 缺少 README.md")
    if project["cover"]:
        cover = project["cover"]
        require(re.fullmatch(r"assets/[a-zA-Z0-9_./-]+", cover)
                and ".." not in cover.split("/"), f"{directory}: cover 必须是 assets/ 下的相对路径")
        cover_path = (directory / cover).resolve()
        require(cover_path.is_relative_to((directory / "assets").resolve()),
                f"{directory}: 图片路径越界")
        require(cover_path.suffix.lower() in IMAGE_SUFFIXES, f"{directory}: 图片格式不支持")
        require(bool(project["cover_alt"].strip()), f"{directory}: 请填写图片说明 cover_alt")
        if check_files:
            require(cover_path.is_file(), f"{directory}: 图片文件不存在：{cover}")


def load_projects(root):
    projects = []
    for directory in sorted((root / "projects").iterdir()):
        if not directory.is_dir() or directory.name.startswith("."):
            continue
        metadata = directory / "project.json"
        require(metadata.is_file(), f"{directory}: 缺少 project.json")
        project = json.loads(metadata.read_text(encoding="utf-8"))
        validate(project, directory)
        projects.append(project)
    for field in ("id", "slug"):
        values = [project[field] for project in projects]
        require(len(values) == len(set(values)), f"存在重复的 {field}")
    return sorted(projects, key=lambda project: (project["order"], project["id"]))


def markdown(value):
    value = html.escape(value, quote=False)
    return re.sub(r"([\\`*{}\[\]()#+.!_|~])", r"\\\1", value)


def link_url(value):
    return quote(value, safe="/:?=&%#@+;,-._~")


def render_index(projects):
    lines = [
        f"当前收录 **{len(projects)}** 个项目。", "",
        "| 编号 | 项目与研究入口 | 摘要 | 研究状态 | 原仓库 | Web 演示 |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for project in projects:
        path = f"projects/{directory_name(project)}"
        demo = f"[在线体验]({link_url(project['demo'])})" if project["demo"] else "—"
        lines.append(
            f"| {project['id']:03d} | [{markdown(project['name'])}]({path}/README.md) "
            f"| {markdown(project['summary'])} | {project['status']} "
            f"| [GitHub]({link_url(project['source'])}) | {demo} |"
        )
    if not projects:
        lines.append("| — | 暂无项目 | 添加第一个研究项目后自动更新 | — | — | — |")
    lines.extend(["", "### 项目图片", ""])
    covers = [project for project in projects if project["cover"]]
    if not covers:
        lines.append("添加项目截图后，这里会按索引顺序展示图片与说明。")
    for project in covers:
        path = f"projects/{directory_name(project)}"
        lines.extend([
            f"#### {project['id']:03d} · {markdown(project['name'])}", "",
            f"[![{markdown(project['cover_alt'])}]({path}/{project['cover']})]({path}/README.md)", "",
            markdown(project["cover_alt"]), "",
            markdown(project["summary"]), "",
        ])
    return "\n".join(lines).rstrip()


def updated_readme(root, projects):
    path = root / "README.md"
    current = path.read_text(encoding="utf-8")
    require(current.count(START) == 1 and current.count(END) == 1,
            "README 必须包含唯一的一对 PROJECTS 标记")
    before, rest = current.split(START)
    generated, after = rest.split(END)
    return path, current, before + START + "\n" + render_index(projects) + "\n" + END + after


def write_text(path, text):
    path.write_text(text, encoding="utf-8", newline="\n")


def create_project(root, args, projects):
    require(SLUG.fullmatch(args.slug), "项目短名称只允许小写字母、数字和单个连字符")
    require(all(project["slug"] != args.slug for project in projects), "该项目短名称已存在")
    identifier = max((project["id"] for project in projects), default=0) + 1
    project = {
        "id": identifier,
        "order": max((project["order"] for project in projects), default=0) + 1,
        "slug": args.slug,
        "name": args.name,
        "summary": args.summary,
        "source": args.source,
        "status": "待研究",
        "demo": "",
        "cover": "",
        "cover_alt": "",
    }
    directory = root / "projects" / directory_name(project)
    require(not directory.exists(), f"目录已存在：{directory}")
    validate(project, directory, check_files=False)
    updated_readme(root, projects)  # Validate markers before creating files.
    template = root / "templates" / "project"
    require((template / "README.md").is_file(), "缺少子项目模板")
    substitutions = {
        "id": f"{identifier:03d}",
        "name": markdown(args.name),
        "summary": markdown(args.summary),
        "source": link_url(args.source),
        "directory": directory.name,
    }
    shutil.copytree(template, directory)
    for path in directory.rglob("*.md"):
        content = path.read_text(encoding="utf-8")
        content = re.sub(r"\{\{(id|name|summary|source|directory)\}\}",
                         lambda match: substitutions[match[1]], content)
        write_text(path, content)
    write_text(directory / "project.json", json.dumps(project, ensure_ascii=False, indent=2) + "\n")
    return directory


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    new = subparsers.add_parser("new", help="创建下一个编号的研究项目")
    new.add_argument("slug", help="英文短名称，例如 browser-use")
    new.add_argument("--name", required=True, help="对外展示名称")
    new.add_argument("--source", required=True, help="上游 GitHub 仓库地址")
    new.add_argument("--summary", required=True, help="一句话研究摘要")
    subparsers.add_parser("sync", help="更新首页索引和图片")
    subparsers.add_parser("check", help="检查元数据、图片与首页同步情况")
    args = parser.parse_args()
    try:
        projects = load_projects(ROOT)
        if args.command == "new":
            directory = create_project(ROOT, args, projects)
            projects = load_projects(ROOT)
            print(f"Created: {directory.relative_to(ROOT).as_posix()}")
        path, current, updated = updated_readme(ROOT, projects)
        if args.command == "check":
            require(current == updated, "首页索引未同步，请运行 python scripts/projects.py sync")
            print(f"OK: {len(projects)} project(s); metadata and README index are valid.")
        else:
            write_text(path, updated)
            print("Updated: README.md")
    except (ValueError, OSError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
