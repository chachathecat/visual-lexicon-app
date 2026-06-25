# Visual Lexicon Revenue + Autonomous Factory Master Plan v1

**상태:** 최종 제품·수익화·AI 공장 실행 기준안  
**기준일:** 2026-06-25  
**저장소:** `chachathecat/visual-lexicon-app`  
**적용 범위:** Track B 제품 완성, 무워터마크 다운로드 판매, Lite/Pro 구독, AI 오답 설명, GitHub/Codex 기반 자동 개발 공장  
**머신 로드맵:** `docs/roadmap/vlx-autonomous-factory-roadmap.v1.json`

---

## 0. 이 문서가 결정하는 것

이 문서는 다음 질문에 하나의 답을 준다.

1. Visual Lexicon은 무엇을 무료로 제공하고 무엇으로 돈을 벌 것인가?
2. `$2.99` 상품은 구독인가, 일회성 상품인가?
3. 다운로드 횟수와 Lite/Pro 가격은 어떻게 연결되는가?
4. 광고는 지금 구현해야 하는가?
5. 워터마크 제거와 이미지 사용권은 어떻게 분리하는가?
6. Track B의 AI 설명은 언제, 어떤 범위로 출시하는가?
7. 현재 껍데기만 있는 자동화 제어판을 어떻게 실제 AI 개발 공장으로 바꾸는가?
8. 공장이 어떤 순서로 프로그램을 끝내며, 어디서 사람이 결정해야 하는가?
9. 무엇을 기준으로 “완성”이라고 판정하는가?

핵심 결정은 다음과 같다.

```txt
무료 검색 유입
-> 워터마크 미리보기
-> $2.99 / $5.99 일회성 clean download credits
-> $7.99 Lite 반복 사용 구독
-> $14.99 Pro 시험·HD·AI 구독
-> Educator / School
```

그리고 개발 방식은 다음과 같다.

```txt
단일 기준 문서 + 머신 로드맵
-> dependency-ready issue
-> planner / explorer
-> implementer / tester
-> security reviewer
-> release guard
-> 사람 승인 또는 제한적 병합
-> 배포 후 검증
-> roadmap verified
```

첫 유료 상품 출시가 프로젝트의 끝은 아니다. AI 공장은 첫 결제 이후에도 계속 실행되어 `docs/TRACK_B_FINISH_LINE.md`를 모두 만족할 때까지 Track B를 완성한다.

---

## 1. 기준 문서 우선순위

에이전트와 사람은 아래 순서를 지킨다.

### 1.1 절대 안전 기준

다음 문서는 항상 우선한다.

- `AGENTS.md`
- `docs/HUMAN_DECISION_BOUNDARIES.md`
- `docs/AUTONOMOUS_DELIVERY_POLICY.md`
- `docs/TRACK_B_FINISH_LINE.md`

인증, 데이터베이스, RLS, 계정 동기화, 결제, 권한, private asset, 비밀값, DNS, 배포, 운영 데이터 변경은 자동으로 최종 승인하거나 배포하지 않는다.

### 1.2 현재 런타임 숫자 기준

`docs/monetization/v1/vlx-plan-entitlements.v1.json`은 현재 코드가 읽는 가격·플랜·권한 숫자의 기준이다.

이 문서에서 새로 확정한 `clean_download_10`, `clean_download_30`, Track B 무광고 정책은 roadmap task `COM-010`이 canonical catalog와 TypeScript 계약을 함께 마이그레이션하기 전까지 **목표 계약**이다. UI나 서버가 문서만 보고 먼저 판매해서는 안 된다.

### 1.3 목표 제품 및 구현 순서

이 문서는 목표 상품, 아키텍처, 출시 순서, 공장 운영 규칙의 기준이다.

### 1.4 실행 상태와 의존성

`docs/roadmap/vlx-autonomous-factory-roadmap.v1.json`이 task ID, 상태, 위험도, 의존성, 검증 항목의 머신 기준이다.

문서와 JSON이 충돌하면:

- 제품 원칙과 출시 순서는 이 문서
- task 상태와 dependency는 roadmap JSON
- 현재 판매 가능한 숫자와 권한은 runtime canonical catalog
- 안전 규칙은 `AGENTS.md`와 human boundary 문서

를 따른다. 충돌 자체가 release blocker다.

---

## 2. 현재 저장소의 진실

2026-06-25 기준으로 이미 된 것:

- 서버 principal 기반 인증 경계
- Supabase Magic Link 세션의 최소 흐름
- pure entitlement domain core
- `GET /api/me/entitlements` read-only snapshot
- planner, explorer, implementer, tester, security reviewer, release guard 역할 정의
- CODEOWNERS와 안전 정책
- 로컬 Save → Review → SRS 루프
- 로컬 Due, Weak, Mastered, Weekly Reviewed Words
- 가격·권한 canonical v1 문서

