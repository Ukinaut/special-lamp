// Keep provider-specific parameters consistent for chat, vision, summaries and probes.
export function completionBody({ model, messages, maxTokens = 300, temperature, isNvidia = false }) {
  const body = { model, messages, [isNvidia ? 'max_tokens' : 'max_completion_tokens']: maxTokens };
  const reasoningModel = /^gpt-[56](?:[.-]|$)|^o\d(?:-|$)/i.test(model);
  // This bot already routes decisions locally; Luna only needs to compose short replies.
  if (!isNvidia && /^gpt-5\.6(?:-|$)/i.test(model)) body.reasoning_effort = 'none';
  if (temperature !== undefined && (isNvidia || !reasoningModel)) body.temperature = temperature;
  return body;
}
