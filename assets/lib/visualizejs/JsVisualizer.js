// @note Gameオブジェクトのインスタンスを生成して返すモジュール

require.config({
  baseUrl: 'assets',
  paths: {
    enchant: 'lib/enchantjs/build/enchant',
    'enchant.min': 'lib/enchantjs/build/enchant.min',
    'nineleap.enchant': 'lib/enchantjs/build/plugins/nineleap.enchant',
    'widget.enchant': 'lib/enchantjs/build/plugins/widget.enchant'
  },
  shim: {
    'nineleap.enchant': ['enchant'],// nineleap.enchantはenchant.jsに依存しますよ、という宣言
    'widget.enchant': ['enchant']
  }
});

//@todo クリックで描画スタートするようにする
define('visualizejs/JsVisualizer', ['enchant', 'nineleap.enchant', 'widget.enchant'], function() {
  enchant();
  // preloadする画像を管理するオブジェクト
  var assets = {
    map0: 'assets/lib/enchantjs/images/map0.png',
    chara0: 'assets/lib/enchantjs/images/chara0.png',
    chara6: 'assets/lib/enchantjs/images/chara6.png'
  };

  var JsVisualizer = function(config) {
    var width = config.width || 320;
    var height = config.height || 320;
    var fps = config.fps || 30;

    var game = new Game(width, height);
    game.fps = fps

    var images = [];
    for (var prop in assets) {
      images.push(assets[prop]);
    }
    game.preload(images);

    this.game = game;
    /*
    this.width = width;
    this.height = height;
    this.fps = fps;
    */
  };

  JsVisualizer.prototype = {
    // @args [Array] 描画するデータの配列
    draw: function(data) {
      var game = this.game;
      var self = this;
      game.onload = function() {
        // ドラクエっぽくウィンドウ出したい
        /*
        (function(){
          var width = 300, height = 185.41;
          var messageWindow = new Sprite(width, height);
          var surface = new Surface(width, height);
          var fillRoundRect = function (ctx, l, t, w, h, r, pi) {
            ctx.beginPath();
            ctx.arc(l + r, t + r, r, - pi, - 0.5 * pi, false);
            ctx.arc(l + w - r, t + r, r, - 0.5 * pi, 0, false);
            ctx.arc(l + w - r, t + h - r, r, 0, 0.5 * pi, false);
            ctx.arc(l + r, t + h - r, r, 0.5 * pi, pi, false);
            ctx.closePath();
            ctx.fill();
          };
          var strokeRoundRect = function (ctx, l, t, w, h, r, pi) {
            ctx.beginPath();
            ctx.arc(l + r, t + r, r, - pi, - 0.5 * pi, false);
            ctx.arc(l + w - r, t + r, r, - 0.5 * pi, 0, false);
            ctx.arc(l + w - r, t + h - r, r, 0, 0.5 * pi, false);
            ctx.arc(l + r, t + h - r, r, 0.5 * pi, pi, false);
            ctx.closePath();
            ctx.stroke();
          };
          surface.context.fillStyle = '#000';
          fillRoundRect(surface.context, 0, 0, 300, 185, 20, Math.PI);
          surface.context.strokeStyle = '#fff';
          surface.context.lineWidth = 5;
          strokeRoundRect(surface.context, 5, 5, 290, 175, 10, Math.PI);
          messageWindow.image = surface;
          messageWindow.moveTo((game.width - width)/2, (game.height-height)/2);//中央に移動


          var label = new Label('hogehogeoge');
          label.color = '#fff';
          label.font = '24px Helvetica';
          label.moveTo((game.width-label._boundWidth)/2, (game.height-label._boundHeight)/2);
          game.rootScene.addChild(messageWindow);
          game.rootScene.addChild(label);
        }());
*/

        // プレイ画面を作成してイベント登録
        var playScene = (function(){
          var scene = new Scene();

          // ベースマップ生成
          var map = (function(){
            var map = new Map(16, 16); //マップの1マスを16×16に設定
            var mapData = {
              groundMap: [],
              objMap: []
            };
            var collisionData = []; //障害物のマップデータ
            map.image = game.assets[assets.map0];
            var mapObj = {
              wall: 4,
              road: 5,
              tile: 3,
              treasure: 25,
              notice: 24
            };

            // マップデータの作成するよー
            // @note 1データあたり3マス対応
            var row = 5, col = data.length*3;

            // 地面を初期化
            mapData.groundMap = (function(){
              var array = [];
              for (var i=0; i<row; i++) {
                array[i] = [];
                for (var j=0; j<col; j++) {
                  array[i][j] = mapObj.road;
                }
              }
              return array;
            }());

            // マップ上に置くオブジェクトの初期化
            mapData.objMap = (function(){
              var array = [];
              for (var i=0; i<row; i++) {
                array[i] = [];
                for (var j=0; j<col; j++) {
                  array[i][j] = -1;
                }
              }
              return array;
            }());

            // 壁の設置
            (function(){
              for (var i=0; i<col; i++) {
                mapData.objMap[0][i] = mapObj.wall;
                mapData.objMap[4][i] = mapObj.wall;
              }
            }());

            // 宝箱設置
            (function(){
              mapData.objMap[2][col-1] = mapObj.treasure;
            }());

            // パーサーの結果を見てタイル（データの切れ目）とか立て札（if文）の設置
            (function(){
              var ref = data.length;
              for (var i=0; i<ref; i++) {
                mapData.objMap[2][i*3] = mapObj.tile;
                if (data[i].type.toLowerCase() === 'if') {
                  mapData.objMap[1][i*3] = mapObj.notice;
                }
              }
            }());

            // 作成したマップの読み込み
            map.loadData(mapData.groundMap, mapData.objMap);

            // 当たり判定用のマップを初期化
            // @todo マップを複雑にする時に拡張する
            /*
            collisionData = (function(){
              var array = [];
              for (var i=0; i<row; i++) {
                array[i] = 0;
                for (var j=0; j<col; j++) {
                  array[i][j] = 0;
                }
              }
              return array;
            }());
            map.collisionData = collisionData;
            */

            return map;
          }());

          // 敵キャラ生成
          var enemies = (function(){
            var array = [];
            var ref = data.length;
            for (var i=0; i<ref; i++) {
              if (data[i].type.toLowerCase() === 'assign') {
                var enemy = new Sprite(32, 32);
                enemy.x = i*3*16 - 8;
                enemy.y = 24;
                enemy.image = game.assets[assets.chara6];
                enemy.frame = 0;
                array.push(enemy);
              }
            }
            return array;
          }());

          // プレイヤー生成
          var player = (function(){
            var player = new Sprite(32, 32);
            player.x = 0;
            player.y = 16;
            player.image = game.assets[assets.chara0];
            player.speed = 4;
            player.direction = 2;//右向き
            player.walk = 0;
            return player;
          }());

          player.addEventListener('enterframe', function() {
            this.walk++;
            this.walk %= 3;
            this.frame = this.direction*9 + this.walk;
            this.x += player.speed;
            // 右方向の当たり判定
            // if (map.hitTest(this.x + this.width*0.75 + this.speed, this.y + this.height/2) === false) {}
          });

          // 全部1つのグループにまとめる
          var stage = (function(){
            var stage = new Group();
            stage.addChild(map);
            (function(){
              var ref = enemies.length;
              for (var i=0; i<ref; i++) {
                stage.addChild(enemies[i]);
              }
            }());
            stage.addChild(player);
            return stage;
          }());
          stage.addEventListener('enterframe', function() {
            var x = Math.min((game.width - player.width) / 2 - player.x, 0);
            x = Math.max(game.width, x + map.width) - map.width;
            stage.x = x

            // 宝箱に衝突...する直前で終わり
            if (player.x + player.width*0.75 + player.speed >= map.width - map.tileWidth) {
              game.end(0, "Goal");
            }

             // 要するにこれをやってる ↓
            /*
            // 宝箱が右端にきたらスクロールやめる
            if (this.age + game.width/16 - 1 < map.width/16) {
              this.x -= player.speed;
            }
            */
          });

          scene.addChild(stage);
          return scene;
        }());

        game.pushScene(playScene);
      };
      game.start();
    }
  };



  return JsVisualizer;
});