/**
 * https://hackernoon.com/building-and-publishing-a-module-with-typescript-and-rollup-js-faa778c85396
 * Gerard O'Neill
 */
//import peerDepsExternal from "rollup-plugin-peer-deps-external";
//import resolve from "@rollup/plugin-node-resolve";
//import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json";

export default {
  input: "src/index.ts",
  output: [
    {
      file: pkg.main,
      format: "cjs",
    },
    {
      file: pkg.module,
      format: "es",
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
  plugins: [
    typescript({
      typescript: require("typescript"),
    }),
    //Check later
    //resolve(),
    //commonjs(),
  ],
};
