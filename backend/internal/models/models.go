package models

import (
	"time"

	"github.com/google/uuid"
)

func GenID() string { return uuid.New().String() }

// LifeAgentAPICallerUserID 占位用户：开放 API 调用产生的会话归属此 ID，不消耗真实买家的提问包
const LifeAgentAPICallerUserID = "00000000-0000-4000-8000-000000000001"

type User struct {
	ID           string    `gorm:"primaryKey;size:36"`
	Email        string    `gorm:"uniqueIndex;size:255;not null"`
	Password     string    `gorm:"size:255;not null"`
	Name         *string   `gorm:"size:255"`
	AvatarURL    *string   `gorm:"column:avatar_url;type:text"`
	Phone        *string   `gorm:"size:20;uniqueIndex"`
	WechatOpenID *string   `gorm:"column:wechat_open_id;size:64;uniqueIndex"`
	RoleFlags    JSONMap   `gorm:"column:role_flags;type:json"`
	CreatedAt    time.Time `gorm:"column:created_at"`

	PasswordResetToken     *string    `gorm:"column:password_reset_token;size:64;index"`
	PasswordResetExpiresAt *time.Time `gorm:"column:password_reset_expires_at"`

	// relations - no fk for simplicity, use manual queries
}

func (User) TableName() string { return "users" }

