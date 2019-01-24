'user strict';

// Requiring gulp functionalitys
const { watch, src, dest, parallel, series} = require('gulp');

// pug
const pug = require('gulp-pug');

// browser sync
const browserSync = require('browser-sync').create();

// sass
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const autoprifix = require('gulp-autoprefixer');
sass.compiler = require('node-sass');

// js
const uglifiy = require('gulp-uglify');
const browserify = require('browserify');
const babelify = require('babelify');
const watchify = require('watchify');
const {assign} = require('lodash');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');


// add custom browserify options here
var customOpts = {
    entries: ['./src/js/main.js'],
    debug: true
}

// Views pug
function views(){
    return src('./src/views/pages/*.pug')
            .pipe(pug({
                locals: {},
                pretty: true
            }))
            .pipe(dest('./dist'))
            .pipe(browserSync.stream());    
}

// Styles sass
function styles(){
    return src('./src/sass/**/*.sass')
            .pipe(sourcemaps.init())
            .pipe(sass.sync({outputStyle: 'compressed'}).on('error', sass.logError))
            .pipe(concat('styles.css'))
            .pipe(autoprifix())
            .pipe(rename({extname: '.min.css'}))
            .pipe(sourcemaps.write('./',{
                includeContent: false,
            }))
            .pipe(dest('./dist/css'))
            .pipe(browserSync.stream());

}



// Scripts
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts));

b.transform(babelify, {
    presets: ['@babel/preset-env']
});

function scripts(done){
    done();
}

b.on('update', bundle);

function bundle(){
    return b.bundle()
            .pipe(source('bundle.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps:true}))
            .pipe(uglifiy())
            .pipe(rename({extname: '.min.js'}))
            .pipe(sourcemaps.write('./',{
                includeContent: false
            }))
            .pipe(dest('./dist/js'))
            .pipe(browserSync.stream());
}



// BrowserSync
function serve(){
    browserSync.init({
        server:{
            baseDir: "./dist"
        }
    });
}

// watch
function watchFiles(){
    watch('./src/views/**/*.pug', views);
    watch('./src/sass/**/*.sass', styles);
    watch('./src/js/**/*.js', scripts);
}


exports.views = views;
exports.styles = styles;
exports.scripts = parallel(scripts, bundle);

exports.default = parallel(views, styles, parallel(scripts, bundle), series(serve, watchFiles));


