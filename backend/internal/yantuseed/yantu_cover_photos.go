package yantuseed

import (
	"crypto/sha256"
	"encoding/binary"
	"sync"
)

// 方形头像用图：人物/宠物特写以 crop=faces 居中面部；无脸素材用 crop=entropy 取画面焦点。
// 许可见 https://unsplash.com/license（均为免版税素材，非真实用户本人照片）。
const avatarSize = "720"

func avatarFace(slug string) string {
	return "https://images.unsplash.com/" + slug + "?auto=format&w=" + avatarSize + "&h=" + avatarSize + "&fit=crop&crop=faces&q=82"
}

func avatarEntropy(slug string) string {
	return "https://images.unsplash.com/" + slug + "?auto=format&w=" + avatarSize + "&h=" + avatarSize + "&fit=crop&crop=entropy&q=82"
}

// YantuCoverPhotoURLs 人生 Agent 默认「头像感」封面图池（产品里 cover 常作卡片头图/头像展示）；
// 与 Profiles() 顺序映射时每人一张。
var YantuCoverPhotoURLs = []string{
	avatarFace("photo-1534528741775-53994a69daeb"),
	avatarFace("photo-1494790108377-be9c29b29330"),
	avatarFace("photo-1438761681033-6461ffad8d80"),
	avatarFace("photo-1524504388940-b1c1722653e1"),
	avatarFace("photo-1544005313-94ddf0286df2"),
	avatarFace("photo-1531746020798-e6953c6e8e04"),
	avatarFace("photo-1487412720507-e7ab37603c6f"),
	avatarFace("photo-1580480016243-531e4d064586"),
	avatarFace("photo-1573496359950-38e5f3edc7c0"),
	avatarFace("photo-1599423004299-66f874c02df8"),
	avatarFace("photo-1529626455594-4ff0802cfb7e"),
	avatarFace("photo-1508214751196-bcfd4ca60f91"),
	avatarFace("photo-1516588590590-a2e6a1070b89"),
	avatarFace("photo-1521141282439-d18c3c9b3f64"),
	avatarFace("photo-1499558345589-1369013d9214"),
	avatarFace("photo-1502767089025-6572e6da5e6d"),
	avatarFace("photo-1471115853179-b3822296ba65"),
	avatarFace("photo-1508386444274-30212a66f08e"),
	avatarFace("photo-1463458785282-543dc5fbaff5"),
	avatarFace("photo-1513958268868-e4df81d4a3e1"),
	avatarFace("photo-1509967419530-dead22fdfa58"),
	avatarFace("photo-1506794778202-cad84cf45f1d"),
	avatarFace("photo-1507003211169-0a1dd7228f2d"),
	avatarFace("photo-1500648767791-00dcc994a43e"),
	avatarFace("photo-1527980965255-d3b416303d12"),
	avatarFace("photo-1504257438649-fedf528d9450"),
	avatarFace("photo-1560250097-0b93528c311a"),
	avatarFace("photo-1519085360753-af0119f7c751"),
	avatarFace("photo-1472094159864-43297d14070d"),
	avatarFace("photo-1566497375562-39e8e27f9247"),
	avatarFace("photo-1519345182560-3f2917c472ef"),
	avatarFace("photo-1521118228500-c3c85bd6e1e9"),
	avatarFace("photo-1503454537195-1dcbbf73f60f"),
	avatarFace("photo-1552058544-f08e6ee7e4c5"),
	avatarFace("photo-1570295996919-602beb3d4147"),
	avatarFace("photo-1621905251918-48416bd8575a"),
	avatarFace("photo-1600180758890-6b945fe28476"),
	avatarFace("photo-1583195764036-6dc248ac07d9"),
	avatarFace("photo-1554727243-7c3755d15c62"),
	avatarFace("photo-1540555700478-4be289fbecef"),
	avatarFace("photo-1594744803329-e58b31de8bf5"),
	avatarFace("photo-1607746882042-944635dfe10e"),
	avatarFace("photo-1621599560909-5f1c7ffe288d"),
	avatarFace("photo-1619895862571-16a04749b693"),
	avatarFace("photo-1628153375733-36210684748a"),
	avatarFace("photo-1599566150163-04394fd4843e"),
	avatarFace("photo-1625895197185-27610be04db9"),
	avatarFace("photo-1601455763557-db1bea8a9e5f"),
	avatarFace("photo-1521572163474-6864f9cf17ab"),
	avatarFace("photo-1532073150508-0c1a022acc1e"),
	avatarFace("photo-1633332755192-727a05c4013d"),
	avatarFace("photo-1531123414780-f7424f2b76cd"),
	avatarFace("photo-1543466835-6629c73e973e"),
	avatarFace("photo-1574158622682-e40e69881006"),
	avatarFace("photo-1517849845537-4d257902454a"),
	avatarFace("photo-1548199978-03cee0a4b527"),
	avatarFace("photo-1587300008628-01208653f061"),
	avatarFace("photo-1511046636133-f61b6c787321"),
	avatarFace("photo-1573865526142-942a90e96dac"),
	avatarFace("photo-1583337130417-334622a0fd13"),
	avatarFace("photo-1526336025654-0fd23ebac2d6"),
	avatarEntropy("photo-1557682250-33bd709cbe85"),
	avatarEntropy("photo-1579546929518-9e396f3cc809"),
	avatarEntropy("photo-1618005182384-a83a8bd57f68"),
	avatarEntropy("photo-1558591718-3e8d3135c6c1"),
	avatarEntropy("photo-1557672172-298e090bd0f1"),
	avatarEntropy("photo-1620121692029-d088fcdd48cc"),
	avatarEntropy("photo-1550684848-fac1c5b4e853"),
	avatarEntropy("photo-1506905925346-21bda4d32df4"),
	avatarEntropy("photo-1519681393784-d120267933ba"),
	avatarEntropy("photo-1470071459604-3b5ec3a7fe05"),
	avatarEntropy("photo-1493246507139-91e8fad9978e"),
	avatarEntropy("photo-1501785888041-af3ef285d470"),
	avatarEntropy("photo-1518837695005-2083093ee35b"),
}

// CoverURLForDisplayName 按昵称哈希映射到图池（用于非内置档案的兜底）。
func CoverURLForDisplayName(displayName string) string {
	pool := YantuCoverPhotoURLs
	if len(pool) == 0 {
		return ""
	}
	h := sha256.Sum256([]byte(displayName))
	i := int(binary.BigEndian.Uint64(h[:8]) % uint64(len(pool)))
	return pool[i]
}

var (
	yantuCoverByDisplayName map[string]string
	yantuCoverOnce          sync.Once
)

// YantuSeedCoverURL 按 Profiles() 固定顺序为每位榜样分配不同封面（循环使用图池），避免哈希撞车。
func YantuSeedCoverURL(displayName string) string {
	pool := YantuCoverPhotoURLs
	if len(pool) == 0 {
		return ""
	}
	yantuCoverOnce.Do(func() {
		m := make(map[string]string)
		for i, p := range Profiles() {
			m[p.DisplayName] = pool[i%len(pool)]
		}
		yantuCoverByDisplayName = m
	})
	if u, ok := yantuCoverByDisplayName[displayName]; ok {
		return u
	}
	return CoverURLForDisplayName(displayName)
}
