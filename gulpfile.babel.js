'use strict';

import gulp from 'gulp';
import sass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import sourcemaps from 'gulp-sourcemaps';
import browserify from 'browserify';
import babelify from 'babelify';
import buffer from 'vinyl-buffer';
import util from 'gulp-util';
import concat from 'gulp-concat';
import source from 'vinyl-source-stream';
import browserSync from 'browser-sync';

let browser = browserSync.create();

const paths = {
  src: 'src',
  dest: 'dist'
};

gulp.task('styles', () => {
    return gulp.src(paths.src)
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dest));
});

gulp.task('build', function() {
    browserify(paths.src + '/app.js', { debug: true })
        .transform(babelify)
        .bundle()
        .on('error', util.log.bind(util, 'Browserify Error'))
        .pipe(source('all.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.dest));
});

gulp.task('serve', () => {
        browser.init({
                server:  './'
        });

        gulp.watch('src/app.sass', ['styles']);
        gulp.watch('src/**/*.js', ['build']);
        gulp.watch(paths.dest).on('change', browser.reload);
        gulp.watch('index.html').on('change', browser.reload);
});

gulp.task('default', ['styles', 'build', 'serve']);
