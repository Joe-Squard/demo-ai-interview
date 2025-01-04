from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import openai
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from gtts import gTTS
from io import BytesIO

app = FastAPI()

# 環境変数のロード
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# CORS ミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 必要に応じて特定のオリジンに変更
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# リクエストデータのモデル定義
class TranscriptRequest(BaseModel):
    transcript: str

# system_prompt.txt からシステムプロンプトを読み込む
# ファイルパスは適宜変更してください（例：プロジェクト直下に置くなら "system_prompt.txt"）
with open("system_prompt.txt", "r", encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()

# /generate-response/ エンドポイント
@app.post("/generate-response/")
async def generate_response(request: TranscriptRequest):
    # OpenAIで応答を生成
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},   # ファイルから読み込んだプロンプトを使用
            {"role": "user", "content": request.transcript}
        ]
    )
    ai_response = response.choices[0].message['content']

    # gTTSで音声を生成
    tts = gTTS(ai_response, lang="ja")
    audio_buffer = BytesIO()
    tts.write_to_fp(audio_buffer)
    audio_buffer.seek(0)

    # テキストと音声データを含むレスポンスを返す
    return {
        "text_response": ai_response,
        "audio_data": audio_buffer.getvalue().decode("latin1")  # 音声データを文字列に変換して返す
    }
