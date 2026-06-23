# Visual Lexicon Track B 수익화·권한·구현 마스터 스펙 v1.0

**문서 상태:** 최종 기준안 / Codex 구현 원본  
**버전:** 1.0.0  
**기준일:** 2026-06-23  
**적용 범위:** `app.visuallexicon.org` Track B 학습 앱, Track A 연동, 결제·권한·다운로드·광고·Exam Pack  
**우선 원칙:** 이 문서와 `vlx-plan-entitlements.v1.json`이 충돌하면 JSON의 숫자·권한을 우선하고, 제품 원칙과 안전 규칙은 이 문서를 우선한다.

---

## 0. 이 문서가 대체하는 것

이 문서는 이전 초안에서 서로 달랐던 아래 항목을 하나로 확정한다.

1. Free에서 AI 오답 설명을 체험으로 표기하고 Lite에는 없다고 적었던 역전 오류
2. Free 다운로드 가능/불가가 문서마다 달랐던 충돌
3. Guest와 Free가 섞여 광고·저장·복습 정책이 모호했던 문제
4. 워터마크 제거, 다운로드, 해상도, 포맷, 라이선스를 한 칸으로 뭉뚱그린 문제
5. Exam Pack 구독 권한과 일회성 구매 권한이 섞였던 문제
6. Track B 구현 순서가 UI, 결제, 계정 동기화, 자산 보호 사이에서 흔들렸던 문제

**최종 결정:**

- Guest와 Free를 분리한다.
- Free는 워터마크 이미지, 광고, 다운로드 불가다.
- Lite는 무광고, 무워터마크, 표준 다운로드, 전체 기본 SRS다.
- Pro는 Lite의 완전한 상위집합이며 시험팩, 약점 집중훈련, AI 오답치료, HD/배치 출력이 추가된다.
- 신규 계정 AI 3회는 `welcome_promotion`이며 Free 기능이 아니다.
- 실제 권한은 서버가 결정한다. localStorage의 plan 값은 권한 근거가 아니다.
- 학습 데이터는 다운그레이드·결제 실패·구독 종료 시 삭제하지 않는다.

---

# 1. 제품 정체성과 수익화 원칙

## 1.1 제품 한 문장

> Visual Lexicon은 웹에서 만난 어려운 단어를 비주얼 기억 카드로 바꾸고, 잊기 전에 다시 떠올리게 만드는 Visual Memory Engine이다.

## 1.2 North Star

```txt
Weekly Reviewed Words
= 한 주 동안 실제 복습 이벤트가 기록된 고유 단어 수
```

트래픽, 저장 수, AI 호출 수가 아니다. 저장은 복습 항목이 되어야 하고, 복습은 memory state를 바꿔야 한다.

## 1.3 Core product formula

```txt
Visual metaphor
→ Active recall
→ Mistake record
→ Spaced review
→ Mastery status
→ Paid habit
```

## 1.4 수익화 우선순위

```txt
1. 기억 관리 구독
2. Exam Pack 일회성 판매
3. Educator / School
4. 다운로드·출력 가치
5. 광고
```

광고와 워터마크는 유료 전환을 돕는 레버다. 핵심 상품은 “워터마크 삭제”가 아니라 “내가 저장한 단어를 잊기 전에 관리하는 시스템”이다.

---

# 2. 최종 2트랙 구조

## Track A — Public Visual Dictionary

```txt
visuallexicon.org
Webflow
공개 단어·허브·이미지 SEO
Guest/Free 광고
워터마크 파생 이미지
Save / Start quiz / Install extension CTA
```

역할:

- 검색 유입
- 첫 비주얼 이해 경험
- 가입·저장·퀴즈·확장프로그램 전환
- 광고 보조 수익

## Track B — Learning & Revenue App

```txt
app.visuallexicon.org
Next.js / Vercel
Saved / Review / SRS
Due / Weak / Mastered
Packs / Pricing / Billing
Clean downloads
AI mistake treatment
```

역할:

- 반복 사용
- 계정 기반 학습 상태
- 유료 권한
- 결제·다운로드·시험팩

