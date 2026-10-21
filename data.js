// Static game data. Character looks come from Konqord Draft 4a; anything the book
// doesn't specify is a placeholder guess, marked "guess" so it's easy to correct.

const CATS = {
  language: { name: "Language", stat: "INT", c: "#4fb6ff" },
  mind:     { name: "The great mind", stat: "PER", c: "#a78bfa" },
  watch:    { name: "Anime", stat: "SEN", c: "#38d6c4" },
  work:     { name: "Writing", stat: "WIL", c: "#f2c14e" },
  exercise: { name: "Exercise", stat: "STR", c: "#ff7a59" },
  food:     { name: "Nutrition", stat: "VIT", c: "#4ade9a" },
  social:   { name: "Social & Self", stat: "SEN", c: "#ff6aa8" },
  beeyo:    { name: "Beeyo time", stat: "VIT", c: "#ff9fcf" },
};

const STATS = {
  STR: "Strength: attack power",
  VIT: "Vitality: HP and defense",
  INT: "Intelligence: magic power",
  PER: "Perception: critical hits",
  SEN: "Sense: evasion",
  WIL: "Willpower: MP and defense",
};

// Quest difficulty: real EXP, gold, and tower energy.
const DIFF = {
  E: { xp: 10, g: 5,  en: 3 },
  D: { xp: 20, g: 10, en: 5 },
  C: { xp: 35, g: 18, en: 8 },
  B: { xp: 55, g: 28, en: 12 },
  A: { xp: 85, g: 45, en: 18 },
};

const ENERGY_MAX = 100;
const BATTLE_COST = 10;
const STAT_XP_PER_POINT = 100; // quest EXP in a category needed to raise its stat by 1

const RANKS = [[1, "E"], [10, "D"], [20, "C"], [35, "B"], [50, "A"], [70, "S"]];
const TITLES = [[1, "Fallen Sibyl"], [5, "Metaphysic Initiate"], [10, "Bastion Warrior"], [20, "Trial of Aegis Victor"], [35, "Rift Walker"], [50, "Sigil Bearer"], [75, "Metaphysic Mage"]];

// Ten regions of Konqord, one per ten floors of the tower.
const AREAS = [
  { name: "The Sanctum",        floors: [1, 10],   sky: "#132238", ground: "#1d2f22", accent: "#4fb6ff" },
  { name: "Hauris",             floors: [11, 20],  sky: "#24202c", ground: "#3a3340", accent: "#c9b8ff" },
  { name: "Astercove",          floors: [21, 30],  sky: "#0f2a33", ground: "#173c3a", accent: "#38d6c4" },
  { name: "Pagos Mountains",    floors: [31, 40],  sky: "#1d2a3d", ground: "#c9d6e6", accent: "#e8f2ff" },
  { name: "The Hive",           floors: [41, 50],  sky: "#2b2210", ground: "#3d2f12", accent: "#f2c14e" },
  { name: "Aeona",              floors: [51, 60],  sky: "#1a1430", ground: "#2a2045", accent: "#a78bfa" },
  { name: "Magnar",             floors: [61, 70],  sky: "#2a1418", ground: "#3a1d1d", accent: "#ff7a59" },
  { name: "The Crimson Expanse",floors: [71, 80],  sky: "#2d0b12", ground: "#4a0f1a", accent: "#ff5d6c" },
  { name: "Lythara",            floors: [81, 90],  sky: "#0d1f1a", ground: "#16342b", accent: "#4ade9a" },
  { name: "Wellspring of Mana", floors: [91, 100], sky: "#060818", ground: "#3a0a2a", accent: "#ff6ad5" },
];

// UI color theme for each region: p = primary, s = secondary, on = text color on primary,
// bg = page background. The whole interface switches when Emzi enters a new region.
const THEMES = [
  { name: "Cobalt & Cyan",      p: "#1f6fff", s: "#5ce1e6", on: "#ffffff", bg: "#05081a" },
  { name: "Lavender & Lemon",   p: "#9b6bff", s: "#ffd23f", on: "#ffffff", bg: "#0d0817" },
  { name: "Teal & Coral",       p: "#00b89c", s: "#ff6f61", on: "#04110e", bg: "#03110f" },
  { name: "Ice & Magenta",      p: "#8fd3ff", s: "#ff3d8b", on: "#06121c", bg: "#060c16" },
  { name: "Amber & Ultraviolet",p: "#ffb300", s: "#7b2cff", on: "#140c00", bg: "#0f0a04" },
  { name: "Violet & Lime",      p: "#7d3cff", s: "#c6ff3d", on: "#ffffff", bg: "#0a0616" },
  { name: "Tangerine & Turquoise", p: "#ff5a1f", s: "#1fd1c1", on: "#ffffff", bg: "#140805" },
  { name: "Crimson & Gold",     p: "#e60026", s: "#ffd400", on: "#ffffff", bg: "#0e0204" },
  { name: "Emerald & Rose",     p: "#14c463", s: "#ff4fa3", on: "#03140a", bg: "#03100a" },
  { name: "Hot Pink & Electric Cyan", p: "#ff2bd6", s: "#00f0ff", on: "#ffffff", bg: "#0b0312" },
];

