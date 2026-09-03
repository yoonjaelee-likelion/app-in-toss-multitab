"use client";

import { useSettings, type Lang } from "./settings";

/**
 * 화면에 나오는 말.
 *
 * ko를 기준으로 삼고 en이 그 모양을 그대로 따라가게 했다 — 한쪽에만 키를
 * 추가하면 타입이 깨져서 빌드가 막힌다. 번역을 빠뜨리고 배포할 수가 없다.
 *
 * 값이 끼어드는 문장은 문자열 조각을 이어 붙이지 않고 함수로 둔다.
 * 어순이 언어마다 다르기 때문이다 — 「3개 AI가 답합니다」와
 * 「3 AIs are answering」은 조각 순서가 아예 다르다.
 */

const ko = {
  brand: "멀티탭",
  beta: "beta",

  /* ── 셸 ── */
  shell: {
    newStart: "새로 시작",
    history: "기록",
    historyEmpty: "아직 없습니다. 무엇이든 한 번 돌리면 여기 쌓이고, 눌러서 그대로 다시 엽니다.",
    noKeyNeeded: "키가 없어도 전부 동작합니다",
    untitled: "제목 없음",
    openMenu: "메뉴 열기",
    closeMenu: "메뉴 닫기",
    collapse: "사이드바 접기",
    expand: "사이드바 펼치기",
    removeSession: "기록 지우기",
    quickJump: "빠른 이동",
    settings: "설정",
    close: "닫기",
  },

  /* ── 설정 ── */
  settings: {
    title: "설정",
    language: "언어",
    theme: "화면",
    light: "밝게",
    dark: "어둡게",
    system: "시스템",
    note: "이 브라우저에만 저장됩니다",
  },

  /* ── 모드 ── */
  modes: {
    inbiz: { label: "인비즈", hint: "AI 법인이 사업을 진단합니다", newLabel: "새 진단" },
    judge: { label: "판정", hint: "여러 AI가 답하고 서로 반박합니다", newLabel: "새 대화" },
    redteam: { label: "레드팀", hint: "심사역 AI가 약점만 찾습니다", newLabel: "새 공격" },
    court: { label: "법원", hint: "싸움을 재판에 부칩니다", newLabel: "새 재판" },
    comfort: { label: "위로", hint: "친구 다섯이 다르게 반응합니다", newLabel: "새 방" },
  },

  /* ── 질문 계열 — 판정·레드팀·인비즈가 한 지붕 아래 있다 ── */
  ask: {
    nav: "질문",
    navHint: "여러 AI에게 한 번에 물어봅니다",
    stance: "태도",
  },

  /* ── ⌘K ── */
  palette: {
    placeholder: "어디로 갈까요",
    aria: "명령 검색",
    empty: "찾는 게 없습니다",
    groupAction: "동작",
    groupGo: "이동",
    groupHistory: "기록",
    startNew: (what: string) => `${what} 시작`,
    startNewHint: "지금 화면을 비우고 처음부터",
  },

  /* ── 탭 ── */
  tabs: {
    add: "AI 추가",
    openCount: (n: number, max: number) => `AI 추가 · ${n}/${max} 열림`,
    allOpen: "모든 AI가 이미 열려 있습니다",
    close: (name: string) => `${name} 닫기`,
    openList: "열린 AI",
  },

  /* ── 입력창 ── */
  composer: {
    needTab: "AI를 먼저 열어주세요",
    placeholder: "열린 AI 전부에게 한 번에 물어봅니다",
    answering: (n: number) => `${n}개 AI가 함께 답합니다`,
    send: "보내기",
    stop: "중단",
    aria: "질문 입력",
  },

  /* ── 판정 · 레드팀 ── */
  debate: {
    waiting: (n: number) => `${n}개 AI가 대기 중`,
    needTabs: "AI를 먼저 열어주세요",
    newChat: "새 대화",
    titleJudge: "한 번 물어보면\n전부가 답합니다",
    titleRed: "어디서 죽는지\n먼저 봅시다",
    bodyJudge: "대화는 하나라서 맥락을 공유합니다. 답이 갈리면 서로 반박도 시킬 수 있습니다.",
    bodyRed: "열린 AI 전부가 투자 심사역이 됩니다. 좋은 점은 말하지 않고 깨질 지점만 찾습니다.",
    placeholderRed: "깨뜨려 볼 계획을 적어주세요",
    rebut: "서로 반박시키기",
    crossCheck: "교차 검증",
    synthesize: "정리하기",
    deathCert: "사망 진단서",
    mockNote: "API 키가 없는 모델은 모의 응답으로 대신합니다",
    samplesJudge: [
      "지금 이 사업, 접는 게 맞을까 더 밀어붙이는 게 맞을까",
      "공동창업자에게 지분을 얼마나 줘야 할까",
      "투자를 받는 게 나을까, 매출로 버티는 게 나을까",
      "가격을 올려야 할까, 지금 유지해야 할까",
    ],
    samplesRed: [
      "철산역 타코 프랜차이즈 1호점 계획을 공격해줘",
      "직장인 냉동 도시락 구독 서비스, 어디서 죽을까",
      "무인 스터디카페 창업 계획의 급소를 찾아줘",
      "우리 앱은 리텐션이 낮은데 마케팅을 늘리려고 한다",
    ],
  },

  /* ── 대화 ── */
  thread: {
    question: "질문",
    synthesis: "종합",
    deathCert: "사망 진단서",
    summarizedBy: (who: string) => `${who}가 정리`,
    conclusion: "결론",
    ruling: "판정",
    agree: "합의",
    split: "갈림",
    fatal: "치명상",
    bar: "합격선",
    round: (n: number) => `토론 ${n}라운드`,
    blind: "독립 답변 · 서로의 답을 가림",
    mock: "모의",
    stopped: "중단",
    responding: "응답 중",
    writing: "답을 쓰는 중입니다",
    retryOne: "이 탭만 다시",
    failed: "응답에 실패했습니다",
    joinedLate: "이 탭은 이 질문 뒤에 열려서 답이 없습니다. 다시 물어보면 함께 답합니다.",
  },

  /* ── 법원 ── */
  court: {
    badge: "AI관계법원",
    title: "싸우셨어요?",
    sub: "앉으세요. 재판장이 한 명씩 부릅니다.\n할 말만 적으면 AI 대리인 둘이 알아서 물어뜯습니다.",
    normal: "일반 법정",
    adult: "19금 법정",
    normalNote: "말투는 법정, 내용은 코미디. 욕설은 없습니다.",
    adultNote: "대리인들이 서로 욕하면서 싸웁니다. 상대 AI 모델까지 걸고 넘어집니다.",
    start: "시작하기",
    shuffle: "섞기",
    castJudge: (m: string) => `재판장 ${m}`,
    castMan: (m: string) => `남자측 ${m}`,
    castWoman: (m: string) => `여자측 ${m}`,
    castJury: (m: string) => `배심 ${m}`,
    demoHead: "아니면 남의 사건 구경하기",
    demoNote: "고른 법정 등급으로 열립니다. 같은 사건을 양쪽으로 돌려보세요.",
    adultCourt: "19금 법정",
    caseAdultSuffix: "19금 법정",
    ownStatement: "본인 진술",
    counselOf: (name: string) => `${name} 대리인`,
    judge: "재판장",
    juryHead: "배심 평의",
    juryAvg: (name: string, n: number) => `평균 ${name} ${n}%`,
    judgeSpeaking: "재판장이 말하려 합니다",
    writingVerdict: "재판장이 판결문을 쓰는 중",
    typing: "입력 중",
    turnMan: "남자 차례",
    turnWoman: "여자 차례",
    namePlaceholder: "이름 (선택)",
    statePlaceholderMan: "무슨 일이 있었는지 적으세요. 본인한테 유리하게 적어도 됩니다",
    statePlaceholderWoman: "반박하세요. 억울한 점, 사정, 다 적으세요",
    stateNote: "이대로 대리인에게 넘어갑니다",
    stateSend: "진술",
    stateAria: "진술",
    recess: "휴정",
    newTrial: "새 재판",
    appeal: "항소하기",
    appealHint: "대리인을 맞바꿔서 변론부터 다시",
    copyVerdict: "판결문 복사",
    copied: "복사했습니다",
    arguing: "대리인들이 싸우는 중",
    appealHintFoot: "판결에 불복하면 항소하십시오",
    mockNote: "API 키가 없어 모의 기록으로 재판했습니다",
    /* 같은 사건을 반대 등급으로 다시 */
    replayTo: (rating: string) => `같은 사건을 ${rating}으로`,
    replayHint: "진술은 그대로, 대리인 말투만 바뀝니다",
    verdictLabel: "판 결",
    /* 나이 확인 */
    gateTitle: "19금 법정",
    gateBody: "대리인들이 **욕을 하면서** 싸웁니다. 상대 AI 모델까지 걸고 넘어집니다. 만 19세 이상만 여십시오.",
    gateNote: "혐오 표현과 노골적인 성적 묘사는 여기서도 나오지 않습니다.",
    gateNo: "일반 법정으로",
    gateYes: "19세 이상입니다",
    errOpen: "개정에 실패했습니다",
    errRun: "재판이 중단됐습니다",
    errStep: "진행에 실패했습니다",
  },

  /* ── 위로 ── */
  comfort: {
    title: "무슨 일 있었어?",
    sub: "다섯 명이 다 다르게 반응합니다.\n편들어주는 애, 화내주는 애, 팩트 던지는 애, 굳이 반대편 드는 애.",
    shuffle: "친구 섞기",
    samplesHead: "이런 것도 됩니다",
    placeholderFirst: "무슨 일 있었어?",
    placeholderMore: "더 얘기해도 돼",
    aria: "사연 입력",
    reading: "친구 5명이 읽고 있습니다",
    answering: "친구들이 답하는 중",
    newRoom: "새 방",
    stop: "그만",
    mockNote: "API 키가 없어 모의 응답으로 대화하고 있습니다",
    normal: "그냥 단톡",
    adult: "찐친 모드",
    normalNote: "다섯이 각자 성격대로 반응합니다. 욕설은 없습니다.",
    adultNote: "찐친들이라 욕이 섞입니다. 편드는 애는 더 편들고 화내는 애는 더 화냅니다.",
    replayTo: (mode: string) => `같은 사연을 ${mode}로`,
    replayHint: "사연은 그대로, 친구들 말투만 바뀝니다",
    friends: {
      warm: { name: "다정이", trait: "일단 네 편. 감정부터 받아준다" },
      fire: { name: "불꽃이", trait: "먼저 화내준다. 판을 키운다" },
      real: { name: "현실이", trait: "팩트만 던진다. 위로는 남의 일" },
      right: { name: "바른이", trait: "옳은 쪽을 고른다. 네가 틀리면 너한테도" },
      flip: { name: "뒤집이", trait: "굳이 반대편에서 본다" },
    },
    samples: [
      "남자친구랑 사흘째 말 안 하는 중인데 내가 먼저 연락해야 하나",
      "회사에서 내가 한 일을 팀장이 자기가 했다고 보고했어",
      "친구 결혼식에 축의금 얼마 냈는지로 뒤에서 말이 나왔대",
      "부모님이 자꾸 내 진로를 대신 정하려고 해",
    ],
  },

  /* ── 인비즈 ── */
  inbiz: {
    badge: "인비즈 · 인바디 + 비즈니스",
    title: "사업을 한 줄 적으면\n법인 하나가 통째로 붙습니다",
    sub: "대표 AI가 사업을 읽고 필요한 부서를 그 자리에서 만듭니다. 부서들이 각자 분석하고, 숫자가 어긋나는 곳끼리 회의를 붙이고, 마지막에 검진 결과표 한 장으로 돌려줍니다.",
    placeholder: "어떤 사업을 생각하고 계신가요?  예: 철산역에 타코 프랜차이즈 1호점",
    aria: "사업 아이디어",
    inputNote: "업종·입지·규모를 같이 적으면 진단이 정확해집니다",
    submit: "법인 세우기",
    samplesHead: "업종마다 다른 조직이 세워집니다",
    stepStaffing: "부서 편성",
    stepAnalyzing: "부서 분석",
    stepMeeting: "부서 회의",
    stepDiagnosing: "종합 진단",
    ceo: "대표",
    ceoAi: "대표 AI",
    analyzing: (n: number) => `${n}개 부서가 분석 중`,
    staffed: (n: number) => `${n}개 부서 편성 완료`,
    sectionReports: "부서별 분석",
    sectionMeetings: "부서 회의",
    scoreHead: "사업 체성분 분석",
    metrics: "항목별 진단",
    figures: "핵심 수치",
    weakest: "가장 약한 고리",
    actions: "지금 할 일",
    issue: "쟁점",
    resolved: "정리",
    failed: "실패",
    deptFailed: "분석에 실패했습니다",
    restart: "다른 사업 진단하기",
    stop: "중단",
    mockNote: "API 키가 없어 모의 데이터로 돌고 있습니다",
    outOf: "／ 100",
    samples: [
      { q: "철산역에 타코 프랜차이즈 1호점을 내고 싶다", tag: "외식" },
      { q: "대학가에 무인 스터디카페를 열려고 한다", tag: "공간" },
      { q: "동네 병원 예약을 대신 잡아주는 앱", tag: "앱" },
      { q: "직장인 대상 냉동 도시락 정기배송", tag: "구독" },
      { q: "1인 가구 대상 반려동물 돌봄 대행 서비스", tag: "서비스" },
      { q: "실무자를 위한 데이터 분석 온라인 강의", tag: "교육" },
      { q: "제주에서 반려견 동반 펜션을 운영하려 한다", tag: "숙박" },
      { q: "중고 카메라 장비 위탁 판매 스토어", tag: "커머스" },
      { q: "퇴근길 직장인 대상 필라테스 스튜디오", tag: "공간" },
      { q: "소상공인 세무 서류를 자동으로 만들어주는 서비스", tag: "앱" },
    ],
  },

  /* ── 기록 묶음 ── */
  when: {
    today: "오늘",
    yesterday: "어제",
    week: "지난 7일",
    older: "이전",
    monthDay: (m: number, d: number) => `${m}월 ${d}일`,
  },

  /* ── 생각하는 중 ── */
  thinking: {
    head: ["사업을 읽는 중", "어떤 축이 성패를 가르는지 보는 중", "필요한 부서를 추리는 중", "조직을 세우는 중"],
    dept: ["자료를 여는 중", "비슷한 사례를 훑는 중", "숫자를 맞춰보는 중", "가정을 의심하는 중", "정리하는 중"],
    meet: ["부서별 전제를 비교하는 중", "어긋나는 숫자를 찾는 중", "회의를 붙이는 중"],
    diagnose: ["부서 의견을 모으는 중", "가장 약한 축을 찾는 중", "점수를 매기는 중", "진단서를 쓰는 중"],
  },

  /* ── 시간대 인사 ── */
  greet: {
    night: "늦었네요. 그래도 왔군요",
    morning: "좋은 아침입니다",
    afternoon: "오후네요",
    evening: "저녁입니다",
    lateNight: "밤늦게 오셨네요",
  },
};

