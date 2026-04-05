# CLAUDE.md

## App Context
이 문서는 `src/app/*` 작업 시 적용되는 추가 규칙이다.
루트 [CLAUDE.md](/Users/an-yungyeong/Downloads/회사%20폴더/diary_ku/CLAUDE.md)와 함께 읽는다.

## Read Before Editing
1. [App Context Guide](../../docs/claude/06-app-context.md)
2. [Architecture And Boundaries](../../docs/claude/04-architecture-and-boundaries.md)

## Local Rules
- `src/app/*`는 라우트 진입과 조합에 집중한다.
- 페이지 파일에 무거운 기능 로직을 쌓지 않는다.
- feature로 내릴 수 있는 UI/상태는 `src/features/*`로 분리한다.
- 글로벌 스타일 변경은 `globals.css` 영향 범위를 생각하고 진행한다.