// Sprite descriptors: hair, hair style, skin, eyes, outfit, accent, weapon.
const HERO_LOOK = { hair: "#2a2238", style: "short", skin: "#e8c3a0", eyes: "#4fb6ff", outfit: "#1f3a6b", accent: "#dbe8f7", legs: "#1b2233", weapon: "sword" }; // fallback when sprites/emzi.png is missing

const ALLIES = [
  { id: "phila", name: "Phila", unlock: 1, role: "dmg", ability: "Shadow Cloner", desc: "Strikes alongside her shadow clones.",
    look: { hair: "#efe6c8", tips: "#4fb6ff", style: "bob", skin: "#f1d2b8", eyes: "#7aa7ff", outfit: "#3b4a6b", accent: "#dbe8f7", legs: "#222a3d", weapon: "sword", hood: "#2b3550" } },
  { id: "aerys", name: "Aerys", unlock: 1, role: "dmg", ability: "Bastion Charge", desc: "Ximena's retainer. Barrels in with a wooden sword.",
    look: { hair: "#7a4a2a", style: "short", skin: "#d9a57e", eyes: "#3b2a1a", outfit: "#8a8f9a", accent: "#c7a45a", legs: "#3d3326", weapon: "sword" } },
  { id: "raven", name: "Raven", unlock: 5, role: "crit", ability: "Release", desc: "Quiet swordswoman whose strikes launch foes across the room.",
    look: { hair: "#15131c", style: "long", skin: "#e2bfa0", eyes: "#9b1c2e", outfit: "#b3263a", accent: "#2a2a2a", legs: "#1c1c24", weapon: "sword" } },
  { id: "syon", name: "Syon", unlock: 5, role: "dmg", ability: "Yellow Volt Spheres", desc: "Green-eyed fighter who needs no sword. She shares volt mana with Emzi.",
    look: { hair: "#c86a3a", style: "short", skin: "#d9a07a", eyes: "#3fbf6a", outfit: "#2f5a3a", accent: "#e8d9a8", legs: "#2a2a2a", weapon: "none" } },
  { id: "yvento", name: "Yvento", unlock: 11, role: "gold", ability: "Scout's Eye", desc: "Scruffy-haired rebel who knows every city's back streets.",
    look: { hair: "#5a4632", style: "messy", skin: "#c99a74", eyes: "#4a3a2a", outfit: "#5b5a3a", accent: "#a8a27a", legs: "#33302a", weapon: "dagger" } },
  { id: "ruji", name: "Ruji", unlock: 11, role: "speed", ability: "All-Fours Sprint", desc: "Blue-eyed and impossibly fast, she runs on all fours.",
    look: { hair: "#d98a3a", style: "ears", skin: "#f0cfae", eyes: "#3a8fff", outfit: "#6b3b2a", accent: "#f2c14e", legs: "#3a2a20", weapon: "claws" } },
  { id: "ximena", name: "Ximena", unlock: 15, role: "frost", ability: "Icy Lance", desc: "Cloaked noble with a golden-embroidered lance of ice.",
    look: { hair: "#e8eef7", style: "long", skin: "#f3dccb", eyes: "#8fd3ff", outfit: "#e8eef7", accent: "#d9b44a", legs: "#9fb3cc", weapon: "lance", hood: "#cfdcef" } },
  { id: "aphrodite", name: "Aphrodite", unlock: 21, role: "dmg", ability: "Tunnel Breaker", desc: "Fierce swordswoman who carves her own way out.",
    look: { hair: "#d94a7a", style: "long", skin: "#f0c8b0", eyes: "#ffb3cf", outfit: "#5a2140", accent: "#f2c14e", legs: "#2a1a24", weapon: "sword" } },
  { id: "fenthir", name: "Fenthir", unlock: 31, role: "heal", ability: "Ritual Bow", desc: "Calm Aeonan who mends wounds with a ritual bow.",
    look: { hair: "#9fb3a0", style: "short", skin: "#c49a7a", eyes: "#4ade9a", outfit: "#2f4a3e", accent: "#d9e8c8", legs: "#223029", weapon: "staff" } },
  { id: "aversa", name: "Aversa", unlock: 41, role: "fire", ability: "Draconic Form", desc: "Calculating strategist who can take a dragon's form.",
    look: { hair: "#3a1a1a", style: "horns", skin: "#e6b896", eyes: "#ff9f43", outfit: "#4a1a1a", accent: "#ff7a59", legs: "#2a1414", weapon: "claws" } },
  { id: "uchita", name: "Uchita", unlock: 51, role: "shield", ability: "Soul Resonance", desc: "White-haired lord whose soul lives within Emzi.",
    look: { hair: "#f4f4f8", style: "long", skin: "#e8d0c0", eyes: "#7a1f3a", outfit: "#1a1a2a", accent: "#a78bfa", legs: "#121220", weapon: "staff" } },
  { id: "whezarl", name: "Whezarl", unlock: 61, role: "dmg", ability: "Heavenly Frigid Wrath", desc: "Frost royalty. A sinister cackle and a blade that leaves the ground untouched.",
    look: { hair: "#efe6c8", style: "long", skin: "#f3dccb", eyes: "#4fb6ff", outfit: "#16243d", accent: "#d9b44a", legs: "#0f1828", weapon: "sword" } },
];

