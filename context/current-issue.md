## Issues

### 1. getting this error while deploying to vercel

> Build error occurred
> Error: Turbopack build failed with 1 errors:
> ./lib/prisma.ts:1:1
> Module not found: Can't resolve '../app/generated/prisma/client'
> 1 | import { PrismaClient } from "../app/generated/prisma/client";

    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

2 | import { withAccelerate } from "@prisma/extension-accelerate";
3 | import { PrismaPg } from "@prisma/adapter-pg";
4 |
