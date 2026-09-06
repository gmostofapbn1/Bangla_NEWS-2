import type { Category, Outlet } from "./types";

/**
 * Canonical directory dataset.
 *
 * Used in two ways:
 *  1. Runtime fallback — when Supabase env vars are absent, queries serve this
 *     data so the site renders fully out-of-the-box (read-only).
 *  2. Seed source — `scripts/gen-seed.ts` turns this into supabase/seed.sql.
 *
 * URLs are best-effort official links; logos are placeholders. Everything here
 * is editable from /admin once Supabase is connected.
 */

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const CATEGORIES: Category[] = [
  {
    slug: "online-portals",
    title: "Top Online Bangla News Portals",
    title_bn: "অনলাইন বাংলা নিউজ পোর্টাল",
    description:
      "The most-read online news portals in Bangla. Since the nineties, online portals have become the fastest way Bengali-speaking readers follow breaking news, worldwide and at home.",
    section_type: "outlet_grid",
    group: "portals",
    sort_order: 10,
    home: true,
  },
  {
    slug: "national-newspapers",
    title: "All Bangla Daily Newspapers",
    title_bn: "সকল বাংলা দৈনিক পত্রিকা",
    description:
      "Since 1818, Bangla daily newspapers have grown in reach and reputation. This is the full index of national dailies covering politics, business, sport and culture 24/7.",
    section_type: "outlet_grid",
    group: "newspapers",
    sort_order: 20,
    home: true,
  },
  {
    slug: "local-newspaper",
    title: "Local Newspaper by Division",
    title_bn: "বিভাগভিত্তিক স্থানীয় পত্রিকা",
    description:
      "Bangladesh has eight divisions — Dhaka, Mymensingh, Sylhet, Chattogram, Rangpur, Khulna, Rajshahi and Barisal. Each has its own regional newspapers reporting local news around the clock.",
    section_type: "division_grid",
    group: "regional",
    sort_order: 30,
    home: true,
  },
  {
    slug: "tv-news",
    title: "Bangla TV News Channels",
    title_bn: "বাংলা টিভি নিউজ চ্যানেল",
    description:
      "The most-watched Bangla television news channels — live news, talk shows and breaking coverage from Bangladesh's leading broadcasters.",
    section_type: "outlet_grid",
    group: "tv",
    sort_order: 35,
    home: true,
  },
  {
    slug: "fm-radio",
    title: "Top Bangla FM Radio",
    title_bn: "শীর্ষ বাংলা এফএম রেডিও",
    description:
      "FM radio is a popular medium for young Bengali listeners — entertainment, music and news. These stations broadcast in Bangla from across Bangladesh.",
    section_type: "outlet_grid",
    group: "radio",
    sort_order: 40,
    home: true,
  },
  {
    slug: "government-portals",
    title: "Bangladesh Government Portals",
    title_bn: "বাংলাদেশ সরকারি পোর্টাল",
    description:
      "Official government web portals of Bangladesh — the national portal and the ministries that publish public services, notices and information.",
    section_type: "outlet_grid",
    group: "government",
    sort_order: 50,
    home: true,
  },
  {
    slug: "job-portals",
    title: "Popular Bangla Job Sites",
    title_bn: "জনপ্রিয় চাকরির সাইট",
    description:
      "Job portals connect employers and job seekers. These are the most popular Bangladeshi job sites for finding work or hiring staff.",
    section_type: "outlet_grid",
    group: "jobs",
    sort_order: 60,
    home: true,
  },
  {
    slug: "english-newspapers",
    title: "Bangladeshi English Newspapers",
    title_bn: "বাংলাদেশি ইংরেজি সংবাদপত্র",
    description:
      "Leading English-language daily newspapers published from Bangladesh, widely read at home and by the diaspora.",
    section_type: "outlet_grid",
    group: "english",
    sort_order: 70,
    home: true,
  },
  {
    slug: "stock-market",
    title: "Stock Market News",
    title_bn: "শেয়ার বাজার সংবাদ",
    description:
      "Stock market and business news sources covering the Dhaka and Chittagong exchanges, listed companies and the wider economy.",
    section_type: "outlet_grid",
    group: "stock",
    sort_order: 80,
    home: true,
  },
  {
    slug: "assam-newspapers",
    title: "Best Assam Newspapers",
    title_bn: "আসামের সেরা সংবাদপত্র",
    description:
      "Assam, India is home to many Bengali-speaking readers. These well-known Assamese newspapers have a long history and wide readership.",
    section_type: "outlet_grid",
    group: "assam",
    sort_order: 90,
    home: true,
  },
  {
    slug: "epaper",
    title: "Bangla ePaper Editions",
    title_bn: "বাংলা ই-পেপার",
    description:
      "Digital replica ePaper editions of the major Bangla dailies — read the printed paper online, page by page.",
    section_type: "outlet_grid",
    group: "epaper",
    sort_order: 100,
    home: true,
  },
  {
    slug: "international-newspapers",
    title: "International Newspapers",
    title_bn: "আন্তর্জাতিক সংবাদপত্র",
    description:
      "Major international newspapers and global news sources in one place.",
    section_type: "outlet_grid",
    group: "international",
    sort_order: 95,
    home: false,
  },

  // Divisions (children of local-newspaper)
  { slug: "dhaka-division", title: "Dhaka Division", title_bn: "ঢাকা বিভাগ", section_type: "outlet_grid", group: "regional", parent_slug: "local-newspaper", sort_order: 1, accent: "#E8A100" },
  { slug: "mymensingh-division", title: "Mymensingh Division", title_bn: "ময়মনসিংহ বিভাগ", section_type: "outlet_grid", group: "regional", parent_slug: "local-newspaper", sort_order: 2, accent: "#E86FB0" },
  { slug: "sylhet-division", title: "Sylhet Division", title_bn: "সিলেট বিভাগ", section_type: "outlet_grid", group: "regional", parent_slug: "local-newspaper", sort_order: 3, accent: "#DB4A24" },
  { slug: "chattogram-division", title: "Chattogram Division", title_bn: "চট্টগ্রাম বিভাগ", section_type: "outlet_grid", group: "regional", parent_slug: "local-newspaper", sort_order: 4, accent: "#2BB6C9" },
  { slug: "rangpur-division", title: "Rangpur Division", title_bn: "রংপুর বিভাগ", section_type: "outlet_grid", group: "regional", parent_slug: "local-newspaper", sort_order: 5, accent: "#7BC043" },
  { slug: "khulna-division", title: "Khulna Division", title_bn: "খুলনা বিভাগ", section_type: "outlet_grid", group: "regional", parent_slug: "local-newspaper", sort_order: 6, accent: "#B57BE0" },
  { slug: "rajshahi-division", title: "Rajshahi Division", title_bn: "রাজশাহী বিভাগ", section_type: "outlet_grid", group: "regional", parent_slug: "local-newspaper", sort_order: 7, accent: "#4AA3DB" },
  { slug: "barisal-division", title: "Barisal Division", title_bn: "বরিশাল বিভাগ", section_type: "outlet_grid", group: "regional", parent_slug: "local-newspaper", sort_order: 8, accent: "#1E7BA8" },
];

