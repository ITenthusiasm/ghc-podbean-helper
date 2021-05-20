const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const webpack = require("webpack");

const frontendFolder = path.resolve(__dirname, "src");

/** @type {import("webpack").Configuration} */
const config = {
  mode: "development",
  devtool: "inline-source-map",
  entry: [
    path.resolve(__dirname, "src/main.ts"),
    "webpack-hot-middleware/client?noInfo=true",
  ],
  target: "web",
  output: {
    path: path.resolve(__dirname, "public"),
    publicPath: "/",
    filename: "bundle.js",
  },
  stats: "errors-warnings",
  plugins: [
    new HtmlWebpackPlugin({ template: "public/index.html", inject: true }),
    new VueLoaderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],
  resolve: {
    extensions: [".ts", ".vue", ".js"],
    alias: { "@": frontendFolder },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: frontendFolder,
        use: [
          { loader: "ts-loader", options: { appendTsSuffixTo: [/\.vue$/] } },
        ],
      },
      { test: /\.vue$/, include: frontendFolder, use: ["vue-loader"] },
      {
        test: /\.scss$/,
        include: frontendFolder,
        use: ["vue-style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
};

module.exports = config;