// Emzi's powers follow the book: a metaphysic mage (rifts, warping space, impairing senses)
// and a volt alchemist (volt-coated blade and body, high-voltage fists, blue volt spheres),
// with the sigil on his left palm and his bonds to Syon and Uchita.
// "base" skills are known from the start; the rest are learned in the skill tree.
// Extra effects: pierce = ignores defense, stun = chance the enemy loses a turn,
// blind = enemy misses more for 3 turns, hpCost = share of max HP the cast burns.
const SKILLS = [
  { id: "strike",    name: "Sword Strike",          base: true, mp: 0,  kind: "phys", power: 1.0, desc: "A clean sword strike." },
  { id: "snap",      name: "Volt Snap",             base: true, mp: 6,  kind: "mag",  power: 1.6, desc: "Snaps shrill blue voltage at the enemy." },
  { id: "sphere",    name: "Volt Sphere",           mp: 14, kind: "mag",  power: 2.2, desc: "Hurls a shrieking sphere of blue voltage." },
  { id: "fist",      name: "High-Voltage Fist",     mp: 18, kind: "phys", power: 2.0, stun: 0.35, desc: "An electrified punch. May stun." },
  { id: "preternatural", name: "Preternatural Sphere", mp: 42, kind: "mag", power: 4.2, stun: 0.3, desc: "An immense sphere of blue voltage pushed from both palms." },
  { id: "rift",      name: "Rift Tear",             mp: 12, kind: "mag",  power: 1.7, pierce: true, desc: "Rips a screeching rift through the enemy. Ignores defense." },
  { id: "impair",    name: "Sense Impairment",      mp: 14, kind: "blind", desc: "Metaphysic mana dulls the enemy's senses. It misses far more for 3 turns." },
  { id: "warp",      name: "Spatial Twist",         mp: 26, kind: "mag",  power: 2.9, pierce: true, desc: "Squeezes the space the enemy occupies and twists it." },
  { id: "bloom",     name: "Void Bloom",            mp: 48, kind: "mag",  power: 4.8, pierce: true, hpCost: 0.1, desc: "Purple metaphysic mana blooms outward. The miasma burns Emzi too." },
  { id: "riftstep",  name: "Rift Step",             mp: 10, kind: "phys", power: 1.8, desc: "Steps through a rift and strikes from behind." },
  { id: "pin",       name: "Pinning Blade",         mp: 20, kind: "phys", power: 2.6, stun: 0.25, desc: "Volt suppresses the foe while the blade pins it down." },
  { id: "barrage",   name: "Rift Barrage",          mp: 36, kind: "phys", power: 1.15, hits: 4, desc: "Blasts waves of volt through rifts torn all around the enemy." },
  { id: "circulate", name: "Volt Circulation",      mp: 15, kind: "heal", power: 0.35, desc: "Circulates volt mana through the body, restoring 35% HP." },
];

