package yantuseed

const csBaoyanLongBioPrefix = `本文来自CS-BAOYAN（计算机保研交流群），著作权属原作者；以下为保研经验分享。`

const (
	csBaoyanAudience       = `计算机相关专业的保研同学。`
	csBaoyanEducation      = `本科（即将保研或已保研）`
	csBaoyanMajorLabel     = `保研方向`
	csBaoyanKnowledgeCat   = `计算机保研经验`
)

var csBaoyanKnowledgeTags = []string{"保研", "夏令营", "计算机", "面试", "推免"}

var csBaoyanProfiles = []Profile{
	{
		DisplayName:       `雪花仓鼠`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研经验 | 清华大学 2021 年九推机试`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN的保研经验分享：清华大学 2021 年九推机试。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `# 清华大学 2021 年九推机试

# 1、售货机

**时间限制：** 1.0 秒

**空间限制：** 512 MiB

## 题目描述

清华大学的自动售货机一共有 𝑛 种饮料出售，每种饮料有自己的售价，并在售货机上各有一个出售口。购买第 𝑖 种饮料时，可以在第 𝑖 个出售口支付 𝑎𝑖 的价格，售货机便会在下方的出货处放出对应的饮料。

又到了清凉的夏日，自动售货机为每种饮料各进货了**1 瓶**存储在其中，供同学购买。但是，自动售货机却出现了一些故障，它有可能会出货不属于这个出售口的饮料。

对于第 𝑖 个出售口，**支付 𝑎𝑖 的价格购买后**，如果饮料 𝑖 与饮料 𝑏𝑖 都有存货，有 𝑝𝑖 的概率出货饮料 𝑖 ，有 1−𝑝𝑖 的概率出货饮料 𝑏𝑖 。如果其中一个有存货，另一个已经没有存货，则将出货有存货的那一种饮料。如果两种饮料都没有存货，售货机将不会出货任何饮料并发出警报。**即便最后你没有获得任何饮料，也需要支付 𝑎𝑖 的价格 ** 。

长颈鹿下楼来到这台售货机前，希望能买到最近火爆全网的饮料 𝑥 ，此时售货机中 𝑛 种饮料都存货有 1 瓶。由于他知道售货机有问题，因此决定采取这样的策略来购买：

- 在 𝑛 个出售口中等概率选择一个出售口 𝑠 开始购买，支付这个出售口的价格 𝑎𝑠 并得到出货。
- 当得到想要的饮料 𝑥 时，停止购买流程，满意欢喜的离去。
- 当得到不想要的饮料 𝑦 时，继续在第 𝑦 个支付口购买，支付 𝑎𝑦 的价格并等待出货。
- 当售货机发出警报时，停止购买流程，灰心丧气的离去。

现在他希望你告诉他，他这一次购买过程期望支付的价钱数量是多少？

## 输入格式

从标准输入读入数据。

第一行两个正整数 𝑛,𝑥。

接下来 𝑛 行每行三个数，其中第 𝑖 行表示 𝑎𝑖,𝑏𝑖,𝑝𝑖。

## 输出格式

输出到标准输出。

一行一个实数表示答案，表示长颈鹿按他的策略买水期望支付的价钱。

记答案为 𝑎，而你的输出为 𝑏，那么当且仅当 |𝑎−𝑏|<10−6 时我们认为你的输出是正确的。

## 样例输入

` + "`" + `` + "`" + `` + "`" + `plain
2 2
8 2 0.90
7 1 0.40
` + "`" + `` + "`" + `` + "`" + `

## 样例输出

` + "`" + `` + "`" + `` + "`" + `plain
13.500000000
` + "`" + `` + "`" + `` + "`" + `

## 样例解释

售货机里饮料 1 与饮料 2 各有一瓶，且当两瓶都还有存货时，在第 1 个出售口有 0.1 的概率买到饮料 2 ，在第 2 个出售口有 0.6 的概率买到饮料 1 。

- 长颈鹿有0.5的概率初始选择第1个出售口开始购买，并支付8元。
  - 有 0.1 的概率直接出货饮料 2 ，一共支付 8 元，这种情况的概率是 0.05 。
  - 有 0.9 的概率出货饮料 1 ，则长颈鹿会再支付 8 元重新从第 1 个出售口购买饮料。由于饮料 1 已售空，第二次购买时必定直接出货饮料 2 ，一共支付 16 元，这种情况的概率是 0.45 。
- 长颈鹿有0.5的概率初始选择第2个出售口开始购买，并支付7元。
  - 有 0.4 的概率直接出货饮料 2 ，一共支付 7 元，这种情况的概率是 0.2 。
  - 有 0.6 的概率出货饮料 1 ，则长颈鹿会再支付 8 元重新从第 1 个出售口购买饮料。由于饮料 1 已售空，第二次购买时必定直接出货饮料 2 ，一共支付 15 元，这种情况的概率是 0.3 。

于是期望支付的价钱为 8×0.05+16×0.45+7×0.2+15×0.3=13.5

## 子任务

保证 𝑛≤2000 ， 1≤𝑏𝑖≤𝑛 , 𝑏𝑖≠𝑖 , 0≤𝑎𝑖≤100 ，0≤𝑝𝑖≤1 ，且 𝑝𝑖 不超过两位小数。

子任务 1（50分）：𝑛≤10

子任务 2（30分）：𝑝𝑖=0

子任务 3（20分）：无特殊限制





# 2、水滴

**时间限制：** 2.0 秒

**空间限制：** 512 MiB

**相关文件：** 题目目录

## 题目描述

这是一个经典的游戏。

在一个 𝑛×𝑚 的棋盘上，每一个格子中都有一些水滴。

玩家的操作是，在一个格子中加一滴水。

当一个格子中的水滴数超过了 4，这一大滴水就会因格子承载不住而向外扩散。扩散的规则是这样的：

这个格子中的水滴会消失，然后分别向上、左、下、右 4 个方向发射一个水滴。如果水滴碰到一个有水的格子，就会进入这个格子。否则水滴会继续移动直到到达棋盘边界后消失。扩散后，水滴进入新的格子可能导致该格子的水滴数也超过 4 ，则会立即引发这个格子的扩散。我们规定，每个格子按逆时针顺序从上方向开始，递归处理完每一个方向的扩散以及其引发的连锁反应，再处理下一个方向的扩散。

给定棋盘的初始状态和玩家的操作，求最后水滴的分布情况。

由于把水滴在一个空格看起来用处不大，所以保证所有的玩家操作都不会选择空格。

提示：可以记录每个水滴上下左右方向第一个水滴的位置，扩散时根据规则模拟，并在每次操作后维护。

## 输入格式

从标准输入读入数据。

第一行四个整数 𝑛,𝑚,𝑐,𝑇。

接下来 𝑐 行，每行三个正整数 𝑥𝑖,𝑦𝑖,𝑎𝑖，表示初始棋盘上第 𝑥𝑖 行 𝑦𝑖 列有 𝑎𝑖 个水滴。

接下来 𝑇 行，每行两个正整数 𝑢𝑖,𝑣𝑖，表示在第 𝑢𝑖 行 𝑣𝑖 列放入一个水滴。

## 输出格式

输出到标准输出。

输出 𝑇 加若干行。

前 𝑇 行每行一个整数，第 𝑖 行表示在第 𝑖 次操作后扩散的水滴数。若没有扩散输出 0。

最后若干行（可能是 0 行）表示棋盘上水滴的分布情况。由上至下，由左至右输出，每行三个正整数表示行号、列号、水滴数。

## 样例输入

` + "`" + `` + "`" + `` + "`" + `plain
4 4 12 1
1 2 1
1 3 2
2 1 1
2 4 1
3 1 1
3 4 1
4 2 1
4 3 1
2 2 4
2 3 4
3 2 4
3 3 3
2 2
` + "`" + `` + "`" + `` + "`" + `

## 样例输出

` + "`" + `` + "`" + `` + "`" + `plain
4
1 2 3
1 3 4
2 1 3
2 4 2
3 1 3
3 4 2
4 2 2
4 3 2
` + "`" + `` + "`" + `` + "`" + `

## 样例解释

 

整个过程从上到下从左到右表示。

字母表示该格子即将发射水滴的方向。U：上；D：下；L：左；R：右。

黄色格子表示即将发射水滴的格子。

## 子任务

保证 1≤𝑛,𝑚≤351493，0≤𝑐≤750000，0≤𝑇≤500000。

保证 1≤𝑥𝑖,𝑢𝑖≤𝑛,1≤𝑦𝑖,𝑣𝑖≤𝑚,1≤𝑎𝑖≤4。

保证没有重复的 (𝑥𝑖,𝑦𝑖)。

子任务 1（17分）：𝑛,𝑚≤100

子任务 2（24分）：𝑛,𝑚≤2000

子任务 3（24分）：𝑐≤105

子任务 4（35分）：无特殊性质





# 3、Phi的游戏

**时间限制：** 1.5 秒

**空间限制：** 512 MiB

## 题目描述

Picar 和 Roman 是两个非常喜欢玩各种游戏的赌徒。这一天，他们又发现了一种新的数字游戏，名叫 𝜑 的游戏（Phigames）。

𝜑 的游戏是双人游戏，每局游戏由任意的一个正整数 𝑁 开始，由两人轮流对当前的数字进行操作。轮到其中任意一方进行操作时，玩家可以有以下三种选择：

1. 大喊“𝜑:1！”并将当前的数字 𝑛 变为 𝜑(𝑛)；
2. 大喊“𝜑:2！”并将当前的数字 𝑛 变为 𝜑(2𝑛)；
3. 大喊“𝜑:𝐾！”并将当前的数字 𝑛 变为 𝜑(𝑛−𝐾)，其中 𝐾 是一个双方在开始游戏之前约定好的正整数。

其中，𝜑(𝑛) 表示的是在 1 到 𝑛 这 𝑛 个正整数中，有多少个正整数与 𝑛 互质，如 𝜑(1)=1，𝜑(4)=2，𝜑(10)=4。根据这一定义可知，𝜑(𝑛) 的定义域是 ℕ∗，所以如果选择第 3 种操作“𝜑:𝐾！”，需要保证当前的数字 𝑛>𝐾。

两名玩家轮流操作，如果谁在进行操作之后得到了已经出现过的数字，谁就输掉了本局游戏。例如，如果玩家 A 对当前的数字 1 选择了操作 1 “𝜑:1！”，由于 𝜑(1)=1 是出现过的数字，玩家 A 输掉了本局游戏，对手获胜。

𝜑 的游戏考验了玩家的心算能力和逻辑推理能力。可惜，由于 Picar 和 Roman 足够聪明，只要指定一个 𝐾 和最开始的数字 𝑁，他们就可以算出是先手还是后手有必胜策略。如果对于某个确定的 𝐾，以 𝑁 开始游戏时先手有必胜策略，则称这个 𝑁 为先手必胜态；否则后手有必胜策略，称 𝑁 为后手必胜态。为了使得这个游戏（对他们来说）更有趣，他们决定对游戏进行扩展：

- 玩家先指定 𝐾，并选择两个正整数 𝐿,𝑅，由系统在 [𝐿,𝑅] 中的先手必胜态中随机挑选一个 𝑟 作为右端点；
- 由后手选择一个正整数左端点 𝑙 ，需要保证 𝑙≤𝑟；
- 开始一局游戏时，系统从 [𝑙,𝑟] 中等概率挑选一个正整数 𝑁 ，作为游戏开始时由先手操作的数字。

尽管 Picar 和 Roman 足够聪明，计算修改后的游戏对他们来说也需要花费不少的时间。于是，他们找到了你，想让你帮忙计算一下修改后的游戏的平衡性。即：给定参数 𝐿,𝑅,𝐾，求后手对于任意的 𝑟 能**选出最优的 𝑙 使得后手胜率最大**时，先手的平均胜率。

## 输入格式

从标准输入读入数据。

输入仅一行，包含三个正整数 𝐿,𝑅,𝐾，含义如题目描述所示。保证 𝐿≤𝑅，且在 [𝐿,𝑅] 中至少存在一个先手必胜态。

## 输出格式

输出到标准输出。

输出一个实数，表示在给定的参数 𝐿,𝑅,𝐾 下，修改后的游戏的先手平均胜率。

记答案为 𝑎，而你的输出为 𝑏，那么当且仅当 |𝑎−𝑏|<10−6 时我们认为你的输出是正确的。

## 样例1输入

` + "`" + `` + "`" + `` + "`" + `plain
1 10 3
` + "`" + `` + "`" + `` + "`" + `

## 样例1输出

` + "`" + `` + "`" + `` + "`" + `plain
0.533333333333333333
` + "`" + `` + "`" + `` + "`" + `

## 样例1解释

此时 2,4,5,7,9,10 为先手必胜态，1,3,6,8 为后手必胜态。

- 𝑟=2 对应的最优左端点 𝑙 为 1，此时先手胜率为 1/2；
- 𝑟=4 对应的最优左端点 𝑙 为 3，此时先手胜率为 1/2；
- 𝑟=5 对应的最优左端点 𝑙 为 1，此时先手胜率为 3/5；
- 𝑟=7 对应的最优左端点 𝑙 为 6，此时先手胜率为 1/2；
- 𝑟=9 对应的最优左端点 𝑙 为 8，此时先手胜率为 1/2；
- 𝑟=10 对应的最优左端点 𝑙 为 6，此时先手胜率为 3/5。

故先手的平均胜率为 (1/2+1/2+3/5+1/2+1/2+3/5)/6=8/15≈0.5333。

## 样例2输入

` + "`" + `` + "`" + `` + "`" + `plain
2021 5000 0
` + "`" + `` + "`" + `` + "`" + `

## 样例2输出

` + "`" + `` + "`" + `` + "`" + `plain
0.39[电话已隐藏]43944
` + "`" + `` + "`" + `` + "`" + `

## 样例3输入

` + "`" + `` + "`" + `` + "`" + `plain
214 7483648 57721
` + "`" + `` + "`" + `` + "`" + `

## 样例3输出

` + "`" + `` + "`" + `` + "`" + `plain
0.490802831707061571
` + "`" + `` + "`" + `` + "`" + `

## 子任务

对于 100 的数据，保证 1≤𝐿≤𝑅≤107,0≤𝐾≤107。

具体的测试点分布见下表：

| 测试点 | 𝐿,𝑅≤  | 𝐾      | 特殊性质 |
| :----- | :---- | :----- | :------- |
| 1      | 6     | <𝑅     | 无       |
| 2      | 10    |        |          |
| 3      | 16    |        |          |
| 4      | 18    |        |          |
| 5      | 1000  |        |          |
| 6      | 2000  |        |          |
| 7      | 3000  |        |          |
| 8      | 5000  |        |          |
| 9      | 105   | 𝑅−𝐿≤99 |          |
| 10     | 106   | 𝑅−𝐿≤9  |          |
| 11     | 5×106 | =0     |          |
| 12     | <𝑅    |        |          |
| 13     | 105   | 无     |          |
| 14     |       |        |          |
| 15     |       |        |          |
| 16     | 106   | =0     |          |
| 17     | <𝑅    |        |          |
| 18     | 107   | 𝐿=𝑅    |          |
| 19     | 无    |        |          |
| 20     |       |        |          |`,
	},
	{
		DisplayName:       `坚定的馒头酱`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研经验 | 数学模板`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN的保研经验分享：数学模板。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `# 数学模板

[TOC]

## 素数打表

` + "`" + `` + "`" + `` + "`" + `c++

/*
语法：primetable(n,prime)

头文件：stdio.h string.h

参数：
m：求小于等于n的素数的个数中的n
prime：存素数的数组
返回值：null

*/

/*求小于等于n的素数的个数*/
int prime[100001];//存素数 
void primetable(int n,int prime[])
{
    int cnt = 0;
    bool vis[100001];//保证不做素数的倍数 
    memset(vis, false, sizeof(vis));//初始化 
    memset(prime, 0, sizeof(prime));
    for(int i = 2; i <= n; i++)
    {
        if(!vis[i])//不是目前找到的素数的倍数 
        prime[cnt++] = i;//找到素数~ 
        for(int j = 0; j<cnt && i*prime[j]<=n; j++)
        {
            vis[i*prime[j]] = true;//找到的素数的倍数不访问 
            if(i % prime[j] == 0) break;//关键！！！！ 
        }
    }
    printf("%d\\n", cnt);
}
` + "`" + `` + "`" + `` + "`" + `


## 求排列组合数

` + "`" + `` + "`" + `` + "`" + `c++
/*
语法：result=P(long n,long m); / result=long C(long n,long m);

参数：
m：排列组合的上系数
n：排列组合的下系数
返回值：排列组合数

注意：
符合数学规则：m<＝n
*/
long P(long n,long m)
{
    long p=1;
    while(m!=0)
        {p*=n;n--;m--;}
    return p;
} 

long C(long n,long m)
{
    long i,c=1;
    i=m;
    while(i!=0)
        {c*=n;n--;i--;}
    while(m!=0)
        {c/=m;m--;}
    return c;
} 
` + "`" + `` + "`" + `` + "`" + `

## 行列式计算


` + "`" + `` + "`" + `` + "`" + `c++
/*
语法：result=js(int s[][],int n)

参数：
s[][]：行列式存储数组
n：行列式维数，递归用
返回值：行列式值

注意：函数中常数N为行列式维度，需自行定义
*/

int s[][N],n; 
int js(s,n) {
    int z,j,k,r,total=0; 
    int b[N][N]; 
    if(n>2)
        {
        for(z=0;z<n;z++) 
            {
            for(j=0;j<n-1;j++) 
                 for(k=0;k<n-1;k++){
                        if(k>=z) b[j][k]=s[j+1][k+1]; 
                        else b[j][k]=s[j+1][k];
                        }
            if(z%2==0) r=s[0][z]*js(b,n-1);  
            else r=(-1)*s[0][z]*js(b,n-1); 
            total=total+r; 
            } 
        } 
    else if(n==2)
       total=s[0][0]*s[1][1]-s[0][1]*s[1][0]; 
    return total; 
} 
` + "`" + `` + "`" + `` + "`" + `

## Ronberg算法计算积分

` + "`" + `` + "`" + `` + "`" + `C++
/*
语法：result=integral(double a,double b);

头文件：math.h

参数：
a：积分上限
b：积分下限
function f：积分函数
返回值：f在（a,b）之间的积分值

注意：
function f(x)需要自行修改，程序中用的是sina(x)/x
默认精度要求是1e-5
*/
double f(double x)
{ 
    return sin(x)/x; //在这里插入被积函数 
}

double integral(double a,double b) 
{ 
    double h=b-a; 
    double t1=(1+f(b))*h/2.0;
    int k=1; 
    double r1,r2,s1,s2,c1,c2,t2; 
loop: 
    double s=0.0; 
    double x=a+h/2.0; 
    while(x<b) 
        { 
        s+=f(x); 
        x+=h; 
        } 
    t2=(t1+h*s)/2.0;
    s2=t2+(t2-t1)/3.0;
    if(k==1)
      { 
        k++;h/=2.0;t1=t2;s1=s2;
        goto loop; 
        } 
    c2=s2+(s2-s1)/15.0; 
    if(k==2){ 
        c1=c2;k++;h/=2.0; 
        t1=t2;s1=s2; 
        goto loop; 
        } 
    r2=c2+(c2-c1)/63.0; 
    if(k==3){ 
        r1=r2; c1=c2;k++; 
        h/=2.0; 
        t1=t2;s1=s2;
        goto loop; 
        } 
    while(fabs(1-r1/r2)>1e-5){ 
        r1=r2;c1=c2;k++;
        h/=2.0; 
        t1=t2;s1=s2; 
        goto loop; 
        } 
    return r2;
} 
` + "`" + `` + "`" + `` + "`" + `

## 组合序列

` + "`" + `` + "`" + `` + "`" + `c++

/*
语法：m_of_n(int m, int n1, int m1, int* a, int head)

参数：
m：组合数C的上参数
n1：组合数C的下参数
m1：组合数C的上参数，递归之用
*a：1～n的整数序列数组
head：头指针

返回值：null

注意：*a需要自行产生
初始调用时，m=m1、head=0
调用例子：求C(m,n)序列：m_of_n(m,n,m,a,0);
*/

void m_of_n(int m, int n1, int m1, int* a, int head) 
{ 
    int i,t; 
    if(m1<0 || m1>n1) return; 

    if(m1==n1) 
        { 
        for(i=0;i<m;i++) cout<<a[i]<<' '; // 输出序列 
        cout<<'\\n'; 
        return; 
        } 
    m_of_n(m,n1-1,m1,a,head); // 递归调用 
    t=a[head];a[head]=a[n1-1+head];a[n1-1+head]=t;
    m_of_n(m,n1-1,m1-1,a,head+1); // 再次递归调用 
    t=a[head];a[head]=a[n1-1+head];a[n1-1+head]=t;
} 
` + "`" + `` + "`" + `` + "`" + `


## 最大公约数、最小公倍数

` + "`" + `` + "`" + `` + "`" + `c++
/*
语法：resulet=hcf(int a,int b)、result=lcd(int a,int b)

参数：
a：int a，求最大公约数或最小公倍数
b：int b，求最大公约数或最小公倍数

返回值：返回最大公约数（hcf）或最小公倍数（lcd）

注意：lcd 需要连同 hcf 使用
*/

int hcf(int a,int b)
{
    int r=0;
    while(b!=0)
        {
        r=a%b;
        a=b;
        b=r;
        }
    return(a);
} 

lcd(int u,int v,int h)
{
    return(u*v/h);
}


` + "`" + `` + "`" + `` + "`" + `


## 任意进制转换

` + "`" + `` + "`" + `` + "`" + `c++
/*
语法：conversion(char s1[],char s2[],long d1,long d2);

参数：
s[]：原进制数字，用字符串表示
s2[]：转换结果，用字符串表示
d1：原进制数
d2：需要转换到的进制数

返回值：
null

注意：
高于9的位数用大写'A'～'Z'表示，2～16位进制通过验证
*/
void conversion(char s[],char s2[],long d1,long d2)
{
    long i,j,t,num;
    char c;
    num=0;
    for (i=0;s[i]!='\\0';i++)
        {
        if (s[i]<='9'&&s[i]>='0') t=s[i]-'0'; else t=s[i]-'A'+10;
        num=num*d1+t;
        }
    i=0;
    while(1)
        {
        t=num;
        if (t<=9) s2[i]=t+'0'; else s2[i]=t+'A'-10;
        num/=d2;
        if (num==0) break;
        i++;
        }
    for (j=0;j<i/2;j++)
        {c=s2[j];s2[j]=s[i-j];s2[i-j]=c;}
    s2[i+1]='\\0';
}
` + "`" + `` + "`" + `` + "`" + `

## 大数问题

### 大数阶乘

` + "`" + `` + "`" + `` + "`" + `c++
/* 
语法：int result=factorial(int n);

头文件：math.h stdio.h

参数：
n：n 的阶乘
返回值：阶乘结果的位数

注意：
本程序直接输出n!的结果，需要返回结果请保留long a[]
*/

int factorial(int n){
      long a[10000];
      int i,j,l,c,m=0,w; 
      a[0]=1; 
      for(i=1;i<=n;i++)
          { 
          c=0; 
          for(j=0;j<=m;j++)
              { 
              a[j]=a[j]*i+c; 
              c=a[j]/10000; 
              a[j]=a[j]%10000; 
          } 
          if(c>0) {m++;a[m]=c;} 
      } 
      w=m*4+log10((double)a[m])+1;
      printf("%ld",a[m]); 
      for(i=m-1;i>=0;i--) printf("%4.4ld",a[i]);
      return w;
}
` + "`" + `` + "`" + `` + "`" + `

### 大数加法

` + "`" + `` + "`" + `` + "`" + `c++
/*
      语法：add(char a[],char b[],char s[]);
      
      头文件：string.h

      参数：
      a[]：被加数，用字符串表示，位数不限
      b[]：加数，用字符串表示，位数不限
      s[]：结果，用字符串表示
      返回值：null

      注意： 
      空间复杂度为 o(n^2)
*/

void add(char a[],char b[],char back[]){
          int i,j,k,up,x,y,z,l;
          char *c;
          if (strlen(a)>strlen(b)) 
          l=strlen(a)+2; 
          else l=strlen(b)+2;
          c=(char *) malloc(l*sizeof(char));
          i=strlen(a)-1;
          j=strlen(b)-1;
          k=0;up=0;
          while(i>=0||j>=0)
              {
                  if(i<0) x='0'; else x=a[i];
                  if(j<0) y='0'; else y=b[j];
                  z=x-'0'+y-'0';
                  if(up) z+=1;
                  if(z>9) {up=1;z%=10;} else up=0;
                  c[k++]=z+'0';
                  i--;j--;
              }
          if(up) c[k++]='1';
          i=0;
          c[k]='\\0';
          for(k-=1;k>=0;k--)
              back[i++]=c[k];
          back[i]='\\0';
      }
` + "`" + `` + "`" + `` + "`" + `

### 大数减法(未处理负数情况)

` + "`" + `` + "`" + `` + "`" + `c++
/*
  语法：sub(char s1[],char s2[],char t[]);
  
  头文件：string.h
  
     参数：
      s1[]：被减数，用字符串表示，位数不限
      s2[]：减数，用字符串表示，位数不限
      t[]：结果，用字符串表示
      返回值：null

      注意： 
      默认s1>=s2，程序未处理负数情况(倒过来加符号)
   
*/
void sub(char s1[],char s2[],char t[])
      {
          int i,l2,l1,k;
          l2=strlen(s2);l1=strlen(s1);
          t[l1]='\\0';l1--;
          for (i=l2-1;i>=0;i--,l1--)
              {
              if (s1[l1]-s2[i]>=0) 
                  t[l1]=s1[l1]-s2[i]+'0';
              else
                  {
                  t[l1]=10+s1[l1]-s2[i]+'0';
                  s1[l1-1]=s1[l1-1]-1;
                  }
              }
          k=l1;
          while(s1[k]<0) {s1[k]+=10;s1[k-1]-=1;k--;}
          while(l1>=0) {t[l1]=s1[l1];l1--;}
      loop:
          if (t[0]=='0') 
              {
              l1=strlen(s1);
              for (i=0;i<l1-1;i++) t[i]=t[i+1];
              t[l1-1]='\\0';
              goto loop;
              }
          if (strlen(t)==0){t[0]='0';t[1]='\\0';}
      } 

` + "`" + `` + "`" + `` + "`" + `

### 大数乘法(大数乘小数)

` + "`" + `` + "`" + `` + "`" + `c++

/*
  语法：mult(char c[],char t[],int m);
  
  头文件：string.h
  
     参数：
      c[]：被乘数，用字符串表示，位数不限
      t[]：结果，用字符串表示 
      m：乘数，限定10以内
      返回值：null
*/

void mult(char c[],char t[],int m)
      {
          int i,l,k,flag,add=0;
          char s[100];
          l=strlen(c);
          for (i=0;i<l;i++)
              s[l-i-1]=c[i]-'0'; 
          for (i=0;i<l;i++)
                 {
                 k=s[i]*m+add;
                 if (k>=10) {s[i]=k%10;add=k/10;flag=1;} else 
      {s[i]=k;flag=0;add=0;}
                 }
          if (flag) {l=i+1;s[i]=add;} else l=i;
          for (i=0;i<l;i++)
              t[l-1-i]=s[i]+'0';
          t[l]='\\0';
      }
` + "`" + `` + "`" + `` + "`" + `

### 大数乘法(大数乘大数)

` + "`" + `` + "`" + `` + "`" + `c++
/*
  语法：mult(char a[],char b[],char s[]);

  头文件：string.h

     参数：
      a[]：被乘数，用字符串表示，位数不限
      b[]：乘数，用字符串表示，位数不限
      t[]：结果，用字符串表示
      返回值：null

      注意： 
      空间复杂度为 o(n^2)
*/

void mult(char a[],char b[],char s[])
      {
          int i,j,k=0,alen,blen,sum=0,res[65][65]={0},flag=0;
          char result[65];
          alen=strlen(a);blen=strlen(b); 
          for (i=0;i<alen;i++)
          for (j=0;j<blen;j++) res[i][j]=(a[i]-'0')*(b[j]-'0');
          for (i=alen-1;i>=0;i--)
              {
                  for (j=blen-1;j>=0;j--) sum=sum+res[i+blen-j-1][j];
                  result[k]=sum%10;
                  k=k+1;
                  sum=sum/10;
              }
          for (i=blen-2;i>=0;i--)
              {
                  for (j=0;j<=i;j++) sum=sum+res[i-j][j];
                  result[k]=sum%10;
                  k=k+1;
                  sum=sum/10;
              }
          if (sum!=0) {result[k]=sum;k=k+1;}
          for (i=0;i<k;i++) result[i]+='0';
          for (i=k-1;i>=0;i--) s[i]=result[k-1-i];
          s[k]='\\0';
          while(1)
              {
              if (strlen(s)!=strlen(a)&&s[0]=='0') 
                  strcpy(s,s+1);
              else
                  break;
              }
      }
` + "`" + `` + "`" + `` + "`" + `

### 大数比较

` + "`" + `` + "`" + `` + "`" + `c++
/*
  语法：int compare(char a[],char b[]);

      参数： 
      a[]：被比较数，用字符串表示，位数不限
      b[]：比较数，用字符串表示，位数不限

      返回值: 
      0    a<b
      1    a>b
      2    a=b
*/

int compare(char a[], char b[])  
{  
    int lena=strlen(a);  
    int lenb=strlen(b);  
    if(lena>lenb)  
        return 1;  
    else if(lena<lenb)  
        return 0;  
    for(int i=0;i<lena;i++)  
    {  
        if(a[i]>b[i])  
            return 1;  
        else if(a[i]<b[i])  
            return 0;  
    }  
    return 2;  
} 
` + "`" + `` + "`" + `` + "`" + ``,
	},
	{
		DisplayName:       `核桃吃火锅`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研经验 | 图与树`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN的保研经验分享：图与树。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `# 图与树
[toc]

## 图模板

` + "`" + `` + "`" + `` + "`" + `c++
#include <iostream>
#include <vector>
#include <set>
 
using namespace std;
 
#define MAX(a, b) ((a) > (b) ? (a) : (b) )
 
//定义图的定点
typedef struct Vertex {
    int id;
    vector<int> connectors;    //存储节点的后续连接顶点编号
    Vertex() : id(-1) {}
    Vertex(int nid) : id(nid) {}
} Vertex;
 
//定义Graph的邻接表表示
typedef struct Graph {
    vector<Vertex> vertexs;   //存储定点信息
    int nVertexs;		      //计数：邻接数
    bool isDAG;               //标志：是有向图吗
 
    Graph(int n, bool isDAG) : nVertexs(n), isDAG(isDAG) { vertexs.resize(n); }
 
	//向图中添加边
    bool addEdge(int id1, int id2) {
        if (!(MAX(id1, id2) < vertexs.size())) return false;
 
        if (isDAG) {
            vertexs[id1].connectors.push_back(id2);
        }
        else {
            vertexs[id1].connectors.push_back(id2);
            vertexs[id2].connectors.push_back(id1);
        }
        return true;
    }
 
	//广度优先搜索
	vector<int> BFS(int start) {
		set<int> visited;
		vector<int> g, rst;
		g.push_back(start);
		visited.insert(start);
		while(g.size() > 0) {
			int id = g[0];			
			g.erase(g.begin());
			rst.push_back(id);
			for(int i = 0; i < vertexs[id].connectors.size(); i++) {
				int id1 = vertexs[id].connectors[i];
				if (visited.count(id1) == 0) {
					g.push_back(id1);
					visited.insert(id1);
				}
			}
		}
		return rst;
	}
 
	//深度优先搜索
	vector<int> DFS(int start) {
		set<int> visited;
		vector<int> g, rst;
		g.push_back(start);
		//cout << "push " << start << " ";
		visited.insert(start);
		rst.push_back(start);
		bool found;
		while(g.size() > 0) {
			int id = g[g.size()-1];			
			found = false;
			for(int i = 0; i < vertexs[id].connectors.size(); i++) {
				int id1 = vertexs[id].connectors[i];
				if (visited.count(id1) == 0) {
					g.push_back(id1);
					rst.push_back(id1);
					visited.insert(id1);
					//cout << "push " << id1 << " ";
					found = true;
					break;
				}
			}
			if (!found) {
				int id2 = g[g.size()-1];
				rst.push_back(-1 * id2);
				//cout << "pop " << id2 << " ";
				g.pop_back();
			}
		}
		//cout << endl;
		return rst;
	}
} Graph;
 
int main() {
	Graph g(8, false);
    g.addEdge(0, 1);
    g.addEdge(0, 3);
    g.addEdge(1, 2);
	g.addEdge(3, 4);
	g.addEdge(3, 5);
	g.addEdge(4, 5);
    g.addEdge(4, 6);    
    g.addEdge(5, 6);
	g.addEdge(5, 7);    
    g.addEdge(6, 7);
	vector<int> bv = g.BFS(0);
	cout << "宽度优先搜索节点顺序：";
	for(int j = 0; j < bv.size(); j++)
		cout << bv[j] << " ";
	cout << endl;
 
	cout << "深度优先搜索节点顺序：";
    Graph g1(6, false);
    g1.addEdge(0, 1);
    g1.addEdge(0, 4);
    g1.addEdge(0, 5);
	g1.addEdge(1, 5);
	g1.addEdge(4, 5);
    g1.addEdge(5, 2);
    g1.addEdge(5, 3);
    g1.addEdge(2, 3);
    vector<int> route = g1.DFS(0);
    for(int i = 0; i < route.size(); i++)
        cout << route[i] << " ";
    cout << endl;
 
	char ch;
	cin >> ch;
	return 0;
}


` + "`" + `` + "`" + `` + "`" + `

## 2019-1



` + "`" + `` + "`" + `` + "`" + `c++
#include <algorithm>
#include <iostream>
#include <vector>
#include <queue>
#define MAX(a, b) ((a) > (b) ? (a) : (b) )
using namespace std;
int n,m;
vector<int> inDegreelist,outDegreelist;
 
//定义图的定点
typedef struct Vertex {
    int id,inDegree,outDegree;
    vector<int> connectors;    //存储节点的后续连接顶点编号
    Vertex() : id(-1),inDegree(0),outDegree(0) {}
    Vertex(int nid) : id(nid),inDegree(0),outDegree(0) {}
} Vertex;
 
//定义Graph的邻接表表示
typedef struct Graph {
    vector<Vertex> vertexs;   //存储定点信息
    int nVertexs;		      //计数：邻接数
    bool isDAG;               //标志：是有向图吗
 
    Graph(int n, bool isDAG) : nVertexs(n), isDAG(isDAG) { vertexs.resize(n); }
	Graph() : nVertexs(1), isDAG(1) { vertexs.resize(1); }
	//向图中添加边
    bool addEdge(int id1, int id2) {
        if (!(MAX(id1, id2) < vertexs.size())) return false;
 
        if (isDAG) {
            vertexs[id1].connectors.push_back(id2);
            vertexs[id1].outDegree++;
            vertexs[id2].inDegree++;
        }
        else {
            vertexs[id1].connectors.push_back(id2);
            vertexs[id2].connectors.push_back(id1);

            vertexs[id1].outDegree++;
            vertexs[id1].inDegree++;

            vertexs[id2].outDegree++;
            vertexs[id2].inDegree++;

        }
        return true;
    }
} Graph;

Graph g;

void init(){
	cin>>n>>m;
	g=Graph(n, true);
	int src,dst;
	while(m--){
		cin>>src>>dst;
		g.addEdge(src,dst);
	}
	vector<Vertex>::iterator it = g.vertexs.begin();
	while(it!=g.vertexs.end()){
		inDegreelist.push_back(it->inDegree);
		outDegreelist.push_back(it->outDegree);
		it++;
	}
}
int countin(int n){
	return count(inDegreelist.begin(),inDegreelist.end(),n);
}
int countout(int n){
	return count(outDegreelist.begin(),outDegreelist.end(),n);
}

bool Is_List(){
	//有一个inDegree为0的头和一个outDegree为0的尾，且其余节点入度与出度都为1;
	return (countin(0)==1)&&(countout(0)==1)&&(countin(1)==n-1)&&(countout(1)==n-1);
}

bool Is_Tree(){
	//有一个inDegree为0的头且其余节点inDegree均为1，且不是链表;
	return (countin(0)==1)&&(countin(1)==n-1);
}

bool topologicalSort(){//拓扑排序判断有环无环
	int num=0;//记录加入拓扑排序的顶点数
	queue<int> q;
	for(int i=0;i<n;i++){
		if(inDegreelist[i]==0){
			q.push(i);//将所有入度为0的顶点入队
		}
	}

	while(!q.empty()){
		int u=q.front();//取队首顶点u
		q.pop();
		for(int i=0;i<g.vertexs[u].connectors.size();i++){
			int v=g.vertexs[u].connectors[i];//u的后继节点v
			inDegreelist[v]--;//v的入度减1
			if(inDegreelist[v]==0){//顶点v的入度减为0则入队
				q.push(v);
			}
		}
		g.vertexs[u].connectors.clear();//清空u的所有出边
		num++;//加入拓扑排序的顶点数加1
	}
	if(num==n) return true;//加入拓扑排序的顶点为n，则拓扑排序成功，图无环
	else return false;//否则拓扑排序失败，图有环
}


int main(){
	init();
	if(n==0||m==0){
		cout<<"error"<<endl;
	}
	if(Is_List()){
		cout<<"list"<<endl;
	}
	
	else if(Is_Tree()){
		cout<<"tree"<<endl;
	}
	else if(topologicalSort()){
		cout<<"no ring"<<endl;
	}
	else{
	cout<<"have ring"<<endl;
	}
	return 0;
}
` + "`" + `` + "`" + `` + "`" + `

##  树模板

###  注释版

` + "`" + `` + "`" + `` + "`" + `c++
#include<bits/stdc++.h>
#include<cmath>
 
#define mem(a,b) memset(a,b,sizeof a);
 
using namespace std;
 
typedef long long ll;
 
const int maxn=50;
int mid[maxn],po[maxn],pr[maxn];
int first;
 
struct node
{
    int l,r;
}T[maxn];
 
// 中序+先序=>二叉树
int mid_pr_build(int la,int ra,int lb,int rb) // la,ra：表示中序遍历  lb,rb：表示先序遍历
{
    // 这里不能等于，因为假设：len==1，则la==ra，直接返回，但是实际上是有一个 rt 的，却没被建立
    if(la>ra) return 0; 
    int rt=pr[lb]; // 因为先序遍历第一个是根节点
    int p1=la,p2;
 
    while(mid[p1]!=rt) p1++; // 在中序遍历中找到根节点
    p2=p1-la;
    T[rt].l=mid_pr_build(la,p1-1,lb+1,lb+p2); // 左子树（锁定左子树范围的下标）
    T[rt].r=mid_pr_build(p1+1,ra,lb+p2+1,rb); // 右子树（锁定右子树范围的下标）
 
    return rt;
}
 
// 中序+后序=>二叉树
int mid_po_build(int la,int ra,int lb,int rb) // la,ra：表示中序遍历  lb,rb：表示后序遍历
{
    if(la>ra) return 0;
    int rt=po[rb]; // 因为后序遍历最后一个是根节点
    int p1=la,p2;
 
    while(mid[p1]!=rt) p1++; // 在中序遍历中找到根节点
    p2=p1-la;
    T[rt].l=mid_po_build(la,p1-1,lb,lb+p2-1); // 左子树（锁定左子树范围的下标）
    T[rt].r=mid_po_build(p1+1,ra,lb+p2,rb-1); // 右子树（锁定右子树范围的下标）
 
    return rt;
}
 
// 求树高
int getHeight(int rt)
{
    if(rt==0) return 0;
    return 1+max(getHeight(T[rt].l),getHeight(T[rt].r));
}
 
// 层序遍历
void bfs(int rt)
{
    queue<int> q;
    vector<int> v;
    q.push(rt);
 
    while(!q.empty())
    {
        int w=q.front();
        q.pop();
        v.push_back(w);
        if(T[w].l!=0) q.push(T[w].l);
        if(T[w].r!=0) q.push(T[w].r);
    }
 
    int len=v.size();
    for(int i=0;i<len;i++)
        printf("%d%c",v[i],i==len-1?'\\n':' '); // 推荐这种写法，简洁
}
 
// 先序遍历
void preT(int rt)
{
    if(rt==0) return;
    printf(first?first=0,"%d":" %d",rt);
    preT(T[rt].l);
    preT(T[rt].r);
}
 
// 中序遍历
void midT(int rt)
{
    if(rt==0) return;
    midT(T[rt].l);
    printf(first?first=0,"%d":" %d",rt);
    midT(T[rt].r);
}
 
// 后序遍历
void postT(int rt)
{
    if(rt==0) return;
    postT(T[rt].l);
    postT(T[rt].r);
    printf(first?first=0,"%d":" %d",rt);
}
 
int main()
{
    int n;
    while(~scanf("%d",&n))
    {
        first=1;
        for(int i=0;i<n;i++) scanf("%d",&po[i]); // 后序结点
//        for(int i=0;i<n;i++) scanf("%d",&pr[i]); // 先序结点
        for(int i=0;i<n;i++) scanf("%d",&mid[i]); // 中序结点
 
        int rt=mid_po_build(0,n-1,0,n-1); // 中+后，返回根节点
//        int rt=mid_pr_build(0,n-1,0,n-1); // 中+先，返回根节点
 
        bfs(rt); // 层序遍历
//        preT(rt); // 先序遍历
//        puts("");
//        postT(rt); // 后序遍历
//        puts("");
//        midT(rt); // 中序遍历
//        puts("");
    }
 
    return 0;
}
` + "`" + `` + "`" + `` + "`" + `
### 简化版（Val As Index，若数据不在1~N内，则可能越界）

` + "`" + `` + "`" + `` + "`" + `c++
#include<bits/stdc++.h>
#include<cmath>
 
#define mem(a,b) memset(a,b,sizeof a);
 
using namespace std;
 
typedef long long ll;
 
const int maxn=50;
int mid[maxn],po[maxn],pr[maxn];
int first;
 
struct node
{
    int l,r;
}T[maxn];
 
int mid_pr_build(int la,int ra,int lb,int rb)
{
    if(la>ra) return 0;
    int rt=pr[lb];
    int p1=la,p2;
 
    while(mid[p1]!=rt) p1++;
    p2=p1-la;
    T[rt].l=mid_pr_build(la,p1-1,lb+1,lb+p2);
    T[rt].r=mid_pr_build(p1+1,ra,lb+p2+1,rb);
 
    return rt;
}
 
int mid_po_build(int la,int ra,int lb,int rb)
{
    if(la>ra) return 0;
    int rt=po[rb];
    int p1=la,p2;
 
    while(mid[p1]!=rt) p1++;
    p2=p1-la;
    T[rt].l=mid_po_build(la,p1-1,lb,lb+p2-1);
    T[rt].r=mid_po_build(p1+1,ra,lb+p2,rb-1);
 
    return rt;
}
 
int getHeight(int rt)
{
    if(rt==0) return 0;
    return 1+max(getHeight(T[rt].l),getHeight(T[rt].r));
}
 
void bfs(int rt)
{
    queue<int> q;
    vector<int> v;
    q.push(rt);
 
    while(!q.empty())
    {
        int w=q.front();
        q.pop();
        v.push_back(w);
        if(T[w].l!=0) q.push(T[w].l);
        if(T[w].r!=0) q.push(T[w].r);
    }
 
    int len=v.size();
    for(int i=0;i<len;i++)
        printf("%d%c",v[i],i==len-1?'\\n':' ');
}
 
void preT(int rt)
{
    if(rt==0) return;
    printf(first?first=0,"%d":" %d",rt);
    preT(T[rt].l);
    preT(T[rt].r);
}
 
void midT(int rt)
{
    if(rt==0) return;
    midT(T[rt].l);
    printf(first?first=0,"%d":" %d",rt);
    midT(T[rt].r);
}
 
void postT(int rt)
{
    if(rt==0) return;
    postT(T[rt].l);
    postT(T[rt].r);
    printf(first?first=0,"%d":" %d",rt);
}
 
int main()
{
    int n;
    while(~scanf("%d",&n))
    {
        first=1;
        for(int i=0;i<n;i++) scanf("%d",&po[i]);
//        for(int i=0;i<n;i++) scanf("%d",&pr[i]);
        for(int i=0;i<n;i++) scanf("%d",&mid[i]);
 
        int rt=mid_po_build(0,n-1,0,n-1);
//        int rt=mid_pr_build(0,n-1,0,n-1);
 
        bfs(rt);
//        preT(rt);
//        postT(rt);
//        midT(rt);
    }
 
    return 0;
}
` + "`" + `` + "`" + `` + "`" + `

### 简化版（Val Not As Index，可以存任意的 Val）

` + "`" + `` + "`" + `` + "`" + `c++
#include<bits/stdc++.h>
#include<cmath>
 
#define mem(a,b) memset(a,b,sizeof a)
#define ssclr(ss) ss.clear(), ss.str("")
#define INF 0x3f3f3f3f
#define MOD 1000000007
 
using namespace std;
 
typedef long long ll;
 
const int maxn=5e4+1000;
 
int f;
int pre[maxn], in[maxn];
 
struct node
{
    int l,r,d;
}T[maxn];
 
int create(int l1,int r1,int l2,int r2) // in pre
{
    if(l2>r2) return -1;
    int rt=l2;
    int p1=l1,p2;
 
    while(in[p1]!=pre[rt]) p1++;
    p2=p1-l1;
 
    T[rt].d=pre[rt];
    T[rt].l=create(l1,p1-1,l2+1,l2+p2);
    T[rt].r=create(p1+1,r1,l2+p2+1,r2);
 
    return rt;
}
 
void postT(int rt)
{
    if(rt==-1 || !f) return;
    postT(T[rt].l);
    postT(T[rt].r);
    if(f) f=0, printf("%d\\n",T[rt].d);
}
 
int main()
{
    int n;
    scanf("%d",&n);
    for(int i=0;i<n;i++) scanf("%d",&pre[i]);
    for(int i=0;i<n;i++) scanf("%d",&in[i]);
    int rt=create(0,n-1,0,n-1);
    f=1, postT(rt);
 
    return 0;
}
` + "`" + `` + "`" + `` + "`" + ``,
	},
	{
		DisplayName:       `安静的草莓`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研经验 | 最后的挣扎`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN的保研经验分享：最后的挣扎。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `# 最后的挣扎
[TOC]
## 结构体初始化

### 定义

` + "`" + `` + "`" + `` + "`" + `c++
struct InitMember
{
    int first；
    double second；
    char* third；
    float four;
};
` + "`" + `` + "`" + `` + "`" + `

### 方法一：定义时赋值

` + "`" + `` + "`" + `` + "`" + `c++
struct InitMember test = {-10,3.141590，"method one"，0.25}；
` + "`" + `` + "`" + `` + "`" + `

### 方法二：定义后逐个赋值

` + "`" + `` + "`" + `` + "`" + `c++
struct InitMember test；

test.first = -10;
test.second = 3.141590;
test.third = "method two";
test.four = 0.25;
` + "`" + `` + "`" + `` + "`" + `

### 方法三：定义时乱序赋值（C++风格）

` + "`" + `` + "`" + `` + "`" + `c++
struct InitMember test = {
    second：3.141590,
    third："method three",
    first：-10,
    four：0.25
};
` + "`" + `` + "`" + `` + "`" + `

### 方法四：构造函数

` + "`" + `` + "`" + `` + "`" + `
//定义图的定点
typedef struct Vertex {
    int id,inDegree,outDegree;
    vector<int> connectors;    //存储节点的后续连接顶点编号
    Vertex() : id(-1),inDegree(0),outDegree(0) {}
    Vertex(int nid) : id(nid),inDegree(0),outDegree(0) {}
} Vertex;
 
//定义Graph的邻接表表示
typedef struct Graph {
    vector<Vertex> vertexs;   //存储定点信息
    int nVertexs;		      //计数：邻接数
    bool isDAG;               //标志：是有向图吗
 
    Graph(int n, bool isDAG) : nVertexs(n), isDAG(isDAG) { vertexs.resize(n); }
	Graph() : nVertexs(1), isDAG(1) { vertexs.resize(1); }
	//向图中添加边
    bool addEdge(int id1, int id2) {
			...
			...
			...
        return true;
    }
} Graph;

Graph g(8, false);
` + "`" + `` + "`" + `` + "`" + `





## CCF 编译出错原因： 不允许C++STL容器嵌套（需要满足相应的格式）

就是要在后面的“>”之间，必须得有一个空格，如果有多层，那每层都得有一个空格。
` + "`" + `` + "`" + `` + "`" + `c++
map<string,list<string> > user;
` + "`" + `` + "`" + `` + "`" + ``,
	},
	{
		DisplayName:       `馒头在跑步`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研经验 | 机试技巧与STL`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN的保研经验分享：机试技巧与STL。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `# 机试技巧与STL

[TOC]

## vs2018 快捷键
` + "`" + `` + "`" + `` + "`" + `
CTRL + J                  列出成员 
Ctrl+E,D                  格式化全部代码 
Ctrl+K,F                  格式化选中的代码 
CTRL + SHIFT + E          显示资源视图 
F12                       转到定义 
CTRL + F12                转到声明 
CTRL + ALT + J            对象浏览 
CTRL + ALT + F1           帮助目录 
CTRL + F1                 动态帮助 
CTRL + K, CTRL + C        注释选择的代码 
CTRL + K, CTRL + U        取消对选择代码的注释 
CTRL + U                  转小写 
CTRL + SHIFT + U          转大写 
F5                        运行调试 
CTRL + F5                 运行不调试 
F10                       跨过程序执行 
F11                       单步逐句执行 
` + "`" + `` + "`" + `` + "`" + `

## 头文件

### 标准c库

| 头文件 | 说明 | 头文件 | 说明 | 头文件 | 说明 |
| ------ | ---- | ------ | ---- | ------ | ---- |
|assert.h	|断言相关|	ctype.h	|字符类型判断	|errno.h	|标准错误机制|
|float.h	|浮点限制|	limits.h	|整形限制	|locale.h	|本地化接口|
|math.h	|数学函数|	setjmp.h	|非本地跳转	|signal.h	|信号相关|
|stdarg.h	|可变参数处理|	stddef.h	|宏和类型定义	|stdio.h	|标准I/O|
|stdlib.h	|标准工具库|	string.h|	字符串和内存处理|	time.h|	时间相关|

### c++ STL

**using namespace std;**

| 头文件    | 说明     | 头文件 | 说明     | 头文件  | 说明         |
| --------- | -------- | ------ | -------- | ------- | ------------ |
| algorithm | 通用算法 | deque  | 双端队列 | vector  | 向量         |
| iterator  | 迭代器   | stack  | 栈       | map     | 图（键值对） |
| list      | 列表     | string | 字符串   | set     | 集合         |
| queue     | 队列     | bitset | bit类 | numeric | 数值算法     |

### 常用头

` + "`" + `` + "`" + `` + "`" + `c++
#include<cstdio>  
#include<cstring>  
#include<algorithm>  
#include<iostream>  
#include<string>  
#include<vector>  
#include<stack>  
#include<bitset>  
#include<cstdlib>  
#include<cmath>  
#include<set>  
#include<list>  
#include<deque>  
#include<map>  
#include<queue>
using namespace std;
` + "`" + `` + "`" + `` + "`" + `

## 常用宏定义

` + "`" + `` + "`" + `` + "`" + `c++
//求最大值和最小值
#define  MAX(x,y) (((x)>(y)) ? (x) : (y))
#define  MIN(x,y) (((x) < (y)) ? (x) : (y))

//取余
#define  mod(x) ((x)%MOD)

//for循环
#define  FOR(i,f_start,f_end) for(int i=f_start;i<=f_end;++i) 

//返回数组元素的个数
#define  ARR_SIZE(a)  (sizeof((a))/sizeof((a[0])))

//初始化数组
#define MT(x,i) memset(x,i,sizeof(x))
#define MEM(a,b) memset((a),(b),sizeof(a))

//符号重定义
#define LL long long
#define ull unsigned long long
#define pii pair<int,int>

//常见常数
#define PI acos(-1.0)
#define eps 1e-12
#define INF 0x3f3f3f3f //int最大值
const int INF_INT = 2147483647;
const ll INF_LL = 9223372036854775807LL;
const ull INF_ULL = [电话已隐藏]709551615Ull;
const ll P = 92540646808111039LL;
const ll maxn = 1e5 + 10, MOD = 1e9 + 7;
const int Move[4][2] = {-1,0,1,0,0,1,0,-1};
const int Move_[8][2] = {-1,-1,-1,0,-1,1,0,-1,0,1,1,-1,1,0,1,1};

` + "`" + `` + "`" + `` + "`" + `

## 结构体

### 定义

` + "`" + `` + "`" + `` + "`" + `c++
struct InitMember
{
    int first；
    double second；
    char* third；
    float four;
};
` + "`" + `` + "`" + `` + "`" + `

### 初始化

#### 方法一：定义时赋值

` + "`" + `` + "`" + `` + "`" + `c++
struct InitMember test = {-10,3.141590，"method one"，0.25}；
` + "`" + `` + "`" + `` + "`" + `

#### 方法二：定义后逐个赋值

` + "`" + `` + "`" + `` + "`" + `c++
struct InitMember test；

test.first = -10;
test.second = 3.141590;
test.third = "method two";
test.four = 0.25;
` + "`" + `` + "`" + `` + "`" + `

#### 方法三：定义时乱序赋值（C++风格）

` + "`" + `` + "`" + `` + "`" + `c++
struct InitMember test = {
    second：3.141590,
    third："method three",
    first：-10,
    four：0.25
};
` + "`" + `` + "`" + `` + "`" + `

#### 方法四：构造函数

` + "`" + `` + "`" + `` + "`" + `
//定义图的定点
typedef struct Vertex {
    int id,inDegree,outDegree;
    vector<int> connectors;    //存储节点的后续连接顶点编号
    Vertex() : id(-1),inDegree(0),outDegree(0) {}
    Vertex(int nid) : id(nid),inDegree(0),outDegree(0) {}
} Vertex;
 
//定义Graph的邻接表表示
typedef struct Graph {
    vector<Vertex> vertexs;   //存储定点信息
    int nVertexs;		      //计数：邻接数
    bool isDAG;               //标志：是有向图吗
 
    Graph(int n, bool isDAG) : nVertexs(n), isDAG(isDAG) { vertexs.resize(n); }
	Graph() : nVertexs(1), isDAG(1) { vertexs.resize(1); }
	//向图中添加边
    bool addEdge(int id1, int id2) {
			...
			...
			...
        return true;
    }
} Graph;

Graph g(8, false);
` + "`" + `` + "`" + `` + "`" + `

### 运算符重载
` + "`" + `` + "`" + `` + "`" + `c++
typedef struct{int id;int h;} node;
bool operator <(const node& a,const node & b){return (a.h)<(b.h);}
` + "`" + `` + "`" + `` + "`" + `

## c++new的使用

### 常规

` + "`" + `` + "`" + `` + "`" + `c++
int *x = new int;       //开辟一个存放整数的存储空间，返回一个指向该存储空间的地址(即指针)
int *a = new int(100);  //开辟一个存放整数的空间，并指定该整数的初值为100，返回一个指向该存储空间的地址
char *b = new char[10]; //开辟一个存放字符数组(包括10个元素)的空间，返回首元素的地址
float *p=new float (3.14159);//开辟一个存放单精度数的空间，并指定该实数的初值为//3.14159，将返回的该空间的地址赋给指针变量p
` + "`" + `` + "`" + `` + "`" + `

### 动态申请列大小固定的二维数组
` + "`" + `` + "`" + `` + "`" + `c++
//列值固定
const int MAXCOL = 3;
cin>>row;
//申请一维数据并将其转成二维数组指针
int *pp_arr = new int[nRow * MAXCOL];
int (*p)[MAXCOL] = (int(*)[MAXCOL])pp_arr;
//此时p[i][j]就可正常使用
` + "`" + `` + "`" + `` + "`" + `


### 动态申请大小不固定的二维数组

` + "`" + `` + "`" + `` + "`" + `c++

cin>>row>>col;
int **p = new int*[row];
for (int i = 0; i < row; i ++)
{
    p[i] = new int[col];
}
` + "`" + `` + "`" + `` + "`" + `


## 常用STL

> 参考：

[https://blog.csdn.net/f_zyj/article/details/51594851](https://blog.csdn.net/f_zyj/article/details/51594851)  
[https://download.csdn.net/download/f_zyj/9988653](https://download.csdn.net/download/f_zyj/9988653)

### 简述
####  STL底层说明

C++ STL 的实现：

` + "`" + `` + "`" + `` + "`" + `
1.vector      底层数据结构为数组 ，支持快速随机访问

2.list            底层数据结构为双向链表，支持快速增删

3.deque       底层数据结构为一个中央控制器和多个缓冲区，详细见STL源码剖析P146，支持首尾（中间不能）快速增删，也支持随机访问
deque是一个双端队列(double-ended queue)，也是在堆中保存内容的.它的保存形式如下:
[堆1] --> [堆2] -->[堆3] --> ...
每个堆保存好几个元素,然后堆和堆之间有指针指向,看起来像是list和vector的结合品.

4.stack        底层一般用list或deque实现，封闭头部即可，不用vector的原因应该是容量大小有限制，扩容耗时

5.queue     底层一般用list或deque实现，封闭头部即可，不用vector的原因应该是容量大小有限制，扩容耗时

（stack和queue其实是适配器,而不叫容器，因为是对容器的再封装）

6.priority_queue     的底层数据结构一般为vector为底层容器，堆heap为处理规则来管理底层容器实现

7.set                   底层数据结构为红黑树，有序，不重复

8.multiset         底层数据结构为红黑树，有序，可重复 

9.map                底层数据结构为红黑树，有序，不重复

10.multimap    底层数据结构为红黑树，有序，可重复

11.hash_set     底层数据结构为hash表，无序，不重复

12.hash_multiset 底层数据结构为hash表，无序，可重复 

13.hash_map    底层数据结构为hash表，无序，不重复

14.hash_multimap 底层数据结构为hash表，无序，可重复 
` + "`" + `` + "`" + `` + "`" + `

#### CCF 编译出错原因： 不允许C++STL容器嵌套（需要满足相应的格式）

就是要在后面的“>”之间，必须得有一个空格，如果有多层，那每层都得有一个空格。
` + "`" + `` + "`" + `` + "`" + `c++
map<string,list<string> > user;
` + "`" + `` + "`" + `` + "`" + `

### algorithm

**头文件：lgorithm**

函数参数，返回值以及具体的使用方法请自行去头文件找定义！！！

#### 不修改内容的序列操作

|函数|说明|
| -------------------------------------------------------- | ------------------------------------------------------------ |
| adjacent_find| 查找两个相邻（Adjacent）的等价（Identical）元素              |
| all_ofC++11                                              | 检测在给定范围中是否所有元素都满足给定的条件                 |
| any_ofC++11                                              | 检测在给定范围中是否存在元素满足给定条件                     |
| count         | 返回值等价于给定值的元素的个数                               |
| count_if      | 返回值满足给定条件的元素的个数                               |
| equal         | 返回两个范围是否相等                                         |
| find           | 返回第一个值等价于给定值的元素                               |
| find_end                                                 | 查找范围*A*中与范围*B*等价的子范围最后出现的位置             |
| find_first_of | 查找范围*A*中第一个与范围*B*中任一元素等价的元素的位置       |
| find_if                                                  | 返回第一个值满足给定条件的元素                               |
| find_if_notC++11                                         | 返回第一个值不满足给定条件的元素                             |
| for_each                                                 | 对范围中的每个元素调用指定函数                               |
| mismatch                                                 | 返回两个范围中第一个元素不等价的位置                         |
| none_ofC++11                                             | 检测在给定范围中是否不存在元素满足给定的条件                 |
| search          | 在范围*A*中查找第一个与范围*B*等价的子范围的位置             |
| search_n                                                 | 在给定范围中查找第一个连续*n*个元素都等价于给定值的子范围的位置 |

#### 修改内容的序列操作

|函数|说明|
| -------------------------------------------------------- | ------------------------------------------------------------ |
| copy         | 将一个范围中的元素拷贝到新的位置处                           |
| copy_backward                                          | 将一个范围中的元素按逆序拷贝到新的位置处                     |
| copy_ifC++11                                           | 将一个范围中满足给定条件的元素拷贝到新的位置处               |
| copy_nC++11                                            | 拷贝 n 个元素到新的位置处                                    |
| fill         | 将一个范围的元素赋值为给定值                                 |
| fill_n                                                 | 将某个位置开始的 n 个元素赋值为给定值                        |
| generate                                               | 将一个函数的执行结果保存到指定范围的元素中，用于批量赋值范围中的元素 |
| generate_n                                             | 将一个函数的执行结果保存到指定位置开始的 n 个元素中          |
| iter_swap                                              | 交换两个迭代器（Iterator）指向的元素                         |
| moveC++11     | 将一个范围中的元素移动到新的位置处                           |
| move_backwardC++11                                     | 将一个范围中的元素按逆序移动到新的位置处                     |
| random_shuffle                                         | 随机打乱指定范围中的元素的位置                               |
| remove       | 将一个范围中值等价于给定值的元素删除                         |
| remove_if                                              | 将一个范围中值满足给定条件的元素删除                         |
| remove_copy                                            | 拷贝一个范围的元素，将其中值等价于给定值的元素删除           |
| remove_copy_if                                         | 拷贝一个范围的元素，将其中值满足给定条件的元素删除           |
| replace      | 将一个范围中值等价于给定值的元素赋值为新的值                 |
| replace_copy                                           | 拷贝一个范围的元素，将其中值等价于给定值的元素赋值为新的值   |
| replace_copy_if                                        | 拷贝一个范围的元素，将其中值满足给定条件的元素赋值为新的值   |
| replace_if                                             | 将一个范围中值满足给定条件的元素赋值为新的值                 |
| reverse      | 反转排序指定范围中的元素                                     |
| reverse_copy                                           | 拷贝指定范围的反转排序结果                                   |
| rotate      | 循环移动指定范围中的元素                                     |
| rotate_copy                                            | 拷贝指定范围的循环移动结果                                   |
| shuffleC++11 | 用指定的随机数引擎随机打乱指定范围中的元素的位置             |
| swap        | 交换两个对象的值                                             |
| swap_ranges | 交换两个范围的元素                                           |
| transform   | 对指定范围中的每个元素调用某个函数以改变元素的值             |
| unique                                                 | 删除指定范围中的所有连续重复元素，仅仅留下每组等值元素中的第一个元素。 |
| unique_copy                                            | 拷贝指定范围的唯一化（参考上述的 unique）结果                |

#### 划分操作
|函数|说明|
| -------------------------------------------------------- | ------------------------------------------------------------ |
|is_partitionedC++11| 检测某个范围是否按指定谓词（Predicate）划分过|
|partition  | 将某个范围划分为两组|
|partition_copyC++11 | 拷贝指定范围的划分结果|
|partition_pointC++11  |  返回被划分范围的划分点|
|stable_partition   | 稳定划分，两组元素各维持相对顺序|

#### 排序操作

|函数|说明|
| -------------------------------------------------------- | ------------------------------------------------------------ |
|is_sortedC++11 | 检测指定范围是否已排序|
|is_sorted_untilC++11    |返回最大已排序子范围|
|nth_element 部份排序指定范围中的元素，使得范围按给定位置处的元素划分|
|partial_sort   | 部份排序|
|partial_sort_copy  | 拷贝部分排序的结果|
|sort  |  排序|
|stable_sort |稳定排序|

#### 二分法查找操作


|函数|说明|
| -------------------------------------------------------- | ------------------------------------------------------------ |
|binary_search |  判断范围中是否存在值等价于给定值的元素|
|equal_range |返回范围中值等于给定值的元素组成的子范围|
|lower_bound |返回指向范围中第一个值大于或等于给定值的元素的迭代器|
|upper_bound |返回指向范围中第一个值大于给定值的元素的迭代器|


#### 集合操作



|函数|说明|
| -------------------------------------------------------- | ------------------------------------------------------------ |
|includes  |  判断一个集合是否是另一个集合的子集|
|inplace_merge  | 就绪合并|
|merge   合并|
|set_difference | 获得两个集合的差集|
|set_intersection |   获得两个集合的交集|
|set_symmetric_difference  |  获得两个集合的对称差|
|set_union  | 获得两个集合的并集|


#### 堆操作

|函数|说明|
| -------------------------------------------------------- | ------------------------------------------------------------ |
|is_heap |检测给定范围是否满足堆结构|
|is_heap_untilC++11  |检测给定范围中满足堆结构的最大子范围|
|make_heap |  用给定范围构造出一个堆|
|pop_heap   | 从一个堆中删除最大的元素|
|push_heap |  向堆中增加一个元素|
|sort_heap  | 将满足堆结构的范围排序|

#### 最大/最小操作

|函数|说明|
| -------------------------------------------------------- | ------------------------------------------------------------ |
|is_permutationC++11 |判断一个序列是否是另一个序列的一种排序|
|lexicographical_compare |比较两个序列的字典序|
|max |返回两个元素中值最大的元素|
|max_element |返回给定范围中值最大的元素|
|min |返回两个元素中值最小的元素|
|min_element |返回给定范围中值最小的元素|
|minmaxC++11 |返回两个元素中值最大及最小的元素|
|minmax_elementC++11|返回给定范围中值最大及最小的元素|
|next_permutation  |  返回给定范围中的元素组成的下一个按字典序的排列|
|prev_permutation  |  返回给定范围中的元素组成的上一个按字典序的排列|

### vector

**头文件：vector**

在STL的vector头文件中定义了vector（向量容器模版类），vector容器以连续数组的方式存储元素序列，可以将vector看作是以顺序结构实现的线性表。当我们在程序中需要使用动态数组时，vector将会是理想的选择，vector可以在使用过程中动态地增长存储空间。 
vector模版类需要两个模版参数，第一个参数是存储元素的数据类型，第二个参数是存储分配器的类型，其中第二个参数是可选的，如果不给出第二个参数，将使用默认的分配器

下面给出几个常用的定义vector向量对象的方法示例：
` + "`" + `` + "`" + `` + "`" + `c++

vector<int> s;      
//  定义一个空的vector对象，存储的是int类型的元素
vector<int> s(n);   
//  定义一个含有n个int元素的vector对象
vector<int> s(first, last); 
//  定义一个vector对象，并从由迭代器first和last定义的序列[first, last)中复制初值

` + "`" + `` + "`" + `` + "`" + `

vector的基本操作：
` + "`" + `` + "`" + `` + "`" + `c++

s[i]                //  直接以下标方式访问容器中的元素
s.front()           //  返回首元素
s.back()            //  返回尾元素
s.push_back(x)      //  向表尾插入元素x
s.size()            //  返回表长
s.empty()           //  表为空时，返回真，否则返回假
s.pop_back()        //  删除表尾元素
s.begin()           //  返回指向首元素的随机存取迭代器
s.end()             //  返回指向尾元素的下一个位置的随机存取迭代器
s.insert(it, val)   //  向迭代器it指向的元素前插入新元素val
s.insert(it, n, val)//  向迭代器it指向的元素前插入n个新元素val
s.insert(it, first, last)   
//  将由迭代器first和last所指定的序列[first, last)插入到迭代器it指向的元素前面
s.erase(it)         //  删除由迭代器it所指向的元素
s.erase(first, last)//  删除由迭代器first和last所指定的序列[first, last)
s.reserve(n)        //  预分配缓冲空间，使存储空间至少可容纳n个元素
s.resize(n)         //  改变序列长度，超出的元素将会全部被删除，如果序列需要扩展（原空间小于n），元素默认值将填满扩展出的空间
s.resize(n, val)    //  改变序列长度，超出的元素将会全部被删除，如果序列需要扩展（原空间小于n），val将填满扩展出的空间
s.clear()           //  删除容器中的所有元素
s.swap(v)           //  将s与另一个vector对象进行交换
s.assign(first, last)
//  将序列替换成由迭代器first和last所指定的序列[first, last)，[first, last)不能是原序列中的一部分

//  要注意的是，resize操作和clear操作都是对表的有效元素进行的操作，但并不一定会改变缓冲空间的大小
//  另外，vector还有其他的一些操作，如反转、取反等，不再一一列举
//  vector上还定义了序列之间的比较操作运算符（>、<、>=、<=、==、!=），可以按照字典序比较两个序列。
//  还是来看一些示例代码吧……

/*
 * 输入个数不定的一组整数，再将这组整数按倒序输出
 */

#include <iostream>
#include <vector>

using namespace std;

int main()
{
    vector<int> L;
    int x;
    while(cin >> x)
    {
        L.push_back(x);
    }
    for (int i = L.size() - 1; i >= 0; i--)
    {
        cout << L[i] << " ";
    }
    cout << endl;
    return 0;
}
` + "`" + `` + "`" + `` + "`" + `

### list

**头文件：list**


下面给出几个常用的定义list对象的方法示例：
` + "`" + `` + "`" + `` + "`" + `c++

list<int>a{1,2,3}
list<int>a(n)    //声明一个n个元素的列表，每个元素都是0
list<int>a(n, m)  //声明一个n个元素的列表，每个元素都是m
list<int>a(first, last)  //声明一个列表，其元素的初始值来源于由区间所指定的序列中的元素，first和last是迭代器

` + "`" + `` + "`" + `` + "`" + `

list的基本操作：

` + "`" + `` + "`" + `` + "`" + `c++

a.begin()           //  返回指向首元素的随机存取迭代器
a.end()             //  返回指向尾元素的下一个位置的随机存取迭代器
a.push_front(x)     //  向表头插入元素x
a.push_back(x)      //  向表尾插入元素x
a.pop_back()        //  删除表尾元素
a.pop_front()       //  删除表头元素
a.size()            //  返回表长
a.empty()           //  表为空时，返回真，否则返回假
a.resize(n)         //  改变序列长度，超出的元素将会全部被删除，如果序列需要扩展（原空间小于n），元素默认值将填满扩展出的空间
a.resize(n, val)    //  改变序列长度，超出的元素将会全部被删除，如果序列需要扩展（原空间小于n），val将填满扩展出的空间
a.clear()           //  删除容器中的所有元素
a.front()           //  返回首元素
a.back()            //  返回尾元素
a.swap(v)           //  将a与另一个list对象进行交换
a.merge(b)          /

...(内容较长，已截取前半部分)...`,
	},
	{
		DisplayName:       `桂花做实验`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研经验 | 清华机试真题`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN的保研经验分享：清华机试真题。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `# 清华机试真题

[TOC]

## 2017 interview

生活在在外星球X上的小Z想要找一些小朋友组成一个舞蹈团，于是他在网上发布了信息，一共有 $n$ 个人报名面试。**面试必须按照报名的顺序**依次进行。小Z可以选择在面试完若干小朋友以后，在所有**已经面试过**的小朋友中进行任意顺序的挑选，以组合成一个舞蹈团。虽然说是小朋友，但是外星球X上的生态环境和地球上的不太一样，这些小朋友的身高可能相差很大。小Z希望组建的这个舞蹈团要求**至少**有 $m$ 个小朋友，并且这些小朋友的最高身高和最低身高之差不能超过 $k$ 个长度单位。现在知道了这些小朋友的身高信息，问小Z至少要面试多少小朋友才能在已经面试过的小朋友中选出不少于 $m$ 个组成舞蹈团。

### 轩轩

过了14个测试点！！！

` + "`" + `` + "`" + `` + "`" + `c++
# include<algorithm>
# include<vector>
# include<iostream>
using namespace std;
typedef struct{int id;int h;} student;
bool operator <(const student& a,const student & b){return (a.h)<(b.h);}

int n,m,k,tall=0;
vector<student> stu;
vector<int> highid;
void init(){
	student temp;
	cin >> n >> m >> k;
	for(int i=0;i<n;i++){
		temp.id = i;
		cin >> temp.h;
		stu.push_back(temp);
	}
}
void pick(){
	for(int i = 0;i<=n-m;i++){ //排序
		sort(stu.begin(),stu.begin()+m+i);
		for(int j = 0;j<=i;j++){//检查个头
			if(stu[j+m-1].h-stu[j].h<=k){
				for(int y=j;y<j+m;y++){//找最大id
					if(stu[y].id>tall) tall = stu[y].id;
				}
				cout<<tall+1<<endl;
				return;
			}
		}
	}
	cout<<"impossible"<<endl;
}
int main(){
	init();
	pick();
	return 0;
}
` + "`" + `` + "`" + `` + "`" + `

### 旭哥

测试点未通过

` + "`" + `` + "`" + `` + "`" + `c++
#include<iostream>
#include<map>
#include<list>
#include<vector>
#include<algorithm>
using namespace std;
int n,m,k;
int h;
vector<int> max_nums;
map<int,vector<int> > mp;
int main()
{
    //input
    cin>>n>>m>>k;
    for(int i = 1;i<=n;++i){
        cin>>h;
        mp[h].push_back(i);
    }
    /*operation:
    (1)统一遍历一遍面试名单：从小到大，以遇到的每个身高h为区间起点，检测在[h,h+k)这个cell中，是否能找够m：
        是:则记录下他们最大的面试者编号；放入一个记录每个小区间max_num的vector中
        否:则跳过当前，进行下一个节点循环。
    (2)扫描一遍后，输出max_num的向量中，值最小的，是他们最少需要面试的人数。
    （3）复杂度：应该是O(m*n);
    */
    map<int,vector<int> >::iterator it1 = mp.begin();//用了两个指针，构造数轴上的一个小区间
    map<int,vector<int> >::iterator it2 = it1;
    for(;it1!=mp.end();++it1){
        int counts = 0;
        int max_num = -1;
        bool enough_flag = false;
        int min_high = it1->first;//记录检测小cell中的最小身高（即基准身高），与其他身高之差，应不大于k
        for(it2 = it1;it2!=mp.end();++it2){
            if(it2->first - min_high <= k && counts <= m){
                counts += it2->second.size();
                if(it2->second[it2->second.size()-1] > max_num ){
                    max_num = it2->second[it2->second.size()-1];
                }
            }else if(counts == m) {
                enough_flag = true;
                break;
            }else  break;
        }
        if(max_num !=-1 && enough_flag ==true ) max_nums.push_back(max_num);
     }
     //搜索结束，找到所有小区间上的最小的编号
     int i= max_nums.size();
     vector<int>::iterator it3 = max_nums.begin();
     sort(it3,it3+i);
     if(!max_nums.empty()){
        cout<<max_nums.front()<<endl;
     }else
        cout<<"impossible"<<endl;
    return 0;
}
` + "`" + `` + "`" + `` + "`" + `

## 2017多项式求和

小K最近刚刚习得了一种非常酷炫的多项式求和技巧，可以对某几类特殊的多项式进行运算。非常不幸的是，小K发现老师在布置作业时抄错了数据，导致一道题并不能用刚学的方法来解，于是希望你能帮忙写一个程序跑一跑。给出一个 $m$ 阶多项式$$f(x)=\\sum_{i=0}^mb_ix^i$$对给定的正整数 $a$ ，求$$S(n)=\\sum_{k=0}^na^kf(k)$$由于这个数可能比较大，所以你只需计算 $S(n)$ 对 $10^9+7$ 取模后的值（即计算除以 $10^9+7$ 后的余数）。



### 旭哥

只能过两个测试点！！！

` + "`" + `` + "`" + `` + "`" + `c++
#include<algorithm>
#include<cmath>
#include<stdio.h>
typedef long long ll;
using namespace std;

ll n,m,a;
int mod = 1e9+7;


//计算(a*b)%c
ll mul(ll a,ll b,ll mod) {
    ll res = 0;
    while(b > 0){
        if( (b&1) != 0)  // 二进制最低位是1 --> 加上 a的 2^i 倍, 快速幂是乘上a的2^i ）
            res  = ( res + a) % mod;
        a = (a << 1) % mod;    // a = a * 2    a随着b中二进制位数而扩大 每次 扩大两倍。
        b >>= 1;               // b -> b/2     右移  去掉最后一位 因为当前最后一位我们用完了，
    }
    return res;
}

//幂取模函数
ll pow1(ll a,ll n,ll mod){
    ll res = 1;
    while(n > 0){
        if(n&1)
            res = (res * a)%mod;
        a = (a * a)%mod;
        n >>= 1;
    }
    return res;
}


// 计算 ret = (a^n)%mod
ll pow2(ll a,ll n,ll mod) {
    ll res = 1;
    while(n > 0) {
        if(n & 1)
            res = mul(res,a,mod);
        a = mul(a,a,mod);
        n >>= 1;
    }
    return res;
}

//递归分治法求解
ll pow3(ll a,ll n,ll Mod){
    if(n == 0)
        return 1;
    ll halfRes = pow1(a,n/2,Mod);
    ll res = (ll)halfRes * halfRes % Mod;
    if(n&1)
        res = res * a % Mod;
    return res;
}

ll fun(ll b[],ll x)
{
    ll fx = 0;
    for(ll i = 0;i <= m;++i){
        fx +=  mul(b[i],pow3(x,i,mod),mod);
    }
    return fx;
}

ll Sum(ll a,ll n,ll b[])
{
    ll sum=0;
    for(ll i = 0;i <= n;++i){
        sum += mul(pow3(a,i,mod),fun(b,i),mod);
    }
    return sum%mod;
}

int main()
{
    //input:
    ll temp;
    //cin>>n>>m>>a;
    scanf("%lld %lld %lld",&n,&m,&a);
    ll b[m+1];
    for(ll i = 0;i <= m;++i){
        scanf("%lld",&b[i]);
    }
    printf("%lld",Sum(a,n,b));
    //cout<<Sum(a,n,b)<<endl;
    return 0;
}

` + "`" + `` + "`" + `` + "`" + `

### 轩轩

只能过两个测试点！！！

` + "`" + `` + "`" + `` + "`" + `c++

# include <stdio.h>
# include <iostream>
# define  MAX 1000000007
# define ll long long

using namespace std;

ll n,m,a,*b;


long long mul(long long a,long long b,long long mod) {
    long long res = 0;
    while(b > 0){
        if( (b&1) != 0)  // 二进制最低位是1 --> 加上 a的 2^i 倍, 快速幂是乘上a的2^i ）
            res  = ( res + a) % mod;
        a = (a << 1) % mod;    // a = a * 2    a随着b中二进制位数而扩大 每次 扩大两倍。
        b >>= 1;               // b -> b/2     右移  去掉最后一位 因为当前最后一位我们用完了，
    }
    return res;
}



long long pow(long long a,long long n,long long mod) {
    long long res = 1;
    while(n > 0) {
        if(n & 1)
            res = mul(res,a,mod);
        a = mul(a,a,mod);
        n >>= 1;
    }
    return res;
}


void init(){
	cin>>n>>m>>a;
	b = new ll[m+1];
	for(ll i=0;i<=m;i++){
	cin>>b[i];
	}
}


ll f(ll x){
	ll result=0;
	for(ll i=0;i<=m;i++){
		result+=mul(b[i],pow(x,i,MAX),MAX);
		result%=MAX;
	}
	return result;
}

ll s(){
	ll result=0;
	for(ll i = 0;i<=n;i++){
		result+=mul(pow(a,i,MAX),f(i),MAX);
		result%=MAX;
	}
	return result;
}

int main(){
    init();
	cout<<s()<<endl;
    return 0;
}

` + "`" + `` + "`" + `` + "`" + `

## 2018葱的战争

一个n乘m的棋盘，上面有k根葱，每根葱面朝方向为d（0123分别表示上下左右），没跟葱一个战斗力f。每隔时间葱会向面朝方向走一格，如果遇到棋盘边界，那么他将把面朝方向转180度（此回合葱不会走动），如果某个时刻有两个或以上的葱在同一位置，那么他们将发生战争，只有战斗力最高的葱存活，其他的葱全部原地枯萎，不在走动，求经过t时间后所有葱的位置

输入：第一行n m k，然后接下来k行每根葱的信息x y d f（坐标，方向，战斗力），最后一行输入时间t
输出：k行，分别表示每个葱的位置。
数据范围：n和m在100内，k在1000内，t在1000内，f在1000内，保证初始每颗葱位置不同，战斗力不同。

### 轩轩

以下代码测试点通过

` + "`" + `` + "`" + `` + "`" + `c++
# include<iostream>
# include<map>
# include<vector>
using namespace std;
typedef struct{int x,y;} position;
typedef struct{int id,f;} idfight;
typedef struct{int id;position p;int d;int f;bool live;} cong;
typedef vector<cong> conglist;
conglist all_cong;
map<int,vector<idfight> >war_map;
int n,m,k,times;
void init(){
	cin>>n>>m>>k;
	for(int i=0;i<n;i++){
		int x,y,d,f;
		cin >> x >>y>>d>>f;
		cong c1 ={i,{x,y},d,f,1};
		all_cong.push_back(c1);
	}
	cin >> times;
}
void action(cong &c){
	if(c.live){
	switch(c.d){
	case 0: if(c.p.y==m) c.d=1;else c.p.y++;break;
	case 1: if(c.p.y==1) c.d=0;else c.p.y--;break;
	case 2: if(c.p.x==1) c.d=3;else c.p.x--;break;
	case 3: if(c.p.y==n) c.d=2;else c.p.x++;break;
	default:;break;
	}
	int pi = c.p.x*1000+c.p.y;
	idfight idf = {c.id,c.f};
	war_map[pi].push_back(idf);
	}
}
void printans(){
		for(vector<cong>::iterator i = all_cong.begin();i!=all_cong.end();i++)	
		cout<<(*i).p.y<<" "<<(*i).p.x<<endl;
}
void fight(){
	map<int,vector<idfight> >::iterator it;
	it = war_map.begin();
	while(it!=war_map.end()){
		if((*it).second.size()>1){
			int max = 0;
			for(vector<idfight>::iterator i = (*it).second.begin();i!=(*it).second.end();i++){		
				if((*i).f>max)max = (*i).f;
			}
			for(vector<idfight>::iterator i = (*it).second.begin();i!=(*it).second.end();i++){		
				if((*i).f<max) all_cong[(*i).id].live=0;
			}
		}
	it++;
	}
}
int main() {
	init();
	while(times--){
	for(vector<cong>::iterator i = all_cong.begin();i!=all_cong.end();i++){		
		action(*i);
	}
	fight();
	war_map.clear();
	}
	printans();
	return 0;
}
` + "`" + `` + "`" + `` + "`" + `

## 2018路径

有n个点，每个点有一个权值，每两点间的不同边的个数为他们权值相与得到的值的二进制数字中的1的个数（边为有向边，有第i指向第j，i小于j）求第1个点到第n个点的路径个数（当且仅当不止一条边不同才被称为两条不同的路径），由于数据很大，对991247取模。

输入：第1行n，第二行分别试每个点权值
输出：路径个数
数据范围:n在2e5内，权值大小在1e9内



###  轩轩

` + "`" + `` + "`" + `` + "`" + `c++
# include<iostream>
# include<bitset>
# include<vector>
# define MAX_BIT 32
using namespace std;
vector<int> power; 
int n;
void init(){
	cin>>n;
	for(int i=0;i<n;i++){
		int temp;
		cin>>temp;
		power.push_back(temp);
	}
}
int countones(int a,int b){
	int c = a&b;
	bitset<MAX_BIT> bt(c);
	return bt.count();
}
int calc(int n){
	return n==1?
	countones(power[0],power[1]):
	countones(power[0],power[n])+
	calc(n-1)*countones(power[n],power[n-1])%991127;
}
int main(){
	init();
	cout<<calc(n-1)%991127<<endl;
	return 0;
}

` + "`" + `` + "`" + `` + "`" + `







### 旭哥

以下代码测试点通过

` + "`" + `` + "`" + `` + "`" + `c++
#include<iostream>
using namespace std;
struct Node
{
    int n;
    int w;
}node[200003];
int countOnes(int a,int b)
{
    //count the number in the ans(&)
    int c = a&b;
    int ones = 0;
    while(c != 0){
        if(c%2 == 1)
            ones++;
        c = c>>1;
    }
    return ones;
}

int Routes(int n)
{
    if(n == 1 || n==0 )
        return 0;
    else if(n > 1)
        return countOnes(1,n) + Routes(n-1)*countOnes(n-1,n);
}
int main()
{
    int n,f,routes = 0;
    cin>>n;
    for(int i = 1;i <= n;++i){
        cin>>f;
        node[i].n = i;
        node[i].w= f;
    }
    routes = Routes(5);
    cout<<routes<<endl;
    return 0;

}
` + "`" + `` + "`" + `` + "`" + `
## 2018四种操作

有一个n个元素的数列,元素的值只能是0 1 2三个数中的一个，定义四种操作，(1 i x)表示为把第i位替换成x，x也只能是0 1 2三个数中的一个，(2 i j)表示把第i个数到第j个数所有的元素值加1，并对3取模，(3 i j)表示把第i个数到第j个数之间的序列的颠倒顺序，(4 i j)表示查询第i个数到第j个数之间的序列是否存在三个或以上相同数，如果有，输出yes，否则输出no

输入：第一行输入n，接下来一行输入n个数，保证是0 1 2中的一个，第三行输入一个数q，表示操作个数，接下来q行输入q种操作
输出：每次第四次操作时，输出yes或者no
数据范围：不记得了

### 波哥

` + "`" + `` + "`" + `` + "`" + `c++
#include<iostream>
#include<algorithm>
#include<cstdio>
using namespace std;
int a[100000];
void replace(int a[],int i,int x ){
     a[i-1]=x;
}

void addx_y(int a[],int x,int y){
	for(int i=x-1;i<y;i++){
	   a[i]=(a[i]+1)%3;
    }
}
void ser_com3(int a[],int x,int y){
    int zeros=0;
	int ones=0;
	int twos=0;
	bool flag=0;
	for(int k=x-1;k<y;k++){
	   if(a[k]==0)zeros++;
	   if(a[k]==1)ones++;
	   if(a[k]==2)twos++;
	   if(zeros>=3||ones>=3||twos>=3){
		   flag=1;
		   cout<<"yes"<<endl;
		   break;
	   }
	}
	if(!flag)cout<<"no"<<endl;
}

int main(){
	int n;
	int op,x,y;
	while(scanf("%d",&n)!=EOF){
		for(int i=0;i<n;i++)scanf("%d",&a[i]);
		int q;
		cin>>q;
		while(q--){
			cin>>op>>x>>y;
			switch(op){
				case 1: replace(a,x,y);
                case 2: addx_y(a,x,y);
				case 3: reverse(a+x-1,a+y);
				case 4: ser_com3(a,x,y);
				default:break;
			}
		}
	}
    return 0;
}
` + "`" + `` + "`" + `` + "`" + `


### 旭哥

` + "`" + `` + "`" + `` + "`" + `c++
#include<iostream>
using namespace std;

int a[10000001];
void rep(int a[],int i,int e)
{
    a[i] = e;
}

void addall(int a[],int i,int j)
{
    for(int k = i;k <= j;++k){
        a[k] = (a[k]+1)%3;
    }
}

void rev(int a[],int i,int j)
{
    int temp;
    if((j-i)%2 == 0){
        for(int k = i,m = j;k != m ;++k,--m){
            temp = a[k];
            a[k] = a[m];
            a[m] = temp;
        }
    }else{
        for(int k = i,m = j;k != m-1 ;++k,--m){
            temp = a[k];
            a[k] = a[m];
            a[m] = temp;
        }
    }
}

void quire(int a[],int i,int j)
{
    int zeros,ones,twos;
    for(int k = i;k<j;++k){
        if(a[k] == 0)
            zeros++;
        else if(a[k] == 1)
            ones++;
        else if(a[k] == 2)
            twos++;
        if(zeros >= 3||ones >= 3 || twos >= 3){
            cout<<"yes"<<endl;
            break;
        }
    }
    cout<<"no"<<endl;
}

int main()
{
    int n,q,x,op,s,e;

    //input
    for(int i = 0;i<n;++i){
        cin>>x;
        a[i] = x;
    }
    cin>>q;
    for(int i = 0;i < q ;++i){
        cin>>op>>s>>e;
        if(s == 1)
            rep(a,s,e);
        else if(s == 2)
            addall(a,s,e);
        else if(s == 3 )
            rev(a,s,e);
        else if(s == 4 )
            quire(a,s,e);
    }

    return 0;
}

` + "`" + `` + "`" + `` + "`" + `

### 轩轩

` + "`" + `` + "`" + `` + "`" + `c++
# include<iostream>
# include<vector>
# include<algorithm>
using namespace std;

typedef struct {int x,y,z;} comm;
vector<int> numlist;
vector<comm> commlist;
int n,q;

void init(){
	int temp;
	cin>>n;
	while(n--){
		cin>>temp;
		numlist.push_back(temp);
	}
	cin>>q;
	int x,y,z;
	while(q--){
		cin>>x>>y>>z;
		comm command = {x,y,z};
		commlist.push_back(command);
	}
}
void printdata(){
	vector<int>::iterator it;
	it = numlist.begin();
	while(it!=numlist.end()){
	cout<<(*it)<<" ";
	it++;
	}
	cout<<endl;
}
void action_1(int i,int x){
	numlist[i-1]=x;
}

void action_2(int i ,int j){
	i--;j--;
	for(;i<=j;i++){
		numlist[i]=(numlist[i]+1)%3;
	}

}
void action_3(int i ,int j){
	i--;
	reverse(numlist.begin()+i,numlist.begin()+j);

}
void action_4(int i , int j){
	i--;
	int a,b,c;
	a =  count(numlist.begin()+i,numlist.begin()+j,0);
	b =  count(numlist.begin()+i,numlist.begin()+j,1);
	c =  count(numlist.begin()+i,numlist.begin()+j,2);
	if((a>2)||(b>2)||(c>2))cout<<"yes"<<endl;
	else cout<<"no"<<endl;
}
int main(){
	init();
	vector<comm>::iterator i;
	i = commlist.begin();
	while(i!=commlist.end()){
		switch((*i).x){
		case 1:action_1((*i).y,(*i).z);break;
		case 2:action_2((*i).y,(*i).z);break;
		case 3:action_3((*i).y,(*i).z);break;
		case 4:action_4((*i).y,(*i).z);break;
		default:;
		}
	i++;
	}
	printdata();
	return 0;
}
` + "`" + `` + "`" + `` + "`" + `

## 2021九推机试

### 1、售货机

**时间限制：** 1.0 秒

**空间限制：** 512 MiB

#### 题目描述

清华大学的自动售货机一共有 𝑛 种饮料出售，每种饮料有自己的售价，并在售货机上各有一个出售口。购买第 𝑖 种饮料时，可以在第 𝑖 个出售口支付 𝑎𝑖 的价格，售货机便会在下方的出货处放出对应的饮料。

又到了清凉的夏日，自动售货机为每种饮料各进货了**1 瓶**存储在其中，供同学购买。但是，自动售货机却出现了一些故障，它有可能会出货不属于这个出售口的饮料。

对于第 𝑖 个出售口，**支付 𝑎𝑖 的价格购买后**，如果饮料 𝑖 与饮料 𝑏𝑖 都有存货，有 𝑝𝑖 的概率出货饮料 𝑖 ，有 1−𝑝𝑖 的概率出货饮料 𝑏𝑖 。如果其中一个有存货，另一个已经没有存货，则将出货有存货的那一种饮料。如果两种饮料都没有存货，售货机将不会出货任何饮料并发出警报。**即便最后你没有获得任何饮料，也需要支付 𝑎𝑖 的价格 ** 。

长颈鹿下楼来到这台售货机前，希望能买到最近火爆全网的饮料 𝑥 ，此时售货机中 𝑛 种饮料都存货有 1 瓶。由于他知道售货机有问题，因此决定采取这样的策略来购买：

- 在 𝑛 个出售口中等概率选择一个出售口 𝑠 开始购买，支付这个出售口的价格 𝑎𝑠 并得到出货。
- 当得到想要的饮料 𝑥 时，停止购买流程，满意欢喜的离去。
- 当得到不想要的饮料 𝑦 时，继续在第 𝑦 个支付口购买，支付 𝑎𝑦 的价格并等待出货。
- 当售货机发出警报时，停止购买流程，灰心丧气的离去。

现在他希望你告诉他，他这一次购买过程期望支付的价钱数量是多少？

#### 输入格式

从标准输入读入数据。

第一行两个正整数 𝑛,𝑥。

接下来 𝑛 行每行三个数，其中第 𝑖 行表示 𝑎𝑖,𝑏𝑖,𝑝𝑖。

#### 输出格式

输出到标准输出。

一行一个实数表示答案，表示长颈鹿按他的策略买水期望支付的价钱。

记答案为 𝑎，而你的输出为 𝑏，那么当且仅当 |𝑎−𝑏|<10−6 时我们认为你的输出是正确的。

#### 样例输入

` + "`" + `` + "`" + `` + "`" + `plain
2 2
8 2 0.90
7 1 0.40
` + "`" + `` + "`" + `` + "`" + `

#### 样例输出

` + "`" + `` + "`" + `` + "`" + `plain
13.500000000
` + "`" + `` + "`" + `` + "`" + `

#### 样例解释

售货机里饮料 1 与饮料 2 各有一瓶，且当两瓶都还有存货时，在第 1 个出售口有 0.1 的概率买到饮料 2 ，在第 2 个出售口有 0.6 的概率买到饮料 1 。

- 长颈鹿有0.5的概率初始选择第1个出售口开始购买，并支付8元。
  - 有 0.1 的概率直接出货饮料 2 ，一共支付 8 元，这种情况的概率是 0.05 。
  - 有 0.9 的概率出货饮料 1 ，则长颈鹿会再支付 8 元重新从第 1 个出售口购买饮料。由于饮料 1 已售空，第二次购买时必定直接出货饮料 2 ，一共支付 16 元，这种情况的概率是 0.45 。
- 长颈鹿有0.5的概率初始选择第2个出售口开始购买，并支付7元。
  - 有 0.4 的概率直接出货饮料 2 ，一共支付 7 元，这种情况的概率是 0.2 。
  - 有 0.6 的概率出货饮料 1 ，则长颈鹿会再支付 8 元重新从第 1 个出售口购买饮料。由于饮料 1 已售空，第二次购买时必定直接出货饮料 2 ，一共支付 15 元，这种情况的概率是 0.3 。

于是期望支付的价钱为 8×0.05+16×0.45+7×0.2+15×0.3=13.5

#### 子任务

保证 𝑛≤2000 ， 1≤𝑏𝑖≤𝑛 , 𝑏𝑖≠𝑖 , 0≤𝑎𝑖≤100 ，0≤𝑝𝑖≤1 ，且 𝑝𝑖 不超过两位小数。

子任务 1（50分）：𝑛≤10

子任务 2（30分）：𝑝𝑖=0

子任务 3（20分）：无特殊限制





### 2、水滴

**时间限制：** 2.0 秒

**空间限制：** 512 MiB

**相关文件：** 题目目录

#### 题目描述

这是一个经典的游戏。

在一个 𝑛×𝑚 的棋盘上，每一个格子中都有一些水滴。

玩家的操作是，在一个格子中加一滴水。

当一个格子中的水滴数超过了 4，这一大滴水就会因格子承载不住而向外扩散。扩散的规则是这样的：

这个格子中的水滴会消失，然后分别向上、左、下、右 4 个方向发射一个水滴。如果水滴碰到一个有水的格子，就会进入这个格子。否则水滴会继续移动直到到达棋盘边界后消失。扩散后，水滴进入新的格子可能导致该格子的水滴数也超过 4 ，则会立即引发这个格子的扩散。我们规定，每个格子按逆时针顺序从上方向开始，递归处理完每一个方向的扩散以及其引发的连锁反应，再

...(内容较长，已截取前半部分)...`,
	},
	{
		DisplayName:       `蓝莓哈`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研经验 | interview`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN的保研经验分享：interview。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `**时间限制：** 1 秒 


**空间限制：** 512 MB

**相关文件：** 题目目录





## 题目描述

生活在在外星球X上的小Z想要找一些小朋友组成一个舞蹈团，于是他在网上发布了信息，一共有 $n$ 个人报名面试。

**面试必须按照报名的顺序**依次进行。小Z可以选择在面试完若干小朋友以后，在所有**已经面试过**的小朋友中进行任意顺序的挑选，以组合成一个舞蹈团。

虽然说是小朋友，但是外星球X上的生态环境和地球上的不太一样，这些小朋友的身高可能相差很大。小Z希望组建的这个舞蹈团要求**至少**有 $m$ 个小朋友，并且这些小朋友的最高身高和最低身高之差不能超过 $k$ 个长度单位。

现在知道了这些小朋友的身高信息，问小Z至少要面试多少小朋友才能在已经面试过的小朋友中选出不少于 $m$ 个组成舞蹈团。

## 输入格式

从标准输入读入数据。

第一行 $3$ 个整数 $n,m,k$，意义见题面描述；$1 \\le m \\le n \\le 10^{5}; 0 \\le k \\le 10^{5}$；

第二行 $n$ 个整数，第 $i$ 个数 $h_i$ 表示第 $i$ 个报名面试的小朋友的身高， $1 \\le h_i \\le 10^{5}$。

## 输出格式

输出到标准输出。

如果可以选出舞蹈团，输出**至少**要面试多少人；否则输出 ` + "`" + `impossible` + "`" + `。






## 样例1输入

` + "`" + `` + "`" + `` + "`" + `plain
6 3 5
170 169 175 171 180 175

` + "`" + `` + "`" + `` + "`" + `



## 样例1输出

` + "`" + `` + "`" + `` + "`" + `plain
4

` + "`" + `` + "`" + `` + "`" + `


## 样例1解释
当面试了前$4$个小朋友之后，这些小朋友的身高分别为$170,169,175,171$，可选出身高为$170,175,171$的小朋友组成舞蹈团，故只用面试$4$个小朋友即可。






## 样例2输入

` + "`" + `` + "`" + `` + "`" + `plain
6 4 5
170 169 175 171 180 175

` + "`" + `` + "`" + `` + "`" + `



## 样例2输出

` + "`" + `` + "`" + `` + "`" + `plain
6

` + "`" + `` + "`" + `` + "`" + `


## 样例2解释
在这个样例中，小Z需要面试所有小朋友，才能选出身高为$170,175,171,175$的小朋友组成舞蹈团。






## 样例3输入

` + "`" + `` + "`" + `` + "`" + `plain
6 5 5
170 169 175 171 180 175

` + "`" + `` + "`" + `` + "`" + `



## 样例3输出

` + "`" + `` + "`" + `` + "`" + `plain
impossible

` + "`" + `` + "`" + `` + "`" + `


## 样例4

见题目目录下的 *4.in* 与 *4.ans*。

## 子任务

**本题目一共 $20$ 个测试点，所有测试点均不开启O2优化。**


​	


<table class="table table-bordered"><thead><tr><th rowspan="1">测试点编号</th><th rowspan="1">$n, m$</th><th rowspan="1">$h_i, k$</th></tr></thead><tbody><tr><td rowspan="1">1,2</td><td rowspan="1">$1 \\le m \\le n \\le 100$</td><td rowspan="1">$k=0;1 \\le h_i \\le 100$</td></tr><tr><td rowspan="1">3,4</td><td rowspan="3">$1 \\le m \\le n \\le 2\\times 10^3$</td><td rowspan="1">$0 \\le k \\le 50;1 \\le h_i \\le 100$</td></tr><tr><td rowspan="1">5,6,7,8</td><td rowspan="1">$0 \\le k \\le 100;1 \\le h_i \\le 5\\times 10^3$</td></tr><tr><td rowspan="1">9,10,11,12</td><td rowspan="1">$0 \\le k \\le 5\\times 10^3;1 \\le h_i \\le 5\\times 10^3$</td></tr><tr><td rowspan="1">13,14</td><td rowspan="1">$1 \\le m \\le n \\le 2\\times 10^3$</td><td rowspan="1">$0 \\le k \\le 10^5;1 \\le h_i \\le 10^5$</td></tr><tr><td rowspan="1">15,16</td><td rowspan="1">$1 \\le m \\le n \\le 10^5$</td><td rowspan="1">$0 \\le k \\le 100;1 \\le h_i \\le 10^5$</td></tr><tr><td rowspan="1">17,18,19,20</td><td rowspan="1">$1 \\le m \\le n \\le 10^5$</td><td rowspan="1">$0 \\le k \\le 10^5;1 \\le h_i \\le 10^5$</td></tr></tbody></table>`,
	},
	{
		DisplayName:       `奔跑的花生wow`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研经验 | mine`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN的保研经验分享：mine。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `**时间限制：** 1 秒 


**空间限制：** 512 MB

**相关文件：** 题目目录




## 题目描述

扫雷（minesweeper）是一个有趣的单人益智类游戏，游戏目标是在最短的时间内根据棋盘上的提示信息，找出所有非雷方块，同时避免踩到地雷。随着桌面操作系统Windows的流行，其自带的扫雷游戏也因为有趣的玩法、精致的画面受到大家的欢迎。

小L的电脑上曾经也有一个扫雷游戏，它和主流的扫雷游戏基本相似，但是有一些不同的地方，具体介绍如下：

> 游戏开始时，玩家可以看到 $N\\times M$ 个整齐排列的空白方块，玩家须根据棋盘已有的信息，运用逻辑推理来推断哪些方块含或不含地雷。
>
> 1. 玩家可以用鼠标左键点击空白方块，表示推断这个方块没有地雷，尝试探明它。
>
> * 如果玩家点开没有地雷的方块，会有一个数字显现其上，这个数字代表着八连通的相邻方块有多少颗地雷（至多为 $8$）
>
> * 如果这个方块八连通的方块中没有地雷（也即，方块显示的数字为 $0$），则系统会自动帮玩家点开它相邻的方块，这个过程**可能**会引起连锁反应。
>
> * 如果玩家点开有地雷的方块，则游戏结束，玩家失败。
>
> 2. 玩家可在推测有地雷的方块上点鼠标右键，表示放置旗帜来标明地雷的位置；在有旗帜的方块上再次点击右键，会使旗帜消失，成为空白的方块。在已标明旗帜的方块点击左键，方块不会有任何的变动。若在游戏进行中错置旗帜，可以用右键来改变方块状态。
>
> 3. 玩家可以在一个已探明的方块上同时点击左键及右键。此时，如果方块相邻的 $8$ 个方块放置旗帜的数目与方块上的数字相同，那么周围未探明的方块就会自动打开。然而，玩家若错置旗帜位置，此动作可能会打开真正藏有地雷的方块，导致游戏失败。不过这样的点击动作可加快游戏速度以便得到高分。
>

然而，年代久远，小 L 已经找不到当年陪他度过十年求学时光的扫雷游戏了，于是他找到了精通编程的你，希望你能帮他写一个简单的扫雷游戏，帮助他回忆那些快乐时光。

具体来说，你的程序应该读入一个地雷布置图。然后读入用户的每一次游戏操作，并在每次操作后给用户以反馈，帮助用户进行游戏。

## 输入格式

从标准输入读入数据。

**约定：我们用坐标 $(x, y)$ 表示棋盘第 $x$ 行、第 $y$ 列的方块。**

第一行用空格隔开的两个整数 $n,m$，表示棋盘的规模。

接下来 $n$ 行，每行一个长为 $m$ 的字符串，描述棋盘，其中第 $i$ 行的第 $j$ 个字符表示棋盘的方块 $(i, j)$。为 ` + "`" + `*` + "`" + ` 表示方块里有一个地雷，为 ` + "`" + `.` + "`" + ` 表示方块是安全的。

接下来每一行按时间顺序描述每一次用户操作，直到文件结束。每一行的格式如下：

1. 首先读入一个字符串，表示这次操作的内容：

* Flag：表示右键点击某个方块，插上／撤销一面旗帜。
* Sweep：表示左键点击某个方块，判断这个方块没有地雷，要探明之。
* DSweep：表示左右键同时点击某个方块，尝试探明与它相邻的方块。
* Quit：表示放弃本局游戏并退出。

2. 若操作不为 Quit，则之后有空格隔开的两个整数 $x,y$，表示这次操作的坐标为 $(x, y)$，保证 $1\\leq x\\leq n$, $1\\leq y\\leq m$。

输入数据保证存在有且仅有一次 Quit 操作。

## 输出格式

输出到标准输出。

对每一次操作，向标准输出打印一行或多行，表示此次操作的反馈。具体格式如下：

1. 若读入了 Quit，忽略之后的所有输入，结束本局游戏，输出结束信息（见第 $8$ 条）。
2. 对 Flag 操作：

* 如果对应方块已经被探明，输出一行 ` + "`" + `swept` + "`" + `。
* 如果对应方块未被探明，插上旗帜，输出一行 ` + "`" + `success` + "`" + `。
* 如果对应方块上有旗帜，清除之，输出一行 ` + "`" + `cancelled` + "`" + `。

3. 对 Sweep 操作：

* 如果对应方块已经被探明，输出一行 ` + "`" + `swept` + "`" + `。
* 如果对应方块上有旗帜，输出一行 ` + "`" + `flagged` + "`" + `。
* 如果对应方块未被探明，进行扫雷过程，根据扫雷的结果，输出反馈信息（见第 $5、6$ 条）。

4. 对 DSweep 操作：

* 如果对应方块未被探明，输出一行 ` + "`" + `not swept` + "`" + `。
* 如果对应方块数字为 $0$、或者它八连通的方块的旗帜数不等于方块显示的数，输出一行 ` + "`" + `failed` + "`" + `。
* 否则，对方块八连通的每个**空白方块**进行扫雷过程，**所有扫雷过程结束之后**，根据扫雷的结果，输出反馈信息（见第 $6、7$ 条）。

5. 扫雷过程，假设要对 $(x, y)$ 进行扫雷：

* 如果 $(x,y)$ 为地雷，**扫雷失败**。输出一行 ` + "`" + `boom` + "`" + `。接着，忽略之后的所有输入，结束本局游戏，输出结束信息（见第 $8$ 条）。

* 否则，标记这个方块为“已探明”，令这个方块显示它相邻的方块的地雷总数。如果它相邻的方块不存在地雷，则**自动**对它相邻的没有探明的方块进行扫雷（此时，清除它的相邻方块上的旗帜信息），这个过程**可能会**引起连锁反应。

6. 对 Sweep 操作，在扫雷过程**成功**结束之后输出扫雷反馈；对 DSweep 操作，在所有的扫雷过程（可能是 $0$ 次）**成功**结束之后输出扫雷反馈，格式如下：

* 如果没有任何新方块被探明（可能在 DSweep 时发生），输出一行：` + "`" + `no cell detected` + "`" + `。
* 否则，设有 $num\\_of\\_cells$ 个新方块被探明，首先输出一行：` + "`" + `NUM_OF_CELLS cell(s) detected` + "`" + `，其中 ` + "`" + `NUM_OF_CELLS` + "`" + ` 应该输出本次操作探明的方块数，**请注意括号的输出**。
* 接下来 $num\\_of\\_cells$ 行，将所有新探明的方块按照**所在行**为第一关键字，**所在列**为第二关键字，**从小到大**排序输出，每一行输出空格隔开的三个整数 $x,y,c$，其中 $x, y$ 表示方块的坐标，$c$ 表示方块上显示的数字。

7. 若某次 Sweep / DSweep 操作结束之后，所有没有地雷的方块均被探明，忽略之后的所有输入，结束本局游戏，输出结束信息（见第 $8$ 条）。

8. 结束信息的输出格式：

* 首先，输出游戏胜负情况：

  * 若所有没有地雷的方块均被探明，输出一行：` + "`" + `finish` + "`" + `；

  * 若踩到雷而结束游戏，输出一行：` + "`" + `game over` + "`" + `；

  * 若因为 Quit 而结束游戏，输出一行：` + "`" + `give up` + "`" + `。
* 之后，计算玩家使用的行动次数 $total\\_step$，每次成功／不成功的 Flag, Sweep, DSweep 均视为一次行动，Quit 不算一次行动，输出一行：` + "`" + `total step TOTAL_STEP` + "`" + `，其中 ` + "`" + `TOTAL_STEP` + "`" + ` 应该输出行动次数。

**注意：请特别注意各项输出的拼写和空格，否则将可能导致程序错误直至零分。**






## 样例1输入

` + "`" + `` + "`" + `` + "`" + `plain
3 3
...
..*
...
Sweep 1 1
DSweep 1 2
Flag 1 3
Flag 2 3
DSweep 1 2
Sweep 1 3
Flag 1 1
DSweep 1 3
Flag 1 3
DSweep 1 2
DSweep 1 2
Sweep 3 3
Quit

` + "`" + `` + "`" + `` + "`" + `



## 样例1输出

` + "`" + `` + "`" + `` + "`" + `plain
6 cell(s) detected
1 1 0
1 2 1
2 1 0
2 2 1
3 1 0
3 2 1
failed
success
success
failed
flagged
swept
not swept
cancelled
1 cell(s) detected
1 3 1
no cell detected
1 cell(s) detected
3 3 1
finish
total step 12

` + "`" + `` + "`" + `` + "`" + `


## 样例1解释
第一组数据展示了一个在简单的 $3\\times 3$ 棋盘上进行的游戏过程，样例输出中展示了上文提到的绝大部分输出信息。

## 样例2

见题目目录下的 *2.in* 与 *2.ans*。

## 样例2解释
第二组数据展示了一种因为错误的 Flag 操作和 DSweep 操作而导致游戏失败的情况。


## 样例3

见题目目录下的 *3.in* 与 *3.ans*。

## 样例3解释
第三组数据展示了一种因为 Quit 操作而结束游戏的情况，注意，当游戏结束之后，你的程序应该输出结束信息，并忽略之后的所有操作。

## 子任务

共有 $20$ 个测试点，每个测试点满分为 $5$ 分。

我们令 $n,m$ 表示棋盘的规模，$q$ 表示输入的操作次数，有以下约定：

| 测试点         | $n$         | $m$         | $q$          | 性质   |
| ----------- | ----------- | ----------- | ------------ | ---- |
| $1$ ~ $2$   | $\\leq 10$   | $\\leq 10$   | $\\leq 60$    | A    |
| $3$ ~ $4$   | $\\leq 10$   | $\\leq 10$   | $\\leq 60$    | B    |
| $5$ ~ $6$   | $\\leq 10$   | $\\leq 10$   | $\\leq 60$    | 无    |
| $7$ ~ $8$   | $=1$        | $\\leq 1000$ | $\\leq 1000$  | A    |
| $9$ ~ $10$  | $=1$        | $\\leq 1000$ | $\\leq 1000$  | B    |
| $11$ ~ $12$ | $=1$        | $\\leq 1000$ | $\\leq 1000$  | 无    |
| $13$ ~ $14$ | $\\leq 300$  | $\\leq 300$  | $\\leq 8000$  | A    |
| $15$ ~ $16$ | $\\leq 300$  | $\\leq 300$  | $\\leq 8000$  | B    |
| $17$ ~ $19$ | $\\leq 300$  | $\\leq 300$  | $\\leq 8000$  | 无    |
| $20$        | $\\leq 1000$ | $\\leq 1000$ | $\\leq 60000$ | 无    |

性质A：保证只有 Sweep 操作和 Quit 操作。

性质B：保证没有 DSweep 操作。

注意：**对于规模较大的数据，请不要使用过于缓慢的输出方式。**`,
	},
	{
		DisplayName:       `快乐的可颂_v`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研经验 | polynomial`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN的保研经验分享：polynomial。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `**时间限制：** 1 秒 


**空间限制：** 512 MB

**相关文件：** 题目目录




## 问题描述

小K最近刚刚习得了一种非常酷炫的多项式求和技巧，可以对某几类特殊的多项式进行运算。

非常不幸的是，小K发现老师在布置作业时抄错了数据，导致一道题并不能用刚学的方法来解，于是希望你能帮忙写一个程序跑一跑。

给出一个 $m$ 阶多项式$$f(x)=\\sum_{i=0}^mb_ix^i$$

对给定的正整数 $a$ ，求$$S(n)=\\sum_{k=0}^na^kf(k)$$

由于这个数可能比较大，所以你只需计算 $S(n)$ 对 $10^9+7$ 取模后的值（即计算除以 $10^9+7$ 后的余数）。

## 输入格式

从标准输入读入数据。

第一行包含三个整数 $n,m,a$。

第二行包含$m+1$个整数，$b_0,b_1,\\dots,b_m$ 描述给定多项式的系数。

对于所有数据，$1\\leq a,b_i\\leq 10^9$。

## 输出格式

输出到标准输出。

输出一行一个数，表示 $S(n)$ 对 $10^9+7$ 取模后的结果。






## 样例1输入

` + "`" + `` + "`" + `` + "`" + `plain
5 2 3
1 1 1

` + "`" + `` + "`" + `` + "`" + `



## 样例1输出

` + "`" + `` + "`" + `` + "`" + `plain
9658

` + "`" + `` + "`" + `` + "`" + `


## 样例1解释

$f(x)=1+x+x^2$，故 $f(0)=1,f(1)=3,f(2)=7,f(3)=13,f(4)=21,f(5)=31$。

$f(0)+3f(1)+9f(2)+27f(3)+81f(4)+243f(5)=1+3*3+9*7+27*13+81*21+243*31=9658$。




## 样例2输入

` + "`" + `` + "`" + `` + "`" + `plain
100 3 233
1 2 3 4

` + "`" + `` + "`" + `` + "`" + `



## 样例2输出

` + "`" + `` + "`" + `` + "`" + `plain
994811687

` + "`" + `` + "`" + `` + "`" + `





## 样例3输入

` + "`" + `` + "`" + `` + "`" + `plain
20170314 10 11037
1 2 3 4 5 6 7 8 9 10 11

` + "`" + `` + "`" + `` + "`" + `



## 样例3输出

` + "`" + `` + "`" + `` + "`" + `plain
133604769

` + "`" + `` + "`" + `` + "`" + `


## 子任务

| 测试点      | $n$         | $m$         | $a$          |
| ----------- | ----------- | ----------- | ------------ |
| $1$ ~ $2$   | $\\leq 1000$ | $\\leq 10$   | $\\leq 10^9$  |
| $3$         | $\\leq 10^9$ | $=1$        | $=1$         |
| $4$         | $\\leq 10^9$ | $=2$        | $=1$         |
| $5$         | $\\leq 10^9$ | $=3$        | $\\leq 10^9$  |
| $6$         | $\\leq 10^9$ | $=5$        | $=1$         |
| $7$ ~ $8$   | $\\leq 10^9$ | $\\leq 20$   | $=1$         |
| $9$         | $\\leq 10^9$ | $\\leq 50$   | $\\leq 10^9$  |
| $10$        | $\\leq 10^9$ | $\\leq 100$  | $\\leq 10^9$  |`,
	},
	{
		DisplayName:       `奶茶跑步去`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研经验 | 国内NLP\\IR\\DATA MINING 做的好的老师\\科研组?`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN的保研经验分享：国内NLP\\IR\\DATA MINING 做的好的老师\\科研。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `作者：匿名用户
链接：https://www.zhihu.com/question/277960429/answer/1219474806
来源：知乎
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

# [国内NLP\\IR\\DATA MINING 做的好的老师\\科研组?](https://www.zhihu.com/question/277960429/answer/1219474806)

------------------------------------0档--清北-------------------------------

清华大学：

1. 计算机系：[唐杰](https://keg.cs.tsinghua.edu.cn/jietang/)，[崔鹏](https://pengcui.thumedialab.com/)，[刘知远](https://nlp.csai.tsinghua.edu.cn/~lzy/index_cn.html)，[黄民烈](https://coai.cs.tsinghua.edu.cn/hml/)，[朱军](https://ml.cs.tsinghua.edu.cn/~jun/index.shtml)，[刘洋](https://nlp.csai.tsinghua.edu.cn/~ly/index_cn.html)，[刘奕群](https://www.thuir.cn/group/~YQLiu/)，[张敏](https://www.thuir.cn/group/~mzhang/)，[李涓子](https://keg.cs.tsinghua.edu.cn/persons/ljz/)，[杨士强](https://www.cs.tsinghua.edu.cn/publish/cs/4616/2013/20[电话已隐藏]6384455844/20[电话已隐藏]6384455844_.html)，[孙茂松](https://www.cs.tsinghua.edu.cn/publish/cs/4616/2013/20[电话已隐藏]7386785027/20[电话已隐藏]7386785027_.html)，[朱文武](https://www.cs.tsinghua.edu.cn/publish/cs/4616/2013/20[电话已隐藏]8347214535/20[电话已隐藏]8347214535_.html)，[张钹](https://www.cs.tsinghua.edu.cn/publish/cs/4616/2013/20[电话已隐藏]2570851542/20[电话已隐藏]2570851542_.html)，[朱小燕](https://www.cs.tsinghua.edu.cn/publish/cs/4616/2013/20[电话已隐藏]5424966147/20[电话已隐藏]5424966147_.html)，[马少平](https://www.cs.tsinghua.edu.cn/publish/cs/4616/2013/20[电话已隐藏]6790628501/20[电话已隐藏]6790628501_.html)，[王建勇](https://dbgroup.cs.tsinghua.edu.cn/wangjy/)，[李国良](https://dbgroup.cs.tsinghua.edu.cn/ligl/index_cn.html)；
2. 自动化系：[黄高](https://www.gaohuang.net/index-cn.html)，[张长水](https://bigeye.au.tsinghua.edu.cn/Introduction.html)；
3. 软件学院：[龙明盛](https://ise.thss.tsinghua.edu.cn/~mlong/)，[高跃](https://www.gaoyue.org/cn/people/index.htm)，[王建民](https://ise.thss.tsinghua.edu.cn/~wangjianmin/)，[叶晓俊](https://www.thss.tsinghua.edu.cn/publish/soft/3641/2010/201012[电话已隐藏]369802/201012[电话已隐藏]369802_.html)；

北京大学：

1. 数学学院：[张志华](https://www.math.pku.edu.cn/teachers/zhzhang/)，[朱占星](https://sites.google.com/view/zhanxingzhu/)；
2. 信息科学技术学院：[穆亚东](https://www.muyadong.com/)，[林宙辰](https://eecs.pku.edu.cn/info/1342/6123.htm)，[严睿](https://www.ruiyan.me/)，[孙栩](https://xusun.org/)，[刘譞哲](https://www.liuxuanzhe.com/)，[王立威](https://www.liweiwang-pku.com/index-cn.html)，[朱松纯](https://www.stat.ucla.edu/~sczhu/)，[万小军](https://wanxiaojun.github.io/)，[李素建](https://123.56.88.210/)，[崔斌](https://115.27.245.35/info/1004/1906.htm)，[梅宏](https://eecs.pku.edu.cn/info/1041/1711.htm)，[金芝](https://cs.pku.edu.cn/info/1084/1205.htm)，[张铭](https://eecs.pku.edu.cn/info/1337/10183.htm)，[高文](https://www.jdl.ac.cn/htm-gaowen/)，[张大庆](https://eecs.pku.edu.cn/info/1338/7075.htm)，[王厚峰](https://eecs.pku.edu.cn/info/1340/6085.htm)，[常宝宝](https://eecs.pku.edu.cn/info/1340/6093.htm)，[穗志方](https://icl.pku.edu.cn/cy/szf/index.htm)；

-----------------------------------0.5档--中国科学院-------------------------

中科院计算所： [程学旗](https://people.ucas.ac.cn/~cxq)，[何清](https://people.ucas.ac.cn/~heqing)，[罗平](https://people.ucas.ac.cn/~luop)，[敖翔](https://aoxaustin.github.io/)，[郭嘉丰](https://www.bigdatalab.ac.cn/~gjf/)，[沈华伟](https://people.ucas.ac.cn/~shenhuawei)，[冯洋](https://people.ucas.ac.cn/~yangfeng)，[山世光](https://vipl.ict.ac.cn/view_people.php%3Furl%3D%26id%3D12)，[兰艳艳](https://www.bigdatalab.ac.cn/~lanyanyan/)，[庄福振](https://www.intsci.ac.cn/users/zhuangfuzhen/index.htm)，[陈熙霖](https://vipl.ict.ac.cn/people/~xlchen)，[王瑞平](https://vipl.ict.ac.cn/homepage/rpwang/%3Furl%3Drpwang)；

中科院自动化所：[谭铁牛](https://people.ucas.ac.cn/~tantieniu)，[徐波](https://people.ucas.ac.cn/~xubo)，[刘成林](https://people.ucas.ac.cn/~liuchenglin)，[吴书](https://www.shuwu.name/)，[王亮](https://www.cbsr.ia.ac.cn/users/liangwang/)，[张兆翔](https://zhaoxiangzhang.net/)，[田捷](https://www.3dmed.net/syszr/49.htm)，[刘康](https://people.ucas.ac.cn/~liukang)，[张家俊](https://www.nlpr.ia.ac.cn/cip/jjzhang.htm)，[赫然](https://people.ucas.ac.cn/~heran)，[徐常胜](https://people.ucas.ac.cn/~xuchangsheng)，[方全](https://www.nlpr.ia.ac.cn/users/fangquan/index.htm)，[宗成庆](https://www.nlpr.ia.ac.cn/cip/cqzong.htm)；

中科院软件所：[孙乐](https://people.ucas.ac.cn/~lesun)，[韩先培](https://people.ucas.ac.cn/~xphan)；

中科院深圳先进院：[杨敏](https://minyang.me/)；

-----------------------------------1档--华东五校-----------------------------

复旦大学：

1. 计算机学院：[邱锡鹏](https://xpqiu.github.io/)，[张奇](https://qizhang.info/index_cn.html)，[黄萱菁](https://www.iipl.fudan.edu.cn/staff/huangxj.html)，[王晓阳](https://daslab.fudan.edu.cn/index.php/dt_team/wangxiaoyang/)，[肖仰华](https://datascience.fudan.edu.cn/5a/ab/c13398a154283/page.htm)，[周水庚](https://admis.fudan.edu.cn/~sgzhou/)，[薛向阳](https://homepage.fudan.edu.cn/xyxue/zh/)，[姜育刚](https://www.yugangjiang.info/index.html)；
2. 大数据学院：[魏忠钰](https://www.sdspeople.fudan.edu.cn/zywei/)，[付彦](https://yanweifu.github.io/index.html)伟；

上海交通大学：[张伟楠](https://wnzhang.net/)，[卢策吾](https://mvig.sjtu.edu.cn/)，[林洲汉](https://hantek.github.io/)，[张拳石](https://qszhang.com/)，[严骏驰](https://thinklab.sjtu.edu.cn/)，[赵海](https://bcmi.sjtu.edu.cn/home/zhaohai/)，[俞凯](https://speechlab.sjtu.edu.cn/members/kai_yu)，[俞勇](https://apex.sjtu.edu.cn/members/yyu)；

浙江大学：[蔡登](https://www.cad.zju.edu.cn/home/dengcai/)，[杨洋](https://yangy.org/)，[赵洲](https://person.zju.edu.cn/zhaozhou)，[况琨](https://kunkuang.github.io/)，[潘纲](https://person.zju.edu.cn/gpan)，[朱建科](https://person.zju.edu.cn/jkzhu)，[吴朝晖](https://mypage.zju.edu.cn/wuzhaohui)，[何晓飞](https://www.cad.zju.edu.cn/home/xiaofeihe/)，[高云君](https://person.zju.edu.cn/gaoyj_cn)；

中科大：

1. 信息学院（含大数据学院）：[何向南](https://staff.ustc.edu.cn/~hexn/)，[张天柱](https://staff.ustc.edu.cn/~tzzhang/)，[王杰](https://staff.ustc.edu.cn/~jwangx/)，[刘东](https://staff.ustc.edu.cn/~dongeliu/)，[查正军](https://sds.ustc.edu.cn/2018/0723/c15528a298806/page.htm)，[吴枫](https://eeis.ustc.edu.cn/2014/0423/c2648a20109/page.htm)，[李卫平](https://lfn.ustc.edu.cn/index.php/Vindex/product/69)，[李厚强](https://staff.ustc.edu.cn/~lihq/)，[陈雪锦](https://staff.ustc.edu.cn/~xjchen99/)；
2. 计算机学院（含大数据学院）：[刘淇](https://staff.ustc.edu.cn/~qiliuql/)，[连德富](https://staff.ustc.edu.cn/~liandefu/)，[徐林莉](https://staff.ustc.edu.cn/~linlixu/)，[孙广中](https://ada.ustc.edu.cn/)，[徐童](https://staff.ustc.edu.cn/~tongxu/)，[陈恩红](https://staff.ustc.edu.cn/~cheneh/)，[陈小平](https://ai.ustc.edu.cn/)；

南京大学：[王利民](https://wanglimin.github.io/)，[钱超](https://www.lamda.nju.edu.cn/qianc/%3FAspxAutoDetectCookieSupport%3D1)，[黄书剑](https://nlp.nju.edu.cn/huangsj/)，[周志华](https://cs.nju.edu.cn/zhouzh/)，[俞杨](https://www.lamda.nju.edu.cn/yuy/)，[李武军](https://cs.nju.edu.cn/lwj/)，[高阳](https://cs.nju.edu.cn/gaoyang/)，[张利军](https://cs.nju.edu.cn/zlj/)，[黎铭](https://www.lamda.nju.edu.cn/lim/)，[李宇峰](https://cs.nju.edu.cn/liyf)，[戴新宇](https://cs.nju.edu.cn/daixinyu/)；

-----------------------------------2档--其他双一流A,B类------------------------------

中国人民大学：[文继荣](https://info.ruc.edu.cn/academic_professor.php%3Fteacher_id%3D64)，[杜小勇](https://iir.ruc.edu.cn/~duyong/)，[徐君](https://info.ruc.edu.cn/academic_professor.php%3Fteacher_id%3D169)，[赵鑫](https://aibox.ruc.edu.cn/)，[金琴](https://jin-qin.com/AIM3-Lab.html)，[窦志成](https://playbigdata.ruc.edu.cn/dou/)，[张静](https://xiaojingzi.github.io/)，[魏哲巍](https://weizhewei.com/)，[苏冰](https://ai.ruc.edu.cn/academicfaculty/fea218174a6e493a99cfcebdc7dfe6c4.htm)，[刘勇](https://iie-liuyong.github.io/)，[陈旭](https://xu-chen.com/)，[胡迪](https://dtaoo.github.io/)，[毛佳昕](https://sites.google.com/site/maojiaxin/)，[沈蔚然](https://www.weiran-shen.info/)，[宋睿华](https://scholar.google.com/citations%3Fuser%3D9yVx9L8AAAAJ%26hl%3Dzh-CN)；

哈工大：[张伟男](https://ir.hit.edu.cn/~wnzhang/)，[李生](https://mitlab.hit.edu.cn/2018/0608/c9183a210164/page.htm)，[赵铁军](https://homepage.hit.edu.cn/zhaotiejun)，[刘挺](https://homepage.hit.edu.cn/liuting)，[王海峰](https://ir.hit.edu.cn/~wanghaifeng/whf_cn.htm)，[秦兵](https://homepage.hit.edu.cn/qinbing)，[车万翔](https://homepage.hit.edu.cn/wanxiang)，[关毅](https://homepage.hit.edu.cn/guanyi) ，[陈雨时](https://homepage.hit.edu.cn/chenyushi)；

哈工大深圳：[徐睿峰](https://www.hitsz.edu.cn/teacher/view/id-492.html)，[李旭涛](https://www.hitsz.edu.cn/teacher/view/id-1215.html)，[徐增林](https://cs.hitsz.edu.cn/info/1021/2300.htm)，[张正](https://cs.hitsz.edu.cn/info/1021/2217.htm)，[张梅山](https://zhangmeishan.github.io/chn.html)；

北航：[李舟军](https://scse.buaa.edu.cn/info/1078/2643.htm)，[童咏昕](https://sites.nlsde.buaa.edu.cn/~yxtong/)，[王静远](https://www.bigscity.com/)，[史振威](https://levir.buaa.edu.cn/index_cn.htm)，[刘偲](https://www.colalab.org/)，[许可](https://scse.buaa.edu.cn/info/1078/2655.htm)，[张日崇](https://act.buaa.edu.cn/zhangrc/)；

中山大学：[林倞](https://sdcs.sysu.edu.cn/content/2513)，[凌青](https://sdcs.sysu.edu.cn/content/2513)，[王昌栋](https://sdcs.sysu.edu.cn/content/2465)，[梁上松](https://sites.google.com/site/shangsongliang/home)，[梁小丹](https://lemondan.github.io/)，[郑伟诗](https://www.isee-ai.cn/~zhwshi/)，[李冠彬](https://guanbinli.com/)；

南开大学：[沈玮](https://cc.nankai.edu.cn/2019/0515/c13618a159309/page.htm)，[程明明](https://mmcheng.net/)，[杨巨峰](https://cv.nankai.edu.cn/)；

天津大学：[张鹏](https://cic.tju.edu.cn/faculty/zhangpeng/index.html)，[熊得意](https://tjunlp-lab.github.io/) , [张长青](https://cic.tju.edu.cn/faculty/zhangchangqing/index.html)；

北京理工：[沈建冰](https://cs.bit.edu.cn/szdw/jsml/js/sjb/index.htm)，[付莹](https://vmcl.bit.edu.cn/xztd/js/js/111598.htm)，[黄河燕](https://cs.bit.edu.cn/szdw/jsml/js/hhy/index.htm)，[王国仁](https://cs.bit.edu.cn/szdw/jsml/js/wgr_2018/index.htm)，[辛欣](https://cs.bit.edu.cn/szdw/jsml/js/xinx/index.htm)，[礼欣](https://cs.bit.edu.cn/szdw/jsml/fjs/lx/index.htm)，[贾云得](https://cs.bit.edu.cn/szdw/jsml/js/jyd/index.htm)，[吴心筱](https://wuxinxiao.github.io/)；

东南大学：[漆桂林](https://cse.seu.edu.cn/2019/0103/c23024a257135/page.htm)，[耿新](https://palm.seu.edu.cn/xgeng/)，[张敏灵](https://palm.seu.edu.cn/zhangml/)，[周德宇](https://palm.seu.edu.cn/zhoudeyu/Home.html)，[王萌](https://seu.wangmengsd.com/)，[吴巍炜](https://cse.seu.edu.cn/2019/0103/c23024a257230/page.htm)；

武汉大学：[李晨亮](https://www.lichenliang.net/zh.html)，[姬东鸿](https://cse.whu.edu.cn/index.php%3Fs%3D/home/szdw/detail/id/78.html)，[张乐飞](https://sites.google.com/site/lzhangpage/)；

华中科大：[魏巍](https://cciip.cs.hust.edu.cn/index.htm)，[金海](https://www.scholat.com/hjin)，[白翔](https://www.paper.edu.cn/scholar/person/NUT2QN0IOTT0Ixyh)；

电子科大：[郑凯](https://zheng-kai.com/)，[申恒涛](https://faculty.uestc.edu.cn/shenhengtao/zh_CN/index.htm)，[段立新](https://faculty.uestc.edu.cn/lxduan/zh_CN/index.htm)，[杨阳](https://cfm.uestc.edu.cn/~yangyang/)，[邵杰](https://cfm.uestc.edu.cn/~shaojie/)，[高联丽](https://lianligao.github.io/)，[宋井宽](https://cfm.uestc.edu.cn/~songjingkuan/)，[沈复民](https://cfm.uestc.edu.cn/~fshen/)，[周涛](https://faculty.uestc.edu.cn/zhoutao1/zh_CN/index.htm)；

华南理工：[金连文](https://www.hcii-lab.net/lianwen/)，[贾奎](https://yanzhao.scut.edu.cn/open/ExpertInfo.aspx%3Fzjbh%3D7XE9MhnKXM9BHCo2MYFbrA%3D%3D)；

西北工业大学：[李学龙](https://teacher.nwpu.edu.cn/2018010290.html)，[聂飞平](https://teacher.nwpu.edu.cn/niefeiping.html)，[尚学群](https://www.nwpu-bioinformatics.com/)，[夏勇](https://teacher.nwpu.edu.cn/yongxia)，[谢磊](https://lxie.nwpu-aslp.org/)，[王琦](https://crabwq.github.io/)；

山东大学：[马军](https://ir.sdu.edu.cn/~junma/)，[聂礼强](https://liqiangnie.github.io/)，[宋雪萌](https://xuemengsong.github.io/)，[任昭春](https://ir.sdu.edu.cn/~zhaochunren/)，[甘甜](https://gantian.github.io/)，[尹建华](https://jhyin12.github.io/)，[吴建龙](https://jlwu1992.github.io/)，[余国先](https://mlda.swu.edu.cn/GuoxianYu/index.html)；

厦门大学：[纪荣嵘](https://mac.xmu.edu.cn/rrji/)，[李辉](https://lihui.info/)；

华东师范：[周傲英](https://www.ecnu.edu.cn/single/main.htm%3Fpage%3Dzay)，[林学民](https://www.cse.unsw.edu.au/~lxue/)，[张伟](https://weizhangltt.github.io/)，[吴苑斌](https://antnlp.org/)；

大连理工大学：[卢湖川](https://faculty.dlut.edu.cn/Huchuan_Lu/zh_CN/index.htm)，[林鸿飞](https://faculty.dlut.edu.cn/linhongfei/zh_CN/index.htm)；

吉林大学：[常毅](https://www.yichang-cs.com/)；

东北大学：[朱靖波](https://www.nlplab.com/members/zhujingbo.html)，[肖桐](https://www.nlplab.com/members/xiaotong.html)，[任飞亮](https://faculty.neu.edu.cn/ise/renfeiliang/index.html)，[郭贵冰](https://faculty.neu.edu.cn/swc/guogb/)；

-------------------------------3档--一流学科及其他---------------------------------

北京邮电大学：石川，白婷，王啸，王鹏飞，杨成，胡琳梅；

北京交通大学：于剑，桑基韬；

南京理工大学：杨健，唐金辉，宫辰，夏睿，李泽超，潘金山，魏秀参；

南航：陈松灿，黄圣君；

西电：管子玉，李辉；

苏州大学：许佳捷，赵鹏鹏，刘冠峰，李凡长，张莉，朱巧明，张民，周国栋；

合肥工业大学：吴信东，汪萌，洪日昌，吴乐，王杨，孙晓；

南京邮电大学：鲍秉坤；

南方科技大学：张宇；

上海科技大学：[屠可伟](https://faculty.sist.shanghaitech.edu.cn/faculty/tukw/)；

西湖大学：李子青，[张岳](https://frcchang.github.io/)，蓝振忠；

深圳大学：潘微科；

-------------------------------其他--港澳台地区高校---------------------------------------

香港中文大学：汤晓鸥，王晓刚，林达华，周博磊，林伟（Wai Lam），黄锦辉（WONG Kam Fai)，LYU Rung Tsong Michael（吕荣聪）， KING Kuo Chin Irwin（金国庆），贾佳亚，陶宇飞，程鸿，于旭， James Cheng（郑尚策）

香港科技大学：宋阳秋，杨强，杨瓞仁 (Dit-Yan Yeung) ，张潼，陈雷，罗琼，陈启峰

香港大学：罗平，王文平

香港城市大学：张青富，周志贤（CHOW, Chi Yin Ted），王诗淇，杨禹

香港理工大学：陆勤，吴晓敏，[李文捷](https://www4.comp.polyu.edu.hk/~cswjli/)，[李菁](https://www4.comp.polyu.edu.hk/~jing1li/)

香港浸会大学：Pong C Yuen (阮邦志)，CHEUNG, William Kwok Wai（张国威），陈黎，马晶

澳门大学：黄辉，陈俊龙，巩志国

（台湾地区：待补充）

欢迎各位众筹贡献答案（学术强，人品好的导师），造福保研考研学子……`,
	},
	{
		DisplayName:       `勤劳的蜗牛dd`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 科研二三事`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：科研二三事。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 科研二三事
---

TODO：什么是科研如何看待；Phd；如何找课题组；如何打基础；发论文的流程；科研的技巧；科研的常见思路；Taste 以及取舍；推荐的教程；

参考来源：https://www.zhihu.com/question/665070041/answer/3608548975
### 计算机科研

首先需要把“进实验室”和“做科研”两个概念区分开来。绝大部分人本科阶段进实验室是在进行“科研实习”，这和自己主导的科研可以说毫不相干。

**科研实习的内容**

1. **基础知识学习。** 没错，你的同学进实验室实习一样要先打基础，只不过他们学习的基础知识和你相比很可能更“专”，更符合这个实验室研究方向的具体需求。
实验室一般会根据需求为实习生选定教材或lab，有针对性地让他们掌握日后需要的基础知识。
2. **参与科研项目。** 基础打牢后，实习生会被安排参与到某位老师或资深博士的项目中，在实践中对“科研是什么”形成一个大概的概念。这个阶段在我看来也算不上“做科研”，
因为这个项目从立项到规划设计再到论文都是不需要尚未形成科研能力的实习生参与的，实习生一般只会参与工程部分。<br>

提前进行科研实习的同学学到的基础知识不会像题主这样全面，但却足以让ta参与某个领域的科研工作。如果后续要读学硕或者直博，在实验室呆过两年的ta
很可能会拥有远超题主的科研经验积累，让ta可以无缝过渡到由自己主导科研的模式。因此，**对于毕业后目标是学术研究的同学而言，尽早进入一个优秀的实验室实习是一种更优的策略**。


对于“把整个本科用来打好专业基础”的做法是完全无法苟同的，说两点自己的见解，仅供参考：
1. “打好专业基础”是个虚无缥缈，无法量化的概念。CS领域博大精深，如果你愿意，你可以花十年在打基础上。不如反思一下打基础的目的是什么？你所学习的基础知识是否是你的目标所必需的？没有明确的目标，为了打基础而打基础只是高级的浪费时间罢了。
2. 抱持着“整个本科都要打基础”的观念就是在主动扼杀自己其他的可能性，这会降低自身的工作效率。“反正本科期间是要打基础，是不是我只要专心学习，别的啥也不用管了？”个人认为这是思维上的偷懒、做题家的思路、缺乏对自身规划的表现。<br>
最后作为CS科研人给题主一点建议：**纸上得来终觉浅，绝知此事要躬行。**想靠几本教材就把计算机科学的一个领域“吃透学精”是绝无可能的事。不要用学文科或数学的思路来学习一门工程科学。如果题主真的想打好基础，做lab比啃大部头更重要。`,
	},
	{
		DisplayName:       `活泼的花生`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 2017年`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：2017年。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 2017年保研总结贴
---

- @[奋斗的小鸟lcy](https://www.jianshu.com/u/0fffd87a3234)的[计算机专业暑期夏令营之行总结](https://www.jianshu.com/p/9fe83bc6f679)
- @[西电王小熊](https://www.jianshu.com/u/94429f1c4f53)的[[读研]王小熊的推免面试经历](https://www.jianshu.com/p/d265069f2417)
- @[WonderSeven](http://my.csdn.net/Touch_Thesky)的[个人保研经历以及经验分享](http://blog.csdn.net/touch_thesky/article/details/78126878)
- @[sunrise的博客](http://blog.csdn.net/qq_25201379)的[保研经历-从信工所-国防科大-上交-最后确定复旦（信息安全专业）](http://blog.csdn.net/qq_25201379/article/details/78178697)
- [本科四非保研到了北大信科学硕](https://www.zhihu.com/question/34582860/answer/245950683)
- [所有结局在努力面前都不成敬意](http://www.360doc.com/content/17/1007/20/27477386_693026687.shtml)
- @[gtcer](http://www.360doc.com/userhome/27525068)的[2018届研究生招生暑期夏令营经历分享——guochengtao](http://www.360doc.com/content/17/1101/14/27525068_700005388.shtml)
- @[Dracula](http://dracula.tech/)的[保研经验分享](http://dracula.tech/?p=269)`,
	},
	{
		DisplayName:       `俏皮的海星`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 2018年`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：2018年。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 2018年保研总结贴
---

- @[Johnny的博客](https://sweetice.github.io/)的[佛系保研：电气工程跨保AI](https://sweetice.github.io/2018/10/03/%E4%BD%9B%E7%B3%BB%E4%BF%9D%E7%A0%94-%E7%94%B5%E6%B0%94%E5%B7%A5%E7%A8%8B%E8%B7%A8%E4%BF%9DAI/)
- @[TINA](https://www.zhihu.com/people/tina-67-56)的[2018保研心得体会](https://zhuanlan.zhihu.com/p/45818580)
- @[孙笑川](https://weibo.com/currycode)的[低价值保研经验](https://mp.weixin.qq.com/s?__biz=MzI4NjU0ODQ1Ng==&mid=2247484202&idx=1&sn=c7ee699b9c16acc835ed6846fefddbad)
- @[基本法](https://cp-here.github.io/)的[保研呐就都不知道，自己就不可以预料](https://www.jianshu.com/p/2228d7464d99)
- @[Smlight](https://github.com/Smlight)的[保研经历](https://smlight.github.io/blog/2018/10/12/block2/)
- @[mengwuyaaa](https://blog.csdn.net/mengwuyaaa)的[清华北大计算所自动化所计算机夏令营详细攻略](https://blog.csdn.net/mengwuyaaa/article/details/82918032)
- @[Zarper](https://oncemath.com)的[保研推免经验分享 - 数学系跨保 CS](https://oncemath.com/share/my-postgraduate-share/) 
- @[lhw](https://www.zhihu.com/people/lhw-55/posts)的[211物联网工程保研中国科学技术大学cs自然语言处理方向](https://zhuanlan.zhihu.com/p/60553247)
- @[菜得抠脚](https://github.com/taogelose)的[某菜在北航、中科院、南开的计算机视觉(CV)方向保研经历](https://blog.csdn.net/Taogewins/article/details/89087610)`,
	},
	{
		DisplayName:       `芒果珍珠`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 2019年`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：2019年。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 2019年保研总结贴
---

- @[一岸流年](https://blog.csdn.net/qq_41997479)的[2019北理计算机，北航计算机夏令营，中科院霸面保研经验](https://blog.csdn.net/qq_41997479/article/details/95599816)
- @[Quentin Lee](https://www.zhihu.com/people/li-qing-quan-65/activities)的[我的计算机保研流水账（2020届）](https://zhuanlan.zhihu.com/p/78585742)
- @[Y.Shu](https://www.zhihu.com/people/dai-tu-zhe/activities)的[2019计算机保研经历：清华计算机·清华软院·清华深研院·南大计算机·浙大计算机等](https://zhuanlan.zhihu.com/p/88537420)
- @[Johnson](https://blog.csdn.net/m0_38055352)的[【2019保研经验】清华贵系、清华软院、北大叉院、中科院自动化所等](https://blog.csdn.net/m0_38055352/article/details/102887818)
- @[宫·商](https://blog.csdn.net/qq_38633884)的[2019上交、上科、北航、中科大、自动化所计算机夏令营+浙大计算机预推免简记](https://blog.csdn.net/qq_38633884/article/details/97178586)
- @[圈圈](https://www.zhihu.com/people/li-quan-quan-24)的[2020年保研经历](https://blog.csdn.net/qq_40742077/article/details/109064266)
- @[Ji Peng](https://www.zhihu.com/people/jipeng-48)的[2020年“工理经管”四大门类保研夏令营混申回忆录（清深、TBSI、计算所、上交电院、北大汇丰等十余个项目）](https://zhuanlan.zhihu.com/p/358182473)`,
	},
	{
		DisplayName:       `奶酪9`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 2020年`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：2020年。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 2020年保研总结贴
---

- @[墨云沧](https://www.zhihu.com/people/niraliye)的[2020计算机专业保研经验贴](https://zhuanlan.zhihu.com/p/267009034)
- @[KID22](https://www.zhihu.com/people/kid-22-32-56)的[计算机保研](https://www.zhihu.com/column/c_1293286348367900672)
- @[猪儿虫的小仓库](https://www.zhihu.com/people/arong-75-6/posts)的[计算机保研经验帖 清华·北大·上交·复旦·南大](https://zhuanlan.zhihu.com/p/260002988)
- @[William](https://blog.csdn.net/qq_43413123)的[2020计算机保研经历](https://blog.csdn.net/qq_43413123/article/details/109094823)
- @[50Hum](https://www.zhihu.com/people/wu-dong-52-28-61)的[2020计算机保研经历](https://zhuanlan.zhihu.com/p/266527061)
- @[Lemon Qin](https://lemon-412.github.io/)的[夏令营预推免经历小结](https://lemon-412.github.io/2020/10/05/%E5%A4%8F%E4%BB%A4%E8%90%A5%E9%A2%84%E6%8E%A8%E5%85%8D%E7%BB%8F%E5%8E%86%E5%B0%8F%E7%BB%93/#more)
- @[SinclairWang](https://www.zhihu.com/people/san-cun-jiu-cheng-qi-cun-zhi-nian-29)的[CS保研N问N答](https://zhuanlan.zhihu.com/p/263553192)
- @[弗兰肯斯坦358](https://www.zhihu.com/people/mark-10-30)的[保姆级保研教学--非大佬2020年计算机保研经验贴](https://zhuanlan.zhihu.com/p/262066989)
- @[Troyyyyyyyy](https://www.jianshu.com/u/d40238aabb31)的[2020计算机保研夏令营经历-南大、清华叉院、清华贵系...](https://www.jianshu.com/p/60dabdfe34c6)
- @[伶爵](https://www.zhihu.com/people/antman-46)的[2020计算机类保研经历回顾](https://zhuanlan.zhihu.com/p/157633072)
- @[njDDD](https://www.zhihu.com/people/xiao-qiao-2-10)的[2020计算机保研经历分享](https://zhuanlan.zhihu.com/p/266454924)
- @[飞天游侠](https://www.zhihu.com/people/zhihufellow)的[2020计算机类保研经历回顾](https://www.zhihu.com/question/403688470/answer/1472946787)
- @[sanshui](https://www.zhihu.com/people/bu-huo-98-22)的[2021计算机保研上岸经验贴 清华·上交·南大·浙大·北航·西交](https://zhuanlan.zhihu.com/p/266329661?utm_source=qq&utm_medium=social&utm_oi=742264367994650624)
- @[rershall](https://blog.csdn.net/qq_40742077)的[2020计算机类保研经历回顾](https://blog.csdn.net/qq_40742077/article/details/109064266)
- @[Maze Runner](https://mazerunner.gitee.io/)的[2020计算机保研夏令营--夏季过往](https://mazerunner.gitee.io/2020/09/30/2020%E8%AE%A1%E7%AE%97%E6%9C%BA%E4%BF%9D%E7%A0%94%E5%A4%8F%E4%BB%A4%E8%90%A5-%E5%A4%8F%E5%AD%A3%E8%BF%87%E5%BE%80/)
- @[Polo](https://polosec.gitee.io/)的[网络安全专业-夏令营/预推免面经](https://polosec.gitee.io/2020/10/12/%E9%9D%A2%E7%BB%8F/)
- @[羊男](https://www.zhihu.com/people/yang-nan-41-75/posts)的[中科院计算所｜上交软院ipads｜清华计算机系夏令营保研推免经历](https://zhuanlan.zhihu.com/p/263086696)
- @[Alive](https://www.zhihu.com/people/he-kling)的[2020计算机保研记(清华，北大，华五..）](https://zhuanlan.zhihu.com/p/266880789)
- @[TheTopMing](https://blog.csdn.net/TheTopMing)的[2020计算机保研之路：211上岸上海985](https://blog.csdn.net/TheTopMing/article/details/109169458)
- @[随处可见的打字员7952](https://blog.csdn.net/qq_40948559)的[【保研经验】来自一只five的一点经验（最终去向：西电广研院专硕）](https://blog.csdn.net/qq_40948559/article/details/109231550)
- @[sub_waer](https://blog.csdn.net/weixin_43722211)的[2021级计算机保研经历](https://blog.csdn.net/weixin_43722211/article/details/109035339)
- @[陈患者](https://www.zhihu.com/people/chen-huan-zhe-79)的[2021届-计算机类边缘人士保研总结](https://zhuanlan.zhihu.com/p/265095282)
- @[王森ouc](https://blog.csdn.net/weixin_43074474)的[2020保研夏令营——无科研无竞赛的夏令营之旅](https://blog.csdn.net/weixin_43074474/article/details/109122197)
- @[学分](https://www.zhihu.com/people/jiang-xue-feng-28-14)的[2020年保研申请到现在，你的情况怎么样呢？](https://www.zhihu.com/question/403757165/answer/1356233760)
- @[一辈闲](https://www.zhihu.com/people/yi-bei-xian-16)的[干货满满的2020计算机保研经验贴！（上交、北大等）](https://zhuanlan.zhihu.com/p/248489246)
- @[Annalovecoding](https://blog.csdn.net/Annalovecoding)的[2020计算机、信息安全保研记](https://blog.csdn.net/Annalovecoding/article/details/108896834)
- @[一程山路](https://www.zhihu.com/people/zhang-lei-54-11)的[2020年计算机方向夏令营保研经验分享（南大，北航，天大，南开）](https://zhuanlan.zhihu.com/p/266870455)
- @[ss-Z](https://www.zhihu.com/people/si-shu-zheng)的["日月星辰陪我走"-2021计算机保研记录/经验贴](https://zhuanlan.zhihu.com/p/268825353)
- @[b站今天有学习区了吗](https://blog.csdn.net/weixin_43368559)的[【计算机推免】川大计算机夏令营—华南理工软件预推免—华科计算机预推免（2020.10）](https://blog.csdn.net/weixin_43368559)
- @[蓝色树獭](https://www.zhihu.com/people/li-yichen-84-80)的[2020CS安全方向升学小计 保研夏令营｜港校early admission](https://zhuanlan.zhihu.com/p/267499551)
- @[lfysec](https://lfysec.top/)的[2020CS保研笔记 & 艰难2020总结](https://lfysec.top/2020/10/12/2020CS%E4%BF%9D%E7%A0%94%E7%AC%94%E8%AE%B0/)
- @[Ji Peng](https://www.zhihu.com/people/jipeng-48)的[2020年“工理经管”四大门类保研夏令营混申回忆录（清深、TBSI、计算所、上交电院、北大汇丰等十余个项目）](https://zhuanlan.zhihu.com/p/358182473)
- @[Rogers博](https://www.zhihu.com/people/lan-feng-shui-men)的[适合对于技术不自信，但想冲击top学校的同学，尝试了很多旁门左道的“宝藏”项目（清华深圳，南大工程管理，中科大苏州，浙大求是研究院，武大信息管理等）](https://www.zhihu.com/question/296432111/answer/2276905797)`,
	},
	{
		DisplayName:       `可颂麻雀`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 2021年`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：2021年。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 2021年保研总结贴
---

* @[阿尔法杨XDU](https://www.zhihu.com/people/mu-yi-yang-42-66)的[2021年人工智能保研经历(xduee->njuai)](https://zhuanlan.zhihu.com/p/420184627)
* @[Girapath](https://www.zhihu.com/people/shuo-xiao-ming-ren-31)的[2021年计算机保研经验分享（复旦、哈深、浙大、南大、北大软微）](https://zhuanlan.zhihu.com/p/414650183?utm_source=qq&utm_medium=social&utm_oi=844322[电话已隐藏]0)
* @[lhchen](https://www.zhihu.com/people/hao-55-16)的[2021CS保研经验（清北复交浙、南大、人大）](https://lhchen.top/exp-baoyan/)
* @[BoJack](https://www.zhihu.com/people/ma-zi-yang-76-38/)的[2021年（22届）计算机保研经历](https://zhuanlan.zhihu.com/p/393614897)
* @[PTYin](https://www.zhihu.com/people/peter-94-80)的[2021计算机保研经验分享：清华软件、南大、哈工大、哈工深](https://zhuanlan.zhihu.com/p/418347688)
* @[Charfole](https://blog.charfole.top/)的[2021年（22届）计算机保研面试经验与建议（复旦、北航、中山、浙大工程师、华东师、华工等院校）](https://zhuanlan.zhihu.com/p/421697204)
* @[南孚先生](https://www.zhihu.com/people/marco-ting)的[2021年计算机保研（清深、南大AI、中科大、哈深、中山等）](https://zhuanlan.zhihu.com/p/416191365)
* @[英枭昊](https://blog.csdn.net/all23333333)的[抒情向2021保研经历(整个大三)：浙大软院人工智能面试第一，复试第二，去向宋明黎老师VIPA课题组](https://blog.csdn.net/all23333333/article/details/120533168)
* @[Hartley](https://www.zhihu.com/people/qie-fu-yao)的[2021四非计算机保研经历](https://zhuanlan.zhihu.com/p/413940434)
* @[AYun](https://www.zhihu.com/people/zhu-yin-lang-pie)的[2021年计算机专业保研经历分享（复旦、浙大、上科大）](https://zhuanlan.zhihu.com/p/413778973)
* @[小青蛙](https://www.zhihu.com/people/xiao-qing-wa-52-54)的[四非学校，计算机保研上岸华5梦校南京大学!](https://zhuanlan.zhihu.com/p/417115393)
* @[SandyXi](https://sandyxi.gitee.io/)的[2021夏——保研夏令营](https://sandyxi.gitee.io/2021/10/05/2021夏——保研夏令营/)
* @[枫楠Kuiy](https://blog.csdn.net/weixin_43968093/article/details/120484114?spm=1001.2014.3001.5501)的[2021计算机保研经历](https://blog.csdn.net/weixin_43968093/article/details/120484114?spm=1001.2014.3001.5501)
* @[JamisonZ](https://www.zhihu.com/people/zh666-15-15)的[2021计算机保研(双非)网安向](https://zhuanlan.zhihu.com/p/415894198)
* @[一只眠羊](https://www.zhihu.com/people/yi-nan-ping-53-73)的[2021计算机保研经历——南开、厦大、哈工大威海、华师、浙大、北航](https://zhuanlan.zhihu.com/p/419866142) 
* @[清风酒醉](https://www.zhihu.com/people/qing-feng-jiu-zui)的[2021计算机保研](https://zhuanlan.zhihu.com/p/417233047)
* @[wyypersist](https://www.zhihu.com/people/the-wang-15)的[2021保研经历分享-感谢过去三年的自己和亲友的支持和帮助](https://zhuanlan.zhihu.com/p/415666100)
* @[康康](https://www.zhihu.com/people/kang-kang-89-49-32)的[2021年计算机保研经验贴，100天保研大战，纯rk选手，挂到怀疑人生，最终上岸清华深圳计算机专硕](https://zhuanlan.zhihu.com/p/412369681)
* @[白夜](https://www.zhihu.com/people/clcg-20/)的[2021年计算机保研经历：末九10%的挣扎之路【武大、同济、西交、天大、国防科大、南开、东南】](https://zhuanlan.zhihu.com/p/414385443)
* @[Nayuta](https://www.zhihu.com/people/he-bi-zai-yi-42-25)的[2021计算机保研（一只菜狗的起起伏伏之路）——lamda 上交 计算所 北大信科 清深CS](https://zhuanlan.zhihu.com/p/411525078)
* @[CCWUCMCTS](https://www.zhihu.com/people/wang-cheng-chun-18)的[信息之海中的缘分试探——信安保研从211到双非（终）](https://zhuanlan.zhihu.com/p/394450172)
* @[白日梦](https://www.zhihu.com/people/bai-ri-meng-36-57)的[2021计算机菜批保研经历（软件所，中山，交软，南大CS，浙大CS，清软，北大软微等）](https://zhuanlan.zhihu.com/p/416408279?utm_source=qq&utm_medium=social&utm_oi=9223950[电话已隐藏])
* @[根号二十一](https://www.zhihu.com/people/liang-liang-yu-42)的[2022推免计算机（信安/网络空间安全） 人大信院、信工所国重、西安交大网安、北邮计算机、天大网安、中科大网安、北大软微、南大计院](https://zhuanlan.zhihu.com/p/415726099)
* @[孤芳倚花红](https://www.zhihu.com/people/gu-fang-yi-hua-hong/posts)的[2021年计算机保研-双非三无底层CSer的失败保研经历（武大/复旦/计算所/华科/同济/上交）](https://zhuanlan.zhihu.com/p/415074914)
* @[心兑](https://www.zhihu.com/people/huang-chong-ru-78)的[2021年半跨CS保研经历（已上岸pku）](https://zhuanlan.zhihu.com/p/377444777)
* @[randyzhang](https://www.zhihu.com/people/zhang-yifu-12)的[2021计算机软工保研记录（北大软微、南大、浙大、哈深、同济、华科、国防科大等）](https://zhuanlan.zhihu.com/p/420554709)
* @[Emanual20](https://github.com/Emanual20)的[2021年计算机保研经历回顾（人大信息、人大高瓴、自动化所、清深AI、复旦计算机）](https://zhuanlan.zhihu.com/p/416688010)
* @[xq别睡了](https://www.zhihu.com/people/yi-qia-luo-si-37-43)的[2021计算机 低rk保研经历（上岸pku信科）](https://zhuanlan.zhihu.com/p/394968781)
* @[轻言](https://www.zhihu.com/people/qing-yan-31-63)的[如何评价2021年保研夏令营及预推免形势？的回答](https://www.zhihu.com/question/469350209/answer/2015872572)
* @[CH-2](https://www.zhihu.com/people/ying-huo-zhi-sen-47-98)的[2021计算机保研夏令营、预推免记录（含PKU、THU、NJU、USTC、WHU、XJTU、NSSC等）](https://zhuanlan.zhihu.com/p/392522446)
* @匿名用户的[如何评价2021年保研夏令营及预推免形势？](https://www.zhihu.com/question/469350209/answer/2148579686)
* @[Cyril_KI](https://blog.csdn.net/Cyril_KI)的[CS保研记录（211 rk2，北邮计算机学院、天津大学智算学部、山东大学计算机学院、北师大AI、西电计算机科学与技术学院）](https://blog.csdn.net/cyril_ki/category_11417649.html)
* @[Sumsky21](https://sumsky.top/)的[关于保研的ABC（3）个人经历与体会](https://sumsky.top/2021/11/18/baoyan-series-3/)
* @[王任之](https://www.zhihu.com/people/teng-yi-xiao-23)的[2021计算机保研经验（北航、南大、浙大、同济）](https://zhuanlan.zhihu.com/p/433849235)
* @[Funforever](https://www.cnblogs.com/jacobfun/)的[2021某不知名211rank9%软工保研&某网约车大厂实习经验分享（就业向）](https://www.cnblogs.com/jacobfun/p/15758050.html)
* @[rookie](https://www.zhihu.com/people/qu-tang-xia-63)的[2021计算机保研|中九低rk普通人|北大 上交cs 复旦大数据&cs 面经、总结以及复习建议](https://zhuanlan.zhihu.com/p/415573882)
* @[dragon_bra](https://www.zhihu.com/people/chi-yue-dian)的[2021厦门大学CS保研经历 | 夏令营游记 | MAC实验室](https://zhuanlan.zhihu.com/p/426136401)
* @[方知](https://www.zhihu.com/people/piao-lin-66-27)的[2021保研夏令营经验贴](https://zhuanlan.zhihu.com/p/470421627)
* @[libcso6](https://www.zhihu.com/people/glibc)的[【OUC保研NO.56】To复旦：保研边缘，感觉寄了？那就开摆！](https://mp.weixin.qq.com/s?__biz=MzU2MTcxMzI4NQ==&mid=2247486042&idx=1&sn=9079d5068dbbf15f75fc7819cb4e78b7&chksm=fc75d3b0cb025aa682e459531205965e18cd7c180cccfb12ddfd30046f54dbc9adf77b2b3b1b&mpshare=1&scene=22&srcid=0314FIJCHvhVJqbwti2CVvmu&sharer_sharetime=[电话已隐藏]62&sharer_shareid=dd1ce66b3ff97b74ecc83dbb60e9b8d3%23rd)`,
	},
	{
		DisplayName:       `认真的棉花糖`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 2022年`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：2022年。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 2022年保研总结贴
---

* @[浮槎](https://www.zhihu.com/people/yifanyeung)的[2022年计算机保研经验贴（清华叉院、清华贵系、北大计算机、北大智能、上交电院计算机、复旦计算机）](https://zhuanlan.zhihu.com/p/573038839?)
* @[摸鱼ing](https://www.zhihu.com/people/tu-tu-83-41-10)的[2022年（2023届）计算机保研——清华自动化、北大计算机、计算所vipl、南开cmm、南大计算机、人大信息等，附保研常见问题解答、清北华五院系分析](https://zhuanlan.zhihu.com/p/572166269)
* @[一口鸟](https://www.zhihu.com/people/yikou-niao-93)的[2022年北京某985计算机保研经历分享（清华、上交、中科院等）](https://zhuanlan.zhihu.com/p/569829982)
* @[比尔](https://www.zhihu.com/people/bi-er-83-39/posts)的[2022年（2023届）计算机保研——计算所vipl、南大lamda、北大计算机、人大高瓴等](https://zhuanlan.zhihu.com/p/570001872)
* @[Runder](https://www.zhihu.com/people/shi-shi-kan-25-20)的[2022年计算机保研经验————985实验班低rk](https://zhuanlan.zhihu.com/p/568008449)
* @[StellarDragon](https://www.zhihu.com/people/stellardragon-43)的[2022南京大学人工智能学院本科生开放日小记【保研向】](https://zhuanlan.zhihu.com/p/543677717)
* @[一叶风](https://www.zhihu.com/people/li-ba-shan-xi-qi-gai-shi-27-53)的[四非菜菜的惨淡CS保研经历（2022年）](https://zhuanlan.zhihu.com/p/570509998)
* @[Pluto](https://www.zhihu.com/people/jue-chen-67-88)的[计算机保研，maybe this is all you need（普通双非学子上岸浙大工程师学院数据科学项目）](https://zhuanlan.zhihu.com/p/571961780)
* @[timeErrors](https://www.zhihu.com/people/guo-ke-82-96-72)的[2022年（就业向）计算机保研日寄（从4月至10月共计27篇）—— 南大软件，复旦计科，浙大工程师，人大信院，北航CS，华科CS，西交SE，中山SE等](https://www.zhihu.com/column/c_[电话已隐藏]84813568)
* @[有病吃曜](https://www.zhihu.com/people/mu-yue-ban-xian-sheng)的[23届（2022年）CS推免回忆总结](https://zhuanlan.zhihu.com/p/569393809)
* @[王政霖LIN](https://blog.csdn.net/weixin_45781381?type=blog)的[【经验篇】2022年（2023届）我的保研经历](https://blog.csdn.net/weixin_45781381/article/details/127144804?spm=1001.2014.3001.5501)
* @[张北北](https://tzq0301.cn/)的[2022 年计算机保研经历｜Rank 中游、无一作、竞赛少、无实习、无优质项目的中游选手｜天大云计算、南大软件所、中南计算机、中山计算机、中山软件、川大计算机](https://zhuanlan.zhihu.com/p/502719456)
* @[张北北](https://tzq0301.cn/)的[CS/SE 保研经验分享](https://zhuanlan.zhihu.com/p/617415742)
* @[Hwcoder](https://hwcoder.top/)的[2022中九CS保研回忆录（复旦CS/人大高瓴/北大软微/科大/清华软院...）](https://zhuanlan.zhihu.com/p/569487445)
* @[花降](https://www.zhihu.com/people/li-jun-ting-45-88)的[2022年（23届）计算机保研边缘人面试经验及建议（无清北华五，大佬退散）](https://zhuanlan.zhihu.com/p/569065405)
* @[栖风破雨](https://www.zhihu.com/people/qi-feng-po-yu)的[2022年大数据保研经验贴（北大叉院、南大AI院、哈工大SCIR实验室、SIAT数字所）](https://zhuanlan.zhihu.com/p/573474044)
* @[无与](https://www.zhihu.com/people/wu-yi-jian-64)的[2022年计算机保研经历（清华软院、复旦CS、人大高瓴、南大CS等）](https://zhuanlan.zhihu.com/p/573141762)
* @[Alkali！](https://blog.csdn.net/weixin_45798993?type=blog)的[2022保研经验贴：华南理工大学计算机科学与工程学院 、东南大学计算机科学与工程学院等](https://blog.csdn.net/weixin_45798993/article/details/127155636)
* @[等风来不如追风去](https://www.zhihu.com/people/shang-li-xin-85)的[2022年保研经验网安&华五&武大中山等](https://zhuanlan.zhihu.com/p/573404307)
* @[相约相守到天边](https://blog.csdn.net/m0_47262980?type=blog)的[2022年计算机保研记录（计算所、浙大、华科、东南、北航）](https://blog.csdn.net/m0_47262980/article/details/127122358)
* @[xx学渣](https://www.zhihu.com/people/xxxue-zha)的[2022年计算机保研夏令营/预推免经验分享（清北华五人）](https://zhuanlan.zhihu.com/p/559444934)
* @[Someity](https://www.zhihu.com/people/aegsteh)的[2022计算机保研经验（清华深圳计算机、清华网研院、南京大学等）](https://zhuanlan.zhihu.com/p/569722841)
* @[lori-G](https://www.zhihu.com/people/di-1104)的[2022年计算机保研经验贴（南软、浙软、中科大苏高院、北航计算机、国防科大计算机、北邮计算机、上科大生医工、西工大计算机、南开软、吉大人工智能、中南计算机、软件所计科国重等）](https://zhuanlan.zhihu.com/p/570763361)
* @[红莲的弓矢](https://www.zhihu.com/people/ma-si-te-er-pi-si)[2022年（2023届）三无底层选手（低rank，无科研，无竞赛）计算机保研记录（南大，浙大uiuc，哈工大深圳，西交se，北师大ai、认知神经科学国重，中山se，哈工大计算学部）](https://zhuanlan.zhihu.com/p/562764736)
* @[Ever洋葱头](https://www.zhihu.com/people/ever-21-4)的[2022年（23届）保研：末九计算机边缘人的挣扎捡漏之路（夏令营+预推免终上岸华五专硕）](https://zhuanlan.zhihu.com/p/568980903)
* @[insere](https://www.zhihu.com/people/p2018f31)的[2022计算机保研经历（上交软、计算所、清软、北大计算机）](https://zhuanlan.zhihu.com/p/570376340)
* @[B4a](https://guoch.xyz)的[SWJTUer的艰难CS保研之路：从夏0营到郁推免到捡漏上岸 | 失败的反例，夏0营、郁推免、开系统前一天被鸽、捡漏，大家引以为戒](https://guoch.xyz/2022/10/13/baoyan/)
* @[Filbert](https://www.zhihu.com/people/filbert-9)的[22年计算机夏令营保研回顾-普2跨保交叉试水选手（吉林AI，华师大数据，北师AI，南大软件，人大公管，中科大科学岛）](https://zhuanlan.zhihu.com/p/560353517)、[22年-19级计算机保研形势分析（含本校情况统计）](https://zhuanlan.zhihu.com/p/570611960)
* @[Harris-H](https://www.zhihu.com/people/hehaohe-hao)的[2022年双非计算机保研经历分享(浙大、北航、中科院等)](https://zhuanlan.zhihu.com/p/573707010)
* @[Welt](https://welts.xyz/)的[南大人工智能学院开放日面试题](https://zhuanlan.zhihu.com/p/559558628)
* @[仰望歆空](https://www.zhihu.com/people/yang-wang-xin-kong-72)的[2022年(23届)计算机保研经验分享(北航、东南、西工大、哈工大、中山等)](https://zhuanlan.zhihu.com/p/570714265)
* @[维克多](https://www.zhihu.com/people/ling-tian-32-35)的[保研夏令营及预推免总结|南大，中科大，北邮，北航，计算所，软件所中文等](https://zhuanlan.zhihu.com/p/568009914)
* @[New_Bee777](https://blog.csdn.net/qq_50764810?type=blog)的[2022计算机保研边缘人的挣扎之路（东南、武大、国防科大、信工所、川大、西交，天大佐治亚、央音、东北大、电科深、西工大、山大）](https://blog.csdn.net/qq_50764810/article/details/127028093)
* @[csfrogy](https://www.zhihu.com/people/ou-er-yao-la-zha-29)的[2022计算机保研/申请记录（港三/清北/华五人/计算所）](https://zhuanlan.zhihu.com/p/569696962)
* @[海螺](https://www.starryfk.com/)的[记录我的2022年四非保研之rk边缘人无六级鸽浙大上岸华师软院学硕](https://www.starryfk.com/else/record-my-2023-postgradute-recommendation.html)
* @[MathsCode](https://www.zhihu.com/people/xu-jia-ming-29-41)的[2022年CS保研经验分享（清深、上交、南大LAMDA、同济、东南Palm等）](https://zhuanlan.zhihu.com/p/570722079)
* @[TanyUJS](https://www.zhihu.com/people/dong-yi-chen-64)的[2022年，四非计科学生的保研大局观复盘经验贴](https://zhuanlan.zhihu.com/p/569445562)
* @[时光如流](https://www.zhihu.com/people/shi-jian-de-he-73)的[双非计算机保研上岸南邮、苏大、中南、浙软、厦大经验贴](https://zhuanlan.zhihu.com/p/569715955)
* @[hxzzzz](https://www.zhihu.com/people/hao-xiang-zhao)的[2022年（2023届）计算机保研经验（非常规保研，中科大、北大计算机，自动化所）](https://zhuanlan.zhihu.com/p/571277772)
* @[勃学家](https://www.zhihu.com/people/shi-fei-du-shi-xiang-dui-de)的[2022年菜鸡ACMer计算机保研经验贴（2023届，人大信院，北航等）](https://zhuanlan.zhihu.com/p/572461932)
* @[javayuan](http://javayuan.cn)的[2022年西北工业大学网安学院大菜鸡的保研之旅](http://javayuan.cn/index.php/archives/31/)
* @[匿名用户](https://www.zhihu.com/people/qian-2333-25)的[2022低rk 保研套磁经历](https://zhuanlan.zhihu.com/p/577423871)
* @[Here_SDUT](https://fangkaipeng.com/)的[保研经验分享（双非计算机上岸成电） – Here_SDUT](https://fangkaipeng.com/?p=2103)
* @[非天](https://www.zhihu.com/people/wen-guang-40/answers)的[2022年北京中游211计算机（DS）保研经验（2023届）（人大信院、浙大网安、协和医院）](https://zhuanlan.zhihu.com/p/576299033)
* @[湘粤Ian](https://blog.csdn.net/IanYue?type=blog)的[【跨保985计算机】2022跨保实录|六千字保姆教程](https://blog.csdn.net/IanYue/article/details/127076919?spm=1001.2014.3001.5501)
* @[小梁说代码](https://liangyuanshao.blog.csdn.net/?type=blog)的[2022年计算机保研夏令营经验总结，11所院校经历，预推免上岸北大](https://blog.csdn.net/qq_45722494/article/details/125954889)
* @[overflow](https://www.zhihu.com/people/zhong-ren-48-39)的[2023届四非第一跨专业上岸华五软工（科大先研软件、南大软件_替补中偏上、中科院软件所、南开软件、浙大工程师替补、厦大人工智能、山大软件、东南网安_替补中偏上）](https://zhuanlan.zhihu.com/p/581205619)
* @[莱昂纳多七世](https://www.zhihu.com/people/yi-qiao-98-91)的[2022年四非计算机保研之旅（信工所、软件所、计算所、南大、国防科大、北师大、北工大等）](https://zhuanlan.zhihu.com/p/575140597)
* @[whisper](https://www.zhihu.com/people/whisper-56-23)的[2022年计算机保研经历分享](https://zhuanlan.zhihu.com/p/583086125?)
* @[ksuD](https://www.zhihu.com/people/wang-chang-93-26)的[2022年（23届）计算机保研经验贴（清深、浙大、中科大、复旦、南大、人大高瓴等）-末流211“三无”选手-（无title无rk无paper）曲曲折折的推免之路](https://zhuanlan.zhihu.com/p/578838468)
* @[Stephen.ki](https://www.zhihu.com/people/mou-yu-qi-87)的[2022年计算机保研经验贴（双非DS->同济CS）](https://zhuanlan.zhihu.com/p/584854212)
* @[月亮在偷看吖](https://www.zhihu.com/people/zhong-xia-wei-mang)的[2023届计算机保研（北大华五两所）](https://zhuanlan.zhihu.com/p/578775674)
* @[啦啦啦](https://www.zhihu.com/people/wan-feng-yu-gui-49)的[2022计算机保研经验分享（清深伯克利tbsi+北深）](https://zhuanlan.zhihu.com/p/596883087)
* @[反过来想](https://www.zhihu.com/people/111-88-16-78)的[2023-计算机保研经历-南大lamda 中科大 北航 山大](https://zhuanlan.zhihu.com/p/569478861)
* @[陆壹zero](https://www.zhihu.com/people/jin-shu-zhi-guo-wang)的[2022计算机保研经验贴|厦门大学MAC实验室&浙江大学软件学院|线下夏令营|名场面竟是我自己](https://zhuanlan.zhihu.com/p/570092284)
* @[白白阿桑](https://www.zhihu.com/people/do-today)的[2022年（2023届）计算机保研经验（北大工学院、清深TBSI、自动化所、计算所、港中文、上交、复旦、南大、北航等）](https://zhuanlan.zhihu.com/p/624744728)`,
	},
	{
		DisplayName:       `太妃糖刷题中`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 2023年`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：2023年。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 2023年保研总结贴
---

* @[Zhikang](https://www.zhihu.com/people/obeah-82)的[2023年(2024届)CS保研经验分享/材料准备|上岸上交](https://zhuanlan.zhihu.com/p/678400450)
* @[Jason](https://www.zhihu.com/people/passerby-60-2)的[四非人的保研之路，2023（2024届）四非计算机的保研经验分享（中科院计算所、中科大先研院、厦大、西电等）](https://zhuanlan.zhihu.com/p/661018643?utm_psn=[电话已隐藏]43129088)
* @[murmure](https://www.zhihu.com/people/okczong-hui-ying-de)的[24届计算机保研经历记录 | ai边缘人 | 中科院、人大、pjlab等](https://zhuanlan.zhihu.com/p/661991030?utm_psn=[电话已隐藏]60267776)
* @[battleship](https://www.zhihu.com/people/battleship-55)的[2023年低rk无产出弱竞赛的跨保计算机经历（清华、人大信院、软件所、计算所、北航等）](https://zhuanlan.zhihu.com/p/659003582?utm_psn=[电话已隐藏]93938176)
* @[楚子航](https://www.zhihu.com/people/chu-zi-hang-46-14)的[2023计算机保研经验贴（流水账）](https://zhuanlan.zhihu.com/p/660396478)
* @[Leibnizzzzzz](https://www.zhihu.com/people/re-xin-wang-you-95-66)的[2024保研经验帖：统计跨保计算机（CS/Security，清华生统、上交计算机、南大计算机、中科院软件所等）](https://zhuanlan.zhihu.com/p/658314530?utm_psn=[电话已隐藏]65314817)
* @[热爱学习的憨憨](https://www.zhihu.com/people/re-ai-xue-xi-de-han-han)的[2024届（2023年）保研经历分享](https://zhuanlan.zhihu.com/p/659171614)
* @[扶苏~](https://www.zhihu.com/people/cai-dan-ren-cuo)的[2023年(2024级)保研经验分享(上交计算机，北大智能，南大AI等)](https://www.zhihu.com/question/537883625/answer/3117894338)
* @[三七](https://www.zhihu.com/people/18-13-17-16)的[2023(2024届)计算机保研——吉大，北航，西工大，浙软，计算所，东南，西交](https://zhuanlan.zhihu.com/p/659567441)
* @[caijianfeng](https://cai-jianfeng.github.io/)的[2023年（2024届）211人工智能养蛊班鼠鼠保研+预推免经验贴（科大6系、thusz ai、tbsi、pkusz），其实更像流水账](https://cai-jianfeng.github.io/posts/2023/09/blog-post-graduate-interview-experience/)
* @[GhostLX](https://www.zhihu.com/people/Myl520/posts)的[2023年（2024届）四非ACMer计算机保研经验贴｜全程0offer上岸北航｜（厦大信院、西电杭AI、北邮AI、华师CS、北航SE、电科深、吉大软院）|2万字超详细经验分析|ACMer必看保研思路](https://zhuanlan.zhihu.com/p/659991998)
* @[Sylvain](https://www.zhihu.com/people/yi-yang-12-56-12)的[2024届(2023年)计算机保研经验分享|万字经验望有用|清华TBSI,北大软微,人大高瓴,计算所,清华软院,北大cs,科大网安,清华自动化系,浙大cs](https://zhuanlan.zhihu.com/p/659078121)
* @[NorthSecond](https://blog.yfyang.me/)的[2024届保研流水账](https://blog.yfyang.me/blog/about-baoyan)
* @[雨似浮夸](https://www.zhihu.com/people/yu-si-fu-kua)的[2023年（2024届）计算机保研经验帖｜末2跨专业上岸东南大学PALM｜东南大学CS、北大信工CS、浙软SE、厦大MAC、北师大AI、电科CS……｜一篇非常详细的经验帖，希望能够对大家有帮助！](https://zhuanlan.zhihu.com/p/659869954)
* @[lllllThree](https://www.zhihu.com/people/lllll-64-58-95)的[2023年（2024届） 计算机保研经历 北航cs 武大cs 自动化所](https://zhuanlan.zhihu.com/p/631358931)
* @[柚鱼](https://www.zhihu.com/people/no-reason-84-41)的[2024届计算机双非菜鸟保研之旅](https://zhuanlan.zhihu.com/p/658674548)
* @[Lanker](https://www.zhihu.com/people/lanker-44)的[2024届计算机人工智能低rank保研经验](https://zhuanlan.zhihu.com/p/659105884)
* @[xhyu61](https://www.zhihu.com/people/Xhyukhalt)的[2023（2024届）计算机保研经验分享与思考：211→同济](https://zhuanlan.zhihu.com/p/659074805)
* @[Fischer](https://www.zhihu.com/people/alexander-18-39)的[2024届计算机跨保推免日寄（ruc信院，xmu信院，tju智算，软件所并行，华科国光/软院）](https://zhuanlan.zhihu.com/p/652601792)
* @[Joyce](https://www.zhihu.com/people/joyce-23-81-27)的[2023（2024届）计算机保研经验分享](https://zhuanlan.zhihu.com/p/659205860)
* @[邹鸿月](https://www.zhihu.com/people/Aromyase)的[2023（2024入学）计算机保研经验贴](https://zhuanlan.zhihu.com/p/659565414)
* @[大笨钟下送快递](https://www.zhihu.com/people/xi-en-39-14)的[2024届计算机保研经验分享(说是经验贴其实更像流水账😂)](https://zhuanlan.zhihu.com/p/659116946)
* @[second village](https://www.zhihu.com/people/ai-mo-mo-mo-mo-mo-mo)的[2024计算机保研-夏令营就结束吧！（清叉&贵&深 | 中科院自所 | 高瓴 | 港三 | 复交南）](https://zhuanlan.zhihu.com/p/643630647)
* @[梦过了尽头也不归](https://www.zhihu.com/people/95-30-74-28)的[2024届计算机保研经验分享](https://zhuanlan.zhihu.com/p/659572529)
* @[愤怒的小孩](https://www.zhihu.com/people/yi-zhou-65-80-99)的[2024计算机保研经验——末九三无选手的上岸路](https://zhuanlan.zhihu.com/p/659172609)
* @[weixin_53463856](https://blog.csdn.net/weixin_53463856?type=blog)的[2024届计算机保研经验贴（计算所，复旦，南大，哈工大，天大、西交等等）](https://blog.csdn.net/weixin_53463856/article/details/133412909)
* @[xhd0728](https://www.zhihu.com/people/xin123-30)的[2023（2024届）计算机保研经验分享](https://zhuanlan.zhihu.com/p/659052347)
* @[helloo](https://www.zhihu.com/people/hellooo-74)的[2024计算机（网安）保研经验分享](https://zhuanlan.zhihu.com/p/659213385)
* @[是Dream呀](https://juejin.cn/user/765678294413181/posts)的[2023（2024届）计算机保研经验分享，圆梦山东大学](https://juejin.cn/post/72844[电话已隐藏]645)
* @[好的](https://www.zhihu.com/people/hao-de-72-70-44)的[2023-2024计算机保研历程（网安）](https://zhuanlan.zhihu.com/p/659493955)
* @[三旬](https://www.zhihu.com/people/san-xun-98-97)的[2024届计算机保研经验贴](https://zhuanlan.zhihu.com/p/659460973)
* @[For1moc](https://www.zhihu.com/people/si-yu-85-41-4)的[2024届CTF/信安/网安方向计算机保研帖(末九=>复旦)](https://www.zhihu.com/question/537883625/answer/3232678535)
* @[hollow](https://blog.csdn.net/m0_51507437)的[2023（2024届）计算机保研经验分享（网安向）](https://blog.csdn.net/m0_51507437/article/details/133420369)
* @[妖魔鬼怪快离开](https://www.zhihu.com/people/pdqke0)的[2023年（2024届）计算机保研经验贴（浙软、同济软、哈工大计算学部）](https://zhuanlan.zhihu.com/p/658963182)
* @[Zero](https://www.zhihu.com/people/absolute-zero-51)的[2023年非典型性计算机保研经验贴——中科大信院、中山软院、川大计院](https://zhuanlan.zhihu.com/p/659043338)
* @[那个谁](https://github.com/tjujingzong)的[2023(2024届) 计算机/软工保研经验贴（天大佐治亚、中科大苏州、西交软院、浙大软院）](https://zhuanlan.zhihu.com/p/659120308)
* @[404NotFound](https://www.zhihu.com/people/404not-found-31-86)的[2023年计算机专业保研经验帖（北大计院、北大软微、同济电院、南大软件所等）](https://zhuanlan.zhihu.com/p/659303117)
* @[纯和高茎豌豆](https://www.zhihu.com/people/cryomaster)的[2023年计算机保研小记（南大AI、复旦CS）](https://zhuanlan.zhihu.com/p/659021845)
* @[lx_tyin](https://www.zhihu.com/people/tyin-84)的[24届计算机推免 四非0科研图形学菜狗的经验贴（北航vr、南开cs）](https://zhuanlan.zhihu.com/p/659054002)
* @[xieincz](https://xieincz.github.io)的[2023计算机0科研的保研边缘人的挣扎之路（哈深、中大、华南理工、山大）](https://xieincz.github.io/post/2023-ji-suan-ji-0-ke-yan-de-bao-yan-bian-yuan-ren-de-zheng-zha-zhi-lu-ha-shen-zhong-da-hua-nan-li-gong-shan-da/)
* @[颓废朱渣](https://www.zhihu.com/people/tui-fei-zhu-zha)的[2023（2024届）211计算机保研经验分享（中山计算机，北大计算机, 北大软微等）](https://www.zhihu.com/question/537883625/answer/3234428943)
* @[snowstorm](https://www.zhihu.com/people/8997-5)的[2023年（2024届）双非计算机保研经验贴（东南、成电、国防科大、浙软、湖大）](https://zhuanlan.zhihu.com/p/659109129)
* @[摸鱼小达人](https://zhuanlan.zhihu.com/p/659138038)的[（2024届）数学跨保计算机经历，上岸中科大信科直博（厦大MAC、中科大科学岛、中山鹏城、哈工大卓工苏州、浙大软院、天大智算）](https://zhuanlan.zhihu.com/p/659138038)
* @[收尾人VEM](https://zhuanlan.zhihu.com/p/658217289)的[2024计算机推免记录(xmu mac、seu palm、nku 强组、北深、nju se、同济se、hust cs、whu遥感)](https://zhuanlan.zhihu.com/p/658217289)
* @[神探香椿](https://www.zhihu.com/people/sirius-70-78)的[2023年（2024届）计算机保研总结（北大计算机，南大LAMDA，人大高瓴，中科大）](https://zhuanlan.zhihu.com/p/646649480)
* @[豪2021](https://www.zhihu.com/people/hao-2021-91)的[2023年（2024届）计算机保研回忆录（清华贵系/人大高瓴/自动化所/北大软微/上交电院/科大6系）](https://zhuanlan.zhihu.com/p/653744380)
* @[太美丽了吉大AI](https://www.zhihu.com/people/bei-tong-de-hai)的[2023年（2024届）计算机保研经验贴|末九低rank|就业向|厦大，哈工威，中山，清华工程硕](https://zhuanlan.zhihu.com/p/661343191)
* @[Phenophenes](https://www.zhihu.com/people/hughhh-3)的[2024届（2023年）计算机+跨保法学保研经验（同济、计算所、浙软等）](https://zhuanlan.zhihu.com/p/659515958)
* @[NamelessOIer](https://github.com/NamelessOIer)的[2023 计算机保研复盘（清华cs、北大cs、中科大cs、南大cs）](https://brazen-linseed-692.notion.site/2023-e4c9f5f8fd1f457293ea8465e5ab8d0f)
* @[Cocktail](https://www.zhihu.com/people/tu-lao-2-52)的[23(24届)计算机保研经验贴｜末2上岸华工｜西交软、电科CS、北理前沿院、华工CS、北师大AI、川大CS、大工CS、湖大CS、重大CS](https://zhuanlan.zhihu.com/p/661226536)
* @[棒棒爱吃糖](https://www.zhihu.com/people/wanegbt)的[2023年（24届）保研经验贴-武大CS，南大CS，东南CS，复旦CS，浙大工院数科](https://zhuanlan.zhihu.com/p/659072965)
* @[ARROW](https://www.zhihu.com/people/arrow-62-1)的[2023年（2024届）计算机保研总结（北航cs，北大cs，人大高瓴等）](https://zhuanlan.zhihu.com/p/661614834)
* @[ViperH](https://www.zhihu.com/people/qing-zhu-47-88)的[2023年（2024届）清北港三华五自动化/人工智能保研经历](https://zhuanlan.zhihu.com/p/644630686?utm_psn=[电话已隐藏]16403968)
* @[Cczz](https://www.zhihu.com/people/cczz-81-21)的[2023年24届劣势四非躺平摆烂保研反面经验贴（厦大 西北工业 西电杭）](https://zhuanlan.zhihu.com/p/659154144)
* @[Tim](https://www.zair.top/)的[2023年末流211大数据专业保研记录（吉软，高瓴，中南大数据，东南cs，计算所分布式，西交ai（人机所）等）](https://www.zair.top/post/baoyan)
* @[欹风](https://www.zhihu.com/people/yi-feng-32-29)的[2023年计算机保研心路历程(北大智能、北航cs、上海AIlab、清华软件等）](https://zhuanlan.zhihu.com/p/649676584)
* @[大能猫吃热千面](https://www.zhihu.com/people/wei-yi-43-99-52)的[2023年外校保研清华贵系经验](https://zhuanlan.zhihu.com/p/662602638)
* @[宅前一棵树](https://www.zhihu.com/people/zhai-qian-yi-ke-shu)的[2023年（2024届）计算机保研/升学实录（港中深数据科学、上交软、清软）](https://zhuanlan.zhihu.com/p/659320000)
* @[jwimd](https://jwimd.github.io/)的[24跨保CS经验贴（清华叉院，清华软院工博，浙大计院直博）](https://zhuanlan.zhihu.com/p/663081725)
* @[L-811](https://github.com/L-811)的[2023年中末流211计算机保研记录（自动化所、天大、南开、东南、北师大、厦大）](https://zhuanlan.zhihu.com/p/659208624)
* @[TrueStar02](https://github.com/TrueStar02)的[中九几乎0科研经验的保研经历分享](https://github.com/TrueStar02/baoyan_experience)
* @[凛夜序](https://www.zhihu.com/people/freezing-night-0)的[2023年(2024届)计算机保研夏令营记录（人大信院、中山计院等）](https://zhuanlan.zhihu.com/p/659777507)
* @[xhyu61](https://www.zhihu.com/people/Xhyukhalt)的[2023（2024届）计算机保研经验分享与思考：211→同济](https://zhuanlan.zhihu.com/p/659074805)
* @[xhd0728](https://resume.kokomi0728.eu.org)的[菜鸡2023（2024届）计算机保研经验分享](https://zhuanlan.zhihu.com/p/659052347)
* @[dddd](https://www.zhihu.com/people/qiu-zhi-ruo-ke-de-la-ji)的[普普通通三维的保研流水账 | 清深AI、人大高瓴、南大智科、中科大大数据等](https://zhuanlan.zhihu.com/p/659337046)
* **[保研三部曲-经验贴]** @[硝基苯](https://www.zhihu.com/people/dong-dong-dong-49-89-76)的[计算机推免经验帖 | 贵系、上交cs、中科大cs等](https://zhuanlan.zhihu.com/p/659027931)
* **[保研三部曲-保研vlog]** @[硝基苯](https://space.bilibili.com/500997516)的[2023年计算机类保研vlog](https://www.bilibili.com/video/BV1694y1E7WR)
* **[保研三部曲-与群友面基]** @[硝基苯](https://space.bilibili.com/500997516)的[推免结束，跟绿群群友在南京小聚](https://www.bilibili.com/video/BV1kh4y1q78t)
* @[SuburbiaXX](https://github.com/SuburbiaXX)的[2023年信息安全（网安）相对简单保研经验-夏令营上岸-浙大网安-上交网安-东南网安](https://suburbiaxx.fun/posts/1789e92c/)
* @[Jasonczh4](https://github.com/JasonCZH4)的[2023CS保研末二低RK经验贴【中大软|西交|湖大】](https://zhuanlan.zhihu.com/p/659090289)
* @[Tian Kun](https://www.zhihu.com/people/shi-shui-51-3)的[2023计算机保研经验分享（上交直博、pjlab、北航计算机、东南计算机、南大苏州）](https://zhuanlan.zhihu.com/p/669318794)
* @[2836](https://www.zhihu.com/people/zhen-mao-93)的[2024届计算机保研经验贴（武大、华科、北师大、南开、东南……上岸华科cs](https://zhuanlan.zhihu.com/p/659849122)
* @[__XLE](https://github.com/XLEprime)的[2023（2024届）计算机保研经验帖](https://zhuanlan.zhihu.com/p/681967727)
* @[Last](https://www.zhihu.com/people/last-19-28)的[2023年（2024届）计算机保研经验分享——复旦计算机、上交网安](https://zhuanlan.zhihu.com/p/682892693)
* @[yu-yake2002](https://github.com/yu-yake2002)的[2023年（2024届）all in 中科院计算所保研经历](https://www.zhihu.com/question/537883625/answer/3233131256)
* @[yao9e](https://github.com/yao9e)的[24届(2023年9月)计算机保研记录 | 211、低rank，无项目、竞赛、论文](https://yao9e.cn/2023/11/16/591162bfc467/)
* @[星空](https://www.zhihu.com/people/kong-bai-40-78-92)的[2023年(2024届)保研经验分享(非常规保研)|四非低rk无竞赛无科研|上岸北邮|清华、协和、中科大等](https://zhuanlan.zhihu.com/p/692328311)
* @[yyi](https://www.linkedin.com/in/%E7%84%B6-%E8%A1%A3-51968b2b1/)的[2023 年保研经验贴 [计算机-末九Rank50%-入北计清深-北计直博]](https://yirannn.com/beyond_tech/baoyan.html)
* @[梓喵](https://www.zhihu.com/people/oncecemic)的[2023计算机保研经历（清华、北大、南大、交大)](https://zhuanlan.zhihu.com/p/624340449)`,
	},
	{
		DisplayName:       `葡萄tt`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 2024年`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：2024年。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 2024年保研总结贴
---
* @[MCPlayer542](https://www.zhihu.com/people/mcplayer542)的[2024年(25届)计算机保研 中九+ACM金+微科研 非AI向 经验贴 \\[清叉/南大CS/贵系\\]](https://zhuanlan.zhihu.com/p/875837496)
* @[cii](https://www.zhihu.com/people/ciyi-72)的[2024年（25届）211人工智能保研记录（南大智科+东南palm+中山cs+中科大aids）](https://zhuanlan.zhihu.com/p/705008120)
* @[种一棵树](https://www.zhihu.com/people/jin-ci-4-52)的[25届（2024年）计算机保研回忆录（软微、武大CS、上交软院、科大网安、浙大CS、清软、复旦CS）](https://zhuanlan.zhihu.com/p/893479631)
* @[exm17](https://www.zhihu.com/people/ji-mo-ai-17)的[25届计算机保研纪实（NJU/SJTU/神仙院）随缘更新](https://zhuanlan.zhihu.com/p/710750941)
* @[Hubert](https://www.zhihu.com/people/qiu-niang-43-66)的[2024年（25届）计算机推免回忆录（南大CS、同济CS、东南CS、浙软、复旦CS、哈深-PCLab、CAS等）](https://zhuanlan.zhihu.com/p/920568634)
* @[子衿](https://www.zhihu.com/people/qiu-cong-to)的[2024年（2025届）计算机保研回忆录（pjlab、清软、清深、上交ai、复旦、计算所）](https://zhuanlan.zhihu.com/p/885256711)
* @[佑水岚](https://www.zhihu.com/people/yi-qing-nai)的[2024年 | 2025届计算机保研经验贴 | 末流211跨保上岸南京大学 | 南大软院、中科大苏州、北京通研院、成电电科院、北邮AI、北航cs、川大cs、北理工自动化 | 【第一篇详细的套磁说明】](https://zhuanlan.zhihu.com/p/770071908)
* @[游戏新手老高](https://www.zhihu.com/people/97-34-14-78-68)的[2024末二 夏rk5预推rk2 无专利无论文 保研北航CS 科普&amp;叙事向 2.8w字《保研记》](https://zhuanlan.zhihu.com/p/721669410)
* @[lhmd](https://www.zhihu.com/people/li-hun-meng-die)的[25届（2024年）计算机保研回忆录（北大深圳，北京通院，西湖大学，浙大，上交，南大）--华五低rank版](https://zhuanlan.zhihu.com/p/816993503)
* @[等柳成荫](https://www.zhihu.com/people/deng-liu-cheng-yin)的[2024年（25届）保研回忆录- 末2边缘人无六级版](https://zhuanlan.zhihu.com/p/791980186)
* @[Nelson](https://bosswnx.xyz)的[2024年(25届)计算机保研211+低rk+强竞赛+零科研经验分享(南大智软)](https://zhuanlan.zhihu.com/p/764039629)
* @[随1234便](https://www.zhihu.com/people/96b113ef41e7a88601debc45a636dfb6)的[全网唯一经管跨保计算机丨2024年(2025届)保研经验贴（上海ailab，中科大6系，计算所，南大lamda，中山计，浙软，同济）](https://zhuanlan.zhihu.com/p/709985313)
* @[随1234便](https://www.zhihu.com/people/96b113ef41e7a88601debc45a636dfb6)的[2024保研经验贴 (包含 193 个保研经验贴的汇总)](https://www.zhihu.com/collection/967421846?utm_source=qq&utm_medium=social&utm_oi=885488[电话已隐藏]4)` + "`" + `<small><u>` + "`" + `**（Noting：由于我们没有得到这193位同学的授权，因此我们无法直接分享这些文章。）**` + "`" + `</u></small>` + "`" + `
* @[Auroral703](https://github.com/Auroral703)的[2024年（25届）末二中rank计算机推免套磁&amp;&amp;面试经验帖——南开cmm、东南palm、西交软（扫盲向）](https://zhuanlan.zhihu.com/p/722088790)
* @[HDswag](https://www.zhihu.com/people/swaggyp-79-58)的[25届计算机保研流水账——天大智算保姆书+化学预推免+算法岗实习！(天大智算、厦大信院、瓜大计院、东南计软智、南开计院)](https://zhuanlan.zhihu.com/p/705127447)
* @[Ark](https://www.zhihu.com/people/k4mtz0)的[2021级-人工智能-保研记录（北大医学部+清叉+北大未院+北大软微+人大信院+上交密院+浙大计院+西湖+北京通研院+上海人工智能实验室)](https://zhuanlan.zhihu.com/p/12868669134)
* @[Maxxx](https://www.zhihu.com/people/jing-yu-yu-yu-kkkk)的[2024年次九计算机实验班保研经验分享|预推免战士|圆梦浙大](https://zhuanlan.zhihu.com/p/778165195)
* @[Chenruishuo](https://github.com/Chenruishuo)的[24数学跨保AI经验贴——五营六offer（清叉|清AI|南大AI|上交AI|复旦管院DSBA|港中深sds）](https://zhuanlan.zhihu.com/p/722033980)
* @[追光](https://github.com/Weistrass)的[25届次九实验班CS专业低rk保研上岸经验贴（含保研建议，必看）——哈深、天大、山大、中科大、东南、北京通研院等](https://zhuanlan.zhihu.com/p/787434682)
* @[安娜苏](https://github.com/Je3ter)的[低rk无科研acmer，2025届计算机保研经验贴（南大cs，同济cs，北大软微）](https://zhuanlan.zhihu.com/p/767565015)
* @[安娜苏的npy](https://github.com/Je3ter)的[2024年（25届）CS基本纯绩点选手保研经验贴](https://zhuanlan.zhihu.com/p/767703181)
* @[震烨](https://www.zhihu.com/people/e2dcc75a72d58a0fbd0b9a918cb8b898)的[2024年（2025届）计算机保研流水账（北大软微、北大深圳、中科大计算机）](https://zhuanlan.zhihu.com/p/752102974?utm_psn=[电话已隐藏]54857216)* 
@[Orzzz](https://github.com/Illusionna)的[数学跨保计算机](https://www.orzzz.net/directory/about/Undergraduate/PostgraduateRecommendation/index.html)**【索引页】**
* @[Superb9Piggy1](https://zhuanlan.zhihu.com/p/790480809)的[2024年（25届）计算机保研 次九+普通rank+低竞赛+低科研经验分享（南大CS）](https://zhuanlan.zhihu.com/p/790480809)
* @[binnn](https://www.zhihu.com/people/w-bei-shang)的[2025届计算机保研流水账（上交ai、pjlab、北深、北大软微、计算所寒武纪组）](https://zhuanlan.zhihu.com/p/762734102)
* @[凌霜羽](https://www.zhihu.com/people/star-85-10-90)的[2025届计算机保研碎碎念 | 低rank平保中山cs(深先院、中山cs、东南cs)（保研实习双开版）](https://zhuanlan.zhihu.com/p/719879083)
* @[Jupiter](https://www.zhihu.com/people/chirs-3-4)的[2024年（2025届）计算机保研——低rank上岸路（中科大先研、西工大cs、中山cs、国防科大cs、哈工大、软微、计算所）](https://zhuanlan.zhihu.com/p/786622126)
* @[Fsamuellll](https://www.zhihu.com/people/fsamuel)的[25届计算机保研经验分享（10天梦幻保研旅程）](https://zhuanlan.zhihu.com/p/708507301)
* @[LawnJerch](https://github.com/Alter-Liu)的[2025届计算机保研流水账 | 低rank有科研有实习（西湖大学、计算所、贵系工程硕博）](https://zhuanlan.zhihu.com/p/796755384)
* @[合金Bunny酱](https://space.bilibili.com/305821778)的[2024计算机保研经验贴（哈工深，中山，华工，东南）](https://www.bilibili.com/opus/982457937753538582)
* @[Frings](https://www.zhihu.com/people/lin-dong-jiang-zhi-91-76)的[2024计算机保研经验贴上-夏令营篇-清叉北智软微人大高瓴清深TBSI复旦CS科大CS](https://zhuanlan.zhihu.com/p/774165680)
* @[Frings](https://www.zhihu.com/people/lin-dong-jiang-zhi-91-76)的[2024计算机保研经验贴下-预推免篇-清网研清软北计软微浙大CS](https://zhuanlan.zhihu.com/p/808810450)
* @[WhiteNight](https://github.com/WhiteNight123)的[2024年（25届）四非计算机保研经验贴（浙软，北邮，重大，成电，西电杭，深大）](https://zhuanlan.zhihu.com/p/808961775)
* @[Algernon-qaq](https://www.zhihu.com/people/a-er-ji-nong-24)的[2024年（25届）计算机保研 夏令营0offer 预推免绝地反击 924才拿到offer 预推免7天面9个院校（武大网安、东南软件、东北软件、湖南软件、大工软、西交软、重大软件、电科网安、武大计院）](https://zhuanlan.zhihu.com/p/809351967)
* @[风很大](https://zhuanlan.zhihu.com/p/832349663)的[2024年（25届）计算机保研——纯rk选手上岸pku（北大rw，北深，复旦cs，南大cs，南大se，南大ai，浙大cs，哈工深，中山cs）](https://zhuanlan.zhihu.com/p/832349663)
* @[BuG_17](https://github.com/17BuGs)的[2024年计算机保研经验分享-末2上岸成电SE-中山AI/东南SE/西工大无人/华师SE/成电SE等](https://17bugs.github.io/2024/10/04/tuimian_exp/)
* @[zzxAnthony](https://github.com/zzxAnthony)的[24年（25届）双非计算机保研经验贴（天大智算、厦大信院、北航软院等）](https://zhuanlan.zhihu.com/p/786703194)
* @[Tgotp](https://github.com/Tgotp)的[25保研四非低rk计算机推免经验帖](https://zhuanlan.zhihu.com/p/783162409)
* @[次林梦叶](https://github.com/cilinmengye)的[朝花夕拾 2024年（25届）四非 本人极度社恐 无科研 无正式项目 无高rk 无ACM 劣势保研（深大 苏大 西电杭 浙软）](https://www.cnblogs.com/cilinmengye/p/18448662)
* @[Protechny](https://www.zhihu.com/people/xiang-bei-4-62)的[2024年（2025届）CS/SE保研经验分享|无科研竞赛经验|国防科大智能院、中科院软件所、哈工大计算学部、西交软院、成电计院|上岸成电cs专硕](https://zhuanlan.zhihu.com/p/809858162)
* @[猫了个猫](https://www.zhihu.com/people/lsz-14-39)的[【25保研经验贴】浙大软院、自动化所、中科大、神仙院MMlab、同济软件、中山CS经验贴](https://zhuanlan.zhihu.com/p/770129585)
* @[ACshine](https://github.com/ACshine)的[2024年（2025届）-中2计算机保研全过程经验帖（杭高院、西工大、北邮、成电、华师、北师、复旦、北航等](https://zhuanlan.zhihu.com/p/860709046)
* @[swxk](https://www.zhihu.com/people/sai-wai-xing-ke)的[2024年（25届）次九纯rank选手保研回忆录（哈工深cs，中大ai，中科大aids，浙大软院）](https://zhuanlan.zhihu.com/p/924781136)
* @[Jayson](https://www.zhihu.com/people/cai-cai-46-94-34)的[2024年（2025届）计算机/自动化保研回忆录（南大AI、人大高瓴、浙大控制、中科大6系、清深大数据）](https://zhuanlan.zhihu.com/p/940729266)
* @[仰望星空俯视银河](https://www.zhihu.com/people/yang-wang-xing-kong-fu-shi-yin-he)的[2024年(25届)计算机保研经验分享——圆梦浙江大学软件学院](https://zhuanlan.zhihu.com/p/911068744)
* @[天南海北](https://www.zhihu.com/people/tian-nan-hai-bei-2541)的[2024年（2025届）低rank三无鼠鼠保研的奇幻漂流之旅（北邮计院、计算所、华科国光、空天院、国网电科院、东南计院、天佐、科大工硕、浙大软院、科大10系、中大软院、武大网安、北航计院，3.0w字）](https://zhuanlan.zhihu.com/p/839171218)
* @[catting](https://www.zhihu.com/people/hcatting)的[2024年（25届）计算机保研回忆录（北深CS、浙大CS、南大AI、中科大CS等）](https://zhuanlan.zhihu.com/p/1813337698)
* @[Sinsoledad](https://www.zhihu.com/people/sinsoledad-19)的[2024年(25届)计算机保研经验贴（南大AI、武大测国重、浙大CS） - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/2496112146)
* @[AdamZ](https://www.zhihu.com/people/hui-lun-84)的[2024年(25届)GD末2保研历程(港中文北航北理珠上科南科东北)](https://zhuanlan.zhihu.com/p/710500808)
* @[Justjustifyjudge](https://github.com/Justjustifyjudge)的[【低rank 25保研经验帖】 浙大软院、上海科技VDI center、华南理工CS](https://ustb-scut.github.io/repo4scirec/baoyan_jjj.html)
* @[makka-flower](https://www.zhihu.com/people/xi-xi-76-11-55)的[2025届（24年）计算机四非er——学术垃圾水水的保研历程（上岸电科深版）](https://zhuanlan.zhihu.com/p/4400140606)
* @[0x4A](https://www.zhihu.com/people/0x4A)的[三无选手25网安保研流水账](https://zhuanlan.zhihu.com/p/785749970)
* @[HL](https://www.zhihu.com/people/wang-zi-hang-75)的[2024年（2025届）计算机保研经验贴（南大计算机、清深大数据、北大软微、上交计算机、中科大计算机、清华软件等）](https://zhuanlan.zhihu.com/p/[电话已隐藏])
* @[Luvman](d0000000001000984?xsec_token=YBHeGEQ2LW523fXeOOjglQ6KBQTiMMypFqeT3yLKs9Xzg=&xsec_source=app_share&xhsshare=CopyLink&appuid=60dada4d0000000001000984&apptime=1739079114&share_id=9d57548bdee746d5b5dbdb3d1fdbd859)的[2024年（2025届）计算机保研流水账（软微、北深）](http://xhslink.com/a/GZfunLpLfws5)
* @[momo](https://www.zhihu.com/people/momo-16-13-72)的[2024年CS普通选手保研--国防科大、哈工大、川大、西交软、中科大（面向次末九冲中九华五）](https://zhuanlan.zhihu.com/p/1234816183)
* @[extreme1228](https://www.zhihu.com/people/bo-wen-85-93-41) 的[2024年（2025届）中九CS专业保研经验贴（清叉，贵系，复旦，人大高瓴，上交软件，浙大）](https://zhuanlan.zhihu.com/p/773204297)
* @[tqychy](https://www.zhihu.com/people/chy-89-86) 的[tqychy の 保研流水账](https://zhuanlan.zhihu.com/p/801255622)
* @[tanzhe](https://www.xiaohongshu.com/user/profile/654adef3000000000301d029)的[2024年计算机网安保研梦幻之旅|清华、上交、北航、中山、中科院各所等](https://blog.csdn.net/m0_63355790/article/details/147803394?spm=1001.2014.3001.5501)`,
	},
	{
		DisplayName:       `快乐的蓝莓bb`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 2025年`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：2025年。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 2025年保研总结贴
---
* @[Axi404](https://www.zhihu.com/people/you-ge-sha-long-21)的[乘凉，我的保研经验贴](https://zhuanlan.zhihu.com/p/[电话已隐藏]09198902)以及[关于 AI 入门以及泛保研相关的建议](https://zhuanlan.zhihu.com/p/[电话已隐藏]34720721)
* @[H-WEI](http://hjw-vip.github.io)的[小H呼噜呼噜睡的保研经验贴(北大cs、浙软、同济cs、复旦cs、上交cs等(中九低rk的梭哈历程))](https://zhuanlan.zhihu.com/p/[电话已隐藏]46478317)
* @[Axi404](https://www.zhihu.com/people/you-ge-sha-long-21)的[乘凉，我的保研经验贴](https://zhuanlan.zhihu.com/p/[电话已隐藏]09198902)以及[关于 AI 入门以及泛保研相关的建议](https://zhuanlan.zhihu.com/p/[电话已隐藏]34720721) 
* @[石上三年](https://github.com/sssn-tech)的[「南大智科/浙大软件/西交计科/中山计科/中山软件/深先院数字所/等」22级夏令营/预推免保研经验贴](https://www.xiaohongshu.com/user/profile/6503f20a0000000012006cbc)
* @[SKST](https://www.xiaohongshu.com/user/profile/61cda3a2000000000201d31d)的[(保研为我带来了什么?)计算机保研反焦虑贴 兼 经验贴](https://www.xiaohongshu.com/user/profile/61cda3a2000000000201d31d)
* @[朝花夕拾](https://www.zhihu.com/people/an-yi-zhi-guang)的[2025年（2026届）计算机保研回忆录（国科大杭高、上交软、上海AI Lab、中山cs、贵系工程硕博等）](https://zhuanlan.zhihu.com/p/[电话已隐藏]23619478)
* @[forever](https://www.zhihu.com/people/forever-25-36-19)的[2025年(26届)计算机ACMer保研经验贴 \\[北大软微/大数据/上海创智/人大高瓴/南大计算机\\]-四次与清北擦肩而过后我只能选择祛魅](https://zhuanlan.zhihu.com/p/[电话已隐藏]69750416)
* @[l9006](https://www.zhihu.com/people/l9006)的[2025年（2026届）计算机保研经验贴——清北华五人+京二所等](https://zhuanlan.zhihu.com/p/[电话已隐藏]31765046)
* @[若楠](https://www.zhihu.com/people/ruo-nan-81-5)的[2025年（2026届）计算机保研经验贴（同济cs，南大se，东南cs，南大cs，南大ai，复旦cs）](https://zhuanlan.zhihu.com/p/[电话已隐藏]17006125)
* @[tby](https://www.xiaohongshu.com/user/profile/554c1717b203d94b9ff8514e)的[保研后记 | 未知才是未来——敬每一场相遇与分别（本科双非，国科大杭高院智能学院/华东师范智能教育/上科大信息学院/华东理工信息学院等）](https://mp.weixin.qq.com/s/Csaz3Li_R8-RlyrUnl-guw)
* @[爱吃小浣熊干脆面](https://www.zhihu.com/people/49-64-5-73-32)的[2025年（26届）末九计算机拔尖班保研回忆录（清软+软微+上交+科大+AILab+计算所+武大+空天院）](https://zhuanlan.zhihu.com/p/[电话已隐藏]96384865)
* @[渝中半岛铝盒](https://www.zhihu.com/people/bu-bai-zhi-shen-86)的[2025年（26届）华五中上/无竞赛/弱科研计算机保研回忆录（南大智科/中山cs/自动化所/浙大cs/上交ai）](https://zhuanlan.zhihu.com/p/[电话已隐藏]16482388)
* @[沉默的知更鸟](https://www.zhihu.com/people/luo-chen-61-71)的[2025年（2026届）双非计算机保研（北京中关村学院，复旦机器人，自动化所，厦大MAC, 东南PALM，浙软，天大智算、上科大VDI等等）](https://zhuanlan.zhihu.com/p/[电话已隐藏]75458759)
* @[早也不晚](https://www.zhihu.com/people/zhi-hu-yong-hu-45822-63)的[2025年（2026届）四非计算机rank1也能保研华五人C9吗（复旦机器人、人大信、哈工大本部）](https://zhuanlan.zhihu.com/p/[电话已隐藏]09901376)`,
	},
	{
		DisplayName:       `芒果写代码`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 学校相关`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：学校相关。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 学校相关
---

### 清华大学计算机系

- @[CYMario](https://www.zhihu.com/people/cymario)的[清华大学计算机类专业考研/保研--机试经验贴](https://zhuanlan.zhihu.com/p/614290119)（机考第一关于上机考试的全面解析）

- @[马天猫](https://www.zhihu.com/people/ma-shao-nan-89/)的[马天猫的CS保研经历](http://www.voidcn.com/article/p-nmrtcllh-bph.html)
- 杜鑫乐的[杜鑫乐：我的清华梦](http://mp.weixin.qq.com/s?srcid=0929yApBvkizkgYDzI4vrXfc&scene=22&mid=2247484472&sn=e0dd3de3f4ea596628989d5ad5807604&idx=1&__biz=MzIxMzM2MjM1Mw%3D%3D&chksm=97b6b7e6a0c13ef000050d61fc1c70a442d7675be3cb84bf9730a36cdcb3d71b50b8f7e95255&mpshare=1#rd)

### 清华大学交叉学院

* @[浮槎](https://www.zhihu.com/people/yifanyeung)的[2022年计算机保研经验贴（清华叉院、清华贵系、北大计算机、北大智能、上交电院计算机、复旦计算机）](https://zhuanlan.zhihu.com/p/573038839?)

### 清华大学网研院

- @[一岸流年](https://blog.csdn.net/qq_41997479)的[2019年9月清华网研院预推免保研经验](https://blog.csdn.net/qq_41997479/article/details/101027420)

### 北京大学信息科学技术学院

- @[Lee](http://www.cnblogs.com/QingHuan/)的[2017北京大学信息科学与技术学院夏令营总结](http://www.cnblogs.com/QingHuan/p/7196624.html)
- @[fxx很棒棒哦](https://www.jianshu.com/u/52dcf548259d)的[记2017北大计算所夏令营经历](https://www.jianshu.com/p/7de6a949b08b)

### 北京大学交叉学院

- @[shiyi001](https://www.jianshu.com/u/d130a6d54c7b)的[记2017北大叉院夏令营经历](https://www.jianshu.com/p/074ddd145097)
- @[zjunzhao](https://www.jianshu.com/u/934b4b63dcd1)的[2017北京大学数据科学中心夏令营经历](https://www.jianshu.com/p/cde78a03e4c2)
- @[MY_Devotion](https://www.jianshu.com/u/33d42b625eb8)的[记2017北大叉院夏令营经历](https://www.jianshu.com/p/e1b6b4421ca2)
- @[MY_Devotion](https://www.jianshu.com/u/33d42b625eb8)的[计算机系保研夏令营机试攻略篇01——北大叉院机试](https://www.jianshu.com/p/1acfd9c966a1)
- @[Erin明明如月](https://www.jianshu.com/u/d1aa43aef7c8)的[北大交叉学院大数据中心夏令营](https://www.jianshu.com/p/cf9daf795879)
- @[仲夏123](https://www.jianshu.com/u/bdda419e067d)的[记北大叉院，北航夏令营经历](https://www.jianshu.com/p/ce3c98acd5a7)
- @[leran2098](https://www.jianshu.com/u/ed706a2c5d72)的[北大叉院数据科学夏令营](https://www.jianshu.com/p/79d337e33702)
- @[yingtaomj](https://www.jianshu.com/u/4039558da763)的[CS保研经验贴](https://www.jianshu.com/p/e9cb303a717e)

### 上海交通大学计算机学院

- @[冰封墨者](https://www.jianshu.com/u/1d4d76e5a62e)的[2017上海交大电院计算机自主招生经历](https://www.jianshu.com/p/718ad7128596)
- @[yingtaomj](https://www.jianshu.com/u/4039558da763)的[CS保研经验贴](https://www.jianshu.com/p/e9cb303a717e)

### 复旦大学计算机学院

- @[RowitZou](http://www.eeban.com/home.php?mod=space&uid=1499503)的[复旦计算机夏令营保研记](http://www.eeban.com/forum.php?mod=viewthread&tid=12993&extra=page%3D1)
- @[sunrise的博客](http://blog.csdn.net/qq_25201379)的[保研经历-从信工所-国防科大-上交-最后确定复旦（信息安全专业）](http://blog.csdn.net/qq_25201379/article/details/78178697)
- @[Hwcoder](https://hwcoder.top/)的[2022中九CS保研回忆录（复旦CS/人大高瓴/北大软微/科大/清华软院...）](https://zhuanlan.zhihu.com/p/569487445)

### 北京航空航天大学计算机学院

- @[EternalWang](http://www.jianshu.com/u/b271feb9cb4d)的[2017北航计算机学院夏令营经历](http://www.jianshu.com/p/6309431fce62)
- @[仲夏123](http://www.jianshu.com/u/bdda419e067d)的[记北大叉院，北航夏令营经历](http://www.jianshu.com/p/ce3c98acd5a7)
- @[不会游泳的鱼鱼鱼](http://www.jianshu.com/u/36bda6ee1ecb)的[西电to北航 一路保研经验分享](http://www.jianshu.com/p/826b7f761e7d)
- @[Trrific](https://trrific.me)的[双非to北航CSの坎坷保研路](https://trrific.me/2018/10/16/%E5%8F%8C%E9%9D%9Eto%E5%8C%97%E8%88%AACS%E3%81%AE%E5%9D%8E%E5%9D%B7%E4%BF%9D%E7%A0%94%E8%B7%AF/)
- @[菜得抠脚](https://github.com/taogelose)的[某菜混进北航做计算机视觉的保研经历](https://blog.csdn.net/Taogewins/article/details/89087610)

### 中科院自动化所

- @[mallmeen](http://www.jianshu.com/u/c17bbd102bc1)的[自动化所9月推免面经](http://www.jianshu.com/p/475d8b14639c)

### 中科院计算所

- @[027b6fdc57ec](http://www.jianshu.com/u/027b6fdc57ec)的[中科院计算所霸面经历](http://www.jianshu.com/p/0a3d8da8afc1)
- @[Tinet_](http://www.jianshu.com/u/b0b4d10d1e51)的[计算所夏令营经历](http://www.jianshu.com/p/5910bf5c6c3b)

### 中科院软件所

- @[呼啦啦葱](http://www.jianshu.com/u/a023877e864c)的[7.17-7.21中科院软件所夏令营](http://www.jianshu.com/p/a3e0c09b2402)
- @[banpicai9259](http://my.csdn.net/banpicai9259)的[ 2017保研——软件所夏令营亲体验](http://blog.csdn.net/banpicai9259/article/details/77108171)

### 中科院信工所

- @[呼啦啦葱](http://www.jianshu.com/u/a023877e864c)的[7.9-7.15中科院信工所第一批夏令营](http://www.jianshu.com/p/754a7f626784)
- @[rebirthwyw](http://www.jianshu.com/u/7a3d48c39bb7)的[信工所六室面试经历](http://www.jianshu.com/p/0cc697eb3d6d)

### 中科院深圳先进技术研究院

- @[石上三年](https://github.com/sssn-tech)的[「南大智科/浙大软件/西交计科/中山计科/中山软件/深先院数字所/等」22级夏令营/预推免保研经验贴](https://www.xiaohongshu.com/user/profile/6503f20a0000000012006cbc)

### 南京大学计算机系

- @[栗子栗子](http://liziyang.space/)的[2017南京大学计算机开放日机试题解](http://liziyang.space/2017/07/16/CS_PT_2017NJU/)

### 中国科学技术大学

- @[lhw](https://www.zhihu.com/people/lhw-55/posts)的[211物联网工程保研中国科学技术大学cs自然语言处理方向](https://zhuanlan.zhihu.com/p/60553247)

### 南开大学软件学院

- @[gtcer](http://www.360doc.com/userhome/27525068)的[2018届研究生招生暑期夏令营经历分享——guochengtao](http://www.360doc.com/content/17/1101/14/27525068_700005388.shtml)`,
	},
	{
		DisplayName:       `刺猬ff`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 视频资料`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：视频资料。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 视频资料
---

## 保研准备

* @[墨云沧](https://space.bilibili.com/21846767?from=search&seid=104103838776132911&spm_id_from=333.337.0.0)的[计算机保研交流群冲刺系列1-文书准备](https://www.bilibili.com/video/BV1xg41157Cp?spm_id_from=333.999.0.0)
* @[墨云沧](https://space.bilibili.com/21846767?from=search&seid=104103838776132911&spm_id_from=333.337.0.0)的[计算机保研交流群冲刺系列2-面试准备](https://www.bilibili.com/video/BV1564y1e7b9?spm_id_from=333.999.0.0)
* @[墨云沧](https://space.bilibili.com/21846767?from=search&seid=104103838776132911&spm_id_from=333.337.0.0)的[计算机保研交流群冲刺系列3-科研思考](https://www.bilibili.com/video/BV1Dg411G7wG?spm_id_from=333.999.0.0)

## 保研学校专题讲座

* @[墨云沧](https://space.bilibili.com/21846767?from=search&seid=104103838776132911&spm_id_from=333.337.0.0)的[计算机保研交流群院校专题讲座1-清华大学](https://www.bilibili.com/video/BV1qU4y1b7s7?spm_id_from=333.999.0.0)
* @[墨云沧](https://space.bilibili.com/21846767?from=search&seid=104103838776132911&spm_id_from=333.337.0.0)的[计算机保研交流群院校专题讲座2-北京大学](https://www.bilibili.com/video/BV1oK4y1R7Dc?spm_id_from=333.999.0.0)
* @[墨云沧](https://space.bilibili.com/21846767?from=search&seid=104103838776132911&spm_id_from=333.337.0.0)的[计算机保研交流群院校专题讲座3-中国科学院大学](https://www.bilibili.com/video/BV1xK4y1A7oy?spm_id_from=333.999.0.0)
* @[墨云沧](https://space.bilibili.com/21846767?from=search&seid=104103838776132911&spm_id_from=333.337.0.0)的[计算机保研交流群院校专题讲座4-上海交通大学&复旦大学20210515](https://www.bilibili.com/video/BV1F64y1k7ED?spm_id_from=333.999.0.0)
* @[墨云沧](https://space.bilibili.com/21846767?from=search&seid=104103838776132911&spm_id_from=333.337.0.0)的[计算机保研交流群院校专题讲座5-南京大学&浙江大学&中国科学技术大学（南大在最后的彩蛋里面）](https://www.bilibili.com/video/BV11B4y1u7Aq?spm_id_from=333.999.0.0)

## 保研答疑讲座

* @[墨云沧](https://space.bilibili.com/21846767?from=search&seid=104103838776132911&spm_id_from=333.337.0.0)的[计算机保研交流群第一次答疑讲座20210131](https://www.bilibili.com/video/BV1Yv411s7Px?spm_id_from=333.999.0.0)
* @[墨云沧](https://space.bilibili.com/21846767?from=search&seid=104103838776132911&spm_id_from=333.337.0.0)的[计算机保研交流群第二次答疑直播20210209](https://www.bilibili.com/video/BV11f4y1r7Vf?spm_id_from=333.999.0.0)
* @[墨云沧](https://space.bilibili.com/21846767?from=search&seid=104103838776132911&spm_id_from=333.337.0.0)的[计算机保研交流群第三次答疑直播20210221](https://www.bilibili.com/video/BV1AU4y1s7UH?spm_id_from=333.999.0.0)
* @[墨云沧](https://space.bilibili.com/21846767?from=search&seid=104103838776132911&spm_id_from=333.337.0.0)的[计算机保研交流群第四次答疑直播20210304](https://www.bilibili.com/video/BV1hA411K7Fj?spm_id_from=333.999.0.0)`,
	},
	{
		DisplayName:       `薯片去徒步`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | [2025]中科院计算所 pFind团队`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：[2025]中科院计算所 pFind团队。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 中科院计算所-pFind团队
---

<div style="
  display: flex;
  justify-content: space-between; 
  align-items: center; 
  width: 100%; 
  box-sizing: border-box;
  padding: 0 0px; 
">
  

  <div style="
    width: 45%; 
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-end; 
    box-sizing: border-box;
  ">
    
    <h1 style="font-size: 3em; font-family: Cambria, Microsoft YaHei; margin: 0; color: #999">Find</h1>
  </div>
</div>

<p style="clear: both; margin-top: 50px;">

## 团队简介

### 研究方向

$pFind$ 团队成立于 $2002$ 年，团队站在**交叉研究**的浪潮之上，致力于使用**算法学、数据挖掘、机器学习、深度学习**等信息处理技术和方法，从计算的角度**研究并解决生物或医学领域中大规模数据的信息处理问题**。团队分为传统算法组和深度学习组，其中传统算法组基于图论、数学建模、机器学习及优化与规划算法等方法。团队围绕**应用生物质谱技术进行蛋白质鉴定和定量算法研究及应用软件开发**两个方面开展科研工作。

### 团队成果

$pFind$ 团队承担的主要课题包括国家 $973$ 课题、 $863$ 课题、中科院重大课题、国家重大专项课题等。团队的标志性成果，是我国第一个具有完全自主知识产权和国际竞争力的蛋白质鉴定软件 $pFindStudio$ ，遍及六大洲的数十个国家，**并助力同行完成了 $1000$ 余项科研成果**。团队在 $Nature \\ Biotechnology$、$Nature \\ Methods$、$Nature \\ Chemical \\ Biology$、$Nature \\ Communications$ 和 $Bioinformatics$ 等国际著名期刊上发表 $60$ 余篇论文，不断获得国际同行的正面评价和引用。**团队研究成果入选 $2018$ 年度中国生物信息学十大进展，主要成员于 $2019$ 年获得中国计算机学会技术发明一等奖**（年度唯一获奖团队）。

### 团队现状

团队由[迟浩](https://pfind.ict.ac.cn/people/chihao/)研究员、[贺思敏](http://pfind.net/people/hesimin/Chinese/default.htm)研究员带队，导师详细信息请见导师个人主页。团队目前由 $9$ 名博士、$5$ 名硕士组成，详见[团队主页](https://pfind.ict.ac.cn)。**团队历经 $23$ 载，已毕业研究生遍布世界各地**，包括但不限于腾讯、华为、阿里、京东、微软亚洲研究院、亚马逊；研究机构包括但不限于北京航空航天大学、西湖大学、香港中文大学、中国科学院计算技术研究所、北京生命科学研究所、宾夕法尼亚大学、南加利福尼亚大学、新南威尔士大学、马克斯-普朗克研究所。

## 招生计划

**$pFind$ 团队计划招收硕士生 $2$ 名，直博生 $1$ 名，$2026$ 年秋季入学**。课题组欢迎具有扎实的大学本科理论方法基础和熟练的编程实践能力的优秀学生报考推免研究生、硕博连读生或博士研究生。**报考专业包括但不限于计算机相关专业、生物相关专业、数学相关专业**。常有非计算机专业的同学担心入组工作，请大家放心，我们几乎每年都会招一名非计算机专业的同学，他们本科几乎没编过程序，也没系统学习过算法，但这些同学总有一点或两点非常突出，应该对自己、对我们有信心，是金子总会发光。

## 疑问解答

**需要掌握很多生物知识吗？**

我们的核心问题全是计算问题，生物知识只在提取特征时用到，不需要特别钻研。当然，如果你特别有兴趣，我们的生物合作方也会给你提供亲手做生物实验的机会。

**保研面试或考研复试都考哪些内容？**

我们的保研面试和考研复试考核形式、内容是一样的，均由笔试、机试、面试 $3$ 部分组成。

**一定要同意硕博连读吗？**

我们既有直博（硕博连读）名额，也有硕士名额，你的选择不会影响面试成绩。但我们希望你的选择是严肃的、慎重的，这既是为别人负责也是为自己负责。


## 联系方式

请感兴趣的各位同学将简历发送至邮箱：[邮箱已隐藏].cn。

如有任何疑问也请欢迎咨询：[邮箱已隐藏].cn。

#### 更多信息请见团队[官方网站](https://pfind.ict.ac.cn)和[招生信息栏](https://pfind.ict.ac.cn/rt/)。

<div style="
  text-align: center;  /* 整个二维码模块居中 */
  margin: 20px 0;       /* 与上下文字间隔20px，可微调 */
">
  <div style="
    display: inline-flex;  /* 横向布局两个单元 */
    gap: 40px;             /* 两个单元之间的间距，比原20px稍大，避免拥挤 */
    align-items: flex-start; /* 确保两个单元顶部对齐（避免注释长短影响对齐） */
  ">
    <div style="
      display: flex;
      flex-direction: column; /* 垂直排列：二维码在上，注释在下 */
      align-items: center;    /* 单元内内容居中（注释跟二维码对齐） */
    ">
      
      
    </div>
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      
      
    </div>
  </div>
</div>

</p>`,
	},
	{
		DisplayName:       `豆包荔枝`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 上海交通大学 数据驱动软件技术实验室 陈游旻老师招收硕士研究生/实习生`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：上海交通大学 数据驱动软件技术实验室 陈游旻老师招收硕士研究。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 上交计算机学院陈游旻
---

# 上海交通大学 数据驱动软件技术实验室 陈游旻老师招收硕士研究生/实习生

## 导师介绍

[陈游旻](https://chenyoumin1993.github.io)博士于2024年9月入职上海交通大学计算机学院任预聘副教授（Tenure-Track Associate Professor）。陈游旻博士的主要研究方向包括AI系统、存储系统、操作系统等，在系统领域顶级会议（如SOSP、FAST、ASPLOS、EuroSys、USENIX ATC等）发表论文30余篇，多篇论文入选CCF A类会议高被引论文，研究成果应用于华为、阿里等头部企业，相关研究成曾获得CCF科学技术奖技术发明一等奖、华为首届奥林帕斯奖及百万悬红等。个人主页：https://chenyoumin1993.github.io

陈游旻博士于2021年获清华大学计算机科学与技术系博士学位，获得了**CCF优秀博士学位论文奖**（全国计算机学科10人入选）、ACM SIGOPS ChinaSys优秀博士学位论文奖（全国系统领域2-3人入选）等；2021-2024年在清华大学从事博士后研究工作，获得了 **中国博士后创新人才支持计划（博新计划）** 等的资助，主持了国家重点研发计划子课题、国家自然科学基金青年基金等项目。曾任第25届ChinaSys研讨会程序委员会主席（PC Chair），并担任USENIX ATC等国际会议/期刊的程序委员会委员/审稿人。

## 研究方向

-	大模型训练/推理系统（存算调度、系统优化等）
-	面向分离式数据中心架构的操作系统及存储系统

## 申请条件

现拟招收**2026年入学的推免硕士生2名、本校大二/大三实习生若干**。其中，预推免硕士生排名需基本符合交大夏令营入营资格，候选人如有以下特质将择优录取：
1. 就读于计算机科学等相关专业，有扎实的C/C++编程功底
2. 对计算机系统方面的研究有浓厚兴趣，自驱力强
3. 勇于挑战自我（我们是一群尝试突破知识边界的探索者，科学研究向来充满挑战）


## 导师特点
1.	平等的师生关系：充分尊重和保护学生研究兴趣
2.	高质量科学研究：导师有充足的时间和精力保证学生从事高效、高质的科研
3.	To**有出国意向的本科生**：你加入后可以基于已成型的idea快速上手，导师会全程协助你论文投稿

**从事系统领域研究的` + "`" + `` + "`" + `慢速甜蜜''（来自一些身边从事系统领域研究的师兄弟）**：
1.	多位华为“天才少年”，年薪150+w，入职不久就能在业界独当一面
2.	多位放弃企业高薪选择进入高校继续从事科学研究


如果你读到这里并仍对我的研究领域感兴趣，欢迎联系我，我们可以一起聊聊如何让未来的成长更出彩！

## 申请方式
请申请人将个人简历、成绩单发送邮箱：[邮箱已隐藏].cn，标题为 【申请类型-姓名-学校-院系-年级】`,
	},
	{
		DisplayName:       `鸽子柠檬`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 上海Ai Lab(openimagelab)`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：上海Ai Lab(openimagelab)。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 上海Ai-Lab(openimagelab)
---

**上海人工智能实验室OpenImaging Lab招实习生**

### 团队介绍
团队致力于利用深度学习和AI大模型，研发设计新型人工智能视觉传感器、图像处理芯片链路、光学元件以及相机系统，并专注于图像处理与画质增强领域，致力于运用最前沿的技术手段优化图像和视频质量，开拓视觉体验新高度，提出下一代适用于图像拍摄和三维成像的系统，推动计算机视觉技术在真实应用场景中的进步。

如果你对计算摄影、生成式AI、三维重建，具身智能，计算光学成像、计算机视觉、类脑人工智能和新型视觉传感器有浓厚兴趣并有相关研究经验，期待进行前沿科学探索。加入我们将有机会：
- 在国际最顶级会议和期刊上发表高影响力的学术论文；
- 和领域内知名学者建立联系，优秀的实习生还有机会被推荐到国内外顶尖大学或者研究机构深造；
- 我们拥有良好的团队氛围，支持开放的课题与合作，提供充足的计算资源，以及很有竞争力里的薪酬待遇，关注学生的长期发展

### 实验室介绍
上海人工智能实验室是我国人工智能领域的新型科研机构，开展战略性、原创性、前瞻性的科学研究与技术攻关，突破人工智能的重要基础理论和关键核心技术，打造“突破型、引领型、平台型”一体化的大型综合性研究基地，支撑我国人工智能产业实现跨越式发展，目标建成国际一流的人工智能实验室，成为享誉全球的人工智能原创理论和技术的策源地。

### 开放岗位以及任职要求

**计算摄影见习研究员** 
1. 探索基于扩散模型的图像处理大模型，推动图像处理技术的发展；
2. 探索人工智能、计算摄影与新型视觉传感器交叉领域的前沿研究方向，紧跟科技发展趋势。

**3D算法见习研究员**
1. 探索在计算摄影领域中的3D成像，跟踪科技前沿，如NeRF，3DGS, 生成式大模型等；
2. 探索复杂场景的3D/4D成像系统的研发。

**具身智能算法实习生**
1. 探索在具身智能，类脑计算等交叉领域科研方向，跟踪科技前沿；
2. 进行新型计算范式在具身智能上的研究。

**图像视频压缩算法实习生**
1. 探索在图形学、计算摄影、底层视觉等领域科研方向，跟踪科技前沿；
2. 进行图像视频压缩算法的研究。

**多模态影像画质见习研究员**
1. 深入探索底层视觉（low-level vision）和图像画质增强领域的最新科研方向；
2. 参与多模态大模型图像复原相关算法的研发与优化，接触计算机视觉领域的前沿技术研究。

**计算光学见习研究员**
1. 研发计算成像图像重建、光学元件设计、相机系统成像优化等前沿算法；
2. 搭建由新型图像传感器以及光学元件组成的相机系统原型，并评测性能。

### 招生要求
1.国内外知名高校及研究机构在读或者即将入学学生（本科及以上学历），能线下实习6个月及以上；
2.学业成绩优异/在学术前沿领域有相关研究经验，对相关领域有一定的理解，有良好的自我驱动力；

### 联系方式
如有兴趣，请将个人简历发送至[邮箱已隐藏].cn，我们会尽快与您联系。

请在主题中写“OpenImagingLab_姓名_岗位”

**工作地点：上海徐汇区国际传媒港；有特殊情况无法到达上海且卓越的同学可申请其他灵活方式。**`,
	},
	{
		DisplayName:       `河马实习中`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 上海Ai Lab张超`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：上海Ai Lab张超。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 上海Ai-Lab张超(清华电子工程系)
---

### 导师简介
张超，清华大学电子工程系助理教授，博士生导师，伦敦大学学院脑科学部荣誉副教授，上海
Al Lab顾问，研究方向为多模态语音语言处理和计算认知神经科学。曾多次在DARPA、
iARPA等组织的国际重大项目评测中夺冠，并参与开发HTK等工具软件。在语音语言处理、多
模态大模型等领域有充足经验，发表90余篇高水平论文（其中6篇论文获得最佳学生论文
奖），有多项技术获得产业应用，曾任剑桥大学副研究员和客座研究员、Google公司高级
究科学家、京东AI顾问等职务。


### 招生方向
1. 多模态语音语言处理技术：聚焦多模态时序信号中的语言处理，包括音视频大语言模型、多
模态表征、语音识别与生成、语音数据安全等；
2. 基于语言的AI4Neuroscience：面向脑电/脑磁（EEG/MEG）信号的多模态脑机接口处
理，包括大脑机制解析、大模型可解释性、语言解码和重构等；
3. 基于时序信号的AI4Medicine：应用于睡眠监测、精神状态分析（抑郁症、阿尔兹海默
症、自杀风险等），以及智能健康设备的生物标志物处理。

### 招生信息
清华大学电子工程系张超教授诚挚招募2025年入学的上海人工智能实验室联培普博生及长期
实习生，联培学校包括复旦、中科大、上交、同济和哈工大，团队由清华、UCL、剑桥的教授
与研究人员联合指导，氛围轻松，资源硬核。丰厚的补助、实习津贴和宿舍安排皆有保障，随
时待命的GPU资源更是让科研之路畅通无阻！优秀实习生将有机会申请博士或硕士项目。不论
你未来的目标是教职还是企业科研，这里都将助你迈向理想学术人生！<br>
**邮箱： [邮箱已隐藏].cn 个人主页：mi.eng.cam.ac.uk/~cz277**<br>
**快来加入我们，一起科研创新、改变世界吧!**`,
	},
	{
		DisplayName:       `自在的瓢虫kk`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 北京前沿交叉学科研究院张文涛`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：北京前沿交叉学科研究院张文涛。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 北京前沿交叉学科研究院张文涛
---

北大国际机器学习研究中心张文涛教授团队招收研究助理（RA）/ 实习生若干。对于推免/申
请考核制的博士生/硕士生，建议提前进组联系实习。

### 导师简介
张文涛，北京大学国际机器学习研究中心助理教授、研究员、博士生导师，曾任职于腾讯机器
学习平台部、Apple AIML和加拿大 Mila 人工智能实验室。研究兴趣为以数据为中心的机器
学习（Data-centric ML, DCML）、图机器学习、机器学习系统和交叉学科应用（如
Diffusion、多模态和 AI4Science）。他近 5年在机器学习 （ICML/NeurIPS/ ICLR）、数据
挖掘（SIGKDD/WWW）和数据管理（SIGMOD/VLDB/ICDE）等领域发表 CCF-A 类论文
50余篇，也担任多个国际顶会（VLDB/NeurIPS/WWW 等）的 PC Member/Area Chair。
他获得多个最佳论文奖（如第一作者获 WWW'22 Best Student Paper Award 和 通讯作者
获 APWeb-WAIM'23 Best Paper Runner Up Award），领导或参与开源了多个机器学习系
统，如大规模图学习系统 SGL、分布式机器学习系统 Angel （GitHub 6.7k star）、和黑盒优
化系统 OpenBox。他曾获 2021 年度亚太地区唯一的 Apple Scholar、世界人工智能大会云
帆奖、北京大学/北京市/中国人工智能学会优秀博士学位论文奖、2023中国电子学会科技进
步一等奖等等多项荣誉。

### 加入课题组的优势

1. 研究方向：
    - 课题组的研究方向(如大模型数据侧、生成式AI和 AI4Science)都是学术界/工业界热
    点
    - 作为一线青椒，我善于发现和提炼好的研究问题和方向(在学术内卷的时代，找到
    Practical 有Impact但Under-explored 新问题比在老问题上卷新方法可能更有意义，也
    更容易出成果）
2. 学生指导：
    - 每周按小方向组会分享（线下：静园六院208，线上：腾讯会议）和讨论
    - 安排经验丰富的师兄/师姐带入门，遇到技术细节问题，随时讨论(也可微信随时找我)
    - 有完善的科研入门文档，根据每位学生的基础、兴趣和未来规划针对性选择方向，一对一指导（至少meeting 1 次/周，合作超过1年以上的学生，一般都有一作顶会投稿/发表）
    - 作为同龄人：会换位思考，讨论学习、生活、工作和职业规划，尊重学生想法成为朋友
3. 资源优势:
    - 充界合作伙伴（如Apple、腾讯、华为、上海AI Lab、百川智能、字节、快手和蚂蚁等）Research实习和工作推荐。可以使用工业界算力、数据和好的研究问题，积累实习经历；
    - 学术合作：学术界合作伙伴（如Mila、 Stanford、ETH、 HKUST、 NUS 和UQ等）交流机会；
    - 助研津贴。
4. 其他：有愉快的氛围，定期组织团建（羽毛球、徒步和聚餐等），自愿参加。

### 招生简介

1. General DCML：近些年来 Al 模型发展遇到了瓶颈，大部分 SOTA 模型（如ChatGPT 和
   SAM）都是沿用2017年提出的Transformer 结构，性能收益来源由模型—>数据。课题组主
   要考虑优 Data quality, quantity 和 efficiency，以较低成本和较短时间来获得大量高质量数
   据。以大模型（如ChatGPT）为例，在考虑数据获取成本和效率的前提下，设计高效的数据处理
   方法（如过滤、去重和降噪），研究科学和系统的数据质量评估体系和策略，探索更有效的数
   据合成（如合成和增强）方式，构建有效的数据抽取（如RAG、分布匹配和数据配比)方式。
2. DCML Applications：
    - For Science: AI4Science 是人工智能和 Science 交叉领域，也是目前学术界和工业界前
    沿的热点方向。课题组主要以数据为中心，研究和设计高效的 Science 数据（如蛋白质和分子）构建和预处理方式，以及分子建模与生物制药等交叉应用。
    - For AIGC充足算力：丰富的计算资源（如 80GB Tesla A100/H100集群）
    - 业界合作：工业Diffusion Model：扩散模型是当前最热门的生成模型，其应用领域包含了
    CV.NLP 以及交叉学科等，课题组主要探究以数据为中心，将扩散模型如何更好地应用于各种复杂数据生成场景，如文生图、文生视频、可控3D生成、多模态学习等。
3. DCML Systems: ML System 是人工智能和计算机系统的交叉领域，也是目前计算机系统研究前沿的热点方向。我们课题组主要考虑从系统层面来支持DCML任务，如支持多种类型（如Graph和Text）的数据格式，支持大规模数据的处理（如Distributed ML），以及降低系统的使用门槛（如AutoML）等。针对大模型数据侧，课题组也在开发能支持多种数据类型、大规模数据的DCML系统，涵盖大模型数据处理、合成、质量评估、以及数据抽取等多个方面。

### 招生要求
需要至少满足以下一个要求，满足多个要求者优先考虑：
1. 作为主要作者在顶级会议（如ICML/NeurIPS/ICLR/CVPR/ICCV/WWW/KDD/SIGMOD/VLDB等）发表过论文；
2. 有机器学习基础，有相关研究和开源项目经验，并熟练掌握PyTorch等工具使用；
3. 在科技公司或研究机构有过实习经历，对机器学习的应用有系统深刻理解，并在实习阶段取得过突出成果；
4. 在Kaggle、天池和OGB等比赛中取得过良好成绩；有ACM/NOI/NOIP等信息学竞赛训练经历，有扎实的编程基础；
6. 对机器学习基础研究和应用有浓厚兴趣，愿意独立思考，足够Self-motivated并渴望做出有影响力的科研成果。`,
	},
	{
		DisplayName:       `萤火虫鸭`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 浙江大学软件学院周经森`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：浙江大学软件学院周经森。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 浙江大学软件学院周经森
---


[周经森(Kingsum Chow)](https://github.com/kingsum/kingsum.github.io)教授是SPAIL(System Performance Analytics and Intelligence Lab)的创建者和带头人。


> In March 2023, Kingsum joined the faculty of the School of Software Technology, Zhejiang University in Ningbo, Zhejiang, China. Back in 1996, he graduated with a PhD degree from the School of Computer Science and Engineering, University of Washington. Since then, he has worked for Intel in USA and Alibaba in China. He received the titles of chief scientist and senior principal engineer from the two companies he worked for. He has 33 years of experience in computer system performance optimization. He published 127 papers and 28 patents. He also delivered keynotes in major conferences including 4 appearances in JavaOne, the highest rated Java conference in the world. During the years he worked for Alibaba and Intel, he delivered results by collaborating with technologists from top hi-tech companies such as Amazon, AMD, Arm, Ampere, BEA (acquired by Oracle), Google, IBM, Microsoft, Oracle, Siebel (acquired by Oracle), Sun (acquired by Oracle) and Tencent. He led project Apollo in the collaboration between Intel and Oracle in the 2015 launch of Oracle Cloud, announced by Oracle and Intel CEO’s in the Oracle OpenWorld Keynote. His technical expertise and work ethics are highly praised by his collaborators. He represented Alibaba in the election for JCP EC (Java Community Process Executive Committee), the highest-ranking Java standards committee in the world. He was the first person to take a Chinese company into the world’s Java authority. Alibaba is still the only company in China that has achieved this status. While at Alibaba, he led the development a performance analysis platform called System Performance Estimation, Evaluation and Decision (SPEED). He trained many system performance engineers throughout the years and many of them are taking senior positions in many companies.


### 团队介绍	

The team is comprised of researchers spanning the fields of software engineering and system performance, including research experience in the top institutes and extensive industry experience in both software and hardware technologies with international high-tech companies. The team is fluent in both English and Chinese communications.

Our team maintains close collaborations with multiple enterprises, research institutions, and overseas universities. With abundant research funding and a vibrant scientific atmosphere, our team provides numerous opportunities for students to participate in a wide array of research and engineering projects. This enables them to showcase their individual capabilities, pursue academic aspirations, and enhance their engineering expertise, fostering both academic growth and engineering proficiency.

SPAIL has solid projects spanning from the academia to the industry. SPAIL has healthy funding to continue the current projects in computer system performance optimization and explore new ones. Currently, SPAIL is engaged in collaborative projects with several high-tech companies, focusing on performance data collection, analysis, modeling, and prediction across different instruction sets and CPU microarchitectures. The projects aims to enhance the understanding of performance metrics and optimize system efficiency through advanced data analytics and modeling techniques.

As Kingsum was a senior leader in the industry for more than 20 years, SPAIL has established research collaborations with major tech giants in the industry, spanning from cloud computing to software hardware co-optimization. Students can work on research projects solving real-world problems. There are opportunities to work in school and intern at both well-established industry leaders and flourishing startups in system performance optimization.

### 对学生的要求	

1. 诚实、有激情、有好奇心，追求真实的可复现的工作
2. 追求体系结构和性能分析方向的研究和工程实践
3. Read and write in English.
4. 较好的计算机基础知识和一定的动手能力
5. 良好的工程能力，熟悉常用编程语言如Python, C/C++, Rust
6. 良好的数据分析能力, Python packages, Jupyter, Excel, (assisted by ChatGPT, Qwen, etc)

### 联系方式

你可以直接联系Kingsum: [邮箱已隐藏]

### 备注

- 课题组长期招收硕士、博士。
- 2025年普博招生已经开始，外校普博生报名时间是：2024年10月18日9:00至2024年11月18日20:00 欢迎大家联系
- 浙江大学2025年普通招考博士研究生第一次招生报名通知：http://www.grs.zju.edu.cn/yjszs/2024/1016/c28499a2975680/page.htm 
- 学院汇总简章：学院发布的简章：浙江大学软件学院2025年博士研究生招生简章：http://www.cst.zju.edu.cn/2024/1018/c36206a2976663/page.htm`,
	},
	{
		DisplayName:       `青蛙做PPT`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 清华大学深研院王学谦`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：清华大学深研院王学谦。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 清华深研院王学谦
---

## 清华深研院王学谦老师课题组 招聘具身智能本科实习生【长期有效】
###  王学谦老师课题组介绍
- 导师介绍：王学谦，清华大学深圳国际研究生院教授、博士生导师，数据与信息研究院副院长，深圳市空间机器人与遥科学重点实验室主任。主要从事智能机器人、空间机器人研究。主持各类项目20余项。出版学术专著3部，发表学术论文200余篇，获得授权国家发明专利100余项。其中SCI论文45篇；发表国际会议95篇。授权发明专利84项。获国家科技进步特等奖1项、军队科技进步一等奖2项，被评为国家高技术研究发展计划“十二五”科技创新之星，入选深圳市南山区“领航人才”、深圳市高层次人才，获得中央军委科技委国防卓越青年基金资助。
- 团队方向：王学谦教授团队在机器人系统技术方面积累了丰富的研究成果。长期聚焦于空间机器人的机械设计、建模规划、空间遥操作、控制与故障诊断理论，以及地面双足、四足、轮足机器人的设计、控制与导航等领域的科学研究与工程落地工作中。团队主要成员获得国家级和省部级奖项十余项，发表高水平期刊会议论文数百篇，近三年获得授权专利五十余项。形成了以空间机器人、智能控制等自动化方向为核心，与新型人工智能学科方向相融合，向智能领域、材料领域、人因领域等辐射的交叉学科研究体系。

###  实习简介
- 本实习旨在招收有潜力、有读研需求的本科生参与完成高质量项目，期间进行科研与工程能力的培养，并进行本组硕博推免考核。本组推荐名额较多，欢迎有兴趣的本科同学踊跃报名；
- 本实习过程正规且资源支持充足，具有实习工资、实习证明等实习回报，表现优异者可获得老师推荐；

### 实习科研方向与内容
1. 前沿工业具身智能技术的设计与应用；

### 面向对象及条件
- 有意向前往清华大学深圳国际研究生院攻读硕士/博士研究生学位的本科生同学；
- 年级：大二全年或大三上；
- 成绩：按照目前绩点能够保研（不卡rank）；
- 专业：计算机、自动化、软件工程等相关专业；
- 精力：能将大部分精力用于实习，心无旁骛；

### 工作要求
- 在身心健康的前提下，以实习任务为全部目的！
- 专心做有意义的可落地的前沿工作；
- 大二、大三上可以远程实习，大三下或大四至少半年线下实习；

### 考核流程
- 一轮面试：测试表达能力、专业基础知识、过往项目经历（如有）；
- 二轮面试：论文讲解，并考核英语写作能力、绘图能力；
- 进组考察：两个月；

### 实习回报
- 全职清华博士及多名清华硕博研究生师兄/师姐进行具体的学术与工程指导；
- 高质量的科研成果与相应科研资源支持，包括但不限于充足的机器人设备（人形机器人、机械臂、灵巧手与夹爪），算力资源（40+ H100训练集群、多台5090本体推理机）；
- 远程实习每月1000元补贴，线下实习每月6000且包食宿；
- 表现优异者，将在清华大学深圳国际研究生院的保研中被优先推荐；
- 清华科研实习证明；
- 清华大学教授亲笔推荐信（仅线下实习前50%的实习生）；

### 联系方式
- 联系邮箱：[邮箱已隐藏]
- 邮件标题：应聘科研实习生-“学校”-“专业”-“年级”-“姓名”
- 邮件内容：
1. 简历 
2. 自己排名/专业保研人数（按照目前成绩和往年情况）
3. 项目经历（科研、比赛、实践等有深度参与的项目）
4. 自评专业知识（数据结构、机器学习、系统编程）情况（不必都擅长）
5. 当前研究兴趣方向（如有初步项目构想可自由简述）
6. 长期职业发展方向（如有意向可简述）
7. 在接下来半年中，每周可用于实习的时间预估
8. 性格描述（关于自我管理、人际交往、团队合作、情绪稳定等方面如实自评）
9. 其他补充性信息

我们欢迎有强烈自驱动能力的同学加入我们，心动不如行动，来信吧！ 需要了解更多信息，也可邮件咨询。无论是否录取，我们都会仔细查看，并认真回复邮件。注意，请在邮件正文中，按照顺序依次回答上述内容，否则将不会回复邮件。`,
	},
	{
		DisplayName:       `刺猬鸭`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 清华大学深研院袁春`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：清华大学深研院袁春。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 清华大学深研院袁春
---
清华大学深圳国际研究生院数信院袁春老师课题组，计算机视觉与机器学习（CVML）项目组招收研究型实习生，详情见:https://zhuanlan.zhihu.com/p/6179502796

### 课题组介绍：
袁春，清华大学教授、博士生导师、CCF 杰出会员、IEEE高级会员，清华大学－香港中文大学媒体科学、技术与系统联合研究中心常务副主任，清华大学深圳研究生院计算机应用技术实验室主任。1999年和2002年在清华大学计算机科学与技术系，人机交互及媒体集成研究所，分别获得硕士和工学博士学位，2003年至2004年在法国国家信息和自动化研究所（INRIA-Rocquencour）任博士后研究员，2014年7月-8月在CMU计算机科学学院机器学习系访问。已发表文章160多篇，CCF及清华计算机系A类论文70多篇，多次获得人工智能领域世界级赛事冠亚军。担任多个国际顶级期刊特约审稿人，包括：TMM，TIP，TNNLS，T-Cybernetics, TCSVT等，担任多个顶级机器学习和计算机视觉相关学术会议程序委员会委员或Session Chair，如NIPS，ICLR，CVPR，ACM MM, AAAI, IJCAI等。 课程教学：①《大数据机器学习》 ：中宣部“学习强国” 平台在线公开课，国家级精品课 ； ②《计算机视觉》：华为合作。Google scholar：https://scholar.google.com/citations?hl=en&user=fYdxi2sAAAAJ <br>
课题组成员：博士后1名，博士7名，硕士30余名。<br>
研究方向：计算机视觉、机器学习、强化学习。<br>
2024届毕业生去向： 博后（Stanford） , 国内外知名高校读博x3，腾讯微信，字节x2，快手，华为，美团，阿里等企业。<br>

### 课题组代表性成果
- 当噪声标签遇到长尾困境时:一种表示校准方法（Marr奖提名奖）。提出RCAL表示校准方法，解决数据标注错误及类别不平衡的问题。When Noisy Labels Meet Long Tail Dilemmas: A Representation Calibration Method, ICCV 2023
- 任务分组正则化:使用异构预训练模型的无数据元学习。提出任务分组正则化，通过分组和对齐相互冲突的任务来受益于模型的异质性。Yongxian Wei, Chun Yuan, et al., Task Groupings Regularization: Data-Free Meta-Learning with Heterogeneous Pre-trained Models, ICML 2024
- 可学习任务提示用于高质量的多功能图像填充。提出PowerPaint模型，使用可学习任务提示，在多个图像填充任务中取得SOTA。Junhao Zhuang, Chun Yuan, et al., A task is worth one word: Learning with task prompts for high-quality versatile image inpainting, ECCV 2024
- 针对特征差异的检测器特异性蒸馏。提出差异特征蒸馏，减少教师和学生特征图差异，实现更优蒸馏效果。Liu Kang, Chun Yuan, et al., DFD: Distilling the Feature Disparity Differently for Detectors, ICML 2024
- CVGEN: 高斯体素表达的文本到 3D 生成。提出GVGEN，实现从文本描述直接生成3D高斯分布，取得SOTA效果。Xianglong He, Chun Yuan, et al., GVGEN: Text-to-3d generation with volumetric representation, ECCV 2024

### 实习简介
- 本实习可提供的研究方向主要是计算机视觉、机器学习、强化学习，旨在为具有热情和探索精神的学生提供一个深入了解本课题组的科研机会。我们欢迎对计算机视觉、机器学习、强化学习感兴趣的同学参加。
- 期望申请者拥有扎实的计算机专业背景和良好的科研潜力，能够在实习期间积极参与并成功完成高质量、具有挑战性的科研任务。
- 本次实习可提供实习证明、若表现出色可申请科研补贴等奖励。
- 实习结束后，优秀的实习生还将有机会获得推荐信以及参与我们课题组未来的深度研究项目。优秀等实习生能够得到在保研、考研等方面的推荐，如清华夏令营、预推免等招生项目。

### 招生对象
- 年级：大三及以下
- 专业：计算机、软件工程等

### 考核流程
- 简历筛选
- 编程及项目能力考核

### 实习方式
远程实习

### 联系方式
- 邮箱：[邮箱已隐藏].edu.cn （张同学-24级）, [邮箱已隐藏].edu.cn（刘同学-24级）（同时发送）
- 标题：科研实习生-"姓名"-"学校"-"专业"-"年级" （如：科研实习生-张三-清华大学-计算机-大三）
- 邮件内容：
    1. 简历（一页即可）
    2. 科研兴趣方向
    3. 自我专业课程知识评价（如数据结构、操作系统、机器学习等，如实填写，不必都擅长）
    4. 项目经历（如有）
    5. 联系方式（微信号，手机号等）
    6. 其他任何想补充的信息`,
	},
	{
		DisplayName:       `灵动的企鹅酱`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 西工大无人院高山`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：西工大无人院高山。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 西工大无人院高山
---
**Ai方向招11月校内转博以及4月申博**

### 老师简介

高山，长聘副教授，博导。清华大学博士后，研究领域包括机器学习、人工智能等，主要针对计算机视觉，无人机视觉，新型传感技术等方面展开研究。主持国家创新项目4项、国家自然科学基金2项、博士后面上基金1项，参与多项关于计算机视觉，无人驾驶，智能感知等领域课题。获得过北京市优秀博士毕业生，中国科学院院长奖等奖励荣誉，德国弗劳恩霍夫协会访问学者。近年来，主讲本科生课程 2门：《新型计算机视觉与人工智能》、《机器学习与模型优化》，研究生课程1门《机器学习与模型优化》。

### 研究方向

计算机视觉，人工智能，深度学习，多模态

### 相关论文
1. Huafeng Chen, Dian Shao, Guangqian Guo, Shan Gao， Just a Hint: Point-Supervised Camouflaged Object Detection, ECCV, 2024 （Accept）
2. Huafeng Chen, Pengxu Wei, Guangqian Guo, Shan Gao， SAM-COD: SAM-guided Unified Framework for Weakly-Supervised Camouflaged Object Detection, ECCV, 2024 （Accept）
3. Guangqian Guo, Dian Shao, Chenguang Zhu, Sha Meng, Xuan Wang, Shan Gao， P2P: Transforming from Point Supervision to Explicit Visual Prompt for Object Detection and Segmentation, I.JCAI, 2024
4. Yan Di, C. Zhang, C. Wang, R. Zhang, G. Zhai, Y. Li, B. Fu, X. Ji, Shan Gao， ShapeMaker: Self-Supervised Joint Shape Canonicalization, Segmentation, Retrieval and Deformation, CVPR 2024.*
5. Chaowei Wang, D. Shao, G. Guo, C. Liu, and Shan Gao， Effective Rotate: Learning Rotation-robust Prototype for Aerial Object Detection, IEEE T-GRS, 2024.*
6. Sha Meng, D. Shao, J. Guo, Shan Gao， “Tracking without label: unsupervised mutiple object tracking via contrastive similarity leamning ”， IEEE ICCV 2023.
7. Guo G, Chen P, Han Z, Ye Q, Gao Shan， “Save the Tiny, Save the All: Hierarchical Activation Network for Tiny Object Detection” IEEE T-CSVT,2023.
8. Gao Shan, Guo G, Huang H, et al. Go Deep or Broad? Exploit Hybrid Network Architecture for Weakly Supervised Object Classification and Localization. IEEE T-NNLS,2023.

### 招生情况

硕士/博士招生:(计算机、人工智能、电子信息、软件工程等相关专业)人工智能/计算机视觉/机器学习/深度学习前沿算法：半/弱/无监督学习，小样本学习，小/隐藏/伪装/红外目标建模；AIGC生成式模型；新型动态视觉相机算法研究；无人机视觉技术等。

实验室与国内外多家科研机构、院所保持密切合作关系，课题组可提供充足的助研费、科研条件和良好的发展前景，支持学生国内外广泛交流学习与研究合作，优秀学生可推荐到国内外知名高校攻读博士学位，毕业学生较多选择到华为、阿里、腾讯、百度等国内互联网IT头部企业。欢迎各位学子积极加入。

### 招收专业

99G200 无人系统科学与技术

085410 人工智能

085510 机器人工程

简历投至：[邮箱已隐藏].cn`,
	},
	{
		DisplayName:       `布丁ii`,
		School:            `计算机保研`,
		MajorLine:         `保研/夏令营`,
		ArticleTitle:      `保研指南 | 西湖大学李子青`,
		LongBioPrefix:     csBaoyanLongBioPrefix,
		ShortBio:          `来自CS-BAOYAN Wiki的保研信息与指南：西湖大学李子青。`,
		Audience:          csBaoyanAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机保研和夏令营的问题。`,
		Education:         csBaoyanEducation,
		MajorLabel:        csBaoyanMajorLabel,
		KnowledgeCategory: csBaoyanKnowledgeCat,
		KnowledgeTags:     csBaoyanKnowledgeTags,
		SampleQuestions: []string{`保研夏令营怎么准备？`, `计算机保研面试考什么？`, `如何选导师？`},
		ExpertiseTags: []string{`保研`, `CS`, `夏令营`, `保研/夏令营`},
		Source: `CS-BAOYAN计算机保研`,
		KnowledgeBody: `---
title: 西湖大学李子青
---

### 导师简介

李子青（Stan Z. Li），西湖大学人工智能讲席教授，IEEE Fellow，曾任微软亚洲研究院lead
researcher、中科院自动化所模式识别国家重点实验室资深研究员。发表论文400+篇，著作9部，
Google Scholar他引71000+次、h指数143，World Scientist and University Rankings 2024计
算机学科中国区排名第2，[主页](https://www.westlake.edu.cn/faculty/stan-zq-li.html)。实验室
主要两大方向：（1）AI基础研究，包括图/序列/多模态表征学习、自监督学习、生成模型、预训练方
法。（2）Al for Science研究，包括Al+生命科学、Al+合成生物学，等。

### 研究内容
Center for Artificial Intelligence Research and Innovation （CAIRI） 实验室近期在以下研究方向
上有一定的研究基础，并在NeurIPS、ICLR、ICML等人工智能顶级会议上发表了若干论文：
- 多模态序列建模（多模态融合\\桥接、高效微调）
- 长序列建模（线性模型设计、层级化记忆模型）
- 面向干细胞治疗的单细胞数据分析（基因靶点发现、细胞状态控制、mRNA药物）
- 深度树生成（基于深度生成模型的细胞分化树、生物进化树生成）

### 岗位职责
- 协助科研团队开展本实验室在研的科研项目；
- 能力突出者可以协商安排独立负责的科研子项目。

### 招生要求
- 要求实习六个月及以上，可线上远程实习（线下访问名额有限）；
- 在人工智能会议/期刊上发表论文，或有完整人工智能、生物信息学等项目和竞赛经历者优先；
- 编程能力强、数学基础良好，且具备较好的英文读写能力；
- 熟悉Python语言和PyTorch框架；
- 对科研有强烈兴趣，工作积极主动；
- 具备实事求是的科研态度，和良好的沟通能力、团队协作精神。`,
	},
}
