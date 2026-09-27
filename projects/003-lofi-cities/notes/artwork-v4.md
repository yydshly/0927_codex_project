# 动态图层素材记录

使用内置 ImageGen。车厢素材以 v3 列车原画为编辑目标，仅移除窗外区域并保留真实透明度；窗外全景独立生成。项目使用两幅图片实时合成，窗外与车厢分别运动。原始生成结果保留在生成目录。

## train-frame

保存路径：`../web/assets/scenes/train-frame-v4.png`

```
Use case: background-extraction. Edit target is the attached train compartment illustration. Preserve the entire illustrated interior, all chairs, curtains, luggage, lamp, wooden window frame, table, teacups, vase, ALL flowers and stems, and the exact original composition and 16:9 dimensions. Remove ONLY the outdoor view visible inside the large train window: remove sky, moon, mountains, city, water and bridge, making these outdoor-view pixels truly transparent (alpha=0). The opaque window trim must remain intact. Preserve every part of the flower bouquet that overlaps the window as opaque detailed foreground, with precise cutout edges. The interior must remain completely opaque. This is a foreground overlay to place on top of an independently scrolling landscape in an app. Do not redraw or change the interior. No checkerboard painted into the pixels, no flat color in place of transparency, no text.
```

## train-landscape

保存路径：`../web/assets/scenes/train-landscape-v4.png`

```
Use case: stylized-concept. A single very wide 3:1 panoramic night landscape for the scrolling view outside a cozy train window, 2400x800 or similar. Premium highly detailed fine pixel-art / dithered illustration matching a rich atmospheric indie game. Wide blue-violet night sky in upper 42%, layered dark blue mountain ridges across middle distance, a long tranquil river and varied small glowing waterfront towns across lower 50%, golden lights reflected in blue water, scattered cypress silhouettes at bottom edge. No interior, no window, no frame, no foreground objects, no characters, no text, no moon. Balanced quiet blue scene with finely detailed warm windows, atmospheric perspective. The entire landscape needs continuous interest across its whole width, horizon at constant elevation, both left and right edges dark and similar to facilitate slow horizontal looping. This will be animated behind a stationary train compartment foreground.
```
