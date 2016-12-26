var gulp=require('gulp');
var concat=require('gulp-concat');
var annotate=require('gulp-ng-annotate');
var cssmin=require('gulp-cssmin');
var uglify=require('gulp-uglify');
var livereload=require('gulp-livereload');
var autoprefixer=require('gulp-autoprefixer')
gulp.task('minification',function(){
    gulp.src(['./public/js/translations.js','./public/js/directives.js','./public/js/controllers.js','./public/js/viewController/*.js'])
        .pipe(concat('all.min.js'))
        .pipe(annotate())
        .pipe(uglify())
        .pipe(gulp.dest('./public/minifiedjs'))
        .pipe(livereload());
})
gulp.task('sass', function () {
    return gulp.src('./public/css/style.css')
        .pipe(autoprefixer())
        .pipe(cssmin())
        .pipe(gulp.dest('./public/minifiedcss'))
        .pipe(livereload());
});
gulp.task('watch',function(){
    livereload.listen();
    gulp.watch('./public/js/**/*.js',['minification']);
    gulp.watch('./public/css/*.css',['sass']);
})
gulp.task('default',['minification','sass','watch'])


