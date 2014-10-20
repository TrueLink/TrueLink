var gulp = require('gulp');
var ts = require('gulp-type');
//var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var spa = require('spa').Builder;
//var minifyCSS = require('gulp-minify-css');
var rename = require('gulp-rename');
var fs = require('fs');
var replace = require('gulp-replace');
var Promise = require('es6-promise').Promise;
var exec = require('child_process').exec;
var argv = require('yargs').argv;
var  gutil = require('gulp-util');
    var clean = require('gulp-clean');

//var pusher = require("./couch-push.js");

gulp.task('default', ['spa'], function () {
  // place code for your default task here
});

gulp.task('clean', function(){
    return gulp.src(['build/*'], {read:false})
        .pipe(clean());
});

var filesToMove = [
    './css/**/*',
    './img/**/*',
    './media/*',
    //'./modules/**/*', // treat flux-modules as assets temporarily
    './favicon.png',
    './zepto.js',
    './react-dist.js'
];

gulp.task('assets',['clean'], function(){
    // the base option sets the relative root for the set of files,
    // preserving the folder structure
    gulp.src(filesToMove, { base: './' })
        .pipe(gulp.dest('build'));
});


gulp.task('spa', ["assets", "compile"//,'lib','lib-css','wiki-css',
    //'tm-css','debugger'
    ,'bootstrapper','revision'
    ], function () {
//    console.log("spa!");
    spa.from_config("spa.yaml").build();
});

