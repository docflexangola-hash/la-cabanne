15:14:17.804 Running build in Washington, D.C., USA (East) – iad1
15:14:17.805 Build machine configuration: 2 cores, 8 GB
15:14:17.948 Cloning github.com/docflexangola-hash/la-cabanne (Branch: main, Commit: 02b6769)
15:14:18.599 Cloning completed: 650.000ms
15:14:18.954 Restored build cache from previous deployment (HNMKz79fdGykehJ7PqDMT6YPD3Z8)
15:14:19.368 Running "vercel build"
15:14:19.380 Vercel CLI 65.1.0
15:14:19.696 Warning: Detected "engines": { "node": ">=20.9.0" } in your `package.json` that will automatically upgrade when a new major Node.js Version is released. Learn More: <https://vercel.link/node-version>
15:14:19.713 Installing dependencies...
15:14:20.256 npm warn Unknown env config "cache-dir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
15:14:20.851
15:14:20.851 up to date in 1s
15:14:20.851
15:14:20.851 149 packages are looking for funding
15:14:20.851   run `npm fund` for details
15:14:20.852 npm warn install-scripts 1 package has install scripts not yet covered by allowScripts:
15:14:20.852 npm warn install-scripts   unrs-resolver@1.12.2 (postinstall: node postinstall.js)
15:14:20.852 npm warn install-scripts
15:14:20.852 npm warn install-scripts Run `npm install-scripts ls` to review, or `npm install-scripts approve <pkg>` to allow.
15:14:20.880 Detected Next.js version: 16.4.3
15:14:20.885 Running "npm run build"
15:14:20.993 npm warn Unknown env config "cache-dir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
15:14:21.014
15:14:21.015 > la-cabanne@0.1.0 build
15:14:21.015 > next build
15:14:21.015
15:14:21.691 ▲ Next.js 16.4.3 (Turbopack)
15:14:21.928   Applying modifyConfig from Vercel
15:14:21.934 ✓ Running next.config.ts took 243ms
15:14:21.960
15:14:21.996   Creating an optimized production build ...
15:14:25.120 ✓ Compiled successfully in 3.1s
15:14:25.128   Running TypeScript ...
15:14:28.675   Finished TypeScript in 3.5s ...
15:14:28.678   Collecting page data using 1 worker ...
15:14:29.249   Generating static pages using 1 worker (0/14) ...
15:14:29.372   Generating static pages using 1 worker (3/14)
15:14:29.431   Generating static pages using 1 worker (6/14)
15:14:29.489   Generating static pages using 1 worker (10/14)
15:14:30.409 Error occurred prerendering page "/". Read more: <https://nextjs.org/docs/messages/prerender-error>
15:14:30.781 Error: Attempted to call useTranslation() from the server but useTranslation is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.
15:14:30.781     at g (src/components/menu/hero-welcome.tsx:7:17)
15:14:30.781    5 |
15:14:30.781    6 | export function HeroWelcome() {
15:14:30.781 >  7 |   const { t } = useTranslation();
15:14:30.782      |                 ^
15:14:30.782    8 |
15:14:30.782    9 |   return (
15:14:30.782   10 |     <section className="relative isolate min-h-[78svh] overflow-hidden md:min-h-[88svh]"> {
15:14:30.782   digest: '1305780158'
15:14:30.782 }
15:14:30.782 Export encountered an error on /page: /, exiting the build.
15:14:30.809 ⨯ Next.js build worker exited with code: 1 and signal: null
15:14:30.854 Error: [BUILD_UTILS_SPAWN_1] Command "npm run build" exited with 1
