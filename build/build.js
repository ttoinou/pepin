// https://github.com/shelljs/shelljs
require('shelljs/global')
env.NODE_ENV = 'production'

var path = require('path')
var config = require('../config')
var ora = require('ora')
var webpack = require('webpack')
var webpackConfig = require('./webpack.prod.conf')

var assetsPath = path.join(config.build.assetsRoot, config.build.assetsSubDirectory);
var pepin = assetsPath.toString().indexOf('pepin');
var continueBuild = assetsPath.length > 6 && pepin > -1

console.log(
  '  Tip:\n' +
  '  Built files are meant to be served over an HTTP server.\n' +
  '  Opening index.html over file:// won\'t work.\n'+
  ' assetsPath : ' + assetsPath + '\n'+
  ' indexOf pepin : ' + pepin+ '\n'+
  ' continue building : ' + continueBuild
  //'  Opening index.html over file:// won\'t work.\n'+assetsPath
)

if( continueBuild )
{

  var spinner = ora('building for production...')
  spinner.start()

  rm('-rf', assetsPath)
  mkdir('-p', assetsPath)
  // no need to copy static except lib
  cp('-R', 'static/', assetsPath )

  webpack(webpackConfig, function (err, stats) {
    spinner.stop()
    if (err) throw err
    process.stdout.write(stats.toString({
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }) + '\n')

    mv('dist/images/', 'dist/pepin/images/' )
    mv('dist/fonts/', 'dist/pepin/fonts/' )

  })


}
