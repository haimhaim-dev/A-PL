import { Card } from "@/components/ui/card";
import { AppLogo } from "@/components/ui/app-logo";
import { PRIVACY_POLICY_CONFIG } from "@/data/privacy-policy-content";

export const metadata = {
  title: "개인정보 처리방침 | 에이쁠",
  description: "에이쁠(A-Pl) 개인정보 처리방침"
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AppLogo className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">개인정보처리방침</h1>
          <p className="text-slate-300">{PRIVACY_POLICY_CONFIG.serviceName}</p>
        </div>

        {/* 메인 콘텐츠 */}
        <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20">
          <div className="prose prose-invert max-w-none">
            
            {/* 서문 */}
            <section className="mb-8">
              <div className="text-slate-300 space-y-3">
                <p>
                  <strong className="text-white">{PRIVACY_POLICY_CONFIG.companyName}</strong>(이하 '회사'라고 함)는 
                  회사가 제공하는 '<strong className="text-white">{PRIVACY_POLICY_CONFIG.serviceName}</strong>' 서비스(이하 '서비스')를 
                  이용하는 이용자의 개인정보를 보호하고, 관련 법령을 준수하기 위해 다음과 같은 개인정보처리방침을 수립합니다.
                </p>
              </div>
            </section>

            {/* 제1조 - 수집하는 개인정보 항목 및 방법 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">제1조 (수집하는 개인정보 항목 및 방법)</h2>
              <div className="text-slate-300 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">수집 항목:</h3>
                  <div className="ml-4 space-y-3">
                    <div>
                      <p><strong>필수 항목:</strong> {PRIVACY_POLICY_CONFIG.collectedInfo.required.join(", ")}.</p>
                    </div>
                    <div>
                      <p><strong>자동 수집 항목:</strong> {PRIVACY_POLICY_CONFIG.collectedInfo.automatic.join(", ")}.</p>
                    </div>
                    <div>
                      <p><strong>외부 로그인:</strong> {PRIVACY_POLICY_CONFIG.collectedInfo.external.join(", ")}.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p><strong>수집 방법:</strong> {PRIVACY_POLICY_CONFIG.collectionMethods.join(", ")}.</p>
                </div>
              </div>
            </section>

            {/* 제2조 - 개인정보 처리 위탁 및 국외 이전 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">제2조 (개인정보의 처리 위탁 및 국외 이전)</h2>
              <div className="text-slate-300 space-y-4">
                <p>회사는 안정적인 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하며, 해당 업체들은 해외에 서버를 두고 있어 국외로 이전됩니다.</p>
                <div className="bg-slate-800/50 rounded-lg p-4 overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2">수탁자</th>
                        <th className="text-left py-2">위탁 업무 내용</th>
                        <th className="text-left py-2">보유 및 이용 기간</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PRIVACY_POLICY_CONFIG.processors.map((processor, index) => (
                        <tr key={index} className="border-b border-slate-700">
                          <td className="py-2">{processor.company}</td>
                          <td className="py-2">{processor.service}</td>
                          <td className="py-2">{processor.period}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>
                  <strong>이전 국가 및 방법:</strong> {PRIVACY_POLICY_CONFIG.internationalTransfer.countries}, {PRIVACY_POLICY_CONFIG.internationalTransfer.method}.
                </p>
              </div>
            </section>

            {/* 제3조 - 개인정보의 이용 목적 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">제3조 (개인정보의 이용 목적)</h2>
              <div className="text-slate-300 space-y-3">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {PRIVACY_POLICY_CONFIG.purposes.map((purpose, index) => (
                    <li key={index}>{purpose}.</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 제4조 - 개인정보의 보유 및 파기 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">제4조 (개인정보의 보유 및 파기)</h2>
              <div className="text-slate-300 space-y-3">
                <p>{PRIVACY_POLICY_CONFIG.retentionPeriod.general}</p>
                <p>법령에 따라 보존할 필요가 있는 경우(전자상거래법 등) 해당 기간 동안 안전하게 보관합니다.</p>
                <p>{PRIVACY_POLICY_CONFIG.retentionPeriod.destruction}</p>
              </div>
            </section>

            {/* 제5조 - 이용자의 권리와 보호 대책 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">제5조 (이용자의 권리와 보호 대책)</h2>
              <div className="text-slate-300 space-y-4">
                <p>이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며 동의를 철회할 수 있습니다.</p>
                <div>
                  <p><strong>기술적 보호:</strong> 모든 데이터 통신은 SSL 암호화를 적용하며, 비밀번호는 일방향 암호화하여 저장합니다.</p>
                </div>
                <div>
                  <p><strong>만 14세 미만:</strong> 본 서비스는 원칙적으로 만 14세 이상을 대상으로 합니다.</p>
                </div>
              </div>
            </section>

            {/* 제6조 - 개인정보 보호책임자 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">제6조 (개인정보 보호 책임자)</h2>
              <div className="text-slate-300 space-y-3">
                <p>개인정보 관련 문의나 불만 처리는 아래 연락처로 연락주시기 바랍니다.</p>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p><strong>성명:</strong> {PRIVACY_POLICY_CONFIG.contact.name}</p>
                  <p><strong>직책:</strong> {PRIVACY_POLICY_CONFIG.contact.position}</p>
                  <p><strong>이메일:</strong> {PRIVACY_POLICY_CONFIG.contact.email}</p>
                </div>
              </div>
            </section>

            {/* 부칙 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">부칙</h2>
              <div className="text-slate-300">
                <p>본 방침은 <strong>{PRIVACY_POLICY_CONFIG.effectiveDate}</strong>부터 시행됩니다.</p>
              </div>
            </section>

            {/* 연락처 */}
            <section className="pt-8 border-t border-slate-600">
              <div className="text-center text-slate-400">
                <p>개인정보 처리방침에 대한 문의사항이 있으시면</p>
                <p>언제든지 <strong className="text-blue-400">{PRIVACY_POLICY_CONFIG.contact.email}</strong>으로 연락해 주세요.</p>
                <p className="text-sm mt-2">{PRIVACY_POLICY_CONFIG.contact.responseTime}</p>
              </div>
            </section>

          </div>
        </Card>

        {/* 하단 네비게이션 */}
        <div className="text-center mt-8">
          <a 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            ← 메인으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}