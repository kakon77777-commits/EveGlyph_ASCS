# 03｜原生可計算數學：超越 LaTeX 字串的語義物件、執行與投影模型

**English Title:** Native Computational Mathematics Beyond LaTeX: Semantic Objects, Execution, Binding, Assumptions, and Projection in EveGlyph

**作者：** Neo.K  
**機構：** EveMissLab / 一言諾科技有限公司  
**版本：** v0.1  
**日期：** 2026-08-24  
**文件類型：** 專題論文 / Formal Architecture Paper  
**系列定位：** EveGlyph Addressable Symbolic Computational Space Series — Paper 03  
**前置錨點：** Paper 00 — From Linear Documents to Addressable Symbolic Computational Spaces；Paper 01 — Addressable Symbolic Object Model；Paper 02 — Spatial Syntax and Infinite Canvas Computation

---

## Canonical Source Note

本文件以 UTF-8 Markdown 保存正式原稿。數學 source 僅使用 `$...$` 與 `$$...$$` 作為 canonical delimiter。

這個選擇只服務目前的人類可讀原稿與既有工具鏈；本文所定義的 future native mathematical object **不以 LaTeX source 作為 canonical mathematical ontology**。因此，本文件在 chat／Markdown 中出現的公式只是本文所討論數學物件的一種 projection。

本文亦不主張 LaTeX、MathML、OpenMath、OMDoc、CAS expression tree 或 theorem-prover term 應被單一新格式取代。相反地，本文提出一個上層的 **Native Computational Mathematics Object Model, NCM**，讓既有格式成為 importer、exporter、renderer、interchange profile 或 proof/computation backend。

因此：

$$
\text{mathematical object}
\neq
\text{LaTeX source}
\neq
\text{rendered glyphs}
\neq
\text{execution result}.
$$

---

## 摘要

數位數學工具長期存在一個結構性錯位：人類看到的是二維數學符號，計算機收到的卻常是描述這些符號如何排版的線性字串。LaTeX 對高品質排版極其成功，但當它被進一步充當公式的 canonical source、計算輸入、語義識別與版本比較基礎時，表示層、語義層與執行層容易被混在一起。例如，同一個偏導數可以被多種 LaTeX 寫法排成幾乎相同的畫面；同一串可見符號又可能在不同 domain、scope 或 binding 下具有不同意義。單靠字串或視覺相等，無法穩定回答「這個公式是什麼」、「哪些變數被綁定」、「在哪個 domain 上成立」、「使用了哪些假設」、「這個近似值的精度與 rounding mode 是什麼」、「這個結果如何被算出或證明」等問題。

MathML、OpenMath、OMDoc 與計算代數／定理證明系統早已分別證明：數學可以有 presentation 與 content 的區分，數學物件可以被機器可讀地表示，甚至可附帶 theory、proof 與 document-level knowledge。2026 年的 MathML 4 Working Draft 仍同時處理 mathematical notation 與 mathematical content，而 OpenMath 2.0 Revision 2 明確以「表示與交換數學物件的語義」為核心。本文不是忽略這些成熟工作，而是將其分層思想與 Paper 00–02 的 addressable object、revision DAG、infinite canvas、spatial grammar、provenance 與 native execution 統一到 EveGlyph 的一般數學物件模型中。

本文提出 **Native Computational Mathematics, NCM**。一個 NCM object 不只是 expression tree，而是一個可定址、可版本化的 mathematical object，其 intrinsic state 至少能分離：semantic expression graph、binding/scoping、type/domain、assumptions、constraints、units/dimensions、numeric exactness/precision、presentation hints、execution bindings 與 provenance anchors。二維數學排版可以透過 Paper 02 的 spatial grammar 解析為 candidate semantics；LaTeX、Presentation MathML 或手寫輸入亦可透過 importer 產生 candidate NCM；但任何 ambiguous interpretation 都允許以 unresolved state 留存，而不是被 parser 或生成式 AI 強迫選成唯一含義。

本文進一步建立數學相等關係族：surface equality、structural equality、alpha-equivalence、definitional/canonical equivalence、theorem-backed equivalence 與 approximate numerical equivalence，禁止把 renderer equality 或 decimal equality 偷換成 formal semantic equality。對計算，本文定義結果不是單一 value，而是：

$$
Eval(M,\Gamma,\Pi)
\rightarrow
(R,\Delta,\rho,\chi),
$$

其中 $R$ 為結果物件，$\Delta$ 為衍生狀態／新物件，$\rho$ 為 provenance trace，$\chi$ 為條件、警告、未定義或未解決狀態。這使「結果成立需要什麼前提」與「顯示了什麼數字」不再被混在一起。

本文最後凍結二十項 Native Math invariants 與十八個 conformance tests，並定義 MVP-01 的最小 native-math vertical slice。核心結論是：未來 EveGlyph 不需要讓使用者放棄傳統數學排版；它只需要讓排版退回 projection，使真正的 canonical state 成為一個可計算的數學對象。

**關鍵詞：** Native Computational Mathematics、LaTeX、MathML、OpenMath、OMDoc、Semantic Math、Binding、Assumptions、Exact Arithmetic、Mathematical Object、EveGlyph、Symbol IR、Computational Document

---

## Abstract

Digital mathematics still frequently conflates three distinct concerns: mathematical meaning, mathematical notation, and textual serialization. LaTeX is exceptionally successful as a typesetting language, but a typesetting-oriented source string is not necessarily an adequate canonical ontology for executable, versioned, semantically addressable mathematics. Equivalent formulas may have different LaTeX sources, identical visual forms may encode different semantics under different scopes or domains, and numerical outputs may conceal assumptions, undefined cases, approximations, precision, or provenance.

This paper proposes **Native Computational Mathematics (NCM)** for the EveGlyph Addressable Symbolic Computational Space. An NCM object is a persistent, versioned mathematical object whose intrinsic state separates semantic expression structure, binding and scope, types and domains, assumptions and constraints, units and dimensions, exact and approximate numeric states, presentation hints, execution bindings, and provenance anchors. LaTeX, MathML, OpenMath, and other mathematical encodings remain important interoperability and projection layers, but none is required to be the sole canonical ontology of an EveGlyph mathematical object.

The model supports multiple non-equivalent notions of equality, including surface equality, structural equality, alpha-equivalence, canonical or definitional equivalence, theorem-backed equivalence, and approximate numerical equivalence. Mathematical parsing is modeled as an interpretation process that may remain ambiguous or unresolved. Computation produces not merely a displayed value but a result object, derived state, provenance trace, and explicit conditions or exceptional states. The paper also connects native mathematics to spatial syntax: two-dimensional notation on an infinite canvas can be parsed into candidate mathematical structure under declared local grammars without making screen coordinates themselves the final mathematical meaning.

The resulting architecture allows the same mathematical object to be rendered as traditional notation, exported to LaTeX or MathML, exchanged through semantic formats such as OpenMath, executed by multiple backends, checked by proof systems, addressed in the workspace, and versioned without collapsing its identity into any single textual representation.

