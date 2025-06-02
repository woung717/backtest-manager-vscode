/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

function copyEjsFiles() {
  const sourceDir = path.resolve(__dirname, 'src/engines');
  const targetDir = path.resolve(__dirname, 'out/engines/templates');
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const files = fs.readdirSync(sourceDir, { recursive: true });
  files.forEach(file => {
    // Windows에서 file은 객체로 반환될 수 있으므로 문자열로 변환
    const filePath = file.toString();
    
    if (filePath.endsWith('.ejs')) {
      // 마지막 경로 구성요소만 추출
      const filename = filePath.split(path.sep).pop();
      if (!filename) {
        return;
      }
      
      // 소스 경로 구성 - filePath가 상대 경로이므로 sourceDir와 결합
      const sourcePath = path.join(sourceDir, filePath);
      const targetPath = path.join(targetDir, filename);
      
      // 파일이 존재하는지 확인
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied ${sourcePath} to ${targetPath}`);
      }
    }
  });
}

copyEjsFiles();

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: process.env.NODE_ENV === 'production' ? 'nosources-source-map' : 'source-map',
  entry: {
    'backtestSetting': path.resolve(__dirname, 'src/webviews/src/BacktestSettingIndex.tsx'),
    'backtestResult': path.resolve(__dirname, 'src/webviews/src/BacktestResultIndex.tsx'),
    'datasetDownloader': path.resolve(__dirname, 'src/webviews/src/DatasetDownloaderIndex.tsx'),
    'priceChart': path.resolve(__dirname, 'src/webviews/src/PriceChartIndex.tsx')
  },
  output: {
    path: path.resolve(__dirname, 'out/webviews'),
    filename: '[name].js',
    clean: false 
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
    splitChunks: false, 
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
    providedExports: true
  },
  performance: {
    hints: false
  }
};