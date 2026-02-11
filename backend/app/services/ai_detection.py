import json
import logging
from typing import Dict, Any

from app.core.provider_router import ProviderRouter

logger = logging.getLogger(__name__)


class AIDetectionService:
    def __init__(self):
        self.router = ProviderRouter()

    @property
    def is_available(self) -> bool:
        return self.router.is_available

    def detect(self, text: str, threshold: float = 0.5) -> Dict[str, Any]:
        """
        通过 OpenAI 兼容 API 检测文本是否为 AI 生成。
        未配置 API 时返回不可用错误。
        """
        if not self.is_available:
            return self._error_response("AI 检测未启用：未配置 AI_API_KEY")

        try:
            self.router.log_usage("ai_detection", {"text_length": len(text)})
            return self._detect_via_api(text, threshold)
        except Exception as e:
            logger.exception(f"AI 检测失败: {e}")
            return self._error_response(f"内部错误: {str(e)}")

    def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy" if self.is_available else "unavailable",
            "api_configured": self.is_available,
            "model": self.router.chat_model if self.is_available else None,
        }

    def _detect_via_api(self, text: str, threshold: float) -> Dict[str, Any]:
        client = self.router.get_openai_client()
        model = self.router.chat_model

        prompt = f"""分析以下文本是否为 AI 生成的内容。
请以 JSON 格式回复，包含以下字段：
- "score": 0.0（人工撰写）到 1.0（AI 生成）之间的浮点数，表示 AI 生成的概率。
- "reasoning": 简要解释判断依据。

文本：
{text[:4000]}"""

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "你是一个专业的 AI 内容检测系统，只输出合法的 JSON。"},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            result = json.loads(content)

            ai_score = float(result.get("score", 0.5))
            is_ai = ai_score > threshold
            confidence = abs(ai_score - 0.5) * 2

            return {
                "is_ai": is_ai,
                "score": round(ai_score, 4),
                "confidence": round(confidence, 4),
                "label": "可能是AI生成" if is_ai else "可能是人工撰写",
                "provider": "api",
                "details": {
                    "reasoning": result.get("reasoning", ""),
                    "model": model,
                },
            }

        except Exception as e:
            logger.error(f"API 调用错误: {e}")
            return self._error_response(f"API 调用失败: {str(e)}")

    def _error_response(self, message: str) -> Dict[str, Any]:
        return {
            "is_ai": False,
            "score": 0.0,
            "confidence": 0.0,
            "label": "错误",
            "provider": "unknown",
            "details": {"error": message},
        }