gulp.task('compile', ['clean'], function () {
    var tsResult = gulp.src('ts/**/*.ts')
                       .pipe(ts({
        declarationFiles: false,
        noExternalResolve: false, //?
        module: 'cjs',
        target: 'ES5',
        noImplicitAny: false, 
        noLib: true, 
        outDir: 'build/',
        sortOutput: false
    }));
    
    //tsResult.dts.pipe(gulp.dest('build/definitions'));
    return tsResult.js.pipe(gulp.dest('build/'));
});
/*
gulp.task('lib-css',['clean'], function () {
    return gulp.src([
	'lib/bootstrap-3.2.0-dist/css/bootstrap.css',
	'lib/bootstrap-3.2.0-dist/css/bootstrap-theme.css',
	//'wiki-objects/cards.css',
	'lib/font-awesome.css',
	'lib/jsoneditor.css',
	'lib/jquery.handsontable.full.css',
	'lib/jquery-ui-1.10.3.css',
        'lib/daterangepicker-bs3.css',
	'lib/tagit-dark-grey.css',
	'plugins/concord.css' // TODO remove
])
    .pipe(concat('lib.css'))
    .pipe(minifyCSS({ keepBreaks: true }))
    .pipe(gulp.dest('build/'))
});

gulp.task('wiki-css',['clean'],  function () {
    return gulp.src(['files/wiki-objects/wiki.css'])
    .pipe(minifyCSS({ keepBreaks: true }))
    .pipe(gulp.dest('build/wiki-objects/'))
});

gulp.task('tm-css', ['clean'], function () {
    return gulp.src(['files/taskmanager/taskmanager.css'])
    .pipe(minifyCSS({ keepBreaks: true }))
    .pipe(gulp.dest('build/taskmanager'))
});

gulp.task('lib',['clean'], function () {
    return gulp.src([
	'lib/' + 'promise-0.1.1.js', 
	'lib/' + 'sjcl.js', // 31
	'lib/' + 'Silverlight.debug.js', // 29 wtf
	'lib/' + 'jquery-1.10.2.js',// 91 'jquery-1.10.2.js', 267
	'lib/' + 'bootstrap-3.2.0-dist/js/bootstrap.js', 
	'lib/' + 'jsoneditor.js', 
	'lib/' + 'jsondiffpatch-bundle-full.js', // 113
	//'lib/'+'behave.js', not used
	//'lib/' + 'react-0.10.0-min.js', //110 react 538
	'lib/' + 'react.js', //110 react 538
	'lib/' + 'jquery.handsontable.full.js', // 409
	'lib/' + 'jquery.ba-hashchange.js', 
	'lib/' + 'jquery-ui-1.10.4.min.js', //224 'jquery-ui-1.10.3.js', 426
	'lib/' + 'tagit.js', 
	//'lib/'+'openpgp.min.js', 217
	'lib/' + 'forge.bundle.js', // 841
	'lib/' + 'filereader.js',
	'plugins/' + 'go-1.3.6.js', // 1425
	//'lib/'+'localforage.js', - included in spa loader
	'lib/ace/' + 'ace.js', 
	'lib/ace/' + 'ext-searchbox.js', 
	'lib/ace/' + 'mode-markdown.js', 
	'lib/ace/' + 'theme-chrome.js',
        'lib/' + 'moment.min.js',
        'lib/' + 'daterangepicker.js',
	'node_modules/bloomfilter/bloomfilter.js',
	'node_modules/query-string/query-string.js',
    'lib/' + 'lib_finished.js',
	])
    .pipe(concat('lib.js'))
    .pipe(uglify({
        output: {
            max_line_len: 160,
            bracketize: true
        }, compress: false
    }))
    .pipe(gulp.dest('build'))
});

gulp.task('debugger', ['clean'], function () {
    return gulp.src(['files/dev/debugger.js'])
    .pipe(concat('debugger.js'))
    .pipe(uglify({
        output: {
            max_line_len: 160,
            bracketize: true
        }, compress: false
    }))
    .pipe(gulp.dest('build/dev'))
});

var all_files = [
		'app.html',
		'fontawesome-webfont.eot',
		'fontawesome-webfont.svg',
		'fontawesome-webfont.ttf',
		'fontawesome-webfont.woff',
		'FontAwesome.otf',
		'glyphicons-halflings-white.png',
		'glyphicons-halflings-regular.woff',
		'glyphicons-halflings.png',
		'ui-bg_flat_75_ffffff_40x100.png',
        'ui-bg_glass_75_dadada_1x400.png',
		'mpost.SilverlightMultiFileUpload.xap',
		'animated-overlay.gif',
		'update-available-64.png',
		'gshell.appcache',
		'wiki-objects/wiki.css',
		'taskmanager/taskmanager.css',
		'lib.css',
		'lib.js',
		'loading.gif',
		'manifest.json',
		'ui-anim_basic_16x16.gif',
		'tm-sprite.png',
		'bugsnag.js',
		'jsoneditor-icons.png',
	];

function pl(dest) {
    var fd1={};
    all_files.forEach(function(f,i){
       fd1[f]="build/"+f;
    });
    return pusher.pushToLoc(dest, fd1).then(function(){
        var rf = JSON.parse(fs.readFileSync("build/hosting-map.json")).files;
        for(var df in rf){
            rf[df]="build/"+rf[df];
        }
       return pusher.pushToLoc(dest, rf);
    });
}

gulp.task("push-dev", ['spa'], function () {

    return pl('http://main.dev:5984/toliman-wiki/e859fdf0-0eb7-4049-bdd4-de714c0ea801');
});

gulp.task("push-production", ['spa'], function () {
    return pl('http://main.dev:5984/toliman-wiki/files');
});

gulp.task("push", ['spa'], function () {
    if (!argv.location) {
        throw new Error("gulp push --location http://host/cdb/cdoc");
    }
    return pl(argv.location);
});
*/
gulp.task('revision', ['clean'], function (cb) {
    exec('hg id -i > build/rev.txt', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
})

gulp.task("bootstrapper", ['compile',"revision"], function () {
    console.log('bootstrapper');
    var hr = fs.readFileSync("build/rev.txt").toString().trim();
    return gulp.src(['build/config.js'])
    .pipe(replace("__HG_REV__", hr))
    .pipe(rename("config_p.js"))
    .pipe(gulp.dest('build/'));
});

// todo maybe not needed
function string_src(filename, string) {
    var src = require('stream').Readable({ objectMode: true })
    src._read = function () {
        this.push(new gutil.File({ cwd: "", base: "", path: filename, contents: new Buffer(string) }))
        this.push(null)
    }
    return src
}