---

# 1. 問題：數學不是它的排版字串

## 1.1 線性 source 與二維 notation 的歷史折衷

傳統文字檔案天然適合序列：

$$
S=(c_1,c_2,\ldots,c_n).
$$

而數學 notation 經常是二維甚至具有複雜 scope：

$$
\frac{\partial f}{\partial x},
$$

$$
\sum_{i=1}^{n} a_i,
$$

$$
\int_{0}^{1} f(x)\,dx,
$$

矩陣、分段函數、上下標、根號、張量指標、交換圖與 proof diagram 更直接使用空間結構。

LaTeX 的歷史功績，是以線性語法高效描述這些排版。然而若系統將：

$$
\text{LaTeX string}
$$

同時當成：

- identity；
- semantics；
- computation input；
- equality basis；
- provenance；
- presentation；

就會產生層次混淆。

## 1.2 同義不同字串

同一個數學結構可能有不同 textual forms。例如空白、macro、parentheses、notation style、implicit multiplication 與自訂 command 都可能改變 source，而不改變 intended semantics。

因此：

$$
source_1\neq source_2
$$

不推出：

$$
meaning_1\neq meaning_2.
$$

## 1.3 同形不同義

反過來，畫面相同也可能不同義。

例如：

$$
f(x)
$$

可能是 function application；某些 domain 中相同 glyph arrangement 也可能代表 multiplication、indexing 或自訂 operator syntax。

又例如：

$$
i
$$

可以是普通變數，也可以在特定 context 中指 imaginary unit。

因此：

$$
projection_1=projection_2
$$

不推出：

$$
semantics_1=semantics_2.
$$

## 1.4 原生數學的目標

NCM 的目標不是讓人類手寫 AST，而是讓系統內部承認：

> 使用者真正操作的是 mathematical object；notation 是 object 的 projection / editing surface。

因此：

$$
\boxed{
\text{Mathematical Meaning}
\rightarrow
\text{Native Math Object}
\rightarrow
\text{many projections / executions}
}
$$

而不是：

$$
\boxed{
\text{LaTeX string}
\rightarrow
\text{parse again whenever meaning is needed}
}.
$$

---

# 2. 既有標準已經證明 presentation/content 分離是成熟方向

## 2.1 MathML

MathML Core 的目標是讓瀏覽器原生處理數學 notation；MathML 4 則明確同時支援 mathematical notation 與 mathematical content。這代表現有 Web 標準本身就不把「畫面長什麼樣」與「數學是什麼」視為完全相同的問題。

NCM 吸收這個方向，但不要求 EveGlyph canonical state 必須就是某段 XML。MathML 可以作為：

$$
Adapter_{MathML}:NCM\leftrightarrow MathML_{subset}.
$$

## 2.2 OpenMath

OpenMath 的核心就是 representation and communication of mathematical objects，並強調 encode meaning rather than only visual representation。

因此 OpenMath 是 NCM 最接近的既有語義互通參照之一。

但 NCM 還需額外處理 EveGlyph 特有需求：

- ASOM persistent identity；
- revision DAG；
- spatial editing；
- unresolved interpretation；
- local execution bindings；
- provenance；
- workspace relation graph；
- projection hints；
- AI proposal / authority boundary。

因此關係是：

$$
\text{OpenMath semantic object interoperability}
\subseteq
\text{NCM interoperability surface},
$$

而不是宣稱 OpenMath 本身不足或應被淘汰。

## 2.3 OMDoc

OMDoc 將 semantic mathematics 提升到 statements、theories、proofs 與 mathematical documents。這提醒 NCM：公式不能永遠被當成孤立 expression。

因此 NCM 必須允許數學物件與：

- definition；
- theorem；
- proof；
- assumption；
- theory；
- dataset；
- algorithm；
- experiment；

建立 first-class relations。

## 2.4 CAS 與 theorem prover

電腦代數系統與定理證明器長期使用 expression tree、term、typed term、symbol table、rewrite rule 與 proof object。這些實作再次說明：真正執行數學時，系統通常早已超越「純排版字串」。

NCM 的工作不是重造 CAS，而是建立一個 **workspace-level mathematical object contract**，讓多種 CAS、numeric engine、proof engine 與 renderer 可以共用同一個可定址數學物件。

---

# 3. NCM 的基本對象

令一個 ASOM persistent math object 為：

$$
O_i^{math}=(i,\texttt{math},H_i).
$$

其某一 revision 為：

$$
M_{i,v}
=
(i,v,G,\Beta,\Tau,\Gamma,\mathcal A,\mathcal C,\mathcal U,\mathcal N,\mathcal P,\mathcal X,\mathcal M).
$$

其中：

- $G$：semantic expression graph；
- $\Beta$：binding and scope structure；
- $\Tau$：type/domain information；
- $\Gamma$：symbol environment / context references；
- $\mathcal A$：assumptions；
- $\mathcal C$：constraints / side conditions；
- $\mathcal U$：units / dimensional structure；
- $\mathcal N$：numeric exactness / precision state；
- $\mathcal P$：presentation hints / notation preferences；
- $\mathcal X$：execution bindings；
- $\mathcal M$：metadata / provenance anchors。

這不是 TW-01 的最終 wire schema，而是 Paper 03 的 semantic decomposition。

最重要的設計是：

$$
G
$$

不必包含畫面 pixel coordinates；

$$
\mathcal P
$$

也不必決定 mathematical truth。

---

# 4. Semantic Expression Graph

## 4.1 為什麼不是只叫 AST

樹結構適合許多 expression，但數學環境常有：

- shared subexpressions；
- references；
- recursive definitions；
- named constants；
- external theorem references；
- graph-like dependency。

因此 NCM 使用一般化 attributed graph：

$$
G=(N,E,\lambda,\eta).
$$

其中：

- $N$：node set；
- $E$：typed edges；
- $\lambda$：node labels / operators；
- $\eta$：node attributes / semantic references。

特定 expression 可限制成 tree/DAG，但 model 本身不強迫所有數學都是 tree。

## 4.2 最小 node families

NCM 至少需要概念上支援：

1. `literal`；
2. `symbol`；
3. `application`；
4. `binder`；
5. `relation`；
6. `collection`；
7. `piecewise`；
8. `matrix/tensor`；
9. `reference`；
10. `hole/unresolved`；
11. `annotation`；
12. `external-semantic-object`。

例如：

$$
f(x)+1
$$

不必 canonicalize 成字串 `f(x)+1`，而可以是：

$$
Apply(+,[Apply(f,[x]),1]).
$$

真正 serialization 由 TW-01 決定。

---

# 5. Binding 與 Scope 是數學本體的一部分

## 5.1 變數名稱不等於變數 identity

考慮：

$$
\int_0^1 x^2\,dx.
$$

積分內的 $x$ 是 bound variable。

若只用 visible string `x` 當 identity，就容易與外部同名自由變數混淆。

