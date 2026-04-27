# 일관성 감사

이 문서는 현재 코드베이스의 디자인 시스템 관점 정리 후보를 기록한다.
문서 작업 시점 기준으로 보이는 우선순위만 담는다.

## 요약
현재 디자인 방향과 토큰 체계는 꽤 명확하다.
다만 일부 화면은 빠르게 구현되며 하드코딩 색상과 그림자 값이 섞였고, 공용 토큰으로 흡수할지 화면 예외로 남길지 판단이 필요한 상태다.

## 우선순위 높은 후보

### 1. Shadow 토큰 부재
다음 영역에 shadow 값이 직접 박혀 있다.
- [src/components/ui/button.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/components/ui/button.tsx:12)
- [src/components/ui/card.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/components/ui/card.tsx:9)
- [src/features/home/components/MonthlyCalendar.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/home/components/MonthlyCalendar.tsx:111)
- [src/features/archive/components/ArchiveDashboard.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/archive/components/ArchiveDashboard.tsx:76)

영향:
- 화면마다 비슷한 그림자를 조금씩 다르게 사용한다
- 카드, 버튼, 모달 깊이 체계가 문서화되어 있지 않다

### 2. Overlay 색상과 blur 값 중복
다음 영역은 overlay 배경을 각자 정의한다.
- [src/features/editor/components/EditorShareModal.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/editor/components/EditorShareModal.tsx:46)
- [src/features/editor/components/EditorTutorialOverlay.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/editor/components/EditorTutorialOverlay.tsx:15)
- [src/components/ui/surface-card.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/components/ui/surface-card.tsx:14)

영향:
- overlay 명도와 무게감이 화면마다 다르다
- blur 값도 문서화된 기준이 없다

### 3. White / hex 하드코딩 잔존
다음 영역은 white 계열과 헥스 색상을 직접 사용한다.
- [src/components/ui/surface-card.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/components/ui/surface-card.tsx:12)
- [src/components/ui/notice-box.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/components/ui/notice-box.tsx:14)
- [src/app/auth/page.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/app/auth/page.tsx:26)
- [src/features/share/components/SharedLetterScreen.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/share/components/SharedLetterScreen.tsx:19)

영향:
- 공용 UI와 화면 예외의 경계가 흐려진다
- share/auth 화면은 토큰 기준보다 개별 아트 디렉션이 더 강하다

## 중간 우선순위 후보

### 4. 에디터 전용 색상 팔레트 분산
- [src/features/editor/components/EditorSidePanel.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/editor/components/EditorSidePanel.tsx:20)
- [src/features/editor/components/EditorScreen.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/editor/components/EditorScreen.tsx:128)
- [src/features/editor/hooks/useEditorState.ts](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/editor/hooks/useEditorState.ts:7)

영향:
- 텍스트 기본색, 배경색, 스티커 배경이 시스템화되지 않았다
- 에디터 테마 확장 시 조정 포인트가 많아진다

### 5. Focus 표현 이중화
- global semantic ring: [src/app/globals.css](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/app/globals.css:7)
- editor selection focus: [src/features/editor/components/EditorCanvasSingle.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/editor/components/EditorCanvasSingle.tsx:643)

영향:
- 폼 포커스와 캔버스 선택 포커스가 다른 시스템처럼 보일 수 있다

## 낮은 우선순위 후보

### 6. 공유 편지 화면의 장식 예외
share 화면은 현재 의도적으로 예외가 많다.
이는 당장 제거 대상보다는 "테마화할 것인지, 예외로 유지할 것인지"를 먼저 결정해야 하는 영역이다.

## 리팩터링 원칙
- 모든 하드코딩을 없애는 것이 목표는 아니다.
- 두 화면 이상에서 반복되는 값부터 토큰화한다.
- share 화면 같은 장식 예외는 무리하게 공용 primitive로 끌어올리지 않는다.
- 논리 변경과 시각 리팩터링은 가능하면 분리한다.

## 추천 후속 순서
1. shadow scale 정의
2. overlay 표면 토큰 또는 유틸 패턴 정의
3. auth/editor/share 중 공용화 가능한 색상만 선별
4. 에디터 전용 팔레트 시스템화 여부 결정