type UserApiKey struct {
	ID        string    `gorm:"primaryKey;size:36"`
	UserID    string    `gorm:"column:user_id;size:36;not null;index"`
	KeyHash   string    `gorm:"column:key_hash;size:64;not null"`
	KeyPrefix string    `gorm:"column:key_prefix;size:32;not null"`
	Name      *string   `gorm:"size:100"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (UserApiKey) TableName() string { return "user_api_keys" }

type Agent struct {
	ID              string    `gorm:"primaryKey;size:36"`
	SellerID        string    `gorm:"column:seller_id;size:36;not null;index"`
	Name            string    `gorm:"size:255;not null"`
	Description     *string   `gorm:"type:text"`
	BaseURL         string    `gorm:"column:base_url;size:512;not null"`
	UseTunnel       bool      `gorm:"column:use_tunnel;default:false"`
	PublicKey       *string   `gorm:"column:public_key;size:255"`
	SupportedScopes JSONArray `gorm:"column:supported_scopes;type:json"`
	PricingConfig   JSONMap   `gorm:"column:pricing_config;type:json"`
	Status          string    `gorm:"size:32;default:pending"`
	RiskLevel       *string   `gorm:"column:risk_level;size:32"`
	CreatedAt       time.Time `gorm:"column:created_at"`
	UpdatedAt       time.Time `gorm:"column:updated_at"`
}

func (Agent) TableName() string { return "agents" }

type License struct {
	ID         string    `gorm:"primaryKey;size:36"`
	AgentID    string    `gorm:"column:agent_id;size:36;not null;index"`
	BuyerID    string    `gorm:"column:buyer_id;size:36;not null;index"`
	SellerID   string    `gorm:"column:seller_id;size:36;not null;index"`
	Scope      *string   `gorm:"size:64"`
	QuotaTotal int       `gorm:"column:quota_total;not null"`
	QuotaUsed  int       `gorm:"column:quota_used;default:0"`
	ExpiresAt  time.Time `gorm:"column:expires_at;not null"`
	Status     string    `gorm:"size:32;default:ACTIVE"`
	CreatedAt  time.Time `gorm:"column:created_at"`
}

func (License) TableName() string { return "licenses" }

type InvocationToken struct {
	ID        string    `gorm:"primaryKey;size:36"`
	LicenseID string    `gorm:"column:license_id;size:36;not null;index"`
	AgentID   string    `gorm:"column:agent_id;size:36;not null"`
	BuyerID   string    `gorm:"column:buyer_id;size:36;not null"`
	SellerID  string    `gorm:"column:seller_id;size:36;not null"`
	RequestID string    `gorm:"column:request_id;size:64;uniqueIndex"`
	Scope     *string   `gorm:"size:64"`
	IssuedAt  time.Time `gorm:"column:issued_at"`
	ExpiresAt time.Time `gorm:"column:expires_at"`
	Nonce     string    `gorm:"size:64;uniqueIndex"`
	Signature *string   `gorm:"size:255"`
	Status    string    `gorm:"size:32;default:ISSUED"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (InvocationToken) TableName() string { return "invocation_tokens" }

type InvocationRequest struct {
	ID           string    `gorm:"primaryKey;size:36"`
	RequestID    string    `gorm:"column:request_id;size:64;uniqueIndex"`
	LicenseID    string    `gorm:"column:license_id;size:36;not null"`
	AgentID      string    `gorm:"column:agent_id;size:36;not null"`
	BuyerID      string    `gorm:"column:buyer_id;size:36;not null"`
	TokenID      string    `gorm:"column:token_id;size:36;uniqueIndex"`
	InputHash    string    `gorm:"column:input_hash;size:64;not null"`
	InputPreview *string   `gorm:"column:input_preview;size:500"`
	Scope        *string   `gorm:"size:64"`
	CreatedAt    time.Time `gorm:"column:created_at"`
}

func (InvocationRequest) TableName() string { return "invocation_requests" }

type ExecutionReceipt struct {
	ID               string     `gorm:"primaryKey;size:36"`
	RequestID        string     `gorm:"column:request_id;size:64;not null"`
	InvocationReqID  string     `gorm:"column:invocation_request_id;size:36;uniqueIndex"`
	LicenseID        string     `gorm:"column:license_id;size:36;not null"`
	AgentID          string     `gorm:"column:agent_id;size:36;not null"`
	SellerID         string     `gorm:"column:seller_id;size:36;not null"`
	InputHash        string     `gorm:"column:input_hash;size:64;not null"`
	OutputHash       *string    `gorm:"column:output_hash;size:64"`
	OutputPreview    *string    `gorm:"column:output_preview;type:text"`
	StartedAt        *time.Time `gorm:"column:started_at"`
	FinishedAt       *time.Time `gorm:"column:finished_at"`
	AgentVersion     *string    `gorm:"column:agent_version;size:64"`
	ToolUsageSummary *string    `gorm:"column:tool_usage_summary;type:text"`
	SellerSignature  *string    `gorm:"column:seller_signature;size:255"`
	Status           string     `gorm:"size:32;not null"`
	CreatedAt        time.Time  `gorm:"column:created_at"`
}

func (ExecutionReceipt) TableName() string { return "execution_receipts" }

type Dispute struct {
	ID              string     `gorm:"primaryKey;size:36"`
	LicenseID       string     `gorm:"column:license_id;size:36;not null"`
	InvocationReqID string     `gorm:"column:invocation_request_id;size:36;not null"`
	ReceiptID       *string    `gorm:"column:receipt_id;size:36;uniqueIndex"`
	BuyerID         string     `gorm:"column:buyer_id;size:36;not null"`
	SellerID        string     `gorm:"column:seller_id;size:36;not null"`
	Reason          *string    `gorm:"type:text"`
	EvidenceRefs    JSONMap    `gorm:"column:evidence_refs;type:json"`
	Status          string     `gorm:"size:32;default:OPEN"`
	Resolution      *string    `gorm:"type:text"`
	CreatedAt       time.Time  `gorm:"column:created_at"`
	ResolvedAt      *time.Time `gorm:"column:resolved_at"`
}

func (Dispute) TableName() string { return "disputes" }

type LifeAgentProfile struct {
	ID                   string    `gorm:"primaryKey;size:36"`
	UserID               string    `gorm:"column:user_id;size:36;not null;index"`
	DisplayName          string    `gorm:"column:display_name;size:255;not null"`
	Headline             string    `gorm:"size:512;not null"`
	ShortBio             string    `gorm:"column:short_bio;size:500;not null"`
	LongBio              string    `gorm:"column:long_bio;type:text;not null"`
	Audience             string    `gorm:"type:text;not null"`
	WelcomeMessage       string    `gorm:"column:welcome_message;type:text;not null"`
	PricePerQuestion     int       `gorm:"column:price_per_question;default:990"`
	ExpertiseTags        JSONArray `gorm:"column:expertise_tags;type:json"`
	SampleQuestions      JSONArray `gorm:"column:sample_questions;type:json"`
	Education            *string   `gorm:"column:education;size:128"` // 学历
	Income               *string   `gorm:"column:income;size:64"`     // 收入
	Job                  *string   `gorm:"column:job;size:255"`       // 工作
	School               *string   `gorm:"column:school;size:255"`    // 学校
	OriginalAuthor       *string   `gorm:"column:original_author;size:128"` // 原作者真实姓名/笔名
	Source               *string   `gorm:"column:source;size:255"`          // 内容来源
	IsGenerated          bool      `gorm:"column:is_generated;default:false"` // 是否自动生成
	Country              *string   `gorm:"column:country;size:64"`
	Province             *string   `gorm:"column:province;size:64"`
	City                 *string   `gorm:"column:city;size:64"`
	County               *string   `gorm:"column:county;size:64"`
	Regions              JSONArray `gorm:"column:regions;type:json"`
	MBTI                 *string   `gorm:"column:mbti;size:8"`
	PersonaArchetype     *string   `gorm:"column:persona_archetype;size:64"`
	ToneStyle            *string   `gorm:"column:tone_style;size:64"`
	ResponseStyle        *string   `gorm:"column:response_style;size:64"`
	ForbiddenPhrases     JSONArray `gorm:"column:forbidden_phrases;type:json"`
	ExampleReplies       JSONArray `gorm:"column:example_replies;type:json"`
	NotSuitableFor       *string   `gorm:"column:not_suitable_for;type:text"`               // 不能/不想回答的问题
	VerificationStatus   string    `gorm:"column:verification_status;size:32;default:none"` // none=未申请, pending=申请待认证, verified=已认证
	VoiceCloneID         *string   `gorm:"column:voice_clone_id;size:128"`                  // 百炼系统音色名或声音复刻返回的 voice id
	CoverImageURL        *string   `gorm:"column:cover_image_url;size:512"`                 // 用户上传，站内相对路径如 /uploads/...
	CoverPresetKey       *string   `gorm:"column:cover_preset_key;size:64"`                 // 预设键，如 01-student-panda；与 cover_image_url 二选一优先 URL
	Published            bool      `gorm:"default:true;index"`                              // 列表筛选 published=true 时用
	ApiInvokeEnabled     bool      `gorm:"column:api_invoke_enabled;default:false"`
	ApiPricePerCallCents *int      `gorm:"column:api_price_per_call_cents"` // nil 表示与单次咨询同价（price_per_question）
	ApiTotalCalls        int       `gorm:"column:api_total_calls;default:0"`
	CreatedAt            time.Time `gorm:"column:created_at"`
	UpdatedAt            time.Time `gorm:"column:updated_at"`
}

func (LifeAgentProfile) TableName() string { return "life_agent_profiles" }

type LifeAgentFavorite struct {
	ID        string    `gorm:"primaryKey;size:36"`
	UserID    string    `gorm:"column:user_id;size:36;not null;index;uniqueIndex:idx_life_agent_favorite_user_profile"`
	ProfileID string    `gorm:"column:profile_id;size:36;not null;index;uniqueIndex:idx_life_agent_favorite_user_profile"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (LifeAgentFavorite) TableName() string { return "life_agent_favorites" }

type LifeAgentInvokeKey struct {
	ID        string    `gorm:"primaryKey;size:36"`
	ProfileID string    `gorm:"column:profile_id;size:36;not null;index"`
	KeyHash   string    `gorm:"column:key_hash;size:64;not null;index"`
	KeyPrefix string    `gorm:"column:key_prefix;size:32;not null"`
	Name      *string   `gorm:"size:100"`
	CallCount int       `gorm:"column:call_count;default:0"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (LifeAgentInvokeKey) TableName() string { return "life_agent_invoke_keys" }

type LifeAgentKnowledgeEntry struct {
	ID        string    `gorm:"primaryKey;size:36" json:"id"`
	ProfileID string    `gorm:"column:profile_id;size:36;not null;index" json:"-"`
	Category  string    `gorm:"size:128;not null" json:"category"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	Tags      JSONArray `gorm:"type:json" json:"tags"`
	SortOrder int       `gorm:"column:sort_order;default:0" json:"sortOrder"`
	// RAG 语义层：向量表征（float32 little-endian 序列化）。离线或按需回填，不影响现有检索。
	Embedding  []byte     `gorm:"column:embedding;type:mediumblob" json:"-"`
	EmbedModel *string    `gorm:"column:embed_model;size:64" json:"-"`
	EmbedAt    *time.Time `gorm:"column:embed_at" json:"-"`
	CreatedAt  time.Time  `gorm:"column:created_at" json:"createdAt"`
}

func (LifeAgentKnowledgeEntry) TableName() string { return "life_agent_knowledge_entries" }

type LifeAgentStructuredFact struct {
	ID              string     `gorm:"primaryKey;size:36" json:"id"`
	ProfileID       string     `gorm:"column:profile_id;size:36;not null;index" json:"-"`
	FactKey         string     `gorm:"column:fact_key;size:64;not null;index" json:"factKey"`
	FactValue       string     `gorm:"column:fact_value;type:text;not null" json:"factValue"`
	FactType        string     `gorm:"column:fact_type;size:32;not null;default:hard_fact" json:"factType"`
	Source          string     `gorm:"size:32;not null;default:profile" json:"source"`
	Confidence      string     `gorm:"size:16;not null;default:high" json:"confidence"`
	Status          string     `gorm:"size:16;not null;default:confirmed" json:"status"`
	Evidence        JSONMap    `gorm:"column:evidence;type:json" json:"evidence"`
	LastConfirmedAt *time.Time `gorm:"column:last_confirmed_at" json:"lastConfirmedAt"`
	CreatedAt       time.Time  `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt       time.Time  `gorm:"column:updated_at" json:"updatedAt"`
}

func (LifeAgentStructuredFact) TableName() string { return "life_agent_structured_facts" }

type LifeAgentTopicSummary struct {
	ID                string    `gorm:"primaryKey;size:36" json:"id"`
	ProfileID         string    `gorm:"column:profile_id;size:36;not null;index" json:"-"`
	TopicGroup        string    `gorm:"column:topic_group;size:64;not null;index" json:"topicGroup"`
	TopicKey          string    `gorm:"column:topic_key;size:128;not null;index" json:"topicKey"`
	TopicLabel        string    `gorm:"column:topic_label;size:255;not null" json:"topicLabel"`
	Summary           string    `gorm:"type:text;not null" json:"summary"`
	Aliases           JSONArray `gorm:"type:json" json:"aliases"`
	QuestionPatterns  JSONArray `gorm:"column:question_patterns;type:json" json:"questionPatterns"`
	SourceEntryIDs    JSONArray `gorm:"column:source_entry_ids;type:json" json:"sourceEntryIds"`
	Source            string    `gorm:"size:16;not null;default:knowledge" json:"source"`
	Confidence        string    `gorm:"size:16;not null;default:medium" json:"confidence"`
	Status            string    `gorm:"size:16;not null;default:active" json:"status"`
	ManualEdited      bool      `gorm:"column:manual_edited;default:false" json:"manualEdited"`
	MergedIntoTopicID *string   `gorm:"column:merged_into_topic_id;size:36" json:"mergedIntoTopicId"`
	Embedding         []byte     `gorm:"column:embedding;type:mediumblob" json:"-"`
	EmbedModel        *string    `gorm:"column:embed_model;size:64" json:"-"`
	EmbedAt           *time.Time `gorm:"column:embed_at" json:"-"`
	CreatedAt         time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt         time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

func (LifeAgentTopicSummary) TableName() string { return "life_agent_topic_summaries" }

type LifeAgentChatSession struct {
	ID                 string    `gorm:"primaryKey;size:36"`
	ProfileID          string    `gorm:"column:profile_id;size:36;not null;index"`
	BuyerID            string    `gorm:"column:buyer_id;size:36;not null;index"`
	Title              string    `gorm:"size:255;not null"`
	Status             string    `gorm:"size:32;default:active"`
	Summary            *string   `gorm:"column:summary;type:text"`
	MemoryJSON         JSONMap   `gorm:"column:memory_json;type:json"`
	MemoryReviewStatus string    `gorm:"column:memory_review_status;size:16;default:auto"`
	IsAPI              bool      `gorm:"column:is_api;default:false;index"`
	InvokeKeyID        *string   `gorm:"column:invoke_key_id;size:36"`
	CreatedAt          time.Time `gorm:"column:created_at"`
	UpdatedAt          time.Time `gorm:"column:updated_at"`
}

func (LifeAgentChatSession) TableName() string { return "life_agent_chat_sessions" }

type LifeAgentChatMessage struct {
	ID               string    `gorm:"primaryKey;size:36"`
	SessionID        string    `gorm:"column:session_id;size:36;not null;index"`
	Role             string    `gorm:"size:32;not null"`
	Content          string    `gorm:"type:text;not null"`
	AudioURL         *string   `gorm:"column:audio_url;size:512"`
	AudioFormat      *string   `gorm:"column:audio_format;size:16"`
	AudioData        []byte    `gorm:"column:audio_data;type:longblob"`
	AudioDurationSec *int      `gorm:"column:audio_duration_sec"`
	Refs             JSONAny   `gorm:"column:refs;type:json"`
	CreatedAt        time.Time `gorm:"column:created_at"`
}

func (LifeAgentChatMessage) TableName() string { return "life_agent_chat_messages" }

// LifeAgentCoEditState 创建者在「对话调教」页的对话与上次变更快照（与买家咨询会话 life_agent_chat_sessions 分离）
type LifeAgentCoEditState struct {
	ID          string    `gorm:"primaryKey;size:36"`
	ProfileID   string    `gorm:"column:profile_id;size:36;not null;uniqueIndex"`
	UserID      string    `gorm:"column:user_id;size:36;not null;index"`
	ChatHistory string    `gorm:"column:chat_history;type:json;not null"`
	LastChange  *string   `gorm:"column:last_change;type:json"`
	CreatedAt   time.Time `gorm:"column:created_at"`
	UpdatedAt   time.Time `gorm:"column:updated_at"`
}

func (LifeAgentCoEditState) TableName() string { return "life_agent_co_edit_states" }

type LifeAgentQuestionPack struct {
	ID            string    `gorm:"primaryKey;size:36"`
	ProfileID     string    `gorm:"column:profile_id;size:36;not null;index"`
	BuyerID       string    `gorm:"column:buyer_id;size:36;not null;index"`
	QuestionCount int       `gorm:"column:question_count;not null"`
	QuestionsUsed int       `gorm:"column:questions_used;default:0"`
	AmountPaid    int       `gorm:"column:amount_paid;not null"`
	Status        string    `gorm:"size:32;default:paid"`
	CreatedAt     time.Time `gorm:"column:created_at"`
}

func (LifeAgentQuestionPack) TableName() string { return "life_agent_question_packs" }

// WechatPayOrder 微信支付 Native 预下单记录（支付成功后写入提问包）。
type WechatPayOrder struct {
	ID             string     `gorm:"primaryKey;size:36"`
	OutTradeNo     string     `gorm:"column:out_trade_no;size:32;uniqueIndex;not null"`
	Kind           string     `gorm:"size:32;not null"` // life_agent_pack
	BuyerID        string     `gorm:"column:buyer_id;size:36;not null;index"`
	ProfileID      string     `gorm:"column:profile_id;size:36;not null;index"`
	QuestionCount  int        `gorm:"column:question_count;not null"`
	AmountTotalFen int        `gorm:"column:amount_total_fen;not null"`
	Status         string     `gorm:"size:16;not null;index"` // pending, paid, closed
	CodeURL        string     `gorm:"column:code_url;type:text"`
	TransactionID  *string    `gorm:"column:transaction_id;size:64"`
	CreatedAt      time.Time  `gorm:"column:created_at"`
	PaidAt         *time.Time `gorm:"column:paid_at"`
}

func (WechatPayOrder) TableName() string { return "wechat_pay_orders" }

type LifeAgentFeedback struct {
	ID               string    `gorm:"primaryKey;size:36"`
	ProfileID        string    `gorm:"column:profile_id;size:36;not null;index"`
	MessageID        string    `gorm:"column:message_id;size:36;not null;index"`
	SessionID        string    `gorm:"column:session_id;size:36;not null;index"`
	BuyerID          string    `gorm:"column:buyer_id;size:36;not null;index"`
	FeedbackType     string    `gorm:"column:feedback_type;size:32;not null"` // helpful, not_specific, not_suitable, factual_error, contradiction, too_confident
	UserQuestion     *string   `gorm:"column:user_question;size:500"`
	AssistantExcerpt *string   `gorm:"column:assistant_excerpt;size:500"`
	Comment          *string   `gorm:"column:comment;type:text"`
	SourceRefs       JSONAny   `gorm:"column:source_refs;type:json"`
	CreatedAt        time.Time `gorm:"column:created_at"`
}

func (LifeAgentFeedback) TableName() string { return "life_agent_feedbacks" }

type LifeAgentRating struct {
	ID                 string    `gorm:"primaryKey;size:36"`
	ProfileID          string    `gorm:"column:profile_id;size:36;not null;index;uniqueIndex:idx_life_agent_rating_unique"`
	BuyerID            string    `gorm:"column:buyer_id;size:36;not null;index;uniqueIndex:idx_life_agent_rating_unique"`
	Score              int       `gorm:"column:score;not null"`
	Comment            *string   `gorm:"column:comment;type:text"`
	LastRatedMilestone int       `gorm:"column:last_rated_milestone;default:0"`
	CreatedAt          time.Time `gorm:"column:created_at"`
	UpdatedAt          time.Time `gorm:"column:updated_at"`
}

func (LifeAgentRating) TableName() string { return "life_agent_ratings" }

type LifeAgentBlindSpot struct {
	ID            string    `gorm:"primaryKey;size:36"`
	ProfileID     string    `gorm:"column:profile_id;size:36;not null;index"`
	SessionID     string    `gorm:"column:session_id;size:36;not null"`
	UserQuestion  string    `gorm:"column:user_question;type:text;not null"`
	Confidence    string    `gorm:"column:confidence;size:16;not null"`
	Route         string    `gorm:"column:route;size:32"`
	Reasons       JSONAny   `gorm:"column:reasons;type:json"`
	Resolved      bool      `gorm:"column:resolved;default:false"`
	CreatedAt     time.Time `gorm:"column:created_at"`
}

func (LifeAgentBlindSpot) TableName() string { return "life_agent_blind_spots" }

type LifeAgentLiveUpdate struct {
	ID        string    `gorm:"primaryKey;size:36"`
	ProfileID string    `gorm:"column:profile_id;size:36;not null;index"`
	Content   string    `gorm:"column:content;type:text;not null"`
	Category  string    `gorm:"column:category;size:64;not null;default:general"`
	Location  *string   `gorm:"column:location;size:255"`
	ExpiresAt  *time.Time `gorm:"column:expires_at;index"`
	Pinned     bool       `gorm:"column:pinned;default:false"`
	Embedding  []byte     `gorm:"column:embedding;type:mediumblob"`
	EmbedModel *string    `gorm:"column:embed_model;size:64"`
	EmbedAt    *time.Time `gorm:"column:embed_at"`
	CreatedAt  time.Time  `gorm:"column:created_at;index"`
	UpdatedAt  time.Time  `gorm:"column:updated_at"`
}

func (LifeAgentLiveUpdate) TableName() string { return "life_agent_live_updates" }

// LifeAgentEpisode：从历史会话中提炼的「情景片段」。
// 与 KnowledgeEntry 的区别：
//   KnowledgeEntry  —— 创作者填写的抽象经验（通用、半永久）
//   Episode         —— "这个 Agent 跟某个买家的某次会话里实际发生过什么"
// 隐私：默认 buyer_only，不跨买家检索；未来可通过 privacy_level 支持匿名化聚合。
type LifeAgentEpisode struct {
	ID        string `gorm:"primaryKey;size:36"`
	ProfileID string `gorm:"column:profile_id;size:36;not null;index"`
	SessionID string `gorm:"column:session_id;size:36;not null;index"`
	BuyerID   string `gorm:"column:buyer_id;size:36;not null;index"`

	// 情景内容
	// Kind 取值：experience_shared / empathy_moment / advice_given / boundary_kept /
	//           confusion_resolved / blind_spot
	Kind      string  `gorm:"column:kind;size:32;not null;index"`
	Title     string  `gorm:"column:title;size:255"`
	Situation string  `gorm:"column:situation;type:text"`
	UserState string  `gorm:"column:user_state;type:text"`
	AgentMove string  `gorm:"column:agent_move;type:text"`
	Outcome   string  `gorm:"column:outcome;size:32;default:neutral"`
	Lesson    *string `gorm:"column:lesson;type:text"`

	// 索引与向量
	TopicKeys  JSONArray  `gorm:"column:topic_keys;type:json"`
	EntryIDs   JSONArray  `gorm:"column:entry_ids;type:json"`
	Embedding  []byte     `gorm:"column:embedding;type:mediumblob"`
	EmbedModel *string    `gorm:"column:embed_model;size:64"`
	EmbedAt    *time.Time `gorm:"column:embed_at"`

	// 时空 & 隐私
	OccurredAt   time.Time `gorm:"column:occurred_at;index"`
	PrivacyLevel string    `gorm:"column:privacy_level;size:16;default:buyer_only"`
	CreatedAt    time.Time `gorm:"column:created_at"`
}

func (LifeAgentEpisode) TableName() string { return "life_agent_episodes" }

// LifeAgentPerceptualTrace：一次会话内「用户状态」的轨迹点。
// 不存原始消息（那是 LifeAgentChatMessage 的职责），只存被感知层翻译后的信号，
// 让 Agent 能看到情绪/诉求的"走向"，而不是某一轮的快照。
type LifeAgentPerceptualTrace struct {
	ID         string    `gorm:"primaryKey;size:36"`
	SessionID  string    `gorm:"column:session_id;size:36;not null;index"`
	TurnIndex  int       `gorm:"column:turn_index;not null"`
	Emotion    string    `gorm:"column:emotion;size:32"`   // neutral/anxious/confused/skeptical/frustrated
	Intensity  string    `gorm:"column:intensity;size:16"` // low/medium/high
	Intent     string    `gorm:"column:intent;size:32"`    // small_talk/casual_info/deep_consult
	LengthPref string    `gorm:"column:length_pref;size:16"` // concise/neutral/elaborate
	MetaInstr  *string   `gorm:"column:meta_instr;size:128"` // 诸如 want_detail / stop_advice
	TopicFocus JSONArray `gorm:"column:topic_focus;type:json"`
	CreatedAt  time.Time `gorm:"column:created_at;index"`
}

func (LifeAgentPerceptualTrace) TableName() string { return "life_agent_perceptual_traces" }
