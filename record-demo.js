const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium-browser",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: "/tmp/shiplog-rec", size: { width: 1280, height: 720 } },
    colorScheme: "dark",
  });

  const page = await ctx.newPage();

  // Landing page
  await page.goto("http://localhost:3099");
  await page.waitForTimeout(3000);

  // Scroll down slowly
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(800);
  }

  // Scroll back up
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(2000);

  // Click login
  const loginBtn = page.locator('a[href="/login"], button:has-text("Log In"), a:has-text("Log In")').first();
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
    await page.waitForTimeout(2000);
  }

  // Go to signup
  await page.goto("http://localhost:3099/signup");
  await page.waitForTimeout(2000);

  // Back to landing
  await page.goto("http://localhost:3099");
  await page.waitForTimeout(2000);

  await ctx.close();
  await browser.close();

  // Find the recorded video
  const fs = require("fs");
  const files = fs.readdirSync("/tmp/shiplog-rec").filter(f => f.endsWith(".webm"));
  if (files.length > 0) {
    const src = `/tmp/shiplog-rec/${files[files.length - 1]}`;
    // Convert to mp4
    const { execSync } = require("child_process");
    execSync(`ffmpeg -y -i "${src}" -c:v libx264 -preset fast -crf 23 /tmp/shiplog-demo.mp4`);
    console.log("DONE: /tmp/shiplog-demo.mp4");
  } else {
    console.log("ERROR: No video files found");
  }
})();
