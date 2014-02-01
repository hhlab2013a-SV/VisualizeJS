(function() {
    String.prototype.splice = function(idx, rem, s) {
        var line = (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
        return line; 
    };

    var root = this;

    var Chaser = {};

    if(typeof exports !== "undefined") {
        if(typeof module !== "undefined" && module.exports) {
            exports = module.exports = Chaser;
        }
        exports.Chaser = Chaser;

        UglifyJS = require("uglify-js");
    } else {
        root.Chaser = Chaser;
    }

    Chaser.assign = function(symbol, value, node) {
        if(value) {
            switch(value.TYPE) {
                case "String":
                    Chaser.insertFunctions.push({ 
                        value: ";Chaser.queue.push({ type: 'Assign', symbol: '" + symbol+ "', value_type: '" + value.TYPE  + "', value: '" + value.value + "' });", 
                        pos: node.end.endpos 
                    });
                    break;

                case "Number":
                    Chaser.insertFunctions.push({ 
                        value: ";Chaser.queue.push({ type: 'Assign', symbol: '" + symbol + "', value_type: '" + value.TYPE  + "', value: " + value.value + " });",
                        pos: node.end.endpos 
                    });
                    break;

                case "Binary":
                    var stream = UglifyJS.OutputStream({ beautify: true });
                    value.print(stream);
                    Chaser.insertFunctions.push({ 
                        value: ";Chaser.queue.push({ type: 'Assign', symbol: '" + symbol + "', value_type: '" + value.TYPE  + "', value: '" + stream.toString()  + "' });", 
                        pos: node.end.endpos 
                    });
                    break;

                case "SymbolRef":
                    Chaser.insertFunctions.push({ 
                        value: ";Chaser.queue.push({ type: 'Assign', symbol: '" + symbol + "', value_type: '" + value.TYPE  + "', value: '" + name + "' });",
                        pos: node.end.endpos 
                    });
                    break;

                case "Function":
                    Chaser.insertFunctions.push({
                        value: ";Chaser.queue.push({ type: 'Assign', symbol: '" + symbol + "', value_type: '" + value.TYPE + "'});",
                        pos: node.end.endpos 
                    });
                    break;

                case "Object":
                    // objectはpropertiesを持つので、それをうまく活用する
                    // prototyoeをどうやって表現するか
                    // object生成用のTypeを作成するひつようがあるか
                    Chaser.insertFunctions.push({ 
                        value: ";Chaser.queue.push({ type: 'Assign', symbol: '" + symbol + "', value_type: '" + value.TYPE + "'});", 
                        pos: node.end.endpos 
                    });
                    break;
            }
        }
    };

    Chaser.parseNode = function(node) {
        switch(node.TYPE) {
            case "Var":
                if(node.hasOwnProperty("definitions")) {
                    for(var i = 0; i < node.definitions.length; i++) {
                        var varDef = node.definitions[i];
                        var name = varDef.name.name;
                        Chaser.insertFunctions.push({ 
                            value: ";Chaser.queue.push({ type: 'Var', symbol: '" + name +"' });",
                            pos: node.end.endpos 
                        });
                        Chaser.assign(name, varDef.value, varDef);
                    }
                }
                break;

            case "Assign":
                Chaser.assign(node.left.name, node.right, node);
                break;

            case "ForIn":
                if(node.hasOwnProperty("step")) {
                    var startLine = node.start.line - 1;
                    var endLine   = node.step.end.line - 1;
                }
                break;

            case "For":
                Chaser.insertFunctions.push({ 
                    value: "Chaser.queue.push({ type: 'For' });", 
                    pos: node.start.pos 
                });

                if (node.hasOwnProperty("init")) {
                    var init = node.init;
                }

                var hasCondition = false;
                if (node.hasOwnProperty("condition")) {
                    var condition = node.condition;
                }


                if (node.hasOwnProperty("body")) {
                    var body = node.body;
                    var addKakko = false;
                    if(node.body.TYPE == "BlockStatement") {
                    } else {
                        addKakko = true;
                        Chaser.insertFunctions.push({ value: "{", pos: body.start.pos });
                    }

                    Chaser.insertFunctions.push({ 
                        value: "Chaser.queue.push({ type: 'ForLoopStart' });",
                        pos: body.start.endpos 
                    });
                    Chaser.parseNode(body);
                    Chaser.insertFunctions.push({ 
                        value: "Chaser.queue.push({ type: 'ForLoopEnd' });",
                        pos: body.end.pos 
                    });

                    if(addKakko) {
                        Chaser.insertFunctions.push({ value: "}", pos: body.end.endpos });
                    }
                }
                Chaser.insertFunctions.push({ 
                    value: "Chaser.queue.push({ type: 'EndFor' });",
                     pos: node.end.endpos 
                });
                break;

            case "If":
                Chaser.insertFunctions.push({ value: "Chaser.queue.push({ type: 'If'});", pos: node.start.pos });
                var body;
                if(node.hasOwnProperty("condition")) {
                    var stream = UglifyJS.OutputStream({ beautify: true });
                    node.condition.print(stream);
                    Chaser.insertFunctions.push({ 
                        value: "Chaser.queue.push({ type: 'Condition', value: '" + stream.toString() + "' }) && ",
                        pos: node.condition.start.pos 
                    });
                }

                if(node.hasOwnProperty("body")) {
                    Chaser.insertFunctions.push({ value: "Chaser.queue.push({ type: 'ConditionResult', value: 'TRUE' }); ", pos: node.body.start.endpos });
                    body = node.body.body;
                    if(body instanceof Array) {
                        for(var i = 0; i < body.length; i++) {
                            Chaser.parseNode(body[i]);
                        }
                    } else {
                        Chaser.parseNode(body);
                    }
                }

                if(node.hasOwnProperty("alternative")) {
                    Chaser.insertFunctions.push({
                        value: "Chaser.queue.push({ type: 'ConditionResult', value: 'FALSE' }); ",
                        pos: node.alternative.start.endpos 
                    });
                    body = node.alternative.body;
                    if(body instanceof Array) {
                        for(var i = 0; i < body.length; i++) {
                            Chaser.parseNode(body[i]);
                        }
                    } else {
                        Chaser.parseNode(body);
                    }
                }
                Chaser.insertFunctions.push({ value: "Chaser.queue.push({ type: 'EndIf' });", pos: node.end.endpos });
                break;

            default:
                if(node.hasOwnProperty("body")) {
                    if(node.body instanceof Array) {
                        for(var i = 0, il = node.body.length; i < il; i++) {
                            Chaser.parseNode(node.body[i]);
                        }
                    } else {
                        Chaser.parseNode(node.body);
                    }
                }
        }
    };

    Chaser.replace = function(source) {
        var lines = source.split("\n");
        var ast = UglifyJS.parse(source);
        var stream = UglifyJS.OutputStream({});
        ast.print(stream);

        for(var i = 0, il = ast.body.length; i < il; i++) {
            Chaser.parseNode(ast.body[i]);
        }

        for(
            var i = 0, current_pos = 0, line_num = 0, line_length = lines[0].length + 1, offset = 0;
            i < Chaser.insertFunctions.length;
            i++) {

            var insertFunction = Chaser.insertFunctions[i];
            while(insertFunction.pos > current_pos + line_length) {
                current_pos += line_length;
                offset = 0;

                line_num++;
                line_length = lines[line_num].length + 1;
            }

            var index = insertFunction.pos - current_pos;
            lines[line_num] = lines[line_num].splice(index + offset, 0, insertFunction.value);

            offset += insertFunction.value.length;
        }

        source = lines.join("\n");

        return source;
    };

    Chaser.execute = function(source) {
        Chaser.insertFunctions = [];
        Chaser.queue = [];

        Chaser.replacedSource = Chaser.replace(source);
        eval(Chaser.replacedSource);

        return Chaser.queue;
    };

    Chaser.test = function() {
        return "test";
    };
}).call(this);