// Skill tree: four branches, five nodes each, learned in order. Emzi earns 1 skill point per level.
const TREE = [
  { id: "volt", name: "Volt", color: "#5ca8ff", nodes: [
    { id: "vo1", name: "Volt Coating",   cost: 1, lv: 1,  stat: "def", v: 0.10, desc: "+10% DEF. Volt mana coats the body." },
    { id: "vo2", name: "Volt Sphere",    cost: 1, lv: 3,  skill: "sphere", desc: "Learn Volt Sphere" },
    { id: "vo3", name: "High Voltage",   cost: 1, lv: 7,  skill: "fist", desc: "Learn High-Voltage Fist" },
    { id: "vo4", name: "Harmonised Voltage", cost: 2, lv: 12, stat: "mag", v: 0.15, desc: "+15% MAG" },
    { id: "vo5", name: "Preternatural",  cost: 2, lv: 20, skill: "preternatural", desc: "Learn Preternatural Sphere" },
  ] },
  { id: "meta", name: "Metaphysic", color: "#b07cff", nodes: [
    { id: "me1", name: "Rift Tear",      cost: 1, lv: 1,  skill: "rift", desc: "Learn Rift Tear" },
    { id: "me2", name: "Sense Impairment", cost: 1, lv: 4, skill: "impair", desc: "Learn Sense Impairment" },
    { id: "me3", name: "Mana on Physicality", cost: 1, lv: 8, stat: "hp", v: 0.12, desc: "+12% max HP. Metaphysic mana reinforces the body." },
    { id: "me4", name: "Spatial Twist",  cost: 2, lv: 13, skill: "warp", desc: "Learn Spatial Twist" },
    { id: "me5", name: "Void Bloom",     cost: 2, lv: 22, skill: "bloom", desc: "Learn Void Bloom" },
  ] },
  { id: "blade", name: "Blade", color: "#f4f4f0", nodes: [
    { id: "bl1", name: "Emblazoned Blade", cost: 1, lv: 2, stat: "atk", v: 0.08, desc: "+8% ATK. Volt mana runs along the blade." },
    { id: "bl2", name: "Rift Step",      cost: 1, lv: 3,  skill: "riftstep", desc: "Learn Rift Step" },
    { id: "bl3", name: "Bastion Footwork", cost: 1, lv: 6, stat: "eva", v: 0.05, desc: "+5% evasion" },
    { id: "bl4", name: "Pinning Blade",  cost: 2, lv: 14, skill: "pin", desc: "Learn Pinning Blade" },
    { id: "bl5", name: "Rift Barrage",   cost: 2, lv: 24, skill: "barrage", desc: "Learn Rift Barrage" },
  ] },
  { id: "bond", name: "Bonds", color: "#ffd400", nodes: [
    { id: "bo1", name: "Palm Sigil",     cost: 1, lv: 2,  stat: "crit", v: 0.05, desc: "+5% crit. The sigil on Emzi's left palm glows." },
    { id: "bo2", name: "Volt Circulation", cost: 1, lv: 5, skill: "circulate", desc: "Learn Volt Circulation (Syon's technique)" },
    { id: "bo3", name: "Draconic Bond",  cost: 1, lv: 9,  stat: "mp", v: 0.15, desc: "+15% max MP. Mana melded with Syon's." },
    { id: "bo4", name: "Uchita's Teachings", cost: 2, lv: 15, stat: "mag", v: 0.12, desc: "+12% MAG. Trained in the ways of metaphysic mana." },
    { id: "bo5", name: "Soul Resonance", cost: 2, lv: 25, stat: "atk", v: 0.15, desc: "+15% ATK. Emzi and Uchita's souls resonate." },
  ] },
];

// Awakenings: defeating these floor bosses permanently empowers Emzi, following his arc in the book.
const AWAKENINGS = [
  { floor: 25,  name: "Volt Alchemist",   v: 0.10, aura: "#5ca8ff", desc: "His second affinity awakens. Volt mana answers alongside metaphysic." },
  { floor: 50,  name: "Draconic Bond",    v: 0.20, aura: "#ffd400", desc: "Emzi's mana melds with Syon's through the draconic bonding ritual." },
  { floor: 75,  name: "Vessel of Uchita", v: 0.30, aura: "#b07cff", desc: "Uchita's soul resonates fully. Purple metaphysic mana blooms at will." },
  { floor: 100, name: "Sibyl Unbound",    v: 0.45, aura: "#ff2bd6", desc: "The Fallen Sibyl stands at the summit and refuses to let the devourer transcend." },
];

// Mini-boss families by area index.
const MINIONS = [
  ["Demoniac Hound", "Demoniac Brute", "Feral Labit"],
  ["Hauris Enforcer", "Stone Gargoyle", "Fear Warden"],
  ["Tide Stalker", "Cove Siren", "Coral Golem"],
  ["Frost Wraith", "Pagos Yeti", "Ice Revenant"],
  ["Hive Drone", "Hive Soldier", "Brood Mother's Spawn"],
  ["Aeonan Phantom", "Ravager", "Year-687 Echo"],
  ["Magnarian Elite", "Crimson-clad Warrior", "Magnar Lancer"],
  ["Crimson Leech", "Blood Revenant", "Malevolent Husk"],
  ["Lythara Thorn", "Devout Cog", "Discombobulated Devout"],
  ["Mana Leech", "Membrane Crawler", "Halo Fragment"],
];