아직 되지 않은 것:

- account-owned learning persistence
- guest data의 서버 마이그레이션
- cross-device conflict resolution
- 실제 paid grant store
- 다운로드/AI usage ledger
- asset rights runtime metadata
- private clean asset gateway
- clean download API
- 결제 provider adapter
- checkout, webhook, refund, cancellation, chargeback
- 신뢰 가능한 server analytics
- 실제 CI repair, risk gate, quality gate, auto-merge
- public paid launch

중요한 현재 모드는 다음이다.

```txt
current_factory_mode = control_plane_safe_no_op
```

`.codex` 에이전트 설정은 존재하지만, `ci-repair`, `risk-gate`, `codex-quality-gate`, `limited-auto-merge`는 현재 안전한 수동 no-op이다. 이 워크플로가 초록색이라고 제품 품질이나 자동완성을 증명하지 않는다.

---

## 3. 최종 제품 구조

## 3.1 Track A — Discovery

`visuallexicon.org`

역할:

- 검색과 공유 유입
- 단어의 첫 비주얼 이해
- 워터마크 미리보기
- Save, Review, Download clean CTA
- Track B 진입

Track A는 로그인·결제·private clean URL의 source of truth가 아니다.

## 3.2 Track B — Account, Learning, Revenue

`app.visuallexicon.org`

역할:

- 로그인과 계정 소유권
- Saved / Review / Due / Weak / Mastered
- account sync와 cross-device state
- 구매·구독·권한·사용량
- clean download
- Exam Pack
- Pro AI mistake explanation
- billing, support, settings

## 3.3 데이터와 자산 경계

```txt
Public CMS / normalized packs
-> public watermarked derivatives
-> Track A / unpaid preview

Private asset store
-> server entitlement + rights + usage check
-> short-lived delivery
-> clean standard / clean HD

Supabase account DB
-> learning state
-> purchases / subscriptions
-> entitlement grants
-> usage ledger
-> audit events
```

클라이언트는 계정 ID, plan, remaining credits, clean URL을 권한 증거로 제출할 수 없다.

---

## 4. 최종 수익화 결정

## 4.1 광고

이번 로드맵에서 광고는 P0도 P1도 아니다.

- Track B에는 광고 SDK와 광고 슬롯을 구현하지 않는다.
- Review, Due, Weak, AI explanation에는 광고를 넣지 않는다.
- Track A 광고는 별도 사업 실험으로 보류한다.
- 현재 3만 명 수준의 유입을 이유로 제품 완성을 늦추거나 UX를 훼손하지 않는다.
- 광고 예상 수익이 아니라 실제 paid funnel 데이터를 먼저 만든다.
- 이후 광고를 검토하더라도 Track A public surface로 격리한다.

즉, AI 공장은 광고 작업을 생성하지 않는다.

## 4.2 Free

- 공개 워터마크 미리보기
- clean download 불가
- Free 계정의 기본 학습 경험
- 저장 및 복습 제한은 canonical catalog를 따른다
- 정적·검수된 오답 피드백
- 신규 계정 AI promotion은 별도 grant이며 Free 권한이 아니다

Free의 목적은 “광고 노출”이 아니라 첫 기억 성공과 유료 의도 생성이다.

## 4.3 Clean Download 10

```txt
product_id: clean_download_10
kind: one_time_additive_credit
KRW: 3,900
USD: 2.99
credits: 10
variant: clean_standard
max_long_edge: 1600px
formats: JPG, WebP
validity: purchase + 12 months
license: personal_noncommercial
recurring: false
```

이 상품은 플랜이 아니다.

구매해도 다음은 열리지 않는다.

- 웹/app 전체 clean 이미지 표시
- 무광고 플랜
- 무제한 저장·복습
- HD
- batch
- AI
- 시험팩
- 상업적 사용권

오직 권리가 확인된 이미지의 clean standard 파일을 정해진 횟수만 다운로드할 수 있다.

## 4.4 Clean Download 30

```txt
product_id: clean_download_30
kind: one_time_additive_credit
KRW: 6,900
USD: 5.99
credits: 30
variant: clean_standard
max_long_edge: 1600px
formats: JPG, WebP
validity: purchase + 12 months
license: personal_noncommercial
recurring: false
```

30회 팩의 가격은 Lite와 의도적으로 가깝다. 가끔 쓰는 사람은 일회성을 선택할 수 있고, 반복 사용자는 월 100회와 학습 기능이 포함된 Lite가 더 유리해야 한다.

