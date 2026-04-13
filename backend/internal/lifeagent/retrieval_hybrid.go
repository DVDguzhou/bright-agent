package lifeagent

// Hybrid retrieval hooks are intentionally optional.
// Today the system uses lexical routing and scoring only; these types reserve
// the extension point for future embedding recall and rerank without forcing
// the current runtime to depend on a vector store.

type RetrievalSourceType string

const (
	RetrievalSourceTopic     RetrievalSourceType = "topic"
	RetrievalSourceKnowledge RetrievalSourceType = "knowledge"
)

type RetrievalCandidate struct {
	SourceType    RetrievalSourceType
	SourceID      string
	Title         string
	LexicalScore  float64
	SemanticScore float64
	FinalScore    float64
}

type RetrievalHookContext struct {
	Query   string
	Route   RetrievalRoute
	Topics  []TopicSummaryForAI
	Entries []KnowledgeEntryForAI
}

type RetrievalVectorRecallHook func(ctx RetrievalHookContext, limit int) []RetrievalCandidate
type RetrievalRerankHook func(ctx RetrievalHookContext, candidates []RetrievalCandidate, limit int) []RetrievalCandidate

type HybridRetrievalHooks struct {
	TopicVectorRecall RetrievalVectorRecallHook
	EntryVectorRecall RetrievalVectorRecallHook
	Rerank            RetrievalRerankHook
	LexicalRecallTopN int
	VectorRecallTopN  int
	FinalTopK         int
}

func DefaultHybridRetrievalHooks() HybridRetrievalHooks {
	return HybridRetrievalHooks{
		LexicalRecallTopN: 8,
		VectorRecallTopN:  8,
		FinalTopK:         4,
	}
}
