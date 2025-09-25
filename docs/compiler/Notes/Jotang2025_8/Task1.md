---
sidebar_position : 3
---
本文档包含：
1.对词法分析器，语法分析器，flex，Bison，文法等的初步了解
2.实现计算器的过程

## 词法分析器


### 正则表达式
s：
描述字符串匹配规则的“语言”
比如 c.t 表示所有以c开头，t结尾的三位字符串

主流的编译器采用**有限自动机**的思想来构造词法分析器
### 有限自动机

chatGPT：
有限自动机就像一个**小机器**，它有：

* **有限个状态**（就像几间房间，数量是有限的）
* **一个起始状态**（你一开始在哪个房间）
* **一些接受状态**（如果你最后停在这里，就算“成功”）
* **状态转移规则**（读到某个输入字符时，从一个房间走到另一个房间）

它用来**处理一个字符串**：

* 从起始状态开始，逐个读字符
* 按照转移规则改变状态
* 最后如果停在接受状态，就说这个字符串被“接受”；否则不接受。


比如我们要识别字符串 `"ab"`。
我们可以设计一个有限自动机：

* 状态集合：`{q0, q1, q2}`
* 起始状态：`q0`
* 接受状态：`q2`
* 转移规则：

  * 在 `q0` 读到 `a` → 去 `q1`
  * 在 `q1` 读到 `b` → 去 `q2`
  * 其他情况 → 不动或者走到死路（拒绝）

这样：

* 输入 `"ab"`：`q0 --a--> q1 --b--> q2` → 接受 ✅
* 输入 `"a"`：只到 `q1` 就结束 → 不接受 ❌
* 输入 `"abc"`：走到 `q2` 后还多一个 `c` → 不接受 ❌


#### 为什么叫“有限”

因为状态数目是有限的，不像程序可以无限开变量。
有限自动机的“记忆”能力就是：**只能通过“状态”来记住过去的信息**，它不能像栈、数组那样存储无限的历史。

例如：

* 有限自动机能识别“是否含有偶数个 1”。
* 但它**不能**识别“括号是否匹配”，因为括号嵌套可能无限深，有限个状态记不住。

 在编译器中的应用

在编译器的 **词法分析（lexical analysis）** 阶段：

* 用正则表达式定义“单词”的规则（比如标识符、数字、关键字等）。
* 再把正则表达式转换成有限自动机。
* 有限自动机负责“扫描源代码”，识别出一个个 token。

#### 为什么词法分析器需要有限自动机
> “我写个程序扫描源代码，不就是按字符读、匹配关键字、分隔符、数字吗？干嘛要扯什么**有限自动机**这么抽象的东西？”

原因主要有三点：
 **形式化描述，保证正确性**

编译器要处理的“单词”（token）种类非常多：关键字、标识符、整数、浮点数、字符串、注释……
如果你只凭直觉写 `if/else` 代码，容易遗漏或者写出一堆复杂的分支。

**有限自动机提供了一个精确的数学模型**：

* “哪些字符串是合法的单词” → 用正则表达式描述
* “如何一步一步识别” → 转换成有限自动机
  这样就不怕有歧义或漏洞，保证 **所有合法的输入都能被识别，非法的会被拒绝**。

s:
从正则表达式到有限自动机的过程
把字符串匹配、词法分析的过程规范化了



chatGPT：
以下是一个从正则表达式到有限自动机到字符串识别程序的例子（s进行了部分删改）



我们要识别 **标识符**：

```
[a-z][a-z0-9]*
```

意思是：

* 第一个字符必须是小写字母
* 后面可以跟任意数量的小写字母或数字

比如：`a`, `x1`, `abc123` ✅；
但 `1abc`, `_foo` ❌。

**正则表达式**

就是上面的写法：

```
[a-z][a-z0-9]*
```

→ 描述了我们想要的字符串集合。

有限自动机（这里是DFA，也就是每一步都确定状态的自动机）：
* q0：开始状态

  * 输入 `[a-z]` → q1
  * 输入其他 → 死状态
* q1：接受状态

  * 输入 `[a-z0-9]` → q1
  * 输入其他 → 死状态

 **词法分析器代码**

最后一步就是把（最小） DFA 写成代码。

比如 C 里可以写成状态机：

```c
int scan_identifier(const char *s) {
    int state = 0; // q0
    int i = 0;
    while (s[i] != '\0') {
        char c = s[i];
        switch (state) {
            case 0: // q0
                if (c >= 'a' && c <= 'z') state = 1;
                else return 0; // 非法
                break;
            case 1: // q1
                if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9'))
                    state = 1;
                else
                    return 0; // 非法字符
                break;
        }
        i++;
    }
    return state == 1; // 是否在接受状态
}
```

输入 `"abc123"` → 返回 1（接受）
输入 `"1abc"` → 返回 0（拒绝）

s:
实际上我们最后写成的程序可以看作是在**构建并维护一个有限自动机**
在这个过程中会用到两种算法 Thompson算法和子集构造法


#### Thmopson算法和子集构造法
s:
一般来讲，从正则表达式到字符串识别程序（词法分析器）需要经历几个步骤
正则表达式->NFA（非确定性有限自动机）->DFA（确定性有限自动机）->最小化DFA-> 可用的字符串识别程序
**Thompson算法**是处理第一步 从正则表达式到NFA的
以下是Thompson算法的具体构造规则

chatGPT:

Thompson 算法的思路是把一个正则表达式（regular expression）一步步“组装成”一个 NFA（带 ε 转移的非确定性有限自动机，ε 表示不消耗输入的空转移），这样我们就能用自动机来做匹配。它由 Ken Thompson 在早期 Unix 工具的背景下提出——思想是把正则的三种基本运算（连接、并、星号）做成小片段，然后通过简单规则把片段拼起来。

以下是学习这个算法必须知道的概念：
* **正则表达式（regex）**：用来描述字符串集合的式子，基本构造：

  * 单字符：`a` 表示 { "a" }。
  * 连接（concatenation）：`AB` 表示先匹配 A 再匹配 B。
  * 并/或（union/alternation）：`A|B` 表示 A 或 B。
  * 克林闭包（Kleene star）：`A*` 表示 A 重复 0 次或多次。
  * 括号 `(...)` 用来控制优先级。
* **语言 L(R)**：正则 R 描述的所有字符串集合。
* **有限自动机（finite automaton）**：由若干状态（states）和标记为字母或 ε 的有向边（transitions）构成。一个初始状态（start）和一个或多个接受状态（accept）。机器按输入走边，最后落在接受状态则接受该字符串。
* **NFA（非确定性有限自动机）**：从某一状态在相同输入符号下可以有多条边可选（即“非确定”）。NFA 可以含有 **ε（epsilon）边**，表示不消耗输入就能从一个状态跳到另一个。
* **DFA（确定性有限自动机）**：对每个状态和每个输入符号，最多只有一条出边（确定的）。
* **ε-闭包（epsilon-closure）**：给定状态集合 S，ε-闭包是从 S 出发只沿 ε 边能到达的所有状态（包括 S 自身）。这是 NFA 模拟必需的概念。

