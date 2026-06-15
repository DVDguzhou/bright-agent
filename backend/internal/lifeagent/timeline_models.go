package lifeagent

import "github.com/agent-marketplace/backend/internal/models"

func BuildTimelineEventsForAI(events []models.LifeAgentTimelineEvent) []TimelineEventForAI {
	out := make([]TimelineEventForAI, 0, len(events))
	for _, e := range events {
		out = append(out, TimelineEventForAI{
			ID:                    e.ID,
			PeriodLabel:           e.PeriodLabel,
			PeriodGranularity:     e.PeriodGranularity,
			SequenceOrder:         e.SequenceOrder,
			EventType:             e.EventType,
			Title:                 e.Title,
			Summary:               e.Summary,
			Causes:                []string(e.Causes),
			Outcomes:              []string(e.Outcomes),
			Tradeoffs:             []string(e.Tradeoffs),
			SourceEntryIDs:        []string(e.SourceEntryIDs),
			Confidence:            e.Confidence,
			Status:                e.Status,
			ClarificationQuestion: ptrStringValue(e.ClarificationQuestion),
		})
	}
	return out
}

func ptrStringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
