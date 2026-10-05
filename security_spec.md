# Security Specification

## Data Invariants
1. A user can only read, create, update, and delete documents where `userId == request.auth.uid` (or `id == request.auth.uid` for the `/users` collection).
2. Users cannot forge `userId` to point to another user's identifier.
3. Users cannot update immutable fields (such as `id`, `userId`, `plannerId`, `createdAt`).
4. Strings must respect maximum length boundaries (no unbounded strings or Denial of Wallet attacks).
5. Document IDs must conform to valid alphanumeric formats (`isValidId`).
6. Unauthenticated requests are completely rejected.
7. Catch-all default deny rule prevents access to unmapped collections.

## The Dirty Dozen Payloads
1. **Payload 1 (Identity Spoofing in Task)**: A user authenticated as `uid_alice` attempts to create a task with `userId: "uid_bob"`. Expected: `PERMISSION_DENIED`.
2. **Payload 2 (Unauthenticated Write)**: An unauthenticated user attempts to create a planner. Expected: `PERMISSION_DENIED`.
3. **Payload 3 (Oversized Task Title)**: A user sends a task with `title` string length > 300 characters. Expected: `PERMISSION_DENIED`.
4. **Payload 4 (Planner User ID Tampering on Update)**: A user attempts to update a planner and mutate `userId` to someone else. Expected: `PERMISSION_DENIED`.
5. **Payload 5 (Cross-user Read)**: User Alice attempts to list or get Bob's daily todos. Expected: `PERMISSION_DENIED`.
6. **Payload 6 (Oversized Subject Name)**: A user sends a subject with `name` string length > 100 characters. Expected: `PERMISSION_DENIED`.
7. **Payload 7 (Oversized Note Content)**: A user sends a note with `content` string length > 2000 characters. Expected: `PERMISSION_DENIED`.
8. **Payload 8 (Invalid ID Injection)**: A user attempts to write with document ID containing path traversal characters `../../`. Expected: `PERMISSION_DENIED`.
9. **Payload 9 (Missing Required Fields in Planner)**: A user attempts to create a planner without `startDate` or `endDate`. Expected: `PERMISSION_DENIED`.
10. **Payload 10 (Type Poisoning on Task isCompleted)**: A user sends `isCompleted: "yes"` (string instead of boolean). Expected: `PERMISSION_DENIED`.
11. **Payload 11 (Blanket Unauthorized Read)**: An attacker calls `get` on `/users/victim_user` without owning the record. Expected: `PERMISSION_DENIED`.
12. **Payload 12 (Foreign Schedule Tampering)**: User attempts to modify someone else's day-part schedule. Expected: `PERMISSION_DENIED`.