**Thompson 构造的核心规则（图示化说明）**

Thompson 的思想非常模块化：为最基本的正则构造（字符、连接、并、星）分别设计 NFA 片段（fragment），然后按表达式的语法树把片段组合起来。每个片段有**唯一的开始状态**和**唯一的接受（终结）状态**，组合后新的片段仍然满足这个属性。

接下来用图示来表示：
用 `→` 表示有向边，用 `-a->` 表示读字符 `a` 的转移，用 `-ε->` 表示 ε 转移（不消耗输入）。

1. **字符 a 的片段**

```
(s) -a-> (t)
start = s, accept = t
```

2. **连接（concatenation） A B**
   把 A 的 accept 用 ε 连接到 B 的 start（或者把 A 的“悬挂出口”接到 B 的 start），整体 start=A.start，accept=B.accept。示意：

```
A.start ... A.accept -ε-> B.start ... B.accept
```

3. **并（alternation） A|B**
   新建一个 start，两个 ε 分别指向 A.start 和 B.start；A.accept 和 B.accept 用 ε 指向一个新 accept：

```
         -ε-> A.start ... A.accept -ε-
        /                             \
newStart                               newAccept
        \                             /
         -ε-> B.start ... B.accept -ε-
```

4. **星号 A**\*
   新建 start 和 accept：start 有 ε 指向 A.start 并且 ε 指向 accept（允许 0 次）；A.accept 有 ε 指回 A.start（循环）并且 ε 指向 accept（结束）。

```
      -ε-> A.start ... A.accept -ε-
     /                         \
newStart                         newAccept
     \-ε----------------------->/
```

这保证了可以“跳过”A（0 次）或进入 A 再回到开始继续重复。

（**派生**：`A+` = `AA*`，`A?` = `A|ε`，可以用上面的规则组合得到。）


s:

NFA 的特点：
它有 ε-边（不读字符就能跳转），
对同一个输入字符可能有多个走向（非确定性）。
这对人类推理挺友好，但对计算机执行就不方便。
所以下一步要用 子集构造法 把 NFA 转成一个 等价的 DFA。

**子集构造法**
s:
子集构造法有两个操作：
1.**合点**（用ε连接的点可以看作是一个点，也就可以合成为一点），这一步的得到的地位相同的点的集合被叫做ε-closure(S)，其中S是作为出发点的点的集合。
2.**移动**，从合成的点出发，经过可以经过的所有边，经过同一条边能到的点并入新的状态，这一步得到的被并入新状态的点的集合被叫做move(S, x)，其中S是作为出发点的点的集合，x是经过的边的名字

一下是一个具体例子，以便理解

(a|b)*a

先分析这个正则表达式
首先是a|b 表示a，b任选一个
对这个整体有* （闭包，我不懂为什么要这么翻译），表示这样的结构出现的次数大于等于0

然后根据Thompson法对每个结构逐步生成NFA
然后拼在一起

接着我们就可以使用子集构造法了

```
从0出发 合点，发现0，6，1，3，5，7地位相同


所以ε-closure({0})={0，1，3，5，6，7}，我们把它定为DFA的一个状态S0
也就是说S0=ε-closure({0})={0，1，3，5，6，7}

接下来 从 S0 对每个字母算move
对a，发现1可以通过a到2，7可以通过a到8
于是 move(S0,a)={2，8}
同理 move(S0,b)={4}

继续合点
对{2，8}得到ε-closure({2，8})={1，2，3，4，5，6，7，8}，于是我们把它定为DFA的第二个状态S1，这个状态含有终点8，所以是DFA的接受态
同理 ε-closure({4})={1，3，4，5，6，7}，记为S2.

接着  从 S1 对每个字母算move

move(S1, a) 注意到1→2，7→8，所以move(S1, a)={2，8}，而ε-closure({2，8})=S1
也就是说 S1-a->S1，S1形成了自环 

move(S1, b)={4}，而ε-closure({4})=S2
故S1-b->S2

move(S2, a)=S1
得S2 --a--> S1
move(S2, b)
得S2 --b--> S2（自环）

若Sn对字母的转移没有像上面一样恰好映射到Sn中，则可能需要引入死状态∅

从而得到DFA  
 S0 = {6,1,3,5,7}--a--> S1 = {1,2,3,5,6,7,8} (接受)
 S0 = {6,1,3,5,7}--b--> S2 = {1,3,4,5,6,7}

   S1 --a--> S1
   S1 --b--> S2

   S2 --a--> S1
   S2 --b--> S2

```
**DFA最小化** 

s:
上述方法得到的DFA可能有冗余状态
应该找到
逻辑上等价的一组状态，将其合并为一个状态
得到 最小 DFA

上述的S1和S2看似等价，然而S1是接受态，不可能等价
故上述DFA最小化的结果就是
S0 --a--> S1  
S0 --b--> S2 
S1 --a--> S1
S1 --b--> S2
S2 --a--> S1
S2 --b--> S2
其中S1是接收状态

**带入模板得到目标程序**
s:
上述DFA可表示为
delta[0]: a→1, b→2
delta[1]: a→1, b→2
delta[2]: a→1, b→2
以下是根据这个DFA生成的目标程序

```c
#include <stdio.h>
#include <string.h>
#include <stdbool.h>


#define MAX_STATES 100
#define MAX_ALPH 128   // 支持 ASCII 字符作为输入符号

typedef struct {
    int num_states;              // 状态总数
    int alphabet_size;           // 字母表大小
    int start_state;             // 初始状态
    bool accept[MAX_STATES];     // 哪些是接受态
    int delta[MAX_STATES][MAX_ALPH]; // 状态转移表
} DFA;

bool dfa_accepts(DFA *dfa, const char *input) {
    int cur = dfa->start_state;
    for (size_t i = 0; i < strlen(input); i++) {
        unsigned char sym = (unsigned char) input[i];
        if (sym >= dfa->alphabet_size) {
            return false; // 超过字母表范围
        }
        cur = dfa->delta[cur][sym];
    }
    return dfa->accept[cur];
}

// ====== 示例： (a|b)*a ======
// 字母表: a=0, b=1
int main() {
    DFA dfa;
    dfa.num_states = 3;
    dfa.alphabet_size = 2;   // a, b
    dfa.start_state = 0;

    // 初始化接受态
    for (int i = 0; i < MAX_STATES; i++) dfa.accept[i] = false;
    dfa.accept[1] = true; // state 1 是接受态

    // 填写转移表
    // 状态0: a→1, b→2
    dfa.delta[0][0] = 1; // a
    dfa.delta[0][1] = 2; // b
    // 状态1: a→1, b→2
    dfa.delta[1][0] = 1;
    dfa.delta[1][1] = 2;
    // 状态2: a→1, b→2
    dfa.delta[2][0] = 1;
    dfa.delta[2][1] = 2;

    // 测试
    const char *tests[] = {"", "a", "b", "ba", "abb", "aba", "aaa", NULL};
    for (const char **p = tests; *p; p++) {
        printf("%s -> %s\n", *p, dfa_accepts(&dfa, *p) ? "ACCEPT" : "REJECT");
    }
    return 0;
}
```