## Data layer

```txt
Webflow CMS / Google Sheets
→ Worker build
→ R2 public watermarked pack + private asset store
→ Track B reads normalized packs
→ account DB stores learning and billing state
```

---

# 3. 최종 가격

메인 가격 페이지에는 Free, Lite, Pro 세 장만 노출한다. Guest는 상태이고 플랜 카드가 아니다. Educator와 School은 별도 CTA다.

| 플랜 | 한국 월간 | 한국 연간 | 글로벌 월간 | 글로벌 연간 | 핵심 역할 |
|---|---:|---:|---:|---:|---|
| Free | 0원 | 0원 | $0 | $0 | 첫 50개 단어와 기본 복습 |
| Lite | 7,900원 | 59,000원 | $7.99 | $59.99 | 무광고·무워터마크·전체 기본 SRS·표준 다운로드 |
| Pro | 14,900원 | 119,000원 | $14.99 | $119.99 | 시험·약점·AI·HD 출력 |
| Educator | 미제공 | 399,000원 | 미제공 | $249 | 교사 1명 + 학생 최대 30명 |
| School/Hagwon | 견적 | 연 300만 원부터 | 견적 | 견적 | 기관 좌석·관리·리포트 |

### 연간 결제 표시

- Lite 연간은 월간 12개월 대비 약 38% 절감, 월 환산 약 4,917원
- Pro 연간은 월간 12개월 대비 약 33% 절감, 월 환산 약 9,917원
- 실제 청구액과 월 환산액을 함께 표시한다.
- 연간을 기본 선택으로 두되 월간 전환은 한 번의 클릭으로 가능해야 한다.
- 가격은 첫 100명 유료 고객 전까지 기준가로 고정하고, 이후 실험은 별도 버전으로 운영한다.

---

# 4. 최종 권한표

## 4.1 광고·워터마크·다운로드

| 권한 | Guest | Free | Lite | Pro |
|---|---:|---:|---:|---:|
| 공개 단어·허브 광고 | 최대 2개 | 최대 1개 | 없음 | 없음 |
| Dashboard/Library 광고 | 해당 없음 | 네이티브 슬롯 최대 1개 | 없음 | 없음 |
| Review/Due/Weak 광고 | 없음 | 없음 | 없음 | 없음 |
| 이미지 표시 | 워터마크 | 워터마크 | 무워터마크 표준 | 무워터마크 HD |
| 다운로드 | 불가 | 불가 | 가능 | 가능 |
| 월 다운로드 | 0 | 0 | 100회 | 총 500회 |
| 최대 해상도 | 없음 | 없음 | 1,600px | 3,000px |
| 포맷 | 없음 | 없음 | JPG·WebP | JPG·PNG·PDF |
| 일괄 출력 | 없음 | 없음 | 없음 | 회당 20장 |
| 기본 라이선스 | 열람 | 열람 | 개인 비상업 학습 | 개인·내부 비상업 활용, 자산별 정책 우선 |

**불변 규칙:**

- Free에는 다운로드 버튼도, 깨끗한 원본 URL도 제공하지 않는다.
- 워터마크는 CSS overlay가 아니라 픽셀에 합성된 public derivative다.
- 무워터마크는 상업 사용권을 의미하지 않는다.
- `commercial_eligible`, `license_scope`, `rights_status`가 확인된 자산만 별도 상업 라이선스 대상이 될 수 있다.

## 4.2 저장·복습·SRS

| 권한 | Guest | Free | Lite | Pro |
|---|---:|---:|---:|---:|
| 저장 단어 | 로컬 10개 | 계정 50개 | 무제한 | 무제한 |
| 기기 간 동기화 | 없음 | 포함 | 포함 | 포함 |
| 일일 Review | 샘플 5장 | 10장 | 무제한/공정 사용 | 무제한/공정 사용 |
| Due Today | 샘플 | 상위 10개 | 전체 | 전체+고급 우선순위 |
| 기본 SRS | 샘플 | 5-Box 기본 | 5-Box 전체 | 5-Box+고급 우선순위 |
| Weak Words | 없음 | 상위 3개 미리보기 | 전체 목록+기본 복습 | 전체+Weak Sprint |
| Mastery Test | 없음 | 없음 | 없음 | 포함 |
| 학습 기록 | 세션 | 7일 | 90일 | 전체 |
| 커스텀 덱 | 0 | 1개 | 5개 | 무제한 |