## 4.5 Lite

기존 canonical 가격을 유지한다.

```txt
KRW 7,900 / month
KRW 59,000 / year
USD 7.99 / month
USD 59.99 / year
```

핵심:

- 월 clean standard 100회
- 1,600px
- JPG / WebP
- Track B clean standard 표시
- 전체 기본 SRS
- 저장 무제한
- 90일 학습 기록
- 커스텀 덱 5개
- AI personalized explanation 기본 권한 0

Lite는 “다운로드만 더 주는 플랜”이 아니라 일상 학습을 완성하는 구독이다.

## 4.6 Pro

기존 canonical 가격을 유지한다.

```txt
KRW 14,900 / month
KRW 119,000 / year
USD 14.99 / month
USD 119.99 / year
```

핵심:

- 월 총 500회
- clean HD 최대 3,000px
- JPG / PNG / PDF
- batch 최대 20장
- 전체 시험팩
- Weak Sprint
- Mastery Test
- advanced priority
- personalized mistake explanation 월 200회
- Confusion Resolver 월 100회
- Memory Hook 월 50회
- Daily Coach 하루 1회

Pro는 “AI 챗봇”이 아니다. 반복 오답과 시험 준비를 해결하는 bounded learning treatment다.

## 4.7 가격 운영 규칙

- 첫 100개 유료 계정 또는 주문까지 정가를 고정한다.
- 그 전에는 가격 A/B 테스트보다 CTA, 설명, checkout friction을 개선한다.
- `$2.99`를 월 구독으로 만들지 않는다.
- 일회성 credit pack은 자동 갱신하지 않는다.
- 구독은 명확한 갱신일, 금액, 취소 경로를 표시한다.
- 세금, VAT, 환율, 영수증 문구는 선택한 payment provider와 법적 요구를 따른다.
- 할인으로 전환율을 숨기지 않는다.
- Watermark removal과 commercial license를 같은 문장으로 판매하지 않는다.

---

## 5. 다운로드 권한과 차감 규칙

## 5.1 다운로드 가능한 자산

다음 조건을 모두 만족해야 한다.

```txt
rights_status = cleared
downloadable = true
required derivative exists
license_scope is known
source_type is known
attribution requirement is known
```

조건을 만족하지 않는 이미지에는 유료 CTA를 노출하지 않는다.

## 5.2 1 credit의 의미

- 단일 export: 성공적으로 전달된 asset variant 1개 = 1 credit
- batch/PDF: 포함된 asset 수만큼 차감
- 같은 asset을 다른 format으로 다시 export하면 별도 credit
- 화면에서 clean variant를 보는 것은 plan entitlement이며 download credit과 별도
- 미리보기, 권한 거절, 생성 실패, 전송 실패는 차감하지 않는다

## 5.3 원자적 사용량 처리

```txt
authorize
-> rights check
-> entitlement check
-> reserve credit
-> generate/locate derivative
-> deliver
-> finalize usage event
```

실패하면 reservation을 release한다.

필수 규칙:

- 모든 요청에 idempotency key
- 중복 webhook과 중복 download retry는 한 번만 처리
- balance는 음수가 될 수 없음
- client remaining 숫자는 권한 근거가 아님
- reserve에는 짧은 TTL
- 완료/거절/실패가 audit event로 남음

## 5.4 여러 credit bucket의 차감 순서

만료 시점이 가장 가까운 eligible bucket을 먼저 쓴다.

일반적으로:

1. 현재 결제 주기 말에 끝나는 monthly quota
2. 더 이른 만료의 promotion
3. 더 이른 만료의 one-time pack
4. owner-approved manual grant

차감 원천은 영수증과 usage history에서 확인할 수 있어야 한다.

## 5.5 취소·연체·환불

- subscription monthly quota는 이월하지 않는다.
- cancel-at-period-end는 기간 종료까지 권한 유지
- past-due grace에서는 학습 기록을 보존하지만 새 clean download와 새 AI call은 막는다.
- expired는 Free로 돌아가되 학습 데이터를 삭제하지 않는다.
- one-time pack 환불 시 미사용 credit을 revoke한다.
- 이미 내려받은 파일은 원격 삭제할 수 없으므로 abuse/support review로 처리한다.
- chargeback은 새 paid action을 중지하고 감사 로그를 남긴다.

---

## 6. 사용자 funnel

## 6.1 첫 결제 funnel

```txt
SEO word page
-> watermarked visual
-> Download clean
-> asset rights check
-> sign in / create account
-> 10 or 30 credit pack
-> checkout
-> verified webhook grant
-> Download center
-> first successful clean download
```

성공 페이지 방문만으로 credit을 주지 않는다.

