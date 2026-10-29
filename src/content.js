/**
 * Every word on the site lives here.
 * Change the name, email, projects and copy in this one file and the whole
 * experience updates. Colours for projects are plain CSS colours.
 */
export const content = {
  brand: {
    name: 'APURBA SARDAR', // hero title, nav, footer
    wordmark: 'APURBA', // the giant blurred word behind the index of work
    monogram: 'A/S',
    role: 'SOFTWARE DEVELOPER',
    intro: 'Independent software developer.<br>This portfolio starts with a fall.',
    year: 2026,
  },

  // Labels used by the menu and the bottom-left section indicator.
  sections: [
    { id: 'leap', label: 'THE LEAP', preview: 'media/leap-beam.webp' },
    { id: 'noise', label: 'THE NOISE', preview: 'media/crowd-top.webp' },
    { id: 'rise', label: 'RISE', preview: 'media/ember-burst.webp' },
    { id: 'work', label: 'SELECTED WORK', preview: 'media/leap-burst.webp' },
    { id: 'about', label: 'ABOUT', preview: 'media/portal-walk.webp' },
    { id: 'services', label: 'SERVICES', preview: 'media/code-tile.webp' },
    { id: 'portal', label: 'THE PORTAL', preview: 'media/portal-door.webp' },
    { id: 'contact', label: 'CONTACT', preview: 'media/portal-close.webp' },
  ],

  leap: {
    captions: [
      'Every idea begins as a fall.',
      'No safety net, no spec. Just gravity and code.',
      'You learn the shape of a system on the way down.',
      'Then the light gets louder.',
    ],
    // words you fall past (outline = huge hollow type, solid = 3D type, code = monospace)
    words: {
      outline: ['DEPLOY', 'CODE', 'RUNTIME', 'LOGIC'],
      gold: 'COMPILE',
      solid: 'SHIP IT',
      solidGold: 'NO STAGING',
      serif: ['trust the tests', 'deadline: yesterday'],
      code: ['git push --force', 'while (falling) learn()', '// TODO: land safely'],
    },
    startAltitude: 12000,
  },

  impact: 'IMPACT',

  noise: {
    captions: ['And you land in the noise.', 'The noise clears. Something is still running.'],
    word: 'NOISE',
    phrases: [
      'it works on my machine',
      'can we rewrite it in Rust?',
      'just add AI',
      'quick fix, ship it Friday',
      'one more meeting',
      'make it pop',
      'legacy code',
      'per my last ticket',
      'move fast, break things',
    ],
    code: ['npm install everything', '// fix later'],
    shout: 'HYPE',
  },

  rise: {
    word: 'RISE',
    caption: 'Code is whatever is left standing.',
    side: { outline: ['ORIGINAL', 'SCALE UP'], small: 'ALWAYS', big: 'ONLINE' },
    phrases: ['one of one', 'still shipping', 'louder than the logs'],
  },

  work: {
    heading: 'SELECTED WORK',
    cta: 'TALK ABOUT A PROJECT LIKE THIS',
    projects: [
      {
        name: 'SOLACE',
        client: 'SOLACE RECORDS',
        category: 'MUSIC STREAMING APP',
        year: 2026,
        color: '#e8b64c',
        ring: 'SOLACE RECORDS — STREAMING APP, 2026 — 3 PLATFORMS, 1 CODEBASE — ',
        description:
          'A music streaming app for an independent label. Offline-first, instant playback and one codebase for web, iOS and Android.',
        meta: ['React Native, Next.js, Node.js', '120K monthly listeners'],
        scene: 'leap',
      },
      {
        name: 'EMBERFALL',
        client: 'EMBERFALL',
        category: 'BROWSER GAME',
        year: 2025,
        color: '#ff6a1f',
        ring: 'WEBGL GAME, 2025 — 1 ENGINE, 60 FPS — EMBERFALL — ',
        description:
          'A browser game about a city that catches fire one person at a time. A custom WebGL renderer that holds 60 fps on a five-year-old phone.',
        meta: ['TypeScript, WebGL, GLSL', 'Playable in any browser'],
        scene: 'ember',
      },
      {
        name: 'THE CROWD',
        client: 'LISBON DESIGN WEEK',
        category: 'REAL-TIME PLATFORM',
        year: 2025,
        color: '#ece5d8',
        ring: 'REAL-TIME TICKETING, 2025 — 40K USERS, ZERO CRASHES — THE CROWD — ',
        description:
          'Ticketing for a design festival: forty thousand people in one queue in the same second, and nobody dropped.',
        meta: ['Go, Redis, WebSockets, AWS', '40K concurrent users'],
        scene: 'crowd',
      },
      {
        name: 'THRESHOLD',
        client: 'THRESHOLD STUDIO',
        category: 'CREATIVE DEVELOPMENT',
        year: 2024,
        color: '#4c7dff',
        ring: 'IMMERSIVE WEBSITE, 2024 — 1 DOOR, 6 MINUTES OF SCROLL — THRESHOLD — ',
        description:
          'A scroll-driven website for an architecture studio that designs entrances. Visitors spend an average of six minutes walking through one door.',
        meta: ['Three.js, GSAP, WebGL', 'Site of the Day'],
        scene: 'portal',
      },
    ],
  },

  about: {
    statement:
      'I build software for the second after the fall, when everything is noise and one idea refuses to stay down. Web apps, APIs and interactive experiences for teams that would rather ship than talk about shipping.',
    notes: [
      'Every project, one rule: if it only works on my machine, it isn’t finished yet.',
      'Working remotely with teams around the world. Open to freelance projects and full-time roles from January 2027.',
    ],
  },

  // The outline marquee: the stack I ship with.
  stack: [
    ['TYPESCRIPT', 'REACT', 'NEXT.JS', 'NODE.JS'],
    ['WEBGL', 'THREE.JS', 'GSAP', 'PYTHON'],
    ['POSTGRES', 'DOCKER', 'AWS', 'GRAPHQL'],
  ],

  services: {
    heading: 'What I can do for you',
    items: [
      {
        title: 'WEB APPS',
        text: 'Fast, accessible products from the first commit to production. React, Next.js and a lot of care.',
        preview: 'media/code-tile.webp',
      },
      {
        title: 'BACKEND & APIS',
        text: 'Services that stay up when the crowd shows up. Clean APIs, solid data, boring deploys.',
        preview: 'media/terminal-tile.webp',
      },
      {
        title: 'CREATIVE CODING',
        text: 'WebGL, shaders and scroll. Sites like this one: cinematic and made to be shared.',
        preview: 'media/leap-burst.webp',
      },
      {
        title: 'MOBILE APPS',
        text: 'One codebase, every pocket. Cross-platform apps that still feel native.',
        preview: 'media/phone-tile.webp',
      },
      {
        title: 'AI & AUTOMATION',
        text: 'LLM features, agents and pipelines that do real work instead of demos.',
        preview: 'media/ember-burst.webp',
      },
    ],
  },

  portal: {
    captions: [
      'Every fall needs a way out.',
      'Some doors only open from the inside.',
      'This is where you come in.',
    ],
    // \n marks where the closing headline breaks onto a new line
    cta: 'LET’S BUILD\nSOMETHING THAT\nREFUSES TO GO\nDOWN.',
    primary: 'WRITE TO ME',
    secondary: 'COPY EMAIL',
  },

  contact: {
    availability: 'Taking on four builds in 2027. Two slots are left.',
    email: 'hello@apurba.dev', // ← put your real address here
    city: 'Remote', // shown next to the live clock
    timezone: 'UTC', // any IANA zone, e.g. 'Asia/Kolkata'
    timezoneLabel: 'UTC',
    response: 'Replies within a day',
    socials: [
      { label: 'GitHub', href: 'https://github.com/apurba-sardar' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
      { label: 'X', href: 'https://x.com/' },
      { label: 'Instagram', href: 'https://instagram.com/' },
    ],
    again: 'FALL AGAIN',
  },

  // Optional: drop real footage in /public/videos and point a scene at it.
  // When a video is set it replaces the procedural WebGL scene and is
  // scrubbed by scroll. Leave as null to use the built-in cinematic shaders.
  videos: {
    leap: null, // e.g. 'videos/leap.mp4'
    noise: null, // covers noise + rise
    portal: null,
  },
}
