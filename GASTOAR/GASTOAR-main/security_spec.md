# Firestore Security Specification

## 1. Data Invariants
- Each user's data is strictly partitioned by `userId`.
- Access to `/users/{userId}`, `/users/{userId}/presupuestos/{budgetId}`, `/users/{userId}/movimientos/{mesKey}`, and `/users/{userId}/movimientos/{mesKey}/items/{movimientoId}` is strictly restricted to the authenticated user whose `request.auth.uid == userId`.
- Document IDs must conform to alphanumeric characters and dashes (`isValidId(id)`).
- Cross-user data snooping or queries across other users' collections are strictly rejected.
- Transactions must have valid positive or zero monetary amounts.

## 2. The "Dirty Dozen" Threat Payloads
1. **Unauthenticated Read:** Anonymous or unauthenticated user queries `/users/{userId}` -> `PERMISSION_DENIED`.
2. **Cross-User Snooping:** User `userA` attempts `get` or `list` on `/users/userB/movimientos/2026-09` -> `PERMISSION_DENIED`.
3. **Cross-User Item Injection:** User `userA` attempts `create` on `/users/userB/movimientos/2026-09/items/tx1` -> `PERMISSION_DENIED`.
4. **Forged Owner Write:** User `userA` creates an item under `/users/userA/...` with `userId = "userB"` -> `PERMISSION_DENIED`.
5. **Junk ID Injection:** Attempting to use a 10KB junk-character document ID -> `PERMISSION_DENIED`.
6. **Negative Amount Tampering:** Attempting to inject negative or NaN amounts -> `PERMISSION_DENIED`.
7. **Giant Payload / Buffer Overflow:** Attempting to write a 1MB string in `concepto` -> `PERMISSION_DENIED`.
8. **Shadow Field Injection:** Attempting to add arbitrary unauthorized admin or system fields -> `PERMISSION_DENIED`.
9. **Budget Hijacking:** Attempting to modify another user's budget `/users/userB/presupuestos/config` -> `PERMISSION_DENIED`.
10. **Historical Month Tampering:** Attempting to delete another user's historical month container -> `PERMISSION_DENIED`.
11. **Direct Global Query Scraping:** Attempting to list all items across collection groups without user scoping -> `PERMISSION_DENIED`.
12. **Unverified Token Privilege Escalation:** Attempting to modify root settings with unauthenticated or spoofed credentials -> `PERMISSION_DENIED`.
