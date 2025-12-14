const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: "production",
  entry: {
    popup: path.resolve(__dirname, "popup", "popup.ts"),
    background: path.resolve(__dirname, "background", "background.ts"),
    content: path.resolve(__dirname, "content", "content.ts"),
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "." },
        { from: "popup/popup.html", to: "popup/popup.html" },
        // { from: "icons", to: "icons" }, // If icons exist
      ],
    }),
  ],
};
