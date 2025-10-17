// /** @type {import('next').NextConfig} */

const pJson = require('./package.json');

const nextConfig = {
    reactStrictMode: false,
    trailingSlash: false,
    basePath: process.env.NODE_ENV === 'production' ? '' : '',
    publicRuntimeConfig: {
        contextPath: process.env.NODE_ENV === 'production' ? '' : '',
        uploadPath: process.env.NODE_ENV === 'production' ? '/upload.php' : '/api/upload',
        version: pJson.version
    },
    rewrites: async () => {
        return [{ source: '/api/send', destination: 'http://localhost:8000' }];
    }
};

module.exports = nextConfig;
