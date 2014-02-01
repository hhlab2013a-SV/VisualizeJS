require.config({
  baseUrl: 'assets',
  paths: {
    jquery: 'http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min',
    util: 'js/util',
    chaser: 'lib/Chaser/src/chaser',
    visualizejs: 'lib/visualizejs'
  },
  shim: {
    chaser: {
      deps: ['lib/UglifyJS/uglify'],
      exports: 'Chaser'
    }
  }
});

require(['jquery', 'util', 'chaser', 'visualizejs/JsVisualizer'], function($, util, Chaser, JsVisualizer) {
  // 実行ボタンが押されたら処理する
  $('#visualize-btn').on('click', function() {
    // textareaからコード（文字列）を取得
    var code = util.getCodeFromTextArea('#code');

    // コードをパーサーに渡して解析結果を取得
    var data = Chaser.execute(code);

    // データをビジュアライズする
    var jsVisualizer = new JsVisualizer({
      width: 652,
      height: 297,
      fps: 30
    });
    jsVisualizer.draw(data);
  });


  // @note おまけ：サンプルコードの挿入
  $('#sample1').on('click', function() {
    util.setCodeToTextArea('#code', 1);
  });
  $('#sample2').on('click', function() {
    util.setCodeToTextArea('#code', 2);
  });
});
