const WebpackPwaManifest = require("webpack-pwa-manifest");
const path = require("path");

const config = {
    entry: "./public/assets/js/index.js",
    output: {
      path: __dirname + "/public/dist",
      filename: "index.bundle.js"
    },
    mode: "development",
    plugins: [
      new WebpackPwaManifest({
        fingerprints: false,
        name: "Budget Tracker",
        short_name: "Budget Tracker",
        description: "An application for keeping track of budget transactions.",
        background_color: "#01579b",
        theme_color: "#ffffff",
        "theme-color": "#ffffff",
        start_url: "/",
        icons: [
          {
            src: path.resolve("public/assets/icons/icon-512x512.png"),
            sizes: [192, 512],
            destination: path.join("assets", "icons")
          }
        ]
      })
    ],
    //Configure Babel
    module: {
      rules: [
        {
          test: /\.js$/, // files must end in ".js" to be transpiled
          exclude: /node_modules/, // don't transpile code from "node_modules"
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"]
            }
          }
        }
      ]
    }
  };
  
  module.exports = config;