type Seed = [name: string, url: string, featured?: boolean, name_bn?: string];

function build(categorySlug: string, seeds: Seed[]): Outlet[] {
  return seeds.map(([name, url, featured, name_bn], i) => ({
    id: `${categorySlug}__${slugify(name)}`,
    slug: slugify(name),
    category_slug: categorySlug,
    name,
    url,
    name_bn: name_bn ?? null,
    logo_url: null,
    description: null,
    is_featured: !!featured,
    sort_order: i,
    click_count: 0,
    is_active: true,
  }));
}

export const OUTLETS: Outlet[] = [
  ...build("online-portals", [
    ["bdnews24", "https://bdnews24.com", true, "বিডিনিউজ২৪"],
    ["Jagonews24", "https://www.jagonews24.com", true, "জাগোনিউজ২৪"],
    ["Bangla News 24", "https://www.banglanews24.com", true, "বাংলানিউজ২৪"],
    ["Bangla Tribune", "https://www.banglatribune.com", true, "বাংলা ট্রিবিউন"],
    ["Risingbd", "https://www.risingbd.com", true],
    ["BBC Bangla", "https://www.bbc.com/bengali", true, "বিবিসি বাংলা"],
    ["Dhaka Post", "https://www.dhakapost.com", true, "ঢাকা পোস্ট"],
    ["Dhaka Times", "https://www.dhakatimes24.com", true, "ঢাকা টাইমস"],
    ["Amader Shomoy", "https://www.dainikamadershomoy.com", true, "আমাদের সময়"],
    ["BD Cric Time", "https://bdcrictime.com", true],
    ["Probashir Diganta", "https://probashirdiganta.com", false, "প্রবাসীর দিগন্ত"],
    ["DW Bangla", "https://www.dw.com/bn", false],
    ["Dainik Shiksha", "https://www.dainikshiksha.com", false, "দৈনিক শিক্ষা"],
    ["Barta24", "https://barta24.com", false, "বার্তা২৪"],
    ["MTnews24", "https://mtnews24.com", false],
    ["Medi Voice", "https://medivoicebd.com", false, "মেডি ভয়েস"],
    ["Our Islam", "https://ourislam24.com", false],
    ["Sara Bangla", "https://sarabangla.net", false, "সারাবাংলা"],
    ["VOA Bangla", "https://www.voabangla.com", false],
    ["Somoyer Konthosor", "https://www.somoyerkonthosor.com", false, "সময়ের কণ্ঠস্বর"],
    ["Shiksha Barta", "https://shikshabarta.com", false, "শিক্ষা বার্তা"],
    ["Sonali News", "https://www.sonalinews.com", false, "সোনালী নিউজ"],
    ["BD24Live", "https://www.bd24live.com", false],
    ["Barta Bazar", "https://bartabazar.com", false, "বার্তা বাজার"],
    ["Dhaka Today", "https://www.dhakatoday.com", false, "ঢাকা টুডে"],
  ]),

  ...build("national-newspapers", [
    ["Prothom Alo", "https://www.prothomalo.com", true, "প্রথম আলো"],
    ["Kaler Kantho", "https://www.kalerkantho.com", true, "কালের কণ্ঠ"],
    ["Jugantor", "https://www.jugantor.com", true, "যুগান্তর"],
    ["Bangladesh Pratidin", "https://www.bd-pratidin.com", true, "বাংলাদেশ প্রতিদিন"],
    ["Samakal", "https://samakal.com", true, "সমকাল"],
    ["The Daily Ittefaq", "https://www.ittefaq.com.bd", false, "দৈনিক ইত্তেফাক"],
    ["Daily Janakantha", "https://www.dailyjanakantha.com", false, "দৈনিক জনকণ্ঠ"],
    ["Kal Bela", "https://www.kalbela.com", false, "কালবেলা"],
    ["Jaijaidin", "https://www.jaijaidinbd.com", false, "যায়যায়দিন"],
    ["The Daily Star Bangla", "https://bangla.thedailystar.net", false, "দ্য ডেইলি স্টার বাংলা"],
    ["Desh Rupantor", "https://www.deshrupantor.com", false, "দেশ রূপান্তর"],
    ["Ajker Patrika", "https://www.ajkerpatrika.com", false, "আজকের পত্রিকা"],
    ["Amar Sangbad", "https://www.amarsangbad.com", false, "আমার সংবাদ"],
    ["Dainik Bangla", "https://www.dainikbangla.com.bd", false, "দৈনিক বাংলা"],
    ["Protidiner Sangbad", "https://www.protidinersangbad.com", false, "প্রতিদিনের সংবাদ"],
    ["Daily Ajker Darpon", "https://dainikajkerdarpan.com", false, "আজকের দর্পণ"],
    ["Bangladesh Journal", "https://www.bd-journal.com", false, "বাংলাদেশ জার্নাল"],
    ["Alokito Bangladesh", "https://www.alokitobangladesh.com", false, "আলোকিত বাংলাদেশ"],
    ["The Sangbad", "https://sangbad.net.bd", false, "সংবাদ"],
    ["Daily Manobkantha", "https://www.manobkantha.com.bd", false, "মানবকণ্ঠ"],
    ["Ajkaler Khobor", "https://www.ajkalerkhabor.com", false, "আজকালের খবর"],
    ["Daily Sangram", "https://dailysangram.com", false, "সংগ্রাম"],
    ["Protidiner Bangladesh", "https://www.protidinerbangladesh.com", false, "প্রতিদিনের বাংলাদেশ"],
    ["Sokaler Somoy", "https://www.shokalersomoy.com", false, "সকালের সময়"],
    ["Bonik Barta", "https://bonikbarta.com", false, "বণিক বার্তা"],
    ["Naya Diganta", "https://www.dailynayadiganta.com", false, "নয়া দিগন্ত"],
    ["Manab Zamin", "https://mzamin.com", false, "মানবজমিন"],
    ["Daily Inqilab", "https://www.dailyinqilab.com", false, "দৈনিক ইনকিলাব"],
    ["Bhorer Kagoj", "https://www.bhorerkagoj.com", false, "ভোরের কাগজ"],
  ]),

  ...build("tv-news", [
    ["Somoy TV", "https://www.somoynews.tv", true, "সময় টিভি"],
    ["Jamuna TV", "https://jamuna.tv", true, "যমুনা টিভি"],
    ["Channel 24", "https://www.channel24bd.tv", true, "চ্যানেল ২৪"],
    ["DBC News", "https://www.dbcnews.tv", true, "ডিবিসি নিউজ"],
    ["Ekattor TV", "https://ekattor.tv", true, "একাত্তর টিভি"],
    ["NTV", "https://www.ntvbd.com", false, "এনটিভি"],
    ["Channel i", "https://www.channelionline.com", false, "চ্যানেল আই"],
    ["ATN News", "https://www.atnnewstv.com", false, "এটিএন নিউজ"],
    ["RTV", "https://www.rtvonline.com", false, "আরটিভি"],
    ["Independent TV", "https://www.itvbd.com", false, "ইন্ডিপেন্ডেন্ট টিভি"],
    ["News24", "https://www.news24bd.tv", false, "নিউজ২৪"],
    ["Bangla Vision", "https://www.banglavision.tv", false, "বাংলাভিশন"],
  ]),

  ...build("fm-radio", [
    ["Radio Today 89.6", "https://www.radiotoday.fm", true],
    ["Jago FM 94.4", "https://www.jagofm.com", true],
    ["Radio Capital 94.8", "https://www.radiocapital.com.bd", true],
    ["Radio Shadhin 92.4", "https://www.radioshadhin.com", true],
    ["Peoples Radio 91.6", "https://www.peoplesradio.com.bd", true],
    ["Radio Dhoni 91.2", "https://www.radiodhoni.com", false],
    ["Radio Foorti 88.0", "https://www.radiofoorti.fm", false],
    ["BBC Bangla Radio", "https://www.bbc.com/bengali", false, "বিবিসি বাংলা রেডিও"],
    ["Spice FM 96.4", "https://www.spicefmbd.com", false],
    ["Dhaka FM 90.4", "https://www.dhakafm.com.bd", false],
  ]),

  ...build("government-portals", [
    ["Bangladesh National Portal", "https://bangladesh.gov.bd", true, "বাংলাদেশ জাতীয় তথ্য বাতায়ন"],
    ["Ministry of Finance", "https://mof.gov.bd", true, "অর্থ মন্ত্রণালয়"],
    ["Ministry of Science & Technology", "https://most.gov.bd", false, "বিজ্ঞান ও প্রযুক্তি মন্ত্রণালয়"],
    ["Ministry of Food", "https://mofood.gov.bd", false, "খাদ্য মন্ত্রণালয়"],
    ["Ministry of Industries", "https://moind.gov.bd", false, "শিল্প মন্ত্রণালয়"],
    ["Ministry of Education", "https://moedu.gov.bd", false, "শিক্ষা মন্ত্রণালয়"],
    ["Ministry of Health & Family Welfare", "https://mohfw.gov.bd", false, "স্বাস্থ্য মন্ত্রণালয়"],
    ["Ministry of Home Affairs", "https://mha.gov.bd", false, "স্বরাষ্ট্র মন্ত্রণালয়"],
    ["Ministry of Foreign Affairs", "https://mofa.gov.bd", false, "পররাষ্ট্র মন্ত্রণালয়"],
    ["Ministry of Agriculture", "https://moa.gov.bd", false, "কৃষি মন্ত্রণালয়"],
  ]),

  ...build("job-portals", [
    ["BD Jobs", "https://www.bdjobs.com", true],
    ["Bikroy Jobs", "https://bikroy.com/en/jobs", true],
    ["BDJobs.com.bd", "https://bdjobs.com.bd", true],
    ["BD Jobs Today", "https://www.bdjobstoday.com", false],
    ["Chakri Khobor", "https://chakrirkhobor.net", false, "চাকরির খবর"],
    ["Skill Jobs", "https://skill.jobs", false],
    ["NRB Jobs", "https://www.nrbjobs.com", false],
    ["Job.com.bd", "https://job.com.bd", false],
    ["Careerjet", "https://www.careerjet.com.bd", false],
    ["Shomvob", "https://shomvob.co", false],
    ["My Jobs", "https://myjobs.com.bd", false],
    ["eJobs", "https://ejobsbd.com", false],
  ]),

  ...build("english-newspapers", [
    ["The Daily Star", "https://www.thedailystar.net", true],
    ["The Business Standard", "https://www.tbsnews.net", true],
    ["Dhaka Tribune", "https://www.dhakatribune.com", true],
    ["New Age", "https://www.newagebd.net", false],
    ["The Financial Express", "https://thefinancialexpress.com.bd", false],
    ["The Independent", "https://www.theindependentbd.com", false],
    ["Daily Sun", "https://www.daily-sun.com", false],
    ["The Daily Observer", "https://www.observerbd.com", false],
    ["Bangladesh Post", "https://bangladeshpost.net", false],
    ["The Daily Messenger", "https://www.dailymessenger.net", false],
  ]),

  ...build("stock-market", [
    ["Dhaka Stock Exchange", "https://dsebd.org", true],
    ["Chittagong Stock Exchange", "https://www.cse.com.bd", true],
    ["Bonik Barta", "https://bonikbarta.com", false, "বণিক বার্তা"],
    ["Share Biz", "https://sharebiz.net", false, "শেয়ার বিজ"],
    ["Arthosuchak", "https://arthosuchak.com", false, "অর্থসূচক"],
    ["The Business Standard", "https://www.tbsnews.net", false],
    ["Business Insider Bangladesh", "https://www.businessinsiderbd.com", false],
  ]),

  ...build("assam-newspapers", [
    ["Asomiya Pratidin", "https://www.asomiyapratidin.in", true, "অসমীয়া প্রতিদিন"],
    ["Niyomiya Barta", "https://niyomiyabarta.org", true, "নিয়মিয়া বার্তা"],
    ["Assam Tribune", "https://assamtribune.com", false],
    ["Ganaadhikar", "https://www.ganadhikar.in", false, "গণ অধিকার"],
    ["Nenow", "https://nenow.in", false],
  ]),

  ...build("epaper", [
    ["Prothom Alo ePaper", "https://epaper.prothomalo.com", true, "প্রথম আলো ই-পেপার"],
    ["Kaler Kantho ePaper", "https://epaper.kalerkantho.com", true, "কালের কণ্ঠ ই-পেপার"],
    ["Jugantor ePaper", "https://epaper.jugantor.com", true, "যুগান্তর ই-পেপার"],
    ["Ittefaq ePaper", "https://epaper.ittefaq.com.bd", false, "ইত্তেফাক ই-পেপার"],
    ["Samakal ePaper", "https://epaper.samakal.com", false, "সমকাল ই-পেপার"],
    ["Bangladesh Pratidin ePaper", "https://epaper.bd-pratidin.com", false, "বাংলাদেশ প্রতিদিন ই-পেপার"],
    ["Daily Star ePaper", "https://epaper.thedailystar.net", false],
    ["Manab Zamin ePaper", "https://mzamin.com/epaper", false, "মানবজমিন ই-পেপার"],
    ["Naya Diganta ePaper", "https://epaper.dailynayadiganta.com", false, "নয়া দিগন্ত ই-পেপার"],
    ["Janakantha ePaper", "https://epaper.dailyjanakantha.com", false, "জনকণ্ঠ ই-পেপার"],
  ]),

  // Regional / division local papers (best-effort; curate in admin)
  ...build("dhaka-division", [
    ["Dainik Dhakar Barta", "https://www.dhakarbarta.com"],
    ["Gazipur Barta", "https://gazipurbarta.com"],
    ["Narayanganj Times", "https://narayanganjtimes.com"],
    ["Tangail Somachar", "https://tangailsomachar.com"],
  ]),
  ...build("mymensingh-division", [
    ["Mymensingh Pratidin", "https://mymensinghpratidin.com"],
    ["Dainik Jahan", "https://dainikjahan.com"],
    ["Netrokona Barta", "https://netrokonabarta.com"],
  ]),
  ...build("sylhet-division", [
    ["Sylhet Today 24", "https://www.sylhettoday24.news"],
    ["Daily Sylhet", "https://dailysylhet.com"],
    ["Sylhet Mirror", "https://sylhetmirror.com"],
    ["Habiganj Barta", "https://habiganjbarta.com"],
  ]),
  ...build("chattogram-division", [
    ["Dainik Azadi", "https://dainikazadi.net"],
    ["Dainik Purbokone", "https://dainikpurbokone.net"],
    ["CTG News", "https://ctgnews.com"],
    ["Coxsbazar News", "https://coxsbazarnews.com"],
  ]),
  ...build("rangpur-division", [
    ["Dainik Dabanol", "https://dainikdabanol.com"],
    ["Rangpur Barta", "https://rangpurbarta.com"],
    ["Dinajpur Sangbad", "https://dinajpurnews.com"],
  ]),
  ...build("khulna-division", [
    ["Dainik Purbanchal", "https://dainikpurbanchal.com"],
    ["Khulna News", "https://khulnanews.com"],
    ["Jashore Barta", "https://jashorbarta.com"],
  ]),
  ...build("rajshahi-division", [
    ["Sonar Desh", "https://www.sonardesh.com"],
    ["Dainik Barta", "https://dainikbarta.net"],
    ["Rajshahi News", "https://rajshahinews24.com"],
    ["Natore Barta", "https://natorebarta.com"],
  ]),
  ...build("barisal-division", [
    ["Dainik Barishal Barta", "https://barishalbarta.com"],
    ["Barisal Khabor", "https://barisalkhabar.com"],
    ["Bhola News", "https://bholanews.com"],
  ]),
];

export function categoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function outletsByCategory(slug: string): Outlet[] {
  return OUTLETS.filter((o) => o.category_slug === slug).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

export function divisions(): Category[] {
  return CATEGORIES.filter((c) => c.parent_slug === "local-newspaper").sort(
    (a, b) => a.sort_order - b.sort_order,
  );
}
