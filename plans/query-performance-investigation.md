# Query Performance Investigation

## Short Answer

Yes, Prisma relation loading can help this codebase, but it is not the whole fix.

The current latency problem has two layers:

1. The Supabase connection path is already slow/spiky before application logic runs.
2. Several API routes multiply that cost by issuing more Prisma queries than the endpoint really needs.

That distinction matters. With the current data volume, a few-row query should not take 7-10 seconds because of database execution alone. The evidence points first to connection/pooler/network behavior, then to route logic that amplifies it.

## Supabase Infrastructure Findings

The current `.env` uses Supabase's pooler host:

```text
aws-1-ap-northeast-2.pooler.supabase.com:5432
```

The direct Postgres host resolves to an IPv6 address and was not reachable from this machine/network during testing:

```text
db.hczkasxfyzyjnguuqzbn.supabase.co:5432
```

Diagnostics from this machine:

- Raw TCP connect to the pooler took roughly 255-1425 ms across samples.
- Prisma `SELECT 1` through the pooler took about 2104 ms cold, then roughly 214-330 ms warm.
- Direct Postgres `SELECT 1` failed because the direct host could not be reached.
- A stats query intermittently failed once with `Can't reach database server at pooler`, then succeeded on retry.
- `pg_stat_database` showed high cache hit rate, no temp-file pressure, and no deadlocks.
- Application tables are tiny: single-digit rows in the main user/profile/offer/query tables.
- The slowest statements visible in `pg_stat_statements` were mostly Supabase/internal metadata, migration, storage, or realtime queries, not heavy application queries over large tables.

Conclusion: this does not look like "bad code over too much data." It looks like the app is paying high remote/pooler latency, and the current API logic makes that painful by using multiple round trips per route.

## Supabase Account/Plan Checks

Check these in the Supabase dashboard before assuming the code is the only problem:

- Project region: current pooler host is `ap-northeast-2` (Seoul). If the app/server/user is far from that region, every DB round trip pays for it.
- Project status: confirm the project is not paused, waking, under maintenance, or showing degraded database/pooler health.
- Compute/database metrics: CPU, RAM, disk I/O, connection count, and pooler usage.
- Connection pooling settings: pool mode, pool size, active clients, queued clients, and whether session mode is being used because direct IPv6 is unavailable.
- Supabase Performance Advisor: missing foreign-key or compound indexes are still worth fixing, but they do not explain a 2-second `SELECT 1`.
- If the deployment platform/network does not support IPv6, either keep using Supavisor or use Supabase's IPv4 add-on for direct database connections.

## API Query Findings

The API also has avoidable latency multipliers. The main patterns are:

1. List endpoints load detail-level relation graphs.
2. Some routes start from the wrong model, then filter through relations.
3. Summary endpoints fetch rows and reduce in application code instead of using aggregate queries.
4. Common filters are not backed by compound indexes that match the route access patterns.

Remote Supabase latency makes each extra Prisma-generated SQL statement expensive, so these patterns show up as seconds instead of milliseconds.

## Current Schema Shape

The important relations are:

- `User -> StudentProfile` one-to-one.
- `User -> VolunteerProfile` one-to-one.
- `User -> RegionalAdminProfile` one-to-one.
- `User -> Offer[]` as `studentOffers`.
- `User -> Query[]` as `studentQueries`, `assignedQueries`, and `assignedQueriesByMe`.
- `Query -> QueryMessage[]`.
- `Offer -> Document[]`.
- `Region -> Offer[]`, `Region -> Query[]`, `Region -> RegionalAdminProfile[]`.

This is a reasonable relational shape. The problem is mostly query shape, not schema design.

## Where We Are Going Wrong

### Query Lists

`GET /api/queries/my`, `GET /api/admin/queries`, and `GET /api/mentor/queries` should be ticket list queries.

Wrong pattern:

```ts
include: queryInclude
```

`queryInclude` is a detail graph. It includes student emergency profile data, offer data, assignment data, and all messages with senders.

Better pattern:

```ts
select: {
  id: true,
  title: true,
  queryType: true,
  status: true,
  updatedAt: true,
  student: { select: { id: true, fullName: true, email: true } },
  region: { select: { id: true, code: true, name: true } },
  assignedTo: { select: { id: true, fullName: true, email: true } }
}
```

