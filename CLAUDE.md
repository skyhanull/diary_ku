# CLAUDE.md

## Purpose
이 문서는 이 저장소에서 Claude Code 또는 사람이 작업할 때 따라야 하는 프로젝트 기준 가이드다.
아키텍처, 디자인, 문서화 흐름의 단일 시작점으로 사용한다.

## Read First
1. [README.md](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/README.md)
2. [docs/ARCHITECTURE.md](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/docs/ARCHITECTURE.md)
3. [docs/design-system/README.md](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/docs/design-system/README.md)
4. Area-specific `CLAUDE.md` files under `src/`

## Working Workflow
1. 관련 파일과 기존 패턴을 먼저 읽는다.
2. 이미 있는 타입, 훅, UI 프리미티브를 재사용할 수 있는지 확인한다.
3. 구조 변경이 있으면 코드와 문서를 같이 갱신한다.
4. UI 변경이면 `docs/design-system/` 기준과 실제 화면 역할을 함께 검토한다.

## Absolute Rules
- 저장 경계는 유지한다. 페이지 파일에는 무거운 기능 로직이나 persistence 로직을 쌓지 않는다.
- 공용 UI는 `src/components/ui/*`에 두고, feature 전용 요구사항은 feature 레벨에서 감싼다.
- 색상, 간격, 반경, 타이포는 기존 Tailwind 디자인 토큰을 우선 사용한다.
- 같은 스타일 요구가 반복되면 인라인 클래스 복붙보다 공용 variant 또는 래퍼 컴포넌트를 검토한다.
- 에디터, 홈, 보관함, 공유 화면은 역할이 다르므로 시각 규칙도 동일하게 취급하지 않는다.
- 저장 UX는 조용하지만 명확해야 한다. 로딩, 자동 저장, 오류 상태 문구를 함부로 바꾸지 않는다.
- 논리 변경 없이 대규모 비주얼 리라이트를 섞지 않는다.

## Design System Rules
- 디자인 작업의 기준 문서는 `docs/design-system/`이다.
- 새 UI를 만들기 전에 `01-tokens.md`, `03-components.md`, `04-patterns.md`를 먼저 확인한다.
- 토큰으로 표현 가능한 값은 하드코딩 색상이나 임의 spacing보다 토큰을 우선한다.
- 공용 버튼, 입력, 카드 패턴은 기존 variants를 먼저 검토하고 정말 반복될 때만 확장한다.
- 감성은 유지하되 캘린더와 에디터에서는 조작 명확성을 우선한다.
- 새 패턴을 만들었는데 재사용 가능성이 있으면 문서도 같이 갱신한다.

## Documentation Rules
- 제품/아키텍처 의도는 `docs/`에 둔다.
- 디자인 기준은 `docs/design-system/`에 둔다.
- 기존 `docs/design/` 문서는 초안 또는 배경 설명으로 보고, 현재 기준은 `docs/design-system/`으로 본다.

## Area Notes
- `src/app/*`: 라우트 진입과 조합에 집중한다.
- `src/components/ui/*`: 재사용 가능한 프리미티브만 둔다.
- `src/features/*`: 화면별 상태, 상호작용, 저장 흐름을 소유한다.
- `src/lib/*`: 공용 유틸과 외부 서비스 경계만 둔다.
