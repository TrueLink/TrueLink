var gulp = require('gulp');
var ts = require('gulp-typescript');
var mv = require('gulp-rename');

gulp.task('default', function () {
    var compiler = ts({
        declarationFiles: true,
        noExternalResolve: false, //?
        module: 'commonjs',
        target: 'ES5',
        noImplicitAny: true, 
        noLib: false, 
        outDir: '.',
        sortOutput: false
    });

    var result = gulp
        .src([
            './**/*.ts',
            '!./node_modules/**'
            ])
        .pipe(compiler)
        ;

    result.dts.pipe(mv('exports.d.ts')).pipe(gulp.dest('.'));
    return result.js.pipe(gulp.dest('.'));
});