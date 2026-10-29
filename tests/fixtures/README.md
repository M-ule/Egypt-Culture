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
