const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

// EJS 파일 복사 함수
function copyEjsFiles() {
  const sourceDir = path.resolve(__dirname, 'src/engines');
  const targetDir = path.resolve(__dirname, 'out/engines/templates');
  
  // 대상 디렉토리가 없으면 생성
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // EJS 파일 복사
  const files = fs.readdirSync(sourceDir, { recursive: true });
  files.forEach(file => {
    if (file.endsWith('.ejs')) {
      const filename = file.split('/').pop();
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, filename);
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied ${sourcePath} to ${targetPath}`);
    }
  });
}

// 빌드 전 EJS 파일 복사
copyEjsFiles();

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: process.env.NODE_ENV === 'production' ? 'nosources-source-map' : 'source-map',
  entry: {
    'backtestSetting': path.resolve(__dirname, 'src/webviews/src/BacktestSettingIndex.tsx'),
    'backtestResult': path.resolve(__dirname, 'src/webviews/src/BacktestResultIndex.tsx'),
    'datasetDownloader': path.resolve(__dirname, 'src/webviews/src/DatasetDownloaderIndex.tsx')
  },
  output: {
    path: path.resolve(__dirname, 'out/webviews'),
    filename: '[name].js',
    clean: false // out 폴더 내 다른 파일 유지
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, 
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('@tailwindcss/postcss'),
                  require('autoprefixer')
                ]
              }
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'vscode.css'
    })
  ],
  optimization: {
    moduleIds: 'deterministic',
    splitChunks: false, // 청크 분할 방지
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            ecma: 5,
            passes: 2,
            pure_getters: true
          },
          output: {
            ecma: 5,
            comments: false
          }
        },
        extractComments: false,
      }),
    ],
    runtimeChunk: false,
    usedExports: true,
    concatenateModules: true,
    providedExports: true
  },
  performance: {
    hints: false
  }
}; 