NCM 因此要求 binding relation：

$$
Bind(b,x,scope).
$$

或等價的 binder structure。

## 5.2 Alpha-equivalence

例如：

$$
\int_0^1 x^2\,dx
$$

與：

$$
\int_0^1 y^2\,dy
$$

在適當條件下應該 alpha-equivalent。

因此：

$$
M_1\equiv_{\alpha}M_2
$$

可以成立，即使 visible symbol names 不同。

## 5.3 Capture avoidance

任何 substitution：

$$
Substitute(M,x\mapsto E)
$$

都必須遵守 capture-avoiding semantics。

因此 serializer/parser 不得把 binding information 丟失後再靠字串猜測。

## 5.4 Scope 與 Paper 02 region

Canvas 上的 region scope 可以提供 symbol environment，但 visual containment 不直接等於 binder。

即：

$$
Inside_{geo}(x,R)
\not\Rightarrow
BoundBy(x,b).
$$

只有 math grammar / explicit semantic structure 能建立 binding。

---

# 6. Type、Domain 與 Operator Meaning

## 6.1 同一 glyph 在不同 domain 可不同義

加號：

$$
+
$$

可能作用於：

- integers；
- reals；
- complex numbers；
- matrices；
- vectors；
- polynomials；
- abstract groups；
- custom algebraic objects。

因此 operator node 至少需要 semantic reference / dispatch context。

可表示為：

$$
op=(symbolRef,typeSignature,theoryRef).
$$

## 6.2 Domain information

一個 expression 的 type/domain judgement 可寫為：

$$
\Gamma\vdash M:T.
$$

NCM 不強迫單一 type theory，但要求 type/domain 資訊可被保存、查詢與版本化。

## 6.3 Unknown type 是合法狀態

在創作初期，系統可能只有：

$$
\Gamma\vdash M:?
$$

這不是錯誤；它是 unresolved type state。

AI 或 inference engine 可以提出候選，但：

$$
TypeCandidate
\neq
CommittedType.
$$

---

# 7. Assumptions 與 Constraints 必須是一級結構

## 7.1 很多數學等式只在條件下成立

例如：

$$
\sqrt{x^2}=|x|
$$

對 real $x$ 與 complex branch convention 的處理不同。

又例如：

$$
\frac{x^2-1}{x-1}=x+1
$$

需要：

$$
x\neq1.
$$

若系統只輸出右側而丟掉 side condition，就改變了命題。

## 7.2 Assumption set

定義：

$$
\mathcal A=\{a_1,a_2,\ldots,a_n\}.
$$

例如：

$$
x\in\mathbb R,
$$

$$
x>0.
$$

## 7.3 Constraint set

定義：

$$
\mathcal C=\{c_1,c_2,\ldots,c_m\}.
$$

constraint 可以是：

- domain restriction；
- nonzero condition；
- convergence condition；
- branch choice；
- dimensional compatibility；
- shape constraint；
- boundary condition。

## 7.4 計算結果不能偷丟條件

若 backend 得到：

$$
R
$$

只在 $\chi$ 成立時有效，則 NCM result 應保存：

$$
(R,\chi).
$$

而不是只保存 $R$。

---

# 8. Exact、Approximate、Precision 與 Rounding

## 8.1 字面 `0.1` 並不足以描述 numeric semantics

`0.1` 可以是：

- exact decimal rational $1/10$；
- binary floating-point approximation；
- measured value；
- interval midpoint；
- arbitrary precision decimal。

因此 numeric node 不應只保存 display string。

## 8.2 Numeric state

本文定義抽象 numeric descriptor：

$$
\mathcal N=(kind,value,precision,error,rounding,provenance).
$$

其中 `kind` 可以包含：

- integer；
- rational；
- algebraic exact；
- symbolic exact；
- float；
- decimal；
- interval；
- complex approximate；
- measured/uncertain。

## 8.3 Exactness 不得被 renderer 改寫

例如 exact：

$$
\frac13
$$

投影成：

$$
0.333333
$$

時，projection 不得讓 canonical numeric object 變成有限 decimal approximation。

因此：

$$
Projection_{decimal}(Exact(1/3))
\neq
Mutation(Approx(0.333333)).
$$

## 8.4 Approximate equality

近似比較必須帶 metric/tolerance：

$$
a\approx_{\epsilon}b.
$$

不得把：

$$
a\approx_{\epsilon}b
$$

偷換成：

$$
a\equiv_{formal}b.
$$

---

# 9. Units 與 Dimensions

## 9.1 單位不是文字後綴

例如：

$$
3\ \mathrm{m}
$$

若 `m` 只是一段文字，系統無法穩定進行 dimension checking。

NCM 應允許 unit semantic reference：

$$
Quantity(value,unitRef).
$$

## 9.2 Dimension judgement

可定義：

$$
Dim(M)=d.
$$

例如：

$$
Dim(v)=L/T.
$$

## 9.3 Dimension mismatch

對：

$$
3\ \mathrm{m}+5\ \mathrm{s},
$$

系統應返回 typed diagnostic，而不是僅按字串拼接。

## 9.4 單位系統也是 context

同一 mathematical object 可在不同 display profile 中使用不同 unit projection，但 canonical quantity semantics 可保持一致。

---

# 10. Undefined、Partial、Conditional 與 Unresolved 是合法數學狀態

傳統 UI 常傾向讓任何輸入都有一個值，但數學不是總函數世界。

## 10.1 Undefined

例如：

$$
\frac10
$$

在通常實數／複數 field semantics 中是 undefined。

應有：

$$
ResultStatus=Undefined(reason).
$$

## 10.2 Conditional

例如 symbolic integration 可能只有在 parameter 條件下給出特定形式。

應有：

$$
ResultStatus=Conditional(\chi).
$$

## 10.3 Unresolved

如果 importer 不知道 `f x` 是 multiplication 還是 application，可保留：

$$
UnresolvedInterpretation(\{I_1,I_2\}).
$$

## 10.4 Unevaluated

某 expression 合法，但 backend 不支援或不值得展開：

$$
Unevaluated(M,reason).
$$

這四者不得被混成一個 generic error。

---

# 11. Presentation Plan：排版仍然重要，但不是 ontology

## 11.1 Presentation hints

NCM 不應因為語義優先就丟掉人類 notation 偏好。

同一 semantic object 可以有：

$$
\mathcal P=(notationStyle,parenthesisPolicy,operatorForm,layoutHints,labels).
$$

例如 derivative 可顯示成：

$$
\frac{df}{dx},
$$

$$
f'(x),
$$

或 operator node。

## 11.2 Presentation hint 不改 mathematical identity

若只更改：

$$
f'(x)
\rightarrow
\frac{df}{dx}
$$

且 semantics 未變，persistent math identity 可以保持不變，semantic content 亦可等價；是否產生新的 revision 由 ASOM intrinsic boundary / presentation-version policy 決定。

