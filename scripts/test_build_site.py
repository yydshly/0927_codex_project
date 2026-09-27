"""Published navigation must preserve source attribution and subpath URLs."""
import unittest
from build_site import render_home


class SiteTests(unittest.TestCase):
    def test_source_and_product_links_remain_distinct(self):
        project = dict(id=3, slug='lofi-cities', name='Lofi Cities',
                       summary='能力与效果 <说明>', source='https://loficities.com/istanbul/',
                       source_name='Lofi Cities · Istanbul', cover_alt='实际网页')
        page = render_home([project], 'yydshly/0927_codex_project')
        self.assertIn('href="https://loficities.com/istanbul/"', page)
        self.assertIn('href="./003-lofi-cities/#space"', page)
        self.assertIn('href="./003-lofi-cities/#understanding"', page)
        self.assertIn('src="./covers/003-lofi-cities.png"', page)
        self.assertIn('能力与效果 &lt;说明&gt;', page)
        self.assertNotIn('127.0.0.1', page)


if __name__ == '__main__':
    unittest.main()
