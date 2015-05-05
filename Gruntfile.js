module.exports = function (grunt) {
	
	grunt.initConfig({
		node_tap: {
			default_options: {
				options: {
					outputType: 'failures',
					outputTo: 'console'
				},
				files: {
					'test': ['test.js']
				}
			}
		},
		uglify: {
			options: {
				compress: true,
				mangle: true,
				preserveComments: 'some'
			},
			xclick: {
				src: 'xclick.js',
				dest: 'xclick.min.js'
			}
		}
	});

	//grunt.loadNpmTasks('grunt-node-tap');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', ['uglify']);
};
