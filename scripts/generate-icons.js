const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgCode = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#FF8BA7" rx="100" />
  <text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="bold" font-size="200" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">P2L</text>
</svg>
`;

const sizes = [192, 512];
const publicDir = path.join(__dirname, '..', 'public');

async function generate() {
    for (const size of sizes) {
        const dest = path.join(publicDir, `icon-${size}x${size}.png`);
        await sharp(Buffer.from(svgCode))
            .resize(size, size)
            .png()
            .toFile(dest);
        console.log(`Generated ${dest}`);
    }
}

generate().catch(console.error);
