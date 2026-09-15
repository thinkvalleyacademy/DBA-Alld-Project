# Frontend Release Notes - 2026-02-25

## Scope
This release updates member registration/renewal fee handling and receipt formatting without changing core user flows.

## Changes Included

### 1) Fee calculation shifted to backend (authoritative)
- Removed frontend-owned fee calculation for:
  - General member registration (new/old)
  - Subscription renewal
- Frontend now consumes backend quote APIs and uses returned `amount` for submit.

#### APIs used by frontend
- `POST /dba-alld/api/v1/members/registration-fee`
  - Request:
    - `memberType`
    - `gmLmMemberType`
  - Response:
    - `data.amount`

- `POST /dba-alld/api/v1/renewSubscription/calculate`
  - Request:
    - `memberID`
    - `monthsNo`
    - `userPhone`
  - Response:
    - `data.amount`
    - optional `data.expiryDate` / `data.validTill`

- Renewal submit API (unchanged endpoint):
  - `POST /dba-alld/api/v1/renewSubscription/renew`
  - Frontend now sends backend-quoted `amount`.

### 2) Receipt formatting change for "Subscription For"
- Updated receipt label from `N Months` to month range:
  - 1 month: `Mon YYYY`
  - Multi-month: `StartMon YYYY - EndMon YYYY`
- Applied to both:
  - on-screen registration receipt
  - printable receipt template

### 3) Voter/Affidavit mandatory rule update
- In General Member registration:
  - `Voter` is no longer mandatory.
  - `Affidavit` is mandatory only when `Voter = yes`.

## Impacted Files
- `src/features/users/components/RegisterMember.jsx`
- `src/features/users/components/MemberRenewSubscription.jsx`
- `src/components/RegistrationReceipt.jsx`
- `src/components/PrintReceipt.jsx`
- `src/components/apiService.js`
- `src/constants/apiConfig.js`

## Validation Summary
- Frontend build completed successfully (`npm run build`).
- Existing unrelated lint warnings remain in other files.

## QA Checklist
- Registration screen:
  - Toggle New/Old member type and verify fee is fetched via `registration-fee` API.
  - Submit and verify payload uses quoted fee.
- Renewal screen:
  - Select member and renewal month duration.
  - Verify quote fetched via `renewSubscription/calculate`.
  - Submit and verify `amount` in renew payload matches quote API.
- Receipt:
  - Verify "Subscription For" shows month name/range, not `N Months`.
- Voter section:
  - `Voter` optional.
  - `Affidavit` required only when `Voter = yes`.