有了上述，也就有了编写编译器**词法分析器**基本思路

chatGPT：

**每种 token 写成一个正则表达式**

例如在 C 语言里：

* 关键字：`if`、`while`、`for` … → 正则：`if|while|for`
* 标识符：`[a-zA-Z_][a-zA-Z0-9_]*`
* 整数：`[0-9]+`
* 浮点数：`[0-9]+\.[0-9]+`
* 运算符：`\+|\-|\*|/|==|!=|<=|>=`
* 空白符：`\s+`



 **把这些正则合成一个大正则**

方法是把所有正则“并”起来，用“选择” `|`，同时给每个正则打上“优先级标签”。

例如：

```
R = (if)|(while)|(for)|([a-zA-Z_][a-zA-Z0-9_]*)|([0-9]+)|...
```


**用 Thompson 构造法把正则转成 NFA**

对每个子正则单独建 NFA，然后用 ε 边连接在一起。



**用子集构造法把 NFA 转成 DFA**

这样你得到一个能识别**所有 token** 的大 DFA。



**DFA 最小化（可选）**

压缩状态数，提高效率。



**代码实现：DFA 驱动扫描器**

写一个循环，从输入流读字符：

* 根据当前状态和字符查转移表
* 如果无路可走 → 回退，取最长匹配，输出 token
* 根据优先级解决冲突（比如 `if` 既能匹配关键字，也能匹配标识符）

### Flex
Flex 是一个开源工具，用于根据用户定义的正则表达式规则，自动生成 C 或 C++ 语言的词法分析器（Lexer / Scanner）。
它读取一个 .l 或 .lex 后缀的源文件（称为“Flex 描述文件”），输出一个 lex.yy.c 文件 —— 这是一个标准的 C 程序，包含词法分析函数 yylex()。
通常与 Bison（语法分析器生成器，Yacc 的 GNU 版本）配合使用，构成经典的“Flex + Bison”编译器前端工具链。

## 语法分析器
本篇关键词：语法分析器（Parser）,上下文无关文法（CFG）,自顶向下,递归下降,抽象语法树（AST）
*斜体* 表示后文会展开的重要陌生概念
### 语法分析器
s:
对于表达式 int sum = a + 42;
词法分析器给出的Token可能是
[ (KEYWORD, "int"),
  (IDENTIFIER, "sum"),
  (SYMBOL, "="),
  (IDENTIFIER, "a"),
  (SYMBOL, "+"),
  (NUMBER, 42),
  (SYMBOL, ";") ]
词法分析器接受这些Token，判断该Token 序列是否符合*上下文无关文法（CFG）*，并根据该序列构造*语法树*。

### 语法树与抽象语法树
ChatGPT：

#### 1. 语法树 (Parse Tree)

**定义：**
语法树，也称为**具体语法树**（Concrete Syntax Tree, CST），是源代码根据其文法规则解析后生成的树形结构。它完整地反映了源代码的语法结构，包括了所有语法细节，比如括号、分号、关键字等。

**特点：**

*   **保留所有语法细节**：语法树的每个节点都对应文法中的一个产生式规则，叶子节点通常是终结符（如标识符、数字、操作符、括号等）。因此，它包含了源代码中所有的语法元素。
*   **与文法紧密相关**：它的结构直接由语言的上下文无关文法（CFG）决定。不同的文法会产生不同的语法树。
*   **信息冗余**：由于包含了所有语法符号（如 `;`, `{}`, `()` 等），语法树通常比较“臃肿”，包含了很多在后续处理中不必要的信息。
*   **用于语法分析验证**：主要用于验证输入字符串是否符合语法规则。

**示例：**
对于表达式 `2 + 3 * 4`，假设文法如下：
```
Expr → Expr + Term | Term
Term → Term * Factor | Factor
Factor → number
```

其语法树可能如下：
```
        Expr
       / | \
    Expr + Term
     |     / | \
   Term  Term * Factor
    |     |      |
  Factor Factor  4
    |      |
    2      3
```
可以看到，树中包含了每一个非终结符（Expr, Term, Factor）和终结符（2, +, 3, *, 4）。



#### 2. 抽象语法树 (Abstract Syntax Tree, AST)

**定义：**
抽象语法树是语法树的简化版本。它去除了语法树中不重要的细节（如括号、分号、某些非终结符），只保留了程序结构的“本质”信息，更接近程序的逻辑结构。

**特点：**

*   **抽象性高**：省略了像括号、分号、`begin/end` 等不影响程序逻辑的语法符号。
*   **结构更简洁**：节点数量更少，结构更清晰，便于后续处理。
*   **反映程序结构**：更准确地表示了程序的层次结构和语义关系，例如表达式求值顺序、函数调用、变量声明等。
*   **用于语义分析与代码生成**：是编译器进行类型检查、优化、代码生成等阶段的主要数据结构。
*   **独立于具体文法**：多个不同的文法可以生成相同的AST，只要它们描述的是同一种语言结构。

**示例：**
对于同样的表达式 `2 + 3 * 4`，其AST可能如下：
```
      (+)
     /   \
    2    (*)
        /   \
       3     4
```
这里：
- `+` 和 `*` 是内部节点，表示加法和乘法操作。
- `2`, `3`, `4` 是叶子节点，表示操作数。
- 没有出现 `Expr`, `Term`, `Factor` 这样的中间非终结符，也没有括号。
- 树的结构自然地体现了运算优先级（`*` 在 `+` 的子树中，先计算）。

### 上下文无关文法
ChatGPT：


#### 1. 一个上下文无关文法的例子

我们来看一个简单的文法，用来描述简单的算术表达式，比如 `a + a * a` 或 `a`。

这个文法由以下四个组成部分：

