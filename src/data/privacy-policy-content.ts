/**
 * 개인정보 처리방침 내용 설정
 * 이 파일을 수정하면 /privacy 페이지의 내용이 자동으로 업데이트됩니다.
 */

export const PRIVACY_POLICY_CONFIG = {
  // 기본 정보
  companyName: "haim(이하 '회사'라고 함)",
  serviceName: "에이쁠(A-Pl)",
  contactEmail: "haimhaim.dev@gmail.com",
  effectiveDate: "2026년 3월 11일",
  lastUpdated: "2026년 3월 11일",
  
  // 개인정보 처리 목적
  purposes: [
    "서비스 제공: AI 기반 학습 퀴즈 생성 및 개인별 학습 이력(크레딧) 관리",
    "회원 관리: 이용자 식별, 불량 이용 방지, 공지사항 전달",
    "결제 처리(예정): 향후 유료 서비스 도입 시 결제 승인 및 환불 처리"
  ],
  
  // 수집하는 개인정보 항목
  collectedInfo: {
    required: [
      "이메일 주소",
      "닉네임"
    ],
    automatic: [
      "서비스 이용 기록",
      "접속 로그, 쿠키", 
      "기기 정보(ADID/IDFA)"
    ],
    external: [
      "구글(Google) 계정 연동 시 제공받는 공개 프로필 정보"
    ]
  },
  
  // 수집 방법
  collectionMethods: [
    "홈페이지 및 앱 내 입력",
    "고객센터 상담", 
    "서비스 이용 과정에서의 자동 생성"
  ],
  
  // 보유 기간
  retentionPeriod: {
    general: "이용자가 회원 탈퇴를 할 때까지 개인정보를 보유하며, 목적 달성 시 지체 없이 파기합니다.",
    legal: [
      { item: "서비스 이용 기록", period: "3개월", law: "통신비밀보호법" },
      { item: "소비자 불만 또는 분쟁 처리 기록", period: "3년", law: "전자상거래법" }
    ],
    destruction: "파기 시 전자적 파일은 복구 불가능한 방법으로 삭제하며, 종이 문서는 분쇄하거나 소각합니다."
  },
  
  // 제3자 제공
  thirdPartySharing: {
    principle: "에이쁠은 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.",
    exceptions: [
      "이용자가 사전에 동의한 경우",
      "법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우"
    ]
  },
  
  // 처리 위탁업체 (국외 이전 포함)
  processors: [
    { 
      company: "Supabase, Inc.", 
      service: "사용자 인증 처리 및 서비스 데이터 보관(Cloud Hosting)",
      location: "미국(USA)",
      period: "회원 탈퇴 시 혹은 위탁 계약 종료 시까지"
    },
    { 
      company: "Google LLC", 
      service: "구글 간편 로그인(OAuth) 제공 및 서비스 이용 분석",
      location: "미국(USA)",
      period: "서비스 종료 또는 이용자 동의 철회 시까지"
    },
    { 
      company: "Vercel, Inc.", 
      service: "웹 애플리케이션 호스팅 및 콘텐츠 전송(CDN)",
      location: "미국(USA)",
      period: "서비스 이용 종료 시까지"
    }
  ],
  internationalTransfer: {
    countries: "미국(USA)",
    method: "서비스 이용 시 네트워크를 통한 수시 전송"
  },
  
  // 이용자 권리
  userRights: [
    "개인정보 처리 현황 통지 요구",
    "개인정보 열람 요구",
    "개인정보 정정·삭제 요구",
    "개인정보 처리 정지 요구"
  ],
  userProtection: {
    technical: "모든 데이터 통신은 SSL 암호화를 적용하며, 비밀번호는 일방향 암호화하여 저장합니다.",
    ageLimit: "본 서비스는 원칙적으로 만 14세 이상을 대상으로 합니다.",
    rights: "이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며 동의를 철회할 수 있습니다."
  },
  
  // 연락처 정보
  contact: {
    title: "개인정보 보호책임자",
    name: "성산하",
    position: "대표",
    phone: "010-2432-6174",
    email: "haimhaim.dev@gmail.com",
    responseTime: "영업일 기준 3일 이내 답변"
  }
};

// 개인정보 처리방침 URL (구글 플레이 콘솔 등록용)
export const PRIVACY_POLICY_URL = "https://a-pl.vercel.app/privacy";

// 추가 설정
export const ADDITIONAL_CONFIG = {
  // 회사 전체 이름 (법적 문서용)
  fullCompanyName: "haim",
  
  // 서비스 설명
  serviceDescription: "AI 기반 학습 퀴즈 생성 서비스",
  
  // 법적 근거
  legalBasis: [
    "개인정보보호법",
    "정보통신망 이용촉진 및 정보보호 등에 관한 법률",
    "전자상거래 등에서의 소비자보호에 관한 법률"
  ],
  
  // 구글 플레이 스토어 필수 항목 체크리스트
  googlePlayRequirements: {
    privacyPolicyUrl: true,
    dataCollection: true,
    dataSharing: true,
    dataRetention: true,
    dataDeletion: true,
    contactInfo: true,
    internationalTransfer: true,
    responsiblePerson: true
  }
};