Paper 03 建議：**presentation hint 可版本化，但不應被誤認為 semantic expression graph 本身。**

## 11.3 Accessibility projection

同一 NCM object 可產生：

- visual notation；
- speech / aural math；
- linear text description；
- Braille adapter；
- structural tree view。

所以 NCM 的價值也包含 accessibility：不再必須從排版 glyph 逆推出結構。

---

# 12. LaTeX 在 NCM 中的新位置

## 12.1 Import

LaTeX importer：

$$
I_{TeX}:S_{TeX}\rightharpoonup Candidate(NCM).
$$

注意是 partial map，因為任意 TeX macro programming 並不天然等於可完整恢復的數學 semantics。

## 12.2 Export

LaTeX exporter：

$$
E_{TeX}:NCM\rightarrow S_{TeX}.
$$

同一 NCM object 可以有多個合法 TeX outputs：

$$
E_{TeX}^{(1)}(M)\neq E_{TeX}^{(2)}(M),
$$

但兩者都 render/represent 同一 intended math object。

## 12.3 LaTeX fidelity profile

Importer/exporter 應宣告：

$$
Fidelity\in\{semantic,structural,presentation,lossy,unknown\}.
$$

並記錄 unresolved macro、unsupported package semantics 與 dropped annotations。

## 12.4 LaTeX 不再是 canonical hash 的必要輸入

NCM content hash 應基於 canonical semantic object，而不是基於任意 TeX source formatting。

因此兩個語義等價的 supported TeX imports 可以 canonicalize 到同一 structural/semantic content address，即使原 source 不同。

---

# 13. MathML、OpenMath 與 NCM 的互通

## 13.1 Presentation MathML

Presentation MathML 主要服務 notation/layout，適合作為 NCM projection/interchange view。

## 13.2 Content MathML

Content-oriented representation 更接近 NCM semantic graph，可作為 supported subset 的高 fidelity adapter。

## 13.3 OpenMath

OpenMath symbol/content dictionary 模型可對接 NCM operator semantic reference 與 theory reference。

可定義：

$$
Map_{OM}:NCM_{subset}\leftrightarrow OpenMath.
$$

## 13.4 不要求一對一覆蓋

NCM workspace-specific fields，例如：

- persistent ID；
- revision DAG；
- canvas placement；
- local AI provenance；
- execution cache；

不必硬塞進每個外部 math standard。

因此 adapter 的原則是：

$$
\text{math semantics interoperability}
\neq
\text{workspace state identity}.
$$

---

# 14. 二維數學與 Paper 02 Spatial Syntax

## 14.1 二維 notation 可以是 editing syntax

使用者在 math region 中畫／放置：

- numerator；
- fraction bar；
- denominator；

spatial grammar 可以解析候選：

$$
Fraction(A,B).
$$

但 canonical result 應成為 semantic node，例如：

$$
Divide(A,B)
$$

或 domain-specific rational construction。

坐標本身不是最終数学 meaning。

## 14.2 Superscript ambiguity

$$
x^2
$$

通常是 exponentiation，但某些 notation 中 superscript 可表示：

- tensor index；
- derivative marker；
- label；
- conjugation；
- group action notation。

因此 spatial parser：

$$
Parse_{math}(layout)
\rightarrow
\{I_1,\ldots,I_n\}
$$

可以保留 ambiguity，再由 domain/context resolve。

## 14.3 Matrix parsing

矩陣 visual grid 可解析為：

$$
Matrix([a_{ij}],m,n),
$$

而不是把每個 cell 的 pixel coordinate 當 canonical order。

## 14.4 Spatial editing 與 semantic object round-trip

NCM renderer：

$$
R_{canvas}(M,\mathcal P)
\rightarrow
Layout.
$$

使用者對 layout 的結構性編輯再透過 grammar 轉回 semantic mutation：

$$
Edit(Layout)
\rightarrow
CandidateMutation(M).
$$

只有 validate/commit 後才產生新 math revision。

---

# 15. Mathematical Equality 不是單一 `==`

NCM 延續 Paper 01 的 equality family。

## 15.1 Surface equality

$$
M_1\equiv_{surface,\Pi}M_2
$$

表示特定 renderer 下看起來相同。

它最弱，不推出 semantics 相同。

## 15.2 Structural equality

$$
M_1\equiv_{struct}M_2
$$

表示 canonical expression graph 結構一致。

## 15.3 Alpha-equivalence

$$
M_1\equiv_{\alpha}M_2
$$

允許 bound variable renaming。

## 15.4 Canonical / definitional equivalence

對有 normalization $N_{\Theta}$ 的 theory：

$$
M_1\equiv_{def,\Theta}M_2
\iff
N_{\Theta}(M_1)=N_{\Theta}(M_2).
$$

## 15.5 Theorem-backed equivalence

若 proof system 產生 certificate $\pi$：

$$
\pi:\Theta\vdash M_1=M_2,
$$

則：

$$
M_1\equiv_{proof,\Theta,\pi}M_2.
$$

## 15.6 Approximate numerical equivalence

$$
M_1\approx_{metric,\epsilon}M_2.
$$

它不得冒充 formal equality。

## 15.7 Equality provenance

若系統 UI 顯示「等價」，應能回答：

- structural？
- alpha？
- rewrite normalization？
- theorem prover？
- numeric tolerance？
- heuristic CAS simplification？

所以 equality verdict 本身也是可追蹤 computation result。

---

# 16. Native Evaluation Contract

## 16.1 Evaluation 不是 `string -> string`

本文定義：

$$
Eval(M,\Gamma,\Pi)
\rightarrow
(R,\Delta,\rho,\chi).
$$

其中：

- $M$：input math object revision；
- $\Gamma$：symbol/type/domain context；
- $\Pi$：execution policy / backend profile；
- $R$：result math/data object；
- $\Delta$：新建／更新的 derived objects or relations；
- $\rho$：execution provenance；
- $\chi$：conditions/status/diagnostics。

## 16.2 Backend profile

$\Pi$ 至少可描述：

- engine name/version；
- exact vs numeric mode；
- precision；
- timeout/resource limit；
- simplification policy；
- branch convention；
- assumptions；
- trusted/untrusted status。

## 16.3 Result identity

計算結果預設是 derived object：

$$
O_R\xleftarrow{derivedFrom}O_M.
$$

而不是直接覆寫 input object identity。

## 16.4 Re-evaluation

若 backend version 或 policy 改變：

$$
\Pi_1\neq\Pi_2,
$$

系統可以保留兩個 result objects / revisions，並比較：

$$
R_1,R_2.
$$

這對 reproducibility 非常重要。

---

# 17. Simplification 必須保留語義條件

## 17.1 Rewrite rule

一個 rewrite：

$$
r:(L\rightarrow R)\mid\chi
$$

其中 $\chi$ 是 side condition。

## 17.2 Unsafe simplification

如果執行：

$$
\frac{x}{x}\rightarrow1
$$

卻沒有記錄：

