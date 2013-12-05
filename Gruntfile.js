module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    less: {
      development: {
        options: {
          paths: ["/"]
        },
        files: {
          "css/main.css": "less/main.less"
        }
      },
      production: {
        options: {
          paths: ["/"],
          cleancss: true
        },
        files: {
          "css/main.min.css": "less/main.less"
        }
      }
    },
    concat: {
      dist: {
        src: ["js/vendor/*.js", "js/main.js"],
        dest: "js/<%= pkg.name %>.js"
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'js/<%= pkg.name %>.js',
        dest: 'js/<%= pkg.name %>.min.js'
      }
    },
    watch: {
      css: {
        files: "./less/*.less",
        tasks: ["less"]
      },
      scripts: {
        files: ["./js/*/*.js", "./js/main.js"],
        tasks: ["concat", "uglify"]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'uglify', 'less']);

};