## 6.2 Lite 업셀

다음 의도가 있을 때만 Lite를 제안한다.

- 같은 기간 반복 구매
- one-time credits 대부분 사용
- 월 30회보다 많은 다운로드 의도
- Saved / Review를 반복 사용
- full Due queue, 90-day history, 여러 custom deck 의도

강제 구독 전환이나 숨겨진 자동 갱신을 쓰지 않는다.

## 6.3 Pro 업셀

다음 행동이 Pro intent다.

- HD 시도
- PNG/PDF 시도
- batch 시도
- exam pack 전체 접근
- Weak Sprint
- Mastery Test
- 반복 오답의 personalized AI explanation

## 6.4 Paywall 원칙

- 사용자가 하려던 행동을 정확히 설명한다.
- 잠긴 양을 숨기지 않는다.
- one-time와 subscription을 같은 화면에서 구분한다.
- “무워터마크”가 상업 사용권이라는 인상을 주지 않는다.
- checkout이 아직 준비되지 않았으면 `coming soon` 또는 interest capture만 제공한다.
- 존재하지 않는 결제 성공이나 plan authority를 localStorage로 흉내내지 않는다.

---

## 7. 자산·라이선스 보안

## 7.1 필수 asset record

```ts
type AssetRecord = {
  assetId: string;
  wordSlug: string;
  rightsStatus: "cleared" | "restricted" | "unknown" | "blocked";
  downloadable: boolean;
  commercialEligible: boolean;
  licenseScope: string;
  sourceType: string;
  attributionRequired: boolean;
  attributionText?: string;
  publicWatermarkedVariantId: string;
  cleanStandardVariantId?: string;
  cleanHdVariantId?: string;
};
```

## 7.2 절대 금지

- clean/source URL을 public JSON에 넣기
- clean/source URL을 localStorage에 저장하기
- CSS overlay만으로 watermark 처리하기
- query string의 plan 값을 믿기
- checkout success redirect만으로 grant 만들기
- 직접 object URL을 장기 노출하기
- rights unknown 이미지를 판매하기
- watermark removal을 commercial license로 표기하기

## 7.3 Delivery

허용 방식:

- authenticated proxy
- 짧은 만료의 signed delivery
- one-time download token
- request-specific transformed output

어떤 방식이든 permanent clean URL을 브라우저 데이터에 보존하지 않는다.

---

## 8. 서버 아키텍처

## 8.1 주요 데이터 영역

### Learning

- `saved_words`
- `review_states`
- `review_events`
- `daily_stats`
- `pack_progress`

### Commerce

- `billing_customers`
- `purchases`
- `subscriptions`
- `entitlement_grants`
- `usage_buckets`
- `usage_events`
- `webhook_events`

### Assets

- `assets`
- `asset_variants`
- `asset_rights`
- `download_requests`

### AI

- `ai_usage_events`
- `ai_explanation_cache`
- versioned prompt/eval metadata

실제 테이블명은 migration PR에서 확정하되 의미 경계를 섞지 않는다.

## 8.2 소유권과 RLS

- learning rows는 account-owned
- billing, grant, usage, webhook writes는 trusted server only
- client가 service role을 보지 못함
- user가 다른 account의 asset history나 learning state를 읽을 수 없음
- public asset metadata는 안전한 필드만 노출
- private variant 위치는 RLS public read 대상이 아님

## 8.3 예상 server routes

기존:

```txt
GET /api/me/entitlements
```

로드맵 후보:

```txt
GET  /api/me/usage
POST /api/downloads/authorize
GET  /api/downloads/{token}
POST /api/billing/checkout
POST /api/billing/webhook
POST /api/billing/portal
```

정확한 route shape는 해당 PR의 ADR과 테스트로 확정한다. 모든 paid endpoint는 브라우저가 돌려준 entitlement snapshot을 믿지 않고 서버에서 다시 principal, grant, usage, rights를 계산한다.

## 8.4 Payment provider

provider는 이 문서에서 임의로 확정하지 않는다.

roadmap task `BIL-010`에서 다음을 비교하고 owner가 결정한다.

- 한국 판매자 지원
- USD/KRW 결제
- Merchant of Record 여부
- VAT/sales tax 처리
- one-time credit와 subscription 동시 지원
- refund/chargeback
- billing portal
- webhook 신뢰성
- 수수료와 payout
- 데이터 이동과 provider 교체 비용

결정 전에는 SDK, secret, production checkout을 추가하지 않는다. 구현은 provider adapter 뒤에 둔다.

---

## 9. Track B AI 설명

## 9.1 제품 범위

첫 AI 기능은 자유 대화형 Tutor가 아니다.

