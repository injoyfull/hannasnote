#!/bin/bash
# Double-click this file in Finder to start HANNAsNote and open it in your browser.
cd "$(dirname "$0")"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js를 찾을 수 없어요. 처음 설정이 아직 안 되어 있을 수 있어요."
  echo "도움이 필요하면 이 메시지를 스크린샷으로 남겨주세요."
  read -n 1 -s -r -p "아무 키나 누르면 창이 닫혀요..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "처음 실행하는 것 같아요. 필요한 파일을 설치할게요 (몇 분 걸릴 수 있어요)..."
  npm install
fi

PORT=3000
if lsof -i :$PORT >/dev/null 2>&1; then
  PORT=3001
fi

echo "HANNAsNote를 준비하고 있어요..."
npm run dev -- -p $PORT &
DEV_PID=$!

for i in $(seq 1 30); do
  if curl -s "http://localhost:$PORT" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

open "http://localhost:$PORT"

echo ""
echo "HANNAsNote가 브라우저에서 열렸어요."
echo "이 창을 닫으면 노트 앱이 함께 종료돼요. 계속 쓰시려면 이 창을 그대로 두세요."
wait $DEV_PID