// Named floor bosses on landmark floors; other floors get a generated area guardian.
const NAMED_BOSSES = {
  10: { name: "Argonne the Lancer", look: { kind: "knight", body: "#8a8f9a", accent: "#c7a45a", eye: "#ff5d6c" } },
  20: { name: "Herva, Lord of Fear", look: { kind: "knight", body: "#3a3340", accent: "#c9b8ff", eye: "#ff5d6c" } },
  25: { name: "Zorre the Tendril Caster", look: { kind: "wraith", body: "#2a1a3a", accent: "#a78bfa", eye: "#ff6ad5" } },
  40: { name: "The Frigid Colossus", look: { kind: "beast", body: "#c9d6e6", accent: "#4fb6ff", eye: "#1f3a6b" } },
  50: { name: "The Crimson Malevolence", look: { kind: "wraith", body: "#6b0f1f", accent: "#ff5d6c", eye: "#f2c14e" } },
  60: { name: "Devrath the Despot", look: { kind: "knight", body: "#1a1430", accent: "#a78bfa", eye: "#f2c14e" } },
  75: { name: "The Darkest Malevolence", look: { kind: "wraith", body: "#0b0b12", accent: "#ff5d6c", eye: "#ff5d6c" } },
  90: { name: "Erebus, the Progenitor", look: { kind: "beast", body: "#16342b", accent: "#4ade9a", eye: "#f2c14e" } },
  100: { name: "The Haloed Devourer", look: { kind: "devourer", body: "#f4f1e8", accent: "#38d6c4", eye: "#ff5d6c" } },
};

const RARITY = {
  common:    { name: "Common",    w: 60, c: "#9fb0c6", mult: 1 },
  rare:      { name: "Rare",      w: 28, c: "#4fb6ff", mult: 1.6 },
  epic:      { name: "Epic",      w: 10, c: "#a78bfa", mult: 2.5 },
  legendary: { name: "Legendary", w: 2,  c: "#f2c14e", mult: 4 },
};

// Gear sets: matching pieces give bonuses. Sets start dropping from their floor onward.
const GEAR_SETS = {
  bastion:   { name: "Bastion",      from: 1,  pieces: { weapon: "Bastion Blade", armor: "Bastion Mail", charm: "Bastion Sigil" },
               two: { stat: "def", v: 0.10, label: "+10% DEF" }, three: { stat: "hp", v: 0.15, label: "+15% max HP" } },
  frost:     { name: "Frost Family", from: 21, pieces: { weapon: "Frost-forged Saber", armor: "Frost Family Coat", charm: "Frost Locket" },
               two: { stat: "mag", v: 0.10, label: "+10% MAG" }, three: { stat: "mag", v: 0.15, label: "+15% MAG" } },
  magnarian: { name: "Magnarian",    from: 41, pieces: { weapon: "Magnarian Edge", armor: "Magnarian Plate", charm: "Magnarian Crest" },
               two: { stat: "atk", v: 0.10, label: "+10% ATK" }, three: { stat: "crit", v: 0.08, label: "+8% crit chance" } },
  wellspring:{ name: "Wellspring",   from: 71, pieces: { weapon: "Sibyl's Fang", armor: "Halo-ward Mantle", charm: "Wellspring Drop" },
               two: { stat: "mp", v: 0.15, label: "+15% max MP" }, three: { stat: "all", v: 0.10, label: "+10% ATK, MAG and HP" } },
};
const GEAR_NAMES = {
  weapon: ["Wooden Sword", "Aegis Edge", "Moonwane Sword"],
  armor:  ["Padded Tunic", "Sanctum Robe", "Crimson Weave"],
  charm:  ["Vulpine Charm", "Starlit Locket", "Origin Sigil"],
};
const MAX_UPGRADE = 10;


const GIFTS = ["Sweet bun from Astercove", "Polished whetstone", "Pagos snow lily", "Book of Aeonan rites", "Sacred vulpine figurine"];