export type Copy = typeof ko;

const en: Copy = {
  brand: "Multitab",
  beta: "beta",

  shell: {
    newStart: "New session",
    history: "History",
    historyEmpty:
      "Nothing yet. Run anything once and it lands here — click it and the screen comes back exactly as it was.",
    noKeyNeeded: "Works without any API key",
    untitled: "Untitled",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    collapse: "Collapse sidebar",
    expand: "Expand sidebar",
    removeSession: "Delete from history",
    quickJump: "Quick jump",
    settings: "Settings",
    close: "Close",
  },

  settings: {
    title: "Settings",
    language: "Language",
    theme: "Appearance",
    light: "Light",
    dark: "Dark",
    system: "System",
    note: "Saved in this browser only",
  },

  modes: {
    inbiz: { label: "Inbiz", hint: "An AI company diagnoses your business", newLabel: "New checkup" },
    judge: { label: "Panel", hint: "Several AIs answer, then argue", newLabel: "New chat" },
    redteam: { label: "Red team", hint: "Investor AIs hunt only for weak points", newLabel: "New teardown" },
    court: { label: "Court", hint: "Put the argument on trial", newLabel: "New trial" },
    comfort: { label: "Comfort", hint: "Five friends, five different reactions", newLabel: "New room" },
  },

  ask: {
    nav: "Ask",
    navHint: "Put one question to several AIs",
    stance: "Stance",
  },

  palette: {
    placeholder: "Where to?",
    aria: "Search commands",
    empty: "Nothing matches",
    groupAction: "Actions",
    groupGo: "Go to",
    groupHistory: "History",
    startNew: (what: string) => `Start ${what.toLowerCase()}`,
    startNewHint: "Clear this screen and begin again",
  },

  tabs: {
    add: "Add an AI",
    openCount: (n: number, max: number) => `Add an AI · ${n}/${max} open`,
    allOpen: "Every AI is already open.",
    close: (name: string) => `Close ${name}`,
    openList: "Open AIs",
  },

  composer: {
    needTab: "Open an AI first",
    placeholder: "Ask every open AI at once",
    answering: (n: number) => (n === 1 ? "1 AI is answering" : `${n} AIs are answering together`),
    send: "Send",
    stop: "Stop",
    aria: "Type a question",
  },

  debate: {
    waiting: (n: number) => (n === 1 ? "1 AI standing by" : `${n} AIs standing by`),
    needTabs: "Open an AI first",
    newChat: "New chat",
    titleJudge: "Ask once,\nall of them answer",
    titleRed: "Let's find out\nwhere this dies",
    bodyJudge:
      "It is one conversation, so they share the context. When answers diverge you can make them argue.",
    bodyRed:
      "Every open AI becomes an investor. They will not name a single strength — only where it breaks.",
    placeholderRed: "Describe the plan you want torn apart",
    rebut: "Make them argue",
    crossCheck: "Cross-examine",
    synthesize: "Sum it up",
    deathCert: "Death certificate",
    mockNote: "Models without an API key answer with mock responses",
    samplesJudge: [
      "Should I shut this business down or push harder?",
      "How much equity should a co-founder get?",
      "Raise money, or survive on revenue?",
      "Should I raise prices or hold them where they are?",
    ],
    samplesRed: [
      "Tear apart my plan for a taco franchise's first location",
      "A frozen lunchbox subscription for office workers — where does it die?",
      "Find the fatal flaw in my unstaffed study café plan",
      "Our app has terrible retention and we want to spend more on marketing",
    ],
  },

  thread: {
    question: "Question",
    synthesis: "Summary",
    deathCert: "Death certificate",
    summarizedBy: (who: string) => `summed up by ${who}`,
    conclusion: "Bottom line",
    ruling: "Verdict",
    agree: "Agreed",
    split: "Split",
    fatal: "Fatal",
    bar: "Bar to clear",
    round: (n: number) => `Round ${n}`,
    blind: "Independent answers · they cannot see each other",
    mock: "mock",
    stopped: "stopped",
    responding: "Responding",
    writing: "Writing an answer",
    retryOne: "Retry just this tab",
    failed: "The response failed",
    joinedLate: "This tab opened after the question, so it has no answer. Ask again and it joins in.",
  },

  court: {
    badge: "AI Relationship Court",
    title: "Had a fight?",
    sub: "Take a seat. The judge calls one of you at a time.\nWrite your side — two AI counsels do the tearing apart.",
    normal: "Regular court",
    adult: "Uncensored",
    normalNote: "Courtroom tone, comedy content. No swearing.",
    adultNote: "Counsels swear at each other — and drag in the opposing AI model by name.",
    start: "Open the session",
    shuffle: "Shuffle",
    castJudge: (m: string) => `Judge ${m}`,
    castMan: (m: string) => `His counsel ${m}`,
    castWoman: (m: string) => `Her counsel ${m}`,
    castJury: (m: string) => `Jury ${m}`,
    demoHead: "Or watch someone else's case",
    demoNote: "Opens in whichever court you picked above. Run the same case both ways.",
    adultCourt: "uncensored court",
    caseAdultSuffix: "uncensored",
    ownStatement: "own statement",
    counselOf: (name: string) => `${name}'s counsel`,
    judge: "Judge",
    juryHead: "Jury deliberation",
    juryAvg: (name: string, n: number) => `avg. ${name} ${n}%`,
    judgeSpeaking: "The judge is about to speak",
    writingVerdict: "The judge is writing the ruling",
    typing: "typing",
    turnMan: "His turn",
    turnWoman: "Her turn",
    namePlaceholder: "Name (optional)",
    statePlaceholderMan: "Write what happened. Yes, you may spin it in your favour.",
    statePlaceholderWoman: "Now rebut. Everything you think is unfair — put it here.",
    stateNote: "This goes straight to your counsel",
    stateSend: "Testify",
    stateAria: "Statement",
    recess: "Recess",
    newTrial: "New trial",
    appeal: "Appeal",
    appealHint: "Swap the counsels and argue it all over again",
    copyVerdict: "Copy the ruling",
    copied: "Copied",
    arguing: "The counsels are going at it",
    appealHintFoot: "Unhappy with the ruling? Appeal.",
    mockNote: "No API key, so this trial ran on a mock transcript",
    replayTo: (rating: string) => `Same case, ${rating}`,
    replayHint: "Same statements — only the counsels' mouths change",
    verdictLabel: "RULING",
    gateTitle: "Uncensored court",
    gateBody:
      "The counsels **swear at each other**, and drag in the opposing AI model by name. 19 and over only.",
    gateNote: "Slurs and explicit sexual content still never appear here.",
    gateNo: "Take me to the regular court",
    gateYes: "I am 19 or older",
    errOpen: "Could not open the session",
    errRun: "The trial was interrupted",
    errStep: "Could not continue",
  },

  comfort: {
    title: "So what happened?",
    sub: "Five people, five completely different reactions.\nOne takes your side, one gets angry for you, one only gives you facts, one argues the other side.",
    shuffle: "Shuffle friends",
    samplesHead: "Try one of these",
    placeholderFirst: "So what happened?",
    placeholderMore: "Keep going, I'm listening",
    aria: "Tell them what happened",
    reading: "5 friends are reading",
    answering: "Your friends are replying",
    newRoom: "New room",
    stop: "Stop",
    mockNote: "No API key, so this room is running on mock replies",
    normal: "Group chat",
    adult: "Close-friends mode",
    normalNote: "Five people react in character. No swearing.",
    adultNote: "These are your real friends, so they swear. The one who takes your side takes it harder.",
    replayTo: (mode: string) => `Same story, ${mode}`,
    replayHint: "Same story — only the way they talk changes",
    friends: {
      warm: { name: "Sweetie", trait: "On your side first, always. Feelings before facts." },
      fire: { name: "Blaze", trait: "Gets angry before you do. Escalates everything." },
      real: { name: "Reality", trait: "Facts only. Comfort is someone else's job." },
      right: { name: "Fair", trait: "Picks the right side — even when that isn't yours." },
      flip: { name: "Flip", trait: "Argues the other side on purpose." },
    },
    samples: [
      "My boyfriend and I haven't spoken in three days. Do I text first?",
      "My manager reported my work to the execs as if he'd done it",
      "People are talking behind my back about how much I gave at a friend's wedding",
      "My parents keep trying to pick my career for me",
    ],
  },

  inbiz: {
    badge: "Inbiz · body scan, but for a business",
    title: "Write one line about your business\nand a whole company shows up",
    sub: "A CEO AI reads it and staffs the departments it actually needs. Each one analyses its own slice, the ones whose numbers disagree are put in a meeting, and it all comes back as a single checkup sheet.",
    placeholder: "What are you thinking of building?  e.g. a taco franchise near the station",
    aria: "Business idea",
    inputNote: "Add the industry, location and size and the diagnosis gets sharper",
    submit: "Found the company",
    samplesHead: "A different org chart for every industry",
    stepStaffing: "Staffing",
    stepAnalyzing: "Analysis",
    stepMeeting: "Meetings",
    stepDiagnosing: "Diagnosis",
    ceo: "CEO",
    ceoAi: "CEO AI",
    analyzing: (n: number) => `${n} departments analysing`,
    staffed: (n: number) => `${n} departments staffed`,
    sectionReports: "Department analysis",
    sectionMeetings: "Department meetings",
    scoreHead: "Business composition analysis",
    metrics: "By category",
    figures: "Key figures",
    weakest: "Weakest link",
    actions: "Do this now",
    issue: "Issue",
    resolved: "Settled",
    failed: "failed",
    deptFailed: "The analysis failed",
    restart: "Diagnose another business",
    stop: "Stop",
    mockNote: "No API key, so this is running on mock data",
    outOf: "／ 100",
    samples: [
      { q: "I want to open the first taco franchise location near the station", tag: "Food" },
      { q: "An unstaffed study café in a university district", tag: "Space" },
      { q: "An app that books local clinic appointments for you", tag: "App" },
      { q: "A frozen lunchbox subscription for office workers", tag: "Subscription" },
      { q: "Pet-sitting on demand for people living alone", tag: "Service" },
      { q: "An online data analysis course for working professionals", tag: "Education" },
      { q: "A dog-friendly guesthouse on Jeju Island", tag: "Lodging" },
      { q: "A consignment store for used camera gear", tag: "Commerce" },
      { q: "A pilates studio for the after-work crowd", tag: "Space" },
      { q: "A service that auto-generates tax paperwork for small businesses", tag: "App" },
    ],
  },

  when: {
    today: "Today",
    yesterday: "Yesterday",
    week: "Last 7 days",
    older: "Older",
    monthDay: (m: number, d: number) =>
      `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${d}`,
  },

  thinking: {
    head: [
      "Reading the business",
      "Working out which axis decides this",
      "Narrowing down the departments",
      "Standing up the org",
    ],
    dept: [
      "Opening the files",
      "Scanning comparable cases",
      "Checking the numbers line up",
      "Doubting an assumption",
      "Writing it up",
    ],
    meet: ["Comparing what each department assumed", "Finding the numbers that disagree", "Calling a meeting"],
    diagnose: [
      "Collecting the departments' views",
      "Finding the weakest axis",
      "Putting a number on it",
      "Writing the checkup",
    ],
  },

  greet: {
    night: "Late one. Glad you're here.",
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    lateNight: "Up late, I see",
  },
};

export const DICT: Record<Lang, Copy> = { ko, en };

export function useCopy(): Copy {
  return DICT[useSettings().lang];
}

/** 모델에게 어느 말로 답할지 알려주는 한 줄 — 모든 프롬프트 끝에 붙는다 */
export const ANSWER_IN: Record<Lang, string> = {
  ko: "한국어로 쓴다.",
  en: "Write in English.",
};
