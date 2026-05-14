# js-billiards-3d

three.js + cannon-es 기반의 웹 3D 8볼 당구 게임.

## 실행

빌드 도구 없이 정적 서버로 `src/` 디렉토리만 서빙하면 됩니다.

```bash
# 어느 정적 서버든 가능 (예: python)
cd src && python3 -m http.server 8080
# → http://localhost:8080
```

`file://` 직접 열기는 ESM 모듈 CORS 제약으로 동작하지 않으므로 로컬 서버를 사용하세요.

## 문서

- [전체 계획](doc/PLAN.md)
- [단계별 작업 기록](doc/stages/)

## 기술 스택

- **렌더링**: three.js (ESM, CDN 로드)
- **물리**: cannon-es
- **모듈**: 브라우저 네이티브 ESM + `<script type="importmap">`
- **빌드**: 없음 (그대로 배포 가능)
