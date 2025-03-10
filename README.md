# Solana Telegram Bot Sample (Deno版)

Solana Agent Kitを使用したTelegramボットのサンプルプロジェクトです。このボットはDenoで実装されており、Solanaブロックチェーン上でのインタラクションを可能にします。

## 機能

- Telegramボットインターフェース
- Solana Agent Kitを使用したブロックチェーンインタラクション
- OpenAIのGPT-4o-miniを使用した自然言語処理

## 必要条件

- [Deno](https://deno.land/) v1.40.0以上
- Telegramボットトークン
- OpenAI APIキー
- Solana RPC URL
- Solanaプライベートキー

## セットアップ

1. リポジトリをクローンします：

```bash
git clone https://github.com/yourusername/solana-tgbot-sample.git
cd solana-tgbot-sample
```

2. `.env`ファイルを作成し、必要な環境変数を設定します：

```
OPENAI_API_KEY=your_openai_api_key
RPC_URL=your_solana_rpc_url
SOLANA_PRIVATE_KEY=your_solana_private_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

## 開発

ローカル開発サーバーを起動するには：

```bash
deno task dev
```

これにより、ポート8000でサーバーが起動します。

## デプロイ

Deno Deployにデプロイするには：

```bash
deno task deploy
```

## Webhookの設定

Telegramボットのwebhookを設定するには：

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<YOUR_DEPLOYMENT_URL>"
```

## ライセンス

MITライセンス

## 謝辞

- [Solana Agent Kit](https://www.solanaagentkit.xyz/)
- [Grammy](https://grammy.dev/)
- [LangChain](https://js.langchain.com/)
- [Deno](https://deno.land/)
