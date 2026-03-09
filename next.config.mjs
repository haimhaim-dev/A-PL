/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // 동적 경로와 클라이언트 컴포넌트 사용을 위해 비활성화
  reactStrictMode: true,
  
  // 환경 변수 설정
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  },
  
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






  // Canvas 제거: PDF→이미지는 클라이언트(브라우저 Canvas)에서 수행, 서버는 OCR만 담당
};

export default nextConfig;
