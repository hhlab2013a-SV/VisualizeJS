// @note 色々な関数を放り込むユーティリティモジュール
define('util', ['jquery'], function($) {
  return {
    getCodeFromTextArea: function(selector) {
      return $(selector).val();
    },
    getSampleData: function() {
      return [{"type":"Var","symbol":"a"},{"type":"Assign","symbol":"a","value_type":"String","value":"A"},{"type":"Assign","symbol":"a","value_type":"Number","value":1},{"type":"If"},{"type":"Condition","value":"a>0"},{"type":"ConditionResult","value":"TRUE"},{"type":"Assign","symbol":"a","value_type":"Binary","value":"a+1"},{"type":"EndIf"},{"type":"For"},{"type":"ForLoopStart"},{"type":"Assign","symbol":"a","value_type":"Binary","value":"a+1"},{"type":"ForLoopEnd"},{"type":"ForLoopStart"},{"type":"Assign","symbol":"a","value_type":"Binary","value":"a+1"},{"type":"ForLoopEnd"},{"type":"ForLoopStart"},{"type":"Assign","symbol":"a","value_type":"Binary","value":"a+1"},{"type":"ForLoopEnd"},{"type":"ForLoopStart"},{"type":"Assign","symbol":"a","value_type":"Binary","value":"a+1"},{"type":"ForLoopEnd"},{"type":"ForLoopStart"},{"type":"Assign","symbol":"a","value_type":"Binary","value":"a+1"},{"type":"ForLoopEnd"},{"type":"EndFor"}];
    },
    setCodeToTextArea: function(selector, n) {
      var initialCode ='';
      switch(n) {
        case 1:
          initialCode += 'var a = \"A\";\n';
          initialCode += '\n';
          initialCode += 'a = 1;\n'; 
          initialCode += '\n';
          initialCode += 'if(a > 0) {\n';
          initialCode += '    a = a + 1;\n';
          initialCode += '} else {\n';
          initialCode += '    a = a - 1;\n';
          initialCode += '}\n';
          initialCode += '\n';
          initialCode += 'for(var i = 0; i < 5; i++) {\n';
          initialCode += '    a = a + 1;\n';
          initialCode += '}\n';
          initialCode += '\n';
          break;
        case 2:
          initialCode += 'var a = \"A\";\n'; 
          initialCode += '\n';
          initialCode += 'a = 1;\n'; 
          initialCode += '\n';
          initialCode += 'var b = a;\n';
          initialCode += '\n';
          initialCode += 'var c = function(x) {\n';
          initialCode += '    var y = 0;\n';
          initialCode += '    return y * y;\n';
          initialCode += '};\n';
          initialCode += '\n';
          break;
      }
      return $(selector).val(initialCode);
    }
  };
});