```txt
wrong review event
+ correct answer
+ selected answer
+ question type
+ canonical definition
+ confusion metadata
+ bounded review history
-> short personalized mistake explanation
```

목표는 “왜 틀렸는지와 다음에 무엇을 구분해야 하는지”를 짧게 설명하는 것이다.

## 9.2 출시 순서

1. mistake taxonomy
2. 검수된 static feedback
3. golden eval set
4. grounded input/output contract
5. provider adapter
6. usage ledger와 quota
7. cache와 timeout
8. safety/quality/cost eval
9. owner-only
10. invite cohort
11. Pro gradual rollout

## 9.3 권한

- Free base allowance: 0
- Lite base allowance: 0
- Pro: personalized explanation 월 200회
- 신규 Free/Lite: lifetime promotion 3회
- 실패·timeout·안전 fallback은 credit 차감 없음

## 9.4 안전과 품질

- approved dictionary/pack data로 grounding
- 없는 정의나 어원을 지어내지 않음
- 민감한 원문, email, token, 전체 계정 데이터를 prompt에 넣지 않음
- prompt와 output schema versioning
- low confidence 또는 provider failure 시 static fallback
- 비용, latency, cache hit, refusal, unsafe output 관측
- 모델 교체가 entitlement와 UI 계약을 깨지 않음

## 9.5 비용 guardrail

출시 승인 시 owner가 최신 provider 비용을 보고 숫자를 확정한다.

기본 원칙:

- AI variable cost가 net Pro revenue의 과도한 비중을 차지하면 rollout 중지
- quota를 무한대로 두지 않음
- 동일하거나 정규화 가능한 설명은 안전하게 cache
- 더 싼 모델 사용을 위해 품질을 숨기지 않음
- 비용 때문에 static fallback을 제거하지 않음

---

## 10. AI 개발 공장

여기서 “AI 공장”은 사용자에게 제공하는 AI 설명 기능이 아니라, GitHub/Codex가 프로그램을 끝내는 개발 시스템이다. 두 시스템의 권한과 데이터는 분리한다.

## 10.1 목표 모드

```txt
target_factory_mode = human_gated_autonomous_pr_factory
```

공장은 다음을 자동화한다.

- roadmap의 dependency-ready task 검색
- issue 작성
- 코드베이스 탐색
- 구현 계획
- branch와 draft PR
- 코드와 테스트
- 정적·동적 검증
- security review
- release evidence
- 제한된 CI repair
- 상태 업데이트 제안

공장은 다음을 독단적으로 하지 않는다.

- secret 입력
- provider 계정 생성
- production DB migration 적용
- billing/DNS/deploy 설정 변경
- 고위험 PR 병합
- 법적 문구 승인
- 가격 정책 변경
- production launch
- production 데이터 삭제

## 10.2 현재 에이전트 역할

- `planner`: acceptance와 dependency를 구현 계획으로 변환
- `explorer`: 기존 코드, coupling, 변경 파일을 조사
- `implementer`: scoped code와 테스트 작성
- `tester`: unit/integration/E2E와 실패 분석
- `security_reviewer`: auth, data, billing, asset, secret, abuse 검토
- `release_guard`: 위험도, 증거, rollback, merge 가능성 판정

최대 6개 subagent thread 설정은 유지하되, 동시에 여는 runtime PR은 최대 2개, high-risk runtime PR은 최대 1개다. 같은 파일군을 건드리는 task는 직렬 실행한다.

## 10.3 공장 task 계약

모든 task는 최소한 아래 필드를 가진다.

```json
{
  "id": "AST-040",
  "status": "ready",
  "risk": "high",
  "depends_on": ["AST-030", "USG-010"],
  "deliverables": [],
  "acceptance": [],
  "validation": [],
  "human_gate": true,
  "rollback": "required"
}
```

acceptance가 모호하거나 dependency가 verified가 아니면 issue를 만들지 않는다.

## 10.4 상태 머신

```txt
ready
-> in_progress
-> pr_open
-> checks_running
-> repair_attempt_1..3
-> review
-> human_gate | merge_ready
-> merged
-> deployed_or_runtime_verified
-> verified
```

실패 상태:

```txt
blocked_dependency
blocked_human
failed
deferred
```

`merged`는 `verified`가 아니다. 배포 또는 실제 runtime evidence가 필요한 task는 smoke와 reconciliation을 통과해야 verified가 된다.

## 10.5 Branch와 PR 규칙

```txt
branch: factory/{task-id}-{short-slug}
PR title: [{task-id}] {observable outcome}
```

한 PR은 하나의 task와 하나의 사용자/시스템 결과만 바꾼다.

