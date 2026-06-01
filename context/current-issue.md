## Issues

### 1.

- When i am trying to generate architecture through chat , it not generatting , also the specs in my deployed version in vercel .
- Link:- https://ghost-ai-vert-two.vercel.app/editor/bank-app-1adahp
- Also i dont see the arctiect that i all ready developed previously before deploying
- The chnages i did before deploying is changing the secret TRIGGER_SECRET_KEY,TRIGGER_PROJECT_REF, LIVEBLOCKS_PUBLIC_KEY,LIVEBLOCKS_PUBLIC_KEY
- i can see the runs in trigger.dev , all though pending for every task but in task link it shows waiting for task to deploy . I have attached to screenshot for you

### 2.

Cloning GitHub repository Ardhendu-init/ghost-ai | branch: 131e3c7708049630c28fb7dd591a42c2165b9d16 | commit: 131e3c7
Repository cloned successfully
Build runtime: node
Installing dependencies...
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@prisma/extension-accelerate@3.0.1',
npm warn EBADENGINE required: { node: '>=22' },
npm warn EBADENGINE current: { node: 'v20.20.2', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@prisma/streams-local@0.1.2',
npm warn EBADENGINE required: { bun: '>=1.3.6', node: '>=22.0.0' },
npm warn EBADENGINE current: { node: 'v20.20.2', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
npm warn deprecated uuid@8.3.2: uuid@10 and below is no longer supported. For ESM codebases, update to uuid@latest. For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).

> ghost-ai@0.1.0 postinstall
> prisma generate
> Failed to load config file "/workspace" as a TypeScript/JavaScript module. Error: Error: Missing DATABASE_URL. Set DATABASE_URL before running Prisma commands.
> npm error code 1
> npm error path /workspace
> npm error command failed
> npm error command sh -c prisma generate
> npm error A complete log of this run can be found in: /home/builder/.npm/\_logs/2026-06-01T11_54_12_631Z-debug-0.log

1. Tell me the reason
2. How to solved it .
