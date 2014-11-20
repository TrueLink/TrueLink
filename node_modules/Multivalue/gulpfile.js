var gulp = require('gulp');
var ts = require('gulp-typescript');
var mv = require('gulp-rename');
var eventStream = require('event-stream');

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
            '!./node_modules/**',
            '!./definitions/**'
            ])
        .pipe(compiler)
        ;

    return eventStream.merge(
        result.dts.pipe(gulp.dest('./definitions')),
        result.js.pipe(gulp.dest('.')));
});