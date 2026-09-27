# 实验室截图

所有截图于 2026-09-27 从本地实验室页面直接采集，不是生成图片或上游截图。

- `lab-overview.jpg`：二维 IFFT 波浪 A/B 对照；参考 RMS 为 0.24 m，调整方案为 0.48 m。
- `lab-flow.jpg`：沟渠浅水实验、可切换的观察字段和水量收支。
- `lab-mobile.jpg`：390 × 844 视口下的真实页面布局。

截图记录教学模型的表现，不能代表 coastal-simulation 或 ShoreBreak 原站画质。

## 统一理解总图

- `water-algorithm-map.svg`：2400 × 4521 的可编辑矢量图，包含因果链、十个模块、八个场景配方、四级扩展路径与验证。
- `water-algorithm-map.png`：相同内容的高清位图，使用本机中文字体导出。
- 数据源为 `web/summary-data.json`，生成逻辑为 `web/build_summary.py`，文字版本为 `notes/synthesis.md`。
- 总图为独立整理的原理图，不是仿真截图；参考两库的固定提交，图中明确区分原库能力、教学取舍和扩展建议。
- `summary-desktop.jpg` / `summary-mobile.jpg`：新增汇总页的真实浏览器截图，分别用于确认桌面导览和手机布局。