*   **非终结符 (Non-terminals)**：`E` （代表一个表达式）
*   **终结符 (Terminals)**：`a`, `+`, `*`
*   **起始符号 (Start symbol)**：`E`
*   **产生式规则 (Production rules)**：
    1.  `E -> E + E`
    2.  `E -> E * E`
    3.  `E -> a`

这个文法的意思是：
*   一个表达式 `E` 可以是一个 `a`。
*   一个表达式 `E` 也可以是两个表达式 `E` 用 `+` 连接起来。
*   一个表达式 `E` 也可以是两个表达式 `E` 用 `*` 连接起来。

例如，我们可以用这个文法推导出字符串 `a + a * a`：
1.  `E` （起始）
2.  `E + E` （应用规则1）
3.  `E + E * E` （对第二个 `E` 应用规则2）
4.  `a + E * E` （对第一个 `E` 应用规则3）
5.  `a + a * E` （对第二个 `E` 应用规则3）
6.  `a + a * a` （对最后一个 `E` 应用规则3）

#### 2. 为什么叫“上下文无关”？

关键就在于“**无关**”这个词。我们来看产生式规则的**形式**。

在上面的文法中，每条规则都是这样的形式：
> **一个非终结符** → **一个符号串**

具体来说：
*   `E -> E + E`
*   `E -> E * E`
*   `E -> a`

注意，**左边**（箭头左边）**总是且只能是一个单独的非终结符**（在这个例子中是 `E`）。

这意味着，当我们在推导过程中看到一个 `E` 时，我们可以**直接**应用任何一条以 `E` 开头的规则来替换它。**我们不需要关心这个 `E` 在什么位置，也不需要关心它周围是什么符号。**

*   在字符串 `E + E` 中，第一个 `E` 可以被替换成 `a`，变成 `a + E`。
*   在字符串 `E * E` 中，第一个 `E` 也可以被替换成 `a`，变成 `a * E`。
*   在字符串 `( E )` 中（如果我们有括号的话），中间的 `E` 仍然可以被替换成 `a`，变成 `( a )`。

**替换 `E` 的规则完全不依赖于 `E` 所处的“上下文”（即它前后的符号是什么）。** 无论 `E` 是在开头、中间、结尾，还是被 `+`、`*` 或其他符号包围，我们都可以用相同的规则来替换它。

#### 3. 对比：上下文有关文法

为了更好地理解“上下文无关”，我们可以想象一个“上下文有关”的情况。假设我们有一个规则：
> `X E Y -> X a Y`

这个规则的意思是：“只有当 `E` 的左边是 `X` 且右边是 `Y` 时，才能把 `E` 替换成 `a`”。

在这种情况下，能否替换 `E` **完全取决于它的上下文**（左边是 `X`，右边是 `Y`）。如果 `E` 的左边不是 `X` 或者右边不是 `Y`，这个规则就不能应用。

而上下文无关文法没有这种限制。规则 `E -> a` 可以在任何地方应用，只要那里有一个 `E`。

>上下文无关文法（Context-Free Grammar, CFG）是由美国著名语言学家和认知科学家**诺姆·乔姆斯基（Noam Chomsky）**在20世纪50年代提出的。
>**诺姆·乔姆斯基 (Noam Chomsky)** 是这一概念的提出者。他在1956年发表了一篇开创性的论文《**Three Models for the Description of Language**》（语言描述的三种模型），在这篇论文中，他系统地提出了**形式语言的层级结构**，后来被称为**乔姆斯基层级（Chomsky Hierarchy）**。
>在这个层级中，他定义了四种类型的文法，其中第二类就是**上下文无关文法（Type-2 Grammar）**。他不仅定义了这种文法，还研究了它们的生成能力、与自动机（如下推自动机）的关系，为计算语言学和计算机科学奠定了坚实的理论基础。
>乔姆斯基提出上下文无关文法主要受到以下几个方面的启发：
>1.**对自然语言结构的深入观察**
>乔姆斯基是一位语言学家，他不满意当时主流的行为主义语言学（如斯金纳的理论），认为语言不仅仅是“刺激-反应”的习惯，而是人类心智中一种**内在的、创造性的规则系统**。
>他观察到：
>*   人类语言具有**无限性**：我们可以理解从未听过的句子。
>*   语言具有**层次化结构**：句子不是单词的简单线性排列，而是有嵌套的短语结构（如“[The cat] [sat [on the mat]]”）。
>*   语言具有**递归性**：一个结构可以包含同类型的子结构（如“他说她认为他错了”）。
>他需要一种**形式化的数学工具**来精确描述这种复杂的、递归的、层次化的语言结构。上下文无关文法正是为此而设计的——它用简单的规则（如 `S → NP VP`）来捕捉句子的深层结构。
>2.**数学与逻辑的启发**
>乔姆斯基深受数学和逻辑学的影响。他将语言视为一种**形式系统**，类似于数学公理系统。他借鉴了：
>*   **递归函数理论**：描述如何通过有限规则生成无限对象。
>*   **自动机理论**：研究抽象计算机器的能力。
>他试图用严格的数学框架来定义“语法”，并研究不同语法模型的**生成能力**和**计算复杂度**。上下文无关文法是他提出的四种模型之一，用于刻画比正则文法（Type-3）更复杂、但又比上下文有关文法（Type-1）更易处理的语言。
>**对早期形式语言研究的继承与发展**
>在他之前，已有学者（如逻辑学家 Emil Post）研究过形式文法和重写系统。乔姆斯基的工作是系统化和分类这些思想，并将其应用于**自然语言**的描述。他将文法从一种数学游戏提升为理解人类语言能力的核心工具。

### 根据CFG设计递归下降语法分析器
s：

#### 对于a+b*(c+d)这个式子

**使用以下文法**：
E → E + T | T
T → T * F | F
F → ( E ) | id

#### 首先我们使用上面的知识分析这个文法



**文法定义**

*   **非终结符 (Non-terminals)**:
    *   `E`: 代表一个**表达式 (Expression)**。
    *   `T`: 代表一个**项 (Term)**。
    *   `F`: 代表一个**因子 (Factor)**。
*   **终结符 (Terminals)**:
    *   `+`, `*`: 加法和乘法运算符。
    *   `(`, `)`: 括号，用于改变运算优先级或分组。
    *   `id`: 代表“标识符”或“基本操作数”，可以理解为变量名（如 `a`, `x`, `count`）或常量（如 `5`, `3.14`）。在实际应用中，`id` 通常由词法分析器（lexer）从输入中识别出来。
*   **起始符号**: `E` (整个输入被认为是一个表达式)。
  

**产生式规则详解**

 1. `E → E + T | T` （表达式规则）

这条规则定义了什么是“表达式”。