$$
x\neq0,
$$

就不是語義保真的 rewrite。

## 17.3 Rewrite trace

每個 canonical/important transformation 可保存：

$$
Trace=(ruleID,input,output,conditions,engineVersion).
$$

## 17.4 Cosmetic normalization 與 semantic simplification 分離

例如排序顯示 terms 與實際運用 commutativity theorem 不必被同一機制處理。

Presentation reordering：

$$
\Pi(M)
ightarrow\Pi'(M)
$$

不必改 semantic graph。

真正 rewrite：

$$
M\rightarrow M'
$$

則應產生 mathematical transformation provenance。

---

# 18. Proof 與 Computation 的關係

## 18.1 計算結果不是自動證明

CAS 輸出一個 expression：

$$
R
$$

不必然構成 formal proof。

因此 provenance 應標記：

$$
EvidenceClass\in\{computed,verified,proved,assumed,heuristic,external\}.
$$

## 18.2 Proof object / certificate

若 backend 能產生 proof certificate：

$$
\pi:\Theta\vdash P,
$$

可建立：

$$
ProofObject(\pi)
$$

並 relation：

$$
proves(\pi,P).
$$

## 18.3 Cross-check

同一 result 可由：

- CAS；
- numerical engine；
- theorem prover；
- independent backend；

分別產生 evidence。

NCM 可以把這些 evidence 掛在同一 mathematical claim 上，而不必把它們混成單一字串註解。

---

# 19. Caching 與 Memoization 不得污染數學 identity

## 19.1 Cache key

execution cache 可以基於：

$$
K=H(mathContent,context,assumptions,policy,engineVersion).
$$

## 19.2 Cache 不是 truth

cache hit 只表示相同 execution contract 已有結果，不表示結果已被正式證明。

## 19.3 Projection cache 更弱

KaTeX/SVG/raster render cache 只服務 projection：

$$
Cache_{render}
$$

不得成為 semantic content source。

---

# 20. Mathematical Addressing

Paper 01 的六層 address 在 math object 中具體化。

## 20.1 Persistent address

$$
a^{id}(M)=i.
$$

## 20.2 Content address

基於 canonical semantic state：

$$
a^{content}=H(D_m\Vert C_{\sigma}(SemanticState(M))).
$$

## 20.3 Semantic address

可指向：

- theory symbol；
- theorem；
- operator；
- concept；
- formal ontology node；
- partial PSSA-like address。

## 20.4 Spatial address

指 math object 在 canvas/region 的 placement，而不是公式本身的 mathematical identity。

## 20.5 Physical address

指 serialization / storage location。

## 20.6 Revision address

指特定 math revision。

## 20.7 Subexpression address

Paper 03 額外提出 path-like subobject address：

$$
a^{sub}=(a^{ver},path/schemaRef).
$$

用來穩定指向某 revision 內的 subexpression。

但若 expression rewrite 後 path 改變，系統需要 provenance mapping，而不能假裝 path 永久 persistent。

---

# 21. Canonicalization of Native Math

## 21.1 Canonicalization 不等於 simplification

這是非常重要的區分。

Canonical serialization：

$$
C_{\sigma}(M)
$$

只需要讓同一 abstract object 有 deterministic bytes。

Semantic simplification：

$$
S_{\Theta}(M)
$$

可能使用代數法則改寫 expression。

因此一般情況：

$$
C_{\sigma}(M)
\neq
C_{\sigma}(S_{\Theta}(M))
$$

是完全正常的。

## 21.2 Alpha-normalization

canonicalization 可以合法處理 bound variable representation，例如 de Bruijn-style index 或 deterministic binder IDs，以避免純名稱差異造成不必要 hash 變化。

但具體方案留給 TW-01。

## 21.3 Commutative canonicalization 的風險

對：

$$
a+b
$$

與：

$$
b+a,
$$

即使在某 theory 中等價，也不一定應被 byte-canonicalization 自動排序成完全相同 representation，因為：

- 原始 human intent / presentation order 可能有價值；
- operator 未必在所有 domain commutative；
- rewrite equality 與 structural identity 是不同層。

因此 Paper 03 禁止「為了 hash 去隨意做數學 theorem rewrite」。

---

# 22. Import Ambiguity 與 AI

## 22.1 來源可能是 LaTeX、手寫、OCR、圖像、自然語言或 Canvas

Importer：

$$
I_s(source,context)
\rightarrow
\{(M_1,q_1),\ldots,(M_n,q_n)\}.
$$

## 22.2 低信心不強制 commit

若：

$$
q_{max}<\theta,
$$

系統可以建立：

$$
UnresolvedMathObject.
$$

## 22.3 AI 是 interpretation proposer

AI 可以：

- 猜測 operator meaning；
- 補 type；
- 建議 assumptions；
- 解讀自訂 notation；
- 轉 LaTeX；
- 轉 semantic graph。

但：

$$
AIProposal
\neq
CanonicalMathCommit.
$$

重要結構必須經 schema/domain validator 或 user/authorized-agent commit。

## 22.4 不確定性要保留下來

如果某符號有三個可能解讀，保留三候選比強迫一個錯解更符合 NCM。

這與 Paper 02 ambiguous spatial parse、PSSA unresolved semantic address 是同一設計哲學。

---

# 23. Native Math 的 Object Lifecycle

## 23.1 Create

$$
CreateMath(candidate)
\rightarrow
(O_i,M_{i,v_0}).
$$

## 23.2 Semantic Edit

修改 operator/operand/binding/assumption：

$$
M_{i,v_1}\rightarrow M_{i,v_2}.
$$

persistent identity 可保持：

$$
i_{v_1}=i_{v_2}.
$$

## 23.3 Presentation Edit

只改 notation/presentation hints，可依 policy 產生 presentation revision，但不應自動宣稱 semantic graph 改變。

## 23.4 Clone

$$
Clone(M_i)\rightarrow M_j,
$$

其中：

$$
i\neq j
$$

但初始 semantic content 可相同。

## 23.5 Derive

例如 derivative：

$$
D_x(M_i)\rightarrow M_j.
$$

$j$ 是新 persistent object，並保存：

$$
derivedFrom(M_j,M_i).
$$

## 23.6 Replace-by-equivalent 不等於 identity merge

若 proof 證明 $M_a=M_b$，仍不表示兩個 persistent workspace objects 是同一 identity。

因此：

$$
M_a\equiv_{proof}M_b
\not\Rightarrow
M_a\equiv_{id}M_b.
$$

---

# 24. 可執行數學與安全邊界

## 24.1 純數學 expression 不一定有副作用

理想 symbolic evaluation 可是 pure：

$$
M\mapsto R.
$$

但實際 backend 可能：

- 呼叫外部程式；
- 讀資料；
- 執行自訂 code；
- 啟動 numerical solver；
- 使用 GPU；
- 載入 plugin。

所以 math execution 仍受 TW-03 runtime permission model 管理。

## 24.2 Data dependency 與 code execution 分離

