# 🖼️ 이미지 편집 스튜디오 | Image Toolkit

> 비율 변환·자르기·격자 분할·배경 제거 이미지 스튜디오  
> Image editing studio: crop, split, ratio convert, background removal

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://metasongi.github.io/image-toolkit/) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square)

🌐 **Live:** https://metasongi.github.io/image-toolkit/

---

자주 쓰는 이미지 편집 기능을 브라우저에서 바로 — 서버 전송 없음.


## 기능

### 📐 비율 변환
- 목표 비율: 1:1 · 4:3 · 3:2 · 16:9 · 9:16 · 21:9 · 직접입력
- 출력 너비 px 지정 (높이 자동 계산)
- 빈 공간 채우기 4종: 단색 / 블러 배경 / 거울 반사 / 꽉 채우기(잘라내기)
- 저장 형식: PNG / JPG / WebP + 품질 조절

### ✂️ 자르기
- 자유 자르기: 드래그 선택, 픽셀 단위 좌표 표시
- 격자 분할: N×M 타일로 나눠 일괄 다운로드 (인스타 캐러셀용)
- 모양 자르기: 원형 / 둥근사각형 / 마름모 → 투명 PNG

### 🧽 배경 제거
- 크로마키: 이미지에서 색 직접 선택 + 허용 오차 조절
- 코너 배경 제거: 가장자리부터 플러드필로 배경 삭제

## 기술

- Vanilla JS + Canvas 2D
- 100% 클라이언트 사이드

---

## English Summary

Image editing studio: crop, split, ratio convert, background removal.