Free의 Due가 23개면 10개만 학습 가능하고 13개는 잠긴 상태로 정확히 표시한다. 숫자를 숨기거나 가짜로 줄이지 않는다.

## 4.3 문제 유형

| 문제 유형 | Guest | Free | Lite | Pro |
|---|---:|---:|---:|---:|
| Image → Word | 데모 | 포함 | 포함 | 포함 |
| Definition → Word | 데모 | 포함 | 포함 | 포함 |
| Word → Image | 없음 | 없음 | 포함 | 포함 |
| Cloze | 없음 | 없음 | 포함 | 포함 |
| Confusable Pair | 없음 | 잠금 미리보기 | 없음 | 포함 |
| Weak Words Sprint | 없음 | 잠금 미리보기 | 없음 | 포함 |
| Mastery Test | 없음 | 없음 | 없음 | 포함 |

Lite는 일상 학습을 완성하는 플랜이고, Pro는 반복 오답과 시험을 해결하는 플랜이다.

## 4.4 AI

| AI 권한 | Guest | Free | Lite | Pro |
|---|---:|---:|---:|---:|
| 정적·검수된 오답 피드백 | 포함 | 포함 | 포함 | 포함 |
| 개인화 AI 오답 설명 | 0 | 0 | 0 | 월 200회 |
| Confusion Resolver | 0 | 0 | 0 | 월 100회 |
| Personal Memory Hook | 0 | 0 | 0 | 월 50회 |
| Daily AI Coach | 0 | 0 | 0 | 하루 1회 |

### AI 체험의 정확한 처리

```txt
Free plan AI allowance = 0
Lite plan AI allowance = 0
Pro plan AI allowance = 200/month

welcome_ai_demo promotion
= 신규 Free/Lite 계정에 개인화 오답 설명 3회
= 계정당 평생 1회
= 가격표 핵심 기능표에는 표시하지 않음
```

따라서 Free가 Lite보다 AI 권한이 높은 역전은 존재하지 않는다. 프로모션은 플랜이 아니라 additive grant다.

## 4.5 허브와 Exam Pack

| 콘텐츠 | Guest | Free | Lite | Pro |
|---|---:|---:|---:|---:|
| 공개 단어/허브 | 전체 | 전체 | 전체 | 전체 |
| Starter Deck | 데모 | 포함 | 포함 | 포함 |
| 일반 Hub Deck | 미리보기 | Starter | 전체 표준 허브 | 전체 |
| Exam Pack Preview | 5장 | 10장 | 10장 | 불필요 |
| 구매 Exam Pack | 없음 | 이용 가능 | 이용 가능 | 이용 가능 |
| 전체 Exam Pack | 없음 | 없음 | 없음 | 구독 중 전체 |
| Pack 기본 SRS | 데모 | 구매 팩 | 구매 팩 | 전체 |
| Pack AI 분석 | 없음 | 없음 | 없음 | 포함 |

### 일회성 Exam Pack

| 상품 | 한국 가격 | 글로벌 가격 | 권장 규모 |
|---|---:|---:|---:|
| Academic Vocabulary | 39,000원 | $29 | 400~500단어 |
| IELTS Writing | 59,000원 | $49 | 500~700단어 |
| GRE Visual Verbal | 79,000원 | $69 | 700~900단어 |
| Bundle | 149,000원 | $119 | 세 팩 전체 |

구매 팩은 자동 갱신 없는 일회성 권리다. 구매 버전은 계속 이용 가능하고 12개월 동안 콘텐츠 업데이트를 제공한다. AI와 전체 고급 분석은 Pro가 필요하다.

---

# 5. 권한 계산 규칙