*   **`E → E + T`**: 一个表达式可以是一个**表达式**，后面跟着一个 `+` 号，再跟着一个**项**。
    *   **作用**：这允许表达式包含加法运算。
    *   **结合性**：因为 `E` 出现在左边（`E + T`），这表示加法是**左结合**的。例如，`a + b + c` 会被解释为 `(a + b) + c`，而不是 `a + (b + c)`（虽然数学上等价，但语法树结构不同）。
*   **`E → T`**: 一个表达式也可以直接是一个**项**。
    *   **作用**：这是递归的“基础情况”，防止无限递归。它表示一个简单的项（如 `a` 或 `a * b`）本身就是一个有效的表达式。

> **关键点**：这条规则将表达式分解为“表达式 + 项”，而不是“表达式 + 表达式”。这为 `+` 和 `*` 的优先级差异埋下了伏笔。

2. `T → T * F | F` （项规则）

这条规则定义了什么是“项”。

*   **`T → T * F`**: 一个项可以是一个**项**，后面跟着一个 `*` 号，再跟着一个**因子**。
    *   **作用**：这允许项包含乘法运算。
    *   **结合性**：同样，因为 `T` 在左边，乘法也是**左结合**的。例如，`a * b * c` 会被解释为 `(a * b) * c`。
*   **`T → F`**: 一个项也可以直接是一个**因子**。
    *   **作用**：这是项的“基础情况”。

> **关键点**：乘法运算在 `T` 的规则中定义，而加法在 `E` 的规则中定义。`E` 可以包含 `T`，但 `T` 不能直接包含 `E`（除非通过 `F → ( E )`）。这种**分层结构**是实现优先级的核心。

 3. `F → ( E ) | id` （因子规则）

这条规则定义了什么是“因子”。

*   **`F → ( E )`**: 一个因子可以是一个用括号括起来的**表达式**。
    *   **作用**：这允许我们改变运算的优先级。括号内的表达式会被优先计算。
    *   **递归性**：`F` 内部又引用了 `E`，形成了递归，使得括号可以嵌套，如 `(a + (b * c))`。
*   **`F → id`**: 一个因子可以是一个基本的操作数，即 `id`。
    *   **作用**：这是语法的“叶子节点”，所有复杂表达式最终都由 `id` 构成。

> **关键点**：`id` 和括号表达式是构成表达式的最基本单元。

这个文法通过**非终结符的分层**体现了优先级：

1.  **最高优先级**：`id` 和 `( E )`（因子 `F`）
2.  **中等优先级**：`*`（在项 `T` 中定义）
3.  **最低优先级**：`+`（在表达式 `E` 中定义）

**为什么 `*` 优先于 `+`？**

看这个表达式：`a + b * c`

*   `b * c` 必须首先被识别为一个**项 (T)**，因为 `*` 只在 `T` 的规则中出现。
*   然后，`a` 是一个 `id`，所以它是一个 `F`，进而是一个 `T`。
*   最后，`a + (b * c)` 被识别为 `E + T`，即一个表达式。

如果试图把 `a + b` 当作一个整体去乘 `c`，即 `(a + b) * c`，就必须用括号：`F → ( E )`，先让 `a + b` 成为一个 `E`，然后被括号包装成 `F`，再参与乘法。

此外还体现了**结合性**

如前所述，`E → E + T` 和 `T → T * F` 都是**左递归**的（非终结符出现在产生式右边的最左边），这导致了**左结合**。

例如，`a + b + c` 的推导过程：
1.  `E → E + T`
2.  `→ (E + T) + T` （第一个 `E` 再次展开）
3.  `→ (T + T) + T` （`E → T`）
4.  `→ (id + id) + id`

这对应于 `(a + b) + c`。

#### 接着通过类似Parser的伪代码了解parse过程



```python

def parse_E():
    left = parse_T()
    while peek().type == 'PLUS':
        consume('PLUS')
        right = parse_T()
        left = ('binop', '+', left, right)
    return left

def parse_T():
    left = parse_F()
    while peek().type == 'TIMES':
        consume('TIMES')
        right = parse_F()
        left = ('binop', '*', left, right)
    return left

def parse_F():
    if peek().type == 'ID':
        tok = consume('ID')
        return ('id', tok.value)
    elif peek().type == 'LPAREN':
        consume('LPAREN')
        node = parse_E()
        consume('RPAREN')
        return node
    else:
        raise SyntaxError
```
语法分析器分析经过了以下步骤
1. `parse_E()` called
   → 调用 `parse_T()`
2. `parse_T()` called
   → 调用 `parse_F()`
3. `parse_F()` 看到 `ID "a"`，consume，返回 `('id','a')`
   `parse_T()`：下一个 token 不是 `*`，所以返回 `left=('id','a')`
4. `parse_E()`：看到 `PLUS`，consume `+`，准备解析右侧 → 调用 `parse_T()`（解析 `b * (c + d)`）
5. 新的 `parse_T()` 调用 `parse_F()`: 看到 `ID "b"` → 返回 `('id','b')`

   * `parse_T()` 看到下一个是 `TIMES`，consume `*`，继续 `parse_F()`
6. `parse_F()` 看到 `LPAREN`，consume `(`，调用 `parse_E()` 解析括号内 `c + d`

   * 递 `parse_E()` → `parse_T()` → `parse_F()` 返回 `('id','c')`
   * `parse_E()` 看到 `PLUS`，consume `+`，右侧 `parse_T()` 返回 `('id','d')`
   * `parse_E()` 在 `+` 的循环里把左右合并： `('binop', '+', ('id','c'), ('id','d'))`，遇到 `RPAREN` 停止，`parse_E()` 返回该节点。
7. `parse_F()`（括号） consume `)`，并返回子表达式节点 `('binop', '+', c, d)`
8. `parse_T()` 在 `*` 的循环里把左 `('id','b')` 和右 `('binop','+',c,d)` 合并成 `('binop','*', ('id','b'), ('binop','+',c,d))`，返回该节点。
9. 最后外层 `parse_E()` 把 `('id','a')` 和上面乘法节点用 `+` 合并，得到最终 AST：
   `('binop','+', ('id','a'), ('binop','*', ('id','b'), ('binop','+', ('id','c'), ('id','d'))))`

#### 为什么这段伪代码要这么设计？
E → E + T | T
看到这样的文法，我们的第一思路可能是
```py
def parse_E():
    parse_E()  # ← 直接调用自己，无限递归！
    match('+')
    parse_T()
```
然而这段代码无限循环了
这是因为这样的文法存在**左递归**

为了避免这种情况，我们可以像上述伪代码那样用while循环模拟左递归
但更常用的方法是：

#### 消除直接左递归的通用方法

对于形如：
```
A → Aα | β
```
（其中 `β` 是不以 `A` 开头的产生式）

