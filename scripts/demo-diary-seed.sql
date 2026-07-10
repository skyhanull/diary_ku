-- =============================================================
-- 데모 일기 시드 (Memolie)
-- 범위: 2026-04-01 ~ 2026-07-10 (약 2.5개월, 자연스러운 빈 날 포함 54개)
-- 감정/태그/제목/본문 길이를 다양하게 섞었다.
--
-- [실행 방법]
--   1) Supabase 대시보드 > SQL Editor 열기
--   2) 아래 :seed_email 값을 "본인 로그인 이메일"로 바꾼다 (딱 한 줄)
--   3) 전체 붙여넣고 Run
--
-- 안전장치:
--   - 이메일로 user_id를 자동 조회한다 (없으면 에러).
--   - 같은 날짜가 이미 있으면 덮어쓴다(on conflict do update) → 여러 번 실행해도 안전.
--   - 마지막에 created_at/updated_at을 작성일 저녁으로 맞춰 타임라인을 자연스럽게 만든다.
-- =============================================================

do $$
declare
  seed_email text := 'yoon@anti-agingclub.kr';  -- ★ 여기만 본인 이메일로 바꾸세요
  target_user uuid;
begin
  select id into target_user from auth.users where email = seed_email;
  if target_user is null then
    raise exception '이메일(%)에 해당하는 사용자를 찾을 수 없어요. seed_email을 확인하세요.', seed_email;
  end if;

  insert into public.diary_entries
    (user_id, entry_date, title, body_html, mood, tags, view_mode, status)
  values
    -- ===== 4월 (봄) =====
    (target_user, date '2026-04-01', '화창한 시작', '<p>새 분기의 첫날. 벚꽃이 피기 시작했다. 점심에 잠깐 걸었는데 바람이 아직 조금 차가웠다.</p>', '🙂', array['일상','기록'], 'single', 'saved'),
    (target_user, date '2026-04-03', '러닝 다시 시작', '<p>오랜만에 3km를 뛰었다. 숨은 찼지만 끝나고 나니 머리가 맑아졌다.</p><p>무리하지 말고 꾸준히 해보자.</p>', '😄', array['운동','건강'], 'single', 'saved'),
    (target_user, date '2026-04-05', '주말 카페', '<p>동네에 새로 생긴 카페에 갔다. 창가 자리에서 책을 두 챕터나 읽었다. 라떼가 생각보다 진했다.</p>', '🙂', array['일상','취미'], 'single', 'saved'),
    (target_user, date '2026-04-06', '조금 지친 하루', '<p>특별한 일은 없었는데 이상하게 기운이 없었다. 오늘은 일찍 자야겠다.</p>', '😐', array['감정','회고'], 'single', 'saved'),
    (target_user, date '2026-04-08', '프로젝트 아이디어', '<p>다이어리 앱에 편지 공유 기능을 넣으면 어떨까 생각했다.</p><p>그 순간의 상태를 스냅샷으로 발행하는 구조가 재밌을 것 같다. 원본을 나중에 고쳐도 보낸 편지는 그대로 남게.</p>', '😄', array['개발','기록'], 'single', 'saved'),
    (target_user, date '2026-04-10', '비 오는 날', '<p>하루 종일 비가 왔다. 창밖을 보며 멍하니 있었다. 이런 날은 마음도 축축해진다.</p>', '🙁', array['날씨','감정'], 'single', 'saved'),
    (target_user, date '2026-04-12', '가족 저녁', '<p>부모님과 오랜만에 외식을 했다. 엄마가 좋아하는 파스타집. 웃음이 많은 저녁이었다.</p>', '😄', array['관계','감사'], 'single', 'saved'),
    (target_user, date '2026-04-14', '집중이 안 되는 날', '<p>코드를 붙잡고 있었는데 진도가 안 나갔다. 억지로 붙잡지 말고 내일 다시 보기로 했다.</p>', '😐', array['일','회고'], 'single', 'saved'),
    (target_user, date '2026-04-16', '산책과 정리', '<p>저녁에 한강까지 걸었다. 걷다 보니 생각도 정리됐다. 돌아와서 방도 치웠다.</p>', '🙂', array['일상','건강'], 'single', 'saved'),
    (target_user, date '2026-04-18', '친구와 통화', '<p>멀리 사는 친구와 한 시간 넘게 통화했다. 사는 얘기, 별거 아닌 얘기. 그래도 마음이 든든해진다.</p>', '🙂', array['관계'], 'single', 'saved'),
    (target_user, date '2026-04-20', '요가 첫 수업', '<p>처음으로 요가 클래스에 갔다. 생각보다 힘들었지만 끝나고 몸이 개운했다.</p>', '😄', array['운동','건강'], 'single', 'saved'),
    (target_user, date '2026-04-22', '마감 압박', '<p>일이 몰려서 정신없었다. 저녁도 대충 때웠다. 이런 날이 반복되면 안 될 텐데.</p>', '🙁', array['일','감정'], 'single', 'saved'),
    (target_user, date '2026-04-24', '작은 성취', '<p>오래 막혔던 버그를 드디어 잡았다. 자동저장이 겹칠 때 생기는 문제였다. 원인을 찾으니 후련하다.</p>', '😄', array['개발','기록'], 'single', 'saved'),
    (target_user, date '2026-04-26', '흐린 주말', '<p>날이 흐려서 하루 종일 집에 있었다. 영화 두 편을 봤다. 나쁘지 않은 게으름.</p>', '😐', array['일상','날씨'], 'single', 'saved'),
    (target_user, date '2026-04-28', '봄이 짙어진다', '<p>벚꽃은 다 졌지만 이제 초록이 짙어진다. 계절이 바뀌는 게 눈에 보인다.</p>', '🙂', array['날씨','일상'], 'single', 'saved'),
    (target_user, date '2026-04-30', '4월의 마지막', '<p>한 달을 돌아보니 크진 않아도 꾸준히 뭔가를 해온 것 같다. 스스로를 조금 칭찬해주기로.</p>', '🙂', array['회고','감사'], 'single', 'saved'),

    -- ===== 5월 =====
    (target_user, date '2026-05-02', '연휴의 시작', '<p>짧은 여행을 떠났다. 바다를 봤다. 파도 소리를 오래 들었다.</p>', '😄', array['일상','여행'], 'single', 'saved'),
    (target_user, date '2026-05-04', '여행 둘째 날', '<p>아침 일찍 일어나 해변을 걸었다. 조개를 주웠다. 사소한 게 다 즐거웠다.</p>', '😄', array['여행','감사'], 'single', 'saved'),
    (target_user, date '2026-05-06', '일상 복귀', '<p>여행의 여운이 남았지만 다시 일상으로. 밀린 메일을 정리했다.</p>', '😐', array['일상','회고'], 'single', 'saved'),
    (target_user, date '2026-05-08', '운동 루틴', '<p>러닝 5km 달성. 확실히 처음보다 덜 힘들다. 몸이 적응하고 있다.</p>', '🙂', array['운동','건강'], 'single', 'saved'),
    (target_user, date '2026-05-10', '독서 모임', '<p>처음으로 독서 모임에 나갔다. 낯설었지만 사람들의 생각을 듣는 게 좋았다.</p>', '😄', array['독서','관계'], 'single', 'saved'),
    (target_user, date '2026-05-12', '무기력한 오후', '<p>이유 없이 가라앉는 날. 그냥 그런 날도 있다고 받아들이기로 했다.</p>', '🙁', array['감정'], 'single', 'saved'),
    (target_user, date '2026-05-14', '새 기능 구상', '<p>시맨틱 검색을 붙이면 어떨까. 이미 임베딩이 있으니 재활용할 수 있을 것 같다.</p><p>키워드로 못 찾던 기록을 뜻으로 찾게 되면 좋겠다.</p>', '😄', array['개발','기록'], 'single', 'saved'),
    (target_user, date '2026-05-16', '비 그친 뒤', '<p>비가 그치고 공기가 맑았다. 저녁 노을이 예뻤다. 사진을 몇 장 찍었다.</p>', '🙂', array['날씨','일상'], 'single', 'saved'),
    (target_user, date '2026-05-18', '컨디션 난조', '<p>잠을 설쳐서 하루 종일 멍했다. 카페인으로 버텼다. 오늘은 일찍 자자.</p>', '😐', array['건강'], 'single', 'saved'),
    (target_user, date '2026-05-20', '요리 도전', '<p>처음으로 파스타를 직접 만들었다. 생각보다 먹을 만했다. 뿌듯.</p>', '😄', array['요리','취미'], 'single', 'saved'),
    (target_user, date '2026-05-22', '오랜 친구', '<p>10년 된 친구를 만났다. 오래 안 봐도 어색하지 않은 사이가 있다는 게 감사하다.</p>', '🙂', array['관계','감사'], 'single', 'saved'),
    (target_user, date '2026-05-24', '정체된 기분', '<p>요즘 제자리걸음 같다. 조급해하지 말자고 스스로 다독였다.</p>', '🙁', array['감정','회고'], 'single', 'saved'),
    (target_user, date '2026-05-26', '작은 변화', '<p>아침 루틴을 바꿨다. 일어나서 물 한 잔, 스트레칭. 별거 아닌데 하루가 다르다.</p>', '🙂', array['일상'], 'single', 'saved'),
    (target_user, date '2026-05-28', '개발 몰입', '<p>오랜만에 시간 가는 줄 모르고 코딩했다. 이런 몰입의 순간이 좋다.</p>', '😄', array['개발','일'], 'single', 'saved'),
    (target_user, date '2026-05-30', '초여름 저녁', '<p>반팔을 입어도 될 만큼 따뜻해졌다. 저녁 산책이 즐거운 계절.</p>', '🙂', array['날씨','산책'], 'single', 'saved'),
    (target_user, date '2026-05-31', '5월 회고', '<p>여행도 가고 새 사람도 만나고. 꽤 풍성한 달이었다.</p>', '🙂', array['회고','감사'], 'single', 'saved'),

    -- ===== 6월 (장마·초여름) =====
    (target_user, date '2026-06-01', '유월의 시작', '<p>벌써 유월. 시간이 참 빠르다. 올해 남은 절반은 조금 더 나답게 보내고 싶다.</p>', '🙂', array['일상','기록'], 'single', 'saved'),
    (target_user, date '2026-06-03', '장마 예고', '<p>곧 장마가 시작된다고 한다. 눅눅한 계절이 다가온다.</p>', '😐', array['날씨'], 'single', 'saved'),
    (target_user, date '2026-06-05', '러닝 정체', '<p>기록이 늘지 않는다. 그래도 멈추지 않는 게 중요하다고 믿는다.</p>', '😐', array['운동','건강'], 'single', 'saved'),
    (target_user, date '2026-06-07', '카페 작업', '<p>카페에서 하루 종일 작업했다. 환경을 바꾸니 집중이 잘 됐다.</p>', '😄', array['개발','일'], 'single', 'saved'),
    (target_user, date '2026-06-09', '지친 하루', '<p>회의가 많아서 진이 빠졌다. 정작 내 일은 저녁에야 시작했다.</p>', '🙁', array['감정','일'], 'single', 'saved'),
    (target_user, date '2026-06-11', '비 오는 아침', '<p>장마가 시작됐다. 빗소리를 들으며 커피를 마셨다. 나쁘지 않다.</p>', '😐', array['날씨','감정'], 'single', 'saved'),
    (target_user, date '2026-06-13', '오랜만의 영화관', '<p>혼자 영화를 봤다. 팝콘도 샀다. 혼자만의 시간이 필요했다.</p>', '😄', array['취미','일상'], 'single', 'saved'),
    (target_user, date '2026-06-15', '건강 검진', '<p>검진을 받았다. 큰 문제는 없다고. 그래도 운동은 더 해야겠다.</p>', '😐', array['건강','기록'], 'single', 'saved'),
    (target_user, date '2026-06-17', '몰입과 성취', '<p>편지 공유 기능을 거의 완성했다. 봉투 열리는 애니메이션이 마음에 든다.</p><p>수신자가 편지를 펼치는 순간이 특별하게 느껴지면 좋겠다.</p>', '😄', array['개발','감사'], 'single', 'saved'),
    (target_user, date '2026-06-19', '습한 날', '<p>습도가 높아서 하루 종일 찝찝했다. 기분도 덩달아 가라앉았다.</p>', '🙁', array['날씨','감정'], 'single', 'saved'),
    (target_user, date '2026-06-21', '가장 긴 낮', '<p>오늘이 낮이 가장 긴 날이라고. 저녁 여덟 시인데도 환했다.</p>', '🙂', array['일상','기록'], 'single', 'saved'),
    (target_user, date '2026-06-23', '친구 생일', '<p>친구 생일 파티에 다녀왔다. 오랜만에 많이 웃었다.</p>', '😄', array['관계','감사'], 'single', 'saved'),
    (target_user, date '2026-06-25', '슬럼프', '<p>뭘 해도 손에 안 잡히는 날. 무리하지 않기로 했다.</p>', '🙁', array['감정','회고'], 'single', 'saved'),
    (target_user, date '2026-06-27', '정리하는 주말', '<p>옷장을 정리했다. 안 입는 옷을 정리하니 마음도 가벼워졌다.</p>', '🙂', array['일상'], 'single', 'saved'),
    (target_user, date '2026-06-29', '책 완독', '<p>미뤄뒀던 책을 드디어 다 읽었다. 마지막 장을 덮을 때의 뿌듯함.</p>', '😄', array['독서','기록'], 'single', 'saved'),
    (target_user, date '2026-06-30', '상반기 마무리', '<p>벌써 한 해의 절반. 생각보다 많은 걸 해냈다.</p>', '🙂', array['회고','감사'], 'single', 'saved'),

    -- ===== 7월 (한여름) =====
    (target_user, date '2026-07-02', '무더위 시작', '<p>본격적인 더위. 에어컨 없이는 힘든 계절이 왔다.</p>', '😐', array['날씨','건강'], 'single', 'saved'),
    (target_user, date '2026-07-04', '새벽 코딩', '<p>아이디어가 떠올라 새벽까지 작업했다. 위험한 습관이지만 즐거웠다.</p>', '😄', array['개발','일'], 'single', 'saved'),
    (target_user, date '2026-07-06', '소나기', '<p>갑자기 쏟아진 소나기. 처마 밑에서 잠깐 비를 피했다. 어릴 때 생각이 났다.</p>', '🙂', array['날씨','일상'], 'single', 'saved'),
    (target_user, date '2026-07-08', '회고와 계획', '<p>포트폴리오를 점검했다. 앞으로 추가할 기능들을 정리해뒀다.</p><p>시맨틱 검색과 실시간 협업. 하나씩 해보자.</p>', '🙂', array['회고','개발'], 'single', 'saved'),
    (target_user, date '2026-07-09', '나른한 오후', '<p>더위에 늘어지는 하루. 그래도 할 일은 조금씩 해나갔다.</p>', '😐', array['일상','감정'], 'single', 'saved'),
    (target_user, date '2026-07-10', '오늘의 기록', '<p>꾸준히 기록하는 습관이 자리를 잡아간다. 이 작은 루틴이 마음에 든다.</p>', '🙂', array['일상','기록'], 'single', 'saved')
  on conflict (user_id, entry_date) do update
    set title     = excluded.title,
        body_html = excluded.body_html,
        mood      = excluded.mood,
        tags      = excluded.tags,
        view_mode = excluded.view_mode,
        status    = excluded.status,
        updated_at = now();

  -- 타임라인 자연스럽게: 시드 범위의 작성 시각을 그날 저녁 9시로 맞춘다.
  update public.diary_entries
     set created_at = (entry_date + interval '21 hours'),
         updated_at = (entry_date + interval '21 hours')
   where user_id = target_user
     and entry_date between date '2026-04-01' and date '2026-07-10';

  raise notice '데모 일기 시드 완료: % 개', (
    select count(*) from public.diary_entries
     where user_id = target_user
       and entry_date between date '2026-04-01' and date '2026-07-10'
  );
end $$;
