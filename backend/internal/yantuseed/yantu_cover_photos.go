package yantuseed

import (
	"crypto/sha256"
	"encoding/binary"
	"sync"
)

// YantuCoverPhotoURLs 为 Unsplash 托管的免版税摄影图（https://unsplash.com/license），
// 用作人生 Agent 装饰封面；与 display_name 哈希映射后每人稳定一张、观感分散。
var YantuCoverPhotoURLs = []string{
	"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1464822759844-d150cef13268?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1501785888041-af3ef285d470?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1494500764479-0ecd8e02e916?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1523712999610-7777fba211fe?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1516455590571-182056e5fbb6?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1526481280695-3c687fd643ed?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1523580846011-d3a45bcacd56?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1498837167922-cddd25e615fc?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1511988617509-a557c1b1c8c4?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1477959858617-67f85cf4f290?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1465146344425-f00d78f5c198?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1516116228319-8687c5afd14e?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1549880338-65ddcdfd836b?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1508613302192-904b495b61c6?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1526493272098-535d2810ea6f?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1496417269825-0635b296d1a2?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1512979367095-4e4876d3f5fc?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1522444196703-f678d648c683?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1526374965328-7f61d4dc5351?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1532012197827-85a064604d2b?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1516548437306-ae87ace5f9f5?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1569946633902-d275bd78fc6e?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1559827531-05f93b4e3e13?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1519505479729-264476b4a666?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1529247709906-dee35d2a2744?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1486318518164-ce62326999d0?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1497366811353-f1878ab0a8fe?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1557800634-62f3cdc84e04?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&w=960&q=80",
	"https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&w=960&q=80",
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
