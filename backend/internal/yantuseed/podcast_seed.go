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
