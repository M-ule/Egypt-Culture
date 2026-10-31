# Egypt recognition fixtures

Local user-provided screenshots, 2026-10-30. Original images are excluded from Git.
Place `egypt-buildings.jpeg` and `egypt-stocks.jpeg` here to run photo tests;
these tests skip when the images are unavailable. Only fully visible cards are labeled.

| Building | Level | Count |
| --- | --- | --- |
| 소형 우물 | 2 | 3 |
| 수로 | 2 | 4 |
| 수로 | 3 | 1 |
| 시청 | 2 | 1 |
| 파피루스 압축장 | 3 | 1 |
| 금세공인 | 3 | 1 |
| 소형 집 | 3 | 30 |

Inventory: 데벤 15,180; 파피루스 94,124; 금 40,932;
파피루스 두루마리 405; 앙크 322; 예복 0; 황금 가면 0.

`photo-patterns.js` contains sampled name masks, digit masks and resource icon colors.
It does not contain the expected inventory or building counts. Recognition reads
number glyphs from each uploaded image; the changed-digit regression test checks this.

Generate samples from the parent workspace with:

    python Egypt-Culture/tools/build-photo-patterns.py
    node Egypt-Culture/tools/augment-photo-patterns.cjs

Tests require `@napi-rs/canvas` (available in the Codex runtime):

    node --test Egypt-Culture/tests/*.cjs

The visual baseline covers these screens and resampling variants. Unmatched names
use browser OCR. Recognition is a review step; values are applied only after selection.

## 2026-10-31 regression photos

The current local photos are `egypt-current-buildings.jpeg` and
`egypt-current-stocks.jpeg`. They remain excluded from Git. Run
`node tools/extend-current-patterns.cjs` from the repository root to append
individual name/digit samples, including resized variants, without replacing
older samples. This generator does not store complete card values.

Expected visible cards: 파피루스 들판 Lv4 ×4, 금광 Lv4 ×3, 물 펌프 Lv2 ×4,
수로 Lv4 ×8, 시청 Lv2 ×1, 파피루스 압축장 Lv4 ×2, 금세공인 Lv4 ×2,
소형 집 Lv4 ×30. Stocks: 데벤 143.2K, 파피루스 209.7K, 금 75,613,
두루마리 344, 앙크 178, 예복 0, 황금 가면 0.

Current regression tests check all 23 fields through selection and state
application, changed badge glyphs, moved cards, and resampling. Resampled text
may still require confirmation or supplemental OCR; it must never silently
substitute a wrong value.