PR 본문 필수:

- 목표
- acceptance mapping
- 변경 파일
- 테스트 결과
- 위험도
- security finding
- migration
- rollback
- 남은 위험
- human decision
- auto-merge eligibility

## 10.6 위험도

### Low

- 문서
- fixture
- 테스트 보강
- runtime 의미가 없는 refactor
- protected path 밖의 작은 변경

향후 owner가 명시적으로 활성화한 뒤에만 auto-merge 후보가 될 수 있다.

### Medium

- 제품 UI
- server logic
- route behavior
- analytics code

외부 credential, schema, billing, entitlement, private asset, production config를 건드리지 않는 경우다. 기본은 PR review 후 merge다.

### High

- auth/session
- database/migration/RLS
- account sync
- entitlement/grant
- usage ledger
- billing/webhook/refund
- private asset/download
- AI provider
- secrets
- workflows/CODEOWNERS/AGENTS
- deployment/DNS/production data
- canonical monetization changes

항상 owner approval이 필요하다.

## 10.7 CI repair loop

최대 3회다.

각 attempt:

1. 실패를 재현
2. 원인 분류
3. 가장 작은 수정
4. 실패한 check 재실행
5. 전체 required suite 재실행
6. diff와 결과 기록

금지:

- 테스트 삭제
- assertion 완화로 실패 숨기기
- lint/typecheck 비활성화
- flaky test 무조건 skip
- unrelated dependency upgrade
- 보안 check 우회

3회 실패하면 `failed` 또는 `blocked_human`으로 전환한다.

## 10.8 Required checks

기본:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

task별로 추가:

- auth/RLS integration
- webhook replay
- usage concurrency
- asset URL leak
- checkout E2E
- accessibility
- performance
- security
- manual golden flow
- rollback drill

no-op workflow의 success는 required evidence가 아니다.

## 10.9 Auto-merge

현재 비활성 상태를 유지한다.

공장 완성에 auto-merge는 필수 조건이 아니다. 먼저 안정적으로 draft PR을 만들고 검증하는 것이 목표다.

향후 활성화 조건:

- deterministic risk contract
- required checks와 branch protection
- protected path fail-closed
- audit log
- kill switch
- owner 승인

활성화하더라도 low-risk만 가능하다.

---

## 11. AI 공장 활성화 순서

제품 task를 무작정 병렬 생성하지 않는다. 먼저 공장 자체를 완성한다.

### Factory Wave 0 — Source lock

- `FCT-000` 이 문서와 roadmap을 merge
- 기존 문서의 충돌 제거
- CODEOWNERS 보호
- task ID와 상태 계약 확정

### Factory Wave 1 — Deterministic guard

- `FCT-010` risk classifier
- `FCT-020` truthful quality gate
- no-op을 품질 승인으로 오인하지 않는 테스트

### Factory Wave 2 — Issue/PR factory

- `FCT-030` roadmap → issue
- `FCT-040` issue → branch/draft PR/subagents
- 중복 실행 idempotency
- dependency fail-closed

### Factory Wave 3 — Repair and evidence

- `FCT-050` 최대 3회 CI repair
- `FCT-060` release guard와 roadmap evidence sync
- human-gate handoff

### Factory Wave 4 — Optional merge automation

- `FCT-070` low-risk only
- 마지막에 검토
- 프로그램 완성과 무관하면 계속 deferred 가능

`G0_FACTORY_READY`를 통과하면 공장이 제품 backlog를 dependency 순서로 실행한다.

---

## 12. 제품 구현 로드맵

상세 task와 dependency는 roadmap JSON이 기준이다.

## Phase A — Account and learning data

목표:

- browser-local MVP를 account-owned system으로 이전
- local fallback을 보존
- cross-device coherence
- Weekly Reviewed Words를 trusted server event로 계산

핵심 task:

- `ACC-010` schema, migration, RLS
- `ACC-020` server repositories
- `ACC-030` sync API/client
- `ACC-040` guest migration
- `ACC-050` conflict resolution
- `ACC-060` trusted analytics

## Phase B — Commercial contracts

목표:

- 새로운 credit pack을 canonical data로 표현
- additive credit grant
- server usage ledger
- canonical pricing UI

핵심 task:

- `COM-010` catalog migration
- `COM-020` entitlement resolver extension
- `USG-010` usage ledger
- `COM-030` pricing

## Phase C — Asset security and delivery

목표:

- 권리 확인된 이미지에만 clean download
- public watermark와 private clean 분리
- permanent clean URL 유출 방지

핵심 task:

- `AST-010` rights/variant contract
- `AST-020` derivative pipeline
- `AST-030` private gateway
- `AST-040` quota-checked delivery
- `AST-050` leak/abuse/rollback gate

