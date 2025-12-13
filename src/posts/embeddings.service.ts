import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type OpenAIEmbeddingResponse = {
  data: Array<{
    embedding: number[];
  }>;
};

@Injectable()
export class EmbeddingsService {
  constructor(private readonly config: ConfigService) {}

  get model(): string {
    return this.config.get<string>(
      'OPENAI_EMBED_MODEL',
      'text-embedding-3-small',
    );
  }

  get baseUrl(): string {
    const raw = this.config.get<string>(
      'OPENAI_BASE_URL',
      'https://api.openai.com',
    );

    // 兼容配置成 ".../v1" 或 ".../v1/" 的情况，统一到不带版本号的 baseUrl
    const trimmed = raw.replace(/\/+$/, '');
    return trimmed.replace(/\/v1$/, '');
  }

  get apiKey(): string {
    return this.config.get<string>('OPENAI_API_KEY', '');
  }

  async embedText(text: string): Promise<number[]> {
    const apiKey = this.apiKey;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is missing. Please set it in backend .env before using vector search.',
      );
    }

    const res = await fetch(
      `${this.baseUrl}/v1/embeddings`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
          // ModelScope(OpenAI-compatible) 需要显式指定 encoding_format
          encoding_format: 'float',
        }),
      },
    );

    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(`OpenAI embeddings failed: ${res.status} ${msg}`);
    }

    const json = (await res.json()) as OpenAIEmbeddingResponse;
    const embedding = json.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('OpenAI embeddings response missing embedding vector.');
    }

    return embedding;
  }
}
