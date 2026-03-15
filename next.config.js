const path = require("path");

const UPLOAD_URL_MATCHER = /^\/uploads\/.+/;

const withSerwist = require("@serwist/next").default({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    disable: process.env.NODE_ENV === "development",
    register: true,
    reloadOnOnline: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
            {
                protocol: "http",
                hostname: "**",
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: "/uploads/:path*",
                destination: "/api/media/:path*",
            },
        ];
    },
    turbopack: {},
};

module.exports = withSerwist(nextConfig);
