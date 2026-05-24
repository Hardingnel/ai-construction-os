import os
import json
from typing import Optional

from openai import OpenAI


class LLMService:
    """Multi-provider LLM service with OpenRouter as primary AI router."""

    def __init__(self):
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.google_api_key = os.getenv("GOOGLE_API_KEY", "")

        self.openrouter_client = None
        self.openai_client = None
        self.anthropic_client = None

        if self.openrouter_api_key:
            self.openrouter_client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=self.openrouter_api_key,
                default_headers={
                    "HTTP-Referer": "https://github.com/Hardingnel/ai-construction-os",
                    "X-Title": "AI Construction OS",
                },
            )

        if self.openai_api_key:
            self.openai_client = OpenAI(api_key=self.openai_api_key)

        if self.anthropic_api_key:
            try:
                import anthropic
                self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key)
            except ImportError:
                self.anthropic_client = None

    def _call_openrouter(self, system_prompt: str, user_prompt: str, model: str = "openai/gpt-4o") -> Optional[str]:
        if not self.openrouter_client:
            return None
        try:
            response = self.openrouter_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=3000,
                timeout=45,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenRouter error: {e}")
            return None

    def _call_openai(self, system_prompt: str, user_prompt: str, model: str = "gpt-4o") -> Optional[str]:
        if not self.openai_client:
            return None
        try:
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=3000,
                timeout=45,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI error: {e}")
            return None

    def _call_anthropic(self, system_prompt: str, user_prompt: str, model: str = "claude-3-5-sonnet-20241022") -> Optional[str]:
        if not self.anthropic_client:
            return None
        try:
            response = self.anthropic_client.messages.create(
                model=model,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
                max_tokens=3000,
                temperature=0.7,
            )
            return response.content[0].text
        except Exception as e:
            print(f"Anthropic error: {e}")
            return None

    def _call_gemini(self, system_prompt: str, user_prompt: str, model: str = "gemini-1.5-pro") -> Optional[str]:
        if not self.google_api_key:
            return None
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.google_api_key)
            model_instance = genai.GenerativeModel(
                model_name=model,
                system_instruction=system_prompt,
            )
            response = model_instance.generate_content(user_prompt)
            return response.text
        except Exception as e:
            print(f"Gemini error: {e}")
            return None

    def generate(self, system_prompt: str, user_prompt: str, model: str = "auto") -> Optional[str]:
        """Route to the best available provider.

        Priority: OpenRouter -> OpenAI -> Anthropic -> Gemini
        Specific model strings route to OpenRouter (covers 300+ models).
        """
        if model != "auto":
            if not model.startswith(("gpt-", "claude", "gemini")):
                return self._call_openrouter(system_prompt, user_prompt, model=model)
            if model.startswith("gpt-"):
                return self._call_openai(system_prompt, user_prompt, model=model)
            if model.startswith("claude"):
                return self._call_anthropic(system_prompt, user_prompt, model=model)
            if model.startswith("gemini"):
                return self._call_gemini(system_prompt, user_prompt, model=model)

        result = self._call_openrouter(system_prompt, user_prompt)
        if result:
            return result
        result = self._call_openai(system_prompt, user_prompt)
        if result:
            return result
        result = self._call_anthropic(system_prompt, user_prompt)
        if result:
            return result
        result = self._call_gemini(system_prompt, user_prompt)
        if result:
            return result
        return None


llm_service = LLMService()
