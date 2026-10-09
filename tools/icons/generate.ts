/**
 * Vẽ icon app (ống nghiệm trên nền kem + xanh matcha) và xuất PNG bằng Chromium của Playwright.
 * Chạy khi cần đổi hình: `pnpm icons`. Kết quả (public/icons/*) được commit, build không phụ thuộc script này.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../../public/icons');

const CREAM = '#f5efe6';
const MATCHA_SOFT = '#dbe8c8';
const MATCHA = '#6b9f4f';
const INK = '#5d534a';

/**
 * @param full true = nền kín cả ô (maskable / apple-touch, hệ điều hành tự bo góc);
 *             false = ô bo góc trên nền trong suốt (icon "any").
 */
function svg(full: boolean): string {
  const bg = full
    ? `<rect width="512" height="512" fill="${CREAM}"/>`
    : `<rect width="512" height="512" rx="112" fill="${CREAM}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${bg}
  <circle cx="256" cy="256" r="186" fill="${MATCHA_SOFT}"/>
  <defs>
    <clipPath id="glass"><path d="M-44 -140 V70 a44 44 0 0 0 88 0 V-140 Z"/></clipPath>
  </defs>
  <g transform="translate(256 262) rotate(24)">
    <path d="M-44 -140 V70 a44 44 0 0 0 88 0 V-140 Z" fill="#faf8f5"/>
    <g clip-path="url(#glass)">
      <rect x="-60" y="-10" width="120" height="160" fill="${MATCHA}"/>
      <circle cx="-14" cy="30" r="9" fill="#faf8f5" opacity="0.85"/>
      <circle cx="16" cy="58" r="6" fill="#faf8f5" opacity="0.85"/>
      <circle cx="8" cy="12" r="5" fill="#faf8f5" opacity="0.85"/>
    </g>
    <path d="M-44 -140 V70 a44 44 0 0 0 88 0 V-140" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="-58" y="-160" width="116" height="26" rx="13" fill="${INK}"/>
    <path d="M-26 -100 V-30" stroke="#ffffff" stroke-width="9" stroke-linecap="round" opacity="0.8"/>
  </g>
  <g fill="${MATCHA}">
    <path d="M388 150 l7 20 l20 7 l-20 7 l-7 20 l-7 -20 l-20 -7 l20 -7 z"/>
  </g>
  <circle cx="132" cy="352" r="9" fill="${MATCHA}"/>
</svg>
`;
}

const targets: { file: string; size: number; full: boolean }[] = [
  { file: 'icon-192.png', size: 192, full: false },
  { file: 'icon-512.png', size: 512, full: false },
  { file: 'icon-maskable-512.png', size: 512, full: true },
  { file: 'apple-touch-icon.png', size: 180, full: true },
];

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'icon.svg'), svg(false));

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const page = await browser.newPage();
for (const { file, size, full } of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg(full)}`,
  );
  await page.screenshot({
    path: join(OUT, file),
    omitBackground: true,
    clip: { x: 0, y: 0, width: size, height: size },
  });
}
await browser.close();
console.log('Đã sinh icon vào', OUT);
