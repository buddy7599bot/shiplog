const { chromium } = require("playwright-core");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://jgnkfjyzabnrsfaiwfup.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnbmtmanl6YWJucnNmYWl3ZnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDEyNzgsImV4cCI6MjA4NTExNzI3OH0.yiiCne2hSKjO5FG2T6hnwl25nbsYxSmw6chNQwy4UQ8";

const EMAIL = "demo@shiplog.dev";
const PASS = "Demo1234!";

async function ensureUser() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
  // Try sign up, ignore if exists
  await sb.auth.signUp({ email: EMAIL, password: PASS });
  const { data } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASS });
  if (!data.session) {
    console.error("Auth failed - trying with existing account");
    const { data: d2 } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASS });
    if (!d2.session) throw new Error("Cannot authenticate demo user");
  }
  console.log("Demo user ready:", data.user?.id);
}

(async () => {
  await ensureUser();

  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium-browser",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: "/tmp/shiplog-rec2", size: { width: 1280, height: 720 } },
    colorScheme: "dark",
  });

  const page = await ctx.newPage();

  // 1. Landing page
  await page.goto("http://localhost:3099");
  await page.waitForTimeout(2500);

  // Scroll landing
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(1000);

  // 2. Go to login
  await page.goto("http://localhost:3099/login");
  await page.waitForTimeout(1500);

  // Fill login form
  const emailInput = page.locator('input[type="email"]').first();
  const passInput = page.locator('input[type="password"]').first();

  await emailInput.click();
  await emailInput.type(EMAIL, { delay: 40 });
  await page.waitForTimeout(300);
  await passInput.click();
  await passInput.type(PASS, { delay: 40 });
  await page.waitForTimeout(500);

  // Click login button
  const loginBtn = page.locator('button[type="submit"], button:has-text("Log In"), button:has-text("Sign In")').first();
  await loginBtn.click();
  await page.waitForTimeout(3000);

  // 3. Dashboard - add entries
  const entries = [
    { text: "Shipped ShipLog MVP with Supabase auth and public profiles", category: "launch" },
    { text: "Fixed stale closure bugs in React state updates", category: "bug" },
    { text: "Add streak tracking and activity heatmap to profiles", category: "idea" },
    { text: "Built full auth flow - signup, login, settings, public profiles", category: "build" },
    { text: "First working deploy on Vercel!", category: "win" },
  ];

  for (const entry of entries) {
    // Select category
    const catBtn = page.locator(`button:has-text("${getCatLabel(entry.category)}")`).first();
    if (await catBtn.isVisible().catch(() => false)) {
      await catBtn.click();
      await page.waitForTimeout(300);
    }

    // Type entry
    const textInput = page.locator('textarea, input[placeholder*="ship"], input[placeholder*="log"], input[placeholder*="entry"], input[type="text"]').first();
    if (await textInput.isVisible().catch(() => false)) {
      await textInput.click();
      await textInput.fill("");
      await textInput.type(entry.text, { delay: 25 });
      await page.waitForTimeout(300);

      // Submit
      const submitBtn = page.locator('button[type="submit"], button:has-text("Add"), button:has-text("Log"), button:has-text("Post")').first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(1200);
      }
    }
  }

  // 4. Scroll through entries
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(600);
  }

  // 5. Scroll back up
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(1500);

  // 6. Go to settings
  await page.goto("http://localhost:3099/settings");
  await page.waitForTimeout(2500);

  // 7. Final pause
  await page.waitForTimeout(1500);

  await ctx.close();
  await browser.close();

  // Convert
  const fs = require("fs");
  const files = fs.readdirSync("/tmp/shiplog-rec2").filter(f => f.endsWith(".webm"));
  if (files.length > 0) {
    const src = `/tmp/shiplog-rec2/${files[files.length - 1]}`;
    const { execSync } = require("child_process");
    execSync(`ffmpeg -y -i "${src}" -c:v libx264 -preset fast -crf 23 /tmp/shiplog-full-demo.mp4`);
    console.log("DONE: /tmp/shiplog-full-demo.mp4");
  } else {
    console.log("ERROR: No video files found");
  }
})();

function getCatLabel(cat) {
  const map = { build: "Build", launch: "Launch", bug: "Bug", idea: "Idea", win: "Win" };
  return map[cat] || cat;
}