Messages should stay on `GET /api/.../queries/:id`, ideally paginated if the thread can grow.

### Admin Student Grid

The current master admin student grid starts from `User` and filters through `studentProfile`.

That works, but the domain object being listed is really `StudentProfile`.

Better root:

```ts
prisma.studentProfile.findMany({
  where: {
    deletedAt: null,
    user: {
      deletedAt: null,
      roles: { has: RoleCode.student }
    }
  },
  select: {
    id: true,
    profileStatus: true,
    passportStatus: true,
    locationInGaza: true,
    user: { select: { id: true, fullName: true, email: true, phone: true } }
  }
});
```

This aligns the query with the filters and reduces relation indirection.

### Admin Volunteer Grid

Same issue. The route is primarily listing volunteer profiles, but starts from `User`.

Better root:

```ts
prisma.volunteerProfile.findMany({
  where: {
    deletedAt: null,
    user: {
      deletedAt: null,
      roles: { has: RoleCode.mentor }
    }
  },
  select: {
    id: true,
    volunteerStatus: true,
    preferredRegionId: true,
    universityAffiliation: true,
    user: { select: { id: true, fullName: true, email: true, phone: true, roles: true } }
  }
});
```

### Admin Offer List

Offer list currently has two different jobs:

- list the page of offers
- calculate global summary

The page query can use relations. The summary query should not include `documents`, `region`, or `university`; it should select only summary fields or use `groupBy`.

### Dashboards

Dashboards are summary endpoints. Relations are not the main optimization here.

Better patterns:

- use `count` and `groupBy`
- run independent reads concurrently
- consider raw SQL for one-round-trip dashboard summaries if remote DB latency remains high
- cache low-risk counts if exact real-time numbers are not required

## Where Relation Loading Helps

Prisma's `relationLoadStrategy: "join"` is useful for list/detail endpoints that need a few to-one relations.

Good candidates:

- query list with `student`, `region`, `offer`, `assignedTo`
- offer list with `region`, `university`, maybe `student`
- audit log list with `actor`
- student profile detail with `user`
- volunteer profile list with `user` and `regionalAdminProfile`

Bad candidates:

- dashboard counts
- large one-to-many collections in list endpoints
- full query message history in query lists
- offer documents in broad offer lists if documents can grow

## Index Gaps

The schema has many single-column indexes, but the route filters are usually compound.

Recommended indexes to evaluate:

```prisma
model Query {
  @@index([studentUserId, deletedAt, updatedAt])
  @@index([assignedToUserId, deletedAt, updatedAt])
  @@index([regionId, deletedAt, updatedAt])
  @@index([status, deletedAt, updatedAt])
}

model Offer {
  @@index([studentUserId, deletedAt, updatedAt])
  @@index([regionId, deletedAt, updatedAt])
  @@index([reviewStatus, deletedAt, updatedAt])
}

model Announcement {
  @@index([isPublished, deletedAt, publishedAt, createdAt])
}

model AuditLog {
  @@index([createdAt])
  @@index([entityType, entityId, createdAt])
  @@index([actorUserId, createdAt])
}
```

Because `User.roles` is an enum array queried with `has`, a PostgreSQL GIN index should also be considered through a raw migration:

```sql
CREATE INDEX IF NOT EXISTS "User_roles_gin_idx" ON "User" USING GIN ("roles");
```

## Recommended Implementation Order

1. Enable and test Prisma relation join loading on a small set of routes.
2. Convert student and volunteer admin grids to start from `StudentProfile` and `VolunteerProfile`.
3. Keep list and detail payloads separate.
4. Replace row-fetch summaries with aggregate queries.
5. Add compound indexes matching real route filters.
6. Re-run route timings with slow-query logs enabled.

## Important Constraint

Even ideal query shape will not make a remote Supabase round trip disappear. The goal is to reduce each endpoint from many remote SQL statements to one or a few well-shaped statements. For consistent sub-300 ms local development, the API and database need to be close to each other, or the app needs caching/summary tables for read-heavy admin endpoints.
