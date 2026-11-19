# AI EYEWEAR — 리소스 파일 경로 (정확히 이 이름으로 저장)

프로젝트 폴더 루트를 기준으로 아래 **111개 파일**을 배치하세요.
이미지와 HERO 시퀀스: .webp (제품 이미지 투명 배경 가능) | 나머지 영상: .mp4 (H.264)


## HERO — 스크롤 이미지 시퀀스 (90장)
- 저장 폴더: `public/assets/hero/frames/`
- `public/assets/hero/frames/frame_0001.webp`
- `public/assets/hero/frames/frame_0002.webp`
- `...`
- `public/assets/hero/frames/frame_0090.webp`
- **연속 번호 0001~0090 전부 필수.** 추출 기준: 1600×900, 15fps, WebP 품질 80 (6초 기준 90장)
- 첫 프레임에서 시작하여 **아래로 스크롤할수록 다음 프레임**, 위로 스크롤하면 이전 프레임으로 되감기
- 스크롤을 멈추면 프레임도 멈춤. 자동 재생·루프 없음. 첫 프레임이 초기 화면으로 표시됨.

## REINTERPRET
- `public/assets/reinterpret/reinterpret_original.webp`
- `public/assets/reinterpret/reinterpret_ai.mp4`
- `public/assets/reinterpret/reinterpret_ai_poster.webp`
- `reinterpret_original.webp`: 드래그하지 않을 때 보이는 일반 코트 원본 정지 이미지
- `reinterpret_ai.mp4`: 드래그 중 마스크 안에서만 보이는 물속 재해석 영상
- `reinterpret_ai_poster.webp`: `reinterpret_ai.mp4` 로딩용 포스터 이미지

## REFRAME
- `public/assets/reframe/reframe_00_distract.webp`
- `public/assets/reframe/reframe_01_left_removed.webp`
- `public/assets/reframe/reframe_02_sides_removed.webp`
- `public/assets/reframe/reframe_03_focus_sunlit.webp`

## REMEMBER
- `public/assets/remember/memory_01.webp`
- `public/assets/remember/memory_02.webp`
- `public/assets/remember/memory_03.webp`
- `public/assets/remember/memory_04.webp`
- `public/assets/remember/memory_05.webp`
- `public/assets/remember/memory_06.webp`
- `public/assets/remember/memory_07.webp`
- `public/assets/remember/memory_08.webp`
- `public/assets/remember/memory_09.webp`
- `public/assets/remember/memory_10.webp`
- `public/assets/remember/memory_11.webp`
- `public/assets/remember/memory_12.webp`
- `public/assets/remember/memory_09_loop.mp4`

## PRODUCT
- `public/assets/product/ai_glasses_product.webp`

총: **MP4 2개 + WebP 109개 = 111개** (HERO 시퀀스 90장, 나머지 WebP 19장)