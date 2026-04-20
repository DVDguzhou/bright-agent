package handler

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/wechatpay"
	"github.com/gin-gonic/gin"
	"github.com/wechatpay-apiv3/wechatpay-go/core"
	"github.com/wechatpay-apiv3/wechatpay-go/services/payments"
	"github.com/wechatpay-apiv3/wechatpay-go/services/payments/native"
	"gorm.io/gorm/clause"
)

func WeChatPayNativeEnabled(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"enabled": cfg.WeChatPayEnabled() && wechatpay.Enabled()})
	}
}

func clampWeChatDescription(s string) string {
	const max = 120
	if utf8.RuneCountInString(s) <= max {
		return s
	}
	rs := []rune(s)
	return string(rs[:max])
}

func genWechatOutTradeNo() string {
	return strings.ReplaceAll(models.GenID(), "-", "")
}

func lifeAgentRemainingQuestions(profileID, buyerID string) int {
	var remaining int
	db.DB.Raw(
		"SELECT COALESCE(SUM(question_count - questions_used), 0) FROM life_agent_question_packs WHERE profile_id = ? AND buyer_id = ? AND status = ?",
		profileID, buyerID, "paid",
	).Scan(&remaining)
	return remaining
}

// tryFulfillWechatPayOrder 在 trade_state=SUCCESS 且金额一致时创建提问包；已支付则幂等返回剩余次数。
func tryFulfillWechatPayOrder(outTradeNo, wechatTxnID string, amountFen int64, tradeState string) (remaining int, err error) {
	if tradeState != "SUCCESS" {
		return 0, nil
	}
	if strings.TrimSpace(wechatpay.MchID()) == "" {
		return 0, fmt.Errorf("wechat pay not initialized")
	}

	tx := db.DB.Begin()
	if tx.Error != nil {
		return 0, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			_ = tx.Rollback()
			panic(r)
		}
	}()

	var o models.WechatPayOrder
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("out_trade_no = ?", outTradeNo).First(&o).Error; err != nil {
		_ = tx.Rollback()
		return 0, err
	}

	if o.Status == "paid" {
		_ = tx.Rollback()
		return lifeAgentRemainingQuestions(o.ProfileID, o.BuyerID), nil
	}
	if o.Status != "pending" {
		_ = tx.Rollback()
		return 0, fmt.Errorf("unexpected order status %s", o.Status)
	}
	if int64(o.AmountTotalFen) != amountFen {
		_ = tx.Rollback()
		return 0, fmt.Errorf("amount mismatch: want %d got %d", o.AmountTotalFen, amountFen)
	}

	pack := models.LifeAgentQuestionPack{
		ID:            models.GenID(),
		ProfileID:     o.ProfileID,
		BuyerID:       o.BuyerID,
		QuestionCount: o.QuestionCount,
		AmountPaid:    o.AmountTotalFen,
		Status:        "paid",
	}
	if err := tx.Create(&pack).Error; err != nil {
		_ = tx.Rollback()
		return 0, err
	}
	now := time.Now()
	updates := map[string]interface{}{
		"status":  "paid",
		"paid_at": &now,
	}
	if wechatTxnID != "" {
		updates["transaction_id"] = wechatTxnID
	}
	if err := tx.Model(&models.WechatPayOrder{}).Where("id = ? AND status = ?", o.ID, "pending").Updates(updates).Error; err != nil {
		_ = tx.Rollback()
		return 0, err
	}
	if err := tx.Commit().Error; err != nil {
		return 0, err
	}
	return lifeAgentRemainingQuestions(o.ProfileID, o.BuyerID), nil
}

func writeWechatNotifyOK(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "message": "成功"})
}

func writeWechatNotifyFail(c *gin.Context, msg string) {
	c.JSON(http.StatusOK, gin.H{"code": "FAIL", "message": msg})
}

// WeChatPayNotify 微信支付异步通知（无需登录）。
func WeChatPayNotify(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !cfg.WeChatPayEnabled() || !wechatpay.Enabled() {
			writeWechatNotifyFail(c, "pay not configured")
			return
		}
		h := wechatpay.NotifyHandler()
		if h == nil {
			writeWechatNotifyFail(c, "notify handler missing")
			return
		}
		content := new(payments.Transaction)
		if _, err := h.ParseNotifyRequest(context.Background(), c.Request, content); err != nil {
			log.Printf("wechat pay notify: parse: %v", err)
			writeWechatNotifyFail(c, "invalid notify")
			return
		}
		if content.Mchid == nil || strings.TrimSpace(*content.Mchid) != wechatpay.MchID() {
			writeWechatNotifyFail(c, "mchid mismatch")
			return
		}
		if content.OutTradeNo == nil {
			writeWechatNotifyFail(c, "missing out_trade_no")
			return
		}
		outNo := strings.TrimSpace(*content.OutTradeNo)
		tradeState := ""
		if content.TradeState != nil {
			tradeState = strings.TrimSpace(*content.TradeState)
		}
		var amountFen int64
		if content.Amount != nil && content.Amount.Total != nil {
			amountFen = *content.Amount.Total
		}
		tid := ""
		if content.TransactionId != nil {
			tid = strings.TrimSpace(*content.TransactionId)
		}
		if tradeState != "SUCCESS" {
			writeWechatNotifyOK(c)
			return
		}
		if _, err := tryFulfillWechatPayOrder(outNo, tid, amountFen, tradeState); err != nil {
			log.Printf("wechat pay notify: fulfill %s: %v", outNo, err)
			writeWechatNotifyFail(c, "fulfill failed")
			return
		}
		writeWechatNotifyOK(c)
	}
}

