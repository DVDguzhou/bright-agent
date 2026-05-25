package yantuseed

// PodcastProfiles 四批播客种子（不止大学 + 我下班了 + 校招飞 + 迷你退休），与 Profiles() 末尾顺序一致。
func PodcastProfiles() []Profile {
	out := make([]Profile, 0,
		len(buzhiPodcastProfiles)+len(xiabanlePodcastProfiles)+
			len(xiaozhaofeiPodcastProfiles)+len(minituixiuPodcastProfiles))
	out = append(out, buzhiPodcastProfiles...)
	out = append(out, xiabanlePodcastProfiles...)
	out = append(out, xiaozhaofeiPodcastProfiles...)
	out = append(out, minituixiuPodcastProfiles...)
	return out
}

// PodcastProfileStartIndex 播客在 Profiles() / SplitAccountEmails 中的起始下标（0-based）。
func PodcastProfileStartIndex() int {
	return len(Profiles()) - len(PodcastProfiles())
}

// PodcastSources 四批播客写入 life_agent_profiles.source 的值，用于按来源筛选。
func PodcastSources() []string {
	return []string{
		"不止大学播客",
		"我下班了播客",
		"校招飞播客",
		"迷你退休播客",
	}
}
