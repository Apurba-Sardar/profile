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
        client: 'CONCEPT',
        category: 'MUSIC STREAMING APP',
        year: 2026,
        color: '#e8b64c',
        ring: 'SOLACE — MUSIC STREAMING APP — 3 PLATFORMS, 1 CODEBASE — ',
        description:
          'A concept for an offline-first music streaming app: instant playback and one codebase for web, iOS and Android.',
        meta: ['TypeScript, React', 'Concept'],
        scene: 'leap',
      },
      {
        name: 'EMBERFALL',
        client: 'CONCEPT',
        category: 'BROWSER GAME',
        year: 2026,
        color: '#ff6a1f',
        ring: 'WEBGL GAME — 1 ENGINE, 60 FPS TARGET — EMBERFALL — ',
        description:
          'A browser game concept about a city that catches fire one person at a time, rendered by a hand-written WebGL engine.',
        meta: ['TypeScript, WebGL, GLSL', 'Concept'],
        scene: 'ember',
      },
      {
        name: 'THE CROWD',
        client: 'CONCEPT',
        category: 'REAL-TIME PLATFORM',
        year: 2025,
        color: '#ece5d8',
        ring: 'REAL-TIME TICKETING — ONE QUEUE, THOUSANDS OF PEOPLE — THE CROWD — ',
        description:
          'A ticketing concept for a design festival, designed so thousands of people can join one queue in the same second.',
        meta: ['Python, WebSockets', 'Concept'],
        scene: 'crowd',
      },
      {
        name: 'THRESHOLD',
        client: 'THIS WEBSITE',
        category: 'CREATIVE DEVELOPMENT',
        year: 2026,
        color: '#4c7dff',
        ring: 'IMMERSIVE WEBSITE, 2026 — 3 REAL-TIME FILMS, 0 VIDEO FILES — THRESHOLD — ',
        description:
          'The site you are scrolling: real-time WebGL films, scroll-driven type and a generative soundtrack, without a single video file.',
        meta: ['WebGL, GLSL, GSAP, Vite', 'Live'],
        scene: 'portal',
      },
    ],
  },

  about: {
    statement:
      'I build software for the second after the fall, when everything is noise and one idea refuses to stay down. Interfaces, web apps and interactive experiences for teams that would rather ship than talk about shipping.',
    notes: [
      'Every project, one rule: if it only works on my machine, it isn’t finished yet.',
      'Based in Kolkata, working with teams anywhere. Open to freelance projects and full-time roles.',
    ],
  },

  // The outline marquee: the stack I ship with.
  stack: [
    ['TYPESCRIPT', 'JAVASCRIPT', 'PYTHON', 'HTML'],
    ['CSS', 'WEBGL', 'GLSL', 'GSAP'],
    ['VITE', 'NODE.JS', 'GIT', 'GITHUB'],
  ],

  services: {
    heading: 'What I can do for you',
    items: [
      {
        title: 'FRONT-END',
        text: 'Fast, accessible interfaces from the first commit to production, written in TypeScript with a lot of care.',
        preview: 'media/code-tile.webp',
      },
      {
        title: 'WEB APPS',
        text: 'Whole products, from the first screen to the deploy: routing, data, auth and the boring parts done right.',
        preview: 'media/phone-tile.webp',
      },
      {
        title: 'CREATIVE CODING',
        text: 'WebGL, shaders and scroll. Sites like this one: cinematic and made to be shared.',
        preview: 'media/leap-burst.webp',
      },
      {
        title: 'AI & AUTOMATION',
        text: 'LLM features and Python automations that do real work instead of demos.',
        preview: 'media/terminal-tile.webp',
      },
      {
        title: 'LANDING PAGES',
        text: 'Launch pages that load fast and say one thing well, built and shipped in days.',
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
    availability: 'Open to freelance projects and full-time roles.',
    email: 'sardarapurba9@gmail.com',
    city: 'Kolkata', // shown next to the live clock
    timezone: 'Asia/Kolkata', // any IANA zone
    timezoneLabel: 'IST',
    response: 'Replies within a day',
    socials: [
      { label: 'GitHub', href: 'https://github.com/Apurba-Sardar' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/apurba-sardar-4789b3247/' },
      { label: 'X', href: 'https://x.com/heyApurba' },
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