Phase A, B와 충돌하지 않는 범위에서 asset inventory와 derivative pipeline은 병렬 진행할 수 있다.

## Phase D — Billing

목표:

- test mode에서 시작해 verified webhook만 grant 생성
- one-time product 먼저
- subscription lifecycle 다음
- support와 rollback 포함

핵심 task:

- `BIL-010` provider ADR
- `BIL-020` provider adapter
- `BIL-030` webhook ledger
- `BIL-040` one-time checkout
- `BIL-045` one-time refund/chargeback/support
- `BIL-050` Lite/Pro subscription
- `BIL-060` subscription portal/support

## Phase E — Revenue surface

목표:

- Track A/Track B에서 clean download intent를 결제로 연결
- 잔여 credit와 history를 정확히 표시
- 반복 사용자를 Lite, HD/AI 사용자를 Pro로 안내

핵심 task:

- `REV-010` CTA/login/checkout entry
- `REV-020` credit meter/history
- `REV-030` upgrade rules
- `REV-040` paid funnel analytics

## Phase F — Learning subscription

목표:

- Lite와 Pro가 실제 account learning value를 제공
- route guessing과 local plan으로 기능을 열 수 없음

핵심 task:

- `LRN-010` account hydration
- `LRN-020` server-authoritative limits
- `LRN-030` Exam Pack ownership
- `LRN-040` Pro HD/batch/Weak/Mastery

## Phase G — Pro AI

목표:

- bounded, grounded, metered mistake explanation
- static fallback
- cost와 safety kill switch

핵심 task:

- `AI-010` taxonomy/eval/static
- `AI-020` grounded contract
- `AI-030` service/quota/cache
- `AI-040` quality/safety/cost gate
- `AI-050` staged rollout

## Phase H — Operations and release

목표:

- monitoring, legal, support, QA, rollback
- owner가 독립적으로 checkout/download/AI를 끌 수 있음

핵심 task:

- `OPS-010` monitoring/stop-sales
- `LEG-010` legal/support/license
- `QA-010` full gate
- `REL-010` credit packs
- `REL-020` Lite
- `REL-030` Pro AI
- `REL-040` Production v1 sign-off

---

## 13. 출시 Gate

## G0 — Factory Ready

다음이 실제 동작해야 한다.

- dependency-ready task 판정
- truthful risk classification
- required check evidence
- draft PR orchestration
- bounded repair
- release guard
- human handoff

placeholder/no-op은 통과로 인정하지 않는다.

## G1 — Paid Beta Ready

필수:

- account persistence
- server entitlements/grants
- usage ledger
- rights metadata
- protected clean delivery
- billing lifecycle
- refunds/chargebacks/support
- monitoring
- legal copy
- rollback
- full QA

이 Gate 전에는 real checkout을 public에 노출하지 않는다.

## G2 — Download Credits Public

필수:

- 10/30 pack의 end-to-end test
- verified webhook grant
- successful download reconciliation
- rights denial
- quota exhaustion
- refund
- stop-sales
- production smoke

첫 상품은 one-time credit다.

## G3 — Lite Public

필수:

- cross-device learning
- server-authoritative limits
- subscription renewal/cancel/downgrade
- monthly quota reset
- learning data preservation
- pricing/renewal disclosure

## G4 — Pro AI Public

필수:

- HD/batch
- Pro route authorization
- AI eval
- AI quota/cost/latency
- static fallback
- kill switch
- staged rollout evidence

## G5 — Track B Production v1

`docs/TRACK_B_FINISH_LINE.md`의 모든 항목이 true이고:

- open P0 = 0
- accepted P1 기록
- owner sign-off
- production smoke
- stop-sales/rollback owner
- roadmap required tasks = verified

일 때만 완료다.

---

## 14. 측정

## 14.1 North Star

```txt
Weekly Reviewed Words
```

트래픽, checkout view, AI call이 제품 성공 자체는 아니다.

## 14.2 수익 funnel

필수 event:

- `clean_download_cta_view`
- `clean_download_cta_click`
- `checkout_started`
- `checkout_completed_verified`
- `credit_grant_created`
- `first_download_completed`
- `credit_pack_exhausted`
- `credit_pack_repurchased`
- `lite_checkout_completed`
- `pro_checkout_completed`
- `subscription_canceled`
- `refund_verified`
- `chargeback_verified`
- `download_denied_rights`
- `download_denied_quota`
- `ai_explanation_completed`
- `ai_explanation_fallback`

event 이름은 analytics PR에서 확정하되 의미는 유지한다.

## 14.3 핵심 지표

