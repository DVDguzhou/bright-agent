// 一次性工具：将 yantuseed 内档案原名替换为微信风格昵称（正文同步替换）。
// 在 backend 目录执行：go run ./scripts/rewrite_yantu_wechat_names
package main

import (
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// 顺序与 yantuseed.Profiles() 一致；昵称风格刻意混杂（符号/英文/emoji/口语等）。
var pairs = [][2]string{
	{"姚胜杰", "凌晨四点半"},
	{"张贵硕", "Leo_真的不熬夜"},
	{"杨晨阳", "🍊橙子味的周二"},
	{"李研", "mmm红豆泥"},
	{"周意诚", "id随便啦_"},
	{"徐修远", "西柚气泡水oO"},
	{"胡双", "hw_817"},
	{"张旸", "油茶麻花脆"},
	{"甘雨由", "雨由由呀"},
	{"刘雨辰", "辰辰今天摸鱼"},
	{"林雨欣", "林林七点半"},
	{"林浩然", "浩仔不跑路"},
	{"刘路平", "路平_Ping"},
	{"陈铭洋", "铭洋MYang"},
	{"曹乐怡", "乐乐今天开心"},
	{"党云", "云朵☁️轻一点"},
	{"李恒佳", "HJ·碎碎念"},
	{"陈强超", "强超强待机"},
	{"范晨欣", "欣欣一个人"},
	{"陈逸飞", "fly飞飞不飞"},
	{"丰伟佳", "丰丰OvO"},
	{"洪钰溯", "溯溯回溯中"},
	{"李亮", "阿亮别闹"},
	{"李若澄", "澄澄子呀"},
	{"徐明茗", "mio茗一下"},
	{"应浩", "应一声就好"},
	{"陈毅然", "毅然拒绝内卷"},
	{"关宁", "ning_关关"},
	{"梁凯毅", "KY梁同学"},
	{"刘骥宇", "不是鲫鱼是骥宇"},
	{"邱云昊", "昊昊不下饭"},
	{"王铭泽", "铭泽MZday"},
	{"李泓毅", "泓毅hyi"},
	{"徐睿哲", "zzz睿哲"},
	{"赵子楠", "楠楠南下中"},
	{"全国瑞", "瑞瑞想当咸鱼"},
	{"何怡君", "君君不敢菌"},
	{"马沄", "马马马卷云"},
	{"陈夏忞", "忞忞很少上线"},
	{"刘洵孜", "下雨了楹楹"},
	{"毛宇豪", "毛毛雨别再下"},
	{"周凯文", "Kevin在改版"},
	{"李翔天", "天天想赖床"},
	{"许璟", "璟_小灯泡"},
	{"陈龙腾", "龙腾四海小号"},
	{"夏睿哲", "夏夏_rz"},
	{"缪亦平", "亦平没披萨"},
	{"张法", "法条啃不动"},
	{"邓翕跃", "翕跃十点半"},
	{"葛锴杰", "KJ杰哥慢走"},
	{"马万腾", "万腾一根葱"},
	{"吴之昊", "wzh昊啊昊"},
	{"张泽暄", "暄暄别催啦"},
	{"陈泽", "泽_ChillZ"},
	{"唐梓峰", "Peak唐不糖"},
	{"田泽睿", "田田今天吃饱"},
	{"奚泽成", "奚奚哈哈哈哈"},
	{"宣能恺", "nk能开张吗"},
	{"戴昀祥", "昀祥今天晴"},
	{"廖华泽", "sleep华泽先"},
	{"刘虎贲", "虎贲不干杯"},
	{"钱昕玥", "shine昕玥"},
	{"叶煦华", "煦华慢半拍__"},
}

func main() {
	root := filepath.Join("internal", "yantuseed")
	// 长名先替换，降低二字名误伤概率
	sort.Slice(pairs, func(i, j int) bool {
		return len([]rune(pairs[i][0])) > len([]rune(pairs[j][0]))
	})
	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() || !strings.HasSuffix(path, ".go") {
			return nil
		}
		b, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		s := string(b)
		for _, p := range pairs {
			s = strings.ReplaceAll(s, p[0], p[1])
		}
		if string(b) != s {
			if err := os.WriteFile(path, []byte(s), 0o644); err != nil {
				return err
			}
			log.Println("updated", path)
		}
		return nil
	})
	if err != nil {
		log.Fatal(err)
	}
	log.Println("done")
}