## 5.1 최종 공식

```txt
effective_entitlements =
  base_plan_entitlements
  + active_one_time_purchase_grants
  + active_promotional_credits
  + audited_manual_grants
```

예:

```txt
plan = lite
purchased_pack = ielts-writing
promotion = welcome_ai_demo_3

결과:
- Lite 기본 권한
- IELTS Pack 접근
- AI 오답 설명 3회
```

## 5.2 서버 권위

다음은 권한 근거가 아니다.

```txt
localStorage.plan
query string
client cookie label
hidden input
success page arrival
frontend feature flag only
```

서버의 entitlement resolver와 검증된 결제/구매 이벤트만 권한을 확정한다.

## 5.3 단조성 테스트

```txt
Pro는 Lite의 모든 핵심 권한을 포함해야 한다.
Lite는 Free의 모든 핵심 학습 권한을 포함해야 한다.
프로모션은 단조성 검사에서 플랜 권한으로 계산하지 않는다.
```

---

# 6. 구독 생명주기와 다운그레이드

| 상태 | 권한 | 데이터 |
|---|---|---|
| active | 전체 플랜 권한 | 유지 |
| canceled_at_period_end | 결제 기간 종료까지 전체 | 유지 |
| past_due_grace | 7일간 학습·기록 유지, 새 clean download/AI 중지 | 유지 |
| expired | Free로 복귀 | 유지 |
| refunded/chargeback | 검증 이벤트 후 유료 grant 회수, 지원 검토 | 유지 |

### 다운그레이드

```txt
Pro → Lite
- AI, 전체 Exam Pack, Weak Sprint, HD/배치 출력 종료
- 저장 단어, review events, mastery, pack progress 보존

Lite → Free
- 기존 저장과 기록 삭제 금지
- 신규 저장과 일일 review만 Free 한도로 제한
- 50개를 초과한 기존 단어는 읽기/기록 보존, 신규 추가 불가

재구독
- 기존 학습 기록 즉시 재활성화
```

---

# 7. Track B 사용자 경험 최종 구조

UI/UX 기준은 “기능 수”가 아니라 한 화면의 다음 행동 명확성이다.

## 7.1 정보 구조

```txt
Review / Library / Packs / Account
```

Search와 AI는 도구 레이어로 두고 첫 화면의 동등한 주행동으로 두지 않는다.

## 7.2 Dashboard v2

```txt
Today’s Memory Mission
12 words due · 4 weak · about 3 minutes

[Start Review]

Due / Weak / New / Mastered
Continue Pack
Recently Saved
Upgrade — 가치가 확인된 순간에만
```

- 첫 화면의 지배적 CTA는 하나다.
- Saved Library는 학습 상태 카드 아래에 둔다.
- 가짜 카운트와 가짜 스트릭을 사용하지 않는다.

## 7.3 Review v2

```txt
질문
→ 답변
→ 즉시 피드백
→ 필요 시 힌트/동의어/문맥/AI 설명 펼치기
→ 다음 카드
→ 세션 요약
```

정답 전에 Translation/Synonym/Context/AI가 같은 위계로 노출되지 않게 한다.

## 7.4 Saved v2

탭:

```txt
Due / Weak / New / Learning / Mastered / All
```

각 카드:

```txt
thumbnail
word
memory definition
mastery state
next due
weak score
Review now
```

## 7.5 Packs v2

팩은 카탈로그가 아니라 학습 과정으로 표현한다.

```txt
Academic Vocabulary
500 visual cards · B2–C1 · 30-day plan
Preview 10 cards
Progress 40%
[Continue]
```

## 7.6 Pricing v2

핵심 카피:

```txt
Free — Start remembering your first 50 words.
Lite — Build a daily visual memory habit.
Pro — Fix weak words and prepare for exams.
```

메인 비교 항목은 8개만 우선 노출한다.

```txt
Saved Words
Daily Review
Due Today
Weak Words
Clean Downloads
Exam Packs
AI Mistake Help
Ads
```

나머지는 전체 기능 비교 아코디언에 둔다.

