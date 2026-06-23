# VLX Track B Source Pack v1.0

이 폴더는 Visual Lexicon Track B의 결제·권한·구현 기준 원본이다.

## 파일

- `VLX_Track_B_Monetization_Master_Spec_v1.0.md`  
  사람·기획·개발 공통 최종 스펙. 가격, 권한, UX, 서버, 보안, 결제, PR 순서를 포함한다.

- `vlx-plan-entitlements.v1.json`  
  숫자와 권한의 canonical machine-readable source. Guest/Free/Lite/Pro/Educator, Exam Pack, AI promotion, lifecycle을 포함한다.

- `plan-catalog.v1.ts`  
  Next.js/TypeScript 저장소에 옮겨 시작할 수 있는 타입·플랜 카탈로그 starter. 실제 authorization resolver는 서버에서 별도 구현해야 한다.

- `VLX_Codex_Track_B_Master_Prompt_v1.0.md`  
  Codex에 넣는 단계별 실행 프롬프트. Session 0 read-only audit부터 시작한다.

## 적용 순서

1. 실제 Track B repo에 이 폴더를 `docs/monetization/v1/` 등으로 복사한다.
2. `AGENTS.md`에서 canonical source로 링크한다.
3. Codex Master Prompt의 Session 0만 실행한다.
4. 감사 결과를 owner가 승인한 뒤 Phase 1부터 작은 PR로 진행한다.
5. JSON과 UI/서버 권한이 다르면 출시를 중단하고 정합성을 고친다.

## 핵심 정정

- Free/Lite AI 기본 권한은 모두 0이다.
- 신규 계정 AI 3회는 별도 promotion이다.
- Free는 다운로드 불가다.
- Lite부터 무워터마크 표준 다운로드가 가능하다.
- Pro는 Lite의 상위집합이다.
