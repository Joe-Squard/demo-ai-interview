# AI Interview App

このプロジェクトは、ChatGPTを活用した音声認識ベースの面接練習アプリケーションです。ユーザーは音声で質問を行い、ChatGPTからの応答を受け取ることができます。

## ディレクトリ構造

project-root/
├── backend/                # バックエンド (FastAPI)
│   ├── main.py             # FastAPIのエントリポイント
│   └── .env                # 環境変数ファイル
├── frontend/               # フロントエンド (Next.js)
│   ├── pages/              # ページコンポーネント
│   ├── components/         # 再利用可能なReactコンポーネント
│   └── styles/             # TailwindCSSのスタイルファイル
├── package.json            # フロントエンドの依存関係
├── tailwind.config.js      # TailwindCSSの設定ファイル
└── README.md               # プロジェクトの説明とセットアップガイド
---

## 必要条件

- **Node.js**: v18以上
- **Python**: 3.10以上
- **pip**: Pythonパッケージ管理ツール
- **npm** または **yarn**

---

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-repository/ai-interview-app.git
cd ai-interview-app
2. フロントエンドのセットアップ
bash
コードをコピーする
cd frontend
npm install
npm run dev
デフォルトでは、アプリケーションは http://localhost:3000 で起動します。

3. バックエンドのセットアップ
bash
コードをコピーする
cd backend
python -m venv venv          # 仮想環境の作成 (任意)
source venv/bin/activate     # Linux/macOS
venv\Scripts\activate        # Windows

pip install -r requirements.txt
環境変数ファイルの作成
プロジェクトの backend/ フォルダに .env ファイルを作成し、以下を記載します:

makefile
コードをコピーする
OPENAI_API_KEY=your_openai_api_key
your_openai_api_key をOpenAIダッシュボードで取得したAPIキーに置き換えてください。

バックエンドサーバーの起動
bash
コードをコピーする
uvicorn main:app --reload --host 0.0.0.0 --port 8000
バックエンドはデフォルトで http://localhost:8000 で起動します。

4. フロントエンドとバックエンドの統合
フロントエンドの generateAiResponse 関数でバックエンドのエンドポイントを指定しています。コード例：

javascript
コードをコピーする
const response = await fetch("http://localhost:8000/generate-response/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ transcript }),
});
localhost:8000 がバックエンドの正しいアドレスとポートであることを確認してください。

注意事項
CORSエラーの回避: バックエンドの main.py に以下を追加してください:

python
コードをコピーする
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # フロントエンドのURL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
APIキーのセキュリティ: .env ファイルを .gitignore に追加して、リポジトリにプッシュしないようにしてください。

使用技術
フロントエンド: Next.js, React, TailwindCSS
バックエンド: FastAPI, OpenAI API
デプロイ: ローカル開発環境（プロダクションデプロイについては別途記載）
トラブルシューティング
フロントエンドのエラー: ブラウザのデベロッパーツールでエラーメッセージを確認してください。

バックエンドのエラー: ターミナルに出力されるエラーログを確認してください。

APIキーに関連するエラー: .env ファイルのAPIキーが正しいことを確認してください。
