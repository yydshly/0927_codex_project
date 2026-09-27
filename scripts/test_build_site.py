"""Published navigation must preserve source attribution and subpath URLs."""
import unittest
from build_site import render_home, project_links


class SiteTests(unittest.TestCase):
    def test_source_and_product_links_remain_distinct(self):
        project = dict(id=3, slug='lofi-cities', name='Lofi Cities',
                       summary='能力与效果 <说明>', source='https://loficities.com/istanbul/',
                       source_name='Lofi Cities · Istanbul', cover_alt='实际网页')
        page = render_home([project], 'yydshly/0927_codex_project',
                           {'003-lofi-cities': {'entry': '#space', 'guide': '#understanding'}})
        self.assertIn('href="https://loficities.com/istanbul/"', page)
        self.assertIn('参考来源：Lofi Cities · Istanbul ↗', page)
        self.assertIn('href="./003-lofi-cities/#space"', page)
        self.assertIn('href="./003-lofi-cities/#understanding"', page)
        self.assertIn('src="./covers/003-lofi-cities.png"', page)
        self.assertIn('能力与效果 &lt;说明&gt;', page)
        self.assertNotIn('127.0.0.1', page)

    def test_freemocap_has_its_own_routes_full_guide_and_bold_summary(self):
        project = dict(id=2, slug='freemocap-lab', name='FreeMoCap 动作实验室',
                       summary='能力：三维动作；呈现效果：骨架；使用场景：动画；可扩展方向：重定向；对我的意义：小云',
                       source='https://github.com/freemocap/freemocap', source_name='FreeMoCap', cover_alt='完整能力图')
        page = render_home([project], 'yydshly/0927_codex_project',
                           {'002-freemocap-lab': {'entry': '#capabilities', 'guide': '#capabilities'}})
        self.assertIn('href="./002-freemocap-lab/#capabilities"', page)
        self.assertNotIn('#space', page)
        self.assertIn('参考来源：FreeMoCap ↗', page)
        for label in ('能力', '呈现效果', '使用场景', '可扩展方向', '对我的意义'):
            self.assertIn(f'<strong>{label}：</strong>', page)
        self.assertIn('<details class="guide" open>', page)
        self.assertIn('height:auto', page)
        self.assertNotIn('object-fit:cover', page)

    def test_svg_guide_keeps_its_file_extension(self):
        project = dict(id=6, slug='threejs-gpu-rasterizer', name='Three.js 能力与 GPU 渲染研究',
                       summary='能力：三维展示；技术原理：GPU 筛选',
                       source='https://github.com/mrdoob/three.js',
                       cover='assets/understanding-map.svg', cover_alt='三维理解总图')
        page = render_home([project], 'yydshly/0927_codex_project')
        self.assertIn('src="./covers/006-threejs-gpu-rasterizer.svg"', page)
        self.assertIn('<strong>技术原理：</strong>GPU 筛选', page)

    def test_navigation_cannot_escape_project(self):
        for route in ('https://example.com', '/other', 'javascript:alert(1)', '#bad"quote'):
            with self.assertRaises(ValueError):
                project_links('002-freemocap-lab', {'002-freemocap-lab': {'entry': route}})


if __name__ == '__main__':
    unittest.main()