一個 mathematical object 可以引用 dataset，但 dataset reference 不代表任意 code permission。

## 24.3 Reproducibility

execution provenance 至少要能回答：

- input revision；
- backend；
- backend version；
- policy；
- assumptions；
- precision；
- timestamp / environment fingerprint；
- result revision。

---

# 25. 二十項核心不變量

以下構成 Paper 03 的 design freeze。

## M1 — Semantic Object / Projection Separation

$$
M\neq\Pi(M).
$$

任何單一 LaTeX/MathML/SVG/PNG projection 不等於 mathematical object 本身。

## M2 — LaTeX Non-Canonicality

LaTeX 可以是正式 source artifact 的當前文件載體與 interchange adapter，但 future native math content identity 不以任意 LaTeX source bytes 為唯一 canonical basis。

## M3 — Binding Preservation

任何會改變 free/bound variable 關係的轉換都屬 semantic mutation；合法 substitution 必須 capture-avoiding。

## M4 — Alpha-Equivalence Distinction

bound variable renaming 可產生 alpha-equivalent object，但不得僅以 surface string equality 判定。

## M5 — Type/Domain Explicitness

type/domain 可未知，但不得在需要 domain-sensitive operator semantics 時被默默假設且不記錄。

## M6 — Assumption Preservation

任何 rewrite/evaluation 若依賴 assumptions，結果必須保留或引用該 assumption set。

## M7 — Side-Condition Preservation

conditional equivalence/transformation 不得丟失 side conditions。

## M8 — Exactness Preservation

exact numeric object 被近似 projection 顯示時，不得因此改變 canonical exactness。

## M9 — Precision/Rounding Provenance

任何 approximate numeric result 必須可追蹤 precision/rounding/error policy 或等價資訊。

## M10 — Unit/Dimension Semantics

unit/dimension 不只是 display suffix；可計算 quantity 必須能由 semantic layer辨識其 units/dimensions。

## M11 — Undefined Is a First-Class State

undefined、conditional、unresolved、unevaluated 不得全部 collapse 成 generic text error。

## M12 — Equality Is Typed

surface、structural、alpha、formal/proof、approximate equality 不得互相偷換。

## M13 — Canonicalization Is Not Theorem Simplification

canonical byte normalization 與 semantic rewrite/simplification 必須分離。

## M14 — Execution Produces Provenance

任何 committed evaluation result 必須可追溯 input revision、backend/policy 與 output/result relation。

## M15 — Result Does Not Overwrite Source Identity by Default

計算衍生結果預設取得新 identity 或新 result revision/relation，不默認把 source math identity 改成 result。

## M16 — Ambiguity Preservation

Importer/spatial parser/AI 無法唯一判定 semantics 時，unresolved candidate set 是合法 canonical state。

## M17 — Spatial Layout Is Editing Syntax, Not Final Mathematical Ontology

math region 的二維座標可參與 parse，但 canonical math semantics 不依賴 viewport coordinates。

## M18 — External Standards Remain Adapters

MathML/OpenMath/LaTeX/OMDoc 等保持 first-class interoperability roles，不被不必要地封閉或破壞。

## M19 — Proof/Computation Evidence Distinction

computed、verified、proved、heuristic evidence 必須可區分。

## M20 — Semantic Revision / Persistent Identity Separation

數學 expression 被編輯後可以是同 persistent math object 的新 revision；semantic equality 也不等於 persistent identity equality。

---

# 26. Conformance Tests

## T1 — Two TeX sources, one supported semantic object

對 supported subset 的兩個不同 LaTeX sources，若 importer resolve 到相同 native semantics，要求 semantic structural comparison 可相等，而原始 source artifact 仍可分別保存。

## T2 — Same rendering, different binding

建立兩個 visually identical expression，但 binder references 不同。要求：

$$
\equiv_{surface}
$$

可成立，但：

$$
\equiv_{struct}
$$

或 semantic equivalence 不得被自動宣告。

## T3 — Alpha-equivalence

$$
\int_0^1 x^2\,dx
$$

與：

$$
\int_0^1 y^2\,dy
$$

在同 domain/profile 下應被 alpha-equivalence checker 判為等價。

## T4 — Capture avoidance

substitution 不得把自由變數意外變成 bound variable。

## T5 — Domain-sensitive operator

同一 `+` glyph 在 scalar 與 matrix domain 中必須解析到可區分的 operator/type context，或保持 unresolved。

## T6 — Side condition

對：

$$
\frac{x^2-1}{x-1}\rightarrow x+1,
$$

結果必須保存：

$$
x\neq1.
$$

或 equivalent domain restriction。

## T7 — Exact-to-decimal projection

exact $1/3$ 被顯示成有限 decimal 時，content exactness 不變。

## T8 — Approximate result metadata

數值積分結果必須保存 precision/tolerance/backend policy。

## T9 — Unit mismatch

$$
3\mathrm m+5\mathrm s
$$

必須產生 dimension diagnostic，而非成功 numeric addition。

## T10 — Undefined state

$$
1/0
$$

在 standard field profile 下回傳 `Undefined` object/status，而不是字串 `Infinity`，除非選定的 extended domain/profile 明確定義不同語義。

## T11 — Ambiguous superscript

未指定 domain 的 superscript notation 若可有多種解讀，系統可保留多候選，不強制 commit exponentiation。

## T12 — LaTeX export round trip profile

NCM supported subset export 成 LaTeX，再 import 時必須達到宣告的 structural/semantic fidelity；若 loss，必須 report。

## T13 — OpenMath/Content MathML adapter

對受支援 semantic subset，adapter 應保留 operator identity、argument order、binding 與 literal semantics。

## T14 — Equality evidence label

CAS heuristic 說兩 expression 等價時，不得在 UI/API 中冒充 theorem-proved equality，除非有 proof/certificate backend。

## T15 — Spatial fraction compile

math region 中 numerator/bar/denominator 經 parse+commit 後產生 native Divide/Fraction semantic object；移動畫布整體位置不改該 semantics。

## T16 — Result provenance

執行 derivative：

$$
D_x(x^2)\rightarrow2x
$$

必須能追蹤 source revision、operator/backend、result revision 與 assumptions。

## T17 — Backend version divergence

兩 backend/version 產生不同 simplification forms時，兩結果均保留 provenance，不 silent overwrite。

## T18 — Canonicalization does not commute-sort blindly

對未宣告 commutative 的 operator，canonicalizer 不得為了 hash 任意重排 operands。

---

# 27. MVP-01 的最小 Native Math Slice

MVP 不需要先做完整 CAS。只需證明 native object contract。

## 27.1 Native expression object

至少支援：

- symbol；
- integer/rational literal；
- addition；
- multiplication；
- power；
- function application；
- derivative operator。

## 27.2 Binding

至少支援一個 binder，例如 lambda、sum 或 integral 中的一種，以證明 bound variable 不只是 visible name。

## 27.3 Assumptions

至少能附：

