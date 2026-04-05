# CLAUDE.md

## Lib Context
이 문서는 `src/lib/*` 작업 시 적용되는 추가 규칙이다.
루트 [CLAUDE.md](/Users/an-yungyeong/Downloads/회사%20폴더/diary_ku/CLAUDE.md)와 함께 읽는다.

## Read Before Editing
1. [Lib Context Guide](../../docs/claude/08-lib-context.md)
2. [Architecture And Boundaries](../../docs/claude/04-architecture-and-boundaries.md)

## Local Rules
- `src/lib/*`는 공용 유틸과 서비스 경계만 둔다.
- feature 전용 orchestration 로직은 넣지 않는다.
- 환경변수 의존 로직은 명시적으로 유지한다.
- nullability와 설정 여부를 숨기지 않는다.
