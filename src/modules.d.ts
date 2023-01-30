/// <reference types="standalone-electron-types" />


declare module "~plugins" {
    const plugins: import("@patcher").Plugin[];
    export default plugins;
}
