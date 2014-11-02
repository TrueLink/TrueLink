var gulp = require('gulp');
var ts = require('gulp-typescript');
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

gulp.task('default', ['spa','assets2'], function () {
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
    './favicon.png',
    './zepto.js',
    './uuid.js',
    './forge.js',
    './react-dist.js'
];

var filesToMoveAfterBuild = [
    './modules/**/*',
    './node_modules/**/*',
];

gulp.task('assets',['clean'], function(){
    gulp.src(filesToMove, { base: './' })
        .pipe(gulp.dest('build'));
});

gulp.task('assets2',['spa'], function(){
    gulp.src(filesToMoveAfterBuild, { base: './' })
        .pipe(gulp.dest('build'));
});


gulp.task('spa', ["assets", "compile"//,'lib','lib-css'
    ,'burn_rev','burn_rev2'
    ], function () {
    spa.from_config("spa.yaml").build();
});

gulp.task('compile', ['clean','burn_rev2'], function () {
    var tsResult = gulp.src('ts/**/*.ts')
                       .pipe(ts({
        declarationFiles: false,
        noExternalResolve: false, //?
        module: 'cjs',
        target: 'ES5',
        noImplicitAny: false, 
        noLib: false, 
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

gulp.task("burn_rev2", ["revision"], function () {
    console.log('burn_rev2');
    var hr = fs.readFileSync("build/rev.txt").toString().trim();
    var date = new Date();
    var mm = (date.getMonth() + 1).toString();
    var dd = date.getDate().toString();
    if (mm.length < 2) mm = "0" + mm;
    if (dd.length < 2) dd = "0" + dd;
    return gulp.src(['ts/config.tt'])
    .pipe(replace("__HG_REV__", hr))
    .pipe(replace("__DAY__", dd))
    .pipe(replace("__MONTH__", mm))
    .pipe(rename("config.ts"))
    .pipe(gulp.dest('ts/'));
});

gulp.task("burn_rev", ["revision"], function () {
    console.log('burn_rev');
    var hr = fs.readFileSync("build/rev.txt").toString().trim();
    var date = new Date();
    var mm = (date.getMonth() + 1).toString();
    var dd = date.getDate().toString();
    if (mm.length < 2) mm = "0" + mm;
    if (dd.length < 2) dd = "0" + dd;
    return gulp.src(['index.template.html'])
    .pipe(replace("__HG_REV__", hr))
    .pipe(replace("__DAY__", dd))
    .pipe(replace("__MONTH__", mm))
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