$$
x\in\mathbb R
$$

與：

$$
x\neq0.
$$

## 27.4 Exact arithmetic

至少證明：

$$
1/3
$$

可以保持 exact，不因顯示 decimal 而 mutation。

## 27.5 Native execution

至少能執行：

$$
f(x)=x^2
$$

到：

$$
D_x(f)=2x.
$$

內部計算不得要求先把 canonical object轉回 LaTeX 再 parse。

## 27.6 Multiple projections

同一 math object 至少可有：

- traditional visual projection；
- linear/debug structural projection；
- LaTeX export。

最好再加入 MathML/OpenMath 之一的 minimal adapter。

## 27.7 Spatial math region

Paper 02 的 math region 至少支援一個二維 construct，例如 fraction 或 superscript，並 parse 成 NCM object。

## 27.8 Provenance

result object 要能顯示：

- input ID/revision；
- operation；
- backend；
- output ID/revision。

若上述八項成立，MVP 即能證明：

$$
\boxed{
\text{math object}
\neq
\text{LaTeX source}
}
$$

不只是哲學口號，而是工程事實。

---

# 28. 對 Paper 04 — Generative Glyph 的接口

Paper 04 會處理自訂 visual glyph 如何成為 symbol object。

Paper 03 為其提供 mathematical semantic attachment point：

$$
GlyphObject
\xrightarrow{denotes}
MathOperator/Symbol.
$$

同一 operator 可有多個 glyph/projection：

$$
Glyph_1\mapsto op,
$$

$$
Glyph_2\mapsto op.
$$

反過來，同一 glyph geometry 在不同 local grammar/domain 可以指向不同 semantic candidates。

因此：

$$
\text{glyph identity}
\neq
\text{operator semantic identity}.
$$

這個分離對未來「使用者自己畫數學符號」尤其重要。

---

# 29. 對 Paper 05 — Multi-Layer Addressing 的接口

Paper 05 將深入展開：

- mathematical persistent address；
- semantic theory/symbol address；
- subexpression address；
- proof object address；
- execution result address；
- cross-version subexpression mapping；
- external OpenMath/MathML/URI mapping。

Paper 03 已凍結一個重要前提：

$$
\text{subexpression location}
$$

不能只依賴可變的 visible character offset。

未來應以 revision-aware structural address / node identity / provenance mapping 解決。

---

# 30. 對 TW-01 — Symbol IR 的工程接口

TW-01 必須把本文抽象模型轉為真正 schema，至少回答：

1. math node kind registry；
2. operator semantic reference 格式；
3. symbol identity 與 visible name 分離方式；
4. binder/bound-variable representation；
5. type/domain representation；
6. assumptions/constraints schema；
7. units/dimensions schema；
8. exact/approx numeric schema；
9. undefined/conditional/unresolved states；
10. presentation hints；
11. execution binding references；
12. content canonicalization；
13. alpha-normalization；
14. subexpression addressing；
15. MathML/OpenMath/LaTeX adapter fidelity metadata。

---

# 31. 對 TW-03 — Runtime 的工程接口

TW-03 必須回答：

1. math backend plugin API；
2. symbolic vs numeric execution profile；
3. precision/resource sandbox；
4. result caching；
5. rewrite trace；
6. proof/certificate backend；
7. backend trust labels；
8. concurrent math edits；
9. spatial math parser scheduling；
10. error/undefined/conditional UI；
11. computation provenance ledger；
12. deterministic validation boundary。

---

# 32. 非主張

本文不主張：

1. LaTeX 沒有價值；
2. 所有人都應停止手寫 LaTeX；
3. MathML/OpenMath/OMDoc 應被 EveGlyph 私有格式取代；
4. 所有數學都有唯一 canonical normal form；
5. 所有 semantic equivalence 都可判定；
6. 所有 CAS simplification 都是 formal proof；
7. 所有數學符號都有唯一跨文化、跨理論含義；
8. AI 可以可靠猜出所有手寫／自訂 notation；
9. 空間座標本身就是數學 ontology；
10. exact arithmetic 可以取代所有 numerical computing；
11. theorem prover 可以取代所有 numerical/symbolic engine；
12. 一個 expression tree 足以表示全部數學知識；
13. NCM v0.1 已凍結完整數學宇宙 ontology；
14. native math 必須綁定單一 programming language 或 CAS。

本文主張的是更有限但更基礎的一件事：

> **在 AI-native computational workspace 中，mathematical object 應該成為 first-class canonical object，而 LaTeX 與其他 notation/serialization 則成為可互通的 projection 與 adapter。**

---

# 33. Paper 03 Design Freeze

完成本文後，後續文件不得在未顯式修訂的情況下破壞以下決策：

1. native math object 與任意單一 presentation/serialization 分離；
2. future NCM canonical math semantics 不以 LaTeX source bytes 作為唯一 ontology；
3. expression graph、binding、type/domain、assumptions、constraints、units、numeric state、presentation、execution/provenance 分離；
4. bound variable identity 與 visible variable name 分離；
5. alpha-equivalence 是正式 equality 類型；
6. assumptions 與 side conditions 不得在 rewrite/evaluation 中被靜默丟失；
7. exact/approximate numeric states 分離；
8. approximate result 必須帶 precision/error/rounding 或等價 provenance；
9. units/dimensions 進入 semantic layer；
10. undefined/conditional/unresolved/unevaluated 是 distinct first-class states；
11. surface/structural/alpha/formal/proof/approximate equality 分離；
12. canonical serialization 與 theorem-based simplification 分離；
13. computation result 需有 provenance，且預設不覆寫 source identity；
14. proof evidence 與 computation evidence 分離；
15. ambiguous import/parse 可以保持 unresolved；
16. spatial notation 可作 editing syntax，但 canonical math semantics 不依賴 viewport coordinates；
17. MathML/OpenMath/LaTeX/OMDoc 保留互通角色；
18. subexpression addressing 必須 revision-aware，而不能只依賴 character offset；
19. AI-generated interpretation 預設是 candidate，不是 canonical truth；
20. Native Math MVP 必須證明 computation 可直接作用於 NCM object，而不是依賴「轉 LaTeX 再 parse」作為 canonical execution path。

---

# 34. 結論

LaTeX 解決的是一個非常成功、非常重要的問題：如何用文字工具精確描述高品質數學排版。它之所以被廣泛使用，不是因為歷史錯誤，而是因為它在自己的問題域極其有效。

但 AI-native computational workspace 問的是另一個問題。

它需要知道的不只是：

> 「這個公式要怎麼排？」

而是：

> 「這個數學物件是什麼？」

> 「哪些符號是 free，哪些被 binder 綁定？」

> 「它在哪個 domain/theory 中？」

> 「依賴哪些 assumptions？」

> 「這個 rewrite 有什麼 side conditions？」

> 「這個數字是 exact 還是 approximate？」

> 「這個結果由哪個 backend、哪個版本、哪個 policy 產生？」

