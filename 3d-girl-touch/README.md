# ふれあい3Dガール / Touch the 3D Girl

3Dキャラクターとふれあえる、モバイル最適化のブラウザゲーム。
A mobile-optimized browser game where you interact with a friendly 3D character.

## あそびかた / How to play

- **ドラッグ** … 色んな角度から見る（カメラ回転）
- **ピンチ** … ズームイン / アウト
- **タップ** … キャラにふれあう（頭・体・腕・足で反応がちがう）
- **ボタン** … あいさつ 👋 / ダンス 💃 / 視点リセット 🔄

タッチするほど「なかよし度」がアップ。100%を目指そう！

- **Drag** to orbit and view from any angle
- **Pinch** to zoom in/out
- **Tap** the character — head / body / arms / legs react differently
- Buttons: greet, dance, reset view
- Fill the affection meter to 100%

## 技術 / Tech

[Three.js](https://threejs.org/) をCDN（import map）で読み込む、ビルド不要の単一 `index.html`。
Single self-contained `index.html`, Three.js via CDN import map — no build step.

タッチ操作・セーフエリア対応・レスポンシブのモバイルファースト設計。
Touch-first, safe-area aware, responsive.

## 起動 / Run

`index.html` をブラウザで開くだけ。CDN読み込みのため初回はネット接続が必要です。
Just open `index.html` in a browser (network needed on first load for the CDN).