// WeChatPayNativeLifeAgentPrepay 创建 Native 扫码订单（人生 Agent 提问包）。
func WeChatPayNativeLifeAgentPrepay(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !cfg.WeChatPayEnabled() || !wechatpay.Enabled() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "WECHAT_PAY_NOT_CONFIGURED"})
			return
		}
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		profileID := c.Param("id")
		var body struct {
			QuestionCount int `json:"questionCount" binding:"required,min=1,max=500"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", profileID).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		if p.UserID == user.ID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "CANNOT_BUY_OWN_PROFILE"})
			return
		}
		amountFen := int64(p.PricePerQuestion * body.QuestionCount)
		if amountFen <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_AMOUNT"})
			return
		}
		outNo := genWechatOutTradeNo()
		order := models.WechatPayOrder{
			ID:             models.GenID(),
			OutTradeNo:     outNo,
			Kind:           "life_agent_pack",
			BuyerID:        user.ID,
			ProfileID:      profileID,
			QuestionCount:  body.QuestionCount,
			AmountTotalFen: int(amountFen),
			Status:         "pending",
			CreatedAt:      time.Now(),
		}
		if err := db.DB.Create(&order).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}

		exp := time.Now().Add(30 * time.Minute)
		desc := clampWeChatDescription(fmt.Sprintf("人生Agent提问包×%d · %s", body.QuestionCount, p.DisplayName))
		svc := native.NativeApiService{Client: wechatpay.Client()}
		resp, _, err := svc.Prepay(context.Background(), native.PrepayRequest{
			Appid:       core.String(cfg.WeChatPayAppIDResolved()),
			Mchid:       core.String(wechatpay.MchID()),
			Description: core.String(desc),
			OutTradeNo:  core.String(outNo),
			TimeExpire:  &exp,
			NotifyUrl:   core.String(cfg.WeChatPayNotifyURLResolved()),
			Amount: &native.Amount{
				Total:    core.Int64(amountFen),
				Currency: core.String("CNY"),
			},
		})
		if err != nil {
			log.Printf("wechat pay prepay: %v", err)
			_ = db.DB.Delete(&models.WechatPayOrder{}, "id = ?", order.ID).Error
			c.JSON(http.StatusBadGateway, gin.H{"error": "WECHAT_PREPAY_FAILED"})
			return
		}
		if resp == nil || resp.CodeUrl == nil || strings.TrimSpace(*resp.CodeUrl) == "" {
			_ = db.DB.Delete(&models.WechatPayOrder{}, "id = ?", order.ID).Error
			c.JSON(http.StatusBadGateway, gin.H{"error": "WECHAT_PREPAY_EMPTY"})
			return
		}
		codeURL := strings.TrimSpace(*resp.CodeUrl)
		if err := db.DB.Model(&models.WechatPayOrder{}).Where("id = ?", order.ID).Update("code_url", codeURL).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"outTradeNo": outNo,
			"codeUrl":    codeURL,
			"amountFen":  int(amountFen),
		})
	}
}

// WeChatPayOrderQuery 查询本地订单；若仍为 pending 则向微信查单并尝试履约。
func WeChatPayOrderQuery(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !cfg.WeChatPayEnabled() || !wechatpay.Enabled() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "WECHAT_PAY_NOT_CONFIGURED"})
			return
		}
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		outNo := strings.TrimSpace(c.Param("outTradeNo"))
		if len(outNo) < 10 || len(outNo) > 32 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_OUT_TRADE_NO"})
			return
		}
		var o models.WechatPayOrder
		if err := db.DB.Where("out_trade_no = ? AND buyer_id = ?", outNo, user.ID).First(&o).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ORDER_NOT_FOUND"})
			return
		}
		if o.Status == "paid" {
			c.JSON(http.StatusOK, gin.H{
				"status":               "paid",
				"remainingQuestions": lifeAgentRemainingQuestions(o.ProfileID, o.BuyerID),
			})
			return
		}
		if o.Status != "pending" {
			c.JSON(http.StatusOK, gin.H{"status": o.Status})
			return
		}

		svc := native.NativeApiService{Client: wechatpay.Client()}
		txn, _, err := svc.QueryOrderByOutTradeNo(context.Background(), native.QueryOrderByOutTradeNoRequest{
			OutTradeNo: core.String(outNo),
			Mchid:      core.String(wechatpay.MchID()),
		})
		if err != nil {
			log.Printf("wechat pay query order %s: %v", outNo, err)
			c.JSON(http.StatusOK, gin.H{"status": "pending"})
			return
		}
		state := ""
		if txn.TradeState != nil {
			state = strings.TrimSpace(*txn.TradeState)
		}
		var amountFen int64
		if txn.Amount != nil && txn.Amount.Total != nil {
			amountFen = *txn.Amount.Total
		}
		tid := ""
		if txn.TransactionId != nil {
			tid = strings.TrimSpace(*txn.TransactionId)
		}
		if state == "SUCCESS" {
			rem, ferr := tryFulfillWechatPayOrder(outNo, tid, amountFen, state)
			if ferr != nil {
				log.Printf("wechat pay query fulfill %s: %v", outNo, ferr)
				c.JSON(http.StatusOK, gin.H{"status": "pending"})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "paid", "remainingQuestions": rem})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": strings.ToLower(state)})
	}
}
