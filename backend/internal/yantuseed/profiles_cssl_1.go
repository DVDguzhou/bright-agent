package yantuseed

const csslLongBioPrefix = `本文来自北大CS自学指南（cs-self-learning），著作权属原作者；以下为计算机课程推荐与学习路线分享。`

const (
	csslAudience       = `计算机相关专业学生或自学编程的同学，希望系统学习CS核心课程。`
	csslEducation      = `本科/硕士/自学（在读或规划中）`
	csslMajorLabel     = `计算机自学方向`
	csslKnowledgeCat   = `CS自学课程推荐`
)

var csslKnowledgeTags = []string{"计算机", "自学", "课程", "编程", "算法", "系统", "AI", "深度学习"}

var csslProfiles1 = []Profile{
	{
		DisplayName:       `番茄实习中`,
		School:            `CS自学指南`,
		MajorLine:         `计算机自学`,
		ArticleTitle:      `CS自学 | A Reference Guide for CS Learning`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：A Reference Guide for CS Learn。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `计算机自学`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# A Reference Guide for CS Learning

The field of computer science is vast and complex, with a seemingly endless sea of knowledge. Each specialized area can lead to limitless learning if pursued deeply. Therefore, a clear and definite study plan is very important. I've taken some detours in my years of self-study and finally distilled the following content for your reference.

Before you start learning, I highly recommend a popular science video series for beginners: [Crash Course: Computer Science](https://www.bilibili.com/video/BV1EW411u7th). In just 8 hours, it vividly and comprehensively covers various aspects of computer science: the history of computers, how computers operate, the important modules that make up a computer, key ideas in computer science, and so on. As its slogan says, *Computers are not magic!* I hope that after watching this video, everyone will have a holistic perception of computer science and embark on the detailed and in-depth learning content below with interest.

## Essential Tools

> As the saying goes: sharpening your axe will not delay your job of chopping wood. If you are a pure beginner in the world of computers, learning some tools will make you more efficient.

**Learn to ask questions**: You might be surprised that asking questions is the first one listed? I think in the open-source community, learning to ask questions is a very important ability. It involves two aspects. First, it indirectly cultivates your ability to solve problems independently, as the cycle of forming a question, describing it, getting answers from others, and then understanding the response is quite long. If you expect others to remotely assist you with every trivial issue, then the world of computers might not suit you. Second, if after trying, you still can't solve a problem, you can seek help from the open-source community. But at that point, how to concisely explain your situation and goal to others becomes particularly important. I recommend reading the article [How To Ask Questions The Smart Way](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/main/README-zh_CN.md), which not only increases the probability and efficiency of solving your problems but also keeps those who provide answers in the open-source community in a good mood.

**Learn to be a hacker**: [MIT-Missing-Semester](./编程入门/MIT-Missing-Semester.md) covers many useful tools for a hacker and provides detailed usage instructions. I strongly recommend beginners to study this course. However, one thing to note is that the course occasionally refers to terms related to the development process. Therefore, it is recommended to study it at least after completing an introductory computer science course.

**[GFW](./必学工具/翻墙.md)**: For well-known reasons, sites like Google and GitHub are not accessible in mainland China. However, in many cases, Google and StackOverflow can solve 99% of the problems encountered during development. Therefore, learning to use a VPN is almost an essential skill for a mainland CSer. (Considering legal issues, the methods provided in this book are only applicable to users with a Peking University email address).

**Command Line**: Proficiency in using the command line is often overlooked or considered difficult to master, but in reality, it greatly enhances your flexibility and productivity as an engineer. [The Art of Command Line](https://github.com/jlevy/the-art-of-command-line/blob/master/README-zh.md) is a classic tutorial that started as a question on Quora, but with the contribution of many experts, it has become a top GitHub project with over 100,000 stars, translated into dozens of languages. The tutorial is not long, and I highly recommend everyone to read it repeatedly and internalize it through practice. Also, mastering shell script programming should not be overlooked, and you can refer to this [tutorial](https://www.shellscript.sh/).

**IDE (Integrated Development Environment)**: Simply put, it's where you write your code. The importance of an IDE for a programmer goes without saying, but many IDEs are designed for large-scale projects and are quite bulky and overly feature-rich. Nowadays, some lightweight text editors with rich plugin ecosystems can basically meet the needs of daily lightweight programming. My personal favorites are VS Code and Sublime (the former has a very simple plugin configuration, while the latter is a bit more complex but aesthetically pleasing). Of course, for large projects, I would still use slightly heavier IDEs, such as Pycharm (Python), IDEA (Java), etc. (Disclaimer: all IDEs are the best in the world).

**[Vim](./必学工具/Vim.md)**: A command-line editor. Vim has a somewhat steep learning curve, but mastering it, I think, is very necessary because it will greatly improve your development efficiency. Most modern IDEs also support Vim plugins, allowing you to retain the coolness of a geek while enjoying a modern development environment.

**[Emacs](./必学工具/Emacs.md)**: A classic editor that stands alongside Vim, with equally high development efficiency and more powerful expandability. It can be configured as a lightweight editor or expanded into a custom IDE, and even more sophisticated tricks.

**[Git](./必学工具/Git.md)**: A version control tool for your project. Git, created by the father of Linux, Linus, is definitely one of the must-have tools for every CS student.

**[GitHub](./必学工具/GitHub.md)**: A code hosting platform based on Git. The world's largest open-source community and a gathering place for CS experts.

**[GNU Make](./必学工具/GNU_Make.md)**: An engineering build tool. Proficiency in GNU Make will help you develop a habit of modularizing your code and familiarize you with the compilation and linking processes of large projects.

**[CMake](./必学工具/CMake.md)**: A more powerful build tool than GNU Make, recommended for study after mastering GNU Make.

**[LaTex](./必学工具/LaTeX.md)**: <del>Pretentious</del> Paper typesetting tool.

**[Docker](./必学工具/Docker.md)**: A lighter-weight software packaging and deployment tool compared to virtual machines.

**[Practical Toolkit](./必学工具/tools.md)**: In addition to the tools mentioned above that are frequently used in development, I have also collected many practical and interesting free tools, such as download tools, design tools, learning websites, etc.

**[Thesis](./必学工具/thesis.md)**: Tutorial for writing graduation thesis in Word.

## Recommended Books

> I believe a good textbook should be people-oriented, rather than a display of technical jargon. It's certainly important to tell readers "what it is," but a better approach would be for the author to integrate decades of experience in the field into the book and narratively convey to the reader "why it is" and what should be done in the future.

[Link here](./好书推荐.md)

## Environment Setup

> What you think of as development — coding frantically in an IDE for hours.
>
> Actual development — setting up the environment for several days without starting to code.

### PC Environment Setup

If you are a Mac user, you're in luck, as this [guide](https://sourabhbajaj.com/mac-setup/) will walk you through setting up the entire development environment. If you are a Windows user, thanks to the efforts of the open-source community, you can enjoy a similar experience with [Scoop](./必学工具/Scoop.md).

Additionally, you can refer to an [environment setup guide][guide] inspired by [6.NULL MIT-Missing-Semester](./编程入门/MIT-Missing-Semester.md), focusing on terminal beautification. It also includes common software sources (such as GitHub, Anaconda, PyPI) for acceleration and replacement, as well as some IDE configuration and activation tutorials.

[guide]: https://taylover2016.github.io/%E6%96%B0%E6%9C%BA%E5%99%A8%E4%B8%8A%E6%89%8B%E6%8C%87%E5%8D%97%EF%BC%88%E6%96%B0%E6%89%8B%E5%90%91%EF%BC%89/index.html

### Server-Side Environment Setup

Server-side operation and maintenance require basic use of Linux (or other Unix-like systems) and fundamental concepts like processes, devices, networks, etc. Beginners can refer to the [Linux 101](https://101.lug.ustc.edu.cn/) online notes compiled by the Linux User Association of the University of Science and Technology of China. If you want to delve deeper into system operation and maintenance, you can refer to the [Aspects of System Administration](https://stevens.netmeister.org/615/) course.

Additionally, if you need to learn a specific concept or tool, I recommend a great GitHub project, [DevOps-Guide](https://github.com/Tikam02/DevOps-Guide), which covers a lot of foundational knowledge and tutorials in the administration field, such as Docker, Kubernetes, Linux, CI-CD, GitHub Actions, and more.

## Course Map

> As mentioned at the beginning of this chapter, this course map is merely a **reference guide** for course planning, from my perspective as an undergraduate nearing graduation. I am acutely aware that I neither have the right nor the capability to preach to others about “how one should learn”. Therefore, if you find any issues with the course categorization and selection below, I fully accept and deeply apologize for them. You can tailor your own course map in the next section [Customize Your Own Course Map](#yourmap).

Apart from courses labeled as *basic* or *introductory*, there is no explicit sequence in the following categories. As long as you meet the prerequisites for a course, you are free to choose any course according to your needs and interests.

### Mathematical Foundations

#### Calculus and Linear Algebra

As a freshman, mastering calculus and linear algebra is as important as learning to code. This point has been reiterated countless times by predecessors, but I feel compelled to emphasize it again: mastering calculus and linear algebra is really important! You might complain that these subjects are forgotten after exams, but I believe that indicates a lack of deep understanding of their essence. If you find the content taught in class to be obscure, consider referring to MIT’s [Calculus Course](./数学基础/MITmaths.md) and [18.06: Linear Algebra](./数学基础/MITLA.md) course notes. For me, they greatly deepened my understanding of the essence of calculus and linear algebra. Also, I highly recommend the maths YouTuber [**3Blue1Brown**](https://www.youtube.com/c/3blue1brown), whose channel features videos explaining the core of mathematics with vivid animations, offering both depth and breadth of high quality.

#### Introduction to Information Theory

For computer science students, gaining some foundational knowledge in information theory early on is beneficial. However, most information theory courses are targeted towards senior or even graduate students, making them quite inaccessible to beginners. MIT’s [6.050J: Information theory and Entropy](./数学基础/information.md) is tailored for freshmen, with almost no prerequisites, covering coding, compression, communication, information entropy, and more, which is very interesting.

### Advanced Mathematics

#### Discrete Mathematics and Probability Theory

Set theory, graph theory, and probability theory are essential tools for algorithm derivation and proof, as well as foundations for more advanced mathematical courses. However, the teaching of these subjects often falls into a rut of being overly theoretical and formalistic, turning classes into mere recitations of theorems and conclusions without helping students grasp the essence of these theories. If theory teaching can be interspersed with examples of algorithm application, students can expand their algorithm knowledge while appreciating the power and charm of theory.

[UCB CS70: Discrete Math and Probability Theory](./数学进阶/CS70.md) and [UCB CS126: Probability Theory](./数学进阶/CS126.md) are UC Berkeley’s probability courses. The former covers the basics of discrete mathematics and probability theory, while the latter delves into stochastic processes and more advanced theoretical content. Both emphasize the integration of theory and practice and feature abundant examples of algorithm application, with the latter including numerous Python programming assignments to apply probability theory to real-world problems.

#### Numerical Analysis

For computer science students, developing computational thinking is crucial. Modeling and discretizing real-world problems, and simulating and analyzing them on computers, are vital skills. Recently, the [Julia](https://julialang.org/) programming language, developed by MIT, has become popular in the field of numerical computation with its C-like speed and Python-friendly syntax. Many MIT mathematics courses have started using Julia as a teaching tool, presenting complex mathematical theories through clear and intuitive code.

[ComputationalThinking](https://computationalthinking.mit.edu/Spring21/) is an introductory course in computational thinking offered by MIT. All course materials are open source and accessible on the course website. Using the Julia programming language, the course covers image processing, social science and data science, and climatology modeling, helping students understand algorithms, mathematical modeling, data analysis, interactive design, and graph presentation. The course content, though not difficult, profoundly impressed me with the idea that the allure of science lies not in obscure theories or jargon but in presenting complex concepts through vivid examples and concise, deep language.

After completing this experience course, if you’re still eager for more, consider MIT’s [18.330: Introduction to Numerical Analysis](./数学进阶/numerical.md). This course also uses Julia for programming assignments but is more challenging and in-depth. It covers floating-point encoding, root finding, linear systems, differential equations, and more, with the main goal of using discrete computer representations to estimate and approximate continuous mathematical concepts. The course instructor has also written an accompanying open-source textbook, [Fundamentals of Numerical Computation](https://fncbook.github.io/fnc/frontmatter.html), which includes abundant Julia code examples and rigorous formula derivations.

If you’re still not satisfied, MIT’s graduate course in numerical analysis, [18.335: Introduction to Numerical Methods][18.335], is also available for reference.

[18.335]: https://ocw.mit.edu/courses/mathematics/18-335j-introduction-to-numerical-methods-spring-2019/index.htm

#### Differential Equations

Wouldn't it be cool if the motion and development of everything in the world could be described and depicted with equations? Although differential equations are not a mandatory part of any CS curriculum, I believe mastering them provides a new perspective to view the world.

Since differential equations often involve complex variable functions, you can refer to [MIT18.04: Complex Variables Functions][MIT18.04] course notes to fill in prerequisite knowledge.

[MIT18.04]: https://ocw.mit.e

...(内容较长，已截取前半部分)...`,
	},
	{
		DisplayName:       `番茄画水彩`,
		School:            `CS自学指南`,
		MajorLine:         `计算机自学`,
		ArticleTitle:      `CS自学 | 一个仅供参考的 CS 学习规划`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：一个仅供参考的 CS 学习规划。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `计算机自学`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# 一个仅供参考的 CS 学习规划

计算机领域方向庞杂，知识浩如烟海，每个细分领域如果深究下去都可以说学无止境。因此，一个清晰明确的学习规划是非常重要的。我在多年自学的尝试中也走过不少弯路，最终提炼出了下面的内容，供大家参考。

不过，在开始学习之前，先向小白们强烈推荐一个科普向系列视频 [Crash Course: Computer Science](https://www.bilibili.com/video/BV1EW411u7th)，在短短 8 个小时里非常生动且全面地科普了关于计算机科学的方方面面：计算机的历史、计算机是如何运作的、组成计算机的各个重要模块、计算机科学中的重要思想等等等等。正如它的口号所说的 *Computers are not magic!*，希望看完这个视频之后，大家能对计算机科学有个全貌性地感知，从而怀着兴趣去面对下面浩如烟海的更为细致且深入的学习内容。

## 必学工具

> 俗话说：磨刀不误砍柴工。如果你是一个刚刚接触计算机的24k纯小白，学会一些工具将会让你事半功倍。

学会提问：也许你会惊讶，提问也算计算机必备技能吗，还放在第一条？我觉得在开源社区中，学会提问是一项非常重要的能力，它包含两方面的事情。其一是会变相地培养你自主解决问题的能力，因为从形成问题、描述问题并发布、他人回答、最后再到理解回答这个周期是非常长的，如果遇到什么鸡毛蒜皮的事情都希望别人最好远程桌面手把手帮你完成，那计算机的世界基本与你无缘了。其二，如果真的经过尝试还无法解决，可以借助开源社区的帮助，但这时候如何通过简洁的文字让别人瞬间理解你的处境以及目的，就显得尤为重要。推荐阅读[提问的智慧](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/main/README-zh_CN.md)这篇文章，这不仅能提高你解决问题的概率和效率，也能让开源社区里无偿提供解答的人们拥有一个好心情。

[MIT-Missing-Semester](编程入门/MIT-Missing-Semester.md) 这门课覆盖了这些工具中绝大部分，而且有相当详细的使用指导，强烈建议小白学习。不过需要注意的一点是，在课程中会不时提到一些与开发流程相关的术语。因此推荐至少在学完计算机导论级别的课程之后进行学习。

[翻墙](必学工具/翻墙.md)：由于一些众所周知的原因，谷歌、GitHub 等网站在大陆无法访问。然而很多时候，谷歌和 StackOverflow 可以解决你在开发过程中遇到的 99% 的问题。因此，学会翻墙几乎是一个内地 CSer 的必备技能。（考虑到法律问题，这个文档提供的翻墙方式仅对拥有北大邮箱的用户适用）。

命令行：熟练使用命令行是一种常常被忽视，或被认为难以掌握的技能，但实际上，它会极大地提高你作为工程师的灵活性以及生产力。[命令行的艺术](https://github.com/jlevy/the-art-of-command-line/blob/master/README-zh.md)是一份非常经典的教程，它源于 Quora 的一个提问，但在各路大神的贡献努力下已经成为了一个 GitHub 十万 stars 的顶流项目，被翻译成了十几种语言。教程不长，非常建议大家反复通读，在实践中内化吸收。同时，掌握 Shell 脚本编程也是一项不容忽视的技术，可以参考这个[教程](https://www.shellscript.sh/)。

IDE (Integrated Development Environment)：集成开发环境，说白了就是你写代码的地方。作为一个码农，IDE 的重要性不言而喻，但由于很多 IDE 是为大型工程项目设计的，体量较大，功能也过于丰富。其实如今一些轻便的文本编辑器配合丰富的插件生态基本可以满足日常的轻量编程需求。个人常用的编辑器是 VS Code 和 Sublime（前者的插件配置非常简单，后者略显复杂但颜值很高）。当然对于大型项目我还是会采用略重型的 IDE，例如 Pycharm (Python)，IDEA (Java) 等等（免责申明：所有的 IDE 都是世界上最好的 IDE）。

[Vim](必学工具/Vim.md)：一款命令行编辑工具。这是一个学习曲线有些陡峭的编辑器，不过学会它我觉得是非常有必要的，因为它将极大地提高你的开发效率。现在绝大多数 IDE 也都支持 Vim 插件，让你在享受现代开发环境的同时保留极客的炫酷（yue）。

[Emacs](必学工具/Emacs.md)：与 Vim 齐名的经典编辑器，同样具有极高的开发效率，同时具有更为强大的扩展性，它既可以配置为一个轻量编辑器，也可以扩展成一个个人定制的 IDE，甚至可以有更多奇技淫巧。

[Git](必学工具/Git.md)：一款代码版本控制工具。Git的学习曲线可能更为陡峭，但出自 Linux 之父 Linus 之手的 Git 绝对是每个学 CS 的童鞋必须掌握的神器之一。

[GitHub](必学工具/GitHub.md)：基于 Git 的代码托管平台。全世界最大的代码开源社区，大佬集聚地。

[GNU Make](必学工具/GNU_Make.md)：一款工程构建工具。善用 GNU Make 会让你养成代码模块化的习惯，同时也能让你熟悉一些大型工程的编译链接流程。

[CMake](必学工具/CMake.md)：一款功能比 GNU Make 更为强大的构建工具，建议掌握 GNU Make 之后再加以学习。

[LaTeX](必学工具/LaTeX.md)：<del>逼格提升</del> 论文排版工具。

[Docker](必学工具/Docker.md)：一款相较于虚拟机更轻量级的软件打包与环境部署工具。

[实用工具箱](必学工具/tools.md)：除了上面提到的这些在开发中使用频率极高的工具之外，我还收集了很多实用有趣的免费工具，例如一些下载工具、设计工具、学习网站等等。

[Thesis](必学工具/thesis.md)：毕业论文 Word 写作教程。

## 好书推荐

> 私以为一本好的教材应当是以人为本的，而不是炫技式的理论堆砌。告诉读者“是什么”固然重要，但更好的应当是教材作者将其在这个领域深耕几十年的经验融汇进书中，向读者娓娓道来“为什么”以及未来应该“怎么做”。

[链接戳这里](./好书推荐.md)

## 环境配置

> 你以为的开发 —— 在 IDE 里疯狂码代码数小时。
>
> 实际上的开发 —— 配环境配几天还没开始写代码。

### PC 端环境配置

如果你是 Mac 用户，那么你很幸运，这份[指南](https://sourabhbajaj.com/mac-setup/) 将会手把手地带你搭建起整套开发环境。如果你是 Windows 用户，在开源社区的努力下，你同样可以获得与其他平台类似的体验：[Scoop](必学工具/Scoop.md)。

另外大家可以参考一份灵感来自 [6.NULL MIT-Missing-Semester](编程入门/MIT-Missing-Semester.md) 的 [环境配置指南][guide]，重点在于终端的美化配置。此外还包括常用软件源（如 GitHub, Anaconda, PyPI 等）的加速与替换以及一些 IDE 的配置与激活教程。

[guide]: https://taylover2016.github.io/%E6%96%B0%E6%9C%BA%E5%99%A8%E4%B8%8A%E6%89%8B%E6%8C%87%E5%8D%97%EF%BC%88%E6%96%B0%E6%89%8B%E5%90%91%EF%BC%89/index.html

### 服务器端环境配置

服务器端的运维需要掌握 Linux（或者其他类 Unix 系统）的基本使用以及进程、设备、网络等系统相关的基本概念，小白可以参考中国科学技术大学 Linux 用户协会编写的[《Linux 101》在线讲义](https://101.lug.ustc.edu.cn/)。如果想深入学习系统运维相关的知识，可以参考 [Aspects of System Administration](https://stevens.netmeister.org/615/) 这门课程。

另外，如果需要学习某个具体的概念或工具，推荐一个非常不错的 GitHub 项目 [DevOps-Guide](https://github.com/Tikam02/DevOps-Guide)，其中涵盖了非常多的运维方面的基础知识和教程，例如 Docker, Kubernetes, Linux, CI-CD, GitHub Actions 等等。

## 课程地图

> 正如这章开头提到的，这份课程地图仅仅是一个**仅供参考**的课程规划，我作为一个临近毕业的本科生。深感自己没有权利也没有能力向别人宣扬“应该怎么学”。因此如果你觉得以下的课程分类与选择有不合理之处，我全盘接受，并深感抱歉。你可以在下一节[定制属于你的课程地图](#yourmap)

以下课程类别中除了含有 *基础* 和 *入门* 字眼的以外，并无明确的先后次序，大家只要满足某个课程的先修要求，完全可以根据自己的需要和喜好选择想要学习的课程。

### 数学基础

#### 微积分与线性代数

作为大一新生，学好微积分线代是和写代码至少同等重要的事情，相信已经有无数的前人经验提到过这一点，但我还是要不厌其烦地再强调一遍：学好微积分线代真的很重要！你也许会吐槽这些东西岂不是考完就忘，那我觉得你是并没有把握住它们本质，对它们的理解还没有达到刻骨铭心的程度。如果觉得老师课上讲的内容晦涩难懂，不妨参考 MIT 的 [Calculus Course](./数学基础/MITmaths.md) 和 [18.06: Linear Algebra](./数学基础/MITLA.md) 的课程 notes，至少于我而言，它帮助我深刻理解了微积分和线性代数的许多本质。顺道再安利一个油管数学网红 [**3Blue1Brown**](https://www.youtube.com/c/3blue1brown)，他的频道有很多用生动形象的动画阐释数学本质内核的视频，兼具深度和广度，质量非常高。

#### 信息论入门

作为计算机系的学生，及早了解一些信息论的基础知识，我觉得是大有裨益的。但大多信息论课程都面向高年级本科生甚至研究生，对新手极不友好。而 MIT 的 [6.050J: Information theory and Entropy](./数学基础/information.md) 这门课正是为大一新生量身定制的，几乎没有先修要求，涵盖了编码、压缩、通信、信息熵等等内容，非常有趣。

### 数学进阶

#### 离散数学与概率论

集合论、图论、概率论等等是算法推导与证明的重要工具，也是后续高阶数学课程的基础。但我觉得这类课程的讲授很容易落入理论化与形式化的窠臼，让课堂成为定理结论的堆砌，而无法使学生深刻把握理论的本质，进而造成学了就背，考了就忘的怪圈。如果能在理论教学中穿插算法运用实例，学生在拓展算法知识的同时也能窥见理论的力量和魅力。

[UCB CS70 : discrete Math and probability theory](./数学进阶/CS70.md) 和 [UCB CS126 : Probability theory](./数学进阶/CS126.md) 是 UC Berkeley 的概率论课程，前者覆盖了离散数学和概率论基础，后者则涉及随机过程以及深入的理论内容。两者都非常注重理论和实践的结合，有丰富的算法实际运用实例，后者还有大量的 Python 编程作业来让学生运用概率论的知识解决实际问题。

#### 数值分析

作为计算机系的学生，培养计算思维是很重要的，实际问题的建模、离散化，计算机的模拟、分析，是一项很重要的能力。而这两年开始风靡的，由 MIT 打造的 [Julia](https://julialang.org/) 编程语言以其 C 一样的速度和 Python 一样友好的语法在数值计算领域有一统天下之势，MIT 的许多数学课程也开始用 Julia 作为教学工具，把艰深的数学理论用直观清晰的代码展示出来。

[ComputationalThinking](https://computationalthinking.mit.edu/Spring21/) 是 MIT 开设的一门计算思维入门课，所有课程内容全部开源，可以在课程网站直接访问。这门课利用 Julia 编程语言，在图像处理、社会科学与数据科学、气候学建模三个 topic 下带领学生理解算法、数学建模、数据分析、交互设计、图例展示，让学生体验计算与科学的美妙结合。内容虽然不难，但给我最深刻的感受就是，科学的魅力并不是故弄玄虚的艰深理论，不是诘屈聱牙的术语行话，而是用直观生动的案例，用简练深刻的语言，让每个普通人都能理解。

上完上面的体验课之后，如果意犹未尽的话，不妨试试 MIT 的 [18.330 : Introduction to numerical analysis](./数学进阶/numerical.md)，这门课的编程作业同样会用 Julia 编程语言，不过难度和深度上都上了一个台阶。内容涉及了浮点编码、Root finding、线性系统、微分方程等等方面，整门课的主旨就是让你利用离散化的计算机表示去估计和逼近一个数学上连续的概念。这门课的教授还专门撰写了一本配套的开源教材 [Fundamentals of Numerical Computation](https://fncbook.github.io/fnc/frontmatter.html)，里面附有丰富的 Julia 代码实例和严谨的公式推导。

如果你还意犹未尽的话，还有 MIT 的数值分析研究生课程 [18.335: Introduction to numerical method][18.335] 供你参考。

[18.335]: https://ocw.mit.edu/courses/mathematics/18-335j-introduction-to-numerical-methods-spring-2019/index.htm

#### 微分方程

如果世间万物的运动发展都能用方程来刻画和描述，这是一件多么酷的事情呀！虽然几乎任何一所学校的 CS 培养方案中都没有微分方程相关的必修课程，但我还是觉得掌握它会赋予你一个新的视角来审视这个世界。

由于微分方程中往往会用到很多复变函数的知识，所以大家可以参考 [MIT18.04: Complex variables functions][MIT18.04] 的课程 notes 来补齐先修知识。

[MIT18.04]: https://ocw.mit.edu/courses/mathematics/18-04-complex-variables-with-applications-spring-2018/

[MIT18.03: differential equations][MIT18.03] 主要覆盖了常微分方程的求解，在此基础之上 [MIT18.152: Partial differential equations][MIT18.152] 则会深入偏微分方程的建模与求解。掌握了微分方程这一有力工具，相信对于你的实际问题的建模能力以及从众多噪声变量中把握本质的直觉都会有很大帮助。

[MIT18.03]: https://ocw.mit.edu/courses/mathematics/18-03sc-differential-equations-fall-2011/unit-i-first-order-differential-equations/
[MIT18.152]: https://ocw.mit.edu/courses/mathematics/18-152-introduction-to-partial-differential-equations-fall-2011/index.htm

### 数学高阶

作为计算机系的学生，我经常听到数学无用论的论断，对此我不敢苟同但也无权反对，但若凡事都硬要争出个有用和无用的区别来，倒也着实无趣，因此下面这些面向高年级甚至研究生的数学课程，大家按兴趣自取所需。

#### 凸优化

[Standford EE364A: Convex Optimization](./数学进阶/convex.md)

#### 信息论

[MIT6.441: Information Theory](https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-441-information-theory-spring-2016/syllabus/)

#### 应用统计学

[MIT18.650: Statistics for Applications](https://ocw.mit.edu/courses/mathematics/18-443-statistics-for-applications-spring-2015/index.htm)

#### 初等数论

[MIT18.781: Theory of Numbers](https://ocw.mit.edu/courses/mathematics/18-781-theory-of-numbers-spring-2012/index.htm)

#### 密码学

[Standford CS255: Cryptography](http://crypto.stanford.edu/~dabo/cs255/)

### 编程入门

> Languages are tools, you choose the right tool to do the right thing. Since there's no universally perfect tool, there's no universally perfect language.

#### General

- [MIT-Missing-Semester](编程入门/MIT-Missing-Semester.md)
- [Harvard CS50: This is CS50x](编程入门/C/CS50.md)

#### Java

- [MIT 6.092: Introduction To Programming In Java](编程入门/Java/MIT%206.092.md)

#### Python

- [CS50P: CS50's Introduction to Programming with Python](编程入门/Python/CS50P.md)
- [UCB CS61A: Structure and Interpretation of Computer Programs](编程入门/Python/CS61A.md)
- [MIT6.100L: Introduction to CS and Programming using Python](编程入门/Python/MIT6.100L.md)

#### C++

- [Stanford CS106B/X: Programming Abstractions](编程入门/cpp/CS106B_CS106X.md)
- [Stanford CS106L: Standard C++ Programming](编程入门/cpp/CS106L.md)

#### Rust

- [Stanford CS110L: Safety in Systems Programming](编程入门/Rust/CS110L.md)

#### OCaml

- [Cornell CS3110: OCaml Programming Correct + Efficient + Beautiful](编程入门/Functional/CS3110.md)

### 电子基础

#### 电路基础

作为计算机系的学生，了解一些基础的电路知识，感受从传感器收集数据到数据分析再到算法预测整条流水线，对于后续知识的学习以及计算思维的培养还是很有帮助的。[EE16A&B: Designing Information Devices and Systems I&II](./电子基础/EE16.md) 是伯克利 EE 学生的大一入门课，其中 EE16A 注重通过电路从实际环境中收集和分析数据，而 EE16B 则侧重从这些收集到的数据进行分析并做出预测行为。

#### 信号与系统

信号与系统是一门我觉得非常值得一上的课，最初学它只是为了满足我对傅里叶变换的好奇，但学完之后我才不禁感叹，傅立叶变换给我提供了一个全新的视角去看待这个世界，就如同微分方程一样，让你沉浸在用数学去精确描绘和刻画这个世界的优雅与神奇之中。

[MIT 6.003: signal and systems][MIT6.003] 提供了全部的课程录影、书面作业以及答案。也可以去看这门课的[远古版本](电子基础/Signals_and_Systems_AVO.md)

[MIT6.003]: https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-003-signals-and-systems-fall-2011/lecture-videos/lecture-1-signals-and-systems/

而 [UCB EE120: Signal and Systems](电子基础/signal.md) 关于傅立叶变换的 notes 写得非常好，并且提供了6 个非常有趣的 Python 编程作业，让你实践中运用信号与系统的理论与算法。

### 数据结构与算法

算法是计算机科学的核心，也是几乎一切专业课程的基础。如何将实际问题通过数学抽象转化为算法问题，并选用合适的数据结构在时间和内存大小的限制下将其解决是算法课的永恒主题。如果你受够了老师的照本宣科，那么我强烈推荐伯克利的 [UCB CS61B: Data Structures and Algorithms](数据结构与算法/CS61B.md) 和普林斯顿的 [Coursera: Algorithms I & II](数据结构与算法/Algo.md)，这两门课的都讲得深入浅出并且会有丰富且有趣的编程实验将理论与知识结合起来。

以上两门课程都是基于 Java 语言，如果你想学习 C/C++ 描述的版本，可以参考斯坦福的数据结构与基础算法课程 [Stanford CS106B/X: Programming Abstractions](编程入门/cpp/CS106B_CS106X.md)。偏好 Python 的同学可以学习 MIT 的算法入门课 [MIT 6.006: Introduction to Algorithms](数据结构与算法/6.006.md)

对一些更高级的算法以及 NP 问题感兴趣的同学可以学习伯克利的算法设计与分析课程 [UCB CS170: Efficient Algorithms and Intractable Problems](数据结构与算法/CS170.md) 或者 MIT 的高阶算法 [MIT 6.046: Design and Analysis of Algorithms](数据结构与算法/6.046.md)。

### 软件工程

#### 入门课

一份“能跑”的代码，和一份高质量的工业级代码是有本质区别的。因此我非常推荐低年级的同学学习一下 [MIT 6.031: Software Construction](软件工程/6031.md) 这门课，它会以 Java 语言为基础，以丰富细致的阅读材料和精心设计的编程练习传授如何编写**不易出 bug、简明易懂、易于维护修改**的高质量代码。大到宏观数据结构设计，小到如何写注释，遵循这些前人总结的细节和经验，对于你此后的编程生涯大有裨益。

#### 专业课

当然，如果你想系统性地上一门软件工程的课程，那我推荐的是伯克利的 [UCB CS169: software engineering](软件工程/CS169.md)。但需要提醒的是，和大多学校（包括贵校）的软件工程课程不同，这门课不会涉及传统的 **design and document** 模式，即强调各种类图、流程图及文档设计，而是采用近些年流行起来的小团队快速迭代 **Agile Develepment** 开发模式以及利用云平台的 **Software as a service** 服务模式。

### 体系结构

#### 入门课

从小我就一直听说，计算机的世界是由 01 构成的，我不理解但大受震撼。如果你的内心也怀有这份好奇，不妨花一到两个月的时间学习 [Coursera: Nand2Tetris](体系结构/N2T.md) 这门无门槛的计算机课程。这门麻雀虽小五脏俱全的课程会从 01 开始让你亲手造出一台计算机，并在上面运行俄罗斯方块小游戏。一门课里涵盖了编译、虚拟机、汇编、体系结构、数字电路、逻辑门等等从上至下、从软至硬的各类知识，非常全面。难度上也是通过精心的设计，略去了众多现代计算机复杂的细节，提取出了最核心本质的东西，力图让每个人都能理解。在低年级，如果就能从宏观上建立对整个计算机体系的鸟瞰图，是大有裨益的。

#### 专业课

当然，如果想深入现代计算机体系结构的复杂细节，还得上一门大学本科难度的课程 [UCB CS61C: Great Ideas in Computer Architecture](体系结构/CS61C.md)。UC Berkeley 作为 RISC-V 架构的发源地，在体系结构领域算得上首屈一指。其课程非常注重实践，你会在 Project 中手写汇编构造神经网络，从零开始搭建一个 CPU，这些实践都会让你对计算机体系结构有更为深入的理解，而不是仅停留于“取指译码执行访存写回”的单调背诵里。

### 系统入门

计算机系统是一个庞杂而深刻的主题，在深入学习某个细分领域之前，对各个领域有一个宏观概念性的理解，对一些通用性的设计原则有所知晓，会让你在之后的深入学习中不断强化一些最为核心乃至哲学的概念，而不会桎梏于复杂的内部细节和各种 trick。因为在我看来，学习系统最关键的还是想让你领悟到这些最核心的东西，从而能够设计和实现出属于自己的系统。

[MIT6.033: System Engineering](http://web.mit.edu/6.033/www/) 是 MIT 的系统入门课，主题涉及了操作系统、网络、分布式和系统安全，除了知识点的传授外，这门课还会讲授一些写作和表达上的技巧，让你学会如何设计并向别人介绍和分析自己的系统。这本书配套的教材 *Principles of Computer System Design: An Introduction* 也写得非常好，推荐大家阅读。

[CMU 15-213: Introduction to Computer System](计算机系统基础/CSAPP.md) 是 CMU 的系统入门课，内容覆盖了体系结构、操作系统、链接、并行、网络等等，兼具广度和深度，配套的教材 *Computer Systems: A Programmer's Perspective* 也是质量极高，强烈建议阅读。

### 操作系统

> 没有什么能比自己写个内核更能加深对操作系统的理解了。

操作系统作为各类纷繁复杂的底层硬件虚拟化出一套规范优雅的抽象，给所有应用软件提供丰富的功能支持。了解操作系统的设计原则和内部原理对于一个不满足于当调包侠的程序员来说是大有裨益的。出于对操作系统的热爱，我上过国内外很多操作系统课程，它们各有侧重和优劣，大家可以根据兴趣各取所需。

[MIT 6.S081: Operating System Engineering](操作系统/MIT6.S081.md)，MIT 著名 PDOS 实验室出品，11 个 Project 让你在一个实现非常优雅的类Unix操作系统xv6上增加各类功能模块。这门课也让我深刻认识到，做系统不是靠 PPT 念出来的，是得几万行代码一点点累起来的。

[UCB CS162: Operating System](操作系统/CS162.md)，伯克利的操作系统课，采用和 Stanford 同样的 Project —— 一个教学用操作系统 Pintos。我作为北京大学2022年和2023年春季学期操作系统实验班的助教，引入并改善了这个 Project，课程资源也会全部开源，具体参见[课程网站](https://pku-os.github.io)。

[NJU: Operating System Design and Implementation](操作系统/NJUOS.md)，南京大学的蒋炎岩老师开设的操作系统课程。蒋老师以其独到的系统视角结合丰富的代码示例将众多操作系统的概念讲得深入浅出，此外这门课的全部课程内容都是中文的，非常方便大家学习。

[HIT OS: Operating System](操作系统/HITOS.md)，哈尔滨工业大学的李治军老师开设的中文操作系统课程。李老师的课程基于 Linux 0.11 源码，十分注重代码实践，并站在学生视角将操作系统的来龙去脉娓娓道来。

### 并行与分布式系统

想必这两年各类 CS 讲座里最常听到的话就是“摩尔定律正在走向终结”，此话不假，当单核能力达到上限时，多核乃至众核架构如日中天。硬件的变化带来的是上层编程逻辑的适应与改变，要想充分利用硬件性能，编写并行程序几乎成了程序员的必备技能。与此同时，深度学习的兴起对计算机算力与存储的要求都达到了前所未有的高度，大规模集群的部署和优化也成为热门技术话题。

#### 并行计算

[CMU 15-418/Stanford CS149: Parallel Computing](并行与分布式系统/CS149.md) 会带你深入理解现代并行计算架构的设计原则与必要权衡，并学会如何充分利用硬件资源以及软件编程框架（例如 CUDA，MPI，OpenMP 等）编写高性能的并行程序。

#### 分布式系统

[MIT 6.824: Distributed System](并行与分布式系统/MIT6.824.md) 和 MIT 6.S081 一样，出品自 MIT 大名鼎鼎的 PDOS 实验室，授课老师 Robert Morris 教授曾是一位顶尖黑客，世界上第一个蠕虫病毒 Morris 病毒就是出自他之手。这门课每节课都会精读一篇分布式系统领域的经典论文，并由此传授分布式系统设计与实现的重要原则和关键技术。同时其课程 Project 也是以难度之大而闻名遐迩，4 个编程作业循序渐进带你实现一个基于 Raft 共识算法的 KV-store 框架，让你在痛苦的 debug 中体会并行与分布式带来的随机性和复杂性。

### 系统安全

不知道你当年选择计算机是不是因为怀着一个中二的黑客梦想，但现实却是成为黑客道阻且长。

#### 理论课程

[UCB CS161: Computer Security](系统安全/CS161.md) 是伯克利的系统安全课程，会涵盖栈攻击、密码学、网站安全、网络安全等等内容。

[SU SEED Labs](系统安全/SEEDLabs.md) 是雪城大学的网安课程，由 NSF 提供130万美元的资金支持，为网安教育开发了动手实践性的实验练习（称为 SEED Lab）。课程理论教学和动手实践并重，包含详细的开源讲义、视频教程、教科书（被印刷为多种语言）、开箱即用的基于虚拟机和 docker 的攻防环境等。目前全球有1050家研究机构在使用该项目。涵盖计算机和信息安全领域的广泛主题，包括软件安全、网络安全、Web 安全、操作系统安全和移动应用安全。

#### CTF 实践

掌握这些理论知识之后，还需要在实践中培养和锻炼这些“黑客素养”。[CTF 夺旗赛](https://ctf-wiki.org/)是一项比较热门的系统安全比赛，赛题中会融会贯通地考察你对计算机各个领域知识的理解和运用。北大每年会举办[相关赛事](https://geekgame.pku.edu.cn/)，鼓励大家踊跃参与，在实践中提高自己。下面列举一些我平时学习（摸鱼）用到的资源：

- [CTF-wiki](https://ctf-wiki.org/)
- [CTF-101](https://ctf101.org/)
- [Hacker-101](https://ctf.hacker101.com/)

### 计算机网络

> 没有什么能比自己写个 TCP/IP 协议栈更能加深对计算机网络的理解了。

大名鼎鼎的 [Stanford CS144: Computer Network](计算机网络/CS144.md)，8 个 Project 带你实现整个 TCP/IP 协议栈。

如果你只是想在理论上对计算机网络有所了解，那么推荐阅读 [UCB CS168](计算机网络/CS168.md) 这门课程配套的[教材](https://textbook.cs168.io/)。

### 数据库系统

> 没有什么能比自己写个关系型数据库更能加深对数据库系统的理解了。

CMU 的著名数据库神课 [CMU 15-445: Introduction to Database System](数据库系统/15445.md) 会通过 4 个 Project 带你为一个用于教学的关系型数据库 [bustub](https://github.com/cmu-db/bustub) 添加各种功能。实验的评测框架也免费开源了，非常适合大家自学。此外课程实验会用到 C++11 的众多新特性，也是一个锻炼 C++ 代码能力的好机会。

Berkeley 作为著名开源数据库 postgres 的发源地也不遑多让，[UCB CS186: Introduction to Database System](数据库系统/CS186.md) 会让你用 Java 语言实现一个支持 SQL 并发查询、B+ 树索引和故障恢复的关系型数据库。

### 编译原理

> 没有什么能比自己写个编译器更能加深对编译器的理解了。

理论学习推荐阅读大名鼎鼎的《龙书》。当然动手实践才是掌握编译原理最好的方式，推荐[北京大学编译原理实践](./编译原理/PKU-Compilers.md)课程，丰富的实验配套和循序渐进的文档带你实现一个类C语言到 RISC-V 汇编的编译器。当然编译原理课程目录下也有众多其他优质实验供你选择。

### Web 开发

前后端开发很少在计算机的培养方案里被重视，但其实掌握这项技能还是好处多多的，例如搭建自己的个人主页，抑或是给自己的课程项目做一个精彩的展示网页。如果你只是想两周速成，那么推荐 [MIT web development course](Web开发/mitweb.md)。如果想系统学习，推荐 [Stanford CS142: Web Applications](Web开发/CS142.md)。

### 计算机图形学

我本人对计算机图形学了解不多，这里收录了一些社区推荐的优质课程供大家选择：

- [Stanford CS148](计算机图形学/CS148.md)
- [Game

...(内容较长，已截取前半部分)...`,
	},
	{
		DisplayName:       `暖暖的年糕吖`,
		School:            `CS自学指南`,
		MajorLine:         `计算机自学`,
		ArticleTitle:      `CS自学 | Foreword`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Foreword。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `计算机自学`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `<figure markdown>
  { width="600" }
</figure>

# **Foreword**

This is a self-learning guide to computer science, and a memento of my three years of self-learning at university.

It is also a gift to the young students at Peking University. It would be a great encouragement and comfort to me if this book could be of even the slightest help to you in your college life.

The book is currently organized to include the following sections (if you have other good suggestions, or would like to join the ranks of contributors, please feel free to email [[邮箱已隐藏].cn](mailto:[邮箱已隐藏].cn) or ask questions in the issue).

- User guide for this book: Given the numerous resources covered in this book, I have developed corresponding usage guides based on different people's free time and learning objectives.
- A reference CS learning plan: This is a comprehensive and systematic CS self-learning plan that I have formulated based on my own self-study experience.
- Productivity Toolkit: IDE, VPN, StackOverflow, Git, Github, Vim, Latex, GNU Make and so on.
- Book recommendations: Those who have read the CSAPP must have realized the importance of good books. I will list links to books and resources in different areas of Computer Science that I find rewarding to read.
- **List of high quality CS courses**: I will summarize all the high quality foreign CS courses I have taken and the community contributed into different categories and give relevant self-learning advice. Most of them will have a separate repository containing relevant resources as well as the homework/project implementations.

## **The place where dreams start —— CS61A**

In my freshman year, I was a novice who knew nothing about computers. I installed a giant IDE Visual Studio and fight with OJ every day. With my high school maths background, I did pretty well in maths courses, but I felt struggled to learn courses in my major. When it came to programming, all I could do was open up that clunky IDE, create a new project that I didn't know exactly what it was for, and then ` + "`" + `cin` + "`" + `, ` + "`" + `cout` + "`" + `, ` + "`" + `for` + "`" + ` loops, and then CE, RE, WA loops. I was in a state where I was desperately trying to learn well but I didn't know how to learn. I listened carefully in class but I couldn't solve the homework problems. I spent almost all my spare time doing the homework after class, but the results were disappointing. I still retain the source code of the project for Introduction to Computing course —— a single 1200-line C++ file with no header files, no class abstraction, no unit tests, no makefile, no version control. The only good thing is that it can run, the disadvantage is the complement of "can run". For a while I wondered if I wasn't cut out for computer science, as all my childhood imaginings of geekiness had been completely ruined by my first semester's experience.

It all turned around during the winter break of my freshman year, when I had a hankering to learn Python. I overheard someone recommend CS61A, a freshman introductory course at UC Berkeley on Python. I'll never forget that day, when I opened the [CS61A](https://cs61a.org/) course website. It was like Columbus discovering a new continent, and I opened the door to a new world.

I finished the course in 3 weeks and for the first time I felt that CS could be so fulfilling and interesting, and I was shocked that there existed such a great course in the world.

To avoid any suspicion of pandering to foreign courses, I will tell you about my experience of studying CS61A from the perspective of a pure student.

- ***Course website developed by course staffs***: The course website integrates all the course resources into one, with a well organised course schedule, links to all slides, recorded videos and homework, detailed and clear syllabus, list of exams and solutions from previous years. Aesthetics aside, this website is so convenient for students.

- ***Textbook written by course instructor***: The course instructor has adapted the classic MIT textbook *Structure and Interpretation of Computer Programs* (SICP) into Python (the original textbook was based on Scheme). This is a great way to ensure that the classroom content is consistent with the textbook, while adding more details. The entire book is open source and can be read directly online.

- ***Various, comprehensive and interesting homework***: There are 14 labs to reinforce the knowledge gained in class, 10 homework assignments to practice, and 4 projects each with thousands of lines of code, all with well-organized skeleton code and babysitting instructions. Unlike the old-school OJ and Word document assignments, each lab/homework/project has a detailed handout document, fully automated grading scripts, and CS61A staffs have even developed an [automated assignment submission and grading system](https://okpy.org/). Of course, one might say "How much can you learn from a project where most of code are written by your teaching assistants?" . For someone who is new to CS and even stumbling over installing Python, this well-developed skeleton code allows students to focus on reinforcing the core knowledge they've learned in class, but also gives them a sense of achievement that they already can make a little game despite of learning Python only for a month. It also gives them the opportunity to read and learn from other people's high quality code so that they can reuse it later. I think in the freshman year, this kind of skeleton code is absolutely beneficial. The only bad thing perhaps is for the instructors and teaching assistants, as developing such assignments can conceivably require a considerable time commitment.

- ***Weekly discussion sessions***: The teaching assistants will explain the difficult knowledge in class and add some supplementary materials which may not be covered in class. Also, there will be exercises from exams of previous years. All the exercises are written in LaTeX with solutions.

In CS61A, You don't need any prerequesites about CS at all. You just need to pay attention, spend time and work hard. The feeling that you do not know what to do, that you are not getting anything in return for all the time you put in, is gone. It suited me so well that I fell in love with self-learning.

Imagine that if someone could chew up the hard knowledge and present it to you in a vivid and straightforward way, with so many fancy and varied projects to reinforce your theoretical knowledge, you'd think they were really trying their best to make you fully grasp the course, and it was even an insult to the course builders not to learn it well.

If you think I'm exaggerating, start with [CS61A](https://cs61a.org/), because it's where my dreams began.

## **Why write this book?**

In the 2020 Fall semester, I worked as a teaching assistant for the class "Introduction to Computer Systems" at Peking University. At that time, I had been studying totally on my own for over a year. I enjoyed this style of learning immensely. To share this joy, I have made a [CS Self-learning Materials List](https://github.com/PKUFlyingPig/Self-learning-Computer-Science) for students in my seminar. It was purely on a whim at the time, as I wouldn't dare to encourage my students to skip classes and study on their own.

But after another year of maintenance, the list has become quite comprehensive, covering most of the courses in Computer Science, Artificial Intelligence and Soft Engineering, and I have built separate repositories for each course, summarising the self-learning materials that I used.

In my last college year, when I opened up my curriculum book, I realized that it was already a subset of my self-learning list. By then, it was only two and a half years after I had started my self-learning journey. Then, a bold idea came to my mind: perhaps I could create a self-learning book, write down the difficulty I encountered and the interest I found during these years of self-learning, hoping to make it easy for students who may also enjoy self-learning to start their wonderful self-learning journey.

If you can build up the whole CS foundation in less than three years, have relatively solid mathematical skills and coding ability, experience dozens of projects with thousands of lines of code, master at least C/C++/Java/JS/Python/Go/Rust and other mainstream programming languages, have a good understanding of algorithms, circuits, architectures, networks, operating systems, compilers, artificial intelligence, machine learning, computer vision, natural language processing, reinforcement learning, cryptography, information theory, game theory, numerical analysis, statistics, distributed systems, parallel computing, database systems, computer graphics, web development, cloud computing, supercomputing etc. I think you will be confident enough to choose the area you are interested in, and you will be quite competitive in both industry and academia.

I firmly believe that if you have read to this line, you do not lack the ability and commitment to learn CS well, you just need a good teacher to teach you a good course. And I will try my best to pick such courses for you, based on my three years of experience.

## **Pros**

For me, the biggest advantage of self-learning is that I can adjust the pace of learning entirely according to my own progress. For difficult parts, I can watch the videos over and over again, Google it online and ask questions on StackOverflow until I have it all figured out. For those that I mastered relatively quickly, I could skip them at twice or even three times the speed.

Another great thing about self-learning is that you can learn from different perspectives. I have taken core courses such as architectures, networking, operating systems, and compilers from different universities. Different instructors may have different views on the same knowledge, which will broaden your horizon.

A third advantage of self-learning is that you do not need to go to the class, listening to the boring lectures.

## **Cons**

Of course, as a big fan of self-learning, I have to admit that it has its disadvantages.

The first is the difficulty of communication. I'm actually a very keen questioner, and I like to follow up all the points I don't understand. But when you're facing a screen and you hear a teacher talking about something you don't understand, you can't go to the other end of the network and ask him or her for clarification. I try to mitigate this by thinking independently and making good use of Google, but it would be great to have a few friends to study together. You can refer to ` + "`" + `README` + "`" + ` for more information on participating a community group.

The second thing is that these courses are basically in English. From the videos to the slides to the assignments, all in English. You may struggle at first, but I think it's a challenge that if you overcome, it will be extremely rewarding. Because at the moment, as reluctant as I am, I have to admit that in computer science, a lot of high quality documentation, forums and websites are all in English.

The third, and I think the most difficult one, is self-discipline. Because have no DDL can sometimes be a really scary thing, especially when you get deeper, many foreign courses are quite difficult. You have to be self-driven enough to force yourself to settle down, read dozens of pages of Project Handout, understand thousands of lines of skeleton code and endure hours of debugging time. With no credits, no grades, no teachers, no classmates, just one belief - that you are getting better.

## **Who is this book for?**

As I said in the beginning, anyone who is interested in learning computer science on their own can refer to this book. If you already have some basic skills and are just interested in a particular area, you can selectively pick and choose what you are interested in to study. Of course, if you are a novice who knows nothing about computers like I did back then, and just begin your college journey, I hope this book will be your cheat sheet to get the knowledge and skills you need in the least amount of time. In a way, this book is more like a course search engine ordered according to my experience, helping you to learn high quality CS courses from the world's top universities without leaving home.

Of course, as an undergraduate student who has not yet graduated, I feel that I am not in a position nor have the right to preach one way of learning. I just hope that this material will help those who are also self-motivated and persistent to gain a richer, more varied and satisfying college life.

## **Special thanks**

I would like to express my sincere gratitude to all the professors who have made their courses public for free. These courses are the culmination of decades of their teaching careers, and they have chosen to selflessly make such a high quality CS education available to all. Without them, my university life would not have been as fulfilling and enjoyable. Many of the professors would even reply with hundreds of words in length after I had sent them a thank you email, which really touched me beyond words. They also inspired me all the time that if decide to do something, do it with all heart and soul.

## **Want to join as a contributor?**

There is a limit to how much one person can do, and this book was written by me under a heavy research schedule, so there are inevitably imperfections. In addition, as I work in the area of systems, many of the courses focus on systems, and there is relatively little content related to advanced mathematics, computing theory, and advanced algorithms. If any of you would like to share your self-learning experience and resources in other areas, you can directly initiate a Pull Request in the project, or feel free to contact me by email ([[邮箱已隐藏].cn](mailto:[邮箱已隐藏].cn)).`,
	},
	{
		DisplayName:       `快乐的银杏ff`,
		School:            `CS自学指南`,
		MajorLine:         `计算机自学`,
		ArticleTitle:      `CS自学 | How to Use This Book`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：How to Use This Book。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `计算机自学`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# **How to Use This Book**

As the number of contributors grows, the content of this book keeps expanding. It is impractical and unnecessary to try to complete all the courses in the book. Attempting to do so might even be counterproductive, resulting in effort without reward. To better align with our readers and make this book truly useful for you, I have roughly divided readers into the following three categories based on their needs. Everyone can plan their own self-study program accurately according to their actual situation.

## **Freshmen**

If you have just entered the university or are in the lower grades, and you are studying or planning to switch to computer science, then you are lucky. As studying is your main task, you have ample time and freedom to learn what you are interested in without the pressure of work and daily life. You needn't be overly concerned with utilitarian thoughts like "is it useful" or "can it help me find a job". So, how should you arrange your studies? The first point is to break away from the passive learning style formed in high school. As a small-town problem solver, I know that most Chinese high schools fill every minute of your day with tasks, and you just need to passively follow the schedule. As long as you are diligent, the results won’t be too bad. However, once you enter university, you have much more freedom. All your extracurricular time is yours to use, and no one will organize knowledge points or summarize outlines for you. Exams are not as formulaic as in high school. If you still hold the mentality of a "good high school student", following everything step by step, the results may not be as expected. The professional training plan may not be reasonable, the teaching may not be responsible, attending classes may not guarantee understanding, and even the exam content may not relate to what was taught. Jokingly, you might feel that the whole world is against you, and you can only rely on yourself.

Given this reality, if you want to change it, you must first survive and have the ability to question it. In the lower grades, it’s important to lay a solid foundation. This foundation is comprehensive, covering both in-class knowledge and practical skills, which are often lacking in China's undergraduate computer science education. Based on personal experience, I offer the following suggestions for your reference.

First, learn how to write "elegant" code. Many programming introductory courses in China can be extremely boring syntax classes, less effective than reading official documentation. Initially, letting students understand what makes code elegant and what constitutes "bad taste" is beneficial. Introductory courses usually start with procedural programming (like C language), but even here, the concepts of **modularity** and **encapsulation** are crucial. If you write code just to pass on OpenJudge, using lengthy copy-pasting and bloated main functions, your code quality will remain poor. For larger projects, endless debugging and maintenance costs will overwhelm you. So, constantly ask yourself, is there a lot of repetitive code? Is the current function too complex (Linux advocates each function should do only one thing)? Can this code be abstracted into a function? Initially, this may seem cumbersome for simple problems, but remember, good habits are invaluable. Even middle school students can master C language, so why should a company hire you as a software engineer?

After procedural programming, the second semester of the freshman year usually introduces object-oriented programming (like C++ or Java). I highly recommend [MIT 6.031: Software Construction](软件工程/6031.md) course notes, which use Java (switch to TypeScript after 2022) to explain how to write “elegant” code in detail, including Test-Driven development, function Specification design, exception handling, and more. Also, understanding common design patterns is necessary when learning object-oriented programming. Domestic object-oriented courses can easily become dull syntax classes, focusing on inheritance syntax and puzzling questions, neglecting that these are rarely used in real-world development. The essence of object-oriented programming is teaching students to abstract real problems into classes and their relationships, and design patterns are the essence of these abstractions. I recommend the book ["Big Talk Design Patterns"](https://book.douban.com/subject/2334288/), which is very easy to understand.

Second, try to learn some productivity-enhancing tools and skills, such as Git, Shell, Vim. I strongly recommend the [MIT missing semester](编程入门/MIT-Missing-Semester.md) course. Initially, you may feel awkward, but force yourself to use them, and your development efficiency will skyrocket. Additionally, many applications can greatly increase your productivity. A rule of thumb is: any action that requires your hands to leave the keyboard should be eliminated. For example, switching applications, opening files, browsing the web - there are plugins for these (like [Alfred](https://www.alfredapp.com/) for Mac). If you find an daily operation that takes more than 1 second, try to reduce it to 0.1 seconds. After all, you'll be dealing with computers for decades, so forming a smooth workflow can greatly enhance efficiency. Lastly, learn to touch type! If you still need to look at the keyboard while typing, find a tutorial online and learn to type without looking. This will significantly increase your development efficiency.

Third, balance coursework and self-learning. We feel angry about the institution but must also follow the rules, as GPA is still important for postgraduate recommendations. Therefore, in the first year, I suggest focusing on the curriculum, complemented by high-quality extracurricular resources. For example, for calculus and linear algebra, refer to [MIT 18.01/18.02](./数学基础/MITmaths.md) and [MIT 18.06](./数学基础/MITLA.md). During holidays, learn Python through [UCB CS61A](./编程入门/Python/CS61A.md). Also, focus on good programming habits and practical skills mentioned above. From my experience, mathematics courses matter a lot for your GPA in the first year, and the content of math exams varies greatly between different schools and teachers. Self-learning might help you understand the essence of mathematics, but it may not guarantee good grades. Therefore, it’s better to specifically practice past exams. 

In your sophomore year, as computer science courses become the majority, you can fully immerse yourself in self-learning. Refer to [A Reference Guide for CS Learning](./CS学习规划.md), a guide I created based on three years of self-learning, introducing each course and its importance. For every course in your curriculum, this guide should have a corresponding one, and I believe they are of higher quality. If there are course projects, try to adapt labs or projects from these self-learning courses. For example, I took an operating systems course and found the teacher was still using experiments long abandoned by UC Berkeley, so I emailed the teacher to switch to the [MIT 6.S081](./操作系统/MIT6.S081.md) xv6 Project I was studying. This allowed me to self-learn while inadvertently promoting curriculum reform. In short, be flexible. Your goal is to master knowledge in the most convenient and efficient way. Anything that contradicts this goal can be “fudged” as necessary. With this attitude, after my junior year, I barely attended offline classes (I spent most of my sophomore year at home due to the pandemic), and it had no impact on my GPA.

Finally, I hope everyone can be less impetuous and more patient in their pursuit. Many ask if self-learning requires strong self-discipline. It depends on what you want. If you still hold the illusion that mastering a programming language will earn you a high salary and a share of the internet’s profits, then whatever I say is pointless. Initially, my motivation was out of pure curiosity and a natural desire for knowledge, not for utilitarian reasons. The process didn't involve “extraordinary efforts”; I spent my days in college as usual and gradually accumulated this wealth of materials. Now, as the US-China confrontation becomes a trend, we still humbly learn techniques from the West. Who will change this? You, the newcomers. So, go for it, young man!

## **Simplify the Complex**

If you have graduated and started postgraduate studies, or have begun working, or are in another field and want to learn coding in your spare time, you may not have enough time to systematically complete the materials in [A Reference Guide for CS Learning](./CS学习规划.md), but still want to fill the gaps in your undergraduate foundation. Considering that these readers usually has some programming experience, there is no need to repeat introductory courses. From a practical standpoint, since the general direction of work is already determined, there is no need to deeply study every branch of computer science. Instead, focus on general principles and skills. Based on my own experience, I've selected the most important and highest quality core professional courses to deepen readers' understanding of computer science. After completing these courses, regardless of your specific job, I believe you won't just be an ordinary coder, but will have a deeper understanding of the underlying logic of computers.

| Course Direction    | Course Name                                          |
|---------------------|------------------------------------------------------|
| Discrete Mathematics and Probability Theory | [UCB CS70: Discrete Math and Probability Theory](数学进阶/CS70.md) |
| Data Structures and Algorithms | [Coursera: Algorithms I & II](数据结构与算法/Algo.md) |
| Software Engineering | [MIT 6.031: Software Construction](软件工程/6031.md) |
| Full-Stack Development | [MIT Web Development Course](Web开发/mitweb.md) |
| Introduction to Computer Systems | [CMU CS15213: CSAPP](计算机系统基础/CSAPP.md) |
| Introductory System Architecture | [Coursera: Nand2Tetris](体系结构/N2T.md) |
| Advanced System Architecture | [CS61C: Great Ideas in Computer Architecture](体系结构/CS61C.md) |
| Principles of Databases | [CMU 15-445: Introduction to Database Systems](数据库系统/15445.md) |
| Computer Networking | [Computer Networking: A Top-Down Approach](计算机网络/topdown.md) |
| Artificial Intelligence | [Harvard CS50: Introduction to AI with Python](人工智能/CS50.md) |
| Deep Learning | [Coursera: Deep Learning](深度学习/CS230.md) |

## **Focused and Specialized**

If you have a solid grasp of the core professional courses in computer science and have already determined your work or research direction, then there are many courses in the book not mentioned in [A Reference Guide for CS Learning](./CS学习规划.md) for you to explore.

As the number of contributors increases, new branches such as **Advanced Machine Learning** and **Machine Learning Systems** will be added to the navigation bar. Under each branch, there are several similar courses from different schools with different emphases and experiments, such as the **Operating Systems** branch, which includes courses from MIT, UC Berkeley, Nanjing University, and Harbin Institute of Technology. If you want to delve into a field, studying these similar courses will give you different perspectives on similar knowledge. Additionally, I plan to contact researchers in related fields to share research learning paths in specific subfields, enhancing the depth of the CS Self-learning Guide while pursuing breadth.

If you want to contribute in this area, feel free to contact the author via email [[邮箱已隐藏].cn](mailto:[邮箱已隐藏].cn).`,
	},
	{
		DisplayName:       `樱桃oo`,
		School:            `CS自学指南`,
		MajorLine:         `计算机自学`,
		ArticleTitle:      `CS自学 | 如何使用这本书`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：如何使用这本书。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `计算机自学`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# 如何使用这本书

随着贡献者的不断增多，本书的内容也不断扩展，想把书中所有的课程全部学完是不切实际也没有必要的，甚至会起到事倍功半的反效果，吃力而不讨好。为了更好地贴合读者，让这本书真正为你所用，我将读者按照需求大致分为了如下三类，大家可以结合切身实际，精准地规划属于自己的自学方案。

## 初入校园

如果你刚刚进入大学校园或者还在低年级，并且就读的是计算机方向或者想要转到计算机方向，那么你很幸运，因为学习是你的本业，你可以有充足的时间和自由来学习自己感兴趣的东西，不会有工作的压力和生活的琐碎，不必过于纠结“学了有没有用”，“能不能找到工作”这类功利的想法。那么该如何安排自己的学业呢？我觉得首要的一点就是要打破在高中形成的“按部就班”式的被动学习。作为一个小镇做题家，我深知国内大部分高中会把大家一天当中的每一分钟都安排得满满当当，你只需要被动地跟着课表按部就班地完成一个个既定的任务。只要足够认真，结果都不会太差。但步入大学的校门，自由度一下子变大了许多。首先所有的课外时间基本都由你自由支配，没有人为你整理知识点，总结提纲，考试也不像高中那般模式化。如果你还抱着高中那种“乖学生”的心态，老老实实按部就班，结果未必如你所愿。因为专业培养方案未必就是合理，老师的教学未必就会负责，认真出席课堂未必就能听懂，甚至考试内容未必就和讲的有关系。说句玩笑话，你或许会觉得全世界都与你为敌，而你只能指望自己。

那么现状就是这么个现状，你想改变，也得先活过去，并且拥有足够的能力去质疑它。而在低年级，打好基础很重要。这里的基础是全方面的，课内的知识固然重要，但计算机很大程度上还是强调实践，因此有很多课本外的能力需要培养，而这恰恰是国内的计算机本科教育很欠缺的一点。我根据个人的体验总结出了下面几点建议，供大家参考。

其一就是了解如何写“优雅”的代码。国内的很多大一编程入门课都会讲成极其无聊的语法课，其效果还不如直接让学生看官方文档。事实上，在刚开始接触编程的时候，让学生试着去了解什么样的代码是优雅的，什么样的代码 "have bad taste" 是大有裨益的。一般来说，编程入门课会先介绍过程式编程（例如 C 语言）。但即便是面向过程编程，**模块化** 和 **封装** 的思想也极其重要。如果你只想着代码能在 OpenJudge 上通过，写的时候图省事，用大段的复制粘贴和臃肿的 main 函数，长此以往，你的代码质量将一直如此。一旦接触稍微大一点的项目，无尽的 debug 和沟通维护成本将把你吞没。因此，写代码时不断问自己，是否有大量重复的代码？当前函数是否过于复杂（Linux 提倡每个函数只需要做好一件事）？这段代码能抽象成一个函数吗？一开始你可能觉得很不习惯，甚至觉得这么简单的题需要如此大费周章吗？但记住好的习惯是无价的，C 语言初中生都能学会，凭什么公司要招你去当程序员呢？

学过面向过程编程后，大一下学期一般会讲面向对象编程（例如 C++ 或 Java）。这里非常推荐大家看 [MIT 6.031: Software Construction](./软件工程/6031.md) 这门课的 Notes，会以 Java 语言（22年改用了 TypeScript 语言）为例非常详细地讲解如何写出“优雅”的代码。例如 Test-Driven 的开发、函数 Specification 的设计、异常的处理等等等等。除此之外，既然接触了面向对象，那么了解一些常见的设计模式也是很有必要的。因为国内的面向对象课程同样很容易变成极其无聊的语法课，让学生纠结于各种继承的语法，甚至出一些无聊的脑筋急转弯一样的题目，殊不知这些东西在地球人的开发中基本不会用到。面向对象的精髓是让学生学会自己将实际的问题抽象成若干类和它们之间的关系，而设计模式则是前人总结出来的一些精髓的抽象方法。这里推荐[大话设计模式](https://book.douban.com/subject/2334288/) 这本书，写得非常浅显易懂。

其二就是尝试学习一些能提高生产力的工具和技能，例如 Git、Shell、Vim。这里强烈推荐学习 [MIT missing semester](./编程入门/MIT-Missing-Semester.md) 这门课，也许一开始接触这些工具用起来会很不习惯，但强迫自己用，熟练之后开发效率会直线提高。此外，还有很多应用也能极大提高你的生产力。一条定律是：一切需要让手离开键盘的操作，都应该想办法去除。例如切换应用、打开文件、浏览网页这些都有相关插件可以实现快捷操作（例如 Mac 上的 [Alfred](https://www.alfredapp.com/)）。如果你发现某个操作每天都会用到，并且用时超过1秒，那就应该想办法把它缩减到0.1秒。毕竟以后数十年你都要和电脑打交道，形成一套顺滑的工作流是事半功倍的。最后，学会盲打！如果你还需要看着键盘打字，那么赶紧上网找个教程学会盲打，这将极大提高你的开发效率。

其三就是平衡好课内和自学。我们质疑现状，但也得遵守规则，毕竟绩点在保研中还是相当重要的。因此在大一，我还是建议大家尽量按照自己的课表学习，但辅以一些优质的课外资源。例如微积分线代可以参考 [MIT 18.01/18.02](./数学基础/MITmaths.md) 和 [MIT 18.06](./数学基础/MITLA.md) 的课程 Notes。假期可以通过 [UCB CS61A](./编程入门/Python/CS61A.md) 来学习 Python。同时做到上面第一、第二点说的，注重好的编程习惯和实践能力的培养。就个人经验，大一的数学课学分占比相当大，而且数学考试的内容方差是很大的，不同学校不同老师风格迥异，自学也许能让你领悟数学的本质，但未必能给你一个好成绩。因此考前最好有针对性地刷往年题，充分应试。

在升入大二之后，计算机方向的专业课将居多，此时大家可以彻底放飞自我，进入自学的殿堂了。具体可以参考 [一份仅供参考的CS学习规划](./CS学习规划.md)，这是我根据自己三年自学经历总结提炼出来的全套指南，每门课的特点以及为什么要上这门课我都做了简单的介绍。对于你课表上的每个课程，这份规划里应该都会有相应的国外课程，而且在质量上我相信基本是全方位的碾压。由于计算机方向的专业知识基本是一样的，而且高质量的课程会让你从原理上理解知识点，对于国内大多照本宣科式的教学来说基本是降维打击。一般来说只要考前将老师“辛苦”念了一学期的 PPT 拿来突击复习两天，取得一个不错的卷面分数并不困难。如果有课程大作业，则可以尽量将国外课程的 Lab 或者 Project 修改一番以应付课内的需要。我当时上操作系统课，发现老师还用着早已被国外学校淘汰的课程实验，便邮件老师换成了自己正在学习的 [MIT 6.S081](./操作系统/MIT6.S081.md) 的 xv6 Project，方便自学的同时还无意间推动了课程改革。总之，灵活变通是第一要义，你的目标是用最方便、效率最高的方式掌握知识，所有与你这一目标违背的所谓规定都可以想方设法地去“糊弄”。凭着这份糊弄劲儿，我大三之后基本没有去过线下课堂（大二疫情在家呆了大半年），对绩点也完全没有影响。

最后，希望大家少点浮躁和功利，多一些耐心和追求。很多人发邮件问我自学需不需要很强的自制力，我觉得得关键得看你自己想要什么。如果你依然抱着会一门编程语言便能月薪过万的幻想，想分一杯互联网的红利，那么我说再多也是废话。其实我最初的自学并没有太多功利的想法，只是单纯的好奇和本能的求知欲。自学的过程也没有所谓的“头悬梁，锥刺股”，该吃吃，该玩玩，不知不觉才发现竟然攒下了这么多资料。现如今中美的对抗已然成为趋势，而我们还在“卑微”地“师夷长技”，感叹国外高质量课程的同时也时常会有一种危机感。这一切靠谁来改变呢？靠的是刚刚入行的你们。所以，加油吧，少年！

## 删繁就简

如果你已经本科毕业开始读研或者走上了工作岗位，亦或是从事着其他领域的工作想要利用业余时间转码，那么你也许并没有充足的业余时间来系统地学完 [一份仅供参考的CS学习规划](./CS学习规划.md) 里的内容，但又想弥补本科时期欠下的基础。考虑到这部分读者通常有一定的编程经验，入门课程没有必要再重复学习。而且从实用角度来说，由于工作的大体方向已经确定，确实没有太大必要对于每个计算机分支都有特别深入的研究，更应该侧重一些通用性的原则和技能。因此我结合自身经历，选取了个人感觉最重要也是质量最高的几门核心专业课，希望能更好地加深读者对计算机的理解。学完这些课程，无论你具体从事的是什么工作，我相信你将不可能沦为一个普通的调包侠，而是对计算机的底层运行逻辑有更深入的了解。

|课程方向      |课程名                                            |
|-------------|-------------------------------------------------|
|离散数学和概率论|[UCB CS70 : discrete Math and probability theory](./数学进阶/CS70.md)|
|数据结构与算法 |[Coursera: Algorithms I & II](数据结构与算法/Algo.md)|
|软件工程      |[MIT 6.031: Software Construction](软件工程/6031.md)|
|全栈开发      |[MIT web development course](Web开发/mitweb.md)|
|计算机系统导论 |[CMU CS15213: CSAPP](计算机系统基础/CSAPP.md)|
|体系结构入门   |[Coursera: Nand2Tetris](./体系结构/N2T.md)       |
|体系结构进阶   |[CS61C: Great Ideas in Computer Architecture](./体系结构/CS61C.md)|
|数据库原理     |[CMU 15-445: Introduction to Database System](数据库系统/15445.md)|
|计算机网络     |[Computer Networking: A Top-Down Approach](./计算机网络/topdown.md)|
|人工智能      |[Harvard CS50: Introduction to AI with Python](人工智能/CS50.md)|
|深度学习      |[Coursera: Deep Learning](深度学习/CS230.md)|

## 心有所属

如果你对于计算机领域的核心专业课都掌握得相当扎实，而且已经确定了自己的工作或研究方向，那么书中还有很多未在 [一份仅供参考的CS学习规划](./CS学习规划.md) 提到的课程供你探索。

随着贡献者的不断增多，左侧的目录中将不断增加新的分支，例如 **机器学习进阶** 和 **机器学习系统**。并且同一个分支下都有若干同类型课程，它们来自不同的学校，有着不同的侧重点和课程实验，例如 **操作系统** 分支下就包含了麻省理工、伯克利、南京大学还有哈工大四所学校的课程。如果你想深耕一个领域，那么学习这些同类的课程会给你不同的视角来看待类似的知识。同时，本书作者还计划联系一些相关领域的科研工作者来分享某个细分领域的科研学习路径，让 CS自学指南 在追求广度的同时，实现深度上的提高。

如果你想贡献这方面的内容，欢迎和作者邮件联系 [[邮箱已隐藏].cn](mailto:[邮箱已隐藏].cn)`,
	},
	{
		DisplayName:       `雪花蘑菇`,
		School:            `CS自学指南`,
		MajorLine:         `计算机自学`,
		ArticleTitle:      `CS自学 | 后记.md`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：后记.md。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `计算机自学`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# 后记

从最初的想法开始，到断断续续完成这本书，再到树洞的热烈反响，我很激动，但也五味杂陈。原来在北大这个园子里，也有那么多人，对自己的本科生涯并不满意。而这里，可是囊括了中国非常优秀的一帮年轻人。所以问题出在哪里？我不知道。

我只是个籍籍无名的本科生呀，只是一个单纯的求学者，我的目标只是想快乐地、自由地、高质量地掌握那些专业知识，我想，正在看这本书的大多数本科生也是如此，谁想付出时间但却收效甚微呢？又是谁迫使大家带着痛苦去应付呢？我不知道。

我写这本书绝不是为了鼓励大家翘课自学，试问谁不想在课堂上和那么多优秀的同学济济一堂，热烈讨论呢？谁不想遇到问题直接找老师答疑解惑呢？谁不想辛苦学习的成果可以直接化作学校承认的学分绩点呢？可如果一个兢兢业业、按时到堂的学生收获的却是痛苦，而那个一学期只有考试会出席的学生却学得自得其乐，这公平吗？我不知道。

我只是不甘，不甘心这些通过高考战胜无数人进入高校的学子本可以收获一个更快乐的本科生涯，但现实却留给了他们遗憾。我反问自己，本科教育究竟应该带给我们什么呢？是学完所有这些课程吗？倒也未必，它也许只适合我这种nerd。但我觉得，本科教育至少得展现它应有的诚意，一种分享知识的诚意，一种以人为本的诚意，一种注重学生体验的诚意。它至少不应该是一种恶意，一种拼比知识的恶意，一种胜者为王的恶意，一种让人学无所得的恶意。但这一切能改变吗？我不知道。

我只知道我做了应该做的事情，学生们会用脚投票，树洞的关注量和回帖数证明了这样一份资料是有价值的，也道出了国内CS本科教育和国外的差距。也许这样的改变是微乎其微的，但别忘了我只是一个籍籍无名的本科生，是北大信科一千多名本科生中的普通一员，是中国几百万在读本科生中的一分子，如果有更多的人站出来，每个人做一点点，也许是分享一个帖子，也许是当一门课的助教，也许是精心设计一门课的lab，更或许是将来获得教职之后开设一门高质量的课程，出版一本经典的教材。本科教育真的有什么技术壁垒吗？我看未必，教育靠的是诚意，靠的是育人之心。

今天是2021年12月12日，我期待在不久的将来这个帖子会被遗忘，大家可以满心欢喜地选着自己培养方案上的课程，做着学校自行设计的各类编程实验，课堂没有签到也能济济一堂，学生踊跃地发言互动，大家的收获可以和努力成正比，那些曾经的遗憾和痛苦可以永远成为历史。我真的很期待那一天，真的真的真的很期待。`,
	},
	{
		DisplayName:       `拿铁君`,
		School:            `CS自学指南`,
		MajorLine:         `计算机自学`,
		ArticleTitle:      `CS自学 | 好书推荐`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：好书推荐。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `计算机自学`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# 好书推荐



由于版权原因，下面列举的图书中除了开源资源提供了链接，其他的资源请大家自行通过 [libgen](http://libgen.is/) 查找。

## 资源汇总

- [Free Programming Books](https://github.com/EbookFoundation/free-programming-books): 开源编程书籍资源汇总
- [CS Textbook Recommendations](https://4chan-science.fandom.com/wiki/Computer_Science_and_Engineering): 计算机科学方向推荐教材列表
- [C Book Guide and List](https://stackoverflow.com/questions/562303/the-definitive-c-book-guide-and-list): C语言相关的编程书籍推荐列表
- [C++ Book Guide and List](https://stackoverflow.com/questions/388242/the-definitive-c-book-guide-and-list): C++语言相关的编程书籍推荐列表
- [Python Book Guide and List](https://pythonbooks.org/): Python语言相关的编程书籍推荐列表
- [Computer Vision Textbook Recommendations](https://www.folio3.ai/blog/best-computer-vision-books/): 计算机视觉方向推荐教材列表
- [Deep Learning Textbook Recommendations](https://www.mostrecommendedbooks.com/lists/best-deep-learning-books): 深度学习方向推荐教材列表


## 系统入门

- Computer Systems: A Programmer's Perspective [[豆瓣](https://book.douban.com/subject/26912767/)]
- Principles of Computer System Design: An Introduction [[豆瓣](https://book.douban.com/subject/3707841/)]

## 操作系统

- [现代操作系统: 原理与实现](https://ipads.se.sjtu.edu.cn/mospi/) [[豆瓣](https://book.douban.com/subject/35208251/)]
- [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/) [[豆瓣](https://book.douban.com/subject/19973015/)]
- Modern Operating Systems [[豆瓣](https://book.douban.com/subject/27096665/)]
- Operating Systems: Principles and Practice [[豆瓣](https://book.douban.com/subject/25984145/)]
- [Operating Systems: Internals and Design Principles](https://elibrary.pearson.de/book/99.150005/9781292214306) [[豆瓣](https://book.douban.com/subject/6047741/)]

## 计算机网络

- [Computer Networks: A Systems Approach](https://book.systemsapproach.org/foreword.html) [[豆瓣](https://book.douban.com/subject/26417896/)]
- [Computer Networking: A Top-Down Approach](https://www.ucg.ac.me/skladiste/blog_44233/objava_64433/fajlovi/Computer%20Networking%20_%20A%20Top%20Down%20Approach,%207th,%20converted.pdf) [[豆瓣](https://book.douban.com/subject/30280001/)]
- How Networks Work [[豆瓣](https://book.douban.com/subject/26941639/)]

## 分布式系统

- [Patterns of Distributed System (Blog)](https://github.com/dreamhead/patterns-of-distributed-systems)
- [Distributed Systems for Fun and Profit (Blog)](http://book.mixu.net/distsys/index.html)
- [Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems](https://github.com/Vonng/ddia) [[豆瓣](https://book.douban.com/subject/26197294/)]

## 数据库系统

- [Architecture of a Database System](https://dsf.berkeley.edu/papers/fntdb07-architecture.pdf) [[豆瓣](https://book.douban.com/subject/17665384/)]
- [Readings in Database Systems](http://www.redbook.io/) [[豆瓣](https://book.douban.com/subject/2256069/)]
- Database System Concepts : 7th Edition [[豆瓣](https://book.douban.com/subject/30345517/)]

## 编译原理

- Engineering a Compiler [[豆瓣](https://book.douban.com/subject/5288601/)]
- Compilers: Principles, Techniques, and Tools [[豆瓣](https://book.douban.com/subject/1866231/)]
- [Crafting Interpreters](https://craftinginterpreters.com/contents.html)[[豆瓣]](https://book.douban.com/subject/35548379/)[[开源中文翻译]](https://github.com/GuoYaxiang/craftinginterpreters_zh)

## 计算机编程语言

- 计算机程序的构造和解释 [[豆瓣](https://book.douban.com/subject/1148282/)]
- [Essentials of Programming Languages](https://eopl3.com/) [[豆瓣](https://book.douban.com/subject/3136252/)]
- [Practical Foundations for Programming Languages](https://www.cs.cmu.edu/~rwh/pfpl.html) [[豆瓣](https://book.douban.com/subject/26782198/)]
- [Software Foundations](https://softwarefoundations.cis.upenn.edu/) [[豆瓣](https://book.douban.com/subject/25712292/)] [[北大相关课程](https://xiongyingfei.github.io/SF/2021/)]
- [Types and Programming Languages](https://www.cis.upenn.edu/~bcpierce/tapl/) [[豆瓣](https://book.douban.com/subject/1761910/)] [[北大相关课程](https://xiongyingfei.github.io/DPPL/2021/main.htm)]

## 体系结构

- 超标量处理器设计: Superscalar RISC Processor Design [[豆瓣](https://book.douban.com/subject/26293546/)]
- Computer Organization and Design: The Hardware/Software Interface [[MIPS Edition](https://book.douban.com/subject/35998323/)][[ARM Edition](https://book.douban.com/subject/30443432/)][[RISC-V Edition](https://book.douban.com/subject/36490912/)]
- Computer Architecture: A Quantitative Approach [[豆瓣](https://book.douban.com/subject/6795919/)]

## 理论计算机科学

- Introduction to the Theory of Computation [[豆瓣](https://book.douban.com/subject/1852515/)]

## 密码学

- Cryptography Engineering: Design Principles and Practical Applications [[豆瓣](https://book.douban.com/subject/26416592/)]
- Introduction to Modern Cryptography [[豆瓣](https://book.douban.com/subject/2678340/)]

## 逆向工程

- 逆向工程核心原理 [[豆瓣](https://book.douban.com/subject/25866389/)]
- 加密与解密 [[豆瓣](https://book.douban.com/subject/30288807/)]

## 计算机图形学

- [Monte Carlo theory, methods and examples](https://artowen.su.domains/mc/)[[豆瓣](https://book.douban.com/subject/6089923/)]
- Advanced Global Illumination [[豆瓣](https://book.douban.com/subject/2751153/)]
- Fundamentals of Computer Graphics [[豆瓣](https://book.douban.com/subject/26868819/)]
- [Fluid Simulation for Computer Graphics](http://wiki.cgt3d.cn/mediawiki/images/4/43/Fluid_Simulation_for_Computer_Graphics_Second_Edition.pdf) [[豆瓣](https://book.douban.com/subject/2584523/)]
- [Physically Based Rendering: From Theory To Implementation](https://research.quanfita.cn/files/Physically_Based_Rendering_Third_Edition.pdf) [[豆瓣](https://book.douban.com/subject/4306242/)]
- [Real-Time Rendering](https://research.quanfita.cn/files/Real-Time_Rendering_4th_Edition.pdf) [[豆瓣](https://book.douban.com/subject/30296179/)]

## 游戏引擎

- 游戏编程模式: Game Programming Patterns [[豆瓣](https://book.douban.com/subject/26880704/)]
- 实时碰撞检测算法技术 [[豆瓣](https://book.douban.com/subject/4861957/)]
- [Game AI Pro Series](http://www.gameaipro.com/) [[豆瓣](https://search.douban.com/book/subject_search?search_text=Game+AI+Pro&cat=1001)]
- Artificial Intelligence for Games [[豆瓣](https://book.douban.com/subject/3836472/)]
- Game Engine Architecture [[豆瓣](https://book.douban.com/subject/25815142/)]
- Game Programming Gems Series [[豆瓣](https://search.douban.com/book/subject_search?search_text=Game+Programming+Gems&cat=1001)]

## 软件工程

- [Software Engineering at Google](https://abseil.io/resources/swe-book) [[豆瓣](https://book.douban.com/subject/34875994/)]

## 设计模式

- 设计模式: 可复用面向对象软件的基础 [[豆瓣](https://book.douban.com/subject/1052241/)]
- 大话设计模式 [[豆瓣](https://book.douban.com/subject/2334288/)]
- Head First Design Patterns 2nd ed. [[豆瓣](https://book.douban.com/subject/35097022/)]

## 深度学习

- 深度学习 [[豆瓣](https://book.douban.com/subject/27087503/)][[Github](https://github.com/exacity/deeplearningbook-chinese)]
- [动手学深度学习](https://zh.d2l.ai) [[豆瓣](https://book.douban.com/subject/33450010/)]
- [神经网络与深度学习](https://nndl.github.io/) [[豆瓣](https://book.douban.com/subject/35044046/)]
- 深度学习入门 [[豆瓣](https://book.douban.com/subject/30270959/)]
- [简单粗暴 TensorFlow 2 (Tutorial)](https://tf.wiki/)
- [Speech and Language Processing](https://web.stanford.edu/~jurafsky/slp3/) [[豆瓣](https://book.douban.com/subject/5373023/)]

## 计算机视觉

- [Multiple View Geometry in Computer Vision](https://github.com/DeepRobot2020/books/blob/master/Multiple%20View%20Geometry%20in%20Computer%20Vision%20(Second%20Edition).pdf)  [[豆瓣](https://book.douban.com/subject/1841346/)]
## 机器人

- [Probabilistic Robotics](https://docs.ufpr.br/~danielsantos/ProbabilisticRobotics.pdf) [[豆瓣](https://book.douban.com/subject/2861227/)]

## 面试

- 剑指 Offer：名企面试官精讲典型编程题 [[豆瓣](https://book.douban.com/subject/27008702/)]
- Cracking The Coding Interview [[豆瓣](https://book.douban.com/subject/10436668/)]`,
	},
	{
		DisplayName:       `努力的桂花呀`,
		School:            `CS自学指南`,
		MajorLine:         `Web开发`,
		ArticleTitle:      `CS自学 | Stanford CS142: Web Applications`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Stanford CS142: Web Applicatio。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `Web开发`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Stanford CS142: Web Applications

## Descriptions

- Offered by: Stanford
- Prerequisites: CS107 and CS108
- Programming Languages: JavaScript/HTML/CSS
- Difficulty: 🌟🌟🌟🌟
- Class Hour: 100 hours

This is Stanford's Web Application course covers HTML, CSS, JavaScript, ReactJs, NodeJS, ExpressJS, Web Security, and more. Eight projects will enhance your web development skills in practice.

## Course Resources

- Course Website: <https://web.stanford.edu/class/cs142/index.html>
- Recordings: <https://web.stanford.edu/class/cs142/lectures.html>
- Assignments: <https://web.stanford.edu/class/cs142/projects.html>`,
	},
	{
		DisplayName:       `可颂松鼠`,
		School:            `CS自学指南`,
		MajorLine:         `Web开发`,
		ArticleTitle:      `CS自学 | CS571 Building UI (React & React Native)`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS571 Building UI (React & Rea。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `Web开发`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS571 Building UI (React & React Native)

## Course Overview

- University: University of Wisconsin, Madison
- Prerequisites: CS400 (Advanced Java. But in my opinion you only need to master one programming language)
- Programming Languages: JavaScript/HTML/CSS
- Course Difficulty: 🌟🌟🌟
- Estimated Time Commitment: 2 hrs/week (lecture) + 4–10 hrs/week (HW), 12 weeks

This course provides a comprehensive but concise introduction to the best practices of React front-end development and React Native mobile development. It focuses on the latest versions of React and React Native and is updated every semester. It is a valuable resource for tackling the complexities of front-end development.

The course also offers a good training ground. Be prepared for a significant workload throughout the semester. The techniques and knowledge points involved in the homework will be explained in class, but code won't be written hand by hand (I personally think that hand-holding code writing is very inefficient, and most courses on Udemy are of this type). As this isn't a hand-holding course, if you are unsure about how to write React code when doing homework, I recommend spending extra time carefully reading the relevant chapters on [react.dev](https://react.dev/reference/react) before diving in. The starter code also provides you with a great starting point, saving you from coping with Node.js environment settings.

Although this course doesn't require prior knowledge of Javascript/HTML/CSS, the classroom introduction to syntax is relatively limited. It's recommended to frequently consult resources and ask questions when encountering syntax issues during learning and coding.

This course also includes an introduction to and practices for Dialog Flow, a ChatBot development tool by Google. You can also find content related to UX development (on the practical side) in this course.

According to the official website, CS 571 is open to everyone. You can request a Badger ID directly from the [webpage](https://cs571.org/auth) using your email address.

## Course Resources

- Course Website: <https://cs571.org>
- Course Videos: Refer to the links labeled "R" on the course website.
- Course Assignments: Refer to the course website for more information.`,
	},
	{
		DisplayName:       `烧饼dd`,
		School:            `CS自学指南`,
		MajorLine:         `Web开发`,
		ArticleTitle:      `CS自学 | CS571 Building UI (React & React Native)`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS571 Building UI (React & Rea。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `Web开发`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS571 Building UI (React & React Native)

## 课程简介

- 所属大学：威斯康星大学麦迪逊分校（University of Wisconsin, Madison）
- 先修要求：CS400（高级 Java，但个人觉得先修不必要，掌握至少一门编程语言即可）
- 编程语言：JavaScript/HTML/CSS
- 课程难度：🌟🌟🌟
- 预计学时：每周 2 小时（讲座）+ 每周 4–10 小时（作业），持续 12 周

该课程提供了 React 前端开发和 React Native 移动端开发的最佳实践介绍，完整的同时又提纲挈领。采用 React 和 React Native 的最新版本，课程网站每学期都会更新。对于各门工具迭出的前端开发难能可贵。

同时，该课程也提供了很好的训练机会。在整个学期中，需要为较大作业量做好准备。作业所涉及的技术和知识点会在课上讲解，但不会手把手写代码（个人认为手把手写代码效率非常低，而 Udemy 上多为此类型）。由于不是保姆级课程，如果写作业时对于 React 的某些功能不确定怎么写，建议在动手之前多花些时间仔细阅读 [react.dev](https://react.dev/reference/react) 上的相关章节。作业的 starter code 提供的训练起点也恰好合适，不用为配 Node.js 环境伤脑筋。

尽管这门课程不要求预先会 Javascript/HTML/CSS，课堂上对 syntax 的介绍比较有限，建议学习和写码遇到语法问题时勤查勤问。

此外，本课程还对 Google 旗下的 ChatBot 开发工具 Dialog Flow 有较为深入的介绍和练习。还对 UX Design 的实用原则和技术有所讲解。

根据官网信息，CS 571 对所有人开放。你可以在[官网](https://cs571.org/auth)直接使用电子邮箱申请 Badger ID。

## 课程资源

- 课程网站：<https://cs571.org>
- 课程视频：请参考课程网站上标有“R”的链接
- 课程作业：请参考课程网站上的相关信息`,
	},
	{
		DisplayName:       `河马z`,
		School:            `CS自学指南`,
		MajorLine:         `Web开发`,
		ArticleTitle:      `CS自学 | University of Helsinki: Full Stack open 2022`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：University of Helsinki: Full S。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `Web开发`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# University of Helsinki: Full Stack open 2022

## Descriptions

- Offered by: University of Helsinki
- Prerequisites: Good programming skills, basic knowledge of web programming and databases, and have mastery of the Git version management system.
- Programming Languages: JavaScript/HTML/CSS/NoSQL/SQL
- Difficulty: 🌟🌟
- Class Hour: Varying according to the learner

This course serves as an introduction to modern web application development with JavaScript. The main focus is on building single page applications with ReactJS that use REST APIs built with Node.js. The course also contains a section on GraphQL, a modern alternative to REST APIs.

The course covers testing, configuration and environment management, and the use of MongoDB for storing the application’s data.

## Resources
- Course Website: <https://fullstackopen.com/en/>
- Assignments: refer to the course website
- Course group on Discord: <https://study.cs.helsinki.fi/discord/join/fullstack/>
- Course group on Telegram: <https://t.me/fullstackcourse/>`,
	},
	{
		DisplayName:       `甜甜的橙子wow`,
		School:            `CS自学指南`,
		MajorLine:         `Web开发`,
		ArticleTitle:      `CS自学 | MIT Web Development Crash Course`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT Web Development Crash Cour。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `Web开发`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT Web Development Crash Course

## Descriptions

- Offered by: MIT
- Prerequisites: better if you are already proficient in a programming language
- Programming Languages: JavaScript/HTML/CSS/NoSQL
- Difficulty: 🌟🌟🌟
- Class Hour: Varying according to the learner

[Independent Activities Period](https://elo.mit.edu/iap/) (IAP) is a four-week period in January during which faculty and students are freed from the rigors of regularly scheduled classes for flexible teaching and learning and for independent study and research, and that's how this web development course was born.

Within a month, you will master the core content of designing, building, beautifying, and publishing a website from scratch, basically covering full-stack web development. If you don't need to learn web development systematically, but just want to add it to your toolkit out of interest, then this class will be perfect for you.

## Resources

- Course Website: <https://weblab.mit.edu/schedule/>
- Recordings: refer to the course website.
- Assignments: refer to the course website.`,
	},
	{
		DisplayName:       `俏皮的豆包`,
		School:            `CS自学指南`,
		MajorLine:         `人工智能`,
		ArticleTitle:      `CS自学 | CS188: Introduction to Artificial Intelligence`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS188: Introduction to Artific。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `人工智能`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS188: Introduction to Artificial Intelligence

## Course Overview

- University：UC Berkeley
- Prerequisites：CS70
- Programming Language：Python
- Course Difficulty：🌟🌟🌟
- Estimated Hours：50 hours

This introductory artificial intelligence course at UC Berkeley provides in-depth and accessible course notes, making it possible to grasp the material without necessarily watching the lecture videos. The course follows the chapters of the classic AI textbook *Artificial Intelligence: A Modern Approach*, covering topics such as search pruning, constraint satisfaction problems, Markov decision processes, reinforcement learning, Bayesian networks, Hidden Markov Models, as well as fundamental concepts in machine learning and neural networks.

The Fall 2018 version of the course offered free access to gradescope, allowing students to complete written assignments online and receive real-time assessment results. The course also includes 6 projects of high quality, featuring the recreation of the classic Pac-Man game. These projects challenge students to apply their AI knowledge to implement various algorithms, enabling their Pac-Man to navigate mazes, evade ghosts, and collect pellets.

## Course Resources

- Course Websites：[Fall 2022](https://inst.eecs.berkeley.edu/~cs188/fa22/), [Fall 2018](https://inst.eecs.berkeley.edu/~cs188/fa18/index.html)
- Course Videos：[Fall 2022](https://inst.eecs.berkeley.edu/~cs188/fa22/), [Fall 2018](https://inst.eecs.berkeley.edu/~cs188/fa18/index.html), with links to each lecture on the course website
- Course Textbook：Artificial intelligence: A Modern Approach
- Course Assignments：Online assessments for written assignments and projects, details available on the course website`,
	},
	{
		DisplayName:       `温柔的番茄`,
		School:            `CS自学指南`,
		MajorLine:         `人工智能`,
		ArticleTitle:      `CS自学 | CS188: Introduction to Artificial Intelligence`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS188: Introduction to Artific。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `人工智能`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS188: Introduction to Artificial Intelligence

## 课程简介

- 所属大学：UC Berkeley
- 先修要求：CS70
- 编程语言：Python
- 课程难度：🌟🌟🌟
- 预计学时：50 小时

伯克利的人工智能入门课，课程 notes 写得非常深入浅出，基本不需要观看课程视频。课程内容的安排基本按照人工智能的经典教材 *Artificial intelligence: A Modern Approach* 的章节顺序，覆盖了搜索剪枝、约束满足问题、马尔可夫决策过程、强化学习、贝叶斯网络、隐马尔可夫模型以及基础的机器学习和神经网络的相关内容。

目前Spring 2024是最新一期视频与资料完整、开放了旁听gradescope的版本，大家可以在线完成书面作业并实时得到测评结果。同时课程的 6 个 Project 也是质量爆炸，复现了经典的 Packman（吃豆人）小游戏，会让你利用学到的 AI 知识，去实现相关算法，让你的吃豆人在迷宫里自由穿梭，躲避鬼怪，收集豆子。

## 课程资源

- 课程网站：[Spring 2024](https://inst.eecs.berkeley.edu/~cs188/sp24/)
- 课程视频：每节课的链接详见课程网站
- 课程教材：Artificial intelligence: A Modern Approach
- 课程作业：在线测评书面作业和 Projects，详见课程网站`,
	},
	{
		DisplayName:       `机灵的石榴`,
		School:            `CS自学指南`,
		MajorLine:         `人工智能`,
		ArticleTitle:      `CS自学 | Harvard's CS50: Introduction to AI with Python`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Harvard's CS50: Introduction t。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `人工智能`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Harvard's CS50: Introduction to AI with Python

## Descriptions

- Offered by: Harvard University
- Prerequisites: Basic knowledge of probability theory and Python
- Programming Languages: Python
- Difficulty: 🌟🌟🌟
- Class Hour: 30

A very basic introductory AI course, what makes it stand out is the 12 well-designed programming assignments, all of which will use the learned knowledge to implement a simple game AI, such as using reinforcement learning to play Nim game, using max-min search with alpha-beta pruning to sweep mines, and so on. It's perfect for newbies to get started or bigwigs to relax.

## Course Resources

- Course Website: [2024](https://cs50.harvard.edu/ai/2024/)、[2020](https://cs50.harvard.edu/ai/2020/)
- Recordings: [2024](https://cs50.harvard.edu/ai/2024/)、[2020](https://cs50.harvard.edu/ai/2020/)
- Textbooks: No textbook is needed in this course.
- Assignments: [2024](https://cs50.harvard.edu/ai/2024/)、[2020](https://cs50.harvard.edu/ai/2020/) with 12 programming labs of high quality mentioned above.

## Personal Resources

All the resources and assignments used by @PKUFlyingPig in this course are maintained in [PKUFlyingPig/cs50_ai - GitHub](https://github.com/PKUFlyingPig/cs50_ai).`,
	},
	{
		DisplayName:       `苹果不吃宵夜`,
		School:            `CS自学指南`,
		MajorLine:         `人工智能`,
		ArticleTitle:      `CS自学 | CS50’s Introduction to AI with Python`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS50’s Introduction to AI with。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `人工智能`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS50’s Introduction to AI with Python

## 课程简介

- 所属大学：Harvard
- 先修要求：基本概率论 + Python 基础
- 编程语言：Python
- 课程难度：🌟🌟🌟
- 预计学时：30 小时

一门非常基础的 AI 入门课，让人眼前一亮的是 12 个设计精巧的编程作业，都会用学到的 AI 知识去实现一个简易的游戏 AI，比如用强化学习训练一个 Nim 游戏的 AI，用 alpha-beta 剪枝去扫雷等等，非常适合新手入门或者大佬休闲。

## 课程资源

- 课程网站：[2024](https://cs50.harvard.edu/ai/2024/)、[2020](https://cs50.harvard.edu/ai/2020/)
- 课程视频：[2024](https://cs50.harvard.edu/ai/2024/)、[2020](https://cs50.harvard.edu/ai/2020/)
- 课程教材：无
- 课程作业：[2024](https://cs50.harvard.edu/ai/2024/)、[2020](https://cs50.harvard.edu/ai/2020/)，12个精巧的编程作业

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/cs50_ai - GitHub](https://github.com/PKUFlyingPig/cs50_ai) 中。`,
	},
	{
		DisplayName:       `榴莲蜻蜓`,
		School:            `CS自学指南`,
		MajorLine:         `人工智能`,
		ArticleTitle:      `CS自学 | Neural Networks: Zero to Hero`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Neural Networks: Zero to Hero。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `人工智能`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Neural Networks: Zero to Hero  

## Description  

- **Instructor:** Andrej Karpathy  
- **Prerequisites:** Basic Python programming and some familiarity with deep learning concepts  
- **Programming Language:** Python  
- **Difficulty:** 🌟🌟🌟🌟  
- **Class Hours:** Approximately 19 hours  

This hands-on deep learning course, taught by Andrej Karpathy, provides a detailed and intuitive introduction to neural networks and their underlying principles. The course starts with foundational concepts such as backpropagation and micrograd before progressing to building language models, WaveNets, and GPT from scratch. The emphasis is on practical implementation, with step-by-step coding explanations to help students understand and build complex models from the ground up.  

## Instructor Information  

Andrej Karpathy is a renowned AI researcher and educator with extensive experience in deep learning and neural networks. He was the **Senior Director of AI at Tesla**, leading the **computer vision team for Tesla Autopilot** from 2017 to 2022. Prior to that, he was a **research scientist and founding member at OpenAI** (2015-2017). In 2023, he returned to OpenAI, contributing to improvements in GPT-4 for ChatGPT. In 2024, he founded **Eureka Labs**, an AI+Education company.  

Karpathy holds a **PhD from Stanford University**, where he worked on convolutional and recurrent neural networks with **Fei-Fei Li**. He has collaborated with leading AI researchers, including **Daphne Koller, Andrew Ng, Sebastian Thrun, and Vladlen Koltun**. He also taught the first deep learning course at Stanford, **CS 231n: Convolutional Neural Networks for Visual Recognition**, which became one of the largest classes at the university.  

## Course Resources  

- **Lecture Videos:** [YouTube Playlist](https://www.youtube.com/watch?v=VMj-3S1tku0&list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ)  
- **Assignments:** Self-guided projects and code implementation exercises available throughout the lectures  

For more information, watch the full playlist on YouTube.`,
	},
	{
		DisplayName:       `阳光的包子x`,
		School:            `CS自学指南`,
		MajorLine:         `人工智能`,
		ArticleTitle:      `CS自学 | 神经网络：从零到英雄`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：神经网络：从零到英雄。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `人工智能`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# 神经网络：从零到英雄  

## 课程简介  

- **讲师：** Andrej Karpathy  
- **先修要求：** 具备基本的 Python 编程能力，并对深度学习概念有所了解  
- **编程语言：** Python  
- **难度：** 🌟🌟🌟🌟  
- **课程时长：** 约 19 小时  

本课程由 Andrej Karpathy 讲授，是一个深入浅出的深度学习课程，旨在帮助学习者掌握神经网络的核心原理。课程从基础概念（如反向传播和 micrograd）入手，逐步带领学员构建语言模型、WaveNet，并从零开始实现 GPT。课程以实践为主，提供逐步讲解的代码示例，让学员能够理解并构建复杂的神经网络模型。  

## 讲师信息  

Andrej Karpathy 是一位知名的人工智能研究员和教育者，在深度学习和神经网络领域具有丰富的经验。他曾在 **2017 至 2022 年担任特斯拉 AI 部门高级总监**，领导 **Tesla Autopilot 计算机视觉团队**，负责数据标注、神经网络训练、部署等工作。在此之前，他曾是 **OpenAI 的研究科学家和创始成员**（2015-2017）。2023 年，他回归 OpenAI，参与改进 ChatGPT 的 GPT-4。2024 年，他创立了 **Eureka Labs**，一家专注于 AI + 教育的公司。  

Karpathy 拥有 **斯坦福大学博士学位**，师从 **Fei-Fei Li（李飞飞）**，主要研究卷积神经网络和循环神经网络及其在计算机视觉和自然语言处理中的应用。他曾与 **Daphne Koller、Andrew Ng（吴恩达）、Sebastian Thrun 和 Vladlen Koltun** 等知名研究员合作。此外，他还在斯坦福大学教授了首个深度学习课程 **CS 231n: 卷积神经网络与视觉识别**，该课程逐渐发展为斯坦福大学规模最大的课程之一。  

## 课程资源  

- **课程视频：** [YouTube 播放列表](https://www.youtube.com/watch?v=VMj-3S1tku0&list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ)  
- **作业：** 课程中提供的代码实践和项目练习  

更多信息请访问 YouTube 观看完整课程视频。`,
	},
	{
		DisplayName:       `蜜桃tt`,
		School:            `CS自学指南`,
		MajorLine:         `体系结构`,
		ArticleTitle:      `CS自学 | ETH: Computer Architecture`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：ETH: Computer Architecture。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `体系结构`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# ETH: Computer Architecture

## Course Overview

- University: ETH Zurich
- Prerequisites: [DDCA](https://csdiy.wiki/%E4%BD%93%E7%B3%BB%E7%BB%93%E6%9E%84/DDCA/)
- Programming Language: C/C++, Verilog
- Difficulty Level: 🌟🌟🌟🌟
- Estimated Study Time: 70+ hours

This course, taught by Professor Onur Mutlu, delves into computer architecture. It appears to be an advanced course following [DDCA](https://csdiy.wiki/%E4%BD%93%E7%B3%BB%E7%BB%93%E6%9E%84/DDCA/), aimed at teaching how to design control and data paths hardware for a MIPS-like processor, how to execute machine instructions concurrently through pipelining and simple superscalar execution, and how to design fast memory and storage systems. According to student feedback, the course is at least more challenging than CS61C, and some of its content is cutting-edge. Bilibili uploaders recommend it as a supplement to Carnegie Mellon University's 18-447 course. The reading materials provided are extensive, akin to attending a semester's worth of lectures.

The official website description is as follows:
> "We will learn the fundamental concepts of the different parts of modern computing systems, as well as the latest major research topics in Industry and Academia. We will extensively cover memory systems (including DRAM and new Non-Volatile Memory technologies, memory controllers, flash memory), new paradigms like processing-in-memory, parallel computing systems (including multicore processors, coherence and consistency, GPUs), heterogeneous computing, interconnection networks, specialized systems for major data-intensive workloads (e.g., graph analytics, bioinformatics, machine learning), etc. We will focus on fundamentals as well as cutting-edge research. Significant attention will be given to real-life examples and tradeoffs, as well as critical analysis of modern computing systems."

The programming practice involves using Verilog to design and simulate RT implementations of a MIPS-like pipeline processor to enhance theoretical course understanding. The initial experiments include Verilog CPU pipeline programming. Additionally, students will develop a cycle-accurate processor simulator in C and explore processor design options using this simulator.

## Course Resources

- Course Website: [2020 Fall](https://safari.ethz.ch/architecture/fall2022/doku.php?id=start), [2022 Fall](https://safari.ethz.ch/architecture/fall2022/doku.php?id=start)
- Course Videos: Official videos available on the course website. A [2020 version is available on Bilibili](https://www.bilibili.com/video/BV1Vf4y1i7YG/?vd_source=77d47fcb2bac41ab4ad02f265b3273cf).
- Course Textbooks: No designated textbook; each lecture has an extensive bibliography for reading.
- Course Assignments: 5 Projects, mostly related to memory and cache, detailed on the [lab page of the course website](https://safari.ethz.ch/architecture/fall2022/doku.php?id=labs).

## Resource Summary
Some universities in China have introduced this course, so interested students can find additional resources through online searches.`,
	},
	{
		DisplayName:       `安静的仓鼠3`,
		School:            `CS自学指南`,
		MajorLine:         `体系结构`,
		ArticleTitle:      `CS自学 | ETH: Computer Architecture`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：ETH: Computer Architecture。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `体系结构`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# ETH: Computer Architecture

## 课程简介

- 所属大学：ETH Zurich
- 先修要求：[DDCA](https://csdiy.wiki/%E4%BD%93%E7%B3%BB%E7%BB%93%E6%9E%84/DDCA/)
- 编程语言：C/C++，verilog
- 课程难度：🌟🌟🌟🌟
- 预计学时：70 小时 +

讲解计算机体系结构，授课教师是 Onur Mutlu 教授。本课程根据课程描述应该是[DDCA](https://csdiy.wiki/%E4%BD%93%E7%B3%BB%E7%BB%93%E6%9E%84/DDCA/)的进阶课程，课程目标是学习如何为类MIPS处理器设计控制和数据通路硬件，如何通过流水线和简单的超标量执行使机器指令同时执行，以及如何设计快速的内存和存储系统。根据同学反馈，从课程本身的难度上说，至少高于 CS61C ，课程的部分内容十分前沿，B站搬运UP主建议大家作为卡内基梅隆大学18-447的补充。所提供的阅读材料十分丰富，相当于听了一学期讲座。

以下是官网的介绍：
>We will learn the fundamental concepts of the different parts of modern computing systems, as well as the latest major research topics in Industry and Academia. We will extensively cover memory systems (including DRAM and new Non-Volatile Memory technologies, memory controllers, flash memory), new paradigms like processing-in-memory, parallel computing systems (including multicore processors, coherence and consistency, GPUs), heterogeneous computing, interconnection networks, specialized systems for major data-intensive workloads (e.g. graph analytics, bioinformatics, machine learning), etc. We will focus on fundamentals as well as cutting-edge research. Significant attention will be given to real-life examples and tradeoffs, as well as critical analysis of modern computing systems.

编程实践采取 Verilog 设计和模拟类 MIPS 流水线处理器的寄存器传输（RT）实现，以此加强对理论课程的理解。因此前几个实验会有 verilog 的 CPU 流水线编程。同时还将使用C语言开发一个周期精确的处理器模拟器，并使用该模拟器探索处理器设计选项。


## 课程资源

- 课程网站：[2020 Fall](https://safari.ethz.ch/architecture/fall2022/doku.php?id=start), [2022 Fall](https://safari.ethz.ch/architecture/fall2022/doku.php?id=start)
- 课程视频：官方视频详见课程网站。B站有个[2020年版本搬运](https://www.bilibili.com/video/BV1Vf4y1i7YG/?vd_source=77d47fcb2bac41ab4ad02f265b3273cf)。
- 课程教材：无指定教材，每个 lecture 都有大量文献可供阅读
- 课程作业：5 个 Project ，大多与内存和cache相关，具体内容见[课程网站的lab界面](https://safari.ethz.ch/architecture/fall2022/doku.php?id=labs)

## 资源汇总
国内有高校引入了这门课，因此有需要的同学可以搜索到一些资源。`,
	},
	{
		DisplayName:       `花卷鸭`,
		School:            `CS自学指南`,
		MajorLine:         `体系结构`,
		ArticleTitle:      `CS自学 | CS61C: Great Ideas in Computer Architecture`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS61C: Great Ideas in Computer。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `体系结构`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS61C: Great Ideas in Computer Architecture

## Descriptions

- Offered by: UC Berkeley
- Prerequisites: CS61A, CS61B
- Programming Languages: C
- Difficulty: 🌟🌟🌟🌟
- Class Hour: 100 hours

This is the last course in Berkeley's CS61 series, which dives into the internal of computer architecture and will make you understand how the C language is translated into RISC-V assembly language and executed on the CPU. Unlike [Nand2Tetris](https://github.com/PKUFlyingPig/cs-self-learning/blob/master/docs/%E4%BD%93%E7%B3%BB%E7%BB%93%E6%9E%84/N2T.md), this course is much more difficult and more in-depth, covering pipelining, cache, virtual memory, and concurrency-related content.

The projects are very innovative and interesting. Project1 is a warmup assignment in C. In 2020Fall, you will implement the famous *Game of Life*. Project2 requires you to write a fully-connected neural network in RISC-V assembly to classify handwritten digits in MNIST dataset, which is a great exercise to write assembly code. In Project3, you will use Logisim, a digital circuit simulation software, to build a two-stage pipeline CPU from scratch and run RISC-V assembly code on it. In Project4 you will implement a toy version of Numpy, using OpenMP, SIMD, and other techniques to speed up matrix operations.

In a word, this is the best computer architecture course I have ever taken.

## Course Resources

- [Course Website](https://cs61c.org/)
- Course Website (Backup): [Fa24-WayBack Machine](https://web.archive.org/web/20241219154359/https://cs61c.org/fa24/), [Fa20-WayBack Machine](https://web.archive.org/web/20220120134001/https://inst.eecs.berkeley.edu/~cs61c/fa20/), [Fa20-Backup](https://www.learncs.site/docs/curriculum-resource/cs61c/syllabus)
- Recordings: [Su20-Bilibili](https://www.bilibili.com/video/BV1fC4y147iZ/?share_source=copy_web&vd_source=7c3823b46a52fbbef42b79e01d55c300), [Su20-Youtube](https://youtube.com/playlist?list=PLDoI-XvXO0aqgoMQvogzmf7CKiSMSUS3M&si=62aaH5a_PMGrAT2Y), [Fa20-Bilibili](https://www.bilibili.com/video/BV17b42177VG/?share_source=copy_web&vd_source=7c3823b46a52fbbef42b79e01d55c300), [Fa20-Youtube](https://youtube.com/playlist?list=PL0j-r-omG7i0-mnsxN5T4UcVS1Di0isqf&si=CG1EjQiPcw7r7Vs4)
- Assignments: [Fa20-Backup](https://github.com/InsideEmpire/CS61C-Assignment#)

## Personal Resources

All the resources and assignments used by @PKUFlyingPig in this course are maintained in [PKUFlyingPig/CS61C-summer20 - GitHub](https://github.com/PKUFlyingPig/CS61C-summer20).

All the resources and assignments used by @InsideEmpire in this course are maintained in [@InsideEmpire/CS61C-fall20 - GitHub](https://github.com/InsideEmpire/CS61C-PathwayToSuccess).

All the resources and assignments used by @RisingUppercut in this course are maintained in [@RisingUppercut/CS61C-fall24 - GitHub](https://github.com/RisingUppercut/CS61C_2024_Fall).`,
	},
	{
		DisplayName:       `机灵的橙子酱`,
		School:            `CS自学指南`,
		MajorLine:         `体系结构`,
		ArticleTitle:      `CS自学 | CS61C: Great Ideas in Computer Architecture`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS61C: Great Ideas in Computer。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `体系结构`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS61C: Great Ideas in Computer Architecture

## 课程简介

- 所属大学：UC Berkeley
- 先修要求：CS61A, CS61B
- 编程语言：C
- 课程难度：🌟🌟🌟🌟
- 预计学时：100 小时

伯克利 CS61 系列的最后一门课程，深入计算机的硬件细节，带领学生逐步理解 C 语言是如何一步步转化为 RISC-V 汇编并在 CPU 上执行的。和 [Nand2Tetris](./N2T.md) 不同，这门课
在难度和深度上都会提高很多，具体会涉及到流水线、Cache、虚存以及并发相关的内容。

这门课的 Project 也非常新颖有趣。Project1 会让你用 C 语言写一个小程序，20 年秋季学期是著名的游戏 *Game of Life*。Project2 会让你用 RISC-V 汇编编写一个神经网络，用来
识别 MNIST 手写数字，非常锻炼你对汇编代码的理解和运用。Project3 中你会用 Logisim 这个数字电路模拟软件搭建出一个二级流水线的 CPU，并在上面运行 RISC-V 汇编代码。Project4
会让你使用 OpenMP, SIMD 等方法并行优化矩阵运算，实现一个简易的 Numpy。

总而言之，这是个人上过的最好的计算机体系结构的课程。

## 课程资源

- [课程网站](https://cs61c.org/)
- 课程网站 (页面备份): [Fa24-WayBack Machine](https://web.archive.org/web/20241219154359/https://cs61c.org/fa24/), [Fa20-WayBack Machine](https://web.archive.org/web/20220120134001/https://inst.eecs.berkeley.edu/~cs61c/fa20/), [Fa20-备份](https://www.learncs.site/docs/curriculum-resource/cs61c/syllabus)
- 课程视频: [Su20-Bilibili](https://www.bilibili.com/video/BV1fC4y147iZ/?share_source=copy_web&vd_source=7c3823b46a52fbbef42b79e01d55c300), [Su20-Youtube](https://youtube.com/playlist?list=PLDoI-XvXO0aqgoMQvogzmf7CKiSMSUS3M&si=62aaH5a_PMGrAT2Y), [Fa20-Bilibili](https://www.bilibili.com/video/BV17b42177VG/?share_source=copy_web&vd_source=7c3823b46a52fbbef42b79e01d55c300), [Fa20-Youtube](https://youtube.com/playlist?list=PL0j-r-omG7i0-mnsxN5T4UcVS1Di0isqf&si=CG1EjQiPcw7r7Vs4)
- 课程作业: [Fa20-备份](https://github.com/InsideEmpire/CS61C-Assignment#)

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/CS61C-summer20 - GitHub](https://github.com/PKUFlyingPig/CS61C-summer20) 中。

@InsideEmpire 在学习这门课中用到的所有资源和作业实现都汇总在 [@InsideEmpire/CS61C-fall20 - GitHub](https://github.com/InsideEmpire/CS61C-PathwayToSuccess) 中。

@RisingUppercut 在学习这门课中用到的所有资源和作业实现都汇总在 [@RisingUppercut/CS61C-fall24 - GitHub](https://github.com/RisingUppercut/CS61C_2024_Fall) 中。`,
	},
	{
		DisplayName:       `橙子在学习`,
		School:            `CS自学指南`,
		MajorLine:         `体系结构`,
		ArticleTitle:      `CS自学 | Digital Design and Computer Architecture`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Digital Design and Computer Ar。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `体系结构`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Digital Design and Computer Architecture

## Descriptions

- Offered by: ETH Zurich
- Prerequisites: CS50 or same level course; Better have a basic knowledge of C
- Programming Languages: C, Verilog, MIPS, LC3
- Difficulty: 🌟🌟🌟
- Class Hour: 100 hours

In this course, Onur Mutlu, a great expert in the field of Computer Architecture, will teach you about digital circuits and computer architecture. The course is entirely from the perspective of a computer designer, starting with transistors and logic gates and extending to microarchitecture, caches, and virtual memory. It also covers many of the latest research advances in the field of computer architecture. After learning, you will master digital circuits, hardware description language Verilog, MIPS instruction set, CPU design and performance analysis, pipelining, cache, virtual memory, and so on.

There are 9 labs in the course. You will use the Basys 3 FPGA board and [Vivado](https://china.xilinx.com/products/design-tools/vivado.html) to design and synthesize the circuits, starting from combinational and sequential circuits, and eventually assembly into a complete CPU. Except for assignment solutions, all the course materials are open source.

## Course Resources

- Course Website: <https://safari.ethz.ch/digitaltechnik/spring2020/>
- Recordings: <https://www.youtube.com/playlist?list=PL5Q2soXY2Zi_FRrloMa2fUYWPGiZUBQo2>
- Textbook1: Patt and Patel, Introduction to Computing Systems
- Textbook2: Harris and Harris, Digital Design and Computer Architecture (MIPS Edition)
- Assignments: refer to the course website.`,
	},
	{
		DisplayName:       `甜甜的葡萄tt`,
		School:            `CS自学指南`,
		MajorLine:         `体系结构`,
		ArticleTitle:      `CS自学 | ETH Zurich：Digital Design and Computer Architectur`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：ETH Zurich：Digital Design and 。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `体系结构`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# ETH Zurich：Digital Design and Computer Architecture

## 课程简介

- 所属大学：ETH Zurich
- 先修要求：CS50 或同阶课程，最好有 C 语言基础。
- 编程语言：C，Verilog，MIPS 汇编，LC3 汇编
- 课程难度：🌟🌟🌟
- 预计学时：100 小时

体系结构领域的大牛 Onur Mutlu 来教你数字电路和计算机体系结构。课程完全从计算机设计的角度出发，从晶体管、逻辑门开始，一直讲解到微架构、缓存和虚拟内存，还会介绍
很多体系结构领域最新的研究进展。课程共有 9 个 lab，使用 Basys 3 FPGA 开发板（可自行购买）和 Xilinx 公司的  [Vivado 软件](https://china.xilinx.com/products/design-tools/vivado.html)（可在官网免费下载使用）进行电路设计，从组合电路
和时序电路开始，一直到最后部署一个完整的 CPU。课程资料除了 lab 答案和当期考试答案之外全部开源，学完之后你可以掌握计算机相关的数字电路，Verilog 硬件描述语言，MIPS 与 C 之间的转换关系，MIPS 单周期多周期流水线 CPU 的设计和性能分析，缓存，虚拟内存等重要概念。

## 课程资源

- 课程网站：[2020](https://safari.ethz.ch/digitaltechnik/spring2020/),[2023](https://safari.ethz.ch/digitaltechnik/spring2023/)
- 课程视频：[youtube](https://www.youtube.com/playlist?list=PL5Q2soXY2Zi_FRrloMa2fUYWPGiZUBQo2), [B站2020年版本搬运](https://www.bilibili.com/video/BV1MA411s7qq/?vd_source=77d47fcb2bac41ab4ad02f265b3273cf)
- 课程教材1：Patt and Patel, Introduction to Computing Systems
- 课程教材2：Harris and Harris, Digital Design and Computer Architecture (MIPS Edition)
中文译本为《数字设计和计算机体系结构(原书第2版)》
- 课程实验：9 个实验从零开始设计 MIPS CPU，详见课程网站`,
	},
	{
		DisplayName:       `蛋挞草莓`,
		School:            `CS自学指南`,
		MajorLine:         `体系结构`,
		ArticleTitle:      `CS自学 | Coursera: Nand2Tetris`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Coursera: Nand2Tetris。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `体系结构`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Coursera: Nand2Tetris

## Descriptions

- Offered by: Hebrew University of Jerusalem
- Prerequisites: None
- Programming Languages: Chosen by the course taker
- Difficulty: 🌟🌟🌟
- Class Hour: 40 hours

As one of the most popular courses on [Coursera](https://www.coursera.org), tens of thousands of people give it a full score, and over four hundred colleges and high schools teach it. It guides the students who may have no preparatory knowledge in computer science to build a whole computer from Nand logic gates and finally run the Tetris game on it. 

Sounds cool, right? It's even cooler when you implement it!

The course is divided into hardware modules and software modules respectively. 

In the hardware modules, you will dive into a world based on 0 and 1, create various logic gates from Nand gates, and construct a CPU step by step to run a simplified instruction set designed by the course instructors. 

In the software modules, you will first write a compiler to compile a high-level language *Jack* which is designed by the instructors into byte codes that can run on virtual machines. Then you will further translate the byte codes into assembly language that can run on the CPU you create in the hardware modules. You will also develop a simple operating system that enables your computer to support GUI. 

Finally, you can use *Jack* to create the Tetris game, compile it into assembly language, run it on your self-made CPU, and interact with it through the OS built by yourself. After taking this course, you will have a comprehensive and profound understanding of the entire computer architecture, which might be extremely helpful to your subsequent learning. 

You may think that the course is too difficult. Don't worry, because it is completely designed for laymen. In the instructors' expectations, even high school students can understand the content. So as long as you keep pace with the syllabus, you can finish it within a month. 

This course extracts the essence of computers while omitting the tedious and complex details in modern computer systems that are designed for efficiency and performance. Surely you will enjoy the elegance and magic of computers in a relaxing and jolly journey. 

## Course Resources

- Course Website: [Nand2Tetris I](https://www.coursera.org/learn/build-a-computer/home/week/1), [Nand2Tetris II](https://www.coursera.org/learn/nand2tetris2/home/welcome)
- Recordings: Refer to course website
- Textbook: [The Elements of Computing Systems: Building a Modern Computer from First Principles (CN-zh version)][book]
- Assignments: 10 projects to construct a computer, refer to the course website for more details 

[book]: https://github.com/PKUFlyingPig/NandToTetris/blob/master/%5B%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%B3%BB%E7%BB%9F%E8%A6%81%E7%B4%A0%EF%BC%9A%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E6%9E%84%E5%BB%BA%E7%8E%B0%E4%BB%A3%E8%AE%A1%E7%AE%97%E6%9C%BA%5D.(%E5%B0%BC%E8%90%A8).%E5%91%A8%E7%BB%B4.%E6%89%AB%E6%8F%8F%E7%89%88.pdf

## Personal Resources

All the resources and assignments used by @PKUFlyingPig are maintained in [PKUFlyingPig/NandToTetris - GitHub](https://github.com/PKUFlyingPig/NandToTetris).`,
	},
	{
		DisplayName:       `努力的雪花`,
		School:            `CS自学指南`,
		MajorLine:         `体系结构`,
		ArticleTitle:      `CS自学 | Coursera: Nand2Tetris`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Coursera: Nand2Tetris。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `体系结构`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Coursera: Nand2Tetris

## 课程简介

- 所属大学：希伯来大学
- 先修要求：无
- 编程语言：任选一个编程语言
- 课程难度：🌟🌟🌟
- 预计学时：40 小时

[Coursera](https://www.coursera.org) 上被数万人评为满分，在全球四百多所高校、高中被采用，让一个完全没有计算机基础的人从与非门开始造一台计算机，并在上面运行俄罗斯方块小游戏。

听起来就很酷对不对？实现起来更酷！这门课分为硬件和软件两个部分。在硬件部分，你将进入 01 的世界，用与非门构造出逻辑电路，并逐步搭建出一个 CPU 来运行一套课程作者定义的简易汇编代码。在软件部分，你将编写一个编译器，将作者开发的一个名为Jack的高级语言编译为可以运行在虚拟机上的字节码，然后进一步翻译为汇编代码。你还将开发一个简易的 OS，让你的计算机支持输入输出图形界面。至此，你可以用 Jack 开发一个俄罗斯方块的小游戏，将它编译为汇编代码，运行在你用与非门搭建出的 CPU 上，通过你开发的 OS 进行交互。学完这门课程，你将对整个计算机的体系结构有一个全局且深刻的理解，对于你后续课程的学习有着莫大的帮助。

你也许会担心课程会不会很难，但这门课面向的人群是完全没有计算机基础的人，课程作者的目标是让高中生都能理解。因此，只要你按部就班跟着课程规划走，一个月内学完应该绰绰有余。麻雀虽小但是五脏俱全，这门课很好地提取出了计算机的本质，而不过多地陷于现代计算机为了性能而设计出的众多复杂细节。让学习者能在轻松愉快的学习体验中感受计算机的优雅与神奇。

## 课程资源

- 课程网站：[Nand2Tetris I](https://www.coursera.org/learn/build-a-computer/home/week/1), [Nand2Tetris II](https://www.coursera.org/learn/nand2tetris2/home/welcome)
- 课程视频：详见课程网站
- 课程教材：[计算机系统要素：从零开始构建现代计算机][book]
- 课程作业：10 个 Project 带你造台计算机，具体要求详见课程网站

[book]: https://github.com/PKUFlyingPig/NandToTetris/blob/master/%5B%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%B3%BB%E7%BB%9F%E8%A6%81%E7%B4%A0%EF%BC%9A%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E6%9E%84%E5%BB%BA%E7%8E%B0%E4%BB%A3%E8%AE%A1%E7%AE%97%E6%9C%BA%5D.(%E5%B0%BC%E8%90%A8).%E5%91%A8%E7%BB%B4.%E6%89%AB%E6%8F%8F%E7%89%88.pdf

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/NandToTetris - GitHub](https://github.com/PKUFlyingPig/NandToTetris) 中。`,
	},
	{
		DisplayName:       `慵懒的樱桃`,
		School:            `CS自学指南`,
		MajorLine:         `并行与分布式系统`,
		ArticleTitle:      `CS自学 | CMU 15-418/Stanford CS149: Parallel Computing`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CMU 15-418/Stanford CS149: Par。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `并行与分布式系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CMU 15-418/Stanford CS149: Parallel Computing

## Descriptions

- Offered by: CMU and Stanford
- Prerequisites: Computer Architecture, C++
- Programming Languages: C++
- Difficulty: 🌟🌟🌟🌟🌟
- Class Hour: 150 hours

The professor [Kayvon Fatahalian](http://www.cs.cmu.edu/~kayvonf) used to teach course 15-418 at CMU. After he became an assistant professor at Stanford, he offered a similar course, CS149 at Stanford. In general, the 15-418 version is more comprehensive and has lecture recordings, but CS149's programming assignments are more fashionable. Personally, I watched the recordings of 15-418 but completed the assignments of CS149.

The goal of this course is to provide a deep understanding of the fundamental principles and engineering trade-offs involved in designing modern parallel computing systems, as well as to teach how to utilize hardwares and software programming frameworks (such as CUDA, MPI, OpenMP, etc.) for writing high-performance parallel programs. Due to the complexity of parallel computing architecture, this course involves a lot of advanced computer architecture and network communication content, the knowledge is quite low-level and hardcore. Meanwhile, the five assignments develop your understanding and application of upper-level abstraction through software, specifically by analyzing bottlenecks in parallel programs, writing multi-threaded synchronization code, learning CUDA programming, OpenMP programming, and the popular Spark framework, etc. It really combines theory and practice perfectly.

## Resources

- Course Website: [CMU15418](https://www.cs.cmu.edu/afs/cs/academic/class/15418-s18/www/index.html), [CS149](https://gfxcourses.stanford.edu/cs149/fall21)
- Recordings: [CMU15418](https://www.cs.cmu.edu/afs/cs/academic/class/15418-s18/www/schedule.html), [CS149](https://youtube.com/playlist?list=PLoROMvodv4rMp7MTFr4hQsDEcX7Bx6Odp&si=txtQiRDZ9ZZUzyRn)
- Textbook: None
- Assignments: <https://gfxcourses.stanford.edu/cs149/fall21>, 5 assignments.

## Personal Resources

All the resources and assignments used by @PKUFlyingPig in this course are maintained in [PKUFlyingPig/CS149-parallel-computing - GitHub](https://github.com/PKUFlyingPig/CS149-parallel-computing).`,
	},
	{
		DisplayName:       `勤劳的板栗`,
		School:            `CS自学指南`,
		MajorLine:         `并行与分布式系统`,
		ArticleTitle:      `CS自学 | CMU 15-418/Stanford CS149: Parallel Computing`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CMU 15-418/Stanford CS149: Par。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `并行与分布式系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CMU 15-418/Stanford CS149: Parallel Computing

## 课程简介

- 所属大学：CMU 和 Stanford
- 先修要求：计算机体系结构，熟悉 C++
- 编程语言：C++
- 课程难度：🌟🌟🌟🌟🌟
- 预计学时：150 小时

[Kayvon Fatahalian](http://www.cs.cmu.edu/~kayvonf) 教授此前在 CMU 开了 15-418 这门课，后来他成为 Stanford 的助理教授后又开了类似的课程 CS149。但总体来说，15-418 包含的课程内容更丰富，并且有课程回放，但 CS149 的编程作业更 fashion 一些。我个人是观看的 15-418 的课程录影但完成的 CS149 的作业。

这门课会带你深入理解现代并行计算架构的设计原则与必要权衡，并学会如何充分利用硬件资源以及软件编程框架（例如 CUDA，MPI，OpenMP 等）编写高性能的并行程序。由于并行计算架构的复杂性，这门课会涉及诸多高级体系结构与网络通信的内容，知识点相当底层且硬核。与此同时，5 个编程作业则是从软件的层面培养学生对上层抽象的理解与运用，具体会让你分析并行程序的瓶颈、编写多线程同步代码、学习 CUDA 编程、OpenMP 编程以及前段时间大热的 Spark 框架等等。真正意义上将理论与实践完美地结合在了一起。

## 课程资源

- 课程网站：[CMU15418](https://www.cs.cmu.edu/afs/cs/academic/class/15418-s18/www/index.html), [CS149](https://gfxcourses.stanford.edu/cs149/fall21)
- 课程视频：[CMU15418](https://www.cs.cmu.edu/afs/cs/academic/class/15418-s18/www/schedule.html), [CS149](https://youtube.com/playlist?list=PLoROMvodv4rMp7MTFr4hQsDEcX7Bx6Odp&si=txtQiRDZ9ZZUzyRn)
- 课程教材：无
- 课程作业：<https://gfxcourses.stanford.edu/cs149/fall21>，5 个编程作业

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/CS149-parallel-computing - GitHub](https://github.com/PKUFlyingPig/CS149-parallel-computing) 中。`,
	},
	{
		DisplayName:       `椰子跑步去`,
		School:            `CS自学指南`,
		MajorLine:         `并行与分布式系统`,
		ArticleTitle:      `CS自学 | MIT6.824: Distributed System`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT6.824: Distributed System。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `并行与分布式系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT6.824: Distributed System

## Descriptions

- Offered by: MIT
- Prerequisites: Computer Architecture, Parallel Computing
- Programming Languages: Go
- Difficulty: 🌟🌟🌟🌟🌟🌟
- Class Hour: 200 hours

This course, the same as MIT 6.S081, comes from the renowned MIT PDOS Lab. The instructor, Professor Robert Morris, was once a famous hacker who created 'Morris', the first worm virus in the world.

Each lecture will discuss a classic paper in the field of distributed systems, teaching you the important principles and key techniques of distributed systems design and implementation. The Project is known for its difficulty. In four programming assignments, you will implement a KV-store framework step by step based on the Raft consensus algorithm, allowing you to experience the randomness and complexity to implement and debug a distributed system.

This course is so famous that you can easily have access to the project solutions on the Internet. It is highly recommended to implement the projects on your own.

## Resources

- Course Website: <https://pdos.csail.mit.edu/6.824/schedule.html>
- Assignments: refer to the course website.
- Textbook: None
- Assignments: 4 torturing projects, the course website has specific requirements.

## Personal Resources

All the resources and assignments used by @PKUFlyingPig in this course are maintained in [PKUFlyingPig/MIT6.824 - GitHub](https://github.com/PKUFlyingPig/MIT6.824).

@[OneSizeFitsQuorum](https://github.com/OneSizeFitsQuorum) has written a [Lab Documentation](https://github.com/OneSizeFitsQuorum/MIT6.824-2021) that quite clearly describes many of the details to be considered when implementing lab 1-4 and challenge 1-2, you can read when you encounter bottlenecks ~ ~`,
	},
	{
		DisplayName:       `清新的拿铁`,
		School:            `CS自学指南`,
		MajorLine:         `并行与分布式系统`,
		ArticleTitle:      `CS自学 | MIT6.824: Distributed System`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT6.824: Distributed System。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `并行与分布式系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT6.824: Distributed System

## 课程简介

- 所属大学：MIT
- 先修要求：计算机体系结构，并行编程
- 编程语言：Go
- 课程难度：🌟🌟🌟🌟🌟🌟
- 预计学时：200 小时

这门课和 MIT 6.S081 一样，出品自 MIT 大名鼎鼎的 PDOS 实验室，授课老师 Robert Morris 教授曾是一位顶尖黑客，世界上第一个蠕虫病毒 Morris 病毒就是出自他之手。

这门课每节课都会精读一篇分布式系统领域的经典论文，并由此传授分布式系统设计与实现的重要原则和关键技术。同时其课程 Project 也是以其难度之大而闻名遐迩，4 个编程作业循序渐进带你实现一个基于 Raft 共识算法的 KV-store 框架，让你在痛苦的 debug 中体会并行与分布式带来的随机性和复杂性。

同样，这门课由于太过出名，网上答案无数，希望大家不要参考，而是力图自主实现整个 Project。

## 课程资源

- 课程网站：<https://pdos.csail.mit.edu/6.824/schedule.html>
- 课程视频：参见课程网站链接
- 课程视频中文翻译：<https://mit-public-courses-cn-translatio.gitbook.io/mit6-824/>
- 课程教材：无，以阅读论文为主
- 课程作业：4 个非常虐的 Project，具体要求参见课程网站

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/MIT6.824 - GitHub](https://github.com/PKUFlyingPig/MIT6.824) 中。

@[OneSizeFitsQuorum](https://github.com/OneSizeFitsQuorum) 的 [Lab 文档](https://github.com/OneSizeFitsQuorum/MIT6.824-2021) 较为清晰地介绍了实现 lab 1-4 和 challenge 1-2 时需要考虑的许多细节，在遇到瓶颈期时可以阅读一下~~`,
	},
	{
		DisplayName:       `拿铁章鱼`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | CMake`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CMake。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CMake 

## Why CMake 

Similar to GNU make, CMake is a cross-platform tool designed to build, test and package software. It uses CMakeLists.txt to define build configuration, and have more functionalities compared to GNU make. It is highly recommended to learn GNU Make and get familiar with Makefile first before learning CMake. 

## How to learn CMake 

Compare to ` + "`" + `Makefile` + "`" + `, ` + "`" + `CMakeLists.txt` + "`" + ` is more obscure and difficult to understand and use. Nowadays many IDEs (e.g., Visual Studio, CLion) offer functionalities to generate ` + "`" + `CMakeLists.txt` + "`" + ` automatically, but it's still necessary to manage basic usage of ` + "`" + `CMakeLists.txt` + "`" + `. Besides [Official CMake Tutorial](https://cmake.org/cmake/help/latest/guide/tutorial/index.html), [this one-hour video tutorial (in Chinese)](https://www.bilibili.com/video/BV14h41187FZ) presented by IPADS group at SJTU is also a good learning resource.`,
	},
	{
		DisplayName:       `包子写代码`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | Docker`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Docker。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Docker

## Why Docker

The main obstacle when using software/tools developed by others is often the hassle of setting up the environment. This configuration headache can significantly dampen your enthusiasm for software and programming. While virtual machines can solve some of these issues, they are cumbersome and might not be worth simulating an entire operating system for a single application's configuration.

[Docker](https://www.docker.com/) has changed the game by making environment configuration (potentially) less painful. In essence, Docker uses lightweight "containers" instead of an entire operating system to support an application's configuration. Applications, along with their environment configurations, are packaged into images that can freely run on different platforms in containers, saving considerable time and effort for everyone.

## How to learn Docker

The [official Docker documentation](https://docs.docker.com/) is the best starting point, but the best teacher is often yourself—try using Docker to experience its convenience. Docker has rapidly developed in the industry and is already quite mature. You can download its desktop version and use the graphical interface.

If you're like me, reinventing the wheel, consider building a [Mini Docker](https://github.com/PKUFlyingPig/rubber-docker) yourself to deepen your understanding.

[KodeKloud Docker for the Absolute Beginner](https://kodekloud.com/courses/docker-for-the-absolute-beginner/) offers a comprehensive introduction to Docker's basic functionalities with numerous hands-on exercises. It also provides a free cloud environment for practice. While other cloud-related courses, such as Kubernetes, may require payment, I highly recommend them. The explanations are detailed, suitable for beginners, and come with a corresponding Kubernetes lab environment, eliminating the need for complex setups.`,
	},
	{
		DisplayName:       `凉皮荔枝`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | Docker`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Docker。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Docker

## 为什么使用 Docker

使用别人写好的软件/工具最大的障碍是什么——必然是配环境。配环境带来的折磨会极大地消解你对软件、编程本身的兴趣。虚拟机可以解决配环境的一部分问题，但它庞大笨重，且为了某个应用的环境配置好像也不值得模拟一个全新的操作系统。

[Docker](https://www.docker.com/) 的出现让环境配置变得（或许）不再折磨。简单来说 Docker 使用轻量级的“容器”（container）而不是整个操作系统去支持一个应用的配置。应用自身连同它的环境配置被打包为一个个 image 可以自由运行在不同平台的一个个 container 中，这极大地节省了所有人的时间成本。

## 如何学习 Docker

[Docker 官方文档](https://docs.docker.com/)当然是最好的初学教材，但最好的导师一定是你自己——尝试去使用 Docker 才能享受它带来的便利。Docker 在工业界发展迅猛并已经非常成熟，你可以下载它的桌面端并使用图形界面。

当然，如果你像我一样，是一个疯狂的造轮子爱好者，那不妨自己亲手写一个[迷你 Docker](https://github.com/PKUFlyingPig/rubber-docker) 来加深理解。

[KodeKloud Docker for the Absolute Beginner](https://kodekloud.com/courses/docker-for-the-absolute-beginner/) 全面的介绍了 Docker 的基础功能，并且有大量的配套练习，同时提供免费的云环境来完成练习。其余的云相关的课程如 Kubernetes 需要付费，但个人强烈推荐：讲解非常仔细，适合从 0 开始的新手；有配套的 Kubernetes 的实验环境，不用被搭建环境劝退。`,
	},
	{
		DisplayName:       `榴莲爱吃辣`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | Emacs`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Emacs。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Emacs

## Why Emacs

Emacs is a powerful editor as famous as Vim. Emacs has almost all the benefits of Vim, such as: 

- Everything can be done with keyboard only, as there are a large number of shortcuts to improve the efficiency of code editing.
- Supporting both graphical and non-graphical interface in various scenarios.

Besides, the biggest difference between Emacs and most other editors lies in its powerful extensibility. Emacs kernel imposes no restrictions on users behaviors. With Emacs Lisp programming language, users is able to write any plugins to extend the functionality. After decades of development, Emacs' plugin ecosystem is arguably one of the richest and most powerful in the editor world. There is a joke saying that "Emacs is an OS that lacks a decent text editor". Futhermore, you can also write your own Emacs extensions with only a small amount of effort.

Emacs is friendly to Vim users as there is an extension called [evil](https://github.com/emacs-evil/evil) that migrate Vim operations into Emacs. Users can switch from Vim to Emacs with minimum effort. Statistics show that a considerable number of users would switch from Vim to Emacs, but there were almost no users who would switch from Emacs to Vim. In fact, the only weaknesss of Emacs is that it is not as efficient as Vim in pure text editing because of Vim's multi-modal editing. However, with Emacs' powerful extensibility, it can make up for its weaknesses by combining the strengths of both.

## How to learn Emacs

Same as Vim, Emacs also has a steep learning curve. But once you understand the basic underlying logic, you will never live without it. 

There are plenty of tutorials for Emacs. Since Emacs is highly customizable, every user has their own learning path. Here are some good starting points:

- [This tutorial](https://www.masteringemacs.org/article/beginners-guide-to-emacs) is a brief guide to the basic logic of Emacs.
- [Awesome Emacs](https://github.com/emacs-tw/awesome-emacs) lists a large number of useful Emacs packages, utilities, and libraries.

## Keyboard remapping

One of the most shortcomings of Emacs is the excessive use of the Ctrl key, which is a burden on your left little finger. It is highly recommended to change the keyboard mapping of the Ctrl key. Please refer to [Vim](Vim.en.md) for details to remapping.`,
	},
	{
		DisplayName:       `章鱼马卡龙`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | Emacs`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Emacs。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Emacs

## 为什么学习 Emacs

Emacs 是一个与 Vim 齐名的强大编辑器，事实上 Emacs 几乎具有 Vim 的所有好处，例如：

- 只需要键盘就可以完成所有操作，大量使用快捷键，具有极高的编辑效率。
- 既可以在终端无图形界面的场景下使用，也可使用有图形界面的版本获得更现代、更美观的体验。

此外，Emacs 与其它大部分编辑器最大的不同就在于其强大的扩展性。Emacs 的内核没有对用户做出任何限制，使用 Emacs Lisp 编程语言可以为 Emacs 编写任意逻辑的插件来扩展 Emacs 的功能。经过几十年的积累，Emacs 的插件生态可谓编辑器中最为丰富和强大的生态之一。有一种说法是，“Emacs 表面上是个编辑器，其实是一个操作系统”。只要稍作学习，你也可以编写属于自己的 Emacs 扩展。

Emacs 对 Vim 用户也十分友好，有一个叫 [evil](https://github.com/emacs-evil/evil) 的插件可以让用户在 Emacs 中使用 Vim 的基本操作，只需要很低的迁移成本即可从 Vim 转到 Emacs。曾经有统计显示有相当一部分用户会从 Vim 转到 Emacs，但几乎没有用户从 Emacs 转到 Vim。事实上，Emacs 相对 Vim 最大的不足是纯文本编辑方面不如 Vim 的多模态编辑效率高，但凭借其强大的扩展性，Emacs 可以扬长避短，把 Vim 吸收进来，结合了二者的长处。

## 如何学习 Emacs

与 Vim 相同，Emacs 的学习曲线也比较陡峭，但一旦理解了 Emacs 的使用逻辑，就会爱不释手。然而，网上的 Emacs 资料大多不细致、不够准确，甚至有哗众取宠的嫌疑。

这里给大家推荐一个较新的中文教程[《专业 Emacs 入门》](https://www.zhihu.com/column/c_[电话已隐藏]12279808)，这篇教程比较系统和全面，且讲述相对比较耐心细致，在讲解 Emacs 基本逻辑的同时也给出了成套的插件推荐，读完后可以获得一个功能完善的、接近 IDE 的 Emacs，因此值得一读。学完教程只是刚刚开始，学会之后要经常使用，在使用中遇到问题勤于搜索和思考，最终才能得心应手。

## 关于键位映射

Emacs 的唯一缺点便是对 Ctrl 键的使用过多，对小手指不是很友好，强烈建议更改 Ctrl 键的键盘映射。更改映射的方式与 [Vim 教程](Vim.md)中的方法相同，这里不做赘述。`,
	},
	{
		DisplayName:       `企鹅种花中`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | GNU Make`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：GNU Make。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# GNU Make

## Why GNU Make

Everyone remembers their first "hello world" program. After editing ` + "`" + `helloworld.c` + "`" + `, you needed to use ` + "`" + `gcc` + "`" + ` to compile and generate an executable file, and then execute it. (If you're not familiar with this, please Google *gcc compilation* and understand the related content first.) However, what if your project consists of hundreds of C source files scattered across various subdirectories? How do you compile and link them together? Imagine if your project takes half an hour to compile (quite common for large projects), and you only changed a semicolon—would you want to wait another half an hour?

This is where GNU Make comes to the rescue. It allows you to define the entire compilation process and the dependencies between target files and source files in a script (known as a ` + "`" + `Makefile` + "`" + `). It only recompiles the parts affected by your changes, significantly reducing compilation time.

## How to learn GNU Make

Here is a well-written [document] (https://seisman.github.io/how-to-write-makefile/overview.html) for in-depth and accessible understanding.

Mastering GNU Make is relatively easy, but using it effectively requires continuous practice. Integrate it into your daily development routine, be diligent in learning, and mimic the ` + "`" + `Makefile` + "`" + ` styles from other excellent open-source projects. Develop your own template that suits your needs, and over time, you will become more proficient in using GNU Make.`,
	},
	{
		DisplayName:       `花卷听播客`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | Git.en`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Git.en。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Git 

## Why Git 

Git is a distributed version control system. The father of Linux, Linus Torvalds developed Git to maintain the version control of Linux, replacing the centralized version control tools which were difficult and costly to use. 

The design of Git is very elegant, but beginners usually find it very difficult to use without understanding its internal logic. It is very easy to mess up the version history if misusing the commands. 

Git is a powerful tool and when you finally master it, you will find all the effort paid off. 

## How to learn Git 

Different from Vim, I don't suggest beginners use Git rashly without fully understanding it, because its inner logic can not be acquainted by practicing. Here is my recommended learning path: 

1. Read this [Git tutorial](https://missing.csail.mit.edu/2020/version-control/) in English, or you can watch this [Git tutorial (by 尚硅谷)](https://www.bilibili.com/video/BV1vy4y1s7k6) in Chinese. 
2. Read Chap1 - Chap5 of this open source book [Pro Git](https://git-scm.com/book/en/v2). Yes, to learn Git, you need to read a book.
3. [Learn Git Branching](https://learngitbranching.js.org/) is an interactive Git learning website that can help you quickly get started with using Git.
4. Now that you have understood its principles and most of its usages, it's time to consolidate those commands by practicing. How to use Git properly is a kind of philosophy. I recommend reading this blog [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/). 
5. You are now in love with Git and are not content with only using it, you want to build a Git by yourself! Great, that's exactly what I was thinking. [This tutorial](https://wyag.thb.lt/) will satisfy you! 
6. What? Building your own Git is not enough?  Seems that you are also passionate about reinventing the wheels. These two GitHub projects, [build-your-own-x](https://github.com/danistefanovic/build-your-own-x) and [project-based-learning](https://github.com/tuvtran/project-based-learning), collected many wheel-reinventing tutorials, e.g., text editor, virtual machine, docker, TCP and so on.`,
	},
	{
		DisplayName:       `草莓wow`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | Git`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Git。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Git

## 为什么使用 Git

Git 是一款分布式的代码版本控制工具，Linux 之父 Linus 嫌弃当时主流的中心式的版本控制工具太难用还要花钱，就自己开发出了 Git 用来维护 Linux 的版本（给大佬跪了）。

Git 的设计非常优雅，但初学者通常因为很难理解其内部逻辑因此会觉得非常难用。对 Git 不熟悉的初学者很容易出现因为误用命令将代码给控制版本控制没了的状况（好吧是我）。

但相信我，和 Vim 一样，Git 是一款你最终掌握之后会感叹“它值得！”的神器。

## 如何学习 Git

和 Vim 不同，我不建议初学者在一知半解的情况下贸然使用 Git，因为它的内部逻辑并不能熟能生巧，而是需要花时间去理解。我推荐的学习路线如下：

1. 阅读这篇 [Git tutorial](https://missing.csail.mit.edu/2020/version-control/)，视频的话可以看这个[尚硅谷Git教程](https://www.bilibili.com/video/BV1vy4y1s7k6)
2. 阅读这本开源书籍 [Pro Git](https://git-scm.com/book/en/v2) 的 Chapter1 - Chapter5，是的没错，学 Git 需要读一本书（捂脸）。
3. [Learn Git Branching](https://learngitbranching.js.org/) 是一个交互式的 Git 学习网站, 可以帮助你快速上手 Git 的使用。
4. 此时你已经掌握了 Git 的原理和绝大部分用法，接下来就可以在实践中反复巩固 Git 的命令了。但用好它同样是一门哲学，我个人觉得这篇[如何写好 Commit Message](https://chris.beams.io/posts/git-commit/) 的博客非常值得一读。
5. 好的此时你已经爱上了 Git，你已经不满足于学会它了，你想自己实现一个 Git！巧了，我当年也有这样的想法，[这篇 tutorial](https://wyag.thb.lt/) 可以满足你！
6. 什么？光实现一个 Git 无法满足你？小伙子/小仙女有前途，巧的是我也喜欢造轮子，这两个 GitHub 项目 [build-your-own-x](https://github.com/danistefanovic/build-your-own-x) 和 [project-based-learning](https://github.com/tuvtran/project-based-learning) 收录了你能想到的各种造轮子教程，比如：自己造个编辑器、自己写个虚拟机、自己写个 docker、自己写个 TCP 等等等等。`,
	},
	{
		DisplayName:       `刺猬在发呆`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | GitHub`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：GitHub。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# GitHub

## What is GitHub

Functionally, GitHub is an online platform for hosting code. You can host your local Git repositories on GitHub for collaborative development and maintained by a group. However, GitHub's significance has evolved far beyond that. It has become a very active and resource-rich open-source community. Developers from all over the world share a wide variety of open-source software on GitHub. From industrial-grade deep learning frameworks like PyTorch and TensorFlow to practical scripts consisting of just a few lines of code, GitHub offers hardcore knowledge sharing, beginner-friendly tutorials, and even many technical books are open-sourced here (like the one you're reading now). Browsing GitHub has become a part of my daily life.

On GitHub, stars are the ultimate affirmation for a project. If you find this book useful, you are welcome to enter the repository's homepage via the link in the upper right corner and give your precious star✨.

## How to Use GitHub

If you have never created your own remote repository on GitHub or cloned someone else's code, I suggest you start your open-source journey with [GitHub's official tutorial](https://docs.github.com/en/get-started).

If you want to keep up with some interesting open-source projects on GitHub, I highly recommend the [HelloGitHub](https://hellogithub.com/) website. It regularly features GitHub's recently trending or very interesting open-source projects, giving you the opportunity to access various quality resources firsthand.

I believe GitHub's success is due to the "one for all, all for one" spirit of open source and the joy of sharing knowledge. If you also want to become the next revered open-source giant or the author of a project with tens of thousands of stars, then transform your ideas that spark during development into code and showcase them on GitHub.

However, it's important to note that the open-source community is not lawless. Many open-source softwares are not meant for arbitrary copying, distribution, or even sale. Understanding various [open-source licenses](https://www.runoob.com/w3cnote/open-source-license.html) and complying with them is not only a legal requirement but also the responsibility of every member of the open-source community.`,
	},
	{
		DisplayName:       `馒头汤圆`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | GitHub`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：GitHub。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# GitHub

## GitHub 是什么

从功能上来说，GitHub 是一个在线代码托管平台。你可以将你的本地 Git 仓库托管到 GitHub 上，供多人同时开发浏览。但现如今 GitHub 的意义已远不止如此，它已经演变为一个非常活跃且资源极为丰富的开源交流社区。全世界的软件开发者在 GitHub 上分享各式各样种类繁多的开源软件。大到工业级的深度学习框架 PyTorch, TensorFlow，小到几十行的实用脚本，既有硬核的知识分享，也有保姆级的教程指导，甚至很多技术书籍也在 GitHub上开源（例如诸位正在看的这本——如果我厚着脸皮勉强称之为书的话）。闲来无事逛逛 GitHub 已经成为了我日常生活的一部分。

在 GitHub 里，星星是对一个项目至高无上的肯定，如果你觉得这本书对你有用的话，欢迎通过右上角的链接进入仓库主页献出你宝贵的星星✨。

## 如何使用 GitHub

如果你还从未在 GitHub 上建立过自己的远程仓库，也没有克隆过别人的代码，那么我建议你从 [GitHub的官方教程](https://docs.github.com/cn/get-started)开始自己的开源之旅。

如果你想时刻关注 GitHub 上一些有趣的开源项目，那么我向你重磅推荐 [HelloGitHub](https://hellogithub.com/) 这个网站以及它的同名微信公众号。它会定期收录 GitHub 上近期开始流行的或者非常有趣的开源项目，让你有机会第一时间接触各类优质资源。

GitHub 之所以成功，我想是得益于“我为人人，人人为我”的开源精神，得益于知识分享的快乐。如果你也想成为下一个万人敬仰的开源大佬，或者下一个 star 破万的项目作者。那就把你在开发过程中灵感一现的 idea 化作代码，展示在 GitHub 上吧～

不过需要提醒的是，开源社区不是法外之地，很多开源软件并不是可以随意复制分发甚至贩卖的，了解各类[开源协议](https://www.runoob.com/w3cnote/open-source-license.html)并遵守，不仅是法律的要求，更是每个开源社区成员的责任。`,
	},
	{
		DisplayName:       `可颂z`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | LaTeX`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：LaTeX。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# LaTeX

## Why Learn LaTeX

If you need to write academic papers, please skip directly to the next section, as learning LaTeX is not just a choice but a necessity.

LaTeX is a typesetting system based on TeX, developed by Turing Award winner Lamport, while TeX was originally developed by Knuth, both of whom are giants in the field of computer science. Of course, the developers' prowess is not the reason we learn LaTeX. The biggest difference between LaTeX and the commonly used WYSIWYG (What You See Is What You Get) Word documents is that in LaTeX, users only need to focus on the content of the writing, leaving the typesetting entirely to the software. This allows people without any typesetting experience to produce papers or articles with highly professional formatting.

Berkeley computer science professor Christos Papadimitriou once jokingly said:

> Every time I read a LaTeX document, I think, wow, this must be correct!

## How to Learn LaTeX

The recommended learning path is as follows:

- Setting up the LaTeX environment can be a headache. If you encounter problems with configuring LaTeX locally, consider using [Overleaf], an online LaTeX editor. The site not only offers a variety of LaTeX templates to choose from but also eliminates the difficulty of environment setup.
- Read the following three tutorials: [Part-1], [Part-2], [Part-3].
- The best way to learn LaTeX is, of course, by writing papers. However, starting with a math class and using LaTeX for homework is also a good choice.

[Overleaf]: https://www.overleaf.com
[Part-1]: https://www.overleaf.com/latex/learn/free-online-introduction-to-latex-part-1
[Part-2]: https://www.overleaf.com/latex/learn/free-online-introduction-to-latex-part-2
[Part-3]: https://www.overleaf.com/latex/learn/free-online-introduction-to-latex-part-3

Other recommended introductory materials include:

- A brief guide to installing LaTeX [[GitHub](https://github.com/OsbertWang/install-latex-guide-zh-cn)] or the TEX Live Guide (texlive-zh-cn) [[PDF](https://www.tug.org/texlive/doc/texlive-zh-cn/texlive-zh-cn.pdf)] can help you with installation and environment setup.
- A (not so) brief introduction to LaTeX2ε (lshort-zh-cn) [[PDF](https://mirrors.ctan.org/info/lshort/chinese/lshort-zh-cn.pdf)] [[GitHub](https://github.com/CTeX-org/lshort-zh-cn)], translated by the CTEX development team, helps you get started quickly and accurately. It's recommended to read it thoroughly.
- Liu Haiyang's "Introduction to LaTeX" can be used as a reference book, to be consulted when you have specific questions. Skip the section on CTEX suite.
- [Modern LaTeX Introduction Seminar](https://github.com/stone-zeng/latex-talk)
- [A Very Short LaTeX Introduction Document](https://liam.page/2014/09/08/latex-introduction/)`,
	},
	{
		DisplayName:       `企鹅要毕业了`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | LaTeX`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：LaTeX。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# LaTeX

## 为什么学 LaTeX

如果你需要写论文，那么请直接跳到下一节，因为你不学也得学。

LaTeX 是一种基于 TeX 的排版系统，由图灵奖得主 Lamport 开发，而 Tex 则是由 Knuth 最初开发，这两位都是计算机界的巨擘。当然开发者强并不是我们学习 LaTeX 的理由，LaTeX 和常见的所见即所得的 Word 文档最大的区别就是用户只需要关注写作的内容，而排版则完全交给软件自动完成。这让没有任何排版经验的普通人得以写出排版非常专业的论文或文章。

Berkeley 计算机系教授 Christos Papadimitriou 曾说过一句半开玩笑的话：

> Every time I read a LaTeX document, I think, wow, this must be correct!

## 如何学习 LaTeX

推荐的学习路线如下：

- LaTeX 的环境配置是个比较头疼的问题。如果你本地配置 LaTeX 环境出现了问题，可以考虑使用 [Overleaf] 这个在线 LaTeX 编辑网站。站内不仅有各种各样的 LaTeX 模版供你选择，还免去了环境配置的难题。
- 阅读下面三篇 Tutorial: [Part-1], [Part-2], [Part-3]。
- 学习 LaTeX 最好的方式当然是写论文，不过从一门数学课入手用 LaTeX 写作业也是一个不错的选择。

[Overleaf]: https://www.overleaf.com
[Part-1]: https://www.overleaf.com/latex/learn/free-online-introduction-to-latex-part-1
[Part-2]: https://www.overleaf.com/latex/learn/free-online-introduction-to-latex-part-2
[Part-3]: https://www.overleaf.com/latex/learn/free-online-introduction-to-latex-part-3

其他值得推荐的入门学习资料如下：

- 一份简短的安装 LaTeX 的介绍 [[GitHub](https://github.com/OsbertWang/install-latex-guide-zh-cn)] 或者 TEX Live 指南（texlive-zh-cn）[[PDF](https://www.tug.org/texlive/doc/texlive-zh-cn/texlive-zh-cn.pdf)] 可以帮助你完成安装和环境配置过程
- 一份（不太）简短的 LaTeX2ε 介绍（lshort-zh-cn）[[PDF](https://mirrors.ctan.org/info/lshort/chinese/lshort-zh-cn.pdf)] [[GitHub](https://github.com/CTeX-org/lshort-zh-cn)] 是由 CTEX 开发小组翻译的，可以帮助你快速准确地入门，建议通读一遍
- 刘海洋的《LaTeX 入门》，可以当作工具书来阅读，有问题再查找，跳过 CTEX 套装部分
- [现代 LaTeX 入门讲座](https://github.com/stone-zeng/latex-talk)
- [一份其实很短的 LaTeX 入门文档](https://liam.page/2014/09/08/latex-introduction/)`,
	},
	{
		DisplayName:       `布丁水母`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | Scoop`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Scoop。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Scoop

## Why Use Scoop

Setting up a development environment in Windows has always been a complex and challenging task. The lack of a unified standard means that the installation methods for different development environments vary greatly, resulting in unnecessary time costs. Scoop helps you uniformly install and manage common development software, eliminating the need for manual downloads, installations, and environment variable configurations.

For example, to install Python and Node.js, you just need to execute:

` + "`" + `` + "`" + `` + "`" + `powershell
scoop install python
scoop install nodejs
` + "`" + `` + "`" + `` + "`" + `

## Installing Scoop

Scoop requires [Windows PowerShell 5.1](https://aka.ms/wmf5download) or [PowerShell](https://aka.ms/powershell) as its runtime environment. If you are using Windows 10 or later, Windows PowerShell is built into the system. However, the version of Windows PowerShell built into Windows 7 is outdated, and you will need to manually install a newer version of PowerShell.

> Many students have encountered issues due to setting up Windows user accounts with Chinese usernames, leading to user directories also being named in Chinese. Installing software via Scoop into user directories in such cases may cause some software to execute incorrectly. Therefore, it is recommended to install in a custom directory. For other installation methods, please refer to: [ScoopInstaller/Install](https://github.com/ScoopInstaller/Install)

` + "`" + `` + "`" + `` + "`" + `powershell
# Set PowerShell execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Download the installation script
irm get.scoop.sh -outfile 'install.ps1'
# Run the installation, use --ScoopDir parameter to specify Scoop installation path
.\\install.ps1 -ScoopDir 'C:\\Scoop'
` + "`" + `` + "`" + `` + "`" + `

## Using Scoop

Scoop's official documentation is very user-friendly for beginners. Instead of elaborating here, it is recommended to read the [official documentation](https://github.com/ScoopInstaller/Scoop) or the [Quick Start guide](https://github.com/ScoopInstaller/Scoop/wiki/Quick-Start).

## Q&A

### Can Scoop Configure Mirror Sources?

The Scoop community only maintains installation configurations, and all software is downloaded from the official download links provided by the software's creators. Therefore, mirror sources are not provided. If your network environment causes repeated download failures, you may need a bit of [magic](翻墙.md).

### Why Can't I Find Java 8?

For the same reasons mentioned above, the official download links for Java 8 are no longer provided. It is recommended to use [ojdkbuild8](https://github.com/ScoopInstaller/Java/blob/master/bucket/ojdkbuild8.json) as a substitute.

### How Do I Install Python 2?

For software that is outdated and no longer in use, the Scoop community removes it from [ScoopInstaller/Main](https://github.com/ScoopInstaller/Main) and adds it to [ScoopInstaller/Versions](https://github.com/ScoopInstaller/Versions). If you need such software, you need to manually add the bucket:

` + "`" + `` + "`" + `` + "`" + `powershell
scoop bucket add versions
scoop install python27
` + "`" + `` + "`" + `` + "`" + ``,
	},
	{
		DisplayName:       `柠檬馒头`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | Scoop`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Scoop。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Scoop

## 为什么使用 Scoop

在 Windows 下，搭建开发环境一直是一个复杂且困难的问题。由于没有一个统一的标准，导致各种开发环境的安装方式差异巨大，需要付出很多不必要的时间成本。而 Scoop 可以帮助你统一安装并管理常见的开发软件，省去了手动下载安装，配置环境变量等繁琐步骤。

例如安装 python 和 nodejs 只需要执行：

` + "`" + `` + "`" + `` + "`" + `powershell
scoop install python
scoop install nodejs
` + "`" + `` + "`" + `` + "`" + `

## 安装 Scoop

Scoop 需要 [Windows PowerShell 5.1](https://aka.ms/wmf5download) 或者 [PowerShell](https://aka.ms/powershell) 作为运行环境，如果你使用的是 Windows 10 及以上版本，Windows PowerShell 是内置在系统中的。而 Windows 7 内置的 Windows PowerShell 版本过于陈旧，你需要手动安装新版本的 PowerShell。

> 由于发现很多同学在设置 Windows 用户时使用了中文用户名，导致了用户目录也变成了中文名。如果按照 Scoop 的默认方式将软件安装到用户目录下，可能会造成部分软件执行错误。所以这里推荐安装到自定义目录，如果需要其他安装方式请参考： [ScoopInstaller/Install](https://github.com/ScoopInstaller/Install)

` + "`" + `` + "`" + `` + "`" + `powershell
# 设置 PowerShell 执行策略
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# 下载安装脚本
irm get.scoop.sh -outfile 'install.ps1'
# 执行安装, --ScoopDir 参数指定 Scoop 安装路径
.\\install.ps1 -ScoopDir 'C:\\Scoop'
` + "`" + `` + "`" + `` + "`" + `

## 使用 Scoop

Scoop 的官方文档对于新手非常友好，相对于在此处赘述更推荐阅读 [官方文档](https://github.com/ScoopInstaller/Scoop) 或 [快速入门](https://github.com/ScoopInstaller/Scoop/wiki/Quick-Start) 。

## Q&A

### Scoop 能配置镜像源吗？

Scoop 社区仅维护安装配置，所有的软件都是从该软件官方提供的下载链接进行下载，所以无法提供镜像源。如果因为你的网络环境导致多次下载失败，那么你需要一点点 [魔法](翻墙.md)。

### 为什么找不到 Java8？

原因同上，官方已不再提供 Java8 的下载链接，推荐使用 [ojdkbuild8](https://github.com/ScoopInstaller/Java/blob/master/bucket/ojdkbuild8.json) 替代。

### 我需要安装 python2 该如何操作？

对于已经过时弃用的软件，Scoop 社区会将其从 [ScoopInstaller/Main](https://github.com/ScoopInstaller/Main) 中移除并将其添加到 [ScoopInstaller/Versions](https://github.com/ScoopInstaller/Versions) 中。如果你需要这些软件的话需要手动添加 bucket：

` + "`" + `` + "`" + `` + "`" + `powershell
scoop bucket add versions
scoop install python27
` + "`" + `` + "`" + `` + "`" + ``,
	},
	{
		DisplayName:       `洒脱的蜜桃`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | Vim.en`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Vim.en。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Vim

## Why Vim

In my opinion, the Vim editor has the following benefits:

- It keeps your finger on the keyboard throughout the development and moving the cursor without the arrow keys keeps your fingers in the best position for typing.
- Convenient file switching and panel controls allow you to edit multiple files simultaneously or even different locations of the same file.
- Vim's macros can batch repeat operations (e.g. add tabs to multi-lines, etc.)
- Vim is well-suited for Linux servers without GUI. When you connect to a remote server through ` + "`" + `ssh` + "`" + `, you can only develop from the command line because there is no GUI (of course, many IDEs such as PyCharm now provide ` + "`" + `ssh` + "`" + ` plugins to solve this problem).
- A rich ecology of plugins gives you the world's most fancy command-line editor.

## How to learn Vim

Unfortunately Vim does have a pretty steep learning curve and it took me a few weeks to get used to developing with Vim. You'll feel very uncomfortable at first, but once you get past the initial stages, trust me, you'll fall in love with Vim.

There is a vast amount of learning material available on Vim, but the best way to master it is to use it in your daily development, no need to learn all the fancy advanced Vim tricks right away. The recommended learning path is as follows:

- Read [This tutorial](https://missing.csail.mit.edu/2020/editors/) first to understand the basic Vim concepts and usage.
- Use Vim's own ` + "`" + `vimtutor` + "`" + ` to practice. After installing Vim, type ` + "`" + `vimtutor` + "`" + ` directly into the command line to enter the practice program.
- Then you can force yourself to use Vim for development, and you can install Vim plugins in your favorite IDE.
- Once you're fully comfortable with Vim, a new world opens up to you, and you can configure your own Vim on demand (by modifying the ` + "`" + `.vimrc` + "`" + ` file), and there are countless resources on the Internet to learn from.
- If you want to know more about how to customize Vim to suit your needs, [_Learn Vim Script the Hard Way_](https://learnvimscriptthehardway.stevelosh.com/) is a perfect start point.

## Remapping Keys

Ctrl and Esc keys are probably two of the most used keys in Vim. However, these two keys are pretty far away from home row.
In order to make it easier to reach these keys, you can remap CapsLock to Esc or Ctrl.

On Windows, [Powertoys](https://learn.microsoft.com/en-us/windows/powertoys/) or [AutoHotkey](https://www.autohotkey.com/) can be used to achieve this goal.    
On macOS, you can remap keys in system settings, see this [page](https://vim.fandom.com/wiki/Map_caps_lock_to_escape_in_macOS). [Karabiner-Elements](https://karabiner-elements.pqrs.org/) also works.

A better solution is to make CapsLock function as Esc and Ctrl simultaneously. Click CapsLock to send Esc, hold CapsLock to use it as Ctrl key. Here's how to do it on different systems:

- [Windows](https://gist.github.com/sedm0784/4443120)  
- [MacOS](https://ke-complex-modifications.pqrs.org/#caps_lock_tapped_escape_held_left_control)  
- [Linux](https://www.jianshu.com/p/6fdc0e0fb266)

## Recommended References

- Neil, Drew. Practical Vim: Edit Text at the Speed of Thought. N.p., Pragmatic Bookshelf, 2015.
- Neil, Drew. Modern Vim: Craft Your Development Environment with Vim 8 and Neovim. United States, Pragmatic Bookshelf.`,
	},
	{
		DisplayName:       `珍珠在摸鱼`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | Vim`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Vim。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Vim

## 为什么学习 Vim

在我看来 Vim 编辑器有如下的好处：

- 让你的整个开发过程手指不需要离开键盘，而且光标的移动不需要方向键使得你的手指一直处在打字的最佳位置。
- 方便的文件切换以及面板控制可以让你同时开发多份文件甚至同一个文件的不同位置。
- Vim 的宏操作可以批量化处理重复操作（例如多行 tab，批量加双引号等等）
- Vim 是很多服务器自带的命令行编辑器，当你通过 ` + "`" + `ssh` + "`" + ` 连接远程服务器之后，由于没有图形界面，只能在命令行里进行开发（当然现在很多 IDE 如 PyCharm 提供了 ` + "`" + `ssh` + "`" + ` 插件可以解决这个问题）。
- 异常丰富的插件生态，让你拥有世界上最花里胡哨的命令行编辑器。

## 如何学习 Vim

不幸的是 Vim 的学习曲线确实相当陡峭，我花了好几个星期才慢慢适应了用 Vim 进行开发的过程。最开始你会觉得非常不适应，但一旦熬过了初始阶段，相信我，你会爱上 Vim。

Vim 的学习资料浩如烟海，但掌握它最好的方式还是将它用在日常的开发过程中，而不是一上来就去学各种花里胡哨的高级 Vim 技巧。个人推荐的学习路线如下：

- 先阅读[这篇 tutorial](https://missing.csail.mit.edu/2020/editors/)，掌握基本的 Vim 概念和使用方式，不想看英文的可以阅读[这篇教程](https://github.com/wsdjeg/vim-galore-zh_cn)。
- 用 Vim 自带的 ` + "`" + `vimtutor` + "`" + ` 进行练习，安装完 Vim 之后直接在命令行里输入 ` + "`" + `vimtutor` + "`" + ` 即可进入练习程序。
- 最后就是强迫自己使用 Vim 进行开发，IDE 里可以安装 Vim 插件。
- 等你完全适应 Vim 之后新的世界便向你敞开了大门，你可以按需配置自己的 Vim（修改 ` + "`" + `.vimrc` + "`" + ` 文件），网上有数不胜数的资源可以借鉴。
- 如果你想对配置 Vim 有更加深入的了解，[_Learn Vim Script the Hard Way_](https://learnvimscriptthehardway.stevelosh.com/) 是一个很好的资源。

## 关于键位映射

用 Vim 编辑代码的时候会频繁用到 ESC 和 CTRL 键, 但是这两个键都离 home row 很远, 可以把 CapsLock 键映射到 Esc 或者 Ctrl 键，让手更舒服一些。

Windows 系统可以使用 [Powertoys](https://learn.microsoft.com/en-us/windows/powertoys/) 或者 [AutoHotkey](https://www.autohotkey.com/) 重映射键位。    
MacOS 系统提供了重映射键位的[设置](https://vim.fandom.com/wiki/Map_caps_lock_to_escape_in_macOS)，另外也可以使用 [Karabiner-Elements](https://karabiner-elements.pqrs.org/) 重映射。  
Linux 系统可以使用 [xremap](https://github.com/xremap/xremap) 进行映射，对于 wayland 和 x.org 都可以使用，并且支持分别映射点按和按住。

但更佳的做法是同时将 CapsLock 映射为 Ctrl 和 Esc，点按为 Esc，按住为 Ctrl。这是不同系统下的实现方法：

- [Windows](https://gist.github.com/sedm0784/4443120)  
- [MacOS](https://ke-complex-modifications.pqrs.org/#caps_lock_tapped_escape_held_left_control)  
- [Linux](https://www.jianshu.com/p/6fdc0e0fb266)

## 推荐参考资料

- Neil, Drew. Practical Vim: Edit Text at the Speed of Thought. N.p., Pragmatic Bookshelf, 2015.
- Neil, Drew. Modern Vim: Craft Your Development Environment with Vim 8 and Neovim. United States, Pragmatic Bookshelf.`,
	},
	{
		DisplayName:       `奔跑的青蛙`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | Thesis Writing`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Thesis Writing。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Thesis Writing

## Why I Wrote This Tutorial

In 2022, I graduated from my college. When I started writing my thesis, I embarrassingly realized that my command of Word was limited to basic functions like adjusting fonts and saving documents. I considered switching to LaTeX, but formatting requirements for the thesis were more conveniently handled in Word. After a painful struggle, I finally completed the writing and defense of my thesis. To prevent others from following in my footsteps, I compiled relevant resources into a ready-to-use document for everyone's reference.

## How to Write a Graduation Thesis in Word

Just as it takes three steps to put an elephant in a fridge, writing a graduation thesis in Word also requires three simple steps:

1. **Determine the Format Requirements of the Thesis**: Usually, colleges will provide the formatting requirements for theses (font and size for headings, sections, formatting of figures and citations, etc.), and if you're lucky, they might even provide a thesis template (if so, jump to the next step). Unfortunately, my college did not issue standard format requirements and provided a chaotic and almost useless template. Out of desperation, I found the [thesis format requirements](https://github.com/PKUFlyingPig/Thesis-Template/blob/master/%E5%8C%97%E4%BA%AC%E5%A4%A7%E5%AD%A6%E7%A0%94%E7%A9%B6%E7%94%9F%E5%AD%A6%E4%BD%8D%E8%AE%BA%E6%96%87%E5%86%99%E4%BD%9C%E6%8C%87%E5%8D%97.pdf) of Peking University graduate students and created [a template](https://github.com/PKUFlyingPig/Thesis-Template/blob/master/%E8%AE%BA%E6%96%87%E6%A8%A1%E7%89%88.docx) based on their guidelines. Feel free to use it, but I take no responsibility for any issues for using it.

2. **Learn Word Formatting**: At this stage, you either have a standard template provided by your college or just a vague set of formatting requirements. Now, the priority is to learn basic Word formatting skills. If you have a template, learn to use it; if not, learn to create one. Remember, there's no need to ambitiously start with a lengthy Word tutorial video. A half-hour tutorial is enough to get started for creating a passable academic paper. I watched [a concise and practical Bilibili tutorial video](https://www.bilibili.com/video/BV1YQ4y1M73G?p=1&vd_source=a4d76d1247665a7e7bec15d15fd12349), which is very useful for a quick start.

3. **Produce Academic Work**: The easiest step. Everyone has their own way, so unleash your creativity. Best wishes for a smooth graduation!`,
	},
	{
		DisplayName:       `橙子栗子`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | 毕业论文`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：毕业论文。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# 毕业论文

## 为什么写这份教程

2022年，我本科毕业了。在开始动手写毕业论文的时候，我尴尬地发现，我对 Word 的掌握程度仅限于调节字体、保存导出这些傻瓜功能。曾想转战 Latex，但论文的段落格式要求调整起来还是用 Word 更为方便，经过一番痛苦缠斗之后，总算是有惊无险地完成了论文的写作和答辩。为了不让后来者重蹈覆辙，遂把相关资源整理成一份开箱即用的文档，供大家参考。

## 如何用 Word 写毕业论文

正如将大象装进冰箱需要三步，用 Word 写毕业论文也只需要简单三步：

- 确定论文的格式要求：通常学院都会下发毕业论文的格式要求（各级标题的字体字号、图例和引用的格式等等），如果更为贴心的话甚至会直接给出论文模版（如是此情况请直接跳转到下一步）。很不幸的是，我的学院并没有下发标准的论文格式要求，还提供了一份格式混乱几乎毫无用处的论文模版膈应我，被逼无奈之下我找到了北京大学研究生的[论文格式要求](https://github.com/PKUFlyingPig/Thesis-Template/blob/master/%E5%8C%97%E4%BA%AC%E5%A4%A7%E5%AD%A6%E7%A0%94%E7%A9%B6%E7%94%9F%E5%AD%A6%E4%BD%8D%E8%AE%BA%E6%96%87%E5%86%99%E4%BD%9C%E6%8C%87%E5%8D%97.pdf)，并按照其要求制作了[一份模版](https://github.com/PKUFlyingPig/Thesis-Template/blob/master/%E8%AE%BA%E6%96%87%E6%A8%A1%E7%89%88.docx)，大家需要的话自取，本人不承担无法毕业等任何责任。

- 学习 Word 排版：到达这一步的童鞋分为两类，一是已经拥有了学院提供的标准模版，二是只有一份虚无缥缈的格式要求。那现在当务之急就是学习基础的 Word 排版技术，对于前者可以学会使用模版，对于后者则可以学会制作模版。此时切记不要雄心勃勃地选择一个十几个小时的 Word 教学视频开始头悬梁锥刺股，因为生产一份应付毕业的学术垃圾只要学半小时能上手就够了。我当时看的[一个 B 站的教学视频](https://www.bilibili.com/video/BV1YQ4y1M73G?p=1&vd_source=a4d76d1247665a7e7bec15d15fd12349)，短小精悍非常实用，全长半小时极速入门。

- 生产学术垃圾：最容易的一步，大家八仙过海，各显神通吧，祝大家毕业顺利～～`,
	},
	{
		DisplayName:       `年糕烧饼`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | Practical Toolbox`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Practical Toolbox。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Practical Toolbox

## Download Tools

- [Sci-Hub](https://sci-hub.se/): A revolutionary site aiming to break knowledge barriers, greeted by the goddess Elbakyan.
- [Library Genesis](http://libgen.is/): A website for downloading e-books.
- [Z-library](https://z-library.rs/): An e-book download site (works better under [Tor](https://www.torproject.org/), [link](http://loginzlib2vrak5zzpcocc3ouizykn6k5qecgj2tzlnab5wcbqhembyd.onion/)).
- [Z-ePub](https://z-epub.com/): ePub e-book download site.
- [PDF Drive](https://www.pdfdrive.com/): A PDF e-book search engine.
- [MagazineLib](https://magazinelib.com/): A site for downloading PDF e-magazines.
- [BitDownloader](https://bitdownloader.io/): YouTube video downloader.
- [qBittorrent](https://www.qbittorrent.org/download.php): A BitTorrent client.
- [uTorrent](https://www.utorrent.com): Another BitTorrent client.
- [National Standard Information Public Service Platform](https://std.samr.gov.cn/): Official platform for querying and downloading various standards.
- [Standard Knowledge Service System](http://www.standards.com.cn/): Search and read the standards you need.
- [MSDN, I Tell You](https://msdn.itellyou.cn/): A site for downloading Windows OS images and other software.

## Design Tools

- [excalidraw](https://excalidraw.com/): A hand-drawn style drawing tool, great for creating diagrams in course reports or PPTs.
- [tldraw](https://www.tldraw.com/): A drawing tool suitable for flowcharts, architecture diagrams, etc.
- [draw.io](https://app.diagrams.net/): A powerful and concise online drawing website, supports flowcharts, UML diagrams, architecture diagrams, prototypes, etc., with export options for Onedrive, Google Drive, Github, and offline client availability.
- [origamiway](https://www.origamiway.com/paper-folding-crafts-step-by-step.shtml): Step-by-step origami tutorials.
- [thingiverse](https://www.thingiverse.com/): Includes various 2D/3D design resources, with STL files ready for 3D printing.
- [iconfont](https://www.iconfont.cn/): The largest icon and illustration library in China, useful for development or drawing system architecture diagrams.
- [turbosquid](https://www.turbosquid.com/): A platform to purchase various models.
- [flaticon](https://www.flaticon.com/): A site to download free and high-quality icons.
- [Standard Map Service System](http://bzdt.ch.mnr.gov.cn/): Official standard map downloads.
- [PlantUML](https://plantuml.com/zh/): Quickly write UML diagrams using code.

## Programming Related

- [sqlfiddle](http://www.sqlfiddle.com/): An easy-to-use online SQL Playground.
- [sqlzoo](https://sqlzoo.net/wiki/SQL_Tutorial): Practice SQL statements online.
- [godbolt](https://godbolt.org/): A convenient compiler exploration tool. Write some C/C++ code, choose a compiler, and observe the specific assembly code generated.
- [explainshell](https://explainshell.com/): Struggling with the meaning of a shell command? Try this site!
- [regex101](https://regex101.com/): A regex debugging site supporting various programming language standards.
- [typingtom](https://www.typingtom.com/lessons): Typing practice/speed test site for programmers.
- [wrk](https://github.com/wg/wrk): Website stress testing tool.
- [gbmb](https://www.gbmb.org/): Data unit conversion tool.
- [tools](https://tools.fun/): A collection of online tools.
- [github1s](https://github1s.com/): Read GitHub code online with a web-based VS Code.
- [visualgo](https://visualgo.net/en): Algorithm visualization website.
- [DataStructureVisual](http://www.rmboot.com/): Data structure visualization website.
- [Data Structure Visualizations](https://www.cs.usfca.edu/~galles/visualization/Algorithms.html): Visualization website for data structures and algorithms.
- [learngitbranching](https://learngitbranching.js.org/?locale=zh_CN): Visualize learning git.
- [UnicodeCharacter](https://unicode-table.com/en/): Unicode character set website.
- [cyrilex](https://extendsclass.com/regex-tester.html): A site for testing and visualizing regular expressions, supporting various programming language standards.
- [mockium](https://softwium.com/mockium/): Platform for generating test data.

## Learning Websites

- [HFS](https://hepsoftwarefoundation.org/training/curriculum.html): Various software tutorials.
- [Shadertoy](https://www.shadertoy.com/): Write various shaders.
- [comments-for-awesome-courses](https://conanhujinming.github.io/comments-for-awesome-courses/): Reviews of open courses from prestigious universities.
- [codetop](https://codetop.cc/home): Corporate problem bank.
- [cs-video-courses](https://github.com/Developer-Y/cs-video-courses): List of computer science courses with video lectures.
- [bootlin](https://elixir.bootlin.com/linux/v2.6.39.4/source/include/linux): Read Linux source code online.
- [ecust-CourseShare](https://github.com/tianyilt/ecnu-PGCourseShare): East China Normal University graduate course strategy sharing project.
- [REKCARC-TSC-UHT](https://github.com/PKUanonym/REKCARC-TSC-UHT): Tsinghua University computer science course strategy.
- [seu-master](https://github.com/oneman233/seu-master): Southeast University graduate course materials.
- [Runoob](https://www.runoob.com/): Brief tutorials on computer-related knowledge.
- [FreeBSD From Entry to Run Away](https://book.bsdcn.org/): A Chinese tutorial on FreeBSD.
- [MDN Web Docs](https://developer.mozilla.org/zh-CN/docs/Learn): MDN's beginner's guide to web development.
- [Hello Algorithm](https://www.hello-algo.com/): A quick introductory tutorial on data structures and algorithms with animations, runnable examples, and Q&A.

## Encyclopedic/Dictionarial Websites

- [os-wiki](https://wiki.osdev.org/Main_Page): An encyclopedia of operating system technology resources.
- [FreeBSD Documentation](https://docs.freebsd.org/en/): Official FreeBSD documentation.
- [Python3 Documentation](https://docs.python.org/zh-cn/3/): Official Chinese documentation for Python3.
- [C++ Reference](https://en.cppreference.com/w/): C++ reference manual.
- [OI Wiki](https://oi-wiki.org/): An integrated site for programming competition knowledge.
- [CTF Wiki](https://ctf-wiki.org/): An integrated site for knowledge and tools related to cybersecurity competitions.
- [Microsoft Learn](https://learn.microsoft.com/zh-cn/): Microsoft's official learning platform, containing most Microsoft product documentation.
- [Arch Wiki](https://wiki.archlinux.org/): Wiki written for Arch Linux, containing a lot of Linux-related knowledge.
- [Qt Wiki](https://wiki.qt.io/Main): Official Qt Wiki.
- [OpenCV Chinese Documentation](https://opencv.apachecn.org/#/): Community version of OpenCV's Chinese documentation.
- [npm Docs](https://docs.npmjs.com/): Official npm documentation.
- [developer-roadmap](https://roadmap.sh/): provides roadmaps, guides and other educational content to help guide developers in picking up a path and guide their learnings.

## Communication Platforms

- [GitHub](https://github.com/): Many open-source projects' hosting platform, also a major communication platform for many open-source projects, where issues can solve many problems.
- [StackExchange](https://stackexchange.com/): A programming community composed of 181 Q&A communities (including Stack Overflow).
- [StackOverflow](https://stackoverflow.com/): An IT technical Q&A site related to programming.
- [Gitee](https://gitee.com/): A code hosting platform similar to GitHub, where you can find solutions to common questions in the issues of corresponding projects.
- [Zhihu](https://www.zhihu.com/): A Q&A community similar to Quora, where you can ask questions, with some answers containing computer knowledge.
- [Cnblogs](https://www.cnblogs.com/): A knowledge-sharing community for developers, containing blogs on common questions. Accuracy is not guaranteed, please use with caution.
- [CSDN](https://blog.csdn.net/): Contains blogs on common questions. Accuracy is not guaranteed, please use with caution.

## Miscellaneous

- [tophub](https://tophub.today/): A collection of trending news headlines (aggregating from Zhihu, Weibo, Baidu, WeChat, etc.).
- [feedly](https://feedly.com/): A famous RSS feed reader.
- [speedtest](https://www.speedtest.net/zh-Hans): An online network speed testing website.
- [public-apis](https://github.com/public-apis/public-apis): A collective list of free APIs for development.
- [numberempire](https://zh.numberempire.com/derivativecalculator.php): A tool for calculating derivatives of functions.
- [sustech-application](https://sustech-application.com/#/grad-application/computer-science-and-engineering/README): Southern University of Science and Technology experience sharing website.
- [vim-adventures](https://vim-adventures.com/): An online game based on vim keyboard shortcuts.
- [vimsnake](https://vimsnake.com/): Play the snake game using vim commands.
- [keybr](https://www.keybr.com/): A website for learning touch typing.
- [Awesome C++](https://cpp.libhunt.com/): A curated list of awesome C/C++ frameworks, libraries, resources.
- [HelloGitHub](https://hellogithub.com/): Shares interesting and beginner-friendly open-source projects on GitHub.
- [Synergy](https://github.com/DEAKSoftware/Synergy-Binaries): A set of keyboard and mouse controls for multiple computers`,
	},
	{
		DisplayName:       `红豆喝绿茶`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | 实用工具箱`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：实用工具箱。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# 实用工具箱

## 下载工具

- [Sci-Hub](https://sci-hub.se/): Elbakyan 女神向你挥手，旨在打破知识壁垒的革命性网站。
- [Library Genesis](http://libgen.is/): 电子书下载网站。
- [Z-library](https://z-library.rs/): 电子书下载网站（在 [Tor](https://www.torproject.org/) 下运行较佳，[链接](http://loginzlib2vrak5zzpcocc3ouizykn6k5qecgj2tzlnab5wcbqhembyd.onion/)）。
- [Z-ePub](https://z-epub.com/): ePub 电子书下载网站。
- [PDF Drive](https://www.pdfdrive.com/): PDF 电子书搜索引擎。
- [MagazineLib](https://magazinelib.com/): PDF 电子杂志下载网站。
- [BitDownloader](https://bitdownloader.io/): 油管视频下载器。
- [qBittorrent](https://www.qbittorrent.org/download.php): BitTorrent 客户端。
- [uTorrent](https://www.utorrent.com): BitTorrent 客户端。
- [全国标准信息公共服务平台](https://std.samr.gov.cn/)：各类标准查询和下载官方平台。
- [标准知识服务系统](http://www.standards.com.cn/)：检索与阅读所需标准。
- [MSDN,我告诉你](https://msdn.itellyou.cn/): Windows 操作系统镜像下载站，也有许多其他软件的下载。

## 设计工具

- [excalidraw](https://excalidraw.com/): 一款手绘风格的绘图工具，非常适合绘制课程报告或者PPT内的示意图。
- [tldraw](https://www.tldraw.com/): 一个绘图工具，适合画流程图，架构图等。
- [draw.io](https://app.diagrams.net/): 强大简洁的在线的绘图网站，支持流程图，UML图，架构图，原型图等等，支持 Onedrive, Google Drive, Github 导出，同时提供离线客户端。
- [origamiway](https://www.origamiway.com/paper-folding-crafts-step-by-step.shtml): 手把手教你怎么折纸。
- [thingiverse](https://www.thingiverse.com/): 囊括各类 2D/3D 设计资源，其 STL 文件下载可直接 3D 打印。
- [iconfont](https://www.iconfont.cn/): 国内最大的图标和插画资源库，可用于开发或绘制系统架构图。
- [turbosquid](https://www.turbosquid.com/): 可以购买各式各样的模型。
- [flaticon](https://www.flaticon.com/): 可下载免费且高质量的图标。
- [标准地图服务系统](http://bzdt.ch.mnr.gov.cn/): 可以下载官方标准地图。
- [PlantUML](https://plantuml.com/zh/): 可以使用代码快速编写 UML 图。

## 编程相关

- [sqlfiddle](http://www.sqlfiddle.com/): 一个简易的在线 SQL Playground。
- [sqlzoo](https://sqlzoo.net/wiki/SQL_Tutorial)：在线练习 sql 语句。
- [sqlable](https://sqlable.com)：一个 SQL 工具网站（格式化器、验证器、生成器，SQL Playground）。
- [godbolt](https://godbolt.org/): 非常方便的编译器探索工具。你可以写一段 C/C++ 代码，选择一款编译器，然后便可以观察生成的具体汇编代码。
- [explainshell](https://explainshell.com/): 你是否曾为一段 shell 代码的具体含义感到困扰？manpage 看半天还是不明所以？试试这个网站！
- [regex101](https://regex101.com/): 正则表达式调试网站，支持各种编程语言的匹配标准。
- [typingtom](https://www.typingtom.com/lessons): 针对程序员的打字练习/测速网站。
- [wrk](https://github.com/wg/wrk): 网站压测工具。
- [gbmb](https://www.gbmb.org/): 数据单位转换。
- [tools](https://tools.fun/): 在线工具合集。
- [github1s](https://github1s.com/): 用网页版 VS Code 在线阅读 GitHub 代码。
- [visualgo](https://visualgo.net/en): 算法可视化网站。
- [DataStructureVisual](http://www.rmboot.com/): 数据结构可视化网站。
- [Data Structure Visualizations](https://www.cs.usfca.edu/~galles/visualization/Algorithms.html): 数据结构与算法的可视化网站。
- [learngitbranching](https://learngitbranching.js.org/?locale=zh_CN): 可视化学习 git。
- [UnicodeCharacter](https://unicode-table.com/en/): Unicode 字符集网站。
- [cyrilex](https://extendsclass.com/regex-tester.html): 一个用于测试和可视化正则表达式的网站，支持各种编程语言标准。
- [mockium](https://softwium.com/mockium/): 生成测试数据的平台。

## 学习网站

- [HFS](https://hepsoftwarefoundation.org/training/curriculum.html): 各类软件教程。
- [Shadertoy](https://www.shadertoy.com/): 编写各式各样的 shader。
- [comments-for-awesome-courses](https://conanhujinming.github.io/comments-for-awesome-courses/): 名校公开课评价网。
- [codetop](https://codetop.cc/home): 企业题库。
- [cs-video-courses](https://github.com/Developer-Y/cs-video-courses): 带有视频讲座的计算机科学课程列表。
- [bootlin](https://elixir.bootlin.com/linux/v2.6.39.4/source/include/linux): 在线阅读 Linux 源码。
- [ecust-CourseShare](https://github.com/tianyilt/ecnu-PGCourseShare): 华东师范大学研究生课程攻略共享计划。
- [REKCARC-TSC-UHT](https://github.com/PKUanonym/REKCARC-TSC-UHT): 清华大学计算机系课程攻略。
- [seu-master](https://github.com/oneman233/seu-master): 东南大学研究生课程资料整理。
- [菜鸟教程](https://www.runoob.com/): 计算机相关知识的简要的教程。
- [FreeBSD 从入门到跑路](https://book.bsdcn.org/): 一本 FreeBSD 的中文教程。
- [MDN Web Docs](https://developer.mozilla.org/zh-CN/docs/Learn): MDN 网络开发入门手册。
- [Hello 算法](https://www.hello-algo.com/): 动画图解、能运行、可提问的数据结构与算法快速入门教程。

## 百科网站/词典性质的网站
- [os-wiki](https://wiki.osdev.org/Main_Page): 操作系统技术资源百科全书。
- [FreeBSD Documentation](https://docs.freebsd.org/en/): FreeBSD 官方文档。
- [Python3 Documentation](https://docs.python.org/zh-cn/3/): Python3 官方中文文档。
- [C++ Reference](https://en.cppreference.com/w/): C++ 参考手册。
- [OI Wiki](https://oi-wiki.org/): 编程竞赛知识整合站点。
- [CTF Wiki](https://ctf-wiki.org/)：网络安全竞赛相关知识与工具的整合站点。
- [Microsoft Learn](https://learn.microsoft.com/zh-cn/): 微软官方的学习平台，包含了绝大多数微软产品的文档。
- [Arch Wiki](https://wiki.archlinux.org/): 专为 Arch Linux 而写的 Wiki，包含了大量 Linux 相关的知识。
- [Qt Wiki](https://wiki.qt.io/Main): Qt 官方 Wiki。
- [OpenCV 中文文档](https://opencv.apachecn.org/#/): OpenCV 的社区版中文文档。
- [npm Docs](https://docs.npmjs.com/): npm 官方文档。
- [developer-roadmap](https://roadmap.sh/)：帮助开发者了解学习路径并在职业生涯中不断成长。

## 交流平台
- [GitHub](https://github.com/): 许多开源项目的托管平台，也是许多开源项目的主要交流平台，通过查看 issue 可以解决许多问题。
- [StackExchange](https://stackexchange.com/): Stack Exchange 是由 181 个问答社区组成（其中包括 Stack Overflow）的编程社区。
- [StackOverflow](https://stackoverflow.com/): Stack Overflow 是一个与程序相关的 IT 技术问答网站。
- [Gitee](https://gitee.com/): 一个类似于 GitHub 的代码托管平台，可以在对应项目的 issue 里查找一些常见问题的解答。
- [知乎](https://www.zhihu.com/): 一个类似于 Quora 的问答社区，可以在其中提问，一些问答包含有计算机的知识。
- [博客园](https://www.cnblogs.com/): 一个面向开发者的知识分享社区，拥有一些常见问题的博客，正确率不能保证，请谨慎使用。
- [CSDN](https://blog.csdn.net/): 拥有一些常见问题的博客，正确率不能保证，请谨慎使用。

## 杂项

- [tophub](https://tophub.today/): 新闻热榜合集（综合了知乎、微博、百度、微信等）。
- [feedly](https://feedly.com/): 著名的 RSS 订阅源阅读器。
- [speedtest](https://www.speedtest.net/zh-Hans): 在线网络测速网站。
- [public-apis](https://github.com/public-apis/public-apis): 公共 API 合集列表。
- [numberempire](https://zh.numberempire.com/derivativecalculator.php): 函数求导工具。
- [sustech-application](https://sustech-application.com/#/grad-application/computer-science-and-engineering/README): 南方科技大学经验分享网。
- [vim-adventures](https://vim-adventures.com/): 一款基于 vim 键盘快捷键的在线游戏。
- [vimsnake](https://vimsnake.com/): 利用 vim 玩贪吃蛇。
- [keybr](https://www.keybr.com/): 学习盲打的网站。
- [Awesome C++](https://cpp.libhunt.com/): 很棒的 C/C++ 框架、库、资源精选列表。
- [HelloGitHub](https://hellogithub.com/): 分享 GitHub 上有趣、入门级的开源项目。
- [Synergy](https://github.com/DEAKSoftware/Synergy-Binaries): 一套键鼠能控制多台电脑。`,
	},
	{
		DisplayName:       `西瓜泡芙`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | workflow.en`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：workflow.en。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `> Contributed by [@HardwayLinka](https://github.com/HardwayLinka)

The field of computer science is vast and rapidly evolving, making lifelong learning crucial. However, our sources of knowledge in daily development and learning are complex and fragmented. We encounter extensive documentation manuals, brief blogs, and even snippets of news and public accounts on our phones that may contain interesting knowledge. Therefore, it's vital to use various tools to create a learning workflow that suits you, integrating these knowledge fragments into your personal knowledge base for easy reference and review. After two years of learning alongside work, I have developed the following learning workflow:



## Core Logic

Initially, when learning new knowledge, I referred to Chinese blogs but often found bugs and gaps in my code practice. Gradually, I realized that the information I referred to might be incorrect, as the threshold for posting blogs is low and their credibility is not high. So, I started consulting some related Chinese books.

Chinese books indeed provide a comprehensive and systematic explanation of concepts. However, given the rapid evolution of computer technology and the US's leadership in CS, content in Chinese books often lags behind the latest knowledge. This led me to realize the importance of firsthand information. Some Chinese books are translations of English ones, and translation can take a year or two, causing a delay in information transmission and loss during translation. If a Chinese book is not a translation, it likely references other books, introducing biases in interpreting the original English text.

Therefore, I naturally started reading English books. The quality of English books is generally higher than that of Chinese ones. As I delved deeper into my studies, I discovered a hierarchy of information reliability: ` + "`" + `source code` + "`" + ` > ` + "`" + `official documentation` + "`" + ` > ` + "`" + `English books` + "`" + ` > ` + "`" + `English blogs` + "`" + ` > ` + "`" + `Chinese blogs` + "`" + `. This led me to create an "Information Loss Chart":



Although firsthand information is crucial, subsequent iterations (N-th hand information) are not useless. They include the author's transformation of the source knowledge — such as logical organization (flow charts, mind maps) or personal interpretations (abstractions, analogies, extensions to other knowledge points). These transformations can help us quickly grasp and consolidate core knowledge, like using guidebooks in school. Moreover, interacting with others' interpretations during learning is important, allowing us to benefit from various perspectives. Hence, it's advisable to first choose high-quality, less distorted sources of information while also considering multiple sources for a more comprehensive and accurate understanding.

In real-life work and study, learning rarely follows a linear, deep dive into a single topic. Often, it involves other knowledge points, such as new jargon, classic papers not yet read, or unfamiliar code snippets. This requires us to think deeply and "recursively" learn, establishing connections between multiple knowledge points.

## Choosing the Right Note-taking Software

The backbone of the workflow is built around the core logic of "multiple references for a single knowledge point and building connections among various points." This is similar to writing academic papers. Papers usually have footnotes explaining keywords and multiple references at the end. But our daily notes are much more casual, hence the need for a more flexible method.

I'm accustomed to jumping to related functions and implementations in an IDE. It would be great if notes could also be interlinked like code. Current "double-link note-taking software," such as Roam Research, Logseq, Notion, and Obsidian, addresses this need. I chose Obsidian for the following reasons:

- Obsidian is based locally, with fast opening speeds, and can store many e-books. My laptop, an Asus TUF Gaming FX505 with 32GB of RAM, runs Obsidian very smoothly.
- Obsidian is Markdown-based. This is an advantage because if a note-taking software uses a proprietary format, it's inconvenient for third-party extensions and opening notes with other software.
- Obsidian has a rich and active plugin ecosystem, allowing for an "all in one" effect, meaning various knowledge sources can be integrated in one place.

## Information Sources

Obsidian's plugins support PDF formats, and it naturally supports Markdown. To achieve "all in one," you can convert other file formats to PDF or Markdown. This presents two questions:

- What formats are there?
- How to convert them to PDF or Markdown?



### Formats

File formats depend on their display platforms. Before considering formats, let's list the sources of information I usually access:



The main categories are ` + "`" + `articles` + "`" + `, ` + "`" + `papers` + "`" + `, ` + "`" + `e-books` + "`" + `, and ` + "`" + `courses` + "`" + `, primarily including formats like ` + "`" + `web pages` + "`" + `, ` + "`" + `PDFs` + "`" + `, ` + "`" + `MOBI` + "`" + `, ` + "`" + `AZW` + "`" + `, and ` + "`" + `AZW3` + "`" + `.

### Conversion to PDF or Markdown

Online articles and courses are mostly presented as web pages. To convert web pages to Markdown, I use the clipping software "Simplified Read," which can clip articles from nearly all platforms into Markdown and import them into Obsidian.



For papers and e-books, if the format is already PDF, it's straightforward. Otherwise, I use Calibre for conversion:



Now, using Obsidian's PDF plugin and native Markdown support, I can seamlessly take notes and reference across these documents (see "Information Processing" below for details).



### Managing Information Sources

For file resources like PDFs, I use local or cloud storage. For web resources, I categorize and save them in browser bookmarks or clip them into Markdown notes. However, browsers don't support mobile web bookmarking. To enable cross-platform web bookmarking, I use Cubox. With a swipe on my phone, I can save interesting web pages in one place. Although the free version limits to 100 bookmarks, it's usually sufficient and prompts me to process these pages promptly.



Moreover, many of the web pages we bookmark are not from fully-featured blog platforms like Zhihu or Juejin but personal sites without mobile apps. These can be easily overlooked in browser bookmarks, and we might miss new article notifications. Here, ` + "`" + `RSS` + "`" + ` comes into play.

` + "`" + `RSS` + "`" + ` (Rich Site Summary) is a type of web feed that allows users to access updates to online content in a standardized format. On desktops, ` + "`" + `RSSHub Radar` + "`" + ` helps discover and generate ` + "`" + `RSS` + "`" + ` feeds, which can be subscribed to using ` + "`" + `Feedly` + "`" + ` (both have official Chrome browser plugins).



With this, the information collection process is comprehensive. But no matter how well categorized, information needs to be internalized to be useful. After collecting information, the next step is processing it — reading, understanding the semantics (especially for English sources), highlighting key sentences or paragraphs, noting queries, brainstorming related knowledge points, and writing summaries. What tools are needed for this process?

## Information Processing

### English Sources

For English materials, I initially used "Youdao Dictionary" for word translation, Google Translate for sentences, and "Deepl" for paragraphs. Eventually, I realized this was too slow and inefficient. Ideally, a single tool that can handle word, sentence, and paragraph translation would be optimal. After researching, I chose "Quicker" + "Saladict" for translation.



This combo allows translation outside browsers and supports words, sentences, and paragraphs, offering results from multiple translation platforms. For non-urgent word lookups, the "Collins Advanced" dictionary is helpful as it explains English words in English, providing context to aid understanding.



### Multimedia Information

After processing text-based information, it's important to consider how to handle multimedia information. Specifically, I'm referring to English videos, as I don't have a habit of learning through podcasts or recordings and I rarely watch Chinese tutorials anymore. Many renowned universities offer open courses in video format. Wouldn't it be helpful if you could take notes on these videos? Have you ever thought it would be great if you could convert the content of a lecture into text, since we usually read faster than a lecturer speaks? Fortunately, the software ` + "`" + `Language Reactor` + "`" + ` can export subtitles from YouTube and Netflix videos, along with Chinese translations.

We can copy the subtitles exported by ` + "`" + `Language Reactor` + "`" + ` into ` + "`" + `Obsidian` + "`" + ` and read them as articles. Besides learning purposes, you can also use this plugin while watching YouTube videos. It displays subtitles in both English and Chinese, and you can click on unfamiliar words in the subtitles to see their definitions.



However, reading texts isn't always the most efficient way to learn about some abstract concepts. As the saying goes, "A picture is worth a thousand words." What if we could link a segment of text to corresponding images or even video operations? While browsing the ` + "`" + `Obsidian` + "`" + ` plugin marketplace, I discovered a plugin called ` + "`" + `Media Extended` + "`" + `. This plugin allows you to add links in your notes that jump to specific times in a video, effectively connecting your notes to the video! This works well with the video subtitles mentioned earlier, where each line of subtitles corresponds to a time stamp, allowing for jumps to specific parts of the video. This means you don't have to cut specific video segments; instead, you can jump directly within the article!



` + "`" + `Obsidian` + "`" + ` also has a powerful plugin called ` + "`" + `Annotator` + "`" + `, which allows you to jump from notes to the corresponding section in a PDF.



Now, with ` + "`" + `Obsidian` + "`" + `'s built-in double-chain feature, we can achieve inter-note linking, and with the above plugins, we can extend these links to multimedia. This completes the process of information handling. Learning often involves both a challenging ascent and a familiar descent. So, how can we incorporate the review process into this workflow?

## Information Review

` + "`" + `Obsidian` + "`" + ` already has a plugin that connects to ` + "`" + `Anki` + "`" + `, the renowned spaced repetition-based memory software. With this plugin, you can export segments of your notes to ` + "`" + `Anki` + "`" + ` as flashcards, each containing a link back to the original note.



## Conclusion

This workflow evolved over two years of learning in my spare time. Frustration with repetitive processes led to specific needs, which were fortunately met by tools I discovered online. Don't force tools into your workflow just for the sake of satisfaction; life is short, so focus on what's truly important.

By the way, this article discusses the evolution of the workflow. If you're interested in the details of how this workflow is implemented, I recommend reading the following articles in order after this one:

1. [3000+ Hours Accumulated Learning Workflow](https://sspai.com/post/75969)
2. [Advanced Techniques in Obsidian | Creating Notes that Link to Any File Format](https://juejin.cn/post/7[电话已隐藏]5577485)`,
	},
	{
		DisplayName:       `烧饼bb`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | workflow`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：workflow。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `> Contributed by [@HardwayLinka](https://github.com/HardwayLinka)

计算机领域的知识覆盖面很广并且更新速度很快，因此保持终身学习的习惯很重要。但在日常开发和学习的过程中，我们获取知识的来源相对复杂且细碎。有成百上千页的文档手册，也有寥寥数语的博客，甚至闲暇时手机上划过的某则新闻和公众号都有可能包含我们感兴趣的知识。因此，如何利用现有的各类工具，形成一套适合自己的学习工作流，将不同来源的知识碎片整合进属于自己的知识库，方便之后的查阅与复习，就显得尤为重要。经过两年工作之余的学习后，我磨合出了以下学习工作流：



## 底层核心逻辑

一开始我学习新知识时会参考中文博客，但在代码实践时往往会发现漏洞和bug。我逐渐意识到我参考的信息可能是错误的，毕竟发博客的门槛低，文章可信度不高，于是我开始查阅一些相关的中文书籍。 

中文书籍的确是比较全面且系统地讲解了知识点，但众所周知，计算机技术更迭迅速，又因为老美在 CS 方面一直都是灯塔，所以一般中文书籍里的内容会滞后于当前最新的知识，导致我跟着中文书籍实践会出现软件版本差异的问题。这时我开始意识到一手信息的重要性，有些中文书籍是翻译英文书籍的，一般翻译一本书也要一两年，这会导致信息传递的延迟，还有就是翻译的过程中信息会有损失。如果一本中文书籍不是翻译的呢，那么它大概率也参考了其他书籍，参考的过程会带有对英文原著中语义理解的偏差。

于是我就顺其自然地开始翻阅英文书籍。不得不说，英文书籍内容的质量整体是比中文书籍高的。后来随着学习的层层深入，以知识的时效性和完整性出发，我发现 ` + "`" + `源代码` + "`" + ` > ` + "`" + `官方文档` + "`" + ` > ` + "`" + `英文书籍` + "`" + ` > ` + "`" + `英文博客` + "`" + ` > ` + "`" + `中文博客` + "`" + `，最后我得出了一张 ` + "`" + `信息损失图` + "`" + `：



虽然一手信息很重要，但后面的 N 手信息并非一无是处，因为这 N 手资料里包含了作者对源知识的转化——例如基于某种逻辑的梳理（流程图、思维导图等）或是一些自己的理解（对源知识的抽象、类比、延伸到其他知识点），这些转化可以帮助我们更快地掌握和巩固知识的核心内容，就如同初高中学习时使用的辅导书。 此外，学习的过程中和别人的交流十分重要，这些 N 手信息同时起了和其他作者交流的作用，让我们能采百家之长。所以这提示我们学习一个知识点时先尽量选择质量更高的，信息损失较少的信息源，同时不妨参考多个信息源，让自己的理解更加全面准确。

现实工作生活中的学习很难像学校里一样围绕某个单一知识点由浅入深，经常会在学习过程中涉及到其他知识点，比如一些新的专有名词，一篇没有读过的经典论文，一段未曾接触过的代码等等。这就要求我们勤于思考，刨根究底地“递归”学习，给多个知识点之间建立联系。

## 选择合适的笔记软件

工作流的骨架围绕 ` + "`" + `单个知识点多参考源，勤于提问给多个知识点之间建立联系` + "`" + ` 的底层核心逻辑建立。我们写论文其实就是遵循这个底层逻辑的。论文一般会有脚注去解释一些关键字，并且论文末尾会有多个参考的来源，但是我们平时写笔记会随意得多，因此需要更灵活的方式。

平时写代码习惯在 IDE 里一键跳转，把相关的函数和实现很好地联系在了一起。你也许会想，如果笔记也能像代码那样可以跳转就好了。现在市面上 ` + "`" + `双链笔记软件` + "`" + ` 就可以很好地解决这一痛点，例如 Roam Research、Logseq、Notion 和 Obsidian。Roam Research 和 Logseq 都是基于大纲结构的笔记软件，而 ` + "`" + `大纲结构` + "`" + ` 是劝退我使用这两款软件的原因。一是 ` + "`" + `大纲结构` + "`" + ` 做笔记容易使文章纵向篇幅太长，二是如果嵌套结构过多会占横向的篇幅。Notion 页面打开慢，弃之。最终我选择了 Obsidian，原因如下：

*   Obsidian 基于本地，打开速度快，且可存放很多电子书。我的笔记本是 32g 内存的华硕天选一代，拿来跑 Obsidian 可以快到飞起
*   Obsidian 基于 Markdown。这也是一个优势，如果笔记软件写的笔记格式是自家的编码格式，那么不方便其他第三方拓展，也不方便将笔记用其他软件打开，比如 qq 音乐下载歌曲有自己的格式，其他播放器播放不了，这挺恶心人的
*   Obsidian 有丰富的插件生态，并且这个生态既大又活跃，即插件数量多，且热门插件的 star 多，开发者会反馈用户 issue，版本会持续迭代。借助这些插件，可以使 Obsidian 达到 ` + "`" + `all in one` + "`" + ` 的效果，即各类知识来源可以统一整合于一处

## 信息的来源

Obsidian 的插件使其可以支持 pdf 格式，而其本身又支持 Markdown 格式。如果想要 ` + "`" + `all in one` + "`" + `，那么可以基于这两个格式，将其他格式文件转换为 pdf 或者 Markdown。 那么现在就面临着两个问题：

*   有什么格式
*   怎么转换为 pdf 或 Markdown



### 有什么格式

文件格式依托于其展示的平台，所以在看有什么格式之前，可以罗列一下我平时获取信息的来源：




可以看到主要分为` + "`" + `文章` + "`" + `、` + "`" + `论文` + "`" + `、` + "`" + `电子书` + "`" + `、` + "`" + `课程` + "`" + `四类，包含的格式主要有 ` + "`" + `网页` + "`" + `、` + "`" + `pdf` + "`" + ` 、` + "`" + `mobi` + "`" + `、` + "`" + `azw` + "`" + `、` + "`" + `azw3` + "`" + `。

### 怎么转换为 pdf 或 Markdown

在线的文章和课程等大多以网页形式呈现，而将网页转换为 Markdown 可以使用剪藏软件，它可以将网页文章转换为多种文本格式文件。我选择的工具是简悦，使用简悦可以将几乎所有平台的文章很好地剪藏为 Markdown 并且导入到 Obsidian。



对于论文和电子书而言如果格式本身就是 pdf 则万事大吉，但如果是其他格式则可以使用 calibre 进行转换：



现在利用 Obsidian 的 pdf 插件和其原生的 markdown 支持就可以畅快无比地做笔记并且在这些文章的对应章节进行无缝衔接地引用跳转啦（具体操作参考下文的“信息的处理”模块）。



### 如何统一管理信息来源

对于 pdf 等文件类资源可以本地或者云端存储，而网页类资源则可以分门别类地放入浏览器的收藏夹，或者剪藏成 markdown 格式的笔记，但是网页浏览器不能实现移动端的网页收藏。为了实现跨端网页收藏我选用了 Cubox，在手机端看到感兴趣的网页时只需小手一划，便能将网页统一保存下来。虽然免费版只能收藏 100 个网页，但其实够用了，还可以在收藏满时督促自己赶紧剪藏消化掉这些网页，让收藏不吃灰。



除此之外，回想一下我们平时收藏的网页，就会发现有很多并不是像知乎、掘金这类有完整功能的博客平台，更多的是个人建的小站，而这些小站往往没有移动端应用，这样平时刷手机的时候也看不到，放到浏览器的收藏夹里又容易漏了看，有新文章发布我们也不能第一时间收到通知，这个时候就需要一种叫 ` + "`" + `RSS` + "`" + ` 的通信协议。  

` + "`" + `RSS` + "`" + `（英文全称：RDF Site Summary 或 Really Simple Syndication），中文译作简易信息聚合，也称聚合内容，是一种消息来源格式规范，用以聚合多个网站更新的内容并自动通知网站订阅者。电脑端可以借助 ` + "`" + `RSSHub Radar` + "`" + ` 来快速发现和生成 ` + "`" + `RSS` + "`" + ` 订阅源，接着使用 ` + "`" + `Feedly` + "`" + ` 来订阅这些 ` + "`" + `RSS` + "`" + ` 订阅源（` + "`" + `RSSHub Radar` + "`" + ` 和 ` + "`" + `Feedly` + "`" + ` 在 chrome 浏览器中均有官方插件）。



到这里为止，收集信息的流程已经比较完备了。但资料再多，分类规整得再漂亮，也得真正内化成自己的才管用。因此在收集完信息后就得进一步地处理信息，即阅读这些信息，如果是英文信息的话还得搞懂英文的语义，加粗高亮重点句子段落，标记有疑问的地方，发散联想相关的知识点，最后写上自己的总结。那么在这过程中需要使用到什么工具呢？

## 信息的处理

### 英文信息

面对英文的资料，我以前是用 ` + "`" + `有道词典` + "`" + ` 来划词翻译，遇到句子的话就使用谷歌翻译，遇到大段落时就使用 ` + "`" + `deepl` + "`" + `，久而久之，发现这样看英语文献太慢了，得用三个工具才能满足翻译这一个需求，如果有一个工具能够同时实现对单词、句子和段落的划词翻译就好了。我联想到研究生们应该会经常接触英语文献，于是我就搜 ` + "`" + `研究生` + "`" + ` + ` + "`" + `翻译软件` + "`" + `，在检索结果里我最终选择了 ` + "`" + `Quicker` + "`" + ` + ` + "`" + `沙拉查词` + "`" + ` 这个搭配来进行划词翻译。



使用这套组合可以实现在浏览器外的其他软件内进行划词翻译，并且支持单词、句子和段落的翻译，以及每次的翻译会有多个翻译平台的结果。btw，如果查单词时不着急的话，可以顺便看看 ` + "`" + `科林斯高阶` + "`" + ` 的翻译，这个词典的优点就是会用英文去解释英文，可以提供多个上下文帮助你理解，对于学习英文单词也有帮助，因为用英文解释英文才更接近英语的思维。



### 多媒体信息

处理完文本类的信息后，我们还得思考一下怎么处理多媒体类的信息。此处的多媒体我特指英文视频，因为我没有用播客或录音学习的习惯，而且我已经基本不看中文教程了。现在很多国外名校公开课都是以视频的形式，如果能对视频进行做笔记会不会有帮助呢？不知道大家有没这样的想法，就是如果能把老师上课讲的内容转换成文本就好了，因为平时学习时我们看书的速度往往会比老师讲课的速度快。刚好 ` + "`" + `Language Reactor` + "`" + ` 这个软件可以将油管和网飞内视频的字幕导出来，同时附上中文翻译。

我们可以把 ` + "`" + `Language Reactor` + "`" + ` 导出的字幕复制到 ` + "`" + `Obsidian` + "`" + ` 里面作为文章来读。除了出于学习的需求，也可以在平时看油管的视频时打开这个插件，这个插件可以同时显示中英文字幕，并且可以单击选中英文字幕中你认为生僻的单词后显示单词释义。



但阅读文本对于一些抽象的知识点来说并不是效率最高的学习方式。俗话说，一图胜千言，能不能将某一段知识点的文本和对应的图片甚至视频画面操作联系起来呢？我在浏览 ` + "`" + `Obsidian` + "`" + ` 的插件市场时，发现了一个叫 ` + "`" + `Media Extended` + "`" + ` 的插件，这个插件可以在你的笔记里添加跳转到视频指定时间进度的链接，相当于把你的笔记和视频连接起来了！这刚好可以和我上文提到的生成视频中英文字幕搭配起来，即每一句字幕对应一个时间，并且能根据时间点跳转到视频的指定进度，如此一来如果需要在文章中展示记录了操作过程的视频的话，就不需要自己去截取对应的视频片段，而是直接在文章内就能跳转！



` + "`" + `Obsidian` + "`" + ` 里还有一个很强大的插件，叫 ` + "`" + `Annotator` + "`" + `，它可以实现笔记内跳转到 pdf 原文



现在，使用 ` + "`" + `Obsidian` + "`" + ` 自带的双链功能，可以实现笔记间相互跳转，结合上述两个插件，可以实现笔记到多媒体的跳转，信息的处理过程已经完备。一般我们学习的过程相当于上山和下山，刚学的时候就好像上山，很陌生、吃力，所谓学而时习之，复习或练习的过程就像下山，没有陌生感，不见得轻松，但非走不可。那么如何把复习这一过程纳入工作流的环节里呢？

## 信息的回顾

` + "`" + `Obsidian` + "`" + ` 内已经有一个连接 ` + "`" + `Anki` + "`" + ` 的插件，` + "`" + `Anki` + "`" + ` 就是大名鼎鼎的、基于间隔重复的记忆软件。使用该插件可以截取笔记的片段导出到 ` + "`" + `Anki` + "`" + ` 并变成一张卡片，卡片内也有跳转回笔记原文的链接



## 总结

这个工作流是在我这两年业余时间学习时所慢慢形成的，在学习过程中因为对一些重复性的过程而感到厌倦，正是这种厌倦产生了某种特定的需求，恰好在平时网上冲浪时了解到的一些工具满足了我这些需求。不要为了虚无的满足感而将工具强行拼凑到自己的工作流中，人生苦短，做实事最紧要。

btw，此篇文章是讲解工作流的演化思路，如果对此工作流的实现细节感兴趣，建议阅读完本文后再按顺序阅读以下文章

1.  [3000 + 小时积累的学习工作流](https://sspai.com/post/75969)
2.  [Obsidian 的高级玩法 | 打造能跳转到任何格式文件的笔记](https://juejin.cn/post/7[电话已隐藏]5577485)`,
	},
	{
		DisplayName:       `温柔的水母`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | Information Retrieval`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Information Retrieval。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Information Retrieval

## Introduction

> When encountering a problem, remember the first thing is to **read the documentation**. Don't start by searching online or asking others directly. Reviewing FAQs may quickly provide the answer.

Information retrieval, as I understand it, is essentially about skillfully using search engines to quickly find the information you need, including but not limited to programming.

The most important thing in programming is STFW (search the fucking web) and RTFM (read the fucking manual). First, you should read the documentation, and second, learn to search. With so many resources online, how you use them depends on your information retrieval skills.

To understand how to search effectively, we first need to understand how search engines work.

## How Search Engines Work

The working process of a search engine can generally be divided into three stages: [^1]

1. Crawling and Fetching: Search engine spiders visit web pages by tracking links, obtain the HTML code of the pages, and store it in a database.
2. Preprocessing: The indexing program processes the fetched web page data by extracting text, segmenting Chinese words, indexing, etc., preparing for the ranking program.
3. Ranking: When users enter keywords, the ranking program uses the indexed data to calculate relevance and then generates the search results page in a specific format.

The first step involves web crawlers, often exaggerated in Python courses. It can be simply understood as using an automated program to download all text, images, and related information from websites and store them locally.

The second step is the core of a search engine, but not critical for users to understand. It can be roughly understood as cleaning data and indexing pages, each with keywords for easy querying.

The third step is closely related to us. Whether it's Google, Baidu, Bing, or others, you input keywords or queries, and the search engine returns results. This article teaches you how to obtain better results.

## Basic Search Techniques

Based on the above working principles, we can roughly understand that a search engine can be treated as a smart database. Using better query conditions can help you find the information you need faster. Here are some search techniques:

### Use English

First, it's important to know that in programming, it's best to search in English. Reasons include:

1. In programming and various software operations, English resources are of higher quality than those in Chinese or other languages.
2. Due to translation issues, English terms are more accurate and universally applicable than Chinese.
3. Chinese search engines' word segmentation systems can lead to ambiguity. For example, Google searches in Chinese may not yield many useful results.

If your English is not strong, use translation tools like Baidu or Sogou; they are sufficient.

### Refine Keywords

Don't search whole sentences. Although search engines automatically segment words, searching with whole sentences versus keywords can yield significantly different results in accuracy and order. Search engines are machines, not your teachers or colleagues. As mentioned above, searching is actually querying a database crawled by the search engine, so it's better to break down into keywords or phrases.

For example, if you want to know how to integrate vcpkg into a project instead of globally, searching for "如何将vcpkg集成到项目中而不是全局" in a long sentence may not yield relevant results. It's better to break it down into keywords like "vcpkg 集成 项目 全局".

### Replace Keywords

If you can't find what you're looking for, try replacing "项目" with "工程" or remove "集成". If that doesn't work, try advanced searching.

### Advanced Searching

Most search engines support advanced searching, including Google, Bing, Baidu, Ecosia, etc. Common formats include:

* Exact Match: Enclose the search term in quotes for precise matching.
* Exclude Keywords: Use a minus sign (-) to exclude specific words.
* Include Keywords: Use a plus sign (+) to ensure a keyword is included.
* Search Specific File Types: Use ` + "`" + `filetype:pdf` + "`" + ` to search for PDF files directly.
* Search Specific Websites: Use ` + "`" + `site:stackoverflow.com` + "`" + ` to search within a specific site.

Refer to the website instructions for specific syntax, such as [Baidu Advanced Search](https://baike.baidu.com/item/高级搜索/1743887?fr=aladdin) or [Bing Advanced Search Keywords](https://help.bing.microsoft.com/#apex/bing/zh-CHS/10001/-1).

#### GitHub Advanced Search

Use [GitHub's Advanced Search page](https://github.com/search/advanced) or refer to [GitHub Query Syntax](https://zhuanlan.zhihu.com/p/273766377) for advanced searches on GitHub. Examples include searching by repository name, description, readme, stars, fork count, size, update/creation date, license, language, user, and organization. These can be

 used in combination.

### More Tips

Depending on the context, I recommend specific sites for certain queries:

* For language-specific queries (e.g., C++/Qt/OpenGL), add ` + "`" + `site:stackoverflow.com` + "`" + `.
* For specific business/development environments or software-related issues, first check BugLists, IssueLists, or relevant forums.
* QQ groups are also a place to ask questions, but make sure your queries are meaningful.
* Chinese platforms like Zhihu, Jian Shu, Blog Park, and CSDN have a wealth of Chinese notes and experiences.

### About Baidu

Many programmers advise against using Baidu, preferring Google or Bing International. However, if you really need it, consider using alternatives like Ecosia or Yandex. For Chinese searches, Baidu might actually be the best option due to its database and indexing policies.

## Code Search

In addition to search engines, you might also need to search for code, either your own or from projects. Here are some recommended tools:

### Local Code Search

* ACK or ACK2, well-established search tools written in Perl.
* The Silver Searcher, implemented in C.
* The Platinum Searcher, implemented in Go.
* FreeCommander's built-in search, efficient on solid-state drives.
* IDE's built-in search, though not always the most user-friendly.

### Open Source Code Search

* [Searchcode](https://searchcode.com) for searching open source code, known for speed.
* [一行代码](https://www.alinecode.com) a useful Chinese tool for code search.

[^1]: [Introduction to How Search Engines Work - Zhihu](https://zhuanlan.zhihu.com/p/301641935)`,
	},
	{
		DisplayName:       `汤圆椰子`,
		School:            `CS自学指南`,
		MajorLine:         `必学工具`,
		ArticleTitle:      `CS自学 | 信息检索`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：信息检索。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `必学工具`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# 信息检索

## 前言

<em>碰到问题，记住第一件事是 **翻阅文档** ，不要一开始就直接搜索或者找人问，翻阅FAQ可能会快速找到答案。</em>

信息检索，我的理解来说，实际上就是灵活运用搜索引擎中，方便快捷的搜到需要的信息，包括但不限于编程。

编程最重要的，就是 STFW(search the fucking web) 和 RTFM(read the fucking Manual) ，首先要读文档，第二要学会搜索，网上那么多资源，怎么用，就需要信息检索。

要搜索，我们首先要搞清楚搜索引擎是如何工作的：

## 搜索引擎工作原理

搜索引擎的工作过程大体可以分成三阶段：[^1]

1. 爬行和抓取：搜索引擎蜘蛛通过跟踪链接访问网页，获取网页 HTML 代码存入数据库。
1. 预处理：索引程序对抓取来的网页数据进行文字提取，中文分词，索引等处理，以备排名程序调用。
1. 排名：用户输入关键词后，排名程序调用索引库数据，计算相关性，然后按一定格式生成搜索结果页面。

第一步，就是大家经常听说的网络爬虫，一般 Python 卖课的都会吹这个东西。简单可以理解为，我用一个自动的程序，下载网站中的所有文本、图片等相关信息，然后存入本地的磁盘。

第二步是搜索引擎的核心，但是对于我们使用来说，并不是特别关键，大致可以理解为洗干净数据，然后入库页面，每个页面加入关键字等信息方便我们查询。

第三步跟我们息息相关，不管是什么搜索网站， google 、百度、 Bing ，都一样，输入关键字或者需要查询的内容，搜索引擎会给你返回结果。本文就是教你如何获取更好的结果。

## 基础搜索技巧

根据上述的工作原理，我们大致就能明白，其实可以把搜索引擎当作一个比较聪明的数据库，更好的使用查询条件就能更快速的找到你想要的信息，下面介绍一些搜索的技巧：

### 使用英文

首先我们要知道一件事，编程中，最好使用英文搜索。原因主要有几点：

1. 编程和各种软件操作中，英文资料质量比中文资料和其他语言资料高，英文通用性还是更好些
2. 因为翻译问题，英文的名词比中文准确通用
3. 中文搜索中，分词系统不准会导致歧义，比如 Google 搜中文可能会搜不出几条有用结果

如果你英文不好，用百度翻译或者搜狗翻译，足够了。

当然下面的文档为了举例方便，都还是用中文例子。

### 提炼关键词

搜索时不要搜索整句话，虽然搜索引擎会自动帮助我们分词检索，但是整句和关键字搜索出来的结果再准确度和顺序上会有很大差别。搜索引擎是机器，并不是你的老师或者同事，看上面的流程，搜索实际上是去检索搜索引擎爬出来的数据库，你可以理解为关键字比模糊检索要快而且准确。

我们需要提炼问题，确定我们到底需要解决什么问题。

例如，我想知道 vcpkg 如何集成到工程上而不是全局中，那么搜索 ` + "`" + `vcpkg如何集成到工程上而不是全局中` + "`" + `  这种长句可能无法找到相关的结果，最好是拆分成单词，` + "`" + `vcpkg 集成到 工程 全局` + "`" + `  这样的搜索。其实这里只是举个例子，针对本条其实都能搜索出相关信息，但是越具体的问题，机器分词越可能出问题，所以最好是拆分关键字，使用词组或者断句来进行搜索。

### 替换关键字

还是上面那个例子，如果搜不出来，可以试试把工程换成项目，或者移出集成，如果不行，试一下高级搜索。

### 高级搜索

普通搜索引擎一般都支持高级搜索，包括 google ， bing ，百度， ecosia ，等等，大部分都支持，不过可能语法不同，一般通用的表示：

* 精准匹配： 精准匹配能保证搜索关键词完全被匹配上，一般是用双引号括起来
  * 比如搜索线性代数，可以在输入框内输入 "线性代数"，搜索引擎将只匹配完整包含 “线性代数” 的页面，而不会搜索拆分成线性和代数两个词的页面
* 不包含关键字： 用 -  减号连接关键字，用于排除某些干扰词
* 包含关键字：  用 + 加号连接关键字
* 搜索特定文件类型：  ` + "`" + `filetype:pdf` + "`" + ` 直接搜索 pdf 文件
* 搜索特定网址： ` + "`" + `site:stackoverflow.com` + "`" + ` 只搜索特定网站内的页面

一般可以参照网站说明，比如百度可以参照 [高级搜索](https://baike.baidu.com/item/高级搜索/1743887?fr=aladdin) ，Bing 可以参照 [高级搜索关键字](https://help.bing.microsoft.com/#apex/bing/zh-CHS/10001/-1) 和 [高级搜索选项](https://help.bing.microsoft.com/apex/index/18/zh-CHS/10002)。


#### GitHub 的高级搜索

可以直接用 [高级搜索页面](https://github.com/search/advanced) 进行搜索，也可以参照 [Github查询语法](https://zhuanlan.zhihu.com/p/273766377) 进行查找，简单说几个:

* ` + "`" + `in:name <关键字>` + "`" + ` 仓库名称带关键字查询
* ` + "`" + `in:description <关键字>` + "`" + ` 仓库描述带关键字查询
* ` + "`" + `in:readme <关键字>` + "`" + ` README 文件带关键字查询
* ` + "`" + `stars(fork): >(=) <数字> <关键字>` + "`" + ` star 或 fork 数大于(或等于)指定数字的带关键字查询
* ` + "`" + `stars(fork): 10..20 <关键词>` + "`" + ` star 或 fork 数在 10 到 20 之间的带关键字查询
* ` + "`" + `size:>=5000 <关键词>` + "`" + ` 限定仓库大于等于 5000K 的带关键字查询
* ` + "`" + `pushed(created):>2019-11-15 <关键字>` + "`" + ` 更新 或 创建 日期在 2019 年 11 月 16 日之后的带关键字查询
* ` + "`" + `license:apache-2.0 <关键字>` + "`" + ` LICENSE 为 apache-2.0 的带关键字查询
* ` + "`" + `language:java <关键词>` + "`" + ` 仓库语言为 Java 的带关键字查询
* ` + "`" + `user:<用户名>` + "`" + ` 查询某个用户的项目
* ` + "`" + `org:<组织名>` + "`" + ` 查询某个组织的项目
  这些可以混合使用，也可以先查找某一类的 awesome 仓库，然后从 awesome 库里找相关的资源，github 里有很多归纳仓库，可以先看看已有的收集，有时候会节省很多时间

### 更多技巧

使用中，实际上我会去特定网站找一些问题：

* 如果是语言本身相关，比如 c++/Qt/OpenGL 如何实现什么功能，可以直接加上 ` + "`" + `site:stackoverflow.com` + "`" + `
* 如果是具体的业务/开发环境或者软件相关，可以先在 BugList 、IssueList ，或者相关论坛里先找一下，比如 Qt 的问题就可以直接去 Qt 论坛，QGis 或者 GDAL 相关问题可以在 stackExchange 里去搜
* QQ 群也是一个提问的地方，但是需要你提的问题有意义，否则大部分人不会回你，而且 QQ 群回复并不及时。
* 知乎专栏、简书、博客园、 CSDN 中有大量中文笔记，这些都是别人嚼烂了的东西，基本是别人踩坑的经验

### 关于百度

大部分编程人都会告诉你别用百度，用 Google 或者 Bing 国际版，但是 Bing 中文搜索的准确率并不高， Google 需要科学上网，如果真的需要，可以使用 Ecosia 、 Yandex 之类的搜索引擎。而且中文搜索来说，百度可能还真是最好的。

百度的问题主要在于排序算法，可能两页都没啥对的内容，但是收录比 Bing 还是好一些的（百度以前并不遵守 robots.txt ，会抓取所有页面，所以有些个人网站甚至专门对百度做了屏蔽），甚至有时候比 Google 好。从数据库来说，百度比 Google 和 Bing 收录的中文内容要多，如果你碰到的时中文相关的问题而且确实找不到相关内容，那么就用百度，搜索引擎是工具，能用好用才是王道。

## 代码搜索

我们除了搜索引擎查找问题，还有可能会搜一些代码，可能是自己写的，也可能是项目中的，下面推荐一些工具：

代码检索有两种，第一是本地的代码检索，第二是要写个啥算法，需要在网上搜索

### 本地代码搜索

* ACK 或者 ACK2，老牌搜索工具，perl 写的
* The Silver Searcher c 实现的
* The Platinum Searcher go 实现的
* FreeCommander 自带的搜索，如果是固态硬盘速度还不错
* IDE 自带的，搜索有些时候并不太好用

### 开源代码搜索

* [Searchcode](https://searchcode.com) 搜索开源代码，速度比较快
* [一行代码](https://www.alinecode.com) 国产的，有些国产工具很好用



[^ 1]: [搜索引擎工作原理简介 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/301641935)`,
	},
	{
		DisplayName:       `俏皮的花卷go`,
		School:            `CS自学指南`,
		MajorLine:         `操作系统`,
		ArticleTitle:      `CS自学 | CS162: Operating System`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS162: Operating System。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `操作系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS162: Operating System

## Descriptions

- Offered by: UC Berkeley
- Prerequisites: CS61A, CS61B, CS61C; Solid C programming and GDB debugging skills
- Programming Languages: C, x86 Assembly
- Difficulty: 🌟🌟🌟🌟🌟🌟
- Class Hour: 200 hours+

The course impressed me in two aspects:

Firstly, the textbook: Operating Systems: Principles and Practice (2nd Edition) consists of four volumes. It is written in a very accessible yet profound way, with vivid and sometimes even humorous language. It serves as an excellent supplement to the lecture videos and perfectly fills some theoretical gaps left by MIT 6.S081. This is also the experimental textbook for CMU's OS course (15410), I highly recommend reading it! Related resources are shared in the "Classic Books" section of this repository.

Secondly, the project for this course *Pintos* is a great journey for system hackers. *Pintos* is a toy operating system developed at Stanford for educational use. The author Ben Pfaff even published a [paper](https://benpfaff.org/papers/pintos.pdf) to explain the design principles of *Pintos*.

Unlike the small but comprehensive design philosophy in MIT's xv6 labs, *Pintos* emphasizes system design and implementation more. The codebase is about 10,000 LOC and only provides the basic functions of a working operating system. Each project has almost no boilerplate code; you must design the implementation yourself and weigh the pros and cons of different schemes. The four projects let you add scheduler (Project1), system calls (Project2), virtual memory (Project3), and the file system (Project4) *(Note: The specific requirements for CS162 Pintos differ slightly; see the assignment description below)* to this extremely simple operating system. All projects leave a a big design space for students and require more than 2000 LOC. Based on the [feedback](https://www.quora.com/What-is-it-like-to-take-CS-140-Operating-Systems-at-Stanford) from Stanford students, the latter two projects take over 40 hours per person even in teams of 3-4 people.

Although it is tough, Stanford, Berkeley, JHU and many other top U.S. colleges have chosen *Pintos* as their OS course project. If you're really interested in operating systems, it will greatly improve your ability to write and debug low-level system code and teach you how to design a system by making trade-offs between different possibilities. For me, it is an invaluable experience to design, implement, and debug a large system independently.

*Pintos* will also be introduced as a course project in Peking University's OS Course. In the Spring 2022 semester, I worked with [another TA](https://github.com/AlfredThiel) to write a comprehensive [lab documentation](https://pkuflyingpig.gitbook.io/pintos) and provided a docker image for the ease of cross-platform development. In the last semester before graduation, I hope such an attempt can make more people fall in love with systems and contribute to the field of systems in China.

## Course Resources

- Course Website: 
  - [Current Semester](https://cs162.org/)
  - [Fa25 - Wayback Machine](https://web.archive.org/web/20251211080516/https://cs162.org/)
- Lecture Videos: Currently, three semesters are publicly available: Fall 2020, Fall 2021, and Spring 2022. Based on my experience with the Fall 2025 semester, the **Spring 2022** version is best for self-study. It was recorded in-person (except for the first four lectures), featuring more student-teacher interaction and many valuable questions addressed in class:
  - [Spring 2022 Lecture Videos (Bilibili)](https://www.bilibili.com/video/BV1L541117gr?vd_source=e293470ea109e008c4d9516e39ef318f&p=5&spm_id_from=333.788.videopod.episodes)
  - [Fall 2020 Lecture Videos (Bilibili)](https://www.bilibili.com/video/BV1MwDSYWEKy?spm_id_from=333.788.videopod.sections&vd_source=e293470ea109e008c4d9516e39ef318f&p=24)
  - Fall 2021 video links can be found on the [Fall 2021 Website](https://web.archive.org/web/20211216005317/https://cs162.org/).
- Textbook: [Operating Systems: Principles and Practice (2nd Edition)](http://ospp.cs.washington.edu/). This textbook is an excellent supplement to the lectures and is highly recommended.
- Assignments: Consists of 3 Projects and 6 Homeworks. (The workload for each Homework is roughly equivalent to a full Project in most other open-source courses. Projects were originally designed for teams; self-studying them alone involves a significant workload):
  - 3 Projects (each with complete local tests):
    1. User Programs: Implement argument parsing for process execution, process-related system calls (including the ` + "`" + `fork` + "`" + ` syscall added in 2025), and file-related system calls.
    2. Threads: Implement a non-busy-waiting ` + "`" + `timer_sleep` + "`" + ` function, a strict priority scheduler, multi-threading support, and a simplified ` + "`" + `pthread` + "`" + ` library. (Note: This differs from the Multi-Level Feedback Queue requirements in the PKU Pintos and Stanford CS212 versions).
    3. File Systems: Implement a kernel Buffer Cache, extensible files, and subdirectories.
  - 6 Homeworks: Includes a sub-task for the MapReduce assignment. Both HTTP and MapReduce assignments have two versions: C and Rust. Except for the Memory lab, most Homeworks lack local autograders (though most can be manually tested effectively, except for MapReduce, which can be replaced by the [MIT 6.824 MapReduce lab](https://pdos.csail.mit.edu/6.824/labs/lab-mr.html)).
    1. List: Familiarize with the built-in linked list structure in Pintos.
    2. Shell: Implement a Shell supporting directory commands, program execution, path parsing, redirection, pipes, and signal handling.
    3. HTTP: Implement an HTTP server supporting GET requests.
    4. Memory: Implement memory management functions like ` + "`" + `sbrk` + "`" + ` and ` + "`" + `malloc` + "`" + `.
    5. MapReduce: Implement a fault-tolerant MapReduce system (including the RPC Lab).

---

## Personal Resources

All resources and assignment implementations (including code, design documents, and starter code) used during my study of the **Fall 2025** semester are summarized in the [@RisingUppercut/CS162-fall25 - GitHub](https://github.com/RisingUppercut/UCB_CS162_2025Fall) repository.

Since the Operating System Course at PKU uses the project, my implementation is not open source to prevent plagiarism.`,
	},
	{
		DisplayName:       `章鱼画水彩`,
		School:            `CS自学指南`,
		MajorLine:         `操作系统`,
		ArticleTitle:      `CS自学 | CS162: Operating System`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS162: Operating System。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `操作系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS162: Operating System

## 课程简介

- 所属大学：UC Berkeley
- 先修要求：CS61A, CS61B, CS61C，扎实的C语言能力及GDB调试能力
- 编程语言：C, x86汇编
- 课程难度：🌟🌟🌟🌟🌟🌟
- 预计学时：200 小时+，上不封顶

这门课让我记忆犹新的有两个部分：

首先是教材，这本书用的教材 *Operating Systems: Principles and Practice (2nd Edition)* 一共四卷，写得非常深入浅出，语言生动甚至时而幽默，是本课程 Lecture 视频内容极好的完善与补充，同时也很好地弥补了 MIT6.S081 在理论知识上的些许空白，是 CMU 操作系统课 15410 的实验性教材，非常建议大家阅读！相关资源会分享在本书的经典书籍推荐模块。

其次是这门课的 Project —— Pintos。Pintos 是由 Ben Pfaff 等人在 x86 平台上编写的教学用操作系统，Ben Pfaff 甚至专门发了篇 [paper](https://benpfaff.org/papers/pintos.pdf) 来阐述 Pintos 的设计思想。

和 MIT 的 xv6 小而精的 lab 设计理念不同，Pintos 更注重系统的 Design and Implementation。Pintos 本身仅一万行左右，只提供了操作系统最基本的功能。每个project几乎没有框架代码，都需要自己设计实现并权衡不同方案的优缺点。而 4 个Project，就是让你在这个极为精简的操作系统之上，分别为其增加线程调度机制 (Project1)，系统调用 (Project2)，虚拟内存 (Project3) 以及文件系统 (Project4)*（注：CS162 Pintos 的 project 和上述略有不同，详见下方课程作业说明）*。所有的 Project 都给学生留有很大的设计空间，总代码量在 2000 行左右。根据 Stanford 学生[自己的反馈][quora_link]，在 3-4 人组队的情况下，后两个 Project 的人均耗时也在 40 个小时以上。

[quora_link]: https://www.quora.com/What-is-it-like-to-take-CS-140-Operating-Systems-at-Stanford

虽然难度很大，但 Stanford, Berkeley, JHU 等多所美国顶尖名校的操统课程均采用了 Pintos。如果你真的对操作系统很感兴趣，Pintos 会极大地提高你编写和 debug 底层系统代码的能力，并让你学会设计一个系统，使你在不同可能的设计中学会取舍。在本科阶段，能自己设计、实现并 debug 一个大型系统，是一段非常珍贵的经历。

北大 2022 年春季学期的操作系统实验班也将会首次引入 Pintos 作为课程 Project。我和该课程的[另一位助教](https://github.com/AlfredThiel)整理并完善了 Pintos 的[实验文档](https://pkuflyingpig.gitbook.io/pintos)，并利用 Docker 配置了跨平台的实验环境，想自学的同学可以按文档自行学习。在毕业前的最后一个学期，希望能用这样的尝试，让更多人爱上系统领域，为国内的系统研究添砖加瓦。

## 课程资源

- 课程网站：
  - [当前最新学期](https://cs162.org/)
  - [Fa25-WayBack Machine](https://web.archive.org/web/20251211080516/https://cs162.org/)
- 课程视频，目前公开的视频有三个学期，分别为: 2020Fall，2021Fall 及 2022Spring 。根据我学习 2025Fall 学期的经历来看，2022Spring 的最适合自学，因为这个学期是线下录制的形式（除了前四节），上课时师生之间的互动更多，有很多有价值的问题在课堂上被解决：
  - [2022Spring课程视频](https://www.bilibili.com/video/BV1L541117gr?vd_source=e293470ea109e008c4d9516e39ef318f&p=5&spm_id_from=333.788.videopod.episodes)
  - [2020Fall课程视频](https://www.bilibili.com/video/BV1MwDSYWEKy?spm_id_from=333.788.videopod.sections&vd_source=e293470ea109e008c4d9516e39ef318f&p=24)
  - 2021Fall的各个视频链接在[2021Fall网站](https://web.archive.org/web/20211216005317/https://cs162.org/)上
- 课程教材：[Operating Systems: Principles and Practice (2nd Edition)](http://ospp.cs.washington.edu/)，本教材是课上 Lecture 内容的很好的补充，强烈推荐阅读。
- 课程作业：3 个 Project，6 个 Homework（每个Homework的工作量大致相当于其他大部分公开课的Project， Project原本要求是组队实现，一个人自学的工作量较大）：
  - 3 个 Project , 每个 Project 都有完整的本地测试：
    1. User Programs: 实现进程执行函数的参数解析传递，实现进程相关的系统调用（25年的新增了fork系统调用），实现文件相关系统调用。
    2. Threads: 实现不忙等的 ` + "`" + `timer_sleep` + "`" + ` 函数, 实现严格优先级调度器，实现对多线程的支持，实现简化版的 pthread 库（这与北大的 Pintos 及 斯坦福的 CS212 的多级反馈调度的要求不同）。
    3. File Systems: 实现文件系统内核缓冲区 Buffer Cache，实现可扩容的文件，实现子目录。
  - 6 个 Homework， 其中一个为 Map Reduce 作业的子任务，作业 HTTP 及 Map Reduce 均有两个版本：C 和 Rust。除了 Memory 作业外，其他 Homework 均没有本地测试（但除了 Map Reduce 作业外， 其他作业都可以手动测试的大差不差， Map Reduce 作业可换成 [MIT 6.824 的对应作业](https://pdos.csail.mit.edu/6.824/labs/lab-mr.html)）
    1. List: 熟悉 Pintos 内置的链表结构
    2. Shell: 实现支持目录命令、启动程序、路径解析、重定向、管道、信号处理的 Shell
    3. HTTP: 实现一个支持 HTTP GET 请求的 HTTP 服务器
    4. Memory: 实现 sbrk，malloc 等内存管理函数
    5. Map Reduce: 实现一个可容忍错误的 MapReduce 系统
        - 包含作业 RPC Lab


## 资源汇总

@[RisingUppercut] 在学习这门课（2025Fall）中用到的所有资源和作业实现（包括代码、设计文档、初始框架代码等）都汇总在 [@RisingUppercut/CS162-fall25 - GitHub](https://github.com/RisingUppercut/UCB_CS162_2025Fall) 中。

[RisingUppercut]: https://github.com/RisingUppercut

由于北大的操统实验班采用了该课程的 Project，为了防止代码抄袭，我的代码实现没有开源。`,
	},
	{
		DisplayName:       `布丁青蛙`,
		School:            `CS自学指南`,
		MajorLine:         `操作系统`,
		ArticleTitle:      `CS自学 | HIT OS: Operating System`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：HIT OS: Operating System。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `操作系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# HIT OS: Operating System

## Course Introduction

- University: Harbin Institute of Technology
- Prerequisites: C Language
- Programming Languages: C Language, Assembly
- Course Difficulty: 🌟🌟🌟🌟
- Estimated Study Hours: 100 hours+

If you search on Zhihu for questions like "how to self-study operating systems", "recommended open courses for operating systems", "computer courses you wish you had discovered earlier", etc., the operating systems course by Professor Li Zhijun of Harbin Institute of Technology (HIT) is likely to appear in the high-rated answers. It's a relatively well-known and popular Chinese computer course.

This course excels at gently guiding students from their perspective. For instance, it starts from "humbly asking, what is an operating system" to "lifting the lid of the operating system piano", deriving the concept of processes from intuitive CPU management, and introducing memory management by initially "letting the program enter memory".

The course emphasizes the combination of theory and practice. Operating systems are tangible, and Professor Li repeatedly stresses the importance of doing experiments. You won't fully grasp operating systems if you just watch videos and theorize. The course explains and conducts experiments based on actual Linux 0.11 source code (around 20,000 lines in total), with eight small labs and four projects.

Of course, this course also has minor imperfections. For example, Linux 0.11 is very early industrial code and not designed for teaching. Thus, there are some unavoidable obscure and difficult parts of the codebase in the projects, but they don't contribute much to the understanding of operating systems.

## Course Resources

- Course Website: <https://www.icourse163.org/course/HIT-1002531008>
- Course Videos: <https://www.bilibili.com/video/BV19r4y1b7Aw/?p=1>
- Course Textbook 1: [Complete Annotation of Linux Kernel](https://book.douban.com/subject/1231236//)
- Course Textbook 2: [Operating System Principles, Implementation, and Practice](https://book.douban.com/subject/30391722/)
- Course Assignments: <https://www.lanqiao.cn/courses/115>

## Complementary Resources

@NaChen95 has compiled the principles and implementations of the eight experimental assignments in this course at [NaChen95 / Linux0.11](https://github.com/NaChen95/Linux0.11).`,
	},
	{
		DisplayName:       `牛轧糖z`,
		School:            `CS自学指南`,
		MajorLine:         `操作系统`,
		ArticleTitle:      `CS自学 | HIT OS: Operating System`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：HIT OS: Operating System。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `操作系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# HIT OS: Operating System

## 课程简介

- 所属大学：哈尔滨工业大学
- 先修要求：C 语言
- 编程语言：C 语言、汇编
- 课程难度：🌟🌟🌟🌟
- 预计学时：100 小时+

如果你在知乎上搜索“操作系统如何自学”、“操作系统的公开课推荐”、“有哪些让你相见恨晚的计算机课程”等问题，哈工大李治军老师的操作系统课程大概率都会在某条高赞回答的推荐里。这是一门知名度较高、颇受欢迎的中文计算机课程。

这门课善于站在学生角度循循善诱。例如，课程从“弱弱地问，什么是操作系统”来“揭开操作系统钢琴的盖子”，从 CPU 的直观管理引出进程概念，从“那就首先让程序进入内存”引出内存管理。

这门课注重理论和实践相结合。操作系统是看得见摸得着的东西，李老师反复强调一定要做实验，如果只看视频纸上谈兵，是学不好操作系统的。课程基于实际的 Linux 0.11 源码（总代码量约两万行）进行讲解和实验，共有八个小实验，四个大实验。

当然，这门课也有一些瑕不掩瑜的地方。例如，Linux 0.11 是很早期工业界的代码，不是为了教学而设计的。因此在实验过程中会有一些避不开的晦涩难懂的原生代码，但它们对理解操作系统其实并没有太大帮助。

## 课程资源

- 课程网站：<https://www.icourse163.org/course/HIT-1002531008>
- 课程视频：<https://www.bilibili.com/video/BV19r4y1b7Aw/?p=1>
- 课程教材一：[《Linux 内核完全注释》](https://book.douban.com/subject/1231236//)
- 课程教材二：[《操作系统原理、实现与实践》](https://book.douban.com/subject/30391722/)
- 课程作业：<https://www.lanqiao.cn/courses/115>

## 资源汇总

@NaChen95 在学习这门课中的八个实验作业的原理分析和实现都汇总在 [NaChen95 / Linux0.11](https://github.com/NaChen95/Linux0.11) 中。`,
	},
	{
		DisplayName:       `绿豆葡萄`,
		School:            `CS自学指南`,
		MajorLine:         `操作系统`,
		ArticleTitle:      `CS自学 | MIT 6.S081: Operating System Engineering`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT 6.S081: Operating System E。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `操作系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT 6.S081: Operating System Engineering

## Descriptions

- Offered by: MIT
- Prerequisites: Computer Architecture + Solid C Programming Skills + RISC-V Assembly
- Programming Languages: C, RISC-V
- Difficulty: 🌟🌟🌟🌟🌟
- Class Hour: 150 hours

This is the undergraduate operating system course at MIT, offered by the well-known PDOS Group. One of the instructors, Robert Morris, was once a famous hacker who created 'Morris', the first worm virus in the world.

The predecessor of this course was the famous MIT6.828. The same instructors at MIT created an educational operating system called JOS based on x86, which has been adopted by many other famous universities. While after the birth of RISC-V, they implemented it based on RISC-V, and offered MIT 6.S081. RISC-V is lightweight and user-friendly, so students don't have to struggle with the confusing legacy features in x86 as in JOS, but focus on the operating system design and implementation. 

The instructors have also written a [tutorial](https://pdos.csail.mit.edu/6.828/2021/xv6/book-riscv-rev2.pdf), elaborately explaining the ideas of design and details of the implementation of xv6 operating system. 

The teaching style of this course is also interesting, the instructors guided the students to understand the numerous technical challenges and design principles in the operating systems by going through the xv6 source code, instead of merely teaching theoretical knowledge. Weekly Labs will let you add new features to xv6, which focus on enhancing students' practical skills. There are 11 labs in total during the whole semester which give you the chance to understand every aspect of the operating systems, bringing a great sense of achievement. Each lab has a complete framework for testing, some tests are more than a thousand lines of code, which shows how much effort the instructors have made to teach this course well.

In the second half of the course, the instructors will discuss a couple of classic papers in the operating system field, covering file systems, system security, networking, virtualization, and so on, giving you a chance to have a taste of the cutting edge research directions in the academic field.

## Course Resources

- Course Website: <https://pdos.csail.mit.edu/6.828/2021/schedule.html>
- Lecture Videos: <https://www.youtube.com/watch?v=L6YqHxYHa7A>, videos for each lecture can be found on the course website.
- Translated documentation(Chinese) of Lecture videos: <https://mit-public-courses-cn-translatio.gitbook.io/mit6-s081/>
- Text Book: <https://pdos.csail.mit.edu/6.828/2021/xv6/book-riscv-rev2.pdf>
- Assignments: <https://pdos.csail.mit.edu/6.828/2021/schedule.html>, 11 labs, can be found on the course website.

## xv6 Resources

- [Detailed Explanation of xv6](https://space.bilibili.com/1040264970/)
- [xv6 Documentation(Chinese)](https://th0ar.gitbooks.io/xv6-chinese/content/index.html)
- [line-by-line walk-through of key xv6 source codes](https://www.youtube.com/playlist?list=PLbtzT1TYeoMhTPzyTZboW_j7TPAnjv9XB)
- [Text Book Translation xv6-riscv-book-zh-cn](https://blog.betteryuan.top/archives/xv6-riscv-book-zh-cn)
- [Text Book Translation SRC xv6-riscv-book-zh-cn](https://github.com/HelloYJohn/xv6-riscv-book-zh-cn.git)

## Complementary Resources

All resources used and assignments implemented by @PKUFlyingPig when learning this course are in [PKUFlyingPig/MIT6.S081-2020fall - GitHub][github_pkuflyingpig].

@[KuangjuX][KuangjuX] documented his [solutions][solution_kuangjux] with detailed explanations and complementary knowledge. Moreover, @[KuangjuX][KuangjuX] has reimplemented [the xv6 operating system in Rust][xv6-rust] which contains more detailed reviews and discussions about xv6.

[github_pkuflyingpig]: https://github.com/PKUFlyingPig/MIT6.S081-2020fall
[KuangjuX]: https://github.com/KuangjuX
[solution_kuangjux]: https://github.com/KuangjuX/xv6-riscv-solution
[xv6-rust]: https://github.com/Ko-oK-OS/xv6-rust

### Some Blogs for References

- [doraemonzzz](http://doraemonzzz.com/tags/6-S081/)
- [Xiao Fan (樊潇)](https://fanxiao.tech/posts/2021-03-02-mit-6s081-notes/)
- [Miigon's blog](https://blog.miigon.net/categories/mit6-s081/)
- [Zhou Fang](https://walkerzf.github.io/categories/6-S081/index.html)
- [Yichun's Blog](https://www.yichuny.page/tags/Operating%20System)
- [解析Ta](https://blog.csdn.net/u013577996/article/details/108679997)
- [PKUFlyingPig](https://github.com/PKUFlyingPig/MIT6.S081-2020fall)
- [星遥见](https://www.cnblogs.com/weijunji/tag/XV6/)`,
	},
	{
		DisplayName:       `包子鸭`,
		School:            `CS自学指南`,
		MajorLine:         `操作系统`,
		ArticleTitle:      `CS自学 | MIT 6.S081: Operating System Engineering`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT 6.S081: Operating System E。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `操作系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT 6.S081: Operating System Engineering

## 课程简介

- 所属大学：麻省理工学院
- 先修要求：体系结构 + 扎实的 C 语言功底 + RISC-V 汇编语言
- 编程语言：C, RISC-V
- 课程难度：🌟🌟🌟🌟🌟
- 预计学时：150 小时

麻省理工学院大名鼎鼎的 PDOS 实验室开设的面向MIT本科生的操作系统课程。开设这门课的教授之一 —— Robert Morris 教授曾是一位顶尖黑客，世界上第一个蠕虫病毒 Morris 就是出自他之手。

这门课的前身是 MIT 著名的课程 6.828，MIT 的几位教授为了这门课曾专门开发了一个基于 x86 的教学用操作系统 JOS，被众多名校作为自己的操统课程实验。但随着 RISC-V 的横空出世，这几位教授又基于 RISC-V 开发了一个新的教学用操作系统 xv6，并开设了 MIT6.S081 这门课。由于 RISC-V 轻便易学的特点，学生不需要像此前 JOS 一样纠结于众多 x86 “特有的”为了兼容而遗留下来的复杂机制，而可以专注于操作系统层面的开发。

这几位教授还专门写了一本[教程](https://pdos.csail.mit.edu/6.828/2021/xv6/book-riscv-rev2.pdf)，详细讲解了 xv6 的设计思想和实现细节。

这门课的讲授也很有意思，老师会带着学生依照 xv6 的源代码去理解操作系统的众多机制和设计细节，而不是停留于理论知识。每周都会有一个 lab，让你在 xv6 上增加一些新的机制和特性，非常注重学生动手能力的培养。整个学期一共有 11 个 lab，让你全方位地深刻理解操作系统的每个部分，非常有成就感。而且所有的lab都有着非常完善的测试框架，有的测试代码甚至上千行，让人不得不佩服 MIT 的几位教授为了教好这门课所付出的心血。

这门课的后半程会讲授操作系统领域的多篇经典论文，涉及文件系统、系统安全、网络、虚拟化等等多个主题，让你有机会接触到学界最前沿的研究方向。

## 课程资源

- 课程网站：<https://pdos.csail.mit.edu/6.828/2021/schedule.html>
- 课程视频：<https://www.youtube.com/watch?v=L6YqHxYHa7A>，每节课的链接详见课程网站
- 课程视频翻译文档：<https://mit-public-courses-cn-translatio.gitbook.io/mit6-s081/>
- 课程教材：<https://pdos.csail.mit.edu/6.828/2021/xv6/book-riscv-rev2.pdf>
- 课程作业：<https://pdos.csail.mit.edu/6.828/2021/schedule.html>，11个lab，具体要求详见课程网站

## xv6 补充资源

- [xv6 操作系统的深入讲解](https://space.bilibili.com/1040264970/)
- [xv6 中文文档](https://th0ar.gitbooks.io/xv6-chinese/content/index.html)
- [xv6 关键源码逐行解读 + 整体架构分析](https://www.youtube.com/playlist?list=PLbtzT1TYeoMhTPzyTZboW_j7TPAnjv9XB)
- [课程教材翻译 xv6-riscv-book-zh-cn](https://blog.betteryuan.top/archives/xv6-riscv-book-zh-cn)
- [课程教材翻译源码 xv6-riscv-book-zh-cn](https://github.com/HelloYJohn/xv6-riscv-book-zh-cn.git)

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/MIT6.S081-2020fall - GitHub][github_pkuflyingpig] 中。

@[KuangjuX] 编写了 MIT 6.S081 的 lab 的[题解][solution_kuangjux]，里面有详细的解法和补充知识。另外，@[KuangjuX] 还使用 Rust 语言重新实现了 xv6-riscv 操作系统：[xv6-rust]，里面对于 xv6-riscv 有更为详细的思考和讨论，感兴趣的同学可以看一下哦。

[github_pkuflyingpig]: https://github.com/PKUFlyingPig/MIT6.S081-2020fall
[KuangjuX]: https://github.com/KuangjuX
[solution_kuangjux]: https://github.com/KuangjuX/xv6-riscv-solution
[xv6-rust]: https://github.com/Ko-oK-OS/xv6-rust

### 一些可以参考的博客

- [doraemonzzz](http://doraemonzzz.com/tags/6-S081/)
- [Xiao Fan (樊潇)](https://fanxiao.tech/posts/2021-03-02-mit-6s081-notes/)
- [Miigon's blog](https://blog.miigon.net/categories/mit6-s081/)
- [Zhou Fang](https://walkerzf.github.io/categories/6-S081/index.html)
- [Yichun's Blog](https://www.yichuny.page/tags/Operating%20System)
- [解析Ta](https://blog.csdn.net/u013577996/article/details/108679997)
- [PKUFlyingPig](https://github.com/PKUFlyingPig/MIT6.S081-2020fall)
- [星遥见](https://www.cnblogs.com/weijunji/tag/XV6/)
- [tzyt 的博客](https://ttzytt.com/tags/xv6/)`,
	},
	{
		DisplayName:       `企鹅弹吉他`,
		School:            `CS自学指南`,
		MajorLine:         `操作系统`,
		ArticleTitle:      `CS自学 | NJU OS: Operating System Design and Implementation`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：NJU OS: Operating System Desig。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `操作系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# NJU OS: Operating System Design and Implementation

## Course Introduction

- **University**: Nanjing University
- **Prerequisites**: Computer Architecture + Solid C programming skills
- **Programming Language**: C
- **Course Difficulty**: 🌟🌟🌟🌟
- **Estimated Study Time**: 150 hours

I had always heard that the operating system course taught by Professor Yanyan Jiang at Nanjing University was excellent. This semester, I had the opportunity to watch his lectures on Bilibili and gained a lot. As a young professor with rich coding experience, his teaching is full of a hacker's spirit. Often in class, he would start coding in the command line on a whim, and many important points were illustrated with vivid and straightforward code examples. What struck me most was when he implemented a mini executable file and a series of binary tools to help students better understand the design philosophy of dynamic link libraries, solving many problems that had puzzled me for years.

In the course, Prof. Jiang starts from the perspective that "programs are state machines" to establish an explainable model for the "root of all evil" concurrent programs. Based on this, he discusses common methods of concurrency control and strategies for dealing with concurrency bugs. Then, he views the operating system as a series of objects (processes/threads, address spaces, files, devices, etc.) and their APIs (system calls), combined with rich practical examples to show how operating systems use these objects to virtualize hardware resources and provide various services to application software. In the final part about persistence, he builds up various storage devices from 1-bit storage media and abstracts a set of interfaces through device drivers to facilitate the design and implementation of file systems. Although I have taken many operating system courses before, this unique approach has given me many unique perspectives on system software.

In addition to its innovative theoretical instruction, the course's emphasis on practice is a key feature of Prof. Jiang's teaching. In class and through programming assignments, he subtly cultivates the ability to read source code and consult manuals, which are essential skills for computer professionals. During the fifth MiniLab, I read Microsoft's FAT file system manual in detail for the first time, gaining a very valuable experience.

The programming assignments consist of 5 MiniLabs and 4 OSLabs. Unfortunately, the grading system is only open to students at Nanjing University. However, Professor Jiang generously allowed me to participate after I emailed him. I completed the 5 MiniLabs, and the overall experience was excellent. Particularly, the second coroutine experiment left a deep impression on me, where I experienced the beauty and "terror" of context switching in a small experiment of less than a hundred lines. Also, the MiniLabs can be easily tested locally, so the lack of a grading system should not hinder self-learning. Therefore, I hope others will not collectively "harass" the professor for access.

Finally, I want to thank Professor Jiang again for designing and offering such an excellent operating system course, the first independently developed computer course from a domestic university included in this book. It's thanks to young, new-generation teachers like Professor Jiang, who teach with passion despite the heavy Tenure track evaluation, that many students have an unforgettable undergraduate experience. I also look forward to more such high-quality courses in China, which I will include in this book for the benefit of more people.

## Course Resources

- Course Website: <https://jyywiki.cn/OS/2022/index.html>
- Course Videos: <https://space.bilibili.com/202224425/channel/collectiondetail?sid=192498>
- Course Textbook: <http://pages.cs.wisc.edu/~remzi/OSTEP/>
- Course Assignments: <https://jyywiki.cn/OS/2022/index.html>

## Resource Summary

As per Professor Jiang's request, my assignment implementations are not open-sourced.`,
	},
	{
		DisplayName:       `自在的豆包pro`,
		School:            `CS自学指南`,
		MajorLine:         `操作系统`,
		ArticleTitle:      `CS自学 | NJU OS: Operating System Design and Implementation`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：NJU OS: Operating System Desig。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `操作系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# NJU OS: Operating System Design and Implementation

## 课程简介

- 所属大学：南京大学
- 先修要求：体系结构 + 扎实的 C 语言功底
- 编程语言：C 语言
- 课程难度：🌟🌟🌟🌟
- 预计学时：150 小时

之前一直听说南大的蒋炎岩老师开设的操作系统课程讲得很好，久闻不如一见，这学期有幸在 B 站观看了蒋老师的课程视频，确实收获良多。蒋老师作为非常年轻的老师，有着丰富的一线代码的经验，因此课程讲授有着满满的 Hacker 风格，课上经常“一言不合”就在命令行里开始写代码，很多重要知识点也都配有生动直白的代码示例。让我印象最为深刻的就是老师为了让学生更好地理解动态链接库的设计思想，甚至专门实现了一个迷你的可执行文件与一系列的二进制工具，让很多困扰我多年的问题都得到了解答。

这门课的讲授思路也非常有趣，蒋老师先从“程序就是状态机”这一视角入手，为“万恶之源”并发程序建立了状态机的转化模型，并在此基础上讲授了并发控制的常见手段以及并发 bug 的应对方法。接着蒋老师将操作系统看作一系列对象（进程/线程、地址空间、文件、设备等等）以及操作它们的 API （系统调用）并结合丰富的实际例子介绍了操作系统是如何利用这系列对象虚拟化硬件资源并给应用软件提供各类服务的。最后的可持久化部分，蒋老师从 1-bit 的存储介质讲起，一步步构建起各类存储设备，并通过设备驱动抽象出一组接口来方便地设计与实现文件系统。我之前虽然上过许多门操作系统的课程，但这种讲法确实独此一家，让我收获了很多独到的视角来看待系统软件。

这门课除了在理论知识的讲授部分很有新意外，注重实践也是蒋老师的一大特点。在课堂和编程作业里，蒋老师会有意无意地培养大家阅读源码、查阅手册的能力，这也是计算机从业者必备的技能。在完成第五个 MiniLab 期间，我第一次仔仔细细阅读了微软的 FAT 文件系统手册，收获了一次非常有价值的经历。

编程作业共由 5个 MiniLab 和 4个 OSLab 组成。美中不足的是作业的评测机是不对校外开放的，不过在邮件“骚扰”后蒋老师还是非常慷慨地让我成功蹭课。由于课余时间有限我只完成了 5个 MiniLab，总体体验非常棒。尤其是第二个协程实验让我印象最为深刻，在不到百行的小实验里深刻体验了上下文切换的美妙与“可怕”。另外其实几个 MiniLab 都能非常方便地进行本地测试，就算没有评测机也不影响自学，因此希望大家不要聚众“骚扰”老师以图蹭课。

最后再次感谢蒋老师设计并开放了这样一门非常棒的操作系统课程，这也是本书收录的第一门国内高校自主开设的计算机课程。正是有蒋老师这些年轻的新生代教师在繁重的 Tenure 考核之余的用爱发电，才让无数学子收获了难忘的本科生涯。也期待国内能有更多这样的良心好课，我也会第一时间收录进本书中让更多人受益。

## 课程资源

- 课程网站：<https://jyywiki.cn/OS/2022/index.html>
- 课程视频：<https://space.bilibili.com/202224425/channel/collectiondetail?sid=192498>
- 课程教材：<http://pages.cs.wisc.edu/~remzi/OSTEP/>
- 课程作业：<https://jyywiki.cn/OS/2022/index.html>

## 资源汇总

按蒋老师的要求，我的作业实现没有开源。`,
	},
	{
		DisplayName:       `蜗牛吖`,
		School:            `CS自学指南`,
		MajorLine:         `数学基础`,
		ArticleTitle:      `CS自学 | MIT18.06: Linear Algebra`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT18.06: Linear Algebra。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学基础`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT18.06: Linear Algebra

## Descriptions

- Offered by: MIT
- Prerequisites: English
- Programming languages: None
- Difficulty: 🌟🌟🌟
- Class Hour: Varying from person to person

Gilbert Strang, a great mathematician at MIT, still insists on teaching in his eighties. His classic text book [Introduction to Linear Algebra](https://math.mit.edu/~gs/linearalgebra/) has been adopted as an official textbook by Tsinghua University. After reading the PDF version, I felt deeply guilty and spent more than 200 yuan to purchase a genuine version in English as collection. The cover of this book is attached below. If you can fully understand the mathematical meaning of the cover picture, then your understanding of linear algebra will definitely reach a new height.



In addition to the course materials, the famous Youtuber **3Blue1Brown**'s video series [The Essence of Linear Algebra](https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab) are also great learning resources.

## Resources

- Course Website: [fall2011](https://ocw.mit.edu/courses/mathematics/18-06sc-linear-algebra-fall-2011/syllabus/)
- Recordings: refer to the course website
- Textbook: Introduction to Linear Algebra, Gilbert Strang
- Assignments: refer to the course website

On May 15th, 2023, revered mathematics professor Gilbert Strang capped his 61-year career as a faculty member at MIT by delivering his [final 18.06 Linear Algebra lecture](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/final-1806-lecture-2023/) before retiring at the age of 88. In addition to a brief review for the course final exam, the overflowing audience (both in person and on the live YouTube stream) heard recollections, appreciations, and congratulations from Prof. Strang’s colleagues and former students. A rousing standing ovation concluded this historic event.`,
	},
	{
		DisplayName:       `安静的菠萝ff`,
		School:            `CS自学指南`,
		MajorLine:         `数学基础`,
		ArticleTitle:      `CS自学 | MIT18.06: Linear Algebra`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT18.06: Linear Algebra。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学基础`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT18.06: Linear Algebra

## 课程简介

- 所属大学：MIT
- 先修要求：英文
- 编程语言：无
- 课程难度：🌟🌟🌟
- 预计学时：因人而异

数学大牛 Gilbert Strang 老先生年逾古稀仍坚持授课，其经典教材 [Introduction to Linear Algebra](https://math.mit.edu/~gs/linearalgebra/) 已被清华采用为官方教材。我当时看完盗版 PDF 之后深感愧疚，含泪花了两百多买了一本英文正版收藏。下面附上此书封面，如果你能完全理解封面图的数学含义，那你对线性代数的理解一定会达到新的高度。

 

配合油管数学网红 **3Blue1Brown** 的[线性代数的本质](https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab)系列视频食用更佳。

## 课程资源

- 课程网站：[fall2011](https://ocw.mit.edu/courses/mathematics/18-06sc-linear-algebra-fall-2011/syllabus/)
- 课程视频：参见课程网站
- 课程教材：Introduction to Linear Algebra. Gilbert Strang
- 课程作业：参见课程网站

2023年5月15日，Gilbert Strang 上完了他在 18.06 的[最后一课](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/final-1806-lecture-2023/)，以88岁高龄结束了在其 MIT 61年的教学及科研生涯。但他的线性代数课已经并且还将继续影响一代代青年学子，让我们向老先生致以最崇高的敬意。`,
	},
	{
		DisplayName:       `桂花吖`,
		School:            `CS自学指南`,
		MajorLine:         `数学基础`,
		ArticleTitle:      `CS自学 | MIT Calculus Course`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT Calculus Course。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学基础`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT Calculus Course

## Descriptions

- Offered by: MIT
- Prerequisites: English
- Programming Languages: None
- Difficulty: 🌟🌟
- Class Hour: Varying from person to person

The calculus course at MIT consists of MIT18.01: Single Variable Calculus and MIT18.02: Multivariable Calculus. If you are confident in your math, you can just read the course notes, which are written in a very simple and vivid way, so that you will not be tired of doing homework but can really see the essence of calculus.

In addition to the course materials, the famous Youtuber **3Blue1Brown**'s video series [The Essence of Calculus](https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr) are also great learning resources.

## Course Resources

- Course Website: [18.01](https://ocw.mit.edu/courses/mathematics/18-01sc-single-variable-calculus-fall-2010/syllabus/), [18.02](https://ocw.mit.edu/courses/mathematics/18-02sc-multivariable-calculus-fall-2010/)
- Recordings: refer to course website
- Textbook: refer to course website
- Assignments: refer to course website`,
	},
	{
		DisplayName:       `橙子汤圆`,
		School:            `CS自学指南`,
		MajorLine:         `数学基础`,
		ArticleTitle:      `CS自学 | MIT Calculus Course`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT Calculus Course。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学基础`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT Calculus Course

## 课程简介

- 所属大学：MIT
- 先修要求：英语
- 编程语言：无
- 课程难度：🌟🌟
- 预计学时：因人而异

MIT 的微积分课由 MIT18.01: Single Variable Calculus 和 MIT18.02: Multivariable Calculus 两门课组成。对自己数学基础比较自信的同学可以只看课程 notes，写得非常浅显生动并且抓住本质，让你不再疲于做题而是能够真正窥见微积分的本质魅力。

配合油管数学网红 **3Blue1Brown** 的[微积分的本质](https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr)系列视频食用更佳。

## 课程资源

- 课程网站：[18.01](https://ocw.mit.edu/courses/mathematics/18-01sc-single-variable-calculus-fall-2010/syllabus/), [18.02](https://ocw.mit.edu/courses/mathematics/18-02sc-multivariable-calculus-fall-2010/)
- 课程视频：参见课程网站
- 课程教材：参见课程 notes
- 课程作业：书面作业及答案参见课程网站`,
	},
	{
		DisplayName:       `坚定的饼干`,
		School:            `CS自学指南`,
		MajorLine:         `数学基础`,
		ArticleTitle:      `CS自学 | MIT6.050J: Information theory and Entropy`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT6.050J: Information theory 。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学基础`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT6.050J: Information theory and Entropy

## Descriptions

- Offered by: MIT
- Prerequisites: None
- Programming Languages: None
- Difficulty: 🌟🌟🌟
- Class Hour: 100 hours

This is MIT's introductory information theory course for freshmen, Professor Penfield has written a special [textbook](https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-050j-information-and-entropy-spring-2008/syllabus/MIT6_050JS08_textbook.pdf) for this course as course notes, which is in-depth and interesting.

## Course Resources

- Course Website: [spring2008](https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-050j-information-and-entropy-spring-2008/index.htm)
- Textbook: [Information and Entropy](https://ocw.mit.edu/courses/6-050j-information-and-entropy-spring-2008/resources/mit6_050js08_textbook/)
- Assignments: see the course website for details, including written assignments and Matlab programming assignments.`,
	},
	{
		DisplayName:       `快乐的樱桃7`,
		School:            `CS自学指南`,
		MajorLine:         `数学基础`,
		ArticleTitle:      `CS自学 | MIT6.050J: Information theory and Entropy`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT6.050J: Information theory 。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学基础`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT6.050J: Information theory and Entropy

## 课程简介

- 所属大学：MIT
- 先修要求：无
- 编程语言：无
- 课程难度：🌟🌟🌟
- 预计学时：100 小时

MIT 面向大一新生的信息论入门课程，Penfield 教授专门为这门课写了一本[教材][textbook]作为课程 notes，内容深入浅出，生动有趣。

[textbook]: https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-050j-information-and-entropy-spring-2008/syllabus/MIT6_050JS08_textbook.pdf

## 课程资源

- 课程网站：[spring2008](https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-050j-information-and-entropy-spring-2008/index.htm)
- 课程教材：[Information and Entropy](https://ocw.mit.edu/courses/6-050j-information-and-entropy-spring-2008/resources/mit6_050js08_textbook/)
- 课程作业：详见课程网站，包含书面作业与 Matlab 编程作业。`,
	},
	{
		DisplayName:       `奔跑的柿子`,
		School:            `CS自学指南`,
		MajorLine:         `数学进阶`,
		ArticleTitle:      `CS自学 | MIT 6.042J: Mathematics for Computer Science`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT 6.042J: Mathematics for Co。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT 6.042J: Mathematics for Computer Science

## Descriptions

- Offered by: MIT
- Prerequisites: Calculus, Linear Algebra
- Programming Languages: Python preferred
- Difficulty: 🌟🌟🌟
- Class Hour: 50-70 hours

This is MIT‘s discrete mathematics and probability course taught by the notable Tom Leighton (co-founder of Akamai). It is very useful for learning algorithms subsequently.

## Course Resources

- Course Website: [spring2015](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/), [fall2010](https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-042j-mathematics-for-computer-science-fall-2010/), [fall2005](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2005/)
- Recordings: Refer to the course website
- Assignments: Refer to the course website`,
	},
	{
		DisplayName:       `泡芙薯片`,
		School:            `CS自学指南`,
		MajorLine:         `数学进阶`,
		ArticleTitle:      `CS自学 | MIT 6.042J: Mathematics for Computer Science`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT 6.042J: Mathematics for Co。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT 6.042J: Mathematics for Computer Science

## 课程简介

- 所属大学：MIT
- 先修要求：Calculus, Linear Algebra
- 编程语言：Python preferred
- 课程难度：🌟🌟🌟
- 预计学时：50-70 小时

MIT 的离散数学以及概率综合课程，导师是大名鼎鼎的 **Tom Leighton** ( Akamai 的联合创始人之一)。学完之后对于后续的算法学习大有裨益。

## 课程资源

- 课程网站：[spring2015](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/), [fall2010](https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-042j-mathematics-for-computer-science-fall-2010/), [fall2005](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2005/)
- 课程视频：[spring2015](https://www.bilibili.com/video/BV1n64y1i777/?spm_id_from=333.337.search-card.all.click&vd_source=a4d76d1247665a7e7bec15d15fd12349), [fall2010](https://www.bilibili.com/video/BV1L741147VX/?spm_id_from=333.337.search-card.all.click&vd_source=a4d76d1247665a7e7bec15d15fd12349)
- 课程作业：参考课程网站`,
	},
	{
		DisplayName:       `可颂不熬夜`,
		School:            `CS自学指南`,
		MajorLine:         `数学进阶`,
		ArticleTitle:      `CS自学 | UCB CS126 : Probability theory`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：UCB CS126 : Probability theory。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# UCB CS126 : Probability theory

## Descriptions

- Offered by: UC Berkeley
- Prerequisites: CS70, Calculus, Linear Algebra
- Programming Languages: Python
- Difficulty: 🌟🌟🌟🌟🌟
- Class Hour: 100 hours

This is Berkeley's advanced probability course, which involves relatively advanced theoretical content such as statistics and stochastic processes, so a solid mathematical foundation is required. But as long as you stick with it you will certainly take your mastery of probability theory to a new level.

The course is designed by Professor Jean Walrand, who has written an accompanying textbook, [Probability in Electrical Engineering and Computer Science](https://link.springer.com/book/10.1007/978-3-030-49995-2), in which each chapter uses a specific algorithm as a practical example to demonstrate the application of theory in practice. Such as PageRank, Route Planing, Speech Recognition, etc. The book is open source and can be downloaded as a free PDF or Epub version.

Jean Walrand has also created accompanying Python implementations of the examples throughout the book, which are published online as [Jupyter Notebook](https://jeanwalrand.github.io/PeecsJB/intro.html) that readers can modify, debug and run them online interactively.

In addition to the Homework, nine Labs will allow you to use probability theory to solve practical problems in Python.

## Course Resources

- Course Website: <https://inst.eecs.berkeley.edu/~ee126/fa20/content.html>
- Textbook: [PDF](https://link.springer.com/content/pdf/10.1007%2F978-3-030-49995-2.pdf), [Epub](https://link.springer.com/download/epub/10.1007%2F978-3-030-49995-2.epub), [Jupyter Notebook](https://jeanwalrand.github.io/PeecsJB/intro.html)
- Assignments: refer to the course website.

## Personal Resources

All the resources and assignments used by @PKUFlyingPig in this course are maintained in [PKUFlyingPig/EECS126 - GitHub](https://github.com/PKUFlyingPig/EECS126)`,
	},
	{
		DisplayName:       `奶酪大王`,
		School:            `CS自学指南`,
		MajorLine:         `数学进阶`,
		ArticleTitle:      `CS自学 | UCB CS126 : Probability theory`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：UCB CS126 : Probability theory。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# UCB CS126 : Probability theory

## 课程简介

- 所属大学：UC Berkeley
- 先修要求：CS70、微积分、线性代数
- 编程语言：Python
- 课程难度：🌟🌟🌟🌟🌟
- 预计学时：100 小时

伯克利的概率论进阶课程，涉及到统计学、随机过程等理论相对深入的内容，需要相当的数学基础，我在上这门课的时候也感到有些吃力，不过坚持下来一定会让你对概率论的掌握达到一个新的高度。

同时这门课非常强调理论与实践的结合，课程设计者 Jean Walrand 教授专门写了一本配套的教材[Probability in Electrical Engineering and Computer Science](https://link.springer.com/book/10.1007/978-3-030-49995-2)，书中每个章节都会以一个具体的算法实践作为例子来展示理论在实际当中的运用，例如 PageRank, Route Planing, Speech Recognition 等等，并且全书开源，可以免费下载 PDF 或者 Epub 版。

这还不算完，Jean Walrand 还为整本书里的例子设计了配套的 Python 实现，以 [Jupyter Notebook](https://jeanwalrand.github.io/PeecsJB/intro.html) 的形式在线发布，读者可以在线修改、调试和运行。

与此同时，这门课除了理论作业之外，还有 9 个编程作业，会让你用概率论的知识解决实际问题。

## 课程资源

- 课程网站：<https://inst.eecs.berkeley.edu/~ee126/fa20/content.html>
- 课程教材：[PDF], [Epub], [Jupyter Notebook][Jupyter_Notebook]
- 课程作业：14 个书面作业 + 9 个编程作业，具体要求参见课程网站。

[PDF]: https://link.springer.com/content/pdf/10.1007%2F978-3-030-49995-2.pdf
[Epub]: https://link.springer.com/download/epub/10.1007%2F978-3-030-49995-2.epub
[Jupyter_Notebook]: https://jeanwalrand.github.io/PeecsJB/intro.html

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/EECS126 - GitHub](https://github.com/PKUFlyingPig/EECS126) 中。`,
	},
	{
		DisplayName:       `椰子在发呆`,
		School:            `CS自学指南`,
		MajorLine:         `数学进阶`,
		ArticleTitle:      `CS自学 | UCB CS70: Discrete Math and Probability Theory`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：UCB CS70: Discrete Math and Pr。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# UCB CS70: Discrete Math and Probability Theory

## Descriptions

- Offered by: UC Berkeley
- Prerequisites: None
- Programming Languages: None
- Difficulty: 🌟🌟🌟
- Class Hour: 60 hours

This is Berkeley's introductory discrete mathematics course. The biggest highlight of this course is that it not only teaches you theoretical knowledge, but also introduce the applications of theoretical knowledge in practical algorithms in each module. In this way, students majoring in CS can understand the essence of theoretical knowledge and use it in practice rather than struggle with cold formal mathematical symbols.

Specific theory-algorithm correspondences are listed below.

- Logic proof: stable matching algorithm
- Graph theory: network topology design
- Basic number theory: RSA algorithm
- Polynomial ring: error-correcting code design
- Probability theory: Hash table design, load balancing, etc.

The course notes are also written in a very in-depth manner, with derivations of formulas and practical examples, providing a good reading experience.

## Course Resources

- Course Website: <http://www.eecs70.org/>
- Textbook: refer to the course website
- Assignments: refer to the course website

## Personal Resources

All the resources and assignments used by @PKUFlyingPig in this course are maintained in [PKUFlyingPig/UCB-CS70 - GitHub](https://github.com/PKUFlyingPig/UCB-CS70)`,
	},
	{
		DisplayName:       `太妃糖看电影`,
		School:            `CS自学指南`,
		MajorLine:         `数学进阶`,
		ArticleTitle:      `CS自学 | The Information Theory, Pattern Recognition, and N`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：The Information Theory, Patter。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# The Information Theory, Pattern Recognition, and Neural Networks

## Descriptions

- Offered by: Cambridge
- Prerequisites: Calculus, Linear Algebra, Probabilities and Statistics
- Programming Languages: Anything would be OK, Python preferred
- Difficulty: 🌟🌟🌟
- Class Hour: 30-50 hours

This is a course on information theory taught by Sir David MacKay at the University of Cambridge. The professor is a very famous scholar in information theory and neural networks, and the textbook for the course is a classic work in the field of information theory. Unfortunately, those whom God loves die young ...

## Course Resources

- Course Website: <http://www.inference.org.uk/mackay/itila/>
- Recordings: <https://www.youtube.com/playlist?list=PLruBu5BI5n4aFpG32iMbdWoRVAA-Vcso6>
- Textbooks: Information Theory, Inference, and Learning Algorithms
- Assignments: At the end of each lesson video, there are post-lesson exercises from the textbook

## R.I.P Prof. David MacKay`,
	},
	{
		DisplayName:       `蜜桃ss`,
		School:            `CS自学指南`,
		MajorLine:         `数学进阶`,
		ArticleTitle:      `CS自学 | Stanford EE364A: Convex Optimization`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Stanford EE364A: Convex Optimi。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Stanford EE364A: Convex Optimization

## Descriptions

- Offered by: Stanford
- Prerequisites: Python, Calculus, Linear Algebra, Probability Theory, Numerical Analysis
- Programming Languages: Python
- Difficulty: 🌟🌟🌟🌟🌟
- Class Hour: 150 hours

Professor [Stephen Boyd](http://web.stanford.edu/~boyd) is a great expert in the field of convex optimization and his textbook **Convex Optimization** has been adopted by many prestigious universities. His team has also developed a programming framework for solving common convex optimization problems in Python, Julia, and other popular programming languages, and its homework assignments also use this programming framework to solve real-life convex optimization problems.

In practice, you will deeply understand that for the same problem, a small change in the modeling process can make a world of difference in the difficulty of solving the equation. It is an art to make the equations you formulate "convex".

## Course Resources

- Course Website: <http://stanford.edu/class/ee364a/index.html>
- Recordings: <https://www.youtube.com/watch?v=VNON98dKjno&list=PLoCMsyE1cvdXeoqd1hGaMBsCAQQ6otUtO>
- Textbook: [Convex Optimization](https://stanford.edu/~boyd/cvxbook/)
- Assignments: refer to the course website

## Personal Resources

All the resources and assignments used by @PKUFlyingPig in this course are maintained in [PKUFlyingPic/Standford_CVX101 - GitHub](https://github.com/PKUFlyingPig/Standford_CVX101)`,
	},
	{
		DisplayName:       `牛轧糖要毕业了`,
		School:            `CS自学指南`,
		MajorLine:         `数学进阶`,
		ArticleTitle:      `CS自学 | Stanford EE364A: Convex Optimization`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Stanford EE364A: Convex Optimi。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Stanford EE364A: Convex Optimization

## 课程简介

- 所属大学：Stanford
- 先修要求：Python，微积分，线性代数，概率论，数值分析
- 编程语言：Python
- 课程难度：🌟🌟🌟🌟🌟
- 预计学时：150 小时

[Stephen Boyd](http://web.stanford.edu/~boyd) 教授是凸优化领域的大牛，其编写的 **Convex Optimization** 这本教材被众多名校采用。另外其研究团队还专门开发了一个用于求解常见凸优化问题的编程框架，支持 Python, Julia 等主流编程语言，其课程作业也是采用这个编程框架去解决实际生活当中的凸优化问题。

在实际运用当中，你会深刻体会到对于同一个问题，建模过程中一个细小的改变，其方程的求解难度会有天壤之别，如何让你建模的方程是“凸”的，是一门艺术。

## 课程资源

- 课程网站：<http://stanford.edu/class/ee364a/index.html>
- 课程视频：<https://www.bilibili.com/video/BV1aD4y1Q7aW>
- 课程教材：[Convex Optimization](https://stanford.edu/~boyd/cvxbook/)
- 课程作业：9 个 Python 编程作业

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/Standford_CVX101 - GitHub](https://github.com/PKUFlyingPig/Standford_CVX101) 中。`,
	},
	{
		DisplayName:       `饺子奶茶`,
		School:            `CS自学指南`,
		MajorLine:         `数学进阶`,
		ArticleTitle:      `CS自学 | MIT18.330 : Introduction to numerical analysis`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT18.330 : Introduction to nu。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数学进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT18.330 : Introduction to numerical analysis

## Descriptions

- Offered by: MIT
- Prerequisites: Calculus, Linear Algebra, Probability theory
- Programming Languages: Julia
- Difficulty: 🌟🌟🌟🌟🌟
- Class Hour: 150 hours

While the computational power of computers has been helping people to push boundaries of science, there is a natural barrier between the discrete nature of computers and this continuous world, and how to use discrete representations to estimate and approximate those mathematically continuous concepts is an important theme in numerical analysis.

This course will explore various numerical analysis methods in the areas of floating-point representation, equation solving, linear algebra, calculus, and differential equations, allowing you to understand (1) how to design estimation (2) how to estimate errors (3) how to implement algorithms in Julia. There are also plenty of programming assignments to practice these ideas.

The designers of this course have also written an open source textbook for this course (see the link below) with plenty of Julia examples.

## Course Resources

- Course Website: <https://github.com/mitmath/18330>
- Textbook: <https://fncbook.com>
- Assignments: 10 problem sets

## Personal Resources

All the resources and assignments used by @PKUFlyingPig in this course are maintained in [PKUFlyingPic/MIT18.330 - GitHub](https://github.com/PKUFlyingPig/MIT18.330)`,
	},
	{
		DisplayName:       `淡定的雪花`,
		School:            `CS自学指南`,
		MajorLine:         `数据库系统`,
		ArticleTitle:      `CS自学 | CMU 15-445: Database Systems`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CMU 15-445: Database Systems。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据库系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CMU 15-445: Database Systems

## Descriptions

- Offered by: CMU
- Prerequisites: C++, Data Structures and Algorithms
- Programming Languages: C++
- Difficulty: 🌟🌟🌟🌟
- Class Hour: 100 hours

As an introductory course to databases at CMU, this course is taught by Andy Pavlo, a leading figure in the database field (quoted as saying, "There are only two things I care about in this world, one is my wife, the second is the database").

This is a high-quality, resource-rich introductory course to Databases. 

The faculty and the CMU Database Group behind the course have open-sourced all the corresponding infrastructure (Autograder, Discord) and course materials (Lectures, Notes, Homework), enabling any student who is willing to learn about databases to enjoy an experience almost equivalent to that of a CMU student.

One of the highlights of this course is the relational database [Bustub](https://github.com/cmu-db/bustub), which was specifically developed by the CMU Database Group for teaching purposes. It requires you to modify various components of this database and implement their functionalities.

Specifically, in 15-445, you will need to implement some key components in ` + "`" + `Bustub` + "`" + `, a traditional disk-oriented relational database, through the progression of four Projects.

These components include the Buffer Pool Manager (for memory management), B Plus Tree (storage engine), Query Executors & Query Optimizer (operators & optimizer), and Concurrency Control, corresponding to ` + "`" + `Project #1` + "`" + ` through ` + "`" + `Project #4` + "`" + `.

Worth mentioning is that, during the implementation process, students can compile ` + "`" + `bustub-shell` + "`" + ` through ` + "`" + `shell.cpp` + "`" + ` to observe in real-time whether their implemented components are correct. The feedback is very sufficient.

Furthermore, as a medium-sized project written in C++, bustub covers many requirements such as program construction, code standards, unit testing, etc., making it an excellent open-source project for learning.

## Resources

- Course Website: [Fall 2019](https://15445.courses.cs.cmu.edu/fall2019/schedule.html), [Fall 2020](https://15445.courses.cs.cmu.edu/fall2020/schedule.html), [Fall 2021](https://15445.courses.cs.cmu.edu/fall2021/schedule.html), [Fall 2022](https://15445.courses.cs.cmu.edu/fall2022/schedule.html), [Spring 2023](https://15445.courses.cs.cmu.edu/spring2023/schedule.html)
- Recording: The course website is freely accessible, and the [Youtube Lectures](https://www.youtube.com/playlist?list=PLSE8ODhjZXjaKScG3l0nuOiDTTqpfnWFf) for Fall 2022 are fully open-source.
- Textbook: Database System Concepts
- Assignments: Five Projects and Five Homework

In Fall 2019, ` + "`" + `Project #2` + "`" + ` involved creating a hash index, and ` + "`" + `Project #4` + "`" + ` focused on logging and recovery.

In Fall 2020, ` + "`" + `Project #2` + "`" + ` was centered on ` + "`" + `B-trees` + "`" + `, while ` + "`" + `Project #4` + "`" + ` dealt with concurrency control.

In Fall 2021, ` + "`" + `Project #1` + "`" + ` required the creation of a buffer pool manager, ` + "`" + `Project #2` + "`" + ` involved a hash index, and ` + "`" + `Project #4` + "`" + ` focused on concurrency control.

In Fall 2022, the curriculum was similar to that of Fall 2021, with the only change being that the hash index was replaced by a B+ tree index, and everything else remained the same.

In Spring 2023, the overall content was largely identical to Fall 2022 (buffer pool, B+ tree index, operators, concurrency control), except ` + "`" + `Project #0` + "`" + ` shifted to ` + "`" + `Copy-On-Write Trie` + "`" + `. Additionally, a fun task of registering uppercase and lowercase functions was introduced, which allows you to see the actual effects of the functions you write directly in the compiled ` + "`" + `bustub-shell` + "`" + `, providing a great sense of achievement.

It's important to note that the versions of bustub prior to 2020 are no longer maintained. 

The last ` + "`" + `Logging & Recovery` + "`" + ` Project in Fall 2019 is broken (it may still run on the ` + "`" + `git head` + "`" + ` from 2019, but Gradescope doesn't provide a public version, so it is not recommended to work on it, it is sufficient to just review the code and handout). 

Perhaps in the Fall 2023 version, the recovery features will be fixed, and there may also be an entirely new ` + "`" + `Recovery Project` + "`" + `. Let's wait and see 🤪.

If you have the energy, I highly recommend giving all of them a try, or if there's something in the book that you don't quite understand, attempting the corresponding project can deepen your understanding (I personally suggest completing all of them, as I believe it will definitely be beneficial).

## Personal Resources

The unofficial [Discord](https://discord.com/invite/YF7dMCg) is a great platform for discussion. The chat history practically documents the challenges that other students have encountered. You can also raise your own questions or help answer others', which I believe will be a great reference.

For a guidance to get through Spring 2023, you can refer to [this article](https://zhuanlan.zhihu.com/p/637960746) by [@xzhseh](https://github.com/xzhseh) on [Zhihu](https://www.zhihu.com/) (Note: Since the article is originally written in Chinese, you may need a translator to read it :) ). It covers all the tools you need to succeed, along with guides and, most importantly, pitfalls that I've encountered, seen, or stepped into during the process of doing the Project.

All the resources and assignments used by [@ysj1173886760](https://github.com/ysj1173886760) in this course are maintained in [ysj1173886760/Learning:db - GitHub](https://github.com/ysj1173886760/Learning/tree/master/db).

Due to Andy's request, the repository does not contain the source code for the project, only the solution for homework. In particular, for Homework1, [@ysj1173886760](https://github.com/ysj1173886760) wrote a shell script to help you evaluate your solution automatically.

After the course, it is recommended to read the paper [Architecture Of a Database System](https://github.com/ysj1173886760/paper_notes/tree/master/db). This paper provides an overview of the overall architecture of database systems so that you can have a more comprehensive view of the database.
## Advanced courses

[CMU15-721](https://15721.courses.cs.cmu.edu/spring2020/) is a graduate-level course on advanced database system topics. It mainly focuses on the in-memory database, and each class has a corresponding paper to read. It is suitable for those who wish to do research in the field of databases. [@ysj1173886760](https://github.com/ysj1173886760) is currently following up on this course and will create a pull request here after completing it to provide advanced guidance.`,
	},
	{
		DisplayName:       `淡定的蝴蝶`,
		School:            `CS自学指南`,
		MajorLine:         `数据库系统`,
		ArticleTitle:      `CS自学 | CMU 15-445: Database Systems`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CMU 15-445: Database Systems。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据库系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CMU 15-445: Database Systems

## 课程简介

- 所属大学：CMU
- 先修要求：C++，数据结构与算法，CMU 15-213 (A.K.A. CS:APP，这也是 CMU 内部对每年 Enroll 同学的先修要求)
- 编程语言：C++
- 课程难度：🌟🌟🌟🌟
- 预计学时：100 小时

作为 CMU 数据库的入门课，这门课由数据库领域的大牛 Andy Pavlo 讲授（“这个世界上我只在乎两件事，一是我的老婆，二就是数据库”）。

这是一门质量极高，资源极齐全的 Database 入门课，这门课的 Faculty 和背后的 CMU Database Group 将课程对应的基础设施 (Autograder, Discord) 和课程资料 (Lectures, Notes, Homework) 完全开源，让每一个愿意学习数据库的同学都可以享受到几乎等同于 CMU 本校学生的课程体验。

这门课的亮点在于 CMU Database Group 专门为此课开发了一个教学用的关系型数据库 [bustub](https://github.com/cmu-db/bustub)，并要求你对这个数据库的组成部分进行修改，实现上述部件的功能。

具体来说，在 15-445 中你需要在四个 Project 的推进中，实现一个面向磁盘的传统关系型数据库 Bustub 中的部分关键组件。

包括 Buffer Pool Manager (内存管理), B Plus Tree (存储引擎), Query Executors & Query Optimizer (算子们 & 优化器), Concurrency Control (并发控制)，分别对应 ` + "`" + `Project #1` + "`" + ` 到 ` + "`" + `Project #4` + "`" + `。

值得一提的是，同学们在实现的过程中可以通过 ` + "`" + `shell.cpp` + "`" + ` 编译出 ` + "`" + `bustub-shell` + "`" + ` 来实时地观测自己实现部件的正确与否，正反馈非常足。

此外 bustub 作为一个 C++ 编写的中小型项目涵盖了程序构建、代码规范、单元测试等众多要求，可以作为一个优秀的开源项目学习。

## 课程资源

- 课程网站：[Fall 2019](https://15445.courses.cs.cmu.edu/fall2019/schedule.html), [Fall 2020](https://15445.courses.cs.cmu.edu/fall2020/schedule.html), [Fall 2021](https://15445.courses.cs.cmu.edu/fall2021/schedule.html), [Fall 2022](https://15445.courses.cs.cmu.edu/fall2022/schedule.html), [Spring 2023](https://15445.courses.cs.cmu.edu/spring2023/schedule.html)
- 课程视频：课程网站免费观看, Fall 2022 的 [Youtube 全开源 Lectures](https://www.youtube.com/playlist?list=PLSE8ODhjZXjaKScG3l0nuOiDTTqpfnWFf)
- 课程教材：Database System Concepts
- 课程作业：5 个 Project 和 5 个 Homework

在 Fall 2019 中，` + "`" + `Project #2` + "`" + ` 是做哈希索引，` + "`" + `Project #4` + "`" + ` 是做日志与恢复。

在 Fall 2020 中，` + "`" + `Project #2` + "`" + ` 是做 B 树，` + "`" + `Project #4` + "`" + ` 是做并发控制。

在 Fall 2021 中，` + "`" + `Project #1` + "`" + ` 是做缓存池管理，` + "`" + `Project #2` + "`" + ` 是做哈希索引，` + "`" + `Project #4` + "`" + ` 是做并发控制。

在 Fall 2022 中，与 Fall 2021 相比只有哈希索引换成了 B+ 树索引，其余都一样。

在 Spring 2023 中，大体内容和 Fall 2022 一样（缓存池，B+ 树索引，算子，并发控制），只不过 ` + "`" + `Project #0` + "`" + ` 换成了 ` + "`" + `Copy-On-Write Trie` + "`" + `，同时增加了很好玩的注册大小写函数的 Task，可以直接在编译出的 ` + "`" + `bustub-shell` + "`" + ` 中看到自己写的函数的实际效果，非常有成就感。

值得注意的是，现在 bustub 在 2020 年以前的 version 都已经停止维护。

Fall 2019 的最后一个 ` + "`" + `Logging & Recovery` + "`" + ` 的 Project 已经 broken 了（在19年的 ` + "`" + `git head` + "`" + ` 上也许还可以跑，但尽管如此 Gradescope 应该也没有提供公共的版本，所以并不推荐大家去做，只看看代码和 Handout 就可以了）。

或许在 Fall 2023 的版本 Recovery 相关的功能会被修复，届时也可能有全新的 ` + "`" + `Recovery Project` + "`" + `，让我们试目以待吧🤪

如果大家有精力的话可以都去尝试一下，或者在对书中内容理解不是很透彻的时候，尝试做一做对应的 Project 会加深你的理解（个人建议还是要全部做完，相信一定对你有帮助）。

## 资源汇总

非官方的 [Discord](https://discord.com/invite/YF7dMCg) 是一个很好的交流平台，过往的聊天记录几乎记载了其他同学踩过的坑，你也可以提出你的问题，或者帮忙解答别人的问题，相信这是一份很好的参考。

关于 Spring 2023 的通关指南，可以参考 [@xzhseh](https://github.com/xzhseh) 的这篇[CMU 15-445/645 (Spring 2023) Database Systems 通关指北](https://zhuanlan.zhihu.com/p/637960746)，里面涵盖了全部你需要的通关道具，和通关方式建议，以及最重要的，我自己在做 Project 的过程中遇到的，看到的，和自己亲自踩过的坑。

@ysj1173886760 在学习这门课中用到的所有资源和作业实现都汇总在 [ysj1173886760/Learning: db - GitHub](https://github.com/ysj1173886760/Learning/tree/master/db) 中。

由于 Andy 的要求，仓库中没有 Project 的实现，只有 Homework 的 Solution。特别的，对于 Homework1，@ysj1173886760 还写了一个 Shell 脚本来帮大家执行自动判分。

另外在课程结束后，推荐阅读一篇论文 [Architecture Of a Database System](https://github.com/ysj1173886760/paper_notes/tree/master/db)，对应的中文版也在上述仓库中。论文里综述了数据库系统的整体架构，让大家可以对数据库有一个更加全面的视野。

## 后续课程

[CMU15-721](https://15721.courses.cs.cmu.edu/spring2020/) 主要讲主存数据库有关的内容，每节课都有对应的 paper 要读，推荐给希望进阶数据库的小伙伴。@ysj1173886760 目前也在跟进这门课，完成后会在这里提 PR 以提供进阶的指导。`,
	},
	{
		DisplayName:       `榴莲骑单车`,
		School:            `CS自学指南`,
		MajorLine:         `数据库系统`,
		ArticleTitle:      `CS自学 | CMU 15-799: Special Topics in Database Systems`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CMU 15-799: Special Topics in 。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据库系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CMU 15-799: Special Topics in Database Systems

## Course Introduction

- **University**: Carnegie Mellon University (CMU)
- **Prerequisites**: CMU 15-445
- **Programming Language**: C++
- **Course Difficulty**: 🌟🌟🌟
- **Estimated Study Time**: 80 hours

This course has only been offered twice so far, in Fall 2013 and Spring 2022, and it discusses some cutting-edge topics in the field of databases. The Fall 2013 session covered topics like Streaming, Graph DB, NVM, etc., while the Spring 2022 session mainly focused on Self-Driving DBMS, with relevant papers provided.

The tasks for the Spring 2022 version of the course included:

1. **Task One**: Manual performance tuning based on ` + "`" + `PostgreSQL` + "`" + `.
2. **Task Two**: Improving the Self-Driving DBMS based on [NoisePage Pilot](https://github.com/cmu-db/noisepage-pilot), with no limitations on features.

The teaching style is more akin to a seminar, with fewer programming assignments. This course can broaden the horizons for general students and may be particularly beneficial for those specializing in databases.

## Course Resources

- **Course Homepages**:
  - [CMU15-799 - Special Topics in Database Systems (Fall 2013)](https://15799.courses.cs.cmu.edu/fall2013)
  - [CMU15-799 - Special Topics: Self-Driving Database Management Systems (Spring 2022)](https://15799.courses.cs.cmu.edu/spring2022/)

- **Course Videos**: Not available

- **Course Assignments**: 2 Projects + 1 Group Project`,
	},
	{
		DisplayName:       `菠萝想放假`,
		School:            `CS自学指南`,
		MajorLine:         `数据库系统`,
		ArticleTitle:      `CS自学 | CMU 15-799: Special Topics in Database Systems`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CMU 15-799: Special Topics in 。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据库系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CMU 15-799: Special Topics in Database Systems

## 课程简介

- 所属大学：CMU
- 先修要求：CMU 15-445
- 编程语言：C++
- 课程难度：🌟🌟🌟
- 预计学时：80 小时

    这门课目前只开了两次：fall2013 和 spring2022，讨论了数据库领域的一些前沿主题。fall2013 讨论了 Streaming、Graph DB、NVM 等，spring2022 主要讨论 Self-Driving DBMS，都提供有相关论文。

    spring2022 版课程任务：

    任务一：基于 ` + "`" + `PostgreSQL` + "`" + ` 进行手动性能调优；

    任务二：基于 [NoisePage Pilot](https://github.com/cmu-db/noisepage-pilot) 改进 Self-Driving DBMS，不限特性。

    授课更贴近讲座的形式，编程任务较少。对一般同学可以开拓一下视野，对专精数据库的同学可能帮助较大。

## 课程资源

- 课程主页
  
  - [CMU15-799 - Special Topics in Database Systems](https://15799.courses.cs.cmu.edu/fall2013)
    
  - [CMU15-799 - Special Topics: Self-Driving Database Management Systems](https://15799.courses.cs.cmu.edu/spring2022/)
    
- 课程视频：暂无
  
- 课程作业：2 Projects + 1 Group Project`,
	},
	{
		DisplayName:       `阳光的烧饼_v`,
		School:            `CS自学指南`,
		MajorLine:         `数据库系统`,
		ArticleTitle:      `CS自学 | Caltech CS 122: Database System Implementation`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Caltech CS 122: Database Syste。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据库系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Caltech CS 122: Database System Implementation

## Course Introduction

- **University**: California Institute of Technology (Caltech)
- **Prerequisites**: None
- **Programming Language**: Java
- **Course Difficulty**: 🌟🌟🌟🌟🌟
- **Estimated Study Time**: 150 hours

Caltech's course, unlike CMU15-445 which does not offer SQL layer functionality, focuses on the implementation at the SQL layer in its CS122 course labs. It covers various modules of a query optimizer, such as SQL parsing, translation, implementation of joins, statistics and cost estimation, subquery implementation, and the implementation of aggregations and group by operations. Additionally, there are experiments related to B+ trees and Write-Ahead Logging (WAL). This course is suitable for students who have completed the CMU15-445 course and are interested in query optimization.

Below is an overview of the first three assignments or lab experiments of this course:

### Assignment 1

- Provide support for delete and update statements in NanoDB.
- Add appropriate pin/unpin code to the Buffer Pool Manager.
- Improve the performance of insert statements without excessively inflating the size of the database file.

### Assignment 2

- Implement a simple plan generator to convert various parsed SQL statements into executable plans.
- Implement join plan nodes that support inner and outer joins using the nested-loop join algorithm.
- Add unit tests to ensure the correct implementation of inner and outer joins.

### Assignment 3

- Complete the collection of table statistics.
- Perform plan cost calculation for various plan nodes.
- Calculate the selectivity of various predicates that may appear in the execution plan.
- Update the tuple statistics of the plan nodes' outputs based on predicates.

For the remaining Assignments and Challenges, please refer to the course description. It is recommended to use IDEA to open the project and Maven for building, keeping in mind the log-related configurations.

## Course Resources

- Course Website: <http://courses.cms.caltech.edu/cs122/>
- Course Code: <https://gitlab.caltech.edu/cs122-19wi>
- Course Textbook: None
- Course Assignments: 7 Assignments + 2 Challenges`,
	},
	{
		DisplayName:       `飞翔的春卷`,
		School:            `CS自学指南`,
		MajorLine:         `数据库系统`,
		ArticleTitle:      `CS自学 | Caltech CS 122: Database System Implementation`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Caltech CS 122: Database Syste。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据库系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Caltech CS 122: Database System Implementation

## 课程简介

- 所属大学：Caltech
- 先修要求：无
- 编程语言：Java
- 课程难度：🌟🌟🌟🌟🌟
- 预计学时：150 小时

加州理工的这门课，不同于没有提供 SQL 层功能的 CMU15-445 课程。CS122 课程 Lab 的侧重点在于 SQL 层的相关实现，涉及查询优化器的各个模块，比如SQL的解析，Translate，如何实现 Join，统计信息以及代价估计，子查询实现，Agg，Group By 的实现等。除此之外，还有 B+树，WAL 相关实验。本门课程适合在学完 CMU15-445 课程之后，对查询优化相关内容有兴趣的同学。

下面介绍一下这门课的前 3 个 Assignment 也就是实验 Lab 所要实现的功能：

### Assignment1

- 为 NanoDB 提供 delete，update 语句的支持。
- 为 Buffer Pool Manager 添加合适的 pin/unpin 代码。
- 提升 insert 语句的性能， 同时不使数据库文件大小过分膨胀。

### Assignment2

- 实现一个简单的计划生成器，将各种已经 Parser 过的 SQL 语句转化为可执行的执行计划。
- 使用 nested-loop join 算法，实现支持 inner- and outer-join 的 Join 计划节点。
- 添加一些单元测试， 保证 inner- and outer-join 功能实现正确。

### Assignment3

- 完成收集表的统计信息。
- 完成各种计划节点的计划成本计算。
- 计算可出现在执行计划中的各种谓词的选择性。
- 根据谓词更新计划节点输出的元组统计信息。

剩余 Assignment 和 Challenges 可以查看课程介绍，推荐使用 IDEA 打开工程，Maven 构建，注意日志相关配置。

## 课程资源

- 课程网站：<http://courses.cms.caltech.edu/cs122/>
- 课程代码：<https://gitlab.caltech.edu/cs122-19wi>
- 课程教材：无
- 课程作业：7 Assignments + 2 Challenges`,
	},
	{
		DisplayName:       `鸽子写论文`,
		School:            `CS自学指南`,
		MajorLine:         `数据库系统`,
		ArticleTitle:      `CS自学 | UCB CS186: Introduction to Database System`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：UCB CS186: Introduction to Dat。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据库系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# UCB CS186: Introduction to Database System

## Descriptions

- Offered by: UC Berkeley
- Prerequisites: CS61A, CS61B, CS61C
- Programming Languages: Java
- Difficulty: 🌟🌟🌟🌟🌟
- Class Hour: 150 hours

How to write SQL queries? How are SQL commands disassembled, optimized, and transformed into on-disk query commands step by step? How to implement a high-concurrency database? How to implement database failure recovery? What is NoSQL? This course elaborates on the internal details of relational databases. Besides the theoretical knowledge, you will use Java to implement a real relational database that supports SQL concurrent query, B+ tree index, and failure recovery.

From a practical point of view, you will have the opportunity to write SQL queries and NoSQL queries in course projects, which is very helpful for building full-stack projects.

## Course Resources

- Course Website: <https://cs186berkeley.net/>
- Recordings: <https://www.youtube.com/playlist?list=PLYp4IGUhNFmw8USiYMJvCUjZe79fvyYge>
- Assignments: <https://cs186.gitbook.io/project/>

## Personal Resources

All the resources and assignments used by @PKUFlyingPig in this course are maintained in [PKUFlyingPig/CS186 - GitHub](https://github.com/PKUFlyingPig/CS186).`,
	},
	{
		DisplayName:       `奔跑的芋圆ss`,
		School:            `CS自学指南`,
		MajorLine:         `数据库系统`,
		ArticleTitle:      `CS自学 | UCB CS186: Introduction to Database System`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：UCB CS186: Introduction to Dat。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据库系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# UCB CS186: Introduction to Database System

## 课程简介

- 所属大学：UC Berkeley
- 先修要求：CS61A, CS61B, CS61C
- 编程语言：Java
- 课程难度：🌟🌟🌟🌟🌟
- 预计学时：150 小时

如何编写 SQL 查询？SQL 命令是如何被一步步拆解、优化、转变为一个个磁盘查询指令的？如何实现高并发的数据库？如何实现数据库的故障恢复？什么又是非关系型数据库？这门课会带你深入理解关系型数据库的内部细节，并在掌握理论知识之后，动手用 Java 实现一个支持 SQL 并发查询、B+ 树 Index 和故障恢复的关系型数据库。

从实用角度来说，这门课还会在编程作业中锻炼你编写 SQL 查询以及 NoSQL 查询的能力，对于构建一些全栈的工程项目很有帮助。

## 课程资源

- 课程网站：<https://cs186berkeley.net/>
- 课程视频：<https://www.bilibili.com/video/BV13a411c7Qo>
- 课程教材：无
- 课程作业：6 个 Project

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/CS186 - GitHub](https://github.com/PKUFlyingPig/CS186) 中。`,
	},
	{
		DisplayName:       `牛轧糖在赶DDL`,
		School:            `CS自学指南`,
		MajorLine:         `数据库系统`,
		ArticleTitle:      `CS自学 | Stanford CS 346: Database System Implementation`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Stanford CS 346: Database Syst。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据库系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Stanford CS 346: Database System Implementation

## Course Introduction

- **University**: Stanford
- **Prerequisites**: None
- **Programming Language**: C++
- **Course Difficulty**: 🌟🌟🌟🌟🌟
- **Estimated Study Time**: 150 hours

RedBase, the project for CS346, involves the implementation of a simplified database system and is highly structured. The project can be divided into the following parts, which also correspond to the four labs that need to be completed:

1. **The Record Management Component**: This involves the implementation of record management functionalities.

2. **The Index Component**: Focuses on the management of B+ tree indexing.

3. **The System Management Component**: Deals with DDL statements, command-line tools, data loading commands, and metadata management.

4. **The Query Language Component**: In this part, students are required to implement the RQL Redbase Query Language, including select, insert, delete, and update statements.

5. **Extension Component**: Beyond the basic components of a database system, students must implement an extension component, which could be a Blob type, network module, join algorithms, CBO optimizer, OLAP, transactions, etc.

RedBase is an ideal follow-up project for students who have completed CMU 15-445 and wish to learn other components of a database system. Due to its manageable codebase, it allows for convenient expansion as needed. Furthermore, as it is entirely written in C++, it also serves as good practice for C++ programming skills.

## Course Resources

- Course Website: <https://web.stanford.edu/class/cs346/2015/>
- Course Code: <https://github.com/junkumar/redbase.git>
- Course Textbook: None
- Course Assignments: 4 Projects + 1 Extension`,
	},
	{
		DisplayName:       `馒头dd`,
		School:            `CS自学指南`,
		MajorLine:         `数据库系统`,
		ArticleTitle:      `CS自学 | Stanford CS 346: Database System Implementation`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Stanford CS 346: Database Syst。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据库系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Stanford CS 346: Database System Implementation

## 课程简介

- 所属大学：Stanford
- 先修要求：无
- 编程语言：C++
- 课程难度：🌟🌟🌟🌟🌟
- 预计学时：150 小时

RedBase 是 cs346 的一个项目，实现了一个简易的数据库系统，项目是高度结构化的。整个项目能够被分为以下几个部分（同时也是 4 个需要完善的 lab）：

1. The record management component：记录管理组件。

2. The index component：B+ 索引管理。

3. The System Management Component：ddl语句、命令行工具、数据加载命令、元数据管理。

4. The Query Language Component：在这个部分需要实现 RQL Redbase 查询语言。RQL 要实现 select、insert、delete、update 语句。

5. Extension Component：除了上述数据库系统的基本功能组件，还需要实现一个扩展组件，可以是 Blob 类型、 网络模块、连接算法、CBO 优化器、OLAP、事务等。

RedBase 适合在学完 CMU 15-445 后继续学习数据库系统中的其他组件，因为其代码量不多，可以方便的根据需要扩展代码。同时代码完全由 C++ 编写，也可以用于练习 C++ 编程技巧。

## 课程资源

- 课程网站：<https://web.stanford.edu/class/cs346/2015/>
- 课程代码：<https://github.com/junkumar/redbase.git>
- 课程教材：无
- 课程作业：4 Projects + 1 Extension`,
	},
	{
		DisplayName:       `花生呀`,
		School:            `CS自学指南`,
		MajorLine:         `数据科学`,
		ArticleTitle:      `CS自学 | UCB Data100: Principles and Techniques of Data Sci`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：UCB Data100: Principles and Te。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据科学`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# UCB Data100: Principles and Techniques of Data Science

## Description

- Offered by: UC Berkeley
- Prerequisites: Data8, CS61A, Linear Algebra
- Programming Languages: Python
- Difficulty: 🌟🌟🌟
- Class Hour: 80 hours

This is Berkeley's introductory course in data science, covering the basics of data cleaning, feature extraction, data visualization, machine learning and inference, as well as common data science tools such as Pandas, Numpy, and Matplotlib. The course is also rich in interesting programming assignments, which is one of the highlights of the course.

## Resources
- Course Website: <https://ds100.org>
- Records: refer to the course website
- Textbook: <https://www.textbook.ds100.org/intro.html>
- Assignments: refer to the course website`,
	},
	{
		DisplayName:       `自在的红豆dd`,
		School:            `CS自学指南`,
		MajorLine:         `数据结构与算法`,
		ArticleTitle:      `CS自学 | MIT 6.006: Introduction to Algorithms`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT 6.006: Introduction to Alg。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据结构与算法`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT 6.006: Introduction to Algorithms

## Descriptions

- Offered by: MIT
- Prerequisites: Introductory level courses of programming (CS50/CS61A/CS106A or equivalent)
- Programming Languages: Python
- Difficulty: 🌟🌟🌟🌟🌟
- Class Hour: 100 hours+

Probably the most precious course from the EECS department of MIT. Taught by Erik Demaine, one of the geniuses in Algorithms.

Compared with CS106B/X (Data structures and algorithms using C++), 6.006 emphasizes the algorithms more. It also covers several classical data structures such as AVL trees. You may use it to learn more about algorithms after CS106B/X.

## Course Resources

- Course Website: [Fall 2011](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/)
- Recordings: [Fall 2011](https://www.bilibili.com/video/BV1b7411e7ZP)
- Textbooks: Introduction to Algorithms (CLRS)
- Assignments: [Fall 2011](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/assignments/)`,
	},
	{
		DisplayName:       `热情的果冻`,
		School:            `CS自学指南`,
		MajorLine:         `数据结构与算法`,
		ArticleTitle:      `CS自学 | MIT 6.006: Introduction to Algorithms`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT 6.006: Introduction to Alg。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据结构与算法`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT 6.006: Introduction to Algorithms

## 课程简介

- 所属大学：MIT
- 先修要求：计算机导论(CS50/CS61A or equivalent)
- 编程语言：Python
- 课程难度：🌟🌟🌟🌟🌟
- 预计学时：100h+

MIT-EECS 系的瑰宝。授课老师之一是算法届的奇才 Erik Demaine. 相比较于斯坦福的 [CS106B/X](../编程入门/cpp/CS106B_CS106X.md)（基于 C++ 的数据结构与算法课程），该课程更侧重于算法方面的详细讲解。课程也覆盖了一些经典的数据结构，如 AVL 树等。个人感觉在讲解方面比 CS106B 更加详细，也弥补了 CS106B 在算法方面讲解的不足。适合在 CS106B 入门之后巩固算法知识。

不过该课程也是出了名的难，大家需要做好一定的心理准备。

## 课程资源

- 课程网站：[Fall 2011](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/)
- 课程视频：[Fall 2011](https://www.bilibili.com/video/BV1b7411e7ZP)
- 课程教材：Introduction to Algorithms (CLRS)
- 课程作业：[Fall 2011](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/assignments/)`,
	},
	{
		DisplayName:       `马卡龙松鼠`,
		School:            `CS自学指南`,
		MajorLine:         `数据结构与算法`,
		ArticleTitle:      `CS自学 | MIT 6.046: Design and Analysis of Algorithms`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT 6.046: Design and Analysis。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据结构与算法`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT 6.046: Design and Analysis of Algorithms

## Descriptions

- Offered by: MIT
- Prerequisites: Introductory level courses of Algorithms (6.006/CS61B/CS106B/CS106X or equivalent)
- Programming Languages: Python
- Difficulty: 🌟🌟🌟🌟🌟
- Class Hour: 100 hours+

Part 2 of the MIT Algorithms Trilogy. Taught by Erik Demaine, Srini Devadas, and Nancy Lynch.

Compared with 6.006 where you just learn and use the algorithms directly, in 6.046 you will be required to learn a methodology to "Design and analyze" algorithms to solve certain problems. There are few programming exercises in this course, and most of the assignmnets are about proposing an algorithm and do some mathematical proofs. Therefore, it would be much harder than 6.006.

Part 3 of the MIT Algorithms Trilogy is 6.854 Advanced Algorithms. But for the most of the exercises you'll encounter in tests and job-hunting, 6.046 is definitely enough.

## Course Resources

- Course Website: [Spring 2015](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/)
- Recordings: [Spring 2015](https://www.bilibili.com/video/BV1A7411E737)
- Textbooks: Introduction to Algorithms (CLRS)
- Assignments: [Spring 2015](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/pages/assignments/)`,
	},
	{
		DisplayName:       `自在的果冻`,
		School:            `CS自学指南`,
		MajorLine:         `数据结构与算法`,
		ArticleTitle:      `CS自学 | MIT 6.046: Design and Analysis of Algorithms`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT 6.046: Design and Analysis。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据结构与算法`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT 6.046: Design and Analysis of Algorithms

## 课程简介

- 所属大学：MIT
- 先修要求：算法入门(6.006/CS61B/CS106B/CS106X or equivalent)
- 编程语言：Python
- 课程难度：🌟🌟🌟🌟🌟
- 预计学时：100h+

6.006的后续课程。授课老师依旧是 Erik Demaine 和 Srini Devadas，此外还有一位新老师 Nancy Lynch.

相比较于“现学现用”的6.006，6.046更加侧重于如何运用课上所学到的内容举一反三，设计出一套完备的算法并能够证明该算法能解决相应的问题。虽然该课程在板书以及作业中的编程语言为 Python，但基本上没有编程作业；绝大部分的作业都是提出要求，然后需要学生进行算法设计以及合理性证明。所以该课程的难度又提高了一大截:)

在该门课程后还有一门 6.854 高级算法，但对于绝大多数考试以及应聘来说，学完该课程基本上已经能覆盖99%的题目了。

## 课程资源

- 课程网站：[Spring 2015](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/)
- 课程视频：[Spring 2015](https://www.bilibili.com/video/BV1A7411E737)
- 课程教材：Introduction to Algorithms (CLRS)
- 课程作业：[Spring 2015](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/pages/assignments/)`,
	},
	{
		DisplayName:       `俏皮的绿豆bb`,
		School:            `CS自学指南`,
		MajorLine:         `数据结构与算法`,
		ArticleTitle:      `CS自学 | Coursera: Algorithms I & II`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Coursera: Algorithms I & II。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据结构与算法`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Coursera: Algorithms I & II

## Descriptions

- Offered by: Princeton
- Prerequisites: CS61A
- Programming Languages: Java
- Difficulty: 🌟🌟🌟
- Class Hour: 60 hours

This is the highest rated algorithms course on [Coursera](https://www.coursera.org), and Robert Sedgewick has the magic to make even the most complex algorithms incredibly easy to understand. To be honest, the KMP and network flow algorithms that I have been struggling with for years were made clear to me in this course, and I can even write derivations and proofs for both of them two years later.

Do you feel that you forget the algorithms quickly after learning them? I think the key to fully grasping an algorithm lies in understanding the three points as follows:

- Why should do this? (Correctness derivation, or the essence of the entire algorithm.)
- How to implement it? (Talk is cheap. Show me the code.)
- How to use it to solve practical problems? (Bridge the gap between theory and real life.)

The composition of this course covers the three points above very well. Watching the course videos and reading the professor's [textbook](https://algs4.cs.princeton.edu/home/) will help you understand the essence of the algorithm and allow you to tell others why the algorithm should look like this in very simple and vivid terms.

After understanding the algorithms, you can read the professor's [code implementation](https://algs4.cs.princeton.edu/code/) of all the data structures and algorithms taught in the course.
Note that these codes are not demos, but production-ready, time-efficient implementations. They have extensive annotations and comments, and the modularization is also quite good. I learned a lot by just reading the codes.

Finally, the most exciting part of the course is the 10 high-quality projects, all with real-world backgrounds, rich test cases, and an automated scoring system (code style is also a part of the scoring). You'll get a taste of algorithms in real life.

## Course Resources

- Course Website: [Algorithm I](https://www.coursera.org/learn/algorithms-part1), [Algorithm II](https://www.coursera.org/learn/algorithms-part2)
- Recordings: [Coursera: Algorithm I](https://www.coursera.org/learn/algorithms-part1), [Coursera: lgorithm II](https://www.coursera.org/learn/algorithms-part2), [CUvids: Algorithms, 4th Edition](https://cuvids.io/app/course/2/)
- Textbooks: [Algorithms, 4th Edition](https://algs4.cs.princeton.edu/home/)
- Assignments: 10 Projects, the course website has specific requirements

## Personal Resources

All the resources and assignments used by @PKUFlyingPig in this course are maintained in [PKUFlyingPig/Princeton-Algorithm - GitHub](https://github.com/PKUFlyingPig/Princeton-Algorithm).`,
	},
	{
		DisplayName:       `灵动的可颂酱`,
		School:            `CS自学指南`,
		MajorLine:         `数据结构与算法`,
		ArticleTitle:      `CS自学 | Coursera: Algorithms I & II`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Coursera: Algorithms I & II。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据结构与算法`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Coursera: Algorithms I & II

## 课程简介

- 所属大学：Princeton
- 先修要求：CS61A
- 编程语言：Java
- 课程难度：🌟🌟🌟
- 预计学时：60 小时

这是 [Coursera](https://www.coursera.org) 上评分最高的算法课程。Robert Sedgewick 教授有一种魔力，可以将无论多么复杂的算法讲得极为生动浅显。实不相瞒，困扰我多年的 KMP 以及网络流算法都是在这门课上让我茅塞顿开的，时隔两年我甚至还能写出这两个算法的推导与证明。

你是否觉得算法学了就忘呢？我觉得让你完全掌握一个算法的核心在于理解三点：

- 为什么这么做？（正确性推导，抑或是整个算法的核心本质）
- 如何实现它？（光学不用假把式）
- 用它解决实际问题（学以致用才是真本事）

这门课的构成就非常好地契合了上述三个步骤。观看课程视频并且阅读教授的[开源课本](https://algs4.cs.princeton.edu/home/)有助于你理解算法的本质，让你也可以用非常
生动浅显的话语向别人讲述为什么这个算法得长这个样子。

在理解算法之后，你可以阅读教授对于课程中讲授的所有数据结构与算法的[代码实现](https://algs4.cs.princeton.edu/code/)。
注意，这些实现可不是 demo 性质的，而是工业级的高效实现，从注释到变量命名都非常严谨，模块化也做得相当好，是质量很高的代码。我从这些代码中收获良多。

最后，就是这门课最激动人心的部分了，10 个高质量的 Project，并且全都有实际问题的背景描述，丰富的测试样例，自动的评分系统（代码风格也是评分的一环）。让你在实际生活中
领略算法的魅力。

## 课程资源

- 课程网站：[Algorithm I](https://www.coursera.org/learn/algorithms-part1), [Algorithm II](https://www.coursera.org/learn/algorithms-part2)
- 课程视频：详见课程网站
- 课程教材：<https://algs4.cs.princeton.edu/home/>
- 课程作业：10个Project，具体要求详见课程网站

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/Princeton-Algorithm - GitHub](https://github.com/PKUFlyingPig/Princeton-Algorithm) 中。`,
	},
	{
		DisplayName:       `机灵的樱桃`,
		School:            `CS自学指南`,
		MajorLine:         `数据结构与算法`,
		ArticleTitle:      `CS自学 | CS170: Efficient Algorithms and Intractable Proble`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS170: Efficient Algorithms an。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据结构与算法`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS170: Efficient Algorithms and Intractable Problems

## Descriptions

- Offered by: UC Berkeley
- Prerequisites: CS61B, CS70
- Programming Languages:  LaTeX
- Difficulty: 🌟🌟🌟
- Class Hour: 60 hours

This is Berkeley's algorithm design and analysis course. It focuses on the theoretical foundations and complexity analysis of algorithms, covering Divide-and-Conquer, Graph Algorithms, Shortest Paths, Spanning Trees, Greedy Algorithms, Dynamic programming, Union Finds, Linear Programming, Network Flows, NP-Completeness, Randomized Algorithms, Hashing, etc.

The textbook for this course is well written and very suitable as a reference book. In addition, this class has written assignments and is recommended to use LaTeX. You can take this opportunity to practice your LaTeX skills.

## Course Resources

- Course Website: <https://cs170.org/>
- Recordings: <https://www.youtube.com/playlist?list=PLnocShPlK-Ft-o7NInBDw18be86dNaxlT>
- Recordings: refer to the course website
- Assignments: refer to the course website

## Personal Resources

All the resources and assignments used by @PKUFlyingPig in this course are maintained in [PKUFlyingPig/UCB-CS170 - GitHub](https://github.com/PKUFlyingPig/UCB-CS170)`,
	},
	{
		DisplayName:       `雪花蜻蜓`,
		School:            `CS自学指南`,
		MajorLine:         `数据结构与算法`,
		ArticleTitle:      `CS自学 | CS61B: Data Structures and Algorithms`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS61B: Data Structures and Alg。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据结构与算法`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS61B: Data Structures and Algorithms

## Descriptions

- Offered by: UC Berkeley
- Prerequisites: CS61A
- Programming Languages: Java
- Difficulty: 🌟🌟🌟
- Class Hour: 60 hours

It is the second course of UC Berkeley's CS61 series. It mainly focuses on the design of data structures and algorithms as well as giving students the opportunity to be exposed to thousands of lines of engineering code and gain a preliminary understanding of software engineering through Java.

I took the version for 2018 Spring. Josh Hug, the instructor, generously made the autograder open-source. You can use [gradescope](https://gradescope.com/) invitation code published on the website for free and easily test your implementation.

According to the professor's latest policy, SP2021 CS61B is now open to the public. To get everything set up, go to Gradescope and select the "Add a course" button. Enter course code **MB7ZPY** to be added.

All programming assignments in this course are done in Java. Students without Java experience don't have to worry. There will be detailed tutorials in the course from the configuration of IDEA to the core syntax and features of Java.

The quality of homework in this class is also unparalleled. The 14 labs will allow you to implement most of the data structures mentioned in the class by yourself, and the 10 homework will allow you to use data structures and algorithms to solve practical problems.
In addition, there are 3 projects that give you the opportunity to be exposed to thousands of lines of engineering code and enhance your Java skills in practice.

## Resources
## Course Resources

- Course Website: [spring2024](https://sp24.datastructur.es/), [fall2023](https://fa23.datastructur.es/), [spring2023](https://sp23.datastructur.es/), [spring2021](https://sp21.datastructur.es/), [spring2018](https://sp18.datastructur.es/)
- Recordings: refer to the course website
- Textbook: None
- Assignments: Slightly different every year. In the spring semester of 2018, there are 14 Labs, 10 Homework and 3 Projects. Please refer to the course website for specific requirements.

## Personal resources

All resources and homework implementations used by @PKUFlyingPig in this course are summarized in [PKUFlyingPig/CS61B - GitHub](https://github.com/PKUFlyingPig/CS61B).

All resources and homework implementations used by @InsideEmpire in this course are summarized in [InsideEmpire/CS61B-PathwayToSuccess - GitHub](https://github.com/InsideEmpire/CS61B-PathwayToSuccess.git).`,
	},
	{
		DisplayName:       `蜜桃lab`,
		School:            `CS自学指南`,
		MajorLine:         `数据结构与算法`,
		ArticleTitle:      `CS自学 | CS61B: Data Structures and Algorithms`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS61B: Data Structures and Alg。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `数据结构与算法`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS61B: Data Structures and Algorithms

## 课程简介

- 所属大学：UC Berkeley
- 先修要求：CS61A
- 编程语言：Java
- 课程难度：🌟🌟🌟
- 预计学时：60 小时

伯克利 CS61 系列的第二门课程，注重数据结构与算法的设计，同时让学生有机会接触上千行的工程代码，通过 Java 初步领会软件工程的思想。

我上的是 2018 年春季学期的版本，该课的开课老师 Josh Hug 教授慷慨地将 autograder 开源了，大家可以通过网站公开的邀请码在 [gradescope](https://gradescope.com/)
 免费加入课程，从而方便地测评自己的代码。

根据教授最新的政策，SP2021 的 CS61B 也对公众开放。要设置所有内容，请前往 Gradescope 并选择"Add a course"按钮。输入课程代码 **MB7ZPY** 以添加课程。

这门课所有的编程作业都是使用 Java 完成的。没有 Java 基础的同学也不用担心，课程会有保姆级的教程，从 IDEA（一款主流的 Java 编程环境）的配置讲起，把 Java 的核心语法与特性事无巨细地讲授，大家完全不用担心跟不上的问题。

这门课的作业质量也是绝绝子。14 个 lab 会让你自己实现课上所讲的绝大部分数据结构，10 个 Homework 会让你运用数据结构和算法解决实际问题，
另外还有 3 个 Project 更是让你有机会接触上千行的工程代码，在实战中磨练自己的 Java 能力。

## 课程资源

- 课程网站：[spring2024](https://sp24.datastructur.es/), [fall2023](https://fa23.datastructur.es/), [spring2023](https://sp23.datastructur.es/), [spring2021](https://sp21.datastructur.es/), [spring2018](https://sp18.datastructur.es/)
- 课程视频：原版视频参见课程网站，B站有中文翻译搬运。
- 课程教材：无
- 课程作业：每年略有不同，18 年春季学期有 14 个 Lab，10 个 Homework以及 3 个 Project，具体要求详见课程网站。

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/CS61B - GitHub](https://github.com/PKUFlyingPig/CS61B) 中。
  
@InsideEmpire 在学习这门课中用到的所有资源和作业实现都汇总在 [InsideEmpire/CS61B-PathwayToSuccess - GitHub](https://github.com/InsideEmpire/CS61B-PathwayToSuccess.git) 中。`,
	},
	{
		DisplayName:       `鲸鱼在赶DDL`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习`,
		ArticleTitle:      `CS自学 | CS189: Introduction to Machine Learning`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS189: Introduction to Machine。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS189: Introduction to Machine Learning

## Descriptions

- Offered by: UC Berkeley
- Prerequisites: CS188, CS70
- Programming Languages: Python
- Difficulty: 🌟🌟🌟🌟
- Class Hour: 100 Hours

I did not take this course but used its lecture notes as reference books. From the course website, I think it is better than CS299 because all the assignments and autograder are open source. Also, this course is quite theoretical and in-depth.

## Course Resources

- Course Website: <https://www.eecs189.org/>
- Recordings: <https://www.youtube.com/playlist?list=PLOOm2AoWIPEyZazQVnIcaK2KnezpGZV-X>
- Textbooks: <https://www.eecs189.org/>
- Assignments: <https://www.eecs189.org/>`,
	},
	{
		DisplayName:       `冰棍看日落`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习`,
		ArticleTitle:      `CS自学 | CS229: Machine Learning`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS229: Machine Learning。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS229: Machine Learning

## Descriptions

- Offered by: Stanford
- Prerequisite requirements: Advanced Mathematics, Probability Theory, Python, Solid mathematics skills
- Programming Languages: None
- Difficulty:🌟🌟🌟🌟
- Class Hour: 100 hours

This is another ML course offered by Andrew Ng. Since it is graduate-level, it focuses more on the mathematical theory behind machine learning. If you are not satisfied with using off-the-shelf tools but want to understand the essence of the algorithm, or aspire to engage in theoretical research on machine learning, you can take this course. All the lecture notes are provided on the course website, written in a professional and theoretical way, requiring a solid mathematical background.

## Resources

- Course Website: <http://cs229.stanford.edu/syllabus.html>
- Recordings: <https://www.bilibili.com/video/BV1JE411w7Ub>
- Textbook: None, but the lecture notes is excellent.
- Assignments: Not open to the public.

## Personal Resources

All the resources and assignments used by @PKUFlyingPig in this course are maintained in [PKUFlyingPig/CS229 - GitHub](https://github.com/PKUFlyingPig/CS229).`,
	},
	{
		DisplayName:       `快乐的菠萝`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习`,
		ArticleTitle:      `CS自学 | Coursera: Machine Learning`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Coursera: Machine Learning。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Coursera: Machine Learning

## Descriptions

- Offered by: Stanford
- Prerequisites: entry level of AI and proficient in Python
- Programming Languages: Python
- Difficulty: 🌟🌟🌟
- Class Hour: 100 hours

When it comes to Andrew Ng, no one in the AI community should be unaware of him. He is one of the founders of the famous online education platform [Coursera](https://www.coursera.org), and also a famous professor at Stanford. This introductory machine learning course must be one of his famous works (the other is his deep learning course), and has hundreds of thousands of learners on Coursera (note that these are people who paid for the certificate, which costs several hundred dollars), and the number of nonpaying learners should be far more than that.

The class is extremely friendly to novices, and Andrew has the ability to make machine learning as straightforward as 1+1=2. You'll learn about linear regression, logistic regression, support vector machines, unsupervised learning, dimensionality reduction, anomaly detection, and recommender systems, etc. and solidify your understanding with hands-on programming. The quality of the assignments needs no word to say. With detailed code frameworks and practical background, you can use what you've learned to solve real problems.

Of course, as a public mooc, the difficulty of this course has been deliberately lowered, and many mathematical derivations are skimmed over. If you are interested in machine learning theory and want to investigate the mathematical theory behind these algorithms, you can refer to [CS229](./CS229.md) and [CS189](./CS189.md).

The new course is rebuilt into a specialization consisting of three courses.

## Course Resources

- Course Website: <https://www.coursera.org/specializations/machine-learning-introduction>
- Recordings: refer to the course website
- Textbook: None
- Assignments: refer to the course website

## Personal Resources

My implementation is lost in system reinstallation. However, the course is so famous that you can easily find related resources online. Also, course material is available on Coursera.`,
	},
	{
		DisplayName:       `瓢虫去爬山`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习`,
		ArticleTitle:      `CS自学 | Coursera: Machine Learning`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Coursera: Machine Learning。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Coursera: Machine Learning

## 课程简介

- 所属大学：Stanford
- 先修要求：AI 入门 + 熟练使用 Python
- 编程语言：Python
- 课程难度：🌟🌟🌟
- 预计学时：100 小时

说起吴恩达，在 AI 届应该无人不晓。他是著名在线教育平台 [Coursera](https://www.coursera.org) 的创始人之一，同时也是 Stanford 的网红教授。这门机器学习入门课应该算得上是他的成名作之一（另一个是深度学习课程），在 Coursera 上拥有数十万的学习者（注意这是花钱买了证书的人，一个证书几百刀），白嫖学习者数量应该是另一个数量级了。

这门课对新手极其友好，吴恩达拥有把机器学习讲成 1+1=2 一样直白的能力。你将会学习到线性回归、逻辑回归、支持向量机、无监督学习、降维、异常检测和推荐系统等等知识，并且在编程实践中夯实自己的理解。作业质量自然不必多言，保姆级代码框架，作业背景也多取自生活，让人学以致用。

当然，这门课作为一个公开慕课，难度上刻意放低了些，很多数学推导大多一带而过，如果你有志于从事机器学习理论研究，想要深究这些算法背后的数学理论，可以参考 [CS229](./CS229.md) 和 [CS189](./CS189.md)。

新版课程更新成了一个包含三个课程的系列，可以尝试在 Coursera 申请助学金后不用订阅即可学习。

## 课程资源

- 课程网站：<https://www.coursera.org/specializations/machine-learning-introduction>
- 课程视频：参见课程网站
- 课程教材：无
- 课程作业：参见课程网站

## 资源汇总

当时重装系统误删了文件，我的代码实现消失在了磁盘的 01 串中。不过这门课由于太过出名，网上想搜不到答案都难，相关课程资料 Coursera 上也一应俱全。`,
	},
	{
		DisplayName:       `绿豆ss`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习系统`,
		ArticleTitle:      `CS自学 | Intelligent Computing Systems`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Intelligent Computing Systems。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Intelligent Computing Systems

## Course Overview

- University: University of Chinese Academy of Sciences
- Prerequisites: Computer Architecture, Deep Learning
- Programming Languages: Python, C++, BCL
- Course Difficulty: 🌟🌟🌟
- Estimated Hours: 100+ hours

Intelligent computing systems serve as the backbone for global AI, producing billions of devices annually, including smartphones, servers, and wearables. Training professionals for these systems is critical for China's AI industry competitiveness. Understanding intelligent computing systems is vital for computer science students, shaping their core skills.

Prof. Yunji Chen's course, taught in various universities, uses experiments to provide a holistic view of the AI tech stack. Covering deep learning frameworks, coding in low-level languages, and hardware design, the course fosters a systematic approach.

Personally, completing experiments 2-5 enhanced my grasp of deep learning frameworks. The BCL language experiment in chapter five is reminiscent of CUDA for those familiar.

I recommend the textbook for a comprehensive tech stack understanding. Deep learning-savvy students can start from chapter five to delve into deep learning framework internals.

Inspired by the course, I developed a [simple deep learning framework](https://github.com/ysj1173886760/PyToy) and plan a tutorial. Written in Python, it's code-light, suitable for students with some foundation. Future plans include more operators and potential porting to C++ for balanced performance and efficiency.

## Course Resources

- Course Website：[Official Website](https://novel.ict.ac.cn/aics/)
- Course Videos：[bilibili](https://space.bilibili.com/494117284)
- Course Textbook："Intelligent Computing Systems" by Chen Yunji

## Personal Resources

### New Edition Experiments for 2024

- The 2024 edition of the Intelligent Computing Systems lab has undergone extensive adjustments in the knowledge structure, experimental topics, and lab manuals, including comprehensive use of PyTorch instead of TensorFlow, and the addition of experiments related to large models.
- As the new lab topics and manuals have not been updated on the Cambricon Forum, the following repository is provided to store the new versions of the Intelligent Computing Systems lab topics, manuals, and individual experiment answers:
- The resources for the new edition will be updated following the course schedule of the UCAS Spring Semester 2024, with completion expected by June 2024.
- 2024 New labs, manuals, and answers created by @Yuichi: https://github.com/Yuichi1001/2024-AICS-EXP

### Old Edition Experiments

- Old edition coursework: 6 experiments (including writing convolution operators, adding operators to TensorFlow, writing operators with BCL and integrating them into TensorFlow, etc.) (details can be found on the official website)
- Old edition lab manuals: [Experiment 2.0 Instruction Manual](https://forum.cambricon.com/index.php?m=content&c=index&a=show&catid=155&id=708)
- Learning notes: https://sanzo.top/categories/AI-Computing-Systems/, notes summarized from the lab manuals (link is no longer active)
- @ysj1173886760 has compiled all resources and homework implementations used in this course at [ysj1173886760/Learning: ai-system - GitHub](https://github.com/ysj1173886760/Learning/tree/master/ai-system).`,
	},
	{
		DisplayName:       `蜻蜓wow`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习系统`,
		ArticleTitle:      `CS自学 | 智能计算系统`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：智能计算系统。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# 智能计算系统

## 课程简介

- 所属大学：中国科学院大学
- 先修要求：体系结构，深度学习
- 编程语言：Python, C++, BCL
- 课程难度：🌟🌟🌟
- 预计学时：100 小时+

智能计算系统是智能的核心物质载体，每年全球要制造数以十亿计的智能计算系统（包括智能手机、智能服务器、智能可穿戴设备等），需要大量的智能计算系统的设计者和开发者。智能计算系统人才的培养直接关系到我国智能产业的核心竞争力。因此，对智能计算系统的认识和理解是智能时代计算机类专业学生培养方案中不可或缺的重要组成部分，是计算机类专业学生的核心竞争力。

国内的陈云霁老师开的课，在其他若干个大学也都有开对应的课程。这门课用一个个实验带大家以一个完整的视野理解人工智能的技术栈。从上层的深度学习框架，到用底层语言编写算子，再到硬件中 MLU 的设计，让大家形成系统思维，体会自上而下，融会贯通的乐趣。

我做了其中的 2,3,4,5 这几个实验，其中综合实验和硬件实验没有做，如果有做了的同学欢迎大家补上你的链接。

个人体会是第三章实现算子的实验让我对深度学习框架的了解加深了很多。第五章的实验BCL语言编写算子如果了解 CUDA 的话会感觉很熟悉。

推荐去买一本教材看一看，会让我们理解整体的技术栈。熟悉深度学习的同学可以直接从第五章开始看，看看深度学习框架底层到底是什么样的。

我因为这门课的启发，参考一本书（书名在仓库中）写了一个简易的[深度学习框架](https://github.com/ysj1173886760/PyToy)。在这个框架里可以看到智能计算系统实验中的一些影子。同时受到 build-your-own-x 系列的启发，我也打算写一下教程，教大家写一个自己的深度学习框架。代码用 Python 写的，代码量较少，适合有一定基础的同学阅读。之后打算添加更多的算子，有望实现一个较为全面的框架，并希望移植到 C++ 中，以兼顾性能与开发效率。

## 课程资源

- 课程网站：[官网](https://novel.ict.ac.cn/aics/)
- 课程视频：[bilibili](https://space.bilibili.com/494117284)
- 课程教材：智能计算系统（陈云霁）

## 资源汇总

### 2024年新版实验

- 2024 年的智能计算系统实验内容对知识体系、实验题目及实验手册进行了大范围的调整，调整内容包括全面使用 PyTorch ，不再使用 TensorFlow 以及添加大模型相关实验等。

- 由于新版实验题目及实验手册未在寒武纪论坛进行更新，因此提供以下存储仓库，用于存储新版智能计算系统的实验题目、实验手册以及个人的实验答案
- 新版实验的资源跟随国科大 2024 年春季学期的课程进度进行更新，预计 2024 年 6 月更新完毕
- @Yuichi 编写的 2024 新版实验题目、手册及答案：https://github.com/Yuichi1001/2024-AICS-EXP

### 旧版实验

- 旧版课程作业：6 个实验(包括编写卷积算子，为 TensorFlow 添加算子，用 BCL 编写算子并集成到 TensorFlow 中等)(具体内容在官网可以找到)
- 旧版实验手册：[实验 2.0 指导手册](https://forum.cambricon.com/index.php?m=content&c=index&a=show&catid=155&id=708)
- 学习笔记：<https://sanzo.top/categories/AI-Computing-Systems/>，参考实验手册总结的笔记(已失效)
- @ysj1173886760 在学习这门课中用到的所有资源和作业实现都汇总在 [ysj1173886760/Learning: ai-system - GitHub](https://github.com/ysj1173886760/Learning/tree/master/ai-system) 中。`,
	},
	{
		DisplayName:       `飞翔的果冻x`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习系统`,
		ArticleTitle:      `CS自学 | CMU 10-414/714: Deep Learning Systems`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CMU 10-414/714: Deep Learning 。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CMU 10-414/714: Deep Learning Systems

## Course Overview

- University: Carnegie Mellon University (CMU)
- Prerequisites: Introduction to Systems (e.g., 15-213), Basics of Deep Learning, 
                 Fundamental Mathematical Knowledge
- Programming Languages: Python, C++
- Difficulty: 🌟🌟🌟
- Estimated Hours: 100 hours

The rise of deep learning owes much to user-friendly frameworks like PyTorch and TensorFlow. Yet, many users remain unfamiliar with these frameworks' internals. If you're curious or aspiring to delve into deep learning framework development, this course is an excellent starting point.

Covering the full spectrum of deep learning systems, the curriculum spans top-level framework design, autodifferentiation principles, hardware acceleration, and real-world deployment. The hands-on experience includes five assignments, building a deep learning library called Needle. Needle supports automatic differentiation, GPU acceleration, and various neural networks like CNNs, RNNs, LSTMs, and Transformers.

Even for beginners, the course gradually covers simple classification and backpropagation optimization. Detailed Jupyter notebooks accompany complex neural networks, providing insights. For those with foundational knowledge, assignments post autodifferentiation are approachable, offering new understandings.

Instructors [Zico Kolter](https://zicokolter.com/) and [Tianqi Chen](https://tqchen.com/)  released open-source content. Online evaluations and forums are closed, but local testing in framework code remains. Hope for an online version next fall.

## Course Resources

- Course Website：<https://dlsyscourse.org>
- Course Videos：<https://www.youtube.com/watch?v=qbJqOFMyIwg>
- Course Assignments：<https://dlsyscourse.org/assignments/>

## Resource Compilation

All resources and assignment implementations used by @PKUFlyingPig in this course are consolidated in [PKUFlyingPig/CMU10-714 - GitHub](https://github.com/PKUFlyingPig/CMU10-714)

All assignment implementations by @Crazy-Ryan in this course (24 Fall offering) are consolidated in [Crazy-Ryan/CMU-10-714 - GitHub](https://github.com/Crazy-Ryan/CMU-10-714)`,
	},
	{
		DisplayName:       `阳光的松鼠pp`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习系统`,
		ArticleTitle:      `CS自学 | CMU 10-414/714: Deep Learning Systems`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CMU 10-414/714: Deep Learning 。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CMU 10-414/714: Deep Learning Systems

## 课程简介

- 所属大学：CMU
- 先修要求：系统入门(eg.15-213)、深度学习入门、基本的数学知识
- 编程语言：Python, C++
- 课程难度：🌟🌟🌟
- 预计学时：100小时


深度学习的快速发展和广泛使用很大程度上得益于一系列简单好用且强大的编程框架，例如 Pytorch 和 Tensorflow 等等。但大多数从业者只是这些框架的“调包侠”，对于这些框架内部的细节实现却了解甚少。如果你希望从事深度学习底层框架的开发，或者只是像我一样好奇这些框架的内部实现，那么这门课将会是一个很好的起点。

课程的内容大纲覆盖了深度学习系统“全栈”的知识体系。从现代深度学习系统框架的顶层设计，到自微分算法的原理和实现，再到底层硬件加速和实际生产部署。为了更好地掌握理论知识，学生将会在5个课程作业中从头开始设计和实现一个完整的深度学习库 Needle，使其能对计算图进行自动微分，能在 GPU 上实现硬件加速，并且支持各类损失函数、数据加载器和优化器。在此基础上，学生将实现几类常见的神经网络，包括 CNN，RNN，LSTM，Transformer 等等。

即使你是深度学习领域的小白也不必过于担心，课程将会循序渐进地从简单分类问题和反向传播优化讲起，一些相对复杂的神经网络都会有配套的 jupyter notebook 详细地描述实现细节。如果你有一定的相关基础知识，那么在学习完自微分部分的内容之后便可以直接上手课程作业，难度虽然不大但相信一定会给你带来新的理解。

这门课两位授课教师 [Zico Kolter](https://zicokolter.com/) 和 [Tianqi Chen](https://tqchen.com/) 将所有课程内容都发布了对应的开源版本，但在线评测账号和课程论坛的注册时间已经结束，只剩下框架代码里的本地测试供大家调试代码。或许可以期待明年秋季学期的课程还会发布相应的在线版本供大家学习。

## 课程资源

- 课程网站：<https://dlsyscourse.org>
- 课程视频：<https://www.youtube.com/watch?v=qbJqOFMyIwg>
- 课程作业：<https://dlsyscourse.org/assignments/>

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/CMU10-714 - GitHub](https://github.com/PKUFlyingPig/CMU10-714) 中。

@Crazy-Ryan 在学习这门课(24 Fall)过程中的作业实现汇总在 [Crazy-Ryan/CMU-10-714 - GitHub](https://github.com/Crazy-Ryan/CMU-10-714) 中。`,
	},
	{
		DisplayName:       `可可呀`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习系统`,
		ArticleTitle:      `CS自学 | CSE234: Data Systems for Machine Learning`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CSE234: Data Systems for Machi。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CSE234: Data Systems for Machine Learning

## Course Overview

- University: UCSD  
- Prerequisites: Linear Algebra, Deep Learning, Operating Systems, Computer Networks, Distributed Systems  
- Programming Languages: Python, Triton  
- Difficulty: 🌟🌟🌟  
- Estimated Workload: ~120 hours  



This course focuses on the design of end-to-end large language model (LLM) systems, serving as an introductory course to building efficient LLM systems in practice.

The course can be more accurately divided into three parts (with several additional guest lectures):

Part 1. Foundations: modern deep learning and computational representations  

- Modern deep learning and computation graphs (framework and system fundamentals)  
- Automatic differentiation and an overview of ML system architectures  
- Tensor formats, in-depth matrix multiplication, and hardware accelerators  



Part 2. Systems and performance optimization: from GPU kernels to compilation and memory  

- GPUs and CUDA (including basic performance models)  
- GPU matrix multiplication and operator-level compilation  
- Triton programming, graph optimization, and compilation  
- Memory management (including practical issues and techniques in training and inference)  
- Quantization methods and system-level deployment  


Part 3. LLM systems: training and inference  

- Parallelization strategies: model parallelism, collective communication, intra-/inter-op parallelism, and auto-parallelization  
- LLM fundamentals: Transformers, Attention, and MoE  
- LLM training optimizations (e.g., FlashAttention-style techniques)  
- LLM inference: continuous batching, paged attention, disaggregated prefill/decoding  
- Scaling laws


(Guest lectures cover topics such as ML compilers, LLM pretraining and open science, fast inference, and tool use and agents, serving as complementary extensions.)

The defining characteristic of CSE234 is its strong focus on LLM systems as the core application setting. The course emphasizes real-world system design trade-offs and engineering constraints, rather than remaining at the level of algorithms or API usage. Assignments often require students to directly confront performance bottlenecks—such as memory bandwidth limitations, communication overheads, and kernel fusion—and address them through Triton or system-level optimizations. Overall, the learning experience is fairly intensive: a solid background in systems and parallel computing is important. For self-study, it is strongly recommended to prepare CUDA, parallel programming, and core systems knowledge in advance; otherwise, the learning curve becomes noticeably steep in the later parts of the course, especially around LLM optimization and inference. That said, once the pace is manageable, the course offers strong long-term value for those pursuing work in LLM infrastructure, ML systems, or AI compilers.

## Recommended Learning Path

The course itself is relatively well-structured and progressive. However, for students without prior experience in systems and parallel computing, the transition into the second part of the course may feel somewhat steep. A key aspect of this course is spending significant time implementing and optimizing systems in practice. Therefore, it is highly recommended to explore relevant open-source projects on GitHub while reading papers, and to implement related systems or kernels hands-on to deepen understanding.

- Foundations: consider studying alongside open-source projects such as [micrograd](https://github.com/karpathy/micrograd)  
- Systems & performance optimization and LLM systems: consider pairing with projects such as [nanoGPT](https://github.com/karpathy/nanoGPT) and [nano-vllm](https://github.com/GeeeekExplorer/nano-vllm)  

The course website itself provides a curated list of additional references and materials, which can be found here:  
[Book-related documentation and courses](https://hao-ai-lab.github.io/cse234-w25/resources/#book-related-documentation-and-courses)

## Course Resources

- Course Website: https://hao-ai-lab.github.io/cse234-w25/  
- Lecture Videos: https://hao-ai-lab.github.io/cse234-w25/  
- Reading Materials: https://hao-ai-lab.github.io/cse234-w25/resources/  
- Assignments: https://hao-ai-lab.github.io/cse234-w25/assignments/  

## Resource Summary

All course materials are released in open-source form. However, the online grading infrastructure and reference solutions for assignments have not been made public.

## Additional Resources / Further Reading

- [GPUMode](https://www.youtube.com/@GPUMODE): offers in-depth explanations of GPU kernels and systems. Topics referenced in the course—such as [DistServe](https://www.youtube.com/watch?v=tIPDwUepXcA), [FlashAttention](https://www.youtube.com/watch?v=VPslgC9piIw), and [Triton](https://www.youtube.com/watch?v=njgow_zaJMw)—all have excellent extended talks available.`,
	},
	{
		DisplayName:       `珍珠兔兔`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习系统`,
		ArticleTitle:      `CS自学 | CSE234: Data Systems for Machine Learning`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CSE234: Data Systems for Machi。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CSE234: Data Systems for Machine Learning


## 课程简介

- 所属大学：UCSD
- 先修要求：线性代数，深度学习，操作系统，计算机网络，分布式系统
- 编程语言：Python, Triton
- 课程难度：🌟🌟🌟
- 预计学时：120小时



本课程专注于设计一个全面的大语言模型(LLM)系统课程，作为设计高效LLM系统的入门介绍。

课程可以更准确地分为三个部分（外加若干 guest lecture）：

Part 1. 基础：现代深度学习与计算表示

- Modern DL 与计算图（computational graph / framework 基础）
- Autodiff 与 ML system 架构概览
- Tensor format、MatMul 深入与硬件加速器（accelerators）


Part 2. 系统与性能优化：从 GPU Kernel 到编译与内存

- GPUs & CUDA（含基本性能模型）
- GPU MatMul 与算子编译（operator compilation）
- Triton 编程、图优化与编译（graph optimization & compilation）
- Memory（含训练/推理中的内存问题与技巧）
- Quantization（量化方法与系统落地）


Part 3. LLM系统：训练与推理

- 并行策略：模型并行、collective communication、intra-/inter-op、自动并行化
- LLM 基础：Transformer、Attention、MoE
- LLM 训练优化：FlashAttention 等
- LLM 推理：continuous batching、paged attention、disaggregated prefill/decoding
- Scaling law


（Guest lectures：ML compiler、LLM pretraining/open science、fast inference、tool use & agents 等，作为补充与扩展。）

CSE234的最大特点在于非常专注于以LLM (LLM System)为核心应用场景，强调真实系统设计中的取舍与工程约束，而非停留在算法或 API 使用层面。课程作业通常需要直接面对性能瓶颈（如内存带宽、通信开销、kernel fusion 等），并通过 Triton 或系统级优化手段加以解决，对理解“为什么某些 LLM 系统设计是现在这个样子”非常有帮助。学习体验整体偏硬核，前期对系统与并行计算背景要求较高，自学时建议提前补齐 CUDA/并行编程与基础系统知识，否则在后半部分（尤其是 LLM 优化与推理相关内容）会明显感到陡峭的学习曲线。但一旦跟上节奏，这门课对从事 LLM Infra / ML Systems / AI Compiler 方向的同学具有很强的长期价值。


## 学习路线推荐

课程本身其实比较循序渐进，但是对于没有系统与并行计算背景的同学来说可能到第二部分会感觉稍微陡峭一点。课程最核心的部分其实是要花很多时间动手实现与优化系统，因此建议在读paper的时候就可以在Github上找一些相关的开源项目，动手实现相关的系统或者Kernel，加深理解。

- 基础部分：建议配合 [micrograd](https://github.com/karpathy/micrograd) 等开源项目一起学习
- 系统与性能优化 & LLM系统：建议配合 [nanoGPT](https://github.com/karpathy/nanoGPT), [nano-vllm](https://github.com/GeeeekExplorer/nano-vllm) 等开源项目一起食用

课程页面本身提供了一些知识与资源，可以参考：[Book related documentation and courses](https://hao-ai-lab.github.io/cse234-w25/resources/#book-related-documentation-and-courses)


## 课程资源

- 课程网站：https://hao-ai-lab.github.io/cse234-w25/
- 课程视频：https://hao-ai-lab.github.io/cse234-w25/
- 课程教材：https://hao-ai-lab.github.io/cse234-w25/resources/
- 课程作业：https://hao-ai-lab.github.io/cse234-w25/assignments/

## 资源汇总

所有课程内容都发布了对应的开源版本，但在线测评和作业参考答案部分尚未开源。

## 其他资源/课程延伸

- [GPUMode](https://www.youtube.com/@GPUMODE): 有非常多关于GPU Kernel / System的深度讲解。课程中提到的包括[DistServe](https://www.youtube.com/watch?v=tIPDwUepXcA), [FlashAttention](https://www.youtube.com/watch?v=VPslgC9piIw), [Triton](https://www.youtube.com/watch?v=njgow_zaJMw) 都有很好的延伸`,
	},
	{
		DisplayName:       `蜗牛刺猬`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习系统`,
		ArticleTitle:      `CS自学 | MIT6.5940: TinyML and Efficient Deep Learning Comp`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT6.5940: TinyML and Efficien。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT6.5940: TinyML and Efficient Deep Learning Computing

## Descriptions

- Offered by: MIT
- Prerequisites: Computer architecture, Deep Learning
- Programming Languages: Python
- Difficulty: 🌟🌟🌟🌟
- Class Hour: 50h

This course, taught by MIT Professor [Song Han](https://hanlab.mit.edu/songhan), focuses on efficient machine learning techniques. Students are expected to have a pre-requisite of deep learning basics.

The course is divided into three main sections. The first section covers various key techniques for lightweight neural networks, such as pruning, quantization, distillation, and neural architecture search (NAS). Building on these foundations, the second section introduces efficient optimization techniques tailored to specific application scenarios. These include cutting-edge topics in deep learning, such as inference for large language models, long-context support, post-training acceleration, multimodal large language models, GANs, diffusion models, and so on. The third section focuses on efficient training techniques, such as large-scale distributed parallelism, automatic parallel optimization, gradient compression, and on-device training. Professor Song Han’s lectures are clear and insightful, covering a wide range of topics, with a strong focus on trending areas. Those interested in gaining a foundational understanding of large language models may particularly benefit from the second and third sections.

The course materials and resources are available on the course website. Official lecture videos can be found on YouTube, and both raw and subtitled versions are available on Bilibili. There are five assignments in total: the first three focus on quantization, pruning, and NAS, while the last two involve compression and efficient deployment of large language models. The overall difficulty is relatively manageable, making the assignments an excellent way to solidify core knowledge.


## Course Resources

- Course Website: [2024fall](https://hanlab.mit.edu/courses/2024-fall-65940), [2023fall](https://hanlab.mit.edu/courses/2023-fall-65940)
- Recordings: [2024fall](https://www.youtube.com/playlist?list=PL80kAHvQbh-qGtNc54A6KW4i4bkTPjiRF), [2023fall](https://www.youtube.com/playlist?list=PL80kAHvQbh-pT4lCkDT53zT8DKmhE0idB)
- Textbooks: None
- Assignments: Five labs in total

## Personal Resources

All the resources and assignments used by @PKUFlyingPig in this course are maintained in [PKUFlyingPig/MIT6.5940_TinyML - GitHub](https://github.com/PKUFlyingPig/MIT6.5940_TinyML).`,
	},
	{
		DisplayName:       `勤劳的石榴`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习系统`,
		ArticleTitle:      `CS自学 | MIT6.5940: TinyML and Efficient Deep Learning Comp`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：MIT6.5940: TinyML and Efficien。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# MIT6.5940: TinyML and Efficient Deep Learning Computing

## 课程简介

- 所属大学：MIT
- 先修要求：体系结构、深度学习基础、
- 编程语言：Python
- 课程难度：🌟🌟🌟🌟
- 预计学时：50小时

这门课由 MIT 的 [Song Han](https://hanlab.mit.edu/songhan) 教授讲授，侧重于高效的机器学习训练、推理技术。学生需要有一定的深度学习方面的知识基础。

课程主要分为三个部分，首先讲授了让神经网络轻量化的各种关键技术，例如剪枝、量化、蒸馏、网络架构搜索等等。有了这些基础之后，课程第二部分会讲授面向特定领域场景的各种高效优化技术，涉及了目前深度学习最前沿热门的各个方向，例如大语言模型的推理、长上下文支持、后训练加速、多模态大语言模型、GAN、扩散模型等等。课程第三部分主要涉及各类高效训练技术，例如大规模分布式并行、自动并行优化、梯度压缩、边缘训练等等。Song Han 教授的讲解深入浅出，覆盖的知识面很广，且都是当前热门的领域方向，如果是想对大语言模型有初步了解也可以重点关注第二和第三部分的内容。

课程内容和资源都可以在课程网站上找到，视频在油管上有官方版本，B站也有生肉和熟肉搬运，可以自行查找。课程作业一共有5个，前三个分别考察了量化、剪枝和 NAS，后两个主要是对大语言模型的压缩和高效部署，总体难度相对简单，但能很好地巩固核心知识。

## 课程资源

- 课程网站：[2024fall](https://hanlab.mit.edu/courses/2024-fall-65940), [2023fall](https://hanlab.mit.edu/courses/2023-fall-65940)
- 课程视频：[2024fall](https://www.youtube.com/playlist?list=PL80kAHvQbh-qGtNc54A6KW4i4bkTPjiRF), [2023fall](https://www.youtube.com/playlist?list=PL80kAHvQbh-pT4lCkDT53zT8DKmhE0idB)
- 课程教材：无
- 课程作业：共5个实验，具体要求见课程网站

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/MIT6.5940_TinyML - GitHub](https://github.com/PKUFlyingPig/MIT6.5940_TinyML) 中。`,
	},
	{
		DisplayName:       `可颂cc`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习系统`,
		ArticleTitle:      `CS自学 | Machine Learning Compilation`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Machine Learning Compilation。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Machine Learning Compilation

## Course Overview

- University: Online course
- Prerequisites: Foundations in Machine Learning/Deep Learning
- Programming Language: Python
--Difficulty: 🌟🌟🌟
- Estimated Hours: 30 hours

This course, offered by top scholar Chen Tianqi during the summer of 2022, focuses on the field of machine learning compilation. As of now, this area remains cutting-edge and rapidly evolving, with no dedicated courses available domestically or internationally. If you're interested in gaining a comprehensive overview of machine learning compilation, this course is worth exploring.

The curriculum predominantly centers around the popular machine learning compilation framework [Apache TVM](https://tvm.apache.org/), co-founded by Chen Tianqi. It delves into transforming various machine learning models developed in frameworks like Tensorflow, Pytorch, and Jax into deployment patterns with higher performance and adaptability across different hardware. The course imparts knowledge at a relatively high level, presenting macro-level concepts. Each session is accompanied by a Jupyter Notebook that provides code-based explanations of the concepts. If you are involved in TVM-related programming and development, this course offers rich and standardized code examples for reference.

All course resources are open-source, with versions available in both Chinese and English. The course recordings can be found on both Bilibili and YouTube in both languages.

## Course Resources

- Course Website：<https://mlc.ai/summer22-zh/>
- Course Videos：[Bilibili][Bilibili_link]
- Course Notes：<https://mlc.ai/zh/index.html>
- Course Assignments：<https://github.com/mlc-ai/notebooks/blob/main/assignment>

[Bilibili_link]: https://www.bilibili.com/video/BV15v4y1g7EU?spm_id_from=333.337.search-card.all.click&vd_source=a4d76d1247665a7e7bec15d15fd12349`,
	},
	{
		DisplayName:       `机灵的榴莲`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习系统`,
		ArticleTitle:      `CS自学 | Machine Learning Compilation`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Machine Learning Compilation。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习系统`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Machine Learning Compilation

## 课程简介

- 所属大学：Bilibili 大学
- 先修要求：机器学习/深度学习基础
- 编程语言：Python
- 课程难度：🌟🌟🌟
- 预计学时：30小时



这门课是机器学习编译领域的顶尖学者陈天奇在2022年暑期开设的一门在线课程。其实机器学习编译无论在工业界还是学术界仍然是一个非常前沿且快速更迭的领域，国内外此前还没有为这个方向专门开设的相关课程。因此如果对机器学习编译感兴趣想有个全貌性的感知的话，可以学习一下这门课。

本课程主要以 [Apache TVM](https://tvm.apache.org/) 这一主流的机器学习编译框架为例（陈天奇是这个框架的创始人之一），聚焦于如何将开发模式下（如 Tensorflow, Pytorch, Jax）的各类机器学习模型，通过一套普适的抽象和优化算法，变换为拥有更高性能并且适配各类底层硬件的部署模式。课程讲授的知识点都是相对 High-Level 的宏观概念，同时每节课都会有一个配套的 Jupyter Notebook 来通过具体的代码讲解知识点，因此如果从事 TVM 相关的编程开发的话，这门课有丰富且规范的代码示例以供参考。

所有的课程资源全部开源并且有中文和英文两个版本，B站和油管分别有中文和英文的课程录影。

## 课程资源

- 课程网站：<https://mlc.ai/summer22-zh/>
- 课程视频：[Bilibili][Bilibili_link]
- 课程笔记：<https://mlc.ai/zh/index.html>
- 课程作业：<https://github.com/mlc-ai/notebooks/blob/main/assignment>

[Bilibili_link]: https://www.bilibili.com/video/BV15v4y1g7EU?spm_id_from=333.337.search-card.all.click&vd_source=a4d76d1247665a7e7bec15d15fd12349`,
	},
	{
		DisplayName:       `阳光的番茄ya`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习进阶`,
		ArticleTitle:      `CS自学 | CMU 10-708: Probabilistic Graphical Models`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CMU 10-708: Probabilistic Grap。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CMU 10-708: Probabilistic Graphical Models

## Course Introduction

- **University**: Carnegie Mellon University (CMU)
- **Prerequisites**: Machine Learning, Deep Learning, Reinforcement Learning
- **Course Difficulty**: 🌟🌟🌟🌟🌟
- **Course Website**: [CMU 10-708](https://sailinglab.github.io/pgm-spring-2019/)
- **Course Resources**: The course website includes slides, notes, videos, homework, and project materials.

CMU's course on Probabilistic Graphical Models, taught by Eric P. Xing, is a foundational and advanced course on graphical models. The curriculum covers the basics of graphical models, their integration with neural networks, applications in reinforcement learning, and non-parametric methods, making it a highly rigorous and comprehensive course.

For students with a solid background in machine learning, deep learning, and reinforcement learning, this course provides a deep dive into the theoretical and practical aspects of probabilistic graphical models. The extensive resources available on the course website make it an invaluable learning tool for anyone looking to master this complex and rapidly evolving field.`,
	},
	{
		DisplayName:       `俏皮的抹茶wow`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习进阶`,
		ArticleTitle:      `CS自学 | STATS214 / CS229M: Machine Learning Theory`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：STATS214 / CS229M: Machine Lea。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# STATS214 / CS229M: Machine Learning Theory

## Course Introduction

- **University**: Stanford
- **Prerequisites**: Machine Learning, Deep Learning, Statistics
- **Course Difficulty**: 🌟🌟🌟🌟🌟🌟
- **Course Website**: [STATS214 / CS229M](http://web.stanford.edu/class/stats214/)

This course offers a rigorous blend of classical learning theory and the latest developments in deep learning theory, making it exceptionally challenging and comprehensive. Previously taught by Percy Liang, the course is now led by Tengyu Ma, ensuring a high level of expertise and insight into the theoretical aspects of machine learning. 

The curriculum is designed for students with a solid foundation in machine learning, deep learning, and statistics, aiming to deepen their understanding of the underlying theoretical principles in these fields. This course is an excellent choice for anyone looking to gain a thorough understanding of both the traditional and contemporary theoretical approaches in machine learning.`,
	},
	{
		DisplayName:       `活泼的麻雀呀`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习进阶`,
		ArticleTitle:      `CS自学 | STA 4273 Winter 2021: Minimizing Expectations`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：STA 4273 Winter 2021: Minimizi。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# STA 4273 Winter 2021: Minimizing Expectations

## Course Introduction

- **University**: University of Toronto
- **Prerequisites**: Bayesian Inference, Reinforcement Learning
- **Course Difficulty**: 🌟🌟🌟🌟🌟🌟🌟
- **Course Website**: [STA 4273 Winter 2021](https://www.cs.toronto.edu/~cmaddis/courses/sta4273_w21/)

"Minimizing Expectations" is an advanced Ph.D. level research course, focusing on the interplay between inference and control. The course is taught by Chris Maddison, a founding member of AlphaGo and a NeurIPS 2014 best paper awardee.

This course is notably challenging and is designed for students who have a strong background in Bayesian Inference and Reinforcement Learning. The curriculum explores deep theoretical concepts and their practical applications in the fields of machine learning and artificial intelligence.

Chris Maddison's expertise and his significant contributions to the field, particularly in the development of AlphaGo, make this course highly prestigious and insightful for Ph.D. students and researchers looking to deepen their understanding of inference and control in advanced machine learning contexts. The course website provides valuable resources for anyone interested in this specialized area of study.`,
	},
	{
		DisplayName:       `麻雀练瑜伽`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习进阶`,
		ArticleTitle:      `CS自学 | Columbia STAT 8201: Deep Generative Models`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Columbia STAT 8201: Deep Gener。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Columbia STAT 8201: Deep Generative Models

## Course Introduction

- **University**: Columbia University
- **Prerequisites**: Machine Learning, Deep Learning, Graphical Models
- **Course Difficulty**: 🌟🌟🌟🌟🌟🌟
- **Course Website**: [STAT 8201](http://stat.columbia.edu/~cunningham/teaching/GR8201/)

"Deep Generative Models" is a Ph.D. level seminar course at Columbia University, taught by John Cunningham. This course is structured around weekly paper presentations and discussions, focusing on deep generative models, which represent the intersection of graphical models and neural networks and are one of the most important directions in modern machine learning.

The course is designed to explore the latest advancements and theoretical foundations in deep generative models. Participants engage in in-depth discussions about current research papers, fostering a deep understanding of the subject matter. This format not only helps students keep abreast of the latest developments in this rapidly evolving field but also sharpens their critical thinking and research skills.

Given the advanced nature of the course, it is ideal for Ph.D. students and researchers who have a solid foundation in machine learning, deep learning, and graphical models, and are looking to delve into the cutting-edge of deep generative models. The course website provides a valuable resource for accessing the curriculum and related materials.`,
	},
	{
		DisplayName:       `椰子饺子`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习进阶`,
		ArticleTitle:      `CS自学 | Advanced Machine Learning Roadmap`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：Advanced Machine Learning Road。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# Advanced Machine Learning Roadmap

This learning path is suitable for students who have already learned the basics of machine learning (ML, NLP, CV, RL), such as senior undergraduates or junior graduate students, and have published at least one paper in top conferences (NeurIPS, ICML, ICLR, ACL, EMNLP, NAACL, CVPR, ICCV) and are interested in pursuing a research path in machine learning.

The goal of this path is to lay the theoretical groundwork for understanding and publishing papers at top machine learning conferences, especially in the track of Probabilistic Methods.

There can be multiple advanced learning paths in machine learning, and this one represents the best path as understood by the author [Yao Fu](https://franxyao.github.io/), focusing on probabilistic modeling methods under the Bayesian school and involving interdisciplinary knowledge.

## Essential Textbooks

- PRML: Pattern Recognition and Machine Learning by Christopher Bishop
- AoS: All of Statistics by Larry Wasserman

These two books respectively represent classic teachings of the Bayesian and frequentist schools, complementing each other nicely.

## Reference Books

- MLAPP: Machine Learning: A Probabilistic Perspective by Kevin Murphy
- Convex Optimization by Stephen Boyd and Lieven Vandenberghe

## Advanced Books

- W&J: Graphical Models, Exponential Families, and Variational Inference by Martin Wainwright and Michael Jordan
- Theory of Point Estimation by E. L. Lehmann and George Casella

## Reading Guidelines

### How to Approach

- Essential textbooks are a must-read.
- Reference books are like dictionaries: consult them when encountering unfamiliar concepts (instead of Wikipedia).
- Advanced books should be approached after completing the essential textbooks, which should be read multiple times for thorough understanding.
- Contrastive-comparative reading is crucial: open two books on the same topic, compare similarities, differences, and connections.
- Recall previously read papers during reading and compare them with textbook content.

### Basic Pathway

1. Start with AoS Chapter 6: Models, Statistical Inference, and Learning as a basic introduction.
2. Read PRML Chapters 10 and 11:
   - Chapter 10 covers Variational Inference, and Chapter 11 covers MCMC, the two main routes for Bayesian inference.
   - Consult earlier chapters in PRML or MLAPP for any unclear terms.
   - AoS Chapter 8 (Parametric Inference) and Chapter 11 (Bayesian Inference) can also serve as references. Compare these chapters with the relevant PRML chapters.
3. After PRML Chapters 10 and 11, proceed to AoS Chapter 24 (Simulation Methods) and compare it with PRML Chapter 11, focusing on MCMC.
4. If foundational concepts are still unclear, review PRML Chapter 3 and compare it with AoS Chapter 11.
5. Read PRML Chapter 13 (skip Chapter 12) and compare it with MLAPP Chapters 17 and 18, focusing on HMM and LDS.
6. After completing PRML Chapter 13, move on to Chapter 8 (Graphical Models).
7. Cross-reference these topics with CMU 10-708 PGM course materials.

By this point, you should have a grasp of:

- Basic definitions of probabilistic models
- Exact inference - Sum-Product
- Approximate inference - MCMC
- Approximate inference - VI

Afterward, you can proceed to more advanced topics.`,
	},
	{
		DisplayName:       `慵懒的拿铁cc`,
		School:            `CS自学指南`,
		MajorLine:         `机器学习进阶`,
		ArticleTitle:      `CS自学 | 机器学习进阶学习路线`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：机器学习进阶学习路线。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `机器学习进阶`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# 机器学习进阶学习路线

此路线图适用于已经学过了基础机器学习 (ML, NLP, CV, RL) 的同学 (高年级本科生或低年级研究生)，已经发表过至少一篇顶会论文 (NeurIPS, ICML, ICLR, ACL, EMNLP, NAACL, CVPR, ICCV) 想要走机器学习科研路线的选手。

此路线的目标是为读懂与发表机器学习顶会论文打下理论基础，特别是 Probabilistic Methods 这个 track 下的文章。

机器学习进阶可能存在多种不同的学习路线，此路线只能代表作者 [Yao Fu](https://franxyao.github.io/) 所理解的最佳路径，侧重于贝叶斯学派下的概率建模方法，也会涉及到各项相关学科的交叉知识。

## 必读教材

- PRML: Pattern Recognition and Machine Learning. Christopher Bishop
- AoS: All of Statistics. Larry Wasserman

这两本书分别是经典贝叶斯学派和经典频率学派的教材，刚好相辅相成。

## 字典

- MLAPP: Machine Learning: A Probabilistic Perspective. Kevin Murphy
- Convex Optimization. Stephen Boyd and Lieven Vandenberghe

## 进阶书籍

- W&J: Graphical Models, Exponential Families, and Variational Inference. Martin Wainwright and Michael Jordan
- Theory of Point Estimation. E. L. Lehmann and George Casella

## 如何阅读

### Guidelines

- 必读教材就是一定要读的教材
- 字典的意思是，一般情况下不管它，但当遇到了不懂的概念的时候，就去字典里面查（而不是维基百科）
- 进阶书籍先不读，先读完必读书籍。必读书籍一般都是要前前后后反复看过 N 遍才算读完
- 读的过程中，最重要的读法就是对比阅读 (contrastive-comparative reading)：同时打开两本书讲同一主题的章节，然后对比相同点和不同点和联系
- 读的过程中，尽量去回想之前读过的论文，比较论文和教材的相同点与不同点

### 基础路径

- 先读 AoS 第六章: Models, Statistical Inference and Learning，这一部分是最基础的科普
- 然后读 PRML 第 10, 11 章
  - 第 10 章的内容是 Variational Inference, 第 11 章的内容是 MCMC, 这两种方法是贝叶斯推断的两条最主要路线
  - 如果在读 PRML 的过程中发现有任何不懂的名词，就去翻前面的章节。很大概率能够在第 3，4 章找到相对应的定义；如果找不到或者不够详细，就去查 MLAPP
  - AoS 第 8 章 (Parametric Inference) 和第 11 章 (Bayesian Inference) 也可以作为参考。最好的方法是多本书对比阅读，流程如下
    - 假设我在读 PRML 第 10 章的时候发现了一个不懂的词：posterior inference
    - 于是我往前翻，翻到了第 3 章 (Linear Model for Regression)，看到了最简单的 posterior
    - 然后我接着翻 AoS，翻到了第 11 章，也有对 posterior 的描述
    - 然后我对比 PRML 第 10 章，第 3 章，AoS 第 11 章，三处不同地方对 posterior 的解读，比较其相同点和不同点和联系
- 读完 PRML 第 10 和 11 章之后，接着读 AoS 第 24 章 (Simulation Methods)，然后把它和 PRML 第 11 章对比阅读 -- 这俩都是讲 MCMC
- 如果到此处发现还有基础概念读不懂，就回到 PRML 第 3 章，把它和 AoS 第 11 章对比阅读
- Again，对比阅读非常重要，一定要把不同本书的类似内容同时摆在面前相互对比，这样可以显著增强记忆
- 然后读 PRML 第 13 章（跳过第 12 章），这一章可以和 MLAPP 的第 17, 18 章对比阅读
  - MLAPP 第 17 章是 PRML 第 13.2 章的详细版，主要讲 HMM
  - MLAPP 第 18 章是 PRML 第 13.3 章的详细版，主要讲 LDS
- 读完 PRML 第 13 章之后，再去读 PRML 第 8 章 (Graphical Models) -- 此时这部分应该会读得很轻松
- 以上的内容可以进一步对照 CMU 10-708 PGM 课程材料

到目前为止，应该能够掌握:

- 概率模型的基础定义
- 精准推断 - Sum-Product
- 近似推断 - MCMC
- 近似推断 - VI

然后就可以去做更进阶的内容。`,
	},
	{
		DisplayName:       `蜜桃马卡龙`,
		School:            `CS自学指南`,
		MajorLine:         `深度学习`,
		ArticleTitle:      `CS自学 | CMU 11-785: Introduction to Deep Learning`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CMU 11-785: Introduction to De。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `深度学习`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CMU 11-785: Introduction to Deep Learning

## Descriptions

- Offered by: CMU
- Prerequisites: Linear Algebra, Probability, Python Programming, and ML Foundations
- Programming Languages: Python
- Difficulty: 🌟🌟🌟🌟🌟
- Class Hour: ~120 hours

CMU 11-785 is a rigorous, fast-paced deep learning core course with very little filler. It starts from neural network fundamentals and systematically covers CNNs, RNNs, Attention/Transformers, optimization, and generalization.

The workload feels close to graduate-level training: assignments usually require real understanding of model behavior, training details, and experimental methodology. If you want durable deep learning fundamentals (instead of only using high-level APIs), this course is an excellent investment.

## Course Resources

- Course Website: <https://deeplearning.cs.cmu.edu/S26/index.html>
- Recordings: Lecture recordings are available on course websites (varies by semester)
- Textbooks: Mainly Lecture Notes / Slides + paper readings
- Assignments: Multiple programming assignments and a course project (published on course sites)

## Personal Resources

No public personal repository is currently provided for this course.`,
	},
	{
		DisplayName:       `雪糕要毕业了`,
		School:            `CS自学指南`,
		MajorLine:         `深度学习`,
		ArticleTitle:      `CS自学 | CS224n: Natural Language Processing`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS224n: Natural Language Proce。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `深度学习`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS224n: Natural Language Processing

## Course Overview

- University：Stanford
- Prerequisites：Fundations of Deep Learning + Python
- Programming Language：Python
- Course Difficulty：🌟🌟🌟🌟
- Estimated Hours：80 hours

CS224n is an introductory course in Natural Language Processing (NLP) offered by Stanford and led by renowned NLP expert Chris Manning. The course covers core concepts in the field of NLP, including word embeddings, RNNs, LSTMs, Seq2Seq models, machine translation, attention mechanisms, Transformers, and more.

The course consists of 5 progressively challenging programming assignments covering word vectors, the word2vec algorithm, dependency parsing, machine translation, and fine-tuning a Transformer.

The final project involves training a Question Answering (QA) model on the well-known SQuAD dataset. Some students' final projects have even led to publications in top conferences.

## Course Resources

- Course Website：<http://web.stanford.edu/class/cs224n/index.html>
- Course Videos: Search for 'CS224n' on Bilibili <https://www.bilibili.com/>
- Course Textbook：N/A
- Course Assignments：<http://web.stanford.edu/class/cs224n/index.html>，5 Programming Assignments + 1 Final Project

## Resource Compilation

All resources and assignment implementations used by @PKUFlyingPig during the course are compiled in [PKUFlyingPig/CS224n - GitHub](https://github.com/PKUFlyingPig/CS224n)`,
	},
	{
		DisplayName:       `草莓小号`,
		School:            `CS自学指南`,
		MajorLine:         `深度学习`,
		ArticleTitle:      `CS自学 | CS224n: Natural Language Processing`,
		LongBioPrefix:     csslLongBioPrefix,
		ShortBio:          `来自北大CS自学指南的课程推荐与学习经验：CS224n: Natural Language Proce。`,
		Audience:          csslAudience,
		WelcomeMessage:    `你好，欢迎问我关于计算机自学路线和课程推荐的问题。`,
		Education:         csslEducation,
		MajorLabel:        csslMajorLabel,
		KnowledgeCategory: csslKnowledgeCat,
		KnowledgeTags:     csslKnowledgeTags,
		SampleQuestions: []string{`计算机自学怎么入门？`, `有哪些好的CS公开课？`, `怎么系统学习计算机？`, `AI方向学什么课？`},
		ExpertiseTags: []string{`计算机自学`, `课程推荐`, `编程学习`, `深度学习`},
		Source: `北大CS自学指南`,
		KnowledgeBody: `# CS224n: Natural Language Processing

## 课程简介

- 所属大学：Stanford
- 先修要求：深度学习基础 + Python
- 编程语言：Python
- 课程难度：🌟🌟🌟🌟
- 预计学时：80 小时

Stanford 的 NLP 入门课程，由自然语言处理领域的巨佬 Chris Manning 领衔教授。内容覆盖了词向量、RNN、LSTM、Seq2Seq 模型、机器翻译、注意力机制、Transformer 等等 NLP 领域的核心知识点。

5 个编程作业难度循序渐进，分别是词向量、word2vec 算法、Dependency parsing、机器翻译以及 Transformer 的 fine-tune。

最终的大作业是在 Stanford 著名的 SQuAD 数据集上训练 QA 模型，有学生的大作业甚至直接发表了顶会论文。

## 课程资源

- 课程网站：<http://web.stanford.edu/class/cs224n/index.html>
- 课程视频：B 站搜索 CS224n
- 课程教材：无
- 课程作业：<http://web.stanford.edu/class/cs224n/index.html>，5 个编程作业 + 1 个 Final Project

## 资源汇总

@PKUFlyingPig 在学习这门课中用到的所有资源和作业实现都汇总在 [PKUFlyingPig/CS224n - GitHub](https://github.com/PKUFlyingPig/CS224n) 中。`,
	},
}