> 「這個等價是畫面相同、結構相同、alpha-equivalent、CAS 判定、還是有 theorem proof？」

> 「它可以如何被投影成 LaTeX、MathML、OpenMath、Canvas、語音或其他形式？」

如果 canonical source 只有排版字串，這些問題每次都需要重新推理、重新 parse、重新猜測。

NCM 的方向是把這些關係直接提升成數學物件本身的一部分：

$$
\boxed{
\text{Native Math}
=
\text{Semantic Structure}
+
\text{Binding}
+
\text{Context}
+
\text{Conditions}
+
\text{Execution}
+
\text{Provenance}
}
$$

而 notation 變成：

$$
\boxed{
\text{Notation}
=
\text{Projection / Editing Surface}
}
$$

這不是「消滅 LaTeX」。恰恰相反，它讓 LaTeX 回到最擅長的位置，並且仍可長期保留。

未來 EveGlyph 的使用者甚至不必知道內部 NCM schema。他可以：

- 打字；
- 手寫；
- 貼 LaTeX；
- 拉一條 fraction bar；
- 畫自訂 glyph；
- 讓 AI 協助解讀；
- 從 MathML/OpenMath 匯入；

而系統真正 commit 的，是經過解析與驗證的 native mathematical object。

於是：

$$
\text{Human Notation}
\leftrightarrow
\text{Native Math Object}
\leftrightarrow
\text{Computation / Proof}
$$

才成為主循環。

Paper 00 把文件從字串提升成可定址計算空間；Paper 01 解決「物件是誰」；Paper 02 解決「空間何時成為 syntax」；Paper 03 則完成下一個關鍵轉換：

$$
\boxed{
\text{formula as text}
\rightarrow
\text{mathematics as object}
}
$$

有了這個基礎，Paper 04 才能真正處理更進一步的問題：**如果符號本身也不必受限於現成 Unicode 字元，那麼人類或 AI 新畫出的 glyph，如何被編譯、定址、賦予語義，並成為 NCM 或其他 computational domain 的一級符號？**

---

# References

[1] W3C Math Working Group. *MathML Core*. Candidate Recommendation Snapshot, 24 June 2025.

[2] W3C Math Working Group. *Mathematical Markup Language (MathML) Version 4.0*. Working Draft, 04 June 2026.

[3] The OpenMath Society. *The OpenMath Standard, Version 2.0 Revision 2*. 2019.

[4] Michael Kohlhase. *OMDoc — An Open Markup Format for Mathematical Documents [Version 1.2]*. Lecture Notes in Computer Science 4180. Springer, 2006.

[5] Bruno Buchberger et al. “Theorema: Towards computer-aided mathematical theory exploration.” 2006.

[6] Fairouz Kamareddine and J. B. Wells. “Computerizing Mathematical Text with MathLang.” 2008.

[7] EveMissLab. *00 — From Linear Documents to Addressable Symbolic Computational Spaces*. v0.1, 2026.

[8] EveMissLab. *01 — Addressable Symbolic Object Model: Identity, Content, Semantics, Relations, Versioning, and Equality in Computational Documents*. v0.1, 2026.

[9] EveMissLab. *02 — Spatial Syntax and Infinite Canvas Computation: From Geometric Arrangement to Verifiable Executable Structure*. v0.1, 2026.

[10] EveMissLab. *Generative Symbol Compiler Lab v1.13.0-strict-symbolic*. validated source baseline, 2026.

[11] EveMissLab. *PSSA-BSAR v0.1 Milestone 4 Source*. controlled address-first semantic recovery harness, 2026.

---

# Appendix A — 最小形式化摘要

Persistent math object：

$$
O_i^{math}=(i,\texttt{math},H_i).
$$

Math revision：

$$
M_{i,v}
=
(i,v,G,\Beta,\Tau,\Gamma,\mathcal A,\mathcal C,\mathcal U,\mathcal N,\mathcal P,\mathcal X,\mathcal M).
$$

Expression graph：

$$
G=(N,E,\lambda,\eta).
$$

Typing：

$$
\Gamma\vdash M:T.
$$

Evaluation：

$$
Eval(M,\Gamma,\Pi)
\rightarrow
(R,\Delta,\rho,\chi).
$$

Theorem-backed equality：

$$
\pi:\Theta\vdash M_1=M_2.
$$

Approximate equality：

$$
M_1\approx_{metric,\epsilon}M_2.
$$

Content address：

$$
a^{content}=H(D_m\Vert C_{\sigma}(SemanticState(M))).
$$

Subexpression address：

$$
a^{sub}=(a^{ver},path/schemaRef).
$$

Spatial interpretation：

$$
Parse_{math}(Layout)
\rightarrow
\{(M_i,q_i)\}_{i=1}^{n}.
$$

LaTeX import/export：

$$
I_{TeX}:S_{TeX}\rightharpoonup Candidate(NCM),
$$

$$
E_{TeX}:NCM\rightarrow S_{TeX}.
$$

---

# Appendix B — Implementation-facing Checklist

在 TW-01 / TW-03 / MVP-01 正式實作 Paper 03 前，至少必須回答：

1. math node IDs 是否在 revision 內穩定？
2. symbol visible name 與 semantic identity 如何分離？
3. binder 用 named variables、unique IDs、de Bruijn indices 或其他方案？
4. alpha-normalization 如何 deterministic？
5. expression graph 是否允許 shared subexpression？
6. operator/theory reference 如何映射 OpenMath content dictionary / local namespace？
7. unresolved operator 如何表示？
8. type/domain 系統是否 extensible？
9. assumptions 與 constraints 是否分不同 authority level？
10. unit/dimension schema 是否使用外部 registry？
11. exact rational、arbitrary precision、float、interval 如何表示？
12. rounding mode / precision / error bound 如何保存？
13. undefined、conditional、unevaluated、unresolved 的 wire representation？
14. presentation hints 是否進 semantic content hash？若部分進，邊界如何定義？
15. LaTeX source artifact 是否可作 provenance attachment 而非 math identity？
16. MathML/OpenMath adapter 支援哪些 subset？
17. importer fidelity report schema？
18. semantic equality service API 如何回報 evidence class？
19. rewrite trace 如何保存 side conditions？
20. proof certificate 如何掛接 claim？
21. execution backend plugin contract？
22. backend version/resource policy 如何進 cache key？
23. result object identity policy？
24. subexpression address 在 rewrite 後如何 map？
25. math region spatial grammar 的 candidate/commit UI？
26. AI interpretation 如何標 confidence 與 authority？
27. 哪些 transformation 必須由 deterministic validator 重驗？
28. canonicalization 如何避免偷做 theorem simplification？
29. native math debug view 如何顯示 graph/binding/type/assumption？
30. MVP 如何證明不需要把 NCM object 先轉成 LaTeX 才能計算？

Paper 03 不要求現在把整個數學 ontology 寫完；它要求後續任何實作都不能把「native math」退化回「換了一個名字的公式字串」。
