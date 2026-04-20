package wechatpay

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/wechatpay-apiv3/wechatpay-go/core"
	"github.com/wechatpay-apiv3/wechatpay-go/core/auth/verifiers"
	"github.com/wechatpay-apiv3/wechatpay-go/core/downloader"
	"github.com/wechatpay-apiv3/wechatpay-go/core/notify"
	"github.com/wechatpay-apiv3/wechatpay-go/core/option"
	"github.com/wechatpay-apiv3/wechatpay-go/utils"
)

var (
	initOnce sync.Once
	initErr  error
	client   *core.Client
	notifyH  *notify.Handler
	mchID    string
)

// Init 注册平台证书下载器并初始化 HTTP Client、回调验签处理器。未配置微信支付时为空操作。
func Init(cfg *config.Config) error {
	initOnce.Do(func() {
		if !cfg.WeChatPayEnabled() {
			return
		}
		mchID = strings.TrimSpace(cfg.WeChatPayMchID)
		pk, err := utils.LoadPrivateKeyWithPath(strings.TrimSpace(cfg.WeChatPayPrivateKeyPath))
		if err != nil {
			initErr = fmt.Errorf("load wechat pay private key: %w", err)
			return
		}
		ctx := context.Background()
		if err := downloader.MgrInstance().RegisterDownloaderWithPrivateKey(
			ctx,
			pk,
			strings.TrimSpace(cfg.WeChatPayMchCertSerial),
			mchID,
			strings.TrimSpace(cfg.WeChatPayAPIv3Key),
		); err != nil {
			initErr = fmt.Errorf("register wechat pay certificate downloader: %w", err)
			return
		}
		downloader.MgrInstance().DownloadCertificates(ctx)

		opts := []core.ClientOption{
			option.WithWechatPayAutoAuthCipher(
				mchID,
				strings.TrimSpace(cfg.WeChatPayMchCertSerial),
				pk,
				strings.TrimSpace(cfg.WeChatPayAPIv3Key),
			),
		}
		client, initErr = core.NewClient(ctx, opts...)
		if initErr != nil {
			return
		}

		visitor := downloader.MgrInstance().GetCertificateVisitor(mchID)
		v := verifiers.NewSHA256WithRSAVerifier(visitor)
		notifyH, initErr = notify.NewRSANotifyHandler(strings.TrimSpace(cfg.WeChatPayAPIv3Key), v)
	})
	return initErr
}

// Enabled 是否已配置并初始化成功。
func Enabled() bool {
	return client != nil && notifyH != nil
}

// Client 直连商户 API v3 客户端（须先 Init 且配置完整）。
func Client() *core.Client {
	return client
}

// NotifyHandler 支付结果通知验签与解密（须先 Init 且配置完整）。
func NotifyHandler() *notify.Handler {
	return notifyH
}

// MchID 当前商户号。
func MchID() string {
	return mchID
}