---

# 8. 서버 도메인 설계

## 8.1 핵심 인터페이스

```ts
type PlanId = "guest" | "free" | "lite" | "pro" | "educator";

type EffectiveEntitlements = {
  plan: PlanId;
  capabilities: Record<string, boolean>;
  limits: Record<string, number | null>;
  remaining: Record<string, number | null>;
  grants: Array<{ source: string; expiresAt: string | null }>;
  evaluatedAt: string;
};
```

앱은 다음 추상만 사용한다.

```ts
can("download.standard")
can("review.weak_sprint")
limit("review.daily")
remaining("download.monthly")
```

## 8.2 권장 API

```txt
GET  /api/me/entitlements
GET  /api/me/usage
POST /api/usage/consume
POST /api/learning/bootstrap
POST /api/learning/sync
POST /api/downloads/request
POST /api/billing/checkout
POST /api/billing/customer-portal
POST /api/webhooks/paddle
GET  /api/packs/:packId/access
POST /api/admin/entitlement-grants  owner/admin only
```

### 응답 원칙

- 오류 메시지는 결제·권한·한도 원인을 구분한다.
- 사용량 소비 요청은 idempotency key가 필수다.
- 클라이언트가 보낸 user ID, plan, quota를 신뢰하지 않는다.

---

# 9. 데이터 모델

## 9.1 Billing / entitlement

```txt
billing_customers
products
prices
subscriptions
one_time_orders
entitlement_grants
usage_counters
webhook_events
refunds
manual_grant_audit
```

## 9.2 Learning

```txt
saved_words
review_events
word_mastery
pack_progress
user_decks
daily_learning_stats
```

## 9.3 Asset / download

```txt
assets
asset_rights
asset_variants
download_events
export_jobs
```

### 필수 제약

- `webhook_events(provider, event_id)` unique
- `usage_counters(user_id, metric, period_start)` unique
- `download_events.idempotency_key` unique
- 모든 user-owned table에 row-level authorization
- learning event는 append-first, summary는 재계산 가능하게 설계

---

# 10. 자산·워터마크·다운로드 보안

## 10.1 R2 구조

```txt
/assets/public-watermarked/{assetId}.webp
/assets/private-standard/{assetId}.webp
/assets/private-hd/{assetId}.png
/exports/{userId}/{jobId}.pdf
```

## 10.2 다운로드 흐름

```txt
1. 인증 확인
2. entitlement 확인
3. asset rights 확인
4. 월 quota 확인
5. idempotent usage consume
6. 60초 임시 URL 발급
7. download event 기록
```

## 10.3 보안 완료 기준

- Free 페이지 HTML, JSON, network manifest에 clean asset URL이 없다.
- Lite는 standard만 접근한다.
- Pro는 HD와 batch export에 접근한다.
- URL 만료 후 재사용이 실패한다.
- 같은 idempotency key 재전송은 한 번만 차감한다.
- 단순히 다운로드 버튼을 숨기는 방식은 금지한다.

Cloudflare R2 presigned URL은 자격증명을 노출하지 않고 제한된 시간 동안 특정 객체 작업을 허용하는 방식으로 사용한다.

---

# 11. 광고 정책 엔진

```ts
getAdPolicy({ plan, route, sessionState })
```

| Route | Guest | Free | Lite/Pro |
|---|---:|---:|---:|
| public word/hub | 최대 2 | 최대 1 | 0 |
| dashboard/library | 해당 없음 | native 1 | 0 |
| review/due/weak/sprint | 0 | 0 | 0 |
| pricing/auth/checkout | 0 | 0 | 0 |

금지:

- 전면 광고
- 자동재생 오디오/영상
- 문제 중간 광고
- 첫 정의와 대표 이미지보다 앞선 광고
- 광고 클릭 유도 문구

---

# 12. 결제 구현 결정

## 12.1 공급자 추상화

```ts
interface BillingProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  createCustomerPortal(userId: string): Promise<string>;
  verifyWebhook(request: Request): Promise<BillingEvent>;
}
```

