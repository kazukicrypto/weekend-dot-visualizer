/* ===========================================================
   ボードゲーム 代表作カタログ
   -----------------------------------------------------------
   mech   : mechanics.js の id 配列
   weight : 重さ 1(パーティ) - 5(ヘビー級)
   lesson : このゲームから盗める設計上の要点
   =========================================================== */

const GAMES = [
/* ===== 入門・パーティ（重さ 1-2） ===== */
{ ja:"カタン", en:"Catan", year:1995, designer:"Klaus Teuber", players:"3-4", time:75, weight:2.3,
  mech:["dice-rolling","trading","network-building","modular-board","turn-order-fixed","set-collection"],
  lesson:"手番でないプレイヤーも常に交易で関与できる。『他人の手番に自分の出番がある』ことが、ボードゲームの体感時間を決定的に短くする。" },

{ ja:"チケット・トゥ・ライド", en:"Ticket to Ride", year:2004, designer:"Alan R. Moon", players:"2-5", time:45, weight:1.8,
  mech:["set-collection","network-building","hand-management","hidden-scoring","open-drafting"],
  lesson:"手番の選択肢を『引く・敷く・目的地を取る』の3つだけに絞った。選択肢を絞るほど、その一つ一つの重みが増す好例。" },

{ ja:"ドブル", en:"Dobble / Spot It!", year:2009, designer:"D. Blanchot 他", players:"2-8", time:15, weight:1.0,
  mech:["pattern-recognition","realtime","shedding"],
  lesson:"『どの2枚にも共通の絵が必ず1つだけある』という数学的性質だけで全ルールが立つ。中核の仕掛けが1つなら説明は10秒で済む。" },

{ ja:"ラブレター", en:"Love Letter", year:2012, designer:"カナイセイジ", players:"2-4", time:20, weight:1.2,
  mech:["hand-management","deduction","take-that","bluffing"],
  lesson:"カード16枚・手札1枚。極限まで削っても推理と駆け引きは成立する。『引く/出す』だけの手番でここまで作れる。" },

{ ja:"コードネーム", en:"Codenames", year:2015, designer:"Vlaada Chvátil", players:"4-8", time:15, weight:1.3,
  mech:["signal-cooperation","limited-communication","deduction","voting"],
  lesson:"『ヒントは1単語＋数字だけ』という制約が、そのまま面白さの源泉。制約は不便ではなく、発想を生む装置である。" },

{ ja:"ナンジャモンジャ", en:"Nanjamonja", year:2011, designer:"ロシア発", players:"2-6", time:15, weight:1.0,
  mech:["memory","pattern-recognition","realtime"],
  lesson:"プレイヤー自身に命名させることで、コンポーネントに個人的な意味が宿る。ユーザー生成コンテンツの最小実装。" },

{ ja:"ハゲタカのえじき", en:"Hol's der Geier", year:1988, designer:"Alex Randolph", players:"2-6", time:20, weight:1.1,
  mech:["simultaneous","bluffing","auction-closed","negative-points"],
  lesson:"全員が同じ手札を持つ完全対称の設計。差が出るのは『いつ出すか』だけ。運の要素を消しても読み合いだけで成立する。" },

{ ja:"インカの黄金", en:"Incan Gold / Diamant", year:2005, designer:"A.Moon / B.Faidutti", players:"3-8", time:20, weight:1.1,
  mech:["push-your-luck","simultaneous","race"],
  lesson:"押し引きの最適点が『他の何人が残っているか』で動く。他人の判断が自分の期待値を変えると、単なる運が読み合いになる。" },

{ ja:"6ニムト", en:"6 nimmt!", year:1994, designer:"Wolfgang Kramer", players:"2-10", time:30, weight:1.3,
  mech:["simultaneous","negative-points","hand-management"],
  lesson:"10人まで遊べてダウンタイムゼロ。同時公開は人数上限を実質的に取り払う。" },

{ ja:"ジャストワン", en:"Just One", year:2018, designer:"L.Roubira / B.Sautter", players:"3-7", time:20, weight:1.0,
  mech:["signal-cooperation","cooperative","limited-communication"],
  lesson:"『他人と被ったヒントは消える』というルール1行が、協力ゲームに独自性を与えた。協力に制約を入れると競争なしで緊張が生まれる。" },

{ ja:"クー", en:"Coup", year:2012, designer:"Rikki Tahta", players:"2-6", time:15, weight:1.4,
  mech:["bluffing","interrupt","take-that","hidden-roles"],
  lesson:"『持っていなくても宣言できる／疑われたら証明』という一本の骨で全ての駆け引きが動く。嘘のコストを明確にすればブラフは機能する。" },

{ ja:"スカル", en:"Skull", year:2011, designer:"Hervé Marly", players:"3-6", time:30, weight:1.3,
  mech:["bluffing","auction-once-around","push-your-luck"],
  lesson:"コンポーネントはコースター4枚×人数のみ。ブラフゲームは物量ではなく、公開の順序設計で決まる。" },

/* ===== ファミリー〜中量級（重さ 2-3） ===== */
{ ja:"カルカソンヌ", en:"Carcassonne", year:2000, designer:"Klaus-Jürgen Wrede", players:"2-5", time:45, weight:1.9,
  mech:["tile-placement","area-control","enclosure","worker-placement"],
  lesson:"手番が『タイルを1枚引いて置く／コマを1個置くか置かないか』だけ。ここに得点の絡み合いを乗せて中量級の深さを出した基準作。" },

{ ja:"アズール", en:"Azul", year:2017, designer:"Michael Kiesling", players:"2-4", time:40, weight:1.8,
  mech:["open-drafting","pattern-building","tile-placement","set-collection","negative-points"],
  lesson:"『取ったタイルは全て置かねばならない』という強制が、ドラフトを毒入りにした。得られるものを強制することで妨害が自然に発生する。" },

{ ja:"キングドミノ", en:"Kingdomino", year:2016, designer:"Bruno Cathala", players:"2-4", time:20, weight:1.7,
  mech:["tile-placement","open-drafting","turn-order-variable","pattern-building"],
  lesson:"『強いタイルを取ると次の手番順が遅くなる』——1つのルールで欲張りに自動的な代償を課す、最も洗練されたトレードオフ実装。" },

{ ja:"スプレンダー", en:"Splendor", year:2014, designer:"Marc André", players:"2-4", time:30, weight:1.8,
  mech:["engine-building","open-drafting","resource-conversion","end-game-trigger","vp-track"],
  lesson:"手番の選択肢が『チップを取る／カードを買う／確保する』の3つ。エンジンビルドは、必ずしも複雑さを必要としない。" },

{ ja:"ウイングスパン", en:"Wingspan", year:2019, designer:"Elizabeth Hargrave", players:"1-5", time:60, weight:2.4,
  mech:["engine-building","tableau-building","multiple-scoring-tracks","card-drafting","solo-mode","end-game-trigger"],
  lesson:"アクションを選ぶほど『そのアクション列の鳥が連鎖する』。列＝エンジンという視覚化で、コンボの難しさを直感に落とした。" },

{ ja:"パッチワーク", en:"Patchwork", year:2014, designer:"Uwe Rosenberg", players:"2", time:30, weight:1.6,
  mech:["polyomino","timer-track","open-drafting","negative-points"],
  lesson:"時間トラックで手番順が動くため『相手が2回連続で動く』が起きる。手番の回数すら資源にできることを示した2人用の教科書。" },

{ ja:"カスカディア", en:"Cascadia", year:2021, designer:"Randy Flynn", players:"1-4", time:45, weight:1.9,
  mech:["tile-placement","open-drafting","pattern-building","scenario-variable-setup","solo-mode"],
  lesson:"タイルと動物トークンがペアで供給され、『欲しい組み合わせが来ない』葛藤を作る。2つの資源を束ねるだけで判断が倍になる。" },

{ ja:"ラミィキューブ", en:"Rummikub", year:1977, designer:"Ephraim Hertzano", players:"2-4", time:60, weight:1.8,
  mech:["set-collection","hand-management","ladder-climbing"],
  lesson:"場の全てを組み替えてよい、という開放が『長考の快感』を生む。既存の並びを触れるかどうかで、パズルの深さは劇的に変わる。" },

{ ja:"ザ・クルー", en:"The Crew", year:2019, designer:"Thomas Sing", players:"2-5", time:20, weight:2.0,
  mech:["trick-taking","cooperative","limited-communication","scenario-variable-setup","campaign-legacy"],
  lesson:"競技用の古典（トリテ）を協力ゲームに反転し、通信制限で独裁者問題を封じた。既存骨格の『反転』は最も安価な新規性の作り方。" },

{ ja:"ハナビ", en:"Hanabi", year:2010, designer:"Antoine Bauza", players:"2-5", time:25, weight:1.7,
  mech:["cooperative","limited-communication","memory","hand-management"],
  lesson:"自分の手札だけが見えない、という反転。情報の所在を1箇所ひっくり返すだけで、全く新しいゲームが生まれる。" },

{ ja:"スカイチーム", en:"Sky Team", year:2023, designer:"Luc Rémond", players:"2", time:20, weight:2.0,
  mech:["cooperative","limited-communication","dice-workers","scenario-variable-setup","variable-player-powers"],
  lesson:"2人固定・会話禁止・ダイス配置。要素を極端に絞り込むと、逆に緊張の密度が最大化する。" },

{ ja:"7 Wonders", en:"7 Wonders", year:2010, designer:"Antoine Bauza", players:"3-7", time:30, weight:2.3,
  mech:["card-drafting","simultaneous","tableau-building","multiple-scoring-tracks","set-collection"],
  lesson:"7人で30分。ドラフト＋同時解決なら、人数が増えてもプレイ時間はほぼ増えない。" },

{ ja:"ドミニオン", en:"Dominion", year:2008, designer:"Donald X. Vaccarino", players:"2-4", time:30, weight:2.4,
  mech:["deck-building","deck-thinning","open-drafting","end-game-trigger","engine-building"],
  lesson:"毎回10種類だけを選んで並べる。全体の1/3だけを可変にするだけで、リプレイ性は事実上無限になる。" },

{ ja:"スカルキング", en:"Skull King", year:2013, designer:"Brent Beck", players:"2-8", time:30, weight:1.5,
  mech:["trick-taking","bidding-contract","push-your-luck","hidden-scoring"],
  lesson:"『勝ちすぎても負ける』宣言制。勝利条件を単調増加から外すと、強い手札にも悩みが生まれる。" },

{ ja:"キャメルアップ", en:"Camel Up", year:2014, designer:"Steffen Bogen", players:"2-8", time:30, weight:1.5,
  mech:["betting","race","dice-rolling","push-your-luck"],
  lesson:"レースの結果に賭ける側に回ることで、コマを直接動かせない人も全力で参加できる。賭けは観戦を能動に変える。" },

{ ja:"サグラダ", en:"Sagrada", year:2017, designer:"D.Andersen / A.Pelikan", players:"1-4", time:30, weight:1.9,
  mech:["dice-drafting","pattern-building","dice-mitigation","solo-mode"],
  lesson:"ダイスを『出目の強弱』ではなく『色と数字の配置制約』として使った。乱数の使い道は勝敗判定だけではない。" },

{ ja:"クアックサルバー", en:"Quacks of Quedlinburg", year:2018, designer:"Wolfgang Warsch", players:"2-4", time:45, weight:2.0,
  mech:["bag-building","push-your-luck","engine-building","catch-up","simultaneous"],
  lesson:"押し引きとデッキ構築の融合。『自分で危険物を買い足す』ので、破裂リスクを自分で設計する自業自得の快感がある。" },

{ ja:"クランク！", en:"Clank!", year:2016, designer:"Paul Dennen", players:"2-4", time:60, weight:2.2,
  mech:["deck-building","push-your-luck","point-to-point","race","deck-thinning"],
  lesson:"デッキ構築に『脱出しないと全て無効』というレース条件を接続した。既存メカニクスは終了条件の差し替えで別物になる。" },

{ ja:"オルレアン", en:"Orléans", year:2014, designer:"Reiner Stockhausen", players:"2-4", time:90, weight:3.2,
  mech:["bag-building","worker-placement","resource-conversion","engine-building","open-drafting"],
  lesson:"袋から引いた人材を配置先に割り当てる。デッキ構築とワーカー配置を接続する最も自然な形。" },

/* ===== 中〜重量級ユーロ（重さ 3-4） ===== */
{ ja:"プエルトリコ", en:"Puerto Rico", year:2002, designer:"Andreas Seyfarth", players:"3-5", time:120, weight:3.3,
  mech:["action-drafting","follow","resource-conversion","engine-building","turn-order-variable"],
  lesson:"役割選択＋相乗り。『自分の得と、他人に与える得』を同時に秤にかけるという、ユーロで最も高級な判断構造。" },

{ ja:"アグリコラ", en:"Agricola", year:2007, designer:"Uwe Rosenberg", players:"1-5", time:120, weight:3.6,
  mech:["worker-placement","worker-growth","income-upkeep","resource-conversion","multiple-scoring-tracks","hand-management"],
  lesson:"『家族を食わせる』という定期的な締切が、常に足りない感覚を作る。飢餓は最も強力なペース配分装置。" },

{ ja:"ケイラス", en:"Caylus", year:2005, designer:"William Attia", players:"2-5", time:120, weight:3.9,
  mech:["worker-placement","turn-order-variable","area-control","resource-conversion","network-building"],
  lesson:"ワーカープレイスメントの原型。アクションマスを『プレイヤーが自分で建てて増やす』ため、盤面自体が競争の産物になる。" },

{ ja:"テラミスティカ", en:"Terra Mystica", year:2012, designer:"Drögemüller / Ostertag", players:"2-5", time:150, weight:3.9,
  mech:["variable-player-powers","area-control","resource-conversion","tech-tree","modular-board","turn-order-variable"],
  lesson:"14種族が全て違う能力を持つ。非対称は調整地獄だが、成功すれば『次はあの種族で』という再訪動機が最強になる。" },

{ ja:"テラフォーミング・マーズ", en:"Terraforming Mars", year:2016, designer:"Jacob Fryxelius", players:"1-5", time:120, weight:3.2,
  mech:["engine-building","tableau-building","multi-use-cards","tech-tree","multiple-scoring-tracks","solo-mode","end-game-trigger"],
  lesson:"共通の3つのパラメータ上昇が終了条件。全員の行動が同じ砂時計を進めるので、加速も自分の首を絞める。" },

{ ja:"ツォルキン", en:"Tzolk'in", year:2012, designer:"Luciani / Tascini", players:"2-4", time:90, weight:3.8,
  mech:["worker-placement","timer-track","resource-conversion","tech-tree","worker-placement-bump"],
  lesson:"歯車が回りワーカーが自動で強いマスへ進む。『置く』と『回収する』を別々の手番に分離して、待機自体を戦略にした。" },

{ ja:"グレート・ウェスタン・トレイル", en:"Great Western Trail", year:2016, designer:"Alexander Pfister", players:"2-4", time:120, weight:3.7,
  mech:["deck-building","action-selection-card","multi-use-cards","pick-up-deliver","point-to-point","engine-building"],
  lesson:"1本道を進むだけの移動に、デッキ構築と配送を重ねた。移動距離＝アクション数という制約が全ての判断を貫いている。" },

{ ja:"ブラス：バーミンガム", en:"Brass: Birmingham", year:2018, designer:"Wallace / Brown / Tolman", players:"2-4", time:120, weight:3.9,
  mech:["network-building","area-control","income-upkeep","loans-debt","market-fluctuation","action-selection-card"],
  lesson:"前半と後半で盤面がリセットされる二部構成。『前半の投資が後半に部分的にしか残らない』ので、独走が構造的に起きない。" },

{ ja:"電力会社", en:"Power Grid", year:2004, designer:"Friedemann Friese", players:"2-6", time:120, weight:3.3,
  mech:["auction-open","market-fluctuation","network-building","catch-up","turn-order-variable","income-upkeep"],
  lesson:"トップが手番順で最も不利になる、露骨だが機能するキャッチアップ。順位と不利を直結させると最後まで団子になる。" },

{ ja:"モダンアート", en:"Modern Art", year:1992, designer:"Reiner Knizia", players:"3-5", time:60, weight:2.7,
  mech:["auction-open","auction-once-around","auction-closed","auction-dutch","market-fluctuation","set-collection"],
  lesson:"5種類の競り形式を1つの箱に同居させた。同じ『買う』でも手続きが違えば全く別の駆け引きになる。" },

{ ja:"エルグランデ", en:"El Grande", year:1995, designer:"Kramer / Ulrich", players:"2-5", time:90, weight:3.2,
  mech:["area-control","auction-closed","turn-order-variable","action-drafting","hidden-scoring"],
  lesson:"エリアマジョリティの原型。『2位・3位にも点が入る』ことで、勝てない土地でも粘る意味が生まれる。" },

{ ja:"スルー・ジ・エイジズ", en:"Through the Ages", year:2006, designer:"Vlaada Chvátil", players:"2-4", time:150, weight:4.4,
  mech:["tech-tree","open-drafting","engine-building","multiple-scoring-tracks","income-upkeep","action-points"],
  lesson:"文明の発展を『カードの列を流れる市場』で表現した。時間経過をベルトコンベアで可視化する手法は応用範囲が広い。" },

{ ja:"マルコポーロの旅路", en:"The Voyages of Marco Polo", year:2015, designer:"Luciani / Tascini", players:"2-4", time:100, weight:3.4,
  mech:["dice-workers","dice-mitigation","variable-player-powers","pick-up-deliver","resource-conversion"],
  lesson:"ダイスの目が悪い日は『少額を払って底上げ』できる。運の悪さを金で買い戻せる設計は、ダイスゲームの必須装備。" },

{ ja:"グランド・オーストリア・ホテル", en:"Grand Austria Hotel", year:2015, designer:"Luciani / Tascini", players:"2-4", time:90, weight:3.4,
  mech:["dice-workers","dice-drafting","resource-conversion","tableau-building","action-drafting"],
  lesson:"同じ目のダイスが多いほど、その行動が強くなる。乱数を『行動の強度』に変換すると、悪い目にも役割が生まれる。" },

{ ja:"ヴィティカルチャー", en:"Viticulture Essential Edition", year:2013, designer:"Stegmaier / Stone", players:"1-6", time:90, weight:3.0,
  mech:["worker-placement","turn-order-claim","worker-growth","solo-mode","resource-conversion","variable-player-powers"],
  lesson:"『大ワーカー』が埋まったマスにも置ける。1個だけの例外コマが、閉塞感を一気に解消する。" },

{ ja:"ガイアプロジェクト", en:"Gaia Project", year:2017, designer:"Drögemüller / Ostertag", players:"1-4", time:150, weight:4.4,
  mech:["variable-player-powers","area-control","tech-tree","modular-board","engine-building","resource-conversion"],
  lesson:"テラミスティカを宇宙に移し、盤面をモジュール化した。成功作の続編は『可変性を足す』方向が最も外れにくい。" },

{ ja:"エクリプス", en:"Eclipse", year:2011, designer:"Touko Tahkokallio", players:"2-6", time:150, weight:3.7,
  mech:["area-control","tech-tree","income-upkeep","dice-rolling","modular-board","variable-player-powers"],
  lesson:"戦艦を自分でカスタム設計する。『ルールの一部をプレイヤーに作らせる』とテーマ没入は最大化する。" },

{ ja:"ロビンソン・クルーソー", en:"Robinson Crusoe", year:2012, designer:"Ignacy Trzewiczek", players:"1-4", time:120, weight:3.8,
  mech:["cooperative","scenario-variable-setup","dice-rolling","action-points","push-your-luck","timer-track"],
  lesson:"アクションに人数を追加すると成功率が上がる。協力ゲームで『誰と一緒にやるか』を選ばせると会議が実質的になる。" },

{ ja:"バラージ", en:"Barrage", year:2019, designer:"Tommaso Battista 他", players:"1-4", time:120, weight:4.1,
  mech:["worker-placement","area-control","resource-conversion","polyomino","variable-player-powers","engine-building"],
  lesson:"上流の建設が下流の水量を奪う。空間的な因果が直接的な妨害になり、直接攻撃なしで苛烈な対立を作った。" },

/* ===== 2人用・アブストラクト ===== */
{ ja:"囲碁", en:"Go", year:-2000, designer:"—", players:"2", time:60, weight:5.0,
  mech:["open-information","enclosure","area-control"],
  lesson:"ルールは5行、戦略は無限。『置く』だけの行為に囲いという概念を接続した、あらゆる抽象ゲームの到達点。" },

{ ja:"ヒヴ", en:"Hive", year:2001, designer:"John Yianni", players:"2", time:20, weight:2.3,
  mech:["open-information","grid-movement","tile-placement"],
  lesson:"盤がない。コマ自体が盤になる。『盤面を廃止する』という削り方は、携帯性と新規性を同時に達成する。" },

{ ja:"オニタマ", en:"Onitama", year:2014, designer:"Shimpei Sato", players:"2", time:15, weight:2.0,
  mech:["open-information","grid-movement","action-selection-card","modular-board"],
  lesson:"使った移動カードが相手に渡る。将棋的な完全情報に『駒の動きが毎回変わる＋自分の選択が相手を利する』を足して15分に圧縮した。" },

{ ja:"バトルライン", en:"Battle Line", year:2000, designer:"Reiner Knizia", players:"2", time:30, weight:2.0,
  mech:["card-play-conflict-resolution","set-collection","hand-management","area-control"],
  lesson:"9つの戦線でポーカーの役を作る。既存の役体系を借りると、説明コストをほぼゼロにできる。" },

{ ja:"ロストシティ", en:"Lost Cities", year:1999, designer:"Reiner Knizia", players:"2", time:30, weight:1.5,
  mech:["hand-management","push-your-luck","set-collection","negative-points"],
  lesson:"『探検を始めた時点で-20点』。始めることに先払いのコストを課すと、その一手が重くなる。" },

{ ja:"クラスク", en:"Klask", year:2014, designer:"Mikkel Bertelsen", players:"2", time:10, weight:1.0,
  mech:["dexterity","realtime","race"],
  lesson:"磁石で操るという物理的な直感だけで完結。ルール説明が不要な体験は、言語も年齢も超える。" },

/* ===== 正体隠匿・パーティ多人数 ===== */
{ ja:"レジスタンス：アヴァロン", en:"The Resistance: Avalon", year:2012, designer:"Don Eskridge", players:"5-10", time:30, weight:1.8,
  mech:["hidden-roles","voting","bluffing","deduction","asymmetric-goals"],
  lesson:"脱落を廃止し、投票とミッションだけで進む。『最後まで全員が喋れる』ことが人狼系の最大の改良点だった。" },

{ ja:"インサイダー", en:"Insider", year:2016, designer:"オインクゲームズ", players:"4-8", time:15, weight:1.3,
  mech:["hidden-roles","deduction","voting","action-timing-realtime"],
  lesson:"『まず全員で正解にたどり着き、その後で犯人を探す』二段構え。協力パートを前置きすると議論の材料が自動的に貯まる。" },

{ ja:"デッド・オブ・ウィンター", en:"Dead of Winter", year:2014, designer:"Gilmour / Vega", players:"2-5", time:120, weight:3.3,
  mech:["semi-cooperative","hidden-roles","asymmetric-goals","dice-rolling","cooperative"],
  lesson:"裏切り者が『いるかもしれない』だけで疑心暗鬼は発生する。実在しなくても機能する、最も安価な緊張装置。" },

{ ja:"ディプロマシー", en:"Diplomacy", year:1959, designer:"Allan B. Calhamer", players:"7", time:360, weight:3.5,
  mech:["negotiation","alliance","simultaneous","area-control","open-information"],
  lesson:"運もカードもなく、全ての結果は交渉から生まれる。ゲームの外（会話）に面白さを完全委譲した極北。" },

/* ===== キャンペーン・レガシー ===== */
{ ja:"パンデミック", en:"Pandemic", year:2008, designer:"Matt Leacock", players:"2-4", time:45, weight:2.4,
  mech:["cooperative","action-points","point-to-point","variable-player-powers","hand-management","timer-track"],
  lesson:"感染爆発が連鎖する。『放置したものが加速度的に悪化する』構造が、協力ゲームに締切と優先順位を与えた。" },

{ ja:"パンデミック・レガシー シーズン1", en:"Pandemic Legacy S1", year:2015, designer:"Daviau / Leacock", players:"2-4", time:60, weight:2.8,
  mech:["campaign-legacy","legacy-unlock","legacy-narrative","cooperative","variable-player-powers"],
  lesson:"既存の名作にレガシーを被せた。ゼロから作らず『完成された骨格＋1つの新軸』が、最も確実な傑作の作り方。" },

{ ja:"グルームヘイヴン", en:"Gloomhaven", year:2017, designer:"Isaac Childres", players:"1-4", time:120, weight:3.9,
  mech:["campaign-legacy","legacy-unlock","action-selection-card","grid-movement","line-of-sight","variable-player-powers"],
  lesson:"手札が尽きると戦闘不能。HPではなく『カードの残り枚数＝スタミナ』にすることで、消耗戦にリソース管理を持ち込んだ。" },

{ ja:"マイシティ", en:"My City", year:2020, designer:"Reiner Knizia", players:"2-4", time:30, weight:1.8,
  mech:["campaign-legacy","legacy-unlock","polyomino","tile-placement","catch-up"],
  lesson:"1章30分×24章。レガシーの最大の敵は『集まれないこと』であり、章を短くするだけで完走率は跳ね上がる。" },

{ ja:"タイム・ストーリーズ", en:"T.I.M.E Stories", year:2015, designer:"Chassenet / Rozoy", players:"2-4", time:90, weight:2.6,
  mech:["legacy-narrative","cooperative","scenario-variable-setup","dice-rolling","timer-track"],
  lesson:"『失敗したらループして最初から』を物語として正当化した。リトライをテーマに織り込むと、失敗が罰ではなく前進になる。" },

/* ===== リアルタイム・アクション ===== */
{ ja:"マジックメイズ", en:"Magic Maze", year:2017, designer:"Kasper Lapp", players:"1-8", time:15, weight:1.7,
  mech:["realtime","cooperative","limited-communication","action-timing-realtime","grid-movement"],
  lesson:"『全員が全コマを動かせるが、自分は一方向にしか動かせない』。権限を軸で分割すると、会話禁止でも協力が成立する。" },

{ ja:"キャプテン・ソナー", en:"Captain Sonar", year:2016, designer:"Fraga / Lemonnier", players:"2-8", time:45, weight:2.4,
  mech:["realtime","hidden-movement","one-vs-many","limited-communication","deduction"],
  lesson:"チーム内で役割を4つに分け、全員が同時に喋る。役割分担＋リアルタイムは、卓を最も騒がしくする組み合わせ。" },

{ ja:"エスケープ：呪われた神殿", en:"Escape: The Curse of the Temple", year:2012, designer:"Kristian Amundsen Østby", players:"1-5", time:10, weight:1.6,
  mech:["realtime","dice-rolling","cooperative","action-timing-realtime","tile-placement","map-deformation"],
  lesson:"10分間ダイスを振り続けるだけ。手番の廃止は、プレイ時間を実測値そのものに固定できる。" },

{ ja:"キャプテン・リノ", en:"Rhino Hero", year:2011, designer:"Frisco / Strumpf", players:"2-5", time:15, weight:1.0,
  mech:["dexterity","legacy-physical","shedding","take-that"],
  lesson:"カードを積むだけの塔に『手札を減らす』勝利条件を足した。器用さゲームにも目的関数を置くと、単なる遊びが競技になる。" },

/* ===== 非対称・その他 ===== */
{ ja:"ルート", en:"Root", year:2018, designer:"Cole Wehrle", players:"2-4", time:90, weight:3.8,
  mech:["variable-player-powers","asymmetric-goals","area-control","grid-movement","card-play-conflict-resolution"],
  lesson:"4陣営がルールごと違う。『同じゲームを違う遊び方で遊ぶ』は最高の体験だが、初回の説明が最大の障壁になる。" },

{ ja:"スコットランドヤード", en:"Scotland Yard", year:1983, designer:"Ravensburger チーム", players:"3-6", time:60, weight:2.4,
  mech:["hidden-movement","one-vs-many","point-to-point","deduction","cooperative"],
  lesson:"『定期的に姿を現す』ルールが推理を可能にする。隠す側の情報を完全に消さないことが、隠し移動の生命線。" },

{ ja:"レース・フォー・ザ・ギャラクシー", en:"Race for the Galaxy", year:2007, designer:"Tom Lehmann", players:"2-4", time:45, weight:3.0,
  mech:["simultaneous","follow","multi-use-cards","tableau-building","engine-building","action-selection-card"],
  lesson:"カードが資源であり建物であり得点。1枚の多義性を極限まで高め、プエルトリコを45分に圧縮した。" },

{ ja:"モダン・タイムズ／ボーナンザ", en:"Bohnanza", year:1997, designer:"Uwe Rosenberg", players:"2-7", time:45, weight:1.7,
  mech:["trading","negotiation","hand-management","set-collection"],
  lesson:"『手札の順番を変えてはいけない』という一行の禁止が、交渉を必然にした。制約が交渉圧力を生む最良の実例。" },

{ ja:"アクワイア", en:"Acquire", year:1964, designer:"Sid Sackson", players:"2-6", time:90, weight:2.5,
  mech:["market-fluctuation","tile-placement","area-control","end-game-trigger"],
  lesson:"株を持つ会社が合併されると配当が出る。『自分の資産が他人の行動で価値を変える』という相互依存の古典。" }
,
/* ===== 骨格の見本市（特徴的な構造を持つ作品） ===== */
{ ja:"ロボラリー", en:"RoboRally", year:1994, designer:"Richard Garfield", players:"2-8", time:120, weight:2.9,
  mech:["programmed-movement","simultaneous","grid-movement","take-that","race"],
  lesson:"5手分の行動を先に確定させ、あとは見守るだけ。『計画が他人のせいで崩れる』ことを笑いに変換した原型。" },

{ ja:"ナヴェガドール", en:"Navegador", year:2010, designer:"Mac Gerdts", players:"2-5", time:90, weight:3.3,
  mech:["rondel","resource-conversion","market-fluctuation","engine-building","area-control"],
  lesson:"アクションが円環に並び、進む距離がコストになる。『やりたい行動までの距離』という時間軸だけで、ルール量を激減させた。" },

{ ja:"インペリアル", en:"Imperial", year:2006, designer:"Mac Gerdts", players:"2-6", time:150, weight:3.8,
  mech:["rondel","auction-open","area-control","income-upkeep","market-fluctuation"],
  lesson:"プレイヤーは国ではなく『国に投資する銀行家』。所属を可変にすると、裏切りが道徳の問題ではなく計算になる。" },

{ ja:"マジック：ザ・ギャザリング", en:"Magic: The Gathering", year:1993, designer:"Richard Garfield", players:"2", time:30, weight:3.2,
  mech:["deck-construction-pre","interrupt","hand-management","card-play-conflict-resolution","deck-building"],
  lesson:"ゲーム外の『デッキを組む』時間を最大の遊びにした。プレイ時間より準備時間が長いという価値の置き方は、いまも応用余地が大きい。" },

{ ja:"ウェルカム・トゥ", en:"Welcome To...", year:2018, designer:"Benoit Turpin", players:"1-100", time:25, weight:2.1,
  mech:["dice-tableau","simultaneous","pattern-building","multiple-scoring-tracks","negative-points"],
  lesson:"ダイスの代わりにカードで数字を供給し、全員が同じ数字を各自のシートに書く。人数上限を事実上撤廃する最も安価な方法。" },

{ ja:"ガンシュンクルーガー", en:"Ganz schön clever", year:2018, designer:"Wolfgang Warsch", players:"1-4", time:30, weight:1.9,
  mech:["dice-tableau","dice-drafting","engine-building","multiple-scoring-tracks","solo-mode"],
  lesson:"1枚の紙で連鎖コンボが起きる。エンジンビルドはコンポーネント量ではなく『効果の参照関係』の設計で決まる。" },

{ ja:"キーフラワー", en:"Keyflower", year:2012, designer:"Breese / Sampson", players:"2-6", time:120, weight:3.9,
  mech:["bid-worker","worker-placement","auction-open","tile-placement","worker-growth","turn-order-variable"],
  lesson:"タイルの落札にも、そのタイルの使用にも同じワーカーを使う。1種類の資源に2つの用途を持たせると、判断の密度が倍になる。" },

{ ja:"サバイブ", en:"Survive: Escape from Atlantis!", year:1982, designer:"Julian Courtland-Smith", players:"2-4", time:60, weight:1.9,
  mech:["map-deformation","take-that","point-to-point","hidden-scoring","dice-rolling"],
  lesson:"島が毎ターン沈む。盤面が確実に消えていく構造は、締切と混乱を同時に供給する。" }
];