我们可以将其改写为：
```
A  → β A'
A' → α A' | ε
```
例如

原规则：

E → E + T | T
这里 α = + T, β = T

消除左递归后：

E  → T E'
E' → + T E' | ε

由此写出代码即可避免无限循环并保留左结合的特性

### 主流编译器的语法分析器
ChatGPT:

| 编译器       | 语法分析器类型           | 优点                                | 缺点                 |
| --------- | ----------------- | --------------------------------- | ------------------ |
| **gcc**   | Bison 生成的 LALR(1)(自底向上的分析方法) | 自动化程度高，适合传统 C                     | 对复杂语法（C++）扩展性差，维护难 |
| **clang** | 手写递归下降（LL 风格）     | 灵活，代码结构清晰，适合复杂语法（C++、Objective-C） | 写起来更繁琐，容易出 bug     |
### Bison
Bison 读取一个以 .y 或 .yy 为后缀的语法规则文件，自动生成一个语法分析器（Parser）的 C/C++ 代码（通常是 y.tab.c 和 y.tab.h）。
它根据你定义的上下文无关文法（CFG, Context-Free Grammar），构建一个LALR(1)（或可选 LR(1)、GLR）语法分析表，并生成相应的分析函数 yyparse()。

## 手写计算器
我打算先自己手写一个计算器，体会一下
在简单了解了逆波兰式后我有了这样的思路
用两个栈，一个存放数字，一个存放运算符，通过栈的性质实现优先级
这样的计算器实现了整数负数小数以及三角函数的加减乘除运算，且能正确处理运算优先级
然而处理思路和编译器中的可能相差甚远
我想把这一段删掉，但有点不舍，最终保留

