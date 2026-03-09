/**
 * CSS 보호 스크립트
 * globals.css와 layout.tsx의 변경을 감지하고 자동 복구
 */

const fs = require('fs');
const path = require('path');

// 보호할 파일들
const PROTECTED_FILES = {
  'app/globals.css': 'app/globals.css.backup',
  'app/layout.tsx': 'app/layout.tsx.backup'
};

// 파일 감시 및 복구 함수
function watchAndProtect() {
  Object.entries(PROTECTED_FILES).forEach(([original, backup]) => {
    if (fs.existsSync(backup)) {
      console.log(`🛡️ [CSS 보호] ${original} 감시 중...`);
      
      fs.watchFile(original, (curr, prev) => {
        // 파일이 변경되었을 때
        if (curr.mtime !== prev.mtime) {
          console.log(`⚠️ [CSS 변경 감지] ${original} 파일이 수정됨`);
          
          // 백업에서 복구
          try {
            const backupContent = fs.readFileSync(backup, 'utf8');
            fs.writeFileSync(original, backupContent);
            console.log(`✅ [CSS 복구 완료] ${original} 백업에서 복구됨`);
          } catch (error) {
            console.error(`❌ [CSS 복구 실패] ${original}:`, error.message);
          }
        }
      });
    }
  });
}

// 수동 복구 함수
function restoreFromBackup() {
  Object.entries(PROTECTED_FILES).forEach(([original, backup]) => {
    if (fs.existsSync(backup)) {
      try {
        const backupContent = fs.readFileSync(backup, 'utf8');
        fs.writeFileSync(original, backupContent);
        console.log(`✅ [수동 복구] ${original} 복구 완료`);
      } catch (error) {
        console.error(`❌ [수동 복구 실패] ${original}:`, error.message);
      }
    }
  });
}

// 명령행 인수 처리
const command = process.argv[2];

if (command === 'restore') {
  restoreFromBackup();
} else if (command === 'watch') {
  watchAndProtect();
  console.log('🛡️ [CSS 보호] 감시 모드 시작됨. Ctrl+C로 종료하세요.');
  
  // 프로세스 종료 시 정리
  process.on('SIGINT', () => {
    console.log('\n🛡️ [CSS 보호] 감시 모드 종료됨');
    process.exit(0);
  });
} else {
  console.log(`
🛡️ CSS 보호 스크립트 사용법:
  node scripts/protect-css.js restore  - 백업에서 즉시 복구
  node scripts/protect-css.js watch    - 실시간 감시 및 자동 복구
  `);
}