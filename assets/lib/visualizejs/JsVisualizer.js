// Gameオブジェクトのインスタンスを生成して返すモジュール

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

  // マップで使うアイテムの番号を管理する
  var mapItem = {
    tile: 18,//3
    wall: 23,//4
    road: 0,//5
    notice: 24,
    treasure: 25,
    crock: 26, //つぼ
    goal: 22
  };

  var JsVisualizer = function(config) {
    var width = config.width || 320;
    var height = config.height || 320;
    var fps = config.fps || 30;

    var game = new Game(width, height);
    game.fps = fps
    this.game = game;
  };

  JsVisualizer.prototype = {
    // 当たり判定用のマップをつくる
    createCollisionMap: function(row, col, data) {
      var array = [];
      (function(){
        for (var i=0; i<row; i++) {
          array[i] = [];
          for (var j=0; j<col; j++) {
            array[i][j] = 0;
          }
        }
      }());

      // 障害物がある場所を1にする
      (function(){
        var ref = data.length;
        for (var i=0; i<ref; i++) {
          var type = data[i].type.toLowerCase();
          if (type === 'var' || type === 'assign' || type === 'if' || type === 'endif') {
            array[1][i*3] = 1;
          }
        }
      }());
      return array
    },
    // 指定されたサイズのドラクエ風ウィンドウをつくる
    createDialog: function(width, height) {
      var dialog = new Sprite(width, height);
      var surf = new Surface(width, height);
      var ctx = surf.context;

      // 黒い角丸長方形を描画
      ctx.fillStyle = '#000';
      this.fillRoundRect(ctx, 0, 0, width, height, 20, Math.PI);

      // 白い角丸枠線を描画
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 4;
      var margin = 4;
      this.strokeRoundRect(ctx, margin, margin, width-margin*2, height-margin*2, 20, Math.PI);

      dialog.image = surf;
      return dialog;
    },
    // 指定されたサイズで地面のマップをつくる
    createGroundMap: function(row, col) {
      var array = [], item = mapItem.road;
      for (var i=0; i<row; i++) {
        array[i] = [];
        for (var j=0; j<col; j++) {
          array[i][j] = item;
        }
      }
      return array;
    },
    // 左下あたりにアイテムを表示するウィンドウをつくる
    createItemWindow: function() {
      var game = this.game;
      var width = 298, height = 184;
      var itemWindow = this.createDialog(width, height);
      itemWindow.moveTo(0, game.height-height);//右下に移動
      return itemWindow;
    },
    // オブジェクトを設置したマップをつくる
    // @todo ちょっと長いので分割したい
    createObjectMap: function(row, col, data) {
      // オブジェクトを設置するマップの初期化
      var array = [];
      (function(){
        for (var i=0; i<row; i++) {
          array[i] = [];
          for (var j=0; j<col; j++) {
            array[i][j] = -1;
          }
        }
      }());

      // 壁の設置
      (function(){
        var wall = mapItem.wall;
        for (var i=0; i<col; i++) {
          array[0][i] = wall;
          array[4][i] = wall;
        }
      }());

      // 3行目のオブジェクト描画
      // 1ステップごとにタイルを設置
      (function(){
        var ref = data.length;
        var tile = mapItem.tile;
        for (var i=0; i<ref; i++) {
          array[2][i*3] = tile;
        }
      }());

      // 2行目のオブジェクト描画
      // var, if文に対応
      (function(){
        var ref = data.length;
        for (var i=0; i<ref; i++) {
          var obj = -1;
          switch(data[i].type.toLowerCase()) {
            case 'var':
              obj = mapItem.treasure;
              break;
            case 'assign':
              obj = mapItem.crock;
              break;
            case 'if':
              obj = mapItem.notice;
              break;
            case 'endif':
              obj = mapItem.notice;
              break;
          }
          array[1][i*3] = obj;
        }
      }());

      // ゴールを設置
      array[2][col-1] = mapItem.goal;

      return array;
    },
    // ゲームっぽいメインのウィンドウをつくる
    // map, player, mainWindowオブジェクトはイベント登録の時に使うのでインスタンス変数で保持しておく
    createMainWindow: function() {
      // マップを生成
      var map = this.createMap();
      this.map = map;

      // プレイヤーを生成
      var player = this.createPlayer();
      this.player = player;

      // マップとプレイヤーを1つのグループにまとめる（一緒に動かしたい）
      var mainWindow = new Group();
      mainWindow.addChild(map);
      mainWindow.addChild(player);

      return mainWindow;
    },
    // 全体マップを生成
    createMap: function() {
      var game = this.game;
      var data = this.data;

      // マップの1マスを16x16に設定
      var map = new Map(16, 16);
      map.image = game.assets[assets.map0];

      // 1ステップあたり3マスで対応する
      // 最後に宝箱を置くので、data.length-1しない
      var row = 5, col = data.length*3;

      // 地面マップをつくる
      var groundMap = this.createGroundMap(row, col);

      // オブジェクトマップ（壁とか）をつくる
      var objectMap = this.createObjectMap(row, col, data);

      // マップデータを読み込む
      map.loadData(groundMap, objectMap);

      // 当たり判定用マップをつくる
      var collisionMap = this.createCollisionMap(row, col, data);
      map.collisionData = collisionMap;

      return map;
    },
    // 右下あたりにメッセージを表示するウィンドウをつくる
    createMsgWindow: function() {
      var game = this.game;
      var width = 298, height = 184;
      var msgWindow = this.createDialog(width, height);
      msgWindow.moveTo(game.width - width, game.height-height);//右下に移動
      return msgWindow;
    },
    // プレイヤー画像を生成
    createPlayer: function() {
      var player = new Sprite(32, 32);
      player.x = 0;
      // 真ん中の通路に描画
      player.y = Math.ceil((this.map._data[0].length/2))*16-player.height;
      player.image = this.game.assets[assets.chara0];
      player.speed = 4;
      player.direction = 2; //右向き
      player.walk = 0; //0~2で変化
      return player;
    },
    // ゲーム全体を統括するシーンをつくる
    createPlayScene: function() {
      var scene = new Scene();

      // メッセージウィンドウ作成
      var msgWindow = this.createMsgWindow();
      scene.addChild(msgWindow);
      this.msgWindow = msgWindow;

      // アイテムウィンドウ作成
      var itemWindow = this.createItemWindow();
      scene.addChild(itemWindow);
      this.itemWindow = itemWindow;

      // メインウィンドウ作成
      var mainWindow = this.createMainWindow();
      scene.addChild(mainWindow);
      this.mainWindow = mainWindow;

      // イベント登録
      this.setEvents();

      return scene;
    },
    // 描画のメイン
    draw: function(data) {
      this.data = data;
      var game = this.game;
      this.preload();
      var self = this;
      game.onload = function() {
        var playScene = self.createPlayScene();
        game.pushScene(playScene);
      };
      game.start();
    },
    // canvasに角丸の長方形を描画する
    fillRoundRect: function(ctx, l, t, w, h, r, pi) {
      ctx.beginPath();
      ctx.arc(l + r, t + r, r, - pi, - 0.5 * pi, false);
      ctx.arc(l + w - r, t + r, r, - 0.5 * pi, 0, false);
      ctx.arc(l + w - r, t + h - r, r, 0, 0.5 * pi, false);
      ctx.arc(l + r, t + h - r, r, 0.5 * pi, pi, false);
      ctx.closePath();
      ctx.fill();
    },
    // assetsの先読みを行う
    preload: function() {
      var array = [];
      for (var prop in assets) {
        array.push(assets[prop]);
      }
      this.game.preload(array);
    },
    // イベント登録系は全部ここにまとめる
    setEvents: function() {
      var data = this.data;
      var game = this.game;
      var map = this.map;
      var msgWindow = this.msgWindow;
      window.msgWindow = msgWindow;

      var fillTextLine = function(context, text, x, y) {
        var textList = text.split('\n');
        var lineHeight = context.measureText("あ").width;
        textList.forEach(function(text, i) {
          context.fillText(text, x, y+lineHeight*i);
        });
      };

      var player = this.player;
      player.addEventListener('enterframe', function(){
        this.walk++;
        this.walk %= 3;
        this.frame = this.direction*9 + this.walk;

        // 自分の上に障害物があるか判定
        if (map.hitTest(this.x + this.width/2, this.y) === true) {
          // 現在位置からdataの何番目に差し掛かったのか計算
          var n = parseInt( (this.x + this.width/2) / (map.tileWidth*3) );

          // メッセージを表示したいのだが...canvasでやるか..
          var text = '', d = data[n], type = d.type.toLowerCase();
          if (type === 'var') {
            text += '変数宣言！\n'
            text += 'var ';
            text += d.symbol;
            text += ';';
          } else if (type === 'assign') {
            text += 'だいにゅー\n';
            text += d.symbol + ' = ';
            if (d.value_type.toLowerCase() === 'string') {
              text += '"' + d.value + '"'
            } else {
              text += d.value
            }
            text += ';';
          } else if (type === 'if') {
            text += 'ジョウケンブンキ\n';
            text += data[n+1].value + ' ?\n';
            text += '結果は...' + data[n+2].value.toLowerCase();
          } else if (type === 'endif') {
            text += 'ジョウケンブンキ終わり\n';
          } 
          var width = msgWindow.image.width;
          var height = msgWindow.image.height;
          var ctx = msgWindow.image.context;
          ctx.clearRect(15, 15, width-30, height-30);
          ctx.fillStyle = '#000';
          ctx.fillRect(15, 15, width-30, height-30);
          ctx.font = '20px Helvetica';
          ctx.fillStyle = '#fff';
          fillTextLine(ctx, text, 15, 50);
        }

        this.x += this.speed;
      });

      var mainWindow = this.mainWindow;
      mainWindow.addEventListener('enterframe', function(){
        var x = Math.min((game.width - player.width) / 2 - player.x, 0);
        x = Math.max(game.width, x + map.width) - map.width;
        this.x = x;

        // 宝箱に衝突...する直前で終わり
        if (player.x + player.width*0.75 + player.speed >= map.width - map.tileWidth) {
          game.end(0, "Goal");
        }
      });
    },
    // canvasに角丸の長方形（の枠線だけ）を描画する
    strokeRoundRect: function(ctx, l, t, w, h, r, pi) {
      ctx.beginPath();
      ctx.arc(l + r, t + r, r, - pi, - 0.5 * pi, false);
      ctx.arc(l + w - r, t + r, r, - 0.5 * pi, 0, false);
      ctx.arc(l + w - r, t + h - r, r, 0, 0.5 * pi, false);
      ctx.arc(l + r, t + h - r, r, 0.5 * pi, pi, false);
      ctx.closePath();
      ctx.stroke();
    }
  };

  return JsVisualizer;
});