- watermarked page → clean CTA
- CTA → checkout start
- checkout start → verified purchase
- purchase → first successful download
- 30일 내 repurchase
- credit pack → Lite
- Lite → Pro
- refund/chargeback
- unauthorized download attempt
- delivery failure
- Weekly Reviewed Words by plan
- AI explanation 이후 동일 confusion 재오답률
- variable cost per paid account

성공 페이지 view를 매출로 계산하지 않는다. provider event와 내부 purchase/grant ledger를 reconciliation한다.

## 14.4 가격 재검토

첫 100 paid account/order 이후에만 검토한다.

확인할 것:

- 10 pack과 30 pack 선택 비중
- repurchase
- Lite cannibalization 여부
- Lite upgrade
- refund
- support burden
- asset/traffic cost
- country별 결제 실패

가격 변경은 새 catalog version, migration, copy, test, owner approval이 필요하다.

---

## 15. Rollback과 Kill Switch

각 subsystem을 독립적으로 끌 수 있어야 한다.

### Checkout kill switch

- 새 checkout 생성 중지
- 기존 learning data 보존
- verified webhook은 audit 후 안전 처리

### Clean delivery kill switch

- clean authorize/delivery 중지
- public watermarked preview 유지
- 사용하지 못한 credit 보존

### Subscription entitlement kill switch

- 새 paid grant 중지
- 잘못된 client access는 Free로 fail closed
- learning data 삭제 금지

### AI kill switch

- 새 AI call 중지
- static feedback 유지
- SRS와 billing 유지

### Account sync kill switch

- 서버 write 중지
- local backup/fallback 유지
- event replay 가능하게 보존

### Factory kill switch

- issue/PR mutation 중지
- read-only report만 허용
- 열린 PR은 자동 병합하지 않음
- roadmap state를 임의로 완료 처리하지 않음

---

## 16. Non-goals

이 로드맵에서 하지 않는다.

- Track B 광고 사업
- 자유 대화형 AI Tutor
- commercial stock-image marketplace
- watermark removal을 상업 라이선스로 판매
- 무제한 AI
- 무제한 다운로드
- client plan authorization
- success redirect grant
- clean permanent URL
- 처음부터 Educator/School 구현
- 대규모 multilingual generation
- Webflow/CMS 대량 변경
- production secret 자동 입력
- high-risk auto-merge
- 테스트를 약화하는 CI repair

---

## 17. 즉시 실행 순서

이 문서가 merge된 뒤의 순서는 다음과 같다.

1. `FCT-010` deterministic risk contract
2. `FCT-020` truthful quality gate
3. `FCT-030` roadmap issue materializer
4. `FCT-040` draft PR orchestrator
5. `FCT-050` bounded CI repair
6. `FCT-060` release guard/evidence sync
7. `COM-010` canonical catalog migration
8. `BIL-010` provider ADR — owner decision
9. `ACC-010` schema/RLS — owner decision
10. `AST-010` rights/variant contract — owner decision
11. dependency graph에 따라 account, asset, usage, billing 구현
12. one-time credit packs
13. Lite
14. Pro AI
15. Production v1 sign-off

공장을 먼저 켜되, 공장 구현 자체가 제품 구현을 영원히 미루는 새 프로젝트가 되어서는 안 된다. `G0_FACTORY_READY` 직후 제품 task를 시작한다.

---

## 18. 완성의 정의

Visual Lexicon이 완성됐다는 뜻은 다음이 모두 사실이라는 뜻이다.

- 사용자가 실제 계정을 소유한다.
- 저장·복습·이벤트·진도가 서버에 안전하게 남는다.
- 기기 간 Due/Weak/Mastered가 일치한다.
- public watermark와 private clean asset이 분리된다.
- 권리 없는 이미지는 판매되지 않는다.
- credit, subscription, AI quota가 서버에서 집행된다.
- 결제, webhook, refund, cancellation, chargeback이 검증된다.
- Lite와 Pro가 설명한 가치를 실제로 제공한다.
- AI 설명은 bounded, grounded, metered, reversible하다.
- monitoring, support, legal, privacy, accessibility, performance, rollback이 있다.
- AI 공장이 dependency와 위험도를 지키며 PR을 생성·검증한다.
- no-op workflow를 자동화로 오인하지 않는다.
- open P0가 없다.
- owner가 최종 launch를 승인한다.

한 줄로 정리하면:

> 광고를 붙인 이미지 사이트가 아니라, 워터마크 공개 자산에서 clean download 결제를 만들고, 그 결제를 반복 학습과 AI 오답치료 구독으로 확장하며, 그 전체 제품을 사람 승인형 AI 공장이 끝까지 완성한다.