초기 구현 후보는 Paddle지만 앱 도메인은 Paddle 타입에 직접 의존하지 않는다.

## 12.2 Paddle 적용 원칙

- owner 승인 후 sandbox부터 연결한다.
- 상품·가격·세금·환불 설정은 Codex가 임의 생성하지 않는다.
- 현재 공개 가격은 거래당 5% + $0.50이고, $10 미만 상품은 별도 가격 협의 안내가 있으므로 Lite 월간의 수수료 구조를 사전 확인한다.
- 월간/연간 전환이 가능한 checkout을 사용한다.
- 결제 성공 화면은 권한 확정 근거가 아니다.
- 검증된 webhook으로만 subscription/order/grant를 확정한다.

## 12.3 이벤트 처리

```txt
transaction.completed
subscription.created/updated/canceled
payment failed / past due
refund/adjustment
```

실제 이벤트명은 선택한 provider의 최신 문서에 맞춰 adapter 내부에서 매핑한다.

---

# 13. 사용량 장부

측정 항목:

```txt
daily_review_cards
standard_downloads
hd_downloads
ai_mistake_explanations
ai_confusion_resolver
ai_memory_hooks
batch_exports
```

규칙:

- 일일 한도는 사용자 timezone 기준
- 월 한도는 billing period 기준
- 80%에서 경고
- 100%에서 해당 기능만 잠금
- 이월 없음
- 재시도·중복 요청으로 두 번 차감 금지
- 관리자가 수동 복구할 수 있으나 audit log 필수

---

# 14. 분석 이벤트

## 핵심 학습

```txt
vlx_save_word_click
vlx_quiz_start
vlx_quiz_answer
vlx_quiz_complete
vlx_review_state_update
vlx_due_review_start
vlx_weak_review_start
vlx_pack_preview_start
vlx_pack_preview_complete
```

## 수익화

```txt
vlx_plan_selected
vlx_paywall_view
vlx_upgrade_click
vlx_checkout_started
vlx_checkout_completed
vlx_checkout_failed
vlx_subscription_activated
vlx_subscription_canceled
vlx_payment_failed
vlx_download_requested
vlx_download_completed
vlx_quota_warning
```

공통 컨텍스트:

```txt
plan
billing_period
trigger
source_page
user_state
currency
experiment_id
session_id
```

이메일, 이름, 결제 원문, 카드 정보, 전체 자유입력은 분석 이벤트에 넣지 않는다.

---

# 15. Track B Codex 구현 로드맵

## Phase 0 — 실제 저장소 read-only 감사

**브랜치:** `release/track-b-monetization-audit-v1`  
**목표:** 추정이 아니라 실제 코드 계약을 확인한다.  
**수정:** 문서만. 런타임 변경 금지.

산출물:

```txt
docs/TRACK_B_MONETIZATION_READINESS_AUDIT.md
docs/ENTITLEMENT_MATRIX_V1.md
docs/ASSET_ACCESS_MAP.md
docs/BILLING_INTEGRATION_POINTS.md
docs/PAID_BETA_BLOCKERS.md
```

완료 기준:

- auth, saved words, review state, pack progress, plan state의 실제 소스 확인
- localStorage와 DB 계약 구분
- clean asset 노출 여부 확인
- placeholder/mock/TODO 목록
- P0/P1/P2 분류
- exact files likely touched
- validation/rollback 명시

## Phase 1 — 권한·계정·사용량 기반

### PR 1: `feat/entitlement-domain-v1`

구현:

```txt
plan catalog types
server entitlement resolver
GET /api/me/entitlements
client EntitlementProvider
can/limit/remaining helpers
```

완료 기준:

- Guest/Free/Lite/Pro 매트릭스 단위 테스트
- plan localStorage 조작으로 권한 해제 불가
- Free/Lite/Pro 단조성 테스트
- promotion 분리 테스트

### PR 2: `feat/account-learning-state-sync-v1`

구현:

```txt
saved words
review events
word mastery
pack progress
local → account merge
```

완료 기준:

- 다른 브라우저에서 같은 학습 상태
- 중복 merge 없음
- 다운그레이드 데이터 보존
- 네트워크 실패 시 안전한 재시도

### PR 3: `feat/usage-ledger-v1`

구현:

```txt
period-aware counters
atomic consume
idempotency
80% warning
```

완료 기준:

- race condition 테스트
- duplicate request 한 번만 차감
- timezone/billing-period 경계 테스트

## Phase 2 — Track B UX v2

### PR 4: `feat/app-shell-plan-aware-v2`

```txt
design tokens
plan context
loading/error/empty/mobile states
keyboard/focus baseline
```

### PR 5: `feat/dashboard-v2`

```txt
Today’s Memory Mission
single primary CTA
Due/Weak/New/Mastered
pack progress
relevant paywall only
```

### PR 6: `feat/review-session-v2`

```txt
one-card focus
progressive disclosure
confidence signal
accurate feedback
summary/next due
```

### PR 7: `feat/saved-library-v2`

```txt
Due/Weak/New/Learning/Mastered tabs
next due
review now
bulk review within entitlement
```

### PR 8: `feat/packs-v2`

```txt
preview/full access
progress truthfulness
purchased pack grants
Pro all-pack access
```

### PR 9: `feat/pricing-paywall-v3`

```txt
Free/Lite/Pro only
outcome-first copy
annual default
actual entitlement matrix
trigger-specific paywalls
```

## Phase 3 — 자산·광고·다운로드

### PR 10: `feat/asset-entitlement-gateway-v1`

```txt
private variant lookup
asset rights check
signed URL abstraction
```

### PR 11: `feat/watermarked-derivatives-v1`

```txt
public derivative pipeline
manifest contains only public variants
```

### PR 12: `feat/ad-policy-v1`

```txt
route/plan policy engine
no ads in review/auth/pricing
```

### PR 13: `feat/download-quota-v1`

```txt
Lite 100 standard
Pro 500 total + HD/batch
usage/event history
```

## Phase 4 — 결제

### PR 14: `feat/billing-provider-adapter-v1`

```txt
provider-neutral interface
mock provider
sandbox config validation
```

### PR 15: `feat/paddle-checkout-webhooks-v1`

선행 조건:

- owner가 sandbox vendor account 생성
- product/price IDs 제공
- webhook secret과 client token을 안전한 env에 설정
- 환불/취소 정책 승인

구현:

```txt
checkout
webhook signature verification
idempotent events
subscription/order grants
```

### PR 16: `feat/subscription-lifecycle-v1`

```txt
cancel at period end
past-due grace
expired/refund handling
```

### PR 17: `feat/billing-settings-v1`

```txt
current plan
renewal date
usage
manage/cancel portal
```

### PR 18: `feat/exam-pack-purchase-v1`

```txt
one-time checkout
pack grant
purchased pack restore
```

## Phase 5 — 운영·분석·베타

### PR 19: `feat/revenue-analytics-v1`

### PR 20: `feat/beta-admin-console-v1`

최소 기능:

```txt
user plan/grants read
usage read
webhook failure read/retry
manual grant with audit
support notes
```

### PR 21: `release/private-paid-beta-v1`

대상: 20~50명 수동 초대.  
Public paid beta는 별도 Gate 통과 전 금지.

---

# 16. 필수 자동 테스트

```txt
entitlement-monotonicity.test.ts
promotion-separation.test.ts
entitlement-server-authority.test.ts
learning-state-merge.test.ts
learning-state-downgrade-preservation.test.ts
usage-ledger-idempotency.test.ts
download-authorization.test.ts
asset-url-leakage.test.ts
webhook-signature.test.ts
webhook-idempotency.test.ts
subscription-lifecycle.test.ts
pack-purchase-grant.test.ts
pricing-matrix-contract.test.ts
```

E2E 매트릭스:

```txt
Guest → Free signup
Free save limit
Free review limit
Free clean download denied
Lite clean standard download
Lite AI denied except promo credit
Pro AI/Exam/HD allowed
cancel at period end
past due grace
expired → Free without data deletion
purchased pack survives subscription change
```

