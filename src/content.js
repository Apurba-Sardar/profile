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
    intro: 'Software developer with 4+ years of experience.<br>This portfolio starts with a fall.',
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
    cta: 'TALK ABOUT A PROJECT LIKE THIS', // button for projects without a url
    // url: the live site (the record and the button open it); year (optional) shows next to the record
    projects: [
      {
        name: 'WEBNESTLE',
        client: 'MY VENTURE',
        category: 'WEB AGENCY',
        url: 'https://webnestle.in',
        color: '#e8b64c',
        ring: 'WEBNESTLE — WEB AGENCY — WEBSITES & WEB APPS — WEBNESTLE.IN — ',
        description: 'My web agency: websites and web apps for businesses, from the first sketch to launch.',
        meta: ['Founder', 'webnestle.in'],
        scene: 'nest',
      },
      {
        name: 'LOOTDOST',
        client: 'MY VENTURE',
        category: 'DEAL-FINDING COMMUNITY',
        url: 'https://lootdost.in',
        color: '#ff6a1f',
        ring: 'LOOTDOST — E-COMMERCE DEAL-FINDING COMMUNITY — LOOTDOST.IN — ',
        description: 'An online community that finds the best e-commerce deals and shares them with its members.',
        meta: ['Founder', 'lootdost.in'],
        scene: 'deals',
      },
    ],
  },

  about: {
    statement:
      'For 4+ years I have built software for the second after the fall, when everything is noise and one idea refuses to stay down. Websites, web apps and the IT that keeps a business running.',
    notes: [
      'Currently IT Manager at The Minds Journal, and pursuing an MBA in Business Analytics.',
      'Building Webnestle, my web agency, and LootDost, an online deal-finding community. Based in Kolkata.',
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
    availability: 'Open to freelance web projects through Webnestle.',
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

  // Background music, streamed once the visitor turns the sound on (null = generative sound only).
  // The visuals pulse on its kick drum.
  music: {
    src: 'audio/let-him-cook.mp3',
    title: 'Let Him Cook',
    artist: 'XNIMXS',
    volume: 0.5,
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