// [name, category, difficulty, unit, starting target, options]. Quests with a unit ask how much
// you did and raise their target when you keep hitting it. Options: perWeek = times a week
// (optional on any given day), days = weekdays it applies (0 = Sunday).
const DEFAULT_QUESTS = [
  ["Gym session", "exercise", "B", "", 0, { perWeek: 2, kind: "gym" }],
  ["Swim session", "exercise", "B", "laps", 20, { perWeek: 2 }],
  ["Keep my Duolingo streak", "language", "C", "", 0],
  ["Play on Switch 2", "mind", "E", "", 0],
  ["Animal fact", "mind", "E", "", 0, { optional: true, kind: "fact", facts: "animal" }],
  ["Obscure fact", "mind", "E", "", 0, { optional: true, kind: "fact", facts: "obscure" }],
  ["Write Konqord", "work", "B", "min", 45],
  ["Eat my Calo meals", "food", "C", "", 0, { days: [1, 2, 3, 4, 5], kind: "calo" }],
  ["Healthy meals at home", "food", "C", "", 0, { days: [0, 6] }],
  ["Drink water", "food", "E", "glasses", 8],
  ["Watch an episode of anime", "watch", "D", "episodes", 1],
  ["Message a friend", "social", "E", "", 0],
  ["Say something positive about myself", "social", "E", "", 0],
  ["Beeyo time", "beeyo", "B", "min", 60, { optional: true, kind: "beeyo" }],
];

// Facts for the fact quests: one new fact per tap, never repeating until all have been read.
const FACTS = {
  animal: [
    "Octopuses have three hearts and blue, copper-based blood.",
    "A group of flamingos is called a flamboyance.",
    "Sea otters hold hands while they sleep so they don't drift apart.",
    "Wombats produce cube-shaped poop, which helps it stay put when they mark territory.",
    "Elephants can recognise themselves in a mirror, one of very few animals that can.",
    "A shrimp's heart is located in its head.",
    "Crows can recognise individual human faces and remember them for years.",
    "Axolotls can regrow lost limbs, and even parts of their heart and brain.",
    "Koala fingerprints are so similar to human ones that they could confuse a crime scene.",
    "Tardigrades, tiny 'water bears', have survived exposure to the vacuum of space.",
    "Male seahorses carry the eggs and give birth to their young.",
    "Honeybees tell each other where flowers are with a 'waggle dance'.",
    "Owls can't move their eyes in their sockets, so they turn their heads up to about 270 degrees instead.",
    "Dolphins use signature whistles that work like names for each other.",
    "Pistol shrimp snap their claws so fast the collapsing bubble briefly gets nearly as hot as the surface of the sun.",
    "Giraffes have the same number of neck vertebrae as humans: seven.",
    "Polar bears have black skin under their see-through fur.",
    "Ravens in experiments have saved tools to use later, showing they can plan ahead.",
    "Cats spend about two-thirds of their lives asleep.",
    "Starfish have no brain and no blood.",
    "Butterflies taste with sensors on their feet.",
    "A group of owls is called a parliament.",
    "Mantis shrimp have up to 16 kinds of colour receptors. Humans have three.",
    "Gentoo penguins offer pebbles to their partners to build a nest together.",
    "Rats make ultrasonic 'laughing' chirps when they're tickled.",
    "Squirrels plant thousands of trees by forgetting where they buried their nuts.",
    "The 'immortal jellyfish' can turn back into its juvenile form when stressed or injured.",
    "Cows form close friendships and get stressed when they're separated from their favourite companions.",
    "Hummingbirds can fly backwards, and their hearts can beat over 1,000 times a minute.",
    "A snow leopard can't roar. It chuffs, mews and growls instead.",
  ],
  obscure: [
    "Oxford University was already teaching students before the Aztec Empire was founded.",
    "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.",
    "Honey found in ancient Egyptian tombs was still edible thousands of years later.",
    "Botanically, bananas are berries but strawberries are not.",
    "A day on Venus is longer than a year on Venus.",
    "The Eiffel Tower grows about 15 cm taller in summer as its iron expands.",
    "There are more possible games of chess than atoms in the observable universe.",
    "Scotland's national animal is the unicorn.",
    "Some of the ashes of the man who designed the Pringles can were buried in a Pringles can.",
    "Sharks have existed for longer than trees.",
    "The shortest war in history, between Britain and Zanzibar in 1896, lasted about 38 minutes.",
    "Nintendo was founded in 1889 as a playing-card company.",
    "The word 'nerd' first appeared in print in a 1950 Dr. Seuss book, If I Ran the Zoo.",
    "The dot over a lowercase i or j is called a tittle.",
    "Duolingo's green owl mascot is named Duo.",
    "A teaspoon of neutron star material would weigh billions of tonnes.",
    "One of the oldest surviving anime films, Namakura Gatana, dates from 1917.",
    "The Japanese word tsundoku means buying books and letting them pile up unread.",
    "At its triple point, water can boil and freeze at the same time.",
    "Mount Everest still grows by a few millimetres every year.",
    "The Great Wall of China is not visible to the naked eye from the Moon.",
    "The Hundred Years' War actually lasted 116 years.",
    "There's a village in Norway called Hell, and it freezes over most winters.",
    "Lightning strikes the Earth roughly 40 to 50 times every second.",
    "Google's original name was BackRub.",
    "Tolkien invented his Elvish languages first, then wrote Middle-earth as a place for them to live.",
    "Kintsugi is the Japanese art of repairing broken pottery with gold, treating the cracks as part of its story.",
    "The inventor of the frisbee was turned into a frisbee after he died. Some of his ashes were moulded into discs.",
    "Octothorpe is one official name for the # symbol.",
    "The first computer 'bug' was a real moth found stuck in a Harvard computer in 1947.",
  ],
};

