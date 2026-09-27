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
        summary = '能力：<script> & 数据 | 表；使用场景：动画；对我的意义：*专属动作*'
        md = summary_markdown(summary)
        self.assertIn('**能力：**&lt;script&gt; &amp; 数据 \\| 表', md)
        self.assertIn('<br>**使用场景：**动画', md)
        self.assertIn('**对我的意义：**\\*专属动作\\*', md)
        page = summary_html(summary)
        self.assertIn('<strong>能力：</strong>&lt;script&gt; &amp;', page)
        self.assertNotIn('<script>', page)
        self.assertEqual(summary_markdown('普通摘要；场景不是标题'), '普通摘要；场景不是标题')
        self.assertIn('\n\n**场景：**动画', summary_markdown('能力：数据；场景：动画', '\n\n'))

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
