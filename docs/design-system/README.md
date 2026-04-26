# 디자인 시스템

이 폴더는 Memolie의 디자인 시스템 단일 소스 오브 트루스다.
향후 UI 변경, 신규 화면 추가, 공용 컴포넌트 확장은 이 문서를 기준으로 진행한다.

## 빠른 시작
1. 브랜드 톤과 화면 역할이 궁금하면 `02-themes.md`와 `04-patterns.md`를 먼저 읽는다.
2. 색상, 글자, 간격 같은 기본 토큰이 필요하면 `01-tokens.md`를 본다.
3. 공용 UI를 재사용하거나 확장하려면 `03-components.md`를 본다.
4. 카피 톤이나 상태 문구를 만질 때는 `05-content-style.md`를 본다.
5. 하드코딩이나 일관성 이슈를 정리하려면 `06-audit.md`를 본다.

## 문서 맵
- [01-tokens.md](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/docs/design-system/01-tokens.md)
  현재 Tailwind 토큰, CSS 변수, 타이포, spacing, motion 기준
- [02-themes.md](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/docs/design-system/02-themes.md)
  브랜드 방향, 현재 기본 테마, 화면별 예외 규칙, 새 토큰 추가 절차
- [03-components.md](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/docs/design-system/03-components.md)
  `src/components/ui/*` 카탈로그와 재사용 원칙
- [04-patterns.md](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/docs/design-system/04-patterns.md)
  홈, 에디터, 채팅, 보관함, 공유 화면의 캐노니컬 패턴
- [05-content-style.md](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/docs/design-system/05-content-style.md)
  문구 톤, 버튼 라벨, 저장/오류/빈 상태 카피 규칙
- [06-audit.md](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/docs/design-system/06-audit.md)
  현재 코드베이스의 일관성 감사와 후속 리팩터링 후보

## 적용 범위
- `src/app/*`
- `src/components/ui/*`
- `src/features/*`
- `src/app/globals.css`
- `tailwind.config.ts`

## 새 UI 체크리스트
- 화면 역할이 홈/에디터/보관함/공유 중 어디에 가까운지 먼저 정했는가
- 기존 토큰과 공용 컴포넌트로 표현 가능한가
- 저장, 로딩, 오류, empty 상태가 기존 톤과 어긋나지 않는가
- 감성을 이유로 조작 명확성을 희생하지 않았는가
- 재사용 가능한 규칙이 생겼다면 문서에 반영했는가

## 소스 기준
- 구현 기준: [tailwind.config.ts](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/tailwind.config.ts), [src/app/globals.css](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/app/globals.css)
- 배경 문서: `docs/design/*`

## 유지 원칙
- 문서는 현재 코드 상태를 기록한다.
- 아직 구현되지 않은 미래 규칙은 TODO로만 적고 현재 기준처럼 쓰지 않는다.
- 코드와 문서가 어긋나면 코드 변경 또는 문서 수정 중 하나를 같은 작업에서 해결한다.