// Calo delivers three meals on weekdays; the Calo quest clears once all three are logged.
const CALO_SLOTS = ["Breakfast", "Snack", "Lunch"];

const UNITS = ["", "reps", "min", "km", "m", "words", "pages", "glasses", "sessions", "lessons", "episodes", "laps"];

// Scaling: hit the target on SCALE_HITS of the last SCALE_WINDOW logs and the target rises ~10%.
const SCALE_WINDOW = 7, SCALE_HITS = 5;

// Same-day battle buffs from real quests cleared today.
const CAT_BUFFS = {
  exercise: { stat: "atk", v: 0.15, label: "+15% ATK" },
  food:     { stat: "hp",  v: 0.15, label: "+15% max HP" },
  language: { stat: "mag", v: 0.15, label: "+15% MAG" },
  work:     { stat: "mp",  v: 0.20, label: "+20% max MP" },
  mind:     { stat: "crit", v: 0.06, label: "+6% crit chance" },
  watch:    { stat: "eva", v: 0.05, label: "+5% evasion" },
  social:   { stat: "def", v: 0.10, label: "+10% DEF" },
  beeyo:    { stat: "all", v: 0.08, label: "+8% ATK, MAG, HP" },
};

// Titles earned from lifetime real quests in one category. Every earned title's perk is always on.
const LIFE_TITLES = [
  { id: "student",    name: "Student of Tongues", cat: "language", need: 25,  stat: "mag",  v: 0.03 },
  { id: "polyglot",   name: "Polyglot",           cat: "language", need: 100, stat: "mag",  v: 0.08 },
  { id: "trainee",    name: "Bastion Trainee",    cat: "exercise", need: 25,  stat: "atk",  v: 0.03 },
  { id: "ironbody",   name: "Iron Body",          cat: "exercise", need: 100, stat: "atk",  v: 0.08 },
  { id: "tactician",  name: "Tactician",          cat: "mind",     need: 25,  stat: "crit", v: 0.02 },
  { id: "strategist", name: "Grand Strategist",   cat: "mind",     need: 100, stat: "crit", v: 0.05 },
  { id: "observer",   name: "Observer",           cat: "watch",    need: 25,  stat: "eva",  v: 0.02 },
  { id: "seer",       name: "Seer of Konqord",    cat: "watch",    need: 100, stat: "eva",  v: 0.04 },
  { id: "diligent",   name: "Storyteller",           cat: "work",     need: 25,  stat: "mp",   v: 0.05 },
  { id: "workhorse",  name: "Chronicler of Konqord",    cat: "work",     need: 100, stat: "mp",   v: 0.12 },
  { id: "nourished",  name: "Well Nourished",     cat: "food",     need: 25,  stat: "hp",   v: 0.03 },
  { id: "cleanfuel",  name: "Clean Fuel",         cat: "food",     need: 100, stat: "hp",   v: 0.08 },
  { id: "friend",     name: "Good Friend",        cat: "social",   need: 25,  stat: "def",  v: 0.04 },
  { id: "unshakable", name: "Unshakable",         cat: "social",   need: 100, stat: "def",  v: 0.10 },
];

// Default weekly goals: number of quests cleared per category.
const DEFAULT_GOALS = { exercise: 4, language: 7, mind: 5, watch: 4, work: 5, food: 14, social: 10, beeyo: 5 };

// Beeyo time: EXP grows with time together but levels off, peaking at about an hour.
const BEEYO_PEAK_MIN = 60, BEEYO_MAX = { xp: 90, g: 45, en: 15 };
const beeyoFactor = min => Math.sqrt(Math.min(Math.max(min, 0), BEEYO_PEAK_MIN) / BEEYO_PEAK_MIN);

// Placeholder look; the draft mentions purple eyes and floral-scented hair. Replace with sprites/beeyo.png.
const BEEYO_LOOK = { hair: "#3a2430", style: "long", skin: "#f1d2b8", eyes: "#9b5cff", outfit: "#e8a0c8", accent: "#fff2f8", legs: "#5a3a4a", weapon: "none" };

