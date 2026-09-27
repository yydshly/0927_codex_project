"""Check website references without weakening the existing GitHub source contract."""
import copy
import unittest
from pathlib import Path
from projects import validate, render_index, summary_markdown, summary_html


class SourceTests(unittest.TestCase):
    def setUp(self):
        self.project = dict(id=1, order=1, slug="example", name="Example", summary="Demo",
                            source="https://github.com/example/repo", status="研究中",
                            demo="", cover="", cover_alt="")

    def test_existing_github_metadata_still_valid(self):
        validate(self.project, Path("001-example"), check_files=False)

    def test_website_requires_explicit_type(self):
        self.project["source"] = "https://example.com/atlas/"
        with self.assertRaises(ValueError):
            validate(self.project, Path("001-example"), check_files=False)
        self.project["source_type"] = "website"
        validate(self.project, Path("001-example"), check_files=False)
        self.assertIn("[参考网页](https://example.com/atlas/)", render_index([self.project]))

    def test_summary_labels_are_bold_without_executing_markup(self):
        summary = '能力：<script> & 数据 | 表；内容：题库；使用场景：动画；技术原理：GPU 筛选；对我的意义：*专属动作*'
        md = summary_markdown(summary)
        self.assertIn('<strong>能力：</strong>&lt;script&gt; &amp; 数据 \\| 表', md)
        self.assertIn('<br><strong>内容：</strong>题库', md)
        self.assertIn('<br><strong>使用场景：</strong>动画', md)
        self.assertIn('<br><strong>技术原理：</strong>GPU 筛选', md)
        self.assertIn('<strong>对我的意义：</strong>\\*专属动作\\*', md)
        page = summary_html(summary)
        self.assertIn('<strong>能力：</strong>&lt;script&gt; &amp;', page)
        self.assertNotIn('<script>', page)
        self.assertEqual(summary_markdown('普通摘要；场景不是标题'), '普通摘要；场景不是标题')
        self.assertIn('\n\n<strong>场景：</strong>动画', summary_markdown('能力：数据；场景：动画', '\n\n'))
        self.assertIn('<strong>内部算法：</strong>FFT 与 SPH', summary_html('内部模块：编译器；内部算法：FFT 与 SPH'))

    def test_source_label_uses_repository_name(self):
        self.project['source'] = 'https://github.com/freemocap/freemocap'
        self.assertIn('[freemocap](https://github.com/freemocap/freemocap)', render_index([self.project]))
        self.project['source_name'] = 'FreeMoCap'
        self.assertIn('[FreeMoCap](https://github.com/freemocap/freemocap)', render_index([self.project]))

    def test_unsafe_website_url_rejected(self):
        self.project["source_type"] = "website"
        for url in ("http://example.com", "javascript:alert(1)", "https://user:secret@example.com"):
            invalid = copy.deepcopy(self.project)
            invalid["source"] = url
            with self.assertRaises(ValueError):
                validate(invalid, Path("001-example"), check_files=False)

    def test_named_source_preserves_original_url_and_escapes_label(self):
        self.project.update(source_type="website", source="https://loficities.com/istanbul/",
                            source_name="Lofi Cities · Istanbul")
        validate(self.project, Path("001-example"), check_files=False)
        self.assertIn("[Lofi Cities · Istanbul](https://loficities.com/istanbul/)",
                      render_index([self.project]))
        self.project["source_name"] = "A | B"
        self.assertIn("A \\| B", render_index([self.project]))
        self.project["source_name"] = "bad\nlabel"
        with self.assertRaises(ValueError):
            validate(self.project, Path("001-example"), check_files=False)


if __name__ == "__main__":
    unittest.main()
