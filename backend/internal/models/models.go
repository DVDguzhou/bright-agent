package models

import (
	"time"

	"github.com/google/uuid"
)

func GenID() string { return uuid.New().String() }

type User struct {
	ID        string    `gorm:"primaryKey;size:36"`
	Email     string    `gorm:"uniqueIndex;size:255;not null"`
	Password  string    `gorm:"size:255;not null"`
	Name      *string   `gorm:"size:255"`
	AvatarURL *string   `gorm:"column:avatar_url;type:text"`
	RoleFlags JSONMap   `gorm:"column:role_flags;type:json"`
	CreatedAt time.Time `gorm:"column:created_at"`

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
	ID               string    `gorm:"primaryKey;size:36"`
	UserID           string    `gorm:"column:user_id;size:36;not null;index"`
	DisplayName      string    `gorm:"column:display_name;size:255;not null"`
	Headline         string    `gorm:"size:512;not null"`
	ShortBio         string    `gorm:"column:short_bio;size:500;not null"`
	LongBio          string    `gorm:"column:long_bio;type:text;not null"`
	Audience         string    `gorm:"type:text;not null"`
	WelcomeMessage   string    `gorm:"column:welcome_message;type:text;not null"`
	PricePerQuestion int       `gorm:"column:price_per_question;default:990"`
	ExpertiseTags    JSONArray `gorm:"column:expertise_tags;type:json"`
	SampleQuestions  JSONArray `gorm:"column:sample_questions;type:json"`
	Education        *string   `gorm:"column:education;size:128"` // 学历
	Income           *string   `gorm:"column:income;size:64"`     // 收入
	Job              *string   `gorm:"column:job;size:255"`       // 工作
	School           *string   `gorm:"column:school;size:255"`    // 学校
	Country          *string   `gorm:"column:country;size:64"`
	Province         *string   `gorm:"column:province;size:64"`
	City             *string   `gorm:"column:city;size:64"`
	County           *string   `gorm:"column:county;size:64"`
	Regions          JSONArray `gorm:"column:regions;type:json"`
	MBTI             *string   `gorm:"column:mbti;size:8"`
	PersonaArchetype *string   `gorm:"column:persona_archetype;size:64"`
	ToneStyle        *string   `gorm:"column:tone_style;size:64"`
	ResponseStyle    *string   `gorm:"column:response_style;size:64"`
	ForbiddenPhrases JSONArray `gorm:"column:forbidden_phrases;type:json"`
	ExampleReplies   JSONArray `gorm:"column:example_replies;type:json"`
	NotSuitableFor   *string   `gorm:"column:not_suitable_for;type:text"` // 不能/不想回答的问题
	VerificationStatus string  `gorm:"column:verification_status;size:32;default:none"` // none=未申请, pending=申请待认证, verified=已认证
	VoiceCloneID     *string   `gorm:"column:voice_clone_id;size:128"` // 百炼系统音色名或声音复刻返回的 voice id
	Published        bool      `gorm:"default:true;index"` // 列表筛选 published=true 时用
	CreatedAt        time.Time `gorm:"column:created_at"`
	UpdatedAt        time.Time `gorm:"column:updated_at"`
}

func (LifeAgentProfile) TableName() string { return "life_agent_profiles" }

type LifeAgentKnowledgeEntry struct {
	ID        string    `gorm:"primaryKey;size:36" json:"id"`
	ProfileID string    `gorm:"column:profile_id;size:36;not null;index" json:"-"`
	Category  string    `gorm:"size:128;not null" json:"category"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	Tags      JSONArray `gorm:"type:json" json:"tags"`
	SortOrder int       `gorm:"column:sort_order;default:0" json:"sortOrder"`
	CreatedAt time.Time `gorm:"column:created_at" json:"createdAt"`
}

func (LifeAgentKnowledgeEntry) TableName() string { return "life_agent_knowledge_entries" }

type LifeAgentChatSession struct {
	ID        string    `gorm:"primaryKey;size:36"`
	ProfileID string    `gorm:"column:profile_id;size:36;not null;index"`
	BuyerID   string    `gorm:"column:buyer_id;size:36;not null;index"`
	Title     string    `gorm:"size:255;not null"`
	Status    string    `gorm:"size:32;default:active"`
	CreatedAt time.Time `gorm:"column:created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at"`
}

func (LifeAgentChatSession) TableName() string { return "life_agent_chat_sessions" }

type LifeAgentChatMessage struct {
	ID               string    `gorm:"primaryKey;size:36"`
	SessionID        string    `gorm:"column:session_id;size:36;not null;index"`
	Role             string    `gorm:"size:32;not null"`
	Content          string    `gorm:"type:text;not null"`
	AudioURL         *string   `gorm:"column:audio_url;size:512"`
	AudioDurationSec *int      `gorm:"column:audio_duration_sec"`
	Refs             JSONAny   `gorm:"column:refs;type:json"`
	CreatedAt        time.Time `gorm:"column:created_at"`
}

func (LifeAgentChatMessage) TableName() string { return "life_agent_chat_messages" }

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

type LifeAgentFeedback struct {
	ID               string    `gorm:"primaryKey;size:36"`
	ProfileID        string    `gorm:"column:profile_id;size:36;not null;index"`
	MessageID        string    `gorm:"column:message_id;size:36;not null;index"`
	SessionID        string    `gorm:"column:session_id;size:36;not null;index"`
	BuyerID          string    `gorm:"column:buyer_id;size:36;not null;index"`
	FeedbackType     string    `gorm:"column:feedback_type;size:32;not null"` // helpful, not_specific, not_suitable
	UserQuestion     *string   `gorm:"column:user_question;size:500"`
	AssistantExcerpt *string   `gorm:"column:assistant_excerpt;size:500"`
	Comment          *string   `gorm:"column:comment;type:text"`
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
