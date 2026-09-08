import "server-only";

/**
 * Home page Q&A.
 *
 * One source for both the visible list and the FAQPage schema. They must not
 * drift: marking up an answer the page does not actually show is what gets
 * structured data ignored, or the site manually penalised.
 *
 * Every answer is grounded in what this directory actually holds — no
 * circulation figures or "most read" claims, which change constantly and would
 * be wrong within a year.
 */
export type Faq = { q: string; a: string };

export function homeFaqs(outletCount: number, categoryCount: number): Faq[] {
  return [
    {
      q: "What is All Newspaper List?",
      a: `All Newspaper List is a free directory of Bangladeshi media. It brings ${outletCount} newspapers, online news portals, ePapers, magazines, TV news channels, FM radio stations and job sites together in one place, sorted into ${categoryCount} categories, so you can reach any of them without searching for each one separately.`,
    },
    {
      q: "How many newspapers are on this newspaper list?",
      a: `The list currently holds ${outletCount} entries across ${categoryCount} categories, covering national Bangla dailies, English-language newspapers, online-only portals, ePaper editions, share-market papers, magazines, TV channels, FM radio and job sites, plus regional newspapers for all eight divisions of Bangladesh.`,
    },
    {
      q: "Can I read Bangladeshi newspapers online for free?",
      a: "Yes. Almost every Bangladeshi newspaper publishes a free website, and many also publish a free ePaper edition. Every link here goes straight to the publisher's own official site — this directory does not host, copy or paywall any newspaper content.",
    },
    {
      q: "What is a Bangla ePaper?",
      a: "An ePaper is the digital replica of the printed newspaper — the same pages, same layout and same articles as the physical edition, readable in a browser. It differs from a news website, which is updated continuously through the day rather than published once as a fixed daily edition.",
    },
    {
      q: "How do I find local newspapers from my own district?",
      a: "Open the Local Newspaper section, which groups regional titles by Bangladesh's eight administrative divisions — Dhaka, Chattogram, Rajshahi, Khulna, Barishal, Sylhet, Rangpur and Mymensingh. Pick your division to see the newspapers published in that region.",
    },
    {
      q: "Is All Newspaper List affiliated with any newspaper?",
      a: "No. It is an independent directory with no ownership, editorial or commercial connection to any publisher listed. Every entry links to that outlet's own official website, and inclusion is not an endorsement.",
    },
    {
      q: "How do I add a newspaper that is missing?",
      a: "Use the Submit Site page to send the outlet's name and official website address. Submissions are reviewed before they appear, so that every link on the list resolves to a genuine, working publisher.",
    },
  ];
}
