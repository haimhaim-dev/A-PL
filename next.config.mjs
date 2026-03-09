/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // 동적 경로와 클라이언트 컴포넌트 사용을 위해 비활성화
  reactStrictMode: true,
  
  // 이미지 최적화 설정
  images: {
    domains: ['lh3.googleusercontent.com'], // Google 프로필 이미지
    formats: ['image/avif', 'image/webp']
  },


  typescript: {
    // 빌드 시 타입 에러가 있어도 무시하도록 설정
    ignoreBuildErrors: true,
  },
  eslint: {
    // 빌드 시 ESLint 에러가 있어도 무시하도록 설정
    ignoreDuringBuilds: true,
  },






  // Webpack 설정 (Canvas 라이브러리 호환성)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'commonjs canvas'
      });
    }
    return config;
  }
};

export default nextConfig;
