# Handoff Runner And Model Recommendation Section

Use this section in new implementation handoffs when a task is queued for Brain Loop automation.

## Runner And Model Recommendation

- Recommended runner: `<open-code | antigravity | codex>`
- Recommended model: `<model name from runner catalog>`
- Runner recommendation reason: `<why this runner fits the task>`
- Model recommendation reason: `<why this model fits the task>`

## Queue Item Fields

Queue items created from this handoff should include:

```json
{
  "recommendedAgent": "open-code",
  "recommendationReason": "Best default implementation runner for this handoff.",
  "recommendedModel": "deepseek v4 pro",
  "modelRecommendationReason": "Default implementation model from runner/model settings."
}
```

Older queue items without `recommendedModel` remain valid. Brain Loop derives a display fallback from `settings.runnerCatalog` when the field is missing.
