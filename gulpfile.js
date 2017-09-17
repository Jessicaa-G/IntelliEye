// Include gulp
var gulp = require('gulp');
 // Include plugins
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var rename = require('gulp-rename');
 // Concatenate & Minify JS
gulp.task('scripts', function() {
        return gulp.src([
        
        // './public/ieye/js/tracking-mod.js',
        // './public/ieye/js/face-min.js',
        // './public/ieye/js/client.min.js',              
        // './public/ieye/js/iew-vcontrol.js',              
        // './public/ieye/js/ieyewidget.js',              
        // './public/ieye/js/iew-log.js',              
        // './public/ieye/js/iew-controller.js',

        './public/sqeye/js/RTP.js',
        './public/sqeye/js/webgazer_mod.js',
        './public/sqeye/js/MWDET_gazer.js',
        './public/sqeye/js/MWDET_calibration.js',
        './public/sqeye/js/MWDET_gazerdata.js',
        './public/sqeye/js/MWDET_vcontrol.js',
        './public/sqeye/js/MWDET_logger.js',
        './public/sqeye/js/MWDET_widget.js',        

        ])
      .pipe(concat('sqeye-build.js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./public/sqeye/js/'));
});
 // Default Task
gulp.task('default', ['scripts']);
