var assert = require("assert");
var should = require('should');
var path = require('path');
var fis = require('fis');


// 标记是否要输出 coverage
var coverage = !!process.env.istanbul;


// 因为 istanbul 不支持 chid_progress
// 所以现在的处理办法是正如这里面说的：
// https://github.com/gotwarlost/istanbul/issues/115
// 
// Yes, you will need to call the equivalent of 
// `istanbul cover --dir <generated-dir-name> <js-program>` every time
// you need to run tests in a child process.
//
// Then you can use istanbul report to collect information from all these
// directories and spit out a single coverage report from it.
var Fis = (function() {
    var outputDir = resolve('output');
    var spawn = require('child_process').spawn;
    var fisbin = path.resolve('node_modules/fis/bin/fis');
    var slice = [].slice;
    var preArgs = [fisbin, 'release', '-cd', outputDir];
    var command = coverage ? 'istanbul' : 'node';
    var reportDirs = [];
    var count = 0;

    if (coverage) {
        preArgs.splice(0, 0, '--report', 'none', '--');
    }
    
    return {
        run: function() {
            var args = slice.call(arguments);
            var argsPre = preArgs.concat();
            var cb, child, reportDir;

            if (args.length && typeof args[args.length - 1] === 'function') {
                cb = args.pop();
            }

            if (coverage) {
                reportDir = 'coverage/sub' + count++;
                argsPre.splice(0, 0, 'cover', '--dir', reportDir);
                reportDirs.push(reportDir);
            }

            // console.log(command, argsPre.concat(args).join(' '));

            removeFolder(outputDir);
            fis.util.mkdir(outputDir);

            child = spawn(command, argsPre.concat(args));
            
            // child.stdout.pipe(process.stdout);
            // child.stderr.pipe(process.stderr);

            child.on('close', function() {
                cb && cb();
            });
        },

        finish: function(cb) {
            if (!coverage) {
                cb && cb();
                return;
            }

            var args = ['report', process.env.istanbul_report || 'html'];
            var child;

            reportDirs.forEach(function(val) {
                args.splice(1, 0, '--root', val);
            });

            Object.keys(process.env).forEach(function(key) {
                var m = /^istanbul_(.*)$/.exec(key);
                var k, v;
                
                if (!m || m[1] === 'report') {
                    return;
                }

                k = m[1];
                v = process.env[key];

                args.splice(1, 0, '--' + k, v ? v : undefined);
            });

            // console.log(args.join(' '));

            child = spawn('istanbul', args);
            // child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
            child.on('exit', function() {
                cb && cb();
            });
        }
    }
})();

function resolve(name) {
    return path.join(__dirname, name);
}

function removeFolder(path) {
    fis.util.del(path);
}

function getOutputFile(filename) {
    filename = path.join(resolve('output'), filename);
    return fis.util.read(filename);
}

function compareFolder(src, dst, iterator) {
    var srcFiles = fis.util.find(src).map(function(val) {
        val = val.replace(src, '');
        return val.replace(/^\//, '');
    });

    var dstFiles = fis.util.find(dst).map(function(val) {
        val = val.replace(dst, '');
        return val.replace(/^\//, '');
    });

    srcFiles.forEach(function(file) {
        var exist =!!~dstFiles.indexOf(file);
        
        if (exist) {
            iterator(file, fis.util.read(path.join(src, file)), fis.util.read(path.join(dst, file)));
        } else {
            iterator(file);
        }
    });
}



// ------------------------------------------------------
// ----- Let's get started.

describe('Tests', function() {
    
    it('amd wrap', function(done) {
        Fis.run('-r', resolve('tests/module_id_auto_fill/source'), '-f', resolve('tests/module_id_auto_fill/fis-conf.js'), function() {
            
            compareFolder(resolve('tests/module_id_auto_fill/expected'), resolve('output'), function(name, src, dst) {
                if (typeof src === 'undefined') {
                    assert.ok(false, name + ' file not match');
                } else {
                    assert.ok(src === dst, name + ' content not match');
                }
            });

            done();
        });
    });

    it('custom module id', function(done) {
        Fis.run('-r', resolve('tests/custom_module_id/source'), '-f', resolve('tests/custom_module_id/fis-conf.js'), function() {
            compareFolder(resolve('tests/custom_module_id/expected'), resolve('output'), function(name, src, dst) {
                if (typeof src === 'undefined') {
                    assert.ok(false, name + ' file not match');
                } else {
                    assert.ok(src === dst, name + ' content not match');
                }
            });

            done();
        });
    });
});




// 收尾输出 coverage
describe('finish', function() {
    it('ignore this', function(callback) {
        removeFolder(resolve('output'));
        Fis.finish(callback);
    });
})