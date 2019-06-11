import { src, dest, parallel, series, watch } from 'gulp'
import browserSync from 'browser-sync'
import plumber from 'gulp-plumber'
import pug from 'gulp-pug'
import sass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import autoprefixer from 'gulp-autoprefixer'
import wait from 'gulp-wait'
import babel from 'gulp-babel'
import concat from 'gulp-concat'
import uglify from 'gulp-uglify'
import cachebust from 'gulp-cache-bust'

const dev = './dev/',
	prod = './public/',
	server = browserSync.create()

const bSync = () => {
	return server.init({
        server: {
            baseDir: prod,
            index: "index.html"
        },
        open: true,
        notify: true
    })
}

const html = () => {
	return src(dev + 'pug/*.pug')
		.pipe(plumber())
		.pipe(pug({
			pretty: true, // https://pugjs.org/api/reference.html
            basedir: dev + 'pug'
		}))
		.pipe(dest(prod))
}

const styles = () => {
	return src(dev + 'scss/app.scss')
        .pipe(wait(500))
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        .pipe(plumber())
        .pipe(sass({
            outputStyle: 'compressed',
            errLogToConsole: true
        }).on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(dest(prod + 'css'))
}

const scripts = () => {
	return src([
			// Especificar el orden de los archivos para evitar problemas
			dev + 'js/modules/*.js',
			dev + 'js/app.js'
		])
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(concat('app.min.js'))
		.pipe(uglify())
		.pipe(sourcemaps.write('.'))
		.pipe(dest(prod + 'js/'))
}

const watchFiles = done => {
	watch(dev + "pug/**/**").on('all', series(html, server.reload));
    watch(dev + "scss/**/**").on('all', series(styles, server.reload));
    watch(dev + "js/**/**").on('all', series(scripts, server.reload));
    done()
}

// Tasks production

const cache = () => {
	return src(prod + '**/*.html')
        .pipe(cachebust({
            type: 'timestamp'
        }))
        .pipe(dest(prod))
}

exports.html = html
exports.styles = styles
exports.scripts = scripts
exports.watchFiles = watchFiles
exports.bSync = bSync

// Aquí se generan los archivos listos para desarrollo, ejecutar gulp o npm start
exports.default = parallel(html, styles, scripts, bSync, watchFiles)

// Aquí se generan los archivos listos para producción, ejecutar gulp build o npm run build
exports.build = parallel(html, styles, scripts, cache)