// Scenes with Beeyo, unlocked by total real minutes spent together. New moments written for the game.
const BEEYO_SCENES = [
  { at: 30, title: "Before the First Floor", lines: [
    ["Beeyo", "You're really going up there? All hundred floors?"],
    ["Emzi", "One floor at a time. That's the only way I know how."],
    ["Beeyo", "Then take this. It's not armor. Just something to remember the way back down."],
    ["Emzi", "A ribbon? …It smells like your hair. Flowers."],
    ["Beeyo", "So you can't forget me, even in the dark."] ] },
  { at: 120, title: "Campfire in the Sanctum", lines: [
    ["Beeyo", "You hum when you sharpen your sword. Did you know that?"],
    ["Emzi", "I do not."],
    ["Beeyo", "You do. Off-key, too. It's my favorite sound in this whole place."],
    ["Emzi", "Then I'll keep humming. Badly. Just for you."] ] },
  { at: 240, title: "Market Day in Hauris", lines: [
    ["Beeyo", "Everyone here walks like they're afraid of the walls."],
    ["Emzi", "A city governed by fear. But you're smiling anyway."],
    ["Beeyo", "Because you bought me a sweet bun and pretended it was for you."],
    ["Emzi", "…It was for me. I just wasn't hungry."],
    ["Beeyo", "Liar. Thank you."] ] },
  { at: 420, title: "Tide Pools of Astercove", lines: [
    ["Beeyo", "Look, the water glows when you touch it."],
    ["Emzi", "Mana in the shallows. It reacts to warmth."],
    ["Beeyo", "Then it should be glowing like the sun around you."],
    ["Emzi", "That's the worst line I've ever heard. Say it again."] ] },
  { at: 600, title: "Snow on the Pagos Pass", lines: [
    ["Emzi", "Your hands are freezing. Here."],
    ["Beeyo", "Now yours will be cold."],
    ["Emzi", "Frost runs in my blood now. I'll manage."],
    ["Beeyo", "Then I'll be the one thing up here that keeps you warm."] ] },
  { at: 900, title: "The Quiet Between Battles", lines: [
    ["Beeyo", "You never talk about what you see on the higher floors."],
    ["Emzi", "Because when I'm here, I don't want to be there."],
    ["Beeyo", "You can carry it here too. I'm not fragile."],
    ["Emzi", "…No. You're the strongest one in this story."] ] },
  { at: 1200, title: "Stars Over Aeona", lines: [
    ["Beeyo", "If you reach the top, what will you wish for?"],
    ["Emzi", "I thought about that. I keep coming back to the same answer."],
    ["Beeyo", "Which is?"],
    ["Emzi", "This. Exactly this. Over and over."] ] },
  { at: 1800, title: "A Promise at the Wellspring", lines: [
    ["Beeyo", "Whatever's waiting at floor one hundred…"],
    ["Emzi", "I'll come back down. I always do."],
    ["Beeyo", "Promise me with your whole chest. Not the hero voice."],
    ["Emzi", "I promise, Beeyo. Every floor I climb, I climb back to you."] ] },
];

// Anime picks to try. Episode counts cover the seasons out so far.
const ANIME_PICKS = [
  { id: "frieren",    title: "Frieren: Beyond Journey's End", eps: 28, why: "Quiet, beautiful fantasy about an elf mage after the hero's party has already won. Great fuel for a fantasy writer." },
  { id: "dungeon",    title: "Delicious in Dungeon",          eps: 24, why: "A dungeon party cooks the monsters they fight. Funny, with very clever worldbuilding." },
  { id: "sololeveling", title: "Solo Leveling",               eps: 25, why: "The weakest hunter levels up through a mysterious System. The inspiration for this app." },
  { id: "dandadan",   title: "Dandadan",                      eps: 24, why: "Aliens, ghosts and romance at full speed. Chaotic and very fun." },
  { id: "mob",        title: "Mob Psycho 100",                eps: 37, why: "An overpowered psychic kid with a huge heart, and some of the best fight animation around." },
  { id: "apothecary", title: "The Apothecary Diaries",        eps: 48, why: "Palace mysteries solved by a sharp, sarcastic herbalist." },
  { id: "vinland",    title: "Vinland Saga",                  eps: 48, why: "A Viking revenge story that turns into something much deeper." },
  { id: "fmab",       title: "Fullmetal Alchemist: Brotherhood", eps: 64, why: "Two brothers, alchemy and a world-ending conspiracy. One of the best endings in anime." },
];

const DEFAULT_REWARDS = [
  ["One episode of a show, guilt-free", 40],
  ["Gaming session (1 hour)", 80],
  ["Cheat meal", 150],
  ["Buy something from the wishlist", 600],
];
