# 仕様書

## モジュール説明
- GameModule
ゲームの動作に関するモジュール群。
    - Master:　実際に動かす部分

    - Player:　プレイヤー部分。賢いplayerはこのplayerを継承し作成することとする。

    - Card:　カードクラスを格納。np.ndarray[object]は遅いっぽいのでなるべく使わない。可視化する際にprint(Card(i))で可視化する。一応比較や等号判定も可能。