代码如下
```c
#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include <math.h>

Stack* StackConstuct(int sizeOfElement){
    Stack *pStack;
    pStack=(Stack*)malloc(sizeof(Stack));
    if(pStack==NULL){
        printf("construct1 error\n");
        return NULL;
        
    }
    pStack->pBase=malloc(STACK_INIT_SIZE*sizeOfElement);
    if(pStack->pBase==NULL){
        free(pStack);
        printf("construct2 error\n");
        return NULL;
    }
    pStack->pTop=pStack->pBase;
    pStack->elementSize=sizeOfElement;
    pStack->stackSize=STACK_INIT_SIZE;
    return pStack;      
}
void StackDestruct(Stack* pStack){
    if(pStack==NULL){
        printf("detruct error\n");
        return;
    }
    free(pStack->pBase);
    free(pStack);
}
Status StackPop(Stack* pStack,void* pElem){
    char *pc;
    if(pStack->pTop==pStack->pBase){
        #if DEBUG
        printf("pop error\n");
        #endif
        return ERROR;
    }else{
        pc=(char*)(pStack->pTop);
        pStack->pTop=pc-pStack->elementSize;
        memcpy(pElem,pStack->pTop,pStack->elementSize);
        return OK;
    }
}
Status StackPush(Stack *pStack, void *pElem) {
     if (pStack == NULL) {
        printf("Stack pointer is NULL, push error\n");
        return ERROR;
    }
    if (pStack->pTop == pStack->pBase) {
        void *newBase = realloc(pStack->pBase, (pStack->stackSize + STACK_INCREMENT) * pStack->elementSize);
        if (newBase == NULL) {
            printf("Memory allocation failed during push for empty stack or stack resize, push error\n");
            return ERROR;
        }
        pStack->pBase = newBase;
        pStack->pTop = (char *)pStack->pBase; 
        pStack->stackSize += STACK_INCREMENT;
    }
    if ((char *)pStack->pTop - (char *)pStack->pBase >= pStack->stackSize * pStack->elementSize) {
        void *newBase = realloc(pStack->pBase, (pStack->stackSize + STACK_INCREMENT) * pStack->elementSize);
        if (newBase == NULL) {
            return ERROR;
        }
        pStack->pBase = newBase;
        pStack->pTop = (char *)pStack->pBase + pStack->stackSize * pStack->elementSize;
        pStack->stackSize += STACK_INCREMENT;
    }

    memcpy(pStack->pTop, pElem, pStack->elementSize);
    pStack->pTop = (char *)pStack->pTop + pStack->elementSize;
    return OK;
}
Status GetTop(Stack *pStack, void *pElem) {
    if (pStack == NULL ) {
        printf("gettop error\n");
        return ERROR;
    }
    void *topAddr = (void *)((char *)pStack->pTop - pStack->elementSize);
    memcpy(pElem, topAddr, pStack->elementSize);
    return OK;
}
Bool IsEmpty(Stack *pStack) {
    return (pStack->pTop == pStack->pBase);
}


Status Calculate(char expression[],double* result){
    if(IsLegal(expression)){
    Stack *pNumberStack;
    pNumberStack=StackConstuct(sizeof(double));
    
    Stack *pOperatorStack;
    pOperatorStack=StackConstuct(sizeof(char));

    char bottomOfOpeStack='#';
    StackPush(pOperatorStack,&bottomOfOpeStack);

    AddZero(expression);

    ProcessExpression(expression,pNumberStack,pOperatorStack);

    GetTop(pNumberStack,result);
    
    StackDestruct(pNumberStack);
    StackDestruct(pOperatorStack);

    return OK;

    }else{
        return ERROR;
    }
}
Bool IsLegal(char expression[]){
        int len = strlen(expression);
    for (int i = 0; i < len; i++) {
        char c = expression[i];
        if (isdigit(c)) {
            continue;
        } else if (c == '+' || c == '-' || c == '*' || c == '/' || c == '(' || c == ')') {
            continue;
        } else if (strncmp(expression + i, "tan", 3) == 0 && (i + 3 == len ||!isalnum(expression[i + 3]))) {
            i += 2;  
            continue;
        } else if (strncmp(expression + i, "sin", 3) == 0 && (i + 3 == len ||!isalnum(expression[i + 3]))) {
            i += 2;
            continue;
        } else if (strncmp(expression + i, "cos", 3) == 0 && (i + 3 == len ||!isalnum(expression[i + 3]))) {
            i += 2;
            continue;
        }else if(c=='.') {
            if(isdigit(expression[i+1])){
                continue;
            }else{
                return FALSE;
            }
        } else {
            return FALSE;
        }
    }
    return TRUE;
}
void AddZero(char expression[]) {
    int len = strlen(expression);
    for (int i = 0; i < len; i++) {
        if (expression[i] == '-') {
            if (i == 0 || expression[i - 1] == '(' || expression[i - 1] == '+' || expression[i - 1] == '-' || expression[i - 1] == '*' || expression[i - 1] == '/') {
                for (int j = len; j > i; j--) {
                    expression[j] = expression[j - 1];
                }
                expression[i] = '0';
                len++;  
                i++;    
            }
        }
    }
}
void ProcessExpression(char expression[],Stack* pNumberStack,Stack* pOperatorStack){
    int len = strlen(expression);
    char numBuffer[100];
    int numBufferIndex = 0;
    int i=0;
    while (i < len) {
        if (isdigit(expression[i]) || expression[i] == '.') {
            numBuffer[numBufferIndex++] = expression[i++];
            while (i < len && (isdigit(expression[i]) || expression[i] == '.')) {
                numBuffer[numBufferIndex++] = expression[i++];
            }
            numBuffer[numBufferIndex] = '\0';
            double num = atof(numBuffer);
            StackPush(pNumberStack, &num);
            #if DEBUG
            printf("push number %lf\n",num);
            #endif
            numBufferIndex = 0;  
        } else {
            char op = expression[i];
            if(op==')'){
                char flag='.';
                int j=0;
                while(flag!='(' ){
                    if(flag=='#'){
                        break;
                    }
                    CalUnary(pNumberStack,pOperatorStack);
                    GetTop(pOperatorStack,&flag);
                    j++;
                    #if DEBUG
                    printf("Now flag is %c\n",flag);
                    if(j>5){
                        printf("endless loop in )\n");
                        break;
                    }
                    #endif
                }
                if(flag!='#'){
                char bin='.';
                StackPop(pOperatorStack,&bin);
                }
            }else if(op=='s' || op=='c' || op=='t'){
                ProcessTri(expression,pNumberStack,&i);
                #if DEBUG
                printf("i here is%d\n",i);
                #endif
            }else if(op=='('){
                StackPush(pOperatorStack,&op);
                #if DEBUG
                printf("push operator %c  expect(\n",op);
                #endif
            }else if(op=='+' || op=='-' || op=='*' || op=='/')
            {
                char OperatorTop='.';
                int topPri;
                int OpePri;
                GetTop(pOperatorStack,&OperatorTop);
                OpePri=GetPriority(op);
                topPri=GetPriority(OperatorTop);
                if(OpePri>topPri){
                    StackPush(pOperatorStack, &op);
                    #if DEBUG
                    printf("push operator %c\n",op);
                    #endif
                }else{
                    CalUnary(pNumberStack,pOperatorStack);
                    StackPush(pOperatorStack,&op);
                    #if DEBUG
                    printf("push operator %c\n",op);
                    #endif
                }
            }else{
                #if DEBUG
                printf("Error.\nIllegal input for %c.\n",op);
                #endif
                break;
            }
            i++;
        }
    }
    #if DEBUG
    printf("Reading has done.All the element have been pushed into stack\n");
    #endif
    char sign='.';
    int count =0;
    GetTop(pOperatorStack,&sign);
    while(sign!='#'){
        CalUnary(pNumberStack,pOperatorStack);
        GetTop(pOperatorStack,&sign);
        
        #if DEBUG
        count ++;
        printf("Now sign is:%c\n",sign);
        if(count>5){
            printf("endless loop in while\n");
            break;
        }
        #endif
    }
    #if DEBUG
    printf("Processing has done.Waiting for output\n");
    #endif
}
int GetPriority(char Operator) {
    switch (Operator) {
        case '+':
            return 1;
        case '-':
            return 2;
        case '*':
            return 3;
        case '/':
            return 4;
        case '#':
            return -1;
        default:
            return 0; 
    }
}
void CalUnary(Stack* pNumberStack,Stack* pOperatorStack){
    double a=0.0;
    char tempOperator='.';
    double b=0.0;
    double tempresult;
    StackPop(pNumberStack,&b);
    StackPop(pOperatorStack,&tempOperator);
    StackPop(pNumberStack,&a);
    switch(tempOperator){
        case '+':
            tempresult=a+b;
            break;
        case '-':
            tempresult=a-b;
            break;
        case '*':
            tempresult=a*b;
            break;
        case '/':
            if(b==0){
                printf("Error.\nDevived by zero.\n1/");
            }
            tempresult=a/b;
            break;
        case '(':
            tempresult=b;
        }
    StackPush(pNumberStack,&tempresult);
    #if DEBUG
    printf("Perform a unary operation.tempresult=%lf,temoperator=%c\n",tempresult,tempOperator);
    #endif
}

void ProcessTri(char expression[],Stack* pNumberStack,int* beginning){
    int len =strlen(expression);
    int count=0;
    int paraflag=0;
    int i=*beginning;
    #if DEBUG
    printf("i in tri is %d\n",i);
    #endif
    int end=0;
    char triExpression[MAX_LENGHTH];
    for(int j=3;j+i<len;j++){
        if(expression[i+j]=='('){
                    count++;
                    paraflag=1;
        }
        if(expression[i+j]==')'){
                    count--;
        }
        triExpression[j-3]=expression[i+j];
        if(count==0 && paraflag==1){
            triExpression[j-2]='\0';
            #if DEBUG
            printf("j==%d\n",j);
            #endif
            end=i+j;
            *beginning=end;
            #if DEBUG
            printf("end here is %d\n",end);
            printf("beginning here is %d\n",*beginning);
            #endif
            break;
        }
    
    }
    double pararesult=0.0;
    Calculate(triExpression,&pararesult);
    double result=0.0;

    switch (expression[i])
    {
    case 't':
        result=tan(pararesult);
        break;
    case 's':
        result=sin(pararesult);
        break;   
    case 'c':
        result=cos(pararesult);
        break;
    default:
        break;
    }
    #if DEBUG
    printf("result in Tri:%lf\n",result);
    #endif
    StackPush(pNumberStack,&result);
    #if DEBUG
    printf("tri push is OK,result=%lf\n",result);
    #endif
    
}
```
## 使用Flex和Bison实现计算器
我打算从简单的做起，先在ai的帮助下做一个只支持两个整数相加的计算器，借助这个熟悉流程和语法
然后再自己独立做一个更完善的计算器

### 只支持两位加法
在linux环境下
首先编写add.l
```
%{
#include "add.tab.h"
%}

%%

[0-9]+      { yylval = atoi(yytext); return NUMBER; }
"+"         { return '+'; }
\n          { return '\n'; }
[ \t]       { /* 忽略空格 */ }

%%
```
然后编写add.y
```
%{
#include <stdio.h>
#include <stdlib.h>

int yylex(void);
int yyerror(char *s);
%}


%token NUMBER

%%
input:
      expr '\n'   { printf("= %d\n", $1);YYACCEPT; }
    ;

expr:
      NUMBER '+' NUMBER   { $$ = $1 + $3; }
    ;
%%

int main(void) {
    return yyparse();
}

int yyerror(char *s) {
    fprintf(stderr, "Error: %s\n", s);
    return 0;
}
```
**在add.l中：**

