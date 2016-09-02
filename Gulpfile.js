var gulp = require('gulp');
var babel = require('gulp-babel');
var jsdoc = require('gulp-jsdoc3');
var nodemon = require('gulp-nodemon');

gulp.task('doc', (cb) => {
  var config = require('./jsdoc.json');
  gulp.src(['README.md', './src/**/*.js'], {read: false})
    .pipe(jsdoc(config, cb));
});

gulp.task('babel', () => {
  return gulp.src('src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});

gulp.task('watch', () => {
  gulp.watch('src/**/*.js', ['babel', 'doc']);
});

gulp.task('nodemon', () => {
  nodemon({
    script: 'index.js',
    watch: ['lib', 'index.js']
  });
})