---

# 17. Private Paid Beta 출시 게이트

모두 통과해야 한다.

```txt
[ ] 다른 기기에서 Saved/SRS/Pack Progress 유지
[ ] client plan 조작으로 유료 기능 해제 불가
[ ] Free network/source에 clean URL 없음
[ ] 다운로드 quota 서버 강제
[ ] webhook으로만 권한 활성화
[ ] webhook 재전송 중복 없음
[ ] 취소 후 기간 종료일까지 정상
[ ] 결제 실패 7일 유예 정상
[ ] 다운그레이드 시 데이터 보존
[ ] Review/Due/Weak 광고 없음
[ ] Pricing과 실제 entitlement 일치
[ ] 키보드만으로 Review/Checkout 가능
[ ] 모바일 한 손 Review 가능
[ ] 이용약관·개인정보·다운로드 라이선스 표시
[ ] 오류 모니터링과 지원 연락처
[ ] 환불·권한 수동 조정 절차
[ ] AI 프로모션이 플랜 권한처럼 표시되지 않음
```

## Public paid beta 추가 게이트

```txt
[ ] automated account sync 안정화
[ ] billing monitoring/alerting
[ ] support SLA와 refund workflow
[ ] accessibility smoke + manual audit
[ ] privacy/data retention review
[ ] incident rollback drill
```

---

# 18. 핵심 KPI

```txt
Word Page → Save: minimum 1%, target 2%+
Saved User → First Quiz: minimum 25%, target 35%+
First Quiz → Next-day Return: minimum 12%, target 18%+
Review Completion: minimum 30%, target 35%+
Active Learner → Pricing View: minimum 5%, target 8%+
Pricing View → Paid: minimum 2%, target 3%+
First Month Paid Churn: under 20%, target under 15%
Annual Share: target 40%+
```

Gate B가 통과하지 않으면 AI·팩·유료 광고를 공격적으로 확장하지 않는다.

---

# 19. 지금 하지 않을 것

```txt
AI Tutor full chat
Writing/Speaking 전면 출시
다국어 페이지 대량 생성
10k~20k 단어 mass publish
학교용 관리자 전체 구축
국내·글로벌 결제 이중화
상업 라이선스 blanket 허용
리뷰 화면 광고
fake mastery / fake streak
random easy distractors
```

---

# 20. Owner가 직접 결정·준비할 항목

```txt
1. Paddle 또는 대체 provider 최종 승인
2. sandbox 계정과 product/price ID
3. 환불 정책
4. 이용약관·다운로드 라이선스 문구 승인
5. 자산별 rights_status 정리 책임자
6. Educator/School 판매 시작 시점
7. private beta 대상 20~50명
8. support 이메일과 응답 기준
```

Codex는 비밀번호, 결제 계정 설정, production secret, DNS, 실제 가격 변경을 임의로 수행하지 않는다.

---

# 21. 참조

## 프로젝트 내부

- `visual-lexicon-고도화-에이전트-가이드.txt`
- `비쥬얼렉시콘 운영 전략.txt`
- `Visual Lexicon UI_UX의 월드클래스 적합성 평가와 고도화 전략.pdf`
- `deep-research-report.md`
- `퀴즈 시스템 고도화 방법.txt`
- `워터마크 문제 분석.txt`

## 공식 외부 문서, 2026-06-23 확인

- Paddle pricing: https://www.paddle.com/pricing
- Paddle inline checkout: https://developer.paddle.com/build/checkout/build-branded-inline-checkout/
- Cloudflare R2 presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/

---

# 최종 한 문장

> Free는 워터마크·광고·다운로드 불가로 유입과 첫 습관을 만들고, Lite는 깨끗한 이미지와 전체 기본 복습을, Pro는 시험·약점·AI·HD 출력을 판매한다. Track B의 구현 순서는 권한과 계정 상태를 먼저 서버에 고정한 뒤 UI, 자산 보호, 결제, 운영으로 이어져야 한다.