其中 add.tab.h 是之后用bison生成的，看了一下
其中有：
token 的枚举（NUMBER ）

yylval 的类型（默认是 int）

语法分析器的入口函数 yyparse()

剩下的一些我现在看不懂的宏

底下的语法规则是识别一个或多个数字，用atoi函数把字符串转换成int，再把这个整数传给yylval

[ \t]       { /* 忽略空格 */ }
表示匹配空格和tab {}里什么都不做，相当于跳过去了    

**在add.y中**
```
%{
#include <stdio.h>
#include <stdlib.h>

int yylex(void);
int yyerror(char *s);
%}
```
这一部分会原封不动地搬到add.tab.c中，写上必要的头文件，支持printf,atoi等函数

%token NUMBER
声明NUMBER词法符号

下面是语法规则部分，类似于CFG的产生式
后面跟着这个式子reduce之后进行的动作
比如：
```
input:
      expr '\n'   { printf("= %d\n", $1); YYACCEPT;}
    ;

```
在该规则被reduce时，打印expr的值，并且结束解析

然后用以下命令生成add目标文件
```bash
bison -d add.y
flex add.l
gcc -o add add.tab.c lex.yy.c -lfl
```
成功，程序可以接受:1+1[回车]
返回:=2

我尝试在ai的帮助下阅读flex和bison生成的C语言源文件

然而我没想到这么简单的运算最后生成的代码竟然这么多，我也看不太懂，只能是ai说什么就认为是什么了
### 四则运算括号优先级的计算器
接下来我要给计算器做以下拓展：
1.支持多个整数的运算
2.支持减乘除
3.支持括号
4.正确处理优先级

首先 在.l文件中加入
```
"-"         {return  '-'; }
.           { return yytext[0]; } 
```
支持减号
用.接受* /()，返回接收到的第一个字符
同时将.y中的产生式结构改为三层
```
expr:
    expr '+' term { $$ = $1 + $3; }
  | expr '-' term { $$ = $1 - $3; }
  | term { $$ = $1; }

term:
    term '*' factor { $$ = $1 * $3; }
  | term '/' factor { $$ = $1 / $3; }
  | factor { $$ = $1; }

factor:
    '(' expr ')' { $$ = $2; }
  | NUMBER { $$ = $1; }
```
在factor层实现括号的计算，从而将括号设置为最高优先级
同理term层实现+-

编译
经过测试，程序完整的实现了上述功能

这个计算器还有一些不足
1.不能正确处理负数
2.不能正确处理小数

### 支持负数的计算器
经过思考，我意识到 作为负数的-号
1.优先级比+-*/更高（在C语言中-2\*-3是合法的，结果为6）
2.优先级比括号更低，-(2+3)=-5 （这种说法似乎不准确，应该是-和（相遇时先把（里的看作一个整体）
因此我在
```
factor:
    '(' expr ')' { $$ = $2; }
  | NUMBER { $$ = $1; }
```
中直接加入   
```
| '-' factor          { $$ = -$2; }
```
从而正确处理

### 支持小数的计算器
我觉得首先.l文件中的数字识别部分要改，改成支持小数输入的正则，同时不能再使用atoi函数
```
[0-9]+(\.[0-9]+)?   { yylval.val = atof(yytext); return NUMBER; } 
```
这里yylval由int变成了联合体其中包含了double val ，所以要改为yylval.val

其次是NUMBER要识别成double
然而具体改的时候我有点无从下手
在ai的帮助下
我进行了以下修改：
```

%union {
    double val;
}


%token <val> NUMBER
%type  <val> expr term factor

%%
```
联合体定义了所有之后可能用到的类型

接下来再用
```
<val\>
```
定义终结符和非终结符的类型
最后把printf改过来

最后的程序成功地通过了检验

## 最终版本的计算器
cal.l
```
%{
#include "calculator.tab.h"
%}

%%

[0-9]+(\.[0-9]+)?   { yylval.val= atof(yytext); return NUMBER; }
"++"        { return INCR; }
"&*"        { return ANDMUL; }
"|*"        { return ORMUL; }
"&"         { return '&'; }
"|"         { return '|'; }
"^"         { return '^'; }
"<<"        { return LSHIFT; }
">>"        { return RSHIFT; }
"+"         { return '+'; }
"-"         { return '-'; }
"*"         { return '*'; }
"/"         { return '/'; }
"("         { return '('; }
")"         { return ')'; }
\n          { return '\n'; }
[ \t]       {  }
.           { return yytext[0]; }  

%%

```

cal.y
```
%{
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

int yylex(void);
int yyerror(char *s);
%}

%union {
    double val;
}

%token <val> NUMBER
%token INCR ANDMUL ORMUL
%token LSHIFT RSHIFT
%type  <val> expr term factor


%left '|' 
%left '^'
%left '&'
%left LSHIFT RSHIFT
%left '+' '-'
%left '*' '/'
%left INCR ANDMUL ORMUL
%right UMINUS

%%

input:
      expr '\n'   { printf("= %lf\n", $1); YYACCEPT;}
    ;

expr:
    expr '+' term       { $$ = $1 + $3; }
  | expr '-' term       { $$ = $1 - $3; }
  | expr '|' term       { $$ = (long)$1 | (long)$3; }
  | expr '^' term       { $$ = (long)$1 ^ (long)$3; }
  | expr '&' term       { $$ = (long)$1 & (long)$3; }
  | expr LSHIFT term    { $$ = (long)$1 << (long)$3; }
  | expr RSHIFT term    { $$ = (long)$1 >> (long)$3; }
  | expr INCR term      { $$ = $1 + ($3 + 1); }
  | expr ANDMUL term    { $$ = ((long)$1 & (long)$3) * $3; }
  | expr ORMUL term     { $$ = ((long)$1 | (long)$3) * $3; }
  | term                { $$ = $1; }
  ;

term:
    term '*' factor { $$ = $1 * $3; }
  | term '/' factor { $$ = $1 / $3; }
  | factor          { $$ = $1; }
  ;

factor:
    '(' expr ')' { $$ = $2; }
  | NUMBER       { $$ = $1; }
  | '-' factor   %prec UMINUS { $$ = -$2; }
  ;

%%

int main(void) {
    return yyparse();
}

int yyerror(char *s) {
    fprintf(stderr, "Error: %s\n", s);
    return 0;
}
```
这个计算器：
支持浮点运算
在处理位运算将浮点强制转换成long
支持 (a ++ b) ::= a + (b + 1)
    (a &* b) ::= (a & b) * b
    (a |* b) ::= (a | b) * b
使用%prec UMINUS和%right UMINUS保证-号的正确性